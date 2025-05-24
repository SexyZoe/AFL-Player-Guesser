import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Player, GameMode, GameState } from '../types';
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
  setGameMode: (mode: GameMode) => void;
  startGame: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  guessPlayer: (playerId: number) => void;
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
        setGameState('playing');
        setGuesses(0);
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
  };

  // 加入多人游戏房间
  const joinRoom = (code: string) => {
    socketService.joinRoom(code);
    setRoomCode(code);
  };

  // 猜测球员
  const guessPlayer = (playerId: number) => {
    if (gameMode === 'solo') {
      setGuesses((prev) => prev + 1);
      const isCorrect = playerId === targetPlayer?.id;
      if (isCorrect) {
        setGameState('finished');
      }
    } else {
      socketService.guessPlayer(roomCode, playerId);
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
    setGameMode,
    startGame,
    createRoom,
    joinRoom,
    guessPlayer,
    resetGame
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};