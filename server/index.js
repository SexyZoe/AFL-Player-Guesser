const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { recordScan, aggregateScans } = require('./utils/qrStats');

// Load environment variables
dotenv.config();

// Import Player model
const Player = require('./models/Player');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Permanent short link: /go -> redirect target for poster QR (long-term stable)
// Target URL is configured via env var POSTER_REDIRECT_URL
app.get('/go', (req, res) => {
  const targetUrl = process.env.POSTER_REDIRECT_URL;
  if (!targetUrl) {
    return res.status(500).send('POSTER_REDIRECT_URL is not configured');
  }
  // Use 301 for a nearly immutable target
  recordScan('go', req);
  return res.redirect(301, targetUrl);
});

// Alias: /play -> same as /go, convenient for URLs like https://go.yourdomain.com/play
app.get('/play', (req, res) => {
  const targetUrl = process.env.POSTER_REDIRECT_URL;
  if (!targetUrl) {
    return res.status(500).send('POSTER_REDIRECT_URL is not configured');
  }
  recordScan('play', req);
  return res.redirect(301, targetUrl);
});

// Lightweight stats API (shows last N days by default)
app.get('/api/qr-stats', (req, res) => {
  const { days } = req.query || {};
  try {
    const result = aggregateScans({ days: Number(days) });
    res.json(result);
  } catch (err) {
    console.error('Failed to read QR stats:', err);
    res.status(500).json({ error: 'stats_failed' });
  }
});

// Static assets - serve player images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Serve the frontend build in production (must be after API routes; see bottom of file)

// Player data store
let players = [];

// Load players from database
async function loadPlayersFromDB() {
  try {
    players = await Player.find({}).lean();
    console.log(`Loaded ${players.length} players from database`);
  } catch (error) {
    console.error('Failed to load players from DB:', error);
    
    // Fallback to JSON file
    loadPlayersFromJSON();
  }
}

// Load players from JSON file (fallback)
function loadPlayersFromJSON() {
  const playersDataPath = path.join(__dirname, 'data', 'players.json');
  if (fs.existsSync(playersDataPath)) {
    try {
      const playersJson = fs.readFileSync(playersDataPath, 'utf8');
      players = JSON.parse(playersJson);
      console.log(`Loaded ${players.length} players from JSON`);
    } catch (error) {
      console.error('Failed to load players from JSON:', error);
    }
  } else {
    console.log('players.json not found. Please run the import script first.');
  }
}

// Basic routes
app.get('/api/players', async (req, res) => {
  if (players.length === 0) {
    // If in-memory list is empty, try DB
    players = await Player.find({}).lean();
  }
  res.json(players);
});

// Get a random player
app.get('/api/random-player', async (req, res) => {
  if (players.length === 0) {
    // If in-memory list is empty, try DB
    players = await Player.find({}).lean();
    
    if (players.length === 0) {
      return res.status(500).json({ error: 'no_player_data' });
    }
  }
  
  const randomIndex = Math.floor(Math.random() * players.length);
  res.json(players[randomIndex]);
});

