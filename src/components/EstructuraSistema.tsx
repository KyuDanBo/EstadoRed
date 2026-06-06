import React, { useState } from 'react';
import { 
  Network, 
  BrainCircuit, 
  Users, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Unlock, 
  MapPin, 
  Layers, 
  Database, 
  Zap, 
  Clock, 
  UserCheck, 
  Terminal, 
  Vote, 
  AlertTriangle,
  RefreshCw,
  Cpu,
  Bookmark
} from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  formula: string;
  icon: React.ReactNode;
  color: string;
  chipClass: string;
  bgLight: string;
  borderClass: string;
  desc: string;
  properties: { key: string; val: string }[];
  bolivianContext: {
    title: string;
    historicalLegacy: string;
    systemOperation: string;
  };
}

export default function EstructuraSistema({ userProfile }: { userProfile: any }) {
  const [activeEntityId, setActiveEntityId] = useState<string>('n_i');
  const [simulatorStep, setSimulatorStep] = useState<number>(1);
  const [internalVotes, setInternalVotes] = useState<number>(3);
  const [simulationProposal, setSimulationProposal] = useState<string>(
    'Sanción automatizada de sobreprecios en el desayuno escolar con auditoría comunitaria directa.'
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [execStatus, setExecStatus] = useState<'working' | 'frozen' | 'success'>('working');

  // Extraction of user triada values
  const userDepto = userProfile?.triada?.territorio || userProfile?.depto || 'La Paz';
  const userRubro = userProfile?.triada?.ocupacion || userProfile?.rubro || 'Gestores culturales';
  const userIdeologia = userProfile?.triada?.ideologia || userProfile?.ideologia || 'Comunitario';

  const entities: Entity[] = [
    {
      id: 'n_i',
      name: 'Nodo Individual (N_i)',
      formula: 'N_i = { ID_ID, estadoRed, ubicacion, NodosColectivos }',
      icon: <UserCheck className="w-5 h-5" />,
      color: 'bg-amber-600',
      chipClass: 'bg-amber-500/10 border-amber-500/25 text-amber-800',
      bgLight: 'bg-amber-500/5',
      borderClass: 'border-amber-500/30',
      desc: 'Elemento atómico del grafo desprovisto de intermediación partidaria. Emite propuestas, asiste a asambleas virtuales y ejerce voto líquido.',
      properties: [
        { key: 'Seudónimo Protegido', val: 'Un alias aleatorio (p. ej., Llama Pragmática) resguarda la privacidad frente a revanchismos.' },
        { key: 'Triplicidad Identitaria', val: 'Restricción de filiación estricta a exactamente 3 Nodos Colectivos (Territorio, Ocupación, Ideología).' },
        { key: 'Anclaje de Seguridad', val: 'Firma con Ciudadanía Digital para garantizar un ciudadano equivale a un voto real, evitando ataques Sybil.' }
      ],
      bolivianContext: {
        title: 'Ciudadanía Plurinacional Digital',
        historicalLegacy: 'Inspirado en la libre transitabilidad recíproca similar a los acuerdos del MERCOSUR, donde el ciudadano puede cambiar de filiaciones temáticas sin trabas estatales burocráticas.',
        systemOperation: 'Tu nodo personal conecta con la gacetilla de tu junta de vecinos locale, tu sindicato de ocupación y tu matriz doctrinal predilecta para articular tu fuerza civil.'
      }
    },
    {
      id: 'n_c',
      name: 'Nodo Colectivo (N_c)',
      formula: 'N_c = { alcanceTerritorial, estatutoLocal, subgrafos }',
      icon: <Network className="w-5 h-5" />,
      color: 'bg-skyblue',
      chipClass: 'bg-skyblue/10 border-[#38bdf8]/25 text-skyblue-dark',
      bgLight: 'bg-sky-500/5',
      borderClass: 'border-[#38bdf8]/30',
      desc: 'Asociaciones y sindicatos interconectados de carácter nacional o regional, encargados de incubar las políticas públicas iniciales en aislamiento.',
      properties: [
        { key: 'Alcance Territorial (T)', val: 'Geometría geodésica delimitada que abarca desde un barrio o comunidad hasta toda la nación.' },
        { key: 'Autonomía de Estatuto', val: 'Cada asamblea dicta sus pautas de deliberabilidad y validación de quórum de forma autogestionada.' },
        { key: 'Incubadora Cerrada', val: 'Las propuestas son invisibles para agentes exteriores durante la Fase 1 de aislamiento investigativo.' }
      ],
      bolivianContext: {
        title: 'Articulación Orgánica de Bases',
        historicalLegacy: 'Mapea de forma directa las organizaciones matrices de la historia boliviana: desde el asambleísmo andino y el sindicato campesino agrario hasta los movimientos gremiales.',
        systemOperation: 'Sirve como incubadora de normativas técnicas de tu rubro, apartadas del odio partidario que contamina los debates antes de madurar.'
      }
    },
    {
      id: 'n_f',
      name: 'Nodo Físico (N_f)',
      formula: 'N_f = { N_c, G_coor, A_activos, reputacionFisica }',
      icon: <Layers className="w-5 h-5" />,
      color: 'bg-sandbrown',
      chipClass: 'bg-sandbrown/10 border-[#A06A42]/25 text-sandbrown-dark',
      bgLight: 'bg-[#A06A42]/5',
      borderClass: 'border-[#A06A42]/30',
      desc: 'La materialización presencial del EstadoRed. Sedes sociales que actúan como "interfaces" táctiles de soberanía en el territorio para debates comunales.',
      properties: [
        { key: 'Oráculo de Identidad', val: 'La asamblea física certifica presencialmente a nuevos soberanos previniendo perfiles falsos o bots.' },
        { key: 'Kiosco de Inclusión', val: 'Terminal comunitario robusto para adultos mayores o ciudadanos sin acceso a conectividad móvil.' },
        { key: 'Voto Agrario de Bloque', val: 'Venta de decisión PKI colectiva donde la asamblea presencial se computa unificada por usos y costumbres.' }
      ],
      bolivianContext: {
        title: 'La Presencialidad Comunitaria Híbrida',
        historicalLegacy: 'Resuena directamente con tres modelos de Bolivia: 1) Territorial (Juntas vecinales descendientes de la FEJUVE El Alto), 2) Ocupacional (Oficinas sindicales de mercaderes minoristas) y 3) Ideológico (Casas autogestionarias como La Virgen de los Deseos de Mujeres Creando).',
        systemOperation: 'Las decisiones virtuales se anclan a los tinglados deportivos barriales o mercados, asegurando que el tejido digital no disuelva la vecindad o el mandar obedeciendo.'
      }
    },
    {
      id: 'r_t',
      name: 'Red Territorial (R_t)',
      formula: 'R_t = { N_c en alcance | N_c.Alcance ⊆ T }',
      icon: <Database className="w-5 h-5" />,
      color: 'bg-palmgreen',
      chipClass: 'bg-palmgreen/10 border-palmgreen/25 text-palmgreen-dark',
      bgLight: 'bg-emerald-500/5',
      borderClass: 'border-palmgreen/30',
      desc: 'El tejido integrado que unifica a todos los Nodos Colectivos dentro de un límite político-administrativo (p. ej., Municipio, Distrito o Departamento).',
      properties: [
        { key: 'Gobernanza Horizontal', val: 'No responde a una alcaldía partidaria piramidal, sino al tapiz de debates técnicos cruzados.' },
        { key: 'Independencia Financiera', val: 'Administra presupuestos de coparticipación tributaria real y los distribuye de manera descentralizada.' },
        { key: 'Petición en Firme PKI', val: 'Si se junta el quórum, impone por Ley N° 341 auditorías transparentes inmediatas sobre el SIGEP estatal.' }
      ],
      bolivianContext: {
        title: 'Autonomías Auténticas de Distribución',
        historicalLegacy: 'Regido bajo la Ley N° 031 de Autonomías y Descentralización de Bolivia. Reemplaza el centralismo estatal heredado por redes autónomas locales de decisión presupuestaria.',
        systemOperation: 'Es el muro de tu municipio real (como El Alto). Aquí es donde propones el presupuesto de obras, y los vecinos ejercen control social directo.'
      }
    }
  ];

  const activeEntity = entities.find(e => e.id === activeEntityId) || entities[0];

  const handleSimulateConsensus = () => {
    if (internalVotes < 10) {
      setInternalVotes(prev => prev + 1);
    } else {
      setSimulatorStep(2);
    }
  };

  const resetSimulation = () => {
    setSimulatorStep(1);
    setInternalVotes(3);
    setExecStatus('working');
    setIsSimulating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* SECCIÓN CABECERA */}
      <div className="bg-white/95 border border-[#ECE8DE] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden gap-6">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#A06A42]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-[#A06A42] uppercase bg-[#A06A42]/10 border border-[#A06A42]/20 px-3 py-1 rounded-full">
              Soberanía Colectiva
            </span>
          </div>
          <h2 className="font-serif font-black text-xl md:text-2xl text-charcoal tracking-tight">
            Ontología del Grafo y Flujo de Trabajo
          </h2>
          <p className="text-[11px] text-charcoal/50 max-w-2xl font-serif">
            Explora las relaciones matemáticas y sociológicas que constituyen el EstadoRed de Bolivia. Comprende la interacción entre asambleas virtuales, sedes físicas e incubadoras de consensos libres de polarización.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 bg-[#FAF9F5] border border-[#ECE8DE] p-1 rounded-2xl">
          <div className="px-4 py-2 text-center">
            <span className="block text-[8px] uppercase tracking-wider font-bold text-charcoal/40 font-mono">Regla Clave</span>
            <span className="text-xs font-black text-sandbrown">Triplicidad Fija</span>
          </div>
          <div className="px-4 py-2 text-center border-l border-[#ECE8DE]">
            <span className="block text-[8px] uppercase tracking-wider font-bold text-charcoal/40 font-mono">Cadencia Temporal</span>
            <span className="text-xs font-black text-palmgreen">Ciclo 6 Semanas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* PARTE 1: NAVEGADOR ONTOLÓGICO DE LA RED */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-[#ECE8DE] rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="space-y-4">
            <div>
              <h3 className="font-serif font-black text-charcoal text-sm uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-sandbrown" />
                1. Ontología del Grafo Rizomático
              </h3>
              <p className="text-[11px] text-charcoal/50 leading-normal mt-1">
                La plataforma no atomiza al ciudadano; enlaza su identidad con asambleas cerradas ($N_c$) y sedes físicas ($N_f$) para una gobernanza híbrida y robusta.
              </p>
            </div>

            {/* List Selector buttons */}
            <div className="space-y-2.5">
              {entities.map(e => {
                const isActive = e.id === activeEntityId;
                return (
                  <button
                    key={e.id}
                    onClick={() => setActiveEntityId(e.id)}
                    className={`w-full flex items-center justify-between p-3.5 text-left rounded-2xl border transition-all cursor-pointer ${
                      isActive 
                        ? `${e.bgLight} ${e.borderClass} border-l-4 font-semibold shadow-inner` 
                        : 'bg-[#FAF9F5]/40 border-[#ECE8DE] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl text-white ${isActive ? e.color : 'bg-charcoal/30'}`}>
                        {e.icon}
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-charcoal leading-none">{e.name}</h4>
                        <span className="text-[8.5px] font-mono text-charcoal/40 font-semibold block mt-1">{e.formula}</span>
                      </div>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-1 text-charcoal' : 'text-charcoal/20'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regla de Triplicidad Box */}
          <div className="mt-6 bg-[#FAF9F5] border border-[#ECE8DE] p-4 rounded-2xl space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#2D5B3A]/5 rounded-full blur-lg"></div>
            <div className="flex items-center gap-1.5 text-palmgreen-dark">
              <Shield className="w-4 h-4" />
              <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono">Regla de la Triplicidad Identitaria</h4>
            </div>
            <p className="text-[10px] text-charcoal/70 leading-relaxed">
              Para mitigar la sobrecarga cognitiva y la dispersión, tu Nodo Individual (<span className="font-bold text-[#A06A42]">Tú</span>) se compone de exactamente <b>tres conexiones fijas</b>:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-[9px] font-bold">
              <div className="bg-[#2D5B3A]/5 border border-[#2D5B3A]/15 py-1.5 px-0.5 rounded-xl text-palmgreen-dark truncate" title={userDepto}>
                📍 {userDepto}
              </div>
              <div className="bg-[#8E5831]/5 border border-[#8E5831]/15 py-1.5 px-0.5 rounded-xl text-sandbrown-dark truncate" title={userRubro}>
                💼 {userRubro}
              </div>
              <div className="bg-[#1F4E67]/5 border border-[#1F4E67]/15 py-1.5 px-0.5 rounded-xl text-sky-900 truncate" title={userIdeologia}>
                ⚖️ {userIdeologia}
              </div>
            </div>
          </div>
        </div>

        {/* PARTE 2: DIÁLOGOS DE VISUALIZACIÓN / FICHA TÉCNICA */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-[#ECE8DE] rounded-3xl p-6 shadow-sm relative">
          
          <div className="space-y-6">
            {/* Header del Nodo Detallado */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#ECE8DE] pb-4">
              <div>
                <span className={`text-[8.5px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded border ${activeEntity.chipClass}`}>
                  Propiedades de Entidad Científica
                </span>
                <h3 className="font-serif font-black text-charcoal text-base md:text-lg mt-1.5">{activeEntity.name}</h3>
                <p className="text-[10.5px] font-mono text-charcoal/50 font-bold block mt-1 bg-charcoal/5 px-2 py-1 rounded w-fit">
                  {activeEntity.formula}
                </p>
              </div>

              <div className={`p-3 rounded-2xl text-white ${activeEntity.color} shadow-sm hidden sm:block shrink-0 animate-pulse`}>
                {activeEntity.icon}
              </div>
            </div>

            {/* Descripción */}
            <p className="text-xs text-charcoal/80 leading-relaxed font-serif bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#ECE8DE]/60 shadow-inner">
              "{activeEntity.desc}"
            </p>

            {/* Atributos / Variables Algebraicas */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">Atributos y Relaciones Lógicas:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeEntity.properties.map((p, idx) => (
                  <div key={idx} className="bg-white border border-[#ECE8DE] rounded-2xl p-3 shadow-xs space-y-1 hover:border-sandbrown transition-all duration-300">
                    <p className="text-[10px] font-bold text-charcoal/80 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 bg-[#A06A42] rounded-full"></span>
                      {p.key}
                    </p>
                    <p className="text-[10px] text-charcoal/60 leading-relaxed pt-1.5 border-t border-[#ECE8DE]/40">
                      {p.val}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Adaptación al Territorio Boliviano */}
            <div className="border-t border-[#ECE8DE] pt-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Adaptación Sociológica en Bolivia
              </h4>
              
              <div className="bg-sandbrown/5 border border-sandbrown/15 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-sandbrown" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-sandbrown-dark leading-none">
                    {activeEntity.bolivianContext.title}
                  </span>
                </div>
                
                <div className="space-y-2 text-[10.5px] leading-relaxed text-charcoal/80 font-serif">
                  <p>
                    <strong className="text-charcoal/90">Legado Histórico:</strong> {activeEntity.bolivianContext.historicalLegacy}
                  </p>
                  <p className="pt-2 border-t border-[#ECE8DE]/40">
                    <strong className="text-charcoal/90">Funcionamiento Sistémico:</strong> {activeEntity.bolivianContext.systemOperation}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <p className="text-center text-[9px] font-mono text-charcoal/30 uppercase mt-4">
            ESTADORED BOLIVIA • DESARROLLADO BAJO LEYES N° 164, 1080 Y 341
          </p>
        </div>

      </div>

      {/* PARTE 3: SIMULADOR DE FLUJO DE TRABAJO (PROPOSAL ROUTING SANBOX) */}
      <div className="bg-white border border-[#ECE8DE] rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-serif font-black text-charcoal text-base uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-palmgreen" />
              2. Simulador de Flojo Sincrónico Multidimensional
            </h3>
            <p className="text-[11px] text-charcoal/50 leading-normal mt-1">
              Las ideas atraviesan fases lógicas inflexibles de incubación y desbloqueo de apoyo cruzado geolocalizado antes de sancionarse como contratos digitales obligatorios.
            </p>
          </div>
          
          <button
            onClick={resetSimulation}
            className="stone-btn px-4.5 py-2.5 bg-[#FAF9F5] border border-[#ECE8DE] text-charcoal/70 hover:bg-warmgray/35 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 rounded-xl transition cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recomenzar Simulación
          </button>
        </div>

        {/* STEPPER VISUAL */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[
            { step: 1, name: 'Fase 1: Incubación', status: 'Isolated', badge: 'Enfoque Técnico' },
            { step: 2, name: 'Fase 2: Promoción', status: 'Red Municipal', badge: 'Apoyo Cruzado' },
            { step: 3, name: 'Fase 3: Ciclo 6 Semanas', status: 'Temporal Sync', badge: 'Convergencia' },
            { step: 4, name: 'Fase 4: Ejecución', status: 'Contrato Digital', badge: 'Garantía Inflexible' }
          ].map(s => {
            const isCompleted = s.step < simulatorStep;
            const isActive = s.step === simulatorStep;
            return (
              <div 
                key={s.step} 
                className={`border rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? 'bg-white border-sandbrown shadow-md ring-1 ring-sandbrown/40' 
                    : isCompleted 
                      ? 'bg-[#FAF9F5] border-palmgreen/40 opacity-80' 
                      : 'bg-[#FAF9F5]/40 border-[#ECE8DE] opacity-50'
                }`}
              >
                <div className="absolute top-1 right-2 font-mono text-[9px] font-bold text-charcoal/20">
                  #{s.step}
                </div>
                <div>
                  <span className={`text-[7px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded leading-none ${
                    isActive 
                      ? 'bg-sandbrown/10 text-sandbrown-dark' 
                      : isCompleted 
                        ? 'bg-palmgreen/10 text-palmgreen-dark' 
                        : 'bg-charcoal/5 text-charcoal/40'
                  }`}>
                    {s.status}
                  </span>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-charcoal block mt-2 leading-tight">
                    {s.name}
                  </h4>
                </div>
                <p className="text-[8.5px] text-charcoal/50 mt-1 font-bold tracking-wider uppercase leading-none">
                  {s.badge}
                </p>
              </div>
            );
          })}
        </div>

        {/* PANEL DE ACUERDOS DE LA PROPUESTA EN SIMULACIÓN */}
        <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold text-charcoal/40 uppercase tracking-widest">Ejemplo de Solicitud de Trámites:</label>
              <textarea
                value={simulationProposal}
                onChange={(e) => setSimulationProposal(e.target.value)}
                disabled={simulatorStep !== 1}
                className="w-full bg-white border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal font-serif focus:outline-none focus:border-sandbrown leading-relaxed resize-none shadow-sm h-16 disabled:opacity-85"
                placeholder="Escribe tu propuesta comunitaria para simular..."
              />
            </div>

            {/* CONTENT OF STEP 1 */}
            {simulatorStep === 1 && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-amber-800 text-[10.5px] leading-relaxed">
                  <Lock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Aislamiento Técnico Activado:</span> Esta propuesta se incuba exclusivamente dentro del <strong className="text-sandbrown-dark">{userRubro} (N_c)</strong>. Nadie de otros sectores de {userDepto} ni del país puede insultar ni polarizar el texto. Se debate pragmáticamente.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#ECE8DE] p-3 rounded-xl">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-charcoal/40 font-bold block">Quórum Consensuado de Bases</span>
                    <span className="text-xs font-black text-charcoal">{internalVotes} de 10 Votos Digitales (PKI)</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleSimulateConsensus}
                      className="stone-btn flex-1 sm:flex-none px-4 py-2 bg-sandbrown hover:bg-sandbrown-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" /> Firmar Voto Digital
                    </button>
                    {internalVotes >= 10 && (
                      <button
                        onClick={() => setSimulatorStep(2)}
                        className="stone-btn px-4 py-2 bg-palmgreen text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        Promover a Red <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT OF STEP 2 */}
            {simulatorStep === 2 && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-emerald-800 text-[10.5px] leading-relaxed">
                  <Unlock className="w-4 h-4 shrink-0 text-palmgreen-dark mt-0.5" />
                  <div>
                    <span className="font-bold">Desbloqueo Horizontal de Red:</span> Al alcanzar el consenso de bases, el sistema de manera automatizada escaló la propuesta al feed de la <strong className="text-emerald-700">Red Municipal de {userDepto} (R_t)</strong>. Ahora es pública y visible para todo vecino, sindicato y comerciante local.
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-palmgreen/50 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-black uppercase text-palmgreen-dark tracking-wide">Apoyo Cruzado Vecinal</span>
                    <span className="text-[10px] font-bold text-charcoal">Residente Verificación: Activo 📍</span>
                  </div>
                  <p className="text-[10px] text-charcoal/60 leading-normal mb-1.5 font-serif italic">
                    Vecinos de otras zonas colaboran aportando respaldos, firmados bajo el candado geoespacial (Soberanos que no residen en {userDepto} tienen bloqueado el voto).
                  </p>
                  
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <div className="h-2 bg-palmgreen/15 border border-[#ECE8DE] rounded-full overflow-hidden flex-1 mr-3">
                      <div className="h-full bg-palmgreen animate-[pulse_2s_infinite]" style={{ width: '85%' }}></div>
                    </div>
                    <span className="font-mono font-bold text-palmgreen-dark shrink-0">85% Respaldos Vecinales</span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setSimulatorStep(3)}
                      className="stone-btn px-4.5 py-2 bg-palmgreen hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
                    >
                      Avanzar a Sincronización Cíclica <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT OF STEP 3 */}
            {simulatorStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-300 bg-white border border-[#ECE8DE] p-4 rounded-xl">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-charcoal/65 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-sandbrown" /> Cadencia Temporal de Sincronización de Seis Semanas
                  </h4>
                  <p className="text-[10px] text-charcoal/50 leading-relaxed mt-1">
                    Evitamos asambleas dispersas y prolongadas conectando todas las deliberaciones territoriales y físicas de Bolivia bajo un pulso común de seis semanas.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] leading-relaxed">
                  <div className="border border-[#ECE8DE] p-2.5 rounded-xl bg-[#FAF9F5]">
                    <span className="block font-bold text-[#A06A42] uppercase tracking-wide">Sem. 1 y 2: Incubación Local</span>
                    <span className="text-[9.5px] text-charcoal/60">Las ideas maduran en secreto técnico dentro de sus gremios y subnodos ($N_c$).</span>
                  </div>
                  <div className="border border-palmgreen/30 p-2.5 rounded-xl bg-[#FAF9F5]">
                    <span className="block font-bold text-palmgreen-dark uppercase tracking-wide">Sem. 3 y 4: Desbloqueo de Red</span>
                    <span className="text-[9.5px] text-charcoal/60 font-semibold">Las propuestas maduras se publican al municipio para el apoyo cruzado.</span>
                  </div>
                  <div className="border border-sky-500/20 p-2.5 rounded-xl bg-sky-500/5 ring-1 ring-sky-500/20">
                    <span className="block font-bold text-sky-900 uppercase tracking-wide">✨ Sem. 5 y 6: Votación Final</span>
                    <span className="text-[9.5px] text-charcoal/60 font-serif font-semibold">Decisión vinculante plebiscitaria con votaciones PKI nacionales e inspectores presenciales.</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1 bg-[#FAF9F5] p-2 rounded-xl">
                  <button
                    onClick={() => setSimulatorStep(4)}
                    className="stone-btn px-5 py-2 bg-charcoal hover:bg-neutral-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                  >
                    Simular Hito de Sanción <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CONTENT OF STEP 4 */}
            {simulatorStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-[#FAF9F5] border border-[#ECE8DE] p-4 rounded-xl flex items-start gap-4">
                  <Cpu className="w-6 h-6 text-[#A06A42] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-charcoal leading-none">Capa Ejecutora de Contratos Digitales</h4>
                    <p className="text-[10.5px] text-charcoal/60 mt-1 leading-relaxed">
                      Al aprobarse en la semana 6, la política se separa del patronazgo político tradicional. El representante es solo un canal líquido sin arbitrio; el ejecutor profesional ve sus fondos regulados de forma inflexible por variables de código.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#ECE8DE] p-4.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-[#ECE8DE] pb-2">
                    <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#A06A42]">Variables de Ejecución en Tiempo Real</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      execStatus === 'working' ? 'bg-amber-100 text-amber-800' : execStatus === 'frozen' ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-green-100 text-green-800'
                    }`}>
                      {execStatus === 'working' ? '⚙️ Fondos Fluyendo' : execStatus === 'frozen' ? '🚨 Presupuesto Congelado' : '✅ Obra Entregada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-charcoal/70 bg-[#FAF9F5] p-3 rounded-xl border border-[#ECE8DE]">
                    <div>
                      <p className="text-[8.5px] uppercase font-bold text-charcoal/40">Inspector Local (Sede Física Atribuida):</p>
                      <p className="font-serif font-black">{activeEntityId === 'n_f' ? 'Tinglado FEJUVE Dolores' : 'Comité Social Municipal'}</p>
                    </div>
                    <div>
                      <p className="text-[8.5px] uppercase font-bold text-charcoal/40">Certificación de Hitos:</p>
                      <p className="font-bold">{execStatus === 'working' ? 'Hito 1: Desembolsado • Hito 2: Esperando Certificación...' : execStatus === 'frozen' ? 'Inspector reporta retraso de materiales en Mercado' : 'Hito 1, 2 y Cierre Aprobados'}</p>
                    </div>
                  </div>

                  {/* Botones de Alertas / Auditoría */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                    <p className="text-[10px] text-charcoal/50 italic font-serif">Simula qué pasa si el contratista reduce la calidad o incurre en retrasos:</p>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setExecStatus('frozen')}
                        className="stone-btn flex-1 sm:flex-none px-3 py-2 bg-red-100 hover:bg-red-200 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Denunciar Retraso
                      </button>
                      <button
                        onClick={() => setExecStatus('success')}
                        className="stone-btn flex-1 sm:flex-none px-3 py-2 bg-palmgreen hover:bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Aprobar Obra
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* PARTE DERECHA DE LA SIMULACIÓN: GRAFO TERMINAL DESCENTRALIZADO */}
          <div className="lg:col-span-4 bg-white border border-[#ECE8DE] rounded-2xl p-4.5 flex flex-col justify-between shadow-xs min-h-[220px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="space-y-4">
              <div className="border-b border-[#ECE8DE] pb-2">
                <h4 className="text-[10px] font-mono font-bold text-[#A06A42] uppercase tracking-widest flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" /> Estado de Propuesta
                </h4>
              </div>

              {/* MUESTRA COORIDANADAS EN CONSOLA SIMULADA */}
              <div className="bg-[#FAF9F5] border border-[#ECE8DE] p-3 rounded-xl font-mono text-[9px] text-charcoal/70 space-y-1.5 shadow-inner">
                <p className="text-sandbrown font-bold">&gt;_ system_log_pki:</p>
                <p>proposal_id: <span className="text-charcoal font-bold">#RED-341-B</span></p>
                <p>origin_node_c: <span className="text-amber-700 font-bold">"{userRubro}"</span></p>
                <p>territory_r: <span className="text-[#2D5B3A] font-bold">"{userDepto}"</span></p>
                
                <p className="pt-1.5 border-t border-[#ECE8DE]/60">
                  state: <span className={`font-bold px-1 py-0.5 rounded ${
                    simulatorStep === 1 ? 'bg-amber-100 text-amber-800' : simulatorStep === 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                  }`}>{simulatorStep === 1 ? 'ISOLATED_INCUBATION' : simulatorStep === 2 ? 'ESCALATED_TO_RT' : simulatorStep === 3 ? 'SYNC_CADENCE' : 'SMART_CONTRACT_APPROVED'}</span>
                </p>
                
                <p>isolated_privacy: <span className="font-bold text-charcoal">{simulatorStep === 1 ? 'TRUE (100% Locked)' : 'FALSE (Unlocking)'}</span></p>
                <p>signatures_count: <span className="font-bold text-palmgreen">{internalVotes}/10 PKI</span></p>
                
                {simulatorStep > 1 && (
                  <>
                    <p className="pt-1.5 border-t border-[#ECE8DE]/60 text-emerald-800 font-semibold">✓ Geoshield: RESIDENT_ONLY</p>
                    <p className="text-emerald-800 font-semibold">✓ SICOES_bridge: Active</p>
                  </>
                )}
              </div>
            </div>

            {/* Métrica de Sintonía de Cierre */}
            <div className="bg-[#A06A42]/5 border border-[#A06A42]/15 p-3 rounded-xl text-center space-y-1">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-charcoal/40 block">Alineamiento de Triada Civil</span>
              <div className="flex justify-center items-center gap-1.5 text-xs text-charcoal font-serif font-black">
                <Vote className="w-4 h-4 text-sandbrown" />
                <span>{simulatorStep * 25}% Sintonía Soberana</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
