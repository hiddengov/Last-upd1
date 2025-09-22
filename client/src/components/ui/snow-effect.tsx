import { useEffect, useRef } from 'react';

interface SnowEffectProps {
  color?: string;
  glow?: boolean;
  density?: number;
  speed?: number;
}

export default function SnowEffect({ 
  color = '#ffffff', 
  glow = true, 
  density = 50, 
  speed = 1 
}: SnowEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const snowflakesRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    drift: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initSnowflakes = () => {
      snowflakesRef.current = [];
      for (let i = 0; i < density; i++) {
        snowflakesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 0.5, // Smaller, more consistent size range
          speed: Math.random() * 1.5 + 0.3, // Slower, more consistent speed
          opacity: Math.random() * 0.6 + 0.3, // More visible opacity range
          drift: Math.random() * 0.3 - 0.15 // Less drift to prevent going off-screen
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((snowflake, index) => {
        // Update position
        snowflake.y += snowflake.speed * speed;
        snowflake.x += snowflake.drift;

        // Reset snowflake when it goes off screen (remove fade logic causing glitches)
        if (snowflake.y > canvas.height + 10 || snowflake.x < -10 || snowflake.x > canvas.width + 10) {
          snowflake.y = -10;
          snowflake.x = Math.random() * canvas.width;
          snowflake.opacity = Math.random() * 0.8 + 0.2;
          snowflake.size = Math.random() * 4 + 1; // Reset size to prevent large flakes
        }

        // Draw snowflake with size constraints
        ctx.save();
        
        // Ensure snowflake size stays within bounds
        const constrainedSize = Math.min(Math.max(snowflake.size, 0.5), 4);
        
        if (glow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
        }
        
        ctx.globalAlpha = Math.min(Math.max(snowflake.opacity, 0), 1);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(snowflake.x, snowflake.y, constrainedSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initSnowflakes();
    animate();

    const handleResize = () => {
      resizeCanvas();
      initSnowflakes();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color, glow, density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
}