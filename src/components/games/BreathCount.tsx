import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const BreathCount = () => {
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [timeLeft, setTimeLeft] = useState(60);
  const [done, setDone] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (done) {
      addSession({ type: "game", name: "Breath Count", duration: 60, score: count, mood: count > 10 ? 5 : count > 5 ? 4 : 3 });
    }
  }, [done, count]);

  const tap = () => {
    if (!running) return;
    if (phase === "in") {
      setPhase("out");
    } else {
      setPhase("in");
      setCount((c) => c + 1);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Breath <span className="text-primary">Count</span></h1>
      <p className="text-muted-foreground mb-4">Tap to count your breathing cycles</p>

      <div className="flex gap-6 mb-4 text-sm">
        <span className="text-foreground font-semibold">Cycles: {count}</span>
        <span className="text-foreground font-semibold">Time: {timeLeft}s</span>
      </div>

      {!running && !done && (
        <Button onClick={() => setRunning(true)} className="mb-6 rounded-full px-8">Start</Button>
      )}

      {done && (
        <div className="flex flex-col items-center gap-3 mb-4 p-6 bg-card rounded-xl border border-border">
          <p className="text-lg font-bold text-foreground">{count} cycles completed! 🌊</p>
          <Link to="/games"><Button variant="outline">Back to Games</Button></Link>
        </div>
      )}

      {running && (
        <button
          onClick={tap}
          className="breathing-circle w-48 h-48 mb-4 cursor-pointer"
        >
          <div className="breathing-circle-inner w-20 h-20 flex flex-col items-center justify-center"
            style={{
              transform: phase === "in" ? "scale(1)" : "scale(0.6)",
              transition: "transform 0.5s ease",
            }}
          >
            <span className="text-primary-foreground font-bold text-sm drop-shadow-sm">
              {phase === "in" ? "Breathe In" : "Breathe Out"}
            </span>
            <span className="text-primary-foreground/80 text-xs mt-1">Tap</span>
          </div>
        </button>
      )}
    </div>
  );
};

export default BreathCount;
