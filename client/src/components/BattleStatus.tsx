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
        <h3 className="battle-title">⚔️ 对战模式</h3>
        {battleResult && (
          <div className={`battle-result ${battleResult}`}>
            {battleResult === 'win' ? '🏆 胜利!' : '💔 失败!'}
          </div>
        )}
      </div>
      
      <div className="battle-players">
        {/* 当前玩家状态 */}
        <div className={`player-status current ${battleResult === 'win' ? 'winner' : battleResult === 'lose' ? 'loser' : ''}`}>
          <div className="player-label">👤 你</div>
          <div className="player-stats">
            <div className="guesses-count">
              猜测次数: <span className="count-number">{currentPlayer.guesses}</span>
            </div>
            <div className={`player-state ${currentPlayer.isFinished ? 'finished' : 'playing'}`}>
              {currentPlayer.isFinished ? '已完成' : '游戏中'}
            </div>
          </div>
        </div>

        {/* VS 分隔符 */}
        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>

        {/* 对手状态 */}
        <div className={`player-status opponent ${battleResult === 'lose' ? 'winner' : battleResult === 'win' ? 'loser' : ''}`}>
          <div className="player-label">🎭 对手</div>
          <div className="player-stats">
            <div className="guesses-count">
              猜测次数: <span className="count-number">{opponent.guesses}</span>
            </div>
            <div className={`player-state ${opponent.isFinished ? 'finished' : 'playing'}`}>
              {opponent.isFinished ? '已完成' : '游戏中'}
            </div>
          </div>
        </div>
      </div>

      {/* 对战提示 */}
      {!battleResult && (
        <div className="battle-hint">
          <p>🔥 争分夺秒！看谁能更快猜中球员！</p>
        </div>
      )}
    </div>
  );
};

export default BattleStatus;