
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
import { User, ShieldCheck, List, X, Hash, Settings2, UserCog, Terminal, BookOpen, ChevronRight, Globe, AlertCircle, Home } from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- COMPONENTES DE VISTA (LANDING Y MANUAL) ---

const LandingView = ({ onEnter }: { onEnter: () => void }) => {
  return (
    <div className="overflow-x-hidden relative min-h-screen">
      <div className="scanline"></div>

      {/* Navegación */}
      <nav className="fixed w-full z-50 bg-black/90 border-b border-white/10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-black text-white shadow-lg">R</div>
                  <span className="mono font-extrabold tracking-tighter text-sm md:text-lg">RADIO_UBICACIÓN_MÓVIL</span>
              </div>
              <button onClick={onEnter} className="mono text-[10px] md:text-xs font-bold text-orange-500 border border-orange-500/40 px-5 py-2 hover:bg-orange-600 hover:text-white transition-all">
                  ACCESO_SISTEMA >
              </button>
          </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient pt-20 px-6">
          <div className="max-w-6xl mx-auto text-center z-10">
              <div className="animate__animated animate__fadeIn">
                  <span className="mono text-orange-500 text-xs font-bold tracking-[0.4em] uppercase mb-6 block">INFRAESTRUCTURA DE RESPUESTA RÁPIDA</span>
                  <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.85] uppercase">
                      RADIO<br/>UBICACIÓN<br/>MÓVIL
                  </h1>
                  <p className="text-gray-300 text-xl md:text-3xl max-w-3xl mx-auto mb-12 font-bold leading-tight uppercase tracking-tight">
                      Voz y GPS cuando los datos fallan.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                      <button onClick={onEnter} className="btn-ptt px-16 py-6 rounded-sm font-black text-xl tracking-widest uppercase flex items-center gap-3 text-white">
                          Entrar en Servicio
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* EL PROBLEMA REAL */}
      <section className="py-24 bg-black border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="p-8 border-l-2 border-orange-600 bg-white/5">
                      <h4 className="mono text-orange-500 font-bold mb-3 uppercase text-sm">Handys con interferencia</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">Sustituimos el ruido analógico por audio digital cristalino optimizado para voz táctica.</p>
                  </div>
                  <div className="p-8 border-l-2 border-orange-600 bg-white/5">
                      <h4 className="mono text-orange-500 font-bold mb-3 uppercase text-sm">Zonas sin datos</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">Cuando el 4G/5G desaparece, nuestro protocolo SMS 2G mantiene a las unidades conectadas.</p>
                  </div>
                  <div className="p-8 border-l-2 border-orange-600 bg-white/5">
                      <h4 className="mono text-orange-500 font-bold mb-3 uppercase text-sm">Ruido que impide oír</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">Visualización de niveles de audio y registro histórico para no perder ningún mensaje crítico.</p>
                  </div>
                  <div className="p-8 border-l-2 border-orange-600 bg-white/5">
                      <h4 className="mono text-orange-500 font-bold mb-3 uppercase text-sm">Falta de registro</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">Cada transmisión queda guardada con su coordenada exacta para auditorías post-incidente.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* LA SOLUCIÓN */}
      <section id="solucion" className="py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                  <span className="mono text-orange-500 text-xs font-bold tracking-widest uppercase">LA SOLUCIÓN</span>
                  <h2 className="text-4xl md:text-5xl font-black mt-2 tracking-tight uppercase">Equipamiento Digital de Vanguardia</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  
                  <div className="feature-card p-10 rounded group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase">Radio PTT Profesional</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Audio nítido optimizado para voz. Comunicación simplex que emula un Handy pero con la claridad del entorno digital.</p>
                  </div>

                  <div className="feature-card p-10 rounded group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase">GPS en Tiempo Real</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Visualización cartográfica de todas las unidades activas. Cálculo de distancia y telemetría de precisión para logística.</p>
                  </div>

                  <div className="feature-card p-10 rounded group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase">Protocolo SMS 2G</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Exclusivo sistema de alertas vía SMS cuando fallan los datos móviles. Envío de coordenadas críticas bajo cualquier señal.</p>
                  </div>

                  <div className="feature-card p-10 rounded group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M12 7v5l3 3"/></svg>
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase">Log de Auditoría</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Historial completo de transmisiones con audio descargable. Fundamental para el análisis post-incidente y legal.</p>
                  </div>

                  <div className="feature-card p-10 rounded group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase">Canales por Equipo</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Cifrado de canales privados para evitar filtraciones. Cada equipo opera en su propia frecuencia segura.</p>
                  </div>

                  <div className="feature-card p-10 rounded group">
                      <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded flex items-center justify-center mb-8 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                      </div>
                      <h3 className="mono text-xl font-bold mb-4 uppercase">Modo Táctico Fijo</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">Permite establecer coordenadas manuales exactas para Puestos de Comando o unidades estáticas sin depender del GPS.</p>
                  </div>

              </div>
          </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 bg-black text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 relative z-10">
              <h2 className="text-5xl font-black mb-10 tracking-tighter uppercase leading-none">
                  La tecnología al servicio <br/>
                  <span className="text-orange-500 text-6xl">de la vida.</span>
              </h2>
              <p className="text-gray-500 mb-12 italic leading-relaxed text-sm">"Esta aplicación es gratuita para todas las entidades oficiales y grupos de respuesta. No buscamos lucro, buscamos que ningún rescatista se quede sin comunicación."</p>
              
              <button onClick={onEnter} className="inline-block bg-white text-black px-12 py-5 rounded-sm font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all transform hover:scale-105 shadow-2xl">
                  DESPLEGAR HERRAMIENTA AHORA
              </button>

              <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center font-black text-white text-[10px]">R</div>
                      <span className="mono text-[10px] text-gray-600 uppercase">RADIO_UBICACION_MOVIL // v3.0</span>
                  </div>
                  <p className="mono text-[9px] text-gray-600 uppercase tracking-widest">Código de despliegue abierto para emergencias</p>
              </div>
          </div>
          
          {/* Radar effect deco */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] border-t border-orange-500/5 rounded-[100%] pointer-events-none"></div>
      </footer>
    </div>
  );
};

