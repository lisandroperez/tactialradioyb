
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
  ChevronLeft, X, Printer, Clock, MapPin, Hash, Volume2, Shield, Zap, AlertTriangle, RefreshCw
} from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- COMPONENTE: GUÍA RÁPIDA (Basado en el HTML proporcionado) ---
const GuideView = ({ onBack }: { onBack: () => void }) => (
  <div className="bg-white min-h-screen p-4 md:p-8 text-black font-mono overflow-y-auto">
    <div className="max-w-4xl mx-auto border-4 border-black p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-black pb-4 mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase">GUÍA RÁPIDA DE OPERACIÓN</h1>
          <p className="text-sm font-bold">SISTEMA: RADIO UBICACIÓN MÓVIL (v3.2)</p>
        </div>
        <div className="text-left md:text-right font-bold text-[10px] md:text-xs">
          CONFIDENCIALIDAD: USO INTERNO<br />
          DOCUMENTO: OP-01-B/W
        </div>
      </div>

      <div className="space-y-4">
        {[
          { id: "01", title: "01. IDENTIFICACIÓN (CALLSIGN)", desc: "Ingrese su indicativo de radio. Es el nombre que verán los demás en el mapa. Sea breve y use mayúsculas.", tip: "Ejemplo: MOVIL-01, BASE-01, RESCATE-A." },
          { id: "02", title: "02. SELECCIÓN DE CANAL", desc: "Toque el canal deseado para entrar. Los canales con candado requieren PIN.", tip: "Si no ve su canal, use el botón (+) para crear una nueva frecuencia." },
          { id: "03", title: "03. TRANSMISIÓN (PTT)", desc: "Mantenga presionado el círculo central para hablar. Suelte para escuchar.", tip: "La barra de estado dirá \"TX_TRANSMITIENDO\" durante la modulación." },
          { id: "04", title: "04. GPS FIJO (BASE / PC)", desc: "Para unidades estáticas: Toque el icono de la MIRA, luego toque el mapa donde está ubicado.", tip: "Esto anula el GPS dinámico y fija su unidad en una coordenada exacta." },
          { id: "05", title: "05. ALERTA SOS (PRIORIDAD)", desc: "Presione el triángulo rojo en emergencias. Seleccione el tipo de incidente y envíe el SMS.", tip: "Funciona sin datos de internet. Envía sus coordenadas vía red celular tradicional." },
          { id: "06", title: "06. RESILIENCIA DE SEÑAL", desc: "Si no hay red, la app guarda sus mensajes y alertas en una cola local (Outbox).", tip: "Al recuperar señal, el sistema reintenta el envío automáticamente." },
          { id: "07", title: "07. HISTORIAL Y AUDITORÍA", desc: "Toque el panel \"LOG AUDIO\" para revisar transmisiones pasadas.", tip: "Puede reproducir el audio o descargarlo en formato .WAV como evidencia." }
        ].map((item) => (
          <div key={item.id} className="border-b border-black py-4 flex gap-4 md:gap-6 last:border-0">
            <div className="w-12 h-12 border-2 border-black flex-shrink-0 flex items-center justify-center font-bold text-xl">{item.id}</div>
            <div>
              <h3 className="font-bold text-base md:text-lg uppercase">{item.title}</h3>
              <p className="text-sm">{item.desc}</p>
              <p className="text-[10px] mt-1 font-bold italic">{item.tip}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t-4 border-black text-center font-bold text-xs md:text-sm uppercase">
        EN CASO DE FALLA TOTAL: UTILICE FRECUENCIAS ANALÓGICAS VÍA RADIO VHF/UHF
        <div className="mt-6 flex justify-center gap-4 no-print">
          <button onClick={() => window.print()} className="bg-black text-white px-6 py-2 uppercase text-xs">Imprimir PDF</button>
          <button onClick={onBack} className="border-2 border-black px-6 py-2 uppercase text-xs">Volver</button>
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENTE: MANUAL TÁCTICO (Basado en el HTML proporcionado) ---
const ManualView = ({ onBack }: { onBack: () => void }) => (
  <div className="bg-[#0e0a07] min-h-screen p-6 md:p-12 text-gray-200 font-sans relative overflow-y-auto tactical-grid">
    <div className="scanline"></div>
    <div className="max-w-5xl mx-auto pb-24 relative z-10">
      <div className="no-print fixed bottom-6 right-6 flex gap-3 z-50">
        <button onClick={() => window.print()} className="bg-white text-black px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-2xl border border-black/10">IMPRIMIR_PDF</button>
        <button onClick={onBack} className="bg-gray-800 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-gray-700 transition-all border border-white/10">VOLVER</button>
      </div>

      <header className="mb-16 animate__animated animate__fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-1 bg-orange-500"></div>
          <p className="font-mono text-orange-500 font-bold tracking-[0.4em] text-[9px] uppercase">OPERATIONAL_MANUAL_v3.2</p>
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6 uppercase text-white">GUÍA DE<br />USUARIO</h1>
        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest border-t border-white/10 pt-4">Protocolo de Comunicaciones Resilientes para Brigadas</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white w-7 h-7 flex items-center justify-center font-black text-sm uppercase">01</div>
            <h2 className="text-2xl font-black uppercase text-white tracking-tighter">Identificación</h2>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-6">
            <p className="text-xs text-gray-400 mb-4">Al iniciar, ingrese su <span className="text-white font-bold">Callsign (Indicativo)</span>. Este nombre será su identificador único en el mapa y en el registro de audio.</p>
            <div className="bg-black/40 p-3 border border-white/5 font-mono text-[10px] text-orange-500 uppercase">
              RECOMENDACIÓN: Use nombres cortos y claros.<br />Ej: "MOVIL-1", "BASE-TUC", "BRIGADA-B".
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white w-7 h-7 flex items-center justify-center font-black text-sm uppercase">02</div>
            <h2 className="text-2xl font-black uppercase text-white tracking-tighter">Frecuencias</h2>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-6">
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
          <div className="bg-orange-500 text-white w-7 h-7 flex items-center justify-center font-black text-sm uppercase">03</div>
          <h2 className="text-3xl font-black uppercase text-white tracking-tighter">Comunicaciones de Voz (PTT)</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/10 p-6 border-l-orange-500 border-l-4">
            <h4 className="font-black text-orange-500 uppercase text-[11px] mb-3 tracking-widest">TX: Transmitir</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">Presione y <span className="text-white font-bold">mantenga</span> el botón central. Espere el sonido de entrada y hable a 15cm del micrófono.</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-6 border-l-emerald-500 border-l-4">
            <h4 className="font-black text-emerald-500 uppercase text-[11px] mb-3 tracking-widest">RX: Recibir</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">El audio se reproduce en tiempo real. Un aro naranja en pantalla indica quién está modulando.</p>
          </div>
          <div className="bg-white/[0.02] border border-white/10 p-6 border-l-gray-500 border-l-4">
            <h4 className="font-black text-gray-400 uppercase text-[11px] mb-3 tracking-widest">Simplex</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">El sistema es de una vía. No puede transmitir mientras otra unidad está hablando.</p>
          </div>
        </div>
      </section>

      <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center opacity-30 gap-4">
        <p className="font-mono text-[9px] uppercase font-bold tracking-widest text-white">RADIO_UBICACION_MOVIL // DOC_ID: 001-OP-TECH</p>
        <p className="font-mono text-[9px] uppercase font-bold text-orange-500">FIN DEL PROTOCOLO</p>
      </footer>
    </div>
    <style>{`
      .tactical-grid {
        background-image: 
          linear-gradient(rgba(249, 115, 22, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(249, 115, 22, 0.03) 1px, transparent 1px);
        background-size: 40px 40px;
      }
    `}</style>
  </div>
);

// --- COMPONENTE: LANDING VIEW ---
const LandingView = ({ onEnter, onManual, onGuide }: { onEnter: () => void; onManual: () => void; onGuide: () => void }) => (
  <div className="overflow-x-hidden relative min-h-screen selection:bg-orange-500 bg-[#0e0a07]">
    <div className="scanline"></div>
    <nav className="fixed w-full top-0 left-0 z-[100] bg-[#0e0a07]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-600 rounded-sm flex items-center justify-center font-black text-white text-[10px]">R</div>
                <span className="font-bold tracking-tighter text-sm uppercase text-white">RADIO_UBICACIÓN</span>
            </div>
            <div className="flex items-center gap-6">
                <button onClick={onGuide} className="hidden md:block text-[10px] text-orange-500 hover:underline font-bold uppercase tracking-widest transition-all">GUÍA_IMPRESIÓN_B/W</button>
                <button onClick={onManual} className="hidden md:block text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-all">MANUAL_INTERACTIVO</button>
                <button onClick={onEnter} className="text-[10px] font-bold text-orange-500 border border-orange-500/30 px-4 py-1.5 hover:bg-orange-600 hover:text-white transition-all uppercase">ENTRAR_APP &gt;</button>
            </div>
        </div>
    </nav>

    <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 hero-gradient">
        <div className="max-w-5xl mx-auto text-center z-10 animate__animated animate__fadeIn">
            <span className="text-orange-500 text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mb-10 block opacity-90">INFRAESTRUCTURA DE RESPUESTA RÁPIDA</span>
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
            {[
              { id: "01", title: "Handys con interferencia", desc: "Audio digital cristalino optimizado para entornos de combate e incendios." },
              { id: "02", title: "Zonas muertas sin datos", desc: "Cuando el 5G falla, el motor conmuta a ráfagas de datos 2G para enviar SOS críticos." },
              { id: "03", title: "Caos y ruido ambiente", desc: "Monitor de audio visual integrado. Si no pudo escucharlo, el sistema lo transcribe." },
              { id: "04", title: "Análisis de incidente", desc: "Cada voz y movimiento queda registrado para auditorías críticas post-misión." }
            ].map((card) => (
              <div key={card.id} className="flex-none w-[85%] md:w-[45%] lg:w-[25%] snap-center bg-[#0a0a0a] border border-white/5 p-8 relative min-h-[280px] flex flex-col justify-end group hover:border-orange-500 transition-all">
                  <div className="absolute top-[-10px] right-[-10px] text-[100px] font-black text-white/5 leading-none pointer-events-none">{card.id}</div>
                  <h4 className="text-white font-black mb-4 uppercase text-2xl leading-[0.85] group-hover:text-orange-500 transition-colors">{card.title}</h4>
                  <p className="text-gray-500 text-sm leading-snug">{card.desc}</p>
              </div>
            ))}
        </div>
    </section>

    <footer className="py-32 bg-[#0e0a07] text-center border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-6xl md:text-8xl font-black mb-12 uppercase tracking-tighter leading-none text-white">
                Tecnología para <br/>
                <span className="text-orange-500 italic">SALVAR VIDAS.</span>
            </h2>
            <button onClick={onEnter} className="bg-white text-black px-16 py-6 font-black uppercase text-sm tracking-widest hover:bg-orange-600 hover:text-white transition-all transform hover:-translate-y-2 shadow-2xl">
                DESPLEGAR AHORA
            </button>
        </div>
    </footer>
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

  // --- SINCRONIZACIÓN EN TIEMPO REAL REFORZADA ---
  const fetchAllData = useCallback(async () => {
    if (!activeChannel || !userName) return;
    
    // 1. Latido inicial forzado para visibilidad inmediata
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

    // 2. Carga inicial de usuarios (últimas 48h para evitar perder unidades por inactividad breve)
    const { data: members } = await supabase
      .from('locations')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .gt('last_seen', new Date(Date.now() - 172800000).toISOString());
    
    if (members) {
      setTeamMembersRaw(members
        .filter(m => String(m.id).trim() !== String(DEVICE_ID).trim())
        .map(m => ({ ...m, lat: Number(m.lat), lng: Number(m.lng) }))
      );
    }

    const { data: history } = await supabase
      .from('radio_history')
      .select('*')
      .eq('channel_id', activeChannel.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (history) setRadioHistory(history);
  }, [activeChannel, userName, manualLocation]);

  useEffect(() => {
    if (!activeChannel || !userName) return;

    fetchAllData();

    // SUSCRIPCIÓN MAESTRA: Sin filtros previos de last_seen para captar todo cambio en el canal
    const channel = supabase.channel(`unit-sync-v10-${activeChannel.id}`)
      .on('postgres_changes', { event: '*', table: 'locations', schema: 'public' }, (payload: any) => {
        const target = payload.new || payload.old;
        if (!target) return;
        
        // 1. Ignorarse a sí mismo
        if (String(target.id).trim() === String(DEVICE_ID).trim()) return;
        
        // 2. Validar canal (IMPORTANTE: El payload a veces no trae el channel_id en DELETE si no hay replica identity full)
        if (payload.eventType !== 'DELETE' && target.channel_id && String(target.channel_id).trim() !== String(activeChannel.id).trim()) return;

        setTeamMembersRaw(prev => {
          if (payload.eventType === 'DELETE') {
            return prev.filter(m => String(m.id).trim() !== String(target.id).trim());
          }
          
          const formatted = { 
            ...target, 
            lat: target.lat ? Number(target.lat) : undefined, 
            lng: target.lng ? Number(target.lng) : undefined 
          } as TeamMember;

          // Si el registro no tiene posición válida en este update, intentamos mantener la anterior
          const idx = prev.findIndex(m => String(m.id).trim() === String(target.id).trim());
          if (idx === -1) {
            return formatted.lat ? [...prev, formatted] : prev;
          }
          
          const next = [...prev];
          next[idx] = { 
            ...next[idx], 
            ...formatted, 
            lat: formatted.lat ?? next[idx].lat, 
            lng: formatted.lng ?? next[idx].lng 
          };
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

  if (currentView === 'guide') return <GuideView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'manual') return <ManualView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'landing') return <LandingView onEnter={() => setCurrentView('app')} onManual={() => setCurrentView('manual')} onGuide={() => setCurrentView('guide')} />;

  if (!userName) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
      <div className="scanline"></div>
      <div className="w-full max-w-sm bg-gray-900 border border-orange-500/30 p-8 shadow-2xl relative z-10">
        <h1 className="text-orange-500 font-black text-center mb-8 tracking-widest uppercase">Identificación Radio</h1>
        <input autoFocus type="text" value={tempName} onChange={e => setTempName(e.target.value.toUpperCase())} 
          onKeyDown={e => e.key === 'Enter' && tempName.length >= 3 && (localStorage.setItem('user_callsign', tempName), setUserName(tempName))}
          placeholder="CALLSIGN (EJ: MOVIL-1)" className="w-full bg-black border border-gray-800 p-4 text-orange-500 text-center font-bold mb-4 outline-none focus:border-orange-500 uppercase"
        />
        <button onClick={() => { if(tempName.length >= 3) { localStorage.setItem('user_callsign', tempName); setUserName(tempName); }}} className="w-full bg-orange-600 text-white font-black py-4 hover:bg-orange-500 transition-colors uppercase">Entrar en servicio</button>
      </div>
    </div>
  );

  if (!activeChannel) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
       <div className="scanline"></div>
       <div className="w-full max-w-md relative z-10">
          <button onClick={() => setCurrentView('landing')} className="mb-4 text-gray-500 flex items-center gap-2 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest"><ChevronLeft size={14} /> Volver</button>
          <h2 className="text-orange-500 font-bold uppercase text-center mb-8 tracking-widest">Seleccionar Canal</h2>
          <ChannelSelector onSelect={ch => setActiveChannel(ch)} />
       </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black overflow-hidden relative text-white">
      <div className="scanline"></div>
      
      {/* SECCIÓN PRINCIPAL: MAPA */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
         {/* Navegación Móvil (Tabs) */}
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

            {/* OVERLAYS MÓVILES */}
            <div className={`md:hidden absolute inset-0 z-[1002] bg-gray-950 transition-transform ${mobileTab === 'team' ? 'translate-x-0' : 'translate-x-full'}`}>
               <div className="p-2 border-b border-white/10 flex justify-between items-center bg-black">
                  <span className="text-[10px] font-black uppercase text-orange-500 px-2 tracking-widest">Unidades Activas</span>
                  <button onClick={() => setMobileTab('map')} className="p-2 text-gray-400"><X size={20} /></button>
               </div>
               <TeamList members={teamMembers} />
            </div>
            
            <div className={`md:hidden absolute inset-0 z-[1002] bg-gray-950 transition-transform ${mobileTab === 'history' ? 'translate-x-0' : 'translate-x-full'}`}>
               <div className="p-2 border-b border-white/10 flex justify-between items-center bg-black">
                  <span className="text-[10px] font-black uppercase text-orange-500 px-2 tracking-widest">Registro de Audio</span>
                  <button onClick={() => setMobileTab('map')} className="p-2 text-gray-400"><X size={20} /></button>
               </div>
               <HistoryPanel history={radioHistory} activeChannel={activeChannel} />
            </div>
         </div>

         {/* PANEL LATERAL ESCRITORIO (PC) */}
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

      {/* CONTROL DE RADIO */}
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
