
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
import { 
  BookOpen, Printer, Home, Radio as RadioIcon, CloudUpload, CloudOff, 
  ChevronLeft, MapPin, Activity, AlertTriangle, Send, Users, 
  Clock, Hash, Volume2, Play, Download, ShieldCheck, List, X
} from 'lucide-react';

const DEVICE_ID = getDeviceId();

// --- VISTA DEL MANUAL TÁCTICO ---
const ManualView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="bg-[#0e0a07] min-h-screen p-6 md:p-12 text-gray-200 selection:bg-orange-500 font-sans relative overflow-y-auto">
      <div className="scanline"></div>
      <div className="max-w-5xl mx-auto pb-24 relative z-10">
        <div className="no-print fixed bottom-6 right-6 flex gap-3 z-50">
            <button onClick={() => window.print()} className="bg-white text-black px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-2xl border border-black/10">IMPRIMIR_PDF</button>
            <button onClick={onBack} className="bg-gray-800 text-white px-5 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all border border-white/10 flex items-center gap-2">
                <ChevronLeft size={14} /> VOLVER
            </button>
        </div>

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
            <div className="flex items-center gap-3 text-white">
              <span className="bg-orange-500 text-white w-8 h-8 flex items-center justify-center font-black text-sm">01</span>
              <h2 className="text-2xl font-black uppercase">Identificación</h2>
            </div>
            <div className="bg-white/5 border border-white/10 p-6">
              <p className="text-xs text-gray-400 mb-4">Al iniciar, ingrese su <span className="text-white font-bold">Callsign (Indicativo)</span>. Este nombre será su identificador único en el mapa y en el registro de audio.</p>
              <div className="bg-black/40 p-3 border border-white/5 font-mono text-[10px] text-orange-500">
                RECOMENDACIÓN: Use nombres cortos y claros.<br />Ej: "MOVIL-1", "BASE-TUC", "BRIGADA-B".
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <span className="bg-orange-500 text-white w-8 h-8 flex items-center justify-center font-black text-sm">02</span>
              <h2 className="text-2xl font-black uppercase">Frecuencias</h2>
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
          <div className="flex items-center gap-3 text-white">
            <span className="bg-orange-500 text-white w-8 h-8 flex items-center justify-center font-black text-sm">03</span>
            <h2 className="text-3xl font-black uppercase">Voz y PTT</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 border-l-4 border-l-orange-500">
              <h4 className="font-black text-orange-500 uppercase text-[11px] mb-3">TX: Transmitir</h4>
              <p className="text-[11px] text-gray-400">Mantenga el botón central. Espere el tono y hable claro a 15cm del mic.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 border-l-4 border-l-emerald-500">
              <h4 className="font-black text-emerald-500 uppercase text-[11px] mb-3">RX: Recibir</h4>
              <p className="text-[11px] text-gray-400">El audio se reproduce en tiempo real. Un aro naranja indica quién habla.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 border-l-4 border-l-gray-500">
              <h4 className="font-black text-gray-400 uppercase text-[11px] mb-3">Simplex</h4>
              <p className="text-[11px] text-gray-500">No puede transmitir mientras otra unidad está modulando.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- VISTA DE GUÍA RÁPIDA (B/W) ---
