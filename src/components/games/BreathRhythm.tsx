import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const BreathRhythm = () => {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "exhale">("inhale");
  const [orbScale, setOrbScale] = useState(0.5);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [done, setDone] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (!running) return;
    const cycler = setInterval(() => {
      setPhase((p) => {
        const next = p === "inhale" ? "exhale" : "inhale";
        setOrbScale(next === "inhale" ? 1 : 0.5);
        return next;
      });
    }, 4000);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(cycler);
          clearInterval(timer);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(cycler); clearInterval(timer); };
  }, [running]);

  useEffect(() => {
    if (done) {
      addSession({ type: "game", name: "Breath Rhythm", duration: 45, score, mood: score > 8 ? 5 : score > 4 ? 4 : 3 });
    }
  }, [done, score]);

  const handleTap = () => {
    if (!running) return;
    // Score if tapping during inhale (expanding), miss during exhale
    if (phaseRef.current === "inhale") {
      setScore((s) => s + 1);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Breath <span className="text-primary">Rhythm</span></h1>
      <p className="text-muted-foreground mb-4">Tap the orb when it expands (inhale phase)</p>

      <div className="flex gap-6 mb-4 text-sm">
        <span className="text-foreground font-semibold">Score: {score}</span>
        <span className="text-foreground font-semibold">Time: {timeLeft}s</span>
      </div>

      {!running && !done && (
        <Button onClick={() => { setRunning(true); setOrbScale(1); setPhase("inhale"); }} className="mb-6 rounded-full px-8">Start</Button>
      )}

      {done && (
        <div className="flex flex-col items-center gap-3 mb-4 p-6 bg-card rounded-xl border border-border">
          <p className="text-lg font-bold text-foreground">Score: {score} 🎉</p>
          <Link to="/games"><Button variant="outline">Back to Games</Button></Link>
        </div>
      )}

      <button
        onClick={handleTap}
        className="breathing-circle w-48 h-48 mb-4 cursor-pointer"
        disabled={!running}
      >
        <div
          className="breathing-circle-inner w-20 h-20 flex items-center justify-center"
          style={{
            transform: `scale(${orbScale})`,
            transition: "transform 4s ease-in-out",
          }}
        >
          <span className="text-primary-foreground font-bold text-sm drop-shadow-sm">
            {running ? phase === "inhale" ? "Tap!" : "Wait..." : "Ready"}
          </span>
        </div>
      </button>
      <p className="text-xs text-muted-foreground">{running ? (phase === "inhale" ? "Inhale — tap now!" : "Exhale — wait...") : ""}</p>
    </div>
  );
};

export default BreathRhythm;
