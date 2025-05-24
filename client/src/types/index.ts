// 球员类型定义
export interface Player {
  id: number;
  name: string;
  team: string;
  age: number;
  height: number;
  weight: number;
  number: number;
  position: string;
  gamesPlayed: number;
}

// 游戏模式类型
export type GameMode = 'solo' | 'random' | 'private';

// 游戏状态类型
export type GameState = 'waiting' | 'playing' | 'finished';

// 房间类型
export interface Room {
  roomCode: string;
  players: string[];
  targetPlayer: Player | null;
  gameState: GameState;
}

// 猜测结果类型
export interface GuessResult {
  isCorrect: boolean;
  playerId: number;
}

// 游戏结束类型
export interface GameOver {
  winner: string;
  targetPlayer: Player;
} 