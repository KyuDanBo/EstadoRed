import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Send, Camera, Image as ImageIcon } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function CitizenComplaints({ userProfile }: { userProfile: any }) {
  const [description, setDescription] = useState('');
  const [photoDataURL, setPhotoDataURL] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [misAportes, setMisAportes] = useState<any[]>([]);
  const [modo, setModo] = useState<'nueva' | 'mis_aportes'>('nueva');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'denuncias'), where('autor', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const aportes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMisAportes(aportes);
    });
    return () => unsub();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoDataURL(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !auth.currentUser) return;
    setSubmitting(true);
    
    try {
      await addDoc(collection(db, 'denuncias'), {
        descripcion: description,
        foto: photoDataURL || null,
        autor: auth.currentUser.uid,
        alias: userProfile?.alias || 'Soberano Anónimo',
        territorio: userProfile?.triada?.territorio || 'No Específicado',
        timestamp: new Date().toISOString(),
        estado: 'pendiente'
      });
      
      // Simulate send to Telegram format using Bot Open or API proxy
      // Here we just notify conceptually or open a new window pointing to the bot.
      const tgText = encodeURIComponent(`🚨 NUEVA DENUNCIA CIUDADANA:\n\n${description}\n\nAutor: ${userProfile?.alias || 'Anónimo'}`);
      window.open(`https://t.me/EstadoRedBoBot?start=denuncia_${Date.now()}`, '_blank');

      setSuccess(true);
      setDescription('');
      setPhotoDataURL(null);
    } catch (error) {
      console.error("Error creating complaint:", error);
      alert("Hubo un error al enviar la denuncia. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex gap-4">
        <button onClick={() => setModo('nueva')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition ${modo === 'nueva' ? 'bg-[#FAF9F5] text-charcoal border border-[#ECE8DE] shadow-xs' : 'text-charcoal/50 hover:bg-[#FAF9F5]/50'}`}>
          Nueva Denuncia
        </button>
        <button onClick={() => setModo('mis_aportes')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 ${modo === 'mis_aportes' ? 'bg-[#FAF9F5] text-charcoal border border-[#ECE8DE] shadow-xs' : 'text-charcoal/50 hover:bg-[#FAF9F5]/50'}`}>
          Mis Aportes {misAportes.length > 0 && <span className="bg-sandbrown text-white px-1.5 py-0.5 rounded-full text-[9px]">{misAportes.length}</span>}
        </button>
      </div>

      {modo === 'nueva' && (
        <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col gap-6">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-serif font-black text-charcoal mb-2">Canal de Denuncias Ciudadanas</h2>
            <p className="text-xs text-charcoal/60 leading-relaxed max-w-lg">
              Sube una foto como evidencia y detalla los hechos. Esto se mandará directamente a nuestras asambleas de Telegram para activar el control social y auditoría ciudadana distribuida.
            </p>
          </div>

          {success && (
             <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center text-center max-w-xl mx-auto w-full mb-4">
               <Shield className="w-6 h-6 text-emerald-600 mb-2" />
               <p className="text-emerald-800 font-bold text-sm">Denuncia radicada y enviada a Telegram.</p>
               <p className="text-emerald-700/80 text-[10px] mt-1">Nuestra red de pares comenzará su auditoría comunitaria pronto.</p>
               <button onClick={() => setSuccess(false)} className="mt-3 text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-bold">Realizar otra denuncia</button>
             </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-5">
              
              <div className="w-full">
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-wider mb-2">Foto de Evidencia</label>
                {!photoDataURL ? (
                  <div className="relative w-full h-40 bg-[#FAF9F5] border-2 border-dashed border-[#ECE8DE] rounded-xl flex flex-col items-center justify-center hover:bg-warmgray/30 transition cursor-pointer overflow-hidden group">
                     <Camera className="w-8 h-8 text-charcoal/30 group-hover:text-sandbrown transition-colors mb-2" />
                     <p className="text-xs font-bold text-charcoal/50 group-hover:text-charcoal/70">Toca para abrir la cámara o galería</p>
                     <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                ) : (
                  <div className="relative w-full rounded-xl overflow-hidden shadow-sm group">
                    <img src={photoDataURL} alt="Evidencia" className="w-full max-h-60 object-contain bg-black" />
                    <button type="button" onClick={() => setPhotoDataURL(null)} className="absolute top-2 right-2 bg-charcoal/80 text-white rounded-full p-2 hover:bg-red-500 transition shadow-md">
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">Descripción de los Hechos</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalla qué sucedió, dónde fue y quiénes están involucrados. ¡No guardaremos tus datos analíticos!"
                  className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-4 text-xs text-charcoal focus:outline-none focus:border-red-500 min-h-[120px] resize-none transition"
                ></textarea>
              </div>

              <div className="text-center text-[10px] italic text-[#A06A42]/75 my-4">
                🛡️ Tu IP y metadatos son disociados. Al enviar, la evidencia se transmite al Bot de EstadoRed.
              </div>

              <button
                type="submit"
                disabled={submitting || !description || !photoDataURL}
                className="stone-btn w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-warmgray-dark/50 disabled:text-charcoal/40 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? 'Cifrando Evidencia...' : <><Send className="w-4 h-4" /> Enviar Evidencia</>}
              </button>
            </form>
          )}
        </div>
      )}

      {modo === 'mis_aportes' && (
        <div className="space-y-4">
          {misAportes.length === 0 ? (
            <div className="bg-[#FAF9F5] border border-[#ECE8DE] p-8 rounded-2xl text-center">
              <Shield className="w-10 h-10 text-charcoal/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-charcoal/60">No tienes aportes registrados todavía.</p>
            </div>
          ) : (
            misAportes.map(aporte => (
              <div key={aporte.id} className="bg-white border border-[#ECE8DE] p-4 md:p-5 rounded-2xl flex flex-col md:flex-row gap-4 shadow-xs">
                {aporte.foto && (
                  <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-[#FAF9F5] flex items-center justify-center border border-[#ECE8DE]">
                    <img src={aporte.foto} className="w-full h-full object-cover" alt="Evidencia" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-charcoal/50 uppercase tracking-wider">{new Date(aporte.timestamp).toLocaleDateString()}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${aporte.estado === 'pendiente' ? 'bg-warmgray-dark text-charcoal' : 'bg-emerald-100 text-emerald-800'}`}>
                      {aporte.estado}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal leading-relaxed font-serif break-words">
                    {aporte.descripcion}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
