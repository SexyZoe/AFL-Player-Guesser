import React from 'react';
import { GuessHistoryItem, ComparisonResult, ComparisonDirection } from '../types';

interface GuessHistoryProps {
  guessHistory: GuessHistoryItem[];
}

// Get CSS class for comparison result
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

// Get direction indicator
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

// Format height/weight; avoid duplicate units
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
      <div className="mt-4 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 text-center py-8 sm:py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl sm:rounded-3xl border-2 border-dashed border-blue-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5"></div>
        <div className="relative z-10">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4 animate-pulse">🎯</div>
          <p className="text-gray-600 text-lg sm:text-xl font-bold mb-2">Make your first guess to see results</p>
          <p className="text-gray-500 text-sm sm:text-base">Your guessing history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Title and count */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Guess History</h3>
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-blue-200 shadow-sm self-start">
          {guessHistory.length} guess{guessHistory.length !== 1 ? 'es' : ''}
        </div>
      </div>
      
      {/* Legend - responsive */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl border border-gray-200">
        <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-md sm:rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">Exact Match</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 rounded-md sm:rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">Close Match</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-100 border border-gray-300 rounded-md sm:rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">Not a Match</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-700 font-medium">↑ Higher</span>
            <span className="text-gray-700 font-medium">↓ Lower</span>
            <span className="text-gray-700 font-medium">✓ Correct</span>
          </div>
        </div>
      </div>
      
      {/* md and up: horizontal table */}
      <div className="hidden md:block bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-blue-50 border-b border-gray-300">
                <th className="py-2 sm:py-3 px-1.5 sm:px-3 text-left font-bold text-gray-800 text-xs sm:text-sm">Player</th>
                <th className="py-2 sm:py-3 px-1 sm:px-2 text-center font-bold text-gray-800 text-xs sm:text-sm">Team</th>
                <th className="py-2 sm:py-3 px-1 sm:px-1.5 text-center font-bold text-gray-800 text-xs sm:text-sm">Number</th>
                <th className="py-2 sm:py-3 px-1 sm:px-2 text-center font-bold text-gray-800 text-xs sm:text-sm">Position</th>
                <th className="py-2 sm:py-3 px-1 sm:px-1.5 text-center font-bold text-gray-800 text-xs sm:text-sm">Age</th>
                <th className="py-2 sm:py-3 px-1 sm:px-1.5 text-center font-bold text-gray-800 text-xs sm:text-sm">Height</th>
                <th className="py-2 sm:py-3 px-1 sm:px-1.5 text-center font-bold text-gray-800 text-xs sm:text-sm">Weight</th>
                <th className="py-2 sm:py-3 px-1 sm:px-2 text-center font-bold text-gray-800 text-xs sm:text-sm">Origin</th>
                <th className="py-2 sm:py-3 px-1 sm:px-1.5 text-center font-bold text-gray-800 text-xs sm:text-sm">Games</th>
              </tr>
            </thead>
            <tbody>
              {guessHistory.map((guess, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                  <td className="py-2 sm:py-3 px-1.5 sm:px-3">
                    <div className="font-bold text-gray-800 text-xs sm:text-sm leading-tight">{guess.player.name}</div>
                    <div className="text-xs text-gray-600 mt-0.5 font-medium">#{index + 1}</div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">
                    <div className={`py-1 sm:py-1.5 px-1 sm:px-2 rounded-md sm:rounded-lg text-xs transition-all duration-300 ${getComparisonClass(guess.comparison.team)}`}>
                      {guess.player.team}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-1.5 text-center">
                    <div className={`py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-md sm:rounded-lg text-xs transition-all duration-300 ${getComparisonClass(guess.comparison.number)}`}>
                      {guess.player.number}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">
                    <div className={`py-1 sm:py-1.5 px-1 sm:px-2 rounded-md sm:rounded-lg text-xs transition-all duration-300 ${getComparisonClass(guess.comparison.position)}`}>
                      {guess.player.position}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-1.5 text-center">
                    <div className={`py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-md sm:rounded-lg text-xs flex items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 ${getComparisonClass(guess.comparison.age)}`}>
                      <span>{guess.player.age}</span>
                      <span className="text-xs sm:text-sm font-bold">{getDirectionIndicator(guess.direction.age)}</span>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-1.5 text-center">
                    <div className={`py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-md sm:rounded-lg text-xs flex items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 ${getComparisonClass(guess.comparison.height)}`}>
                      <span>{formatHeight(guess.player.height)}</span>
                      <span className="text-xs sm:text-sm font-bold">{getDirectionIndicator(guess.direction.height)}</span>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-1.5 text-center">
                    <div className={`py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-md sm:rounded-lg text-xs flex items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 ${getComparisonClass(guess.comparison.weight)}`}>
                      <span>{formatWeight(guess.player.weight)}</span>
                      <span className="text-xs sm:text-sm font-bold">{getDirectionIndicator(guess.direction.weight)}</span>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">
                    <div className={`py-1 sm:py-1.5 px-1 sm:px-2 rounded-md sm:rounded-lg text-xs transition-all duration-300 ${getComparisonClass(guess.comparison.origin)}`}>
                      {guess.player.origin || 'N/A'}
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-1 sm:px-1.5 text-center">
                    <div className={`py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-md sm:rounded-lg text-xs flex items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 ${getComparisonClass(guess.comparison.gamesPlayed)}`}>
                      <span>{guess.player.gamesPlayed || guess.player.games || 0}</span>
                      <span className="text-xs sm:text-sm font-bold">{getDirectionIndicator(guess.direction.gamesPlayed)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Small screens (< md): two-column compact list with table-like styling and no horizontal scroll */}
      <div className="md:hidden space-y-3">
        {guessHistory.map((guess, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Row header */}
            <div className="bg-gradient-to-r from-gray-100 to-blue-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <div className="font-bold text-gray-800 text-sm truncate">{guess.player.name}</div>
              <div className="text-[11px] text-gray-600 font-medium">#{index + 1}</div>
            </div>
            {/* Row content: two-column grid */}
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <div className="text-[11px] text-gray-600 mb-1">Team</div>
                  <div className={`py-1 px-2 rounded-md text-xs ${getComparisonClass(guess.comparison.team)}`}>{guess.player.team}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-gray-600 mb-1">Number</div>
                  <div className={`py-1 px-2 rounded-md text-xs ${getComparisonClass(guess.comparison.number)}`}>{guess.player.number}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-gray-600 mb-1">Position</div>
                  <div className={`py-1 px-2 rounded-md text-xs ${getComparisonClass(guess.comparison.position)}`}>{guess.player.position}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-gray-600 mb-1">Age</div>
                  <div className={`py-1 px-1.5 rounded-md text-xs flex items-center justify-center gap-0.5 ${getComparisonClass(guess.comparison.age)}`}>
                    <span>{guess.player.age}</span>
                    <span className="text-xs font-bold">{getDirectionIndicator(guess.direction.age)}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-gray-600 mb-1">Height</div>
                  <div className={`py-1 px-1.5 rounded-md text-xs flex items-center justify-center gap-0.5 ${getComparisonClass(guess.comparison.height)}`}>
                    <span>{formatHeight(guess.player.height)}</span>
                    <span className="text-xs font-bold">{getDirectionIndicator(guess.direction.height)}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-gray-600 mb-1">Weight</div>
                  <div className={`py-1 px-1.5 rounded-md text-xs flex items-center justify-center gap-0.5 ${getComparisonClass(guess.comparison.weight)}`}>
                    <span>{formatWeight(guess.player.weight)}</span>
                    <span className="text-xs font-bold">{getDirectionIndicator(guess.direction.weight)}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-gray-600 mb-1">Origin</div>
                  <div className={`py-1 px-2 rounded-md text-xs ${getComparisonClass(guess.comparison.origin)}`}>{guess.player.origin || 'N/A'}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] text-gray-600 mb-1">Games</div>
                  <div className={`py-1 px-1.5 rounded-md text-xs flex items-center justify-center gap-0.5 ${getComparisonClass(guess.comparison.gamesPlayed)}`}>
                    <span>{guess.player.gamesPlayed || guess.player.games || 0}</span>
                    <span className="text-xs font-bold">{getDirectionIndicator(guess.direction.gamesPlayed)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuessHistory; 