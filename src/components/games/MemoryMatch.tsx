import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

const emojis = ["🧘", "🌿", "💧", "🌸", "⭐", "🌊", "🦋", "🌙"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const MemoryMatch = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [done, setDone] = useState(false);
  const [locked, setLocked] = useState(false);

  const initGame = () => {
    const pairs = emojis.flatMap((e, i) => [
      { id: i * 2, emoji: e, flipped: false, matched: false },
      { id: i * 2 + 1, emoji: e, flipped: false, matched: false },
    ]);
    setCards(pairs.sort(() => Math.random() - 0.5));
    setSelected([]);
    setMoves(0);
    setStartTime(Date.now());
    setDone(false);
    setLocked(false);
  };

  useEffect(() => { initGame(); }, []);

  const flipCard = (id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (selected.includes(id)) return;

    const newSelected = [...selected, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const first = cards.find((c) => c.id === newSelected[0])!;
      const second = card;

      if (first.emoji === second.emoji) {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (newSelected.includes(c.id) ? { ...c, matched: true } : c)));
          setSelected([]);
          setLocked(false);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (newSelected.includes(c.id) ? { ...c, flipped: false } : c)));
          setSelected([]);
          setLocked(false);
        }, 800);
      }
    } else {
      setSelected(newSelected);
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched) && !done) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      addSession({ type: "game", name: "Memory Match", duration, score: moves, mood: moves < 12 ? 5 : moves < 18 ? 4 : 3 });
      setDone(true);
    }
  }, [cards, done, moves, startTime]);

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Memory <span className="text-primary">Match</span></h1>
      <p className="text-muted-foreground mb-4">Find matching pairs to test your focus</p>
      <p className="text-sm text-foreground font-semibold mb-4">Moves: {moves}</p>

      {done && (
        <div className="flex flex-col items-center gap-3 mb-4 p-6 bg-card rounded-xl border border-border">
          <p className="text-lg font-bold text-foreground">Completed in {moves} moves! 🎉</p>
          <div className="flex gap-2">
            <Button onClick={initGame} variant="outline" className="gap-1"><RotateCcw className="h-4 w-4" />Play Again</Button>
            <Link to="/games"><Button variant="outline">Back</Button></Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flipCard(card.id)}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all border ${
              card.matched
                ? "bg-primary/10 border-primary/30"
                : card.flipped
                ? "bg-card border-primary shadow-md"
                : "bg-secondary border-border hover:border-primary/30 cursor-pointer"
            }`}
          >
            {card.flipped || card.matched ? card.emoji : "?"}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MemoryMatch;
