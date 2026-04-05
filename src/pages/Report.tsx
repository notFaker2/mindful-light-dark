import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllSessions, getTotalMinutes, getAverageMood } from "@/lib/wellnessStore";

const Report = () => {
  const sessions = getAllSessions();
  const totalMin = getTotalMinutes();
  const avgMood = getAverageMood();
  const breathingSessions = sessions.filter((s) => s.type === "breathing");
  const gameSessions = sessions.filter((s) => s.type === "game");

  const gameNames = [...new Set(gameSessions.map((s) => s.name))];
  const moodTrend = sessions
    .filter((s) => s.mood)
    .slice(0, 10)
    .reverse()
    .map((s) => ({ date: new Date(s.date).toLocaleDateString(), mood: s.mood! }));

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">
        Wellness <span className="text-primary">Report</span>
      </h1>
      <p className="text-muted-foreground mb-8">Your complete mental wellness summary</p>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 p-10 bg-card rounded-xl border border-border w-full max-w-lg">
          <BarChart3 className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">No Data Yet</h3>
          <p className="text-muted-foreground text-center">Complete activities to generate your report.</p>
          <Link to="/breathing"><Button>Get Started</Button></Link>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {/* Summary */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{sessions.length}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{totalMin}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{avgMood.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Mood</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{gameNames.length}</p>
                <p className="text-xs text-muted-foreground">Games Played</p>
              </div>
            </div>
          </div>

          {/* Mood Trend */}
          {moodTrend.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Mood Trend</h3>
              <div className="flex items-end gap-2 h-32">
                {moodTrend.map((entry, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{entry.mood}</span>
                    <div
                      className="w-full rounded-t-md bg-primary/60"
                      style={{ height: `${(entry.mood / 5) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{entry.date.split("/").slice(0, 2).join("/")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Activity Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Breathing Exercises</span>
                <span className="text-sm font-semibold text-primary">{breathingSessions.length} sessions</span>
              </div>
              {gameNames.map((name) => {
                const count = gameSessions.filter((s) => s.name === name).length;
                return (
                  <div key={name} className="flex justify-between items-center">
                    <span className="text-sm text-foreground">{name}</span>
                    <span className="text-sm font-semibold text-primary">{count} plays</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
