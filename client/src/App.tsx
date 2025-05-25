import React from 'react';
import { useGame } from './context/GameContext';
import GameModeSelector from './components/GameModeSelector';
import PlayerList from './components/PlayerList';
import PrivateRoomPanel from './components/PrivateRoomPanel';
import PlayerCard from './components/PlayerCard';
import GameResult from './components/GameResult';
import GuessHistory from './components/GuessHistory';
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
                  onClick={startGame}
                  className="afl-button start-button"
                >
                  {gameMode === 'solo' ? 'Start Game' : 'Find Opponent'}
                </button>
              </div>
            )}
          </>
        )}

        {gameState === 'playing' && targetPlayer && (
          <div className="game-container">
            <div className="target-container">
              <div className="target-header">
                <h2 className="target-title">Guess the Mystery Player</h2>
                <div className="guesses-counter">
                  <span className="guesses-label">Guesses: </span>
                  <span className="guesses-value">{guesses}/{maxGuesses}</span>
                </div>
              </div>
              
              <div className="target-card">
                <PlayerCard player={targetPlayer} revealed={false} />
              </div>
              
              {/* 游戏规则说明 */}
              <div className="game-rules mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-bold mb-2">Game Rules</h3>
                <ul className="text-sm">
                  <li>🟩 Green = Exact Match</li>
                  <li>🟧 Orange = Close Match</li>
                  <li>⬜ Blank = Not a Match</li>
                  <li>↑ Target value is higher</li>
                  <li>↓ Target value is lower</li>
                </ul>
              </div>
              
              {/* 显示猜测历史 */}
              <GuessHistory guessHistory={guessHistory} />
            </div>

            <div className="player-list-container flex-1">
              <PlayerList 
                players={players} 
                onSelectPlayer={(player) => guessPlayer(player)} 
              />
            </div>
          </div>
        )}

        {gameState === 'finished' && targetPlayer && (
          <div className="result-container w-full max-w-7xl mx-auto">
            <GameResult
              targetPlayer={targetPlayer}
              guesses={guesses}
              isMultiplayer={gameMode !== 'solo'}
              onPlayAgain={resetGame}
            />
            
            {/* 显示最终猜测历史 */}
            <GuessHistory guessHistory={guessHistory} />
          </div>
        )}
      </main>

      <footer className="app-footer w-full py-4 px-4 text-center">
        <p>&copy; {new Date().getFullYear()} AFL Guessing Game | For entertainment purposes only</p>
      </footer>
    </div>
  );
};

export default App; 