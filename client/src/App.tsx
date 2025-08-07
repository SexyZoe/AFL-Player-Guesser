import React from 'react';
import { useGame } from './context/GameContext';
import GameModeSelector from './components/GameModeSelector';
import PlayerList from './components/PlayerList';
import PrivateRoomPanel from './components/PrivateRoomPanel';
import PlayerCard from './components/PlayerCard';
import GameResult from './components/GameResult';
import GuessHistory from './components/GuessHistory';
import BattleStatus from './components/BattleStatus';
import BattleEffects from './components/BattleEffects';
import HowToPlay from './components/HowToPlay';
import AnswerModal from './components/AnswerModal';
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
    showAnswerModal,
    gameEndReason,
    setGameMode,
    startGame,
    createRoom,
    joinRoom,
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
          <button onClick={resetGame} className="afl-button error-button">
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

      <main className="app-main w-full px-4 py-6">
        {gameState === 'waiting' && (
          <>
            <GameModeSelector selectedMode={gameMode} onSelectMode={setGameMode} />
            
            {gameMode === 'private' ? (
              <PrivateRoomPanel
                roomCode={roomCode}
                onCreateRoom={createRoom}
                onJoinRoom={joinRoom}
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
              <h2 className="text-2xl font-bold mb-4 text-center">🔍 寻找对手中...</h2>
              <div className="loading-spinner mx-auto mb-6"></div>
              <p className="text-center text-gray-600 mb-6">
                请稍等，我们正在为您寻找合适的对手
              </p>
              <div className="text-center">
                <button
                  onClick={cancelMatchmaking}
                  className="afl-button cancel-button"
                >
                  取消匹配
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="game-container">
            {gameMode === 'solo' ? (
              /* 单人模式 - 保持原有布局 */
              <>
                {/* 游戏状态信息 */}
                <div className="target-header">
                  <h2 className="target-title">AFL Player Guessing Game</h2>
                  <div className="guesses-counter">
                    <span className="guesses-label">Guesses: </span>
                    <span className="guesses-value">{guesses}/{maxGuesses}</span>
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
                  {battleStatus && currentSocketId && (
                    <BattleStatus
                      currentPlayer={battleStatus[currentSocketId] || null}
                      opponent={opponentStatus}
                      battleResult={battleResult}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'finished' && targetPlayer && (
          <div className="result-container w-full max-w-7xl mx-auto">
            {/* 对战模式最终状态显示 */}
            {gameMode !== 'solo' && battleStatus && currentSocketId && (
              <BattleStatus
                currentPlayer={battleStatus[currentSocketId] || null}
                opponent={opponentStatus}
                battleResult={battleResult}
              />
            )}
            
            <GameResult
              targetPlayer={targetPlayer}
              guesses={gameMode === 'solo' ? guesses : (battleStatus && currentSocketId ? battleStatus[currentSocketId]?.guesses || 0 : 0)}
              isMultiplayer={gameMode !== 'solo'}
              isGameWon={isGameWon}
              onPlayAgain={resetGame}
              battleResult={battleResult}
              opponentGuesses={opponentStatus?.guesses}
            />
            
            {/* 显示最终猜测历史 */}
            <GuessHistory guessHistory={guessHistory} />
          </div>
        )}
      </main>

      <footer className="app-footer w-full py-4 px-4 text-center">
        <p>&copy; {new Date().getFullYear()} AFL Guessing Game | For entertainment purposes only</p>
      </footer>
      
      {/* 答案模态框 */}
      {showAnswerModal && targetPlayer && (
        <AnswerModal
          isOpen={showAnswerModal}
          targetPlayer={targetPlayer}
          onClose={closeAnswerModal}
          gameEndReason={gameEndReason}
          isWinner={battleResult === 'win' || (gameMode === 'solo' && isGameWon)}
          totalGuesses={gameMode === 'solo' ? guesses : (battleStatus && currentSocketId ? battleStatus[currentSocketId]?.guesses || 0 : 0)}
          maxGuesses={maxGuesses}
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