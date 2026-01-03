
import React, { useState } from 'react';
import { X, Send, AlertTriangle, Users, MapPin, Activity } from 'lucide-react';
import { outbox, OutboxItemType } from '../services/outboxService';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lng: number } | null;
  userName: string;
  channelId: string;
}

const EMERGENCY_TYPES = ['INCENDIO', 'ACCIDENTE', 'RESCATE', 'SANITARIO', 'POLICIAL'];

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose, location, userName, channelId }) => {
  const [status, setStatus] = useState('INCENDIO');
  const [peopleCount, setPeopleCount] = useState(1);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!location) return;

    const lat = location.lat.toFixed(5);
    const lon = location.lng.toFixed(5);
    const message = `ALERTA | YB\nLAT:${lat}\nLON:${lon}\nESTADO: ${status}\nPERSONAS: ${peopleCount}`;
    
    // 1. Persistencia Inmediata en Outbox (Store & Forward)
    await outbox.enqueue(OutboxItemType.SOS, {
      sender_name: userName,
      lat: location.lat,
      lng: location.lng,
      status: status,
      people: peopleCount,
      channel_id: channelId,
      full_message: message
    });

    // 2. Disparo de Intento de SMS (Acción nativa del SO)
    const uri = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = uri;

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-red-600 w-full max-w-sm shadow-[0_0_30px_rgba(220,38,38,0.3)] relative">
        <div className="bg-red-600/20 p-4 border-b border-red-600 flex justify-between items-center">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="animate-pulse" size={24} />
            <h2 className="font-mono font-bold text-lg tracking-widest">EMERGENCY SOS</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-mono text-gray-500 uppercase flex items-center gap-1">
              <MapPin size={12} /> GPS Coordinates
            </label>
            <div className="bg-black/50 p-3 font-mono text-sm text-gray-300 border border-gray-700">
              {location ? (
                <>
                  <div>LAT: {location.lat.toFixed(5)}</div>
                  <div>LON: {location.lng.toFixed(5)}</div>
                </>
              ) : (
                <span className="text-red-500 animate-pulse">WAITING FOR GPS...</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-500 uppercase flex items-center gap-1">
              <Activity size={12} /> Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EMERGENCY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setStatus(type)}
                  className={`
                    p-2 text-xs font-bold font-mono border transition-all
                    ${status === type 
                      ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-500 uppercase flex items-center gap-1">
              <Users size={12} /> People Involved
            </label>
            <div className="flex items-center gap-4 bg-gray-800 p-2 border border-gray-700">
              <button 
                onClick={() => setPeopleCount(Math.max(0, peopleCount - 1))}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-bold"
              >-</button>
              <span className="flex-1 text-center font-mono text-xl font-bold">{peopleCount}</span>
              <button 
                onClick={() => setPeopleCount(peopleCount + 1)}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-bold"
              >+</button>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!location}
            className={`
              w-full py-4 flex items-center justify-center gap-2 font-bold tracking-widest uppercase
              ${location 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <Send size={18} />
            Generar SOS Resiliente
          </button>
          
          <div className="text-[10px] text-center text-gray-600 uppercase tracking-tighter">
             Modo Store & Forward Activo: La alerta se guardará si no hay señal.
          </div>
        </div>
      </div>
    </div>
  );
};
