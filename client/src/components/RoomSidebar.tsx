import React, { useMemo } from 'react';
import { RoomPlayer, PlayerStatus } from '../types';

interface RoomSidebarProps {
  players: RoomPlayer[];
  playersStatus: { [socketId: string]: PlayerStatus } | null;
  maxSlots?: number;
  seriesWins?: Record<string, number>;
  currentSocketId?: string | null;
}

const RoomSidebar: React.FC<RoomSidebarProps> = ({
  players,
  playersStatus,
  maxSlots = 4,
  seriesWins = {},
  currentSocketId
}) => {
  const slots = useMemo(() => Array.from({ length: maxSlots }), [maxSlots]);

  const isOffline = (socketId: string): boolean => {
    // 离线：在状态里存在，但不在players名册中
    const inRoster = players.some(p => p.socketId === socketId);
    return !inRoster;
  };

  const renderSlot = (index: number) => {
    const player = players[index];
    if (!player) {
      return (
        <div key={`slot-${index}`} className="sidebar-slot placeholder">
          <div className="circle placeholder-circle">--</div>
          <div className="nickname placeholder-text">Waiting...</div>
        </div>
      );
    }

    const status = playersStatus ? playersStatus[player.socketId] : undefined;
    const guesses = status?.guesses ?? 0;
    const isFinished = !!status?.isFinished;
    const isWinner = !!status?.isWinner;
    const wins = seriesWins[player.socketId] ?? 0;
    const isYou = currentSocketId && currentSocketId === player.socketId;
    const offline = isOffline(player.socketId);

    return (
      <div key={player.socketId} className={`sidebar-slot ${offline ? 'offline' : isWinner ? 'winner' : isFinished ? 'finished' : 'active'}`}>
        <div className="circle">
          <span className="count">{guesses}</span>
          {wins > 0 && <span className="badge" title="Series wins">{wins}</span>}
        </div>
        <div className="nickname" title={player.displayName || 'Player'}>
          {player.displayName || 'Player'}{isYou ? ' (You)' : ''}
        </div>
      </div>
    );
  };

  return (
    <aside className="room-sidebar">
      {slots.map((_, idx) => renderSlot(idx))}
    </aside>
  );
};

export default RoomSidebar;

