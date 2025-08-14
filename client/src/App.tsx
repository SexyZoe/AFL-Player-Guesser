import React from 'react';
import { useGame } from './context/GameContext';
import GameModeSelector from './components/GameModeSelector';
import PlayerList from './components/PlayerList';
import PrivateRoomPanel from './components/PrivateRoomPanel';
import PlayerCard from './components/PlayerCard';
import GameResult from './components/GameResult';
import GuessHistory from './components/GuessHistory';
import BattleStatus from './components/BattleStatus';
import RoomSidebar from './components/RoomSidebar';
<<<<<<< Updated upstream
import BattleEffects from './components/BattleEffects';
import HowToPlay from './components/HowToPlay';
import AnswerModal from './components/AnswerModal';
=======
// TopNavbar 已移除导航显示，留作未来需要时启用
import MinimalSocialIcons from './components/MinimalSocialIcons';
import { useGame } from './context/GameContext';
>>>>>>> Stashed changes
import type { GameEndReason } from './types';
import './App.css';

const App: React.FC = () => {
  const {
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
     seriesWins,
     seriesBestOf,
     seriesTargetWins,
     isSeriesFinal,
    // 由于上下文未暴露 seriesWins，这里通过本地状态从 battleStatus 推导暂不显示胜场，
    // 后续在 gameOver 系列赛事件中已更新 context 内部seriesWins，将在此传入占位 {}
    // 暂不直接暴露 hostId，先在面板中仅用是否可开始逻辑控制
    roundCountdown,
    winnerName,
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
  } = useGame();

  // 加载状态
  if (loading) {
    return (
      <div className="loading-container w-full h-screen flex items-center justify-center">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="error-container w-full h-screen flex items-center justify-center">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => {
              try { resetGame(); } catch {}
              if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
              }
            }}
            className="afl-button error-button"
          >
            Restart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container w-full min-h-screen">
      <header className="app-header w-full py-6 px-4 text-center">
        <h1 className="app-title text-4xl font-bold">AFL Guess Who</h1>
        <p className="app-subtitle text-xl">Guess the mystery AFL player!</p>
        <HowToPlay />
      </header>

      <div style={{ position: 'fixed', top: 8, right: 16, zIndex: 9999 }}>
        <MinimalSocialIcons
          githubUrl="https://github.com/SexyZoe/AFL-Player-Guesser"
          linkedinUrl="https://www.linkedin.com/in/liu-yingqi-a19ba7175/"
        />
      </div>

      <main className="app-main w-full px-4 py-6">
        {gameState === 'waiting' && (
          <>
            <GameModeSelector selectedMode={gameMode} onSelectMode={setGameMode} />
            
            {gameMode === 'private' ? (
              <PrivateRoomPanel
                roomCode={roomCode}
                onCreateRoom={createRoom}
                onJoinRoom={joinRoom}
                onStartGame={startPrivateRoomGame}
                  players={roomPlayers}
                  playersStatus={battleStatus}
                  currentSocketId={currentSocketId}
                hostId={roomHostId}
              />
            ) : (
              <div className="start-button-container">
                <button
                  onClick={() => {
                    console.log('🔘 Start/Find Opponent button clicked!');
                    startGame();
                  }}
                  className="afl-button start-button"
                >
                  {gameMode === 'solo' ? 'Start Game' : 'Find Opponent'}
                </button>
              </div>
            )}
          </>
        )}

        {gameState === 'matchmaking' && (
          <div className="matchmaking-container">
            <div className="matchmaking-content">
              <h2 className="text-2xl font-bold mb-4 text-center">🔍 Finding Opponent...</h2>
              <div className="loading-spinner mx-auto mb-6"></div>
              <p className="text-center text-gray-600 mb-6">
                Please wait while we find a suitable opponent for you
              </p>
              <div className="text-center">
                <button
                  onClick={cancelMatchmaking}
                  className="afl-button cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="game-container">
            {/* 系列赛回合倒计时（简单占位，可后续美化） */}
            {/* TODO: 可移动到更合适的区域或组件化 */}
            {gameMode === 'solo' ? (
              /* 单人模式 - 保持原有布局 */
              <>
                {/* 游戏状态信息 */}
                <div className="target-header">
                  <h2 className="target-title">AFL Player Guessing Game</h2>
                  <div className="header-controls">
                    <div className="guesses-counter">
                      <span className="guesses-label">Guesses: </span>
                      <span className="guesses-value">{guesses}/{maxGuesses}</span>
                    </div>
                    <button
                      onClick={resetGame}
                      className="home-button-small"
                      title="Return to Home"
                    >
                      🏠
                    </button>
                  </div>
                </div>
                
                {/* 玩家选择区域 */}
                <div className="player-list-container">
                  <PlayerList 
                    players={players} 
                    onSelectPlayer={(player) => guessPlayer(player)} 
                  />
                </div>
                
                {/* 显示猜测历史 */}
                <GuessHistory guessHistory={guessHistory} />
              </>
            ) : (
              /* 对战模式 - 新的左右并排布局 */
              <div className="battle-layout">
                {/* 左侧主游戏区域 (70%) */}
                <div className="main-game-area">
                  {/* 游戏状态信息 */}
                  <div className="target-header">
                    <h2 className="target-title">⚔️ Battle Guess Player</h2>
                    <button
                      onClick={resetGame}
                      className="home-button-small"
                      title="Return to Home"
                    >
                      🏠
                    </button>
                  </div>
                  
                  {/* 玩家选择区域 */}
                  <div className="player-list-container">
                    <PlayerList 
                      players={players} 
                      onSelectPlayer={(player) => guessPlayer(player)} 
                    />
                  </div>
                  
                  {/* 显示猜测历史 */}
                  <GuessHistory guessHistory={guessHistory} />
                </div>

                {/* 右侧对战状态区域 (30%) */}
                <div className="battle-sidebar">
                  <RoomSidebar
                    players={roomPlayers}
                    playersStatus={battleStatus}
                    currentSocketId={currentSocketId}
                    seriesWins={{}}
                    maxSlots={gameMode === 'random' ? 2 : 4}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'finished' && targetPlayer && (
          <div className="result-container w-full max-w-7xl mx-auto">
      {/* 多人模式：移除 1v1 Battle Mode 展示，仅展示系列赛总榜 */}
            <GameResult
              targetPlayer={targetPlayer}
              guesses={gameMode === 'solo' ? guesses : (battleStatus && currentSocketId ? battleStatus[currentSocketId]?.guesses || 0 : 0)}
              isMultiplayer={gameMode !== 'solo'}
              isGameWon={isGameWon}
              battleResult={battleResult}
              opponentGuesses={opponentStatus?.guesses}
              roomPlayers={roomPlayers}
              playersStatus={battleStatus || null}
              seriesWins={seriesWins}
              seriesBestOf={seriesBestOf}
              seriesTargetWins={seriesTargetWins}
              winnerName={winnerName}
              isSeriesFinal={Boolean(isSeriesFinal)}
            />
            
            {/* 显示最终猜测历史 */}
            <GuessHistory guessHistory={guessHistory} />
            
            {/* 返回主页按钮 */}
            <div className="text-center mt-6">
              <button
                onClick={resetGame}
                className="afl-button home-button"
              >
                🏠 Return to Home
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer w-full py-4 px-4 text-center">
        <p>&copy; {new Date().getFullYear()} AFL Guessing Game | For entertainment purposes only</p>
      </footer>
      
      {/* 回合倒计时横幅 */}
      {roundCountdown !== null && roundCountdown > 0 && gameState === 'playing' && (
        <div className="round-countdown-banner">
          Next round starts in {roundCountdown}s
        </div>
      )}

      {/* 答案模态框 */}
      {showAnswerModal && targetPlayer && (
        <AnswerModal
          isOpen={showAnswerModal}
          targetPlayer={targetPlayer}
          onClose={closeAnswerModal}
          gameEndReason={gameEndReason as GameEndReason}
          isWinner={battleResult === 'win' || (gameMode === 'solo' && isGameWon)}
          totalGuesses={gameMode === 'solo' ? guesses : (battleStatus && currentSocketId ? battleStatus[currentSocketId]?.guesses || 0 : 0)}
          maxGuesses={maxGuesses}
          winnerName={battleResult === 'lose' ? (winnerName || undefined) : undefined}
        />
      )}
      
      {/* 对战特效 */}
      <BattleEffects 
        battleResult={battleResult} 
        isVisible={gameState === 'finished' && gameMode !== 'solo'} 
      />
    </div>
  );
};

export default App; 