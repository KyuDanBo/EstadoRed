import React, { useState } from 'react';
import { Network, BrainCircuit, Users, Shield, ArrowRight } from 'lucide-react';

interface Pillar {
  id: number;
  title: string;
  shortDesc: string;
  details: string[];
  colorClass: string;
  bgLightClass: string;
  icon: React.ReactNode;
  accentColor: string;
}

export default function EstatutoInfographic() {
  const [activePillar, setActivePillar] = useState<number>(1);

  const pillars: Pillar[] = [
    {
      id: 1,
      title: "Tu Identidad Política",
      shortDesc: "Estructura social ciudadana sin necesidad de partidos políticos.",
      details: [
        "Tu identidad se forma por 3 aspectos reales: el lugar donde vives, tu profesión u oficio, y tus valores éticos.",
        "Te conectas automáticamente en grupos de diálogo con ciudadanos que comparten tu realidad diaria.",
        "Se dejan de lado los caudillos tradicionales para enfocarse en resolver problemas reales y sectoriales."
      ],
      colorClass: "bg-skyblue text-white border-skyblue",
      bgLightClass: "bg-skyblue/10 border-skyblue/25 text-skyblue-dark",
      icon: <Network className="w-6 h-6" />,
      accentColor: "#38bdf8"
    },
    {
      id: 2,
      title: "Asistente Inteligente",
      shortDesc: "Una ayuda tecnológica neutral para orientar el debate público.",
      details: [
        "Un asistente virtual inteligente te ayuda a redactar, organizar y mejorar tus propuestas cívicas.",
        "Filtra automáticamente los insultos y agresiones para mantener el respeto, sin censurar las ideas.",
        "Brinda apoyo basado en las leyes vigentes del país para verificar que toda propuesta sea correcta y realizable."
      ],
      colorClass: "bg-sandbrown text-white border-sandbrown",
      bgLightClass: "bg-sandbrown/10 border-[#A06A42]/25 text-sandbrown-dark",
      icon: <BrainCircuit className="w-6 h-6" />,
      accentColor: "#A06A42"
    },
    {
      id: 3,
      title: "Escala de Propuestas",
      shortDesc: "Tus iniciativas pueden crecer desde tu barrio hasta nivel nacional.",
      details: [
        "Cualquier vecino puede iniciar una propuesta local y sumar apoyo de forma cívica en su comunidad.",
        "Si la propuesta es muy buena y resuelve grandes problemas, sube al conocimiento de toda la ciudad o el país.",
        "Las decisiones ciudadanas logran convertirse en políticas públicas respaldadas con máxima transparencia."
      ],
      colorClass: "bg-palmgreen text-white border-palmgreen",
      bgLightClass: "bg-palmgreen/10 border-palmgreen/25 text-palmgreen-dark",
      icon: <Users className="w-6 h-6" />,
      accentColor: "#1d4ed8"
    },
    {
      id: 4,
      title: "Tu Voto, Tu Poder",
      shortDesc: "Poder de decisión directo que puedes usar o delegar libremente.",
      details: [
        "Tú decides directamente sobre las normas de tu zona, sin necesidad de actores políticos que te limiten.",
        "Puedes ceder tu apoyo a un líder ciudadano de confianza, y quitárselo en un clic si cambias de opinión.",
        "El sistema tecnológico protege tu elección asegurando que el poder se mantenga desconcentrado."
      ],
      colorClass: "bg-purple-600 text-white border-purple-600",
      bgLightClass: "bg-purple-500/10 border-purple-500/25 text-purple-700",
      icon: <Shield className="w-6 h-6" />,
      accentColor: "#9333ea"
    }
  ];

  const activeData = pillars.find(p => p.id === activePillar) || pillars[0];

  return (
    <div className="w-full bg-[#FAF9F5] rounded-[2rem] border border-[#ECE8DE] p-6 sm:p-10 shadow-lg mt-6 transition-all duration-500 ease-in-out">
      <div className="text-center mb-10">
        <span className="text-[11px] md:text-xs font-bold tracking-[0.2em] text-sandbrown uppercase bg-sandbrown/5 border border-sandbrown/20 px-4 py-1.5 rounded-full shadow-sm">
          ¿Cómo funciona EstadoRed?
        </span>
        <h3 className="font-serif text-3xl sm:text-4xl text-charcoal mt-6 tracking-tight font-medium">
          Toma el control de las decisiones
        </h3>
        <p className="text-sm sm:text-base text-charcoal/60 max-w-lg mx-auto mt-4 leading-relaxed">
          Un nuevo modelo donde participas de forma directa en las acciones de tu país a través de cuatro principios básicos.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Lado izquierdo: Selector Interactivo de Pilares */}
        <div className="w-full lg:w-1/3 flex flex-row lg:flex-col gap-3 overflow-x-auto pb-4 lg:pb-0 lg:overflow-visible no-scrollbar shrink-0">
          {pillars.map((pillar) => {
            const isSelected = pillar.id === activePillar;
            return (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                className={`flex items-start gap-4 p-4 text-left rounded-2xl border transition-all duration-300 ease-out cursor-pointer select-none min-w-[240px] lg:min-w-0 ${
                  isSelected 
                    ? `bg-white shadow-md border-l-4 border-t-[#ECE8DE] border-r-[#ECE8DE] border-b-[#ECE8DE] transform scale-[1.02]` 
                    : "bg-transparent border-transparent hover:bg-white/60 hover:shadow-sm"
                }`}
                style={{ borderLeftColor: isSelected ? pillar.accentColor : 'transparent' }}
              >
                <div className={`p-3 rounded-xl transition-colors duration-300 ${isSelected ? pillar.colorClass : "bg-white border border-[#ECE8DE] text-charcoal/40 shadow-sm"}`}>
                  {pillar.icon}
                </div>
                <div>
                  <h4 className={`text-sm tracking-wide mb-1 ${isSelected ? 'font-bold text-charcoal' : 'font-medium text-charcoal/70'}`}>{pillar.title}</h4>
                  <p className="text-xs text-charcoal/50 leading-relaxed max-w-[200px] lg:whitespace-normal line-clamp-2">{pillar.shortDesc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lado derecho: Visualizador Dinámico de Simulación y Detalles */}
        <div className="w-full lg:w-2/3 bg-white border border-[#ECE8DE] rounded-3xl p-6 sm:p-10 flex flex-col shadow-sm relative overflow-hidden min-h-[440px]">
          {/* Fondo sutil degradado de color de acento */}
          <div 
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-20 transition-colors duration-700"
            style={{ backgroundColor: activeData.accentColor }}
          ></div>

          {/* Área de Simulación Interactiva */}
          <div className="flex-1 flex flex-col justify-center items-center mb-8 min-h-[160px] relative z-10 w-full">
            
            {/* Simulación Pilar 1: Identidad Tríadica (3 círculos conectándose) */}
            {activePillar === 1 && (
              <div className="relative w-48 h-48 flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <path d="M 50 20 L 25 70 L 75 70 Z" fill="none" stroke="#ECE8DE" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="50" y1="50" x2="50" y2="20" stroke="#38bdf8" strokeWidth="2" className="animate-pulse" />
                  <line x1="50" y1="50" x2="25" y2="70" stroke="#A06A42" strokeWidth="2" className="animate-pulse" />
                  <line x1="50" y1="50" x2="75" y2="70" stroke="#10b981" strokeWidth="2" className="animate-pulse" />
                </svg>

                {/* Central Node */}
                <div className="absolute w-12 h-12 rounded-full bg-charcoal border-[3px] border-white flex items-center justify-center shadow-xl text-xs text-white font-bold z-10">
                  TÚ
                </div>
                {/* Territorio */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-skyblue text-white text-sm flex items-center justify-center font-bold shadow-md">📍</div>
                  <span className="text-[9px] font-bold text-skyblue-dark uppercase bg-white px-2 py-0.5 shadow-sm mt-2 rounded-full border border-skyblue/20">Territorio</span>
                </div>
                {/* Ocupación */}
                <div className="absolute bottom-1 -left-4 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-sandbrown text-white text-sm flex items-center justify-center font-bold shadow-md">🛠️</div>
                  <span className="text-[9px] font-bold text-sandbrown-dark uppercase bg-white px-2 py-0.5 shadow-sm mt-2 rounded-full border border-sandbrown/20">Ocupación</span>
                </div>
                {/* Ideología */}
                <div className="absolute bottom-1 -right-4 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-palmgreen text-white text-sm flex items-center justify-center font-bold shadow-md">🧠</div>
                  <span className="text-[9px] font-bold text-palmgreen-dark uppercase bg-white px-2 py-0.5 shadow-sm mt-2 rounded-full border border-palmgreen/20">Valores</span>
                </div>
              </div>
            )}

            {/* Simulación Pilar 2: IAsesor Moderación (Buzón que brilla) */}
            {activePillar === 2 && (
              <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-700 w-full max-w-sm mx-auto">
                <div className="flex items-center gap-4 w-full justify-center">
                  {/* Idea con odio bloqueada */}
                  <div className="px-3 py-2 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl text-[10px] text-charcoal/40 font-medium flex items-center gap-2 shadow-sm animate-pulse">
                    Comentario Agresivo
                  </div>
                  <ArrowRight className="w-4 h-4 text-charcoal/20" />
                  
                  {/* IAsesor Module */}
                  <div className="w-16 h-16 rounded-2xl bg-white border border-[#ECE8DE] flex items-center justify-center shadow-lg relative group z-10">
                    <div className="absolute inset-0 bg-sandbrown/5 rounded-2xl animate-ping"></div>
                    <BrainCircuit className="w-8 h-8 text-sandbrown relative z-10" />
                    <span className="absolute -top-3 -right-3 bg-skyblue text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">Leyes</span>
                  </div>
                  
                  <ArrowRight className="w-4 h-4 text-[#A06A42]/40" />
                  
                  {/* Idea pura aprobada */}
                  <div className="px-3 py-2 bg-palmgreen text-white rounded-xl text-[10px] font-bold shadow-md flex items-center gap-2">
                    Propuesta Clara
                  </div>
                </div>
                <div className="text-xs text-charcoal/60 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl px-4 py-2 w-full text-center">
                  El asistente convierte críticas sin fundamento en aportes constructivos.
                </div>
              </div>
            )}

            {/* Simulación Pilar 3: Soberanía Escalable (Círculos concéntricos) */}
            {activePillar === 3 && (
              <div className="relative w-48 h-48 flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                <div className="absolute w-44 h-44 rounded-full border-[1.5px] border-dashed border-charcoal/10 flex items-center justify-center">
                  <span className="absolute top-2 text-[9px] font-bold text-charcoal/30 uppercase tracking-widest bg-white px-2">Nacional</span>
                  
                  <div className="absolute w-32 h-32 rounded-full border-[1.5px] border-dashed border-palmgreen/30 flex items-center justify-center bg-palmgreen/[0.02]">
                    <span className="absolute top-2 text-[9px] font-bold text-palmgreen-dark/60 uppercase tracking-widest bg-white px-2">Ciudad</span>

                    <div className="absolute w-16 h-16 rounded-full border-[2px] border-solid border-sandbrown bg-white flex items-center justify-center shadow-xl z-10">
                      <span className="text-[10px] font-black text-charcoal uppercase text-center leading-tight">Tu<br/>Barrio</span>
                    </div>
                  </div>
                </div>
                {/* Moving Particles indicating rise */}
                <div className="absolute h-20 w-0.5 bg-gradient-to-t from-transparent via-sandbrown to-palmgreen translate-y-[-10px] z-0 animate-pulse">
                </div>
              </div>
            )}

            {/* Simulación Pilar 4: Consenso Líquido (Delegación) */}
            {activePillar === 4 && (
              <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-700 w-full max-w-md mx-auto">
                <div className="flex items-center justify-between w-full px-4">
                  {/* User A */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-12 h-12 rounded-full bg-white border border-[#ECE8DE] shadow-md flex items-center justify-center text-lg">🙋🏽‍♀️</div>
                    <span className="text-[10px] font-bold text-charcoal mt-2 uppercase tracking-wider">Tú</span>
                  </div>

                  {/* Flow Arrow with delegation */}
                  <div className="flex-1 flex flex-col items-center justify-center relative px-4">
                     <div className="w-full h-1 bg-[#ECE8DE] rounded-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-purple-500 w-full rounded-full animate-pulse origin-left"></div>
                     </div>
                     <span className="absolute -top-3 text-[9px] font-bold text-purple-600 bg-white border border-purple-100 shadow-sm px-2 py-0.5 rounded-full uppercase tracking-wider">Delega tu voto</span>
                  </div>

                  {/* Node B (Your Delegate) */}
                  <div className="flex flex-col items-center z-10 mb-2">
                    <div className="w-14 h-14 rounded-full bg-purple-600 border-4 border-purple-100 flex items-center justify-center text-white text-xl shadow-lg relative">
                      🏛️
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-palmgreen rounded-full border-2 border-white flex items-center justify-center text-[10px]">✓</div>
                    </div>
                    <span className="text-[10px] font-bold text-charcoal mt-2 uppercase tracking-wider text-center">Organización<br/>Confiable</span>
                  </div>
                </div>
                <div className="bg-[#FAF9F5] border border-[#ECE8DE] px-4 py-3 rounded-xl text-center w-full shadow-sm text-xs text-charcoal/70">
                  Transfieres tu poder a un grupo experto, pero puedes presionar el botón de <strong className="text-red-500 font-bold">Revocar Voto</strong> en cualquier momento.
                </div>
              </div>
            )}

          </div>

          {/* Bullet points explicativos */}
          <div className="mt-auto border-t border-[#ECE8DE] pt-6 relative z-10">
             <div className="flex flex-col gap-3">
                {activeData.details.map((detail, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-[#FAF9F5] border border-[#ECE8DE]/60 hover:bg-white hover:border-[#ECE8DE] transition-colors group shadow-sm">
                     <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-white border border-[#ECE8DE] text-xs font-bold shadow-sm transition-colors ${activePillar === 1 ? 'text-skyblue-dark' : activePillar === 2 ? 'text-sandbrown-dark' : activePillar === 3 ? 'text-palmgreen-dark' : 'text-purple-700'}`}>
                        {idx + 1}
                     </div>
                     <p className="text-sm text-charcoal/80 leading-relaxed font-medium">
                        {detail}
                     </p>
                  </div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