// Socket.IO logic
const rooms = {};
// Matchmaking queues by series best-of
const matchmakingQueues = { 3: [], 5: [], 7: [] };
const matchingRooms = {}; // Rooms awaiting ACK confirmation
// Track display name per socket (validation/init before room creation)
const displayNames = {};

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Create private room (optional series bestOf: 3|5|7)
  socket.on('createRoom', ({ seriesBestOf } = {}) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [socket.id],
      targetPlayer: getRandomPlayer(),
      gameState: 'waiting',
      hostId: socket.id,
      playersNames: { [socket.id]: '' },
      locked: false,
      roundPendingStart: false,
      series: seriesBestOf && [3,5,7].includes(Number(seriesBestOf)) ? {
        enabled: true,
        bestOf: Number(seriesBestOf),
        targetWins: Math.ceil(Number(seriesBestOf) / 2),
        wins: {},
        currentRound: 0
      } : { enabled: false }
    };
    
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode });
    console.log(`Room created: ${roomCode}`);

    // Broadcast current player list to the room (creator only)
    io.to(roomCode).emit('roomPlayersUpdate', {
      players: rooms[roomCode].players.map(id => ({ socketId: id, displayName: rooms[roomCode].playersNames[id] || '' })),
      hostId: rooms[roomCode].hostId
    });
  });

  // Join room
  socket.on('joinRoom', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].players.length < 4 && rooms[roomCode].gameState === 'waiting' && !rooms[roomCode].locked) {
      socket.join(roomCode);
      rooms[roomCode].players.push(socket.id);
      // Initialize name placeholder for the joiner
      if (!rooms[roomCode].playersNames) {
        rooms[roomCode].playersNames = {};
      }
      rooms[roomCode].playersNames[socket.id] = rooms[roomCode].playersNames[socket.id] || '';
      console.log(`User ${socket.id} joined room ${roomCode}`);

      // Broadcast the updated player list
      io.to(roomCode).emit('roomPlayersUpdate', {
        players: rooms[roomCode].players.map(id => ({ socketId: id, displayName: rooms[roomCode].playersNames[id] || '' })),
        hostId: rooms[roomCode].hostId
      });
    } else {
      socket.emit('roomError', { message: 'Room does not exist or is full' });
    }
  });

  // Start private game (host-only; allowed in 'waiting' with 2-4 players)
  socket.on('startPrivateGame', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('roomError', { message: 'Room does not exist' });
      return;
    }
    // Only the host may start the game
    if (room.hostId && socket.id !== room.hostId) {
      socket.emit('roomError', { message: 'Only the host can start the game' });
      return;
    }
    // Only when status is 'waiting' and player count is 2-4
    if (room.gameState !== 'waiting') {
      socket.emit('roomError', { message: 'Room has already started or finished' });
      return;
    }
    if (!room.players || room.players.length < 2) {
      socket.emit('roomError', { message: 'At least 2 players are required to start' });
      return;
    }

    // Lock room and start
    room.gameState = 'playing';
    room.locked = true;
    room.roundPendingStart = false;
    if (!room.targetPlayer) {
      room.targetPlayer = getRandomPlayer();
    }

    // Initialize series
    if (room.series && room.series.enabled) {
      room.series.currentRound = 1;
      // Initialize all players' wins to zero
      room.series.wins = room.players.reduce((acc, pid) => { acc[pid] = 0; return acc; }, {});
      if (!room.series.targetWins) {
        room.series.targetWins = Math.ceil((room.series.bestOf || 3) / 2);
      }
    }

    // Initialize per-round player states and broadcast (used by sidebar)
    room.playersStatus = room.players.reduce((acc, pid) => {
      acc[pid] = { socketId: pid, guesses: 0, isFinished: false, isWinner: false };
      return acc;
    }, {});
    io.to(roomCode).emit('battleStatusUpdate', {
      playersStatus: room.playersStatus
    });

    io.to(roomCode).emit('gameStart', { targetPlayer: room.targetPlayer });
    console.log(`Room ${roomCode} started. Players: ${room.players.length}`);
  });

  // Join matchmaking queue
  socket.on('joinMatchmaking', ({ seriesBestOf, displayName } = {}) => {
    const bestOf = [3,5,7].includes(Number(seriesBestOf)) ? Number(seriesBestOf) : 3;
    console.log('📥 [Server] joinMatchmaking from:', socket.id, 'bestOf:', bestOf);
    
    const queue = matchmakingQueues[bestOf];
    // Validate display name; forbid using socket.id as nickname
    const name = typeof displayName === 'string' ? displayName.trim().slice(0, 20) : '';
    if (!name || name === socket.id) {
      socket.emit('matchmakingError', { code: 'NAME_REQUIRED', message: 'Please set a display name before joining matchmaking' });
      console.warn('❌ [Server] rejected joinMatchmaking: invalid or missing name. socket:', socket.id);
      return;
    }
    // Record nickname for later room initialization
    displayNames[socket.id] = name;
    // Ignore if already in the queue
    if (queue.includes(socket.id)) {
      console.log('⚠️ [Server] player already in matchmaking queue:', socket.id);
      return;
    }

    // Add player to the queue
    queue.push(socket.id);
    socket.emit('matchmakingJoined');
    console.log('✅ [Server] player joined queue:', socket.id, 'bestOf:', bestOf, 'len:', queue.length);

    // If there are enough players to match
    if (queue.length >= 2) {
      // Match the first two players
      const player1Id = queue.shift();
      const player2Id = queue.shift();
      
      const roomCode = generateRoomCode();
      const targetPlayer = getRandomPlayer();
      
      // Create a temporary room awaiting ACK from both players
      matchingRooms[roomCode] = {
        players: [player1Id, player2Id],
        targetPlayer: targetPlayer,
        acksReceived: [],  // store player IDs that have ACKed
        gameStarted: false,
        createdAt: Date.now(), // timestamp for timeout checks
        seriesBestOf: bestOf
      };

      // Emit matchFound to both players (do not start yet)
      io.to(player1Id).emit('matchFound', { 
        roomCode: roomCode,
        targetPlayer: targetPlayer,
        opponentId: player2Id
      });
      
      io.to(player2Id).emit('matchFound', { 
        roomCode: roomCode,
        targetPlayer: targetPlayer,
        opponentId: player1Id
      });

      console.log('🎉 [Server] match found, awaiting ACKs! room:', roomCode, 'players:', player1Id, 'vs', player2Id);
    }
  });

  // Leave matchmaking queue
  socket.on('leaveMatchmaking', () => {
    let removed = false;
    [3,5,7].forEach(k => {
      const q = matchmakingQueues[k];
      const idx = q.indexOf(socket.id);
      if (idx !== -1) { q.splice(idx, 1); removed = true; }
    });
    if (removed) {
      socket.emit('matchmakingLeft');
      console.log('📤 [Server] player left matchmaking queue:', socket.id);
    }
  });

  // Voluntarily leave current game/room (e.g., when user clicks back to home)
  socket.on('leaveCurrentGame', ({ roomCode } = {}) => {
    try {
      // 1) If in matchmaking queues, remove from all
      let removed = false;
      [3,5,7].forEach(k => {
        const q = matchmakingQueues[k];
        const idx = q.indexOf(socket.id);
        if (idx !== -1) { q.splice(idx, 1); removed = true; }
      });
      if (removed) {
        socket.emit('matchmakingLeft');
        console.log('📤 [Server] player left matchmaking queues voluntarily:', socket.id);
      }

      // 2) If a roomCode is provided and the socket is in that room, clean up like a disconnect and notify peers
      if (roomCode && rooms[roomCode] && rooms[roomCode].players.includes(socket.id)) {
        console.log('🚪 [Server] player left room voluntarily:', roomCode, socket.id);
        // Ensure the socket leaves the socket.io room to avoid further broadcasts
        try { socket.leave(roomCode); } catch {}
        // Reuse disconnect cleanup
        cleanupUserRooms(socket.id);
      }
    } catch (err) {
      console.error('leaveCurrentGame error:', err);
    }
  });

  // Handle match confirmation - core ACK mechanism
  socket.on('matchFoundAck', ({ roomCode }) => {
    console.log('📝 [Server] received matchFoundAck:', socket.id, 'room:', roomCode);
    
    if (matchingRooms[roomCode]) {
      const room = matchingRooms[roomCode];
      
      // Record ACK
      if (!room.acksReceived.includes(socket.id)) {
        room.acksReceived.push(socket.id);
        console.log('✅ [Server] ACK recorded:', socket.id, 'count:', room.acksReceived.length, '/2');
      }
      
      // Start only when both players have ACKed
      if (room.acksReceived.length === 2 && !room.gameStarted) {
        room.gameStarted = true;
        
        // Create the official game room
        rooms[roomCode] = {
          players: room.players,
          targetPlayer: room.targetPlayer,
          gameState: 'playing',
          // Series config for random matchmaking (independent of private rooms)
          series: room.seriesBestOf ? { enabled: true, bestOf: room.seriesBestOf, targetWins: Math.ceil(room.seriesBestOf/2), wins: {}, currentRound: 1 } : undefined,
          // Initialize display names (reported during joinMatchmaking)
          playersNames: {
            [room.players[0]]: displayNames[room.players[0]] || '',
            [room.players[1]]: displayNames[room.players[1]] || ''
          },
          playersStatus: {
            [room.players[0]]: {
              socketId: room.players[0],
              guesses: 0,
              isFinished: false,
              isWinner: false
            },
            [room.players[1]]: {
              socketId: room.players[1],
              guesses: 0,
              isFinished: false,
              isWinner: false
            }
          }
        };

        // Make players join the socket.io room
        room.players.forEach(playerId => {
          const playerSocket = io.sockets.sockets.get(playerId);
          if (playerSocket) {
            playerSocket.join(roomCode);
          }
        });

        // Sync players list and names so sidebar can render immediately
        try {
          io.to(roomCode).emit('roomPlayersUpdate', {
            players: rooms[roomCode].players.map(id => ({ socketId: id, displayName: (rooms[roomCode].playersNames && rooms[roomCode].playersNames[id]) || '' }))
          });
        } catch {}

        // Emit initial battle status
        io.to(roomCode).emit('battleStatusUpdate', {
          playersStatus: rooms[roomCode].playersStatus
        });
        
        // Remove the temporary matchmaking room
        delete matchingRooms[roomCode];
        
        console.log('🚀 [Server] both ACKed; game is starting:', roomCode);
      }
    }
  });

  // Guess a player (supports realtime battle status updates)
  socket.on('guessPlayer', ({ roomCode, playerId }) => {
    if (rooms[roomCode] && rooms[roomCode].gameState === 'playing' && rooms[roomCode].playersStatus) {
      // Random-match battle room
      const room = rooms[roomCode];
      const MAX_GUESSES = 8;
      const currentPlayer = room.playersStatus[socket.id];
      
      // Check guess limit and completion
      if (!currentPlayer || currentPlayer.guesses >= MAX_GUESSES || currentPlayer.isFinished) {
        socket.emit('guessResult', { 
          isCorrect: false,
          playerId,
          error: 'GUESS_LIMIT_REACHED'
        });
        return;
      }
      
      const isCorrect = playerId === room.targetPlayer.id || playerId === room.targetPlayer._id;
      
      // Update player state
      room.playersStatus[socket.id].guesses++;
      
      console.log('🎯 [Server] guess:', socket.id, 'count:', room.playersStatus[socket.id].guesses, 'correct:', isCorrect);
      
      // Broadcast updated battle status
      io.to(roomCode).emit('battleStatusUpdate', {
        playersStatus: room.playersStatus
      });

        if (isCorrect) {
          // Private/Random rooms: if series enabled, follow series flow; otherwise end the round
          if (room.series && room.series.enabled) {
            // Increment wins
            if (!room.series.wins) room.series.wins = {};
            room.series.wins[socket.id] = (room.series.wins[socket.id] || 0) + 1;

            // Mark round result and broadcast
            Object.keys(room.playersStatus || {}).forEach(pid => {
              room.playersStatus[pid].isFinished = true;
              room.playersStatus[pid].isWinner = pid === socket.id;
            });
            io.to(roomCode).emit('battleStatusUpdate', {
              playersStatus: room.playersStatus
            });

            const targetWins = room.series.targetWins || Math.ceil((room.series.bestOf || 3) / 2);
            const winnerWins = room.series.wins[socket.id] || 0;
            const finalReached = winnerWins >= targetWins;

            // Broadcast round result (with series data)
            io.to(roomCode).emit('gameOver', {
              winner: socket.id,
              targetPlayer: room.targetPlayer,
              series: {
                enabled: true,
                bestOf: room.series.bestOf,
                targetWins,
                wins: room.series.wins,
                finalWinner: finalReached ? socket.id : null
              }
            });

            if (finalReached) {
              room.gameState = 'finished';
              console.log(`🏁 [Server] series finished room:${roomCode} winner:${socket.id}`);
            } else {
              // Auto-start next round after countdown
              room.roundPendingStart = true;
              const nextRound = (room.series.currentRound || 1) + 1;
              const countdownSeconds = 8;
              io.to(roomCode).emit('roundCountdown', {
                seconds: countdownSeconds,
                nextRound,
                series: {
                  enabled: true,
                  bestOf: room.series.bestOf,
                  targetWins,
                  wins: room.series.wins
                }
              });

              setTimeout(() => {
                room.series.currentRound = nextRound;
                room.targetPlayer = getRandomPlayer();
                room.roundPendingStart = false;
                room.playersStatus = room.players.reduce((acc, pid) => {
                  acc[pid] = { socketId: pid, guesses: 0, isFinished: false, isWinner: false };
                  return acc;
                }, {});
                io.to(roomCode).emit('battleStatusUpdate', { playersStatus: room.playersStatus });
                io.to(roomCode).emit('gameStart', { targetPlayer: room.targetPlayer });
              }, countdownSeconds * 1000);
            }
          } else {
            // Non-series: end immediately
            room.playersStatus[socket.id].isFinished = true;
            room.playersStatus[socket.id].isWinner = true;
            const loserId = room.players.find(id => id !== socket.id);
            if (loserId && room.playersStatus[loserId]) {
              room.playersStatus[loserId].isFinished = true;
              room.playersStatus[loserId].isWinner = false;
            }
            room.gameState = 'finished';
            io.to(roomCode).emit('battleGameOver', {
              winner: { ...room.playersStatus[socket.id], socketId: socket.id },
              loser: loserId ? { ...room.playersStatus[loserId], socketId: loserId } : null,
              targetPlayer: room.targetPlayer,
              gameEndReason: 'CORRECT_GUESS'
            });
            console.log('🏆 [Server] Battle game over! Winner:', socket.id, 'Loser:', loserId);
          }
        } else if (room.playersStatus[socket.id].guesses >= MAX_GUESSES) {
        // Player used all guesses
        room.playersStatus[socket.id].isFinished = true;
        
        // Check whether all players have finished or used all guesses
        const allPlayersFinished = Object.values(room.playersStatus).every(player => 
          player.isFinished || player.guesses >= MAX_GUESSES
        );
        
        if (allPlayersFinished) {
          // All players used guesses and none guessed correctly -> game over
          room.gameState = 'finished';
          
          // Emit battle game over (draw or everyone failed)
          io.to(roomCode).emit('battleGameOver', {
            winner: null,
            loser: null,
            targetPlayer: room.targetPlayer,
            gameEndReason: 'ALL_GUESSES_USED',
            playersStatus: room.playersStatus
          });
          
          console.log('⏰ [Server] Battle game over! All players used all their guesses');
        } else {
          // Broadcast status so others know this player is finished
          io.to(roomCode).emit('battleStatusUpdate', {
            playersStatus: room.playersStatus
          });
          
          console.log('⏱️ [Server] Player', socket.id, 'used all guesses, waiting for others');
        }
      }
      
      socket.emit('guessResult', { 
        isCorrect,
        playerId,
        guessesUsed: room.playersStatus[socket.id].guesses,
        maxGuesses: MAX_GUESSES
      });
    } else {
      // Solo or private (2-4 players) simple race/series: first correct guess wins
      if (rooms[roomCode] && rooms[roomCode].gameState === 'playing') {
        const room = rooms[roomCode];
        const isCorrect = playerId === room.targetPlayer.id || playerId === room.targetPlayer._id;

        // Maintain per-round counters and state (private/series)
        if (!room.playersStatus) {
          room.playersStatus = room.players.reduce((acc, pid) => {
            acc[pid] = { socketId: pid, guesses: 0, isFinished: false, isWinner: false };
            return acc;
          }, {});
        }
        const MAX_GUESSES_PRIVATE = 8;
        if (room.playersStatus[socket.id] && !room.playersStatus[socket.id].isFinished) {
          room.playersStatus[socket.id].guesses = (room.playersStatus[socket.id].guesses || 0) + 1;
          if (room.playersStatus[socket.id].guesses >= MAX_GUESSES_PRIVATE) {
            room.playersStatus[socket.id].isFinished = true;
          }
          io.to(roomCode).emit('battleStatusUpdate', {
            playersStatus: room.playersStatus
          });
        }

        socket.emit('guessResult', {
          isCorrect,
          playerId
        });

        if (isCorrect) {
          // Series logic
          if (room.series && room.series.enabled) {
            // Increment wins
            if (!room.series.wins) room.series.wins = {};
            room.series.wins[socket.id] = (room.series.wins[socket.id] || 0) + 1;

            // Mark the round result and broadcast
            Object.keys(room.playersStatus || {}).forEach(pid => {
              room.playersStatus[pid].isFinished = true;
              room.playersStatus[pid].isWinner = pid === socket.id;
            });
            io.to(roomCode).emit('battleStatusUpdate', {
              playersStatus: room.playersStatus
            });

            const targetWins = room.series.targetWins || Math.ceil((room.series.bestOf || 3) / 2);
            const winnerWins = room.series.wins[socket.id] || 0;
            const finalReached = winnerWins >= targetWins;

            // Emit round result (with series info)
            io.to(roomCode).emit('gameOver', {
              winner: socket.id,
              targetPlayer: room.targetPlayer,
              series: {
                enabled: true,
                bestOf: room.series.bestOf,
                targetWins,
                wins: room.series.wins,
                finalWinner: finalReached ? socket.id : null
              }
            });

            if (finalReached) {
              room.gameState = 'finished';
              console.log(`🏁 [Server] series finished room:${roomCode} winner:${socket.id}`);
            } else {
              // Before next round: broadcast countdown to all players
              room.roundPendingStart = true;
              const nextRound = (room.series.currentRound || 1) + 1;
              const countdownSeconds = 8;
              io.to(roomCode).emit('roundCountdown', {
                seconds: countdownSeconds,
                nextRound,
                series: {
                  enabled: true,
                  bestOf: room.series.bestOf,
                  targetWins,
                  wins: room.series.wins
                }
              });

              setTimeout(() => {
                // After countdown: reset target player and start next round
                room.series.currentRound = nextRound;
                room.targetPlayer = getRandomPlayer();
                room.roundPendingStart = false;
                // Reset per-round player state and broadcast
                room.playersStatus = room.players.reduce((acc, pid) => {
                  acc[pid] = { socketId: pid, guesses: 0, isFinished: false, isWinner: false };
                  return acc;
                }, {});
                io.to(roomCode).emit('battleStatusUpdate', {
                  playersStatus: room.playersStatus
                });
                io.to(roomCode).emit('gameStart', { targetPlayer: room.targetPlayer });
              }, countdownSeconds * 1000);
            }
          } else {
            // Non-series: finish immediately
            room.gameState = 'finished';
            // Mark the round result and broadcast
            Object.keys(room.playersStatus || {}).forEach(pid => {
              room.playersStatus[pid].isFinished = true;
              room.playersStatus[pid].isWinner = pid === socket.id;
            });
            io.to(roomCode).emit('battleStatusUpdate', {
              playersStatus: room.playersStatus
            });
            io.to(roomCode).emit('gameOver', {
              winner: socket.id,
              targetPlayer: room.targetPlayer
            });
          }
        }
      }
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    // 从所有匹配队列中移除
    let removedFromQueue = false;
    [3,5,7].forEach(k => {
      const q = matchmakingQueues[k];
      const idx = q.indexOf(socket.id);
      if (idx !== -1) { 
        q.splice(idx, 1); 
        removedFromQueue = true;
        console.log('📤 [服务器] 从BO' + k + '匹配队列中移除玩家:', socket.id);
      }
    });
    
    // 清理等待ack确认的房间
    for (const [roomCode, room] of Object.entries(matchingRooms)) {
      if (room.players.includes(socket.id)) {
        console.log('🧹 [服务器] 清理等待ACK的房间:', roomCode);
        delete matchingRooms[roomCode];
        // 通知对方玩家匹配失败
        const opponentId = room.players.find(id => id !== socket.id);
        if (opponentId) {
          io.to(opponentId).emit('matchmakingTimeout');
        }
      }
    }
    
    // 清理用户所在的房间
    cleanupUserRooms(socket.id);
    // 清理全局昵称映射
    try { delete displayNames[socket.id]; } catch {}
  });
});

