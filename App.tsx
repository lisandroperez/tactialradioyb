
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
import { User, ShieldCheck, List, X, UserCog } from 'lucide-react';

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

  const [teamMembersMap, setTeamMembersMap] = useState<Record<string, TeamMember>>({});
  const [radioHistory, setRadioHistory] = useState<RadioHistory[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [remoteTalker, setRemoteTalker] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [systemLog, setSystemLog] = useState<string>("SISTEMA_STANDBY");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'history'>('team');
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  
  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const radioRef = useRef<RadioService | null>(null);
  const presenceChannelRef = useRef<any>(null);
  
  const effectiveLocation = manualLocation || userLocation;
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    userLocationRef.current = effectiveLocation;
  }, [effectiveLocation]);

  // Detector de PWA y Standalone
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA Prompt detectado');
    };

    window.addEventListener('beforeinstallprompt', handler);
    checkStandalone();
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Fallback manual si el evento no existe (común en previews)
      alert('Para instalar:\n\nAndroid: Toca los 3 puntos ⋮ y "Instalar aplicación"\niOS (Safari): Toca "Compartir" y "Añadir a pantalla de inicio"');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const teamMembers = useMemo(() => {
    const list = Object.values(teamMembersMap);
    if (!effectiveLocation) return list;
    return list.map(m => ({
      ...m,
      distance: calculateDistance(effectiveLocation.lat, effectiveLocation.lng, m.lat, m.lng)
    }));
  }, [teamMembersMap, effectiveLocation]);

  useEffect(() => {
    if (!activeChannel || !isNameSet) return;

    const fetchInitialLocations = async () => {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('channel_id', activeChannel.id);
      
      if (data) {
        const initialMap: Record<string, TeamMember> = {};
        data.forEach(item => {
          if (item.id !== DEVICE_ID) {
            initialMap[item.id] = {
              id: item.id,
              name: item.name,
              role: item.role || 'Unidad',
              status: 'offline', 
              lat: item.lat,
              lng: item.lng,
              channel_id: item.channel_id
            };
          }
        });
        setTeamMembersMap(initialMap);
      }
    };

    fetchInitialLocations();

    const channel = supabase.channel(`ops-${activeChannel.id}`, {
      config: { presence: { key: DEVICE_ID } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setTeamMembersMap(prev => {
          const newMap = { ...prev };
          Object.entries(newState).forEach(([key, presence]: [string, any]) => {
            if (key !== DEVICE_ID) {
              const data = presence[0];
              newMap[key] = {
                ...newMap[key],
                id: key,
                name: data.name,
                role: data.role || 'Unidad',
                status: data.isTalking ? 'talking' : 'online',
                lat: data.lat,
                lng: data.lng,
                accuracy: data.accuracy,
                channel_id: activeChannel.id
              };
            }
          });
          return newMap;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setTeamMembersMap(prev => {
          const newMap = { ...prev };
          leftPresences.forEach((p: any) => {
            if (newMap[p.presence_ref]) {
              newMap[p.presence_ref].status = 'offline';
            }
          });
          return newMap;
        });
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        table: 'radio_history', 
        schema: 'public', 
        filter: `channel_id=eq.${activeChannel.id}` 
      }, (payload) => {
        setRadioHistory(prev => [payload.new as RadioHistory, ...prev].slice(0, 30));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setSystemLog("LINK_READY");
        }
      });

    presenceChannelRef.current = channel;

    supabase.from('radio_history')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => data && setRadioHistory(data));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel, isNameSet]);

  useEffect(() => {
    if (!effectiveLocation || !activeChannel || !isNameSet) return;

    const syncLocation = async () => {
      await supabase.from('locations').upsert({
        id: DEVICE_ID,
        name: userName,
        lat: effectiveLocation.lat,
        lng: effectiveLocation.lng,
        role: manualLocation ? 'Puesto Fijo' : 'Unidad Móvil',
        status: isTalking ? 'talking' : 'online',
        last_seen: new Date().toISOString(),
        channel_id: activeChannel.id
      });

      if (presenceChannelRef.current && presenceChannelRef.current.state === 'joined') {
        presenceChannelRef.current.track({
          name: userName,
          lat: effectiveLocation.lat,
          lng: effectiveLocation.lng,
          accuracy: Math.round(locationAccuracy),
          isTalking: isTalking,
          role: manualLocation ? 'Puesto Fijo' : 'Unidad Móvil'
        });
      }
    };

    syncLocation();
  }, [effectiveLocation, isTalking, activeChannel, userName, locationAccuracy]);

  useEffect(() => {
    if (!activeChannel || !isNameSet || !navigator.geolocation || isManualMode) return;
    
    const watchId = navigator.geolocation.watchPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationAccuracy(pos.coords.accuracy);
      setSystemLog(pos.coords.accuracy > 100 ? "GPS_LOW_ACC" : "GPS_LOCKED");
    }, (err) => {
      setSystemLog(`GPS_ERR_${err.code}`);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeChannel, isNameSet, isManualMode]);

  const handleConnect = useCallback(async () => {
    if (!activeChannel) return;
    setConnectionState(ConnectionState.CONNECTING);
    try {
      const service = new RadioService({
        userId: DEVICE_ID, userName: userName, channelId: activeChannel.id,
        getUserLocation: () => userLocationRef.current,
        onAudioBuffer: () => { setAudioLevel(50); setTimeout(() => setAudioLevel(0), 100); },
        onIncomingStreamStart: (name) => setRemoteTalker(name),
        onIncomingStreamEnd: () => setRemoteTalker(null),
        onConnectionChange: (status) => {
          if (status === 'CONNECTED') setConnectionState(ConnectionState.CONNECTED);
          if (status === 'DISCONNECTED') setConnectionState(ConnectionState.DISCONNECTED);
        }
      });
      await service.unlockAudio();
      radioRef.current = service;
      setConnectionState(ConnectionState.CONNECTED);
    } catch (e) {
      setConnectionState(ConnectionState.ERROR);
      setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 2000);
    }
  }, [userName, activeChannel]);

  const handleDisconnect = useCallback(() => {
    setConnectionState(ConnectionState.DISCONNECTED);
    if (radioRef.current) {
      radioRef.current.disconnect();
      radioRef.current = null;
    }
  }, []);

  if (!isNameSet) {
    return (
      <div className="h-[100dvh] w-screen bg-[#050505] flex items-center justify-center p-6 font-mono">
        <div className="w-full max-w-sm space-y-6 bg-[#0a0a0a] border border-orange-500/30 p-8 rounded shadow-[0_0_50px_rgba(249,115,22,0.1)]">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/40">
              <User className="text-orange-500" size={32} />
            </div>
            <h1 className="text-orange-500 font-black tracking-widest text-lg uppercase">RADIO_TAC_V3</h1>
            <p className="text-[10px] text-gray-600">UNIDAD DE DESPLIEGUE RÁPIDO</p>
          </div>
          <input 
            autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && tempName.length >= 3 && (localStorage.setItem('user_callsign', tempName.toUpperCase()), setUserName(tempName.toUpperCase()), setIsNameSet(true))} 
            placeholder="INDICATIVO (CALLSIGN)"
            className="w-full bg-black border border-gray-800 p-4 text-orange-500 focus:border-orange-500 outline-none text-center font-bold tracking-widest uppercase placeholder:text-gray-800"
          />
          <button 
            disabled={tempName.length < 3}
            onClick={() => { localStorage.setItem('user_callsign', tempName.toUpperCase()); setUserName(tempName.toUpperCase()); setIsNameSet(true); }}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white font-black py-4 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <ShieldCheck size={20} /> INICIAR SERVICIO
          </button>
        </div>
      </div>
    );
  }

  if (!activeChannel) {
    return (
      <div className="h-[100dvh] w-screen bg-[#050505] flex items-center justify-center p-6 font-mono">
         <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Operador Activo</span>
              <h2 className="text-orange-500 font-black text-2xl mb-6">{userName}</h2>
            </div>
            <ChannelSelector onSelect={(ch) => setActiveChannel(ch)} />
            <button onClick={() => setIsNameSet(false)} className="w-full text-[10px] text-gray-600 hover:text-orange-500 uppercase tracking-widest flex items-center justify-center gap-2">
              <UserCog size={12} /> Cambiar Identidad
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-black overflow-hidden text-white font-mono">
      
      {connectionState === ConnectionState.CONNECTING && (
        <div className="absolute inset-0 z-[5000] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
           <div className="w-12 h-12 border-2 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mb-4" />
           <p className="text-orange-500 font-black animate-pulse tracking-widest text-xs">ENLAZANDO_FRECUENCIA...</p>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
         <MapDisplay 
            userLocation={effectiveLocation} 
            teamMembers={teamMembers} 
            accuracy={locationAccuracy} 
            isManualMode={isManualMode} 
            onMapClick={(lat, lng) => {
              if (isManualMode) {
                setManualLocation({ lat, lng });
                setIsManualMode(false);
                setSystemLog("UBIC_FIJADA");
              }
            }} 
         />
         
         <div className="absolute top-4 left-4 z-[1000] space-y-2 pointer-events-none">
            <div className="bg-black/80 backdrop-blur px-3 py-2 border border-orange-500/30 rounded flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-orange-500 uppercase">{activeChannel.name}</span>
            </div>
            <div className="bg-black/60 px-2 py-1 rounded text-[8px] text-gray-500 border border-white/5">{systemLog}</div>
         </div>

         <button onClick={() => setShowMobileOverlay(!showMobileOverlay)} className="md:hidden absolute top-4 right-4 z-[1000] w-12 h-12 bg-black/80 border border-white/10 rounded-full flex items-center justify-center shadow-2xl text-orange-500">
           {showMobileOverlay ? <X /> : <List />}
         </button>

         <div className="hidden md:flex flex-col absolute bottom-6 left-6 w-80 bg-[#0a0a0a]/95 backdrop-blur-xl rounded border border-white/10 shadow-2xl h-[450px] z-[500] overflow-hidden">
            <div className="flex border-b border-white/5">
              <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 text-[10px] font-bold uppercase transition-all ${activeTab === 'team' ? 'text-orange-500 bg-orange-500/5 border-b-2 border-orange-500' : 'text-gray-600'}`}>Unidades</button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-[10px] font-bold uppercase transition-all ${activeTab === 'history' ? 'text-orange-500 bg-orange-500/5 border-b-2 border-orange-500' : 'text-gray-600'}`}>Log Audio</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'team' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}
            </div>
         </div>

         {showMobileOverlay && (
           <div className="md:hidden absolute inset-0 z-[2000] bg-[#050505] flex flex-col animate-in fade-in duration-200">
              <div className="flex justify-between items-center p-4 border-b border-white/5">
                <div className="flex gap-4">
                  <button onClick={() => setActiveTab('team')} className={`text-xs font-bold ${activeTab === 'team' ? 'text-orange-500' : 'text-gray-600'}`}>UNIDADES</button>
                  <button onClick={() => setActiveTab('history')} className={`text-xs font-bold ${activeTab === 'history' ? 'text-orange-500' : 'text-gray-600'}`}>LOG</button>
                </div>
                <button onClick={() => setShowMobileOverlay(false)}><X size={20} className="text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-hidden">
                {activeTab === 'team' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}
              </div>
           </div>
         )}
      </div>
      
      <div className="flex-none md:w-[400px] h-auto md:h-full bg-[#080808] z-20 border-l border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.8)]">
        <RadioControl 
           connectionState={connectionState} 
           isTalking={isTalking} 
           activeChannelName={activeChannel.name}
           onTalkStart={() => { if (radioRef.current && connectionState === ConnectionState.CONNECTED) { setIsTalking(true); radioRef.current.startTransmission(); } }} 
           onTalkEnd={() => { if (radioRef.current) { radioRef.current.stopTransmission(); setIsTalking(false); } }} 
           lastTranscript={remoteTalker} 
           onConnect={handleConnect} 
           onDisconnect={handleDisconnect} 
           onQSY={() => { handleDisconnect(); setActiveChannel(null); }}
           audioLevel={audioLevel} 
           onEmergencyClick={() => setShowEmergencyModal(true)}
           isManualMode={isManualMode} 
           onToggleManual={() => setIsManualMode(!isManualMode)}
           isInstallable={!!deferredPrompt || !isStandalone} // Mostrar siempre si no está en modo standalone
           onInstallApp={handleInstallApp}
        />
      </div>
      
      <EmergencyModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} location={effectiveLocation} />
    </div>
  );
}

export default App;
