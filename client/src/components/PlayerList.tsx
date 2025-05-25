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
      <div className="mb-8 text-center">
        <div className="mb-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Select Player</h2>
          <p className="text-gray-600 text-lg">Choose a player to make your guess</p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <span className="text-gray-400 text-2xl">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search players by name..."
            className="w-full pl-16 pr-12 py-5 text-xl border-2 border-gray-200 rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-400 focus:outline-none transition-all duration-300 bg-white hover:shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-400 hover:text-red-500 transition-colors duration-200"
              onClick={() => setSearchTerm('')}
            >
              <span className="text-2xl font-bold">✕</span>
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="mt-4 inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
            <span className="text-lg font-medium">
              {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
            </span>
          </div>
        )}
      </div>

      {/* 球员卡片展示区域 */}
      {searchTerm ? (
        <div className="max-h-[700px] overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <div 
                  className="h-full transform transition-all duration-300 hover:scale-105" 
                  key={player.id}
                >
                  <div className="h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
                    <div className="p-4 h-full flex flex-col">
                      {/* 玩家名字 */}
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 leading-tight">
                        {player.name}
                      </h3>
                      
                      {/* 球队和号码 */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                          {player.team}
                        </span>
                        <span className="text-sm font-bold text-white bg-gray-800 px-2 py-1 rounded-lg">
                          #{player.number}
                        </span>
                      </div>
                      
                      {/* 基本信息 */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4 flex-1">
                        <div>
                          <span className="font-medium">Position:</span>
                          <div className="font-bold text-gray-800">{player.position}</div>
                        </div>
                        <div>
                          <span className="font-medium">Age:</span>
                          <div className="font-bold text-gray-800">{player.age}</div>
                        </div>
                      </div>
                      
                      {/* 选择按钮 */}
                      <button
                        onClick={() => onSelectPlayer(player)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-inner">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-2xl font-medium">No matching players found</p>
                <p className="text-gray-400 text-lg mt-2">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-200">
          <div className="text-6xl mb-4">⌨️</div>
          <p className="text-gray-600 text-2xl font-medium mb-2">Start typing to search players</p>
          <p className="text-gray-500 text-lg">Enter a player's name to see available options</p>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
