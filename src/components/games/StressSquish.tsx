import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft, Trophy, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  spawnedAt: number;
}

interface HighScore {
  id: string;
  user_uid: string;
  hits: number;
  accuracy: number;
  created_at: string;
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
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [personalBest, setPersonalBest] = useState<HighScore | null>(null);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const elapsed = useRef(0);
  const [gameEnded, setGameEnded] = useState(false);

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
      spawnedAt: Date.now(),
    };
    setTargets((prev) => [...prev.slice(-14), b]);
  }, []);

  // Fetch high scores from database
  const fetchHighScores = useCallback(async () => {
    setIsLoadingScores(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserUID = user?.id;

      // Fetch top 10 high scores by accuracy
      const { data: topScores, error: topError } = await supabase
        .from('game_sessions')
        .select('id, user_uid, hits, accuracy, created_at')
        .eq('game_type', 'aim_trainer')
        .order('accuracy', { ascending: false })
        .limit(10);

      if (topError) throw topError;
      setHighScores(topScores || []);

      // Fetch personal best if user is logged in
      if (currentUserUID) {
        const { data: personal, error: personalError } = await supabase
          .from('game_sessions')
          .select('id, user_uid, hits, accuracy, created_at')
          .eq('user_uid', currentUserUID)
          .eq('game_type', 'aim_trainer')
          .order('accuracy', { ascending: false })
          .limit(1);

        if (personalError) throw personalError;
        setPersonalBest(personal?.[0] || null);
      }
    } catch (error) {
      console.error('Error fetching high scores:', error);
    } finally {
      setIsLoadingScores(false);
    }
  }, []);

  // Auto-remove targets after a timeout (shorter as game progresses)
  useEffect(() => {
    if (!running || targets.length === 0) return;
    const lifetime = Math.max(1500, 3000 - elapsed.current * 25);
    const interval = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => {
        const expired = prev.filter((t) => now - t.spawnedAt >= lifetime);
        if (expired.length > 0) setMisses((m) => m + expired.length);
        return prev.filter((t) => now - t.spawnedAt < lifetime);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [running, targets.length]);

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
          setGameEnded(true);  
          setTargets([]); 
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { clearTimeout(spawnTimer); clearInterval(ticker); };
  }, [running, spawnTarget]);

  // Save game and refresh high scores when done
  useEffect(() => {
    const saveGameToSupabase = async () => {
      if (done) {
        const totalShots = hits + misses;
        const accuracyPercent = totalShots > 0 
          ? Math.round((hits / totalShots) * 100) 
          : 0;
        
        // Save to local storage
        addSession({ 
          type: "game", 
          name: "Aim Trainer", 
          duration: 60, 
          score: hits, 
          mood: Math.min(5, Math.round(hits / 5) + 2),
          accuracy: accuracyPercent
        });
        
        // Save to Supabase
        try {
          // Get or create user
          let { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            const { data: { session } } = await supabase.auth.signInAnonymously();
            user = session?.user;
          }
          
          const userUID = user?.id || 'anonymous_user';
          
          const { error } = await supabase
            .from('game_sessions')
            .insert([
              {
                user_uid: userUID,
                game_type: 'aim_trainer',
                hits: hits,
                misses: misses,
                total_shots: totalShots,
                accuracy: accuracyPercent,
                duration: 60,
                completed_at: new Date().toISOString()
              }
            ]);
          
          if (error) throw error;
          console.log('✅ Game saved to Supabase with accuracy:', accuracyPercent + '%');
          
          // Refresh high scores after saving
          await fetchHighScores();
        } catch (error) {
          console.error('❌ Failed to save to Supabase:', error);
        }
      }
    };
    
    saveGameToSupabase();
  }, [done, hits, misses, fetchHighScores]);

  // Fetch high scores on component mount
  useEffect(() => {
    fetchHighScores();
  }, [fetchHighScores]);

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
  const totalShots = hits + misses;

  const startGame = () => {
    setHits(0);
    setMisses(0);
    setTimeLeft(60);
    setDone(false);
    setRunning(true);
    elapsed.current = 0;
    spawnTarget();
    setGameEnded(false); 
    setTargets([]); 
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-6xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Game Area */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-2">Aim <span className="text-primary">Trainer</span></h1>
          <p className="text-muted-foreground mb-4">Hit targets as they appear — intensity increases over time!</p>

          <div className="flex gap-6 mb-4 text-sm">
            <span className="text-foreground font-semibold">🎯 Hits: {hits}</span>
            <span className="text-foreground font-semibold">🎪 Misses: {misses}</span>
            <span className="text-foreground font-semibold">📊 Accuracy: {accuracy}%</span>
            <span className="text-foreground font-semibold">⏱️ Time: {timeLeft}s</span>
          </div>

          {!running && !done && (
            <Button onClick={startGame} className="mb-4 rounded-full px-8">
              Start Game
            </Button>
          )}

          {done && (
            <div className="flex flex-col items-center gap-3 mb-4 p-6 bg-card rounded-xl border border-border">
              <p className="text-lg font-bold text-foreground">🎉 You hit {hits} targets! 🎯</p>
              <p className="text-sm text-muted-foreground">
                Shots: {totalShots} | Accuracy: {accuracy}%
              </p>
              <Button onClick={startGame} className="rounded-full px-8">
                Play Again
              </Button>
            </div>
          )}

          <div
            data-arena="true"
            onClick={handleMiss}
            className="relative w-full h-96 bg-card rounded-xl border border-border overflow-hidden select-none"
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

        {/* High Scores Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold">Leaderboard</h2>
            </div>

            {isLoadingScores && highScores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading scores...
              </div>
            ) : (
              <>
                {/* Personal Best */}
                {personalBest && (
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Your Best</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold">{personalBest.accuracy}%</p>
                        <p className="text-xs text-muted-foreground">{personalBest.hits} hits</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(personalBest.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Scores List */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Top 10 Accuracy</span>
                  </div>
                  
                  {highScores.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground text-sm">
                      No scores yet. Be the first!
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {highScores.map((score, index) => (
                        <div
                          key={score.id}
                          className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                            personalBest?.id === score.id
                              ? 'bg-primary/5 border border-primary/20'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-bold w-6 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-amber-600' :
                              'text-muted-foreground'
                            }`}>
                              #{index + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-sm">
                                {score.accuracy}% accuracy
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {score.hits} hits
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(score.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={fetchHighScores}
                  className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoadingScores}
                >
                  {isLoadingScores ? "Refreshing..." : "↻ Refresh Scores"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressSquish;