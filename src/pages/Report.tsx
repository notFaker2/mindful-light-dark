import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Heart, Brain, Wind, Activity, Zap, Clock, Smile } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getAllSessions, getTotalMinutes, getAverageMood } from "@/lib/wellnessStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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

const Report = () => {
  const { user } = useAuth();
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [analysis, setAnalysis] = useState<MentalStateAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sessions = getAllSessions();
  const totalMin = getTotalMinutes();
  const avgMood = getAverageMood();
  const breathingSessions = sessions.filter((s) => s.type === "breathing");

  const calculateMentalStateAnalysis = (
    gameData: GameSession[],
    breathingCount: number,
    avgMoodScore: number
  ): MentalStateAnalysis => {
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
    
    const stressScore = Math.min(100, Math.max(0, 100 - (breathingCount * 5 + avgGameAccuracy * 0.5 + avgMoodScore * 10)));
    const focusScore = Math.min(100, Math.max(0, avgGameAccuracy * 0.5 + avgReactionScore * 0.3 + avgMemoryScore * 0.2));
    const calmnessScore = Math.min(100, Math.max(0, breathingCount * 8 + avgMoodScore * 12));
    
    let classification = "";
    if (calmnessScore > 70 && stressScore < 40) classification = "Relaxed";
    else if (focusScore > 70) classification = "Focused";
    else if (stressScore > 60) classification = "Anxious";
    else if (focusScore < 50) classification = "Distracted";
    else if (stressScore > 40) classification = "Mildly Stressed";
    else classification = "Balanced";
    
    const recommendations: string[] = [];
    if (stressScore > 50) recommendations.push("Practice deep breathing exercises daily to reduce stress levels");
    if (focusScore < 60) recommendations.push("Play Focus Dot game regularly to improve concentration");
    if (calmnessScore < 50) recommendations.push("Schedule 5-minute meditation breaks throughout your day");
    if (breathingCount < 3) recommendations.push("Aim for at least 3 breathing sessions per week");
    if (avgMemoryScore < 60) recommendations.push("Try Memory Match to boost cognitive function");
    if (recommendations.length === 0) recommendations.push("Continue your excellent wellness routine!");
    
    return {
      classification,
      reasoning: `Based on ${gameData.length} games and ${breathingCount} breathing sessions, your current mental state shows ${classification.toLowerCase()} patterns.`,
      stress_score: Math.round(stressScore),
      focus_score: Math.round(focusScore),
      calmness_score: Math.round(calmnessScore),
      recommendations: recommendations.slice(0, 5)
    };
  };

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
        
        const analysisResult = calculateMentalStateAnalysis(
          gameData || [],
          breathingSessions.length,
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
  }, [user, breathingSessions.length, avgMood]);

  const handleDownload = () => {
    const reportText = `
MindBreath Wellness Report
Generated: ${new Date().toLocaleDateString()}

=== MENTAL STATE ANALYSIS ===
Classification: ${analysis?.classification}
Reasoning: ${analysis?.reasoning}

=== SCORES ===
Stress Score: ${analysis?.stress_score}/100
Focus Score: ${analysis?.focus_score}/100
Calmness Score: ${analysis?.calmness_score}/100

=== STATISTICS ===
Breathing Sessions: ${breathingSessions.length}
Games Played: ${gameSessions.length}
Total Minutes: ${totalMin}
Average Mood: ${avgMood.toFixed(1)}/5

=== RECOMMENDATIONS ===
${analysis?.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

Report generated by MindBreath
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportText));
    element.setAttribute('download', `mindbreath-report-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const recentMoods = sessions.filter(s => s.mood).slice(0, 10).reverse();
  const moodTrendData = recentMoods.map((session, i) => ({
    day: i + 1,
    mood: session.mood || 3,
    date: new Date(session.date).toLocaleDateString()
  }));

  const gamePerformanceData = gameSessions.slice(0, 8).map(game => ({
    name: game.game_type === 'stress_squish' ? 'Aim Trainer' : 
          game.game_type === 'memory_match' ? 'Memory Match' : 
          game.game_type === 'focus_dot' ? 'Focus Dot' : 'Game',
    score: game.accuracy || game.score || (game.moves ? 100 - game.moves : 50)
  }));

  const activityData = [
    { name: 'Breathing', value: breathingSessions.length, color: '#06b6d4' },
    { name: 'Games', value: gameSessions.length, color: '#8b5cf6' }
  ];

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Wellness Report
          </h1>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-3xl p-8 shadow-lg border border-border mb-8">
          {/* Mental State Header */}
          {analysis && (
            <div className={`bg-gradient-to-br ${getMoodColor(analysis.classification)} rounded-2xl p-8 mb-8 border backdrop-blur-sm transition-all hover:shadow-xl`}>
              <h2 className="text-4xl font-bold text-foreground mb-4">Your Current Mental State</h2>
              <p className="text-2xl font-semibold text-primary mb-4">{analysis.classification}</p>
              <p className="text-lg text-muted-foreground">{analysis.reasoning}</p>
            </div>
          )}

          {/* Scores Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-muted/30 p-6 rounded-2xl border border-border transition-all hover:shadow-md">
              <Zap className="w-8 h-8 text-red-500 mb-3" />
              <p className="text-muted-foreground text-sm font-medium mb-2">Stress Score</p>
              <p className="text-3xl font-bold text-red-500">{analysis?.stress_score || 0}</p>
            </div>

            <div className="bg-muted/30 p-6 rounded-2xl border border-border transition-all hover:shadow-md">
              <Brain className="w-8 h-8 text-blue-500 mb-3" />
              <p className="text-muted-foreground text-sm font-medium mb-2">Focus Score</p>
              <p className="text-3xl font-bold text-blue-500">{analysis?.focus_score || 0}</p>
            </div>

            <div className="bg-muted/30 p-6 rounded-2xl border border-border transition-all hover:shadow-md">
              <Heart className="w-8 h-8 text-cyan-500 mb-3" />
              <p className="text-muted-foreground text-sm font-medium mb-2">Calmness Score</p>
              <p className="text-3xl font-bold text-cyan-500">{analysis?.calmness_score || 0}</p>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Activity Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border transition-all hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Wind className="w-5 h-5 text-cyan-600" />
                    <span className="text-foreground">Breathing Sessions</span>
                  </div>
                  <span className="font-bold text-foreground">{breathingSessions.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border transition-all hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    <span className="text-foreground">Games Played</span>
                  </div>
                  <span className="font-bold text-foreground">{gameSessions.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border transition-all hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-foreground">Total Minutes</span>
                  </div>
                  <span className="font-bold text-foreground">{totalMin}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border transition-all hover:bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Smile className="w-5 h-5 text-yellow-600" />
                    <span className="text-foreground">Average Mood</span>
                  </div>
                  <span className="font-bold text-foreground">{avgMood.toFixed(1)}/5</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Activity Distribution</h3>
              {activityData.some(d => d.value > 0) ? (
                <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-8 text-center border border-border">
                  <p className="text-muted-foreground">No activity data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Mood Trend Chart */}
          {moodTrendData.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Mood Trend Over Time</h3>
              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 5]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="mood" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Game Performance Chart */}
          {gamePerformanceData.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Game Performance</h3>
              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
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
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis && analysis.recommendations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">Personalized Recommendations</h3>
              <div className="space-y-3">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="bg-muted/30 p-4 rounded-lg border border-border transition-all hover:shadow-md">
                    <p className="text-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Report;