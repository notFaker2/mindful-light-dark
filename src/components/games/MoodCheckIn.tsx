import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";

const moods = [
  { emoji: "😫", label: "Terrible", value: 1 },
  { emoji: "😟", label: "Bad", value: 2 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😊", label: "Good", value: 4 },
  { emoji: "🤩", label: "Amazing", value: 5 },
];

const feelings = ["Stressed", "Anxious", "Tired", "Calm", "Energetic", "Happy", "Sad", "Focused", "Overwhelmed", "Grateful"];

const MoodCheckIn = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const toggleFeeling = (f: string) => {
    setSelectedFeelings((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const submit = () => {
    if (selectedMood == null) return;
    addSession({
      type: "game",
      name: "Mood Check-In",
      duration: 60,
      mood: selectedMood,
      details: { feelings: selectedFeelings },
    });
    setDone(true);
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Mood <span className="text-primary">Check-In</span></h1>
      <p className="text-muted-foreground mb-8">How are you feeling right now?</p>

      {done ? (
        <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-xl border border-border">
          <Check className="h-12 w-12 text-primary" />
          <p className="text-lg font-semibold text-foreground">Check-in recorded!</p>
          <Link to="/games"><Button variant="outline">Back to Games</Button></Link>
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-8">
            {moods.map((m) => (
              <button
                key={m.value}
                onClick={() => setSelectedMood(m.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  selectedMood === m.value ? "border-primary bg-primary/5 shadow-md scale-110" : "border-border hover:border-primary/30"
                }`}
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-xs text-foreground">{m.label}</span>
              </button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-3">What best describes your feelings?</p>
          <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-md">
            {feelings.map((f) => (
              <button
                key={f}
                onClick={() => toggleFeeling(f)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedFeelings.includes(f)
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Button onClick={submit} disabled={selectedMood == null} className="px-8 rounded-full">
            Submit Check-In
          </Button>
        </>
      )}
    </div>
  );
};

export default MoodCheckIn;
