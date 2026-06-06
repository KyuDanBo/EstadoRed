import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

// Recibimos la función "onCountryClick" desde nuestro archivo principal (App) y el "zoomConfig"
export default function GlobeViz({ onCountryClick, zoomConfig }: { onCountryClick?: (countryName: string) => void, zoomConfig?: { lat: number, lng: number, altitude: number, radius?: number } | null }) {
  // Referencia al contenedor HTML que envolverá nuestro globo
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null); // Controls globe rotation
  
  // Estados para tamaño, polígonos de países y el país que estamos mirando con el mouse
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState<any>();

  // Efecto secundario para inicializar el observador y descargar mapas limitados
  useEffect(() => {
    // 1. Descargamos la data con las coordenadas de todos los países de la tierra
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);

    const el = containerRef.current;
    if (!el) return;

    // 2. ResizeObserver nos avisa si la pantalla o el "padre" cambia de tamaño en vivo
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(el);

    // Limpiamos cuando el componente desaparece (evita fugas de memoria)
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  // Efecto secundario: Cuando el componente monta, y cuando cambian dimensiones
  useEffect(() => {
    if (globeRef.current) {
      if (zoomConfig) {
        // Detenemos la rotación para que el usuario pueda ver su región
        globeRef.current.controls().autoRotate = false;
        globeRef.current.pointOfView({ lat: zoomConfig.lat, lng: zoomConfig.lng, altitude: zoomConfig.altitude }, 2000);
      } else {
        // Le decimos al globo que gire solito suavemente
        globeRef.current.controls().autoRotate = true;
        globeRef.current.controls().autoRotateSpeed = 0.4;
        // Ponemos una vista un poco más alejada para que se vea completo
        globeRef.current.pointOfView({ altitude: 2.2 });
      }
    }
  }, [zoomConfig, dimensions.width]);

  return (
    <div ref={containerRef} className="w-full h-full bg-transparent overflow-hidden cursor-crosshair">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundColor="rgba(0,0,0,0)" // Fondo transparente para que combine con el diseño
          showAtmosphere={true}
          atmosphereColor="#c5905f" // Sandalwood Brown warmth
          atmosphereAltitude={0.15}
          
          // --- CONFIGURACIÓN DE LOS PAÍSES INTERACTIVOS ---
          polygonsData={countries.features}
          polygonAltitude={d => d === hoverD ? 0.08 : 0.02} // Si pasamos el mouse, el país "sobresale"
          polygonCapColor={d => d === hoverD ? 'rgba(197, 144, 95, 0.8)' : 'rgba(197, 144, 95, 0.25)'} 
          polygonSideColor={() => 'rgba(197, 144, 95, 0.4)'} 
          polygonStrokeColor={() => '#c5905f'} // Sandalwood border
          
          // Agregamos anillos (pulsos) para destacar el territorio activo
          ringsData={zoomConfig ? [zoomConfig] : []}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => '#2e5a44'} // Palm Green highlight
          ringMaxRadius={(d: any) => d.radius || 1}
          ringPropagationSpeed={2}
          ringRepeatPeriod={800}

          // La pequeña etiqueta textual que sale al pasar el mouse
          polygonLabel={({ properties: d }: any) => `
            <div class="bg-white border-l-4 border-[#c5905f] rounded-xl px-4 py-2.5 shadow-md text-[#333333] font-sans text-xs uppercase tracking-wider" style="font-family: 'Plus Jakarta Sans', sans-serif;">
              Elegir: <b class="text-[#c5905f] font-serif" style="font-family: 'Lora', serif; font-size: 13px;">${d.ADMIN}</b>
            </div>
          `}
          
          onPolygonHover={setHoverD}
          
          onPolygonClick={({ properties: d }: any) => {
            if (onCountryClick) {
              onCountryClick(d.ADMIN);
            }
          }}
        />
      )}
    </div>
  );
}
