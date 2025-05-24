import React from 'react';
import { useGame } from './context/GameContext';
import GameModeSelector from './components/GameModeSelector';
import PlayerList from './components/PlayerList';
import PrivateRoomPanel from './components/PrivateRoomPanel';
import PlayerCard from './components/PlayerCard';
import GameResult from './components/GameResult';
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
    setGameMode,
    startGame,
    createRoom,
    joinRoom,
    guessPlayer,
    resetGame
  } = useGame();

  // 加载状态
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">出现错误</h2>
          <p>{error}</p>
          <button onClick={resetGame} className="afl-button error-button">
            重新开始
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">AFL猜猜谁</h1>
        <p className="app-subtitle">猜出神秘的澳式足球球员！</p>
      </header>

      <main className="app-main">
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
                  onClick={startGame}
                  className="afl-button start-button"
                >
                  {gameMode === 'solo' ? '开始游戏' : '寻找对手'}
                </button>
              </div>
            )}
          </>
        )}

        {gameState === 'playing' && targetPlayer && (
          <div className="game-container">
            <div className="target-container">
              <div className="target-header">
                <h2 className="target-title">猜出神秘球员</h2>
                <div className="guesses-counter">
                  <span className="guesses-label">猜测次数: </span>
                  <span className="guesses-value">{guesses}</span>
                </div>
              </div>
              
              <div className="target-card">
                <PlayerCard player={targetPlayer} revealed={false} />
              </div>
            </div>

            <PlayerList 
              players={players} 
              onSelectPlayer={(player) => guessPlayer(player.id)} 
            />
          </div>
        )}

        {gameState === 'finished' && targetPlayer && (
          <GameResult
            targetPlayer={targetPlayer}
            guesses={guesses}
            isMultiplayer={gameMode !== 'solo'}
            onPlayAgain={resetGame}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} AFL猜谜游戏 | 纯娱乐目的使用</p>
      </footer>
    </div>
  );
};

export default App; 