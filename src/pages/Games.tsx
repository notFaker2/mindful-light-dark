import { Link } from "react-router-dom";
import { Palette, Target, Grid3X3, SlidersHorizontal, Map, Wind, Eye, Lightbulb, Hash } from "lucide-react";

const games = [
  { id: "mood-colors", title: "Mood Colors", desc: "Pick colors that match your mood", icon: Palette, color: "hsl(var(--calm))" },
  { id: "stress-squish", title: "Stress Squish", desc: "Pop bubbles to release stress", icon: Target, color: "hsl(var(--focus))" },
  { id: "memory-match", title: "Memory Match", desc: "Test your focus with card matching", icon: Grid3X3, color: "hsl(var(--relax))" },
  { id: "mood-checkin", title: "Mood Check-In", desc: "Rate your current mental state", icon: SlidersHorizontal, color: "hsl(var(--primary))" },
  { id: "calm-maze", title: "Calm Maze", desc: "Explore a maze and unlock coping tips", icon: Map, color: "hsl(var(--sleep))" },
  { id: "breath-rhythm", title: "Breath Rhythm", desc: "Match your breath to the orb's rhythm", icon: Wind, color: "hsl(var(--calm))" },
  { id: "focus-dot", title: "Focus Dot", desc: "Stay focused on a moving glowing dot", icon: Eye, color: "hsl(var(--focus))" },
  { id: "coping-puzzle", title: "Coping Puzzle", desc: "Solve puzzles to unlock stress-relief tips", icon: Lightbulb, color: "hsl(var(--relax))" },
  { id: "breath-count", title: "Breath Count", desc: "Count breathing cycles for focus", icon: Hash, color: "hsl(var(--sleep))" },
];

const Games = () => {
  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">
        Mood <span className="text-primary">Games</span>
      </h1>
      <p className="text-muted-foreground mb-8">Interactive games to assess and improve your mental state</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="flex flex-col gap-3 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: game.color + "20" }}
            >
              <game.icon className="h-5 w-5" style={{ color: game.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{game.title}</h3>
              <p className="text-sm text-muted-foreground">{game.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Games;
