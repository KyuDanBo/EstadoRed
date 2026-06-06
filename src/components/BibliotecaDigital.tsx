import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, doc, setDoc, writeBatch, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Book, 
  UploadCloud, 
  Search, 
  FileText, 
  Download, 
  Loader2, 
  HelpCircle, 
  Send, 
  Layers, 
  MessageSquare, 
  Check, 
  X,
  FileCheck,
  Building,
  User,
  Calendar
} from "lucide-react";

interface DocumentMeta {
  id: string;
  titulo_oficial: string;
  resumen_ia: string;
  categoria_tematica: string;
  palabras_clave: string[];
  descripcion_usuario: string;
  pdfUrl: string;
  user_id: string;
  nodo_origen: string;
  timestamp: string;
  isCustomLocal?: boolean;
}

interface BibliotecaDigitalProps {
  userProfile: any;
  initialTab?: "explorar" | "subir";
}

export function BibliotecaDigital({ userProfile, initialTab = "explorar" }: BibliotecaDigitalProps) {
  // Navigation tabs of Biblioteca
  const [activeSubTab, setActiveSubTab] = useState<"explorar" | "subir">(initialTab);
  
  // Storage of loaded documents
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Ingest Form states
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [nodoOrigen, setNodoOrigen] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // RAG / Chat state
  const [selectedDoc, setSelectedDoc] = useState<DocumentMeta | null>(null);
  const [ragQuestion, setRagQuestion] = useState("");
  const [ragChatHistory, setRagChatHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [isRagQuerying, setIsRagQuerying] = useState(false);
  
  // Elements
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const snap = await getDocs(collection(db, "biblioteca_digital"));
      const docs = snap.docs.map(d => d.data() as DocumentMeta);
      setDocuments(docs);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error de lectura de biblioteca en Firestore: " + (err.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and Drop handlers
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setErrorMsg("");
      } else {
        setErrorMsg("Solo se permiten archivos en formato PDF.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setErrorMsg("");
      } else {
        setErrorMsg("Solo se permiten archivos en formato PDF.");
      }
    }
  };

  // Upload handler
  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Por favor, selecciona un archivo PDF para ingresar.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Debe rellenar la descripción para asistir el análisis de la Inteligencia Artificial.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("descripcion_usuario", description);
    formData.append("user_id", userProfile?.alias || "gremial_soberano");
    formData.append("nodo_origen", nodoOrigen || userProfile?.territorio || "General");

    try {
      const response = await fetch("/api/documentos/ingesta", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        const { docData, enrichedChunks } = data;
        
        // Guardar documento principal en Firestore
        await setDoc(doc(db, "biblioteca_digital", docData.id), docData);

        // Subir chunks en batches
        if (enrichedChunks && enrichedChunks.length > 0) {
           const batch = writeBatch(db);
           const uploadSlice = enrichedChunks.slice(0, 25);
           uploadSlice.forEach((c: any) => {
             const chunkRef = doc(db, "biblioteca_chunks", c.id);
             batch.set(chunkRef, {
               ...c,
               timestamp: new Date().toISOString()
             });
           });
           await batch.commit();
        }

        setSuccessMsg("¡Documento procesado y vectorizado con éxito por el IAsesor de Biblioteca!");
        // Reset Form
        setFile(null);
        setDescription("");
        setNodoOrigen("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Refresh list
        await fetchDocuments();
        // Go back to explore after slight delay
        setTimeout(() => {
          setActiveSubTab("explorar");
          setSuccessMsg("");
        }, 2200);
      } else {
        setErrorMsg("Fallo en ingesta: " + (data.error || ""));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error de red al procesar el archivo PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  // Cognitive RAG Ask handler
  const handleAskRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuestion.trim()) return;

    const userQ = ragQuestion;
    setRagQuestion("");
    setRagChatHistory(prev => [...prev, { role: "user", text: userQ }]);
    setIsRagQuerying(true);

    try {
      let docChunks: any[] = [];
      try {
        let chunkQuery = collection(db, "biblioteca_chunks");
        let snap;
        if (selectedDoc?.id) {
          snap = await getDocs(query(chunkQuery, where("documentId", "==", selectedDoc.id), limit(8)));
        } else {
          snap = await getDocs(query(chunkQuery, limit(15)));
        }
        docChunks = snap.docs.map(d => d.data());
      } catch (fbErr: any) {
        console.warn("Error fetching chunk queries:", fbErr);
      }

      const response = await fetch("/api/documentos/chat-rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentId: selectedDoc?.id || "",
          question: userQ,
          chunks: docChunks
        })
      });
      const data = await response.json();
      if (data.success) {
        setRagChatHistory(prev => [...prev, { role: "assistant", text: data.answer }]);
      } else {
        setRagChatHistory(prev => [...prev, { role: "assistant", text: "Error al consultar: " + (data.error || "") }]);
      }
    } catch (err: any) {
      console.error(err);
      setRagChatHistory(prev => [...prev, { role: "assistant", text: "Error de conexión con el indexador cognitivo." }]);
    } finally {
      setIsRagQuerying(false);
    }
  };

  // Filters calculation
  const categories = ["Todas", ...Array.from(new Set(documents.map(d => d.categoria_tematica || "General")))];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.titulo_oficial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.descripcion_usuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.resumen_ia.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.palabras_clave.some(pk => pk.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "Todas" || doc.categoria_tematica === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white/95 border border-[#ECE8DE] stone-card p-6 md:p-8 shadow-[0_4px_24px_rgba(43,41,39,0.03)]">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#ECE8DE] pb-6 mb-6 gap-4">
          <div>
            <h3 className="font-serif font-black text-xl text-charcoal mb-1 flex items-center gap-2">
              <Book className="w-5 h-5 text-sandbrown" /> Biblioteca Digital Autonómica
            </h3>
            <p className="text-xs text-charcoal/50">
              Colección descentralizada de reglamentos cívicos, leyes comunitarias y propuestas formales analizadas cognitivamente por el sistema RAG.
            </p>
          </div>

          <div className="flex gap-2 self-start md:self-center">
            <button
              onClick={() => {
                setActiveSubTab("explorar");
                setSelectedDoc(null);
                setRagChatHistory([]);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                activeSubTab === "explorar"
                  ? "bg-sandbrown text-white border-sandbrown shadow-sm"
                  : "bg-white text-charcoal/70 border-[#ECE8DE] hover:bg-warmgray/35"
              }`}
            >
              📖 Explorar
            </button>
            <button
              onClick={() => {
                setActiveSubTab("subir");
                setSelectedDoc(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                activeSubTab === "subir"
                  ? "bg-sandbrown text-white border-sandbrown shadow-sm"
                  : "bg-white text-charcoal/70 border-[#ECE8DE] hover:bg-warmgray/35"
              }`}
            >
              📥 Aportar
            </button>
          </div>
        </div>

        {/* Global feedbacks */}
        {errorMsg && (
          <div className="p-4 bg-red-50/75 border border-red-200 text-red-700 rounded-2xl text-xs mb-6 font-medium animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50/75 border border-emerald-200 text-emerald-800 rounded-2xl text-xs mb-6 font-medium">
            ✅ {successMsg}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: EXPLORAR BIBLIOTECA */}
        {/* ========================================================= */}
        {activeSubTab === "explorar" && !selectedDoc && (
          <div className="space-y-6">
            
            {/* Search and Category Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-[#FAF9F5] p-4 rounded-2xl border border-[#ECE8DE]">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                <input
                  type="text"
                  placeholder="Buscar por título, palabra clave o resumen cívico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#ECE8DE] rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-sandbrown text-charcoal"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-charcoal/40 tracking-wider font-sans whitespace-nowrap">Categoría:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-[#ECE8DE] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sandbrown text-charcoal"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document Inventory Loading status */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-sandbrown animate-spin" />
                <p className="text-xs text-charcoal/40 font-mono">Sincronizando acervo cívico...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center text-charcoal/50 bg-[#FAF9F5]/40 rounded-3xl border border-[#ECE8DE] animate-in fade-in zoom-in-95 duration-300">
                <h2 className="text-xl font-serif font-black text-charcoal mb-2">Gracias por conectarte al EstadoRed.</h2>
                <p className="text-sm text-charcoal/60 tracking-wider">Pronto contaremos con más contenido.</p>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setActiveSubTab("subir")}
                    className="px-4 py-2 bg-sandbrown text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90"
                  >
                    Aportar Documentación
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className="bg-white border border-[#ECE8DE] rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top labels */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs bg-sandbrown/10 text-sandbrown font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full font-serif border border-sandbrown/10">
                          {doc.categoria_tematica || "Ley Comunitaria"}
                        </span>
                        <div className="flex gap-1">
                          {doc.palabras_clave?.slice(0, 3).map((pk, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                              #{pk}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-serif font-black text-sm text-charcoal mb-2 leading-snug group-hover:text-sandbrown transition-colors">
                        {doc.titulo_oficial}
                      </h4>

                      {/* Summaries */}
                      <div className="space-y-2 mb-4">
                        <div className="p-3 bg-[#FAF9F5] border-l-2 border-sandbrown/35 rounded-r-xl">
                          <p className="text-sm text-charcoal/70 leading-relaxed font-sans text-left">
                            <span className="font-extrabold text-xs text-sandbrown uppercase tracking-wider block mb-0.5">SÍNTESIS COGNITIVA IA:</span>
                            {doc.resumen_ia}
                          </p>
                        </div>
                        <p className="text-xs text-charcoal/40 italic line-clamp-2 text-left">
                          <span className="font-bold font-sans not-italic">Justificación aporte: </span>
                          "{doc.descripcion_usuario}"
                        </p>
                      </div>
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="border-t border-[#FAF9F5] pt-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs text-[#2B2927]/40 font-mono">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {doc.user_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" /> {doc.nodo_origen}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {/* Ask cognitive RAG button */}
                        <button
                          onClick={() => {
                            setSelectedDoc(doc);
                            setRagChatHistory([{
                              role: "assistant",
                              text: `¡Hola Soberano! He indexado todas las páginas de "${doc.titulo_oficial}" en mi matriz cognitiva RAG. ¿Qué regulación, limitante o fundamento deseas consultar hoy?`
                            }]);
                          }}
                          className="flex-1 px-3 py-2 bg-charcoal text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" /> Consultar RAG
                        </button>
                        
                        {/* Download original cached PDF */}
                        <a
                          href={doc.pdfUrl}
                          download={`${doc.titulo_oficial}.pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-[#FAF9F5] hover:bg-[#FAF9F5]/80 border border-[#ECE8DE] text-charcoal rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors focus:ring-1 focus:ring-sandbrown"
                        >
                          <Download className="w-3.5 h-3.5 text-sandbrown" /> Ver PDF
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-PANEL: ACTIVE DOCUMENT RAG CHAT */}
        {/* ========================================================= */}
        {activeSubTab === "explorar" && selectedDoc && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            
            {/* Left sidebar: Document info */}
            <div className="lg:col-span-1 bg-[#FAF9F5] p-5 rounded-2xl border border-[#ECE8DE] flex flex-col justify-between gap-5 text-left">
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedDoc(null);
                    setRagChatHistory([]);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-warmgray/35 border border-[#ECE8DE] rounded-lg text-xs font-bold uppercase tracking-wider text-charcoal/60 cursor-pointer flex items-center gap-1"
                >
                  ← Volver a Biblioteca
                </button>

                <div className="space-y-2">
                  <span className="text-[10px] bg-sandbrown text-white font-extrabold uppercase px-2 py-0.5 rounded">
                    {selectedDoc.categoria_tematica}
                  </span>
                  <h4 className="font-serif font-black text-base text-charcoal hover:text-sandbrown transition-colors">
                    {selectedDoc.titulo_oficial}
                  </h4>
                </div>

                <div className="text-xs text-charcoal/70 leading-relaxed space-y-2">
                  <p>
                    <strong className="block text-xs text-sandbrown uppercase tracking-wider font-sans mb-0.5">Resumen del IAsesor:</strong>
                    {selectedDoc.resumen_ia}
                  </p>
                  <p className="text-sm italic text-[#2B2927]/50 block border-t border-[#ECE8DE] pt-3">
                    <strong className="not-italic font-bold text-charcoal font-sans text-xs uppercase tracking-wider block mb-0.5">Aporte del ciudadano:</strong>
                    "{selectedDoc.descripcion_usuario}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedDoc.palabras_clave?.map((v, i) => (
                    <span key={i} className="text-xs bg-white border border-[#ECE8DE] text-charcoal/70 px-2 py-0.5 rounded-full font-mono">
                      #{v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#ECE8DE] pt-4 text-xs text-charcoal/40 font-mono space-y-1">
                <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Subido por: {selectedDoc.user_id}</div>
                <div className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Sede / Nodo: {selectedDoc.nodo_origen}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fecha: {new Date(selectedDoc.timestamp).toLocaleDateString()}</div>
                
                <div className="pt-3">
                  <a
                    href={selectedDoc.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center px-4 py-2 bg-white hover:bg-warmgray pl-2.5 rounded-xl border border-[#ECE8DE] text-xs font-bold text-charcoal uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sandbrown" /> Descargar PDF Completo
                  </a>
                </div>
              </div>
            </div>

            {/* Right container: Conversational RAG Engine */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#ECE8DE] flex flex-col justify-between min-h-[450px]">
              
              {/* Box Header */}
              <div className="bg-[#FAF9F5] px-4 py-3 border-b border-[#ECE8DE] flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-charcoal/60 font-sans">
                    Canal RAG: Auditoría Cognitiva Activa
                  </span>
                </div>
                <span className="text-xs font-mono text-sandbrown">
                  Matriz de Fragmentación Completa
                </span>
              </div>

              {/* Chat timeline bubbles */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4 max-h-[350px]">
                {ragChatHistory.map((bubble, i) => (
                  <div 
                    key={i}
                    className={`flex flex-col ${bubble.role === "user" ? "items-end" : "items-start"} animate-in fade-in duration-200`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs text-left leading-relaxed ${
                        bubble.role === "user"
                          ? "bg-sandbrown text-white rounded-tr-none shadow-sm"
                          : "bg-slate-50 border border-slate-150 text-charcoal rounded-tl-none"
                      }`}
                    >
                      <span className="block text-[10px] font-black opacity-45 uppercase tracking-widest font-sans mb-1.5">
                        {bubble.role === "user" ? "Yo (Soberano)" : "IAsesor RAG"}
                      </span>
                      {bubble.text.split("\n").map((para, pIdx) => (
                        <p key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>{para}</p>
                      ))}
                    </div>
                  </div>
                ))}

                {isRagQuerying && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="bg-slate-50 border border-slate-150 text-charcoal rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-sandbrown animate-spin" />
                      <span className="text-xs font-mono text-charcoal/50">Recuperando fragmentos cívicos correlacionados...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleAskRag} className="p-3 border-t border-[#ECE8DE] bg-[#FAF9F5] rounded-b-2xl flex gap-3">
                <input
                  type="text"
                  placeholder="Ej: ¿Qué misiones o responsabilidades propone este reglamento?"
                  value={ragQuestion}
                  onChange={(e) => setRagQuestion(e.target.value)}
                  disabled={isRagQuerying}
                  className="flex-1 bg-white border border-[#ECE8DE] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-sandbrown text-charcoal"
                />
                <button
                  type="submit"
                  disabled={isRagQuerying || !ragQuestion.trim()}
                  className="px-4 bg-sandbrown hover:opacity-95 text-white rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INGESTA / SUBIR NUEVO PDF */}
        {/* ========================================================= */}
        {activeSubTab === "subir" && (
          <form onSubmit={handleIngestSubmit} className="max-w-2xl mx-auto space-y-6 text-left">
            <div className="border-b border-[#ECE8DE] pb-2 mb-2">
              <h4 className="font-serif font-black text-base text-charcoal">Ingreso Seguro de Documentos al EstadoRed</h4>
              <p className="text-xs text-charcoal/50 mt-1">
                La Inteligencia Artificial parseará el archivo indexándolo en la asamblea virtual. Evita subir spam o lenguaje agresivo.
              </p>
            </div>

            {/* PDF selection / Drag Drop Area */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-charcoal uppercase tracking-wider block">1. Archivo PDF del Documento</label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? "border-sandbrown bg-amber-50/20" 
                    : file 
                    ? "border-emerald-500/50 bg-emerald-50/10" 
                    : "border-[#ECE8DE] bg-[#FAF9F5] hover:bg-[#FAF9F5]/70"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <FileCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-charcoal">{file.name}</p>
                    <p className="text-xs text-charcoal/40 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Listo para ingesta</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-600 uppercase rounded-md tracking-wider transition-colors inline-block mt-1"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-10 h-10 text-charcoal/30 mx-auto" />
                    <p className="text-xs font-bold text-charcoal">Arrastra tu PDF aquí o presiona para buscar</p>
                    <p className="text-xs text-charcoal/40 font-mono">Límite de archivo: 15MB • Solo PDFs institucionales</p>
                  </div>
                )}
              </div>
            </div>

            {/* Text description with user support */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-charcoal uppercase tracking-wider block">
                2. Descripción y Justificación del Aporte (Contexto AI)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Reglamento Interno de la Sede Comunal Oruro Central que detalla las obligaciones de los transportistas gremiales y las sanciones para casos de evasión de cuotas..."
                rows={4}
                required
                className="w-full bg-white border border-[#ECE8DE] rounded-xl p-3.5 text-xs focus:outline-none focus:border-sandbrown text-charcoal leading-relaxed resize-none font-sans"
              />
              <span className="text-xs text-charcoal/40 leading-normal block">
                * Este preámbulo asiste al algoritmo de Gemini a clasificar las páginas y enriquecer las porciones de texto en el sistema de vectores.
              </span>
            </div>

            {/* Optional field block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-charcoal uppercase tracking-wider block">Nodo u Origen de Aplicación (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Gremialistas La Paz, Sede El Alto..."
                  value={nodoOrigen}
                  onChange={(e) => setNodoOrigen(e.target.value)}
                  className="w-full bg-white border border-[#ECE8DE] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sandbrown text-charcoal font-sans"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-charcoal uppercase tracking-wider block">Aportante (Usuario)</label>
                <input
                  type="text"
                  disabled
                  value={`${userProfile?.alias || "gremial_soberano"} (${userProfile?.uid?.substring(0,6) || "UID"})`}
                  className="w-full bg-[#FAF9F5] border border-[#ECE8DE] rounded-xl px-3.5 py-2.5 text-xs text-charcoal/40 font-mono"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end border-t border-[#ECE8DE] pt-4">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  setActiveSubTab("explorar");
                  setFile(null);
                  setDescription("");
                  setNodoOrigen("");
                }}
                className="px-4 py-2.5 rounded-xl border border-[#ECE8DE] text-xs font-bold uppercase tracking-wider text-charcoal/60 hover:bg-warmgray/35 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2.5 bg-sandbrown hover:opacity-95 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando e indexando RAG...
                  </>
                ) : (
                  <>
                    Aportar a Biblioteca →
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
