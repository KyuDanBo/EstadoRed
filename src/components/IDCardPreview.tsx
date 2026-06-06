import React from 'react';
import { Network, MapPin, Briefcase, Brain, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import EstadoRedLogo from './EstadoRedLogo';

interface IDCardProps {
  respuestas: Record<string, any>;
  pasoActual: string;
}

export default function IDCardPreview({ respuestas, pasoActual }: IDCardProps) {
  // Solo se muestra en formulario y completado
  if (pasoActual !== 'formulario' && pasoActual !== 'completado') return null;

  const isRep = respuestas['rol'] === 'Representante o Autoridad (Quiero escuchar, liderar y rendir cuentas)';

  const alias = isRep ? (respuestas['rep_nombre'] || '...') : (respuestas['alias'] || 'Nuevo Nodo');
  const avatar = isRep ? '🏛️' : (respuestas['avatar'] || '👤');

  const territorio = respuestas['comunidad'] || respuestas['municipio'] || respuestas['departamento'] || 'Ubicación local';
  const ocupacion = respuestas['ocupacion_otro'] || respuestas['ocupacion'] || respuestas['sector'] || 'Ocupación general';
  const ideologia = respuestas['ideologia_otro'] || respuestas['ideologia'] || 'Visión general';

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 md:p-10 z-0">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
        className="relative w-full max-w-sm bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 text-white"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 255, 102, 0.1)' }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <EstadoRedLogo showText={false} className="w-24 h-24" />
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-emerald-500"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-mono tracking-[0.2em] text-brand-500 uppercase mb-1">
                {isRep ? 'Representante' : 'Nodo Soberano'}
              </p>
              <h3 className="text-xl font-bold tracking-tight text-slate-100">
                {alias}
              </h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner">
              {avatar}
            </div>
          </div>

          <div className="h-px w-full bg-white/10 mb-6" />

          {/* Body */}
          <div className="space-y-4 flex-1">
            <InfoRow 
              icon={<MapPin className="text-brand-400" size={16} />} 
              label="Territorio" 
              value={territorio} 
              active={!!respuestas['departamento']}
            />
            {isRep ? (
              <>
                <InfoRow 
                  icon={<Briefcase className="text-brand-400" size={16} />} 
                  label="Cargo/Ocupación" 
                  value={respuestas['rep_cargo'] || 'Cargo en función'} 
                  active={!!respuestas['rep_cargo']}
                />
                <InfoRow 
                  icon={<Shield className="text-brand-400" size={16} />} 
                  label="Jurisdicción" 
                  value={respuestas['rep_jur'] || 'Área de jurisdicción'} 
                  active={!!respuestas['rep_jur']}
                />
              </>
            ) : (
              <>
                <InfoRow 
                  icon={<Briefcase className="text-brand-400" size={16} />} 
                  label="Sector / Ocupación" 
                  value={ocupacion} 
                  active={!!respuestas['sector']}
                />
                <InfoRow 
                  icon={<Brain className="text-brand-400" size={16} />} 
                  label="Ideología / Orientación" 
                  value={ideologia} 
                  active={!!respuestas['prioridad']}
                />
              </>
            )}
            
          </div>

          {/* Footer - Status */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Sincronización en curso</span>
            </div>
            <Network className="text-white/20" size={18} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ icon, label, value, active }: { icon: React.ReactNode; label: string; value: string; active: boolean }) {
  return (
    <div className={`flex items-start gap-3 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[9px] font-mono tracking-wider text-slate-400 uppercase mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-200 leading-tight">{value}</p>
      </div>
    </div>
  );
}
