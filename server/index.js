const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 加载环境变量
dotenv.config();

// 导入球员模型
const Player = require('./models/Player');

// 初始化Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - 提供球员图片
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// 生产环境下提供前端构建文件（注意：必须放在 API 路由之后，见文件末尾）

// 球员数据存储
let players = [];

// 从数据库加载球员数据
async function loadPlayersFromDB() {
  try {
    players = await Player.find({}).lean();
    console.log(`成功从数据库加载 ${players.length} 名球员数据`);
  } catch (error) {
    console.error('从数据库加载球员数据失败:', error);
    
    // 尝试从JSON文件加载（备用方案）
    loadPlayersFromJSON();
  }
}

// 从JSON文件加载球员数据（备用方案）
function loadPlayersFromJSON() {
  const playersDataPath = path.join(__dirname, 'data', 'players.json');
  if (fs.existsSync(playersDataPath)) {
    try {
      const playersJson = fs.readFileSync(playersDataPath, 'utf8');
      players = JSON.parse(playersJson);
      console.log(`成功从JSON文件加载 ${players.length} 名球员数据`);
    } catch (error) {
      console.error('加载球员数据失败:', error);
    }
  } else {
    console.log('球员数据文件不存在，请先运行导入脚本');
  }
}

// 基本路由
app.get('/api/players', async (req, res) => {
  if (players.length === 0) {
    // 如果内存中没有数据，尝试从数据库加载
    players = await Player.find({}).lean();
  }
  res.json(players);
});

// 获取随机球员
app.get('/api/random-player', async (req, res) => {
  if (players.length === 0) {
    // 如果内存中没有数据，尝试从数据库加载
    players = await Player.find({}).lean();
    
    if (players.length === 0) {
      return res.status(500).json({ error: '没有可用的球员数据' });
    }
  }
  
  const randomIndex = Math.floor(Math.random() * players.length);
  res.json(players[randomIndex]);
});

// Socket.IO 逻辑
const rooms = {};
// 随机匹配按系列赛模式分队列
const matchmakingQueues = { 3: [], 5: [], 7: [] };
const matchingRooms = {}; // 存储等待ack确认的房间
// 全局记录每个 socket 的显示昵称（用于随机匹配在房间创建前的校验与初始化）
const displayNames = {};

