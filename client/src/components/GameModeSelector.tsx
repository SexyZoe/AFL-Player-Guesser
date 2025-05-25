import React from 'react';
import { GameMode } from '../types';

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ selectedMode, onSelectMode }) => {
  return (
    <div className="flex flex-col items-center mb-8">
      <h2 className="text-2xl font-bold mb-4">Select Game Mode</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        <div 
          className={`afl-card text-center cursor-pointer ${selectedMode === 'solo' ? 'ring-4 ring-afl-blue' : ''}`} 
          onClick={() => onSelectMode('solo')}
        >
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="text-xl font-bold mb-1">Solo Mode</h3>
          <p className="text-gray-600">Try to guess the mystery player in as few attempts as possible</p>
        </div>
        
        <div 
          className={`afl-card text-center cursor-pointer ${selectedMode === 'random' ? 'ring-4 ring-afl-blue' : ''}`} 
          onClick={() => onSelectMode('random')}
        >
          <div className="text-3xl mb-2">⚔️</div>
          <h3 className="text-xl font-bold mb-1">Random Match</h3>
          <p className="text-gray-600">Match with a random online player and race to guess faster</p>
        </div>
        
        <div 
          className={`afl-card text-center cursor-pointer ${selectedMode === 'private' ? 'ring-4 ring-afl-blue' : ''}`} 
          onClick={() => onSelectMode('private')}
        >
          <div className="text-3xl mb-2">👥</div>
          <h3 className="text-xl font-bold mb-1">Private Room</h3>
          <p className="text-gray-600">Invite friends to play together using a room code</p>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector; 