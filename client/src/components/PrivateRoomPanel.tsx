import React, { useMemo, useState } from 'react';
import RoomSidebar from './RoomSidebar';
import type { RoomPlayer, PlayerStatus } from '../types';

interface PrivateRoomPanelProps {
  roomCode: string;
  onCreateRoom: (seriesBestOf?: 3 | 5 | 7) => void;
  onJoinRoom: (code: string) => void;
  onStartGame: () => void;
  // 新增：用于展示等待中的玩家
  players?: RoomPlayer[];
  playersStatus?: { [socketId: string]: PlayerStatus } | null;
  currentSocketId?: string | null;
  hostId?: string | null;
}

const PrivateRoomPanel: React.FC<PrivateRoomPanelProps> = ({
  roomCode,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  players = [],
  playersStatus = null,
  currentSocketId = null,
  hostId = null,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [series, setSeries] = useState<3 | 5 | 7 | undefined>(undefined);

  const canStart = useMemo(() => {
    const count = players?.length || 0;
    const isHost = hostId && currentSocketId && hostId === currentSocketId;
    return isHost && count >= 2 && count <= 4;
  }, [players, hostId, currentSocketId]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinRoom(joinCode.trim());
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room code copied to clipboard');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!roomCode ? (
        <div className="flex flex-col gap-4">
          <div className="afl-card">
            <h3 className="text-xl font-bold mb-4">Create Private Room</h3>
            <p className="mb-3">
              Create a private room and invite friends to join. Once created, you will get a code to share.
            </p>
            <div className="mb-4">
              <label className="block mb-2 text-gray-700">Series Mode (optional)</label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 items-center">
                {[3,5,7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeries(n as 3 | 5 | 7)}
                  className={`afl-button ${series === n ? 'ring-4 ring-afl-blue' : ''}`}
                  >
                    BO{n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSeries(undefined)}
                className={`afl-button ${series === undefined ? 'ring-4 ring-afl-blue' : ''}`}
                >
                  None
                </button>
              </div>
            </div>
            <button
              onClick={() => onCreateRoom(series)}
              className="afl-button w-full"
            >
              Create Room
            </button>
          </div>

          <div className="afl-card">
            <h3 className="text-xl font-bold mb-4">Join Room</h3>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Enter room code..."
                className="afl-input w-full mb-3"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button
                type="submit"
                className="afl-button w-full"
                disabled={!joinCode.trim()}
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="afl-card">
            <h3 className="text-xl font-bold mb-4">Waiting for Players</h3>
            <div className="bg-gray-100 p-3 rounded-md text-center mb-4">
              <p className="text-sm text-gray-600 mb-1">Room Code:</p>
              <p className="text-2xl font-mono font-bold tracking-widest">{roomCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyToClipboard}
                className="afl-button w-full"
              >
                Copy Code
              </button>
              <button
                onClick={onStartGame}
                className={`afl-button w-full ${!canStart ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canStart}
              >
                Start Game
              </button>
            </div>
            <p className="text-center text-gray-600 text-sm mt-2">
              Share this code and click Start when 2-4 players have joined
            </p>
          </div>

          {/* 显示等待中的玩家 */}
          <div className="afl-card">
            <h4 className="text-lg font-semibold mb-3">Players in Room</h4>
            <RoomSidebar 
              players={players}
              playersStatus={playersStatus}
              currentSocketId={currentSocketId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateRoomPanel; 