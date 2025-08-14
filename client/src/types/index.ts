// Player type definitions
export interface Player {
  _id?: string; // MongoDB _id field
  id?: string | number; // compatibility field
  name: string;
  team: string;
  age: string | number;
  height: string | number;
  weight: string | number;
  number: number;
  position: string;
  gamesPlayed: number;
  games?: number; // compatibility field
  origin?: string; // player origin
  image?: string; // player image URL
}

// Game mode type
export type GameMode = 'solo' | 'random' | 'private';

// Game state type
export type GameState = 'waiting' | 'playing' | 'finished' | 'matchmaking';

// Game end reason
export type GameEndReason = 'CORRECT_GUESS' | 'ALL_GUESSES_USED' | 'MAX_GUESSES_REACHED' | 'PLAYER_DISCONNECTED';

// Room type
export interface Room {
  roomCode: string;
  players: string[];
  targetPlayer: Player | null;
  gameState: GameState;
}

// Guess result type
export interface GuessResult {
  isCorrect: boolean;
  playerId: number;
}

// Game over type
export interface GameOver {
  winner: string;
  targetPlayer: Player;
}

// Attribute comparison result type
export type ComparisonResult = 'correct' | 'close' | 'incorrect';

// Numeric comparison direction
export type ComparisonDirection = 'higher' | 'lower' | 'equal' | 'none';

// Guess history item
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

// Player status type (battle mode)
export interface PlayerStatus {
  socketId: string;
  guesses: number;
  isFinished: boolean;
  isWinner: boolean;
}

// Match found type
export interface MatchFound {
  roomCode: string;
  targetPlayer: Player;
  opponentId: string;
}

// Battle status update type
export interface BattleStatusUpdate {
  playersStatus: { [socketId: string]: PlayerStatus };
}

// Battle game over type
export interface BattleGameOver {
  winner?: PlayerStatus;
  loser?: PlayerStatus;
  targetPlayer: Player;
  gameEndReason: 'CORRECT_GUESS' | 'ALL_GUESSES_USED' | 'PLAYER_DISCONNECTED';
  playersStatus?: { [socketId: string]: PlayerStatus };
} 

// Player in room (for display names)
export interface RoomPlayer {
  socketId: string;
  displayName: string;
}

// Room players update event (private rooms)
export interface RoomPlayersUpdate {
  players: RoomPlayer[];
  hostId?: string;
}