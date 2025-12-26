
import React, { useState } from 'react';
import { RadioHistory } from '../types';
import { Play, Download, Clock, MapPin, User, Volume2 } from 'lucide-react';

interface HistoryPanelProps {
  history: RadioHistory[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
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
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Clock size={12} /> Historial 24h
        </h3>
        <span className="text-[9px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-mono">
          {history.length} REG
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
            <Volume2 size={32} />
            <p className="text-[10px] uppercase mt-2">Sin registros recientes</p>
          </div>
        )}
        
        {history.map((item) => (
          <div key={item.id} className="bg-white/[0.03] border border-white/5 p-3 rounded hover:bg-white/[0.06] transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${playingId === item.id ? 'bg-orange-500 animate-pulse' : 'bg-gray-600'}`} />
                <span className="font-bold text-xs text-orange-500 font-mono">{item.sender_name}</span>
              </div>
              <span className="text-[9px] text-gray-500 font-mono">{formatTime(item.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-400 font-mono">
               <div className="flex items-center gap-1">
                 <MapPin size={10} className="text-gray-600" />
                 <span>{item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
               </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => playAudio(item.audio_data, item.id)}
                className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 text-[10px] font-bold uppercase transition-all ${playingId === item.id ? 'bg-orange-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <Play size={12} fill={playingId === item.id ? "white" : "none"} /> 
                {playingId === item.id ? 'Reproduciendo' : 'Escuchar'}
              </button>
              <button 
                onClick={() => downloadAudio(item.audio_data, item.sender_name, item.created_at)}
                className="w-10 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
