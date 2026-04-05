import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { BarChart3, Brain, Activity, Wind, Gamepad2, Target, TrendingUp, Heart, Shield, Download, Calendar, Clock, Smile } from "lucide-react";
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

interface MentalStateAnalysis {
  overall: string;
  score: number;
  stressIndex: number;
  focusIndex: number;
  emotionalBalance: number;
  cognitivePerformance: number;
  insights: string[];
  recommendations: string[];
}

const Report = () => {
  const { user } = useAuth();
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [wellnessSessions, setWellnessSessions] = useState<any[]>([]);
  const [mentalAnalysis, setMentalAnalysis] = useState<MentalStateAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sessions = getAllSessions();
  const totalMin = getTotalMinutes();
  const avgMood = getAverageMood();
  const breathingSessions = sessions.filter((s) => s.type === "breathing");
  const gameLocalSessions = sessions.filter((s) => s.type === "game");

  const gameNames = [...new Set(gameLocalSessions.map((s) => s.name))];
  const moodTrend = sessions
    .filter((s) => s.mood)
    .slice(0, 10)
    .reverse()
    .map((s) => ({ date: new Date(s.date).toLocaleDateString(), mood: s.mood! }));

  // Calculate mental state analysis (same as dashboard)
  const calculateMentalStateAnalysis = (
    gameData: GameSession[],
    wellnessData: any[],
    breathingCount: number,
    avgMoodScore: number
  ): MentalStateAnalysis => {
    const breathingConsistency = Math.min(100, (breathingCount / 10) * 100);
    
    let avgGameAccuracy = 0;
    let avgReactionScore = 0;
    let avgMemoryScore = 0;
    
    if (gameData.length > 0) {
      const accuracyGames = gameData.filter(g => g.accuracy);
      if (accuracyGames.length > 0) {
        avgGameAccuracy = accuracyGames.reduce((sum, g) => sum + (g.accuracy || 0), 0) / accuracyGames.length;
      }
      
      const focusGames = gameData.filter(g => g.game_type === 'focus_dot');
      if (focusGames.length > 0) {
        avgReactionScore = focusGames.reduce((sum, g) => sum + (g.score || 0), 0) / focusGames.length;
      }
      
      const memoryGames = gameData.filter(g => g.game_type === 'memory_match');
      if (memoryGames.length > 0) {
        avgMemoryScore = memoryGames.reduce((sum, g) => sum + (g.moves ? Math.max(0, 100 - (g.moves * 5)) : 0), 0) / memoryGames.length;
      }
    }
    
    const moodScore = (avgMoodScore / 5) * 100;
    
    const stressIndex = Math.min(100, Math.max(0,
      100 - (breathingConsistency * 0.3 + avgGameAccuracy * 0.3 + moodScore * 0.4)
    ));
    
    const focusIndex = Math.min(100, Math.max(0,
      avgGameAccuracy * 0.4 + avgReactionScore * 0.3 + breathingConsistency * 0.3
    ));
    
    const emotionalBalance = Math.min(100, Math.max(0,
      moodScore * 0.5 + breathingConsistency * 0.3 + (100 - stressIndex) * 0.2
    ));
    
    const cognitivePerformance = Math.min(100, Math.max(0,
      avgGameAccuracy * 0.4 + avgMemoryScore * 0.4 + avgReactionScore * 0.2
    ));
    
    const overallScore = Math.round(
      (focusIndex * 0.3 + emotionalBalance * 0.3 + cognitivePerformance * 0.2 + (100 - stressIndex) * 0.2)
    );
    
    const insights: string[] = [];
    if (breathingConsistency > 60) {
      insights.push("Consistent breathing practice shows good stress management");
    } else if (breathingCount > 0) {
      insights.push("Increasing breathing sessions could reduce stress levels");
    }
    
    if (avgGameAccuracy > 75) {
      insights.push("Excellent hand-eye coordination and reaction time");
    } else if (avgGameAccuracy > 50) {
      insights.push("Game performance shows room for improvement in focus");
    }
    
    if (avgMemoryScore > 70) {
      insights.push("Strong memory retention and pattern recognition");
    }
    
    if (moodScore > 70) {
      insights.push("Positive mood patterns indicate good emotional health");
    } else if (moodScore < 40) {
      insights.push("Consider mindfulness exercises to improve mood");
    }
    
    if (stressIndex > 60) {
      insights.push("Elevated stress indicators detected - prioritize relaxation");
    }
    
    const recommendations: string[] = [];
    if (stressIndex > 50) {
      recommendations.push("Practice 4-7-8 breathing before stressful tasks");
    }
    if (focusIndex < 60) {
      recommendations.push("Try Focus Dot game daily to improve concentration");
    }
    if (avgMemoryScore < 60) {
      recommendations.push("Play Memory Match to boost cognitive function");
    }
    if (breathingConsistency < 40) {
      recommendations.push("Schedule 2-3 breathing sessions per week");
    }
    if (emotionalBalance < 50) {
      recommendations.push("Journal your feelings to track emotional patterns");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Maintain your current wellness routine");
      recommendations.push("Challenge yourself with new game modes");
    }
    
    let overall = "";
    if (overallScore >= 80) overall = "Excellent Mental Wellness";
    else if (overallScore >= 65) overall = "Good Mental Balance";
    else if (overallScore >= 50) overall = "Moderate Mental State";
    else if (overallScore >= 35) overall = "Stressed - Needs Attention";
    else overall = "Critical - Seek Support";
    
    return {
      overall,
      score: overallScore,
      stressIndex: Math.round(stressIndex),
      focusIndex: Math.round(focusIndex),
      emotionalBalance: Math.round(emotionalBalance),
      cognitivePerformance: Math.round(cognitivePerformance),
      insights: insights.slice(0, 4),
      recommendations: recommendations.slice(0, 4)
    };
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data: gameData, error: gameError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('user_uid', user.id)
          .order('created_at', { ascending: false });
        
        if (gameError) throw gameError;
        setGameSessions(gameData || []);
        
        const { data: wellnessData, error: wellnessError } = await supabase
          .from('wellness_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (wellnessError) throw wellnessError;
        setWellnessSessions(wellnessData || []);
        
        const analysis = calculateMentalStateAnalysis(
          gameData || [],
          wellnessData || [],
          breathingSessions.length,
          avgMood
        );
        setMentalAnalysis(analysis);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, breathingSessions.length, avgMood]);

  const getPerformanceRating = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-500" };
    if (score >= 65) return { label: "Good", color: "text-blue-500" };
    if (score >= 50) return { label: "Average", color: "text-yellow-500" };
    if (score >= 35) return { label: "Below Average", color: "text-orange-500" };
    return { label: "Needs Improvement", color: "text-red-500" };
  };

  const getBestGame = () => {
    if (gameSessions.length === 0) return null;
    const gameStats = new Map();
    gameSessions.forEach(game => {
      const key = game.game_type;
      const score = game.accuracy || game.score || (game.moves ? 100 - game.moves : 0);
      if (!gameStats.has(key) || gameStats.get(key) < score) {
        gameStats.set(key, score);
      }
    });
    let bestGame = "";
    let bestScore = 0;
    gameStats.forEach((score, game) => {
      if (score > bestScore) {
        bestScore = score;
        bestGame = game;
      }
    });
    return { game: bestGame, score: bestScore };
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

  const bestGame = getBestGame();

  return (
    <div className="flex flex-col px-4 py-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Wellness <span className="text-primary">Report</span>
          </h1>
          <p className="text-muted-foreground">Your complete mental wellness summary</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      {sessions.length === 0 && gameSessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 p-10 bg-card rounded-xl border border-border w-full">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">No Data Yet</h3>
          <p className="text-muted-foreground text-center">Complete activities to generate your report.</p>
          <div className="flex gap-3">
            <Link to="/breathing"><Button>Start Breathing</Button></Link>
            <Link to="/games"><Button variant="outline">Play Games</Button></Link>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {/* Mental Health Score Card */}
          {mentalAnalysis && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Mental Wellness Score
                </h3>
                <span className="text-3xl font-bold text-primary">{mentalAnalysis.score}%</span>
              </div>
              <p className="text-lg font-semibold mb-2">{mentalAnalysis.overall}</p>
              <p className="text-sm text-muted-foreground">
                Based on {breathingSessions.length} breathing sessions and {gameSessions.length} games played
              </p>
            </div>
          )}

          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Activity className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{sessions.length + gameSessions.length}</p>
              <p className="text-xs text-muted-foreground">Total Activities</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{totalMin}</p>
              <p className="text-xs text-muted-foreground">Minutes Practiced</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Smile className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{avgMood.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Mood /5</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{Math.ceil(totalMin / 60)}</p>
              <p className="text-xs text-muted-foreground">Hours Total</p>
            </div>
          </div>

          {/* Mental State Analysis Section */}
          {mentalAnalysis && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Mental State Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Stress Index</span>
                      <span className={mentalAnalysis.stressIndex > 60 ? "text-orange-500" : "text-green-500"}>
                        {mentalAnalysis.stressIndex}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${mentalAnalysis.stressIndex}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Focus Index</span>
                      <span>{mentalAnalysis.focusIndex}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${mentalAnalysis.focusIndex}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Emotional Balance</span>
                      <span>{mentalAnalysis.emotionalBalance}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${mentalAnalysis.emotionalBalance}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cognitive Performance</span>
                      <span>{mentalAnalysis.cognitivePerformance}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${mentalAnalysis.cognitivePerformance}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Insights:</p>
                  <ul className="space-y-1">
                    {mentalAnalysis.insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Game Performance Section */}
          {gameSessions.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Game Performance Analysis
              </h3>
              
              {bestGame && (
                <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Best Performing Game</p>
                  <p className="text-lg font-semibold text-primary">{getGameDisplayName(bestGame.game)}</p>
                  <p className="text-sm">Score: {Math.round(bestGame.score)}%</p>
                </div>
              )}
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {gameSessions.slice(0, 8).map((game, idx) => (
                  <div key={game.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{getGameDisplayName(game.game_type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(game.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {game.accuracy && <p className="text-sm font-semibold text-primary">{game.accuracy}% accuracy</p>}
                      {game.score && <p className="text-sm font-semibold text-primary">{game.score} points</p>}
                      {game.moves && <p className="text-sm font-semibold text-primary">{game.moves} moves</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood Trend */}
          {moodTrend.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Mood Trend Over Time
              </h3>
              <div className="flex items-end gap-2 h-40">
                {moodTrend.map((entry, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{entry.mood}</span>
                    <div
                      className="w-full rounded-t-md bg-primary/60 transition-all"
                      style={{ height: `${(entry.mood / 5) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground text-center">{entry.date.split("/").slice(0, 2).join("/")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Breakdown */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Activity Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-foreground">Breathing Exercises</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{breathingSessions.length} sessions</span>
                  <span className="text-sm font-semibold text-primary">{Math.round(breathingSessions.reduce((sum, s) => sum + s.duration, 0) / 60)} min</span>
                </div>
              </div>
              {gameNames.map((name) => {
                const count = gameLocalSessions.filter((s) => s.name === name).length;
                const avgScore = gameLocalSessions.filter((s) => s.name === name).reduce((sum, s) => sum + (s.score || 0), 0) / (count || 1);
                return (
                  <div key={name} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">{name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{count} plays</span>
                      {avgScore > 0 && <span className="text-sm font-semibold text-primary">{Math.round(avgScore)} avg score</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations Section */}
          {mentalAnalysis && mentalAnalysis.recommendations.length > 0 && (
            <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/20 p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Personalized Recommendations
              </h3>
              <ul className="space-y-2">
                {mentalAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Report Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Report generated on {new Date().toLocaleDateString()} | MindBreath Wellness App
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {sessions.length + gameSessions.length} activities across {Math.ceil(totalMin / 60)} hours of practice
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;