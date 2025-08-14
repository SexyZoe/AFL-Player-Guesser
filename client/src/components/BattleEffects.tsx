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
      // Hide effects after 5 seconds
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
          {/* Confetti */}
          {Array.from({ length: 9 }, (_, i) => (
            <div key={`confetti-${i}`} className="confetti" />
          ))}
          
          {/* Fireworks */}
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