import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addSession } from "@/lib/wellnessStore";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const tips = [
  "Take 5 deep breaths when you feel overwhelmed.",
  "Try progressive muscle relaxation: tense and release each muscle group.",
  "Write down 3 things you're grateful for today.",
  "Step outside for fresh air and sunlight.",
  "Listen to calming music for 5 minutes.",
  "Practice the 5-4-3-2-1 grounding technique.",
  "Drink a glass of water mindfully.",
  "Stretch your body for 2 minutes.",
];

const MAZE_SIZE = 8;

function generateMaze(): number[][] {
  const maze = Array.from({ length: MAZE_SIZE }, () => Array(MAZE_SIZE).fill(0));
  // Create a path from top-left to bottom-right with some walls
  const path: [number, number][] = [];
  let r = 0, c = 0;
  path.push([r, c]);
  while (r < MAZE_SIZE - 1 || c < MAZE_SIZE - 1) {
    if (r === MAZE_SIZE - 1) { c++; path.push([r, c]); }
    else if (c === MAZE_SIZE - 1) { r++; path.push([r, c]); }
    else if (Math.random() > 0.5) { r++; path.push([r, c]); }
    else { c++; path.push([r, c]); }
  }
  // Fill walls
  for (let i = 0; i < MAZE_SIZE; i++) {
    for (let j = 0; j < MAZE_SIZE; j++) {
      if (!path.some(([pr, pc]) => pr === i && pc === j)) {
        maze[i][j] = Math.random() > 0.55 ? 1 : 0;
      }
    }
  }
  maze[0][0] = 0;
  maze[MAZE_SIZE - 1][MAZE_SIZE - 1] = 0;
  return maze;
}

const CalmMaze = () => {
  const [maze, setMaze] = useState<number[][]>([]);
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [tipsFound, setTipsFound] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => { setMaze(generateMaze()); startRef.current = Date.now(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const [r, c] = pos;
      let nr = r, nc = c;
      if (e.key === "ArrowUp") nr = Math.max(0, r - 1);
      if (e.key === "ArrowDown") nr = Math.min(MAZE_SIZE - 1, r + 1);
      if (e.key === "ArrowLeft") nc = Math.max(0, c - 1);
      if (e.key === "ArrowRight") nc = Math.min(MAZE_SIZE - 1, c + 1);
      if (maze[nr]?.[nc] === 0) {
        setPos([nr, nc]);
        if (Math.random() > 0.7 && tipsFound.length < tips.length) {
          const next = tips[tipsFound.length];
          if (!tipsFound.includes(next)) setTipsFound((prev) => [...prev, next]);
        }
        if (nr === MAZE_SIZE - 1 && nc === MAZE_SIZE - 1 && !done) {
          setDone(true);
          addSession({ type: "game", name: "Calm Maze", duration: Math.round((Date.now() - startRef.current) / 1000), score: tipsFound.length, mood: 4 });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pos, maze, tipsFound, done]);

  const moveDir = (dr: number, dc: number) => {
    const [r, c] = pos;
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < MAZE_SIZE && nc >= 0 && nc < MAZE_SIZE && maze[nr]?.[nc] === 0) {
      setPos([nr, nc]);
      if (Math.random() > 0.7 && tipsFound.length < tips.length) {
        setTipsFound((prev) => [...prev, tips[prev.length]]);
      }
      if (nr === MAZE_SIZE - 1 && nc === MAZE_SIZE - 1 && !done) {
        setDone(true);
        addSession({ type: "game", name: "Calm Maze", duration: Math.round((Date.now() - startRef.current) / 1000), score: tipsFound.length, mood: 4 });
      }
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto">
      <Link to="/games" className="self-start flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Games
      </Link>
      <h1 className="text-2xl font-bold mb-2">Calm <span className="text-primary">Maze</span></h1>
      <p className="text-muted-foreground mb-4">Navigate to the exit and discover coping tips</p>
      <p className="text-xs text-muted-foreground mb-4">Use arrow keys or buttons to move</p>

      {done && (
        <div className="p-4 bg-card rounded-xl border border-border mb-4 text-center">
          <p className="font-bold text-foreground">You made it! 🎉</p>
          <p className="text-sm text-muted-foreground">Found {tipsFound.length} tips</p>
          <Link to="/games"><Button variant="outline" className="mt-2">Back</Button></Link>
        </div>
      )}

      <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${MAZE_SIZE}, 2.5rem)` }}>
        {maze.flatMap((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold ${
                pos[0] === r && pos[1] === c
                  ? "bg-primary text-primary-foreground"
                  : r === MAZE_SIZE - 1 && c === MAZE_SIZE - 1
                  ? "bg-primary/20 border border-primary/40"
                  : cell === 1
                  ? "bg-muted"
                  : "bg-card border border-border"
              }`}
            >
              {pos[0] === r && pos[1] === c ? "🧘" : r === MAZE_SIZE - 1 && c === MAZE_SIZE - 1 ? "🏁" : ""}
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 w-28 mb-4">
        <div />
        <Button size="sm" variant="outline" onClick={() => moveDir(-1, 0)}>↑</Button>
        <div />
        <Button size="sm" variant="outline" onClick={() => moveDir(0, -1)}>←</Button>
        <Button size="sm" variant="outline" onClick={() => moveDir(1, 0)}>↓</Button>
        <Button size="sm" variant="outline" onClick={() => moveDir(0, 1)}>→</Button>
      </div>

      {tipsFound.length > 0 && (
        <div className="w-full max-w-sm p-4 bg-card rounded-xl border border-border">
          <p className="text-sm font-semibold text-foreground mb-2">Tips Found:</p>
          {tipsFound.map((tip, i) => (
            <p key={i} className="text-xs text-muted-foreground mb-1">💡 {tip}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default CalmMaze;
