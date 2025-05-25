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
      'Adelaide': 'from-yellow-500 to-red-600',
      'Brisbane': 'from-red-500 to-amber-400',
      'Carlton': 'from-blue-600 to-blue-800',
      'Collingwood': 'from-gray-800 to-black',
      'Essendon': 'from-red-600 to-black',
      'Fremantle': 'from-purple-600 to-purple-800',
      'Geelong': 'from-blue-500 to-blue-700',
      'Gold Coast': 'from-red-400 to-yellow-400',
      'GWS': 'from-orange-500 to-orange-700',
      'Hawthorn': 'from-amber-600 to-brown-600',
      'Melbourne': 'from-red-500 to-blue-700',
      'North Melbourne': 'from-blue-600 to-blue-800',
      'Port Adelaide': 'from-teal-500 to-teal-700',
      'Richmond': 'from-yellow-400 to-yellow-600',
      'St Kilda': 'from-red-500 to-red-700',
      'Sydney': 'from-red-500 to-red-700',
      'West Coast': 'from-blue-700 to-yellow-400',
      'Western Bulldogs': 'from-red-500 to-blue-600',
    };
    
    // 获取球队名的第一部分
    const teamFirstWord = team?.split(' ')[0] || '';
    
    return teamColors[teamFirstWord] || teamColors[team] || 'from-gray-500 to-gray-700';
  };

  return (
    <div 
      className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-105 h-full bg-white"
      onClick={onClick}
      style={{ minHeight: '400px' }}
    >
      {/* 球队颜色渐变背景 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getTeamColor(player.team || '')}`} style={{opacity: 0.15}}></div>
      
      {/* 装饰性边框 */}
      <div className="absolute inset-0 rounded-2xl border-2 border-white border-opacity-20"></div>
      
      <div className="relative p-8 h-full flex flex-col">
        {/* 神秘玩家标识 */}
        {!revealed && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            🔮 Mystery
          </div>
        )}
        
        {/* 球员名字和号码 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-3xl font-bold text-gray-800 leading-tight">
              {revealed ? player.name : 'Mystery Player'}
            </h3>
            {!revealed && (
              <p className="text-gray-600 mt-2 text-lg">Can you guess who this is?</p>
            )}
          </div>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-2xl font-bold py-2 px-4 rounded-xl shadow-lg">
            #{renderHiddenInfo(String(player.number || 'N/A'))}
          </div>
        </div>
        
        {/* 球队和位置 */}
        <div className="mb-6 flex gap-3">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md flex-1">
            <div className="text-gray-500 text-sm font-medium">Team</div>
            <div className="font-bold text-lg text-gray-800">{renderHiddenInfo(player.team || 'N/A')}</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md flex-1">
            <div className="text-gray-500 text-sm font-medium">Position</div>
            <div className="font-bold text-lg text-gray-800">{renderHiddenInfo(player.position || 'N/A')}</div>
          </div>
        </div>
        
        {/* 球员属性 */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-4 shadow-md text-center transform hover:scale-105 transition-transform duration-200">
            <div className="text-gray-500 text-sm font-medium mb-1">Age</div>
            <div className="font-bold text-2xl text-gray-800">{renderHiddenInfo(String(player.age || 'N/A'))}</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-4 shadow-md text-center transform hover:scale-105 transition-transform duration-200">
            <div className="text-gray-500 text-sm font-medium mb-1">Height</div>
            <div className="font-bold text-2xl text-gray-800">{renderHiddenInfo(formatHeight(player.height))}</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-4 shadow-md text-center transform hover:scale-105 transition-transform duration-200">
            <div className="text-gray-500 text-sm font-medium mb-1">Weight</div>
            <div className="font-bold text-2xl text-gray-800">{renderHiddenInfo(formatWeight(player.weight))}</div>
          </div>
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-4 shadow-md text-center transform hover:scale-105 transition-transform duration-200">
            <div className="text-gray-500 text-sm font-medium mb-1">Games</div>
            <div className="font-bold text-2xl text-gray-800">{renderHiddenInfo(String(player.games || player.gamesPlayed || 0))}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard; 