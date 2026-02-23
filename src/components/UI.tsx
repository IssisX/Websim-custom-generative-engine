import React, { useState } from 'react';
import { useStore } from '../store';
import { aistudio } from '../aistudio';
import { Sparkles, Send, Hexagon, Activity, Trash2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UI() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const addObject = useStore((state) => state.addObject);
  const objects = useStore((state) => state.objects);
  const clearObjects = useStore((state) => state.clearObjects);
  const gravity = useStore((state) => state.gravity);
  const setGravity = useStore((state) => state.setGravity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await (aistudio as any).chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `You are a master 3D generative architect. The user requests an object (e.g., 'a neon cyberpunk dog', 'a glass tree'). 
            Build it using up to 40 3D boxes. 
            Return ONLY a JSON object with this EXACT format: 
            {"type": "composite", "parts": [{"position": [x,y,z], "scale": [w,h,d], "color": "#hex", "material": "glass" | "metal" | "neon" | "matte"}]}
            
            Rules:
            1. Center the object around [0,0,0] in its local coordinates.
            2. Use 'glass' for transparent/refractive parts.
            3. Use 'neon' for glowing/emissive parts.
            4. Use 'metal' for shiny/reflective parts.
            5. Use 'matte' for standard parts.
            6. Be highly creative with colors and proportions to make it visually stunning.
            7. Ensure structural integrity (parts should overlap slightly so they look connected).` 
          },
          { role: "user", content: input }
        ],
        json: true
      });
      
      const data = JSON.parse(res.content);
      // Spawn slightly above the floor
      addObject({ id: Math.random(), position: [0, 15, 0], ...data });
      setInput('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Neural link severed. Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-50 font-sans">
      
      {/* Top HUD */}
      <header className="flex justify-between items-start w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center">
            <Hexagon className="text-white/80" size={20} />
          </div>
          <div>
            <h1 className="text-white font-medium tracking-widest uppercase text-sm">A.I. Studio</h1>
            <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase">Generative Sandbox v3.0</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <Activity size={12} />
            <span>System Nominal</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setGravity(gravity === 0 ? -9.81 : 0)}
              className={`p-2 rounded-full border transition-all ${gravity === 0 ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
              title="Toggle Zero Gravity"
            >
              {gravity === 0 ? <ArrowUpFromLine size={16} /> : <ArrowDownToLine size={16} />}
            </button>
            <button 
              onClick={clearObjects}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 transition-all"
              title="Clear Scene"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest mt-1">
            Entities: {objects.length}
          </p>
        </div>
      </header>

      {/* Bottom Controls */}
      <div className="pointer-events-auto w-full max-w-2xl mx-auto relative z-50">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm backdrop-blur-xl flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-xs">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 shadow-2xl relative overflow-hidden"
        >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
            
            <form onSubmit={handleSubmit} className="flex gap-2 relative z-10">
              <div className="flex-1 flex items-center bg-white/5 rounded-2xl px-4 border border-white/5 transition-colors focus-within:border-white/20 focus-within:bg-white/10">
                <Sparkles className="text-white/40 mr-3" size={18} />
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="E.g., 'A neon cyberpunk dog' or 'A glass tree'..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder-white/30 font-sans text-sm py-4"
                    disabled={loading}
                    autoFocus
                    style={{ pointerEvents: 'auto' }}
                />
              </div>
              <button 
                  type="submit" 
                  disabled={loading || !input.trim()}
                  className="px-6 rounded-2xl bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white transition-all flex items-center justify-center font-medium"
                  style={{ pointerEvents: 'auto' }}
              >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span className="text-sm">Synthesizing...</span>
                    </div>
                  ) : (
                    <Send size={18} />
                  )}
              </button>
            </form>
        </motion.div>
        
        <div className="mt-4 text-center pointer-events-none">
          <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest">
            Powered by Gemini 3 Flash • Physical Materials • Real-time Radiosity
          </p>
        </div>
      </div>
    </div>
  );
}
