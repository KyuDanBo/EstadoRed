import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot, collection, addDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Shield, Zap, Target, Book, Menu, X,
  Settings, User, MapPin, 
  ChevronRight, Activity, Award, ArrowRight, LogOut, MessageSquare, CheckCircle, MessageCircle,
  Search, BookOpen, Sparkles, Lock, Network, Copy, ExternalLink, Globe, AlertTriangle, Info
} from 'lucide-react';
import ProposalFeed from './ProposalFeed';
import MyProposals from './MyProposals';
import EstadoRedMap from './EstadoRedMap';
import EstadoRedLogo from './EstadoRedLogo';
import ActiveVotings from './ActiveVotings';
import AdminView from './AdminView';
import EstructuraSistema from './EstructuraSistema';
import CitizenComplaints from './CitizenComplaints';
import { calculateGamification } from '../lib/gamification';
import { BibliotecaDigital } from './BibliotecaDigital';

// =======================================================
// ENLACES DE TRÍADA E ICONOS DIBUJADOS A MANO (Minimalistas)
// =======================================================

const TerritoryIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-[0_2px_4px_rgba(124,167,197,0.25)]" fill="none" stroke="#7CA7C5" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 50,15 C 32,15 22,27 22,46 C 22,69 50,85 50,85 C 50,85 78,69 78,46 C 78,27 68,15 50,15 Z" />
    <circle cx="50" cy="45" r="10" />
    <path d="M 32,45 C 38,48 44,48 48,45" strokeWidth="2.5" className="opacity-40" />
  </svg>
);

const OccupationIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-[0_2px_4px_rgba(160,106,66,0.22)]" fill="none" stroke="#A06A42" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 28,38 H 72 C 75,38 77,40 77,43 V 73 C 77,76 75,78 72,78 H 28 C 25,78 23,76 23,73 V 43 C 23,40 25,38 28,38 Z" />
    <path d="M 40,38 V 26 C 40,24 43,22 46,22 H 54 C 57,22 60,24 60,26 V 38" />
    <path d="M 23,55 H 77" />
    <path d="M 50,55 V 66" />
    <path d="M 62,48 Q 66,51 70,47" strokeWidth="2.5" className="opacity-40" />
  </svg>
);

const IdeologyIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-[0_2px_4px_rgba(45,91,58,0.25)]" fill="none" stroke="#2D5B3A" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 50,16 C 62,34 78,44 78,63 C 78,78 65,84 50,84 C 35,84 22,78 22,63 C 22,44 38,34 50,16 Z" />
    <path d="M 43,46 C 47,52 47,58 43,64 C 51,59 54,50 51,42 Z" fill="#2D5B3A" strokeWidth="1" />
    <path d="M 58,54 C 62,58 64,62 60,66" strokeWidth="2.5" className="opacity-40" />
  </svg>
);

const ProposalIcon = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-[0_2px_4px_rgba(160,106,66,0.22)]" fill="none" stroke="#2D5B3A" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 28,15 H 62 L 77,30 V 82 C 77,85 75,87 72,87 H 28 C 25,87 23,85 23,82 V 20 C 23,17 25,15 28,15 Z" />
    <path d="M 23,35 H 77" strokeWidth="2.5" className="opacity-40" stroke="#2D5B3A" />
    <path d="M 35,53 H 65" stroke="#2D5B3A" />
    <path d="M 35,68 H 55" stroke="#2D5B3A" />
    <path d="M 62,15 V 30 H 77" strokeWidth="4.5" stroke="#2D5B3A" />
  </svg>
);

