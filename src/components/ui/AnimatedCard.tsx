
import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  className?: string;
  children: React.ReactNode;
  depth?: number;
  glare?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  className, 
  children, 
  depth = 20,
  glare = true 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // Set up the card's 3D position based on mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to card center
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation based on mouse position
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateY = ((x - centerX) / centerX) * depth;
    const rotateX = ((centerY - y) / centerY) * depth;
    
    // Update rotation state
    setRotation({ x: rotateX, y: rotateY });
    
    // Update position state for subtle movement
    setPosition({ 
      x: ((x - centerX) / centerX) * 5, 
      y: ((y - centerY) / centerY) * 5 
    });
    
    // Update glare position
    if (glare) {
      setGlarePosition({ 
        x: (x / rect.width) * 100, 
        y: (y / rect.height) * 100 
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // Reset rotation when mouse leaves
    setRotation({ x: 0, y: 0 });
    setPosition({ x: 0, y: 0 });
    setGlarePosition({ x: 50, y: 50 });
  };

  // Add a subtle floating animation when not interacting
  useEffect(() => {
    if (!isHovered && cardRef.current) {
      const interval = setInterval(() => {
        const floatX = Math.sin(Date.now() / 2000) * 1.5;
        const floatY = Math.cos(Date.now() / 2500) * 1.5;
        
        setRotation({ x: floatX, y: floatY });
        setPosition({ x: floatX, y: floatY });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative transition-transform duration-200 ease-out transform-gpu will-change-transform",
        className
      )}
      style={{
        transform: `
          perspective(1000px) 
          rotateX(${rotation.x}deg) 
          rotateY(${rotation.y}deg)
          translate3d(${position.x}px, ${position.y}px, 0)
        `,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {/* Optional glare effect */}
      {glare && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-inherit"
          style={{ 
            borderRadius: 'inherit',
            opacity: isHovered ? 0.15 : 0.05
          }}
        >
          <div 
            className="absolute inset-0 w-[300%] h-[300%] bg-gradient-radial from-white via-white/5 to-transparent"
            style={{ 
              top: `${glarePosition.y - 150}%`, 
              left: `${glarePosition.x - 150}%`,
              transition: isHovered ? 'none' : 'all 0.5s ease-out'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AnimatedCard;
