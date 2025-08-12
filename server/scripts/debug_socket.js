// 调试Socket连接的临时文件
const { io } = require('socket.io-client');

console.log('🔍 开始调试Socket连接...');

const socket = io('http://localhost:3002', {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  autoConnect: true
});

socket.on('connect', () => {
  console.log('✅ Socket连接成功! ID:', socket.id);
  
  // 测试创建房间
  console.log('🏠 发送createRoom事件...');
  socket.emit('createRoom');
});

socket.on('roomCreated', (data) => {
  console.log('🎉 房间创建成功！房间代码:', data.roomCode);
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ 连接错误:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔴 连接断开:', reason);
});

// 5秒超时
setTimeout(() => {
  console.log('⏰ 测试超时');
  process.exit(1);
}, 5000);

