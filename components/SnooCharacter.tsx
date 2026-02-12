
import React from 'react';

export const SnooCharacter: React.FC<{ direction: 'left' | 'right' }> = ({ direction }) => {
  return (
    <div className={`w-12 h-12 flex items-center justify-center transition-transform duration-200 ${direction === 'left' ? 'scale-x-[-1]' : ''}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Antenna */}
        <line x1="50" y1="20" x2="65" y2="5" stroke="#fff" strokeWidth="4" />
        <circle cx="65" cy="5" r="5" fill="#FF4500" />
        
        {/* Head */}
        <circle cx="50" cy="45" r="25" fill="#fff" />
        
        {/* Eyes */}
        <circle cx="40" cy="45" r="4" fill="#FF4500" />
        <circle cx="60" cy="45" r="4" fill="#FF4500" />
        
        {/* Ears */}
        <circle cx="25" cy="45" r="6" fill="#fff" />
        <circle cx="75" cy="45" r="6" fill="#fff" />
        
        {/* Body */}
        <ellipse cx="50" cy="75" r="18" rx="20" ry="15" fill="#fff" />
        
        {/* Arms */}
        <circle cx="30" cy="75" r="5" fill="#fff" />
        <circle cx="70" cy="75" r="5" fill="#fff" />
      </svg>
    </div>
  );
};
