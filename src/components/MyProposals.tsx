import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Book, Edit2, ShieldAlert } from 'lucide-react';

interface Proposal {
  id: string;
  userId: string;
  content: string;
  aiSummary: string;
  supportCount: number;
  status: string;
  level?: number;
}

export default function MyProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'proposals'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Proposal[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        fetched.push({
          id: d.id,
          userId: data.userId,
          content: data.content,
          aiSummary: data.aiSummary,
          supportCount: data.supportCount || 0,
          status: data.status || 'approved',
          level: data.level || 1
        });
      });
      // Sort desc by support count
      fetched.sort((a,b) => b.supportCount - a.supportCount);
      setProposals(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (p: Proposal) => {
    if (p.level && p.level > 1) return; // Cannot edit escalated
    setEditingId(p.id);
    setEditContent(p.content);
  };

  const handleSave = async () => {
    if (!editingId || !editContent.trim()) return;
    setSaving(true);
    
    try {
      // Get short AI summary
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Resume la siguiente propuesta ciudadana de manera muy concisa (máximo 12 palabras), destacando el núcleo de la idea. El tono debe ser formal y descriptivo: "${editContent}". REGLA ESTRICTA: Devuelve ÚNICAMENTE el resumen, sin confirmaciones ni explicaciones extra.`,
          history: []
        })
      });
      const data = await response.json();
      let aiSummary = 'Propuesta Actualizada.';
      if (data.success && data.reply) {
         aiSummary = data.reply.trim().replace(/^["']|["']$/g, '');
      }

      try {
        await updateDoc(doc(db, 'proposals', editingId), {
          content: editContent,
          aiSummary: aiSummary,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `proposals/${editingId}`);
      }

      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-charcoal/50 text-xs animate-pulse">Cargando tus iniciativas...</div>;

  if (proposals.length === 0) {
    return (
      <div className="text-center bg-creambg/45 border border-warmgray rounded-2xl p-6">
        <Book className="w-8 h-8 text-charcoal/20 mx-auto mb-2" />
        <p className="text-charcoal/60 text-xs font-serif italic">Aún no has sembrado propuestas al asambleísmo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map(p => {
        const canEdit = !p.level || p.level === 1;
        
        return (
          <div key={p.id} className="bg-white border border-warmgray rounded-2xl p-4 shadow-sm relative overflow-hidden group">
            {editingId === p.id ? (
              <div className="space-y-3 z-10 relative">
                <textarea 
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full h-24 bg-creambg border border-warmgray-dark rounded-xl p-2.5 text-sm text-charcoal focus:border-sandbrown focus:outline-none focus:ring-1 focus:ring-sandbrown"
                />
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-charcoal/50 hover:text-charcoal transition cursor-pointer">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="stone-btn px-4 py-1.5 text-xs font-bold bg-palmgreen text-white rounded-lg hover:bg-palmgreen-dark disabled:opacity-50 transition cursor-pointer">
                    {saving ? 'Guardando...' : 'Guardar Propuesta'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="z-10 relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Book className="w-4 h-4 text-sandbrown" />
                    <span className="font-bold text-charcoal text-xs font-serif">Iniciativa EstadoRed</span>
                  </div>
                  {!canEdit ? (
                    <span className="text-[9px] font-bold bg-skyblue/10 text-skyblue-dark border border-skyblue/25 px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-wider">
                      <ShieldAlert className="w-3 h-3" /> Escalada (Modlocking)
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleEditClick(p)} 
                      className="text-charcoal/40 hover:text-sandbrown transition flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Ver / Editar
                    </button>
                  )}
                </div>
                <p className="text-xs text-charcoal-dark font-serif font-semibold italic mb-2">"{p.aiSummary}"</p>
                <div className="text-sm text-charcoal/70 border-l-2 border-warmgray pl-2 whitespace-pre-line leading-relaxed">
                  {p.content}
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-palmgreen-dark font-bold bg-palmgreen/10 border border-palmgreen/25 px-2 px-2.5 py-1 rounded-lg">
                    {p.supportCount} Respaldos
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-charcoal/50 font-bold bg-creambg px-2.5 py-1 rounded-lg border border-warmgray-dark/40">
                    Nivel {p.level || 1}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
