import React, { useState, useRef } from 'react';
import { Player } from '../types';
import PlayerCard from './PlayerCard';

interface PlayerListProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onSelectPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* 搜索区域 */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Select Player</h2>

        <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <span className="text-gray-400 text-xl">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search players by name..."
            className="w-full pl-14 pr-10 py-4 text-xl border-2 border-gray-300 rounded-2xl shadow focus:ring-4 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm('')}
            >
              <span className="text-xl">✕</span>
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="text-lg text-gray-600 mt-3">
            {filteredPlayers.length} players found
          </div>
        )}
      </div>

      {/* 球员卡片展示区域（有滚动限制） */}
      {searchTerm ? (
        <div className="max-h-[600px] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <div className="h-full" key={player.id}>
                  <PlayerCard
                    player={player}
                    onClick={() => onSelectPlayer(player)}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
                <p className="text-gray-500 text-2xl">No matching players found</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 text-lg italic">
          Start typing to search players...
        </div>
      )}
    </div>
  );
};

export default PlayerList;