// 辅助函数
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomPlayer() {
  if (players.length === 0) return null;
  const randomPlayer = players[Math.floor(Math.random() * players.length)];
  // 添加调试日志 - 显示被选中的目标球员
  console.log('🎯 服务端选中目标球员:', {
    name: randomPlayer.name,
    team: randomPlayer.team,
    number: randomPlayer.number,
    position: randomPlayer.position,
    age: randomPlayer.age,
    height: randomPlayer.height,
    weight: randomPlayer.weight,
    games: randomPlayer.games || randomPlayer.gamesPlayed,
    origin: randomPlayer.origin
  });
  return randomPlayer;
}

function cleanupUserRooms(socketId) {
  for (const [roomCode, room] of Object.entries(rooms)) {
    if (room.players.includes(socketId)) {
      // 通知房间内其他玩家有人离开（排除离开者本身）
      try {
        const leavingSocket = io.sockets.sockets.get(socketId);
        if (leavingSocket) {
          leavingSocket.to(roomCode).emit('playerLeft', { socketId });
        } else {
          // 兜底：逐个通知剩余玩家
          room.players.filter(id => id !== socketId).forEach(id => {
            io.to(id).emit('playerLeft', { socketId });
          });
        }
      } catch (e) {
        // 兜底：逐个通知剩余玩家
        room.players.filter(id => id !== socketId).forEach(id => {
          io.to(id).emit('playerLeft', { socketId });
        });
      }
      
      // 如果房间中只有一个玩家，则删除房间
      if (room.players.length <= 1) {
        delete rooms[roomCode];
        console.log(`房间 ${roomCode} 已删除`);
      } else {
        // 从房间中移除玩家
        room.players = room.players.filter(id => id !== socketId);
        if (room.playersNames) {
          delete room.playersNames[socketId];
        }
        
        // 如果游戏正在进行中
        if (room.gameState === 'playing') {
          // 系列赛：若仅剩1人在线，直接判定其为最终胜者
          if (room.series && room.series.enabled && room.players.length === 1) {
            const solePlayerId = room.players[0];
            room.gameState = 'finished';
            io.to(roomCode).emit('gameOver', {
              winner: null,
              targetPlayer: room.targetPlayer,
              series: {
                enabled: true,
                bestOf: room.series.bestOf,
                targetWins: room.series.targetWins || Math.ceil((room.series.bestOf || 3) / 2),
                wins: room.series.wins || {},
                finalWinner: solePlayerId
              }
            });
            console.log(`[Server] Series ended due to disconnect, final winner: ${solePlayerId}`);
          } else {
            // 非系列赛或人数仍≥2：按对战断线处理（仅通知仍在房间的玩家，不通知离开者）
            room.gameState = 'finished';
            const remainingPlayers = room.players.filter(id => id !== socketId);
            remainingPlayers.forEach(pid => {
              io.to(pid).emit('battleGameOver', {
                winner: null,
                loser: null,
                targetPlayer: room.targetPlayer,
                gameEndReason: 'PLAYER_DISCONNECTED',
                playersStatus: room.playersStatus
              });
            });
            console.log(`[Server] Game ended due to player disconnect: ${socketId}`);
          }
        }

        // 广播最新玩家列表
        io.to(roomCode).emit('roomPlayersUpdate', {
          players: room.players.map(id => ({ socketId: id, displayName: (room.playersNames && room.playersNames[id]) || '' }))
        });
      }
    }
  }
}

