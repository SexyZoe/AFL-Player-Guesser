import React, { useState } from 'react';

interface PrivateRoomPanelProps {
  roomCode: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
}

const PrivateRoomPanel: React.FC<PrivateRoomPanelProps> = ({
  roomCode,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [joinCode, setJoinCode] = useState('');

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
            <button
              onClick={onCreateRoom}
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
        <div className="afl-card">
          <h3 className="text-xl font-bold mb-4">Waiting for Players</h3>
          <div className="bg-gray-100 p-3 rounded-md text-center mb-4">
            <p className="text-sm text-gray-600 mb-1">Room Code:</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{roomCode}</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="afl-button w-full mb-2"
          >
            Copy Code
          </button>
          <p className="text-center text-gray-600 text-sm">
            Share this code with friends so they can join your game
          </p>
        </div>
      )}
    </div>
  );
};

export default PrivateRoomPanel; 