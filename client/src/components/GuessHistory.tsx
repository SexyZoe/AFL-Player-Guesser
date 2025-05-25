import React from 'react';
import { GuessHistoryItem, ComparisonResult, ComparisonDirection } from '../types';

interface GuessHistoryProps {
  guessHistory: GuessHistoryItem[];
}

// 获取比较结果的CSS类名
const getComparisonClass = (result: ComparisonResult): string => {
  switch (result) {
    case 'correct':
      return 'bg-green-500 text-white';
    case 'close':
      return 'bg-orange-500 text-white';
    default:
      return 'bg-gray-200';
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
      return '=';
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
    return <div className="text-gray-500 text-center mt-4">Make your first guess to see results</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold mb-2">Guess History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Player</th>
              <th className="py-2 px-4 border-b">Team</th>
              <th className="py-2 px-4 border-b">Number</th>
              <th className="py-2 px-4 border-b">Position</th>
              <th className="py-2 px-4 border-b">Age</th>
              <th className="py-2 px-4 border-b">Height</th>
              <th className="py-2 px-4 border-b">Weight</th>
              <th className="py-2 px-4 border-b">Games</th>
            </tr>
          </thead>
          <tbody>
            {guessHistory.map((guess, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border-b font-bold">{guess.player.name}</td>
                <td className={`py-2 px-4 border-b ${getComparisonClass(guess.comparison.team)}`}>
                  {guess.player.team}
                </td>
                <td className={`py-2 px-4 border-b ${getComparisonClass(guess.comparison.number)}`}>
                  {guess.player.number}
                </td>
                <td className={`py-2 px-4 border-b ${getComparisonClass(guess.comparison.position)}`}>
                  {guess.player.position}
                </td>
                <td className={`py-2 px-4 border-b ${getComparisonClass(guess.comparison.age)}`}>
                  {guess.player.age} {getDirectionIndicator(guess.direction.age)}
                </td>
                <td className={`py-2 px-4 border-b ${getComparisonClass(guess.comparison.height)}`}>
                  {formatHeight(guess.player.height)} {getDirectionIndicator(guess.direction.height)}
                </td>
                <td className={`py-2 px-4 border-b ${getComparisonClass(guess.comparison.weight)}`}>
                  {formatWeight(guess.player.weight)} {getDirectionIndicator(guess.direction.weight)}
                </td>
                <td className={`py-2 px-4 border-b ${getComparisonClass(guess.comparison.gamesPlayed)}`}>
                  {guess.player.gamesPlayed || guess.player.games || 0} {getDirectionIndicator(guess.direction.gamesPlayed)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuessHistory; 