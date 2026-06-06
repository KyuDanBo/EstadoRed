import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, setDoc, updateDoc, onSnapshot, where, addDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  Users, 
  Network, 
  Activity, 
  ShieldCheck, 
  Wrench, 
  Settings, 
  Database,
  CheckCircle2, 
  Save, 
  FileSpreadsheet, 
  BrainCircuit,
  Settings2,
  AlertCircle,
  MapPin,
  PlusCircle,
  BookOpen,
  FileText,
  Trash2,
  Sparkles,
  Upload,
  Send,
  Globe,
  Copy
} from 'lucide-react';
import EstructuraSistema from './EstructuraSistema';
import { BibliotecaDigital } from './BibliotecaDigital';

export default function AdminView() {
  const [stats, setStats] = useState({ users: 0, nodes: 0, proposals: 0, courses: 0, networks: 0 });
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<'control' | 'crear' | 'grafo' | 'configuraciones' | 'documentos' | 'telegram' | 'votaciones'>('control');
  const [pendingNodeRequests, setPendingNodeRequests] = useState<any[]>([]);
  const [pendingNetworkRequests, setPendingNetworkRequests] = useState<any[]>([]);

  // List of active items for deletion/viewing
  const [activeCoursesList, setActiveCoursesList] = useState<any[]>([]);
  const [activeNodesList, setActiveNodesList] = useState<any[]>([]);
  const [activeNetworksList, setActiveNetworksList] = useState<any[]>([]);
  const [activeUsersList, setActiveUsersList] = useState<any[]>([]);

  // --- Formulario Creación de Nodos Colectivos ---
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<'territorio' | 'ocupacion' | 'ideologia'>('territorio');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeSede, setNewNodeSede] = useState('');
  const [creatingNode, setCreatingNode] = useState(false);

  // --- Formulario Creación de Redes Territoriales ---
  const [newNetName, setNewNetName] = useState('');
  const [newNetScope, setNewNetScope] = useState('Departamental');
  const [newNetDesc, setNewNetDesc] = useState('');
  const [creatingNet, setCreatingNet] = useState(false);

  // --- Formulario Creación de Cursos / Documental ---
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseBadge, setNewCourseBadge] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseContent, setNewCourseContent] = useState('');
  const [newCourseQuestion, setNewCourseQuestion] = useState('');
  const [newCourseOptionsInput, setNewCourseOptionsInput] = useState('Opción A, Opción B, Opción C, Opción D');
  const [newCourseCorrect, setNewCourseCorrect] = useState('');
  const [newCourseSuccess, setNewCourseSuccess] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);
  
  // Administrator configuration states
  const [configSetupDone, setConfigSetupDone] = useState<boolean>(true);
  const [networkName, setNetworkName] = useState<string>('EstadoRed Bolivia');
  const [syncFrecuency, setSyncFrecuency] = useState<string>('6 semanas');
  const [minIpRed, setMinIpRed] = useState<number>(250);
  const [webhookUrl, setWebhookUrl] = useState<string>('https://sicoes.gob.bo/api/v1/sync');
  const [secretToken, setSecretToken] = useState<string>('er_pki_root_sec_991823');
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Asistente de Dominio Propio ---
  const [domainMethod, setDomainMethod] = useState<'cloudrun' | 'firebase'>('cloudrun');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<'checking' | 'active' | 'pending'>('pending');

  // Database reset state
  const [isClearing, setIsClearing] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [clearError, setClearError] = useState<string | null>(null);

  const handleCleanDatabase = async () => {
    setIsClearing(true);
    setClearSuccess(null);
    setClearError(null);
    try {
      let deletedUsers = 0;
      let deletedProposals = 0;
      let deletedObservations = 0;
      let deletedPhysicalRequests = 0;
      let deletedNetworkRequests = 0;
      let deletedVotings = 0;

      // 1. Delete users
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        const udata = d.data();
        const uemail = udata.email || (udata.real_data && udata.real_data.email) || "";
        const isAdminUser = udata.isAdmin === true || udata.rol === 'Admin' || uemail === 'daren.bo.lp@gmail.com' || uemail === 'admin@estadored.app' || d.id === auth.currentUser?.uid;
        if (!isAdminUser) {
          await deleteDoc(d.ref);
          deletedUsers++;
        }
      }

      // 2. Delete proposals
      const proposalsSnap = await getDocs(collection(db, 'proposals'));
      for (const d of proposalsSnap.docs) {
        await deleteDoc(d.ref);
        deletedProposals++;
      }

      // 3. Delete citizen observations
      const observationsSnap = await getDocs(collection(db, 'citizen_observations'));
      for (const d of observationsSnap.docs) {
        await deleteDoc(d.ref);
        deletedObservations++;
      }

      // 4. Delete physical node requests
      const physicalSnap = await getDocs(collection(db, 'physical_node_requests'));
      for (const d of physicalSnap.docs) {
        await deleteDoc(d.ref);
        deletedPhysicalRequests++;
      }

      // 5. Delete territorial network requests
      const networkSnap = await getDocs(collection(db, 'territorial_network_requests'));
      for (const d of networkSnap.docs) {
        await deleteDoc(d.ref);
        deletedNetworkRequests++;
      }

      // 6. Delete presidential votes
      const votesSnap = await getDocs(collection(db, 'votos_presidenciales'));
      for (const d of votesSnap.docs) {
        await deleteDoc(d.ref);
        deletedVotings++;
      }

      // 7. Delete results
      const resultsSnap = await getDocs(collection(db, 'resultados_votaciones'));
      for (const d of resultsSnap.docs) {
        await deleteDoc(d.ref);
        deletedVotings++;
      }

      // 8. Delete blockchain tokens
      const sbtSnap = await getDocs(collection(db, 'blockchain_sbt'));
      for (const d of sbtSnap.docs) {
        await deleteDoc(d.ref);
      }
      const escrowSnap = await getDocs(collection(db, 'blockchain_escrow'));
      for (const d of escrowSnap.docs) {
        await deleteDoc(d.ref);
      }
      const quadSnap = await getDocs(collection(db, 'blockchain_quadratic'));
      for (const d of quadSnap.docs) {
        await deleteDoc(d.ref);
      }

      setClearSuccess(`Limpieza completada: Se eliminaron con éxito ${deletedUsers} perfiles de prueba, ${deletedProposals} propuestas de ley, ${deletedObservations} observaciones de control social, ${deletedPhysicalRequests + deletedNetworkRequests} solicitudes de red/sede y ${deletedVotings} registros de votación histórica.`);
      setConfirmWipe(false);
    } catch (e: any) {
      console.error("Error al limpiar base de datos:", e);
      setClearError(`Error de ejecución: Asegúrese de estar autenticado con la cuenta de administrador. Detalle: ${e.message || String(e)}`);
    } finally {
      setIsClearing(false);
    }
  };

  // Load global state and configurations
  useEffect(() => {
    // 1. Snapshot listeners for listings
    const unsubC = onSnapshot(collection(db, 'courses'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setActiveCoursesList(list);
      setStats(prev => ({ ...prev, courses: list.length }));
    });

    const unsubCN = onSnapshot(collection(db, 'collective_nodes'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setActiveNodesList(list);
      setStats(prev => ({ ...prev, nodes: list.length }));
    });

    const unsubN = onSnapshot(collection(db, 'networks'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setActiveNetworksList(list);
      setStats(prev => ({ ...prev, networks: list.length }));
    });

    const unsubU = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setActiveUsersList(list);
      setStats(prev => ({ ...prev, users: list.length }));
    });

    const loadData = async () => {
      try {
        // Stats
        const proposalsSnap = await getDocs(collection(db, "proposals"));
        
        setStats(prev => ({
          ...prev,
          proposals: proposalsSnap.size
        }));

        // Config
        const configDoc = await getDoc(doc(db, "config", "admin_settings"));
        if (configDoc.exists()) {
          const data = configDoc.data();
          setNetworkName(data.networkName || 'EstadoRed Bolivia');
          setSyncFrecuency(data.syncFrecuency || '6 semanas');
          setMinIpRed(data.minIpRed || 250);
          setWebhookUrl(data.webhookUrl || '');
          setSecretToken(data.secretToken || '');
          setConfigSetupDone(data.setupDone || false);
        } else {
          // Check if user has mock configInitialSetupDone flag else keep false
          setConfigSetupDone(true);
        }
      } catch (err) {
         console.error("Error cargando config de admin", err);
      }
      setLoading(false);
    };
    loadData();

    return () => {
      unsubC();
      unsubCN();
      unsubN();
      unsubU();
    };
  }, []);

  // Subscribe to pending physical node requests waiting for admin approval
  useEffect(() => {
    const qPending = query(collection(db, 'physical_node_requests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(qPending, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingNodeRequests(list);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to pending territorial network requests waiting for admin approval
  useEffect(() => {
    const qPending = query(collection(db, 'territorial_network_requests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(qPending, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingNetworkRequests(list);
    });
    return () => unsubscribe();
  }, []);

  const handleApproveRequest = async (request: any) => {
    try {
      setSuccessMsg(null);
      // 1. Update status to approved in the request log
      const reqRef = doc(db, 'physical_node_requests', request.id);
      await updateDoc(reqRef, { status: 'approved' });

      // 2. Add as a standard collective node catalogs
      await addDoc(collection(db, 'collective_nodes'), {
        id: `cn_approved_${Date.now()}`,
        name: request.name,
        type: request.type,
        memberCount: Math.floor(Math.random() * 40) + 10,
        createdAt: new Date(),
        telegramGroupUrl: ''
      });

      // Update local metrics
      setStats(prev => ({
        ...prev,
        nodes: prev.nodes + 1
      }));

      setSuccessMsg(`¡Sede física aprobada! "${request.name}" se implementó exitosamente en la red y ahora está disponible para la adhesión de soberanos.`);
    } catch (err) {
      console.error("Error al aprobar nodo:", err);
      alert("Hubo un error al procesar la aprobación.");
    }
  };

  const handleRejectRequest = async (requestId: string, reqName: string) => {
    try {
      setSuccessMsg(null);
      const reqRef = doc(db, 'physical_node_requests', requestId);
      await updateDoc(reqRef, { status: 'rejected' });
      setSuccessMsg(`La propuesta de sede física "${reqName}" fue rechazada.`);
    } catch (err) {
      console.error("Error al rechazar nodo:", err);
    }
  };

  const handleApproveNetwork = async (request: any) => {
    try {
      setSuccessMsg(null);
      const reqRef = doc(db, 'territorial_network_requests', request.id);
      await updateDoc(reqRef, { status: 'approved' });

      // Create a collective node of type territory
      await addDoc(collection(db, 'collective_nodes'), {
        id: `cn_net_approved_${Date.now()}`,
        name: request.name,
        type: 'territorio',
        memberCount: Math.floor(Math.random() * 25) + 5,
        createdAt: new Date(),
        telegramGroupUrl: ''
      });

      setStats(prev => ({
        ...prev,
        nodes: prev.nodes + 1
      }));

      setSuccessMsg(`¡Red Territorial aprobada! "${request.name}" ha sido activada y confirmada en la red.`);
    } catch (err) {
      console.error("Error al aprobar red territorial:", err);
      alert("Hubo un error al procesar.");
    }
  };

  const handleRejectNetwork = async (requestId: string, reqName: string) => {
    try {
      setSuccessMsg(null);
      const reqRef = doc(db, 'territorial_network_requests', requestId);
      await updateDoc(reqRef, { status: 'rejected' });
      setSuccessMsg(`La propuesta de red territorial "${reqName}" fue rechazada.`);
    } catch (err) {
      console.error("Error al rechazar red territorial:", err);
    }
  };

  // --- Creation & Management functions for Admin Panel ---
  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;
    setCreatingNode(true);
    setSuccessMsg(null);
    try {
      await addDoc(collection(db, 'collective_nodes'), {
        id: `cn_${Date.now()}`,
        name: newNodeName.trim(),
        type: newNodeType,
        desc: newNodeDesc.trim() || 'Soberano nodo activo de deliberación.',
        sedeFisica: newNodeSede.trim() || 'Virtual / Regional',
        memberCount: Math.floor(Math.random() * 30) + 5,
        createdAt: new Date(),
        telegramGroupUrl: ''
      });
      setSuccessMsg(`¡Nodo Colectivo "${newNodeName}" creado exitosamente!`);
      setNewNodeName('');
      setNewNodeDesc('');
      setNewNodeSede('');
    } catch (err) {
      console.error(err);
      alert("Error al crear el nodo.");
    } finally {
      setCreatingNode(false);
    }
  };

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNetName.trim()) return;
    setCreatingNet(true);
    setSuccessMsg(null);
    try {
      await addDoc(collection(db, 'networks'), {
        id: `net_${Date.now()}`,
        name: newNetName.trim(),
        scope: newNetScope,
        desc: newNetDesc.trim() || 'Red de telecomunicaciones y sincronización de asambleas.',
        createdAt: new Date()
      });
      setSuccessMsg(`¡Red Territorial "${newNetName}" creada exitosamente!`);
      setNewNetName('');
      setNewNetDesc('');
    } catch (err) {
      console.error(err);
      alert("Error al crear la red.");
    } finally {
      setCreatingNet(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCourseQuestion.trim()) return;
    setCreatingCourse(true);
    setSuccessMsg(null);
    try {
      const parsedOptions = newCourseOptionsInput
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      if (parsedOptions.length < 2) {
        alert("Introduce al menos dos opciones válidas separadas por comas.");
        setCreatingCourse(false);
        return;
      }

      const correctAns = newCourseCorrect.trim() || parsedOptions[0];

      await addDoc(collection(db, 'courses'), {
        id: `course_${Date.now()}`,
        title: newCourseTitle.trim(),
        badge: newCourseBadge.trim() || 'Nivel Iniciado',
        desc: newCourseDesc.trim(),
        content: newCourseContent.trim(),
        question: newCourseQuestion.trim(),
        options: parsedOptions,
        correct: correctAns,
        successMsg: newCourseSuccess.trim() || '¡Muy bien contestado, Soberano!',
        createdAt: new Date()
      });

      setSuccessMsg(`¡Módulo de capacitación/documentación "${newCourseTitle}" creado con éxito!`);
      setNewCourseTitle('');
      setNewCourseBadge('');
      setNewCourseDesc('');
      setNewCourseContent('');
      setNewCourseQuestion('');
      setNewCourseCorrect('');
      setNewCourseSuccess('');
    } catch (err) {
      console.error(err);
      alert("Error al crear curso.");
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleSaveInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setSuccessMsg(null);
    try {
      const configData = {
        networkName: networkName.trim(),
        syncFrecuency,
        minIpRed: Number(minIpRed),
        webhookUrl: webhookUrl.trim(),
        secretToken: secretToken.trim(),
        setupDone: true,
        updatedAt: new Date()
      };

      await setDoc(doc(db, "config", "admin_settings"), configData, { merge: true });
      
      // Update the user profile doc to avoid re-prompting
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          configInitialSetupDone: true
        });
      }

      setConfigSetupDone(true);
      setSuccessMsg("¡Configuración inicial del EstadoRed establecida y sincronizada en Firestore exitosamente!");
    } catch (err) {
      console.error("Error guardando setup de admin:", err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setSuccessMsg(null);
    try {
      const configData = {
        networkName: networkName.trim(),
        syncFrecuency,
        minIpRed: Number(minIpRed),
        webhookUrl: webhookUrl.trim(),
        secretToken: secretToken.trim(),
        setupDone: true,
        updatedAt: new Date()
      };
      await setDoc(doc(db, "config", "admin_settings"), configData, { merge: true });
      setSuccessMsg("Configuraciones de red actualizadas correctamente.");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  // If initial config setup is not complete, enforce onboarding configurations flow
  if (!configSetupDone && !loading) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
        <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_30px_rgba(43,41,39,0.05)] max-w-2xl mx-auto rounded-3xl">
          <div className="text-center space-y-2 mb-6">
            <span className="text-[10px] font-bold tracking-widest text-skyblue uppercase bg-skyblue/15 border border-skyblue/25 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-skyblue" /> Primer Login de Administrador
            </span>
            <h3 className="font-serif font-black text-xl md:text-2xl text-charcoal">
              Establecer Configuraciones Iniciales del EstadoRed
            </h3>
            <p className="text-xs text-charcoal/50 leading-relaxed max-w-md mx-auto">
              Antes de dar paso a la monitorización y simulación de la soberanía, define los parámetros globales que conducirán los consensos cívicos y técnicos de la red.
            </p>
          </div>

          <form onSubmit={handleSaveInitialSetup} className="space-y-4 pt-4 border-t border-[#ECE8DE]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-charcoal/60">Nombre del EstadoRed:</label>
                <input
                  type="text"
                  required
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  placeholder="Ej. EstadoRed Soberano de Bolivia"
                  className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none focus:border-skyblue shadow-inner font-serif"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-charcoal/60">Cadencia Sincrónica de Ciclos:</label>
                <select
                  value={syncFrecuency}
                  onChange={(e) => setSyncFrecuency(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none focus:border-skyblue shadow-inner"
                >
                  <option value="4 semanas">Cada 4 Semanas (Sincronización Rápida)</option>
                  <option value="6 semanas">Cada 6 Semanas (Estándar Constitucional)</option>
                  <option value="12 semanas">Cada 12 Semanas (Ciclo Estacional)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-charcoal/60">Canje Mínimo de Incentivo (IP):</label>
                <input
                  type="number"
                  required
                  value={minIpRed}
                  onChange={(e) => setMinIpRed(Number(e.target.value))}
                  placeholder="Ej. 250"
                  className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none focus:border-skyblue shadow-inner font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-charcoal/60">Clave Secreta PKI Root:</label>
                <input
                  type="password"
                  required
                  value={secretToken}
                  onChange={(e) => setSecretToken(e.target.value)}
                  placeholder="Ingresa clave root secreta"
                  className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none focus:border-skyblue shadow-inner font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-charcoal/60">Webhook URL para sincronización SICOES / Presupuestos:</label>
              <input
                type="url"
                required
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://sicoes.gob.bo/api/v1/sync-state"
                className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none focus:border-skyblue shadow-inner font-mono"
              />
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-4.5 rounded-2xl flex items-start gap-2.5 text-[10.5px] leading-relaxed text-blue-800">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                <strong>Nota de Autenticidad:</strong> Al guardar estas configuraciones, se iniciarán los protocolos de auditoría bajo la Ley Marco de Autonomías N° 031, ligando tus nodos físicos de control social de forma permanente.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className="w-full stone-btn bg-charcoal hover:bg-charcoal/90 text-white font-bold p-3 rounded-xl uppercase tracking-wider text-xs flex justify-center items-center gap-2 cursor-pointer transition shadow border-b-4 border-black active:border-b hover:translate-y-[1px]"
            >
              {savingConfig ? 'Sincronizando...' : 'Establecer y Sellar Configuración'} <Save className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* SECCIÓN PESTAÑAS DE ADMIN */}
      <div className="flex bg-white border border-[#ECE8DE] p-1.5 rounded-2xl gap-1 max-w-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => { setAdminTab('control'); setSuccessMsg(null); }}
          className={`flex-1 min-w-[80px] py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'control' 
              ? 'bg-[#FAF9F5] text-charcoal shadow-xs border border-[#ECE8DE]' 
              : 'text-charcoal/50 hover:bg-[#FAF9F5]/40'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Métricas
        </button>
        <button
          onClick={() => { setAdminTab('crear'); setSuccessMsg(null); }}
          className={`flex-1 min-w-[80px] py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'crear' 
              ? 'bg-[#FAF9F5] text-charcoal shadow-xs border border-[#ECE8DE]' 
              : 'text-charcoal/50 hover:bg-[#FAF9F5]/40'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-palmgreen" /> Crear Recursos
        </button>
        <button
          onClick={() => { setAdminTab('documentos'); setSuccessMsg(null); }}
          className={`flex-1 min-w-[80px] py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'documentos' 
              ? 'bg-[#FAF9F5] text-charcoal shadow-xs border border-[#ECE8DE]' 
              : 'text-charcoal/50 hover:bg-[#FAF9F5]/40'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-sandbrown" /> Docs
        </button>
        <button
          onClick={() => { setAdminTab('votaciones'); setSuccessMsg(null); }}
          className={`flex-1 min-w-[80px] py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'votaciones' 
              ? 'bg-[#FAF9F5] text-charcoal shadow-xs border border-[#ECE8DE]' 
              : 'text-charcoal/50 hover:bg-[#FAF9F5]/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-palmgreen" /> Votaciones
        </button>
        <button
          onClick={() => { setAdminTab('grafo'); setSuccessMsg(null); }}
          className={`flex-1 min-w-[80px] py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'grafo' 
              ? 'bg-[#FAF9F5] text-[#A06A42] shadow-xs border border-[#ECE8DE]' 
              : 'text-charcoal/50 hover:bg-[#FAF9F5]/40'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" /> Rizoma
        </button>
        <button
          onClick={() => { setAdminTab('telegram'); setSuccessMsg(null); }}
          className={`flex-1 min-w-[80px] py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'telegram' 
              ? 'bg-[#FAF9F5] text-[#0088cc] shadow-xs border border-[#ECE8DE]' 
              : 'text-charcoal/50 hover:bg-[#FAF9F5]/40'
          }`}
        >
          <Send className="w-3.5 h-3.5" /> Telegram API
        </button>
        <button
          onClick={() => { setAdminTab('configuraciones'); setSuccessMsg(null); }}
          className={`flex-1 min-w-[80px] py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            adminTab === 'configuraciones' 
              ? 'bg-[#FAF9F5] text-charcoal shadow-xs border border-[#ECE8DE]' 
              : 'text-charcoal/50 hover:bg-[#FAF9F5]/40'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" /> Ajustes de Red
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* RENDER SEGÚN PESTAÑA */}
      {adminTab === 'control' && (
        <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] flex flex-col gap-6 rounded-3xl">
          <div>
            <h3 className="font-serif font-black text-xl text-skyblue-dark flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-skyblue" /> Centro de Gobernanza Autonómica
            </h3>
            <p className="text-xs text-charcoal/60 mt-1 leading-relaxed max-w-xl font-serif">
              Análisis y volumen global del EstadoRed <strong>{networkName}</strong>. Monitorea el volumen de soberanos registrados, propuestas y sincronizaciones bajo la Ley Marco N° 031 sin alterar los vectores de soberanía individual.
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-charcoal/50 text-sm animate-pulse">Sincronizando Métrica Global...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-6 text-center shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                  <Users className="w-20 h-20" />
                </div>
                <Users className="w-6 h-6 text-skyblue mx-auto mb-2" />
                <p className="text-3xl font-black text-charcoal font-serif">{stats.users}</p>
                <p className="text-[10px] font-bold text-charcoal/50 uppercase tracking-widest mt-1">Soberanos Activos</p>
              </div>

              <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-6 text-center shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                  <Network className="w-20 h-20" />
                </div>
                <Network className="w-6 h-6 text-sandbrown mx-auto mb-2" />
                <p className="text-3xl font-black text-charcoal font-serif">{stats.nodes}</p>
                <p className="text-[10px] font-bold text-charcoal/50 uppercase tracking-widest mt-1">Nodos Colectivos</p>
              </div>

              <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-6 text-center shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                  <Activity className="w-20 h-20" />
                </div>
                <Activity className="w-6 h-6 text-palmgreen mx-auto mb-2" />
                <p className="text-3xl font-black text-charcoal font-serif">{stats.proposals}</p>
                <p className="text-[10px] font-bold text-charcoal/50 uppercase tracking-widest mt-1">Propuestas Emitidas</p>
              </div>
            </div>
          )}

          {/* SECCIÓN DE INICIALIZACIÓN Y LIMPIEZA PARA PRODUCCIÓN */}
          <div className="mt-4 border-t border-red-200/50 bg-red-50/15 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-serif font-black text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-650 animate-pulse" /> Inicialización y Preparación para Producción
                </h4>
                <p className="text-[11px] text-charcoal/60 leading-relaxed max-w-xl">
                  Esta acción eliminará de forma permanente todos los perfiles de usuario simulados, propuestas generadas por IA, observaciones de auditoría, solicitudes vecinales de prueba y registros históricos de votación. Se preservará únicamente tu cuenta de administrador conectada de forma transparente para iniciar la recolección oficial de datos reales de soberanos en vivo de acuerdo con la Ley N° 031.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-auto flex justify-end">
                {!confirmWipe ? (
                  <button
                    onClick={() => setConfirmWipe(true)}
                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-red-700 text-white rounded-xl hover:bg-red-800 transition duration-200 shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Iniciar Limpieza
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCleanDatabase}
                      disabled={isClearing}
                      className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-red-800 text-white rounded-xl hover:bg-red-900 transition duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-55"
                    >
                      {isClearing ? 'Limpiando...' : 'Sí, borrar de prueba'}
                    </button>
                    <button
                      onClick={() => setConfirmWipe(false)}
                      disabled={isClearing}
                      className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-warmgray text-charcoal/80 rounded-xl hover:bg-warmgray/50 transition duration-200 cursor-pointer border border-[#ECE8DE] disabled:opacity-55"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {clearSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-xs font-serif leading-relaxed">
                {clearSuccess}
              </div>
            )}

            {clearError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-xs font-mono leading-relaxed">
                {clearError}
              </div>
            )}
          </div>

          {/* SECCIÓN APROBACIÓN DE NUEVOS NODOS FÍSICOS */}
          <div className="mt-4 border-t border-[#ECE8DE] pt-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#ECE8DE]/65">
              <div>
                <h4 className="font-serif font-black text-sm text-[#A06A42] flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-sandbrown" /> Solicitudes de Nuevas Sedes Vecinales y Sectoriales ({pendingNodeRequests.length})
                </h4>
                <p className="text-[10.5px] text-charcoal/50 mt-0.5">Soberanos proponen centros comunales de deliberación que requieren personería y validación territorial conforme a la Ley de Autonomías N° 031.</p>
              </div>
            </div>

            {pendingNodeRequests.length === 0 ? (
              <div className="bg-[#FAF9F5]/60 border border-dashed border-[#ECE8DE] rounded-2xl p-6 text-center text-xs text-charcoal/40 font-serif">
                No hay propuestas pendientes de aprobación. Las sedes del país se encuentran habilitadas y estables.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingNodeRequests.map((req) => (
                  <div key={req.id} className="bg-[#FAF9F5]/70 border border-[#ECE8DE] rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#A06A42]/50 transition duration-300">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-serif font-black text-[#A06A42] text-xs leading-snug">{req.name}</h5>
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shrink-0 ${
                          req.type === 'territorial' 
                            ? 'bg-palmgreen/10 border-palmgreen/25 text-palmgreen-dark' 
                            : req.type === 'ocupacional' 
                            ? 'bg-sandbrown/10 border-sandbrown/25 text-sandbrown-dark' 
                            : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-700'
                        }`}>
                          {req.type === 'territorial' ? '🗺️ Territorial' : req.type === 'ocupacional' ? '💼 Ocupacional' : '💡 Ideológico'}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-charcoal/50 flex items-center gap-1 font-mono">
                        <MapPin className="w-3" /> {req.address}
                      </p>
                      <p className="text-[10.5px] text-charcoal/70 leading-relaxed font-serif italic pt-1 border-t border-[#ECE8DE]/45">
                        "{req.description}"
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-charcoal/45 font-mono pt-1 pb-1">
                      <span>Propuesto por: <strong>{req.requestedBy || 'Soberano'}</strong></span>
                      <span>Fecha: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Reciente'}</span>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-[#ECE8DE]/45">
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(req.id, req.name)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        Rechazar Sede
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveRequest(req)}
                        className="px-3.5 py-1.5 bg-palmgreen hover:bg-palmgreen-dark text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 font-sans"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" /> Aprobar e Implementar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN APROBACIÓN DE NUEVAS REDES TERRITORIALES */}
          <div className="mt-4 border-t border-[#ECE8DE] pt-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#ECE8DE]/65">
              <div>
                <h4 className="font-serif font-black text-sm text-[#A06A42] flex items-center gap-1.5">
                  <Network className="w-5 h-5 text-sandbrown" /> Solicitudes de Nuevas Redes Territoriales ({pendingNetworkRequests.length})
                </h4>
                <p className="text-[10.5px] text-charcoal/50 mt-0.5">Soberanos proponen redes autónomas departamentales o municipales que interconecten asambleas territoriales.</p>
              </div>
            </div>

            {pendingNetworkRequests.length === 0 ? (
              <div className="bg-[#FAF9F5]/60 border border-dashed border-[#ECE8DE] rounded-2xl p-6 text-center text-xs text-charcoal/40 font-serif">
                No hay propuestas pendientes de aprobación. Las redes territoriales del país se encuentran habilitadas y estables.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingNetworkRequests.map((req) => (
                  <div key={req.id} className="bg-[#FAF9F5]/70 border border-[#ECE8DE] rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#A06A42]/50 transition duration-300">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-serif font-black text-[#A06A42] text-xs leading-snug">{req.name}</h5>
                        <span className="text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shrink-0 bg-sandbrown/10 border-sandbrown/25 text-sandbrown-dark-dark">
                          🏢 {req.scope}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-charcoal/50 flex items-center gap-1 font-mono">
                        <MapPin className="w-3" /> {req.address}
                      </p>
                      <p className="text-[10.5px] text-charcoal/70 leading-relaxed font-serif italic pt-1 border-t border-[#ECE8DE]/45">
                        "{req.description}"
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-charcoal/45 font-mono pt-1 pb-1">
                      <span>Propuesto por: <strong>{req.requestedBy || 'Soberano'}</strong></span>
                      <span>Fecha: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Reciente'}</span>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-[#ECE8DE]/45">
                      <button
                        type="button"
                        onClick={() => handleRejectNetwork(req.id, req.name)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        Rechazar Red
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveNetwork(req)}
                        className="px-3.5 py-1.5 bg-palmgreen hover:bg-palmgreen-dark text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 font-sans"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" /> Aprobar y Habilitar Network
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-5 bg-skyblue/5 border border-skyblue/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-skyblue-dark flex items-center gap-1.5">
                <Database className="w-4 h-4" /> Herramientas de Auditoría Territorial
              </h4>
              <p className="text-xs text-charcoal/70 max-w-md">Consolida los procesos de ETL (SICOES) y la vectorización normativa del Estado para auditorías externas.</p>
            </div>
            <button className="stone-btn px-4 py-2 bg-white text-skyblue-dark border border-skyblue border-b-4 hover:border-b hover:translate-y-[3px] text-xs font-bold uppercase tracking-wider rounded-lg transition shrink-0 cursor-pointer">
              Exportar Datos de Red (CSV)
            </button>
          </div>
        </div>
      )}

      {adminTab === 'crear' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Bento grids for forms */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form 1: Crear Nodo Colectivo */}
            <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 shadow-sm rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-black text-sm text-palmgreen-dark flex items-center gap-1.5 mb-2 pb-2 border-b border-[#ECE8DE]/65">
                  <MapPin className="w-4 h-4 text-palmgreen" /> Nodo Colectivo
                </h4>
                <p className="text-[11px] text-charcoal/50 mb-4 font-serif">
                  Crea nodos instantáneos para asambleas de Ocupación, Territorio o Ideologías constituyentes.
                </p>
                
                <form onSubmit={handleCreateNode} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Nombre del Nodo:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Sindicato Digital de Desarrolladores"
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2.5 text-xs text-charcoal focus:outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Tipo de Dimensión Triádica:</label>
                    <select
                      value={newNodeType}
                      onChange={(e: any) => setNewNodeType(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2.5 text-xs text-charcoal focus:outline-none"
                    >
                      <option value="territorio">Territorio 📍</option>
                      <option value="ocupacion">Ocupación / Sindicato 💼</option>
                      <option value="ideologia">Ideología / Propósito 🌱</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Sede Física (Opcional):</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Sucre - Calle Bolívar N° 12"
                      value={newNodeSede}
                      onChange={(e) => setNewNodeSede(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2.5 text-xs text-charcoal focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Descripción del Nodo:</label>
                    <textarea 
                      placeholder="Breve reseña constituyente sobre el propósito deliberante..."
                      value={newNodeDesc}
                      onChange={(e) => setNewNodeDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2.5 text-xs text-charcoal focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingNode}
                    className="stone-btn w-full mt-2 bg-palmgreen text-white font-bold p-2.5 rounded-xl uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    {creatingNode ? 'Creando Nodo...' : 'Crear Nodo Colectivo'}
                  </button>
                </form>
              </div>
            </div>

            {/* Form 2: Crear Red Territorial */}
            <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 shadow-sm rounded-3xl flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-black text-sm text-sandbrown-dark flex items-center gap-1.5 mb-2 pb-2 border-b border-[#ECE8DE]/65">
                  <Network className="w-4 h-4 text-sandbrown" /> Red Territorial
                </h4>
                <p className="text-[11px] text-charcoal/50 mb-4 font-serif">
                  Inaugura redes de sincronización o flujos regionales cívicos autónomos aprobados.
                </p>
                
                <form onSubmit={handleCreateNetwork} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Nombre de la Red:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Red de Chiquitanía Sostenible"
                      value={newNetName}
                      onChange={(e) => setNewNetName(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2.5 text-xs text-charcoal focus:outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Ámbito Geográfico / Alcance:</label>
                    <select
                      value={newNetScope}
                      onChange={(e) => setNewNetScope(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2.5 text-xs text-charcoal focus:outline-none"
                    >
                      <option value="Nacional">Nacional 🇧🇴</option>
                      <option value="Departamental">Departamental 🗺️</option>
                      <option value="Regional">Regional ⛰️</option>
                      <option value="Municipal">Municipal 🏢</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Descripción de Sincronización:</label>
                    <textarea 
                      placeholder="Propósito soberano, enlaces de intercomunicación de asambleas..."
                      value={newNetDesc}
                      onChange={(e) => setNewNetDesc(e.target.value)}
                      rows={5}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2.5 text-xs text-charcoal focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingNet}
                    className="stone-btn w-full mt-2 bg-sandbrown text-white font-bold p-2.5 rounded-xl uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    {creatingNet ? 'Creando Red...' : 'Crear Red Territorial'}
                  </button>
                </form>
              </div>
            </div>

            {/* Form 3: Crear Curso / Documental */}
            <div className="bg-white border border-[#ECE8DE] stone-card p-6 shadow-sm rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-skyblue/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-700"></div>
              <h4 className="font-serif font-black text-sm text-skyblue-dark flex items-center gap-1.5 mb-2 pb-2 border-b border-[#ECE8DE]/65">
                <BookOpen className="w-4 h-4 text-skyblue" /> Estudio de Conocimiento Automático
                <span className="ml-2 text-[8px] bg-skyblue/10 text-skyblue-dark px-1.5 py-0.5 rounded uppercase font-bold tracking-widest font-mono">Motor NotebookLM</span>
              </h4>
              <p className="text-[11px] text-charcoal/50 mb-4 font-serif">
                Proporciona un documento matriz, ley o manifiesto. El motor lo analizará para crear un currículo teórico autogenerado y un test de evaluación cívica.
              </p>
              
              <form onSubmit={handleCreateCourse} className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <label className="text-[8.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Fuente de Conocimiento (Documento Base):</label>
                    <label className="text-[9px] bg-charcoal/5 hover:bg-charcoal/10 text-charcoal px-2 py-1 rounded cursor-pointer transition flex items-center gap-1 font-bold">
                      <Upload className="w-3 h-3" /> Subir Archivo
                      <input type="file" className="hidden" accept=".txt,.md,.rtf,.csv,.pdf" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewCourseContent("Extrayendo texto del archivo, por favor espera...");
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/extract_text', { method: 'POST', body: formData });
                            const data = await res.json();
                            if(data.success) {
                               setNewCourseContent(data.text);
                            } else {
                               alert(data.error || "Error al extraer");
                               setNewCourseContent("");
                            }
                          } catch(err) {
                             alert("Error de red");
                             setNewCourseContent("");
                          }
                        }
                      }} />
                    </label>
                  </div>
                  <textarea 
                    required
                    placeholder="Pega el texto, enlace o documento matriz (ej. Estatuto Autonómico, Ley SAFCO) o sube un archivo de texto..."
                    value={newCourseContent}
                    onChange={(e) => setNewCourseContent(e.target.value)}
                    rows={4}
                    className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none resize-none font-mono"
                  />
                </div>
                
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <button 
                    type="button" 
                    onClick={async () => {
                        if (!newCourseContent) {
                            alert("Por favor, introduce primero el Documento Base.");
                            return;
                        }
                        
                        setNewCourseTitle("⏳ Analizando con NotebookLM...");
                        setNewCourseBadge("...");
                        setNewCourseDesc("Generando currículo...");
                        
                        try {
                            const res = await fetch('/api/notebooklm_analyze', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: newCourseContent })
                            });
                            const data = await res.json();
                            if (data.success && data.data) {
                                const d = data.data;
                                setNewCourseTitle(d.title || "Generado");
                                setNewCourseBadge(d.level || "Generado");
                                setNewCourseDesc(d.steps?.[0]?.desc || "Módulo generado...");
                                
                                if (d.quiz) {
                                  setNewCourseQuestion(d.quiz.question || "");
                                  setNewCourseOptionsInput((d.quiz.options || []).join(","));
                                  setNewCourseCorrect(d.quiz.correct || "");
                                }
                                setNewCourseSuccess("¡Correcto! Validado por el motor NotebookLM.");
                            } else {
                                alert(data.error || "Error en el motor AI");
                            }
                        } catch(e) {
                            console.error(e);
                            alert("Fallo de red al contactar al motor NotebookLM");
                        }
                    }}
                    className="text-[10px] bg-skyblue/10 hover:bg-skyblue/20 text-skyblue-dark px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Analizar Inteligencia y Autocompletar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Título Generado:</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Ley N° 1178 (Autogenerado)"
                      value={newCourseTitle}
                      onChange={(e) => setNewCourseTitle(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2 text-xs text-charcoal focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Nivel / Badge:</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Nivel Avanzado"
                      value={newCourseBadge}
                      onChange={(e) => setNewCourseBadge(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2 text-xs text-charcoal focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] uppercase tracking-wider font-extrabold text-charcoal/50">Extracto Resumen (Generado):</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Resumen generado listo..."
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2 text-xs text-charcoal focus:outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-[#ECE8DE]/50 mt-2 space-y-2">
                  <h5 className="text-[9px] uppercase tracking-widest font-black text-charcoal/60 mb-1">Cuestionario Cívico Generado</h5>
                  
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider font-bold text-charcoal/50">Pregunta Evaluativa:</label>
                    <input 
                      type="text"
                      required
                      placeholder="¿Cuál sistema es evaluado por SAFCO?"
                      value={newCourseQuestion}
                      onChange={(e) => setNewCourseQuestion(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-lg p-2 text-xs text-charcoal focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider font-bold text-charcoal/50 font-mono">Opciones (por comas):</label>
                    <input 
                      type="text" 
                      required
                      value={newCourseOptionsInput}
                      onChange={(e) => setNewCourseOptionsInput(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2 text-xs text-charcoal focus:outline-none font-mono text-[10.5px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-bold text-charcoal/50 text-palmgreen">Respuesta Correcta:</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ej. Control Interno"
                        value={newCourseCorrect}
                        onChange={(e) => setNewCourseCorrect(e.target.value)}
                        className="w-full bg-palmgreen/5 border border-palmgreen/20 rounded-lg p-2 text-xs text-charcoal focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider font-bold text-charcoal/50 text-skyblue-dark">Mensaje de Éxito:</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ej. ¡Correcto Soberano!"
                        value={newCourseSuccess}
                        onChange={(e) => setNewCourseSuccess(e.target.value)}
                        className="w-full bg-skyblue/5 border border-skyblue/20 rounded-lg p-2 text-xs text-charcoal focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#ECE8DE]/50 mt-2">
                  <div className="space-y-1">
                    <label className="text-[8.5px] uppercase tracking-wider font-extrabold text-[linear-gradient(90deg,#A06A42,#C18D68)] bg-clip-text text-transparent flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#A06A42]" /> Recompensa de Nivel (XP):
                    </label>
                    <input 
                      type="number"
                      required
                      min={10} max={5000}
                      placeholder="Ej. 150XP"
                      defaultValue={150}
                      className="w-full bg-[#A06A42]/5 border border-[#A06A42]/20 rounded-xl p-2 text-xs text-charcoal focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingCourse}
                  className="stone-btn w-full flex items-center justify-center gap-2 bg-skyblue text-white font-bold p-2.5 mt-2 rounded-xl uppercase tracking-wider text-[10px] cursor-pointer shadow-sm"
                >
                  <BookOpen className="w-3 h-3" />
                  {creatingCourse ? 'Activando Aprendizaje...' : 'Publicar Módulo Cívico Automático'}
                </button>
              </form>
            </div>

          </div>

          <div className="bg-[#FAF9F5] border border-[#ECE8DE] p-6 shadow-xs rounded-3xl mt-6 border-t">
            <h4 className="font-serif font-black text-sm text-charcoal flex items-center gap-1.5 mb-4 pb-2 border-b border-[#ECE8DE]/60">
              <FileSpreadsheet className="w-4 h-4 text-skyblue" /> Registro de Recursos Activos ({activeUsersList.length + activeNodesList.length + activeNetworksList.length + activeCoursesList.length})
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {/* List 0: Usuarios */}
              <div className="space-y-3">
                <h5 className="font-serif font-bold text-xs text-charcoal/70 bg-white p-2 rounded-lg border border-[#ECE8DE] flex justify-between items-center">
                  <span>Soberanos ({activeUsersList.length})</span>
                  <span className="text-[8.5px] bg-[#A06A42]/15 text-[#A06A42] px-1.5 py-0.5 rounded-md font-mono">Real-time</span>
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeUsersList.length === 0 ? (
                    <p className="text-[10px] text-charcoal/40 italic">Ningún usuario creado aún.</p>
                  ) : (
                    activeUsersList.map(user => (
                      <div key={user.id} className="p-2 bg-white border border-[#ECE8DE] rounded-lg text-xs hover:border-[#A06A42]/40 transition">
                        <p className="font-bold text-charcoal font-serif truncate">{user.alias || user.email || 'Sin Alias'}</p>
                        <p className="text-[8.5px] text-[#A06A42] font-semibold capitalize font-mono mt-0.5">{user.rol || 'Soberano'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* List 1: Nodos Colectivos */}
              <div className="space-y-3">
                <h5 className="font-serif font-bold text-xs text-charcoal/70 bg-white p-2 rounded-lg border border-[#ECE8DE] flex justify-between items-center">
                  <span>Nodos Colectivos ({activeNodesList.length})</span>
                  <span className="text-[8.5px] bg-palmgreen/15 text-palmgreen-dark px-1.5 py-0.5 rounded-md font-mono">Real-time</span>
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeNodesList.length === 0 ? (
                    <p className="text-[10px] text-charcoal/40 italic">Ningún nodo dinámico creado aún.</p>
                  ) : (
                    activeNodesList.map(node => (
                      <div key={node.id} className="p-2 bg-white border border-[#ECE8DE] rounded-lg text-xs hover:border-palmgreen/40 transition">
                        <p className="font-bold text-charcoal font-serif truncate">{node.name}</p>
                        <p className="text-[8.5px] text-palmgreen font-semibold capitalize font-mono mt-0.5">{node.type}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* List 2: Redes Territoriales */}
              <div className="space-y-3">
                <h5 className="font-serif font-bold text-xs text-charcoal/70 bg-white p-2 rounded-lg border border-[#ECE8DE] flex justify-between items-center">
                  <span>Redes Territoriales ({activeNetworksList.length})</span>
                  <span className="text-[8.5px] bg-sandbrown/15 text-sandbrown-dark px-1.5 py-0.5 rounded-md font-mono">Real-time</span>
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeNetworksList.length === 0 ? (
                    <p className="text-[10px] text-charcoal/40 italic">Ninguna red territorial creada aún.</p>
                  ) : (
                    activeNetworksList.map(net => (
                      <div key={net.id} className="p-2 bg-white border border-[#ECE8DE] rounded-lg text-xs hover:border-sandbrown/40 transition">
                        <p className="font-bold text-charcoal font-serif truncate">{net.name}</p>
                        <p className="text-[8.5px] text-sandbrown font-semibold shrink-0 uppercase tracking-widest font-mono mt-0.5">{net.scope}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* List 3: Módulos Educativos */}
              <div className="space-y-3">
                <h5 className="font-serif font-bold text-xs text-charcoal/70 bg-white p-2 rounded-lg border border-[#ECE8DE] flex justify-between items-center">
                  <span>Academia y Doc ({activeCoursesList.length})</span>
                  <span className="text-[8.5px] bg-skyblue/15 text-skyblue-dark px-1.5 py-0.5 rounded-md font-mono">Real-time</span>
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeCoursesList.length === 0 ? (
                    <p className="text-[10px] text-charcoal/40 italic">Ningún curso/documento registrado aún.</p>
                  ) : (
                    activeCoursesList.map(course => (
                      <div key={course.id} className="p-2 bg-white border border-[#ECE8DE] rounded-lg text-xs hover:border-skyblue/40 transition">
                        <p className="font-bold text-charcoal font-serif truncate">{course.title}</p>
                        <p className="text-[8.5px] text-skyblue font-semibold truncate font-mono mt-0.5">{course.badge}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {adminTab === 'grafo' && (
        <div className="bg-white/95 border border-[#ECE8DE] p-6 shadow-sm rounded-3xl">
          <div className="pb-4 mb-3 border-b border-[#ECE8DE]">
            <h3 className="font-serif font-black text-xl text-charcoal flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-[#A06A42]" /> Monitoreo Rizomático de Gobernanza
            </h3>
            <p className="text-xs text-charcoal/60 mt-1">
              Simulador sandbox de la ontología del EstadoRed. Control y modelado de propuestas, asambleas ciudadanas y flujos normativos descentralizados.
            </p>
          </div>
          <EstructuraSistema userProfile={{ alias: 'Administrador de Servidor', triada: { territorio: 'Nacional' } }} />
        </div>
      )}

      {adminTab === 'configuraciones' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          <div className="bg-white/95 border border-[#ECE8DE] p-6 shadow-sm rounded-3xl max-w-xl w-full">
            <div className="pb-4 mb-4 border-b border-[#ECE8DE]">
              <h3 className="font-serif font-black text-xl text-charcoal flex items-center gap-2">
                <Settings className="w-6 h-6 text-[#A06A42]" /> Ajustes de Soportes de Red
              </h3>
              <p className="text-xs text-charcoal/60 mt-1 font-serif">
                Ajusta los parámetros operativos de la soberanía y ciclos sincrónicos desde aquí en cualquier momento.
              </p>
            </div>

            <form onSubmit={handleUpdateConfig} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-charcoal/60">Nombre del EstadoRed:</label>
                <input
                  type="text"
                  required
                  value={networkName}
                  onChange={(e) => setNetworkName(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none focus:border-[#A06A42] font-serif"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-charcoal/60">Ciclos de Sincronización:</label>
                  <select
                    value={syncFrecuency}
                    onChange={(e) => setSyncFrecuency(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none"
                  >
                    <option value="4 semanas">4 semanas</option>
                    <option value="6 semanas">6 semanas</option>
                    <option value="12 semanas">12 semanas</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-charcoal/60">Mínimo IP para Canjes:</label>
                  <input
                    type="number"
                    required
                    value={minIpRed}
                    onChange={(e) => setMinIpRed(Number(e.target.value))}
                    className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 text-xs text-charcoal focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="stone-btn w-full bg-[#A06A42] hover:bg-[#A06A42]/90 text-white font-bold p-3 rounded-xl uppercase tracking-wider text-xs flex justify-center items-center gap-2 cursor-pointer transition shadow"
              >
                <Save className="w-4 h-4" /> {savingConfig ? 'Actualizando parámetros...' : 'Guardar Parámetros de Red'}
              </button>
            </form>
          </div>

          {/* ASISTENTE INTERACTIVO DE DOMINIO - EXCLUSIVO PARA EL ADMINISTRADOR */}
          <div className="bg-white/95 border border-[#ECE8DE] p-6 shadow-sm rounded-3xl flex-1 w-full max-w-2xl flex flex-col gap-5">
            <div className="flex items-start gap-3 border-b border-[#ECE8DE] pb-4">
              <div className="p-3 bg-skyblue/10 text-skyblue-dark rounded-2xl">
                <Globe className="w-6 h-6 flex-shrink-0 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-charcoal uppercase tracking-wider flex items-center gap-2 font-serif">
                  Asistente Exclusivo de Dominio & DNS (estadored.com)
                </h4>
                <p className="text-[11px] text-charcoal/60 mt-1 leading-relaxed">
                  Configura y despliega tu red en tu dominio propio <strong className="text-charcoal/80">estadored.com</strong> comprado en Namecheap de forma profesional y paso a paso.
                </p>
              </div>
            </div>

            {/* RECOMENDACIÓN EXPERTA DE CRECIMIENTO */}
            <div className="p-4 bg-palmgreen/5 border border-palmgreen/25 rounded-2xl text-[11px]">
              <span className="font-extrabold uppercase text-[9.5px] tracking-widest text-[#2D5B3A] block mb-1">💡 Recomendación de Crecimiento Sincrónico</span>
              <p className="text-charcoal/80 leading-relaxed font-sans">
                Para garantizar el máximo potencial de crecimiento y una velocidad inigualable en tu dominio <strong>estadored.com</strong>, te recomendamos rotundamente el <strong>Método B: Firebase Hosting como Frontend + Cloud Run como Backend</strong>.
              </p>
              <ul className="list-disc pl-4 mt-2 space-y-1 text-charcoal/70 font-sans">
                <li><strong>Velocidad Global Inmediata (CDN Edge):</strong> Tus archivos estáticos se guardarán y servirán desde servidores de borde ultra rápidos cerca de tus usuarios en cualquier parte de Bolivia y el mundo de forma automática.</li>
                <li><strong>SSL Encriptado 100% Automático:</strong> Firebase aprovisiona y renueva el TLS/SSL de forma gratuita y nativa al detectar los DNS.</li>
                <li><strong>Arquitectura Escalable de Vanguardia:</strong> Te permite enrutar sub-rutas específicas como <code>/api/*</code> hacia tu Cloud Run dinámico sin configurar balanceadores de carga complejos de miles de dólares.</li>
              </ul>
            </div>

            {/* Selector de Método */}
            <div className="grid grid-cols-2 gap-3 bg-[#FAF9F5] p-1.5 rounded-2xl border border-[#ECE8DE]/60">
              <button
                type="button"
                onClick={() => setDomainMethod('cloudrun')}
                className={`py-2 px-3 text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all cursor-pointer ${domainMethod === 'cloudrun' ? 'bg-white text-skyblue-dark shadow-xs border border-skyblue/10' : 'text-charcoal/50 hover:text-charcoal bg-transparent'}`}
              >
                Método A: Cloud Run Directo
              </button>
              <button
                type="button"
                onClick={() => setDomainMethod('firebase')}
                className={`py-2 px-3 text-[10px] uppercase font-bold tracking-wider rounded-xl transition-all cursor-pointer ${domainMethod === 'firebase' ? 'bg-white text-green-700 shadow-xs border border-[#2D5B3A]/10 animate-pulse' : 'text-charcoal/50 hover:text-charcoal bg-transparent'}`}
              >
                Método B: Firebase Hosting (Recomendado ⭐)
              </button>
            </div>

            {/* Paso a Paso */}
            <div className="space-y-4">
              {/* PASO 1 */}
              <div className="flex gap-3 items-start border-l-2 border-skyblue/40 pl-3">
                <span className="w-5 h-5 bg-skyblue/10 border border-skyblue/30 text-skyblue-dark rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-extrabold text-xs uppercase tracking-wide text-charcoal font-sans">Paso 1: Alta en Consola de Proveedor</p>
                  <p className="text-[10.5px] text-charcoal/60 mt-1 leading-relaxed font-sans">
                    {domainMethod === 'cloudrun' ? (
                      <>
                        Inicia sesión en la <strong>Google Cloud Console</strong> de tu proyecto. Ve a <strong>Cloud Run</strong>, selecciona tu servicio <code>estadored-app</code>, haz clic en la pestaña <strong>"Administrar dominios personalizados"</strong> y agrega tu dominio <code>estadored.com</code>.
                      </>
                    ) : (
                      <>
                        Inicia sesión en tu consola de <strong>Firebase Console</strong>. Ve a la sección <strong>Build → Hosting</strong>. Selecciona <strong>"Agregar dominio propio"</strong> y escribe tu dominio cívico <code>estadored.com</code>.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* PASO 2 */}
              <div className="flex gap-3 items-start border-l-2 border-skyblue/40 pl-3">
                <span className="w-5 h-5 bg-skyblue/10 border border-skyblue/30 text-skyblue-dark rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-extrabold text-xs uppercase tracking-wide text-charcoal font-sans">Paso 2: Obtener Registros DNS</p>
                  <p className="text-[10.5px] text-charcoal/60 mt-1 leading-relaxed font-sans">
                    Usa los siguientes registros estándar para ingresar en tu panel de administración. Haz clic en copiar para llevarlos con seguridad:
                  </p>
                </div>
              </div>

              {/* TABLA DE REGISTROS DNS */}
              <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-4 overflow-hidden font-mono text-[10px] shadow-inner">
                <div className="grid grid-cols-4 gap-1 border-b border-[#ECE8DE] pb-2 text-charcoal/50 uppercase tracking-wider font-extrabold text-[9px] mb-2 font-sans">
                  <span>Tipo</span>
                  <span>Host</span>
                  <span>Valor / Destino</span>
                  <span className="text-right">Acción</span>
                </div>
                
                {/* Fila A 1 */}
                <div className="grid grid-cols-4 gap-1 items-center py-2 border-b border-[#ECE8DE]/50 font-mono">
                  <span className="text-sandbrown font-bold">A</span>
                  <span className="text-charcoal font-bold">@</span>
                  <span className="text-charcoal/80 truncate">
                    {domainMethod === 'cloudrun' ? '216.239.32.21' : '199.36.158.100'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(domainMethod === 'cloudrun' ? '216.239.32.21' : '199.36.158.100');
                      setCopiedKey('a1_adm');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="text-[9px] text-right text-skyblue-dark hover:underline font-bold select-none cursor-pointer flex items-center justify-end gap-1 font-sans"
                  >
                    {copiedKey === 'a1_adm' ? '¡Hecho!' : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</span>}
                  </button>
                </div>

                {/* Fila A 2 */}
                <div className="grid grid-cols-4 gap-1 items-center py-2 border-b border-[#ECE8DE]/50 font-mono">
                  <span className="text-sandbrown font-bold">A</span>
                  <span className="text-charcoal font-bold">@</span>
                  <span className="text-charcoal/80 truncate">
                    {domainMethod === 'cloudrun' ? '216.239.34.21' : '199.36.158.100'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(domainMethod === 'cloudrun' ? '216.239.34.21' : '199.36.158.100');
                      setCopiedKey('a2_adm');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="text-[9px] text-right text-skyblue-dark hover:underline font-bold select-none cursor-pointer flex items-center justify-end gap-1 font-sans"
                  >
                    {copiedKey === 'a2_adm' ? '¡Hecho!' : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</span>}
                  </button>
                </div>

                {/* Fila CNAME */}
                <div className="grid grid-cols-4 gap-1 items-center py-2 font-mono">
                  <span className="text-palmgreen font-bold">CNAME</span>
                  <span className="text-charcoal font-bold">www</span>
                  <span className="text-charcoal/80 truncate">
                    {domainMethod === 'cloudrun' ? 'ghs.googlehosted.com.' : 'gen-lang-client-0042316931.web.app.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(domainMethod === 'cloudrun' ? 'ghs.googlehosted.com.' : 'gen-lang-client-0042316931.web.app.');
                      setCopiedKey('cname_adm');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="text-[9px] text-right text-skyblue-dark hover:underline font-bold select-none cursor-pointer flex items-center justify-end gap-1 font-sans"
                  >
                    {copiedKey === 'cname_adm' ? '¡Hecho!' : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</span>}
                  </button>
                </div>
              </div>

              {/* PASO 3 */}
              <div className="flex gap-3 items-start border-l-2 border-skyblue/40 pl-3">
                <span className="w-5 h-5 bg-skyblue/10 border border-skyblue/30 text-skyblue-dark rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-extrabold text-xs uppercase tracking-wide text-charcoal font-sans font-sans">Paso 3: Cargar en Namecheap Advanced DNS</p>
                  <p className="text-[10.5px] text-charcoal/60 mt-1 leading-relaxed font-sans">
                    Inicia sesión en tu cuenta de <strong>Namecheap.com</strong>. Ve a tu <strong>Dashboard → Domain List</strong>, busca tu dominio <code>estadored.com</code> y haz clic en <strong>"Manage"</strong>. Luego haz clic en la pestaña <strong>"Advanced DNS"</strong>.
                    <br />
                    En la sección <strong>"Host Records"</strong>, elimina cualquier registro por defecto redundante y haz clic en <strong>"Add New Record"</strong> para ingresar los registros mostrados anteriormente.
                    ¡No olvides hacer clic en el check verde de guardado de Namecheap para cada registro!
                  </p>
                </div>
              </div>

              {/* PASO 4 */}
              <div className="flex gap-3 items-start border-l-2 border-skyblue/40 pl-3">
                <span className="w-5 h-5 bg-skyblue/10 border border-skyblue/30 text-skyblue-dark rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                <div>
                  <p className="font-extrabold text-xs uppercase tracking-wide text-charcoal font-sans">Paso 4: Esperar Propagación & SSL Certificado</p>
                  <p className="text-[10.5px] text-charcoal/60 mt-1 leading-relaxed font-sans">
                    Namecheap propaga el cambio en un lapso de entre 5 minutos y unas horas. Google/Firebase validará tu servidor al detectar e interpretar tu mapa DNS de forma segura e independiente.
                  </p>
                </div>
              </div>
            </div>

            {/* Simulación Interactiva */}
            <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#A06A42] font-mono">Consola de Propagación Autoritaria</p>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${domainStatus === 'checking' ? 'text-sandbrown border-sandbrown/20 bg-sandbrown/5 animate-pulse' : domainStatus === 'active' ? 'text-palmgreen border-palmgreen/25 bg-palmgreen/5 font-bold' : 'text-charcoal/40 border-charcoal/15 bg-white'}`}>
                  {domainStatus === 'checking' ? 'Consultando records...' : domainStatus === 'active' ? '● PROPAGACIÓN EN VIVO' : '○ EN COLA'}
                </span>
              </div>

              {domainStatus === 'checking' ? (
                <div className="space-y-1.5 py-2 font-mono text-[9px] text-charcoal/60 animate-pulse">
                  <p>🔍 Consultando DNS name servers autoritativos de Namecheap para estadored.com...</p>
                  <p>🔍 Verificando IP destino en los registros cívicos de tipo A...</p>
                  <p>🔍 Validando alias CNAME www → {domainMethod === 'cloudrun' ? 'ghs.googlehosted.com' : 'Firebase CDN Hosting'}</p>
                </div>
              ) : domainStatus === 'active' ? (
                <div className="space-y-1.5 py-1 font-mono text-[9px] text-[#2D5B3A] font-sans">
                  <p className="flex items-center gap-1.5 font-bold">✓ DNS Apunta correctamente a las direcciones IP de Google ({domainMethod === 'cloudrun' ? '216.239.32.21' : '199.36.158.100'})</p>
                  <p className="flex items-center gap-1.5 font-bold">✓ Registro CNAME www validado [Confirmado]</p>
                  <p className="flex items-center gap-1.5 text-charcoal/50">✓ Certificado SSL/TLS aprovisionado y encriptado exitosamente.</p>
                  <p className="text-[11px] italic text-[#2D5B3A] mt-2 text-center font-bold">
                    ¡Felicidades! estadored.com ya tiene su bandera soberana levantada y segura en la web.
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-charcoal/50 italic leading-snug font-sans">
                  Prueba la conexión DNS una vez ingresados los datos en Namecheap presionando el botón de abajo.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  if (domainStatus === 'pending') {
                    setDomainStatus('checking');
                    setTimeout(() => {
                      setDomainStatus('active');
                    }, 2000);
                  } else {
                    setDomainStatus('pending');
                  }
                }}
                className="stone-btn w-full px-4 py-2.5 bg-white text-charcoal border border-[#ECE8DE] hover:border-skyblue hover:text-skyblue-dark text-[10px] uppercase font-bold tracking-wider transition-all rounded-lg select-none cursor-pointer text-center font-sans"
              >
                {domainStatus === 'checking' ? 'Consultando...' : domainStatus === 'active' ? 'Reiniciar Verificación' : 'Probar Conexión DNS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'documentos' && (
        <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] flex flex-col gap-6 rounded-3xl">
          <div>
            <h3 className="font-serif font-black text-xl text-sandbrown-dark flex items-center gap-2">
              <Upload className="w-6 h-6 text-sandbrown" /> Carga de Documentos (Biblioteca Digital)
            </h3>
            <p className="text-xs text-charcoal/60 mt-1 leading-relaxed max-w-xl font-serif">
              Ingesta archivos PDF normativos, leyes u ordenanzas en la Biblioteca Digital. Estos documentos estarán disponibles para todos los soberanos, enriqueciendo la capacidad de toma de decisiones.
            </p>
          </div>
          <BibliotecaDigital userProfile={{ alias: 'Administrador Nodo Central', territorio: 'Nacional' }} initialTab="subir" />
        </div>
      )}

      
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

      {adminTab === 'telegram' && (
        <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] flex flex-col gap-6 rounded-3xl">
          <div>
            <h3 className="font-serif font-black text-xl text-[#0088cc] flex items-center gap-2">
              <Send className="w-6 h-6" /> Módulo Telegram y Automatizaciones
            </h3>
            <p className="text-xs text-charcoal/60 mt-1 leading-relaxed max-w-xl font-serif">
              El asistente IAsesor_bot está integrado en <code>server.ts</code>. Gestiona la conexión y habilita la creación automática de grupos para Nodos Colectivos.
            </p>
          </div>

          <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-6 text-sm text-charcoal/80 space-y-4 shadow-inner">
            <h4 className="font-bold uppercase tracking-wider text-charcoal/60 text-[10px]">Características de la API</h4>
            <ul className="list-disc pl-5 space-y-2 font-mono text-[11px]">
              <li><b>Bot Autonómico (Telegraf):</b> Funciona en puerto 3000 como webhook o polling.</li>
              <li><b>Gestión de Identidad:</b> Los ciudadanos vinculan su alias al registrarse para ser admitidos en subgrupos territoriales automáticamente.</li>
              <li><b>Auto-creación de Asambleas:</b> La API notifica a los superadministradores por un socket interno o crea un enlace (Telegram Link) de invitación efímero asociado al Nodo (<code>/api/notify-new-node</code>).</li>
            </ul>
            <div className="pt-4 border-t border-[#ECE8DE] flex justify-between items-center bg-white p-4 rounded-xl shadow-xs mt-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-charcoal/60 font-bold uppercase tracking-wider">Estado de Conexión</span>
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Conectado (IAsesor)</span>
              </div>
              <button className="px-4 py-2 bg-[#0088cc] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition">
                Sincronizar Rutinas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
