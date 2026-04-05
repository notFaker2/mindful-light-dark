import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft, Trophy, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface HighScore {
  id: string;
  user_uid: string;
  accuracy: number;
  hits: number;
  misses: number;
  duration: number;
  created_at: string;
}

const FocusDot = () => {
  const [running, setRunning] = useState(false);
  const [dotPos, setDotPos] = useState({ x: 50, y: 50 });
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [done, setDone] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [personalBest, setPersonalBest] = useState<HighScore | null>(null);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate accuracy percentage
  const totalClicks = hits + misses;
  const accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 0;

  // Fetch high scores from database (highest accuracy = best)
  const fetchHighScores = useCallback(async () => {
    setIsLoadingScores(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserUID = user?.id;

      // Fetch top 10 high scores by accuracy (descending = highest accuracy first)
      const { data: topScores, error: topError } = await supabase
        .from('game_sessions')
        .select('id, user_uid, accuracy, hits, misses, duration, created_at')
        .eq('game_type', 'focus_dot')
        .order('accuracy', { ascending: false }) // Highest accuracy first
        .limit(10);

      if (topError) throw topError;
      setHighScores(topScores || []);

      // Fetch personal best if user is logged in
      if (currentUserUID) {
        const { data: personal, error: personalError } = await supabase
          .from('game_sessions')
          .select('id, user_uid, accuracy, hits, misses, duration, created_at')
          .eq('user_uid', currentUserUID)
          .eq('game_type', 'focus_dot')
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

  useEffect(() => {
    fetchHighScores();
  }, [fetchHighScores]);

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

  // Save game and refresh high scores when done
  useEffect(() => {
    const saveGameToSupabase = async () => {
      if (done) {
        const totalAttempts = hits + misses;
        const accuracyPercent = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
        
        // Save to local storage
        addSession({ 
          type: "game", 
          name: "Focus Dot", 
          duration: 30, 
          score: hits, 
          accuracy: accuracyPercent,
          mood: accuracyPercent > 80 ? 5 : accuracyPercent > 60 ? 4 : 3 
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
                game_type: 'focus_dot',
                hits: hits,
                misses: misses,
                total_shots: totalAttempts,
                accuracy: accuracyPercent,
                duration: 30,
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

  const handleClick = (e: React.MouseEvent) => {
    if (!running) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    const dist = Math.sqrt((clickX - dotPos.x) ** 2 + (clickY - dotPos.y) ** 2);
    
    if (dist < 8) {
      // Hit the dot
      setHits((s) => s + 1);
      setDotPos({ x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 });
    } else {
      // Missed the dot
      setMisses((m) => m + 1);
    }
  };

  const startGame = () => {
    setHits(0);
    setMisses(0);
    setTimeLeft(30);
    setDone(false);
    setRunning(true);
    setDotPos({ x: 50, y: 50 });
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-6xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Game Area */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-2">Focus <span className="text-primary">Dot</span></h1>
          <p className="text-muted-foreground mb-4">Click the glowing dot as fast and accurately as you can!</p>

          <div className="flex gap-6 mb-4 text-sm">
            <span className="text-foreground font-semibold">🎯 Hits: {hits}</span>
            <span className="text-foreground font-semibold">❌ Misses: {misses}</span>
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
              <p className="text-lg font-bold text-foreground">🎉 Accuracy: {accuracy}%! 🎯</p>
              <p className="text-sm text-muted-foreground">
                Hits: {hits} | Misses: {misses} | Total: {hits + misses}
              </p>
              <p className="text-sm text-muted-foreground">
                {accuracy >= 80 ? "🌟 Excellent precision!" : accuracy >= 60 ? "👍 Good focus!" : "💪 Keep practicing!"}
              </p>
              <div className="flex gap-2">
                <Button onClick={startGame} className="rounded-full px-8">
                  Play Again
                </Button>
                <Link to="/games">
                  <Button variant="outline">Back</Button>
                </Link>
              </div>
            </div>
          )}

          <div
            ref={containerRef}
            onClick={handleClick}
            className="relative w-full h-96 bg-card rounded-xl border border-border cursor-crosshair overflow-hidden"
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

        {/* High Scores Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold">Leaderboard</h2>
              <span className="text-xs text-muted-foreground ml-auto">Highest accuracy ↑</span>
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
                        <p className="text-xs text-muted-foreground">
                          {personalBest.hits} hits / {personalBest.hits + personalBest.misses} attempts
                        </p>
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
                    <span className="text-sm font-medium text-muted-foreground">Top 10 Highest Accuracy</span>
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
                                {score.hits} hits / {score.hits + score.misses} attempts
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

export default FocusDot;