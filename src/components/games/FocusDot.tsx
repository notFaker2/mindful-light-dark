import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const FocusDot = () => {
  const [running, setRunning] = useState(false);
  const [dotPos, setDotPos] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const mover = setInterval(() => {
      setDotPos({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 });
    }, 1500);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(mover);
          clearInterval(timer);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(mover); clearInterval(timer); };
  }, [running]);

  useEffect(() => {
    if (done) {
      addSession({ type: "game", name: "Focus Dot", duration: 30, score, mood: score > 15 ? 5 : score > 8 ? 4 : 3 });
    }
  }, [done, score]);

  const handleClick = (e: React.MouseEvent) => {
    if (!running) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const dist = Math.sqrt((clickX - dotPos.x) ** 2 + (clickY - dotPos.y) ** 2);
    if (dist < 8) {
      setScore((s) => s + 1);
      setDotPos({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 });
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Focus <span className="text-primary">Dot</span></h1>
      <p className="text-muted-foreground mb-4">Click the glowing dot as fast as you can!</p>

      <div className="flex gap-6 mb-4 text-sm">
        <span className="text-foreground font-semibold">Score: {score}</span>
        <span className="text-foreground font-semibold">Time: {timeLeft}s</span>
      </div>

      {!running && !done && (
        <Button onClick={() => setRunning(true)} className="mb-4 rounded-full px-8">Start</Button>
      )}

      {done && (
        <div className="flex flex-col items-center gap-3 mb-4 p-6 bg-card rounded-xl border border-border">
          <p className="text-lg font-bold text-foreground">You caught {score} dots! 🎯</p>
          <Link to="/games"><Button variant="outline">Back to Games</Button></Link>
        </div>
      )}

      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative w-full h-72 bg-card rounded-xl border border-border cursor-crosshair overflow-hidden"
      >
        {running && (
          <div
            className="absolute w-6 h-6 rounded-full transition-all duration-300"
            style={{
              left: `${dotPos.x}%`,
              top: `${dotPos.y}%`,
              transform: "translate(-50%, -50%)",
              background: "hsl(var(--primary))",
              boxShadow: "0 0 20px hsl(var(--primary) / 0.6)",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FocusDot;
