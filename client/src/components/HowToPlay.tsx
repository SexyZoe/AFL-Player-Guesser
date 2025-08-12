import React, { useState } from 'react';

const HowToPlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* How to Play按钮 */}
      <button 
        onClick={openModal}
        className="how-to-play-button"
        type="button"
      >
        <span>📖</span>
        How to Play
      </button>

      {/* 模态框遮罩层 */}
      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* 模态框头部 */}
            <div className="modal-header">
              <h2 className="modal-title">🏈 AFL Player Guesser - How to Play</h2>
              <button 
                onClick={closeModal}
                className="modal-close-button"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="modal-body">
              <div className="game-modes-section">
                <h3>🎮 Game Modes</h3>
                <div className="mode-item">
                  <strong>Solo Mode</strong>
                  <p>Challenge yourself to guess the mystery AFL player within 8 attempts</p>
                </div>
                <div className="mode-item">
                  <strong>Random Battle</strong>
                  <p>Battle against other online players in real-time to see who can guess faster</p>
                </div>
                <div className="mode-item">
                  <strong>Private Room</strong>
                  <p>Create or join private rooms to battle with friends using room codes</p>
                </div>
              </div>

              <div className="private-room-section">
                <h3>👥 Private Room Guide</h3>
                <div className="private-room-features">
                  <div className="feature-item">
                    <strong>🏠 Creating a Room</strong>
                    <p>Click "Create Room" to generate a unique 6-character room code. Share this code with friends to invite them to your room.</p>
                  </div>
                  <div className="feature-item">
                    <strong>🚪 Joining a Room</strong>
                    <p>Enter a valid room code to join an existing room. You can join rooms that are waiting for players.</p>
                  </div>
                  <div className="feature-item">
                    <strong>🎯 Room Capacity</strong>
                    <p>Private rooms support 2-4 players. Games can only start with at least 2 players.</p>
                  </div>
                  <div className="feature-item">
                    <strong>👑 Host Controls</strong>
                    <p>The room creator (host) has the authority to start the game when ready.</p>
                  </div>
                </div>

                <div className="sidebar-explanation">
                  <h4>📊 Right Sidebar Display</h4>
                  <p>During gameplay, the right sidebar shows each player with:</p>
                  <ul>
                    <li><strong>Circle with number</strong> - Shows how many guesses the player has made</li>
                    <li><strong>Player name</strong> - Displayed below the circle</li>

                  </ul>
                </div>
              </div>

              <div className="rules-section">
                <h3>📋 Game Rules</h3>
                <div className="rules-grid">
                  <div className="rule-item">
                    <span className="color-indicator green">🟩</span>
                    <strong>Green = Perfect Match</strong>
                    <p>This attribute exactly matches the target player</p>
                  </div>
                  <div className="rule-item">
                    <span className="color-indicator orange">🟧</span>
                    <strong>Orange = Close Match</strong>
                    <p>This attribute is close to the target player (small numerical difference)</p>
                  </div>
                  <div className="rule-item">
                    <span className="color-indicator blank">⬜</span>
                    <strong>Gray = No Match</strong>
                    <p>This attribute doesn't match the target player</p>
                  </div>
                </div>
                
                <div className="direction-hints">
                  <h4>🎯 Direction Hints</h4>
                  <div className="hint-item">
                    <span className="direction-arrow">↑</span>
                    <p><strong>Up Arrow</strong>: Target value is higher (older age, taller height, etc.)</p>
                  </div>
                  <div className="hint-item">
                    <span className="direction-arrow">↓</span>
                    <p><strong>Down Arrow</strong>: Target value is lower (younger age, shorter height, etc.)</p>
                  </div>
                </div>
              </div>



              <div className="controls-section">
                <h3>⌨️ Keyboard Shortcuts</h3>
                <div className="controls-grid">
                  <div className="control-item">
                    <div className="keyboard-key">Tab</div>
                    <strong>Auto-complete</strong>
                    <p>Quickly complete the current player name input</p>
                  </div>
                  <div className="control-item">
                    <div className="keyboard-key">↑↓</div>
                    <strong>Navigate</strong>
                    <p>Use arrow keys to navigate through search suggestions</p>
                  </div>
                  <div className="control-item">
                    <div className="keyboard-key">Enter</div>
                    <strong>Confirm</strong>
                    <p>Select the highlighted player to make your guess</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button 
                onClick={closeModal}
                className="modal-confirm-button"
                type="button"
              >
                Let's Play! 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HowToPlay;