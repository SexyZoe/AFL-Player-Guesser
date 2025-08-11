import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Player, GameMode, GameState, GuessHistoryItem, ComparisonResult, ComparisonDirection, PlayerStatus, RoomPlayer, RoomPlayersUpdate } from '../types';
import NameModal from '../components/NameModal';
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
  // 对战模式相关状态
  battleStatus: { [socketId: string]: PlayerStatus } | null;
  currentSocketId: string | null;
  opponentStatus: PlayerStatus | null;
  battleResult: 'win' | 'lose' | null;
  // 私房玩家列表
  roomPlayers: RoomPlayer[];
  roomHostId: string | null;
  // 系列赛回合倒计时与轮次
  roundCountdown: number | null;
  currentRound: number;
  // 答案模态框相关状态
  showAnswerModal: boolean;
  gameEndReason: 'CORRECT_GUESS' | 'ALL_GUESSES_USED' | 'MAX_GUESSES_REACHED' | 'PLAYER_DISCONNECTED';
  setGameMode: (mode: GameMode) => void;
  startGame: () => void;
  createRoom: (seriesBestOf?: 3 | 5 | 7) => void;
  joinRoom: (code: string) => void;
  startPrivateRoomGame: () => void;
  guessPlayer: (player: Player) => void;
  resetGame: () => void;
  cancelMatchmaking: () => void;
  closeAnswerModal: () => void;
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
  
  // 对战模式相关状态
  const [battleStatus, setBattleStatus] = useState<{ [socketId: string]: PlayerStatus } | null>(null);
  const [currentSocketId, setCurrentSocketId] = useState<string | null>(null);
  const [opponentStatus, setOpponentStatus] = useState<PlayerStatus | null>(null);
  const [battleResult, setBattleResult] = useState<'win' | 'lose' | null>(null);
  // 私房玩家列表
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [roomHostId, setRoomHostId] = useState<string | null>(null);
  const [seriesWins, setSeriesWins] = useState<Record<string, number>>({});
  
  // 答案模态框状态
  const [showAnswerModal, setShowAnswerModal] = useState<boolean>(false);
  const [gameEndReason, setGameEndReason] = useState<'CORRECT_GUESS' | 'ALL_GUESSES_USED' | 'MAX_GUESSES_REACHED' | 'PLAYER_DISCONNECTED'>('CORRECT_GUESS');
  // 系列赛回合倒计时
  const [roundCountdown, setRoundCountdown] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  
  // 防止重复操作的状态
  const [isJoiningMatchmaking, setIsJoiningMatchmaking] = useState(false);
  // 私房昵称设置
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [hasAskedNameThisGame, setHasAskedNameThisGame] = useState<boolean>(false);

  // 引用保持最新值，避免socket回调闭包中拿到旧值
  const gameModeRef = useRef<GameMode>(gameMode);
  const displayNameRef = useRef<string>(displayName);
  const hasAskedRef = useRef<boolean>(hasAskedNameThisGame);

  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);
  useEffect(() => { displayNameRef.current = displayName; }, [displayName]);
  useEffect(() => { hasAskedRef.current = hasAskedNameThisGame; }, [hasAskedNameThisGame]);

  // 调试: 监控gameMode变化
  useEffect(() => {
    console.log('🎮 Game mode changed to:', gameMode);
  }, [gameMode]);

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
    // 清理旧的监听器，防止重复注册
    socketService.clearAllListeners();
    
    // 连接成功回调
    socketService.connectSocket(() => {
      console.log('🔌 [客户端] Socket连接成功！');
      // 保存当前socketId
      setCurrentSocketId(socketService.getCurrentSocketId());
    });

    // 房间创建回调
    socketService.onRoomCreated((data) => {
      setRoomCode(data.roomCode);
      console.log('房间已创建:', data.roomCode);
    });

    // 房间错误回调（非致命错误，避免全屏错误遮挡UI）
    socketService.onRoomError((data) => {
      console.error('房间错误:', data.message);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(data.message);
      }
    });

    // 游戏开始回调（私房 & 系列赛）
    socketService.onGameStart((data) => {
      setTargetPlayer(data.targetPlayer);
      setGameState('playing');
      // 开新局时重置当局数据
      setGuesses(0);
      setGuessHistory([]);
      setIsGameWon(false);
      console.log('游戏开始，目标球员:', data.targetPlayer.name);
      // 进入私房对战后，弹出昵称设置框（兜底触发点）
      if (gameModeRef.current === 'private' && !displayNameRef.current && !hasAskedRef.current) {
        console.log('[NameModal] trigger on gameStart');
        setIsNameModalOpen(true);
        setHasAskedNameThisGame(true);
        hasAskedRef.current = true;
      }
    });

    // 私房房间玩家更新
    socketService.onRoomPlayersUpdate((data: RoomPlayersUpdate) => {
      setRoomPlayers(data.players || []);
      if (data.hostId) setRoomHostId(data.hostId);
      // 不在这里强制弹窗，等待进入playing时触发
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

    // 游戏结束回调（兼容系列赛：非最终局不切到 finished）
    socketService.onGameOver((data: any) => {
      const series = data?.series;
      if (series?.enabled) {
        // 更新系列赛胜场显示
        if (series.wins) setSeriesWins(series.wins);
        // 如果已有最终胜者则结束系列赛，否则等待下一局开始
        if (series.finalWinner) {
          setGameState('finished');
        } else {
          // 仍保持 playing，服务端会很快推送下一局 gameStart
        }
      } else {
        setGameState('finished');
      }
      setTargetPlayer(data.targetPlayer);
      console.log('游戏结束事件:', data);
    });

    // 玩家离开回调
    socketService.onPlayerLeft(() => {
      setError('对方玩家已离开');
      console.log('对方玩家已离开');
    });

    // 匹配队列加入成功回调
    socketService.onMatchmakingJoined(() => {
      console.log('📥 [客户端] 收到 matchmakingJoined 事件，切换到匹配状态');
      setGameState('matchmaking');
      setIsJoiningMatchmaking(false); // 加入成功后重置状态
      console.log('✅ [客户端] 已加入匹配队列，当前状态: matchmaking');
    });

    // 匹配队列离开成功回调
    socketService.onMatchmakingLeft(() => {
      setGameState('waiting');
      setIsJoiningMatchmaking(false); // 离开匹配队列后重置状态
      console.log('已离开匹配队列');
    });

    // 匹配成功回调
    socketService.onMatchFound((data) => {
      console.log('🎉 [客户端] 收到 matchFound 事件:', data);
      console.log('🏠 [客户端] 房间代码:', data.roomCode);
      console.log('🎯 [客户端] 目标球员:', data.targetPlayer.name);
      console.log('🔗 [客户端] Socket连接状态:', socketService.getCurrentSocketId() ? '已连接' : '未连接');
      
      // 先保存房间信息和目标球员，但不改变游戏状态
      setRoomCode(data.roomCode);
      setTargetPlayer(data.targetPlayer);
      
      // 立即发送确认收到事件
      socketService.emitMatchFoundAck(data.roomCode);
      
      console.log('✅ [客户端] 已发送ACK确认信号，等待服务器确认双方准备就绪');
      // 注意：不在这里设置gameState='playing'，等待服务器发送battleStatusUpdate
    });

    // 匹配超时回调
    socketService.onMatchmakingTimeout(() => {
      setGameState('waiting');
      setIsJoiningMatchmaking(false); // 匹配超时后重置状态
      setError('匹配超时，请重试');
      console.log('匹配超时');
    });

    // 对战状态更新回调
    socketService.onBattleStatusUpdate((data) => {
      console.log('⚔️ [客户端] 收到对战状态更新:', data);
      
      // 获取当前Socket ID
      const currentId = socketService.getCurrentSocketId();
      if (!currentId) {
        console.warn('⚠️ [客户端] 无法获取Socket ID，跳过状态更新');
        return;
      }
      
      // 使用函数形式的setState来访问最新的状态
      setBattleStatus((prevBattleStatus) => {
        // 如果之前没有battleStatus，说明这是第一次收到，游戏正式开始
        if (!prevBattleStatus) {
          console.log('🚀 [客户端] 双方ACK确认完成，游戏正式开始！');
          setGameState('playing');
          setIsJoiningMatchmaking(false); // 确保重置匹配状态
          // 私房进入playing时，首次弹出昵称设置框
          if (gameModeRef.current === 'private' && !displayNameRef.current && !hasAskedRef.current) {
            console.log('[NameModal] trigger on first battleStatusUpdate');
            setIsNameModalOpen(true);
            setHasAskedNameThisGame(true);
            hasAskedRef.current = true;
          }
        }
        return data.playersStatus;
      });
      
      setCurrentSocketId(currentId);
      
      // 找到对手状态
      const opponentId = Object.keys(data.playersStatus).find(id => id !== currentId);
      if (opponentId) {
        setOpponentStatus(data.playersStatus[opponentId]);
      }
    });

    // 对战游戏结束回调
    socketService.onBattleGameOver((data) => {
      console.log('🏆 [Client] Battle game over:', data);
      setTargetPlayer(data.targetPlayer);
      
      // 判断当前玩家是胜利还是失败
      const currentId = socketService.getCurrentSocketId();
      
      if (data.gameEndReason === 'ALL_GUESSES_USED') {
        // 双方都用完猜测次数
        setBattleResult(null);
        setIsGameWon(false);
        setGameEndReason('ALL_GUESSES_USED');
      } else if (data.gameEndReason === 'PLAYER_DISCONNECTED') {
        // 有玩家断开连接
        setBattleResult(null);
        setIsGameWon(false);
        setGameEndReason('PLAYER_DISCONNECTED');
      } else if (data.winner && data.gameEndReason === 'CORRECT_GUESS') {
        // 有人猜对了
        const isWinner = data.winner.socketId === currentId;
        setBattleResult(isWinner ? 'win' : 'lose');
        setIsGameWon(isWinner);
        setGameEndReason('CORRECT_GUESS');
      }
      
      // 显示答案模态框
      setShowAnswerModal(true);
    });

    // 系列赛回合倒计时
    socketService.onRoundCountdown((data) => {
      setRoundCountdown(data.seconds);
      if (typeof data.nextRound === 'number') setCurrentRound(data.nextRound);
      // 每秒减少一次倒计时（前端可视化）
      const interval = setInterval(() => {
        setRoundCountdown((prev) => {
          if (prev === null) return prev;
          if (prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
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
  const createRoom = (seriesBestOf?: 3 | 5 | 7) => {
    socketService.createRoom(seriesBestOf);
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

  // 开始私房游戏（等待 -> 开始）
  const startPrivateRoomGame = () => {
    if (!roomCode) return;
    socketService.startPrivateGame(roomCode);
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
    
    // 对于多人游戏（随机匹配和私人房间），发送猜测到服务器
    if (gameMode === 'random' || gameMode === 'private') {
      // 检查是否超过猜测次数限制
      if (currentSocketId && battleStatus && battleStatus[currentSocketId]) {
        const currentPlayerStatus = battleStatus[currentSocketId];
        if (currentPlayerStatus.guesses >= maxGuesses || currentPlayerStatus.isFinished) {
          console.log('❌ [Client] Guess limit reached or game finished');
          return;
        }
      }
      
      if (roomCode) {
        console.log('🎮 [Client] Sending guess to server:', player.name, 'Room:', roomCode);
        const playerId = player.id || player._id || 0;
        socketService.guessPlayer(roomCode, playerId as number);
      }
      
      // 生成本地比较结果用于UI显示
      const comparisonResult = comparePlayer(player, targetPlayer);
      setGuessHistory((prev) => [...prev, comparisonResult]);
      
      // 注意：对战模式下不在这里更新状态，等待服务器通知
    } else {
      // 单人游戏的本地处理
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
        setGameEndReason('CORRECT_GUESS');
        setShowAnswerModal(true);
      } else if (isMaxGuesses) {
        setIsGameWon(false);
        setGameEndReason('MAX_GUESSES_REACHED');
        setShowAnswerModal(true);
      }
    }
  };

  // 开始游戏
  const startGame = () => {
    console.log('🚀 startGame called! Current gameMode:', gameMode);
    
    if (gameMode === 'solo') {
      console.log('🎯 Starting solo game...');
      startSoloGame();
    } else if (gameMode === 'random') {
      // 防止重复点击
      if (isJoiningMatchmaking) {
        console.log('⚠️ [客户端] 正在加入匹配队列，忽略重复操作');
        return;
      }
      
      console.log('⚔️ Starting random match... Joining matchmaking queue');
      setIsJoiningMatchmaking(true);
      
      // 随机匹配逻辑 - 加入匹配队列
      socketService.joinMatchmaking()
        .then(() => {
          setError(''); // 清除之前的错误
          console.log('✅ [客户端] 成功加入匹配队列');
        })
        .catch((error) => {
          console.error('❌ [客户端] 加入匹配队列失败:', error);
          setError('连接失败，请重试');
          setIsJoiningMatchmaking(false); // 失败时重置状态
        });
    }
  };

  // 取消匹配
  const cancelMatchmaking = () => {
    socketService.leaveMatchmaking();
    setIsJoiningMatchmaking(false); // 取消匹配后重置状态
    setError(''); // 清除错误
  };

  // 关闭答案模态框
  const closeAnswerModal = () => {
    setShowAnswerModal(false);
    setGameState('finished');
  };

  // 重置游戏
  const resetGame = () => {
    // 如果正在匹配中，先离开匹配队列
    if (gameState === 'matchmaking') {
      socketService.leaveMatchmaking();
    }
    
    setGameState('waiting');
    setTargetPlayer(null);
    setRoomCode('');
    setGuesses(0);
    setGuessHistory([]); // 清理猜测历史
    setIsGameWon(false);
    setError('');
    
    // 重置对战相关状态
    setBattleStatus(null);
    setCurrentSocketId(null);
    setOpponentStatus(null);
    setBattleResult(null);
    
    // 重置答案模态框状态
    setShowAnswerModal(false);
    setGameEndReason('CORRECT_GUESS');
    setHasAskedNameThisGame(false);
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
    battleStatus,
    currentSocketId,
    opponentStatus,
    battleResult,
    roomPlayers,
    roomHostId,
    // 将 seriesWins 暂不暴露在类型中，直接用于 RoomSidebar 传参由 App 控制
    roundCountdown,
    currentRound,
    showAnswerModal,
    gameEndReason,
    setGameMode,
    startGame,
    createRoom,
    joinRoom,
    startPrivateRoomGame,
    guessPlayer,
    resetGame,
    cancelMatchmaking,
    closeAnswerModal
  };

  return (
    <GameContext.Provider value={value}>
      {children}
      <NameModal
        isOpen={isNameModalOpen}
        initialName={displayName}
        onConfirm={(name) => {
          setDisplayName(name);
          setIsNameModalOpen(false);
          // 发送到服务器
          socketService.setDisplayName(name);
        }}
      />
    </GameContext.Provider>
  );
};