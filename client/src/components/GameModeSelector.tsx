import React from 'react';
import { GameMode } from '../types';

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ selectedMode, onSelectMode }) => {
  return (
    <div className="flex flex-col items-center mb-8">
      <h2 className="text-2xl font-bold mb-4">选择游戏模式</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        <div 
          className={`afl-card text-center cursor-pointer ${selectedMode === 'solo' ? 'ring-4 ring-afl-blue' : ''}`} 
          onClick={() => onSelectMode('solo')}
        >
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="text-xl font-bold mb-1">单人模式</h3>
          <p className="text-gray-600">尝试用最少的猜测次数猜出神秘球员</p>
        </div>
        
        <div 
          className={`afl-card text-center cursor-pointer ${selectedMode === 'random' ? 'ring-4 ring-afl-blue' : ''}`} 
          onClick={() => onSelectMode('random')}
        >
          <div className="text-3xl mb-2">⚔️</div>
          <h3 className="text-xl font-bold mb-1">随机匹配</h3>
          <p className="text-gray-600">与随机在线玩家匹配并比赛谁能更快猜出</p>
        </div>
        
        <div 
          className={`afl-card text-center cursor-pointer ${selectedMode === 'private' ? 'ring-4 ring-afl-blue' : ''}`} 
          onClick={() => onSelectMode('private')}
        >
          <div className="text-3xl mb-2">👥</div>
          <h3 className="text-xl font-bold mb-1">私人房间</h3>
          <p className="text-gray-600">邀请朋友使用代码一起玩</p>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector; 