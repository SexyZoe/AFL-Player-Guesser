import { io, Socket } from 'socket.io-client';
import { Player, GuessResult, GameOver, MatchFound, BattleStatusUpdate, BattleGameOver } from '../types';

// 创建socket连接 - 直接指定服务端地址
const socket: Socket = io('http://localhost:3002', {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 3,
  forceNew: true
});

// 添加连接状态调试
socket.on('connect', () => {
  console.log('🟢 [Socket] 连接成功! Socket ID:', socket.id);
  console.log('🔗 [Socket] 连接状态:', socket.connected);
});

socket.on('disconnect', (reason) => {
  console.log('🔴 [Socket] 连接断开，原因:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ [Socket] 连接错误:', error);
  console.error('🔍 [Socket] 错误详情:', error.message);
  console.error('📍 [Socket] 错误类型:', error.type);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('🔄 [Socket] 重连尝试:', attemptNumber);
});

socket.on('reconnect_failed', () => {
  console.error('💀 [Socket] 重连失败');
});

// 立即检查连接状态
console.log('🏁 [Socket] 初始化完成，连接状态:', socket.connected);
console.log('🌐 [Socket] 连接URL:', socket.io.uri);

// 监听socket连接
export const connectSocket = (callback: () => void): void => {
  socket.on('connect', callback);
};

// 创建房间
export const createRoom = (): void => {
  socket.emit('createRoom');
};

// 监听房间创建
export const onRoomCreated = (callback: (data: { roomCode: string }) => void): void => {
  socket.on('roomCreated', callback);
};

// 加入房间
export const joinRoom = (roomCode: string): void => {
  socket.emit('joinRoom', { roomCode });
};

// 监听房间错误
export const onRoomError = (callback: (data: { message: string }) => void): void => {
  socket.on('roomError', callback);
};

// 监听游戏开始
export const onGameStart = (callback: (data: { targetPlayer: Player }) => void): void => {
  socket.on('gameStart', callback);
};

// 猜测球员
export const guessPlayer = (roomCode: string, playerId: number): void => {
  socket.emit('guessPlayer', { roomCode, playerId });
};

// 监听猜测结果
export const onGuessResult = (callback: (result: GuessResult) => void): void => {
  socket.on('guessResult', callback);
};

// 监听游戏结束
export const onGameOver = (callback: (data: GameOver) => void): void => {
  socket.on('gameOver', callback);
};

// 监听玩家离开
export const onPlayerLeft = (callback: (data: { socketId: string }) => void): void => {
  socket.on('playerLeft', callback);
};

// 加入随机匹配队列
export const joinMatchmaking = (): void => {
  console.log('📤 [客户端Socket] 发送 joinMatchmaking 事件');
  console.log('🔗 [客户端Socket] 当前连接状态:', socket.connected);
  console.log('🆔 [客户端Socket] Socket ID:', socket.id);
  
  // 强制检查连接状态
  if (!socket.connected) {
    console.warn('⚠️ [客户端Socket] Socket显示未连接，尝试强制连接...');
    socket.connect();
    
    // 等待一小段时间让连接建立
    setTimeout(() => {
      console.log('🔄 [客户端Socket] 重新检查连接状态:', socket.connected);
      if (socket.connected) {
        console.log('✅ [客户端Socket] 连接已建立，发送事件');
        socket.emit('joinMatchmaking');
      } else {
        console.error('❌ [客户端Socket] 连接失败');
      }
    }, 1000);
    return;
  }
  
  socket.emit('joinMatchmaking');
};

// 离开随机匹配队列
export const leaveMatchmaking = (): void => {
  socket.emit('leaveMatchmaking');
};

// 监听匹配队列加入成功
export const onMatchmakingJoined = (callback: () => void): void => {
  socket.on('matchmakingJoined', callback);
};

// 监听匹配队列离开成功
export const onMatchmakingLeft = (callback: () => void): void => {
  socket.on('matchmakingLeft', callback);
};

// 监听匹配成功
export const onMatchFound = (callback: (data: MatchFound) => void): void => {
  socket.on('matchFound', callback);
};

// 监听匹配超时
export const onMatchmakingTimeout = (callback: () => void): void => {
  socket.on('matchmakingTimeout', callback);
};

// 监听对战状态更新
export const onBattleStatusUpdate = (callback: (data: BattleStatusUpdate) => void): void => {
  socket.on('battleStatusUpdate', callback);
};

// 监听对战游戏结束
export const onBattleGameOver = (callback: (data: BattleGameOver) => void): void => {
  socket.on('battleGameOver', callback);
};

// 获取当前Socket ID
export const getCurrentSocketId = (): string | null => {
  return socket.id || null;
};

// 发送匹配成功确认
export const emitMatchFoundAck = (roomCode: string): void => {
  socket.emit('matchFoundAck', { 
    roomCode, 
    socketId: socket.id 
  });
  console.log('📝 [客户端Socket] 已发送 matchFoundAck 确认信号');
};

// 断开连接
export const disconnectSocket = (): void => {
  socket.disconnect();
}; 