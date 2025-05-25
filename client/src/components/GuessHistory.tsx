import React from 'react';
import { GuessHistoryItem, ComparisonResult, ComparisonDirection } from '../types';

interface GuessHistoryProps {
  guessHistory: GuessHistoryItem[];
}

// 获取比较结果的CSS类名
const getComparisonClass = (result: ComparisonResult): string => {
  switch (result) {
    case 'correct':
      return 'bg-green-500 text-white shadow-lg';
    case 'close':
      return 'bg-orange-500 text-white shadow-lg';
    default:
      return 'bg-gray-100 text-gray-700';
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
      <div className="mt-6 text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="text-4xl mb-3">🎯</div>
        <p className="text-gray-500 text-lg font-medium">Make your first guess to see results</p>
        <p className="text-gray-400 text-sm mt-1">Your guessing history will appear here</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-2xl font-bold text-gray-800">Guess History</h3>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
          {guessHistory.length} guess{guessHistory.length !== 1 ? 'es' : ''}
        </div>
      </div>
      
      {/* 图例 */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">Exact Match</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-gray-600">Close Match</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span className="text-gray-600">Not a Match</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">↑ Higher</span>
          <span className="text-gray-600">↓ Lower</span>
          <span className="text-gray-600">✓ Correct</span>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="py-4 px-4 text-left font-bold text-gray-700 text-sm">Player</th>
                <th className="py-4 px-4 text-center font-bold text-gray-700 text-sm">Team</th>
                <th className="py-4 px-4 text-center font-bold text-gray-700 text-sm">Number</th>
                <th className="py-4 px-4 text-center font-bold text-gray-700 text-sm">Position</th>
                <th className="py-4 px-4 text-center font-bold text-gray-700 text-sm">Age</th>
                <th className="py-4 px-4 text-center font-bold text-gray-700 text-sm">Height</th>
                <th className="py-4 px-4 text-center font-bold text-gray-700 text-sm">Weight</th>
                <th className="py-4 px-4 text-center font-bold text-gray-700 text-sm">Games</th>
              </tr>
            </thead>
            <tbody>
              {guessHistory.map((guess, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <div className="font-bold text-gray-800 text-sm">{guess.player.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Guess #{index + 1}</div>
                  </td>
                  <td className={`py-4 px-4 text-center text-sm font-medium rounded-lg mx-1 ${getComparisonClass(guess.comparison.team)}`}>
                    <div className="py-2 px-3 rounded-lg">
                      {guess.player.team}
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-center text-sm font-medium rounded-lg mx-1 ${getComparisonClass(guess.comparison.number)}`}>
                    <div className="py-2 px-3 rounded-lg">
                      {guess.player.number}
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-center text-sm font-medium rounded-lg mx-1 ${getComparisonClass(guess.comparison.position)}`}>
                    <div className="py-2 px-3 rounded-lg">
                      {guess.player.position}
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-center text-sm font-medium rounded-lg mx-1 ${getComparisonClass(guess.comparison.age)}`}>
                    <div className="py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                      <span>{guess.player.age}</span>
                      <span className="text-lg">{getDirectionIndicator(guess.direction.age)}</span>
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-center text-sm font-medium rounded-lg mx-1 ${getComparisonClass(guess.comparison.height)}`}>
                    <div className="py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                      <span>{formatHeight(guess.player.height)}</span>
                      <span className="text-lg">{getDirectionIndicator(guess.direction.height)}</span>
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-center text-sm font-medium rounded-lg mx-1 ${getComparisonClass(guess.comparison.weight)}`}>
                    <div className="py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                      <span>{formatWeight(guess.player.weight)}</span>
                      <span className="text-lg">{getDirectionIndicator(guess.direction.weight)}</span>
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-center text-sm font-medium rounded-lg mx-1 ${getComparisonClass(guess.comparison.gamesPlayed)}`}>
                    <div className="py-2 px-3 rounded-lg flex items-center justify-center gap-1">
                      <span>{guess.player.gamesPlayed || guess.player.games || 0}</span>
                      <span className="text-lg">{getDirectionIndicator(guess.direction.gamesPlayed)}</span>
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