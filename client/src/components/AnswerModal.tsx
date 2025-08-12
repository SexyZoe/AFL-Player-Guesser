import React from 'react';
import { Player, GameEndReason } from '../types';
import PlayerCard from './PlayerCard';

interface AnswerModalProps {
  isOpen: boolean;
  targetPlayer: Player;
  onClose: () => void;
  gameEndReason?: GameEndReason;
  isWinner?: boolean;
  totalGuesses?: number;
  maxGuesses?: number;
  winnerName?: string | null;
}

const AnswerModal: React.FC<AnswerModalProps> = ({ 
  isOpen, 
  targetPlayer, 
  onClose, 
  gameEndReason = 'CORRECT_GUESS',
  isWinner = false,
  totalGuesses = 0,
  maxGuesses = 8,
  winnerName = null
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    if (gameEndReason === 'CORRECT_GUESS') {
      return isWinner ? '🎉 Congratulations! You Got It!' : '😢 Game Over';
    } else if (gameEndReason === 'ALL_GUESSES_USED') {
      return '⏰ Game Over';
    } else if (gameEndReason === 'MAX_GUESSES_REACHED') {
      return '😅 All Guesses Used';
    } else if (gameEndReason === 'PLAYER_DISCONNECTED') {
      return '😔 Game Ended';
    }
    return 'Game Over';
  };

  const getSubtitle = () => {
    if (gameEndReason === 'CORRECT_GUESS') {
      return isWinner 
        ? `Amazing! You found the answer in just ${totalGuesses} ${totalGuesses === 1 ? 'guess' : 'guesses'}!` 
        : (winnerName ? `${winnerName} got the correct answer first!` : 'Opponent got the correct answer first!');
    } else if (gameEndReason === 'ALL_GUESSES_USED') {
      return 'Both players used all their guesses. Let\'s reveal the correct answer!';
    } else if (gameEndReason === 'MAX_GUESSES_REACHED') {
      return `You've used all ${maxGuesses} guesses. The correct answer is:`;
    } else if (gameEndReason === 'PLAYER_DISCONNECTED') {
      return 'Your opponent disconnected. Let\'s see the correct answer:';
    }
    return 'Let\'s see the correct answer:';
  };

  const getTitleColor = () => {
    if (gameEndReason === 'CORRECT_GUESS' && isWinner) {
      return 'text-green-600';
    } else if (gameEndReason === 'CORRECT_GUESS' && !isWinner) {
      return 'text-red-600';
    } else {
      return 'text-blue-600';
    }
  };

  const getHeaderBackground = () => {
    if (gameEndReason === 'CORRECT_GUESS' && isWinner) {
      return 'bg-gradient-to-r from-green-50 to-emerald-50';
    } else if (gameEndReason === 'CORRECT_GUESS' && !isWinner) {
      return 'bg-gradient-to-r from-red-50 to-rose-50';
    } else {
      return 'bg-gradient-to-r from-blue-50 to-indigo-50';
    }
  };

  return (
    <div className="answer-modal-overlay" onClick={onClose}>
      <div className="answer-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className={`answer-modal-header ${getHeaderBackground()}`}>
          <h2 className={`answer-modal-title ${getTitleColor()}`}>
            {getTitle()}
          </h2>
          <p className="answer-modal-subtitle">
            {getSubtitle()}
          </p>
          <button 
            onClick={onClose}
            className="answer-modal-close-button"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* 答案展示 */}
        <div className="answer-modal-body">
          <div className="answer-reveal">
            <h3 className="reveal-title">🎯 Correct Answer</h3>
            <div className="player-card-container">
              <PlayerCard 
                player={targetPlayer} 
                comparisonResult={{
                  team: 'correct',
                  number: 'correct',
                  position: 'correct',
                  age: 'correct',
                  height: 'correct',
                  weight: 'correct',
                  origin: 'correct',
                  gamesPlayed: 'correct'
                }}
                directionHints={{
                  age: 'equal',
                  height: 'equal',
                  weight: 'equal',
                  gamesPlayed: 'equal'
                }}
                showResult={true}
              />
            </div>
            {/* 系列赛提示（仅在非最终局的回合结束时显示） */}
            <p className="text-sm text-gray-600 mt-3">If a series is active, next round will start automatically after countdown.</p>
          </div>

          {/* 游戏统计 */}
          <div className="game-stats">
            <div className="stat-item">
              <span className="stat-label">🎯 Guesses</span>
              <span className="stat-value">{totalGuesses} / {maxGuesses}</span>
            </div>
            {gameEndReason === 'CORRECT_GUESS' && isWinner && (
              <div className="stat-item">
                <span className="stat-label">⭐ Accuracy</span>
                <span className="stat-value">{totalGuesses > 0 ? Math.round((1 / totalGuesses) * 100) : 0}%</span>
              </div>
            )}
          </div>
        </div>

        {/* 模态框底部 */}
        <div className="answer-modal-footer">
        </div>
      </div>
    </div>
  );
};

export default AnswerModal;