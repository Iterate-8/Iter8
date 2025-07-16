"use client";

import React from "react";

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-1 font-mono text-2xl font-light">
      <span className="text-gray-300">Iter</span>
      <span 
        className="text-gray-200 inline-block origin-center font-medium"
        style={{ 
          textShadow: '0 0 8px rgba(192, 192, 192, 0.8), 0 0 16px rgba(192, 192, 192, 0.4)',
          filter: 'drop-shadow(0 0 2px rgba(192, 192, 192, 0.6))',
          transform: 'rotate(-90deg)',
          animation: 'float 3s ease-in-out infinite'
        }}
      >
        8
      </span>
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: rotate(-90deg) translateX(0px); 
          }
          50% { 
            transform: rotate(-90deg) translateX(-6px); 
          }
        }
      `}</style>
    </div>
  );
};

export default Logo; 