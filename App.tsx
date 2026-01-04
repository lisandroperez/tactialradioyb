
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
  Home, Radio as RadioIcon, CloudUpload, CloudOff, 
  ChevronLeft, Users, Clock, RefreshCw, ChevronRight, X
} from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- VISTA DEL MANUAL TÁCTICO ---
const ManualView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="bg-[#0e0a07] min-h-screen p-6 md:p-12 text-gray-200 font-sans relative overflow-y-auto">
      <div className="scanline"></div>
      <div className="max-w-5xl mx-auto pb-24 relative z-10">
        <div className="no-print fixed bottom-6 right-6 flex gap-3 z-50">
            <button onClick={() => window.print()} className="bg-white text-black px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-2xl border border-black/10">IMPRIMIR_PDF</button>
            <button onClick={onBack} className="bg-gray-800 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all border border-white/10 flex items-center gap-2">
                <ChevronLeft size={14} /> VOLVER
            </button>
        </div>
        <header className="mb-16 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <div className="w-8 h-1 bg-orange-500"></div>
            <p className="mono text-orange-500 font-bold tracking-[0.4em] text-[9px] uppercase">OPERATIONAL_MANUAL_v3.2</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 uppercase text-white">GUÍA DE<br />USUARIO</h1>
        </header>
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <section className="bg-white/5 border border-white/10 p-6">
            <h2 className="text-2xl font-black uppercase text-white mb-4">01. Identificación</h2>
            <p className="text-xs text-gray-400">Ingrese su Callsign (Ej: "MOVIL-1"). Este nombre será su identificador en el mapa y en el registro de audio.</p>
          </section>
          <section className="bg-white/5 border border-white/10 p-6">
            <h2 className="text-2xl font-black uppercase text-white mb-4">02. Frecuencias</h2>
            <p className="text-xs text-gray-400">Seleccione su canal. Los canales con candado requieren PIN de seguridad.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- LANDING VIEW ---
