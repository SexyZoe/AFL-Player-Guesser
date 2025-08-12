import React, { useState, useEffect } from 'react';

interface NameModalProps {
  isOpen: boolean;
  initialName?: string;
  onConfirm: (name: string) => void;
}

const NameModal: React.FC<NameModalProps> = ({ isOpen, initialName = '', onConfirm }) => {
  const [name, setName] = useState<string>(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    onConfirm(trimmed.slice(0, 20));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true" aria-label="Set Name">
        <div className="modal-header">
          <h3 className="modal-title">设置本局昵称</h3>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-gray-700">请输入一个让朋友能识别你的昵称（最多20字符）</label>
            <input
              type="text"
              className="afl-input w-full mb-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="如：Alex、小李、队长…"
              autoFocus
            />
            <button type="submit" className="afl-button w-full" aria-label="Let's Play! 🚀">确认</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NameModal;

