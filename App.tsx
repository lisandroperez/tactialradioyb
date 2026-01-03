
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
import { BookOpen, Printer, Home, Radio as RadioIcon, CloudUpload, CloudOff, ChevronLeft, MapPin, Activity, AlertTriangle, Send, Users, Clock, Hash, Volume2, Play, Download } from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- VISTA DEL MANUAL TÁCTICO (Convertido de manual.html) ---
const ManualView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="bg-[#0e0a07] min-h-screen p-6 md:p-12 text-gray-200 selection:bg-orange-500 font-sans">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all border border-white/10 flex items-center gap-2">
           <ChevronLeft size={14} /> VOLVER_AL_INICIO
        </button>

        <header className="mb-16 animate__animated animate__fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-1 bg-orange-500"></div>
            <p className="mono text-orange-500 font-bold tracking-[0.4em] text-[9px] uppercase">OPERATIONAL_MANUAL_v3.2</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 uppercase text-white">GUÍA DE<br />USUARIO</h1>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest border-t border-white/10 pt-4">Protocolo de Comunicaciones Resilientes para Brigadas</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 bg-orange-500 text-white flex items-center justify-center font-black text-sm">01</span>
              <h2 className="text-2xl font-black uppercase text-white">Identificación</h2>
            </div>
            <div className="bg-white/5 border border-white/10 p-6">
              <p className="text-xs text-gray-400 mb-4">Al iniciar, ingrese su <span className="text-white font-bold">Callsign (Indicativo)</span>. Este nombre será su identificador único en el mapa y en el registro de audio.</p>
              <div className="bg-black/40 p-3 border border-white/5 font-mono text-[10px] text-orange-500">
                RECOMENDACIÓN: Use nombres cortos y claros.<br />Ej: "MOVIL-1", "BASE-TUC", "BRIGADA-B".
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 bg-orange-500 text-white flex items-center justify-center font-black text-sm">02</span>
              <h2 className="text-2xl font-black uppercase text-white">Frecuencias</h2>
            </div>
            <div className="bg-white/5 border border-white/10 p-6">
              <p className="text-xs text-gray-400 mb-4">Seleccione su canal de operación en el <span className="text-white font-bold">Selector de Frecuencias</span>.</p>
              <ul className="text-[10px] space-y-2 font-mono uppercase">
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Canales Públicos: Acceso libre.</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Canales Seguros: Requieren llave (PIN).</li>
              </ul>
            </div>
          </section>
        </div>

        <section className="mb-16 space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-orange-500 text-white flex items-center justify-center font-black text-sm text-3xl">03</span>
            <h2 className="text-3xl font-black uppercase text-white">Comunicaciones de Voz (PTT)</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 border-l-4 border-l-orange-500">
              <h4 className="font-black text-orange-500 uppercase text-[11px] mb-3">TX: Transmitir</h4>
              <p className="text-[11px] text-gray-400">Presione y <span className="text-white font-bold">mantenga</span> el botón central. Espere el sonido de entrada y hable a 15cm del micrófono.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 border-l-4 border-l-emerald-500">
              <h4 className="font-black text-emerald-500 uppercase text-[11px] mb-3">RX: Recibir</h4>
              <p className="text-[11px] text-gray-400">El audio se reproduce en tiempo real. Un aro naranja en pantalla indica quién está modulando.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 border-l-4 border-l-gray-500">
              <h4 className="font-black text-gray-400 uppercase text-[11px] mb-3">Simplex</h4>
              <p className="text-[11px] text-gray-500">El sistema es de una vía. No puede transmitir mientras otra unidad está hablando.</p>
            </div>
          </div>
        </section>

        <section className="mb-16 space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-orange-500 text-white flex items-center justify-center font-black text-sm text-3xl">04</span>
            <h2 className="text-3xl font-black uppercase text-white">Geolocalización</h2>
          </div>
          <div className="bg-white/5 border border-white/10 p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-black text-white uppercase text-sm mb-2">GPS Automático</h4>
                <p className="text-xs text-gray-400">Su ubicación se actualiza cada vez que modula o detecta movimiento. El radio de precisión (círculo) indica la confiabilidad de la señal.</p>
              </div>
              <div className="bg-orange-500/5 p-4 border border-orange-500/20">
                <h4 className="font-black text-orange-500 uppercase text-xs mb-2">Modo Táctico Fijo (Target)</h4>
                <p className="text-[11px] text-gray-300">Si establece un Puesto de Comando o Base, use el icono de <span className="font-bold">MIRA</span> para tocar el mapa y fijar su posición manualmente.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- VISTA DE GUÍA RÁPIDA (B/W - Convertido de guia_rapida.html) ---
