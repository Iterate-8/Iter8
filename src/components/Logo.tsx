"use client";

import React from "react";

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-1 font-sans text-2xl font-light">
      <span className="text-black">Iter</span>
      <span 
        className="inline-block origin-center font-medium text-brand-300"
        style={{ 
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