// 设置显示名称（临时昵称）
io.on('connection', (socket) => {
  socket.on('setDisplayName', ({ displayName }) => {
    const roomEntry = Object.entries(rooms).find(([, room]) => room.players && room.players.includes(socket.id));
    if (!roomEntry) return;
    const [roomCode, room] = roomEntry;
    if (!room.playersNames) room.playersNames = {};
    const trimmed = String(displayName || '').trim().slice(0, 20);
    room.playersNames[socket.id] = trimmed;
    // 同步到全局，便于后续房间或随机匹配使用
    displayNames[socket.id] = trimmed;

    io.to(roomCode).emit('roomPlayersUpdate', {
      players: room.players.map(id => ({ socketId: id, displayName: room.playersNames[id] || '' }))
    });
  });
});

// 定期检查匹配超时（每30秒检查一次）
setInterval(() => {
  const now = Date.now();
  const timeout = 30000; // 30秒超时
  
  for (const [roomCode, room] of Object.entries(matchingRooms)) {
    if (now - room.createdAt > timeout) {
      console.log(`⏰ [服务器] 匹配超时，清理房间: ${roomCode}`);
      
      // 通知玩家匹配超时
      room.players.forEach(playerId => {
        io.to(playerId).emit('matchmakingTimeout');
      });
      
      // 删除超时的房间
      delete matchingRooms[roomCode];
    }
  }
}, 30000);

// 强制从JSON文件加载数据（临时修复图片显示问题）
console.log('强制从JSON文件加载球员数据');
loadPlayersFromJSON();

// 注释掉数据库连接（原代码保留供后续使用）
/*
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('MongoDB 连接成功');
      loadPlayersFromDB();
    })
    .catch(err => {
      console.error('MongoDB 连接失败:', err);
      // 尝试从JSON文件加载（备用方案）
      loadPlayersFromJSON();
    });
} else {
  console.log('未配置MONGODB_URI，将从JSON文件加载数据');
  loadPlayersFromJSON();
}
*/

// 启动服务器
const PORT = process.env.PORT || 3002;
// 生产环境下提供前端构建文件与 SPA 回退（放在所有 API 路由之后，避免覆盖 /api 与 /socket.io 等）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res, next) => {
    // 排除 API、Socket.IO、图片与静态资源请求
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/socket.io') ||
      req.path.startsWith('/images')
    ) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n收到退出信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
}); 