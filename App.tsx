
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapDisplay } from './components/MapDisplay';
import { RadioControl } from './components/RadioControl';
import { TeamList } from './components/TeamList';
import { HistoryPanel } from './components/HistoryPanel';
import { EmergencyModal } from './components/EmergencyModal';
import { ChannelSelector } from './components/ChannelSelector';
import { TeamMember, ConnectionState, RadioHistory, Channel } from './types';
import { RadioService } from './services/radioService';
import { supabase, getDeviceId } from './services/supabase';
import { outbox, OutboxItemType, OutboxStatus } from './services/outboxService';
import { 
  BookOpen, Printer, Home, Radio as RadioIcon, CloudUpload, CloudOff, 
  ChevronLeft, MapPin, Activity, AlertTriangle, Send, Users, 
  Clock, Hash, Volume2, Play, Download, ShieldCheck, List, X
} from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- VISTAS INTERNAS (MANUAL Y GUÍA) ---
const ManualView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="bg-[#0e0a07] min-h-screen p-6 md:p-12 text-gray-200 selection:bg-orange-500 font-sans relative overflow-y-auto">
      <div className="scanline"></div>
      <div className="max-w-5xl mx-auto pb-24 relative z-10">
        <div className="no-print fixed bottom-6 right-6 flex gap-3 z-50">
            <button onClick={() => window.print()} className="bg-white text-black px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-2xl border border-black/10">IMPRIMIR_PDF</button>
            <button onClick={onBack} className="bg-gray-800 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all border border-white/10 flex items-center gap-2">
                <ChevronLeft size={14} /> VOLVER
            </button>
        </div>
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-1 bg-orange-500"></div>
            <p className="mono text-orange-500 font-bold tracking-[0.4em] text-[9px] uppercase">OPERATIONAL_MANUAL_v3.2</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 uppercase text-white">GUÍA DE<br />USUARIO</h1>
        </header>
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <section className="bg-white/5 border border-white/10 p-6">
            <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2"><span className="text-orange-500">01</span> IDENTIFICACIÓN</h2>
            <p className="text-xs text-gray-400">Ingrese su Callsign. Ej: "MOVIL-1". Este nombre se verá en el mapa y log de audio.</p>
          </section>
          <section className="bg-white/5 border border-white/10 p-6">
            <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2"><span className="text-orange-500">02</span> VOZ Y PTT</h2>
            <p className="text-xs text-gray-400">Mantenga el botón central para hablar. Suelte para recibir. El sistema es Simplex.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

const GuideView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="bg-white min-h-screen p-8 text-black font-mono relative overflow-y-auto">
      <div className="max-w-4xl mx-auto pb-20 relative z-10">
        <button onClick={onBack} className="no-print fixed bottom-6 right-6 bg-black text-white px-8 py-3 uppercase font-bold text-xs">VOLVER</button>
        <div className="border-4 border-black p-6 mb-12">
            <h1 className="text-4xl font-black uppercase leading-none">GUÍA RÁPIDA (B/W)</h1>
            <p className="text-sm font-bold mt-2 text-red-600">SISTEMA CRÍTICO DE RESPUESTA</p>
        </div>
        <div className="space-y-6">
          <div className="p-4 border-2 border-black">
            <h3 className="font-bold uppercase">01. TX_AUDIO</h3>
            <p className="text-sm">Presione PTT y hable claro. El retraso es de ~300ms.</p>
          </div>
          <div className="p-4 border-2 border-black">
            <h3 className="font-bold uppercase">02. GPS_SYNC</h3>
            <p className="text-sm">Su ubicación se actualiza automáticamente al modular o cada 30 segundos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- LANDING PAGE ---
