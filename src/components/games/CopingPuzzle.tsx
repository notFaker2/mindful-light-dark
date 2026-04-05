import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";

const puzzles = [
  { question: "What's the best thing to do when overwhelmed?", options: ["Push through", "Take a break", "Ignore it"], correct: 1, tip: "Taking breaks helps reset your nervous system." },
  { question: "How many minutes of deep breathing reduces stress?", options: ["30 min", "5 min", "1 min"], correct: 1, tip: "Just 5 minutes of deep breathing can lower cortisol." },
  { question: "Which activity best promotes mindfulness?", options: ["Scrolling phone", "Body scan meditation", "Multitasking"], correct: 1, tip: "Body scan meditation increases body awareness and calm." },
  { question: "What helps with anxiety at night?", options: ["Caffeine", "4-7-8 breathing", "Screen time"], correct: 1, tip: "The 4-7-8 technique activates your parasympathetic system." },
  { question: "Best way to handle negative thoughts?", options: ["Suppress them", "Observe without judgment", "Argue with them"], correct: 1, tip: "Observing thoughts without judgment is core to mindfulness." },
];

const CopingPuzzle = () => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [done, setDone] = useState(false);

  const answer = (idx: number) => {
    const correct = idx === puzzles[current].correct;
    if (correct) setScore((s) => s + 1);
    setLastCorrect(correct);
    setShowTip(true);
  };

  const next = () => {
    setShowTip(false);
    if (current >= puzzles.length - 1) {
      setDone(true);
      addSession({ type: "game", name: "Coping Puzzle", duration: puzzles.length * 15, score: score, mood: score >= 4 ? 5 : score >= 2 ? 4 : 3 });
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const p = puzzles[current];

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Coping <span className="text-primary">Puzzle</span></h1>
      <p className="text-muted-foreground mb-6">Answer questions to unlock stress-relief tips</p>

      {done ? (
        <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-xl border border-border">
          <Check className="h-12 w-12 text-primary" />
          <p className="text-lg font-bold text-foreground">{score}/{puzzles.length} correct!</p>
          <Link to="/games"><Button variant="outline">Back to Games</Button></Link>
        </div>
      ) : (
        <div className="w-full max-w-md bg-card rounded-xl border border-border p-6">
          <p className="text-xs text-muted-foreground mb-2">Question {current + 1}/{puzzles.length}</p>
          <p className="font-semibold text-foreground mb-4">{p.question}</p>

          {!showTip ? (
            <div className="flex flex-col gap-2">
              {p.options.map((opt, i) => (
                <Button key={i} variant="outline" onClick={() => answer(i)} className="justify-start">
                  {opt}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className={`font-semibold ${lastCorrect ? "text-primary" : "text-destructive"}`}>
                {lastCorrect ? "✅ Correct!" : "❌ Not quite!"}
              </p>
              <p className="text-sm text-muted-foreground">💡 {p.tip}</p>
              <Button onClick={next} className="rounded-full">
                {current >= puzzles.length - 1 ? "Finish" : "Next Question"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CopingPuzzle;
