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

// 从JSON文件中加载球员数据
const playersDataPath = path.join(__dirname, 'data', 'players.json');
let players = [];

if (fs.existsSync(playersDataPath)) {
  try {
    const playersJson = fs.readFileSync(playersDataPath, 'utf8');
    players = JSON.parse(playersJson);
    console.log(`成功加载 ${players.length} 名球员数据`);
  } catch (error) {
    console.error('加载球员数据失败:', error);
  }
} else {
  console.log('球员数据文件不存在，请先运行爬虫脚本');
}

// 基本路由
app.get('/api/players', (req, res) => {
  res.json(players);
});

// 获取随机球员
app.get('/api/random-player', (req, res) => {
  if (players.length === 0) {
    return res.status(500).json({ error: '没有可用的球员数据' });
  }
  
  const randomIndex = Math.floor(Math.random() * players.length);
  res.json(players[randomIndex]);
});

// Socket.IO 逻辑
const rooms = {};

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

  // 猜测球员
  socket.on('guessPlayer', ({ roomCode, playerId }) => {
    if (rooms[roomCode] && rooms[roomCode].gameState === 'playing') {
      const isCorrect = playerId === rooms[roomCode].targetPlayer.id;
      
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
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
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
  return players[Math.floor(Math.random() * players.length)];
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

// 连接数据库（如果提供了MongoDB URI）
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB 连接成功'))
    .catch(err => console.error('MongoDB 连接失败:', err));
}

// 启动服务器
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 