import React, { useState, useRef, useEffect } from 'react';
import { Info, ExternalLink, Compass, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';

// STABLE PSEUDO-RANDOM SEED FOR ORGANIC RECTBED STONES (CANTOS RODADOS)
function getOrganicPebblePath(cx: number, cy: number, r: number, seed: number) {
  const points = [];
  const segments = 10; 
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Generate organic undulation using sine waves based on the node seed
    const radiusOffset = Math.sin(angle * 3 + seed) * 0.16 + Math.cos(angle * 2 - seed) * 0.08;
    const currentRadius = r * (1 + radiusOffset);
    const x = cx + Math.cos(angle) * currentRadius;
    const y = cy + Math.sin(angle) * currentRadius;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

// COLOR PALETTE (TERRITORIO = VERDE, OCUPACIÓN = CAFÉ, IDEOLOGÍA = AZUL)
const PALETTE = {
  territorio: {
    base: '#2D5B3A',
    light: '#4A8B66',
    soft: 'rgba(45, 91, 58, 0.1)',
    glow: 'rgba(45, 91, 58, 0.35)',
    gradient: ['#2D5B3A', '#4A8B66']
  },
  ocupacion: {
    base: '#8E5831',
    light: '#C78A58',
    soft: 'rgba(142, 88, 49, 0.1)',
    glow: 'rgba(142, 88, 49, 0.35)',
    gradient: ['#8E5831', '#A06A42']
  },
  ideologia: {
    base: '#1F4E67',
    light: '#327C9F',
    soft: 'rgba(31, 78, 103, 0.1)',
    glow: 'rgba(31, 78, 103, 0.35)',
    gradient: ['#1F4E67', '#327C9F']
  },
  user: {
    base: '#B8860B',
    light: '#E6C15C',
    soft: 'rgba(184, 134, 11, 0.15)',
    glow: 'rgba(184, 134, 11, 0.4)',
    gradient: ['#A06A42', '#2D5B3A', '#1F4E67'] // Fusion tricolor
  }
};

export default function EstadoRedMap({ 
  userProfile, 
  onNodeClick, 
  searchQuery = '' 
}: { 
  userProfile: any, 
  onNodeClick: (type: 'user'|'territorio'|'ocupacion'|'ideologia', value: string) => void,
  searchQuery?: string
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showLegend, setShowLegend] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Extracción del perfil real del usuario
  const userDepto = userProfile?.depto || 'La Paz';
  const userRubro = userProfile?.rubro || 'Gestores culturales';
  const userIdeologia = userProfile?.ideologia || 'Comunitario';

  // DEFINICIÓN RIGUROSA DE NODOS SOCIALES DE BOLIVIA
  const nodes = [
    // Centro: El Soberano (Tú)
    { id: 'me', cx: 500, cy: 380, r: 42, label: 'Tú (Soberano)', type: 'user', category: 'Tu Identidad', seed: 1, desc: 'Tu nodo cívico sintonizado de manera sincrónica.', val: 'me' },

    // Nodos Territoriales (Verde - Green) - Distribución andino-amazónica
    { id: 't_lp', cx: 330, cy: 300, r: 24, label: 'La Paz', type: 'territorio', category: 'Territorio', seed: 1.1, desc: 'Cabildos andinos de autogobierno plurinacional.', val: 'La Paz' },
    { id: 't_sc', cx: 670, cy: 390, r: 25, label: 'Santa Cruz', type: 'territorio', category: 'Territorio', seed: 1.2, desc: 'Cabildos civiles de las llanos orientales y agro-producción.', val: 'Santa Cruz' },
    { id: 't_cb', cx: 480, cy: 490, r: 23, label: 'Cochabamba', type: 'territorio', category: 'Territorio', seed: 1.3, desc: 'Integración de valles y asambleísmo agroecológico libre.', val: 'Cochabamba' },
    { id: 't_or', cx: 310, cy: 460, r: 21, label: 'Oruro', type: 'territorio', category: 'Territorio', seed: 1.4, desc: 'Descentralización minera y defensa soberana del altiplano.', val: 'Oruro' },
    { id: 't_pt', cx: 360, cy: 590, r: 22, label: 'Potosí', type: 'territorio', category: 'Territorio', seed: 1.5, desc: 'Comunas de tierras altas y control soberano de recursos y litio.', val: 'Potosí' },
    { id: 't_tj', cx: 510, cy: 680, r: 21, label: 'Tarija', type: 'territorio', category: 'Territorio', seed: 1.6, desc: 'Asambleas de Chaco y producción campesina vitivinícola.', val: 'Tarija' },
    { id: 't_ch', cx: 490, cy: 580, r: 21, label: 'Chuquisaca', type: 'territorio', category: 'Territorio', seed: 1.7, desc: 'Cuna deliberativa histórica y debates sobre soberanía jurídica.', val: 'Chuquisaca' },
    { id: 't_bn', cx: 540, cy: 220, r: 22, label: 'Beni', type: 'territorio', category: 'Territorio', seed: 1.8, desc: 'Gobernanza hídrica de la cuenca amazónica y asambleas forestales.', val: 'Beni' },
    { id: 't_pd', cx: 380, cy: 150, r: 20, label: 'Pando', type: 'territorio', category: 'Territorio', seed: 1.9, desc: 'Desarrollo forestal de castaña y articulación fronteriza.', val: 'Pando' },

    // Nodos de Ocupación / Gremios (Café - Brown) - Flanco Izquierdo
    { id: 'o_civ', cx: 150, cy: 160, r: 23, label: 'Cívico', type: 'ocupacion', category: 'Ocupación', seed: 2.1, desc: 'Coordinación barrial, juntas vecinales y control cívico directo.', val: 'Cívico' },
    { id: 'o_tec', cx: 120, cy: 270, r: 24, label: 'Tecnología', type: 'ocupacion', category: 'Ocupación', seed: 2.2, desc: 'Cívicos digitales, codificadores y tejedores de procesos automatizados.', val: 'Tecnología' },
    { id: 'o_edu', cx: 110, cy: 390, r: 22, label: 'Educación', type: 'ocupacion', category: 'Ocupación', seed: 2.3, desc: 'Maestros, investigadores de autonomía y educadores populares.', val: 'Educación' },
    { id: 'o_sal', cx: 130, cy: 500, r: 22, label: 'Salud', type: 'ocupacion', category: 'Ocupación', seed: 2.4, desc: 'Salud intercultural, medicina tradicional y redes de apoyo rural.', val: 'Salud' },
    { id: 'o_agr', cx: 170, cy: 615, r: 23, label: 'Agrario', type: 'ocupacion', category: 'Ocupación', seed: 2.5, desc: 'Sindicatos agrarios, campesinos y cooperativismo plurinacional.', val: 'Agrario' },
    { id: 'o_com', cx: 140, cy: 710, r: 23, label: 'Comercio', type: 'ocupacion', category: 'Ocupación', seed: 2.6, desc: 'Asociaciones comerciales, ferias populares y mercado libre solidario.', val: 'Comercio' },
    { id: 'o_cul', cx: 220, cy: 220, r: 24, label: 'Gestores culturales', type: 'ocupacion', category: 'Ocupación', seed: 2.7, desc: 'Artes escénicas, saberes originarios y difusores de tejido cultural.', val: 'Gestores culturales' },

    // Nodos de Ideología (Azul - Blue) - Flanco Derecho
    { id: 'i_pra', cx: 860, cy: 190, r: 23, label: 'Pragmático', type: 'ideologia', category: 'Ideología', seed: 3.1, desc: 'Gestión pública ágil orientada a resultados técnicos tangibles.', val: 'Pragmático' },
    { id: 'i_aut', cx: 890, cy: 340, r: 24, label: 'Autonomista', type: 'ideologia', category: 'Ideología', seed: 3.2, desc: 'Defensores de la autodeterminación departamental y federalismo.', val: 'Autonomista' },
    { id: 'i_com', cx: 870, cy: 490, r: 24, label: 'Comunitario', type: 'ideologia', category: 'Ideología', seed: 3.3, desc: 'Decisiones consensuadas horizontales por usos y costumbres.', val: 'Comunitario' },
    { id: 'i_des', cx: 840, cy: 620, r: 23, label: 'Descentralista', type: 'ideologia', category: 'Ideología', seed: 3.4, desc: 'Articulación para delegar y transferir recursos del centralismo estatal.', val: 'Descentralista' }
  ];

  // ENLACES / ESTRUCTURA DE LA TAPICERÍA
  const edges = [
    // Conexiones de la Tríada Soberana de la Persona Real (Se identifican dinámicamente)
    { source: 'me', target: 'La Paz', type: 'soberano' }, 
    { source: 'me', target: 'Santa Cruz', type: 'soberano' }, 
    { source: 'me', target: 'Cochabamba', type: 'soberano' }, 
    { source: 'me', target: 'Oruro', type: 'soberano' }, 
    { source: 'me', target: 'Potosí', type: 'soberano' }, 
    { source: 'me', target: 'Tarija', type: 'soberano' }, 
    { source: 'me', target: 'Chuquisaca', type: 'soberano' }, 
    { source: 'me', target: 'Beni', type: 'soberano' }, 
    { source: 'me', target: 'Pando', type: 'soberano' }, 

    { source: 'me', target: 'Cívico', type: 'soberano' },
    { source: 'me', target: 'Tecnología', type: 'soberano' },
    { source: 'me', target: 'Educación', type: 'soberano' },
    { source: 'me', target: 'Salud', type: 'soberano' },
    { source: 'me', target: 'Agrario', type: 'soberano' },
    { source: 'me', target: 'Comercio', type: 'soberano' },
    { source: 'me', target: 'Gestores culturales', type: 'soberano' },

    { source: 'me', target: 'Pragmático', type: 'soberano' },
    { source: 'me', target: 'Autonomista', type: 'soberano' },
    { source: 'me', target: 'Comunitario', type: 'soberano' },
    { source: 'me', target: 'Descentralista', type: 'soberano' },

    // Tejido Estructural (Eje Territorial Andino-Amazónico)
    { source: 'La Paz', target: 'Oruro', type: 'comun' },
    { source: 'La Paz', target: 'Cochabamba', type: 'comun' },
    { source: 'Oruro', target: 'Potosí', type: 'comun' },
    { source: 'Potosí', target: 'Chuquisaca', type: 'comun' },
    { source: 'Chuquisaca', target: 'Tarija', type: 'comun' },
    { source: 'Cochabamba', target: 'Santa Cruz', type: 'comun' },
    { source: 'Santa Cruz', target: 'Beni', type: 'comun' },
    { source: 'Beni', target: 'Pando', type: 'comun' },
    { source: 'La Paz', target: 'Pando', type: 'comun' },

    // Cruces Sectoriales del Procomún
    { source: 'Gestores culturales', target: 'La Paz', type: 'comun' },
    { source: 'Gestores culturales', target: 'Cochabamba', type: 'comun' },
    { source: 'Tecnología', target: 'La Paz', type: 'comun' },
    { source: 'Tecnología', target: 'Santa Cruz', type: 'comun' },
    { source: 'Agrario', target: 'Cochabamba', type: 'comun' },
    { source: 'Agrario', target: 'Beni', type: 'comun' },
    { source: 'Comercio', target: 'Oruro', type: 'comun' },
    { source: 'Comercio', target: 'La Paz', type: 'comun' },

    // Cruces de Corrientes de Pensamiento
    { source: 'Comunitario', target: 'La Paz', type: 'comun' },
    { source: 'Comunitario', target: 'Oruro', type: 'comun' },
    { source: 'Autonomista', target: 'Santa Cruz', type: 'comun' },
    { source: 'Autonomista', target: 'Tarija', type: 'comun' },
    { source: 'Descentralista', target: 'Chuquisaca', type: 'comun' },
    { source: 'Pragmático', target: 'Cochabamba', type: 'comun' }
  ];

  // FILTRAJE PASIVO POR BÚSQUEDA
  const filteredNodes = nodes.map(node => {
    const matchesSearch = searchQuery.trim() !== '' && 
      (node.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
       node.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Identificación de si es de la Tríada personal del usuario
    const isDepto = node.type === 'territorio' && node.val === userDepto;
    const isRubro = node.type === 'ocupacion' && node.val === userRubro;
    const isIdeo = node.type === 'ideologia' && node.val === userIdeologia;
    const isPersonalNode = isDepto || isRubro || isIdeo;

    return {
      ...node,
      matchesSearch,
      isPersonalNode
    };
  });

  // FILTRAJE DE ENLACES ACTIVOS/RESTANTES
  const renderedEdges = edges.map(edge => {
    const src = filteredNodes.find(n => n.label === edge.source || (edge.source === 'me' && n.id === 'me'));
    const tgt = filteredNodes.find(n => n.label === edge.target || (edge.target === 'me' && n.id === 'me'));

    if (!src || !tgt) return null;

    // Determina si es un enlace de la Tríada soberana activa del usuario real
    const isTriadaEdge = (src.id === 'me' && tgt.isPersonalNode) || (tgt.id === 'me' && src.isPersonalNode);

    // Si es tipo 'soberano' pero no pertenece a la Tríada real, no lo dibujamos para mantener limpio el tapiz
    if (edge.type === 'soberano' && !isTriadaEdge) return null;

    return {
      id: `edge_${src.id}_${tgt.id}`,
      src,
      tgt,
      isTriadaEdge,
      type: edge.type
    };
  }).filter(Boolean) as any[];

  // GESTIÓN DE RATÓN Y ARRASTRE (PAN & ZOOM)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // TOUCH SUPPORT
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev * factor)));
  };

  const handleReset = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedNode(null);
  };

  // Centrar en un nodo al seleccionarlo o buscarlo
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      const match = filteredNodes.find(n => n.matchesSearch);
      if (match) {
        setPan({
          x: 500 - match.cx * zoom,
          y: 400 - match.cy * zoom
        });
      }
    }
  }, [searchQuery]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[620px] bg-[#FAF6EB] border border-[#ECE8DE] rounded-3xl overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner flex flex-col justify-between"
      style={{ 
        backgroundImage: 'radial-gradient(circle at center, #FAF6EB 0%, #FAF0DF 100%)' 
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* CAPA DE TEXTURA Y LÍNEAS DE TAPIZ DE FONDO */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.22]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="weaving-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0,10 L 40,10 M 0,30 L 40,30" stroke="#8E5831" strokeWidth="0.5" strokeDasharray="1 3" />
              <path d="M 10,0 L 10,40 M 30,0 L 30,40" stroke="#1F4E67" strokeWidth="0.5" strokeDasharray="1 3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#weaving-pattern)" />
          
          {/* Anillos concéntricos decorativos (El telar de EstadoRed) */}
          <circle cx="500" cy="380" r="160" fill="none" stroke="#2D5B3A" strokeWidth="0.75" strokeDasharray="3 5" className="opacity-80" />
          <circle cx="500" cy="380" r="320" fill="none" stroke="#8E5831" strokeWidth="0.75" strokeDasharray="4 8" className="opacity-80" />
          <circle cx="500" cy="380" r="440" fill="none" stroke="#1F4E67" strokeWidth="0.75" strokeDasharray="2 6" className="opacity-80" />
        </svg>
      </div>

      {/* CABECERA FLOTANTE DEL MAPA */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-[#FAF6EB]/90 backdrop-blur-md px-3.5 py-1.5 border border-[#ECE8DE] rounded-xl shadow-sm text-charcoal pointer-events-auto">
          <Compass className="w-4 h-4 text-sandbrown animate-spin-slow" />
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Tapiz de Coordinación Sincrónica</span>
        </div>
        <p className="text-[9px] text-[#8E5831] bg-[#FAF6EB]/80 backdrop-blur-sm px-2 py-0.5 rounded-lg w-fit border border-[#ECE8DE]/60 pointer-events-auto leading-normal">
          Tú: <span className="font-bold text-[#2D5B3A]">{userDepto}</span> • {userRubro} • <span className="font-bold text-[#1F4E67]">{userIdeologia}</span>
        </p>
      </div>

      {/* CONTROLES FLOTANTE DE COMUNICACIÓN (Lado derecho superior) */}
      <div className="absolute top-4 right-4 z-10 flex gap-1.5 pointer-events-auto">
        <button 
          onClick={() => handleZoom(1.2)}
          className="p-2 bg-white hover:bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl text-charcoal/80 transition shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center"
          title="Zoom +"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={() => handleZoom(0.8)}
          className="p-2 bg-white hover:bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl text-charcoal/80 transition shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center"
          title="Zoom -"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={handleReset}
          className="p-2 bg-white hover:bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl text-charcoal/80 transition shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center"
          title="Restaurar Centro"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* CAPA CENTRAL VECTORIAL (SVG PRINCIPAL) */}
      <svg 
        className="w-full h-full"
        viewBox="0 0 1000 800"
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          
          {/* 1. DIBUJAMOS LOS ENLACES DE TRÍADAS Y CONEXIONES (HILOS TRENZADOS / BRAIDED THREADS) */}
          {renderedEdges.map((edge) => {
            const { src, tgt, isTriadaEdge, type, id } = edge;

            const dx = tgt.cx - src.cx;
            const dy = tgt.cy - src.cy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 10) return null;

            // Determinar color base del hilo trenzado
            let baseColor = '#D4AF37'; // Soberano dorado por defecto
            if (tgt.type !== 'user') {
              baseColor = PALETTE[tgt.type as keyof typeof PALETTE]?.base || '#A06A42';
            } else if (src.type !== 'user') {
              baseColor = PALETTE[src.type as keyof typeof PALETTE]?.base || '#A06A42';
            }

            // GESTIÓN DE CONEXIÓN TRENZADA MEDIANTE SINE-WAVES DE INTERSECCIÓN
            const pointsCount = Math.floor(distance / 5);
            const pts1 = [];
            const pts2 = [];

            // Vector director normal
            const nx = -dy / distance;
            const ny = dx / distance;

            for (let j = 0; j <= pointsCount; j++) {
              const t = j / pointsCount;
              const px = src.cx + dx * t;
              const py = src.cy + dy * t;
              
              const freq = (distance / 45) * Math.PI * 2;
              const waveAmp = isTriadaEdge ? 4.2 : 2.5; 
              const displacement1 = Math.sin(t * freq) * waveAmp;
              const displacement2 = Math.sin(t * freq + Math.PI) * waveAmp;

              pts1.push(`${(px + nx * displacement1).toFixed(1)},${(py + ny * displacement1).toFixed(1)}`);
              pts2.push(`${(px + nx * displacement2).toFixed(1)},${(py + ny * displacement2).toFixed(1)}`);
            }

            const pathWave1 = `M ${pts1.join(' L ')}`;
            const pathWave2 = `M ${pts2.join(' L ')}`;

            return (
              <g 
                key={id} 
                className="transition-all duration-300"
                style={{ 
                  opacity: searchQuery.trim() !== '' 
                    ? (src.matchesSearch || tgt.matchesSearch ? 1 : 0.15)
                    : isTriadaEdge ? 1 : 0.45
                }}
              >
                {/* Canal central de soporte */}
                <path 
                  d={`M ${src.cx} ${src.cy} L ${tgt.cx} ${tgt.cy}`} 
                  stroke="#E8E2D2" 
                  strokeWidth={isTriadaEdge ? 7 : 4} 
                  strokeLinecap="round" 
                  fill="none"
                />
                
                {/* Hilera central base */}
                <path 
                  d={`M ${src.cx} ${src.cy} L ${tgt.cx} ${tgt.cy}`} 
                  stroke={baseColor} 
                  strokeWidth={isTriadaEdge ? 2.5 : 1.2} 
                  strokeLinecap="round" 
                  fill="none"
                  className={isTriadaEdge ? 'opacity-80' : 'opacity-30'}
                />

                {/* Hebras entrelazadas ondulatorias (Efecto trenzado) */}
                <path 
                  d={pathWave1} 
                  stroke={baseColor} 
                  strokeWidth={isTriadaEdge ? 2 : 1} 
                  fill="none" 
                  strokeLinecap="round" 
                  className={isTriadaEdge ? 'animate-pulse' : ''}
                />
                <path 
                  d={pathWave2} 
                  stroke={baseColor === '#D4AF37' ? '#A06A42' : baseColor} 
                  strokeWidth={isTriadaEdge ? 1.8 : 0.8} 
                  fill="none" 
                  strokeLinecap="round" 
                  className="brightness-125 opacity-90"
                />

                {/* Brillo dinámico si pertenece a la tríada del soberano */}
                {isTriadaEdge && (
                  <path 
                    d={`M ${src.cx} ${src.cy} L ${tgt.cx} ${tgt.cy}`} 
                    stroke="#FFF5D1" 
                    strokeWidth={5} 
                    strokeLinecap="round" 
                    fill="none"
                    strokeDasharray="16, 50" 
                    className="opacity-70"
                    style={{
                      animation: 'weaving_glow 5s linear infinite'
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* 2. DIBUJAMOS LOS NODOS INDIVIDUALES (CANTOS RODADOS / RIVERBED STONES) */}
          {filteredNodes.map((node) => {
            const isUser = node.type === 'user';
            const colorGroup = PALETTE[node.type as keyof typeof PALETTE] || PALETTE.territorio;
            
            // Si el nodo coincide con la búsqueda
            const isMatched = node.matchesSearch;
            
            // Si tiene estado de hover
            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedNode?.id === node.id;

            // Escala del nodo basado en interacción
            let sizeMultiplier = 1.0;
            if (isHovered || isSelected) sizeMultiplier = 1.18;
            if (isMatched) sizeMultiplier = 1.25;

            const radius = node.r * sizeMultiplier;
            const pebblePath = getOrganicPebblePath(node.cx, node.cy, radius, node.seed);

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                style={{
                  opacity: searchQuery.trim() !== '' && !isMatched ? 0.3 : 1
                }}
              >
                {/* Aura luminosa (Aura de sintonía) */}
                <path
                  d={pebblePath}
                  fill="none"
                  stroke={isMatched ? '#D4AF37' : colorGroup.light}
                  strokeWidth={isMatched || isSelected || isHovered ? 12 : 0}
                  className="transition-all duration-500 opacity-20 filter blur-xs animate-ping"
                  style={{ animationDuration: '3s' }}
                />

                {/* Aro dorado si es nodo clave de tu Tríada */}
                {node.isPersonalNode && (
                  <path
                    d={getOrganicPebblePath(node.cx, node.cy, radius + 5.5, node.seed + 0.1)}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth={2.5}
                    strokeDasharray="4 3"
                    className="opacity-90 animate-[spin_50s_linear_infinite]"
                  />
                )}

                {/* Sombra de la piedra para dar profundidad orgánica */}
                <path
                  d={getOrganicPebblePath(node.cx, node.cy + 4, radius, node.seed)}
                  fill="rgba(43, 41, 39, 0.15)"
                  className="transition-all duration-300"
                />

                {/* Cuerpo del Canto Rodado (Piedra lisa) */}
                <path
                  d={pebblePath}
                  fill={isUser ? 'url(#pebble-user-grad)' : `url(#pebble-grad-${node.id})`}
                  stroke={isMatched ? '#D4AF37' : isHovered ? colorGroup.light : '#ECE8DE'}
                  strokeWidth={isUser ? 3 : isHovered ? 2.5 : 1.8}
                  className="transition-all duration-300 hover:brightness-105"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.06))"
                />

                {/* Definiciones locales de degradados exclusivos por cada piedra */}
                <defs>
                  <linearGradient id={`pebble-grad-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colorGroup.light} />
                    <stop offset="100%" stopColor={colorGroup.base} />
                  </linearGradient>
                  <radialGradient id="pebble-user-grad" cx="40%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FFF2CC" />
                    <stop offset="35%" stopColor="#E6C15C" />
                    <stop offset="100%" stopColor="#A06A42" />
                  </radialGradient>
                </defs>

                {/* Emoticón o Icono interno en el centro exacto del canto rodado */}
                <text
                  x={node.cx}
                  y={node.cy + 4}
                  textAnchor="middle"
                  className="select-none font-bold text-xs pointer-events-none fill-white/95"
                  style={{
                    fontSize: isUser ? '16px' : radius > 22 ? '11px' : '9.5px',
                    fontFamily: 'system-ui, sans-serif'
                  }}
                >
                  {isUser ? '👑' : node.type === 'territorio' ? '🌱' : node.type === 'ocupacion' ? '🛠️' : '⚖️'}
                </text>

                {/* Etiqueta humana estilizada */}
                <g transform={`translate(${node.cx}, ${node.cy + radius + 15})`}>
                  {/* Fondo para la etiqueta para máxima legibilidad */}
                  <rect
                    x={-(node.label.length * 4) - 6}
                    y={-10}
                    width={(node.label.length * 8) + 12}
                    height={16}
                    rx={6}
                    fill="#FAF6EB"
                    className="opacity-90 stroke-[#ECE8DE]/60 stroke-1"
                  />
                  <text
                    textAnchor="middle"
                    className="font-serif font-black select-none pointer-events-none"
                    style={{
                      fontSize: isUser ? '10px' : '8.5px',
                      fill: isUser ? '#B8860B' : '#2B2927'
                    }}
                  >
                    {node.label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* CONTROLES E PANEL DE LEYENDA (Abajo izquierdo) */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2 pointer-events-auto">
        <button 
          onClick={() => setShowLegend(true)}
          className="stone-btn bg-white hover:bg-[#FAF9F5] border border-[#ECE8DE] text-charcoal/80 px-3.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-sandbrown" /> ¿Qué teje esta red?
        </button>
      </div>

      {/* OVERLAY DEL NODO SELECCIONADO (Esquina inferior derecha) */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-[#ECE8DE] p-4.5 rounded-2xl shadow-xl w-64 max-w-[90%] animate-in slide-in-from-right duration-300 pointer-events-auto text-xs">
          <button 
            onClick={() => setSelectedNode(null)} 
            className="absolute top-2.5 right-2.5 text-charcoal/30 hover:text-charcoal cursor-pointer text-base bg-transparent border-none font-bold"
          >
            &times;
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">
              {selectedNode.type === 'user' ? '👑' : selectedNode.type === 'territorio' ? '🌱' : selectedNode.type === 'ocupacion' ? '🛠️' : '⚖️'}
            </span>
            <div>
              <h4 className="font-serif font-black text-charcoal text-[13px] leading-tight">
                {selectedNode.label}
              </h4>
              <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                selectedNode.type === 'territorio' 
                  ? 'bg-palmgreen/10 text-palmgreen border-palmgreen/20' 
                  : selectedNode.type === 'ocupacion' 
                    ? 'bg-sandbrown/10 text-sandbrown border-sandbrown/20' 
                    : 'bg-[#1F4E67]/10 text-[#327C9F] border-[#1F4E67]/20'
              }`}>
                {selectedNode.category}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-charcoal/60 leading-normal mb-3.5 italic">
            "{selectedNode.desc}"
          </p>

          <button 
            onClick={() => {
              if (selectedNode.type === 'user') {
                onNodeClick('user', 'me');
              } else {
                onNodeClick(selectedNode.type, selectedNode.val);
              }
              setSelectedNode(null);
            }}
            className="stone-btn w-full py-2 bg-charcoal text-white rounded-xl font-bold text-[9px] uppercase tracking-widest flex justify-center items-center gap-1.5 transition cursor-pointer hover:bg-charcoal/90"
          >
            <span>Entrar al Canal Sincrónico</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* MODAL EXPLICATIVO (LEYENDA DE LA RED) */}
      {showLegend && (
        <div className="absolute inset-0 bg-charcoal/45 backdrop-blur-xs z-[2000] flex items-center justify-center p-4">
          <div className="bg-[#FAF6EB] border border-[#ECE8DE] p-6 rounded-3xl max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans">
            <button 
              onClick={() => setShowLegend(false)} 
              className="absolute top-4 right-4 text-charcoal/30 hover:text-charcoal text-lg cursor-pointer bg-transparent border-none font-bold"
            >
              &times;
            </button>
            
            <h4 className="font-serif font-black text-charcoal mb-3 uppercase flex items-center gap-2 text-xs md:text-sm">
              <Sparkles className="w-4.5 h-4.5 text-sandbrown animate-pulse" />
              Soberanía Colectiva del EstadoRed
            </h4>
            
            <p className="text-charcoal/70 text-[11px] mb-4 leading-relaxed">
              Esta cartografía no representa tierras estériles sino el <strong>tejido social y político vivo</strong> de Bolivia, organizado bajo una tríada deliberativa:
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex gap-3 items-start bg-white/70 p-2.5 rounded-xl border border-[#ECE8DE]/60">
                <span className="text-lg">🌱</span>
                <div>
                  <p className="font-serif font-black text-[#2D5B3A] text-[10.5px] uppercase tracking-wider">Territorio (Verde)</p>
                  <p className="text-[10px] text-charcoal/60 leading-normal">Los 9 departamentos constituyentes y sus asambleas de cabildos libres.</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start bg-white/70 p-2.5 rounded-xl border border-[#ECE8DE]/60">
                <span className="text-lg">🛠️</span>
                <div>
                  <p className="font-serif font-black text-[#8E5831] text-[10.5px] uppercase tracking-wider">Ocupación (Café)</p>
                  <p className="text-[10px] text-charcoal/60 leading-normal">Tus oficios, gremios, sindicatos y el empuje agroproductivo de la patria.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-white/70 p-2.5 rounded-xl border border-[#ECE8DE]/60">
                <span className="text-lg">⚖️</span>
                <div>
                  <p className="font-serif font-black text-[#1F4E67] text-[10.5px] uppercase tracking-wider">Ideología (Azul)</p>
                  <p className="text-[10px] text-charcoal/60 leading-normal">Las corrientes intelectuales y visiones constitucionales del procomún.</p>
                </div>
              </div>
            </div>

            <p className="text-[10.5px] text-charcoal/60 italic leading-relaxed text-center bg-[#FAF0DF] p-3 rounded-2xl border border-[#ECE8DE]">
              "Los hilos trenzados amarillos representan tu conexión de tríada soberana directa. Conecta con otros cantos rodados haciendo clic en ellos."
            </p>
          </div>
        </div>
      )}

      {/* ESTILOS DE ESTA CAPA TÉRMICA */}
      <style>{`
        @keyframes weaving_glow {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .animate-spin-slow {
          animation: spin_map 15s linear infinite;
        }
        @keyframes spin_map {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