// LÍNEAS DE FLUJO - SEPARADOR DINÁMICO TRICOLOR (Azul, Café, Verde)
export function FlowingLinesDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full py-4 overflow-hidden ${className}`}>
      <svg viewBox="0 0 200 12" className="w-full h-2" fill="none" strokeWidth="1.2" strokeLinecap="round">
        {/* Sky Blue Line */}
        <path d="M 0,3 C 40,6 70,2 100,6 C 130,10 160,3 200,3" stroke="#7CA7C5" />
        {/* Sandalwood Brown Line */}
        <path d="M 0,6 C 35,3 65,8 100,3 C 135,1 165,7 200,6" stroke="#A06A42" />
        {/* Palm Green Line */}
        <path d="M 0,9 C 45,11 75,5 100,9 C 125,11 155,6 200,9" stroke="#2D5B3A" />
      </svg>
    </div>
  );
}

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

export default function Dashboard({ respuestas }: { respuestas: Record<string, string> }) {
  const [userProfile, setUserProfile] = useState<any>(respuestas);

  useEffect(() => {
    setUserProfile(respuestas);
  }, [respuestas]);

  const alias = userProfile.alias || userProfile['alias'] || 'Soberano';
  const nombreLimpio = alias.replace(/\.nodo$/i, '').trim();
  const depto = userProfile.triada?.territorio || userProfile['departamento'] || 'La Paz';
  const muni = userProfile.triada?.territorio || userProfile['municipio'] || 'Tu Región';
  const rubro = userProfile.triada?.ocupacion || userProfile['ocupacion_otro'] || userProfile['ocupacion'] || userProfile['sector'] || 'Cívico';
  const ideologia = userProfile.triada?.ideologia || userProfile['ideologia_otro'] || userProfile['ideologia'] || 'Pragmático';
  const roleText = userProfile['rol'] || 'Ciudadano (Quiero proponer y participar activamente)';
  const isRep = roleText.includes('Representante');

  const AVATARES = [
    { emoji: '🦅', tipo: 'Cóndor Andino', desc: 'Vigilancia y Altura' },
    { emoji: '🐻', tipo: 'Oso Jucumari', desc: 'Fuerza Territorial' },
    { emoji: '🐆', tipo: 'Jaguar', desc: 'Acción Rápida' },
    { emoji: '🦙', tipo: 'Llama Fuerte', desc: 'Resistencia Máxima' },
    { emoji: '🦊', tipo: 'Zorro Andino (Tiula)', desc: 'Astucia y Supervivencia' },
    { emoji: '🐸', tipo: 'Rana Gigante', desc: 'Adaptabilidad Extrema' }
  ];

  const avatarSeleccionado = userProfile['avatar'] || '🦙';
  const animal = AVATARES.find(a => a.emoji === avatarSeleccionado) || { emoji: avatarSeleccionado, tipo: 'Nodo Cívico', desc: 'Participante Activo' };

  // Stats RPG style
  const stats = {
    INT: 6, // Intelecto Cívico
    EMP: 8, // Empatía Social
    ORG: 5, // Organización
    ACC: 7, // Acción Directa
    RES: 9  // Resistencia Moral
  };

  const { currentXP, currentIP, level, title, maxXP, maxIP } = calculateGamification(userProfile);
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && auth.currentUser) {
      if (file.size > 1024 * 1024 * 2) {
        alert("La imagen debe ser menor a 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result as string;
        try {
          await updateDoc(doc(db, "users", auth.currentUser!.uid), {
            photoURL: base64Str
          });
          setUserProfile({ ...userProfile, photoURL: base64Str });
        } catch (err) {
          console.error("Error updating photo", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Navigation & UI States
  const [activeCollectiveNode, setActiveCollectiveNode] = useState<{
    type: 'territorio' | 'ocupacion' | 'ideologia';
    value: string;
  } | null>(null);
  const [currentTab, setCurrentTab] = useState<'identidad' | 'buscar_nodos' | 'cursos' | 'configuraciones' | 'estructura_sistema' | 'delegacion' | 'fiscalizacion' | 'admin' | 'votaciones' | 'nodos_fisicos' | 'biblioteca' | 'insignias' | 'iniciativas' | 'editor_propuesta' | 'denuncias'>('identidad');
  const [selectedDocSection, setSelectedDocSection] = useState<'prologo' | 'arquitectura' | 'omnicanal' | 'auditoria' | 'roadmap'>('prologo');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Formulario de Propuesta Inicial
  const [initialProposalText, setInitialProposalText] = useState('');
  const [submittingInitial, setSubmittingInitial] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [editProposalText, setEditProposalText] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [nodeStats, setNodeStats] = useState<Record<string, number>>({});
  const [showProposalDashboard, setShowProposalDashboard] = useState(false);
  const [selectedVector, setSelectedVector] = useState<'general' | 'territorio' | 'ocupacion' | 'ideologia'>('general');
  
  // Perfil editing states in-page
  const [aliasInput, setAliasInput] = useState('');
  const [telegramInput, setTelegramInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦙');
  const [profileSaving, setProfileSaving] = useState(false);

  // Cursos States
  const [completedQuizzes, setCompletedQuizzes] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<string, { success: boolean, text: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapView, setIsMapView] = useState(true);

  // Dynamic content states
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [dbCollectiveNodes, setDbCollectiveNodes] = useState<any[]>([]);
  const [dbNetworks, setDbNetworks] = useState<any[]>([]);

  // Custom Domain Helper States
  const [domainMethod, setDomainMethod] = useState<'cloudrun' | 'firebase'>('cloudrun');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<'checking' | 'active' | 'pending'>('pending');

  const isProposalMade = !!userProfile.accion_2;
  const isQuizCompleted = Object.keys(completedQuizzes).length > 0;
  const hasIP = currentIP > 0;
  const hasTelegraphOrCustomAvatar = !!userProfile.telegram || userProfile.avatar !== '🦙';

  const insignias = [
    {
      id: 'soberano_iniciado',
      name: 'Soberano Iniciado',
      desc: 'Registrado formalmente en la red democrática.',
      emoji: '👑',
      unlocked: true,
      color: 'from-amber-400 to-yellow-600 border-yellow-300',
      requirement: 'Creación de cuenta'
    },
    {
      id: 'lider_iniciativa',
      name: 'Tejedor del Procomún',
      desc: 'Presentar tu primera propuesta para el desarrollo local.',
      emoji: '✍️',
      unlocked: isProposalMade,
      color: 'from-purple-400 to-indigo-600 border-purple-300',
      requirement: 'Hacer una Propuesta'
    },
    {
      id: 'mente_constitucional',
      name: 'Académico Constitucional',
      desc: 'Validar exitosamente un desafío en la Academia de Autonomía.',
      emoji: '📜',
      unlocked: isQuizCompleted,
      color: 'from-blue-400 to-cyan-600 border-blue-300',
      requirement: 'Aprobar Cuestionario'
    },
    {
      id: 'activista_impacto',
      name: 'Activista de Impacto',
      desc: 'Ganar tu primer punto de IP de Moderación o interacción.',
      emoji: '⚡',
      unlocked: hasIP,
      color: 'from-emerald-400 to-teal-600 border-emerald-300',
      requirement: 'Efectuar Acción Cívica (+1 IP)'
    },
    {
      id: 'nodo_sinergico',
      name: 'Nodo Sincrónico',
      desc: 'Configurar alias cívico o usuario de Telegram de coordinación.',
      emoji: '🤝',
      unlocked: hasTelegraphOrCustomAvatar,
      color: 'from-rose-400 to-orange-500 border-rose-300',
      requirement: 'Personalizar Identidad'
    }
  ];

  useEffect(() => {
    // Dynamic courses subscription
    const unsubscribeCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      const list: any[] = [];
      snap.forEach((dDoc) => {
        list.push({ id: dDoc.id, ...dDoc.data() });
      });
      setDbCourses(list);
    });

    // Dynamic collective nodes subscription
    const unsubscribeNodes = onSnapshot(collection(db, 'collective_nodes'), (snap) => {
      const list: any[] = [];
      snap.forEach((dDoc) => {
        list.push({ id: dDoc.id, ...dDoc.data() });
      });
      setDbCollectiveNodes(list);
    });

    // Dynamic networks subscription
    const unsubscribeNets = onSnapshot(collection(db, 'networks'), (snap) => {
      const list: any[] = [];
      snap.forEach((dDoc) => {
        list.push({ id: dDoc.id, ...dDoc.data() });
      });
      setDbNetworks(list);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeNodes();
      unsubscribeNets();
    };
  }, []);

  const navigateTo = (tab: any, node: any = null) => {
    setCurrentTab(tab);
    setActiveCollectiveNode(node);
    window.history.pushState({ tab, node }, '', `?tab=${tab}`);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handlePopstate = (e: PopStateEvent) => {
      if (e.state) {
        setCurrentTab(e.state.tab || 'identidad');
        setActiveCollectiveNode(e.state.node || null);
      }
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  const activeTab = activeCollectiveNode !== null 
    ? 'comunidad' 
    : currentTab;

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    if (!aliasInput.trim()) return;
    setProfileSaving(true);
    
    // Clean ".nodo" suffix from the input alias as specified
    const cleanAlias = aliasInput.replace(/\.nodo$/i, '').trim();

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        alias: cleanAlias,
        avatar: selectedAvatar,
        telegram: telegramInput.trim()
      });
      setUserProfile((prev: any) => ({
        ...prev,
        alias: cleanAlias,
        avatar: selectedAvatar,
        telegram: telegramInput.trim()
      }));
    } catch (e) {
      console.error("Error updating user profile:", e);
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      setAliasInput((userProfile.alias || '').replace(/\.nodo$/i, ''));
      setTelegramInput(userProfile.telegram || '');
      setSelectedAvatar(userProfile.avatar || '🦙');
    }
  }, [userProfile?.alias, userProfile?.telegram, userProfile?.avatar]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (d) => {
      if (d.exists()) {
        const data = d.data();
        setUserProfile(data);

        // Auto-verify and create collective nodes if they do not exist
        if (data.triada) {
          const { territorio, ocupacion, ideologia } = data.triada;
          const ensureNode = async (type: 'territorio' | 'ocupacion' | 'ideologia', val: string) => {
            if (!val) return;
            const nodeId = `${type}_${val.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
            const nodeRef = doc(db, 'collective_nodes', nodeId);
            try {
              const nodeSnap = await getDoc(nodeRef);
              if (!nodeSnap.exists()) {
                await setDoc(nodeRef, {
                  id: nodeId,
                  name: val,
                  type: type,
                  memberCount: 1,
                  createdAt: serverTimestamp()
                });
              }
            } catch (err) {
              console.error('Error verifying/creating node:', err);
              handleFirestoreError(err, OperationType.CREATE, `collective_nodes/${nodeId}`);
            }
          };

          ensureNode('territorio', territorio);
          ensureNode('ocupacion', ocupacion);
          ensureNode('ideologia', ideologia);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch collective nodes member counts dynamically
  useEffect(() => {
    if (!userProfile?.triada) return;
    const fetchCounts = async () => {
      const statsObj: Record<string, number> = {};
      const { territorio, ocupacion, ideologia } = userProfile.triada;
      
      const getNodeCount = async (type: string, val: string) => {
        if (!val) return;
        const nodeId = `${type}_${val.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
        const nodeRef = doc(db, 'collective_nodes', nodeId);
        try {
          const snap = await getDoc(nodeRef);
          if (snap.exists()) {
            statsObj[type] = snap.data().memberCount || 1;
          } else {
            statsObj[type] = 1;
          }
        } catch (e) {
          statsObj[type] = 1;
        }
      };

      await Promise.all([
        getNodeCount('territorio', territorio),
        getNodeCount('ocupacion', ocupacion),
        getNodeCount('ideologia', ideologia)
      ]);
      setNodeStats(statsObj);
    };

    fetchCounts().catch(console.error);
  }, [userProfile?.triada]);

  // Simular un hito a los 10 segundos para demostrar el Popup Llamativo (Solo 1 vez)
  useEffect(() => {
    const yaMostrado = localStorage.getItem('hitoAlcanzadoMostrado');
    if (!yaMostrado) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        localStorage.setItem('hitoAlcanzadoMostrado', 'true');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleImproveProposal = async (text: string, setter: (val: string) => void) => {
    if (!text.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Esta es mi propuesta en bruto para EstadoRed: "${text}". Por favor, resúmela y redactala de forma más profesional y directa en no más de 2 o 3 líneas, neutra y concisa. REGLA ESTRICTA: Devuelve ÚNICAMENTE la propuesta redactada. No agregues saludos, explicaciones, ni confirmaciones en tu respuesta, solo el texto.`,
          history: []
        })
      });
      const data = await response.json();
      if (data.success && data.reply) {
        setter(cleanAIProposal(data.reply));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddVision = async () => {
    if (!auth.currentUser || !editProposalText.trim()) return;
    setEditLoading(true);
    try {
      const newVision = {
        text: editProposalText,
        timestamp: new Date().toISOString()
      };
      
      const updatedVisiones = [
        ...(userProfile.visiones || (userProfile.accion_2 ? [{ text: userProfile.accion_2, timestamp: new Date().toISOString() }] : [])),
        newVision
      ];
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        accion_2: editProposalText,
        visiones: updatedVisiones
      });
      
      setUserProfile((prev: any) => ({
        ...prev,
        accion_2: editProposalText,
        visiones: updatedVisiones
      }));
      
      setEditProposalText('');
      setIsEditingProposal(false);
    } catch (errProfile) {
      handleFirestoreError(errProfile, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveInitialProposal = async () => {
    if (!auth.currentUser || !initialProposalText.trim()) return;
    setSubmittingInitial(true);
    try {
      const initialVision = {
        text: initialProposalText,
        timestamp: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        accion_2: initialProposalText,
        visiones: [initialVision]
      });
      
      setUserProfile((prev: any) => ({
        ...prev,
        accion_2: initialProposalText,
        visiones: [initialVision]
      }));
    } catch (errProfile) {
      handleFirestoreError(errProfile, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setSubmittingInitial(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const newMessage = { role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, newMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newMessage.text,
          history: chatHistory
        })
      });
      const data = await response.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { role: 'model', text: data.reply }]);
        
        // Award XP for interacting and learning (Autonomous Education)
        if (auth.currentUser) {
          const currentStats = userProfile?.stats || { xp: 100, ip: 0 };
          const newXP = (currentStats.xp || 100) + 15;
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              stats: {
                ...currentStats,
                xp: newXP
              }
            });
          } catch (xpErr) {
            handleFirestoreError(xpErr, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
          }
        }
      } else {
        setChatHistory(prev => [...prev, { role: 'model', text: "Error: " + data.error }]);
      }
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Error de red: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Propuesta Inicial Obligatoria
  if (!userProfile?.accion_2) {
    return (
      <div className="absolute inset-0 z-[200] flex items-center justify-center bg-creambg p-4 paper-texture overflow-y-auto w-full">
        <div id="initial-proposal-card" className="bg-white/95 border border-[#ECE8DE] shadow-xl p-8 pt-10 stone-card w-full max-w-2xl relative animate-in fade-in zoom-in-95">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white p-3 rounded-full border border-[#ECE8DE] shadow-sm">
            <Book className="w-8 h-8 text-sandbrown" />
          </div>
          
          <h2 className="text-2xl font-bold font-serif text-center text-charcoal tracking-wide mb-2 mt-2">Mi visión de país</h2>
          <p className="text-charcoal/70 text-center text-sm mb-6 max-w-xl mx-auto leading-relaxed">
            La red necesita tu voz soberana. Como integrante del nodo de <strong>{rubro}</strong> en <strong>{depto}</strong>, <strong>¿Cuál es el Estado que quiero construir?</strong> Comparte tu visión inspiradora para edificar un nuevo porvenir para todas las regiones.
          </p>

          <textarea
            value={initialProposalText}
            onChange={(e) => setInitialProposalText(e.target.value)}
            disabled={submittingInitial || aiLoading}
            className="w-full bg-[#FAF9F5] border border-[#ECE8DE] stone-input p-4 text-charcoal focus:outline-none focus:border-sandbrown focus:ring-1 focus:ring-sandbrown min-h-[140px] mb-4 text-sm"
            placeholder="Escribe aquí tu visión de país y tus propuestas fundamentales sobre cuál es el Estado que deseas construir..."
          />
          
          <div className="text-[11px] text-charcoal/50 italic text-center mb-4">
            🔒 Tu visión es completamente soberana y de autoría propia. Se registrará tal y como la escribes sin intervención de IA ni control de nodo colectivo.
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={handleSaveInitialProposal}
              disabled={submittingInitial || !initialProposalText.trim()}
              className="stone-btn w-full sm:w-auto px-10 py-4 bg-sandbrown hover:bg-sandbrown-dark text-white font-bold uppercase tracking-wider shadow-[inset_0_2.5px_4px_rgba(255,255,255,0.25),_0_4px_10px_rgba(160,106,66,0.35)] cursor-pointer transition-all text-xs rounded-xl"
            >
              <span>{submittingInitial ? 'Guardando...' : 'Inaugurar Mi Diario de Visiones'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ELEMENTOS DE NAVEGACIÓN COMPARTIDOS (Sidebar)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* LOGO & MARCA */}
        <div className="flex flex-col items-center pt-2">
          <EstadoRedLogo showText={true} textSize="sm" />
        </div>

        <FlowingLinesDivider />



        {/* BUSCADOR UNIVERSAL EN EL SIDEBAR */}
        <div className="px-1.5 relative mb-2">
          <label className="text-[7.5px] uppercase tracking-[0.25em] font-black text-charcoal/40 mb-1.5 block">Exploración de la Red</label>
          <div className="relative font-mono">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/45" />
            <input 
              type="text"
              placeholder="Buscar en el EstadoRed..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveCollectiveNode(null);
                setCurrentTab('buscar_nodos');
              }}
              className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl pl-9 pr-2 py-2 text-xs text-charcoal focus:outline-none focus:border-sandbrown placeholder-charcoal/45 font-sans"
            />
          </div>
        </div>

        {/* MENÚ DE SECCIONES PRINCIPALES */}
        <div className="space-y-1.5 pb-20">
          
          <div className="mb-4">
            <p className="text-[8.5px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-2 px-1">Mi Identidad</p>
            <button onClick={() => navigateTo('identidad')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'identidad' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <User className="w-4 h-4" /> <span>Mi Ficha</span>
            </button>
            <button onClick={() => navigateTo('insignias')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'insignias' ? 'bg-[#A06A42]/10 text-[#A06A42] border-[#A06A42]/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <Award className="w-4 h-4 text-amber-500 hover:animate-pulse" /> <span>Mis Insignias</span>
            </button>
            <button onClick={() => navigateTo('iniciativas')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'iniciativas' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <Sparkles className="w-4 h-4 text-palmgreen" /> <span>Mis Iniciativas</span>
            </button>
            <button onClick={() => navigateTo('editor_propuesta')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'editor_propuesta' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <BookOpen className="w-4 h-4 text-purple-600" /> <span>Visión de País</span>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-[8.5px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-2 px-1">Redes Territoriales</p>
            <button onClick={() => navigateTo('delegacion')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'delegacion' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <Network className="w-4 h-4 text-skyblue" /> <span>Estructura de Red</span>
            </button>
            <button onClick={() => navigateTo('nodos_fisicos')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'nodos_fisicos' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <MapPin className="w-4 h-4 text-sandbrown" /> <span>Nodos Físicos</span>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-[8.5px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-2 px-1">Control Social</p>
            <button onClick={() => navigateTo('fiscalizacion')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'fiscalizacion' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <Shield className="w-4 h-4" /> <span>Fiscalización</span>
            </button>
            <button onClick={() => navigateTo('denuncias')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'denuncias' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <AlertTriangle className="w-4 h-4 text-red-500" /> <span>Denuncia Ciudadana</span>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-[8.5px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-2 px-1">Más Conocimiento</p>
            <button onClick={() => navigateTo('cursos')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'cursos' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <BookOpen className="w-4 h-4 text-charcoal" /> <span>Academia Cívica</span>
            </button>
            <button onClick={() => navigateTo('biblioteca')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'biblioteca' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <Book className="w-4 h-4 text-sandbrown" /> <span>Biblioteca Digital</span>
            </button>
            <button onClick={() => navigateTo('que_es')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'que_es' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <Info className="w-4 h-4 text-skyblue" /> <span>¿Qué es EstadoRed?</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[#ECE8DE]">
            <button onClick={() => navigateTo('configuraciones')} className={`w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'configuraciones' ? 'bg-[#A06A42]/10 text-sandbrown border-sandbrown/20' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}>
              <Settings className="w-4 h-4 text-charcoal/70" /> <span>Configuración</span>
            </button>

            {(auth.currentUser?.email === 'daren.bo.lp@gmail.com' || auth.currentUser?.email === 'admin@estadored.app' || userProfile?.isAdmin === true || userProfile?.rol === 'Admin') && (
              <button 
                onClick={() => navigateTo('estructura_sistema')}
                className={`w-full mt-2 text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none cursor-pointer border ${activeTab === 'estructura_sistema' ? 'bg-[#A06A42]/10 text-[#A06A42] border-[#A06A42]/20 font-bold' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/35 border-transparent'}`}
              >
                <Network className="w-4 h-4 text-charcoal" />
                <span>Simular (Admin)</span>
              </button>
            )}
          </div>
        </div>

        <FlowingLinesDivider />

        {/* CANALES DIRECTOS DE ASAMBLEA */}
        <div className="space-y-1.5">
          <p className="text-[8.5px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-2 px-1">Tus Nodos Directos</p>
          
          <button
            onClick={() => {
              setActiveCollectiveNode({ type: 'territorio', value: depto });
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition duration-200 text-[11px] font-semibold flex items-center justify-between select-none cursor-pointer border ${activeCollectiveNode?.type === 'territorio' ? 'bg-skyblue/10 text-skyblue-dark border-skyblue/25 font-bold' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/30 border-transparent'}`}
          >
            <span className="flex items-center gap-2.5 truncate max-w-[80%]">
              <span className="w-1.5 h-1.5 bg-[#7CA7C5] rounded-full"></span>
              <span className="truncate">{depto}</span>
            </span>
            <span className="text-[9px] bg-skyblue/15 text-skyblue-dark px-1.5 py-0.5 rounded-md font-bold">{nodeStats['territorio'] || 1}</span>
          </button>

          <button
            onClick={() => {
              setActiveCollectiveNode({ type: 'ocupacion', value: rubro });
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition duration-200 text-[11px] font-semibold flex items-center justify-between select-none cursor-pointer border ${activeCollectiveNode?.type === 'ocupacion' ? 'bg-[#A06A42]/10 text-sandbrown-dark border-[#A06A42]/20 font-bold' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/30 border-transparent'}`}
          >
            <span className="flex items-center gap-2.5 truncate max-w-[80%]">
              <span className="w-1.5 h-1.5 bg-[#A06A42] rounded-full"></span>
              <span className="truncate">{rubro}</span>
            </span>
            <span className="text-[9px] bg-[#A06A42]/15 text-sandbrown-dark px-1.5 py-0.5 rounded-md font-bold">{nodeStats['ocupacion'] || 1}</span>
          </button>

          <button
            onClick={() => {
              setActiveCollectiveNode({ type: 'ideologia', value: ideologia });
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition duration-200 text-[11px] font-semibold flex items-center justify-between select-none cursor-pointer border ${activeCollectiveNode?.type === 'ideologia' ? 'bg-palmgreen/10 text-palmgreen-dark border-palmgreen/25 font-bold' : 'bg-transparent text-charcoal/70 hover:bg-warmgray/30 border-transparent'}`}
          >
            <span className="flex items-center gap-2.5 truncate max-w-[80%]">
              <span className="w-1.5 h-1.5 bg-[#2D5B3A] rounded-full"></span>
              <span className="truncate">{ideologia}</span>
            </span>
            <span className="text-[9px] bg-palmgreen/15 text-palmgreen-dark px-1.5 py-0.5 rounded-md font-bold">{nodeStats['ideologia'] || 1}</span>
          </button>
        </div>
      </div>

      {/* FOOTER DESCONEXIÓN */}
      <div className="pt-4 mt-6 border-t border-[#ECE8DE]">
        <button
          onClick={() => signOut(auth)}
          className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm mb-4"
        >
          <LogOut className="w-4 h-4" />
          <span>Desconectar Nodo</span>
        </button>
      </div>
    </div>
  );

  const isAdmin = auth.currentUser?.email === 'daren.bo.lp@gmail.com' || auth.currentUser?.email === 'admin@estadored.app' || userProfile?.isAdmin === true || userProfile?.rol === 'Admin';

  if (isAdmin) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col md:flex-row bg-[#F9F7F2] paper-texture text-charcoal select-text overflow-hidden w-full h-[100dvh]">
        <aside className="hidden md:flex w-72 flex-col bg-white border-r border-[#ECE8DE] shrink-0 p-6 self-stretch h-full overflow-y-auto relative z-40 shadow-sm">
           <div className="flex flex-col items-center pt-2">
             <EstadoRedLogo showText={true} textSize="sm" />
           </div>
           <FlowingLinesDivider />
           <p className="text-[8.5px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-2 px-1">Control del Sistema</p>
           <div className="flex-1 space-y-2">
              <button 
                className="w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none bg-skyblue/10 text-skyblue-dark border border-skyblue/20"
              >
                  <Shield className="w-4 h-4" /> Centro de Gobernanza
              </button>
           </div>
           <div className="pt-4 mt-6 border-t border-[#ECE8DE]">
              <button
                onClick={() => signOut(auth)}
                className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm md:mb-4"
              >
                <LogOut className="w-4 h-4" /> Desconectar
              </button>
           </div>
        </aside>

        {/* HEADER MOVILE ADMIN */}
        <header className="flex md:hidden items-center justify-between bg-white border-b border-[#ECE8DE] px-4 py-3 shrink-0 sticky top-0 z-40 w-full shadow-sm">
          <div className="flex items-center gap-2">
            <EstadoRedLogo showText={false} className="w-16" />
            <span className="font-serif font-black text-charcoal text-base">EstadoRed Admin</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl hover:bg-warmgray/40 transition shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-charcoal" /> : <Menu className="w-5 h-5 text-charcoal" />}
          </button>
        </header>

        {/* MOBILE DRAWER ADMIN */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[53px] bottom-0 bg-white z-40 p-6 overflow-y-auto animate-in slide-in-from-top-4 duration-300 flex flex-col justify-between">
             <div className="space-y-4">
               <div className="flex flex-col items-center pt-2">
                 <EstadoRedLogo showText={true} textSize="sm" />
               </div>
               <FlowingLinesDivider />
               <p className="text-[8.5px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-2 px-1">Control del Sistema</p>
               <button className="w-full text-left px-4 py-2.5 rounded-xl transition duration-200 text-xs font-bold uppercase tracking-wider flex items-center gap-3 select-none bg-skyblue/10 text-skyblue-dark border border-skyblue/20">
                  <Shield className="w-4 h-4" /> Centro de Gobernanza
               </button>
             </div>
             <div className="pt-4 mt-6 border-t border-[#ECE8DE]">
                <button
                  onClick={() => signOut(auth)}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm md:mb-4"
                >
                  <LogOut className="w-4 h-4" /> Desconectar
                </button>
             </div>
          </div>
        )}

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative p-4 md:p-8 z-10 w-full animate-in fade-in duration-300">
          <div className="max-w-5xl mx-auto w-full space-y-8 pb-16">
            <AdminView />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col md:flex-row bg-[#F9F7F2] paper-texture text-charcoal select-text overflow-hidden w-full h-[100dvh]">
      
      {/* 1. SIDEBAR DE NAV DESKTOP */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-[#ECE8DE] shrink-0 p-6 self-stretch h-full overflow-y-auto w-72 relative z-40 shadow-sm">
        {renderSidebarContent()}
      </aside>

      {/* 2. HEADER MOVIL */}
      <header className="flex md:hidden items-center justify-between bg-white border-b border-[#ECE8DE] px-4 py-3 shrink-0 sticky top-0 z-40 w-full shadow-sm">
        <div className="flex items-center gap-2">
          {/* Logo compact */}
          <EstadoRedLogo showText={false} className="w-16" />
          <span className="font-serif font-black text-charcoal text-base">EstadoRed</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Menu triggers */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl hover:bg-warmgray/40 transition shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-charcoal" /> : <Menu className="w-5 h-5 text-charcoal" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[53px] bottom-0 bg-white z-40 p-6 overflow-y-auto animate-in slide-in-from-top-4 duration-300">
          {renderSidebarContent()}
        </div>
      )}

      {/* 3. CONTENIDO CENTRAL */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative p-4 md:p-8 z-10">
        
        <div className="max-w-5xl mx-auto w-full space-y-8 pb-16">
          


          {/* =========================================
              VISTA 1: IDENTIDAD POLÍTICA
              ========================================= */}
          {activeTab === 'identidad' && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                
                {/* NEW HEADER REGION: Perfil de Usuario */}
                <section className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] flex flex-col items-center text-center relative">
                  {/* Photo Upload and Avatar */}
                  <label className="relative block w-28 h-28 sm:w-32 sm:h-32 bg-[#FAF9F5] border-2 border-sandbrown/30 rounded-full flex flex-col items-center justify-center shadow-sm cursor-pointer hover:border-sandbrown transition-all overflow-hidden mb-4 group ring-4 ring-white">
                    {userProfile.photoURL ? (
                      <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="text-4xl sm:text-5xl select-none group-hover:scale-110 transition-transform duration-300">{animal.emoji}</span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-charcoal/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold uppercase tracking-wider">Subir Foto</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>

                  {/* Name and Level */}
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-charcoal tracking-tight">{nombreLimpio}</h2>
                  <div className="flex items-center gap-2 mt-2 mb-5">
                    <span className="px-2 py-0.5 rounded-full bg-sandbrown/10 text-sandbrown-dark text-[10px] font-bold uppercase tracking-widest border border-sandbrown/20 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Nivel {level}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-charcoal/5 text-charcoal/60 text-[10px] font-bold uppercase tracking-widest border border-charcoal/10 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {title}
                    </span>
                  </div>

                  {/* Stats (XP and IP) */}
                  <div className="flex gap-4 sm:gap-8 w-full max-w-md mb-6">
                    <div className="flex-1 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 shadow-inner relative group cursor-help">
                      <div className="absolute opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-md z-10 w-fit text-center">Puntos de Experiencia (Actividad)</div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">
                         <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-skyblue" /> XP</span>
                         <span className="text-skyblue-dark">{currentXP} / {maxXP}</span>
                      </div>
                      <div className="w-full bg-[#ECE8DE] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#7CA7C5] h-full" style={{ width: `${Math.min(100, (currentXP / maxXP) * 100)}%` }}></div>
                      </div>
                    </div>

                    <div className="flex-1 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 shadow-inner relative group cursor-help">
                      <div className="absolute opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[10px] px-2 py-1 rounded min-w-[200px] shadow-md z-10 w-fit text-center leading-tight">Puntos de Impacto (Consenso referendado). Límite ciudadano: 1500.</div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-charcoal/60 uppercase tracking-widest mb-1.5">
                         <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-palmgreen" /> IP</span>
                         <span className="text-palmgreen-dark">{currentIP} {maxIP > 0 ? `/ ${maxIP}` : ''}</span>
                      </div>
                      <div className="w-full bg-[#ECE8DE] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#2D5B3A] h-full" style={{ width: maxIP > 0 ? `${Math.min(100, (currentIP / maxIP) * 100)}%` : '100%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Incidencia */}
                  <div className="w-full">
                    {/* Votaciones Activas Button */}
                    <button 
                      onClick={() => setCurrentTab('votaciones')}
                      className="stone-btn w-full px-6 py-4 bg-brand-50 hover:bg-brand-100/50 border border-brand-500/20 text-brand-700 font-extrabold uppercase tracking-wider shadow-sm transition-all rounded-xl flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Target className="w-4 h-4 text-brand-600" />
                      <span>Votaciones Activas</span>
                    </button>
                  </div>
                </section>

                {/* Sección principal: La persona rodeada por sus categorías en forma de triángulo tríadico como la imagen */}
                <section id="political-identity-section" className="bg-white/95 border border-[#ECE8DE] stone-card p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col items-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sandbrown-light/5 via-transparent to-transparent pointer-events-none"></div>
                  
                  <div className="text-center max-w-xl mx-auto mb-3 z-10">
                    <p className="text-[10px] text-sandbrown font-bold tracking-widest uppercase mb-1">Identidad política reconocida</p>
                    <h3 className="font-serif font-black text-xl text-charcoal mb-1 tracking-tight">Nodo individual soberano</h3>
                  </div>
                  
                  {/* Triadic Identity Interactive Diagram exactly recreating the image layout */}
                  <div className="w-full max-w-lg mx-auto bg-[#FAF9F5]/40 border border-[#ECE8DE] rounded-3xl p-6 md:p-8 shadow-inner relative flex flex-col items-center mt-2 z-10">
                    {/* SVG Triad Graph */}
                    <div className="relative w-72 h-72 flex items-center justify-center pointer-events-auto">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        {/* Outer dashed triangle */}
                        <path d="M 50 18 L 18 72 L 82 72 Z" fill="none" stroke="#ECE8DE" strokeWidth="1.5" strokeDasharray="3 3" />
                        {/* Connector lines to central node */}
                        <line x1="50" y1="48" x2="50" y2="18" stroke="#38bdf8" strokeWidth="2" className="animate-pulse" />
                        <line x1="50" y1="48" x2="18" y2="72" stroke="#A06A42" strokeWidth="2" className="animate-pulse" />
                        <line x1="50" y1="48" x2="82" y2="72" stroke="#10b981" strokeWidth="2" className="animate-pulse" />
                      </svg>

                      {/* Central Node representing the User's Alias */}
                      <div className="absolute w-14 h-14 rounded-full bg-slate-900 border-2 border-sandbrown flex flex-col items-center justify-center shadow-lg text-[10px] text-white font-bold animate-pulse text-center select-none z-10 px-1 py-0.5 leading-tight">
                        <span className="text-[9px] text-[#FAF9F5]/40 font-mono tracking-wider">NODO</span>
                        <span className="truncate max-w-[48px] text-sandbrown-light font-black">{userProfile.alias || 'ID'}</span>
                      </div>

                      {/* Territorio Slot (Top) */}
                      <button 
                        onClick={() => {
                          setSelectedVector('territorio');
                          setTimeout(() => navigateTo('comunidad', { type: 'territorio', value: muni }), 300);
                        }}
                        className={`absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer select-none transition-all duration-300 ${selectedVector === 'territorio' ? 'scale-110' : 'hover:scale-105'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-skyblue text-white text-lg flex items-center justify-center font-bold shadow-md ring-4 ring-white border border-skyblue/20 group-hover:scale-110 transition duration-200">📍</div>
                        <span className="text-[8.5px] font-black text-skyblue-dark bg-skyblue/10 border border-skyblue/20 px-2 py-0.5 mt-1 rounded-full shadow-2xs tracking-wider">
                          TERRITORIO
                        </span>
                        <span className="text-[10px] font-serif font-black text-charcoal/80 max-w-[110px] truncate text-center mt-0.5">
                          {depto}
                        </span>
                      </button>

                      {/* Ocupación Slot (Bottom Left) */}
                      <button 
                        onClick={() => {
                          setSelectedVector('ocupacion');
                          setTimeout(() => navigateTo('comunidad', { type: 'ocupacion', value: rubro }), 300);
                        }}
                        className={`absolute bottom-0 left-1 flex flex-col items-center group cursor-pointer select-none transition-all duration-300 ${selectedVector === 'ocupacion' ? 'scale-110' : 'hover:scale-105'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-sandbrown text-white text-lg flex items-center justify-center font-bold shadow-md ring-4 ring-white border border-sandbrown/20 group-hover:scale-110 transition duration-200">🛠️</div>
                        <span className="text-[8.5px] font-black text-sandbrown-dark bg-sandbrown/10 border border-sandbrown/20 px-2 py-0.5 mt-1 rounded-full shadow-2xs tracking-wider">
                          OCUPACIÓN
                        </span>
                        <span className="text-[10px] font-serif font-black text-charcoal/80 max-w-[110px] truncate text-center mt-0.5">
                          {rubro}
                        </span>
                      </button>

                      {/* Ideología Slot (Bottom Right) */}
                      <button 
                        onClick={() => {
                          setSelectedVector('ideologia');
                          setTimeout(() => navigateTo('comunidad', { type: 'ideologia', value: ideologia }), 300);
                        }}
                        className={`absolute bottom-0 right-1 flex flex-col items-center group cursor-pointer select-none transition-all duration-300 ${selectedVector === 'ideologia' ? 'scale-110' : 'hover:scale-105'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-palmgreen text-white text-lg flex items-center justify-center font-bold shadow-md ring-4 ring-white border border-palmgreen/20 group-hover:scale-110 transition duration-200">🧠</div>
                        <span className="text-[8.5px] font-black text-palmgreen-dark bg-palmgreen/10 border border-palmgreen/20 px-2 py-0.5 mt-1 rounded-full shadow-2xs tracking-wider">
                          IDEOLOGÍA
                        </span>
                        <span className="text-[10px] font-serif font-black text-charcoal/80 max-w-[110px] truncate text-center mt-0.5">
                          {ideologia}
                        </span>
                      </button>
                    </div>

                  </div>

                  <div className="w-full max-w-xl text-center mt-6 pt-5 border-t border-[#ECE8DE]/60 z-10">
                    <p className="text-charcoal/40 text-[10px] sm:text-[11px] leading-relaxed max-w-md mx-auto font-medium">
                      Interactúa con tu Triada para ingresar directamente a las asambleas del EstadoRed boliviano, o redacta e inscribe tu visión país en tu bitácora ciudadana.
                    </p>
                  </div>
                </section>

              </div>
          )}

          {activeTab === 'editor_propuesta' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Lado Izquierdo: Historial / Diario de Visiones */}
                <div className="flex-1 w-full space-y-6 animate-in slide-in-from-left duration-500">
                  <div className="bg-white/95 border border-[#ECE8DE] p-5 stone-card shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden gap-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sandbrown-light/10 blur-3xl pointer-events-none"></div>
                    <div>
                      <h2 className="text-md md:text-lg font-serif font-black flex items-center gap-2 text-charcoal">
                        <Book className="w-5 h-5 text-sandbrown" />
                        Mi Diario Sincero de Visiones de País
                      </h2>
                      <p className="text-charcoal/50 text-[10px] uppercase font-bold tracking-wider mt-1">
                        🔒 EspacioÍntimo • Ligado estrictamente a tu identidad soberana
                      </p>
                    </div>
                    <button 
                      onClick={() => navigateTo('identidad')}
                      className="stone-btn px-4 py-2 bg-[#FAF9F5] hover:bg-[#FAF9F5]/80 text-charcoal border border-[#ECE8DE] text-[10px] font-black uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      ← Volver a Mi Ficha
                    </button>
                  </div>

                  {/* Lista Cronológica de Visiones */}
                  <div className="bg-white border border-[#ECE8DE] rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="border-b border-[#ECE8DE] pb-2">
                      <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">Bitácora de Deseos Soberanos</h3>
                      <p className="text-[11px] text-charcoal/50">Tu evolución ideológica y de visión nacional, grabada libre de presiones externas.</p>
                    </div>

                    <div className="space-y-4">
                      {(() => {
                        const visiones = userProfile.visiones || (userProfile.accion_2 ? [{ text: userProfile.accion_2, timestamp: new Date().toISOString() }] : []);
                        if (visiones.length === 0) {
                          return (
                            <p className="text-xs text-charcoal/50 italic py-4 text-center">No has registrado visiones aún. ¡Escribe la primera a la derecha!</p>
                          );
                        }
                        // Sort by date newest first
                        const sorted = [...visiones].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        
                        return sorted.map((v: any, index: number) => {
                          const dateObj = new Date(v.timestamp);
                          const dateStr = isNaN(dateObj.getTime()) ? 'Visión Inicial' : dateObj.toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          });
                          const displayIndex = sorted.length - index;

                          return (
                            <div key={index} className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-5 relative overflow-hidden group">
                              <div className="absolute top-3 right-3 text-[10px] font-mono text-sandbrown font-bold bg-sandbrown/5 border border-sandbrown/10 px-2 py-0.5 rounded-full">
                                # {displayIndex}
                              </div>
                              <div className="text-[10px] text-charcoal/40 font-mono tracking-wider mb-2">
                                📅 {dateStr}
                              </div>
                              <p className="text-xs text-charcoal/85 font-serif leading-relaxed italic pr-8">
                                "{v.text}"
                              </p>
                              <div className="mt-4 pt-3 border-t border-[#ECE8DE]/60 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-charcoal/40 uppercase tracking-widest flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-[#A06A42] rounded-full"></span>
                                  Inseparable de tu Huella
                                </span>
                                <span className="text-[9px] text-charcoal/40 italic font-sans">No editable</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Añadir Nueva Visión al Diario */}
                <div className="w-full lg:w-96 bg-white border border-[#ECE8DE] rounded-3xl p-6 flex flex-col gap-5 shadow-sm shrink-0 animate-in slide-in-from-right duration-500">
                  <div>
                    <h3 className="text-xs font-bold text-[#A06A42] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#ECE8DE] pb-2">
                      ✍️ Nueva Visión de País
                    </h3>
                    <p className="text-[11px] text-charcoal/50 mt-1 leading-snug">
                      Poco a poco conforma tu diario de visiones. Lo que registres abajo se inscribe directamente y no puede ser alterado o censurado por terceros.
                    </p>
                  </div>
                  
                  <textarea
                    value={editProposalText}
                    onChange={(e) => setEditProposalText(e.target.value)}
                    placeholder="Escribe libremente aquí cómo anhelas que sea el Estado..."
                    className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl p-4 text-xs text-charcoal focus:outline-none focus:border-sandbrown focus:ring-1 focus:ring-sandbrown min-h-[180px] font-serif shadow-inner resize-none leading-relaxed"
                  />

                  <div className="text-center text-[10px] italic text-[#A06A42]/75">
                    🚫 Sin filtros de IAsesor. Grabación 100% literal para tu registro íntimo de soberanía.
                  </div>

                  <button
                    onClick={handleAddVision}
                    disabled={editLoading || !editProposalText.trim()}
                    className="stone-btn w-full py-3.5 bg-sandbrown hover:bg-sandbrown-dark text-white text-xs font-extrabold uppercase tracking-widest rounded-xl disabled:opacity-50 transition shadow-md"
                  >
                    {editLoading ? 'Sancionando...' : 'Añadir Visión a mi Diario'}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* =========================================
              VISTA 2: BUSCAR NODOS COLECTIVOS
              ========================================= */}
          {activeTab === 'votaciones' && (
            <ActiveVotings />
          )}
          {activeTab === 'buscar_nodos' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white/95 border border-[#ECE8DE] stone-card p-4 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-serif font-black text-xl text-charcoal flex items-center gap-2">
                      <Search className="w-5 h-5 text-sandbrown" /> Buscador Universal Democrático
                    </h3>
                    <p className="text-xs text-charcoal/50 mt-1">Busca asambleas, sedes físicas, redes de fiscalización, leyes locales y licitaciones del SICOES.</p>
                  </div>
                  
                  {/* Selector de Vista (Mapa vs Lista) */}
                  <div className="flex bg-[#FAF9F5] border border-[#ECE8DE] p-1.5 rounded-2xl shrink-0 self-stretch sm:self-auto justify-center">
                    <button 
                      onClick={() => setIsMapView(true)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${isMapView ? 'bg-sandbrown text-white shadow-sm font-bold' : 'text-charcoal/60 hover:bg-warmgray/35'}`}
                    >
                      🎨 Tapiz de la Red
                    </button>
                    <button 
                      onClick={() => setIsMapView(false)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${!isMapView ? 'bg-sandbrown text-white shadow-sm font-bold' : 'text-charcoal/60 hover:bg-warmgray/35'}`}
                    >
                      📋 Directorio de Nodos
                    </button>
                  </div>
                </div>
                
                {/* Cuadro de Filtro del Buscador */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full font-mono">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                    <input 
                      type="text"
                      placeholder="Buscar por departamento, rubro, ley o licitación pública (ej: La Paz, Autonomista, Ley 341, obras...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl pl-10 pr-4 py-3.5 text-xs text-charcoal focus:outline-none focus:border-sandbrown font-serif"
                    />
                  </div>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 bg-[#FAF9F5] border border-[#ECE8DE] text-[10px] font-bold uppercase tracking-wider text-charcoal/50 rounded-xl hover:text-charcoal transition shrink-0 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {isMapView ? (
                  /* =========================================
                     TEJIDO DEL MAPA INTERACTIVO (TAPICERÍA)
                     ========================================= */
                  <div className="w-full animate-in fade-in duration-300">
                    <EstadoRedMap 
                      userProfile={userProfile} 
                      searchQuery={searchQuery}
                      onNodeClick={(type, value) => {
                        if (type === 'user') {
                          setActiveCollectiveNode(null);
                          setCurrentTab('identidad');
                        } else {
                          setActiveCollectiveNode({ type, value });
                        }
                      }}
                    />
                  </div>
                ) : (
                  /* =========================================
                     DIRETORIO TRADICIONAL EN GRID CARDS & MÓDULO BUSCADOR UNIVERSAL
                     ========================================= */
                  <div className="space-y-6">
                    {searchQuery ? (
                      /* ========== VISTA CON PARÁMETROS DE BÚSQUEDA ACTIVOS (UNIVERSAL) ========== */
                      <div className="space-y-8 animate-in fade-in duration-300">
                        {/* 1. Nodos Colectivos */}
                        {(() => {
                          const nodes = [
                            { name: 'La Paz', type: 'territorios', category: 'Territorio', icon: '📍', desc: 'Asamblea andina de cabildos y autogobierno municipal plurinacional.' },
                            { name: 'Santa Cruz', type: 'territorios', category: 'Territorio', icon: '📍', desc: 'Cabildos democráticos de los llanos orientales y empuje agroproductivo.' },
                            { name: 'Cochabamba', type: 'territorios', category: 'Territorio', icon: '📍', desc: 'Integración de los valles, asambleismo agroecológico e industrias vivas.' },
                            { name: 'Comercio', type: 'ocupaciones', category: 'Ocupación', icon: '💼', desc: 'Gremios comerciantes, ferias populares y promotores de moneda cívica.' },
                            { name: 'Tecnología', type: 'ocupaciones', category: 'Ocupación', icon: '💼', desc: 'Cívicos digitales, programadores y diseñadores de procesos automatizados.' },
                            { name: 'Autonomista', type: 'ideologias', category: 'Ideología', icon: '🌱', desc: 'Partidarios del federalismo fiscal y de la máxima soberanía departamental.' },
                            { name: 'Comunitario', type: 'ideologias', category: 'Ideología', icon: '🌱', desc: 'Decisiones consensuadas en asambleas indígenas, comunas agrarias y ayllus.' }
                          ].filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.desc.toLowerCase().includes(searchQuery.toLowerCase()));

                          if (nodes.length === 0) return null;
                          return (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-[#ECE8DE] pb-1 flex items-center gap-1.5 font-mono">
                                🌐 Nodos Colectivos de Asamblea ({nodes.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {nodes.map((node, index) => (
                                  <div key={index} className="p-4 border border-sandbrown/20 bg-brand-50/5 rounded-xl hover:border-sandbrown transition flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="text-lg">{node.icon}</span>
                                        <span className="text-[8px] bg-sandbrown/15 text-sandbrown-dark font-bold uppercase px-1.5 py-0.5 rounded border border-sandbrown/25">{node.category}</span>
                                      </div>
                                      <h5 className="font-serif font-black text-xs text-charcoal mb-1">{node.name}</h5>
                                      <p className="text-[10px] text-charcoal/60 leading-normal mb-3">{node.desc}</p>
                                    </div>
                                    <button 
                                      onClick={() => setActiveCollectiveNode({ type: node.type === 'territorios' ? 'territorio' : node.type === 'ocupaciones' ? 'ocupacion' : 'ideologia', value: node.name })}
                                      className="stone-btn w-full py-1.5 bg-charcoal hover:bg-charcoal/95 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg"
                                    >
                                      Ingresar a Asamblea
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 2. Nodos Físicos */}
                        {(() => {
                          const nodes = [
                            { name: 'Sede Social de la Junta Vecinal - Sopocachi', address: 'Calle Sopocachi Central, La Paz', desc: 'Asambleas vecinales barriales y escrutinio presencial autónomo.', type: 'Territorial' },
                            { name: 'Sindicato Gremial y Productivo Mercancías Rodríguez', address: 'Avenida Heroínas de la Autonomía Nº 341, La Paz', desc: 'Espacio de regulaciones comunitarias y deliberación gremial.', type: 'Ocupacional' },
                            { name: 'Casal Autogestionario y Ateneo de Ideas Sopocachi', address: 'Pasaje de la Deliberación Libre, La Paz', desc: 'Charlas doctrinarias y conferencias de formación de la tríada.', type: 'Ideológico' }
                          ].filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.desc.toLowerCase().includes(searchQuery.toLowerCase()) || n.address.toLowerCase().includes(searchQuery.toLowerCase()));

                          if (nodes.length === 0) return null;
                          return (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-[#ECE8DE] pb-1 flex items-center gap-1.5 font-mono">
                                📍 Sedes y Nodos Físicos Coincidentes ({nodes.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {nodes.map((node, index) => (
                                  <div key={index} className="p-4 border border-[#ECE8DE] bg-[#FAF9F5] rounded-xl hover:border-sandbrown/40 transition flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-center mb-1 bg-white p-1 rounded-lg border border-[#ECE8DE]">
                                        <span className="text-[9px] font-bold text-charcoal font-sans">Sede Física {node.type}</span>
                                        <span className="text-[8px] bg-palmgreen/10 text-palmgreen-dark font-bold uppercase px-1.5 rounded">activo</span>
                                      </div>
                                      <h5 className="font-serif font-black text-xs text-charcoal mt-1.5 mb-1">{node.name}</h5>
                                      <p className="text-[10px] text-charcoal/60 leading-normal mb-2">{node.desc}</p>
                                      <p className="text-[9px] text-[#A06A42] font-semibold">📍 {node.address}</p>
                                    </div>
                                    <button 
                                      onClick={() => setCurrentTab('nodos_fisicos')}
                                      className="stone-btn w-full mt-4 py-1.5 bg-[#A06A42] hover:bg-[#A06A42]/95 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg"
                                    >
                                      Ir a Nodos Físicos
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. Redes Territoriales */}
                        {(() => {
                          const networks = [
                            { name: 'Red Departamental de La Paz', scope: 'Departamental', desc: 'Coordinadora plurinacional andina de juntas vecinales, cabildos y fiscalización.' },
                            { name: 'Sinergia Municipal El Alto', scope: 'Municipal', desc: 'Red descentralizada de comisiones vecinales de presupuesto y desayuno escolar.' }
                          ].filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.desc.toLowerCase().includes(searchQuery.toLowerCase()));

                          if (networks.length === 0) return null;
                          return (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-[#ECE8DE] pb-1 flex items-center gap-1.5 font-mono">
                                🤝 Redes Territoriales Coincidentes ({networks.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {networks.map((net, index) => (
                                  <div key={index} className="p-4 border border-[#ECE8DE] bg-[#FAF9F5] rounded-xl hover:border-sandbrown/40 transition flex flex-col justify-between">
                                    <div>
                                      <span className="text-[8px] bg-blue-500/10 text-blue-700 font-bold uppercase px-1.5 py-0.5 rounded mb-1 inline-block">{net.scope}</span>
                                      <h5 className="font-serif font-black text-xs text-charcoal mb-1">{net.name}</h5>
                                      <p className="text-[10px] text-charcoal/60 leading-normal mb-2">{net.desc}</p>
                                    </div>
                                    <button 
                                      onClick={() => setCurrentTab('delegacion')}
                                      className="stone-btn w-full mt-3 py-1.5 bg-charcoal hover:bg-charcoal/95 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg"
                                    >
                                      Ir a Redes Territoriales
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 4. Marco Legal */}
                        {(() => {
                          const laws = [
                            { id: '1', titulo: 'Ley 341 - Participación y Control Social', tipo: 'Ley Nacional', desc: 'Establece las directrices constitucionales y de coparticipación para el control de fondos públicos.' },
                            { id: '2', titulo: 'Ley 031 - Ley Marco de Autonomías', tipo: 'Ley Nacional', desc: 'Regula el funcionamiento autonómico local y departamental para descentralización de recursos.' }
                          ].filter(l => l.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || l.desc.toLowerCase().includes(searchQuery.toLowerCase()));

                          if (laws.length === 0) return null;
                          return (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-[#ECE8DE] pb-1 flex items-center gap-1.5 font-mono">
                                📋 Marco Legal y Normativa Coincidente ({laws.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {laws.map((law, index) => (
                                  <div key={index} className="p-4 border border-[#ECE8DE] bg-[#FAF9F5] rounded-xl hover:border-sandbrown/40 transition flex flex-col justify-between">
                                    <div>
                                      <span className="text-[8px] bg-amber-500/10 text-amber-800 font-extrabold uppercase px-1.5 py-0.5 rounded mb-1 inline-block font-mono">{law.tipo}</span>
                                      <h5 className="font-bold text-xs text-charcoal mb-1">{law.titulo}</h5>
                                      <p className="text-[10.5px] text-charcoal/65 leading-normal mb-2 font-serif">{law.desc}</p>
                                    </div>
                                    <button 
                                      onClick={() => setCurrentTab('fiscalizacion')}
                                      className="stone-btn w-full mt-3 py-1.5 bg-white border border-[#ECE8DE] text-charcoal hover:bg-neutral-50 font-bold text-[9px] uppercase tracking-wider rounded-lg"
                                    >
                                      Ir a Leyes de Control Social
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 5. Contratos SICOES */}
                        {(() => {
                          const contracts = [
                            { title: 'Construcción Unidad Educativa Pedro Domingo Murillo - El Alto', budget: 'Bs. 4,210,000', status: 'Adjudicado', id: 'sico_1' },
                            { title: 'Pavimentación Rígida y Aceras Inclusivas en Villa Fátima', budget: 'Bs. 1,450,000', status: 'Observado', id: 'sico_2' }
                          ].filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.budget.toLowerCase().includes(searchQuery.toLowerCase()));

                          if (contracts.length === 0) return null;
                          return (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-charcoal/40 border-b border-[#ECE8DE] pb-1 flex items-center gap-1.5 font-mono">
                                📊 Licitaciones y Contratos Públicos Coincidentes ({contracts.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {contracts.map((c, index) => (
                                  <div key={index} className="p-4 border border-[#ECE8DE] bg-[#FAF9F5] rounded-xl hover:border-sandbrown/40 transition flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] text-[#A06A42] font-mono font-bold">{c.budget}</span>
                                        <span className={`text-[8px] font-bold uppercase px-1.5 rounded ${c.status === 'Adjudicado' ? 'bg-palmgreen/10 text-palmgreen-dark' : 'bg-red-500/10 text-red-700'}`}>{c.status}</span>
                                      </div>
                                      <h5 className="font-bold text-xs text-charcoal mb-1.5 mt-1">{c.title}</h5>
                                    </div>
                                    <button 
                                      onClick={() => setCurrentTab('fiscalizacion')}
                                      className="stone-btn w-full mt-3 py-1.5 bg-neutral-100 border border-[#ECE8DE] text-charcoal hover:bg-neutral-200 font-bold text-[9px] uppercase tracking-wider rounded-lg"
                                    >
                                      Ir a Tablero SICOES
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* ========== VISTA DEFAULT DIRECTO CARDS (SIN BÚSQUEDA) ========== */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 animate-in fade-in duration-300">
                        {[
                          // Territorios
                          { name: 'La Paz', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'Asamblea andina de cabildos y autogobierno municipal plurinacional.', sedeFisica: 'Sede Central Sopocachi - Av. 20 de Octubre' },
                          { name: 'Santa Cruz', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'Cabildos democráticos de los llanos orientales y empuje agroproductivo.', sedeFisica: 'Casal de Cabildos Barrio Equipetrol' },
                          { name: 'Cochabamba', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'Integración de los valles, asambleismo agroecológico e industrias vivas.', sedeFisica: 'Sede de los Valles - Av. Blanco Galindo' },
                          { name: 'Oruro', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'Soberanía del altiplano, tradición metalúrgica y descentralización minera.', sedeFisica: 'Sede Social Minera - Zona Central' },
                          { name: 'Potosí', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'Nodo andino histórico, defensa soberana de recursos naturales y litio.', sedeFisica: 'Comité Civico Potosinista (COMCIPO)' },
                          { name: 'Tarija', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'Asamblea e industrialización del sur, autonomías de chaco y valles.', sedeFisica: 'Sede Autonómica Andaluz - Av. de las Américas' },
                          { name: 'Chuquisaca', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'La cuna de la ley y el derecho, asambleas de debate constitucional.', sedeFisica: 'Ateneo Constitucional la Plata' },
                          { name: 'Beni', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'Gobernanza de la cuenca amazónica, ganadería comunitaria y territorio libre.', sedeFisica: 'Casal Ganadero Comunitario Trinidad' },
                          { name: 'Pando', type: 'territorio' as const, category: 'Territorio', icon: '📍', desc: 'Desarrollo forestal de las tierras bajas, castaña y soberanía fronteriza.', sedeFisica: 'Sede de Trabajadores de la Castaña, Cobija' },
                          // Ocupaciones
                          { name: 'Cívico', type: 'ocupacion' as const, category: 'Ocupación', icon: '💼', desc: 'Coordinadores vecinales, juntas de control social y asambleísmo urbano.', sedeFisica: 'Sede Central FEJUVE El Alto - Av. 6 de Marzo' },
                          { name: 'Tecnología', type: 'ocupacion' as const, category: 'Ocupación', icon: '💼', desc: 'Cívicos digitales, programadores y diseñadores de procesos automatizados.', sedeFisica: 'Hub Tecnológico Bolivia - Achumani, La Paz' },
                          { name: 'Educación', type: 'ocupacion' as const, category: 'Ocupación', icon: '💼', desc: 'Profesores de escuela y universitarios sembrando doctrina de autonomía.', sedeFisica: 'Federación de Maestros - Pasaje Sempértegui' },
                          { name: 'Salud', type: 'ocupacion' as const, category: 'Ocupación', icon: '💼', desc: 'Médicos rurales, herbolarios y gestores de salud intercultural.', sedeFisica: 'Colegio Médico Intercultural' },
                          { name: 'Agrario', type: 'ocupacion' as const, category: 'Ocupación', icon: '💼', desc: 'Trabajadores de la tierra, cooperativas agropecuarias y soberanía alimentaria.', sedeFisica: 'Sindicato Agrario San Benito' },
                          { name: 'Comercio', type: 'ocupacion' as const, category: 'Ocupación', icon: '💼', desc: 'Gremios comerciantes, ferias populares y promotores de moneda cívica.', sedeFisica: 'Mercado Central Rodríguez / Asociación Gremial' },
                          // Ideologías
                          { name: 'Pragmático', type: 'ideologia' as const, category: 'Ideología', icon: '🌱', desc: 'Propuestas directas, orientadas a la eficiencia administrativa local.', sedeFisica: 'Ateneo Cívico de Decisiones Prácticas - Achocalla' },
                          { name: 'Autonomista', type: 'ideologia' as const, category: 'Ideología', icon: '🌱', desc: 'Partidarios del federalismo fiscal y de la máxima soberanía departamental.', sedeFisica: 'Plaza Principal de la Descentralización, Santa Cruz' },
                          { name: 'Comunitario', type: 'ideologia' as const, category: 'Ideología', icon: '🌱', desc: 'Decisiones consensuadas en asambleas indígenas, comunas agrarias y ayllus.', sedeFisica: 'Asamblea del Ayllu Mayor Jacha Carangas' },
                          { name: 'Descentralista', type: 'ideologia' as const, category: 'Ideología', icon: '🌱', desc: 'Enfoque en descentralizar el poder y transferir recursos del eje central.', sedeFisica: 'Casal del Debate Federal - Sopocachi' }
                        ].map((node, index) => {
                          const borderClass = node.category === 'Territorio' 
                            ? 'border-skyblue/30 hover:border-skyblue bg-skyblue/[0.01]' 
                            : node.category === 'Ocupación' 
                              ? 'border-sandbrown/30 hover:border-sandbrown bg-sandbrown/[0.01]' 
                              : 'border-palmgreen/30 hover:border-palmgreen bg-palmgreen/[0.01]';
                              
                          const textBadgeClass = node.category === 'Territorio' 
                            ? 'bg-skyblue/10 text-skyblue-dark border-skyblue/25' 
                            : node.category === 'Ocupación' 
                              ? 'bg-sandbrown/15 text-sandbrown-dark border-sandbrown/25' 
                              : 'bg-palmgreen/10 text-palmgreen-dark border-palmgreen/25';

                          return (
                            <div 
                              key={index} 
                              className={`border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 group ${borderClass}`}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <span className="text-xl font-sans">{node.icon}</span>
                                  <span className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${textBadgeClass}`}>
                                    {node.category}
                                  </span>
                                </div>
                                <h4 className="font-serif font-black text-charcoal text-[13px] leading-tight mb-2 group-hover:text-[#A06A42] transition-colors">{node.name}</h4>
                                <p className="text-[10px] text-charcoal/60 leading-relaxed mb-3 min-h-[44px]">{node.desc}</p>
                                
                                <div className="mt-3 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-2 text-[9.5px] text-charcoal/70 flex flex-col gap-0.5 font-mono">
                                  <span className="text-[7.5px] font-bold uppercase tracking-widest text-[#A06A42] flex items-center gap-1">📍 Sede Física Activa</span>
                                  <span className="truncate font-sans leading-relaxed text-charcoal font-semibold">{node.sedeFisica}</span>
                                </div>
                              </div>

                              <button 
                                onClick={() => setActiveCollectiveNode({ type: node.type, value: node.name })}
                                className="stone-btn mt-4 w-full py-2 bg-charcoal hover:bg-charcoal/80 text-white font-bold uppercase tracking-wider text-[9px] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <span>Visitar Asamblea del Nodo</span>
                                <ChevronRight className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================
              VISTA DE MIS INSIGNIAS
              ========================================= */}
          {activeTab === 'insignias' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <section id="civic-badges-section" className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] flex flex-col gap-5">
                <div>
                  <h3 className="text-lg font-serif font-black text-charcoal flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-500" /> Logros e Insignias de Soberanía
                  </h3>
                  <p className="text-xs text-charcoal/50 mt-1">Efectúa acciones cívicas en la plataforma para desbloquear hitos existenciales de tu representación.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-1">
                  {insignias.map((insg) => (
                    <div 
                      key={insg.id}
                      className={`p-4 border rounded-2xl flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 ${insg.unlocked ? 'border-[#ECE8DE] bg-white shadow-sm' : 'border-[#ECE8DE]/40 bg-[#FAF9F5]/40 opacity-50'}`}
                    >
                      {insg.unlocked && (
                        <div className="absolute -inset-10 bg-gradient-to-tr from-transparent via-white/5 to-transparent group-hover:translate-x-40 transition-transform duration-1000"></div>
                      )}
                      
                      <div className="flex flex-col items-center">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-3 border relative ${insg.unlocked ? `bg-[#FAF9F5] border-${insg.id === 'soberano_iniciado' ? 'yellow-300' : insg.id === 'lider_iniciativa' ? 'purple-300' : 'blue-300'} shadow-sm` : 'bg-warmgray border-warmgray-dark/20 text-charcoal/30'}`}>
                          {insg.unlocked ? (
                            insg.emoji
                          ) : (
                            <Lock className="w-5 h-5 text-charcoal/30 animate-pulse" />
                          )}
                        </div>
                        
                        <h4 className={`text-xs font-serif font-black ${insg.unlocked ? 'text-charcoal' : 'text-charcoal/40'}`}>{insg.name}</h4>
                        <p className="text-[9px] text-charcoal/50 leading-relaxed mt-1">{insg.desc}</p>
                      </div>
                      
                      <div className="mt-4 w-full">
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded-lg border tracking-wide uppercase ${insg.unlocked ? 'text-palmgreen border-palmgreen/20 bg-palmgreen/5 font-bold' : 'text-charcoal/40 border-charcoal/10 bg-warmgray/50 font-normal'}`}>
                          {insg.unlocked ? 'Desbloqueado' : insg.requirement}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* =========================================
              VISTA DE MIS INICIATIVAS
              ========================================= */}
          {activeTab === 'iniciativas' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <section id="historical-proposals-section" className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] flex flex-col">
                <div className="mb-6 border-b border-[#ECE8DE] pb-4">
                  <h3 className="text-lg font-bold text-charcoal font-serif tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-palmgreen" /> Tus Iniciativas y Propuestas Realizadas
                  </h3>
                  <p className="text-xs text-charcoal/50 mt-1">Sigue el curso democrático de tus propuestas de ley, visiones locales, o denuncias de Control Social vinculadas a tu identidad.</p>
                </div>
                <div className="w-full">
                  <MyProposals />
                </div>
              </section>
            </div>
          )}

          {/* =========================================
              VISTA DE NODOS FÍSICOS ($N_f$)
              ========================================= */}
          {activeTab === 'nodos_fisicos' && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/95 border border-[#ECE8DE] stone-card shadow-sm animate-in fade-in zoom-in-95 duration-300 min-h-[300px]">
              <h2 className="text-xl font-serif font-black text-charcoal mb-2">Gracias por conectarte al EstadoRed.</h2>
              <p className="text-sm text-charcoal/60 tracking-wider">Pronto contaremos con más contenido.</p>
            </div>
          )}

          {/* =========================================
              VISTA DE REDES TERRITORIALES
              ========================================= */}
          {activeTab === 'delegacion' && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/95 border border-[#ECE8DE] stone-card shadow-sm animate-in fade-in zoom-in-95 duration-300 min-h-[300px]">
              <h2 className="text-xl font-serif font-black text-charcoal mb-2">Gracias por conectarte al EstadoRed.</h2>
              <p className="text-sm text-charcoal/60 tracking-wider">Pronto contaremos con más contenido.</p>
            </div>
          )}

          {/* =========================================
              VISTA DE CONTROL SOCIAL
              ========================================= */}
          {activeTab === 'fiscalizacion' && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/95 border border-[#ECE8DE] stone-card shadow-sm animate-in fade-in zoom-in-95 duration-300 min-h-[300px]">
              <h2 className="text-xl font-serif font-black text-charcoal mb-2">Gracias por conectarte al EstadoRed.</h2>
              <p className="text-sm text-charcoal/60 tracking-wider">Pronto contaremos con más contenido.</p>
            </div>
          )}

          {/* =========================================
              VISTA DE GOBERNANZA, ONTOLOGÍA Y SIMULACIÓN
              ========================================= */}
          {activeTab === 'estructura_sistema' && (
            <EstructuraSistema userProfile={userProfile} />
          )}

          {/* =========================================
              VISTA 3: CURSOS (Academia de Autonomía)
              ========================================= */}
          {activeTab === 'cursos' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)]">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h3 className="font-serif font-black text-xl text-charcoal mb-1 flex items-center justify-center gap-2">
                    <BookOpen className="w-5 h-5 text-sandbrown" /> Academia de Autonomía Cívica
                  </h3>
                  <p className="text-xs text-charcoal/50">Módulos lúdicos e interactivos de capacitación en materia de descentralización soberana en Bolivia. ¡Responde los desafíos y gana XP reales!</p>
                </div>

                <div className="space-y-8 max-w-3xl mx-auto">
                  {(() => {
                    const defaultCourses: any[] = [];

                    const combined = [...dbCourses];

                    if (combined.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-300">
                          <h2 className="text-xl font-serif font-black text-charcoal mb-2 mt-4">Gracias por conectarte al EstadoRed.</h2>
                          <p className="text-sm text-charcoal/60 tracking-wider">Pronto contaremos con más contenido.</p>
                        </div>
                      );
                    }

                    return combined.map((course) => {
                    const isCompleted = completedQuizzes[course.id];
                    const selectedAns = quizAnswers[course.id] || '';
                    const feedback = quizFeedback[course.id];

                    const handleQuizSubmit = async () => {
                      if (!auth.currentUser) return;
                      if (!selectedAns) return;

                      const isAnswerCorrect = selectedAns === course.correct;
                      
                      if (isAnswerCorrect) {
                        setCompletedQuizzes(prev => ({ ...prev, [course.id]: true }));
                        setQuizFeedback(prev => ({ 
                          ...prev, 
                          [course.id]: { success: true, text: course.successMsg } 
                        }));

                        // Award XP points to user profile in Firebase in REALTIME
                        try {
                          const xpReward = course.id === 'course_4' ? 60 : 30; // Final module gives 60, rest 30
                          const currentStats = userProfile?.stats || { xp: 0, ip: 0 };
                          const currentGamification = userProfile?.gamification || { xp_total: 0, ip_total: 0 };
                          
                          const oldXP = typeof currentGamification.xp_total === 'number' ? currentGamification.xp_total : (currentStats.xp || 0);
                          const newXP = oldXP + xpReward;
                          
                          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                            'stats.xp': newXP,
                            'gamification.xp_total': newXP
                          });
                        } catch (err) {
                          console.error("Error updating stats via interactive quiz:", err);
                        }
                      } else {
                        setQuizFeedback(prev => ({ 
                          ...prev, 
                          [course.id]: { success: false, text: 'Respuesta incorrecta. Estudia detenidamente la materia y vuélvelo a intentar Soberano.' } 
                        }));
                      }
                    };

                    return (
                      <div 
                        key={course.id} 
                        className={`bg-white border rounded-3xl p-6 shadow-sm overflow-hidden relative transition-all duration-300 ${isCompleted ? 'border-palmgreen/30 bg-palmgreen/[0.01]' : 'border-[#ECE8DE] hover:border-sandbrown/40'}`}
                      >
                        {isCompleted && (
                          <div className="absolute top-0 right-0 bg-palmgreen text-white px-4 py-1 rounded-bl-2xl text-[9.5px] font-bold uppercase tracking-widest flex items-center gap-1.5 flex-row">
                            <CheckCircle className="w-3.5 h-3.5" /> Completado +25 XP
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-3">
                          <span className="text-[9px] font-black text-sandbrown uppercase tracking-wider w-fit bg-[#FAF9F5] border border-[#ECE8DE] px-2.5 py-1 rounded-lg">
                            {course.badge}
                          </span>
                          
                          <h4 className="font-serif font-black text-charcoal text-base leading-tight">{course.title}</h4>
                          <p className="text-[11.5px] text-charcoal/60 leading-relaxed">{course.desc}</p>
                          
                          {/* Teoría */}
                          <div className="bg-[#FAF9F5] border border-[#ECE8DE]/60 rounded-2xl p-4 my-2 text-[11px] text-charcoal/80 leading-relaxed font-sans shadow-inner shrink-0 italic border-l-4 border-l-sandbrown">
                            {course.content}
                          </div>

                          {/* Cuestionario */}
                          {!isCompleted ? (
                            <div className="space-y-3.5 mt-2">
                              <p className="text-xs font-serif font-bold text-charcoal flex gap-1.5 items-center">
                                <span className="p-1 bg-sandbrown text-white text-[10px] rounded-md font-mono w-5 h-5 flex items-center justify-center font-bold">Q</span>
                                {course.question}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {course.options.map((opt, oIndex) => (
                                  <label 
                                    key={oIndex} 
                                    className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer text-[10.5px] font-sans transition-all hover:bg-warmgray/20 ${selectedAns === opt ? 'border-sandbrown bg-sandbrown/5 font-bold' : 'border-[#ECE8DE]'}`}
                                  >
                                    <input 
                                      type="radio" 
                                      name={course.id} 
                                      value={opt} 
                                      checked={selectedAns === opt}
                                      onChange={() => setQuizAnswers(prev => ({ ...prev, [course.id]: opt }))}
                                      className="sr-only"
                                    />
                                    <span className={`w-4 h-4 rounded-full border border-[#ECE8DE] flex items-center justify-center shrink-0 ${selectedAns === opt ? 'bg-sandbrown border-transparent' : ''}`}>
                                      {selectedAns === opt && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                                    </span>
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>

                              <div className="flex justify-between items-center pt-2">
                                {feedback && !feedback.success && (
                                  <span className="text-[10px] font-bold text-red-500">{feedback.text}</span>
                                )}
                                <span className="hidden md:inline"></span>
                                <button 
                                  onClick={handleQuizSubmit}
                                  disabled={!selectedAns}
                                  className="stone-btn px-6 py-2 bg-palmgreen hover:bg-palmgreen-dark text-white uppercase font-black tracking-wider text-[10px] cursor-pointer shadow-sm ml-auto"
                                >
                                  Validar Desafío
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-palmgreen/5 border border-palmgreen/25 p-4 rounded-2xl flex flex-col gap-1.5 text-palmgreen-dark text-xs font-sans mt-2 animate-in slide-in-from-bottom-2">
                              <p className="font-extrabold flex items-center gap-1.5">
                                <span className="text-sm">🎉</span> ¡Desafío Resuelto Exitosamente!
                              </p>
                              <p className="opacity-90">{feedback?.text}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'biblioteca' && (
            <BibliotecaDigital userProfile={userProfile} />
          )}

          {/* =========================================
              VISTA 4: CONFIGURACIONES (Panel de Perfil Sincrónico)
              ========================================= */}
          {activeTab === 'admin' && (
            <AdminView />
          )}

          {activeTab === 'denuncias' && (
            <CitizenComplaints userProfile={userProfile} />
          )}

          {activeTab === 'configuraciones' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)] max-w-2xl mx-auto flex flex-col gap-6">
                <div>
                  <h3 className="font-serif font-black text-xl text-charcoal flex items-center gap-2">
                    <Settings className="w-5 h-5 text-sandbrown" /> Configuración del Soberano
                  </h3>
                  <p className="text-xs text-charcoal/50 mt-1">Personaliza tu identidad sincrónica. Cualquier cambio se reflejará dinámicamente en todo el sistema.</p>
                </div>

                <div className="space-y-6 pt-2">
                  {/* Alias */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-charcoal uppercase tracking-wider">Tu Nombre / Alias Político</label>
                    <input 
                      type="text" 
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      placeholder="Soberano..."
                      className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl px-4 py-3 text-xs text-charcoal font-bold focus:outline-none focus:border-sandbrown"
                    />
                    <span className="text-[9.5px] text-charcoal/40 italic">Cualquier sufijo ".nodo" se omitirá automáticamente al guardar para honrar la soberanía limpia.</span>
                  </div>

                  {/* Telegram */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-charcoal uppercase tracking-wider">Usuario de Telegram (Coordinación)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 font-bold text-xs select-none">@</span>
                      <input 
                        type="text" 
                        value={telegramInput}
                        onChange={(e) => setTelegramInput(e.target.value)}
                        placeholder="tu_usuario_telegram"
                        className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-2xl pl-8 pr-4 py-3 text-xs text-charcoal focus:outline-none focus:border-sandbrown"
                      />
                    </div>
                    <span className="text-[9.5px] text-charcoal/40 italic">Utilizado para las salas de asamblea y coordinación directa inter-nodos.</span>
                  </div>

                  {/* Animal Totémico */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-extrabold text-charcoal uppercase tracking-wider">Tótem Cívico Boliviano (Avatar)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      {AVATARES.map((av) => (
                        <div 
                          key={av.emoji}
                          onClick={() => setSelectedAvatar(av.emoji)}
                          className={`p-3 border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${selectedAvatar === av.emoji ? 'border-sandbrown bg-sandbrown/5 shadow-inner' : 'border-[#ECE8DE] bg-[#FAF9F5]/40 hover:bg-warmgray/20'}`}
                        >
                          <span className="text-3xl mb-1.5">{av.emoji}</span>
                          <span className="font-serif font-black text-charcoal text-[11px] leading-tight text-center">{av.tipo}</span>
                          <span className="text-[8.5px] text-charcoal/50 text-center leading-normal mt-0.5">{av.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ciudadanía Digital (AGETIC) */}
                  <div className="flex flex-col gap-3 mt-6 p-5 bg-warmgray/10 border border-warmgray-dark/30 rounded-2xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-2">
                          <Shield className="w-4 h-4 text-brand-500" /> Ciudadanía Digital (AGETIC) <span className="text-[9px] bg-brand-500/10 text-brand-600 px-2 py-0.5 rounded-full ml-1 font-bold">PROMO</span>
                        </h4>
                        <p className="text-[10px] text-charcoal/60 mt-1.5 leading-relaxed">
                          La vinculación es <strong className="text-charcoal/80">Opcional</strong>. No requieres Ciudadanía Digital para participar en esta fase. Vincularla te brindará la insignia de "Nodo Verificado" en el futuro para votaciones restrictivas.
                        </p>
                      </div>
                    </div>
                    <button className="stone-btn w-full sm:w-auto px-5 py-3 bg-white text-charcoal border border-warmgray-dark hover:border-brand-500 hover:text-brand-600 text-xs font-bold uppercase tracking-wider transition rounded-xl mt-2 text-center">
                      Vincular Ciudadanía Digital
                    </button>
                  </div>

                  {/* Asistente de Dominio Propio */}
                  {isAdmin && (
                    <div className="flex flex-col gap-4 mt-6 p-5 bg-white border border-[#ECE8DE] rounded-2xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-skyblue/10 text-skyblue-dark rounded-xl">
                          <Globe className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-charcoal uppercase tracking-wider flex items-center gap-2">
                            Asistente Dominio Custom & DNS (estadored.com)
                          </h4>
                          <p className="text-[11px] text-charcoal/60 mt-1 leading-relaxed">
                            Sigue esta guía paso a paso para apuntar tu dominio <strong className="text-charcoal/80">estadored.com</strong> comprado en Namecheap a tu servidor del EstadoRed.
                          </p>
                        </div>
                      </div>

                      {/* Selector de Método */}
                      <div className="grid grid-cols-2 gap-3 mt-2 bg-[#FAF9F5] p-1.5 rounded-xl border border-[#ECE8DE]/60">
                        <button
                          onClick={() => setDomainMethod('cloudrun')}
                          className={`py-2 px-3 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all cursor-pointer ${domainMethod === 'cloudrun' ? 'bg-white text-skyblue-dark shadow-sm' : 'text-charcoal/50 hover:text-charcoal'}`}
                        >
                          Método A: Cloud Run Directo
                        </button>
                        <button
                          onClick={() => setDomainMethod('firebase')}
                          className={`py-2 px-3 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all cursor-pointer ${domainMethod === 'firebase' ? 'bg-white text-skyblue-dark shadow-sm' : 'text-charcoal/50 hover:text-charcoal'}`}
                        >
                          Método B: Firebase Hosting
                        </button>
                      </div>

                      {/* Paso a paso interactivo */}
                      <div className="space-y-4 pt-2">
                        <div className="text-[11px] text-charcoal space-y-3">
                          <p className="font-semibold text-charcoal/80">
                            {domainMethod === 'cloudrun' 
                              ? "El método oficial directo a través de la Google Cloud Console para Cloud Run (sin costo base y auto-administrado)."
                              : "Usa Firebase Hosting para enrutar el tráfico CDN global hacia el backend de Cloud Run de forma automatizada y con máxima resiliencia."
                            }
                          </p>

                          {/* PASO 1 */}
                          <div className="flex gap-3 items-start border-l-2 border-skyblue/40 pl-3">
                            <span className="w-4 h-4 bg-skyblue/10 border border-skyblue/30 text-skyblue-dark rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">1</span>
                            <div>
                              <p className="font-bold text-xs uppercase tracking-wide">Paso 1: Configurar en Google Cloud</p>
                              <p className="text-[10px] text-charcoal/50 mt-0.5">
                                {domainMethod === 'cloudrun' ? (
                                  <>
                                    Inicia sesión en la <strong>Google Cloud Console</strong>, navega a <strong>Cloud Run</strong>, selecciona tu servicio, y haz clic en <strong>"Administrar dominios personalizados" → "Agregar asignación"</strong>. Registra tu dominio <code>estadored.com</code>.
                                  </>
                                ) : (
                                  <>
                                    Inicia sesión en la <strong>Firebase Console</strong>, ve al menú izquierdo <strong>Build (Construir) → Hosting</strong>, y haz clic en <strong>"Agregar dominio personalizado"</strong>. Escribe <code>estadored.com</code>.
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* PASO 2 */}
                          <div className="flex gap-3 items-start border-l-2 border-skyblue/40 pl-3">
                            <span className="w-4 h-4 bg-skyblue/10 border border-skyblue/30 text-skyblue-dark rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">2</span>
                            <div>
                              <p className="font-bold text-xs uppercase tracking-wide">Paso 2: Obtener Registros DNS de Google</p>
                              <p className="text-[10px] text-charcoal/50 mt-0.5">
                                Google te dará un bloque de registros de tipo <strong>"A"</strong> y un tipo <strong>"CNAME"</strong>. Cópialos textualmente. A continuación se detallan los valores estándares aplicados para Namecheap:
                              </p>
                            </div>
                          </div>

                          {/* TABLA DE REGISTROS DNS MOCK/GUÍA */}
                          <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-3 overflow-hidden mt-2 font-mono text-[9px]">
                            <div className="grid grid-cols-4 gap-1 border-b border-[#ECE8DE] pb-2 text-charcoal/50 uppercase tracking-wider font-extrabold text-[8px] mb-2">
                              <span>Tipo</span>
                              <span>Host</span>
                              <span>Valor / Ip Destino</span>
                              <span className="text-right">Acción</span>
                            </div>
                            
                            {/* Fila A 1 */}
                            <div className="grid grid-cols-4 gap-1 items-center py-1.5 border-b border-[#ECE8DE]/50 font-mono">
                              <span className="text-sandbrown font-bold">A</span>
                              <span className="text-charcoal">@</span>
                              <span className="text-charcoal/80 truncate">
                                {domainMethod === 'cloudrun' ? '216.239.32.21' : '199.36.158.100'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(domainMethod === 'cloudrun' ? '216.239.32.21' : '199.36.158.100');
                                  setCopiedKey('a1');
                                  setTimeout(() => setCopiedKey(null), 2000);
                                }}
                                className="text-[8px] text-right text-skyblue-dark hover:underline font-bold select-none cursor-pointer flex items-center justify-end gap-1"
                              >
                                {copiedKey === 'a1' ? '¡Hecho!' : <span className="flex items-center gap-0.5"><Copy className="w-2.5 h-2.5" /> Copiar</span>}
                              </button>
                            </div>

                            {/* Fila A 2 */}
                            <div className="grid grid-cols-4 gap-1 items-center py-1.5 border-b border-[#ECE8DE]/50 font-mono">
                              <span className="text-sandbrown font-bold">A</span>
                              <span className="text-charcoal">@</span>
                              <span className="text-charcoal/80 truncate">
                                {domainMethod === 'cloudrun' ? '216.239.34.21' : '199.36.158.100'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(domainMethod === 'cloudrun' ? '216.239.34.21' : '199.36.158.100');
                                  setCopiedKey('a2');
                                  setTimeout(() => setCopiedKey(null), 2000);
                                }}
                                className="text-[8px] text-right text-skyblue-dark hover:underline font-bold select-none cursor-pointer flex items-center justify-end gap-1"
                              >
                                {copiedKey === 'a2' ? '¡Hecho!' : <span className="flex items-center gap-0.5"><Copy className="w-2.5 h-2.5" /> Copiar</span>}
                              </button>
                            </div>

                            {/* Fila CNAME */}
                            <div className="grid grid-cols-4 gap-1 items-center py-1.5 font-mono">
                              <span className="text-palmgreen font-bold">CNAME</span>
                              <span className="text-charcoal">www</span>
                              <span className="text-charcoal/80 truncate">
                                {domainMethod === 'cloudrun' ? 'ghs.googlehosted.com.' : 'gen-lang-client-0042316931.web.app.'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(domainMethod === 'cloudrun' ? 'ghs.googlehosted.com.' : 'gen-lang-client-0042316931.web.app.');
                                  setCopiedKey('cname');
                                  setTimeout(() => setCopiedKey(null), 2000);
                                }}
                                className="text-[8px] text-right text-skyblue-dark hover:underline font-bold select-none cursor-pointer flex items-center justify-end gap-1"
                              >
                                {copiedKey === 'cname' ? '¡Hecho!' : <span className="flex items-center gap-0.5"><Copy className="w-2.5 h-2.5" /> Copiar</span>}
                              </button>
                            </div>
                          </div>

                          {/* PASO 3 */}
                          <div className="flex gap-3 items-start border-l-2 border-skyblue/40 pl-3">
                            <span className="w-4 h-4 bg-skyblue/10 border border-skyblue/30 text-skyblue-dark rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">3</span>
                            <div>
                              <p className="font-bold text-xs uppercase tracking-wide">Paso 3: Cargar en Namecheap Advanced DNS</p>
                              <p className="text-[10px] text-charcoal/50 mt-0.5 leading-relaxed">
                                Inicia sesión en <strong>Namecheap</strong>. Ve a tu <strong>"Dashboard" → Lista de dominios (Domain List) → estadored.com → "Manage" (Gestionar)</strong>. Selecciona la pestaña <strong>"Advanced DNS" (DNS Avanzado)</strong>.
                                <br />
                                En la sección <strong>"Host Records"</strong> elimina registros por defecto y añade tus nuevos registros <code>A</code> y <code>CNAME</code> detallados en la tabla de arriba. Haz clic en el tic verde de Namecheap para guardar cada uno.
                              </p>
                            </div>
                          </div>

                          {/* PASO 4 */}
                          <div className="flex gap-3 items-start border-l-2 border-skyblue/40 pl-3">
                            <span className="w-4 h-4 bg-skyblue/10 border border-skyblue/30 text-skyblue-dark rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">4</span>
                            <div>
                              <p className="font-bold text-xs uppercase tracking-wide">Paso 4: Esperar Propagación & SSL</p>
                              <p className="text-[10px] text-charcoal/50 mt-0.5">
                                Namecheap propagará los registros en un lapso de 5 min a 2 horas. Luego de detectarlos, Google Cloud/Firebase del EstadoRed aprovisionará tu certificado HTTPS / SSL gratuito de por vida de forma automática. ¡Tu dominio estará en vivo y seguro!
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Simulador de Verificación */}
                        <div className="bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#A06A42] font-mono">Simulador de Propagación DNS</p>
                            <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-full border ${domainStatus === 'checking' ? 'text-sandbrown border-sandbrown/20 bg-sandbrown/5 animate-pulse' : domainStatus === 'active' ? 'text-palmgreen border-palmgreen/25 bg-palmgreen/5' : 'text-charcoal/40 border-charcoal/15 bg-white'}`}>
                              {domainStatus === 'checking' ? 'Buscando registros...' : domainStatus === 'active' ? '● PROPAGADO Y SEGURO' : '○ PENDIENTE DE ENLACE'}
                            </span>
                          </div>

                          {domainStatus === 'checking' ? (
                            <div className="space-y-1.5 py-2 font-mono text-[9px] text-charcoal/60 animate-pulse">
                              <p>🔍 Consultando name servers de Namecheap para estadored.com...</p>
                              <p>🔍 Verificando registros tipo A en @...</p>
                              <p>🔍 Validando CNAME www a ghs.googlehosted.com...</p>
                            </div>
                          ) : domainStatus === 'active' ? (
                            <div className="space-y-1.5 py-1 font-mono text-[9px] text-[#2D5B3A]">
                              <p className="flex items-center gap-1.5 font-bold">✓ DNS Apunta a Google IPs correctas ({domainMethod === 'cloudrun' ? '216.239.32.21' : '199.36.158.100'})</p>
                              <p className="flex items-center gap-1.5 font-bold">✓ CNAME www → {domainMethod === 'cloudrun' ? 'ghs.googlehosted.com' : 'gen-lang-client-0042316931.web.app'} [Confirmado]</p>
                              <p className="flex items-center gap-1.5 text-charcoal/50">✓ SSL Certificado aprovisionado exitosamente</p>
                              <p className="text-[10px] italic text-charcoal mt-2 text-center font-sans font-bold text-[#2D5B3A]">¡Felicitaciones! estadored.com está en vivo en la red soberana.</p>
                            </div>
                          ) : (
                            <p className="text-[9.5px] text-charcoal/50 italic leading-snug">
                              Una vez cargados todos tus registros DNS en Namecheap, presiona abajo para simular dinámicamente y comprobar el flujo de autenticidad en tiempo real.
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
                            className="stone-btn w-full px-4 py-2 bg-white text-charcoal border border-[#ECE8DE] hover:border-skyblue hover:text-skyblue-dark text-[10px] uppercase font-bold tracking-wider transition-all rounded-lg select-none cursor-pointer text-center"
                          >
                            {domainStatus === 'checking' ? 'Validando...' : domainStatus === 'active' ? 'Reiniciar Prueba' : 'Comprobar registros DNS'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botón Guardar */}
                  <div className="pt-4 border-t border-[#ECE8DE] flex justify-end">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={profileSaving || !aliasInput.trim()}
                      className="stone-btn w-full sm:w-auto px-8 py-3.5 bg-sandbrown hover:bg-sandbrown-dark text-white font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>{profileSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              VISTA 5: MURO - CANAL COLECTIVO (Propuestas)
              ========================================= */}
          {activeTab === 'comunidad' && activeCollectiveNode !== null && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Muro central de feeds */}
                <div className="flex-1 w-full space-y-6 flex flex-col">
                  {/* Header tarjeta */}
                  <div className="bg-white/95 border border-[#ECE8DE] p-5 stone-card shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden gap-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sandbrown-light/5 blur-3xl pointer-events-none"></div>
                    <div>
                      <h2 className="text-md md:text-lg font-serif font-bold flex items-center gap-2 text-charcoal">
                        <MessageSquare className="w-4 h-4 text-sandbrown" />
                        Canal Colectivo {activeCollectiveNode.type === 'territorio' ? 'Territorial' : activeCollectiveNode.type === 'ocupacion' ? 'de Ocupación' : 'Ideológico'}
                      </h2>
                      <p className="text-charcoal/50 text-[11px] mt-1 font-bold uppercase tracking-wider">
                         Nodo actual: <span className="text-sandbrown">{activeCollectiveNode.value}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => navigateTo('identidad')}
                      className="stone-btn px-4 py-2 bg-[#FAF9F5] hover:bg-warmgray/30 text-charcoal border border-[#ECE8DE] text-[10px] font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      ← Volver a Mi Ficha
                    </button>
                  </div>

                  {/* Main feed cards list */}
                  <div className="bg-white/95 border border-[#ECE8DE] rounded-3xl p-6 shadow-sm">
                    <ProposalFeed currentUser={userProfile} nodeFilter={activeCollectiveNode} />
                  </div>
                </div>

                {/* Sidebar del muro: coordinacion directa omicanal */}
                <div className="w-full lg:w-80 bg-white border border-[#ECE8DE] rounded-3xl p-5 flex flex-col gap-4 shadow-sm shrink-0">
                  <h4 className="text-[10px] font-bold text-charcoal/80 tracking-wider uppercase flex items-center gap-2 border-b border-[#ECE8DE] pb-2">
                    <MessageCircle className="w-4 h-4 text-palmgreen" /> Coordinación Directa
                  </h4>
                  <p className="text-[11px] text-charcoal/60 leading-relaxed">
                    Sincroniza y debate en las asambleas vivas de este nodo con soberanos del mismo nivel:
                  </p>
                  
                  <a 
                    href="https://whatsapp.com/channel/0029Vb7wKedGpLHH6kcqxA44" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-[#128C7E]/5 hover:bg-[#128C7E]/10 border border-[#128C7E]/15 rounded-2xl p-3.5 transition-all text-xs flex flex-col gap-1 text-left decoration-transparent group"
                  >
                    <p className="font-bold text-[#128C7E] flex items-center gap-1.5"><span className="text-sm">📢</span> Canal WhatsApp Nacional</p>
                    <p className="text-[10px] text-charcoal/50">Muro Oficial del procomún (Solo lectura)</p>
                  </a>

                  <a 
                    href={`https://t.me/mock_estadored_${activeCollectiveNode.type}_${activeCollectiveNode.value.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-[#0088cc]/5 hover:bg-[#0088cc]/10 border border-[#0088cc]/15 rounded-2xl p-3.5 transition-all text-xs flex flex-col gap-1 text-left decoration-transparent group"
                  >
                    <p className="font-bold text-[#0088cc] flex items-center gap-1.5"><span className="text-sm">📍</span> Grupo Telegram Red</p>
                    <p className="text-[10px] text-charcoal/50">Debate del nodo: {activeCollectiveNode.value}</p>
                  </a>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* =========================================
          4. BURBUJA Y CHAT GENERAL PARA EL ASESOR IAsesor
          ========================================= */}
      
      {/* Botón Flotante */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-sandbrown text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all z-[80] group stone-btn border border-[#C39D80]/20"
          title="IAsesor Democrático"
        >
          <Zap className="w-5 h-5 animate-pulse text-white" />
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-charcoal border border-[#ECE8DE]/20 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-xl rounded-tr-none shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-300">
            ¿Dudas de Autonomía? Pregunta aquí
          </div>
        </button>
      )}

      {/* RAG CHATBOT PANEL */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-full max-w-[90%] md:w-[400px] h-[85vh] md:h-[550px] bg-white border border-[#ECE8DE] rounded-3xl shadow-xl flex flex-col z-[100] animate-in slide-in-from-bottom-6 overflow-hidden">
          {/* Cabecera chatbot */}
          <div className="bg-[#FAF9F5] p-4 border-b border-[#ECE8DE] flex justify-between items-center">
            <h3 className="text-charcoal font-serif font-black flex items-center gap-2">
              <span className="p-1.5 bg-[#A06A42]/10 rounded-lg text-sandbrown shrink-0">
                <Zap className="w-4 h-4" />
              </span>
              IAsesor Político
            </h3>
            <button onClick={() => setChatOpen(false)} className="text-charcoal/50 hover:text-charcoal p-1 rounded-lg hover:bg-[#FAF9F5] transition cursor-pointer">
              ✕
            </button>
          </div>
          
          {/* Logs / Chat feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9F5]/50">
            {chatHistory.length === 0 && (
              <div className="bg-[#A06A42]/5 border border-[#A06A42]/20 p-4 rounded-2xl text-charcoal/80 text-xs shadow-sm leading-relaxed space-y-1">
                <p className="font-bold text-sandbrown">Asistente de Autonomía EstadoRed</p>
                <p>¡Saludos Soberano! Estoy entrenado para guiarte en materia de la <b>Ley Marco de Autonomías</b>, cartas orgánicas y descentralización.</p>
                <p className="pt-1.5">¿Quieres saber cómo se legisla la soberanía de tu nodo <b>{rubro}</b>?</p>
              </div>
            )}
            
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-sandbrown text-white rounded-tr-none shadow-[#A06A42]/10' : 'bg-white border border-[#ECE8DE] text-charcoal rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                 <div className="bg-white border border-[#ECE8DE] text-charcoal/40 rounded-2xl rounded-tl-none p-3 text-xs flex gap-1 shadow-sm">
                   <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                 </div>
              </div>
            )}
          </div>

          {/* Text Area Input */}
          <div className="p-3 border-t border-[#ECE8DE] bg-white">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Pregunta sobre cartas orgánicas, leyes..." 
                className="flex-1 bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl px-4 py-2.5 text-xs text-charcoal focus:outline-none focus:border-sandbrown"
              />
              <button 
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-sandbrown hover:bg-sandbrown-dark disabled:opacity-50 text-white p-2.5 rounded-xl flex items-center justify-center cursor-pointer transition shadow-md shrink-0"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP LLAMATIVO (Alerta Proactiva de Hito) */}
      {showPopup && (
        <div id="award-popup" className="fixed inset-0 z-[110] flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-[#ECE8DE] p-8 rounded-3xl w-full max-w-md shadow-2xl text-center relative overflow-hidden stone-card">
            
            <div className="w-16 h-16 bg-[#2D5B3A]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#2D5B3A]/20">
              <CheckCircle className="w-8 h-8 text-palmgreen" />
            </div>

            <h3 className="text-2xl font-bold font-serif text-charcoal mb-2">¡Hito Alcanzado!</h3>
            <p className="text-charcoal/70 text-xs mb-6 leading-relaxed">
              Tu participación en el Nodo Colectivo ha sido registrada. Tu nivel de impacto (IP) está influyendo en la red de <strong>{rubro}</strong>.
            </p>
            
            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#ECE8DE] mb-6 flex justify-between items-center text-left">
               <span className="text-[9px] font-bold text-charcoal/50 uppercase tracking-widest leading-normal">Créditos de<br/>Experiencia</span>
               <span className="text-lg font-black text-palmgreen flex items-center gap-1">+100 <span className="text-xs font-bold text-palmgreen-dark">XP</span></span>
            </div>

            <button 
              onClick={() => setShowPopup(false)}
              className="stone-btn w-full py-3.5 bg-sandbrown hover:bg-sandbrown-dark text-white font-bold uppercase tracking-wider text-xs shadow-md transition cursor-pointer"
            >
              Continuar gobernando
            </button>
          </div>
        </div>
      )}



    </div>
  );
}

// Subcomponente para Atributos RPG Lineales
function StatRow({ label, desc, value, color }: { label: string, desc: string, value: number, color: string }) {
  return (
    <div className="flex items-center gap-3 justify-between group">
      <div className="flex items-center gap-3">
        <div className={`w-8 text-[11px] font-mono font-black ${color}`}>{label}</div>
        <div className="text-[11px] font-bold text-charcoal/60 uppercase tracking-wider">{desc}</div>
      </div>
      
      <div className="flex items-center gap-2.5">
        <div className={`font-black ${color} text-base`}>{value}</div>
        <button className="w-5 h-5 bg-white border border-[#ECE8DE] hover:border-sandbrown rounded-md flex items-center justify-center hover:bg-sandbrown hover:text-white text-charcoal/70 transition-colors shadow-sm font-bold text-[10px] cursor-pointer">+</button>
      </div>
    </div>
  );
}

// Subcomponente para Equip Slot (Loadout central con círculo estilizado)
interface EquipSlotProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  borderColor: string;
  bgHighlight: string;
  onClick?: () => void;
  memberCount?: number;
}

function EquipSlot({ 
  icon, 
  label, 
  value, 
  borderColor, 
  bgHighlight, 
  onClick, 
  memberCount 
}: EquipSlotProps) {
  return (
    <div onClick={onClick} className="flex flex-col items-center group cursor-pointer relative transition-transform duration-300 hover:-translate-y-1 w-full max-w-[200px]">
      {/* Hand-drawn Slot Sphere */}
      <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white border ${borderColor} rounded-full flex items-center justify-center transition-colors shadow-sm ${bgHighlight}`}>
        <div className="scale-90 sm:scale-100 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
          {icon}
        </div>
      </div>
      
      {/* Text Container Card */}
      <div className="mt-2 sm:mt-3 text-center bg-white border border-[#ECE8DE] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-[0_2px_8px_rgba(43,41,39,0.02)] min-w-[120px] max-w-[160px] sm:max-w-[180px] md:max-w-[200px] group-hover:border-sandbrown-light group-hover:shadow-[0_4px_15px_rgba(43,41,39,0.06)] transition-all flex flex-col items-center justify-center h-auto">
        <p className="text-[7.5px] sm:text-[8px] md:text-[9px] uppercase text-charcoal/50 font-bold mb-1.5 tracking-[0.15em] leading-tight text-center break-words w-full px-1">{label}</p>
        <p className="text-[10px] sm:text-[11px] font-serif font-bold text-charcoal leading-snug break-words text-center w-full px-1">{value}</p>
        {memberCount !== undefined && (
          <p className="text-[8px] sm:text-[8.5px] mt-1.5 text-palmgreen font-semibold bg-palmgreen/5 px-2 py-0.5 rounded-full border border-palmgreen/10 flex items-center justify-center gap-1 w-fit mx-auto">
            <span className="w-1 h-1 bg-palmgreen rounded-full"></span>
            <span>{memberCount}</span>
            <span className="hidden xs:inline"> miemb.</span>
          </p>
        )}
      </div>
    </div>
  );
}

// Subcomponente de Quest/Misión (El Camino del Impacto)
function QuestCard({ level, title, desc, active, locked, xp }: { level: string, title: string, desc: string, active?: boolean, locked?: boolean, xp?: string }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all duration-300 group ${active ? 'bg-palmgreen/5 border-palmgreen/30 shadow-sm' : locked ? 'bg-warmgray/10 border-warmgray-dark/15 opacity-65' : 'bg-white border-warmgray hover:border-warmgray-dark'}`}>
       {locked && <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] z-10"></div>}
       <div className="flex justify-between items-start">
         <span className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${active ? 'bg-palmgreen text-white' : 'bg-warmgray text-charcoal/60'}`}>
           {level}
         </span>
         {xp && <span className="text-[8.5px] text-skyblue-dark font-semibold bg-skyblue/10 px-1.5 py-0.5 rounded border border-skyblue/15">{xp}</span>}
       </div>
       <h4 className={`text-xs font-serif font-bold leading-tight ${active ? 'text-charcoal' : 'text-charcoal/50'}`}>{title}</h4>
       <p className="text-[10px] text-charcoal/60 leading-relaxed pr-2">{desc}</p>
       
       {active && (
         <button className="stone-btn mt-2 ml-auto text-[9px] uppercase tracking-wider text-white bg-palmgreen hover:bg-palmgreen-dark px-3 py-1.5 font-bold flex items-center gap-1 transition-colors cursor-pointer border border-palmgreen-light/20">
           Iniciar Módulo <ChevronRight className="w-3 h-3" />
         </button>
       )}
    </div>
  );
}