const GuideView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="bg-white min-h-screen p-8 text-black font-mono relative overflow-y-auto">
      <div className="max-w-4xl mx-auto pb-20 relative z-10">
        <button onClick={onBack} className="no-print fixed bottom-6 right-6 bg-black text-white px-8 py-3 uppercase font-bold text-xs shadow-xl">VOLVER</button>
        
        <div className="border-4 border-black p-6 mb-12 flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-black uppercase leading-none">GUÍA RÁPIDA DE OPERACIÓN</h1>
                <p className="text-sm font-bold mt-2">SISTEMA: RADIO UBICACIÓN MÓVIL (v3.2)</p>
            </div>
            <div className="text-right font-bold text-[10px] hidden sm:block">
                PROTOCOLO: OP-01-B/W<br/>ESTADO: CRÍTICO
            </div>
        </div>

        <div className="divide-y-2 divide-black">
          {[
            { id: "01", title: "IDENTIFICACIÓN (CALLSIGN)", desc: "Ingrese su indicativo de radio. Es el nombre que verán los demás en el mapa." },
            { id: "02", title: "SELECCIÓN DE CANAL", desc: "Toque el canal deseado para entrar. Los canales con candado requieren PIN." },
            { id: "03", title: "TRANSMISIÓN (PTT)", desc: "Mantenga presionado el círculo central para hablar. Suelte para escuchar." },
            { id: "04", title: "GPS FIJO (BASE / PC)", desc: "Toque el icono de la MIRA, luego toque el mapa para fijar su posición exacta." },
            { id: "05", title: "ALERTA SOS (PRIORIDAD)", desc: "Presione el triángulo rojo en emergencias. Seleccione el incidente y envíe el SMS." },
          ].map(item => (
            <div key={item.id} className="py-8 flex gap-8">
              <div className="w-14 h-14 border-4 border-black flex items-center justify-center font-black text-2xl flex-shrink-0">{item.id}</div>
              <div className="flex-1">
                <h3 className="font-black text-xl uppercase mb-2">{item.title}</h3>
                <p className="text-sm leading-tight font-bold">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t-4 border-black text-center font-black text-lg uppercase">
            EN CASO DE FALLA: USE RADIO ANALÓGICA VHF/UHF
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE LANDING COMPLETO (RESTAURADO 100%) ---
const LandingView = ({ onEnter, onManual, onGuide }: { onEnter: () => void; onManual: () => void; onGuide: () => void }) => {
  return (
    <div className="overflow-x-hidden relative min-h-screen selection:bg-orange-500 bg-[#0e0a07]">
      <div className="scanline"></div>

      {/* Navegación Superior Derecha */}
      <nav className="fixed w-full top-0 left-0 z-[100] bg-[#0e0a07]/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-600 rounded-sm flex items-center justify-center font-black text-white text-[10px]">R</div>
                  <span className="font-bold tracking-tighter text-sm uppercase text-white">RADIO_UBICACIÓN</span>
              </div>
              <div className="flex items-center gap-6">
                  <button onClick={onGuide} className="hidden md:block text-[10px] text-orange-500 hover:underline font-bold uppercase tracking-widest transition-all">GUÍA_IMPRESIÓN_B/W</button>
                  <button onClick={onManual} className="hidden md:block text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-all">MANUAL_INTERACTIVO</button>
                  <button onClick={onEnter} className="text-[10px] font-bold text-orange-500 border border-orange-500/30 px-4 py-1.5 hover:bg-orange-600 hover:text-white transition-all uppercase">ENTRAR_APP ></button>
              </div>
          </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 hero-gradient">
          <div className="max-w-5xl mx-auto text-center z-10 animate__animated animate__fadeIn">
              <span className="text-[#f97316] text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mb-10 block opacity-90">INFRAESTRUCTURA DE RESPUESTA RÁPIDA</span>
              <h1 className="hero-title text-7xl md:text-9xl lg:text-[150px] text-white uppercase mb-12 leading-[0.82] font-black tracking-tighter">
                  RADIO<br/>UBICACIÓN<br/>MÓVIL
              </h1>
              <p className="text-white text-xl md:text-3xl font-bold tracking-tight uppercase mb-16 opacity-90 leading-tight">VOZ Y GPS CUANDO LOS DATOS FALLAN.</p>
              <div className="flex justify-center">
                  <button onClick={onEnter} className="btn-ptt px-16 py-6 rounded-sm font-black text-sm md:text-lg tracking-[0.15em] uppercase text-white shadow-2xl transition-all">ENTRAR EN SERVICIO</button>
              </div>
          </div>
      </section>

      {/* EL DESAFÍO DEL TERRENO (CARRUSEL) */}
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
                  <p className="text-gray-500 text-sm leading-snug">Cada voz, cada movimiento. Todo el despliegue queda logueado para auditorías críticas post-misión.</p>
              </div>
          </div>
          
          <div className="md:hidden text-center mt-4">
              <p className="text-[8px] text-gray-600 uppercase tracking-widest animate-pulse font-bold">Deslizar para escanear desafíos</p>
          </div>
      </section>

      {/* EQUIPAMIENTO DIGITAL (TARJETAS) */}
      <section className="py-32 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-24">
                  <span className="text-orange-500 text-[11px] font-black tracking-[0.4em] uppercase">EQUIPAMIENTO DIGITAL</span>
                  <h2 className="text-5xl md:text-6xl font-black mt-2 tracking-tighter uppercase leading-none text-white">Tecnología de<br/>Misión Crítica</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">Radio PTT Profesional</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Audio nítido optimizado para voz. Comunicación simplex que emula un Handy pero con claridad digital.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">GPS en Tiempo Real</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Visualización cartográfica de todas las unidades activas. Cálculo de distancia y telemetría de precisión.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">Protocolo SMS 2G</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Exclusivo sistema de alertas vía SMS cuando fallan los datos móviles. Envío de coordenadas críticas.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">Log de Auditoría</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Historial completo de transmisiones con audio descargable. Fundamental para el análisis post-incidente.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">Canales por Equipo</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Cifrado de canales privados para evitar filtraciones. Cada equipo opera en su propia frecuencia.</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-sm hover:border-orange-500 transition-all">
                      <h3 className="text-orange-500 font-black mb-4 uppercase text-xl">Modo Táctico Fijo</h3>
                      <p className="text-gray-400 leading-relaxed text-sm">Permite establecer coordenadas manuales exactas para Puestos de Comando sin depender del GPS dinámico.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* FOOTER */}
      <footer className="py-32 bg-[#0e0a07] text-center border-t border-white/5 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 z-10 relative">
              <h2 className="text-6xl md:text-8xl font-black mb-12 uppercase tracking-tighter leading-none text-white">
                  La tecnología al servicio <br/>
                  <span className="text-orange-500 italic">DE LA VIDA.</span>
              </h2>
              <p className="text-gray-400 mb-16 italic text-lg leading-relaxed max-w-2xl mx-auto">
                  "Esta aplicación es gratuita para todas las entidades oficiales y grupos de respuesta. Nuestro compromiso es que ningún rescatista se quede incomunicado."
              </p>
              
              <div className="flex justify-center mb-24">
                  <button onClick={onEnter} className="bg-white text-black px-16 py-6 font-black uppercase text-sm tracking-widest hover:bg-orange-600 hover:text-white transition-all transform hover:-translate-y-2 shadow-2xl">
                      DESPLEGAR AHORA
                  </button>
              </div>

              <div className="opacity-20 flex flex-col items-center gap-4 border-t border-white/10 pt-12">
                  <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-bold">RADIO_UBICACION_MOVIL // MISSION_CRITICAL_v3.2_STABLE</p>
                  <p className="text-[8px] text-gray-600 uppercase">Protocolo de Respuesta Rápida para Brigadas de Emergencia</p>
              </div>
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

  const handleTalkStart = () => { if (radioRef.current) { setIsTalking(true); radioRef.current.startTransmission(); } };
  const handleTalkEnd = () => { if (radioRef.current) { radioRef.current.stopTransmission(); setIsTalking(false); } };

  // Router de Vistas Interno (No requiere archivos físicos .html)
  if (currentView === 'manual') return <ManualView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'guia') return <GuideView onBack={() => setCurrentView('landing')} />;
  if (currentView === 'landing') return (
    <LandingView 
      onEnter={() => setCurrentView('app')} 
      onManual={() => setCurrentView('manual')} 
      onGuide={() => setCurrentView('guia')} 
    />
  );

  if (!userName) return (
    <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono relative overflow-hidden">
      <div className="scanline"></div>
      <div className="w-full max-w-sm space-y-6 bg-gray-950 border border-orange-500/20 p-8 rounded shadow-2xl relative z-10">
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
    <div className="h-[100dvh] w-screen bg-black flex items-center justify-center p-6 font-mono text-center relative">
       <div className="scanline"></div>
       <div className="w-full max-w-md space-y-6 z-10">
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
