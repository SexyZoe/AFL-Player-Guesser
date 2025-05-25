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
            ? '🎉 You Won! 🎉'
            : 'Sorry, You Lost!'
          : '🎉 Congratulations! You Guessed Correctly! 🎉'}
      </h2>

      <div className="mb-6">
        <p className="text-lg mb-2">
          {isMultiplayer 
            ? isWinner 
              ? `You correctly guessed the player in ${guesses} attempts!` 
              : 'The other player guessed correctly first.'
            : `You took ${guesses} attempts to find the correct answer.`}
        </p>
        {!isMultiplayer && (
          <div className="mt-2">
            <p className="font-semibold">
              {guesses <= 3
                ? 'Amazing! You\'re an AFL expert!'
                : guesses <= 6
                ? 'Great job! You know your AFL well!'
                : 'Good effort! Keep practicing!'}
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-3">The correct answer was:</h3>
        <div className="max-w-sm mx-auto">
          <PlayerCard player={targetPlayer} revealed={true} />
        </div>
      </div>

      <button className="afl-button" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
};

export default GameResult; 