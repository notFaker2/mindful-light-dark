import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type BreathingMode = "calm" | "focus" | "relax" | "sleep";

interface ModeConfig {
  label: string;
  pattern: number[];
  patternLabel: string;
  description: string;
  colorVar: string;
}

const modes: Record<BreathingMode, ModeConfig> = {
  calm: { label: "Calm", pattern: [4, 4, 4, 4], patternLabel: "4-4-4-4", description: "Equal breathing for quick calm", colorVar: "var(--calm)" },
  focus: { label: "Focus", pattern: [4, 4, 6, 6], patternLabel: "4-4-6-6", description: "Extended exhale for deep focus", colorVar: "var(--focus)" },
  relax: { label: "Deep Relax", pattern: [5, 5, 7, 7], patternLabel: "5-5-7-7", description: "Slow rhythm for relaxation", colorVar: "var(--relax)" },
  sleep: { label: "Sleep", pattern: [4, 7, 8, 8], patternLabel: "4-7-8-8", description: "Classic 4-7-8 for sleep", colorVar: "var(--sleep)" },
};

const phases = ["Breathe In", "Hold", "Breathe Out", "Hold"];

const BreathingExercise = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<BreathingMode>("calm");
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [circleScale, setCircleScale] = useState(0.6);
  const [sessionSaved, setSessionSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = modes[mode];

  const stopTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (durationRef.current) clearInterval(durationRef.current);
  }, []);

  // Save to Supabase (only if user is logged in)
  const saveToSupabase = async (duration: number, cycleCount: number, modeName: string) => {
    if (!user) {
      console.log("User not logged in, skipping Supabase save");
      return;
    }

    try {
      // Calculate mood based on cycles completed
      const mood = cycleCount > 10 ? 5 : cycleCount > 5 ? 4 : cycleCount > 2 ? 3 : 4;
      
      // Prepare details as JSONB
      const details = {
        cycles: cycleCount,
        pattern: config.patternLabel,
        pattern_details: config.pattern
      };

      const { error } = await supabase
        .from('wellness_sessions')
        .insert([
          {
            user_id: user.id,
            type: 'breathing',
            name: modeName,
            duration: duration,
            score: cycleCount,
            mood: mood,
            details: details,
            date: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      console.log('✅ Breathing session saved to Supabase');
    } catch (error) {
      console.error('❌ Failed to save to Supabase:', error);
    }
  };

  const reset = useCallback(async () => {
    // Save session if we had cycles
    if (cycles > 0 && totalSeconds > 0 && !sessionSaved) {
      const moodValue = cycles > 10 ? 5 : cycles > 5 ? 4 : cycles > 2 ? 3 : 4;
      
      // Always save to local storage (works for both logged in and guest users)
      addSession({ 
        type: "breathing", 
        name: config.label, 
        duration: totalSeconds, 
        score: cycles, 
        mood: moodValue 
      });
      
      // Save to Supabase only if user is logged in
      if (user) {
        await saveToSupabase(totalSeconds, cycles, config.label);
      } else {
        console.log("Guest user: Session saved only locally");
      }
      setSessionSaved(true);
    }
    
    stopTimers();
    setIsRunning(false);
    setPhaseIndex(0);
    setTimeLeft(0);
    setCycles(0);
    setTotalSeconds(0);
    setCircleScale(0.6);
  }, [stopTimers, cycles, totalSeconds, config.label, sessionSaved, user]);

  // Reset sessionSaved when mode changes or new session starts
  useEffect(() => {
    setSessionSaved(false);
  }, [mode]);

  useEffect(() => {
    if (!isRunning) return;

    const pattern = modes[mode].pattern;
    let currentPhase = 0;
    let remaining = pattern[0];

    setPhaseIndex(0);
    setTimeLeft(remaining);
    updateCircle(0);

    intervalRef.current = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        currentPhase++;
        if (currentPhase >= 4) {
          currentPhase = 0;
          setCycles((c) => c + 1);
        }
        remaining = pattern[currentPhase];
        setPhaseIndex(currentPhase);
        updateCircle(currentPhase);
      }
      setTimeLeft(remaining);
    }, 1000);

    durationRef.current = setInterval(() => {
      setTotalSeconds((s) => s + 1);
    }, 1000);

    return stopTimers;
  }, [isRunning, mode, stopTimers]);

  function updateCircle(phase: number) {
    if (phase === 0) setCircleScale(1);
    else if (phase === 2) setCircleScale(0.6);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentPattern = config.pattern.slice(0, 3).join("-");

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">
        Breathing <span className="text-primary">Exercise</span>
      </h1>
      <p className="text-muted-foreground mb-8">Choose a mode and follow the rhythm</p>

      {/* Show guest mode indicator */}
      {!user && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20 text-center max-w-md">
          <p className="text-sm text-primary font-medium">
            🧘 You're in guest mode. Your sessions will be saved locally.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <Link to="/auth" className="text-primary hover:underline">Login</Link> to save your progress to the cloud
          </p>
        </div>
      )}

      {/* Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-10">
        {(Object.entries(modes) as [BreathingMode, ModeConfig][]).map(([key, m]) => (
          <button
            key={key}
            onClick={() => { if (!isRunning) { setMode(key); reset(); } }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              mode === key
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-primary/30 hover:bg-card/80"
            }`}
          >
            <div
              className="w-8 h-8 rounded-full opacity-70"
              style={{ backgroundColor: `hsl(${m.colorVar})` }}
            />
            <span className="font-semibold text-sm text-foreground">{m.label}</span>
            <span className="text-xs text-muted-foreground">{m.patternLabel}</span>
          </button>
        ))}
      </div>

      {/* Breathing Circle */}
      <div className="breathing-circle w-56 h-56 sm:w-64 sm:h-64 mb-8">
        <div
          className="breathing-circle-inner w-24 h-24 flex flex-col items-center justify-center"
          style={{
            transform: `scale(${circleScale})`,
            transition: isRunning ? `transform ${config.pattern[phaseIndex]}s ease-in-out` : "transform 0.3s ease",
          }}
        >
          <span className="text-primary-foreground font-bold text-lg drop-shadow-sm">
            {isRunning ? phases[phaseIndex] : "Ready"}
          </span>
          {!isRunning && (
            <span className="text-primary-foreground/70 text-xs text-center px-2 mt-0.5">
              {config.description}
            </span>
          )}
          {isRunning && (
            <span className="text-primary-foreground/80 text-2xl font-bold mt-1">{timeLeft}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          className="gap-2 px-8 h-12 rounded-full text-base"
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isRunning ? "Pause" : "Start"}
        </Button>
        <Button variant="ghost" onClick={reset} className="gap-2 text-muted-foreground">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {[
          { value: cycles.toString(), label: "Cycles" },
          { value: formatTime(totalSeconds), label: "Duration" },
          { value: currentPattern, label: "Pattern" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center p-4 bg-card rounded-xl border border-border">
            <span className="text-2xl font-bold text-primary">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BreathingExercise;