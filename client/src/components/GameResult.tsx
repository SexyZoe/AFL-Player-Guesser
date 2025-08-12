import React from 'react';
import { Player, PlayerStatus, RoomPlayer } from '../types';
import PlayerCard from './PlayerCard';

interface GameResultProps {
  targetPlayer: Player;
  guesses: number;
  isMultiplayer?: boolean;
  isWinner?: boolean;
  isGameWon?: boolean;
  battleResult?: 'win' | 'lose' | null;
  opponentGuesses?: number;
  // 多人/系列赛结果扩展
  roomPlayers?: RoomPlayer[];
  playersStatus?: { [socketId: string]: PlayerStatus } | null;
  seriesWins?: Record<string, number>;
  seriesBestOf?: number | null;
  seriesTargetWins?: number | null;
  winnerName?: string | null;
  isSeriesFinal?: boolean;
}

const GameResult: React.FC<GameResultProps> = ({
  targetPlayer,
  guesses,
  isMultiplayer = false,
  isWinner = true,
  isGameWon = true,
  battleResult = null,
  opponentGuesses = 0,
  roomPlayers = [],
  playersStatus = null,
  seriesWins = {},
  seriesBestOf = null,
  seriesTargetWins = null,
  winnerName = null,
  isSeriesFinal = false,
}) => {
  const entries = Object.entries(playersStatus || {});
  const enriched = entries.map(([socketId, status]) => {
    const name = roomPlayers.find(p => p.socketId === socketId)?.displayName || `P-${socketId.slice(-4)}`;
    const wins = (seriesWins && seriesWins[socketId]) || 0;
    return { socketId, name, wins, guesses: status.guesses, isWinner: status.isWinner };
  }).sort((a,b) => (b.wins - a.wins) || (a.name.localeCompare(b.name)));

  const isSeries = !!seriesBestOf;

  const maxWins = enriched.reduce((m, p) => Math.max(m, p.wins), 0);
  const seriesLeaders = enriched.filter(p => p.wins === maxWins);
  const seriesWinnerName = seriesLeaders.length ? seriesLeaders.map(p => p.name).join(', ') : (winnerName || 'Winner');
  const roundWinnerName = winnerName || enriched.find(p => p.isWinner)?.name || 'Winner';

  return (
    <div className="w-full max-w-xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">
        {isMultiplayer && isSeries
          ? (isSeriesFinal
              ? `🏆 Series Winner: ${seriesWinnerName}`
              : `✅ Round Winner: ${roundWinnerName}`)
          : (isMultiplayer
              ? (battleResult === 'win' ? '🎉 恭喜获胜！' : '💔 很遗憾败北！')
              : (isGameWon ? '🎉 Congratulations! You Guessed Correctly! 🎉' : '😔 Game Over! You Ran Out of Guesses!'))}
      </h2>

      {isMultiplayer && isSeries && (
        <div className="mb-5 text-sm text-gray-600">
          Series Result: Best of {seriesBestOf} (Target {seriesTargetWins})
        </div>
      )}

      {isMultiplayer && isSeries && enriched.length > 0 && (
        <div className="mb-6 text-left bg-white/80 rounded-xl border border-gray-200 shadow p-4">
          <h3 className="font-semibold mb-2">Series Standings</h3>
          <div className="space-y-2">
            {enriched.map((p, idx) => (
              <div key={p.socketId} className={`flex items-center justify-between px-3 py-2 rounded-lg ${p.wins===maxWins && maxWins>0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 text-sm font-bold rounded-full bg-indigo-600 text-white flex items-center justify-center">{p.wins}</div>
                  <div className="font-semibold flex items-center gap-2">{p.name} {isSeriesFinal && p.wins===maxWins && maxWins>0 && p.wins >= (seriesTargetWins || 0) && <span title="Series Champion">🏆</span>}</div>
                </div>
                <div className="text-sm font-semibold text-gray-800">{p.wins}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-lg mb-2">
          {isMultiplayer && isSeries
            ? (isSeriesFinal
                ? `🏁 Series finished. ${seriesWinnerName} reached ${seriesTargetWins} wins.`
                : `🔔 Round finished. Winner: ${roundWinnerName}.`)
            : (isMultiplayer && battleResult
                ? (battleResult === 'win'
                    ? `🎯 你用了 ${guesses} 次猜测就找到了答案！\n⚡ 对手用了 ${opponentGuesses} 次猜测。`
                    : `😔 对手用了 ${opponentGuesses} 次猜测抢先找到了答案！\n🎯 你用了 ${guesses} 次猜测。`)
                : (isMultiplayer 
                    ? (isWinner 
                        ? `You correctly guessed the player in ${guesses} attempts!`
                        : 'The other player guessed correctly first.')
                    : (isGameWon
                        ? `You took ${guesses} attempts to find the correct answer.`
                        : `You used all ${guesses} attempts but didn't guess correctly.`)))}
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


    </div>
  );
};

export default GameResult; 