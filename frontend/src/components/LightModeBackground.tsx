import React from 'react';

const LightModeBackground: React.FC = () => {
  return (
    <>
      {/* Light mode background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-red-50/40 via-transparent to-yellow-50/40"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-orange-50/30 to-transparent"></div>
      
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 [background-size:32px_32px] opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(239,30,36,0.1)_1px,transparent_0)]"
        />
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-red-100/60 to-red-200/40 blur-2xl animate-pulse" />
        <div className="absolute top-40 right-32 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100/60 to-yellow-200/40 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-32 w-20 h-20 rounded-full bg-gradient-to-br from-blue-100/60 to-blue-200/40 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* HDBank brand elements */}
        <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-red-50/80 to-red-100/60 blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-50/80 to-yellow-100/60 blur-3xl opacity-60" />
        
        {/* Subtle lines */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-red-100/30 to-transparent" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-100/30 to-transparent" />
        
        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-50/40 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-50/40 via-transparent to-transparent" />
      </div>

      {/* Animated particles for light theme */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
        <div 
            key={i}
            className="absolute w-1 h-1 bg-red-200/60 rounded-full animate-float"
          style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default LightModeBackground;
