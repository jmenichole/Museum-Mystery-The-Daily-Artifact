
import React, { useState, useEffect, useCallback } from 'react';
import { SnooCharacter } from './SnooCharacter';
import { Position, Artifact } from '../types';

interface GameWorldProps {
  onFindArtifact: () => void;
  artifactFound: boolean;
  dailyArtifact: Artifact | null;
}

const WORLD_SIZE = 2000;

export const GameWorld: React.FC<GameWorldProps> = ({ onFindArtifact, artifactFound, dailyArtifact }) => {
  const [pos, setPos] = useState<Position>({ x: 1000, y: 1000 });
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [artifactPos] = useState<Position>({ 
    x: 1000 + (Math.random() * 400 - 200), 
    y: 1000 + (Math.random() * 400 - 200) 
  });
  const [isFading, setIsFading] = useState(false);

  const move = useCallback((dx: number, dy: number) => {
    setPos(prev => ({
      x: Math.max(0, Math.min(WORLD_SIZE, prev.x + dx)),
      y: Math.max(0, Math.min(WORLD_SIZE, prev.y + dy))
    }));
    if (dx !== 0) setDirection(dx > 0 ? 'right' : 'left');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 20;
      switch (e.key) {
        case 'ArrowUp': move(0, -step); break;
        case 'ArrowDown': move(0, step); break;
        case 'ArrowLeft': move(-step, 0); break;
        case 'ArrowRight': move(step, 0); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Check collision with artifact
  useEffect(() => {
    if (!artifactFound && !isFading) {
      const dist = Math.sqrt(Math.pow(pos.x - artifactPos.x, 2) + Math.pow(pos.y - artifactPos.y, 2));
      if (dist < 40) {
        setIsFading(true);
        // Delay the actual state change for the fade animation
        setTimeout(() => {
          onFindArtifact();
        }, 1000);
      }
    }
  }, [pos, artifactPos, artifactFound, onFindArtifact, isFading]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030303] rounded-xl border border-[#343536] shadow-2xl">
      {/* HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
          <i className="fas fa-map-marker-alt reddit-orange"></i>
          <span className="text-xs font-mono">X: {Math.round(pos.x)} Y: {Math.round(pos.y)}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20">
         <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
            <h3 className="text-sm font-bold reddit-orange uppercase tracking-wider">Daily Objective</h3>
            <p className="text-xs text-gray-400">Find the glowing Reddit relic</p>
         </div>
      </div>

      {/* World Content */}
      <div 
        className="museum-floor absolute transition-all duration-75 ease-out"
        style={{ 
          width: WORLD_SIZE, 
          height: WORLD_SIZE,
          left: `calc(50% - ${pos.x}px)`,
          top: `calc(50% - ${pos.y}px)`
        }}
      >
        {/* Grid Markers */}
        {Array.from({ length: 10 }).map((_, i) => (
          Array.from({ length: 10 }).map((_, j) => (
            <div 
              key={`${i}-${j}`} 
              className="absolute border border-white/5 flex items-center justify-center pointer-events-none"
              style={{ left: i * 200, top: j * 200, width: 200, height: 200 }}
            >
              <span className="text-[8px] text-white/10 opacity-20">Sector {i}-{j}</span>
            </div>
          ))
        ))}

        {/* The Artifact */}
        {!artifactFound && (
          <div 
            className={`absolute z-10 transition-all duration-1000 ease-in-out ${isFading ? 'opacity-0 scale-150 blur-xl' : 'animate-bounce opacity-100 scale-100'}`}
            style={{ left: artifactPos.x - 20, top: artifactPos.y - 20 }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="w-10 h-10 bg-gradient-to-tr from-[#FF4500] to-yellow-500 rounded-lg shadow-[0_0_20px_rgba(255,69,0,0.6)] flex items-center justify-center">
                 <i className="fas fa-landmark text-white"></i>
              </div>
            </div>
          </div>
        )}

        {/* Other Museum Decor */}
        <div className="absolute top-[800px] left-[900px] w-40 h-10 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-[1200px] left-[1100px] w-60 h-20 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Character (Fixed in Center, World Moves) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <SnooCharacter direction={direction} />
      </div>

      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 md:hidden z-30">
        <button onMouseDown={() => move(0, -30)} className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"><i className="fas fa-chevron-up"></i></button>
        <button onMouseDown={() => move(-30, 0)} className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>
        <button onMouseDown={() => move(30, 0)} className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"><i className="fas fa-chevron-right"></i></button>
        <button onMouseDown={() => move(0, 30)} className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"><i className="fas fa-chevron-down"></i></button>
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 uppercase tracking-widest hidden md:block">
        Use Arrow Keys to Navigate the Museum
      </div>
    </div>
  );
};