const ManualView = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="min-h-screen bg-[#0e0a07] text-white p-6 md:p-16 font-mono relative overflow-y-auto">
      <div className="fixed top-6 right-6 flex gap-4 z-[100]">
        <button onClick={() => window.print()} className="bg-white text-black px-4 py-2 font-bold text-[10px] uppercase shadow-lg">PDF</button>
        <button onClick={onClose} className="bg-orange-600 text-white px-4 py-2 font-bold text-[10px] uppercase shadow-lg">CERRAR</button>
      </div>

      <header className="mb-20 max-w-5xl mx-auto animate__animated animate__fadeInDown">
        <div className="w-10 h-1 bg-orange-500 mb-4"></div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-10">MANUAL<br/>OPERATIVO</h1>
        <div className="border-t border-white/10 pt-6">
          <p className="font-bold text-sm uppercase">PROTOCOL_v3.0_STABLE</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-16 animate__animated animate__fadeIn">
        <div className="border-l-4 border-orange-500 bg-white/5 p-8">
          <h2 className="text-xl font-bold mb-4 uppercase text-orange-500">01_IDENTIFICACIÓN</h2>
          <p className="text-gray-400 text-sm">Configure su indicativo (Callsign). Use nombres de unidad claros como "MOVIL-1" o "BASE-CENTRAL". Esto es vital para que la central sepa quién transmite.</p>
        </div>
        <div className="border-l-4 border-orange-500 bg-white/5 p-8">
          <h2 className="text-xl font-bold mb-4 uppercase text-orange-500">02_COMUNICACIÓN PTT</h2>
          <p className="text-gray-400 text-sm">Mantenga presionado el botón central para transmitir. Suelte para recibir. El sistema registra audio y ubicación en cada pulsación para fines de auditoría.</p>
        </div>
        <div className="border-l-4 border-orange-500 bg-white/5 p-8">
          <h2 className="text-xl font-bold mb-4 uppercase text-orange-500">03_MODO TÁCTICO</h2>
          <p className="text-gray-400 text-sm">Si el GPS falla o su unidad es fija, use el modo manual (icono de mira) para fijar su posición en el mapa. Esto permite a la central coordinar recursos con precisión milimétrica.</p>
        </div>
      </main>
    </div>
  );
};

