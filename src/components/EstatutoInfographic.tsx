import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Mail, 
  HelpCircle, 
  Milestone, 
  Workflow, 
  Users, 
  Code, 
  ChevronRight, 
  ChevronDown, 
  Search,
  Scale,
  BrainCircuit,
  MessageSquare,
  Network,
  Shield,
  ArrowRight,
  Sparkles,
  Info,
  Award
} from 'lucide-react';

interface chapter {
  id: string;
  num: number;
  title: string;
  badge: string;
  icon: React.ReactNode;
  summary: string;
}

export default function EstatutoInfographic() {
  const [activeChapter, setActiveChapter] = useState<string>('prologo');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({});

  const chapters: chapter[] = [
    {
      id: 'prologo',
      num: 1,
      title: "Prólogo: Una Carta Abierta a la Ciudadanía",
      badge: "Carta Abierta",
      icon: <Mail className="w-5 h-5" />,
      summary: "El origen de EstadoRed narrado desde el sentimiento de transmutar el miedo en esperanza para reconectar Bolivia."
    },
    {
      id: 'justificacion',
      num: 2,
      title: "Justificación: Urgencia de la Transición al EstadoRed",
      badge: "Diagnóstico",
      icon: <Scale className="w-5 h-5" />,
      summary: "El agotamiento del modelo republicano, la distorsión del plurinacional y el peligro del individualismo colectivo."
    },
    {
      id: 'que_es',
      num: 3,
      title: "3. ¿Qué es el EstadoRed?",
      badge: "Definición",
      icon: <Sparkles className="w-5 h-5" />,
      summary: "Conoce el nuevo sistema omnicanal de Democracia Digital Directa y sus tres conceptos base."
    },
    {
      id: 'organizacion',
      num: 4,
      title: "4. ¿Cómo nos Organizamos? (Nodos y Redes)",
      badge: "Estructura",
      icon: <Network className="w-5 h-5" />,
      summary: "La estructura de red dividida en Nodos Individuales, Colectivos, Nodos Físicos y Redes Territoriales Autónomas."
    },
    {
      id: 'funcionamiento',
      num: 5,
      title: "5. ¿Cómo Funciona? (El Flujo de Decisiones)",
      badge: "Algoritmo",
      icon: <Workflow className="w-5 h-5" />,
      summary: "Descubre el trayecto de una propuesta cívica sincera: Aislamiento Local, Apoyo Cruzado y Ejecución Incorruptible."
    },
    {
      id: 'hoja_ruta',
      num: 6,
      title: "6. Hoja de Ruta: La Transición Pacífica",
      badge: "Hoja de Ruta",
      icon: <Milestone className="w-5 h-5" />,
      summary: "Cuatro fases pacíficas y ordenadas soportadas por el marco de leyes y la constitución vigentes de Bolivia."
    },
    {
      id: 'invitacion',
      num: 7,
      title: "7. Una Invitación al Desarrollo (Código Abierto)",
      badge: "Comunidad",
      icon: <Code className="w-5 h-5" />,
      summary: "Toma parte en este esfuerzo cívico transparente, colaborativo, sin lucro y de código estrictamente abierto."
    },
    {
      id: 'faq',
      num: 8,
      title: "8. Preguntas Frecuentes (FAQ)",
      badge: "Preguntas",
      icon: <HelpCircle className="w-5 h-5" />,
      summary: "Respuestas directas a las dudas indispensables de protección, soberanía, tecnología y partidos políticos."
    }
  ];

  const faqs = [
    {
      q: "¿Cómo funciona EstadoRed?",
      a: "Como una red cívica donde te agrupas con tu barrio y gremio. Propones, votas, y mediante tecnología, convertimos esos votos en mandatos legales ineludibles para el Estado."
    },
    {
      q: "¿Por qué no me piden mis datos personales al inicio?",
      a: "Para protegerte. En la primera fase opinas libremente con un pseudónimo."
    },
    {
      q: "¿Tengo que tener Ciudadanía Digital?",
      a: "Al principio no. Solo será obligatoria en el momento exacto en que requiramos validar nuestros votos de manera legal frente al Estado."
    },
    {
      q: "¿Debo descargar alguna aplicación?",
      a: "Puedes acceder desde un navegador web, o asistiendo presencialmente al 'Nodo Físico' de tu barrio donde habrá facilitadores para ayudarte."
    },
    {
      q: "¿Esto es un partido político?",
      a: "No. Es una plataforma institucional que busca reemplazar la necesidad de partidos. Usaremos las reglas electorales para entrar al sistema, pero operaremos bajo asambleas ciudadanas digitales continuas."
    },
    {
      q: "¿Quién está detrás de todo esto?",
      a: "Ciudadanos bolivianos cansados de la polarización. Es una propuesta abierta y colaborativa de la sociedad civil."
    },
    {
      q: "¿Si van a reemplazar el sistema político, qué pasará con el Presidente, Senadores y Diputados?",
      a: "Desaparecen en su formato tradicional. Eliminamos los cargos de poder absoluto y los reemplazamos por administradores técnicos (Ejecutores) e intermediarios fluidos (Representantes). La decisión final la toma siempre la red ciudadana."
    },
    {
      q: "¿Si quieren administrar el Estado, tienen un proyecto país?",
      a: "Queremos llegar a administrar el Estado después de haber transformado la forma en que la sociedad se relaciona con la política. El proyecto país se construye desde la realidad de la sociedad organizada en sus territorios, no en un cuarto de guerra entre politiqueros trasnochados."
    }
  ];

  // Alternar FAQ abierta
  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Buscar coincidencia en contenidos para buscador cívico
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase();
    return chapters.filter(chap => 
      chap.title.toLowerCase().includes(q) || 
      chap.summary.toLowerCase().includes(q) ||
      chap.id.includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="w-full bg-[#FAF9F5] rounded-[2rem] border border-[#ECE8DE] p-4 sm:p-8 shadow-sm mt-6 transition-all duration-300">
      
      {/* Encabezado Principal y Buscador */}
      <div className="border-b border-[#ECE8DE] pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] sm:text-[11px] font-black tracking-[0.25em] text-sandbrown uppercase bg-sandbrown/5 border border-sandbrown/25 px-4.5 py-1.5 rounded-full shadow-xs">
            Guía Maestra de EstadoRed
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-black text-charcoal mt-3 tracking-tight">
            Gobernanza Comunitaria & Red Democrática
          </h2>
          <p className="text-xs sm:text-sm text-charcoal/50 mt-1.5 font-sans">
            Comprende la justificación, estructura orgánica, fases jurídicas y funcionamiento del paso de transición al EstadoRed Bolivia.
          </p>
        </div>

        {/* Buscador Cívico */}
        <div className="relative min-w-[240px] md:min-w-[300px]">
          <Search className="w-4 h-4 text-charcoal/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="master_guide_search"
            type="text"
            placeholder="Buscar por concepto, ley o tema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-warmgray-dark bg-white focus:outline-none focus:ring-1 focus:ring-sandbrown text-charcoal transition-all placeholder:text-charcoal/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LADO IZQUIERDO: Índice / Índice Capitular (Columna 1 a 4) */}
        <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 lg:overflow-visible no-scrollbar w-full shrink-0">
          {filteredChapters.map((chap) => {
            const isSelected = chap.id === activeChapter;
            return (
              <button
                key={chap.id}
                id={`btn_chap_${chap.id}`}
                onClick={() => setActiveChapter(chap.id)}
                className={`flex items-start gap-4 p-3.5 text-left rounded-2xl border transition-all duration-300 select-none min-w-[260px] lg:min-w-0 cursor-pointer ${
                  isSelected 
                    ? `bg-white shadow-sm border-l-4 border-t-[#ECE8DE] border-r-[#ECE8DE] border-b-[#ECE8DE] transform translate-x-0 lg:translate-x-1` 
                    : "bg-transparent border-transparent hover:bg-white/50 hover:shadow-2xs"
                }`}
                style={{ borderLeftColor: isSelected ? 'var(--color-sandbrown, #A06A42)' : 'transparent' }}
              >
                <div className={`p-2.5 rounded-xl transition-colors shrink-0 ${isSelected ? "bg-sandbrown text-white" : "bg-white border border-[#ECE8DE] text-charcoal/40 shadow-2xs"}`}>
                  {chap.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-sandbrown">{chap.badge}</span>
                  </div>
                  <h4 className={`text-xs sm:text-sm tracking-wide leading-tight truncate ${isSelected ? 'font-extrabold text-charcoal' : 'font-semibold text-charcoal/70'}`}>
                    {chap.title}
                  </h4>
                  <p className="text-[11px] text-charcoal/50 leading-relaxed max-w-[220px] lg:max-w-none line-clamp-2 mt-0.5">
                    {chap.summary}
                  </p>
                </div>
              </button>
            );
          })}
          {filteredChapters.length === 0 && (
            <div className="text-center py-6 w-full text-xs text-charcoal/40 font-medium">
              No se encontraron coincidencias para la búsqueda.
            </div>
          )}
        </div>

        {/* LADO DERECHO: Contenedor Principal de Lectura y Visualización Interactiva (Columna 5 a 12) */}
        <div className="lg:col-span-8 bg-white border border-[#ECE8DE] rounded-3xl p-5 sm:p-8 flex flex-col shadow-2xs relative min-h-[500px]">
          
          {/* Visualizador de Contenido del Capítulo Activo */}
          <div className="flex-1 space-y-6">
            
            {/* 1. PRÓLOGO */}
            {activeChapter === 'prologo' && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="bg-[#A06A42]/5 border border-[#A06A42]/10 rounded-2xl p-4 flex gap-4 items-start">
                  <Mail className="w-5 h-5 text-sandbrown shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-widest text-[#A06A42]">CARTA ABIERTA</h5>
                    <p className="text-[11px] text-charcoal/60 mt-0.5">La génesis emotiva y cívica de refundar los lazos territoriales.</p>
                  </div>
                </div>

                <div className="font-serif text-sm sm:text-[15px] text-charcoal/85 space-y-5 leading-relaxed leading-[1.7] italic p-2 border-l-2 border-sandbrown/25">
                  <p>
                    “Te escribo esto desde el miedo transformado en esperanza. Porque sin importar lo enfrentados que estemos, todos queremos lo mismo: Queremos vivir bien y en paz. Queremos ser felices, compartir con los nuestros y salir adelante por nuestras familias. Queremos dejar el miedo atrás y solo lo lograremos si reconocemos el verdadero problema.”
                  </p>
                  <p>
                    “Durante toda la historia han limitado nuestra identidad política para perpetuarse en el poder. Antes las monarquías y ahora la partidocracia nos obligan a ver el mundo en una dicotomía sin sentido donde seguimos enfrentándonos entre bandos por el control del dinero estatal.”
                  </p>
                  <p>
                    “Por esto te invito a que construyamos el futuro juntos, un futuro conectados y reconociendo que cada individuo tiene una identidad política compleja y que cada colectivo se organiza desde su realidad. Esta propuesta no le pertenece a ningún partido político ni busco convertirme en un caudillo, es solo mi aporte para que logremos construir una mejor Bolivia.”
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <span className="font-mono text-xs font-bold text-sandbrown tracking-widest bg-sandbrown/10 px-3.5 py-1.5 rounded-lg border border-sandbrown/20 animate-pulse">
                    #NosEncontraremosPronto!
                  </span>
                </div>
              </div>
            )}

            {/* 2. JUSTIFICACIÓN */}
            {activeChapter === 'justificacion' && (
              <div className="space-y-6 animate-in fade-in duration-350 font-serif">
                <div className="bg-sandbrown/5 border border-sandbrown/10 rounded-2xl p-4 text-[11px] text-charcoal/60 leading-relaxed font-sans mb-2">
                  El cambio de nuestro paradigma político ya no es una opción, es una necesidad ineludible. Las crisis políticas, económicas y sociales que atravesamos demuestran que los cimientos del modelo de sociedad actual han llegado a su límite.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-sans">
                  {/* Bloque 1 */}
                  <div className="p-4 rounded-xl bg-red-500/[0.02] border border-red-500/10 hover:border-red-500/25 transition-all">
                    <h5 className="font-bold text-xs uppercase text-red-600 tracking-wider flex items-center gap-2 mb-2">
                      <span>⚠️ El Colapso del Modelo Republicano</span>
                    </h5>
                    <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                      El Estado republicano y la "democracia representativa" fueron diseñados para otra época, cuando era indispensable delegar el poder a un grupo reducido de personas para que decidieran por la mayoría. Hoy, ese modelo es una partidocracia rota. Los partidos han monopolizado la representación, transformándose en cúpulas de poder que buscan controlar los recursos del Estado, reduciéndonos a ser un simple voto cada cinco años.
                    </p>
                  </div>

                  {/* Bloque 2 */}
                  <div className="p-4 rounded-xl bg-orange-500/[0.02] border border-orange-500/10 hover:border-orange-500/25 transition-all">
                    <h5 className="font-bold text-xs uppercase text-orange-600 tracking-wider flex items-center gap-2 mb-2">
                      <span>⚙️ La Cáscara Fallida del Estado Plurinacional</span>
                    </h5>
                    <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                      Bolivia dio un paso histórico al intentar reconocer su inmensa diversidad bajo el Estado Plurinacional. Sin embargo, fracasó porque siguió usando la misma "cáscara" de un Estado republicano tradicional. Al intentar meter la diversidad de miles de organizaciones sociales dentro del embudo estrecho de un presidente y un parlamento, la voz real de las bases quedó distorsionada.
                    </p>
                  </div>

                  {/* Bloque 3 */}
                  <div className="p-4 rounded-xl bg-yellow-600/[0.02] border border-yellow-600/10 hover:border-yellow-600/25 transition-all md:col-span-2">
                    <h5 className="font-bold text-xs uppercase text-yellow-700 tracking-wider flex items-center gap-2 mb-2">
                      <span>⚡ El Peligro del "Individualismo Colectivo"</span>
                    </h5>
                    <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                      Al no tener canales directos para decidir su destino, la sociedad cae en la polarización. La consecuencia más grave es el "individualismo colectivo". Lo vemos cuando un sector (un gremio, un municipio) siente que el Gobierno no lo escucha y recurre a medidas de presión, como los bloqueos de carreteras. Este sector actúa buscando su propio beneficio inmediato, asfixiando la economía y castigando al resto de la población. Es el síntoma de un Estado ciego y sordo.
                    </p>
                  </div>
                </div>

                <div className="p-4.5 bg-palmgreen/[0.03] border border-palmgreen/20 rounded-xl font-sans">
                  <h5 className="font-extrabold text-xs text-palmgreen uppercase tracking-widest flex items-center gap-2 mb-1.5">
                    <span>🌿 La Evolución Inevitable</span>
                  </h5>
                  <p className="text-xs sm:text-[13px] text-charcoal/80 leading-relaxed font-serif">
                    El EstadoRed no pretende destruir el país, sino reestructurar la forma en que nos relacionamos. Las tecnologías actuales nos permiten lo que hace un siglo era imposible: que la población organizada ejerza su Gobierno de manera directa, transparente y soberana.
                  </p>
                </div>
              </div>
            )}

            {/* 3. ¿QUÉ ES EL ESTADORED? */}
            {activeChapter === 'que_es' && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="bg-sandbrown/5 border border-sandbrown/15 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start">
                  <div className="bg-white p-3 rounded-xl border border-warmgray shadow-2xs shrink-0 self-center">
                    <Award className="w-6 h-6 text-sandbrown" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-sandbrown tracking-widest uppercase mb-1">REINGENIERÍA POLÍTICA</h5>
                    <p className="text-sm text-charcoal font-serif tracking-wide leading-relaxed">
                      El <strong>EstadoRed</strong> es una plataforma digital omnicanal con estructura territorial presencial. Es una reingeniería política diseñada para reemplazar el modelo agotado por una <strong>Democracia Digital Directa</strong>. Utilizamos la tecnología para devolverle el poder de decisión a las organizaciones sociales, vecinales y gremiales que ya existen, sin intermediarios.
                    </p>
                  </div>
                </div>

                {/* Conceptos Clave */}
                <div>
                  <h4 className="text-xs font-black tracking-widest text-[#A06A42] uppercase mb-4">CONCEPTOS CLAVE</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl hover:shadow-2xs transition-all">
                      <span className="text-[10px] font-black uppercase text-sandbrown tracking-widest block mb-1">Política</span>
                      <p className="text-xs text-charcoal/85 leading-relaxed font-serif">
                        Es la forma en que una sociedad se organiza y decide sobre todos los ámbitos de su vida cotidiana.
                      </p>
                    </div>

                    <div className="p-4 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl hover:shadow-2xs transition-all">
                      <span className="text-[10px] font-black uppercase text-palmgreen tracking-widest block mb-1">Políticas Públicas/Económicas</span>
                      <p className="text-xs text-charcoal/85 leading-relaxed font-serif">
                        Son las formas de organizar y decidir sobre lo que es de todos (lo público) y sobre la relación del Estado con la economía.
                      </p>
                    </div>

                    <div className="p-4 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl hover:shadow-2xs transition-all">
                      <span className="text-[10px] font-black uppercase text-[#1d4ed8] tracking-widest block mb-1">Sistema Político</span>
                      <p className="text-xs text-charcoal/85 leading-relaxed font-serif">
                        Es el mecanismo que usa el Estado para hacer realidad las decisiones de la sociedad. El EstadoRed es el nuevo sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ¿CÓMO NOS ORGANIZAMOS? */}
            {activeChapter === 'organizacion' && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="bg-[#FAF9F5] border border-[#ECE8DE] p-4.5 rounded-2xl">
                  <p className="text-xs text-charcoal/65 font-medium leading-relaxed font-serif">
                    El sistema reconoce tu verdadera Identidad Política en tres dimensiones: tu <strong>Territorio</strong> (dónde vives), tu <strong>Ocupación</strong> (de qué trabajas) y tu <strong>Ideología / Valores</strong> (qué piensas).
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Nodo 1 */}
                  <div className="p-4 bg-white border border-[#ECE8DE] rounded-xl flex gap-3.5 items-start hover:border-sandbrown/40 transition-colors">
                    <span className="w-8 h-8 rounded-full bg-skyblue/10 text-skyblue-dark flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-charcoal uppercase tracking-wider mb-0.5">El Nodo Individual (Tú)</h5>
                      <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                        Tienes voz, voto y capacidad de proponer. Al principio participas de forma anónima, y solo cuando decidamos tomar acciones legales vinculantes, usarás tu "Ciudadanía Digital" oficial.
                      </p>
                    </div>
                  </div>

                  {/* Nodo 2 */}
                  <div className="p-4 bg-white border border-[#ECE8DE] rounded-xl flex gap-3.5 items-start hover:border-sandbrown/40 transition-colors">
                    <span className="w-8 h-8 rounded-full bg-sandbrown/10 text-sandbrown-dark flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-charcoal uppercase tracking-wider mb-0.5">El Nodo Colectivo (Tu Organización)</h5>
                      <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                        Son los grupos que ya existen: tu Junta de Vecinos, tu Sindicato o tu Colegio de Profesionales.
                      </p>
                    </div>
                  </div>

                  {/* Nodo 3 */}
                  <div className="p-4 bg-white border border-[#ECE8DE] rounded-xl flex gap-3.5 items-start hover:border-sandbrown/40 transition-colors">
                    <span className="w-8 h-8 rounded-full bg-palmgreen/10 text-palmgreen-dark flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-charcoal uppercase tracking-wider mb-0.5">El Nodo Físico (El Encuentro Real)</h5>
                      <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                        La tecnología no nos aísla. Cuando tu Junta de Vecinos tiene un espacio físico (un tinglado, una sede), se convierte en un Nodo Físico. Aquí los vecinos se reúnen, debaten cara a cara y ayudan a los adultos mayores a participar digitalmente.
                      </p>
                    </div>
                  </div>

                  {/* Nodo 4 */}
                  <div className="p-4 bg-white border border-[#ECE8DE] rounded-xl flex gap-3.5 items-start hover:border-sandbrown/40 transition-colors">
                    <span className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">4</span>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-charcoal uppercase tracking-wider mb-0.5">La Red Territorial (La Autonomía)</h5>
                      <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                        Agrupa a los Nodos Colectivos en un área (Municipio o Departamento). Las Redes Territoriales son soberanas e independientes. Las decisiones de la Red Municipal de Cochabamba solo las toman los cochabambinos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ¿CÓMO FUNCIONA? */}
            {activeChapter === 'funcionamiento' && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="relative pl-6 border-l-2 border-dashed border-sandbrown/30 space-y-6 pt-1">
                  
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-white border-2 border-sandbrown flex items-center justify-center text-[10px] font-black text-sandbrown shadow-xs">1</span>
                    <h5 className="font-black text-xs sm:text-sm uppercase text-charcoal tracking-wide mb-1">Paso 1: Aislamiento Local</h5>
                    <p className="text-xs text-charcoal/75 font-serif leading-relaxed">
                      Toda propuesta nace dentro de un Nodo Colectivo específico. Se debate primero entre los directamente afectados, evitando que políticos o externos arruinen el análisis técnico.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <span className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-white border-2 border-sandbrown flex items-center justify-center text-[10px] font-black text-sandbrown shadow-xs">2</span>
                    <h5 className="font-black text-xs sm:text-sm uppercase text-charcoal tracking-wide mb-1">Paso 2: Apoyo Cruzado</h5>
                    <p className="text-xs text-charcoal/75 font-serif leading-relaxed">
                      Si la propuesta consigue apoyo interno, "sube" a la Red Territorial (ej. Municipal). Aquí, otros sectores de la ciudad pueden verla y darle su apoyo cruzado.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative font-sans">
                    <span className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-sandbrown text-white flex items-center justify-center text-[10px] font-black shadow-xs">3</span>
                    <h5 className="font-black text-xs sm:text-sm uppercase text-sandbrown tracking-wide mb-1">Paso 3: Ejecución Incorruptible</h5>
                    <p className="text-xs text-charcoal/75 font-serif leading-relaxed">
                      Una vez aprobada por la mayoría de la Red, la decisión se programa en un Contrato Inteligente. El presupuesto se libera directamente a los profesionales ejecutores, bloqueando el dinero si la obra no avanza.
                    </p>
                  </div>
                </div>

                {/* Representantes vs Ejecutores */}
                <div className="bg-[#FAF9F5] border border-[#ECE8DE] p-5 rounded-2xl">
                  <h4 className="text-xs font-black tracking-widest text-[#A06A42] uppercase mb-3">REPRESENTANTES VS. EJECUTORES</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white border border-[#ECE8DE] rounded-xl">
                      <span className="inline-block text-[9px] font-bold text-[#A06A42] bg-[#A06A42]/10 px-2 py-0.5 rounded-full mb-1">Representantes</span>
                      <p className="text-[11px] text-charcoal/80 leading-relaxed font-serif">
                        Voceros temporales elegidos por la red. Si traicionan a las bases, se les retira el poder al instante mediante el <strong>"Voto Líquido"</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 bg-white border border-[#ECE8DE] rounded-xl">
                      <span className="inline-block text-[9px] font-bold text-palmgreen bg-palmgreen/10 px-2 py-0.5 rounded-full mb-1">Ejecutores</span>
                      <p className="text-[11px] text-charcoal/80 leading-relaxed font-serif">
                        Profesionales contratados para hacer el trabajo físico, estrictamente vigilados por la tecnología y los ciudadanos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. HOJA DE RUTA */}
            {activeChapter === 'hoja_ruta' && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="p-4 bg-sandbrown/5 border border-sandbrown/10 rounded-2xl text-xs text-charcoal/70 leading-relaxed font-serif">
                  Reemplazaremos el sistema usando el propio marco legal y constitucional vigente de Bolivia en 4 fases pacíficas y sistemáticas:
                </div>

                <div className="space-y-4">
                  {/* Fase 1 */}
                  <div className="p-4 bg-white border border-[#ECE8DE] rounded-xl hover:border-sandbrown-light transition-colors relative pl-12">
                    <span className="absolute left-3.5 top-4 w-6 h-6 rounded-full bg-sandbrown/10 text-sandbrown text-[11px] font-bold flex items-center justify-center border border-sandbrown/20 text-center">I</span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <h5 className="font-extrabold text-xs sm:text-sm text-charcoal uppercase tracking-wider">Fase de Control Social (Auditoría)</h5>
                      <span className="inline-block text-[9px] font-bold text-sandbrown-dark bg-[#A06A42]/10 px-2 py-0.5 rounded-full w-fit">Ley 341</span>
                    </div>
                    <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                      Nos apoyamos en la Ley 341. Nos conectamos a los datos del Estado para fiscalizar dónde está el dinero público y organizarnos.
                    </p>
                  </div>

                  {/* Fase 2 */}
                  <div className="p-4 bg-white border border-[#ECE8DE] rounded-xl hover:border-sandbrown-light transition-colors relative pl-12">
                    <span className="absolute left-3.5 top-4 w-6 h-6 rounded-full bg-[#A06A42]/10 text-sandbrown text-[11px] font-bold flex items-center justify-center border border-sandbrown/20 text-center">II</span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <h5 className="font-extrabold text-xs sm:text-sm text-charcoal uppercase tracking-wider">Fase de Representación Social (Personería Jurídica)</h5>
                      <span className="inline-block text-[9px] font-bold text-sandbrown bg-sandbrown/10 px-2 py-0.5 rounded-full w-fit">Ley 351</span>
                    </div>
                    <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                      Mediante la Ley 351, nos registramos como entidad civil. Nuestras asambleas digitales tendrán total validez legal.
                    </p>
                  </div>

                  {/* Fase 3 */}
                  <div className="p-4 bg-white border border-[#ECE8DE] rounded-xl hover:border-sandbrown-light transition-colors relative pl-12">
                    <span className="absolute left-3.5 top-4 w-6 h-6 rounded-full bg-[#A06A42]/10 text-sandbrown text-[11px] font-bold flex items-center justify-center border border-sandbrown/20 text-center">III</span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <h5 className="font-extrabold text-xs sm:text-sm text-charcoal uppercase tracking-wider">Fase de Representación Política (El "Hackeo" Electoral)</h5>
                      <span className="inline-block text-[9px] font-bold text-[#1d4ed8] bg-[#1d4ed8]/10 px-2 py-0.5 rounded-full w-fit">Ley 1096 y 026</span>
                    </div>
                    <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                      Usando la Ley 1096 y 026, nos convertimos en actor electoral. Postularemos voceros obligados por contrato a votar en el Congreso y Municipios exactamente lo que decida la plataforma.
                    </p>
                  </div>

                  {/* Fase 4 */}
                  <div className="p-4 bg-white border border-[#ECE8DE] rounded-xl hover:border-sandbrown-light transition-colors relative pl-12">
                    <span className="absolute left-3.5 top-4 w-6 h-6 rounded-full bg-palmgreen/10 text-palmgreen-dark text-[11px] font-bold flex items-center justify-center border border-palmgreen/25 text-center font-mono">IV</span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <h5 className="font-extrabold text-xs sm:text-sm text-charcoal uppercase tracking-wider">Fase de Administración del Estado</h5>
                      <span className="inline-block text-[9px] font-bold text-palmgreen-dark bg-palmgreen/10 px-2 py-0.5 rounded-full w-fit">Ley 031</span>
                    </div>
                    <p className="text-xs text-charcoal/70 leading-relaxed font-serif">
                      Al ganar, parametrizaremos la Ley 031 (Autonomías). Las regalías y recursos se repartirán automáticamente a las Redes Territoriales, extinguiendo a la burocracia y la clase política tradicional.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. INVITACIÓN AL DESARROLLO */}
            {activeChapter === 'invitacion' && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="bg-charcoal text-[#FAF9F5] p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Code className="w-5 h-5 text-[#A06A42]" />
                    </div>
                    <h5 className="text-[11px] font-mono tracking-widest uppercase text-sandbrown">Código Libre y Cívico</h5>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white tracking-tight">Colaboración Abierta No Remunerada</h3>
                  <div className="h-[1px] w-full bg-white/10 my-2"></div>
                  
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-350 font-serif">
                    “El EstadoRed es una iniciativa de código abierto y sin fines de lucro. Cualquier ciudadano, programador, o vecino está invitado a debatir, proponer mejoras (estén a favor o en desacuerdo) y construir la plataforma. Al no tener fines de lucro, cualquier aporte para su crecimiento no puede ser remunerado hasta constituirnos en una institución legalmente establecida.”
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl flex gap-3.5 items-center">
                  <span className="shrink-0 text-xl">💡</span>
                  <p className="text-xs text-charcoal/65 leading-normal">
                    La transparencia no solo está en las asambleas, sino también en el software. Cada línea de código es auditada y de dominio común.
                  </p>
                </div>
              </div>
            )}

            {/* 8. PREGUNTAS FRECUENTES (FAQ) */}
            {activeChapter === 'faq' && (
              <div className="space-y-6 animate-in fade-in duration-350">
                <div className="bg-sandbrown/5 border border-sandbrown/10 p-4.5 rounded-xl flex gap-3 items-start">
                  <HelpCircle className="w-5 h-5 text-sandbrown shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black uppercase text-sandbrown tracking-widest mb-0.5">Respuestas Inmediatas</h5>
                    <p className="text-[11px] text-charcoal/60">Filtra utilizando el buscador o consulta las dudas fundamentales haciendo click sobre las preguntas.</p>
                  </div>
                </div>

                <div className="space-y-3.5 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
                  {faqs.map((faq, index) => {
                    const isOpen = !!faqOpen[index];
                    return (
                      <div key={index} className="border border-[#ECE8DE] rounded-xl overflow-hidden transition-all bg-white hover:border-sandbrown/20 shadow-2xs">
                        <button
                          onClick={() => toggleFaq(index)}
                          className="w-full text-left px-4 py-3.5 flex justify-between items-center bg-[#FAF9F5]/45 hover:bg-[#FAF9F5] cursor-pointer"
                        >
                          <span className="text-xs sm:text-[13px] font-bold text-charcoal leading-tight pr-4">{faq.q}</span>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-charcoal/40 shrink-0" /> : <ChevronRight className="w-4 h-4 text-charcoal/40 shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="px-4 py-3.5 bg-white border-t border-[#ECE8DE]/60 animate-in slide-in-from-top-1">
                            <p className="text-xs sm:text-[12.5px] text-charcoal/80 leading-relaxed font-serif">
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Pie de Página / Frase de Cierre Inspiradora */}
          <div className="mt-8 border-t border-[#ECE8DE] pt-6 relative">
            <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-4 text-[11px] sm:text-xs text-charcoal/70 leading-relaxed text-center font-serif">
              “Porque este es un salto inevitable. La tecnología nos empuja a organizarnos y decidir de diferentes formas y el sistema político debe responder a este fenómeno social... Porque solo tendremos Soberanía si la Población organizada ejerce su Gobierno en cada territorio.”
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
