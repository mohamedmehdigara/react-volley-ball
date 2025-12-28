import React from 'react';

const TrainingTipsOverlay = ({ onDismiss }) => {
  const tips = [
    { key: '← →', action: 'Move Lateral', desc: 'Position yourself under the ball.' },
    { key: 'Space / ↑', action: 'Jump & Spike', desc: 'Timing is key for powerful returns.' },
    { key: 'Combo', action: 'Hit Multiplier', desc: 'Continuous volleys increase your speed.' }
  ];

  return (
    <div className="absolute inset-0 z-[250] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            Pro Training Module
          </div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter">MASTER THE COURT</h2>
        </div>

        <div className="space-y-4 mb-10">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl group hover:border-blue-500/50 transition-colors">
              <div className="flex-shrink-0 w-24 h-12 bg-slate-800 rounded-lg flex items-center justify-center font-mono text-xl text-blue-400 font-bold border border-slate-700 shadow-inner group-hover:scale-105 transition-transform">
                {tip.key}
              </div>
              <div>
                <div className="text-white font-bold text-sm uppercase tracking-wide">{tip.action}</div>
                <div className="text-slate-400 text-xs">{tip.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/80 p-6 rounded-2xl border border-dashed border-slate-700 mb-8">
          <h3 className="text-white text-[10px] font-bold uppercase tracking-widest mb-3 opacity-50">Pro Tip</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Spiking the ball while at the <span className="text-blue-400 font-bold">apex of your jump</span> adds a velocity boost and tighter downward angle, making it harder for the AI to recover.
          </p>
        </div>

        <button 
          onClick={onDismiss}
          className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-blue-400 hover:text-white transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] uppercase tracking-widest text-sm"
        >
          Initialize Match
        </button>
      </div>
    </div>
  );
};

export default TrainingTipsOverlay;