// --- LOGICA DE APP ---

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(2)}km`;
}

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'manual' | 'app'>('landing');
  
  const [userName, setUserName] = useState<string>(localStorage.getItem('user_callsign') || '');
  const [isNameSet, setIsNameSet] = useState<boolean>(!!localStorage.getItem('user_callsign'));
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [tempName, setTempName] = useState('');
  
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  
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
  const effectiveLocation = manualLocation || userLocation;
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    userLocationRef.current = effectiveLocation;
  }, [effectiveLocation]);

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
    if (!activeChannel || !isNameSet) return;

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
  }, [activeChannel, isNameSet]);

  useEffect(() => {
    if (!activeChannel || !isNameSet || !navigator.geolocation || manualLocation) return;
    
    const watchId = navigator.geolocation.watchPosition(async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setLocationAccuracy(accuracy);
      await supabase.from('locations').upsert({
        id: DEVICE_ID, name: userName, lat: latitude, lng: longitude, accuracy: Math.round(accuracy),
        role: accuracy > 200 ? 'Unidad PC' : 'Unidad Móvil', status: isTalking ? 'talking' : 'online', 
        last_seen: new Date().toISOString(), channel_id: activeChannel.id
      });
    }, (err) => console.log(err), { enableHighAccuracy: true, timeout: 10000 });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTalking, activeChannel, isNameSet, userName, manualLocation]);

  const handleMapClick = async (lat: number, lng: number) => {
    if (!isManualMode || !activeChannel) return;
    setIsManualMode(false);
    setManualLocation({ lat, lng });
    setLocationAccuracy(0);
    await supabase.from('locations').upsert({
      id: DEVICE_ID, name: userName, lat: lat, lng: lng, accuracy: 0,
      role: 'Unidad Fija / Estacionaria', status: isTalking ? 'talking' : 'online', 
      last_seen: new Date().toISOString(), channel_id: activeChannel.id
    });
  };

  const handleConnect = useCallback(() => {
    if (!activeChannel) return;
    setConnectionState(ConnectionState.CONNECTING);
    try {
      radioRef.current = new RadioService({
        userId: DEVICE_ID, userName: userName, channelId: activeChannel.id,
        getUserLocation: () => userLocationRef.current,
        onAudioBuffer: (buffer, senderId) => { setAudioLevel(prev => Math.min(100, prev + 25)); setTimeout(() => setAudioLevel(0), 100); },
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

  // --- RENDERING LOGIC ---

  if (currentView === 'manual') {
    return <ManualView onClose={() => setCurrentView('landing')} />;
  }

  if (currentView === 'landing') {
    return <LandingView onEnter={() => setCurrentView('app')} />;
  }

  if (!isNameSet) {
    return (
      <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono">
        <div className="w-full max-w-sm space-y-6 bg-gray-950 border border-orange-500/20 p-8 rounded shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/30">
              <User className="text-orange-500" size={32} />
            </div>
            <h1 className="text-orange-500 font-black tracking-widest text-lg uppercase">IDENTIFICACIÓN_RADIO</h1>
          </div>
          <input 
            autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tempName.trim().length >= 3 && (localStorage.setItem('user_callsign', tempName.trim().toUpperCase()), setUserName(tempName.trim().toUpperCase()), setIsNameSet(true))} 
            placeholder="INDICATIVO (CALLSIGN)"
            className="w-full bg-black border border-gray-800 p-4 text-orange-500 focus:border-orange-500 outline-none text-center font-bold tracking-widest uppercase"
          />
          <button 
            onClick={() => { if(tempName.trim().length >= 3) { localStorage.setItem('user_callsign', tempName.trim().toUpperCase()); setUserName(tempName.trim().toUpperCase()); setIsNameSet(true); }}}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <ShieldCheck size={20} /> ENTRAR EN SERVICIO
          </button>
          <button onClick={() => setCurrentView('landing')} className="w-full text-gray-500 text-[10px] uppercase font-bold hover:text-white transition-colors">Volver a inicio</button>
        </div>
      </div>
    );
  }

  if (!activeChannel) {
    return (
      <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono text-center">
         <div className="w-full max-w-md space-y-6 animate__animated animate__fadeIn">
            <div className="flex flex-col items-center gap-2 mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Operando como:</span>
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 border border-white/10 rounded-full">
                <span className="text-orange-500 font-bold tracking-widest uppercase">{userName}</span>
                <button onClick={() => setIsNameSet(false)} className="p-1.5 hover:bg-orange-500 hover:text-white text-gray-400 rounded-full transition-all" title="Cambiar Nombre">
                  <UserCog size={16} />
                </button>
              </div>
            </div>
            <h2 className="text-orange-500 font-bold mb-4 uppercase tracking-widest text-sm">Seleccionar Frecuencia</h2>
            <ChannelSelector onSelect={(ch) => setActiveChannel(ch)} />
            <button 
              onClick={() => { localStorage.removeItem('user_callsign'); setIsNameSet(false); setCurrentView('landing'); }} 
              className="text-gray-600 text-[10px] uppercase hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <Home size={12} /> Salir al Inicio
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-black overflow-hidden relative text-white font-sans">
      {isManualMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[3000] bg-orange-600 text-white font-black px-6 py-3 rounded-full shadow-2xl animate-pulse flex items-center gap-3 border-2 border-white uppercase text-xs tracking-widest">
           <Settings2 size={16} /> Toque el mapa para fijar su posición
        </div>
      )}

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
         {showMobileOverlay && (
           <div className="md:hidden absolute inset-0 z-[2001] bg-gray-950 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black">
                <div className="flex gap-6">
                  <button onClick={() => setActiveTab('team')} className={`font-bold uppercase text-[10px] ${activeTab === 'team' ? 'text-orange-500' : 'text-gray-500'}`}>Unidades</button>
                  <button onClick={() => setActiveTab('history')} className={`font-bold uppercase text-[10px] ${activeTab === 'history' ? 'text-orange-500' : 'text-gray-500'}`}>Historial</button>
                </div>
                <button onClick={() => setShowMobileOverlay(false)} className="text-gray-500"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-hidden">{activeTab === 'team' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}</div>
           </div>
         )}
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
           <button 
             onClick={() => { handleDisconnect(); setActiveChannel(null); setCurrentView('landing'); }} 
             className="w-full text-center text-[8px] text-gray-600 font-bold uppercase hover:text-orange-500 transition-colors py-2"
           >
             Cerrar Estación y Volver al Inicio
           </button>
        </div>
      </div>
      <EmergencyModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} location={effectiveLocation} />
    </div>
  );
}

export default App;
