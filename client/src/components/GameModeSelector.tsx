import React from 'react';
import { GameMode } from '../types';
import { useGame } from '../context/GameContext';

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ selectedMode, onSelectMode }) => {
  const { randomMatchBestOf, setRandomMatchBestOf } = useGame();
  return (
    <div className="flex flex-col items-center mb-8 w-full">
      <h2 className="text-2xl font-bold mb-4 w-full" style={{ textAlign: 'center' }}>Select Game Mode</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {/* 🎯 Solo Mode */}
        <div 
          className={`afl-card cursor-pointer ${selectedMode === 'solo' ? 'ring-4 ring-afl-blue' : ''}`}
          onClick={() => onSelectMode('solo')}
        >
          <div className="text-center w-full">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="text-xl font-bold mb-1">Solo Mode</h3>
            <p className="text-gray-600">Try to guess the mystery player in as few attempts as possible</p>
          </div>
        </div>

        {/* ⚔️ Random Match */}
        <div 
          className={`afl-card cursor-pointer ${selectedMode === 'random' ? 'ring-4 ring-afl-blue' : ''}`}
          onClick={() => {
            console.log('🎯 Random Match card clicked!');
            onSelectMode('random');
          }}
        >
          <div className="text-center w-full">
            <div className="text-3xl mb-2">⚔️</div>
            <h3 className="text-xl font-bold mb-1">Random Match</h3>
            <p className="text-gray-600">Match with a random online player and race to guess faster</p>
            {selectedMode === 'random' && (
              <div className="mt-3 flex items-center justify-center gap-2">
                {[3,5,7].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`afl-button ${randomMatchBestOf===n ? 'ring-4 ring-afl-blue' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setRandomMatchBestOf(n as 3|5|7); }}
                  >
                    BO{n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 👥 Private Room */}
        <div 
          className={`afl-card cursor-pointer ${selectedMode === 'private' ? 'ring-4 ring-afl-blue' : ''}`}
          onClick={() => onSelectMode('private')}
        >
          <div className="text-center w-full">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="text-xl font-bold mb-1">Private Room</h3>
            <p className="text-gray-600">Invite friends to play together using a room code</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector;
