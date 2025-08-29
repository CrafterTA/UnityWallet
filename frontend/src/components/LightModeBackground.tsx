import React from 'react';

const LightModeBackground: React.FC = () => {
  return (
    <>
      {/* Modern light mode background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 via-transparent to-indigo-50/30"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-slate-100/20 to-transparent"></div>
      
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 [background-size:64px_64px] opacity-30 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.08)_1px,transparent_0)]"
        />
        
        {/* Floating geometric shapes - Modern blue theme */}
        <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/30 blur-3xl animate-pulse" />
        <div className="absolute top-40 right-32 w-32 h-32 rounded-full bg-gradient-to-br from-slate-200/50 to-blue-200/40 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-32 w-28 h-28 rounded-full bg-gradient-to-br from-indigo-200/40 to-slate-200/30 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Modern brand elements */}
        <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-blue-100/60 to-indigo-100/40 blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-slate-100/60 to-blue-100/40 blur-3xl opacity-60" />
        
        {/* Subtle lines */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-200/30 to-transparent" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent" />
        
        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50/40 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-50/40 via-transparent to-transparent" />
      </div>

      {/* Animated particles for light theme */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
        <div 
            key={i}
            className="absolute w-1.5 h-1.5 bg-blue-300/50 rounded-full animate-float"
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
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-25px) rotate(180deg); opacity: 1; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default LightModeBackground;
