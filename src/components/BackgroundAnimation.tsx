import React from 'react';

const BackgroundAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Animated grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-darker via-cyber-dark to-cyber-gray">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute top-0 left-0 w-full h-full">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyber-blue rounded-full animate-float opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyber-purple/10 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-cyber-green/10 to-transparent"></div>
    </div>
  );
};

export default BackgroundAnimation;