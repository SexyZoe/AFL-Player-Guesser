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

// 生产环境下提供前端构建文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // 处理前端路由
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

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
const matchmakingQueue = [];
const matchingRooms = {}; // 存储等待ack确认的房间

io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);

  // 创建私人房间
  socket.on('createRoom', () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [socket.id],
      targetPlayer: getRandomPlayer(),
      gameState: 'waiting'
    };
    
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode });
    console.log(`房间已创建: ${roomCode}`);
  });

  // 加入房间
  socket.on('joinRoom', ({ roomCode }) => {
    if (rooms[roomCode] && rooms[roomCode].players.length < 2 && rooms[roomCode].gameState === 'waiting') {
      socket.join(roomCode);
      rooms[roomCode].players.push(socket.id);
      rooms[roomCode].gameState = 'playing';
      
      io.to(roomCode).emit('gameStart', { targetPlayer: rooms[roomCode].targetPlayer });
      console.log(`用户 ${socket.id} 加入房间 ${roomCode}`);
    } else {
      socket.emit('roomError', { message: '房间不存在或已满' });
    }
  });

  // 加入随机匹配队列
  socket.on('joinMatchmaking', () => {
    console.log('📥 [服务器] 收到 joinMatchmaking 事件，来自:', socket.id);
    
    // 检查是否已经在队列中
    if (matchmakingQueue.includes(socket.id)) {
      console.log('⚠️ [服务器] 玩家已在匹配队列中:', socket.id);
      return;
    }

    // 将玩家添加到匹配队列
    matchmakingQueue.push(socket.id);
    socket.emit('matchmakingJoined');
    console.log('✅ [服务器] 玩家已加入匹配队列:', socket.id, '队列长度:', matchmakingQueue.length);

    // 检查是否有足够的玩家进行匹配
    if (matchmakingQueue.length >= 2) {
      // 匹配前两个玩家
      const player1Id = matchmakingQueue.shift();
      const player2Id = matchmakingQueue.shift();
      
      const roomCode = generateRoomCode();
      const targetPlayer = getRandomPlayer();
      
      // 创建等待ack确认的临时房间
      matchingRooms[roomCode] = {
        players: [player1Id, player2Id],
        targetPlayer: targetPlayer,
        acksReceived: [],  // 存储已收到ack的玩家ID
        gameStarted: false
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
    const index = matchmakingQueue.indexOf(socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      socket.emit('matchmakingLeft');
      console.log('📤 [服务器] 玩家离开匹配队列:', socket.id);
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
    if (rooms[roomCode] && rooms[roomCode].gameState === 'playing') {
      const room = rooms[roomCode];
      const isCorrect = playerId === room.targetPlayer.id || playerId === room.targetPlayer._id;
      
      // 更新玩家状态
      if (room.playersStatus && room.playersStatus[socket.id]) {
        room.playersStatus[socket.id].guesses++;
        
        console.log('🎯 [服务器] 玩家猜测:', socket.id, '猜测次数:', room.playersStatus[socket.id].guesses, '是否正确:', isCorrect);
        
        // 实时广播对战状态更新
        io.to(roomCode).emit('battleStatusUpdate', {
          playersStatus: room.playersStatus
        });

        if (isCorrect) {
          // 标记获胜者
          room.playersStatus[socket.id].isFinished = true;
          room.playersStatus[socket.id].isWinner = true;
          
          // 找到失败者
          const loserId = room.players.find(id => id !== socket.id);
          if (loserId && room.playersStatus[loserId]) {
            room.playersStatus[loserId].isFinished = true;
            room.playersStatus[loserId].isWinner = false;
          }

          room.gameState = 'finished';

          // 发送对战游戏结束事件
          io.to(roomCode).emit('battleGameOver', {
            winner: room.playersStatus[socket.id],
            loser: room.playersStatus[loserId] || null,
            targetPlayer: room.targetPlayer
          });

          console.log('🏆 [服务器] 对战游戏结束! 获胜者:', socket.id, '失败者:', loserId);
        }
      }
      
      socket.emit('guessResult', { 
        isCorrect,
        playerId
      });
    } else {
      // 处理单人游戏或私人房间的猜测
      if (rooms[roomCode] && rooms[roomCode].gameState === 'playing') {
        const isCorrect = playerId === rooms[roomCode].targetPlayer.id || playerId === rooms[roomCode].targetPlayer._id;
        
        socket.emit('guessResult', { 
          isCorrect,
          playerId
        });

        if (isCorrect) {
          io.to(roomCode).emit('gameOver', { 
            winner: socket.id,
            targetPlayer: rooms[roomCode].targetPlayer
          });
          rooms[roomCode].gameState = 'finished';
        }
      }
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    // 从匹配队列中移除
    const queueIndex = matchmakingQueue.indexOf(socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
      console.log('📤 [服务器] 从匹配队列中移除玩家:', socket.id);
    }
    
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
      io.to(roomCode).emit('playerLeft', { socketId });
      
      // 如果房间中只有一个玩家，则删除房间
      if (room.players.length <= 1) {
        delete rooms[roomCode];
        console.log(`房间 ${roomCode} 已删除`);
      } else {
        // 从房间中移除玩家
        room.players = room.players.filter(id => id !== socketId);
      }
    }
  }
}

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