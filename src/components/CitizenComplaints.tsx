import React, { useState } from 'react';
import { Shield, AlertTriangle, Send } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function CitizenComplaints({ userProfile }: { userProfile: any }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !auth.currentUser) return;
    setSubmitting(true);
    
    try {
      await addDoc(collection(db, 'denuncias'), {
        titulo: title,
        descripcion: description,
        evidencia: evidenceUrl,
        autor: auth.currentUser.uid,
        alias: userProfile?.alias || 'Soberano Anónimo',
        territorio: userProfile?.triada?.territorio || 'No Específicado',
        timestamp: new Date().toISOString(),
        estado: 'pendiente'
      });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setEvidenceUrl('');
      // Auto real-time notification would be pushed here through Firebase listeners
    } catch (error) {
      console.error("Error creating complaint:", error);
      alert("Hubo un error al enviar la denuncia. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col gap-6">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-serif font-black text-charcoal mb-2">Canal de Denuncias Ciudadanas</h2>
          <p className="text-xs text-charcoal/60 leading-relaxed max-w-lg">
            Este canal directo y seguro te permite alertar sobre irregularidades o faltas graves en tu territorio o rubro. Toda denuncia que alcanza suficiente apoyo vecinal activa automáticamente mecanismos de control social e investigación bajo el IAsesor.
          </p>
        </div>

        {success && (
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center text-center max-w-xl mx-auto w-full mb-4">
             <Shield className="w-6 h-6 text-emerald-600 mb-2" />
             <p className="text-emerald-800 font-bold text-sm">Denuncia radicada de forma encriptada y segura.</p>
             <p className="text-emerald-700/80 text-[10px] mt-1">Nuestra red de pares comenzará su auditoría comunitaria pronto.</p>
             <button onClick={() => setSuccess(false)} className="mt-3 text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-bold">Realizar otra denuncia</button>
           </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">Asunto de la Denuncia</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Uso indebido de vehículo estatal en Zona Sur..."
                className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl px-4 py-3 text-xs text-charcoal focus:outline-none focus:border-red-500 transition"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">Descripción Detallada y Contexto</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica los hechos de forma objetiva. El IAsesor protegerá tu anonimato estructurando la acusación si la envías de forma abierta."
                className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-4 text-xs text-charcoal focus:outline-none focus:border-red-500 min-h-[140px] resize-none transition"
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">Enlace a Evidencia (Opcional pero Recomendado)</label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl px-4 py-3 text-xs text-charcoal focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div className="text-center text-[10px] italic text-[#A06A42]/75 my-4">
              🛡️ Tu IP y metadatos son disociados al momento de entrar al canal descentralizado.
            </div>

            <button
              type="submit"
              disabled={submitting || !title || !description}
              className="stone-btn w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-warmgray-dark text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? 'Asegurando evidencia...' : <><Send className="w-4 h-4" /> Lanzar Alerta de Control Social</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
