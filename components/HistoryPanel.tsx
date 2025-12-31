import React, { useState } from 'react';
import { RadioHistory, Channel } from '../types';
import { Play, Download, Clock, MapPin, Hash, Volume2 } from 'lucide-react';

interface HistoryPanelProps {
  history: RadioHistory[];
  activeChannel: Channel | null;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, activeChannel }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const playAudio = (audioBase64: string, id: string) => {
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
    setPlayingId(id);
    audio.play();
    audio.onended = () => setPlayingId(null);
  };

  const downloadAudio = (audioBase64: string, name: string, time: string) => {
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${audioBase64}`;
    link.download = `RADIO_${name}_${time.replace(/[: ]/g, '_')}.wav`;
    link.click();
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header Contextualizado */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock size={12} /> LOG_AUDIO
          </h3>
          <span className="text-[9px] text-orange-500 font-mono uppercase flex items-center gap-1 mt-0.5">
            <Hash size={10} /> {activeChannel?.name || 'DESCONOCIDO'}
          </span>
        </div>
        <span className="text-[9px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-mono border border-orange-500/30">
          {history.length} PKTS
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 p-2 scrollbar-tactical">
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
            <Volume2 size={32} />
            <p className="text-[9px] uppercase mt-2 tracking-widest">Frecuencia Silenciosa</p>
          </div>
        )}
        
        {history.map((item) => (
          <div key={item.id} className="bg-black/40 border border-white/5 p-3 rounded hover:border-orange-500/30 transition-all group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${playingId === item.id ? 'bg-orange-500 animate-pulse' : 'bg-gray-700'}`} />
                <span className="font-bold text-xs text-orange-400 font-mono tracking-tight">{item.sender_name}</span>
              </div>
              <span className="text-[8px] text-gray-600 font-mono">{formatTime(item.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-3 text-[9px] text-gray-500 font-mono">
               <div className="flex items-center gap-1">
                 <MapPin size={10} className="text-gray-700" />
                 <span>{item.lat.toFixed(4)} / {item.lng.toFixed(4)}</span>
               </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => playAudio(item.audio_data, item.id)}
                className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 text-[9px] font-black uppercase transition-all ${playingId === item.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                <Play size={10} fill={playingId === item.id ? "white" : "none"} /> 
                {playingId === item.id ? 'TX_PLAY' : 'REPRODUCIR'}
              </button>
              <button 
                onClick={() => downloadAudio(item.audio_data, item.sender_name, item.created_at)}
                className="w-10 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors border border-white/5"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .scrollbar-tactical::-webkit-scrollbar { width: 4px; }
        .scrollbar-tactical::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-tactical::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
};
