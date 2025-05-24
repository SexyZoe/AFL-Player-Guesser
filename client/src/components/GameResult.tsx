import React from 'react';
import { Player } from '../types';
import PlayerCard from './PlayerCard';

interface GameResultProps {
  targetPlayer: Player;
  guesses: number;
  isMultiplayer?: boolean;
  isWinner?: boolean;
  onPlayAgain: () => void;
}

const GameResult: React.FC<GameResultProps> = ({
  targetPlayer,
  guesses,
  isMultiplayer = false,
  isWinner = true,
  onPlayAgain,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">
        {isMultiplayer
          ? isWinner
            ? '🎉 你赢了! 🎉'
            : '很遗憾，你输了!'
          : '🎉 恭喜! 你猜对了! 🎉'}
      </h2>

      <div className="mb-6">
        <p className="text-lg mb-2">
          {isMultiplayer 
            ? isWinner 
              ? `你在 ${guesses} 次尝试后正确猜出了球员!` 
              : '对方玩家先猜出了正确答案。'
            : `你用了 ${guesses} 次尝试猜出正确答案。`}
        </p>
        {!isMultiplayer && (
          <div className="mt-2">
            <p className="font-semibold">
              {guesses <= 3
                ? '太棒了! 你是AFL专家!'
                : guesses <= 6
                ? '很好! 你对AFL很了解!'
                : '不错! 继续努力!'}
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-3">正确答案是:</h3>
        <div className="max-w-sm mx-auto">
          <PlayerCard player={targetPlayer} revealed={true} />
        </div>
      </div>

      <button className="afl-button" onClick={onPlayAgain}>
        再玩一次
      </button>
    </div>
  );
};

export default GameResult; 