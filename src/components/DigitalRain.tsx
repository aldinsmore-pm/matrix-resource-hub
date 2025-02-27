
import { useEffect, useRef } from "react";

interface DigitalRainProps {
  opacity?: number;
  density?: number;
  speed?: number;
}

const DigitalRain = ({ 
  opacity = 0.05, 
  density = 40, 
  speed = 1.5 
}: DigitalRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Matrix characters - using tech-related characters
    const matrix = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()+~{}[]|/\\<>!?";
    const characters = matrix.split("");

    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize);

    // Create drops - one per column
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -canvas.height;
    }

    // Drawing the characters
    const draw = () => {
      // Black background with opacity to create trail effect
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 10})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Green text
      ctx.fillStyle = "#0DFF1C";
      ctx.font = `${fontSize}px monospace`;

      // For each column
      for (let i = 0; i < drops.length; i++) {
        // Draw a random character
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        
        // Vary the brightness slightly for more visual interest
        const brightness = Math.random() * 0.5 + 0.5;
        ctx.fillStyle = `rgba(13, 255, 28, ${brightness})`;
        
        // Draw the character
        ctx.fillText(
          randomChar,
          i * fontSize,
          drops[i] * speed
        );

        // Randomly reset drop to top at varying speeds
        if (drops[i] * speed > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Move drop to next position
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const newColumns = Math.ceil(canvas.width / fontSize);
      
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
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default DigitalRain;
