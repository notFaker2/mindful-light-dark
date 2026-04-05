import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";

const moodColors = [
  { color: "hsl(0, 70%, 60%)", label: "Angry", mood: 1 },
  { color: "hsl(30, 80%, 60%)", label: "Anxious", mood: 2 },
  { color: "hsl(50, 80%, 55%)", label: "Neutral", mood: 3 },
  { color: "hsl(150, 60%, 50%)", label: "Calm", mood: 4 },
  { color: "hsl(200, 70%, 55%)", label: "Happy", mood: 5 },
  { color: "hsl(280, 50%, 60%)", label: "Dreamy", mood: 4 },
  { color: "hsl(330, 60%, 55%)", label: "Loving", mood: 5 },
  { color: "hsl(180, 40%, 40%)", label: "Focused", mood: 4 },
];

const MoodColors = () => {
  const [selected, setSelected] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const toggle = (i: number) => {
    setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  };

  const submit = () => {
    if (!selected.length) return;
    const avgMood = Math.round(selected.reduce((s, i) => s + moodColors[i].mood, 0) / selected.length);
    addSession({ type: "game", name: "Mood Colors", duration: 30, mood: avgMood, score: selected.length });
    setDone(true);
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Mood <span className="text-primary">Colors</span></h1>
      <p className="text-muted-foreground mb-8">Pick colors that match how you feel right now</p>

      {done ? (
        <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-xl border border-border">
          <Check className="h-12 w-12 text-primary" />
          <p className="text-lg font-semibold text-foreground">Thanks for sharing!</p>
          <p className="text-muted-foreground">Your mood has been recorded.</p>
          <Link to="/games"><Button variant="outline">Back to Games</Button></Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {moodColors.map((mc, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  selected.includes(i) ? "border-primary shadow-md scale-105" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="w-12 h-12 rounded-full" style={{ backgroundColor: mc.color }} />
                <span className="text-xs text-foreground font-medium">{mc.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={submit} disabled={!selected.length} className="px-8 rounded-full">
            Submit ({selected.length} selected)
          </Button>
        </>
      )}
    </div>
  );
};

export default MoodColors;
