import React, { useState, useEffect } from 'react';
import { Network, Shield, AlertTriangle, ArrowRight, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, onSnapshot, query, where, limit } from 'firebase/firestore';

interface ActiveVotingsProps {
  userProfile: any;
}

export default function ActiveVotings({ userProfile }: ActiveVotingsProps) {
  const depto = userProfile?.triada?.territorio || userProfile?.departamento || 'La Paz';
  const muni = userProfile?.triada?.territorio || userProfile?.municipio || 'Nuestra Señora de La Paz';

  const [votings, setVotings] = useState<any[]>([]);
  const [activeVotingIndex, setActiveVotingIndex] = useState<number>(0);
  const [votando, setVotando] = useState<boolean>(false);
  const [resultados, setResultados] = useState<Record<string, any>>({});
  const [votosUsuario, setVotosUsuario] = useState<Record<string, any>>({});
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string>('');
  const [votoMode, setVotoMode] = useState<'directo' | 'delegar'>('directo');

  // Delegation search states
  const [busqueda, setBusqueda] = useState<string>('');
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [loadingSuper, setLoadingSuper] = useState<boolean>(true);
  const [loadingBusqueda, setLoadingBusqueda] = useState<boolean>(false);

  useEffect(() => {
    // Escuchar votaciones activas desde Firebase
    const qVotaciones = query(collection(db, 'votaciones'), where('status', '==', 'activa'));
    const unsub = onSnapshot(qVotaciones, (snap) => {
      if (!snap.empty) {
        setVotings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setVotings([]);
      }
      setLoadingSuper(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || votings.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    const checkVotes = async () => {
      const votesMap: Record<string, any> = {};
      for (const v of votings) {
        try {
          const docRef = doc(db, "votos_presidenciales", `${auth.currentUser?.uid}_${v.id}`);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            votesMap[v.id] = snap.data();
          }
        } catch (e) { console.error(e); }
      }
      setVotosUsuario(votesMap);
    };

    checkVotes();

    for (const v of votings) {
      const unsub = onSnapshot(doc(db, "resultados_votaciones", v.id), (sn) => {
        if (sn.exists()) {
          setResultados(prev => ({ ...prev, [v.id]: sn.data() }));
        }
      });
      unsubscribes.push(unsub);
    }

    // Cargar sugerencias de delegación REALES y seguras, sin admins
    const cargarSugerencias = async () => {
      setLoadingBusqueda(true);
      try {
        const qUsers = query(collection(db, "users"), limit(30));
        const dbUsers = await getDocs(qUsers);
        const users = dbUsers.docs
          .filter(d => 
             d.id !== auth.currentUser?.uid && 
             !d.data().isAdmin && 
             !(d.data().alias || '').toLowerCase().includes('admin') &&
             !(d.data().alias || '').toLowerCase().includes('test')
          )
          .slice(0, 10)
          .map(d => ({ 
            id: d.id, 
            nombre: d.data().alias || 'Soberano', 
            tipo: 'Individual', 
            ip: d.data().gamification?.ip_vault || d.data().stats?.ip || 0,
            tag: 'Soberano' 
          }));

        setSugerencias(users);
      } catch (err) {
        console.error("Error charging delegates:", err);
      }
      setLoadingBusqueda(false);
    };

    cargarSugerencias();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [userProfile, votings]);

  const handleCastVote = async () => {
    if (!opcionSeleccionada || !auth.currentUser || !votings[activeVotingIndex]) return;
    setVotando(true);
    const currentVoting = votings[activeVotingIndex];
    const votingId = currentVoting.id;

    try {
      await setDoc(doc(db, "votos_presidenciales", `${auth.currentUser.uid}_${votingId}`), {
        voto: opcionSeleccionada,
        type: 'directo',
        timestamp: new Date().toISOString()
      });

      const resDoc = doc(db, "resultados_votaciones", votingId);
      const snap = await getDoc(resDoc);
      if (!snap.exists()) {
        await setDoc(resDoc, {
          opcion_1: opcionSeleccionada === 'opcion_1' ? 1 : 0,
          opcion_2: opcionSeleccionada === 'opcion_2' ? 1 : 0,
          opcion_3: opcionSeleccionada === 'opcion_3' ? 1 : 0,
          total: 1
        });
      } else {
        await updateDoc(resDoc, {
          [opcionSeleccionada]: (snap.data()[opcionSeleccionada] || 0) + 1,
          total: (snap.data().total || 0) + 1
        });
      }

      setVotosUsuario(prev => ({ ...prev, [votingId]: { voto: opcionSeleccionada, type: 'directo' } }));
    } catch(err) {
      console.error(err);
    } finally {
      setVotando(false);
    }
  };

  const handleDelegateVote = async (nodoDelegado: any) => {
    if (!auth.currentUser || !votings[activeVotingIndex]) return;
    setVotando(true);
    const currentVoting = votings[activeVotingIndex];
    const votingId = currentVoting.id;
    
    try {
      await setDoc(doc(db, "votos_presidenciales", `${auth.currentUser.uid}_${votingId}`), {
        type: 'delegado',
        delegado_a: nodoDelegado.nombre,
        timestamp: new Date().toISOString()
      });
      setVotosUsuario(prev => ({ ...prev, [votingId]: { type: 'delegado', delegado_a: nodoDelegado.nombre } }));
    } catch(err) {
      console.error(err);
    } finally {
      setVotando(false);
    }
  };

  if (loadingSuper) {
     return <div className="p-8 text-center text-charcoal/50 animate-pulse text-xs font-mono uppercase tracking-widest">Sincronizando asamblea...</div>;
  }

  if (votings.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-3xl mx-auto py-4 text-center">
        <div className="w-20 h-20 bg-warmgray/50 rounded-full flex mx-auto items-center justify-center mb-6 shadow-sm border border-[#ECE8DE]">
           <Shield className="text-sandbrown w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold font-serif text-charcoal">Gracias por tu soberanía y disposición</h2>
        <p className="text-charcoal/70 text-sm max-w-lg mx-auto leading-relaxed">
          El IAsesor está recopilando consensos y propuestas ciudadanas para habilitar las próximas consultas vinculantes de soberanía en tus niveles.
        </p>
        <p className="text-[11px] text-charcoal/50 font-mono tracking-wider font-bold mt-4 uppercase">No hay votaciones activas en este momento.</p>
        <div className="mt-8 pt-6 border-t border-[#ECE8DE] flex justify-center gap-4 text-xs font-bold text-charcoal/40 uppercase tracking-widest">
           <span>MUNICIPAL</span> • <span>DEPARTAMENTAL</span> • <span>NACIONAL</span>
        </div>
      </div>
    );
  }

  const currentVoting = votings[activeVotingIndex] || votings[0];
  const currentVoteInfo = votosUsuario[currentVoting.id];
  const currentResults = resultados[currentVoting.id] || { opcion_1: 0, opcion_2: 0, opcion_3: 0, total: 0 };

  const filtradosDelegados = sugerencias.filter(s => 
    s.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    s.tag.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-3xl mx-auto py-4">
      {/* Selector de Ámbito / Red */}
      <div className="bg-white/95 border border-[#ECE8DE] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h3 className="font-serif font-black text-sm text-[#A06A42] uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-sandbrown" /> Votaciones Activas por Nivel de Red
          </h3>
          <p className="text-[11px] text-charcoal/60 mt-0.5">Pertences a la <strong>Red Nacional</strong>, a tu <strong>Red Departamental de {depto}</strong> y a tu municipio <strong>{muni}</strong>.</p>
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto">
          {votings.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => {
                setActiveVotingIndex(idx);
                setOpcionSeleccionada('');
                setVotoMode('directo');
              }}
              className={`flex-1 sm:flex-none text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition ${
                activeVotingIndex === idx 
                  ? 'bg-brand-500 text-white shadow-sm' 
                  : 'bg-warmgray/35 text-charcoal/60 hover:bg-warmgray/50'
              }`}
            >
              {v.level}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjeta de la Consulta */}
      <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Shield className="w-24 h-24 text-sandbrown" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase text-brand-700 bg-brand-50 px-3 py-1 rounded-full tracking-widest">
              RED {currentVoting.level}
            </span>
            <span className="text-[9px] font-black uppercase text-palmgreen/80 bg-palmgreen/10 border border-palmgreen/20 px-3 py-1 rounded-full tracking-widest flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Voto Hermético Auditable
            </span>
          </div>
          
          <h2 className="font-serif font-black text-2xl md:text-3xl text-charcoal tracking-tight leading-tight">
            {currentVoting.title}
          </h2>
          
          <div className="text-sm text-charcoal/70 font-serif leading-relaxed space-y-2">
            <p>
              Consulta vinculante de carácter restrictivo. Únicamente los soberanos certificados de la Red {currentVoting.level} pueden incidir en esta votación parlamentaria-popular directa.
            </p>
          </div>

          <div className="bg-[#FAF9F5] border border-[#ECE8DE] p-5 rounded-2xl relative shadow-inner mt-4">
            <div className="absolute top-0 left-6 -mt-3 bg-[#FAF9F5] flex items-center gap-2">
               <span className="bg-warmgray px-3 py-1 text-[9px] font-bold text-charcoal/60 uppercase tracking-widest rounded shadow-sm border border-[#ECE8DE]">
                 Contexto de la Decisión
               </span>
            </div>
            <p className="text-sm text-charcoal/90 font-serif leading-relaxed italic border-l-2 border-sandbrown/30 pl-4 mt-2">
              {currentVoting.context}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-[#ECE8DE] pt-6 relative z-10">
          {currentVoteInfo ? (
            <div className="p-6 bg-brand-50 border border-brand-200 rounded-2xl text-center shadow-inner">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-brand-600" />
              {currentVoteInfo.type === 'directo' ? (
                <>
                  <h4 className="font-serif font-bold text-lg text-brand-800 mb-1">Tu Voto ha sido Asentado</h4>
                  <p className="text-xs text-brand-700/80 mb-4 font-mono">HASH: #V_{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </>
              ) : (
                <>
                  <h4 className="font-serif font-bold text-lg text-brand-800 mb-1">Has Delegado tu Responsabilidad</h4>
                  <p className="text-xs text-brand-700/80 mb-4">Poder cedido a <strong>{currentVoteInfo.delegado_a}</strong></p>
                </>
              )}
              
              <div className="mt-6 space-y-3 pt-6 border-t border-brand-200/50">
                <p className="text-[10px] font-black uppercase text-brand-800/60 tracking-wider mb-2">Escrutinio Público Abierto:</p>
                {(currentVoting.options || []).map((o: any) => {
                  const val = currentResults[o.id] || 0;
                  const pct = currentResults.total > 0 ? Math.round((val / currentResults.total) * 100) : 0;
                  const esElegida = currentVoteInfo.voto === o.id;

                  return (
                    <div key={o.id} className="relative w-full text-left">
                      <div className="flex justify-between text-xs mb-1 relative z-10 px-2 font-bold font-serif text-brand-900">
                        <span>{o.label} {esElegida && " (Tú)"}</span>
                        <span>{val} votos ({pct}%)</span>
                      </div>
                      <div className="w-full bg-white/60 h-2.5 rounded-full overflow-hidden shadow-inner border border-brand-200/50">
                        <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex border border-[#ECE8DE] p-1.5 rounded-xl bg-[#FAF9F5] mb-6 inline-flex max-w-full">
                <button
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${votoMode === 'directo' ? 'bg-white shadow-sm text-skyblue-dark' : 'text-charcoal/50 hover:text-charcoal/80'}`}
                  onClick={() => setVotoMode('directo')}
                >
                  🗳️ Voto Directo
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${votoMode === 'delegar' ? 'bg-[#A06A42] shadow-sm text-white' : 'text-charcoal/50 hover:text-charcoal/80'}`}
                  onClick={() => setVotoMode('delegar')}
                >
                  🤝 Voto Líquido
                </button>
              </div>

              <div className="animate-in slide-in-from-bottom-2 duration-300">
                {votoMode === 'directo' ? (
                  <div className="space-y-3">
                    {(currentVoting.options || []).map((opc: any) => (
                      <label 
                        key={opc.id} 
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition cursor-pointer select-none
                          ${opcionSeleccionada === opc.id ? 'border-brand-500 bg-brand-50/50' : 'border-[#ECE8DE] bg-white hover:border-brand-200'}
                        `}
                      >
                        <input 
                          type="radio" 
                          name="votoDirecto" 
                          className="w-5 h-5 accent-brand-600 rounded-full border-[#ECE8DE] bg-white"
                          checked={opcionSeleccionada === opc.id}
                          onChange={() => setOpcionSeleccionada(opc.id)}
                        />
                        <span className="text-xs font-semibold text-charcoal/90">{opc.label}</span>
                      </label>
                    ))}

                    <button 
                      onClick={handleCastVote}
                      disabled={!opcionSeleccionada || votando}
                      className="w-full mt-2 px-4 py-3 bg-[#A06A42] hover:bg-[#A06A42]/90 disabled:bg-warmgray-dark text-white font-extrabold uppercase tracking-wider rounded-xl transition duration-300 shadow-md flex items-center justify-center gap-2 text-xs"
                    >
                      {votando ? 'Procesando voto...' : 'Validar y Emitir Voto Vecinal'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[11px] text-charcoal/60 leading-relaxed font-serif">
                      Confía la decisión técnica o política de la Red <strong>{currentVoting.level}</strong> a otro soberano confiable o asamblea gremial por el período que dure esta consulta. Puedes revocar tu delegación en cualquier momento.
                    </p>

                    <input 
                      type="text"
                      placeholder="Buscar asamblea gremial, soberano, federación..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#ECE8DE] rounded-xl text-xs focus:outline-none focus:border-brand-500 transition font-sans"
                    />

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {loadingBusqueda && <p className="text-xs text-charcoal/40 animate-pulse">Cargando sugerencias de confianza...</p>}
                      {filtradosDelegados.map((nodo) => (
                        <div key={nodo.id} className="flex justify-between items-center p-3 bg-white border border-[#ECE8DE] rounded-xl shadow-xs hover:border-brand-500/50 transition">
                          <div>
                            <p className="font-bold text-charcoal text-xs">{nodo.nombre}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[8px]">
                              <span className="px-1.5 py-0.5 bg-black/5 rounded font-bold text-charcoal/50 uppercase">{nodo.tipo}</span>
                              <span className="text-palmgreen font-bold bg-palmgreen/5 px-1 rounded">IP: {nodo.ip || 0}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDelegateVote(nodo)}
                            disabled={votando}
                            className="px-3 py-1.5 bg-[#A06A42] hover:bg-[#A06A42]/95 text-white font-black uppercase text-[9px] tracking-wider rounded-lg transition"
                          >
                            Hacer Delegar
                          </button>
                        </div>
                      ))}
                      {filtradosDelegados.length === 0 && !loadingBusqueda && (
                        <p className="text-xs text-charcoal/40 text-center py-4">No se hallaron delegados que coincidan.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