const GuideView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="bg-white min-h-screen p-8 text-black font-mono">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="no-print fixed bottom-6 right-6 bg-black text-white px-6 py-2 uppercase font-bold text-xs">VOLVER</button>
        
        <div className="border-4 border-black p-4 mb-8 flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold uppercase">GUÍA RÁPIDA DE OPERACIÓN</h1>
                <p className="text-sm font-bold">SISTEMA: RADIO UBICACIÓN MÓVIL (v3.2)</p>
            </div>
            <div className="text-right font-bold text-xs">
                DOCUMENTO: OP-01-B/W
            </div>
        </div>

        <div className="divide-y divide-black">
          {[
            { id: "01", title: "IDENTIFICACIÓN (CALLSIGN)", desc: "Ingrese su indicativo de radio. Es el nombre que verán los demás en el mapa." },
            { id: "02", title: "SELECCIÓN DE CANAL", desc: "Toque el canal deseado para entrar. Los canales con candado requieren PIN." },
            { id: "03", title: "TRANSMISIÓN (PTT)", desc: "Mantenga presionado el círculo central para hablar. Suelte para escuchar." },
            { id: "04", title: "GPS FIJO (BASE / PC)", desc: "Toque el icono de la MIRA, luego toque el mapa para fijar su posición exacta." },
            { id: "05", title: "ALERTA SOS (PRIORIDAD)", desc: "Presione el triángulo rojo en emergencias. Seleccione el incidente y envíe el SMS." },
          ].map(item => (
            <div key={item.id} className="py-6 flex gap-8">
              <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-bold text-xl flex-shrink-0">{item.id}</div>
              <div>
                <h3 className="font-bold text-lg uppercase">{item.title}</h3>
                <p className="text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t-4 border-black text-center font-bold text-sm uppercase">
            EN CASO DE FALLA TOTAL: UTILICE RADIO VHF/UHF
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE LANDING CON NAVEGACIÓN SUPERIOR ---
const LandingView = ({ onEnter, onManual, onGuide }: { onEnter: () => void; onManual: () => void; onGuide: () => void }) => {
  return (
    <div className="overflow-x-hidden relative min-h-screen selection:bg-orange-500 bg-[#0a0a0a]">
      <div className="scanline"></div>

      {/* Navegación Superior Derecha */}
      <nav className="fixed w-full top-0 left-0 z-[100] bg-black/80 border-b border-white/5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-black text-white shadow-lg">R</div>
                  <span className="mono font-extrabold tracking-tighter text-sm md:text-lg uppercase text-white">RADIO_UBICACIÓN</span>
              </div>
              <div className="flex items-center gap-4 md:gap-8">
                  <button 
                    onClick={onManual}
                    className="flex items-center gap-1.5 mono text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-widest transition-all"
                  >
                    <BookOpen size={14} /> <span className="hidden sm:inline">MANUAL</span>
                  </button>
                  <button 
                    onClick={onGuide}
                    className="flex items-center gap-1.5 mono text-[10px] text-orange-500 hover:underline font-bold uppercase tracking-widest transition-all"
                  >
                    <Printer size={14} /> <span className="hidden sm:inline">GUÍA_IMPRESIÓN</span>
                  </button>
                  <button 
                    onClick={onEnter} 
                    className="mono text-[10px] font-bold text-white bg-orange-600 px-4 py-2 hover:bg-orange-500 transition-all uppercase shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                  >
                      ACCESO_SISTEMA &gt;
                  </button>
              </div>
          </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center hero-gradient pt-20 px-6">
          <div className="max-w-6xl mx-auto text-center z-10">
              <div className="animate__animated animate__fadeIn">
                  <span className="mono text-orange-500 text-xs font-bold tracking-[0.4em] uppercase mb-10 block opacity-90">INFRAESTRUCTURA TÁCTICA DE CAMPO</span>
                  <h1 className="hero-title text-7xl md:text-9xl lg:text-[150px] text-white uppercase mb-12">
                      RADIO<br/>UBICACIÓN<br/>MÓVIL
                  </h1>
                  <p className="text-white text-xl md:text-3xl max-w-3xl mx-auto mb-16 font-bold leading-tight uppercase tracking-tight opacity-90">
                      Voz simplex y GPS para brigadas de emergencia.
                  </p>
                  <div className="flex justify-center gap-4">
                      <button onClick={onEnter} className="btn-ptt px-16 py-6 rounded-sm font-black text-sm md:text-lg tracking-[0.15em] uppercase text-white shadow-2xl transition-all hover:scale-105 active:scale-95">
                          DESPLEGAR UNIDAD
                      </button>
                  </div>
              </div>
          </div>
      </section>

      <footer className="py-20 bg-black/50 text-center border-t border-white/5 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 relative z-10">
              <div className="flex justify-center gap-8 mb-8 opacity-50">
                <button onClick={onManual} className="mono text-[10px] text-white uppercase hover:text-orange-500 transition-colors">Documentación Técnica</button>
                <button onClick={onGuide} className="mono text-[10px] text-white uppercase hover:text-orange-500 transition-colors">Protocolo Impreso</button>
              </div>
              <p className="text-[10px] text-gray-600 uppercase mono tracking-widest">Versión 3.2.0 STABLE // Resiliencia de Campo Activada</p>
          </div>
      </footer>
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
        
        try {
          await outbox.updateStatus(item.id, OutboxStatus.SENDING);
          
          if (item.type === OutboxItemType.SOS) {
            await supabase.from('radio_history').insert({
              sender_name: item.payload.sender_name,
              lat: item.payload.lat,
              lng: item.payload.lng,
              audio_data: '[SOS_ALERT_SMS_FIRED]',
              channel_id: item.payload.channel_id
            });
          } else if (item.type === OutboxItemType.VOICE) {
            await supabase.from('radio_history').insert(item.payload);
          }

          await outbox.updateStatus(item.id, OutboxStatus.SENT);
        } catch (e) {
          await outbox.updateStatus(item.id, OutboxStatus.PENDING, true);
          break; 
        }
      }

      await outbox.deleteSentItems();
      const finalPending = await outbox.getPendingItems();
      setPendingSync(finalPending.length);
    } catch (e) {
      console.error("SYNC_ERROR", e);
    }
  }, []);

  useEffect(() => {
    syncTimerRef.current = window.setInterval(processOutbox, 5000);
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, [processOutbox]);

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
        role: 'Unidad Fija / PC', status: isTalking ? 'talking' : 'online', 
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

  const handleTalkStart = () => { if (radioRef.current) { setIsTalking(true); radioRef.current.startTransmission(); } };
  const handleTalkEnd = () => { if (radioRef.current) { radioRef.current.stopTransmission(); setIsTalking(false); } };

  // --- RENDERING ROUTER ---
  if (currentView === 'manual') return <ManualView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'guia') return <GuideView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'landing') return <LandingView onEnter={() => setCurrentView('app')} onManual={() => setCurrentView('manual')} onGuide={() => setCurrentView('guia')} />;

  if (!userName) return (
    <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono">
      <div className="w-full max-w-sm space-y-6 bg-gray-950 border border-orange-500/20 p-8 rounded shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
        <h1 className="text-orange-500 font-black tracking-widest text-lg uppercase text-center flex items-center justify-center gap-2">
           <RadioIcon size={20} /> IDENTIFICACIÓN
        </h1>
        <input 
          autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && tempName.trim().length >= 3 && (localStorage.setItem('user_callsign', tempName.trim().toUpperCase()), setUserName(tempName.trim().toUpperCase()))} 
          placeholder="INDICATIVO (CALLSIGN)"
          className="w-full bg-black border border-gray-800 p-4 text-orange-500 focus:border-orange-500 outline-none text-center font-bold tracking-widest uppercase transition-colors"
        />
        <button onClick={() => { if(tempName.trim().length >= 3) { localStorage.setItem('user_callsign', tempName.trim().toUpperCase()); setUserName(tempName.trim().toUpperCase()); }}} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 uppercase tracking-widest transition-all shadow-lg active:scale-95">
          ENTRAR EN SERVICIO
        </button>
      </div>
    </div>
  );

  if (!activeChannel) return (
    <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono text-center">
       <div className="w-full max-w-md space-y-6">
          <h2 className="text-orange-500 font-bold mb-4 uppercase tracking-widest text-sm flex items-center justify-center gap-2">
            <RadioIcon size={16} /> Seleccionar Frecuencia
          </h2>
          <ChannelSelector onSelect={(ch) => setActiveChannel(ch)} />
          <button onClick={() => setCurrentView('landing')} className="text-gray-600 text-[10px] uppercase hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto mt-6">
            <Home size={12} /> Salir al Inicio
          </button>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-black overflow-hidden relative text-white font-sans">
      <div className="scanline"></div>
      
      <div className="absolute bottom-4 left-4 z-[2005] flex gap-2">
         <div className={`px-3 py-1.5 rounded-sm flex items-center gap-2 border font-mono text-[9px] font-bold uppercase tracking-widest ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'}`}>
            {isOnline ? <CloudUpload size={12} /> : <CloudOff size={12} />}
            {isOnline ? 'Network_Live' : 'No_Signal_Mode'}
         </div>
         {pendingSync > 0 && <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-500 font-mono text-[9px] font-bold uppercase tracking-widest animate-pulse">SYNC: {pendingSync} PKTS</div>}
      </div>

      <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
         <MapDisplay userLocation={effectiveLocation} teamMembers={teamMembers} accuracy={locationAccuracy} isManualMode={isManualMode} onMapClick={handleMapClick} />
         
         <div className="absolute top-4 left-4 z-[2000] bg-black/80 backdrop-blur px-3 py-1 border border-orange-500/30 rounded shadow-2xl">
            <span className="text-[9px] text-orange-500/50 block font-mono">RADIO_CHANNEL</span>
            <span className="text-xs font-bold text-orange-500 font-mono uppercase tracking-widest leading-none">{activeChannel.name}</span>
         </div>

         {/* Panel Lateral Flotante (Miembros) */}
         <div className="hidden lg:flex flex-col absolute bottom-6 right-6 w-80 bg-black/90 backdrop-blur rounded border border-white/10 shadow-2xl h-[400px] overflow-hidden z-[500]">
            <div className="flex border-b border-white/10 bg-white/5">
              <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'team' ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-gray-300'}`}>Unidades</button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-gray-300'}`}>Log Audio</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'team' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}
            </div>
         </div>
      </div>
      
      <div className="flex-none md:w-[400px] h-auto md:h-full bg-gray-950 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <RadioControl 
           connectionState={connectionState} isTalking={isTalking} activeChannelName={activeChannel.name}
           onTalkStart={handleTalkStart} onTalkEnd={handleTalkEnd} lastTranscript={remoteTalker} 
           onConnect={handleConnect} onDisconnect={handleDisconnect} onQSY={() => { handleDisconnect(); setActiveChannel(null); }}
           audioLevel={audioLevel} onEmergencyClick={() => setShowEmergencyModal(true)}
           isManualMode={isManualMode} onToggleManual={() => setIsManualMode(!isManualMode)}
        />
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
