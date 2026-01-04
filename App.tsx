
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
import { 
  ChevronLeft, X, RefreshCw
} from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- COMPONENTE: GUÍA RÁPIDA (B/W) ---
const GuideView = ({ onBack }: { onBack: () => void }) => (
  <div className="bg-white min-h-screen p-8 text-black font-mono overflow-y-auto">
    <div className="max-w-4xl mx-auto border-4 border-black p-6">
      <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase">GUÍA RÁPIDA DE OPERACIÓN</h1>
          <p className="text-sm font-bold">SISTEMA: RADIO UBICACIÓN MÓVIL (v3.2)</p>
        </div>
        <div className="text-right font-bold text-xs">
          CONFIDENCIALIDAD: USO INTERNO<br />
          DOCUMENTO: OP-01-B/W
        </div>
      </div>
      <div className="space-y-2">
        {[
          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="square"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, title: "01. IDENTIFICACIÓN (CALLSIGN)", desc: "Ingrese su indicativo de radio. Es el nombre que verán los demás en el mapa. Sea breve y use mayúsculas.", tip: "Ejemplo: MOVIL-01, BASE-01, RESCATE-A." },
          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="square"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>, title: "02. SELECCIÓN DE CANAL", desc: "Toque el canal deseado para entrar. Los canales con candado requieren PIN.", tip: "Si no ve su canal, use el botón (+) para crear una nueva frecuencia." },
          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="square"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, title: "03. TRANSMISIÓN (PTT)", desc: "Mantenga presionado el círculo central para hablar. Suelte para escuchar.", tip: "La barra de estado dirá \"TX_TRANSMITIENDO\" durante la modulación." }
        ].map((item) => (
          <div key={item.title} className="flex gap-6 border-b border-black py-4 last:border-0">
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0">{item.icon}</div>
            <div>
              <h3 className="font-bold text-lg uppercase">{item.title}</h3>
              <p className="text-sm">{item.desc}</p>
              <p className="text-xs mt-1 font-bold italic">{item.tip}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-4 border-t-4 border-black text-center font-bold text-sm uppercase">
        <button onClick={onBack} className="no-print border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all">VOLVER</button>
      </div>
    </div>
  </div>
);

// --- COMPONENTE: MANUAL TÁCTICO ---
const ManualView = ({ onBack }: { onBack: () => void }) => (
  <div className="bg-[#0e0a07] min-h-screen p-6 md:p-12 text-gray-200 font-sans relative overflow-y-auto tactical-bg">
    <div className="scanline"></div>
    <div className="max-w-5xl mx-auto pb-24 relative z-10">
      <div className="no-print fixed bottom-6 right-6 flex gap-3 z-50">
        <button onClick={onBack} className="bg-gray-800 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-gray-700 transition-all border border-white/10">VOLVER</button>
      </div>
      <header className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-1 bg-orange-500"></div>
          <p className="font-mono text-orange-500 font-bold tracking-[0.4em] text-[9px] uppercase">OPERATIONAL_MANUAL_v3.2</p>
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 uppercase text-white">GUÍA DE<br />USUARIO</h1>
      </header>
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-bold text-orange-500 uppercase mb-4">01_IDENTIFICACIÓN</h2>
          <p className="text-sm text-gray-400">Es obligatorio establecer un Callsign único para ser visible por el resto de la brigada.</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-bold text-orange-500 uppercase mb-4">02_FRECUENCIAS</h2>
          <p className="text-sm text-gray-400">Los canales agrupan a las unidades. Asegúrese de estar en la frecuencia correcta.</p>
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENTE: LANDING ---
const LandingView = ({ onEnter, onManual, onGuide }: { onEnter: () => void; onManual: () => void; onGuide: () => void }) => (
  <div className="overflow-x-hidden relative min-h-screen selection:bg-orange-500 bg-[#0e0a07]">
    <div className="scanline"></div>
    <div className="max-w-5xl mx-auto text-center pt-32 px-6">
        <h1 className="text-7xl md:text-9xl font-black text-white uppercase mb-12 tracking-tighter leading-none">RADIO<br/>UBICACIÓN<br/>MÓVIL</h1>
        <div className="flex flex-col md:flex-row justify-center gap-6">
            <button onClick={onEnter} className="bg-orange-600 px-12 py-6 font-black text-white uppercase hover:bg-orange-500 shadow-2xl transition-all">ENTRAR EN SERVICIO</button>
            <button onClick={onManual} className="bg-gray-800 px-12 py-6 font-black text-white uppercase hover:bg-gray-700 transition-all">MANUAL OPERATIVO</button>
        </div>
        <button onClick={onGuide} className="mt-12 text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-orange-500 transition-all">Versión Impresa B/W</button>
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
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'manual' | 'guide'>('landing');
  const [userName, setUserName] = useState<string>(localStorage.getItem('user_callsign') || ''); 
  const [isIdentified, setIsIdentified] = useState(!!localStorage.getItem('user_callsign'));
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [tempName, setTempName] = useState(localStorage.getItem('user_callsign') || '');
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [teamMembersRaw, setTeamMembersRaw] = useState<TeamMember[]>([]);
  const [radioHistory, setRadioHistory] = useState<RadioHistory[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [remoteTalker, setRemoteTalker] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'team' | 'history'>('map');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);

  const radioRef = useRef<RadioService | null>(null);
  const effectiveLocation = manualLocation || userLocation;
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => { userLocationRef.current = effectiveLocation; }, [effectiveLocation]);
  
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

  // --- REGISTRO DE PRESENCIA REFORZADO ---
  const doCheckIn = useCallback(async (channelId: string, name: string) => {
    if (!name || !channelId) return;
    const lat = userLocationRef.current?.lat || -26.8241;
    const lng = userLocationRef.current?.lng || -65.2226;
    
    const { error } = await supabase.from('locations').upsert({
      id: DEVICE_ID,
      name: name,
      lat,
      lng,
      accuracy: 0,
      role: 'Móvil',
      status: isTalking ? 'talking' : 'online',
      last_seen: new Date().toISOString(),
      channel_id: channelId
    }, { onConflict: 'id' });

    if (error) console.error("CHECKIN_FAIL", error);
  }, [isTalking]);

  const fetchAllData = useCallback(async () => {
    if (!activeChannel || !userName) return;
    
    try {
      const [membersRes, historyRes] = await Promise.all([
        supabase.from('locations')
          .select('*')
          .eq('channel_id', activeChannel.id)
          .gt('last_seen', new Date(Date.now() - 259200000).toISOString()), // 72h window
        supabase.from('radio_history')
          .select('*')
          .eq('channel_id', activeChannel.id)
          .order('created_at', { ascending: false })
          .limit(30)
      ]);

      if (membersRes.data) {
        setTeamMembersRaw(membersRes.data
          .filter(m => String(m.id).trim() !== String(DEVICE_ID).trim())
          .map(m => ({ 
            ...m, 
            lat: Number(m.lat), 
            lng: Number(m.lng),
            status: m.status || 'online'
          }))
        );
      }
      if (historyRes.data) setRadioHistory(historyRes.data);
    } catch (err) {
      console.error("DATA_SYNC_ERR", err);
    }
  }, [activeChannel, userName]);

  // --- LATIDO (HEARTBEAT) DE PRESENCIA CADA 30S ---
  useEffect(() => {
    if (!activeChannel || !userName || !isIdentified) return;
    const interval = setInterval(() => {
      doCheckIn(activeChannel.id, userName);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeChannel, userName, isIdentified, doCheckIn]);

  // --- SUSCRIPCIÓN MAESTRA ---
  useEffect(() => {
    if (!activeChannel || !userName || !isIdentified) return;

    doCheckIn(activeChannel.id, userName);
    fetchAllData();

    // Suscripción robusta sin filtros de canal del lado servidor para evitar problemas de compatibilidad
    const channel = supabase.channel(`sync-v7-${activeChannel.id}`)
      .on('postgres_changes', { event: '*', table: 'locations', schema: 'public' }, (payload) => {
        const target = payload.new || payload.old;
        if (!target) return;
        
        const tid = String(target.id).trim();
        const myId = String(DEVICE_ID).trim();
        
        // Ignorarme a mí mismo
        if (tid === myId) return;
        
        // Filtrar canal en memoria por seguridad
        const targetChannel = String(target.channel_id || '').trim();
        if (payload.eventType !== 'DELETE' && targetChannel !== String(activeChannel.id).trim()) return;

        setTeamMembersRaw(prev => {
          if (payload.eventType === 'DELETE') return prev.filter(m => String(m.id).trim() !== tid);
          
          const formatted = { 
            ...target, 
            lat: Number(target.lat), 
            lng: Number(target.lng),
            status: target.status || 'online'
          } as TeamMember;

          const idx = prev.findIndex(m => String(m.id).trim() === tid);
          if (idx === -1) return [...prev, formatted];
          const next = [...prev];
          next[idx] = formatted;
          return next;
        });
      })
      .on('postgres_changes', { event: 'INSERT', table: 'radio_history', schema: 'public' }, (payload) => {
        if (String(payload.new.channel_id).trim() === String(activeChannel.id).trim()) {
          setRadioHistory(prev => [payload.new, ...prev]);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log("REALTIME_ONLINE");
      });

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [activeChannel, userName, isIdentified, doCheckIn, fetchAllData]);

  // GPS WATCHER
  useEffect(() => {
    if (!activeChannel || !userName || manualLocation || !isIdentified) return;
    
    const sendPos = async (lat: number, lng: number, acc: number) => {
      if (!isOnline) return;
      await supabase.from('locations').upsert({
        id: DEVICE_ID, name: userName, lat, lng, accuracy: Math.round(acc),
        role: acc > 150 ? 'PC / Base' : 'Móvil', 
        status: isTalking ? 'talking' : 'online', 
        last_seen: new Date().toISOString(), 
        channel_id: activeChannel.id
      }, { onConflict: 'id' });
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        sendPos(latitude, longitude, accuracy);
      },
      (err) => console.warn("GPS_ERR", err), 
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTalking, activeChannel, userName, manualLocation, isOnline, isIdentified]);

  // Cleanup Radio on Unmount
  useEffect(() => {
    return () => {
      if (radioRef.current) radioRef.current.disconnect();
    };
  }, []);

  if (currentView === 'guide') return <GuideView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'manual') return <ManualView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'landing') return <LandingView onEnter={() => setCurrentView('app')} onManual={() => setCurrentView('manual')} onGuide={() => setCurrentView('guide')} />;

  if (!isIdentified) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
      <div className="scanline"></div>
      <div className="w-full max-w-sm bg-gray-900 border border-orange-500/30 p-8 shadow-2xl relative z-10">
        <h1 className="text-orange-500 font-black text-center mb-8 tracking-widest uppercase">Identificación Radio</h1>
        <p className="text-[10px] text-gray-500 mb-6 text-center uppercase">Ingrese su indicativo de misión.</p>
        <input autoFocus type="text" value={tempName} onChange={e => setTempName(e.target.value.toUpperCase())} 
          onKeyDown={e => e.key === 'Enter' && tempName.length >= 3 && (localStorage.setItem('user_callsign', tempName), setUserName(tempName), setIsIdentified(true))}
          placeholder="CALLSIGN (EJ: MOVIL-1)" className="w-full bg-black border border-gray-800 p-4 text-orange-500 text-center font-bold mb-4 outline-none focus:border-orange-500 uppercase"
        />
        <button onClick={() => { if(tempName.length >= 3) { localStorage.setItem('user_callsign', tempName); setUserName(tempName); setIsIdentified(true); }}} className="w-full bg-orange-600 text-white font-black py-4 hover:bg-orange-500 transition-colors uppercase">Entrar en Servicio</button>
      </div>
    </div>
  );

  if (!activeChannel) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
       <div className="scanline"></div>
       <div className="w-full max-w-md relative z-10">
          <button onClick={() => { localStorage.removeItem('user_callsign'); setIsIdentified(false); }} className="mb-4 text-gray-500 flex items-center gap-2 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest"><ChevronLeft size={14} /> Cambiar Callsign</button>
          <h2 className="text-orange-500 font-bold uppercase text-center mb-8 tracking-widest">Seleccionar Frecuencia</h2>
          <ChannelSelector onSelect={ch => setActiveChannel(ch)} />
       </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black overflow-hidden relative text-white">
      <div className="scanline"></div>
      <div className="flex-1 relative overflow-hidden flex flex-col">
         {/* Tabs Móviles */}
         <div className="md:hidden flex bg-gray-950 border-b border-white/10 z-[1001]">
            <button onClick={() => setMobileTab('map')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${mobileTab === 'map' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Mapa</button>
            <button onClick={() => setMobileTab('team')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${mobileTab === 'team' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Equipo ({teamMembers.length})</button>
            <button onClick={() => setMobileTab('history')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${mobileTab === 'history' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Log</button>
         </div>

         <div className="flex-1 relative">
            <MapDisplay key={activeChannel.id} userLocation={effectiveLocation} teamMembers={teamMembers} accuracy={0} isManualMode={isManualMode} onMapClick={(lat, lng) => { setManualLocation({lat, lng}); setIsManualMode(false); }} />
            <div className="absolute top-4 left-4 z-[2000] bg-black/80 backdrop-blur px-3 py-1 border border-orange-500/30 rounded flex items-center gap-3">
                <span className="text-xs font-bold text-orange-500 font-mono tracking-widest uppercase">{activeChannel.name}</span>
                <button onClick={fetchAllData} className="text-gray-500 hover:text-white transition-colors"><RefreshCw size={12} /></button>
            </div>

            {/* Vistas Móviles */}
            <div className={`md:hidden absolute inset-0 z-[1002] bg-gray-950 transition-transform ${mobileTab === 'team' ? 'translate-x-0' : 'translate-x-full'}`}>
               <TeamList members={teamMembers} />
            </div>
            <div className={`md:hidden absolute inset-0 z-[1002] bg-gray-950 transition-transform ${mobileTab === 'history' ? 'translate-x-0' : 'translate-x-full'}`}>
               <HistoryPanel history={radioHistory} activeChannel={activeChannel} />
            </div>
         </div>

         {/* Panel PC */}
         <div className="hidden lg:flex flex-col absolute bottom-6 right-6 w-80 bg-black/90 backdrop-blur rounded border border-white/10 shadow-2xl h-[480px] overflow-hidden z-[500]">
            <div className="flex border-b border-white/10 bg-white/5">
              <button onClick={() => setMobileTab('team')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab !== 'history' ? 'text-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-white'}`}>Equipo</button>
              <button onClick={() => setMobileTab('history')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'history' ? 'text-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-white'}`}>Registro</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {mobileTab !== 'history' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}
            </div>
         </div>
      </div>

      <div className="flex-none md:w-[400px] bg-gray-950 z-20 border-t md:border-t-0 md:border-l border-white/10">
        <RadioControl 
           connectionState={connectionState} isTalking={isTalking} activeChannelName={activeChannel.name}
           onTalkStart={() => { if (radioRef.current) { setIsTalking(true); radioRef.current.startTransmission(); } }} 
           onTalkEnd={() => { if (radioRef.current) { radioRef.current.stopTransmission(); setIsTalking(false); } }} 
           lastTranscript={remoteTalker} onConnect={() => {
              setConnectionState(ConnectionState.CONNECTING);
              if (radioRef.current) radioRef.current.disconnect();
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