const LandingView = ({ onEnter, onManual, onGuide }: { onEnter: () => void; onManual: () => void; onGuide: () => void }) => {
  return (
    <div className="overflow-x-hidden relative min-h-screen selection:bg-orange-500 bg-[#0e0a07]">
      <div className="scanline"></div>
      <nav className="fixed w-full top-0 left-0 z-[100] bg-[#0e0a07]/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-600 rounded-sm flex items-center justify-center font-black text-white text-[10px]">R</div>
                  <span className="font-bold tracking-tighter text-sm uppercase text-white">RADIO_UBICACIÓN</span>
              </div>
              <div className="flex items-center gap-6">
                  <button onClick={onGuide} className="hidden md:block text-[10px] text-orange-500 hover:underline font-bold uppercase tracking-widest transition-all">GUÍA_B/W</button>
                  <button onClick={onManual} className="hidden md:block text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-all">MANUAL</button>
                  <button onClick={onEnter} className="text-[10px] font-bold text-orange-500 border border-orange-500/30 px-4 py-1.5 hover:bg-orange-600 hover:text-white transition-all uppercase">ACCEDER &gt;</button>
              </div>
          </div>
      </nav>
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 hero-gradient">
          <div className="max-w-5xl mx-auto text-center z-10">
              <span className="text-orange-500 text-[10px] font-bold tracking-[0.4em] uppercase mb-10 block">MISSION_CRITICAL_INFRASTRUCTURE</span>
              <h1 className="hero-title text-7xl md:text-[120px] text-white uppercase mb-12 leading-[0.8] font-black">RADIO<br/>UBICACIÓN<br/>MÓVIL</h1>
              <p className="text-white text-xl md:text-2xl font-bold uppercase mb-16 opacity-80">COMUNICACIONES RESILIENTES PARA BRIGADAS</p>
              <button onClick={onEnter} className="btn-ptt px-16 py-6 rounded-sm font-black text-sm uppercase text-white shadow-2xl">ENTRAR EN SERVICIO</button>
          </div>
      </section>
    </div>
  );
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(2)}km`;
}

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'manual' | 'guia'>('landing');
  const [userName, setUserName] = useState<string>(localStorage.getItem('user_callsign') || '');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [tempName, setTempName] = useState('');
  
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [teamMembersRaw, setTeamMembersRaw] = useState<TeamMember[]>([]);
  const [radioHistory, setRadioHistory] = useState<RadioHistory[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [remoteTalker, setRemoteTalker] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'history'>('team');

  const radioRef = useRef<RadioService | null>(null);
  const effectiveLocation = manualLocation || userLocation;
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    userLocationRef.current = effectiveLocation;
  }, [effectiveLocation]);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const teamMembers = useMemo(() => {
    if (!effectiveLocation) return teamMembersRaw;
    return teamMembersRaw.map(m => ({
      ...m,
      distance: calculateDistance(effectiveLocation.lat, effectiveLocation.lng, m.lat, m.lng)
    }));
  }, [teamMembersRaw, effectiveLocation]);

  // --- SINCRONIZACIÓN Y TIEMPO REAL REFORZADA ---
  useEffect(() => {
    if (!activeChannel || !userName) return;

    const syncChannel = async () => {
      // 1. Carga Inicial
      const { data: members } = await supabase
        .from('locations')
        .select('*')
        .eq('channel_id', activeChannel.id)
        .gt('last_seen', new Date(Date.now() - 1800000).toISOString()); // Últimos 30 min
      
      if (members) {
        setTeamMembersRaw(members.filter(m => m.id !== DEVICE_ID).map(m => ({
           ...m,
           lat: Number(m.lat),
           lng: Number(m.lng)
        })));
      }

      // 2. Latido inicial para que otros me vean
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          await supabase.from('locations').upsert({
            id: DEVICE_ID, name: userName, lat: latitude, lng: longitude, accuracy: Math.round(accuracy),
            role: 'Unidad Móvil', status: 'online', last_seen: new Date().toISOString(), channel_id: activeChannel.id
          });
        });
      }

      const { data: history } = await supabase
        .from('radio_history')
        .select('*')
        .eq('channel_id', activeChannel.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (history) setRadioHistory(history);
    };

    syncChannel();

    // 3. Suscripción sin filtros de servidor (más confiable)
    const channel = supabase.channel(`sync-v4-${activeChannel.id}`)
      .on('postgres_changes', { event: '*', table: 'locations', schema: 'public' }, (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const targetId = newRecord?.id || oldRecord?.id;

        // Ignorar si soy yo o si el canal no coincide (filtro manual)
        if (targetId === DEVICE_ID) return;
        
        // El nuevo record debe pertenecer a mi canal (si existe el dato)
        if (newRecord && newRecord.channel_id !== activeChannel.id) return;

        setTeamMembersRaw(prev => {
          if (eventType === 'DELETE') {
            return prev.filter(m => m.id !== targetId);
          }

          const index = prev.findIndex(m => m.id === targetId);
          const formatted = {
            ...newRecord,
            lat: newRecord.lat ? Number(newRecord.lat) : undefined,
            lng: newRecord.lng ? Number(newRecord.lng) : undefined
          };

          if (index === -1) {
            // Solo añadir si tiene coordenadas iniciales
            if (formatted.lat !== undefined && formatted.lng !== undefined) {
              return [...prev, formatted as TeamMember];
            }
            return prev;
          }

          const next = [...prev];
          // Fusión crítica: Si el paquete no trae lat/lng (porque solo cambió el status), mantener los anteriores
          next[index] = { 
            ...next[index], 
            ...formatted,
            lat: formatted.lat ?? next[index].lat,
            lng: formatted.lng ?? next[index].lng
          } as TeamMember;
          return next;
        });
      })
      .on('postgres_changes', { event: 'INSERT', table: 'radio_history', schema: 'public' }, (payload: any) => {
        if (payload.new.channel_id === activeChannel.id) {
          setRadioHistory(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [activeChannel, userName]);

  // --- WATCHER DE GEOLOCALIZACIÓN ---
  useEffect(() => {
    if (!activeChannel || !userName || !navigator.geolocation || manualLocation) return;
    
    const watchId = navigator.geolocation.watchPosition(async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setLocationAccuracy(accuracy);
      if (navigator.onLine) {
        await supabase.from('locations').upsert({
          id: DEVICE_ID, name: userName, lat: latitude, lng: longitude, accuracy: Math.round(accuracy),
          role: accuracy > 200 ? 'Unidad PC' : 'Unidad Móvil', status: isTalking ? 'talking' : 'online', 
          last_seen: new Date().toISOString(), channel_id: activeChannel.id
        });
      }
    }, null, { enableHighAccuracy: true, timeout: 5000 });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTalking, activeChannel, userName, manualLocation]);

  const handleMapClick = async (lat: number, lng: number) => {
    if (!isManualMode || !activeChannel) return;
    setIsManualMode(false);
    setManualLocation({ lat, lng });
    if (navigator.onLine) {
      await supabase.from('locations').upsert({
        id: DEVICE_ID, name: userName, lat, lng, accuracy: 0,
        role: 'Unidad Fija', status: isTalking ? 'talking' : 'online', 
        last_seen: new Date().toISOString(), channel_id: activeChannel.id
      });
    }
  };

  const handleConnect = useCallback(() => {
    if (!activeChannel) return;
    setConnectionState(ConnectionState.CONNECTING);
    try {
      radioRef.current = new RadioService({
        userId: DEVICE_ID, userName, channelId: activeChannel.id,
        getUserLocation: () => userLocationRef.current,
        onAudioBuffer: () => { setAudioLevel(prev => Math.min(100, prev + 25)); setTimeout(() => setAudioLevel(0), 100); },
        onIncomingStreamStart: (name) => setRemoteTalker(name),
        onIncomingStreamEnd: () => setRemoteTalker(null)
      });
      setConnectionState(ConnectionState.CONNECTED);
    } catch (e) { setConnectionState(ConnectionState.ERROR); }
  }, [userName, activeChannel]);

  const handleDisconnect = useCallback(() => {
    if (radioRef.current) radioRef.current.disconnect();
    radioRef.current = null;
    setConnectionState(ConnectionState.DISCONNECTED);
  }, []);

  if (currentView === 'manual') return <ManualView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'guia') return <GuideView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'landing') return <LandingView onEnter={() => setCurrentView('app')} onManual={() => setCurrentView('manual')} onGuide={() => setCurrentView('guia')} />;

  if (!userName) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-sm space-y-6 bg-gray-900 border border-orange-500/20 p-8 rounded shadow-2xl">
        <h1 className="text-orange-500 font-black text-center uppercase tracking-widest">IDENTIFICACIÓN</h1>
        <input autoFocus type="text" value={tempName} onChange={e => setTempName(e.target.value)} placeholder="INDICATIVO (CALLSIGN)" className="w-full bg-black border border-gray-800 p-4 text-orange-500 text-center font-bold uppercase"/>
        <button onClick={() => { if(tempName.trim().length >= 3) { localStorage.setItem('user_callsign', tempName.trim().toUpperCase()); setUserName(tempName.trim().toUpperCase()); }}} className="w-full bg-orange-600 text-white font-black py-4 uppercase">ENTRAR EN SERVICIO</button>
      </div>
    </div>
  );

  if (!activeChannel) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center p-6 font-mono text-center">
       <div className="w-full max-w-md space-y-6">
          <h2 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-6">Seleccionar Frecuencia</h2>
          <ChannelSelector onSelect={ch => setActiveChannel(ch)} />
       </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-black overflow-hidden relative text-white">
      <div className="scanline"></div>
      <div className="flex-1 relative overflow-hidden">
         <MapDisplay userLocation={effectiveLocation} teamMembers={teamMembers} accuracy={locationAccuracy} isManualMode={isManualMode} onMapClick={handleMapClick} />
         <div className="absolute top-4 left-4 z-[2000] bg-black/80 backdrop-blur px-3 py-1 border border-orange-500/30 rounded">
            <span className="text-xs font-bold text-orange-500 font-mono uppercase tracking-widest">{activeChannel.name}</span>
         </div>
      </div>
      <div className="flex-none md:w-[400px] bg-gray-950 z-20">
        <RadioControl 
           connectionState={connectionState} isTalking={isTalking} activeChannelName={activeChannel.name}
           onTalkStart={() => { if (radioRef.current) { setIsTalking(true); radioRef.current.startTransmission(); } }} 
           onTalkEnd={() => { if (radioRef.current) { radioRef.current.stopTransmission(); setIsTalking(false); } }} 
           lastTranscript={remoteTalker} onConnect={handleConnect} onDisconnect={handleDisconnect} onQSY={() => { handleDisconnect(); setActiveChannel(null); }}
           audioLevel={audioLevel} onEmergencyClick={() => setShowEmergencyModal(true)}
           isManualMode={isManualMode} onToggleManual={() => setIsManualMode(!isManualMode)}
        />
      </div>
      <EmergencyModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} location={effectiveLocation} userName={userName} channelId={activeChannel.id} />
    </div>
  );
}

export default App;
