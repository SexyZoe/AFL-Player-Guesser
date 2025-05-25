import React from 'react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  revealed?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, revealed = true }) => {
  // 只显示部分信息，以保持神秘感
  const renderHiddenInfo = (text: string) => {
    return revealed ? text : '???';
  };

  // 格式化身高体重，避免单位重复
  const formatHeight = (height: string | number | undefined | null) => {
    if (height === undefined || height === null) return 'N/A';
    if (typeof height === 'number') return `${height}cm`;
    return height.endsWith('cm') ? height : `${height}cm`;
  };

  const formatWeight = (weight: string | number | undefined | null) => {
    if (weight === undefined || weight === null) return 'N/A';
    if (typeof weight === 'number') return `${weight}kg`;
    return weight.endsWith('kg') ? weight : `${weight}kg`;
  };

  // 获取球队的颜色
  const getTeamColor = (team: string): string => {
    const teamColors: Record<string, string> = {
      'Adelaide': 'from-yellow-600 to-red-700',
      'Brisbane': 'from-red-600 to-amber-500',
      'Carlton': 'from-blue-700 to-blue-900',
      'Collingwood': 'from-black to-gray-700',
      'Essendon': 'from-red-700 to-black',
      'Fremantle': 'from-purple-700 to-white',
      'Geelong': 'from-blue-600 to-white',
      'Gold Coast': 'from-red-500 to-yellow-500',
      'GWS': 'from-orange-600 to-white',
      'Hawthorn': 'from-amber-700 to-brown-700',
      'Melbourne': 'from-red-600 to-blue-800',
      'North Melbourne': 'from-blue-700 to-white',
      'Port Adelaide': 'from-teal-600 to-black',
      'Richmond': 'from-yellow-500 to-black',
      'St Kilda': 'from-red-600 to-black',
      'Sydney': 'from-red-600 to-white',
      'West Coast': 'from-blue-800 to-yellow-500',
      'Western Bulldogs': 'from-red-600 to-blue-700',
    };
    
    // 获取球队名的第一部分
    const teamFirstWord = team?.split(' ')[0] || '';
    
    return teamColors[teamFirstWord] || teamColors[team] || 'from-gray-600 to-gray-800';
  };

  return (
    <div 
      className="relative rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 h-full"
      onClick={onClick}
    >
      {/* 球队颜色渐变背景 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getTeamColor(player.team || '')}`} style={{opacity: 0.2}}></div>
      
      <div className="relative p-6">
        {/* 球员名字和号码 */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800">
            {revealed ? player.name : 'Mystery Player'}
          </h3>
          <div className="bg-gray-800 text-white text-xl font-bold py-1 px-3 rounded-lg">
            #{renderHiddenInfo(String(player.number || 'N/A'))}
          </div>
        </div>
        
        {/* 球队和位置 */}
        <div className="mb-4 flex justify-between items-center">
          <div className="bg-white bg-opacity-70 px-3 py-1 rounded-lg">
            <span className="font-bold">{renderHiddenInfo(player.team || 'N/A')}</span>
          </div>
          <div className="bg-gray-100 px-3 py-1 rounded-lg">
            <span>{renderHiddenInfo(player.position || 'N/A')}</span>
          </div>
        </div>
        
        {/* 球员属性 */}
        <div className="grid grid-cols-2 gap-4 mt-4 text-center">
          <div className="bg-white bg-opacity-75 rounded-lg p-2">
            <div className="text-gray-500 text-sm">Age</div>
            <div className="font-bold text-lg">{renderHiddenInfo(String(player.age || 'N/A'))}</div>
          </div>
          <div className="bg-white bg-opacity-75 rounded-lg p-2">
            <div className="text-gray-500 text-sm">Height</div>
            <div className="font-bold text-lg">{renderHiddenInfo(formatHeight(player.height))}</div>
          </div>
          <div className="bg-white bg-opacity-75 rounded-lg p-2">
            <div className="text-gray-500 text-sm">Weight</div>
            <div className="font-bold text-lg">{renderHiddenInfo(formatWeight(player.weight))}</div>
          </div>
          <div className="bg-white bg-opacity-75 rounded-lg p-2">
            <div className="text-gray-500 text-sm">Games</div>
            <div className="font-bold text-lg">{renderHiddenInfo(String(player.games || player.gamesPlayed || 0))}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard; 