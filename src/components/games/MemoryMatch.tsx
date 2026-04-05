import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft, RotateCcw, Trophy, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const emojis = ["🧘", "🌿", "💧", "🌸", "⭐", "🌊", "🦋", "🌙"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

interface HighScore {
  id: string;
  user_uid: string;
  moves: number;
  duration: number;
  created_at: string;
}

const MemoryMatch = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [done, setDone] = useState(false);
  const [locked, setLocked] = useState(false);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [personalBest, setPersonalBest] = useState<HighScore | null>(null);
  const [isLoadingScores, setIsLoadingScores] = useState(false);

  // Fetch high scores from database (lowest moves = best)
  const fetchHighScores = useCallback(async () => {
    setIsLoadingScores(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserUID = user?.id;

      // Fetch top 10 high scores by moves (ascending = lowest moves first)
      const { data: topScores, error: topError } = await supabase
        .from('game_sessions')
        .select('id, user_uid, moves, duration, created_at')
        .eq('game_type', 'memory_match')
        .order('moves', { ascending: true }) // Lowest moves first
        .limit(10);

      if (topError) throw topError;
      setHighScores(topScores || []);

      // Fetch personal best if user is logged in
      if (currentUserUID) {
        const { data: personal, error: personalError } = await supabase
          .from('game_sessions')
          .select('id, user_uid, moves, duration, created_at')
          .eq('user_uid', currentUserUID)
          .eq('game_type', 'memory_match')
          .order('moves', { ascending: true })
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

  const initGame = () => {
    const pairs = emojis.flatMap((e, i) => [
      { id: i * 2, emoji: e, flipped: false, matched: false },
      { id: i * 2 + 1, emoji: e, flipped: false, matched: false },
    ]);
    setCards(pairs.sort(() => Math.random() - 0.5));
    setSelected([]);
    setMoves(0);
    setStartTime(Date.now());
    setDone(false);
    setLocked(false);
  };

  useEffect(() => { 
    initGame(); 
    fetchHighScores(); // Fetch scores on mount
  }, [fetchHighScores]);

  const flipCard = (id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (selected.includes(id)) return;

    const newSelected = [...selected, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const first = cards.find((c) => c.id === newSelected[0])!;
      const second = card;

      if (first.emoji === second.emoji) {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (newSelected.includes(c.id) ? { ...c, matched: true } : c)));
          setSelected([]);
          setLocked(false);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (newSelected.includes(c.id) ? { ...c, flipped: false } : c)));
          setSelected([]);
          setLocked(false);
        }, 800);
      }
    } else {
      setSelected(newSelected);
    }
  };

  // Save game and refresh high scores when done
  useEffect(() => {
    const saveGameToSupabase = async () => {
      if (cards.length > 0 && cards.every((c) => c.matched) && !done) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        // Save to local storage
        addSession({ 
          type: "game", 
          name: "Memory Match", 
          duration, 
          score: moves, 
          mood: moves < 12 ? 5 : moves < 18 ? 4 : 3 
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
                game_type: 'memory_match',
                moves: moves,
                duration: duration,
                completed_at: new Date().toISOString()
              }
            ]);
          
          if (error) throw error;
          console.log('✅ Game saved to Supabase with moves:', moves);
          
          // Refresh high scores after saving
          await fetchHighScores();
        } catch (error) {
          console.error('❌ Failed to save to Supabase:', error);
        }
        
        setDone(true);
      }
    };
    
    saveGameToSupabase();
  }, [cards, done, moves, startTime, fetchHighScores]);

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-6xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Game Area */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-2">Memory <span className="text-primary">Match</span></h1>
          <p className="text-muted-foreground mb-4">Find matching pairs to test your focus</p>
          
          <div className="flex gap-6 mb-4 text-sm">
            <span className="text-foreground font-semibold">🎯 Moves: {moves}</span>
            {startTime > 0 && !done && (
              <span className="text-foreground font-semibold">⏱️ Time: {Math.round((Date.now() - startTime) / 1000)}s</span>
            )}
          </div>

          {done && (
            <div className="flex flex-col items-center gap-3 mb-4 p-6 bg-card rounded-xl border border-border">
              <p className="text-lg font-bold text-foreground">🎉 Completed in {moves} moves! 🎉</p>
              <p className="text-sm text-muted-foreground">
                {moves < 12 ? "🌟 Excellent memory!" : moves < 18 ? "👍 Good job!" : "💪 Keep practicing!"}
              </p>
              <div className="flex gap-2">
                <Button onClick={initGame} variant="outline" className="gap-1">
                  <RotateCcw className="h-4 w-4" /> Play Again
                </Button>
                <Link to="/games">
                  <Button variant="outline">Back</Button>
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3 w-full max-w-sm mx-auto">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => flipCard(card.id)}
                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all border ${
                  card.matched
                    ? "bg-primary/10 border-primary/30"
                    : card.flipped
                    ? "bg-card border-primary shadow-md"
                    : "bg-secondary border-border hover:border-primary/30 cursor-pointer"
                }`}
              >
                {card.flipped || card.matched ? card.emoji : "?"}
              </button>
            ))}
          </div>
        </div>

        {/* High Scores Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold">Leaderboard</h2>
              <span className="text-xs text-muted-foreground ml-auto">Fewest moves ↓</span>
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
                        <p className="text-2xl font-bold">{personalBest.moves} moves</p>
                        <p className="text-xs text-muted-foreground">{personalBest.duration}s time</p>
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
                    <span className="text-sm font-medium text-muted-foreground">Top 10 Fewest Moves</span>
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
                                {score.moves} moves
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {score.duration}s
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

export default MemoryMatch;