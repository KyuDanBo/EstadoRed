import * as fs from 'fs';

const path = 'src/components/AdminView.tsx';
let content = fs.readFileSync(path, 'utf-8');

const votacionesContent = `
      {adminTab === 'votaciones' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-sm rounded-3xl">
            <h3 className="font-serif font-black text-xl text-charcoal flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-palmgreen" /> Gestión de Votaciones
            </h3>
            <p className="text-xs text-charcoal/60 mb-6">
              Esta sección permite a los administradores programar y publicar nuevas consultas vinculantes en la red, 
              así como controlar el estado de votación. (Se pueden agregar formularios más extensos en las próximas versiones).
            </p>
            <div className="bg-warmgray/30 p-4 border border-brand-200 shadow-inner rounded-xl">
              <p className="text-sm font-bold text-brand-800">Has activado con éxito la primera votación nacional:</p>
              <ul className="list-disc text-xs text-brand-700/80 pl-5 mt-2 space-y-1">
                <li>Ante la imposibilidad de dialogo con los sectores movilizados ¿Qué debería hacer el Gobierno nacional?</li>
                <li>Habilitada en la Red: Nacional</li>
              </ul>
              <button 
                onClick={() => alert("Función para crear nuevas votaciones será habilitada en el futuro.")} 
                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                + Crear Nueva Votación
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace("{adminTab === 'telegram' && (", votacionesContent + "\n      {adminTab === 'telegram' && (");
fs.writeFileSync(path, content);
console.log("Injected Votaciones to AdminView");
