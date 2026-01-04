
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
  Home, Radio as RadioIcon, CloudUpload, CloudOff, 
  ChevronLeft, Users, Clock, List, X, RefreshCw
} from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- VISTAS INTERNAS ---
const ManualView = ({ onBack }: { onBack: () => void }) => (
  <div className="bg-[#0e0a07] min-h-screen p-6 md:p-12 text-gray-200 font-sans overflow-y-auto relative">
    <div className="scanline"></div>
    <div className="max-w-5xl mx-auto relative z-10">
      <button onClick={onBack} className="fixed bottom-6 right-6 bg-gray-800 text-white px-6 py-3 font-bold uppercase text-xs border border-white/10 flex items-center gap-2">
        <ChevronLeft size={16} /> VOLVER
      </button>
      <header className="mb-12">
        <h1 className="text-5xl font-black uppercase text-white mb-2">MANUAL TÁCTICO</h1>
        <p className="text-orange-500 font-mono text-xs tracking-widest uppercase">Protocolo v3.2_STABLE</p>
      </header>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 p-6">
          <h3 className="font-bold text-orange-500 mb-2 uppercase">TX_AUDIO (Hablar)</h3>
          <p className="text-sm text-gray-400">Mantén el botón PTT. Suelta para escuchar. El sistema es simplex.</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <h3 className="font-bold text-orange-500 mb-2 uppercase">GPS_SYNC (Ubicación)</h3>
          <p className="text-sm text-gray-400">Tu posición se envía cada vez que hablas o cada 30 segundos.</p>
        </div>
      </div>
    </div>
  </div>
);