io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);

  // 创建私人房间（可选系列赛 bestOf: 3|5|7）
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
    console.log(`房间已创建: ${roomCode}`);

    // 向房间广播当前玩家列表（仅创建者）
    io.to(roomCode).emit('roomPlayersUpdate', {
      players: rooms[roomCode].players.map(id => ({ socketId: id, displayName: rooms[roomCode].playersNames[id] || '' })),
      hostId: rooms[roomCode].hostId
    });
  });

  // 加入房间
  socket.on('joinRoom', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].players.length < 4 && rooms[roomCode].gameState === 'waiting' && !rooms[roomCode].locked) {
      socket.join(roomCode);
      rooms[roomCode].players.push(socket.id);
      // 初始化加入者的名称占位
      if (!rooms[roomCode].playersNames) {
        rooms[roomCode].playersNames = {};
      }
      rooms[roomCode].playersNames[socket.id] = rooms[roomCode].playersNames[socket.id] || '';
      console.log(`用户 ${socket.id} 加入房间 ${roomCode}`);

      // 广播最新玩家列表
      io.to(roomCode).emit('roomPlayersUpdate', {
        players: rooms[roomCode].players.map(id => ({ socketId: id, displayName: rooms[roomCode].playersNames[id] || '' })),
        hostId: rooms[roomCode].hostId
      });
    } else {
      socket.emit('roomError', { message: 'Room does not exist or is full' });
    }
  });

  // 私房开始游戏（房主或房内任意玩家触发，条件：waiting 且人数 >= 2）
  socket.on('startPrivateGame', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('roomError', { message: 'Room does not exist' });
      return;
    }
    // 只有房主可以开始游戏
    if (room.hostId && socket.id !== room.hostId) {
      socket.emit('roomError', { message: 'Only the host can start the game' });
      return;
    }
    // 仅在 waiting 状态且 2-4 人时可开始
    if (room.gameState !== 'waiting') {
      socket.emit('roomError', { message: 'Room has already started or finished' });
      return;
    }
    if (!room.players || room.players.length < 2) {
      socket.emit('roomError', { message: 'At least 2 players are required to start' });
      return;
    }

    // 锁房并开始
    room.gameState = 'playing';
    room.locked = true;
    room.roundPendingStart = false;
    if (!room.targetPlayer) {
      room.targetPlayer = getRandomPlayer();
    }

    // 初始化系列赛
    if (room.series && room.series.enabled) {
      room.series.currentRound = 1;
      // 初始化所有已在房间玩家的胜场为0
      room.series.wins = room.players.reduce((acc, pid) => { acc[pid] = 0; return acc; }, {});
      if (!room.series.targetWins) {
        room.series.targetWins = Math.ceil((room.series.bestOf || 3) / 2);
      }
    }

    // 初始化当局玩家状态并广播（用于私房侧栏显示）
    room.playersStatus = room.players.reduce((acc, pid) => {
      acc[pid] = { socketId: pid, guesses: 0, isFinished: false, isWinner: false };
      return acc;
    }, {});
    io.to(roomCode).emit('battleStatusUpdate', {
      playersStatus: room.playersStatus
    });

    io.to(roomCode).emit('gameStart', { targetPlayer: room.targetPlayer });
    console.log(`房间 ${roomCode} 游戏开始，玩家数: ${room.players.length}`);
  });

  // 加入随机匹配队列
  socket.on('joinMatchmaking', ({ seriesBestOf, displayName } = {}) => {
    const bestOf = [3,5,7].includes(Number(seriesBestOf)) ? Number(seriesBestOf) : 3;
    console.log('📥 [服务器] 收到 joinMatchmaking 事件，来自:', socket.id, 'bestOf:', bestOf);
    
    const queue = matchmakingQueues[bestOf];
    // 基础校验：要求传入有效昵称，禁止使用 socket.id 作为昵称
    const name = typeof displayName === 'string' ? displayName.trim().slice(0, 20) : '';
    if (!name || name === socket.id) {
      socket.emit('matchmakingError', { code: 'NAME_REQUIRED', message: '请先设置昵称后再加入匹配' });
      console.warn('❌ [服务器] 拒绝加入匹配：未提供有效昵称或昵称非法。socket:', socket.id);
      return;
    }
    // 记录昵称，供匹配成功后初始化房间玩家名称
    displayNames[socket.id] = name;
    // 检查是否已经在该队列中
    if (queue.includes(socket.id)) {
      console.log('⚠️ [服务器] 玩家已在匹配队列中:', socket.id);
      return;
    }

    // 将玩家添加到匹配队列
    queue.push(socket.id);
    socket.emit('matchmakingJoined');
    console.log('✅ [服务器] 玩家已加入匹配队列:', socket.id, 'bestOf:', bestOf, '队列长度:', queue.length);

    // 检查是否有足够的玩家进行匹配
    if (queue.length >= 2) {
      // 匹配前两个玩家
      const player1Id = queue.shift();
      const player2Id = queue.shift();
      
      const roomCode = generateRoomCode();
      const targetPlayer = getRandomPlayer();
      
      // 创建等待ack确认的临时房间
      matchingRooms[roomCode] = {
        players: [player1Id, player2Id],
        targetPlayer: targetPlayer,
        acksReceived: [],  // 存储已收到ack的玩家ID
        gameStarted: false,
        createdAt: Date.now(), // 添加创建时间用于超时检查
        seriesBestOf: bestOf
      };

      // 发送匹配成功事件（但不立即开始游戏）
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

      console.log('🎉 [服务器] 匹配成功，等待ACK确认! 房间:', roomCode, '玩家:', player1Id, 'vs', player2Id);
    }
  });

  // 离开随机匹配队列
  socket.on('leaveMatchmaking', () => {
    let removed = false;
    [3,5,7].forEach(k => {
      const q = matchmakingQueues[k];
      const idx = q.indexOf(socket.id);
      if (idx !== -1) { q.splice(idx, 1); removed = true; }
    });
    if (removed) {
      socket.emit('matchmakingLeft');
      console.log('📤 [服务器] 玩家离开匹配队列:', socket.id);
    }
  });

  // 主动离开当前游戏/房间（用于随机匹配或私房在客户端点击返回主页时）
  socket.on('leaveCurrentGame', ({ roomCode } = {}) => {
    try {
      // 1) 如果在等待匹配，先从所有匹配队列移除
      let removed = false;
      [3,5,7].forEach(k => {
        const q = matchmakingQueues[k];
        const idx = q.indexOf(socket.id);
        if (idx !== -1) { q.splice(idx, 1); removed = true; }
      });
      if (removed) {
        socket.emit('matchmakingLeft');
        console.log('📤 [服务器] 玩家从匹配队列中主动离开:', socket.id);
      }

      // 2) 如果传入房间号且在房间中，按断线逻辑清理并通知对手
      if (roomCode && rooms[roomCode] && rooms[roomCode].players.includes(socket.id)) {
        console.log('🚪 [服务器] 玩家主动离开房间:', roomCode, socket.id);
        // 确保Socket离开socket.io房间，避免后续广播误触发
        try { socket.leave(roomCode); } catch {}
        // 复用断线清理逻辑
        cleanupUserRooms(socket.id);
      }
    } catch (err) {
      console.error('leaveCurrentGame error:', err);
    }
  });

  // 处理匹配确认 - 核心ACK机制
  socket.on('matchFoundAck', ({ roomCode }) => {
    console.log('📝 [服务器] 收到匹配确认:', socket.id, '房间:', roomCode);
    
    if (matchingRooms[roomCode]) {
      const room = matchingRooms[roomCode];
      
      // 添加ack确认
      if (!room.acksReceived.includes(socket.id)) {
        room.acksReceived.push(socket.id);
        console.log('✅ [服务器] ACK确认已记录:', socket.id, '已确认:', room.acksReceived.length, '/2');
      }
      
      // 如果双方都确认了，才真正开始游戏
      if (room.acksReceived.length === 2 && !room.gameStarted) {
        room.gameStarted = true;
        
        // 创建正式的游戏房间
        rooms[roomCode] = {
          players: room.players,
          targetPlayer: room.targetPlayer,
          gameState: 'playing',
          // 随机匹配的系列赛配置（与私房独立）
          series: room.seriesBestOf ? { enabled: true, bestOf: room.seriesBestOf, targetWins: Math.ceil(room.seriesBestOf/2), wins: {}, currentRound: 1 } : undefined,
          // 初始化玩家显示名称（来自 joinMatchmaking 时上报的昵称）
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

        // 让玩家加入房间
        room.players.forEach(playerId => {
          const playerSocket = io.sockets.sockets.get(playerId);
          if (playerSocket) {
            playerSocket.join(roomCode);
          }
        });

        // 同步双方玩家列表与昵称，确保客户端侧边栏能立即显示
        try {
          io.to(roomCode).emit('roomPlayersUpdate', {
            players: rooms[roomCode].players.map(id => ({ socketId: id, displayName: (rooms[roomCode].playersNames && rooms[roomCode].playersNames[id]) || '' }))
          });
        } catch {}

        // 发送初始对战状态更新
        io.to(roomCode).emit('battleStatusUpdate', {
          playersStatus: rooms[roomCode].playersStatus
        });
        
        // 删除临时匹配房间
        delete matchingRooms[roomCode];
        
        console.log('🚀 [服务器] 双方ACK确认完成，游戏正式开始:', roomCode);
      }
    }
  });

  // 猜测球员（支持实时对战状态同步）
  socket.on('guessPlayer', ({ roomCode, playerId }) => {
    if (rooms[roomCode] && rooms[roomCode].gameState === 'playing' && rooms[roomCode].playersStatus) {
      // 随机匹配对战房
      const room = rooms[roomCode];
      const MAX_GUESSES = 8;
      const currentPlayer = room.playersStatus[socket.id];
      
      // 检查玩家是否已经达到猜测次数上限或已完成游戏
      if (!currentPlayer || currentPlayer.guesses >= MAX_GUESSES || currentPlayer.isFinished) {
        socket.emit('guessResult', { 
          isCorrect: false,
          playerId,
          error: 'GUESS_LIMIT_REACHED'
        });
        return;
      }
      
      const isCorrect = playerId === room.targetPlayer.id || playerId === room.targetPlayer._id;
      
      // 更新玩家状态
      room.playersStatus[socket.id].guesses++;
      
      console.log('🎯 [服务器] 玩家猜测:', socket.id, '猜测次数:', room.playersStatus[socket.id].guesses, '是否正确:', isCorrect);
      
      // 实时广播对战状态更新
      io.to(roomCode).emit('battleStatusUpdate', {
        playersStatus: room.playersStatus
      });

        if (isCorrect) {
          // 私房/随机对战：若开启系列赛则使用系列赛流程，否则直接结束一局
          if (room.series && room.series.enabled) {
            // 累加胜场
            if (!room.series.wins) room.series.wins = {};
            room.series.wins[socket.id] = (room.series.wins[socket.id] || 0) + 1;

            // 标记当局胜负并广播
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

            // 广播当局结果（含系列赛数据）
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
              console.log(`🏁 [Server] 系列赛结束 房间:${roomCode} 最终胜者:${socket.id}`);
            } else {
              // 5秒倒计时后自动开启下一局
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
            // 非系列赛：直接结束
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
        
        // 检查是否所有玩家都已完成或用完次数
        const allPlayersFinished = Object.values(room.playersStatus).every(player => 
          player.isFinished || player.guesses >= MAX_GUESSES
        );
        
        if (allPlayersFinished) {
          // 所有玩家都用完次数且没人猜对，游戏结束
          room.gameState = 'finished';
          
          // 发送对战游戏结束事件（平局或都失败）
          io.to(roomCode).emit('battleGameOver', {
            winner: null,
            loser: null,
            targetPlayer: room.targetPlayer,
            gameEndReason: 'ALL_GUESSES_USED',
            playersStatus: room.playersStatus
          });
          
          console.log('⏰ [Server] Battle game over! All players used all their guesses');
        } else {
          // 广播状态更新，让其他玩家知道这个玩家已完成
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
      // 单人或私房（2-4人）简单竞速规则/系列赛：先猜对者胜出
      if (rooms[roomCode] && rooms[roomCode].gameState === 'playing') {
        const room = rooms[roomCode];
        const isCorrect = playerId === room.targetPlayer.id || playerId === room.targetPlayer._id;

        // 维护当局计数与状态（私房/系列赛）
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
          // 系列赛逻辑
          if (room.series && room.series.enabled) {
            // 累加胜场
            if (!room.series.wins) room.series.wins = {};
            room.series.wins[socket.id] = (room.series.wins[socket.id] || 0) + 1;

            // 标记当局胜负并广播
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

            // 发送当局结果（含系列赛信息）
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
              console.log(`🏁 [Server] 系列赛结束 房间:${roomCode} 最终胜者:${socket.id}`);
            } else {
              // 进入下一局前：广播5秒倒计时给所有玩家
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
                // 倒计时结束：重置目标球员并开始下一局
                room.series.currentRound = nextRound;
                room.targetPlayer = getRandomPlayer();
                room.roundPendingStart = false;
                // 重置当局玩家状态并广播
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
            // 非系列赛：直接结束
            room.gameState = 'finished';
            // 标记当局胜负并广播
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