import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Activity, BarChart3, Clock, Smile, Wind, Gamepad2, Target, Brain, Eye, Calendar, TrendingUp, AlertCircle, Heart, Zap, Shield } from "lucide-react";
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

const Dashboard = () => {
  const { user } = useAuth();
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [wellnessSessions, setWellnessSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentalAnalysis, setMentalAnalysis] = useState<MentalStateAnalysis | null>(null);
  
  const sessions = getAllSessions();
  const recent = getRecentSessions(7);
  const totalMin = getTotalMinutes();
  const avgMood = getAverageMood();
  const breathingSessions = sessions.filter((s) => s.type === "breathing").length;
  const gameSessionsCount = sessions.filter((s) => s.type === "game").length;

  // Calculate mental state analysis based on multiple factors
  const calculateMentalStateAnalysis = (
    gameData: GameSession[],
    wellnessData: any[],
    breathingCount: number,
    avgMoodScore: number
  ): MentalStateAnalysis => {
    // Factor 1: Breathing session completion (consistency & relaxation)
    const breathingConsistency = Math.min(100, (breathingCount / 10) * 100);
    
    // Factor 2: Game performance (reaction, memory, focus)
    let avgGameAccuracy = 0;
    let avgReactionScore = 0;
    let avgMemoryScore = 0;
    
    if (gameData.length > 0) {
      const accuracyGames = gameData.filter(g => g.accuracy);
      if (accuracyGames.length > 0) {
        avgGameAccuracy = accuracyGames.reduce((sum, g) => sum + (g.accuracy || 0), 0) / accuracyGames.length;
      }
      
      // Calculate reaction consistency from focus dot games
      const focusGames = gameData.filter(g => g.game_type === 'focus_dot');
      if (focusGames.length > 0) {
        avgReactionScore = focusGames.reduce((sum, g) => sum + (g.score || 0), 0) / focusGames.length;
      }
      
      // Calculate memory accuracy from memory match games
      const memoryGames = gameData.filter(g => g.game_type === 'memory_match');
      if (memoryGames.length > 0) {
        avgMemoryScore = memoryGames.reduce((sum, g) => sum + (g.moves ? Math.max(0, 100 - (g.moves * 5)) : 0), 0) / memoryGames.length;
      }
    }
    
    // Factor 3: Self-reported mood from wellness sessions
    const moodScore = (avgMoodScore / 5) * 100;
    
    // Factor 4: Color choices (from mood colors game - if available)
    const colorChoiceScore = 70; // Default, can be enhanced with actual data
    
    // Calculate final scores
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
    
    // Overall mental state score
    const overallScore = Math.round(
      (focusIndex * 0.3 + emotionalBalance * 0.3 + cognitivePerformance * 0.2 + (100 - stressIndex) * 0.2)
    );
    
    // Generate insights based on data
    const insights: string[] = [];
    if (breathingConsistency > 60) {
      insights.push("✓ Consistent breathing practice shows good stress management");
    } else if (breathingSessions > 0) {
      insights.push("📈 Increasing breathing sessions could reduce stress levels");
    }
    
    if (avgGameAccuracy > 75) {
      insights.push("🎯 Excellent hand-eye coordination and reaction time");
    } else if (avgGameAccuracy > 50) {
      insights.push("📊 Game performance shows room for improvement in focus");
    }
    
    if (avgMemoryScore > 70) {
      insights.push("🧠 Strong memory retention and pattern recognition");
    }
    
    if (moodScore > 70) {
      insights.push("😊 Positive mood patterns indicate good emotional health");
    } else if (moodScore < 40) {
      insights.push("💭 Consider mindfulness exercises to improve mood");
    }
    
    if (stressIndex > 60) {
      insights.push("⚠️ Elevated stress indicators detected - prioritize relaxation");
    }
    
    // Generate recommendations
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
    
    // Add default recommendations if empty
    if (recommendations.length === 0) {
      recommendations.push("Maintain your current wellness routine");
      recommendations.push("Challenge yourself with new game modes");
    }
    
    // Determine overall state description
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
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch game sessions
        const { data: gameData, error: gameError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('user_uid', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (gameError) throw gameError;
        setGameSessions(gameData || []);
        
        // Fetch wellness sessions (breathing exercises)
        const { data: wellnessData, error: wellnessError } = await supabase
          .from('wellness_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
        
        if (wellnessError) throw wellnessError;
        setWellnessSessions(wellnessData || []);
        
        // Calculate mental state analysis
        const analysis = calculateMentalStateAnalysis(
          gameData || [],
          wellnessData || [],
          breathingSessions,
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
  }, [user, breathingSessions, avgMood]);

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
            {/* Mental State Analysis Card */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Mental State Analysis
              </h2>
              
              {loading || !mentalAnalysis ? (
                <p className="text-muted-foreground text-sm">Analyzing your data...</p>
              ) : (
                <>
                  {/* Overall State */}
                  <div className="mb-6 text-center p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Overall Mental Wellness Score</p>
                    <p className="text-4xl font-bold text-primary">{mentalAnalysis.score}%</p>
                    <p className="text-lg font-semibold mt-2">{mentalAnalysis.overall}</p>
                  </div>
                  
                  {/* Analysis Factors Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Stress Index</span>
                        <span className="text-sm font-semibold">{mentalAnalysis.stressIndex}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${mentalAnalysis.stressIndex}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Focus Index</span>
                        <span className="text-sm font-semibold">{mentalAnalysis.focusIndex}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${mentalAnalysis.focusIndex}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Emotional Balance</span>
                        <span className="text-sm font-semibold">{mentalAnalysis.emotionalBalance}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${mentalAnalysis.emotionalBalance}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Cognitive Performance</span>
                        <span className="text-sm font-semibold">{mentalAnalysis.cognitivePerformance}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${mentalAnalysis.cognitivePerformance}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Analysis Based On */}
                  <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">📊 Analysis based on:</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-primary/10 rounded">Breathing sessions: {breathingSessions}</span>
                      <span className="px-2 py-1 bg-primary/10 rounded">Games played: {gameSessionsCount}</span>
                      <span className="px-2 py-1 bg-primary/10 rounded">Game performance</span>
                      <span className="px-2 py-1 bg-primary/10 rounded">Reaction consistency</span>
                      <span className="px-2 py-1 bg-primary/10 rounded">Memory accuracy</span>
                      <span className="px-2 py-1 bg-primary/10 rounded">Self-reported mood</span>
                    </div>
                  </div>
                  
                  {/* Insights */}
                  {mentalAnalysis.insights.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Key Insights
                      </p>
                      <ul className="space-y-1 text-sm">
                        {mentalAnalysis.insights.map((insight, idx) => (
                          <li key={idx} className="text-muted-foreground">{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
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
                <Heart className="h-5 w-5 text-primary" />
                Recommendations
              </h2>
              {mentalAnalysis ? (
                <ul className="space-y-3 text-sm">
                  {mentalAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Complete more activities for personalized recommendations</span>
                  </li>
                </ul>
              )}
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