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
          size: Math.random() * 4 + 1,
          speed: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          drift: Math.random() * 0.5 - 0.25
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((snowflake, index) => {
        // Update position
        snowflake.y += snowflake.speed * speed;
        snowflake.x += snowflake.drift;

        // Fade out as it reaches bottom
        const fadeZone = canvas.height * 0.8;
        if (snowflake.y > fadeZone) {
          const fadeProgress = (snowflake.y - fadeZone) / (canvas.height * 0.2);
          snowflake.opacity = Math.max(0, snowflake.opacity * (1 - fadeProgress));
        }

        // Reset snowflake when it goes off screen
        if (snowflake.y > canvas.height + 50 || snowflake.x < -50 || snowflake.x > canvas.width + 50) {
          snowflake.y = -50;
          snowflake.x = Math.random() * canvas.width;
          snowflake.opacity = Math.random() * 0.8 + 0.2;
        }

        // Draw snowflake
        ctx.save();
        
        if (glow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
        }
        
        ctx.globalAlpha = snowflake.opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(snowflake.x, snowflake.y, snowflake.size, 0, Math.PI * 2);
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