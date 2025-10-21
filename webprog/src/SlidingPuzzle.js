import React, { useEffect, useState, useRef } from "react";

// 15-puzzle / sliding puzzle React app (plain JavaScript)
// Single-file component (default export). Uses Tailwind classes for styling.
// Levels: Easy (3x3), Medium (4x4), Hard (5x5)

export default function SlidingPuzzleApp() {
  const [size, setSize] = useState(4); // default medium (4x4)
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [highScores, setHighScores] = useState({ 3: null, 4: null, 5: null });
  const timerRef = useRef(null);

  // initialize for given size
  useEffect(() => {
    resetBoard(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => {
    function onKey(e) {
      if (!running) return;
      const keyMap = {
        ArrowUp: "down",
        ArrowDown: "up",
        ArrowLeft: "right",
        ArrowRight: "left",
      };
      if (keyMap[e.key]) moveByDirection(keyMap[e.key]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, running]);

  // helpers -----------------------------------------------------------
  function makeSolved(n) {
    const arr = Array.from({ length: n * n }, (_, i) => (i + 1) % (n * n));
    return arr; // 0 is blank
  }

  function shuffleToSolvable(n) {
    // random permutation until solvable and not already solved
    let arr;
    do {
      arr = makeSolved(n).slice();
      // Fisher-Yates shuffle
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } while (!isSolvable(arr, n) || isSolved(arr));
    return arr;
  }

  function isSolved(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return arr[arr.length - 1] === 0;
  }

  function inversionCount(arr) {
    const nums = arr.filter((v) => v !== 0);
    let inv = 0;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] > nums[j]) inv++;
      }
    }
    return inv;
  }

  function isSolvable(arr, n) {
    const inv = inversionCount(arr);
    if (n % 2 === 1) {
      // odd grid: solvable if inversions even
      return inv % 2 === 0;
    } else {
      // even grid: blank row counting from bottom (1-based)
      const blankIndex = arr.indexOf(0);
      const rowFromTop = Math.floor(blankIndex / n) + 1;
      const rowFromBottom = n - rowFromTop + 1;
      // solvable if (rowFromBottom even && inv odd) || (rowFromBottom odd && inv even)
      return (rowFromBottom % 2 === 0) ? (inv % 2 === 1) : (inv % 2 === 0);
    }
  }

  function resetBoard(n) {
    setMoves(0);
    setTime(0);
    setMessage("");
    setRunning(false);
    setTiles(shuffleToSolvable(n));
  }

  function startGame() {
    if (isSolved(tiles)) setTiles(shuffleToSolvable(size));
    setMoves(0);
    setTime(0);
    setMessage("");
    setRunning(true);
  }

  function restart() {
    resetBoard(size);
    setRunning(true);
  }

  function indexToPos(idx) {
    return { r: Math.floor(idx / size), c: idx % size };
  }

  function posToIndex(r, c) {
    return r * size + c;
  }

  function canSwap(i, j) {
    const a = indexToPos(i);
    const b = indexToPos(j);
    const dr = Math.abs(a.r - b.r);
    const dc = Math.abs(a.c - b.c);
    return (dr + dc === 1);
  }

  function handleTileClick(i) {
    if (!running) return;
    const blank = tiles.indexOf(0);
    if (canSwap(i, blank)) {
      const next = tiles.slice();
      [next[i], next[blank]] = [next[blank], next[i]];
      setTiles(next);
      setMoves((m) => m + 1);
      if (isSolved(next)) onWin();
    }
  }

  function moveByDirection(direction) {
    // direction: up/down/left/right meaning move the blank in that direction
    // we interpret as moving the tile into blank based on arrow mapping
    const blank = tiles.indexOf(0);
    const pos = indexToPos(blank);
    let targetR = pos.r;
    let targetC = pos.c;
    if (direction === "up") targetR = pos.r - 1;
    if (direction === "down") targetR = pos.r + 1;
    if (direction === "left") targetC = pos.c - 1;
    if (direction === "right") targetC = pos.c + 1;
    if (targetR < 0 || targetR >= size || targetC < 0 || targetC >= size) return;
    const targetIdx = posToIndex(targetR, targetC);
    handleTileClick(targetIdx);
  }

  function onWin() {
    setRunning(false);
    const finalMoves = moves + 1;
    setMessage(`You solved it in ${finalMoves} moves and ${time} seconds! 🎉`);
    
    // Update high score if this is better (or first score)
    if (highScores[size] === null || finalMoves < highScores[size]) {
      setHighScores(prev => ({ ...prev, [size]: finalMoves }));
    }
  }

  // render helpers --------------------------------------------------
  const gridStyle = {
    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
  };

  function fmtTime(s) {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-center p-6" style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { image-rendering: pixelated; }
      `}</style>
      <div className="w-full max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-yellow-400 mb-6" style={{ textShadow: '4px 4px 0px #000' }}>
            SLIDING PUZZLE
          </h1>
          <div className="flex justify-center gap-3">
            <button
              className={`px-4 py-2 text-xs border-4 transition-all ${size === 3 ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-gray-700 text-white border-gray-900'}`}
              onClick={() => setSize(3)}
              style={{ boxShadow: '4px 4px 0px #000' }}
            >EASY
            </button>
            <button
              className={`px-4 py-2 text-xs border-4 transition-all ${size === 4 ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-gray-700 text-white border-gray-900'}`}
              onClick={() => setSize(4)}
              style={{ boxShadow: '4px 4px 0px #000' }}
            >MEDIUM
            </button>
            <button
              className={`px-4 py-2 text-xs border-4 transition-all ${size === 5 ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-gray-700 text-white border-gray-900'}`}
              onClick={() => setSize(5)}
              style={{ boxShadow: '4px 4px 0px #000' }}
            >HARD
            </button>
          </div>
        </header>

        <main className="bg-gray-800 border-4 border-gray-900 p-6" style={{ boxShadow: '8px 8px 0px #000' }}>
          <div className="mb-6 grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-900 border-4 border-black p-3">
              <div className="text-gray-400 mb-1">SIZE</div>
              <div className="text-white text-lg">{size}×{size}</div>
            </div>
            <div className="bg-gray-900 border-4 border-black p-3">
              <div className="text-gray-400 mb-1">MOVES</div>
              <div className="text-white text-lg">{moves}</div>
            </div>
            <div className="bg-gray-900 border-4 border-black p-3">
              <div className="text-gray-400 mb-1">TIME</div>
              <div className="text-white text-lg">{fmtTime(time)}</div>
            </div>
            <div className="bg-gray-900 border-4 border-black p-3">
              <div className="text-gray-400 mb-1">HIGH SCORE</div>
              <div className="text-yellow-400 text-lg">{highScores[size] ? highScores[size] : '---'}</div>
            </div>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            <button onClick={startGame} className="px-6 py-3 text-xs bg-green-600 text-white border-4 border-green-800" style={{ boxShadow: '4px 4px 0px #000' }}>
              START
            </button>
            <button onClick={restart} className="px-6 py-3 text-xs bg-red-600 text-white border-4 border-red-800" style={{ boxShadow: '4px 4px 0px #000' }}>
              RESTART
            </button>
          </div>

          <div className="w-full max-w-md mx-auto">
            <div className="relative bg-black border-4 border-gray-900 p-2" style={{ aspectRatio: `${size}/${size}`, boxShadow: '6px 6px 0px #000' }}>
              <div
                className="grid gap-2 h-full"
                style={gridStyle}
              >
                {tiles.map((val, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTileClick(idx)}
                    className={`flex items-center justify-center font-bold select-none transition-all ${val === 0 ? 'bg-transparent' : 'bg-blue-500 border-4 border-blue-700 text-white hover:bg-blue-400'}`}
                    style={{
                      visibility: val === 0 ? 'hidden' : 'visible',
                      fontSize: Math.max(16, 36 - size * 3),
                      boxShadow: val === 0 ? 'none' : '4px 4px 0px #000',
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>CLICK TILES OR USE ARROW KEYS</p>
          </div>

          {message && (
            <div className="mt-6 p-4 bg-yellow-400 border-4 border-yellow-600 text-black text-xs text-center" style={{ boxShadow: '4px 4px 0px #000' }}>
              {message}
            </div>
          )}
        </main>

        <footer className="mt-6 text-xs text-gray-600 text-center">
          RETRO PUZZLE GAME • REACT + TAILWIND
        </footer>
      </div>
    </div>
  );
}