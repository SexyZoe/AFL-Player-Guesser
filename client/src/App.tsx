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
import Legal from './components/Legal';
import type { GameEndReason } from './types';
import './App.css';

const App: React.FC = () => {
  const [isLegalPage, setIsLegalPage] = React.useState<boolean>(
    typeof window !== 'undefined' && window.location && window.location.hash.startsWith('#/legal')
  );
  React.useEffect(() => {
    const handleHashChange = () => {
      setIsLegalPage(typeof window !== 'undefined' && window.location && window.location.hash.startsWith('#/legal'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  if (isLegalPage) {
    return (
      <div className="app-container w-full min-h-screen">
        <header className="app-header w-full py-6 px-4 text-center">
          <h1 className="app-title text-4xl font-bold">AFL Guess Who</h1>
          <p className="app-subtitle text-xl">Legal & Policies</p>
        </header>
        <main className="app-main w-full px-4 py-6">
          <Legal />
        </main>
        <footer className="app-footer w-full py-4 px-4 text-center">
          <p>&copy; {new Date().getFullYear()} AFL Guessing Game | For entertainment purposes only</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-container w-full min-h-screen">
      <header className="app-header w-full py-6 px-4 text-center">
        <h1 className="app-title text-4xl font-bold">AFL Guess Who</h1>
        <p className="app-subtitle text-xl">Guess the mystery AFL player!</p>
        {/* Star hint moved below the Start Game button */}
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
                <div className="text-center mt-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="text-sm text-gray-700">If you enjoy this project, please ⭐ star it on</span>
                  <a href="https://github.com/SexyZoe/AFL-Player-Guesser" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository" title="GitHub Repository" style={{ display: 'inline-flex' }}>
                    <svg width="20" height="20" viewBox="71 71 370 370" aria-label="GitHub" role="img">
                      <path d="M256 70.7c-102.6 0-185.9 83.2-185.9 185.9 0 82.1 53.3 151.8 127.1 176.4 9.3 1.7 12.3-4 12.3-8.9V389.4c-51.7 11.3-62.5-21.9-62.5-21.9 -8.4-21.5-20.6-27.2-20.6-27.2 -16.9-11.5 1.3-11.3 1.3-11.3 18.7 1.3 28.5 19.2 28.5 19.2 16.6 28.4 43.5 20.2 54.1 15.4 1.7-12 6.5-20.2 11.8-24.9 -41.3-4.7-84.7-20.6-84.7-91.9 0-20.3 7.3-36.9 19.2-49.9 -1.9-4.7-8.3-23.6 1.8-49.2 0 0 15.6-5 51.1 19.1 14.8-4.1 30.7-6.2 46.5-6.3 15.8 0.1 31.7 2.1 46.6 6.3 35.5-24 51.1-19.1 51.1-19.1 10.1 25.6 3.8 44.5 1.8 49.2 11.9 13 19.1 29.6 19.1 49.9 0 71.4-43.5 87.1-84.9 91.7 6.7 5.8 12.8 17.1 12.8 34.4 0 24.9 0 44.9 0 51 0 4.9 3 10.7 12.4 8.9 73.8-24.6 127-94.3 127-176.4C441.9 153.9 358.6 70.7 256 70.7z"/>
                    </svg>
                  </a>
                  <span className="text-sm text-gray-700">— it's the best encouragement!</span>
                </div>
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
        <p className="mt-2">
          <a href="#/legal" className="text-blue-600 underline">Privacy Policy & Disclaimer</a>
        </p>
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