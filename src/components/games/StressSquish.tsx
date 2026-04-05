import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  spawnedAt: number;
}

const colors = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--calm))",
  "hsl(var(--focus))", "hsl(var(--relax))", "hsl(var(--sleep))",
];

const StressSquish = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const elapsed = useRef(0);

  const getSpawnInterval = () => {
    const t = elapsed.current;
    if (t < 10) return 1200;
    if (t < 20) return 900;
    if (t < 35) return 650;
    if (t < 50) return 450;
    return 300;
  };

  const spawnTarget = useCallback(() => {
    const b: Target = {
      id: Date.now() + Math.random(),
      x: 5 + Math.random() * 85,
      y: 5 + Math.random() * 80,
      size: Math.max(28, 50 - elapsed.current * 0.3),
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setTargets((prev) => [...prev.slice(-14), b]);
  }, []);

  useEffect(() => {
    if (!running) return;
    let spawnTimer: ReturnType<typeof setTimeout>;

    const scheduleSpawn = () => {
      spawnTimer = setTimeout(() => {
        spawnTarget();
        scheduleSpawn();
      }, getSpawnInterval());
    };
    scheduleSpawn();

    const ticker = setInterval(() => {
      elapsed.current += 1;
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(ticker);
          clearTimeout(spawnTimer);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { clearTimeout(spawnTimer); clearInterval(ticker); };
  }, [running, spawnTarget]);

  useEffect(() => {
    if (done) {
      addSession({ type: "game", name: "Aim Trainer", duration: 60, score: hits, mood: Math.min(5, Math.round(hits / 5) + 2) });
    }
  }, [done, hits]);

  const hit = (id: number) => {
    setTargets((prev) => prev.filter((b) => b.id !== id));
    setHits((p) => p + 1);
  };

  const handleMiss = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.arena === "true" && running) {
      setMisses((m) => m + 1);
    }
  };

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Aim <span className="text-primary">Trainer</span></h1>
      <p className="text-muted-foreground mb-4">Hit targets as they appear — intensity increases over time!</p>

      <div className="flex gap-6 mb-4 text-sm">
        <span className="text-foreground font-semibold">Hits: {hits}</span>
        <span className="text-foreground font-semibold">Accuracy: {accuracy}%</span>
        <span className="text-foreground font-semibold">Time: {timeLeft}s</span>
      </div>

      {!running && !done && (
        <Button onClick={() => { setRunning(true); elapsed.current = 0; spawnTarget(); }} className="mb-4 rounded-full px-8">Start</Button>
      )}

      {done && (
        <div className="flex flex-col items-center gap-3 mb-4 p-6 bg-card rounded-xl border border-border">
          <p className="text-lg font-bold text-foreground">You hit {hits} targets! 🎯</p>
          <p className="text-sm text-muted-foreground">Accuracy: {accuracy}%</p>
          <Link to="/games"><Button variant="outline">Back to Games</Button></Link>
        </div>
      )}

      <div
        data-arena="true"
        onClick={handleMiss}
        className="relative w-full h-80 bg-card rounded-xl border border-border overflow-hidden select-none"
        style={{ cursor: running ? "crosshair" : "default" }}
      >
        {targets.map((b) => (
          <button
            key={b.id}
            onClick={(e) => { e.stopPropagation(); hit(b.id); }}
            className="absolute rounded-full transition-transform hover:scale-110 active:scale-75 animate-in fade-in"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              backgroundColor: b.color,
              opacity: 0.85,
              cursor: "crosshair",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default StressSquish;
