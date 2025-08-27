import { io, Socket } from 'socket.io-client';
import { Player, GuessResult, GameOver, MatchFound, BattleStatusUpdate, BattleGameOver, RoomPlayersUpdate } from '../types';

// Create socket connection - through same origin relative path + devServer proxy
// Use relative path to avoid WS failures caused by different hostnames/ports
const socket: Socket = io('/', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  timeout: 10000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  autoConnect: true
});

// Add connection status debugging
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
      // In some environments, error may not have type field
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

  // Immediately check connection status
console.log('🏁 [Socket] 初始化完成，连接状态:', socket.connected);

// Listen for socket connection
export const connectSocket = (callback: () => void): void => {
  socket.on('connect', callback);
};

// Create room
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

// Listen for room creation
export const onRoomCreated = (callback: (data: { roomCode: string }) => void): void => {
  socket.on('roomCreated', callback);
};

// Join room
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

// Start private room game (server accepts only when room is waiting and has >=2 players)
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

// Listen for room errors
export const onRoomError = (callback: (data: { message: string }) => void): void => {
  socket.on('roomError', callback);
};

// Listen for game start
export const onGameStart = (callback: (data: { targetPlayer: Player }) => void): void => {
  socket.on('gameStart', callback);
};

// Guess player
export const guessPlayer = (roomCode: string, playerId: number): void => {
  socket.emit('guessPlayer', { roomCode, playerId });
};

// Listen for guess results
export const onGuessResult = (callback: (result: GuessResult) => void): void => {
  socket.on('guessResult', callback);
};

// Listen for game over
export const onGameOver = (callback: (data: GameOver) => void): void => {
  socket.on('gameOver', callback);
};

// Listen for series round countdown
export const onRoundCountdown = (callback: (data: { seconds: number; nextRound: number; series?: any }) => void): void => {
  socket.on('roundCountdown', callback);
};

// Listen for player leaving
export const onPlayerLeft = (callback: (data: { socketId: string }) => void): void => {
  socket.on('playerLeft', callback);
};

// Set display name for this session
export const setDisplayName = (displayName: string): void => {
  socket.emit('setDisplayName', { displayName });
};

// Listen for room player list updates
export const onRoomPlayersUpdate = (
  callback: (data: RoomPlayersUpdate) => void
): void => {
  socket.on('roomPlayersUpdate', callback);
};

// Join random matchmaking queue
export const joinMatchmaking = (seriesBestOf?: 3 | 5 | 7, displayName?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('📤 [客户端Socket] 发送 joinMatchmaking 事件');
    console.log('🔗 [客户端Socket] 当前连接状态:', socket.connected);
    console.log('🆔 [客户端Socket] Socket ID:', socket.id);
    
    // If socket not connected, wait for connection
    if (!socket.connected) {
      console.warn('⚠️ [客户端Socket] Socket未连接，等待连接...');
      
      // Listen for connection success event
      const onConnect = () => {
        console.log('✅ [客户端Socket] 连接已建立，发送事件');
        socket.emit('joinMatchmaking', { seriesBestOf, displayName });
        socket.off('connect', onConnect); // Clean up listener
        resolve();
      };
      
      // Listen for connection failure event
      const onError = (error: Error) => {
        console.error('❌ [客户端Socket] 连接失败:', error);
        socket.off('connect', onConnect); // Clean up listener
        socket.off('connect_error', onError);
        reject(error);
      };
      
      socket.on('connect', onConnect);
      socket.on('connect_error', onError);
      
      // If not connected yet, try to connect
      if (!socket.connected) {
        socket.connect();
      }
      return;
    }
    
          // Send event directly
    socket.emit('joinMatchmaking', { seriesBestOf, displayName });
    resolve();
  });
};

// Leave random matchmaking queue
export const leaveMatchmaking = (): void => {
  socket.emit('leaveMatchmaking');
};

// Actively leave current game/room
export const leaveCurrentGame = (roomCode?: string): void => {
  socket.emit('leaveCurrentGame', { roomCode });
};

// Listen for successful matchmaking queue join
export const onMatchmakingJoined = (callback: () => void): void => {
  socket.on('matchmakingJoined', callback);
};

// Listen for successful matchmaking queue leave
export const onMatchmakingLeft = (callback: () => void): void => {
  socket.on('matchmakingLeft', callback);
};

// Listen for successful match
export const onMatchFound = (callback: (data: MatchFound) => void): void => {
  socket.on('matchFound', callback);
};

// Listen for match timeout
export const onMatchmakingTimeout = (callback: () => void): void => {
  socket.on('matchmakingTimeout', callback);
};

// Listen for matchmaking errors (e.g. missing name)
export const onMatchmakingError = (callback: (data: { code: string; message?: string }) => void): void => {
  socket.on('matchmakingError', callback);
};

// Listen for battle status updates
export const onBattleStatusUpdate = (callback: (data: BattleStatusUpdate) => void): void => {
  socket.on('battleStatusUpdate', callback);
};

// Listen for battle game over
export const onBattleGameOver = (callback: (data: BattleGameOver) => void): void => {
  socket.on('battleGameOver', callback);
};

// Get current Socket ID
export const getCurrentSocketId = (): string | null => {
  return socket.id || null;
};

// Send match found confirmation
export const emitMatchFoundAck = (roomCode: string): void => {
  socket.emit('matchFoundAck', { 
    roomCode, 
    socketId: socket.id 
  });
  console.log('📝 [客户端Socket] 已发送 matchFoundAck 确认信号');
};

// Clean up all event listeners
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

// Disconnect (in dev scenarios, avoid premature disconnection causing init failure, only clean listeners, don't actively disconnect)
export const disconnectSocket = (): void => {
  clearAllListeners();
  // Keep connection to avoid premature disconnection in React StrictMode double calls
};