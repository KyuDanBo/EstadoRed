import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  lightText?: boolean;
}

export default function EstadoRedLogo({ 
  className = '', 
  showText = true, 
  textSize = 'md',
  lightText = false
}: LogoProps) {
  
  const textSizes = {
    sm: 'text-xl md:text-2xl',
    md: 'text-2xl md:text-3xl',
    lg: 'text-3xl md:text-4xl',
    xl: 'text-4xl md:text-5xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Hand-drawn Woven Lines (Knot) SVG */}
      <svg 
        viewBox="0 0 540 160" 
        className="w-full h-auto max-w-[340px] drop-shadow-[0_2px_4px_rgba(43,41,39,0.05)]"
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Sky Blue Line: Starts bottom-left, ascends, weaves, ends top-right */}
        <path 
          d="M 40,115 C 90,115 120,118 150,110 C 180,100 200,82 230,62 C 248,50 265,45 280,45 C 298,45 315,58 330,78 C 345,98 365,115 385,108 C 405,102 435,55 500,55" 
          stroke="#7CA7C5" 
          strokeWidth="7"
          className="opacity-95"
        />
        
        {/* Sandalwood Brown Line: Starts top-left, descends, weaves, ends bottom-right */}
        <path 
          d="M 40,55 C 90,55 120,52 150,60 C 180,70 200,88 230,108 C 248,120 265,125 280,125 C 298,125 315,112 330,92 C 345,72 365,55 385,62 C 405,68 435,115 500,115" 
          stroke="#A06A42" 
          strokeWidth="7.5"
          className="opacity-95"
        />
        
        {/* Palm Green Line: Starts middle-left, weaves horizontally through the loops, ends middle-right */}
        <path 
          d="M 40,85 C 90,85 130,95 160,85 C 185,76 200,55 220,55 C 240,55 255,75 270,95 C 285,115 300,125 320,125 C 340,125 355,105 372,85 C 388,66 408,55 428,70 C 448,85 470,85 500,85" 
          stroke="#2D5B3A" 
          strokeWidth="8"
          className="opacity-95"
        />

        {/* Small subtle hand-drawn texture lines */}
        <path d="M 120, 80 Q 130, 88 140, 82" stroke="#2D5B3A" strokeWidth="2.5" className="opacity-40" />
        <path d="M 390, 75 Q 400, 68 410, 76" stroke="#A06A42" strokeWidth="2.5" className="opacity-40" />
      </svg>

      {showText && (
        <div className={`mt-4 text-center ${lightText ? 'text-white' : 'text-charcoal'}`}>
          <h1 className={`${textSizes[textSize]} font-medium tracking-tight font-sans`}>
            <span>Estado</span>
            <span className="font-light text-charcoal/70">Red</span>
          </h1>
          <p className={`text-[9px] sm:text-xs md:text-sm tracking-[0.1em] sm:tracking-[0.2em] uppercase font-sans mt-2 opacity-70 ${lightText ? 'text-white/80' : 'text-charcoal/80'}`}>
            Gobernanza Comunitaria & Red Democrática
          </p>
        </div>
      )}
    </div>
  );
}
