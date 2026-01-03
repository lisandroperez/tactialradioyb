
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
import { outbox, OutboxItemType, OutboxStatus, OutboxItem } from './services/outboxService';
import { User, ShieldCheck, List, X, Hash, Settings2, UserCog, Terminal, BookOpen, ChevronRight, Globe, AlertCircle, Home, Mic, MapPin, Activity, Send, Target, Volume2, ShieldAlert, CloudUpload, CloudOff, Printer } from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- COMPONENTES DE VISTA (LANDING) ---

const LandingView = ({ onEnter }: { onEnter: () => void }) => {
  return (
    <div className="overflow-x-hidden relative min-h-screen selection:bg-orange-500">
      <div className="scanline"></div>

      <nav className="fixed w-full z-50 bg-black/90 border-b border-white/10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-black text-white shadow-lg">R</div>
                  <span className="mono font-extrabold tracking-tighter text-sm md:text-lg uppercase">RADIO_UBICACIÓN_MÓVIL</span>
              </div>
              <div className="flex items-center gap-6">
                  <a href="manual.html" className="hidden sm:flex items-center gap-1.5 mono text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-all">
                    <BookOpen size={12} /> MANUAL
                  </a>
                  <a href="guia_rapida.html" className="hidden sm:flex items-center gap-1.5 mono text-[10px] text-orange-500 hover:underline font-bold uppercase tracking-widest transition-all">
                    <Printer size={12} /> GUÍA RÁPIDA
                  </a>
                  <button onClick={onEnter} className="mono text-[10px] md:text-xs font-bold text-orange-500 border border-orange-500/40 px-5 py-2 hover:bg-orange-600 hover:text-white transition-all uppercase">
                      ACCESO_SISTEMA &gt;
                  </button>
              </div>
          </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center hero-gradient pt-20 px-6 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto text-center z-10">
              <div className="animate__animated animate__fadeIn">
                  <span className="mono text-orange-500 text-xs font-bold tracking-[0.4em] uppercase mb-10 block opacity-90">INFRAESTRUCTURA DE RESPUESTA RÁPIDA</span>
                  <h1 className="hero-title text-7xl md:text-9xl lg:text-[150px] text-white uppercase mb-12">
                      RADIO<br/>UBICACIÓN<br/>MÓVIL
                  </h1>
                  <p className="text-white text-xl md:text-3xl max-w-3xl mx-auto mb-16 font-bold leading-tight uppercase tracking-tight opacity-90">
                      Voz y GPS cuando los datos fallan.
                  </p>
                  <div className="flex justify-center gap-4">
                      <button onClick={onEnter} className="btn-ptt px-16 py-6 rounded-sm font-black text-sm md:text-lg tracking-[0.15em] uppercase text-white shadow-2xl transition-all">
                          ENTRAR EN SERVICIO
                      </button>
                  </div>
              </div>
          </div>
      </section>

      <footer className="py-32 bg-[#0e0a07] text-center border-t border-white/5 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 relative z-10">
              <h2 className="text-5xl md:text-8xl font-black mb-12 uppercase tracking-tighter leading-none text-white">
                  La tecnología al servicio <br/>
                  <span className="text-orange-500 italic">DE LA VIDA.</span>
              </h2>
              <div className="flex flex-col items-center gap-6 mb-24">
                  <button onClick={onEnter} className="bg-white text-black px-16 py-6 font-black uppercase text-sm tracking-widest hover:bg-orange-600 hover:text-white transition-all transform hover:-translate-y-2 shadow-2xl">
                      DESPLEGAR AHORA
                  </button>
                  <div className="flex gap-8">
                    <a href="manual.html" className="text-gray-500 hover:text-white uppercase font-bold text-[10px] tracking-widest transition-all">Manual Operativo</a>
                    <a href="guia_rapida.html" className="text-gray-500 hover:text-white uppercase font-bold text-[10px] tracking-widest transition-all">Guía Rápida (Impresión)</a>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
};

// --- LOGICA PRINCIPAL (RESTO DEL CODIGO) ---

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(2)}km`;
}

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
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
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  const radioRef = useRef<RadioService | null>(null);
  const syncTimerRef = useRef<number | null>(null);
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

  const processOutbox = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const pending = await outbox.getPendingItems();
      setPendingSync(pending.length);
      if (pending.length === 0) return;

      for (const item of pending) {
        if (item.id === undefined) continue;
        await outbox.updateStatus(item.id, OutboxStatus.SENDING);
        try {
          if (item.type === OutboxItemType.SOS) {
            await supabase.from('radio_history').insert({
              sender_name: item.payload.sender_name,
              lat: item.payload.lat,
              lng: item.payload.lng,
              audio_data: '[SOS_ALERT_SMS_FIRED]',
              channel_id: item.payload.channel_id
            });
          } else {
            await supabase.from('radio_history').insert(item.payload);
          }
          await outbox.updateStatus(item.id, OutboxStatus.SENT);
        } catch (e) {
          await outbox.updateStatus(item.id, OutboxStatus.PENDING, true);
          break;
        }
      }
      await outbox.deleteSentItems();
    } catch (e) {}
  }, []);

  useEffect(() => {
    syncTimerRef.current = window.setInterval(processOutbox, 5000);
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, [processOutbox]);

  useEffect(() => {
    const handleGlobalMouseUp = () => { if (isTalking) handleTalkEnd(); };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isTalking]);

  const teamMembers = useMemo(() => {
    if (!effectiveLocation) return teamMembersRaw;
    return teamMembersRaw.map(m => ({
      ...m,
      distance: calculateDistance(effectiveLocation.lat, effectiveLocation.lng, m.lat, m.lng)
    }));
  }, [teamMembersRaw, effectiveLocation]);

  useEffect(() => {
    if (!activeChannel || !userName) return;
    const fetchData = async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const { data: members } = await supabase.from('locations').select('*').eq('channel_id', activeChannel.id).gt('last_seen', new Date(Date.now() - 3600000).toISOString()); 
      if (members) setTeamMembersRaw(members.filter(m => m.id !== DEVICE_ID));
      const { data: history } = await supabase.from('radio_history').select('*').eq('channel_id', activeChannel.id).gt('created_at', yesterday).order('created_at', { ascending: false });
      if (history) setRadioHistory(history);
    };
    fetchData();
    const channel = supabase.channel(`sync-${activeChannel.id}`)
      .on('postgres_changes', { event: '*', table: 'locations', schema: 'public', filter: `channel_id=eq.${activeChannel.id}` }, (payload: any) => {
        if (payload.new && payload.new.id !== DEVICE_ID) {
          setTeamMembersRaw(prev => {
            const index = prev.findIndex(m => m.id === payload.new.id);
            if (index === -1) return [...prev, payload.new];
            const next = [...prev]; next[index] = payload.new; return next;
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', table: 'radio_history', schema: 'public', filter: `channel_id=eq.${activeChannel.id}` }, (payload: any) => {
        setRadioHistory(prev => [payload.new, ...prev]);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChannel, userName]);

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
    }, (err) => {}, { enableHighAccuracy: true, timeout: 10000 });
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

  const handleTalkStart = () => { if (radioRef.current) { setIsTalking(true); radioRef.current.startTransmission(); } };
  const handleTalkEnd = () => { if (radioRef.current) { radioRef.current.stopTransmission(); setIsTalking(false); } };

  if (currentView === 'landing') return <LandingView onEnter={() => setCurrentView('app')} />;

  if (!userName) return (
    <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-sm space-y-6 bg-gray-950 border border-orange-500/20 p-8 rounded shadow-2xl">
        <h1 className="text-orange-500 font-black tracking-widest text-lg uppercase text-center">IDENTIFICACIÓN_RADIO</h1>
        <input autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="INDICATIVO (CALLSIGN)" className="w-full bg-black border border-gray-800 p-4 text-orange-500 outline-none text-center font-bold tracking-widest uppercase" />
        <button onClick={() => { if(tempName.trim().length >= 3) { localStorage.setItem('user_callsign', tempName.trim().toUpperCase()); setUserName(tempName.trim().toUpperCase()); }}} className="w-full bg-orange-600 text-white font-black py-4 uppercase">ENTRAR EN SERVICIO</button>
      </div>
    </div>
  );

  if (!activeChannel) return (
    <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono text-center">
       <div className="w-full max-w-md space-y-6">
          <h2 className="text-orange-500 font-bold mb-4 uppercase tracking-widest text-sm">Seleccionar Frecuencia</h2>
          <ChannelSelector onSelect={(ch) => setActiveChannel(ch)} />
          <button onClick={() => setCurrentView('landing')} className="text-gray-600 text-[10px] uppercase hover:text-white transition-colors">Salir al Inicio</button>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-black overflow-hidden relative text-white font-sans">
      <div className="absolute bottom-4 left-4 z-[2005] flex gap-2 font-mono text-[9px] font-bold uppercase">
         <div className={`px-3 py-1.5 border ${isOnline ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-500 animate-pulse'}`}>
            {isOnline ? 'Network_Live' : 'Offline_Mode'}
         </div>
         {pendingSync > 0 && <div className="px-3 py-1.5 border border-orange-500/30 text-orange-500">SYNC: {pendingSync} PKTS</div>}
      </div>
      <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
         <MapDisplay userLocation={effectiveLocation} teamMembers={teamMembers} accuracy={locationAccuracy} isManualMode={isManualMode} onMapClick={handleMapClick} />
         <div className="absolute top-4 left-4 z-[2000] bg-black/80 p-2 border border-orange-500/30 rounded">
            <span className="text-xs font-bold text-orange-500 uppercase font-mono">{activeChannel.name}</span>
         </div>
      </div>
      <div className="flex-none md:w-[400px] h-auto md:h-full bg-gray-950 z-20">
        <RadioControl connectionState={connectionState} isTalking={isTalking} activeChannelName={activeChannel.name} onTalkStart={handleTalkStart} onTalkEnd={handleTalkEnd} lastTranscript={remoteTalker} onConnect={handleConnect} onDisconnect={handleDisconnect} onQSY={() => { handleDisconnect(); setActiveChannel(null); }} audioLevel={audioLevel} onEmergencyClick={() => setShowEmergencyModal(true)} isManualMode={isManualMode} onToggleManual={() => setIsManualMode(!isManualMode)} />
      </div>
      <EmergencyModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} location={effectiveLocation} userName={userName} channelId={activeChannel.id} />
    </div>
  );
}

export default App;
