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
import BattleEffects from './components/BattleEffects';
import HowToPlay from './components/HowToPlay';
import AnswerModal from './components/AnswerModal';
import MinimalSocialIcons from './components/MinimalSocialIcons';
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
    // seriesWins is not exposed directly by context here; do not display win counts for now.
    // In gameOver (series) events, context updates its internal seriesWins; pass placeholder {} here.
    // hostId is intentionally not exposed; the panel uses simple eligibility logic instead.
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

  // Loading state
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

  // Error state
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
          qrUrl="https://guessfooty.up.railway.app/"
          shareUrl="https://guessfooty.up.railway.app/"
          shareTitle="AFL Guess Who"
          shareText="Come and play AFL Guess Who！"
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
            {/* Series round countdown (simple placeholder; can be styled later) */}
            {/* TODO: Consider moving to a dedicated component/position */}
            {gameMode === 'solo' ? (
              /* Solo mode - keep original layout */
              <>
                {/* Game status header */}
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
                
                {/* Player selection area */}
                <div className="player-list-container">
                  <PlayerList 
                    players={players} 
                    onSelectPlayer={(player) => guessPlayer(player)} 
                  />
                </div>
                
                {/* Guess history */}
                <GuessHistory guessHistory={guessHistory} />
              </>
            ) : (
              /* Versus mode - new side-by-side layout */
              <div className="battle-layout">
                {/* Left main game area (70%) */}
                <div className="main-game-area">
                  {/* Game status header */}
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
                  
                  {/* Player selection area */}
                  <div className="player-list-container">
                    <PlayerList 
                      players={players} 
                      onSelectPlayer={(player) => guessPlayer(player)} 
                    />
                  </div>
                  
                  {/* Guess history */}
                  <GuessHistory guessHistory={guessHistory} />
                </div>

                {/* Right-side battle status area (30%) */}
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
      {/* Multiplayer: remove 1v1 Battle Mode view, only show series leaderboard */}
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
            
            {/* Final guess history */}
            <GuessHistory guessHistory={guessHistory} />
            
            {/* Back to home button */}
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
      
      {/* Round countdown banner */}
      {roundCountdown !== null && roundCountdown > 0 && gameState === 'playing' && (
        <div className="round-countdown-banner">
          Next round starts in {roundCountdown}s
        </div>
      )}

      {/* Answer modal */}
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
      
      {/* Battle effects */}
      <BattleEffects 
        battleResult={battleResult} 
        isVisible={gameState === 'finished' && gameMode !== 'solo'} 
      />
    </div>
  );
};

export default App; 