// --- LANDING PAGE ---
const LandingView = ({ onEnter, onManual }: { onEnter: () => void; onManual: () => void }) => (
  <div className="min-h-screen bg-[#0e0a07] relative flex items-center justify-center overflow-hidden">
    <div className="scanline"></div>
    <div className="z-10 text-center px-6">
      <h1 className="hero-title text-7xl md:text-9xl text-white uppercase font-black mb-8 leading-none">RADIO<br/>UBICACIÓN</h1>
      <p className="text-orange-500 font-bold uppercase tracking-widest mb-12">Comunicaciones Tácticas de Emergencia</p>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <button onClick={onEnter} className="btn-ptt px-12 py-5 font-black uppercase text-white tracking-widest">Entrar en Servicio</button>
        <button onClick={onManual} className="bg-transparent border border-white/20 px-12 py-5 font-bold uppercase text-gray-400 hover:text-white">Manual</button>
      </div>
    </div>
  </div>
);

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(2)}km`;
}

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'manual'>('landing');
  const [userName, setUserName] = useState<string>(localStorage.getItem('user_callsign') || '');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [tempName, setTempName] = useState('');
  
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [teamMembersRaw, setTeamMembersRaw] = useState<TeamMember[]>([]);
  const [radioHistory, setRadioHistory] = useState<RadioHistory[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [remoteTalker, setRemoteTalker] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'team' | 'history'>('map');

  const radioRef = useRef<RadioService | null>(null);
  const effectiveLocation = manualLocation || userLocation;
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    userLocationRef.current = effectiveLocation;
  }, [effectiveLocation]);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  const teamMembers = useMemo(() => {
    if (!effectiveLocation) return teamMembersRaw;
    return teamMembersRaw.map(m => ({
      ...m,
      distance: calculateDistance(effectiveLocation.lat, effectiveLocation.lng, m.lat, m.lng)
    }));
  }, [teamMembersRaw, effectiveLocation]);

  // --- CARGA INICIAL Y TIEMPO REAL ---
  const fetchAllData = useCallback(async () => {
    if (!activeChannel) return;
    
    // Cargar Usuarios
    const { data: members } = await supabase
      .from('locations')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .gt('last_seen', new Date(Date.now() - 3600000).toISOString());
    
    if (members) {
      setTeamMembersRaw(members.filter(m => m.id !== DEVICE_ID).map(m => ({
        ...m, lat: Number(m.lat), lng: Number(m.lng)
      })));
    }

    // Cargar Historial
    const { data: history } = await supabase
      .from('radio_history')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (history) setRadioHistory(history);
  }, [activeChannel]);

  useEffect(() => {
    if (!activeChannel || !userName) return;

    fetchAllData();

    // Suscripción corregida para evitar fallos de ID de canal
    const channel = supabase.channel(`sync-v5-${activeChannel.id}`)
      .on('postgres_changes', { event: '*', table: 'locations', schema: 'public' }, (payload: any) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        const target = newRec || oldRec;
        
        // CORRECCIÓN CRÍTICA: Comparación de ID robusta (string vs number)
        if (!target || String(target.id) === String(DEVICE_ID)) return;
        if (target.channel_id && String(target.channel_id) !== String(activeChannel.id)) return;

        setTeamMembersRaw(prev => {
          if (eventType === 'DELETE') return prev.filter(m => m.id !== target.id);
          
          const idx = prev.findIndex(m => m.id === target.id);
          const formatted = {
            ...target,
            lat: target.lat ? Number(target.lat) : undefined,
            lng: target.lng ? Number(target.lng) : undefined
          };

          if (idx === -1) {
            return formatted.lat ? [...prev, formatted as TeamMember] : prev;
          }

          const next = [...prev];
          next[idx] = { 
            ...next[idx], 
            ...formatted,
            lat: formatted.lat ?? next[idx].lat,
            lng: formatted.lng ?? next[idx].lng
          } as TeamMember;
          return next;
        });
      })
      .on('postgres_changes', { event: 'INSERT', table: 'radio_history', schema: 'public' }, (payload: any) => {
        if (String(payload.new.channel_id) === String(activeChannel.id)) {
          setRadioHistory(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannel, userName, fetchAllData]);

  // --- LOCALIZACIÓN PROPIA ---
  useEffect(() => {
    if (!activeChannel || !userName || manualLocation) return;
    
    const sendPos = async (lat: number, lng: number, acc: number) => {
      if (!isOnline) return;
      await supabase.from('locations').upsert({
        id: DEVICE_ID, name: userName, lat, lng, accuracy: Math.round(acc),
        role: acc > 150 ? 'PC / Base' : 'Móvil', 
        status: isTalking ? 'talking' : 'online', 
        last_seen: new Date().toISOString(), 
        channel_id: activeChannel.id
      });
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        sendPos(latitude, longitude, accuracy);
      },
      null, 
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTalking, activeChannel, userName, manualLocation, isOnline]);

  if (currentView === 'manual') return <ManualView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'landing') return <LandingView onEnter={() => setCurrentView('app')} onManual={() => setCurrentView('manual')} />;

  if (!userName) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-sm bg-gray-900 border border-orange-500/30 p-8 shadow-2xl">
        <h1 className="text-orange-500 font-black text-center mb-8 tracking-widest uppercase">Identificación Radio</h1>
        <input 
          autoFocus type="text" value={tempName} onChange={e => setTempName(e.target.value.toUpperCase())} 
          onKeyDown={e => e.key === 'Enter' && tempName.length >= 3 && (localStorage.setItem('user_callsign', tempName), setUserName(tempName))}
          placeholder="CALLSIGN (EJ: MOVIL-1)" 
          className="w-full bg-black border border-gray-800 p-4 text-orange-500 text-center font-bold mb-4"
        />
        <button onClick={() => { if(tempName.length >= 3) { localStorage.setItem('user_callsign', tempName); setUserName(tempName); }}} className="w-full bg-orange-600 text-white font-black py-4">ENTRAR</button>
      </div>
    </div>
  );

  if (!activeChannel) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono">
       <div className="w-full max-w-md">
          <h2 className="text-orange-500 font-bold uppercase text-center mb-8">Seleccionar Canal</h2>
          <ChannelSelector onSelect={ch => setActiveChannel(ch)} />
       </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black overflow-hidden relative text-white">
      <div className="scanline"></div>
      
      {/* MAPA Y PANELES MÓVILES */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
         {/* Navegación Móvil (Solo visible en pantallas pequeñas) */}
         <div className="md:hidden flex bg-gray-900 border-b border-white/10 z-50">
            <button onClick={() => setMobileTab('map')} className={`flex-1 py-3 text-[10px] font-bold uppercase ${mobileTab === 'map' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Mapa</button>
            <button onClick={() => setMobileTab('team')} className={`flex-1 py-3 text-[10px] font-bold uppercase ${mobileTab === 'team' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Equipo ({teamMembers.length})</button>
            <button onClick={() => setMobileTab('history')} className={`flex-1 py-3 text-[10px] font-bold uppercase ${mobileTab === 'history' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Log</button>
         </div>

         <div className="flex-1 relative">
            {mobileTab === 'map' && (
              <>
                <MapDisplay userLocation={effectiveLocation} teamMembers={teamMembers} accuracy={0} isManualMode={isManualMode} onMapClick={(lat, lng) => { setManualLocation({lat, lng}); setIsManualMode(false); }} />
                <div className="absolute top-4 left-4 z-[2000] bg-black/80 backdrop-blur px-3 py-1 border border-orange-500/30 rounded flex items-center gap-3">
                    <span className="text-xs font-bold text-orange-500 font-mono">{activeChannel.name}</span>
                    <button onClick={fetchAllData} className="text-gray-500 hover:text-white"><RefreshCw size={12} /></button>
                </div>
              </>
            )}
            {mobileTab === 'team' && <div className="h-full bg-gray-950"><TeamList members={teamMembers} /></div>}
            {mobileTab === 'history' && <div className="h-full bg-gray-950"><HistoryPanel history={radioHistory} activeChannel={activeChannel} /></div>}
         </div>

         {/* Paneles laterales fijos en Escritorio */}
         <div className="hidden lg:flex flex-col absolute bottom-6 right-6 w-80 bg-black/90 backdrop-blur rounded border border-white/10 shadow-2xl h-[450px] overflow-hidden z-[500]">
            <div className="flex border-b border-white/10 bg-white/5">
              <button onClick={() => setMobileTab('team')} className={`flex-1 py-3 text-[10px] font-bold uppercase ${mobileTab !== 'history' ? 'text-orange-500' : 'text-gray-500'}`}>Unidades</button>
              <button onClick={() => setMobileTab('history')} className={`flex-1 py-3 text-[10px] font-bold uppercase ${mobileTab === 'history' ? 'text-orange-500' : 'text-gray-500'}`}>Log Audio</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {mobileTab !== 'history' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}
            </div>
         </div>
      </div>

      {/* CONTROL DE RADIO (Derecha) */}
      <div className="flex-none md:w-[400px] bg-gray-950 z-20 border-t md:border-t-0 md:border-l border-white/10">
        <RadioControl 
           connectionState={connectionState} isTalking={isTalking} activeChannelName={activeChannel.name}
           onTalkStart={() => { if (radioRef.current) { setIsTalking(true); radioRef.current.startTransmission(); } }} 
           onTalkEnd={() => { if (radioRef.current) { radioRef.current.stopTransmission(); setIsTalking(false); } }} 
           lastTranscript={remoteTalker} onConnect={() => {
              setConnectionState(ConnectionState.CONNECTING);
              radioRef.current = new RadioService({
                userId: DEVICE_ID, userName, channelId: activeChannel.id,
                getUserLocation: () => userLocationRef.current,
                onAudioBuffer: () => { setAudioLevel(100); setTimeout(() => setAudioLevel(0), 100); },
                onIncomingStreamStart: (n) => setRemoteTalker(n),
                onIncomingStreamEnd: () => setRemoteTalker(null)
              });
              setConnectionState(ConnectionState.CONNECTED);
           }} 
           onDisconnect={() => { if(radioRef.current) radioRef.current.disconnect(); radioRef.current = null; setConnectionState(ConnectionState.DISCONNECTED); }} 
           onQSY={() => { if(radioRef.current) radioRef.current.disconnect(); setActiveChannel(null); }}
           audioLevel={audioLevel} onEmergencyClick={() => setShowEmergencyModal(true)}
           isManualMode={isManualMode} onToggleManual={() => setIsManualMode(!isManualMode)}
        />
      </div>
      
      <EmergencyModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} location={effectiveLocation} userName={userName} channelId={activeChannel.id} />
    </div>
  );
}

export default App;
