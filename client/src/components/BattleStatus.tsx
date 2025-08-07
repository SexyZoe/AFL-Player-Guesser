import React from 'react';
import { PlayerStatus } from '../types';

interface BattleStatusProps {
  currentPlayer: PlayerStatus | null;
  opponent: PlayerStatus | null;
  battleResult: 'win' | 'lose' | null;
}

const BattleStatus: React.FC<BattleStatusProps> = ({ 
  currentPlayer, 
  opponent, 
  battleResult 
}) => {
  if (!currentPlayer || !opponent) {
    return null;
  }

  return (
    <div className="battle-status-container">
      <div className="battle-header">
        <h3 className="battle-title">⚔️ Battle Mode</h3>
        {battleResult && (
          <div className={`battle-result ${battleResult}`}>
            {battleResult === 'win' ? '🏆 Victory!' : '💔 Defeat!'}
          </div>
        )}
      </div>
      
      <div className="battle-players-vertical">
        {/* 当前玩家状态 */}
        <div className={`player-status-vertical current ${battleResult === 'win' ? 'winner' : battleResult === 'lose' ? 'loser' : ''}`}>
          <div className="player-label-vertical">👤 You</div>
          <div className="player-stats-vertical">
            <div className="guesses-count-vertical">
              Guesses: <span className="count-number">{currentPlayer.guesses}</span>
            </div>
            <div className={`player-state ${currentPlayer.isFinished ? 'finished' : 'playing'}`}>
              {currentPlayer.isFinished ? 'Finished' : 'Playing'}
            </div>
          </div>
        </div>

        {/* VS 分隔符 - 垂直版本 */}
        <div className="vs-divider-vertical">
          <span className="vs-text">VS</span>
        </div>

        {/* 对手状态 */}
        <div className={`player-status-vertical opponent ${battleResult === 'lose' ? 'winner' : battleResult === 'win' ? 'loser' : ''}`}>
          <div className="player-label-vertical">🎭 Opponent</div>
          <div className="player-stats-vertical">
            <div className="guesses-count-vertical">
              Guesses: <span className="count-number">{opponent.guesses}</span>
            </div>
            <div className={`player-state ${opponent.isFinished ? 'finished' : 'playing'}`}>
              {opponent.isFinished ? 'Finished' : 'Playing'}
            </div>
          </div>
        </div>
      </div>

      {/* 对战提示 */}
      {!battleResult && (
        <div className="battle-hint">
          <p>🔥 Race against time! See who can guess the player first!</p>
        </div>
      )}
    </div>
  );
};

export default BattleStatus;