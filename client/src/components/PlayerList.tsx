import React, { useState } from 'react';
import { Player } from '../types';
import PlayerCard from './PlayerCard';

interface PlayerListProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onSelectPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  // 获取所有球队
  const teams = Array.from(new Set(players.map(player => player.team))).sort();
  
  // 获取所有位置
  const positions = Array.from(new Set(players.map(player => player.position))).sort();

  // 过滤球员
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam ? player.team === filterTeam : true;
    const matchesPosition = filterPosition ? player.position === filterPosition : true;
    return matchesSearch && matchesTeam && matchesPosition;
  });

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">选择球员</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <input
            type="text"
            placeholder="搜索球员名..."
            className="afl-input flex-grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="afl-input"
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          >
            <option value="">所有球队</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
          <select
            className="afl-input"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
          >
            <option value="">所有位置</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={() => onSelectPlayer(player)}
            />
          ))
        ) : (
          <div className="col-span-full text-center">
            <p className="text-gray-500">没有找到匹配的球员</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerList; 