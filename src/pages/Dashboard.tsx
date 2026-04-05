import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Activity, BarChart3, Clock, Smile, Wind, Gamepad2, Target, Brain, Eye, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllSessions, getTotalMinutes, getAverageMood, getRecentSessions } from "@/lib/wellnessStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GameSession {
  id: string;
  game_type: string;
  score: number;
  accuracy: number;
  hits: number;
  misses: number;
  moves: number;
  duration: number;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stressLevel, setStressLevel] = useState(65); // Example calculation
  const [focusScore, setFocusScore] = useState(72); // Example calculation
  
  const sessions = getAllSessions();
  const recent = getRecentSessions(7);
  const totalMin = getTotalMinutes();
  const avgMood = getAverageMood();
  const breathingSessions = sessions.filter((s) => s.type === "breathing").length;
  const gameSessionsCount = sessions.filter((s) => s.type === "game").length;

  // Fetch game performance from Supabase
  useEffect(() => {
    const fetchGameSessions = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('user_uid', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setGameSessions(data || []);
        
        // Calculate stress level based on game performance
        if (data && data.length > 0) {
          const avgAccuracy = data.reduce((sum, game) => sum + (game.accuracy || 0), 0) / data.length;
          setStressLevel(Math.max(0, Math.min(100, 100 - avgAccuracy)));
          setFocusScore(Math.min(100, avgAccuracy + 10));
        }
      } catch (error) {
        console.error('Error fetching game sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameSessions();
  }, [user]);

  const getGameIcon = (gameType: string) => {
    switch(gameType) {
      case 'stress_squish':
      case 'aim_trainer':
        return <Target className="h-4 w-4" />;
      case 'memory_match':
        return <Brain className="h-4 w-4" />;
      case 'focus_dot':
        return <Eye className="h-4 w-4" />;
      default:
        return <Gamepad2 className="h-4 w-4" />;
    }
  };

  const getGameDisplayName = (gameType: string) => {
    switch(gameType) {
      case 'stress_squish':
      case 'aim_trainer':
        return 'Aim Trainer';
      case 'memory_match':
        return 'Memory Match';
      case 'focus_dot':
        return 'Focus Dot';
      default:
        return gameType;
    }
  };

  const getGameScore = (game: GameSession) => {
    if (game.accuracy) return `${game.accuracy}% accuracy`;
    if (game.score) return `${game.score} points`;
    if (game.moves) return `${game.moves} moves`;
    if (game.hits) return `${game.hits} hits`;
    return 'Completed';
  };

  const moodEmoji = avgMood >= 4.5 ? "🤩" : avgMood >= 3.5 ? "😊" : avgMood >= 2.5 ? "😐" : avgMood >= 1.5 ? "😟" : "😶";
  const stressEmoji = stressLevel > 70 ? "😰" : stressLevel > 40 ? "😐" : "😌";
  const focusEmoji = focusScore > 70 ? "🎯" : focusScore > 40 ? "📊" : "⚠️";

  return (
    <div className="flex flex-col px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">
        Wellness <span className="text-primary">Dashboard</span>
      </h1>
      <p className="text-muted-foreground mb-8">Track your mental wellness journey</p>

      {sessions.length === 0 && gameSessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 p-10 bg-card rounded-xl border border-border w-full">
          <Activity className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">No Data Yet</h3>
          <p className="text-muted-foreground text-center">Complete some breathing exercises and games to see your dashboard.</p>
          <div className="flex gap-3">
            <Link to="/breathing"><Button>Start Breathing</Button></Link>
            <Link to="/games"><Button variant="outline">Play Games</Button></Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Mental State Card */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Current Mental State
              </h2>
              <div className="mb-4">
                <p className="text-2xl font-bold text-primary">
                  {stressLevel > 70 ? "Moderately Stressed" : stressLevel > 40 ? "Mildly Stressed" : "Calm & Focused"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Based on current assessment data</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Stress Level</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stressLevel}%</span>
                    <span className="text-xl">{stressEmoji}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${stressLevel}%` }}></div>
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Focus Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{focusScore}%</span>
                    <span className="text-xl">{focusEmoji}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${focusScore}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Breathing Sessions</p>
                  <p className="text-xl font-bold">{breathingSessions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Games Played</p>
                  <p className="text-xl font-bold">{gameSessionsCount}</p>
                </div>
              </div>
            </div>

            {/* Wellness Trends */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Wellness Trends
              </h2>
              {recent.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available yet</p>
              ) : (
                <div className="space-y-3">
                  {recent.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${session.type === "breathing" ? "bg-primary/10" : "bg-accent/10"}`}>
                          {session.type === "breathing" ? <Wind className="h-4 w-4 text-primary" /> : <Gamepad2 className="h-4 w-4 text-accent" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{session.name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(session.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-foreground">{Math.round(session.duration / 60)}m</p>
                        {session.mood && <p className="text-xs text-muted-foreground">Mood: {session.mood}/5</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Game Performance & Recommendations */}
          <div className="space-y-6">
            {/* Game Performance */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Game Performance
              </h2>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : gameSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No game data available yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {gameSessions.slice(0, 5).map((game) => (
                    <div key={game.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getGameIcon(game.game_type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{getGameDisplayName(game.game_type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(game.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{getGameScore(game)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Recommendations
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Practice the Calm breathing mode (4-4-4)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Take regular breaks throughout the day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Try the Stress Squish game for quick relief</span>
                </li>
                {focusScore < 50 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Play Focus Dot to improve concentration</span>
                  </li>
                )}
                {stressLevel > 60 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Take 5 deep breaths before starting your next task</span>
                  </li>
                )}
              </ul>
            </div>

            {/* View Full Report Link */}
            <Link to="/report">
              <Button variant="outline" className="w-full gap-2">
                <BarChart3 className="h-4 w-4" />
                View Full Report
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;