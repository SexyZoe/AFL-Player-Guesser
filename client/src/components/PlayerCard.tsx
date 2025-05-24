import React from 'react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  revealed?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, revealed = true }) => {
  // 只显示部分信息，以保持神秘感
  const renderHiddenInfo = (text: string) => {
    return revealed ? text : '???';
  };

  return (
    <div className="afl-card cursor-pointer" onClick={onClick}>
      <h3 className="text-xl font-bold mb-2">{revealed ? player.name : '神秘球员'}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="font-semibold">球队: </span>
          <span>{renderHiddenInfo(player.team)}</span>
        </div>
        <div>
          <span className="font-semibold">号码: </span>
          <span>{renderHiddenInfo(String(player.number))}</span>
        </div>
        <div>
          <span className="font-semibold">位置: </span>
          <span>{renderHiddenInfo(player.position)}</span>
        </div>
        <div>
          <span className="font-semibold">年龄: </span>
          <span>{renderHiddenInfo(String(player.age))}</span>
        </div>
        <div>
          <span className="font-semibold">身高: </span>
          <span>{renderHiddenInfo(`${player.height}cm`)}</span>
        </div>
        <div>
          <span className="font-semibold">体重: </span>
          <span>{renderHiddenInfo(`${player.weight}kg`)}</span>
        </div>
        <div className="col-span-2">
          <span className="font-semibold">比赛场次: </span>
          <span>{renderHiddenInfo(String(player.gamesPlayed))}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard; 