import { io, Socket } from 'socket.io-client';
import { Player, GuessResult, GameOver, MatchFound, BattleStatusUpdate, BattleGameOver, RoomPlayersUpdate } from '../types';

// 创建socket连接 - 通过同源相对路径 + devServer 代理
// 使用相对路径，避免不同主机名/端口导致的WS失败
const socket: Socket = io('/', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 10000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  autoConnect: true
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
  // 某些环境下 error 可能没有 type 字段
  const errorType = (error as unknown as { type?: string })?.type;
  if (errorType) {
    console.error('📍 [Socket] 错误类型:', errorType);
  }
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('🔄 [Socket] 重连尝试:', attemptNumber);
});

socket.on('reconnect_failed', () => {
  console.error('💀 [Socket] 重连失败');
});

// 立即检查连接状态
console.log('🏁 [Socket] 初始化完成，连接状态:', socket.connected);

// 监听socket连接
export const connectSocket = (callback: () => void): void => {
  socket.on('connect', callback);
};

// 创建房间
export const createRoom = (seriesBestOf?: 3 | 5 | 7): void => {
  if (!socket.connected) {
    const onConnect = () => {
      socket.emit('createRoom', { seriesBestOf });
      socket.off('connect', onConnect);
    };
    socket.on('connect', onConnect);
    socket.connect();
    return;
  }
  socket.emit('createRoom', { seriesBestOf });
};

// 监听房间创建
export const onRoomCreated = (callback: (data: { roomCode: string }) => void): void => {
  socket.on('roomCreated', callback);
};

// 加入房间
export const joinRoom = (roomCode: string): void => {
  if (!socket.connected) {
    const onConnect = () => {
      socket.emit('joinRoom', { roomCode });
      socket.off('connect', onConnect);
    };
    socket.on('connect', onConnect);
    socket.connect();
    return;
  }
  socket.emit('joinRoom', { roomCode });
};

// 开始私房游戏（仅房间waiting且人数>=2时服务端会接受）
export const startPrivateGame = (roomCode: string): void => {
  if (!socket.connected) {
    const onConnect = () => {
      socket.emit('startPrivateGame', { roomCode });
      socket.off('connect', onConnect);
    };
    socket.on('connect', onConnect);
    socket.connect();
    return;
  }
  socket.emit('startPrivateGame', { roomCode });
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

// 监听系列赛回合倒计时
export const onRoundCountdown = (callback: (data: { seconds: number; nextRound: number; series?: any }) => void): void => {
  socket.on('roundCountdown', callback);
};

// 监听玩家离开
export const onPlayerLeft = (callback: (data: { socketId: string }) => void): void => {
  socket.on('playerLeft', callback);
};

// 设置本局显示名称
export const setDisplayName = (displayName: string): void => {
  socket.emit('setDisplayName', { displayName });
};

// 监听房间玩家列表更新
export const onRoomPlayersUpdate = (
  callback: (data: RoomPlayersUpdate) => void
): void => {
  socket.on('roomPlayersUpdate', callback);
};

// 加入随机匹配队列
export const joinMatchmaking = (seriesBestOf?: 3 | 5 | 7, displayName?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('📤 [客户端Socket] 发送 joinMatchmaking 事件');
    console.log('🔗 [客户端Socket] 当前连接状态:', socket.connected);
    console.log('🆔 [客户端Socket] Socket ID:', socket.id);
    
    // 如果socket未连接，等待连接
    if (!socket.connected) {
      console.warn('⚠️ [客户端Socket] Socket未连接，等待连接...');
      
      // 监听连接成功事件
      const onConnect = () => {
        console.log('✅ [客户端Socket] 连接已建立，发送事件');
        socket.emit('joinMatchmaking', { seriesBestOf, displayName });
        socket.off('connect', onConnect); // 清理监听器
        resolve();
      };
      
      // 监听连接失败事件
      const onError = (error: Error) => {
        console.error('❌ [客户端Socket] 连接失败:', error);
        socket.off('connect', onConnect); // 清理监听器
        socket.off('connect_error', onError);
        reject(error);
      };
      
      socket.on('connect', onConnect);
      socket.on('connect_error', onError);
      
      // 如果还没有连接，尝试连接
      if (!socket.connected) {
        socket.connect();
      }
      return;
    }
    
    // 直接发送事件
    socket.emit('joinMatchmaking', { seriesBestOf, displayName });
    resolve();
  });
};

// 离开随机匹配队列
export const leaveMatchmaking = (): void => {
  socket.emit('leaveMatchmaking');
};

// 主动离开当前游戏/房间
export const leaveCurrentGame = (roomCode?: string): void => {
  socket.emit('leaveCurrentGame', { roomCode });
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

// 监听匹配错误（如姓名缺失）
export const onMatchmakingError = (callback: (data: { code: string; message?: string }) => void): void => {
  socket.on('matchmakingError', callback);
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

// 清理所有事件监听器
export const clearAllListeners = (): void => {
  socket.off('connect');
  socket.off('disconnect');
  socket.off('connect_error');
  socket.off('reconnect_attempt');
  socket.off('reconnect_failed');
  socket.off('roomCreated');
  socket.off('roomError');
  socket.off('gameStart');
  socket.off('guessResult');
  socket.off('gameOver');
  socket.off('playerLeft');
  socket.off('roomPlayersUpdate');
  socket.off('matchmakingJoined');
  socket.off('matchmakingLeft');
  socket.off('matchFound');
  socket.off('matchmakingTimeout');
  socket.off('battleStatusUpdate');
  socket.off('battleGameOver');
};

// 断开连接（开发场景下避免过早断开导致的初始化失败，这里仅清理监听，不主动断开）
export const disconnectSocket = (): void => {
  clearAllListeners();
  // 保持连接，以免在React StrictMode双调用下过早断开
};