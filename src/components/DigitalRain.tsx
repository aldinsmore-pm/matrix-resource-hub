
import { useEffect, useRef } from "react";

interface DigitalRainProps {
  opacity?: number;
  density?: number;
  speed?: number;
}

const DigitalRain = ({ 
  opacity = 0.03, 
  density = 25, 
  speed = 0.8 
}: DigitalRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // More refined character set - fewer special characters for cleaner look
    const matrix = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    const characters = matrix.split("");

    const fontSize = 12; // Smaller font size for more elegance
    const columns = Math.ceil(canvas.width / fontSize * (density / 40));

    // Create drops - one per column
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -canvas.height;
    }

    // Drawing the characters
    const draw = () => {
      // Black background with higher opacity to fade characters more quickly
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 12})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Green text
      ctx.fillStyle = "#0DFF1C";
      ctx.font = `${fontSize}px monospace`;

      // For each column
      for (let i = 0; i < drops.length; i++) {
        // Only draw some characters (based on density)
        if (Math.random() > 0.5) {
          // Draw a random character
          const randomChar = characters[Math.floor(Math.random() * characters.length)];
          
          // More subtle brightness variations
          const brightness = Math.random() * 0.2 + 0.2; // Lower brightness range
          ctx.fillStyle = `rgba(13, 255, 28, ${brightness})`;
          
          // Draw the character
          ctx.fillText(
            randomChar,
            i * fontSize * (40 / density),
            drops[i] * speed
          );
        }

        // Randomly reset drop to top at varying speeds with more intermittent timing
        if (drops[i] * speed > canvas.height && Math.random() > 0.99) {
          drops[i] = 0;
        }

        // Move drop to next position more slowly
        drops[i] += 0.5;
      }
    };

    const interval = setInterval(draw, 50); // Slower refresh rate for more subtle animation

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const newColumns = Math.ceil(canvas.width / fontSize * (density / 40));
      
      // Adjust drops array for new width
      if (newColumns > drops.length) {
        for (let i = drops.length; i < newColumns; i++) {
          drops[i] = Math.random() * -canvas.height;
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, [opacity, density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-70"
    />
  );
};

export default DigitalRain;
