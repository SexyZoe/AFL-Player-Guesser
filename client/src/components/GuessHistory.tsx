import React from 'react';
import { GuessHistoryItem, ComparisonResult, ComparisonDirection } from '../types';

interface GuessHistoryProps {
  guessHistory: GuessHistoryItem[];
}

// 获取比较结果的CSS类名
const getComparisonClass = (result: ComparisonResult): string => {
  switch (result) {
    case 'correct':
      return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg font-bold';
    case 'close':
      return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg font-bold';
    default:
      return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium border border-gray-300';
  }
};

// 获取方向指示器
const getDirectionIndicator = (direction: ComparisonDirection): string => {
  switch (direction) {
    case 'higher':
      return '↑';
    case 'lower':
      return '↓';
    case 'equal':
      return '✓';
    default:
      return '';
  }
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

const GuessHistory: React.FC<GuessHistoryProps> = ({ guessHistory }) => {
  if (guessHistory.length === 0) {
    return (
      <div className="mt-6 text-center py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-dashed border-blue-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5"></div>
        <div className="relative z-10">
          <div className="text-6xl mb-4 animate-pulse">🎯</div>
          <p className="text-gray-600 text-xl font-bold mb-2">Make your first guess to see results</p>
          <p className="text-gray-500 text-base">Your guessing history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Tailwind 测试元素 */}
      <div className="bg-red-500 text-white p-4 font-bold mb-4 rounded-lg">
        Tailwind Test - 如果你看到红底白字，说明Tailwind CSS已正常工作！
      </div>
      
      <div className="mb-6 flex items-center gap-4">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Guess History</h3>
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-xl text-sm font-bold border border-blue-200 shadow-sm">
          {guessHistory.length} guess{guessHistory.length !== 1 ? 'es' : ''}
        </div>
      </div>
      
      {/* 图例 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">Exact Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-500 rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">Close Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-100 border border-gray-300 rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">Not a Match</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">↑ Higher</span>
            <span className="text-gray-700 font-medium">↓ Lower</span>
            <span className="text-gray-700 font-medium">✓ Correct</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-blue-50 border-b border-gray-300">
                <th className="py-5 px-6 text-left font-bold text-gray-800 text-base">Player</th>
                <th className="py-5 px-6 text-center font-bold text-gray-800 text-base">Team</th>
                <th className="py-5 px-6 text-center font-bold text-gray-800 text-base">Number</th>
                <th className="py-5 px-6 text-center font-bold text-gray-800 text-base">Position</th>
                <th className="py-5 px-6 text-center font-bold text-gray-800 text-base">Age</th>
                <th className="py-5 px-6 text-center font-bold text-gray-800 text-base">Height</th>
                <th className="py-5 px-6 text-center font-bold text-gray-800 text-base">Weight</th>
                <th className="py-5 px-6 text-center font-bold text-gray-800 text-base">Games</th>
              </tr>
            </thead>
            <tbody>
              {guessHistory.map((guess, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                  <td className="py-5 px-6">
                    <div className="font-bold text-gray-800 text-base">{guess.player.name}</div>
                    <div className="text-sm text-gray-600 mt-1 font-medium">Guess #{index + 1}</div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className={`py-3 px-4 rounded-xl text-sm transition-all duration-300 ${getComparisonClass(guess.comparison.team)}`}>
                      {guess.player.team}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className={`py-3 px-4 rounded-xl text-sm transition-all duration-300 ${getComparisonClass(guess.comparison.number)}`}>
                      {guess.player.number}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className={`py-3 px-4 rounded-xl text-sm transition-all duration-300 ${getComparisonClass(guess.comparison.position)}`}>
                      {guess.player.position}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className={`py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 ${getComparisonClass(guess.comparison.age)}`}>
                      <span>{guess.player.age}</span>
                      <span className="text-base font-bold">{getDirectionIndicator(guess.direction.age)}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className={`py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 ${getComparisonClass(guess.comparison.height)}`}>
                      <span>{formatHeight(guess.player.height)}</span>
                      <span className="text-base font-bold">{getDirectionIndicator(guess.direction.height)}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className={`py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 ${getComparisonClass(guess.comparison.weight)}`}>
                      <span>{formatWeight(guess.player.weight)}</span>
                      <span className="text-base font-bold">{getDirectionIndicator(guess.direction.weight)}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className={`py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-300 ${getComparisonClass(guess.comparison.gamesPlayed)}`}>
                      <span>{guess.player.gamesPlayed || guess.player.games || 0}</span>
                      <span className="text-base font-bold">{getDirectionIndicator(guess.direction.gamesPlayed)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GuessHistory; 