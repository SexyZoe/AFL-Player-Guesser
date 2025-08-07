// 球员类型定义
export interface Player {
  _id?: string; // MongoDB的_id字段
  id?: string | number; // 兼容性字段
  name: string;
  team: string;
  age: string | number;
  height: string | number;
  weight: string | number;
  number: number;
  position: string;
  gamesPlayed: number;
  games?: number; // 为了兼容性添加games字段
  origin?: string; // 球员出生地/籍贯
  image?: string; // 球员头像图片URL
}

// 游戏模式类型
export type GameMode = 'solo' | 'random' | 'private';

// 游戏状态类型
export type GameState = 'waiting' | 'playing' | 'finished' | 'matchmaking';

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

// 属性比较结果类型
export type ComparisonResult = 'correct' | 'close' | 'incorrect';

// 数值比较方向
export type ComparisonDirection = 'higher' | 'lower' | 'equal' | 'none';

// 猜测历史记录项
export interface GuessHistoryItem {
  player: Player;
  comparison: {
    team: ComparisonResult;
    number: ComparisonResult;
    position: ComparisonResult;
    age: ComparisonResult;
    height: ComparisonResult;
    weight: ComparisonResult;
    gamesPlayed: ComparisonResult;
    origin: ComparisonResult;
  };
  direction: {
    age: ComparisonDirection;
    height: ComparisonDirection;
    weight: ComparisonDirection;
    gamesPlayed: ComparisonDirection;
  };
}

// 玩家状态类型（对战模式）
export interface PlayerStatus {
  socketId: string;
  guesses: number;
  isFinished: boolean;
  isWinner: boolean;
}

// 匹配成功类型
export interface MatchFound {
  roomCode: string;
  targetPlayer: Player;
  opponentId: string;
}

// 对战状态更新类型
export interface BattleStatusUpdate {
  playersStatus: { [socketId: string]: PlayerStatus };
}

// 对战游戏结束类型
export interface BattleGameOver {
  winner?: PlayerStatus;
  loser?: PlayerStatus;
  targetPlayer: Player;
  gameEndReason: 'CORRECT_GUESS' | 'ALL_GUESSES_USED' | 'PLAYER_DISCONNECTED';
  playersStatus?: { [socketId: string]: PlayerStatus };
} 