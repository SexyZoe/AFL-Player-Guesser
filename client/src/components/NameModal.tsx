import React, { useState, useEffect } from 'react';

interface NameModalProps {
  isOpen: boolean;
  initialName?: string;
  onConfirm: (name: string) => void;
  onClose?: () => void;
}

const NameModal: React.FC<NameModalProps> = ({ isOpen, initialName = '', onConfirm, onClose }) => {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-label="Set Display Name" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Set Display Name</h3>
          <button type="button" className="modal-close-button" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-gray-700">Please enter a nickname your friends can recognize (max 20 characters)</label>
            <input
              type="text"
              className="afl-input w-full mb-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="e.g., Alex, Sam, Captain…"
              autoFocus
            />

          </form>
        </div>
      </div>
    </div>
  );
};

export default NameModal;