const LandingView = ({ onEnter, onManual }: { onEnter: () => void; onManual: () => void }) => {
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
                  <button onClick={onManual} className="hidden md:block text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-all">MANUAL_INTERACTIVO</button>
                  <button onClick={onEnter} className="text-[10px] font-bold text-orange-500 border border-orange-500/30 px-4 py-1.5 hover:bg-orange-600 hover:text-white transition-all uppercase">ENTRAR_APP &gt;</button>
              </div>
          </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 hero-gradient">
          <div className="max-w-5xl mx-auto text-center z-10 animate__animated animate__fadeIn">
              <span className="text-[#f97316] text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mb-10 block opacity-90">INFRAESTRUCTURA DE RESPUESTA RÁPIDA</span>
              <h1 className="hero-title text-7xl md:text-9xl lg:text-[150px] text-white uppercase mb-12 leading-[0.82] font-black tracking-tighter">
                  RADIO<br/>UBICACIÓN<br/>MÓVIL
              </h1>
              <p className="text-white text-xl md:text-3xl font-bold tracking-tight uppercase mb-16 opacity-90 leading-tight">VOZ Y GPS EN TIEMPO REAL CUANDO LOS DATOS FALLAN.</p>
              <div className="flex justify-center">
                  <button onClick={onEnter} className="btn-ptt px-16 py-6 rounded-sm font-black text-sm md:text-lg tracking-[0.15em] uppercase text-white shadow-2xl transition-all">ENTRAR EN SERVICIO</button>
              </div>
          </div>
      </section>

      <section className="py-24 bg-black border-y border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-12">
              <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-orange-500 animate-pulse"></div>
                  <span className="text-orange-500 text-[11px] font-black tracking-[0.4em] uppercase">SITUACIÓN_DE_CAMPO</span>
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-[0.9] text-white">EL DESAFÍO<br/><span className="text-gray-600">DEL TERRENO</span></h2>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 pb-12 no-scrollbar cursor-grab active:cursor-grabbing">
              <div className="flex-none w-[85%] md:w-[45%] lg:w-[25%] snap-center bg-[#0a0a0a] border border-white/5 p-8 relative min-h-[280px] flex flex-col justify-end group hover:border-orange-500 transition-all">
                  <div className="absolute top-[-10px] right-[-10px] text-[100px] font-black text-white/5 leading-none pointer-events-none">01</div>
                  <h4 className="text-white font-black mb-4 uppercase text-2xl leading-[0.85] group-hover:text-orange-500 transition-colors">Handys con<br/>interferencia</h4>
                  <p className="text-gray-500 text-sm leading-snug">Eliminamos el ruido analógico. Audio digital cristalino optimizado para entornos de combate e incendios.</p>
              </div>
              <div className="flex-none w-[85%] md:w-[45%] lg:w-[25%] snap-center bg-[#0a0a0a] border border-white/5 p-8 relative min-h-[280px] flex flex-col justify-end group hover:border-orange-500 transition-all">
                  <div className="absolute top-[-10px] right-[-10px] text-[100px] font-black text-white/5 leading-none pointer-events-none">02</div>
                  <h4 className="text-white font-black mb-4 uppercase text-2xl leading-[0.85] group-hover:text-orange-500 transition-colors">Zonas muertas<br/>sin datos</h4>
                  <p className="text-gray-500 text-sm leading-snug">Cuando el 5G falla, nuestro motor conmuta a ráfagas de datos 2G para enviar coordenadas SOS críticas.</p>
              </div>
              <div className="flex-none w-[85%] md:w-[45%] lg:w-[25%] snap-center bg-[#0a0a0a] border border-white/5 p-8 relative min-h-[280px] flex flex-col justify-end group hover:border-orange-500 transition-all">
                  <div className="absolute top-[-10px] right-[-10px] text-[100px] font-black text-white/5 leading-none pointer-events-none">03</div>
                  <h4 className="text-white font-black mb-4 uppercase text-2xl leading-[0.85] group-hover:text-orange-500 transition-colors">Caos y ruido<br/>ambiente</h4>
                  <p className="text-gray-500 text-sm leading-snug">Monitor de audio visual integrado. Si no pudiste escucharlo, el sistema lo transcribe en pantalla.</p>
              </div>
              <div className="flex-none w-[85%] md:w-[45%] lg:w-[25%] snap-center bg-[#0a0a0a] border border-white/5 p-8 relative min-h-[280px] flex flex-col justify-end group hover:border-orange-500 transition-all">
                  <div className="absolute top-[-10px] right-[-10px] text-[100px] font-black text-white/5 leading-none pointer-events-none">04</div>
                  <h4 className="text-white font-black mb-4 uppercase text-2xl leading-[0.85] group-hover:text-orange-500 transition-colors">Análisis de<br/>incidente</h4>
                  <p className="text-gray-500 text-sm leading-snug">Cada voz y movimiento queda registrado para auditorías críticas post-misión. Historial resiliente total.</p>
              </div>
          </div>
      </section>

      <section className="py-32 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-24">
                  <span className="text-orange-500 text-[11px] font-black tracking-[0.4em] uppercase">EQUIPAMIENTO DIGITAL</span>
                  <h2 className="text-5xl md:text-6xl font-black mt-2 tracking-tighter uppercase leading-none text-white">Tecnología de<br/>Misión Crítica</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">Radio PTT Profesional</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Audio nítido optimizado para voz. Comunicación simplex que emula un Handy digital.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">GPS en Tiempo Real</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Visualización táctica de todas las unidades activas sobre cartografía digital offline-ready.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">Protocolo SOS 2G</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Exclusivo sistema de alertas vía SMS cuando fallan los datos móviles. Envío de coordenadas críticas.</p>
                  </div>
              </div>
          </div>
      </section>

      <footer className="py-32 bg-[#0e0a07] text-center border-t border-white/5">
          <div className="max-w-4xl mx-auto px-6">
              <h2 className="text-6xl md:text-8xl font-black mb-12 uppercase tracking-tighter leading-none text-white">
                  La tecnología al servicio <br/>
                  <span className="text-orange-500 italic">DE LA VIDA.</span>
              </h2>
              <button onClick={onEnter} className="bg-white text-black px-16 py-6 font-black uppercase text-sm tracking-widest hover:bg-orange-600 hover:text-white transition-all transform hover:-translate-y-2 shadow-2xl">
                  DESPLEGAR AHORA
              </button>
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

  // --- SINCRONIZACIÓN Y TIEMPO REAL REFORZADA ---
  const fetchAllData = useCallback(async () => {
    if (!activeChannel || !userName) return;
    
    // Heartbeat inicial agresivo
    if (navigator.geolocation && !manualLocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            await supabase.from('locations').upsert({
                id: DEVICE_ID, name: userName, lat: latitude, lng: longitude, 
                accuracy: Math.round(accuracy), role: 'Móvil', status: 'online', 
                last_seen: new Date().toISOString(), channel_id: activeChannel.id
            });
        });
    }

    // Cargar Usuarios (Últimas 24 horas para asegurar detección)
    const { data: members } = await supabase
      .from('locations')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .gt('last_seen', new Date(Date.now() - 86400000).toISOString());
    
    if (members) {
      // Filtrar a mi mismo y formatear lat/lng
      const otherMembers = members
        .filter(m => String(m.id).trim() !== String(DEVICE_ID).trim())
        .map(m => ({
          ...m, 
          lat: Number(m.lat), 
          lng: Number(m.lng)
        }));
      setTeamMembersRaw(otherMembers as TeamMember[]);
    }

    // Cargar Historial
    const { data: history } = await supabase
      .from('radio_history')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (history) setRadioHistory(history);
  }, [activeChannel, userName, manualLocation]);

  useEffect(() => {
    if (!activeChannel || !userName) return;

    fetchAllData();

    // Suscripción de tiempo real con filtrado manual en cliente para máxima fiabilidad
    const channel = supabase.channel(`sync-v9-${activeChannel.id}`)
      .on('postgres_changes', { event: '*', table: 'locations', schema: 'public' }, (payload: any) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        const target = newRec || oldRec;
        
        // CORRECCIÓN: Ignorar si soy yo o de otro canal
        if (!target) return;
        if (String(target.id).trim() === String(DEVICE_ID).trim()) return;
        if (target.channel_id && String(target.channel_id).trim() !== String(activeChannel.id).trim()) return;

        setTeamMembersRaw(prev => {
          if (eventType === 'DELETE') return prev.filter(m => String(m.id).trim() !== String(target.id).trim());
          
          const idx = prev.findIndex(m => String(m.id).trim() === String(target.id).trim());
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
        if (String(payload.new.channel_id).trim() === String(activeChannel.id).trim()) {
          setRadioHistory(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannel, userName, fetchAllData]);

  // --- WATCHER GPS ---
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
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
      <div className="scanline"></div>
      <div className="w-full max-sm bg-gray-900 border border-orange-500/30 p-8 shadow-2xl relative z-10">
        <h1 className="text-orange-500 font-black text-center mb-8 tracking-widest uppercase">Identificación Radio</h1>
        <input autoFocus type="text" value={tempName} onChange={e => setTempName(e.target.value.toUpperCase())} 
          onKeyDown={e => e.key === 'Enter' && tempName.length >= 3 && (localStorage.setItem('user_callsign', tempName), setUserName(tempName))}
          placeholder="CALLSIGN (EJ: MOVIL-1)" className="w-full bg-black border border-gray-800 p-4 text-orange-500 text-center font-bold mb-4 outline-none focus:border-orange-500"
        />
        <button onClick={() => { if(tempName.length >= 3) { localStorage.setItem('user_callsign', tempName); setUserName(tempName); }}} className="w-full bg-orange-600 text-white font-black py-4 hover:bg-orange-500 transition-colors uppercase">Entrar en servicio</button>
      </div>
    </div>
  );

  if (!activeChannel) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
       <div className="scanline"></div>
       <div className="w-full max-w-md relative z-10">
          <h2 className="text-orange-500 font-bold uppercase text-center mb-8 tracking-widest">Seleccionar Canal</h2>
          <ChannelSelector onSelect={ch => setActiveChannel(ch)} />
       </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black overflow-hidden relative text-white">
      <div className="scanline"></div>
      
      {/* SECCIÓN PRINCIPAL: MAPA Y LISTAS */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
         {/* Navegación Móvil */}
         <div className="md:hidden flex bg-gray-950 border-b border-white/10 z-[1001]">
            <button onClick={() => setMobileTab('map')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${mobileTab === 'map' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Mapa</button>
            <button onClick={() => setMobileTab('team')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${mobileTab === 'team' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Equipo ({teamMembers.length})</button>
            <button onClick={() => setMobileTab('history')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${mobileTab === 'history' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500'}`}>Log</button>
         </div>

         <div className="flex-1 relative">
            <MapDisplay userLocation={effectiveLocation} teamMembers={teamMembers} accuracy={0} isManualMode={isManualMode} onMapClick={(lat, lng) => { setManualLocation({lat, lng}); setIsManualMode(false); }} />
            
            <div className="absolute top-4 left-4 z-[2000] bg-black/80 backdrop-blur px-3 py-1 border border-orange-500/30 rounded flex items-center gap-3">
                <span className="text-xs font-bold text-orange-500 font-mono tracking-widest uppercase">{activeChannel.name}</span>
                <button onClick={fetchAllData} className="text-gray-500 hover:text-white transition-colors"><RefreshCw size={12} /></button>
            </div>

            {/* VISTAS QUE SOLO TOMAN TODA LA PANTALLA EN MÓVILES (md:hidden) */}
            <div className={`md:hidden absolute inset-0 z-[1002] bg-gray-950 transition-transform ${mobileTab === 'team' ? 'translate-x-0' : 'translate-x-full'}`}>
               <div className="p-2 border-b border-white/10 flex justify-between items-center bg-black">
                  <span className="text-[10px] font-black uppercase text-orange-500 px-2 tracking-widest">Unidades en Frecuencia</span>
                  <button onClick={() => setMobileTab('map')} className="p-2 text-gray-400"><X size={20} /></button>
               </div>
               <TeamList members={teamMembers} />
            </div>
            
            <div className={`md:hidden absolute inset-0 z-[1002] bg-gray-950 transition-transform ${mobileTab === 'history' ? 'translate-x-0' : 'translate-x-full'}`}>
               <div className="p-2 border-b border-white/10 flex justify-between items-center bg-black">
                  <span className="text-[10px] font-black uppercase text-orange-500 px-2 tracking-widest">Historial de Audio</span>
                  <button onClick={() => setMobileTab('map')} className="p-2 text-gray-400"><X size={20} /></button>
               </div>
               <HistoryPanel history={radioHistory} activeChannel={activeChannel} />
            </div>
         </div>

         {/* Paneles laterales fijos solo en Escritorio (PC) - Evita el bloqueo de la vista */}
         <div className="hidden lg:flex flex-col absolute bottom-6 right-6 w-80 bg-black/90 backdrop-blur rounded border border-white/10 shadow-2xl h-[480px] overflow-hidden z-[500]">
            <div className="flex border-b border-white/10 bg-white/5">
              <button onClick={() => setMobileTab('team')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab !== 'history' ? 'text-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-white'}`}>Unidades</button>
              <button onClick={() => setMobileTab('history')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${mobileTab === 'history' ? 'text-orange-500 bg-orange-500/5' : 'text-gray-500 hover:text-white'}`}>Log Audio</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {mobileTab !== 'history' ? <TeamList members={teamMembers} /> : <HistoryPanel history={radioHistory} activeChannel={activeChannel} />}
            </div>
         </div>
      </div>

      {/* CONTROL DE RADIO */}
      <div className="flex-none md:w-[400px] bg-gray-950 z-20 border-t md:border-t-0 md:border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
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
