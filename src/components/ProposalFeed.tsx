import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, runTransaction, getDoc, setDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { ThumbsUp, Leaf, BrainCircuit, Book, ArrowLeft, MessageSquare } from 'lucide-react';

export function cleanAIProposal(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^["'«»“”]|["'«»“”]$/g, '').trim();
  
  const prefixesToRemove = [
    /^(aquí tienes|aquí está|propuesta optimizada|propuesta reformulada|propuesta redactada|propuesta formal|propuesta final|propuesta sugerida|redacción final|redacción propuesta|versión propuesta|versión mejorada|versión formal|propuesta adaptada|propuesta corregida|resultado|resumen):/i,
    /^(aquí tienes|aquí está|propuesta optimizada|propuesta reformulada|propuesta redactada|propuesta formal|propuesta final|propuesta sugerida|redacción final|redacción propuesta|versión propuesta|versión mejorada|versión formal):\s*/i,
    /^(esta es la propuesta redactada|aquí tienes la propuesta mejorada|esta es una versión más profesional)/i
  ];
  
  for (const regex of prefixesToRemove) {
    cleaned = cleaned.replace(regex, '').trim();
  }

  if (cleaned.includes('EXPLICACIÓN:')) {
    cleaned = cleaned.split('EXPLICACIÓN:')[0].trim();
  } else if (cleaned.includes('Explicación:')) {
    cleaned = cleaned.split('Explicación:')[0].trim();
  } else if (cleaned.includes('Nota:')) {
    cleaned = cleaned.split('Nota:')[0].trim();
  }

  cleaned = cleaned.replace(/^["'«»“”]|["'«»“”]$/g, '').trim();
  return cleaned;
}

interface Proposal {
  id: string;
  userId: string;
  alias: string;
  content: string;
  aiSummary: string;
  supportCount: number;
  triada: {
    ocupacion: string;
    territorio: string;
    ideologia: string;
  };
  supportedByMe?: boolean;
}

interface NodeFilter {
  type: 'territorio' | 'ocupacion' | 'ideologia';
  value: string;
}

export default function ProposalFeed({ 
  currentUser, 
  nodeFilter 
}: { 
  currentUser: any; 
  nodeFilter: NodeFilter;
}) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const [newProposal, setNewProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReviewed, setAiReviewed] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!currentUser || !nodeFilter) {
      setLoading(false);
      return;
    }

    const filterField = `triada.${nodeFilter.type}`;
    const q = query(
      collection(db, 'proposals'),
      where(filterField, '==', nodeFilter.value)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched: Proposal[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        let supportedByMe = false;
        
        if (auth.currentUser) {
          try {
            const suppDoc = await getDoc(doc(db, 'proposals', d.id, 'supporters', auth.currentUser.uid));
            supportedByMe = suppDoc.exists();
          } catch (getErr) {
            handleFirestoreError(getErr, OperationType.GET, `proposals/${d.id}/supporters/${auth.currentUser.uid}`);
          }
        }

        fetched.push({
          id: d.id,
          userId: data.userId,
          alias: data.alias,
          content: data.content,
          aiSummary: data.aiSummary,
          supportCount: data.supportCount || 0,
          triada: data.triada,
          supportedByMe
        });
      }
      // Sort by support count DESC
      fetched.sort((a,b) => b.supportCount - a.supportCount);
      setProposals(fetched);
      setLoading(false);
    }, (error) => {
      console.error('Firestore Error in ProposalFeed:', error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'proposals');
    });

    return () => unsubscribe();
  }, [currentUser, nodeFilter]);

  const handleSupport = async (proposalId: string, creatorId: string) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const propRef = doc(db, 'proposals', proposalId);
    const suppRef = doc(propRef, 'supporters', uid);
    const creatorRef = doc(db, 'users', creatorId);

    try {
      await runTransaction(db, async (t) => {
        const suppDoc = await t.get(suppRef);
        if (suppDoc.exists()) {
          // Already supported
          return;
        }

        const propDoc = await t.get(propRef);
        const creatorDoc = await t.get(creatorRef);
        
        if (!propDoc.exists()) return;
        
        const newSupportCount = (propDoc.data()?.supportCount || 0) + 1;
        
        let newLevel = 1;
        if (newSupportCount >= 8) {
          newLevel = 3; // Nivel Nacional
        } else if (newSupportCount >= 3) {
          newLevel = 2; // Nivel Departamental
        }

        t.update(propRef, { 
          supportCount: newSupportCount,
          level: newLevel
        });
        t.set(suppRef, { joined: true });

        if (creatorDoc.exists()) {
          const stats = creatorDoc.data()?.stats || { ip: 0, xp: 0 };
          const g = creatorDoc.data()?.gamification || { ip_total: 0, xp_total: 0 };
          const oldIP = typeof g.ip_total === 'number' ? g.ip_total : stats.ip;
          const newIP = oldIP + 5;
          t.update(creatorRef, {
            'stats.ip': newIP,
            'gamification.ip_total': newIP
          });
        }
      });
    } catch (err) {
      console.error('Error in backing proposal transaction:', err);
      handleFirestoreError(err, OperationType.UPDATE, `proposals/${proposalId}`);
    }
  };

  const handleImproveProposal = async () => {
    if (!newProposal.trim() || aiLoading) return;
    setAiLoading(true);
    setAiFeedback('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Esta es mi propuesta en bruto: "${newProposal}". Redáctala de forma formal, técnica, neutral y constructiva (máximo 4 líneas). REGLA ESTRICTA: Tu respuesta DEBE tener este formato exacto:\n[TEXTO DE LA PROPUESTA]\nEXPLICACIÓN: [EXPLICACIÓN RESTRINGIDA A UNA LÍNEA]\nNo incluyas saludos ni texto antes de la propuesta.`,
          history: []
        })
      });
      const data = await response.json();
      if (data.success && data.reply) {
        let text = data.reply.trim();
        let newProp = text;
        let explanation = 'IAsesor ha reestructurado tu propuesta para mejorar su impacto.';
        
        if (text.includes('EXPLICACIÓN:')) {
            const parts = text.split('EXPLICACIÓN:');
            newProp = parts[0].trim();
            explanation = parts[1].trim();
        } else if (text.includes('Explicación:')) {
            const parts = text.split('Explicación:');
            newProp = parts[0].trim();
            explanation = parts[1].trim();
        }

        newProp = cleanAIProposal(newProp);
        setNewProposal(newProp);
        setAiFeedback(explanation);
        setAiReviewed(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewProposal(e.target.value);
    setAiReviewed(false);
    setAiFeedback('');
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposal.trim() || submitting || !auth.currentUser || !aiReviewed) return;
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           userId: auth.currentUser.uid,
           alias: currentUser.alias || 'Anónimo',
           territorio: currentUser.triada?.territorio || 'Nacional',
           ocupacion: currentUser.triada?.ocupacion || 'Cívico',
           ideologia: currentUser.triada?.ideologia || 'Pragmático',
           accion_2: newProposal
        })
      });

      const data = await response.json();
      if (!data.success || data.moderationStatus === 'rejected') {
        alert('La propuesta fue rechazada o hubo un error.');
        setSubmitting(false);
        return;
      }

      const colRef = doc(collection(db, 'proposals'));
      try {
        await setDoc(colRef, {
          userId: auth.currentUser!.uid,
          alias: currentUser.alias || 'Anónimo',
          content: newProposal,
          aiSummary: data.aiSummary || 'Propuesta de Alto Impacto',
          supportCount: 0,
          status: 'approved',
          level: 1,
          triada: {
            territorio: currentUser.triada?.territorio || 'Nacional',
            ocupacion: currentUser.triada?.ocupacion || 'Cívico',
            ideologia: currentUser.triada?.ideologia || 'Pragmático',
          },
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `proposals/${colRef.id}`);
      }

      try {
        const stats = currentUser.stats || { xp: 0, ip: 0 };
        const g = currentUser.gamification || { xp_total: 0, ip_total: 0 };
        const oldXP = typeof g.xp_total === 'number' ? g.xp_total : stats.xp;
        const newXP = oldXP + 20;

        await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
          accion_2: newProposal,
          'stats.xp': newXP,
          'gamification.xp_total': newXP
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser!.uid}`);
      }

      setNewProposal('');
      setAiReviewed(false);
      setAiFeedback('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch(err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-charcoal/50">Tejiendo hilos del Nodo...</div>;
  }

  if (selectedProposal) {
    return (
      <ProposalDetails
        proposal={selectedProposal}
        onBack={() => setSelectedProposal(null)}
        onSupport={() => handleSupport(selectedProposal.id, selectedProposal.userId)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Nuevo formulario de propuesta */}
      {(!showForm && proposals.length > 0) ? (
        <div className="flex justify-end mb-4">
           <button onClick={() => setShowForm(true)} className="stone-btn flex items-center gap-2 px-4 py-2 bg-white text-sandbrown border border-warmgray-dark rounded-xl shadow-sm hover:bg-warmgray/40 cursor-pointer font-semibold text-xs uppercase tracking-wider">
             <Book className="w-4 h-4" />
             Añadir Propuesta al Nodo
           </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitProposal} className="bg-creambg/40 p-5 border border-warmgray rounded-2xl relative z-10 transition-all focus-within:border-sandbrown focus-within:ring-1 focus-within:ring-sandbrown overflow-hidden">
          {submitSuccess && (
            <div className="absolute inset-0 bg-palmgreen/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in">
              <ThumbsUp className="w-10 h-10 text-white mb-2 animate-bounce" />
              <p className="font-bold text-white text-lg tracking-wide font-serif text-center">¡Propuesta Sembrada!</p>
              <p className="text-white/80 text-xs mt-1 text-center font-sans">Ahora es visible en las asambleas y en tu identidad.</p>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 items-center">
               <Book className="w-5 h-5 text-sandbrown" />
               <span className="font-semibold text-charcoal font-serif text-sm">Nueva Propuesta Directa</span>
            </div>
            {proposals.length > 0 && (
              <button type="button" onClick={() => setShowForm(false)} className="text-charcoal/40 hover:text-charcoal text-xs font-bold uppercase transition cursor-pointer">Cancelar</button>
            )}
          </div>
          
          <textarea
            value={newProposal}
            onChange={handleInputChange}
            placeholder="Describe el reto comunitario y tu propuesta..."
            className="w-full bg-white border border-warmgray-dark rounded-xl p-3.5 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-sandbrown min-h-[90px]"
            disabled={submitting || aiLoading}
          />

          {aiFeedback && (
            <div className="mt-3 p-3.5 bg-skyblue/10 border-l-2 border-skyblue-dark rounded-r-xl text-sm text-charcoal/80 animate-in fade-in leading-relaxed">
               <span className="font-semibold text-skyblue-dark block mb-1 flex items-center gap-1.5 font-serif"><BrainCircuit className="w-4 h-4" /> Recomendaciones del IAsesor</span>
               {aiFeedback}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            {!aiReviewed && (
               <button
                 type="button"
                 onClick={handleImproveProposal}
                 disabled={submitting || aiLoading || !newProposal.trim()}
                 className="stone-btn w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-skyblue/15 text-skyblue-dark border border-skyblue/35 text-xs font-bold rounded-xl hover:bg-skyblue/25 disabled:opacity-50 transition cursor-pointer"
               >
                 <BrainCircuit className="w-3" />
                 <span>{aiLoading ? 'Analizando...' : 'IAsesor: Fortalecer Propuesta'}</span>
               </button>
            )}

            {aiReviewed && (
              <span className="w-full sm:w-auto text-xs text-palmgreen-dark font-bold bg-palmgreen/10 border border-palmgreen/25 px-3 py-1.5 rounded-xl flex items-center justify-center gap-2">
                 <ThumbsUp className="w-3 h-3 text-palmgreen" /> Propuesta Lista para Sembrado
              </span>
            )}
            
            <button
              type="submit"
              disabled={submitting || !newProposal.trim() || aiLoading || !aiReviewed}
              className={`stone-btn w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition shadow ${!aiReviewed ? 'bg-warmgray text-charcoal/30 cursor-not-allowed border border-warmgray-dark/40' : 'bg-palmgreen text-white hover:bg-palmgreen-dark cursor-pointer'}`}
            >
              <span>{submitting ? 'Enviando...' : (aiReviewed ? 'Sembrar en la Asamblea' : 'Requiere IAsesor')}</span>
            </button>
          </div>
        </form>
      )}

      {proposals.length === 0 ? (
        <div className="p-12 text-center text-charcoal/50 bg-[#FAF9F5]/40 rounded-3xl border border-[#ECE8DE] animate-in fade-in zoom-in-95 duration-300">
          <h2 className="text-xl font-serif font-black text-charcoal mb-2">Gracias por conectarte al EstadoRed.</h2>
          <p className="text-sm text-charcoal/60 tracking-wider">Pronto contaremos con más contenido.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(p => (
            <div key={p.id} className="p-5 bg-white border border-warmgray rounded-2xl shadow-sm hover:shadow-md transition duration-300">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-charcoal font-serif text-[15px]">{p.alias}</span>
                  <span className="text-xs ml-2 text-charcoal/50">· {p.triada?.territorio}</span>
                </div>
                <div className="text-xs bg-sandbrown/10 px-2.5 py-1 rounded-md text-sandbrown-dark font-semibold">
                  {p.triada?.ideologia}
                </div>
              </div>

              {/* Visual Level indicator */}
              <div className="my-2.5 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider bg-creambg px-2.5 py-1.5 rounded-lg border border-warmgray-dark/40">
                <span className="text-charcoal/50">Nivel de Gobernanza:</span>
                {p.level === 3 ? (
                  <span className="text-red-600 font-extrabold flex items-center gap-1 font-serif">
                    🔥 DEMANDA NACIONAL VINCULANTE
                  </span>
                ) : p.level === 2 ? (
                  <span className="text-skyblue-dark font-semibold flex items-center gap-1 font-serif">
                    🔵 NIVEL DEPARTAMENTAL
                  </span>
                ) : (
                  <span className="text-palmgreen font-semibold flex items-center gap-1 font-serif">
                    🟢 NIVEL LOCAL / BASE
                  </span>
                )}
              </div>

              <div 
                className="cursor-pointer"
                onClick={() => setSelectedProposal(p)}
              >
                <div className="w-full h-1.5 bg-warmgray rounded-full overflow-hidden mb-3" title={`${p.supportCount} respaldos`}>
                  <div 
                    className={`h-full transition-all duration-500 ${
                      p.level === 3 ? 'bg-red-500' : p.level === 2 ? 'bg-skyblue' : 'bg-palmgreen'
                    }`} 
                    style={{ 
                      width: `${Math.min(100, ((p.supportCount || 0) / 8) * 100)}%` 
                    }}
                  ></div>
                </div>
                
                <p className="text-sm text-charcoal-dark font-serif font-semibold italic mb-2 hover:text-sandbrown transition-colors">"{p.aiSummary}"</p>
              </div>

              <div className="mt-4 pt-3 border-t border-warmgray/60 flex justify-between items-center text-sm">
                <span className="text-palmgreen-dark font-semibold flex items-center">
                  <span className="w-2 h-2 rounded-full bg-palmgreen animate-pulse mr-2"></span>
                  {p.supportCount} Respaldos
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSupport(p.id, p.userId); }}
                    disabled={p.supportedByMe || p.userId === auth.currentUser?.uid}
                    title={p.supportedByMe ? 'Ya has respaldado esta visión' : 'Respaldar Visión'}
                    className={`stone-btn flex justify-center items-center p-2.5 rounded-full shadow-sm transition cursor-pointer ${
                      p.supportedByMe 
                        ? 'bg-palmgreen/10 text-palmgreen-dark cursor-not-allowed border border-palmgreen/20'
                        : p.userId === auth.currentUser?.uid 
                            ? 'bg-warmgray text-charcoal/30 cursor-not-allowed border border-warmgray-dark/40'
                            : 'bg-palmgreen hover:bg-palmgreen-dark text-white hover:scale-105 active:scale-95'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalDetails({ proposal, onBack, onSupport }: { proposal: Proposal, onBack: () => void, onSupport: () => void }) {
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'proposals', proposal.id, 'comentarios'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setComentarios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [proposal.id]);

  const enviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !auth.currentUser) return;
    setEnviando(true);
    
    // Aquí el IAsesor solo impide insultos (simulado con regex básico o API si quisieramos)
    const insultos = ['insulto1', 'insulto2', 'tonto', 'idiota'];
    const esInsulto = insultos.some(i => nuevoComentario.toLowerCase().includes(i));
    
    if (esInsulto) {
      alert("IAsesor: Tu comentario contiene lenguaje inapropiado y no se puede publicar en la asamblea.");
      setEnviando(false);
      return;
    }

    try {
      await addDoc(collection(db, 'proposals', proposal.id, 'comentarios'), {
        userId: auth.currentUser.uid,
        alias: 'Usuario',
        texto: nuevoComentario.trim(),
        createdAt: serverTimestamp()
      });

      // Award +1 IP to the proposal creator
      const creatorRef = doc(db, 'users', proposal.userId);
      const creatorDoc = await getDoc(creatorRef);
      if (creatorDoc.exists()) {
        const stats = creatorDoc.data()?.stats || { ip: 0, xp: 0 };
        const g = creatorDoc.data()?.gamification || { ip_total: 0, xp_total: 0 };
        const oldIP = typeof g.ip_total === 'number' ? g.ip_total : stats.ip;
        const newIP = oldIP + 1;
        await updateDoc(creatorRef, {
          'stats.ip': newIP,
          'gamification.ip_total': newIP
        });
      }

      setNuevoComentario('');
    } catch (err) {
      console.error("Error al enviar comentario", err);
    }
    setEnviando(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-charcoal/50 hover:text-charcoal transition mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a las propuestas
      </button>

      <div className="bg-white border border-warmgray rounded-2xl shadow-sm p-6 md:p-8 relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="font-bold text-charcoal font-serif text-lg">{proposal.alias}</span>
            <span className="text-xs ml-2 text-charcoal/50 block mt-1">
              📍 {proposal.triada?.territorio} | 🛠️ {proposal.triada?.ocupacion}
            </span>
          </div>
          <div className="text-xs bg-sandbrown/10 px-3 py-1.5 rounded-md text-sandbrown-dark font-semibold">
            {proposal.triada?.ideologia}
          </div>
        </div>

        <p className="text-lg text-charcoal-dark font-serif font-semibold italic mb-6">"{proposal.aiSummary}"</p>
        
        <div className="bg-creambg/30 p-5 rounded-xl border border-warmgray-dark/20 whitespace-pre-line leading-relaxed text-charcoal text-sm mb-6">
          {proposal.content}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-warmgray">
          <span className="text-palmgreen-dark font-bold font-serif flex items-center gap-2 text-lg">
            <ThumbsUp className="w-5 h-5 text-palmgreen" /> {proposal.supportCount} Respaldos
          </span>
          <button 
            onClick={onSupport}
            disabled={proposal.supportedByMe || proposal.userId === auth.currentUser?.uid}
            className={`stone-btn px-6 py-3 rounded-xl font-bold tracking-wider uppercase transition shadow-md ${
               proposal.supportedByMe 
                 ? 'bg-palmgreen/10 text-palmgreen-dark cursor-not-allowed border-palmgreen/20'
                 : 'bg-palmgreen text-white hover:bg-palmgreen-dark'
            }`}
          >
            {proposal.supportedByMe ? 'Respaldado' : 'Respaldar Propuesta'}
          </button>
        </div>
      </div>

      <div className="bg-[#FAF9F5] border border-warmgray rounded-2xl p-6 md:p-8 shadow-sm">
        <h3 className="font-serif font-bold text-charcoal mb-6 flex items-center gap-2">
           <MessageSquare className="w-5 h-5 text-sandbrown" /> Debate Cívico
        </h3>

        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
          {comentarios.length === 0 ? (
            <p className="text-sm text-charcoal/50 italic text-center py-4">No hay opiniones aún. Sé el primero en debatir esta propuesta.</p>
          ) : (
            comentarios.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-xl border border-warmgray-dark/30 shadow-sm">
                <span className="font-bold text-xs uppercase tracking-wider text-charcoal/50 mb-1 block">Soberano de la red</span>
                <p className="text-charcoal text-sm leading-relaxed">{c.texto}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={enviarComentario} className="flex gap-3 items-end">
          <textarea
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            placeholder="Añade tu opinión constructiva..."
            className="flex-1 bg-white border border-warmgray-dark rounded-xl p-3.5 text-sm text-charcoal placeholder-charcoal/30 min-h-[50px] resize-none focus:outline-none focus:border-sandbrown"
          />
          <button 
            type="submit"
            disabled={!nuevoComentario.trim() || enviando}
            className="stone-btn px-5 py-3 bg-skyblue hover:bg-skyblue-dark disabled:bg-warmgray-dark text-white font-bold rounded-xl transition shadow"
          >
            {enviando ? 'Enviando...' : 'Opinar'}
          </button>
        </form>
        <p className="text-[10px] text-charcoal/40 mt-3 text-center uppercase tracking-widest font-bold">IAsesor: Modera insultos automáticamente.</p>
      </div>
    </div>
  );
}
