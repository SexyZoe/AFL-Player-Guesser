import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Player, GameMode, GameState, GuessHistoryItem, ComparisonResult, ComparisonDirection } from '../types';
import { getAllPlayers, getRandomPlayer } from '../services/api';
import * as socketService from '../services/socket';

interface GameContextType {
  players: Player[];
  targetPlayer: Player | null;
  gameMode: GameMode;
  gameState: GameState;
  roomCode: string;
  loading: boolean;
  error: string;
  guesses: number;
  maxGuesses: number;
  guessHistory: GuessHistoryItem[];
  isGameWon: boolean;
  setGameMode: (mode: GameMode) => void;
  startGame: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  guessPlayer: (player: Player) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame必须在GameProvider内使用');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [targetPlayer, setTargetPlayer] = useState<Player | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [roomCode, setRoomCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [guesses, setGuesses] = useState<number>(0);
  const [maxGuesses] = useState<number>(8); // 最大猜测次数
  const [guessHistory, setGuessHistory] = useState<GuessHistoryItem[]>([]);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);

  // 加载所有球员数据
  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true);
      try {
        const allPlayers = await getAllPlayers();
        setPlayers(allPlayers);
        setError('');
      } catch (err) {
        setError('加载球员数据失败');
        console.error('加载球员数据失败', err);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  // 设置Socket监听器
  useEffect(() => {
    // 连接成功回调
    socketService.connectSocket(() => {
      console.log('Socket连接成功');
    });

    // 房间创建回调
    socketService.onRoomCreated((data) => {
      setRoomCode(data.roomCode);
      console.log('房间已创建:', data.roomCode);
    });

    // 房间错误回调
    socketService.onRoomError((data) => {
      setError(data.message);
      console.error('房间错误:', data.message);
    });

    // 游戏开始回调
    socketService.onGameStart((data) => {
      setTargetPlayer(data.targetPlayer);
      setGameState('playing');
      console.log('游戏开始，目标球员:', data.targetPlayer.name);
    });

    // 猜测结果回调
    socketService.onGuessResult((result) => {
      setGuesses((prev) => prev + 1);
      if (result.isCorrect) {
        console.log('猜对了!');
      } else {
        console.log('猜错了!');
      }
    });

    // 游戏结束回调
    socketService.onGameOver((data) => {
      setGameState('finished');
      setTargetPlayer(data.targetPlayer);
      console.log('游戏结束，获胜者:', data.winner, '目标球员:', data.targetPlayer.name);
    });

    // 玩家离开回调
    socketService.onPlayerLeft(() => {
      setError('对方玩家已离开');
      console.log('对方玩家已离开');
    });

    // 清理函数
    return () => {
      socketService.disconnectSocket();
    };
  }, []);

  // 开始单人游戏
  const startSoloGame = async () => {
    setLoading(true);
    try {
      const player = await getRandomPlayer();
      if (player) {
        setTargetPlayer(player);
        // 添加调试日志 - 显示目标球员信息
        console.log('🎯 目标球员信息:', {
          name: player.name,
          team: player.team,
          number: player.number,
          position: player.position,
          age: player.age,
          height: player.height,
          weight: player.weight,
          games: player.games || player.gamesPlayed,
          origin: player.origin
        });
        setGameState('playing');
        setGuesses(0);
        setGuessHistory([]); // 清理之前的猜测历史
        setIsGameWon(false);
        setError('');
      } else {
        setError('获取随机球员失败');
      }
    } catch (err) {
      setError('开始游戏失败');
      console.error('开始游戏失败', err);
    } finally {
      setLoading(false);
    }
  };

  // 创建多人游戏房间
  const createRoom = () => {
    socketService.createRoom();
    setGameState('waiting');
    setGuesses(0);
    setGuessHistory([]); // 清理之前的猜测历史
    setIsGameWon(false);
  };

  // 加入多人游戏房间
  const joinRoom = (code: string) => {
    socketService.joinRoom(code);
    setRoomCode(code);
  };

  // 比较两个数值并返回方向
  const compareValues = (guess: number, target: number): ComparisonDirection => {
    if (guess === target) return 'equal';
    if (guess < target) return 'higher';
    return 'lower';
  };

  // 比较两个字符串并返回是否匹配
  const compareStrings = (guess: string, target: string): ComparisonResult => {
    return guess === target ? 'correct' : 'incorrect';
  };

  // 比较数值是否接近
  const isClose = (guess: number, target: number, threshold: number): boolean => {
    return Math.abs(guess - target) <= threshold;
  };

  // 比较球员并生成比较结果
  const comparePlayer = (guessedPlayer: Player, targetPlayer: Player): GuessHistoryItem => {
    // 安全解析数值，返回默认值为0
    const parseNumber = (value: any, pattern: RegExp): number => {
      if (value === undefined || value === null) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const match = value.match(pattern);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    };
    
    // 获取比赛场次（兼容gamesPlayed和games字段）
    const getGames = (player: Player): number => {
      return player.gamesPlayed || player.games || 0;
    };
    
    // 解析各个数值字段
    const guessAge = parseNumber(guessedPlayer.age, /(\d+)yr/);
    const targetAge = parseNumber(targetPlayer.age, /(\d+)yr/);
    
    const guessHeight = parseNumber(guessedPlayer.height, /(\d+)cm/);
    const targetHeight = parseNumber(targetPlayer.height, /(\d+)cm/);
    
    const guessWeight = parseNumber(guessedPlayer.weight, /(\d+)kg/);
    const targetWeight = parseNumber(targetPlayer.weight, /(\d+)kg/);

    const guessGames = getGames(guessedPlayer);
    const targetGames = getGames(targetPlayer);

    const ageDirection = compareValues(guessAge, targetAge);
    const heightDirection = compareValues(guessHeight, targetHeight);
    const weightDirection = compareValues(guessWeight, targetWeight);
    const gamesDirection = compareValues(guessGames, targetGames);

    return {
      player: guessedPlayer,
      comparison: {
        team: compareStrings(guessedPlayer.team || '', targetPlayer.team || ''),
        number: guessedPlayer.number === targetPlayer.number ? 'correct' : 
                isClose(guessedPlayer.number || 0, targetPlayer.number || 0, 5) ? 'close' : 'incorrect',
        position: compareStrings(guessedPlayer.position || '', targetPlayer.position || ''),
        age: guessAge === targetAge ? 'correct' : 
             isClose(guessAge, targetAge, 2) ? 'close' : 'incorrect',
        height: guessHeight === targetHeight ? 'correct' : 
                isClose(guessHeight, targetHeight, 5) ? 'close' : 'incorrect',
        weight: guessWeight === targetWeight ? 'correct' : 
                isClose(guessWeight, targetWeight, 5) ? 'close' : 'incorrect',
        gamesPlayed: guessGames === targetGames ? 'correct' : 
               isClose(guessGames, targetGames, 10) ? 'close' : 'incorrect',
        origin: compareStrings(guessedPlayer.origin || '', targetPlayer.origin || ''),
      },
      direction: {
        age: ageDirection,
        height: heightDirection,
        weight: weightDirection,
        gamesPlayed: gamesDirection
      }
    };
  };

  // 猜测球员
  const guessPlayer = (player: Player) => {
    if (!targetPlayer) return;
    
    setGuesses((prev) => prev + 1);
    
    // 生成比较结果
    const comparisonResult = comparePlayer(player, targetPlayer);
    
    // 添加到猜测历史
    setGuessHistory((prev) => [...prev, comparisonResult]);
    
    // 检查是否猜对
    const isCorrect = player.name === targetPlayer.name;
    
    // 检查是否达到最大猜测次数
    const isMaxGuesses = guesses + 1 >= maxGuesses;
    
    if (isCorrect) {
      setIsGameWon(true);
      setGameState('finished');
    } else if (isMaxGuesses) {
      setIsGameWon(false);
      setGameState('finished');
    }
  };

  // 开始游戏
  const startGame = () => {
    if (gameMode === 'solo') {
      startSoloGame();
    } else if (gameMode === 'random') {
      // 随机匹配逻辑（简化为创建房间）
      createRoom();
    }
  };

  // 重置游戏
  const resetGame = () => {
    setGameState('waiting');
    setTargetPlayer(null);
    setRoomCode('');
    setGuesses(0);
    setGuessHistory([]); // 清理猜测历史
    setIsGameWon(false);
    setError('');
  };

  const value = {
    players,
    targetPlayer,
    gameMode,
    gameState,
    roomCode,
    loading,
    error,
    guesses,
    maxGuesses,
    guessHistory,
    isGameWon,
    setGameMode,
    startGame,
    createRoom,
    joinRoom,
    guessPlayer,
    resetGame
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};