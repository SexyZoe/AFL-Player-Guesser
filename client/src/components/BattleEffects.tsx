import React, { useEffect, useState } from 'react';

interface BattleEffectsProps {
  battleResult: 'win' | 'lose' | null;
  isVisible: boolean;
}

const BattleEffects: React.FC<BattleEffectsProps> = ({ battleResult, isVisible }) => {
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    if (battleResult && isVisible) {
      setShowEffects(true);
      // 5秒后隐藏特效
      const timer = setTimeout(() => {
        setShowEffects(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowEffects(false);
    }
  }, [battleResult, isVisible]);

  if (!showEffects || !battleResult) {
    return null;
  }

  return (
    <>
      {battleResult === 'win' && (
        <div className="victory-celebration">
          {/* 彩带效果 */}
          {Array.from({ length: 9 }, (_, i) => (
            <div key={`confetti-${i}`} className="confetti" />
          ))}
          
          {/* 烟花效果 */}
          {Array.from({ length: 3 }, (_, i) => (
            <div key={`fireworks-${i}`} className="fireworks" />
          ))}
        </div>
      )}
      
      {battleResult === 'lose' && (
        <div className="defeat-overlay" />
      )}
    </>
  );
};

export default BattleEffects;