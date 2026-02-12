
import React, { useState, useEffect } from 'react';
import { GameWorld } from './components/GameWorld';
import { fetchDailyArtifact } from './services/geminiService';
import { Artifact, GameState } from './types';

const App: React.FC = () => {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('museum_mystery_state');
    const defaultState: GameState = {
      score: 0,
      streak: 0,
      lastSolvedDate: null,
      artifactsCollected: [],
      currentLocation: { x: 1000, y: 1000 },
      dailyFound: false,
      status: 'intro'
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      return {
        ...defaultState,
        ...parsed,
        // Reset daily found if it's a new day
        dailyFound: parsed.lastSolvedDate === today,
        status: 'intro'
      };
    }
    return defaultState;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    localStorage.setItem('museum_mystery_state', JSON.stringify({
      score: gameState.score,
      streak: gameState.streak,
      lastSolvedDate: gameState.lastSolvedDate,
      artifactsCollected: gameState.artifactsCollected
    }));
  }, [gameState.score, gameState.streak, gameState.lastSolvedDate, gameState.artifactsCollected]);

  useEffect(() => {
    const init = async () => {
      try {
        const daily = await fetchDailyArtifact();
        setArtifact(daily);
      } catch (error) {
        console.error("Failed to load artifact", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleArtifactFound = () => {
    setGameState(prev => ({ ...prev, status: 'solving' }));
  };

  const updateStreak = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    setGameState(prev => {
      let newStreak = prev.streak;
      
      if (prev.lastSolvedDate) {
        const lastDate = new Date(prev.lastSolvedDate);
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        // If diffDays is 0, they already solved today, streak doesn't change
      } else {
        newStreak = 1;
      }

      return {
        ...prev,
        streak: newStreak,
        lastSolvedDate: todayStr,
        status: 'success',
        score: prev.score + 100,
        dailyFound: true
      };
    });
  };

  const handleGuess = () => {
    if (!artifact) return;
    const isCorrect = guess.toLowerCase().trim().includes(artifact.name.toLowerCase().trim()) || 
                      artifact.name.toLowerCase().trim().includes(guess.toLowerCase().trim());
    
    if (isCorrect) {
      updateStreak();
      setFeedback('');
    } else {
      setFeedback("That's not it! Try reading the riddle again.");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#030303] text-white">
        <div className="w-16 h-16 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold animate-pulse">Entering the Vault of Reddit...</p>
        <p className="text-gray-500 mt-2">Fetching Daily Mystery</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
      {/* Sidebar - Stats & Info */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto">
        <header className="flex items-center gap-3 p-2">
          <div className="reddit-bg-orange w-10 h-10 rounded-full flex items-center justify-center">
            <i className="fab fa-reddit-alien text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Museum Mystery</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider">The Daily Artifact</p>
          </div>
        </header>

        <section className="bg-[#1a1a1b] p-4 rounded-xl border border-[#343536]">
          <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase">Archive Status</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Daily Streak</span>
            <div className="flex items-center gap-1.5">
              <i className={`fas fa-fire ${gameState.streak > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-600'}`}></i>
              <span className={`font-mono font-bold ${gameState.streak > 0 ? 'reddit-orange' : 'text-gray-500'}`}>
                {gameState.streak} {gameState.streak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Total Rep</span>
            <span className="font-mono text-blue-400 font-bold">{gameState.score}</span>
          </div>
        </section>

        <section className="bg-[#1a1a1b] p-4 rounded-xl border border-[#343536] flex-1">
          <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase">Riddle of the Day</h2>
          {gameState.dailyFound ? (
            <div className="text-center py-4">
              <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
              <p className="text-sm text-gray-300">Archive complete for today.</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Come back tomorrow for a new mystery</p>
            </div>
          ) : (
            <>
              <p className="italic text-gray-300 mb-4 leading-relaxed">
                "{artifact?.riddle}"
              </p>
              {gameState.status === 'exploring' && (
                <div className="bg-[#272729] p-3 rounded-lg border border-white/5">
                  <p className="text-xs text-gray-400">
                    <i className="fas fa-search mr-2"></i>
                    Explore the gallery to find the physical artifact and solve the mystery.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="text-[10px] text-gray-600 p-2 text-center uppercase tracking-widest">
          r/MuseumOfReddit &copy; 2025
        </footer>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 relative">
        {gameState.status === 'intro' ? (
          <div className="w-full h-full bg-[#1a1a1b] rounded-xl border border-[#343536] p-8 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 reddit-bg-orange rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,69,0,0.3)]">
               <i className="fas fa-key text-4xl text-white"></i>
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome, Curator</h2>
            <p className="max-w-md text-gray-400 mb-8 leading-relaxed">
              Every day, a legendary piece of Reddit history is hidden within our virtual museum. Find the artifact and solve the riddle to archive it forever.
            </p>
            {gameState.dailyFound ? (
               <div className="flex flex-col items-center gap-4">
                  <p className="text-[#FF4500] font-bold">You've already found today's artifact!</p>
                  <button 
                    onClick={() => setGameState(prev => ({ ...prev, status: 'success' }))}
                    className="px-8 py-3 bg-white text-black rounded-full font-bold hover:brightness-110 transition-all transform hover:scale-105"
                  >
                    View Archived Entry
                  </button>
               </div>
            ) : (
              <button 
                onClick={() => setGameState(prev => ({ ...prev, status: 'exploring' }))}
                className="px-8 py-3 reddit-bg-orange rounded-full font-bold text-white hover:brightness-110 transition-all transform hover:scale-105"
              >
                Start Today's Hunt
              </button>
            )}
          </div>
        ) : gameState.status === 'exploring' ? (
          <GameWorld 
            onFindArtifact={handleArtifactFound} 
            artifactFound={gameState.dailyFound}
            dailyArtifact={artifact}
          />
        ) : (
          <div className="w-full h-full bg-[#1a1a1b] rounded-xl border border-[#343536] overflow-hidden flex flex-col items-center p-6 md:p-8 text-center scrollbar-hide overflow-y-auto">
             <div className="relative mb-6 shrink-0">
               <img 
                 src={artifact?.imageUrl} 
                 alt="Artifact" 
                 className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-2xl shadow-2xl border-2 border-[#FF4500]/50" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1b] via-transparent to-transparent"></div>
             </div>

             {gameState.status === 'solving' ? (
               <div className="max-w-lg w-full">
                 <h2 className="text-2xl font-bold mb-2">Mystery Identified!</h2>
                 <p className="text-gray-400 text-sm mb-6">You've located the artifact. Now, identify it by name to collect it.</p>
                 
                 <div className="space-y-4">
                   <input 
                     type="text" 
                     value={guess}
                     onChange={(e) => setGuess(e.target.value)}
                     placeholder="What is this artifact called?"
                     className="w-full bg-[#272729] border border-[#343536] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                   />
                   {feedback && <p className="text-red-500 text-xs italic">{feedback}</p>}
                   <button 
                     onClick={handleGuess}
                     className="w-full py-3 reddit-bg-orange rounded-lg font-bold hover:brightness-110 transition-all"
                   >
                     Submit to Archive
                   </button>
                   <button 
                     onClick={() => setGameState(prev => ({ ...prev, status: 'exploring' }))}
                     className="text-gray-500 text-xs underline mt-2"
                   >
                     Go back and explore more
                   </button>
                 </div>
               </div>
             ) : (
               <div className="max-w-2xl animate-in fade-in zoom-in duration-700 pb-8">
                  <div className="flex items-center justify-center gap-2 mb-2 text-[#FF4500]">
                    <i className="fas fa-certificate"></i>
                    <span className="text-sm font-bold uppercase tracking-widest">Artifact Archived</span>
                  </div>
                  <h2 className="text-4xl font-black mb-4 uppercase">{artifact?.name}</h2>
                  <div className="flex gap-4 justify-center mb-6">
                    <span className="bg-[#272729] px-3 py-1 rounded text-xs text-blue-400 font-bold">r/{artifact?.originalSubreddit}</span>
                    <span className="bg-[#272729] px-3 py-1 rounded text-xs text-gray-400 font-bold">Circa {artifact?.year}</span>
                  </div>
                  <div className="bg-black/30 p-6 rounded-xl text-left border border-white/5 mb-6">
                    <h3 className="text-[#FF4500] text-xs font-bold mb-2 uppercase">Official Record</h3>
                    <p className="text-gray-300 leading-relaxed text-sm mb-4">{artifact?.lore}</p>
                    <a 
                      href={artifact?.redditUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#4fbcff] hover:underline"
                    >
                      <i className="fab fa-reddit"></i>
                      VIEW ORIGINAL THREAD
                    </a>
                  </div>
                  <button 
                    onClick={() => setGameState(prev => ({ ...prev, status: 'intro' }))}
                    className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all"
                  >
                    Return to Main Hall
                  </button>
               </div>
             )}
          </div>
        )}
      </main>

      {/* Leaderboard / Notes Mini-Panel */}
      <div className="w-full lg:w-64 shrink-0 overflow-y-auto">
         <div className="bg-[#1a1a1b] p-4 rounded-xl border border-[#343536] h-full">
            <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase flex justify-between">
              <span>Community Notes</span>
              <i className="fas fa-users"></i>
            </h2>
            <div className="space-y-4">
              {[
                { user: "SnooExplorer", text: "Finally found it in Sector 2-4!", upvotes: 42 },
                { user: "RedditHistoryGuy", text: "The lore on this one is deep.", upvotes: 18 },
                { user: "RareCollector", text: "Took me 10 mins to solve the riddle.", upvotes: 5 }
              ].map((note, i) => (
                <div key={i} className="text-[11px] bg-[#272729] p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#4fbcff] font-bold">u/{note.user}</span>
                    <span className="text-gray-500 font-mono">+{note.upvotes}</span>
                  </div>
                  <p className="text-gray-400 italic">"{note.text}"</p>
                </div>
              ))}
              <div className="pt-4 border-t border-white/5">
                <textarea 
                  className="w-full bg-[#030303] border border-[#343536] rounded p-2 text-[10px] h-20 resize-none focus:outline-none focus:border-[#FF4500]"
                  placeholder="Leave a note for other curators..."
                ></textarea>
                <button className="w-full mt-2 py-1 text-[10px] font-bold reddit-bg-orange rounded">Post Note</button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default App;
