
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

// Componente de Guía con SVG corregidos (camelCase)
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
          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="square"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, title: "01. IDENTIFICACIÓN", desc: "Ingrese su CALLSIGN. Es su matrícula en el mapa." },
          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="square"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>, title: "02. FRECUENCIA", desc: "Seleccione el canal de su brigada." },
          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="square"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, title: "03. TRANSMISIÓN", desc: "Mantenga PTT para modular voz." }
        ].map((item) => (
          <div key={item.title} className="flex gap-6 border-b border-black py-4 last:border-0">
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0">{item.icon}</div>
            <div>
              <h3 className="font-bold text-lg uppercase">{item.title}</h3>
              <p className="text-sm">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onBack} className="mt-8 border-2 border-black px-6 py-2 font-bold uppercase hover:bg-black hover:text-white transition-all">VOLVER</button>
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
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'guide'>('landing');
  const [userName, setUserName] = useState<string>(localStorage.getItem('user_callsign') || ''); 
  const [isIdentified, setIsIdentified] = useState(!!localStorage.getItem('user_callsign'));
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [tempName, setTempName] = useState(localStorage.getItem('user_callsign') || '');
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
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

  const teamMembers = useMemo(() => {
    if (!effectiveLocation) return teamMembersRaw;
    return teamMembersRaw.map(m => ({
      ...m,
      distance: calculateDistance(effectiveLocation.lat, effectiveLocation.lng, m.lat, m.lng)
    }));
  }, [teamMembersRaw, effectiveLocation]);

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

    if (error) console.error("DB_ERROR: Check-in fallido", error);
  }, [isTalking]);

  const fetchAllData = useCallback(async () => {
    if (!activeChannel) return;
    console.log("SYNC: Sincronizando datos de canal...");
    const [membersRes, historyRes] = await Promise.all([
      supabase.from('locations').select('*').eq('channel_id', activeChannel.id).gt('last_seen', new Date(Date.now() - 3600000).toISOString()),
      supabase.from('radio_history').select('*').eq('channel_id', activeChannel.id).order('created_at', { ascending: false }).limit(30)
    ]);

    if (membersRes.data) {
      setTeamMembersRaw(membersRes.data
        .filter(m => String(m.id).trim() !== String(DEVICE_ID).trim())
        .map(m => ({ ...m, lat: Number(m.lat), lng: Number(m.lng), status: m.status || 'online' }))
      );
    }
    if (historyRes.data) setRadioHistory(historyRes.data);
  }, [activeChannel]);

  // Heartbeat cada 15s
  useEffect(() => {
    if (!activeChannel || !isIdentified) return;
    const interval = setInterval(() => doCheckIn(activeChannel.id, userName), 15000);
    return () => clearInterval(interval);
  }, [activeChannel, userName, isIdentified, doCheckIn]);

  // Suscripción Realtime Maestra
  useEffect(() => {
    if (!activeChannel || !isIdentified) return;

    doCheckIn(activeChannel.id, userName);
    fetchAllData();

    const channel = supabase.channel(`realtime-v11-${activeChannel.id}`)
      .on('postgres_changes', { event: '*', table: 'locations', schema: 'public' }, (payload) => {
        const target = payload.new || payload.old;
        if (!target) return;
        
        const tid = String(target.id).trim();
        if (tid === String(DEVICE_ID).trim()) return;
        
        // Filtro manual estricto por canal
        if (payload.eventType !== 'DELETE' && String(target.channel_id) !== String(activeChannel.id)) return;

        setTeamMembersRaw(prev => {
          if (payload.eventType === 'DELETE') return prev.filter(m => String(m.id).trim() !== tid);
          const formatted = { ...target, lat: Number(target.lat), lng: Number(target.lng), status: target.status || 'online' } as TeamMember;
          const idx = prev.findIndex(m => String(m.id).trim() === tid);
          if (idx === -1) return [...prev, formatted];
          const next = [...prev];
          next[idx] = formatted;
          return next;
        });
      })
      .on('postgres_changes', { event: 'INSERT', table: 'radio_history', schema: 'public' }, (payload) => {
        if (String(payload.new.channel_id) === String(activeChannel.id)) {
          setRadioHistory(prev => [payload.new, ...prev]);
        }
      })
      .subscribe((status) => {
        console.log(`REALTIME_CHANNEL: ${status}`);
        if (status === 'SUBSCRIBED') fetchAllData();
        if (status === 'CHANNEL_ERROR') console.error("ALERTA: Realtime no activado en Supabase.");
      });

    return () => { channel.unsubscribe(); };
  }, [activeChannel, userName, isIdentified, doCheckIn, fetchAllData]);

  // GPS Watcher
  useEffect(() => {
    if (!activeChannel || manualLocation || !isIdentified) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        if (navigator.onLine) {
          supabase.from('locations').upsert({
            id: DEVICE_ID, name: userName, lat: latitude, lng: longitude, accuracy: Math.round(accuracy),
            role: accuracy > 100 ? 'PC / Base' : 'Móvil', 
            status: isTalking ? 'talking' : 'online', 
            last_seen: new Date().toISOString(), 
            channel_id: activeChannel.id
          }, { onConflict: 'id' });
        }
      },
      null, 
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTalking, activeChannel, userName, manualLocation, isIdentified]);

  if (currentView === 'guide') return <GuideView onBack={() => setCurrentView('app')} />;
  
  if (currentView === 'landing') return (
    <div className="min-h-screen bg-[#0e0a07] text-white flex flex-col items-center justify-center p-6 text-center">
       <div className="scanline"></div>
       <h1 className="text-6xl md:text-9xl font-black mb-12 tracking-tighter leading-none">RADIO<br/>UBICACIÓN</h1>
       <div className="flex flex-col md:flex-row gap-6">
          <button onClick={() => setCurrentView('app')} className="bg-orange-600 px-12 py-6 font-black uppercase text-xl hover:bg-orange-500 shadow-2xl transition-all">Activar Unidad</button>
          <button onClick={() => setCurrentView('guide')} className="bg-gray-800 px-12 py-6 font-black uppercase text-xl hover:bg-gray-700 transition-all">Guía Operativa</button>
       </div>
    </div>
  );

  if (!isIdentified) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono relative">
      <div className="scanline"></div>
      <div className="w-full max-w-sm bg-gray-900 border border-orange-500/30 p-8 shadow-2xl z-10">
        <h1 className="text-orange-500 font-black text-center mb-8 uppercase text-xl">Identificación</h1>
        <input autoFocus type="text" value={tempName} onChange={e => setTempName(e.target.value.toUpperCase())} 
          onKeyDown={e => e.key === 'Enter' && tempName.length >= 3 && (localStorage.setItem('user_callsign', tempName), setUserName(tempName), setIsIdentified(true))}
          placeholder="CALLSIGN (EJ: MOVIL-1)" className="w-full bg-black border border-gray-800 p-4 text-orange-500 text-center font-bold mb-4 outline-none focus:border-orange-500 uppercase"
        />
        <button onClick={() => { if(tempName.length >= 3) { localStorage.setItem('user_callsign', tempName); setUserName(tempName); setIsIdentified(true); }}} className="w-full bg-orange-600 text-white font-black py-4 hover:bg-orange-500 transition-colors uppercase">Registrar</button>
      </div>
    </div>
  );

  if (!activeChannel) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono">
       <div className="scanline"></div>
       <div className="w-full max-w-md z-10">
          <button onClick={() => { localStorage.removeItem('user_callsign'); setIsIdentified(false); setUserName(''); }} className="mb-4 text-gray-500 flex items-center gap-2 hover:text-white transition-colors uppercase text-[10px] font-bold"><ChevronLeft size={14} /> Cambiar Callsign</button>
          <ChannelSelector onSelect={ch => setActiveChannel(ch)} />
       </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black overflow-hidden relative text-white font-mono">
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
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">{activeChannel.name}</span>
                <button onClick={fetchAllData} className="text-gray-500 hover:text-white transition-colors"><RefreshCw size={12} /></button>
            </div>
            
            <div className={`md:hidden absolute inset-0 z-[1002] bg-gray-950 transition-transform ${mobileTab === 'team' ? 'translate-x-0' : 'translate-x-full'}`}>
               <TeamList members={teamMembers} />
            </div>
            <div className={`md:hidden absolute inset-0 z-[1002] bg-gray-950 transition-transform ${mobileTab === 'history' ? 'translate-x-0' : 'translate-x-full'}`}>
               <HistoryPanel history={radioHistory} activeChannel={activeChannel} />
            </div>
         </div>

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
