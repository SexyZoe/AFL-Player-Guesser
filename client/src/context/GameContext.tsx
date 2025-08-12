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
  // 胜者显示名（用于模态框展示给失败方）
  winnerName?: string | null;
  // 胜者ID（socketId）
  winnerId?: string | null;
  // 私房玩家列表
  roomPlayers: RoomPlayer[];
  roomHostId: string | null;
  // 系列赛回合倒计时与轮次
  roundCountdown: number | null;
  currentRound: number;
  // 系列赛信息与胜场（用于最终结果 UI）
  seriesWins?: Record<string, number>;
  seriesBestOf?: number | null;
  seriesTargetWins?: number | null;
  isSeriesFinal?: boolean;
  // 答案模态框相关状态
  showAnswerModal: boolean;
  gameEndReason: 'CORRECT_GUESS' | 'ALL_GUESSES_USED' | 'MAX_GUESSES_REACHED' | 'PLAYER_DISCONNECTED';
  // 随机匹配的系列赛局数设置（BO3/5/7）
  randomMatchBestOf: 3 | 5 | 7;
  setRandomMatchBestOf: (value: 3 | 5 | 7) => void;
  // 模式独立的昵称
  randomDisplayName: string;
  setRandomDisplayName: (name: string) => void;
  privateDisplayName: string;
  setPrivateDisplayName: (name: string) => void;
  // 模式独立的房间玩家列表
  randomRoomPlayers: RoomPlayer[];
  privateRoomPlayers: RoomPlayer[];
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
  const [randomMatchBestOf, setRandomMatchBestOf] = useState<3 | 5 | 7>(3);
  const [gameState, setGameState] = useState<GameState>('waiting');
  // 模式独立的房间码
  const [randomRoomCode, setRandomRoomCode] = useState<string>('');
  const [privateRoomCode, setPrivateRoomCode] = useState<string>('');
  // 兼容旧代码使用的roomCode（按当前模式读取）
  const roomCode = gameMode === 'private' ? privateRoomCode : randomRoomCode;
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
  // 模式独立的玩家列表
  const [randomRoomPlayers, setRandomRoomPlayers] = useState<RoomPlayer[]>([]);
  const [privateRoomPlayers, setPrivateRoomPlayers] = useState<RoomPlayer[]>([]);
  // 兼容旧代码使用的roomPlayers（按当前模式读取）
  const roomPlayers = gameMode === 'private' ? privateRoomPlayers : randomRoomPlayers;
  const [roomHostId, setRoomHostId] = useState<string | null>(null);
  const [seriesWins, setSeriesWins] = useState<Record<string, number>>({});
  // 记录胜者信息（仅用于展示）
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  // 最新的房间玩家引用，避免socket回调拿到旧值
  const randomRoomPlayersRef = useRef<RoomPlayer[]>([]);
  const privateRoomPlayersRef = useRef<RoomPlayer[]>([]);
  
  // 答案模态框状态
  const [showAnswerModal, setShowAnswerModal] = useState<boolean>(false);
  const [gameEndReason, setGameEndReason] = useState<'CORRECT_GUESS' | 'ALL_GUESSES_USED' | 'MAX_GUESSES_REACHED' | 'PLAYER_DISCONNECTED'>('CORRECT_GUESS');
  // 系列赛回合倒计时
  const [roundCountdown, setRoundCountdown] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isSeriesFinal, setIsSeriesFinal] = useState<boolean>(false);
  const [seriesBestOf, setSeriesBestOf] = useState<number | null>(null);
  const [seriesTargetWins, setSeriesTargetWins] = useState<number | null>(null);
  
  // 防止重复操作的状态
  const [isJoiningMatchmaking, setIsJoiningMatchmaking] = useState(false);
  // 标识本次是否是用户主动点击了“取消匹配”（用于过滤滞后的 matchFound）
  const didCancelMatchmakingRef = useRef<boolean>(false);
  // 模式独立的昵称
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [randomDisplayName, setRandomDisplayName] = useState<string>('');
  const [privateDisplayName, setPrivateDisplayName] = useState<string>('');
  // 兼容旧代码引用
  const displayName = gameMode === 'private' ? privateDisplayName : randomDisplayName;
  const [hasAskedNameThisGame, setHasAskedNameThisGame] = useState<boolean>(false);
  // 待执行动作：用于在填写昵称后继续原本操作（创建房间/加入房间/加入匹配队列）
  const [pendingAction, setPendingAction] = useState<
    | { type: 'createRoom'; seriesBestOf?: 3 | 5 | 7 }
    | { type: 'joinRoom'; code: string }
    | { type: 'joinMatchmaking' }
    | null
  >(null);

  // 引用保持最新值，避免socket回调闭包中拿到旧值
  const gameModeRef = useRef<GameMode>(gameMode);
  const randomDisplayNameRef = useRef<string>(randomDisplayName);
  const privateDisplayNameRef = useRef<string>(privateDisplayName);
  const hasAskedRef = useRef<boolean>(hasAskedNameThisGame);

  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);
  useEffect(() => { randomDisplayNameRef.current = randomDisplayName; }, [randomDisplayName]);
  useEffect(() => { privateDisplayNameRef.current = privateDisplayName; }, [privateDisplayName]);
  useEffect(() => { hasAskedRef.current = hasAskedNameThisGame; }, [hasAskedNameThisGame]);
  // 记录关键状态的引用，防止异步事件在已返回首页时误触发错误UI
  const roomCodeRef = useRef<string>('');
  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // 调试: 监控gameMode变化
  useEffect(() => {
    console.log('🎮 Game mode changed to:', gameMode);
    // 切换模式时，清理对方模式的临时UI数据，避免等待界面残留
    if (gameMode === 'private') {
      setRandomRoomPlayers([]);
    } else if (gameMode === 'random') {
      setPrivateRoomPlayers([]);
    }
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
      setPrivateRoomCode(data.roomCode);
      console.log('房间已创建:', data.roomCode);
      // 创建成功后，立刻把本地昵称同步到房间（之前可能在未入房时已填写）
      try {
        const name = privateDisplayNameRef.current;
        if (name) {
          socketService.setDisplayName(name);
        }
      } catch {}
    });

    // 房间错误回调（非致命错误，避免全屏错误遮挡UI）
    socketService.onRoomError((data) => {
      console.error('Room error:', data.message);
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
      // 若上一局弹窗仍开着，开局时立即关闭，避免显示“下一题的答案”
      setShowAnswerModal(false);
      setBattleResult(null);
      setWinnerName(null);
      setRoundCountdown(null);
      // 清除最终胜利标记（若有）
      setIsSeriesFinal(false);
      console.log('游戏开始，目标球员:', data.targetPlayer.name);
      // 名称采集已前置到创建/加入房间或匹配前，这里不再强制弹出
    });

    // 房间玩家更新（私房与随机匹配均使用此事件）
    socketService.onRoomPlayersUpdate((data: RoomPlayersUpdate) => {
      if (gameModeRef.current === 'private') {
        setPrivateRoomPlayers(data.players || []);
        privateRoomPlayersRef.current = data.players || [];
        if (data.hostId) setRoomHostId(data.hostId);
        // 如果当前玩家在名单中但没有名称，则补发一次昵称到服务器
        try {
          const myId = socketService.getCurrentSocketId();
          const me = (data.players || []).find(p => p.socketId === myId);
          if (me && !me.displayName && privateDisplayNameRef.current) {
            socketService.setDisplayName(privateDisplayNameRef.current);
          }
        } catch {}
      } else if (gameModeRef.current === 'random') {
        // 随机匹配：只保留双方玩家列表并同步昵称
        const players = (data.players || []).slice(0, 2);
        setRandomRoomPlayers(players);
        randomRoomPlayersRef.current = players;
        try {
          const myId = socketService.getCurrentSocketId();
          const me = players.find(p => p.socketId === myId);
          if (me && !me.displayName && randomDisplayNameRef.current) {
            socketService.setDisplayName(randomDisplayNameRef.current);
          }
        } catch {}
      }
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
        if (typeof series.bestOf === 'number') setSeriesBestOf(series.bestOf);
        if (typeof series.targetWins === 'number') setSeriesTargetWins(series.targetWins);
        // 如果已有最终胜者则结束系列赛，否则等待下一局开始
        const currentId = socketService.getCurrentSocketId();
        const winnerId = data?.winner as string | null;
        // 设置回合胜负用于弹窗
        if (winnerId && currentId) {
          const isWinner = winnerId === currentId;
          setBattleResult(isWinner ? 'win' : 'lose');
          setIsGameWon(isWinner);
          // 记录胜者名称（若可用）
          try {
            const listRef = gameModeRef.current === 'private' ? privateRoomPlayersRef : randomRoomPlayersRef;
            const found = listRef.current.find(p => p.socketId === winnerId);
            setWinnerName(found?.displayName || null);
          } catch {}
        } else {
          setBattleResult(null);
          setIsGameWon(false);
        }
        setGameEndReason('CORRECT_GUESS');
        setShowAnswerModal(true);
        setIsSeriesFinal(Boolean(series.finalWinner));
        if (series.finalWinner) {
          setGameState('finished');
        } else {
          // 保持 playing，等待下一局
        }
      } else {
        setGameState('finished');
      }
      setTargetPlayer(data.targetPlayer);
      console.log('游戏结束事件:', data);
    });

    // 玩家离开回调
    socketService.onPlayerLeft(({ socketId }: { socketId: string }) => {
      // 仅在仍处于房间且不在等待状态时，才展示“对方离开”的提示
      const myId = socketService.getCurrentSocketId();
      const shouldNotify = !!roomCodeRef.current && gameStateRef.current !== 'waiting' && socketId !== myId;
      if (shouldNotify) {
        setError('对方玩家已离开');
      }
      console.log('对方玩家已离开');
    });

    // 匹配队列加入成功回调
    socketService.onMatchmakingJoined(() => {
      // 进入匹配状态前清理取消标记
      didCancelMatchmakingRef.current = false;
      console.log('📥 [客户端] 收到 matchmakingJoined 事件，切换到匹配状态');
      setGameState('matchmaking');
      setIsJoiningMatchmaking(false);
      console.log('✅ [客户端] 已加入匹配队列，当前状态: matchmaking');
    });

    // 匹配队列离开成功回调
    socketService.onMatchmakingLeft(() => {
      setGameState('waiting');
      setIsJoiningMatchmaking(false);
      didCancelMatchmakingRef.current = true; // 标记本次已取消
      console.log('已离开匹配队列');
    });

    // 匹配错误（如未提供昵称）
    socketService.onMatchmakingError((err) => {
      console.warn('⚠️ [客户端] 匹配错误:', err);
      setIsJoiningMatchmaking(false);
      setGameState('waiting');
      if (!randomDisplayNameRef.current) {
        setIsNameModalOpen(true);
      }
    });

    // 匹配成功回调
    socketService.onMatchFound((data) => {
      if (didCancelMatchmakingRef.current || gameStateRef.current !== 'matchmaking') {
        console.warn('⚠️ [客户端] 收到 matchFound 但已不在匹配状态，忽略');
        return;
      }
      console.log('🎉 [客户端] 收到 matchFound 事件:', data);
      console.log('🏠 [客户端] 房间代码:', data.roomCode);
      console.log('🎯 [客户端] 目标球员:', data.targetPlayer.name);
      console.log('🔗 [客户端] Socket连接状态:', socketService.getCurrentSocketId() ? '已连接' : '未连接');
      
      // 先保存房间信息和目标球员，但不改变游戏状态
      setRandomRoomCode(data.roomCode);
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
      if (!data || !data.playersStatus) {
        console.warn('⚠️ [客户端] 收到无效的对战状态更新，忽略');
        return;
      }
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
          // 名称采集已前置到创建/加入房间或匹配前，这里不再弹出
        }
        return data.playersStatus;
      });
      
      setCurrentSocketId(currentId);
      
      // 找到对手状态
      const opponentId = data.playersStatus ? Object.keys(data.playersStatus).find(id => id !== currentId) : undefined;
      if (opponentId) {
        setOpponentStatus(data.playersStatus[opponentId]);
      }

      // 随机匹配房：根据对战状态补齐右侧玩家列表（保证只显示双方）
      try {
        const existing = randomRoomPlayersRef.current || [];
        const selfExisting = existing.find(p => p.socketId === currentId);
        const oppExisting = opponentId ? existing.find(p => p.socketId === opponentId) : undefined;
        const newPlayers = [
          {
            socketId: currentId,
            displayName: (selfExisting && selfExisting.displayName) || (randomDisplayNameRef.current || '')
          },
          ...(opponentId ? [{ socketId: opponentId, displayName: (oppExisting && oppExisting.displayName) || '' }] : [])
        ];
        // 仅当玩家列表不同或为空时更新
        const shouldUpdate = existing.length !== newPlayers.length || newPlayers.some((p, i) => !existing[i] || existing[i].socketId !== p.socketId || existing[i].displayName !== p.displayName);
        if (shouldUpdate) {
          setRandomRoomPlayers(newPlayers);
          randomRoomPlayersRef.current = newPlayers;
        }

      } catch {}
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
        // 记录胜者名字，供失败方显示
        try {
          const wId = data.winner.socketId;
          const listRef = gameModeRef.current === 'private' ? privateRoomPlayersRef : randomRoomPlayersRef;
          const found = listRef.current.find(p => p.socketId === wId);
          // 仅接受玩家手动输入的显示名；无名则保持为 null，不回退到 socketId
          setWinnerName(found && found.displayName ? found.displayName : null);
          setWinnerId(wId);
        } catch (e) {
          setWinnerName(null);
          setWinnerId(data.winner.socketId || null);
        }
      }
      
      // 显示答案模态框
      setShowAnswerModal(true);
    });

    // 系列赛回合倒计时
    socketService.onRoundCountdown((data) => {
      const secs = Number(data?.seconds) || 8;
      setRoundCountdown(secs);
      if (typeof data.nextRound === 'number') setCurrentRound(data.nextRound);
      // 可视化倒计时：确保只创建一个定时器
      let remaining = secs;
      const interval = setInterval(() => {
        remaining -= 1;
        setRoundCountdown((prev) => (remaining >= 0 ? remaining : null));
        if (remaining <= 0) {
          clearInterval(interval);
        }
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
    // 允许未设置昵称也可创建房间（昵称可稍后设置）
    socketService.createRoom(seriesBestOf);
    setGameState('waiting');
    setGuesses(0);
    setGuessHistory([]);
    setIsGameWon(false);
  };

  // 加入多人游戏房间
  const joinRoom = (code: string) => {
    // 允许未设置昵称也可加入房间（昵称可稍后设置）
    socketService.joinRoom(code);
    setPrivateRoomCode(code);
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
      
      // 使用全局状态的 bestOf（默认3）
      const bestOf = randomMatchBestOf;
      
      // 随机匹配逻辑 - 需要昵称后才能加入匹配队列
      if (!randomDisplayNameRef.current) {
        setPendingAction({ type: 'joinMatchmaking' });
        setIsNameModalOpen(true);
        return;
      }
      
      // 已有昵称，开始加入匹配队列并防重
      setIsJoiningMatchmaking(true);
      didCancelMatchmakingRef.current = false;
      // 立即切换到匹配中界面，避免等待连接/服务端回调导致UI不可见
      if (gameStateRef.current === 'waiting') {
        setGameState('matchmaking');
      }

      socketService.joinMatchmaking(bestOf, randomDisplayNameRef.current)
        .then(() => {
          setError('');
          setIsJoiningMatchmaking(false);
          console.log('✅ [客户端] 成功加入匹配队列，已切换到匹配界面');
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
    didCancelMatchmakingRef.current = true;
    socketService.leaveMatchmaking();
    setIsJoiningMatchmaking(false);
    setError('');
  };

  // 关闭答案模态框
  const closeAnswerModal = () => {
    setShowAnswerModal(false);
    setGameState('finished');
  };

  // 重置游戏
  const resetGame = () => {
    // 通知服务器主动离开当前游戏/房间（适用于随机匹配或私房）
    try {
      socketService.leaveCurrentGame(roomCode);
    } catch {}
    
    // 如果正在匹配中，先离开匹配队列
    if (gameState === 'matchmaking') {
      socketService.leaveMatchmaking();
    }
    
    // 先立刻同步引用，避免异步socket事件在返回首页后又设置错误状态
    roomCodeRef.current = '';
    gameStateRef.current = 'waiting';
    // 清空引用型玩家列表，避免后续事件读取到旧名单
    randomRoomPlayersRef.current = [];
    privateRoomPlayersRef.current = [];

    setGameState('waiting');
    setTargetPlayer(null);
    // 清空两种模式的房间码与玩家列表，避免UI残留
    setRandomRoomCode('');
    setPrivateRoomCode('');
    setRandomRoomPlayers([]);
    setPrivateRoomPlayers([]);
    setGuesses(0);
    setGuessHistory([]); // 清理猜测历史
    setIsGameWon(false);
    setError('');
    
    // 重置对战相关状态
    setBattleStatus(null);
    setCurrentSocketId(null);
    setOpponentStatus(null);
    setBattleResult(null);
    setWinnerName(null);
    setWinnerId(null);
    // 系列赛/回合/倒计时清理
    setSeriesWins({});
    setSeriesBestOf(null);
    setSeriesTargetWins(null);
    setIsSeriesFinal(false);
    setCurrentRound(1);
    setRoundCountdown(null);
    
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
    winnerName,
    winnerId,
    seriesWins,
    seriesBestOf,
    seriesTargetWins,
    isSeriesFinal,
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
    closeAnswerModal,
    randomMatchBestOf,
    setRandomMatchBestOf,
    // 新增：模式独立字段暴露
    randomDisplayName,
    setRandomDisplayName,
    privateDisplayName,
    setPrivateDisplayName,
    randomRoomPlayers,
    privateRoomPlayers
  };

  return (
    <GameContext.Provider value={value}>
      {children}
      <NameModal
        isOpen={isNameModalOpen}
        initialName={gameMode === 'private' ? privateDisplayName : randomDisplayName}
        onClose={() => setIsNameModalOpen(false)}
        onConfirm={(name) => {
          if (gameModeRef.current === 'private') {
            setPrivateDisplayName(name);
            // 立即同步 ref，避免后续逻辑读取到旧值
            privateDisplayNameRef.current = name;
            // 私房：入房即同步服务端
            socketService.setDisplayName(name);
          } else if (gameModeRef.current === 'random') {
            setRandomDisplayName(name);
            // 立即同步 ref，避免 startGame 读取旧值导致未入队
            randomDisplayNameRef.current = name;
            // 随机匹配：立即同步服务端，确保昵称正确显示
            socketService.setDisplayName(name);
          } else {
            // 其他模式保留
          }
          setIsNameModalOpen(false);
          // 执行等待中的动作
          if (pendingAction) {
            const action = pendingAction;
            setPendingAction(null);
            if (action.type === 'createRoom') {
              createRoom(action.seriesBestOf);
            } else if (action.type === 'joinRoom') {
              joinRoom(action.code);
            } else if (action.type === 'joinMatchmaking') {
              startGame();
            }
          }
        }}
      />
    </GameContext.Provider>
  );
};