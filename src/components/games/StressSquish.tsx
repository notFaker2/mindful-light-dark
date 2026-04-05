import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

const colors = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--calm))",
  "hsl(var(--focus))", "hsl(var(--relax))", "hsl(var(--sleep))",
];

const StressSquish = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const spawnBubble = useCallback(() => {
    const b: Bubble = {
      id: Date.now() + Math.random(),
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 70,
      size: 40 + Math.random() * 30,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setBubbles((prev) => [...prev.slice(-12), b]);
  }, []);

  useEffect(() => {
    if (!running) return;
    const spawner = setInterval(spawnBubble, 800);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(spawner);
          clearInterval(timer);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(spawner); clearInterval(timer); };
  }, [running, spawnBubble]);

  useEffect(() => {
    if (done) {
      addSession({ type: "game", name: "Stress Squish", duration: 30, score: popped, mood: Math.min(5, Math.round(popped / 5) + 2) });
    }
  }, [done, popped]);

  const pop = (id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setPopped((p) => p + 1);
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Stress <span className="text-primary">Squish</span></h1>
      <p className="text-muted-foreground mb-4">Pop bubbles to release stress!</p>

      <div className="flex gap-6 mb-4 text-sm">
        <span className="text-foreground font-semibold">Popped: {popped}</span>
        <span className="text-foreground font-semibold">Time: {timeLeft}s</span>
      </div>

      {!running && !done && (
        <Button onClick={() => { setRunning(true); spawnBubble(); }} className="mb-4 rounded-full px-8">Start</Button>
      )}

      {done && (
        <div className="flex flex-col items-center gap-3 mb-4 p-6 bg-card rounded-xl border border-border">
          <p className="text-lg font-bold text-foreground">You popped {popped} bubbles! 🎉</p>
          <Link to="/games"><Button variant="outline">Back to Games</Button></Link>
        </div>
      )}

      <div className="relative w-full h-80 bg-card rounded-xl border border-border overflow-hidden">
        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={() => pop(b.id)}
            className="absolute rounded-full transition-transform hover:scale-110 active:scale-75 cursor-pointer animate-in fade-in"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              backgroundColor: b.color,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default StressSquish;
