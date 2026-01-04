
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
import { User, ShieldCheck, List, X, Hash, Settings2, UserCog, WifiOff } from 'lucide-react';

const DEVICE_ID = getDeviceId();

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(2)}km`;
}

function App() {
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
  const [systemLog, setSystemLog] = useState<string>("SISTEMA_STANDBY");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'history'>('team');
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  const radioRef = useRef<RadioService | null>(null);
  const syncChannelRef = useRef<any>(null);
  
  const effectiveLocation = manualLocation || userLocation;
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    userLocationRef.current = effectiveLocation;
  }, [effectiveLocation]);

  const teamMembers = useMemo(() => {
    if (!effectiveLocation) return teamMembersRaw;
    return teamMembersRaw.map(m => ({
      ...m,
      distance: calculateDistance(effectiveLocation.lat, effectiveLocation.lng, m.lat, m.lng)
    }));
  }, [teamMembersRaw, effectiveLocation]);

  const updateMemberInState = useCallback((item: any) => {
    if (!item || item.id === DEVICE_ID) return;
    setTeamMembersRaw(prev => {
      const normalizedItem = { ...item, lat: Number(item.lat), lng: Number(item.lng), status: item.status || 'online' } as TeamMember;
      const index = prev.findIndex(m => m.id === item.id);
      if (index === -1) return [...prev, normalizedItem];
      const next = [...prev]; 
      next[index] = normalizedItem; 
      return next;
    });
  }, []);

  const reportPresence = useCallback(async () => {
    if (!activeChannel || !isNameSet || !effectiveLocation) return;
    const presenceData = {
      id: DEVICE_ID, name: userName, lat: effectiveLocation.lat, lng: effectiveLocation.lng, 
      accuracy: manualLocation ? 0 : Math.round(locationAccuracy),
      role: manualLocation ? 'Unidad Fija' : (locationAccuracy > 200 ? 'PC / Base' : 'Móvil'), 
      status: isTalking ? 'talking' : 'online', last_seen: new Date().toISOString(), channel_id: activeChannel.id
    };
    await supabase.from('locations').upsert(presenceData);
    if (syncChannelRef.current) {
      syncChannelRef.current.send({ type: 'broadcast', event: 'presence-sync', payload: presenceData });
    }
  }, [activeChannel, isNameSet, effectiveLocation, userName, manualLocation, locationAccuracy, isTalking]);

  useEffect(() => {
    if (!activeChannel || !isNameSet) return;
    const interval = setInterval(reportPresence, 30000);
    return () => clearInterval(interval);
  }, [reportPresence, activeChannel, isNameSet]);

  useEffect(() => {
    if (!activeChannel || !isNameSet) return;

    const fetchData = async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const { data: members } = await supabase.from('locations').select('*').eq('channel_id', activeChannel.id).gt('last_seen', yesterday); 
      if (members) setTeamMembersRaw(members.filter(m => m.id !== DEVICE_ID).map(m => ({ ...m, lat: Number(m.lat), lng: Number(m.lng) })));
      const { data: history } = await supabase.from('radio_history').select('*').eq('channel_id', activeChannel.id).order('created_at', { ascending: false }).limit(20);
      if (history) setRadioHistory(history);
    };

    fetchData();

    const channel = supabase.channel(`sync-v3-${activeChannel.id}`, { config: { broadcast: { ack: false, self: false } } })
    .on('postgres_changes', { event: '*', table: 'locations', schema: 'public' }, (payload: any) => {
      const item = payload.new || payload.old;
      if (!item || item.id === DEVICE_ID) return;
      if (item.channel_id && item.channel_id !== activeChannel.id) return;
      if (payload.eventType === 'DELETE') setTeamMembersRaw(prev => prev.filter(m => m.id !== item.id));
      else updateMemberInState(item);
    })
    .on('postgres_changes', { event: 'INSERT', table: 'radio_history', schema: 'public' }, (payload: any) => {
      if (payload.new && payload.new.channel_id === activeChannel.id) setRadioHistory(prev => [payload.new, ...prev]);
    })
    .on('broadcast', { event: 'presence-sync' }, (payload) => {
      if (payload.payload && payload.payload.channel_id === activeChannel.id) updateMemberInState(payload.payload);
    })
    .subscribe();
    syncChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); syncChannelRef.current = null; };
  }, [activeChannel, isNameSet, updateMemberInState]);

  useEffect(() => {
    if (!activeChannel || !isNameSet || !navigator.geolocation || manualLocation) return;
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setLocationAccuracy(accuracy);
      setSystemLog(accuracy > 200 ? `GPS_LOW_ACC (±${accuracy.toFixed(0)}m)` : `GPS_LOCKED (±${accuracy.toFixed(0)}m)`);
      reportPresence();
    }, (err) => setSystemLog(`GPS_ERROR_${err.code}`), { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeChannel, isNameSet, manualLocation, reportPresence]);

  const handleConnect = useCallback(async () => {
    if (!activeChannel) return;
    setConnectionState(ConnectionState.CONNECTING);
    setSystemLog("LINKING_RADIO...");
    try {
      const service = new RadioService({
        userId: DEVICE_ID, userName: userName, channelId: activeChannel.id,
        getUserLocation: () => userLocationRef.current,
        onAudioBuffer: () => { setAudioLevel(prev => Math.min(100, prev + 25)); setTimeout(() => setAudioLevel(0), 100); },
        onIncomingStreamStart: (name) => setRemoteTalker(name),
        onIncomingStreamEnd: () => setRemoteTalker(null),
        onConnectionChange: (status) => {
          if (status === 'CONNECTED') setConnectionState(ConnectionState.CONNECTED);
          if (status === 'RECONNECTING') setConnectionState(ConnectionState.CONNECTING);
        }
      });
      // iOS Essential: El unlock ocurre bajo el evento de click
      await service.unlockAudio();
      radioRef.current = service;
    } catch (e) {
      setConnectionState(ConnectionState.ERROR);
      setSystemLog("ENLACE_FALLIDO");
    }
  }, [userName, activeChannel]);

  const handleDisconnect = useCallback(() => {
    if (radioRef.current) radioRef.current.disconnect();
    radioRef.current = null;
    setConnectionState(ConnectionState.DISCONNECTED);
    setSystemLog("SISTEMA_STANDBY");
  }, []);

  const handleJoinAfterName = () => {
    if(tempName.trim().length >= 3) { 
      const name = tempName.trim().toUpperCase();
      localStorage.setItem('user_callsign', name); 
      setUserName(name); 
      setIsNameSet(true); 
    }
  };

  if (!isNameSet) {
    return (
      <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono">
        <div className="w-full max-w-sm space-y-6 bg-gray-950 border border-orange-500/20 p-8 rounded shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/30">
              <User className="text-orange-500" size={32} />
            </div>
            <h1 className="text-orange-500 font-black tracking-widest text-lg uppercase">RADIO_TAC_MOVIL</h1>
          </div>
          <input 
            autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoinAfterName()} 
            placeholder="INDICATIVO (CALLSIGN)"
            className="w-full bg-black border border-gray-800 p-4 text-orange-500 focus:border-orange-500 outline-none text-center font-bold tracking-widest uppercase"
          />
          <button 
            onClick={handleJoinAfterName}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-900/20"
          >
            <ShieldCheck size={20} /> INICIAR DEPLOYMENT
          </button>
        </div>
      </div>
    );
  }

  if (!activeChannel) {
    return (
      <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono text-center">
         <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col items-center gap-2 mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">OPERADOR_ACTIVO:</span>
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 border border-white/10 rounded-full">
                <span className="text-orange-500 font-bold tracking-widest uppercase">{userName}</span>
                <button onClick={() => { setIsNameSet(false); setTempName(userName); }} className="p-1.5 hover:bg-orange-500 hover:text-white text-gray-400 rounded-full transition-all active:scale-90" title="Editar Indicativo"><UserCog size={16} /></button>
              </div>
            </div>
            <h2 className="text-orange-500 font-bold mb-4 uppercase tracking-widest text-sm">Sincronizar Frecuencia</h2>
            <ChannelSelector onSelect={(ch) => setActiveChannel(ch)} />
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-black overflow-hidden relative text-white font-sans">
      
      {connectionState === ConnectionState.CONNECTING && (
        <div className="absolute inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
           <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mb-4" />
           <p className="text-orange-500 font-mono font-black animate-pulse tracking-widest">ENLAZANDO_RADIO...</p>
        </div>
      )}

      {isManualMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[3000] bg-orange-600 text-white font-black px-6 py-3 rounded-full shadow-2xl animate-pulse flex items-center gap-3 border-2 border-white uppercase text-xs tracking-widest">
           <Settings2 size={16} /> Toque el mapa para fijar su posición
        </div>
      )}

      <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
         <MapDisplay userLocation={effectiveLocation} teamMembers={teamMembers} accuracy={locationAccuracy} isManualMode={isManualMode} onMapClick={async (lat, lng) => {
            if (!isManualMode) return;
            setIsManualMode(false);
            setManualLocation({ lat, lng });
            setLocationAccuracy(0);
            setSystemLog("UBIC_FIJADA");
            const presenceData = { id: DEVICE_ID, name: userName, lat, lng, accuracy: 0, role: 'Unidad Fija', status: isTalking ? 'talking' : 'online', last_seen: new Date().toISOString(), channel_id: activeChannel.id };
            await supabase.from('locations').upsert(presenceData);
            if (syncChannelRef.current) syncChannelRef.current.send({ type: 'broadcast', event: 'presence-sync', payload: presenceData });
         }} />
         
         <div className="absolute top-4 left-4 z-[2000] flex flex-col gap-2 pointer-events-none">
            <div className="bg-black/80 backdrop-blur px-3 py-1 border border-orange-500/30 rounded shadow-lg">
              <span className="text-[9px] text-orange-500/50 block font-mono">FRECUENCIA</span>
              <span className="text-xs font-bold text-orange-500 font-mono uppercase tracking-widest"><Hash size={10} className="inline mr-1" /> {activeChannel.name}</span>
            </div>
            <div className="bg-black/60 px-2 py-1 rounded text-[8px] font-mono text-gray-500">{systemLog}</div>
         </div>

         <div className="absolute top-4 right-4 z-[2000] md:hidden">
            <button onClick={() => setShowMobileOverlay(!showMobileOverlay)} className="w-12 h-12 bg-black/80 border-2 border-white/20 rounded-full flex items-center justify-center text-white shadow-xl">
              {showMobileOverlay ? <X size={24} /> : <List size={24} />}
            </button>
         </div>

         <div className="hidden md:flex flex-col absolute bottom-6 left-6 w-80 bg-black/90 backdrop-blur rounded border border-white/10 shadow-2xl h-[400px] overflow-hidden z-[500]">
            <div className="flex border-b border-white/10 bg-white/5">
              <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'team' ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' : 'text-gray-500'}`}>Unidades</button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'history' ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' : 'text-gray-500'}`}>Log Audio</button>
            </div>
            <div className="flex-1 overflow-hidden">{activeTab === 'team' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}</div>
         </div>

         {showMobileOverlay && (
           <div className="md:hidden absolute inset-0 z-[2001] bg-gray-950 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black">
                <div className="flex gap-6">
                  <button onClick={() => setActiveTab('team')} className={`font-bold uppercase text-[10px] tracking-widest ${activeTab === 'team' ? 'text-orange-500' : 'text-gray-500'}`}>Unidades</button>
                  <button onClick={() => setActiveTab('history')} className={`font-bold uppercase text-[10px] tracking-widest ${activeTab === 'history' ? 'text-orange-500' : 'text-gray-500'}`}>Historial</button>
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
           onTalkStart={() => { if (radioRef.current && connectionState === ConnectionState.CONNECTED) { setIsTalking(true); radioRef.current.startTransmission(); reportPresence(); } }} 
           onTalkEnd={() => { if (radioRef.current) { radioRef.current.stopTransmission(); setIsTalking(false); reportPresence(); } }} 
           lastTranscript={remoteTalker} onConnect={handleConnect} onDisconnect={handleDisconnect} 
           onQSY={() => { handleDisconnect(); setActiveChannel(null); }}
           audioLevel={audioLevel} onEmergencyClick={() => setShowEmergencyModal(true)}
           isManualMode={isManualMode} onToggleManual={() => setIsManualMode(!isManualMode)}
        />
      </div>
      
      <EmergencyModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} location={effectiveLocation} />
    </div>
  );
}

export default App;
