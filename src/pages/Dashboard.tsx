import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Activity, Zap, Wind, Heart, Brain, Target, Eye, Calendar, Clock, Smile, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllSessions, getTotalMinutes, getAverageMood, getRecentSessions } from "@/lib/wellnessStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  classification: string;
  reasoning: string;
  stress_score: number;
  focus_score: number;
  calmness_score: number;
  recommendations: string[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [wellnessSessions, setWellnessSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<MentalStateAnalysis | null>(null);
  
  const sessions = getAllSessions();
  const totalMin = getTotalMinutes();
  const avgMood = getAverageMood();
  const breathingSessions = sessions.filter((s) => s.type === "breathing").length;
  const gameLocalSessions = sessions.filter((s) => s.type === "game").length;

  // Calculate mental state analysis
  const calculateMentalStateAnalysis = (
    gameData: GameSession[],
    breathingCount: number,
    avgMoodScore: number
  ): MentalStateAnalysis => {
    let avgGameAccuracy = 0;
    let avgReactionScore = 0;
    
    if (gameData.length > 0) {
      const accuracyGames = gameData.filter(g => g.accuracy);
      if (accuracyGames.length > 0) {
        avgGameAccuracy = accuracyGames.reduce((sum, g) => sum + (g.accuracy || 0), 0) / accuracyGames.length;
      }
      
      const focusGames = gameData.filter(g => g.game_type === 'focus_dot');
      if (focusGames.length > 0) {
        avgReactionScore = focusGames.reduce((sum, g) => sum + (g.score || 0), 0) / focusGames.length;
      }
    }
    
    const stressScore = Math.min(100, Math.max(0, 100 - (breathingCount * 5 + avgGameAccuracy * 0.5 + avgMoodScore * 10)));
    const focusScore = Math.min(100, Math.max(0, avgGameAccuracy * 0.7 + avgReactionScore * 0.3));
    const calmnessScore = Math.min(100, Math.max(0, breathingCount * 8 + avgMoodScore * 12));
    
    let classification = "";
    if (calmnessScore > 70 && stressScore < 40) classification = "Relaxed";
    else if (focusScore > 70) classification = "Focused";
    else if (stressScore > 60) classification = "Anxious";
    else if (focusScore < 50) classification = "Distracted";
    else if (stressScore > 40) classification = "Mildly Stressed";
    else classification = "Balanced";
    
    const recommendations: string[] = [];
    if (stressScore > 50) recommendations.push("Practice deep breathing exercises daily to reduce stress");
    if (focusScore < 60) recommendations.push("Try Focus Dot game to improve concentration");
    if (calmnessScore < 50) recommendations.push("Schedule regular meditation breaks throughout your day");
    if (breathingCount < 3) recommendations.push("Aim for 3-5 breathing sessions per week");
    if (recommendations.length === 0) recommendations.push("Continue your excellent wellness routine!");
    
    return {
      classification,
      reasoning: `Based on ${gameData.length} games and ${breathingCount} breathing sessions, your current state shows ${classification.toLowerCase()} patterns.`,
      stress_score: Math.round(stressScore),
      focus_score: Math.round(focusScore),
      calmness_score: Math.round(calmnessScore),
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
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (gameError) throw gameError;
        setGameSessions(gameData || []);
        
        const analysisResult = calculateMentalStateAnalysis(
          gameData || [],
          breathingSessions,
          avgMood
        );
        setAnalysis(analysisResult);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, breathingSessions, avgMood]);

  // Chart data preparation
  const recentMoods = sessions.filter(s => s.mood).slice(0, 7).reverse();
  const chartData = recentMoods.map((session, i) => ({
    name: `Day ${i + 1}`,
    mood: session.mood || 3,
    date: new Date(session.date).toLocaleDateString()
  }));

  const gamePerformanceData = gameSessions.slice(0, 5).map(game => ({
    name: game.game_type === 'stress_squish' ? 'Aim Trainer' : 
          game.game_type === 'memory_match' ? 'Memory Match' : 
          game.game_type === 'focus_dot' ? 'Focus Dot' : 'Game',
    score: game.accuracy || game.score || (game.moves ? 100 - game.moves : 50)
  }));

  const getMoodColor = (classification: string) => {
    switch(classification) {
      case 'Relaxed': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'Focused': return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30';
      case 'Mildly Stressed': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'Anxious': return 'from-red-500/20 to-pink-500/20 border-red-500/30';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Wellness Dashboard
          </h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Mental State Card */}
        {analysis && (
          <div className={`bg-gradient-to-r ${getMoodColor(analysis.classification)} rounded-3xl p-8 shadow-lg mb-8 border backdrop-blur-sm transition-all hover:shadow-xl`}>
            <h2 className="text-3xl font-bold text-foreground mb-2">Current Mental State</h2>
            <p className="text-2xl font-bold text-primary mb-4">{analysis.classification}</p>
            <p className="text-muted-foreground text-lg">{analysis.reasoning}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Stress Level</p>
                <p className="text-3xl font-bold text-red-500 mt-2">{analysis?.stress_score || 0}</p>
              </div>
              <Zap className="w-10 h-10 text-red-400/50" />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Focus Score</p>
                <p className="text-3xl font-bold text-blue-500 mt-2">{analysis?.focus_score || 0}</p>
              </div>
              <Brain className="w-10 h-10 text-blue-400/50" />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Calmness Score</p>
                <p className="text-3xl font-bold text-cyan-500 mt-2">{analysis?.calmness_score || 0}</p>
              </div>
              <Heart className="w-10 h-10 text-cyan-400/50" />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Games Played</p>
                <p className="text-3xl font-bold text-purple-500 mt-2">{gameSessions.length}</p>
              </div>
              <Activity className="w-10 h-10 text-purple-400/50" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <h3 className="text-xl font-bold text-foreground mb-6">Wellness Trends</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 5]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="mood" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data available yet</p>
            )}
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <h3 className="text-xl font-bold text-foreground mb-6">Game Performance</h3>
            {gamePerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gamePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No game data available yet</p>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {analysis && analysis.recommendations.length > 0 && (
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4">Personalized Recommendations</h3>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className="bg-muted/50 p-4 rounded-lg border border-border transition-all hover:shadow-md">
                  <p className="text-foreground">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Report Button */}
        <Link to="/report">
          <Button className="w-full px-8 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-lg">
            View Full Report
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;