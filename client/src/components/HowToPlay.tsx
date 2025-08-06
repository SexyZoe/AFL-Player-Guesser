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

            {/* 模态框内容 */}
            <div className="modal-body">
              <div className="game-modes-section">
                <h3>🎮 游戏模式</h3>
                <div className="mode-item">
                  <strong>单人模式 (Solo)</strong>
                  <p>独自挑战，在8次猜测内找出神秘的AFL球员</p>
                </div>
                <div className="mode-item">
                  <strong>随机对战 (Random Battle)</strong>
                  <p>与其他玩家实时对战，看谁能更快猜出正确答案</p>
                </div>
                <div className="mode-item">
                  <strong>私人房间 (Private Room)</strong>
                  <p>创建或加入私人房间，与朋友对战</p>
                </div>
              </div>

              <div className="rules-section">
                <h3>📋 游戏规则</h3>
                <div className="rules-grid">
                  <div className="rule-item">
                    <span className="color-indicator green">🟩</span>
                    <strong>绿色 = 完全匹配</strong>
                    <p>这个属性与目标球员完全相同</p>
                  </div>
                  <div className="rule-item">
                    <span className="color-indicator orange">🟧</span>
                    <strong>橙色 = 接近匹配</strong>
                    <p>这个属性接近目标球员（数值差距很小）</p>
                  </div>
                  <div className="rule-item">
                    <span className="color-indicator blank">⬜</span>
                    <strong>空白 = 不匹配</strong>
                    <p>这个属性与目标球员不同</p>
                  </div>
                </div>
                
                <div className="direction-hints">
                  <h4>🎯 方向提示</h4>
                  <div className="hint-item">
                    <span className="direction-arrow">↑</span>
                    <p><strong>向上箭头</strong>：目标数值更高（年龄更大、身高更高等）</p>
                  </div>
                  <div className="hint-item">
                    <span className="direction-arrow">↓</span>
                    <p><strong>向下箭头</strong>：目标数值更低（年龄更小、身高更低等）</p>
                  </div>
                </div>
              </div>

              <div className="tips-section">
                <h3>💡 游戏技巧</h3>
                <ul className="tips-list">
                  <li>从不同球队的球员开始猜测，快速缩小范围</li>
                  <li>注意年龄和身高的方向提示，这些线索很有价值</li>
                  <li>利用球员号码的接近提示来精确定位</li>
                  <li>在对战模式中，速度和准确性同样重要</li>
                  <li>观察对手的猜测次数，调整自己的策略</li>
                </ul>
              </div>

              <div className="controls-section">
                <h3>⌨️ 键盘快捷键</h3>
                <div className="controls-grid">
                  <div className="control-item">
                    <div className="keyboard-key">Tab</div>
                    <strong>自动完成</strong>
                    <p>快速完成当前输入的球员姓名</p>
                  </div>
                  <div className="control-item">
                    <div className="keyboard-key">↑↓</div>
                    <strong>导航选择</strong>
                    <p>使用上下箭头键在搜索结果中导航</p>
                  </div>
                  <div className="control-item">
                    <div className="keyboard-key">Enter</div>
                    <strong>确认选择</strong>
                    <p>选择当前高亮的球员进行猜测</p>
                  </div>
                </div>
              </div>

              <div className="battle-section">
                <h3>⚔️ 对战模式特色</h3>
                <div className="battle-features">
                  <div className="feature-item">
                    <span className="feature-icon">🔥</span>
                    <strong>实时对战</strong>
                    <p>与对手同时猜测，实时看到双方进度</p>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🏆</span>
                    <strong>胜负特效</strong>
                    <p>获胜时享受彩带和烟花庆祝，失败时也有相应反馈</p>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">⚡</span>
                    <strong>速度竞赛</strong>
                    <p>谁先猜对谁获胜，考验您的AFL知识和反应速度</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="modal-footer">
              <button 
                onClick={closeModal}
                className="modal-confirm-button"
                type="button"
              >
                开始游戏 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HowToPlay;