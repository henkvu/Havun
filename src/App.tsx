/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, User, Info } from 'lucide-react';

type Player = 1 | 2;
type GameMode = '1P' | '2P';
type Difficulty = 'standard' | 'random';

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [rows, setRows] = useState<number[]>([3, 5, 7]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [gameStarter, setGameStarter] = useState<Player>(1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [showRules, setShowRules] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('1P');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [scores, setScores] = useState({ p1: 0, p2: 0, computer: 0 });

  // Computer Move Logic
  useEffect(() => {
    if (gameMode === '1P' && currentPlayer === 2 && !winner && !isComputerThinking) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, winner, isComputerThinking]);

  const handleConfirmMove = () => {
    if (selectedRow === null || selectedCount === 0 || winner) return;

    const newRows = [...rows];
    newRows[selectedRow] -= selectedCount;
    
    const totalRemaining = newRows.reduce((a, b) => a + b, 0);
    
    if (totalRemaining <= 1) {
      // Game Over
      // If 0 remaining: current player took the last match and loses (other player wins)
      // If 1 remaining: next player will have to take the last match and lose (current player wins)
      const gameWinner = totalRemaining === 0 ? (currentPlayer === 1 ? 2 : 1) : currentPlayer;
      setWinner(gameWinner);
      setRows(newRows);
      
      // Update scores
      setScores(prev => {
        if (gameMode === '1P') {
          return gameWinner === 1 
            ? { ...prev, p1: prev.p1 + 1 } 
            : { ...prev, computer: prev.computer + 1 };
        } else {
          return gameWinner === 1 
            ? { ...prev, p1: prev.p1 + 1 } 
            : { ...prev, p2: prev.p2 + 1 };
        }
      });
    } else {
      setRows(newRows);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
    
    setSelectedRow(null);
    setSelectedCount(0);
  };

  const makeComputerMove = () => {
    setIsComputerThinking(true);
    
    // Artificial delay for "thinking"
    setTimeout(() => {
      const nimSum = rows.reduce((acc, val) => acc ^ val, 0);
      let moveRow = -1;
      let moveCount = 0;

      // Misere Nim Strategy
      const rowsGreaterThanOne = rows.filter(r => r > 1).length;

      if (rowsGreaterThanOne <= 1) {
        // Special case for Misere play: leave an odd number of rows of size 1
        const largestRowIndex = rows.indexOf(Math.max(...rows));
        const otherRowsOfSizeOne = rows.filter((r, idx) => idx !== largestRowIndex && r === 1).length;
        
        moveRow = largestRowIndex;
        const targetSize = otherRowsOfSizeOne % 2 === 0 ? 1 : 0;
        moveCount = Math.max(1, rows[largestRowIndex] - targetSize);
      } else {
        // Standard Nim strategy: make nim-sum 0
        if (nimSum > 0) {
          for (let i = 0; i < rows.length; i++) {
            const target = rows[i] ^ nimSum;
            if (target < rows[i]) {
              moveRow = i;
              moveCount = rows[i] - target;
              break;
            }
          }
        } else {
          // Nim-sum is already 0, make any valid move
          moveRow = rows.findIndex(r => r > 0);
          moveCount = 1;
        }
      }

      // Execute move
      if (moveRow !== -1 && moveCount > 0) {
        const newRows = [...rows];
        newRows[moveRow] -= moveCount;
        
        const totalRemaining = newRows.reduce((a, b) => a + b, 0);
        if (totalRemaining <= 1) {
          // Game Over
          // If 0 remaining: computer took the last match and loses (Player 1 wins)
          // If 1 remaining: Player 1 will have to take the last match and lose (Computer wins)
          const gameWinner = totalRemaining === 0 ? 1 : 2;
          setWinner(gameWinner);
          setRows(newRows);
          if (gameWinner === 1) {
            setScores(prev => ({ ...prev, p1: prev.p1 + 1 }));
          } else {
            setScores(prev => ({ ...prev, computer: prev.computer + 1 }));
          }
        } else {
          setRows(newRows);
          setCurrentPlayer(1);
        }
      }
      
      setIsComputerThinking(false);
    }, 800);
  };

  const handleSelectMatch = (rowIndex: number, matchIndex: number) => {
    if (winner) return;

    // If selecting from a different row, reset selection
    if (selectedRow !== null && selectedRow !== rowIndex) {
      setSelectedRow(rowIndex);
      setSelectedCount(1);
      return;
    }

    // Toggle selection
    if (selectedRow === rowIndex) {
      // If clicking an already selected match or a match beyond current selection
      // We set the count to the number of matches up to this one
      const count = matchIndex + 1;
      setSelectedRow(rowIndex);
      setSelectedCount(count);
    } else {
      setSelectedRow(rowIndex);
      setSelectedCount(matchIndex + 1);
    }
  };

  const resetGame = (newDifficulty?: Difficulty) => {
    const activeDifficulty = newDifficulty || difficulty;
    
    if (activeDifficulty === 'standard') {
      setRows([3, 5, 7]);
    } else {
      // Random mode: 3-5 rows, 1-9 matches per row
      const numRows = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
      const randomRows = Array.from({ length: numRows }, () => Math.floor(Math.random() * 9) + 1);
      setRows(randomRows);
    }
    
    setWinner(null);
    setSelectedRow(null);
    setSelectedCount(0);
    
    // The player who started the previous game is now 2nd
    const nextStarter = gameStarter === 1 ? 2 : 1;
    setGameStarter(nextStarter);
    setCurrentPlayer(nextStarter);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans selection:bg-orange-200">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-serif italic mb-2 tracking-tight">de last matchstick</h1>
          <p className="text-stone-500 uppercase text-xs tracking-widest font-medium">Klassiek Strategie Spel</p>
        </header>

        {/* Mode Selector */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-center">
            <div className="bg-white p-1 rounded-full shadow-sm border border-stone-200 flex">
              <button
                onClick={() => { setGameMode('1P'); resetGame(); }}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  gameMode === '1P' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                1 Speler (vs Computer)
              </button>
              <button
                onClick={() => { setGameMode('2P'); resetGame(); }}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  gameMode === '2P' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                2 Spelers
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-1 rounded-full shadow-sm border border-stone-200 flex">
              <button
                onClick={() => { setDifficulty('standard'); resetGame('standard'); }}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  difficulty === 'standard' ? 'bg-orange-500 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Standaard (3-5-7)
              </button>
              <button
                onClick={() => { setDifficulty('random'); resetGame('random'); }}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  difficulty === 'random' ? 'bg-orange-500 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Willekeurig (Moeilijk)
              </button>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full transition-colors ${currentPlayer === 1 ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-stone-100 text-stone-400'}`}>
              <User size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-stone-400 uppercase font-bold tracking-tighter">Speler 1</p>
                <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold">{scores.p1}</span>
              </div>
              <p className={`font-serif italic ${currentPlayer === 1 ? 'text-stone-900' : 'text-stone-300'}`}>Aan de beurt</p>
            </div>
          </div>

          <div className="h-12 w-px bg-stone-100" />

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="bg-stone-100 text-stone-600 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold">
                  {gameMode === '1P' ? scores.computer : scores.p2}
                </span>
                <p className="text-xs text-stone-400 uppercase font-bold tracking-tighter">
                  {gameMode === '1P' ? 'Computer' : 'Speler 2'}
                </p>
              </div>
              <p className={`font-serif italic ${currentPlayer === 2 ? 'text-stone-900' : 'text-stone-300'}`}>
                {isComputerThinking ? 'Aan het denken...' : 'Aan de beurt'}
              </p>
            </div>
            <div className={`p-3 rounded-full transition-colors ${currentPlayer === 2 ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-stone-100 text-stone-400'}`}>
              <User size={24} />
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white p-8 rounded-3xl shadow-md border border-stone-200 mb-8 relative overflow-hidden">
          {winner && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
            >
              <Trophy size={64} className="text-orange-500 mb-4" />
              <h2 className="text-4xl font-serif italic mb-2">Gefeliciteerd!</h2>
              <p className="text-stone-600 mb-8 text-lg">
                {gameMode === '1P' && winner === 2 ? 'De computer' : `Speler ${winner}`} heeft gewonnen!
              </p>
              <button 
                onClick={resetGame}
                className="flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-full font-medium hover:bg-stone-800 transition-colors shadow-lg"
              >
                <RotateCcw size={20} />
                Nieuw Potje
              </button>
            </motion.div>
          )}

          <div className="space-y-12 py-8">
            {rows.map((count, rowIndex) => (
              <div key={rowIndex} className="flex flex-col items-center">
                <div className="flex flex-wrap justify-center gap-4">
                  {Array.from({ length: count }).map((_, i) => {
                    const isSelected = selectedRow === rowIndex && i < selectedCount;
                    return (
                      <motion.button
                        key={i}
                        layout
                        whileHover={{ scale: 1.1, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (gameMode === '1P' && currentPlayer === 2) return;
                          handleSelectMatch(rowIndex, i);
                        }}
                        className={`relative w-3 h-24 rounded-full transition-all duration-300 ${
                          isSelected 
                            ? 'bg-orange-500 shadow-lg shadow-orange-200 -translate-y-2' 
                            : 'bg-stone-300 hover:bg-stone-400'
                        } ${gameMode === '1P' && currentPlayer === 2 ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        {/* Match head */}
                        <div className={`absolute top-0 left-0 w-full h-4 rounded-full transition-colors ${
                          isSelected ? 'bg-orange-700' : 'bg-red-700'
                        }`} />
                      </motion.button>
                    );
                  })}
                  {count === 0 && (
                    <p className="text-stone-300 italic font-serif py-8">Rij is leeg</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <button
              disabled={selectedRow === null || selectedCount === 0 || !!winner || (gameMode === '1P' && currentPlayer === 2)}
              onClick={handleConfirmMove}
              className={`px-12 py-4 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                selectedRow !== null && selectedCount > 0 && !winner && !(gameMode === '1P' && currentPlayer === 2)
                  ? 'bg-orange-500 text-white shadow-xl shadow-orange-200 hover:bg-orange-600'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'
              }`}
            >
              {isComputerThinking ? 'Computer denkt...' : `Pak ${selectedCount > 0 ? selectedCount : ''} stokje${selectedCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center px-4">
          <button 
            onClick={() => setShowRules(!showRules)}
            className="text-stone-400 hover:text-stone-600 flex items-center gap-2 text-sm transition-colors"
          >
            <Info size={18} />
            Spelregels
          </button>
          <button 
            onClick={() => setScores({ p1: 0, p2: 0, computer: 0 })}
            className="text-stone-400 hover:text-stone-600 flex items-center gap-2 text-sm transition-colors"
          >
            <RotateCcw size={18} />
            Reset Stand
          </button>
          <button 
            onClick={resetGame}
            className="text-stone-400 hover:text-stone-600 flex items-center gap-2 text-sm transition-colors"
          >
            <RotateCcw size={18} />
            Reset Spel
          </button>
        </div>

        {/* Rules Modal */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8 bg-white p-8 rounded-3xl border border-stone-200 shadow-sm"
            >
              <h3 className="font-serif italic text-2xl mb-4">Hoe speel je de last matchstick?</h3>
              <ul className="space-y-3 text-stone-600 text-sm leading-relaxed">
                <li className="flex gap-3">
                  <span className="font-bold text-orange-500">1.</span>
                  Standaard zijn er drie rijen met 3, 5 en 7 stokjes. In de 'Willekeurig' modus zijn er 3 tot 5 rijen met elk 1 tot 9 stokjes.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-500">2.</span>
                  Spelers pakken om de beurt een aantal stokjes uit **slechts één** rij.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-500">3.</span>
                  Je moet minimaal 1 stokje pakken en mag maximaal alle stokjes uit die rij pakken.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-500">4.</span>
                  **Belangrijk:** De speler die het allerlaatste stokje moet pakken, verliest het spel.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-500">5.</span>
                  De speler die een potje begon, is in het volgende potje de tweede speler.
                </li>
              </ul>
              <button 
                onClick={() => setShowRules(false)}
                className="mt-6 text-orange-500 font-medium text-sm hover:underline"
              >
                Begrepen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
