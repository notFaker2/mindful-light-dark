import { Link } from "react-router-dom";
import { Activity, BarChart3, Clock, Smile, Wind, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllSessions, getTotalMinutes, getAverageMood, getRecentSessions } from "@/lib/wellnessStore";

const Dashboard = () => {
  const sessions = getAllSessions();
  const recent = getRecentSessions(7);
  const totalMin = getTotalMinutes();
  const avgMood = getAverageMood();
  const breathingSessions = sessions.filter((s) => s.type === "breathing").length;
  const gameSessions = sessions.filter((s) => s.type === "game").length;

  const moodEmoji = avgMood >= 4.5 ? "🤩" : avgMood >= 3.5 ? "😊" : avgMood >= 2.5 ? "😐" : avgMood >= 1.5 ? "😟" : "😶";

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">
        Wellness <span className="text-primary">Dashboard</span>
      </h1>
      <p className="text-muted-foreground mb-8">Your mental wellness at a glance</p>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 p-10 bg-card rounded-xl border border-border w-full max-w-lg">
          <Activity className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">No Data Yet</h3>
          <p className="text-muted-foreground text-center">Complete some breathing exercises and games to see your dashboard.</p>
          <div className="flex gap-3">
            <Link to="/breathing"><Button>Start Breathing</Button></Link>
            <Link to="/games"><Button variant="outline">Play Games</Button></Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-8">
            {[
              { icon: Clock, label: "Total Minutes", value: totalMin.toString(), color: "hsl(var(--primary))" },
              { icon: Smile, label: "Avg Mood", value: `${avgMood.toFixed(1)} ${moodEmoji}`, color: "hsl(var(--calm))" },
              { icon: Wind, label: "Breathing", value: breathingSessions.toString(), color: "hsl(var(--focus))" },
              { icon: Gamepad2, label: "Games", value: gameSessions.toString(), color: "hsl(var(--relax))" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center p-5 bg-card rounded-xl border border-border">
                <stat.icon className="h-6 w-6 mb-2" style={{ color: stat.color }} />
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="w-full bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Recent Activity (7 days)
            </h3>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity.</p>
            ) : (
              <div className="space-y-3">
                {recent.slice(0, 10).map((session) => (
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
        </>
      )}
    </div>
  );
};

export default Dashboard;
