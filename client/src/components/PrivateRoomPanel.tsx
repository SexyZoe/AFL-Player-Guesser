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
    alert('房间代码已复制到剪贴板');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!roomCode ? (
        <div className="flex flex-col gap-4">
          <div className="afl-card">
            <h3 className="text-xl font-bold mb-4">创建私人房间</h3>
            <p className="mb-3">
              创建一个私人房间并邀请朋友加入。房间创建后，你将获得一个可以分享的代码。
            </p>
            <button
              onClick={onCreateRoom}
              className="afl-button w-full"
            >
              创建房间
            </button>
          </div>

          <div className="afl-card">
            <h3 className="text-xl font-bold mb-4">加入房间</h3>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="输入房间代码..."
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
                加入房间
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="afl-card">
          <h3 className="text-xl font-bold mb-4">等待玩家加入</h3>
          <div className="bg-gray-100 p-3 rounded-md text-center mb-4">
            <p className="text-sm text-gray-600 mb-1">房间代码:</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{roomCode}</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="afl-button w-full mb-2"
          >
            复制代码
          </button>
          <p className="text-center text-gray-600 text-sm">
            分享此代码给朋友，他们可以使用它加入你的游戏
          </p>
        </div>
      )}
    </div>
  );
};

export default PrivateRoomPanel; 