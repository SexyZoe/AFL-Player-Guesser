import { io, Socket } from 'socket.io-client';
import { Player, GuessResult, GameOver } from '../types';

// 创建socket连接
const socket: Socket = io();

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

// 断开连接
export const disconnectSocket = (): void => {
  socket.disconnect();
}; 