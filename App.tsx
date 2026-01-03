
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
                    <Printer size={12} /> IMPRIMIR
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

      <section className="py-24 bg-black border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 mb-12">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-orange-500 animate-pulse"></div>
                <span className="text-orange-500 text-[11px] font-black tracking-[0.4em] uppercase">SITUACIÓN_DE_CAMPO</span>
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-[0.9]">EL DESAFÍO<br/><span className="text-gray-600">DEL TERRENO</span></h2>
        </div>

        <div className="problem-carousel no-scrollbar px-6">
            {[
              { id: '01', title: 'Handys con interferencia', desc: 'Eliminamos el ruido analógico. Audio digital cristalino optimizado para entornos tácticos e incendios.' },
              { id: '02', title: 'Zonas muertas sin datos', desc: 'Cuando el 5G falla, nuestro motor conmuta a ráfagas de datos mínimas para enviar coordenadas SOS críticas.' },
              { id: '03', title: 'Caos y ruido ambiente', desc: 'Monitor de audio visual integrado. Registro de cada transmisión para evitar pérdida de protocolos.' },
              { id: '04', title: 'Análisis de incidente', desc: 'Cada voz, cada movimiento. Todo el despliegue queda logueado para auditorías críticas post-misión.' }
            ].map(p => (
              <div key={p.id} className="problem-slide group">
                <div className="bg-[#0a0a0a] border border-white/5 p-10 h-full relative overflow-hidden feature-card rounded-sm">
                  <div className="absolute top-2 right-2 font-black text-6xl text-white/5 group-hover:text-orange-500/10 transition-colors">{p.id}</div>
                  <h4 className="text-white font-black mb-4 uppercase text-2xl leading-[0.85] group-hover:text-orange-500 transition-colors">{p.title}</h4>
                  <p className="text-gray-500 text-sm leading-snug">{p.desc}</p>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section id="solucion" className="py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-24">
                  <span className="mono text-orange-500 text-[11px] font-black tracking-[0.4em] uppercase">EQUIPAMIENTO DIGITAL</span>
                  <h2 className="text-5xl md:text-6xl font-black mt-2 tracking-tighter uppercase leading-none text-white">Tecnología de<br/>Misión Crítica</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="feature-card p-10 rounded-sm group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <Mic size={28} />
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase text-white">Radio PTT Profesional</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Audio nítido optimizado para voice. Comunicación simplex que emula un Handy pero con la claridad del entorno digital.</p>
                  </div>
                  <div className="feature-card p-10 rounded-sm group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <MapPin size={28} />
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase text-white">GPS en Tiempo Real</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Visualización cartográfica de todas las unidades activas. Cálculo de distancia y telemetría de precisión para logística.</p>
                  </div>
                  <div className="feature-card p-10 rounded-sm group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <Send size={28} />
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase text-white">Protocolo SMS 2G</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Exclusivo sistema de alertas vía SMS cuando fallan los datos móviles. Envío de coordenadas críticas bajo cualquier señal.</p>
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

// --- LOGICA PRINCIPAL ---

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

  // Monitor de Conectividad
  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  // Motor de Sincronización Táctica (Store & Forward)
  const processOutbox = useCallback(async () => {
    if (!navigator.onLine) return;

    const pending = await outbox.getPendingItems();
    setPendingSync(pending.length);

    if (pending.length === 0) return;

    for (const item of pending) {
      if (item.id === undefined) continue;
      
      try {
        await outbox.updateStatus(item.id, OutboxStatus.SENDING);
        
        if (item.type === OutboxItemType.SOS) {
          const { error } = await supabase.from('radio_history').insert({
            sender_name: item.payload.sender_name,
            lat: item.payload.lat,
            lng: item.payload.lng,
            audio_data: '[SOS_ALERT_SMS_FIRED]',
            channel_id: item.payload.channel_id
          });
          if (error) throw error;
        } else if (item.type === OutboxItemType.VOICE) {
          const { error } = await supabase.from('radio_history').insert(item.payload);
          if (error) throw error;
        }

        await outbox.updateStatus(item.id, OutboxStatus.SENT);
      } catch (e) {
        console.error("SYNC_ERROR:", e);
        await outbox.updateStatus(item.id, OutboxStatus.PENDING, true);
        break; 
      }
    }

    await outbox.deleteSentItems();
    const finalPending = await outbox.getPendingItems();
    setPendingSync(finalPending.length);
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
      setRadioHistory([]);
      setTeamMembersRaw([]);
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      
      const { data: members } = await supabase
        .from('locations')
        .select('*')
        .eq('channel_id', activeChannel.id)
        .gt('last_seen', new Date(Date.now() - 3600000).toISOString()); 
      if (members) setTeamMembersRaw(members.filter(m => m.id !== DEVICE_ID));

      const { data: history } = await supabase
        .from('radio_history')
        .select('*')
        .eq('channel_id', activeChannel.id)
        .gt('created_at', yesterday)
        .order('created_at', { ascending: false });
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
      })
      .subscribe();
    
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
    }, (err) => console.log(err), { enableHighAccuracy: true, timeout: 10000 });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTalking, activeChannel, userName, manualLocation]);

  const handleMapClick = async (lat: number, lng: number) => {
    if (!isManualMode || !activeChannel) return;
    setIsManualMode(false);
    setManualLocation({ lat, lng });
    setLocationAccuracy(0);
    if (navigator.onLine) {
      await supabase.from('locations').upsert({
        id: DEVICE_ID, name: userName, lat: lat, lng: lng, accuracy: 0,
        role: 'Unidad Fija / Estacionaria', status: isTalking ? 'talking' : 'online', 
        last_seen: new Date().toISOString(), channel_id: activeChannel.id
      });
    }
  };

  const handleConnect = useCallback(() => {
    if (!activeChannel) return;
    setConnectionState(ConnectionState.CONNECTING);
    try {
      radioRef.current = new RadioService({
        userId: DEVICE_ID, userName: userName, channelId: activeChannel.id,
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

  const handleTalkStart = async () => {
    if (radioRef.current && connectionState === ConnectionState.CONNECTED) {
      setIsTalking(true);
      radioRef.current.startTransmission();
    }
  };

  const handleTalkEnd = () => {
    if (radioRef.current) {
      radioRef.current.stopTransmission();
      setIsTalking(false);
    }
  };

  if (currentView === 'landing') {
    return <LandingView onEnter={() => setCurrentView('app')} />;
  }

  if (!userName) {
    return (
      <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
        <div className="scanline"></div>
        <div className="w-full max-w-sm space-y-6 bg-gray-950 border border-orange-500/20 p-8 rounded shadow-2xl relative z-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/30">
              <User className="text-orange-500" size={32} />
            </div>
            <h1 className="text-orange-500 font-black tracking-widest text-lg uppercase">IDENTIFICACIÓN_RADIO</h1>
          </div>
          <input 
            autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tempName.trim().length >= 3 && (localStorage.setItem('user_callsign', tempName.trim().toUpperCase()), setUserName(tempName.trim().toUpperCase()))} 
            placeholder="INDICATIVO (CALLSIGN)"
            className="w-full bg-black border border-gray-800 p-4 text-orange-500 focus:border-orange-500 outline-none text-center font-bold tracking-widest uppercase"
          />
          <button 
            onClick={() => { if(tempName.trim().length >= 3) { localStorage.setItem('user_callsign', tempName.trim().toUpperCase()); setUserName(tempName.trim().toUpperCase()); }}}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg uppercase"
          >
            <ShieldCheck size={20} /> ENTRAR EN SERVICIO
          </button>
        </div>
      </div>
    );
  }

  if (!activeChannel) {
    return (
      <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono text-center relative">
         <div className="scanline"></div>
         <div className="w-full max-w-md space-y-6 animate__animated animate__fadeIn z-10">
            <h2 className="text-orange-500 font-bold mb-4 uppercase tracking-widest text-sm">Seleccionar Frecuencia</h2>
            <ChannelSelector onSelect={(ch) => setActiveChannel(ch)} />
            <button onClick={() => setCurrentView('landing')} className="text-gray-600 text-[10px] uppercase hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
              <Home size={12} /> Salir al Inicio
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-black overflow-hidden relative text-white font-sans">
      <div className="scanline"></div>
      
      {/* Indicadores de Conectividad Resiliente */}
      <div className="absolute bottom-4 left-4 z-[2005] flex gap-2">
         <div className={`px-3 py-1.5 rounded-sm flex items-center gap-2 border font-mono text-[9px] font-bold uppercase tracking-widest ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'}`}>
            {isOnline ? <CloudUpload size={12} /> : <CloudOff size={12} />}
            {isOnline ? 'Network_Live' : 'No_Signal_Mode'}
         </div>
         {pendingSync > 0 && (
           <div className="px-3 py-1.5 rounded-sm bg-orange-500/10 border border-orange-500/30 text-orange-500 font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 animate-bounce">
              <CloudUpload size={12} className="animate-pulse" />
              Sincronizando: {pendingSync} PKTS
           </div>
         )}
      </div>

      <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
         <MapDisplay userLocation={effectiveLocation} teamMembers={teamMembers} accuracy={locationAccuracy} isManualMode={isManualMode} onMapClick={handleMapClick} />
         
         <div className="absolute top-4 left-4 z-[2000] flex flex-col gap-2 pointer-events-none">
            <div className="bg-black/80 backdrop-blur px-3 py-1 border border-orange-500/30 rounded shadow-lg">
              <span className="text-[9px] text-orange-500/50 block font-mono">FRECUENCIA</span>
              <span className="text-xs font-bold text-orange-500 font-mono uppercase tracking-widest leading-none">
                {activeChannel.name}
              </span>
            </div>
         </div>

         <div className="absolute top-4 right-4 z-[2000] md:hidden">
            <button onClick={() => setShowMobileOverlay(!showMobileOverlay)} className="w-12 h-12 bg-black/80 border-2 border-white/20 rounded-full flex items-center justify-center text-white shadow-xl">
              {showMobileOverlay ? <X size={24} /> : <List size={24} />}
            </button>
         </div>

         <div className="hidden md:flex flex-col absolute bottom-6 left-6 w-80 bg-black/90 backdrop-blur rounded border border-white/10 shadow-2xl h-[400px] overflow-hidden z-[500]">
            <div className="flex border-b border-white/10 bg-white/5">
              <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'team' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}>Unidades</button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'history' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'}`}>Log Audio</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'team' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}
            </div>
         </div>
      </div>
      
      <div className="flex-none md:w-[400px] h-auto md:h-full bg-gray-950 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-white/5">
        <RadioControl 
           connectionState={connectionState} isTalking={isTalking} activeChannelName={activeChannel.name}
           onTalkStart={handleTalkStart} onTalkEnd={handleTalkEnd} lastTranscript={remoteTalker} 
           onConnect={handleConnect} onDisconnect={handleDisconnect} onQSY={() => { handleDisconnect(); setActiveChannel(null); }}
           audioLevel={audioLevel} onEmergencyClick={() => setShowEmergencyModal(true)}
           isManualMode={isManualMode} onToggleManual={() => setIsManualMode(!isManualMode)}
        />
        <div className="hidden md:block p-4 border-t border-white/5">
           <button onClick={() => { handleDisconnect(); setActiveChannel(null); setCurrentView('landing'); }} className="w-full text-center text-[8px] text-gray-600 font-bold uppercase hover:text-orange-500 transition-colors py-2">
             Cerrar Estación y Volver al Inicio
           </button>
        </div>
      </div>
      
      <EmergencyModal 
        isOpen={showEmergencyModal} 
        onClose={() => setShowEmergencyModal(false)} 
        location={effectiveLocation} 
        userName={userName}
        channelId={activeChannel.id}
      />
    </div>
  );
}

export default App;
