import React from 'react';
import { Player } from '../types';
import PlayerCard from './PlayerCard';

interface GameResultProps {
  targetPlayer: Player;
  guesses: number;
  isMultiplayer?: boolean;
  isWinner?: boolean;
  isGameWon?: boolean;
  onPlayAgain: () => void;
  battleResult?: 'win' | 'lose' | null;
  opponentGuesses?: number;
}

const GameResult: React.FC<GameResultProps> = ({
  targetPlayer,
  guesses,
  isMultiplayer = false,
  isWinner = true,
  isGameWon = true,
  onPlayAgain,
  battleResult = null,
  opponentGuesses = 0,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">
        {isMultiplayer && battleResult
          ? battleResult === 'win'
            ? '🏆 恭喜获胜！ 🏆'
            : '💔 很遗憾败北！'
          : isMultiplayer
            ? isWinner
              ? '🎉 You Won! 🎉'
              : 'Sorry, You Lost!'
            : isGameWon
              ? '🎉 Congratulations! You Guessed Correctly! 🎉'
              : '😔 Game Over! You Ran Out of Guesses!'}
      </h2>

      <div className="mb-6">
        <p className="text-lg mb-2">
          {isMultiplayer && battleResult
            ? battleResult === 'win'
              ? `🎯 你用了 ${guesses} 次猜测就找到了答案！\n⚡ 对手用了 ${opponentGuesses} 次猜测。`
              : `😔 对手用了 ${opponentGuesses} 次猜测抢先找到了答案！\n🎯 你用了 ${guesses} 次猜测。`
            : isMultiplayer 
              ? isWinner 
                ? `You correctly guessed the player in ${guesses} attempts!` 
                : 'The other player guessed correctly first.'
              : isGameWon
                ? `You took ${guesses} attempts to find the correct answer.`
                : `You used all ${guesses} attempts but didn't guess correctly.`}
        </p>
        {/* 对战模式的评价 */}
        {isMultiplayer && battleResult && (
          <div className="mt-4">
            <p className="font-semibold text-base">
              {battleResult === 'win'
                ? guesses <= 3
                  ? '🌟 完美表现！你是AFL专家！'
                  : guesses <= 6
                  ? '👏 出色发挥！你的AFL知识很丰富！'
                  : '💪 不错的成绩！继续保持！'
                : opponentGuesses <= 3
                  ? '😅 对手表现太出色了！下次再来挑战！'
                  : '💯 势均力敌的对战！再来一局！'
              }
            </p>
          </div>
        )}
        
        {/* 单人模式的评价 */}
        {!isMultiplayer && (
          <div className="mt-2">
            <p className="font-semibold">
              {isGameWon
                ? guesses <= 3
                  ? 'Amazing! You\'re an AFL expert!'
                  : guesses <= 6
                  ? 'Great job! You know your AFL well!'
                  : 'Good effort! Keep practicing!'
                : 'Don\'t give up! Try again to improve your AFL knowledge!'}
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-3">
          {isGameWon ? 'The correct answer was:' : 'The correct answer is:'}
        </h3>
        <div className="max-w-sm mx-auto">
          <PlayerCard player={targetPlayer} />
        </div>
      </div>

      <button className="afl-button" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
};

export default GameResult; 