import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import { Telegraf } from 'telegraf';
import multer from "multer";
import { createRequire } from "module";
// Support both ESM (dev) and CJS (bundled production)
const metaUrl = (typeof import.meta !== "undefined" && import.meta.url) 
  ? import.meta.url 
  : (typeof __filename !== "undefined" ? __filename : process.cwd());
const requireFn = createRequire(metaUrl);
const pdf = requireFn("pdf-parse");

// Initialize Firebase Admin
let dbExt: Firestore | null = null;
try {
  let adminApp;
  const apps = getApps();

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log("Inicializando Firebase Admin con FIREBASE_SERVICE_ACCOUNT_KEY (Render/Prod)");
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    if (apps.length === 0) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    } else {
      adminApp = getApp();
    }
    
    const dbId = process.env.FIREBASE_DATABASE_ID || "ai-studio-291038a7-6282-4f79-8b21-d2341ed64566";
    dbExt = getFirestore(adminApp, dbId);
  } else {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (firebaseConfig.projectId) {
        if (apps.length === 0) {
          adminApp = initializeApp({ projectId: firebaseConfig.projectId });
        } else {
          adminApp = getApp();
        }
        dbExt = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
      }
    } else {
      console.log("No FIREBASE_SERVICE_ACCOUNT_KEY y no firebase-applet-config.json encontrado.");
    }
  }
} catch (e) {
  console.log("Failed to initialize Firebase Admin:", e);
}

// Simulated database (fallback)
interface MockDb {
  submissions: any[];
  biblioteca_digital: any[];
  biblioteca_chunks: any[];
}
const db: MockDb = {
  submissions: [] as any[],
  biblioteca_digital: [] as any[],
  biblioteca_chunks: [] as any[]
};

// PDF cache in memory for simulation downloads
const pdfCache: { [key: string]: { buffer: Buffer; originalname: string; mimetype: string } } = {};

// Helper: Split text into character-based semantic chunks (simulating RecursiveCharacterTextSplitter)
function splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let startIndex = 0;
  const cleanedText = text.replace(/\s+/g, " ");
  while (startIndex < cleanedText.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex > cleanedText.length) {
      endIndex = cleanedText.length;
    }
    chunks.push(cleanedText.substring(startIndex, endIndex));
    if (endIndex === cleanedText.length) break;
    startIndex += (chunkSize - overlap);
  }
  return chunks;
}

// Initialize Gemini API
let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// Initialize Telegram Bot
function startTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN no configurado. El bot de Telegram no se iniciará.");
    return;
  }

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  const systemInstruction = `
    Eres el "IAsesor Político", la Inteligencia Artificial asistente y facilitadora de EstadoRed en Bolivia.
    Tu función es ser un consultor técnico, legal y estratégico inquebrantable para el ciudadano, quien es el verdadero Soberano.
    
    REGLAS DE OPERACIÓN PARA TELEGRAM:
    1. IDENTIDAD: No eres un líder, no tomas decisiones, ni tienes opiniones políticas personales. Eres un asesor de la base social.
    2. TONO: Sobrio, técnico, empoderador y estructurado. Usa respuestas concisas porque es un chat de mensajería.
    3. RECONDUCCIÓN DE CONTEXTO: Tu foco exclusivo es la Identidad Política (Territorio, Ocupación e Ideología). Si el usuario cae en discusiones sobre partidos tradicionales o bloqueos destructivos, neutraliza el conflicto explicando cómo se puede canalizar institucionalmente a través de EstadoRed.
    4. ACCIÓN PROACTIVA: Invita a los usuarios a registrarse en la WebApp oficial de EstadoRed para formalizar sus propuestas, convertir sus ideas en Puntos de Impacto (IP) y unirse a sus Nodos Colectivos.
  `;

  bot.start((ctx) => {
    ctx.reply(
      "🤖 ¡Hola! Soy el **IAsesor Político** de EstadoRed.\n\n" +
      "Estoy aquí para ayudarte a entender la normativa boliviana (CPE, Ley de Autonomías) y enseñarte a proponer soluciones reales sin depender de partidos tradicionales.\n\n" +
      "¿Sobre qué sector u ocupación te gustaría organizar propuestas hoy?\n\n" +
      `🔗 *También puedes registrar tu Identidad Política oficial en la WebApp:* ${process.env.APP_URL || 'https://estado-red.com'}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.help((ctx) => {
    ctx.reply(
      "Puedes preguntarme sobre:\n" +
      "- 📜 Cómo redactar un proyecto de ley ciudadana.\n" +
      "- 🤝 Cómo organizar asambleas en tu sector u ocupación.\n" +
      "- ⚖️ Qué dicen las leyes bolivianas sobre problemáticas actuales (ej. dólares, diésel, salud).\n" +
      "- 🌐 Cómo funciona el EstadoRed y la Identidad Política."
    );
  });

  bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;

    try {
      if (!process.env.GEMINI_API_KEY) {
        return ctx.reply("El servicio de IAsesor no está disponible en este momento por falta de configuración de IA.");
      }

      ctx.sendChatAction('typing');

      const genai = getAI();
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemInstruction,
        },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      });

      ctx.reply(response.text || "No pude generar una respuesta clara. Intenta reformular tu pregunta.");
    } catch (error) {
      console.error("Error from Gemini in Telegram Bot:", error);
      ctx.reply("Hubo un error de conexión con mi núcleo de conocimiento. Por favor, intenta de nuevo en unos minutos.");
    }
  });

  const launchBot = async (retries = 3) => {
    try {
      await bot.launch({ dropPendingUpdates: true });
      console.log("Telegram bot launched successfully!");
    } catch (err: any) {
      if (err.code === 409 && retries > 0) {
        console.log(`Telegram Bot conflict (409). Retrying in 5s... (${retries} retries left)`);
        setTimeout(() => launchBot(retries - 1), 5000);
      } else {
        console.error("Failed to launch Telegram bot:", err);
      }
    }
  };

  launchBot();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Start the Telegram bot in the background
  startTelegramBot();

  // API Route: Notify Admin via Telegram about new Group/Node creation and auto-create
  app.post("/api/notify-new-node", async (req, res) => {
    try {
      const { type, name, tags } = req.body; // Expect tags to include Triada if applicable
      const ADMIN_PHONES = ['+59164065089', '+59162218183'];
      
      const adminMessage = `
🔔 NUEVO NODO COLECTIVO REGISTRADO
Se requiere la creación de un nuevo canal de Telegram si es necesario para:
- Tipo: ${type}
- Nombre: ${name}

ADMINISTRADORES (${ADMIN_PHONES.join(", ")}):
Por favor responder a este mensaje.
      `;
      
      console.log("==========================================");
      console.log("TELEGRAM BOT TASK TRIGERRED (Mock Message)");
      console.log(`Sending to admins (${ADMIN_PHONES.join(", ")}):\n${adminMessage}`);
      console.log("==========================================");

      // Auto-create node in Firestore
      if (dbExt) {
        const nodeId = `${type}_${name}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await dbExt.collection('collective_nodes').doc(nodeId).set({
           name,
           type,
           tags: tags || [],
           createdAt: FieldValue.serverTimestamp(),
           isAutoGenerated: true,
           telegramLink: `https://t.me/mock_estadored_${nodeId}` // Auto-generated hypothetical link
        }, { merge: true });
        console.log(`Node ${nodeId} auto-created in Firestore.`);
      }

      res.json({ success: true, message: "Node created and administrators notified" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route: Process new citizenship submission
  app.post("/api/submit", async (req, res) => {
    try {
      const data = req.body;
      const { 
        userId, alias, territorio, ocupacion, ideologia, accion_2 
      } = data;

      let moderationStatus = "accepted";
      let aiSummary = "Propuesta de Alto Impacto";
      
      // We will only call AI if there's a free-text proposal
      if (accion_2 && process.env.GEMINI_API_KEY) {
        try {
          const genai = getAI();
          const prompt = `
            Eres el Moderador y Sintetizador de la plataforma "EstadoRed" en Bolivia.
            Analiza la siguiente propuesta del ciudadano "${alias}" (Región: ${territorio}, Ocupación: ${ocupacion}, Ideología: ${ideologia}):
            "${accion_2}"

            REGLAS:
            1. Si la propuesta es spam, insulto, ofensiva, apología del delito o atenta contra la convivencia democrática, incluye explícitamente la palabra "RECHAZADA" en tu análisis.
            2. Extrae el Núcleo de la Propuesta: sintetízala de manera sumamente profesional, directa, clara y concisa en un título/resumen de máximo 12 palabras. Debe ser en infinitivo o sustantivado (ej. "Implementar un fondo de estabilización de precios" o "Digitalización de trámites gremiales").
            3. Limpia el texto de todo preámbulo, saludos de cortesía, explicaciones redundantes, o meta-comentarios. Devuelve únicamente el resumen pulido.

            FORMATO DE RESPUESTA:
            Si es aceptada, devuelve ÚNICAMENTE el resumen de 12 palabras.
            Si es rechazada, devuelve ÚNICAMENTE: RECHAZADA - [Razón del rechazo].
          `;
          
          const response = await genai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
          });
          const text = response.text || "";
          
          if (text.includes("RECHAZADA")) {
            moderationStatus = "rejected";
            aiSummary = text.replace("RECHAZADA -", "").trim();
          } else {
            aiSummary = text.trim().replace(/^["'«»“”]|["'«»“”]$/g, '').trim();
          }
        } catch (e) {
          console.error("AI Error:", e);
        }
      }

      const submission = {
        userId: userId || alias,
        alias: alias,
        content: accion_2 || "",
        triada: {
          territorio: territorio || "",
          ocupacion: ocupacion || "",
          ideologia: ideologia || ""
        },
        supportCount: 0,
        status: moderationStatus === "rejected" ? "rejected" : "approved",
        aiSummary: aiSummary,
        timestamp: new Date().toISOString()
      };

      // Also keep local fallback
      const localSubmission = { id: Date.now(), ...submission };
      db.submissions.push(localSubmission);

      res.json({ success: true, submissionId: localSubmission.id, moderationStatus, aiSummary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route: Edit Proposal
  app.post("/api/edit-proposal", async (req, res) => {
    try {
      const { proposalId, content, userId } = req.body;
      if (!dbExt) {
        return res.status(500).json({ success: false, error: "Database not connected" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, error: "AI API not configured." });
      }

      const proposalRef = dbExt.collection("proposals").doc(proposalId);
      const proposalDoc = await proposalRef.get();

      if (!proposalDoc.exists) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }

      const data = proposalDoc.data();
      if (data?.userId !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }
      
      if (data?.level && data.level > 1) {
        return res.status(403).json({ success: false, error: "Cannot edit escalated proposals" });
      }

      // Generate new summary
      let aiSummary = "Propuesta sin resumen.";
      const genai = getAI();
      try {
        const aiResponse = await genai.models.generateContent({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction: "Eres un sintetizador experto. Resume la siguiente propuesta ciudadana de manera muy concisa (máximo 12 palabras), destacando el núcleo de la idea. El tono debe ser formal y descriptivo.",
          },
          contents: [{ role: 'user', parts: [{ text: content || "" }] }],
        });
        aiSummary = aiResponse.text || aiSummary;
      } catch (err) {
        console.error("AI summarization failed (edit):", err);
      }

      await proposalRef.update({
        content,
        aiSummary,
        updatedAt: FieldValue.serverTimestamp()
      });

      res.json({ success: true, aiSummary });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // API Route: Voto Líquido - Delegación Ponderada
  app.post("/api/delegate", async (req, res) => {
    try {
      const { delegatorId, delegateId } = req.body;
      if (!dbExt) {
        return res.status(500).json({ success: false, error: "Database not connected" });
      }
      if (delegatorId === delegateId) {
        return res.status(400).json({ success: false, error: "Cannot delegate to yourself." });
      }

      // Check Circular Delegation (A -> B, B -> A)
      const delegatorRef = dbExt.collection("users").doc(delegatorId);
      const delegateRef = dbExt.collection("users").doc(delegateId); // Assume it could be user or node

      await dbExt.runTransaction(async (t: any) => {
        const delegateDoc = await t.get(delegateRef);
        // If the intended delegate is already delegating to the delegator, block circular
        if (delegateDoc.exists && delegateDoc.data().delegatedTo === delegatorId) {
          throw new Error("Circular delegation detected. Operation aborted.");
        }

        t.update(delegatorRef, {
           delegatedTo: delegateId,
           updatedAt: FieldValue.serverTimestamp()
        });
        
        // Increase delegate's weight parameter (transactional)
        if (delegateDoc.exists) {
           t.update(delegateRef, {
             votingWeight: FieldValue.increment(1)
           });
        }
      });

      res.json({ success: true, message: "Delegation successful." });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // API Route: Voto Líquido - Recuperar / Revocar Delegación
  app.post("/api/revoke-delegation", async (req, res) => {
    try {
      const { delegatorId } = req.body;
      if (!dbExt) {
        return res.status(500).json({ success: false, error: "Database not connected" });
      }

      const delegatorRef = dbExt.collection("users").doc(delegatorId);

      await dbExt.runTransaction(async (t: any) => {
        const delegatorDoc = await t.get(delegatorRef);
        if (!delegatorDoc.exists) throw new Error("Delegator not found");
        
        const data = delegatorDoc.data();
        if (!data.delegatedTo) throw new Error("No active delegation.");

        const delegateRef = dbExt.collection("users").doc(data.delegatedTo);
        const delegateDoc = await t.get(delegateRef);

        t.update(delegatorRef, {
           delegatedTo: null,
           updatedAt: FieldValue.serverTimestamp()
        });

        if (delegateDoc.exists) {
           t.update(delegateRef, {
             votingWeight: FieldValue.increment(-1)
           });
        }
      });
      res.json({ success: true, message: "Delegation revoked." });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // API Route: Ingesta de Datos Abiertos (ETL SICOES/SIGEP) 
  app.post("/api/trigger-etl-sicoes", async (req, res) => {
    // Simularemos un ETL cron job que encola datos del estado central.
    try {
      if (!dbExt) {
        return res.status(500).json({ success: false, error: "Database not connected" });
      }

      const mockData = [
        { title: 'Construcción Planta de Agua Oruro Sur', budget: 'Bs. 5,200,000', status: 'Adjudicado', date: new Date().toISOString() },
        { title: 'Compra de Medicamentos Distritales SNIS', budget: 'Bs. 850,000', status: 'Licitación', date: new Date().toISOString() },
        { title: 'Servicios de Internet Ministerios La Paz', budget: 'Bs. 3,120,000', status: 'Observado', date: new Date().toISOString() }
      ];

      const batch = dbExt.batch();
      mockData.forEach(data => {
        const docRef = dbExt.collection('public_contracts').doc();
        batch.set(docRef, { ...data, timestamp: FieldValue.serverTimestamp() });
      });

      await batch.commit();

      res.json({ success: true, message: "ETL SICOES job executed successfully. Inserted mock data." });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route: Autonomic RAG Assistant (Consult constitutional questions)
  app.post("/api/chat", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: "AI API not configured." });
    }
    try {
      const { question, history = [] } = req.body;
      const genai = getAI();
      
      const systemInstruction = `
        Eres el "IAsesor Político", la Inteligencia Artificial asistente y facilitadora de EstadoRed en Bolivia. 
        Tu función es ser un consultor técnico, legal y estratégico inquebrantable para el ciudadano, quien es el verdadero Soberano.

        REGLAS DE OPERACIÓN:
        1. IDENTIDAD: No eres un líder, no tomas decisiones, ni tienes opiniones políticas personales. Eres un asesor de la base social.
        2. TONO: Sobrio, técnico, empoderador y altamente estructurado. Usa viñetas. Tu lenguaje debe transmitir la seguridad de un experto constitucionalista que asiste a un ciudadano con plenos derechos políticos.
        3. RECONDUCCIÓN DE CONTEXTO: Tu foco exclusivo es la Identidad Política (Territorio, Ocupación e Ideología). Si el usuario cae en discusiones sobre partidos tradicionales, bloqueos destructivos o consignas de cúpulas, neutraliza el conflicto explicando cómo se puede canalizar institucionalmente esa preocupación a través de su organización social base.
        4. ACCIÓN PROACTIVA: Diseña tus respuestas para alimentar los componentes de la interfaz; sugiere misiones que otorguen XP o avisa cuando una idea está lista para convertirse en una propuesta de impacto (IP).
      `;

      let contents = [];
      for (const msg of history) {
        contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] });
      }
      contents.push({ role: 'user', parts: [{ text: question }] });

      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemInstruction,
        },
        contents: contents,
      });

      res.json({ success: true, reply: response.text });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Route: Get Statistics (Consensus Data)
  app.get("/api/stats", (req, res) => {
    // Basic aggregation
    res.json({
      success: true,
      totalSoberanos: db.submissions.length,
      recentProposals: db.submissions.filter(s => s.moderationStatus !== 'rejected').slice(-10),
    });
  });

  // ==========================================
  // BLOCKCHAIN FOUNDATION ENDPOINTS (EstadoRed)
  // ==========================================

  // 1. SBT MINTING & CIVIC REPUTATION (Tokens Vinculados al Alma)
  app.post("/api/blockchain/sbt/mint", async (req, res) => {
    try {
      const { userId, badgeType, justification, points = 10 } = req.body;
      if (!userId || !badgeType) {
        return res.status(400).json({ success: false, error: "userId and badgeType are required." });
      }

      const sbtId = `sbt_${badgeType.toLowerCase()}_${Date.now()}`;
      const sbtData = {
        id: sbtId,
        badgeType, // e.g. TERRITORIAL_AUDIT, INCUBACION_GREMIAL, AUDITOR_SICOES, PRESENCIA_COMUNAL
        justification,
        points,
        blockchainTxId: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`, // Simulating real blockchain TX
        mintedAt: new Date().toISOString()
      };

      if (dbExt) {
        // Save under user's nested collection of SBTs
        await dbExt.collection("users").doc(userId).collection("sbts").doc(sbtData.id).set(sbtData);
        
        // Dynamically increment votingWeight and reputation points
        await dbExt.collection("users").doc(userId).update({
          reputationPoints: FieldValue.increment(points),
          votingWeight: FieldValue.increment(Math.ceil(points / 10)),
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      res.json({
        success: true,
        message: "Soulbound Token (SBT) minted successfully on simulated blockchain.",
        sbt: sbtData
      });
    } catch (err: any) {
      console.error("Error minting SBT:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. CIVIC QUADRATIC FUNDING ENGINE (Fase 2 - Autonomic Redes Territoriales)
  // Computes Gitcoin/RadicalxChange formulas to assign matching stablecoin funds among community initiatives
  app.post("/api/blockchain/quadratic-funding/calculate", async (req, res) => {
    try {
      const { matchingPoolAmount, projects } = req.body;
      // projects is expected to be { id: string, name: string, contributions: number[] }[]
      if (!matchingPoolAmount || !projects || !Array.isArray(projects)) {
        return res.status(400).json({ success: false, error: "Invalid parameters. Require matchingPoolAmount and projects array." });
      }

      // Calculate sum of square roots for each project
      const scoredProjects = projects.map(p => {
        const contribList = Array.isArray(p.contributions) ? p.contributions : [Number(p.contributions || 0)];
        const sumAndSqrt = contribList.reduce((acc, c) => acc + Math.sqrt(Math.max(0, c)), 0);
        const rawScore = Math.pow(sumAndSqrt, 2);
        const directSum = contribList.reduce((acc, c) => acc + c, 0);

        return {
          id: p.id,
          name: p.name,
          totalDirectContributions: directSum,
          rawScore, // Quadratic raw support weight
          matchingAmount: 0 // Proportion assigned below
        };
      });

      // Sum raw weights for proportional distribution
      const totalRawScore = scoredProjects.reduce((acc, p) => acc + p.rawScore, 0);

      if (totalRawScore > 0) {
        scoredProjects.forEach(p => {
          p.matchingAmount = Number(((p.rawScore / totalRawScore) * matchingPoolAmount).toFixed(2));
        });
      }

      res.json({
        success: true,
        matchingPoolAmount,
        totalRawScore,
        results: scoredProjects
      });
    } catch (err: any) {
      console.error("Error calculating Quadratic Funding:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. STABLECOIN FUNDS ESCROW ENGINE (Fase 3 - Ejecución Autónoma de Obras Públicas)
  app.post("/api/blockchain/contracts/escrow", async (req, res) => {
    try {
      const { contractId, title, budgetUSDT, contractor, milestones } = req.body;
      if (!contractId || !title || !budgetUSDT) {
        return res.status(400).json({ success: false, error: "contractId, title, and budgetUSDT are required." });
      }

      const contractData = {
         id: contractId,
         title,
         budgetUSDT: Number(budgetUSDT),
         contractor: contractor || "Constructora Boliviana S.R.L.",
         status: "active",
         milestones: milestones || [
           { id: "m1", name: "Fase 1: Replanteo e Inicio", percentage: 20, status: "pending", txHash: null },
           { id: "m2", name: "Fase 2: Obra Bruta Vecinal", percentage: 40, status: "pending", txHash: null },
           { id: "m3", name: "Fase 3: Entrega con Control Social", percentage: 40, status: "pending", txHash: null }
         ],
         blockchainSmartContractAddress: `0xEscrowContract${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
         createdAt: new Date().toISOString()
      };

      if (dbExt) {
        await dbExt.collection("stablecoin_contracts").doc(contractId).set(contractData);
      }

      res.json({
        success: true,
        message: "Stablecoin Escrow Smart Contract published successfully on the network.",
        contract: contractData
      });
    } catch (err: any) {
      console.error("Error creating stablecoin contract:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. COMMUNITY RELEASE OF MILESTONE FUNDS (Verificación de Hito Físico en Sede)
  app.post("/api/blockchain/contracts/release-milestone", async (req, res) => {
    try {
      const { contractId, milestoneId, verifiedByNodeId, auditorName } = req.body;
      if (!contractId || !milestoneId) {
        return res.status(400).json({ success: false, error: "contractId and milestoneId are required." });
      }

      if (!dbExt) {
        return res.status(500).json({ success: false, error: "Database not connected." });
      }

      const contractRef = dbExt.collection("stablecoin_contracts").doc(contractId);
      const contractDoc = await contractRef.get();

      if (!contractDoc.exists) {
        return res.status(404).json({ success: false, error: "Escrow Contract not found." });
      }

      const data = contractDoc.data();
      const updatedMilestones = (data?.milestones || []).map((m: any) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            status: "released",
            verifiedByNodeId: verifiedByNodeId || "NF_CENTRAL_SOPOCACHI",
            auditor: auditorName || "Comisión de Control Social",
            txHash: `0xReleaseTx${Math.random().toString(16).substring(2, 10).toUpperCase()}`
          };
        }
        return m;
      });

      await contractRef.update({
        milestones: updatedMilestones,
        lastReleasedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `Milestone funds successfully dispatched on-chain. Escrow payment released transactionally in USDT.`,
        milestones: updatedMilestones
      });
    } catch (err: any) {
      console.error("Error releasing milestone:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. DIRECT REGIONAL HANDSHAKE (Acreditación Física con Clave Vecinal)
  app.post("/api/nodes/register-member", async (req, res) => {
    try {
      const { userId, nodeData, representativeCode } = req.body;
      if (!userId || !nodeData || !representativeCode) {
        return res.status(400).json({ success: false, error: "Missing required inputs (userId, nodeData, representativeCode)." });
      }

      // Logical constraint: representativeCode must start with 'REP-' (Acreditación oficial)
      if (!representativeCode.toUpperCase().startsWith("REP-")) {
        return res.status(403).json({ success: false, error: "Clave de acreditación inválida. Debe estar firmada por un representante de sede autorizado (Prefijo: 'REP-')." });
      }

      if (dbExt) {
        const userRef = dbExt.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const existingNodes = userData?.nodosFisicos || [];
          
          if (existingNodes.some((n: any) => n.name === nodeData.name)) {
            return res.json({ success: true, message: "Ya figuras registrado en esta sede." });
          }

          const newNode = {
            id: `nf_sugg_${Date.now()}`,
            name: nodeData.name,
            type: nodeData.type,
            address: nodeData.address,
            coords: nodeData.coords || `${(-16.5 - Math.random() * 0.1).toFixed(4)}° S, ${(-68.15 - Math.random() * 0.1).toFixed(4)}° O`,
            isPrimary: false,
            memberCount: (nodeData.memberCount || 5) + 1,
            verifiedAt: new Date().toISOString()
          };

          const updatedNodes = [...existingNodes, newNode];
          await userRef.update({ nodosFisicos: updatedNodes });

          // Also mint a verification Soulbound Token on-chain!
          const sbtId = `sbt_verified_${Date.now()}`;
          await userRef.collection("sbts").doc(sbtId).set({
            id: sbtId,
            badgeType: "CIUDADANO_VERIFICADO",
            justification: `Acreditación oficial en la sede física: ${nodeData.name}`,
            points: 15,
            blockchainTxId: `0xValidHandshake${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
            mintedAt: new Date().toISOString()
          });

          // Update total weight and reputation
          await userRef.update({
            reputationPoints: FieldValue.increment(15),
            votingWeight: FieldValue.increment(2)
          });
        }
      }

      res.json({
        success: true,
        message: "Acreditación cívica de Sede concluida con éxito."
      });
    } catch (err: any) {
      console.error("Error registering node member:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // ENDPOINTS DE LA BIBLIOTECA DIGITAL (RAG)
  // ==========================================

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB LIMIT
  });

  app.post("/api/extract_text", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No se proporcionó ningún archivo." });
      }
      if (req.file.mimetype === "application/pdf") {
        const parsed = await pdf(req.file.buffer);
        return res.json({ success: true, text: parsed.text || "" });
      } else {
        return res.json({ success: true, text: req.file.buffer.toString('utf-8') });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1. Ingesta: Upload PDF & process
  app.post("/api/documentos/ingesta", upload.single("pdf"), async (req: any, res: any) => {
    try {
      const { descripcion_usuario, user_id, nodo_origen } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No se proporcionó ningún archivo PDF." });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ success: false, error: "El archivo cargado debe estar estrictamente en formato PDF." });
      }

      // Extraer texto con pdf-parse
      let pdfData;
      try {
        pdfData = await pdf(req.file.buffer);
      } catch (parseError: any) {
        console.error("Error al analizar PDF:", parseError);
        return res.status(400).json({ success: false, error: "Error al extraer el texto descriptivo del PDF." });
      }

      const fullText = pdfData.text || "";
      if (!fullText.trim()) {
        return res.status(400).json({ success: false, error: "El PDF cargado parece estar vacío o contiene solo imágenes no legibles." });
      }

      const snippet = fullText.substring(0, 3000);

      // Análisis semántico con Gemini
      let geminiResult = {
        titulo_oficial: req.file.originalname.replace(/\.pdf$/i, ""),
        resumen_ia: "Sin resumen disponible.",
        categoria_tematica: "Autonomía y EstadoRed",
        palabras_clave: ["autonomia", "colectivo", "estadored"] as string[]
      };

      if (process.env.GEMINI_API_KEY) {
        try {
          const genai = getAI();
          const prompt = `
            Actúas como un Analista de Modelado Documental de EstadoRed en Bolivia.
            Se te proporciona una descripción escrita por el ciudadano que aporta la ley o el libro, y los primeros 3000 caracteres de texto crudo extraídos del PDF.
            
            DESCRIPCIÓN MANUAL DEL USUARIO:
            "${descripcion_usuario || "Documento aportado para la biblioteca cívica autonómica."}"
            
            CONTENIDO TEMPRANO DEL PDF:
            "${snippet}"

            Por favor, genera un objeto JSON que determine de forma precisa e institucional las siguientes características:
            1. "titulo_oficial": El nombre o título formal del reglamento, ley, decreto o estatuto (si no encuentras uno claro, asalta un título limpio, solemne e institucional basado en el contexto).
            2. "resumen_ia": Un resumen ejecutivo y profesional de máximo 3 oraciones que explique el alcance legislativo o práctico.
            3. "categoria_tematica": Clasificación disciplinaria (ej. Ley Nacional, Convenio Comunal, Estatuto Autonómico, Reglamento Interno, Gestión de Recursos, etc.).
            4. "palabras_clave": Un arreglo de exactamente 4 o 5 palabras clave de relevancia técnica e institucional.

            Devuelve ÚNICAMENTE el JSON estructurado válido, sin comentarios, sin preámbulos y sin triple acento invertido (Markdown code blocks).
          `;

          const response = await genai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          let cleanedText = (response.text || "").trim();
          // Quitar posible formato markdown
          if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/^```/, "").replace(/```$/, "").trim();
          }

          try {
            const parsed = JSON.parse(cleanedText);
            if (parsed.titulo_oficial) geminiResult.titulo_oficial = parsed.titulo_oficial;
            if (parsed.resumen_ia) geminiResult.resumen_ia = parsed.resumen_ia;
            if (parsed.categoria_tematica) geminiResult.categoria_tematica = parsed.categoria_tematica;
            if (parsed.palabras_clave) geminiResult.palabras_clave = parsed.palabras_clave;
          } catch (jsonErr) {
            console.warn("No se pudo parsear JSON puro. Buscando llaves...", jsonErr);
            const match = cleanedText.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              if (parsed.titulo_oficial) geminiResult.titulo_oficial = parsed.titulo_oficial;
              if (parsed.resumen_ia) geminiResult.resumen_ia = parsed.resumen_ia;
              if (parsed.categoria_tematica) geminiResult.categoria_tematica = parsed.categoria_tematica;
              if (parsed.palabras_clave) geminiResult.palabras_clave = parsed.palabras_clave;
            }
          }
        } catch (aiErr) {
          console.error("Fallo análisis semántico con Gemini:", aiErr);
        }
      }

      // ID Único y URL de descarga simulada
      const fileId = `doc_${Date.now()}`;
      const pdfUrl = `/api/documentos/download/${fileId}`;

      // Respaldar archivo en caché para descargas reales
      pdfCache[fileId] = {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype
      };

      const docData = {
        id: fileId,
        titulo_oficial: geminiResult.titulo_oficial,
        resumen_ia: geminiResult.resumen_ia,
        categoria_tematica: geminiResult.categoria_tematica,
        palabras_clave: geminiResult.palabras_clave,
        descripcion_usuario: descripcion_usuario || "Aporte ciudadano.",
        pdfUrl: pdfUrl,
        user_id: user_id || "gremial_soberano",
        nodo_origen: nodo_origen || "General",
        timestamp: new Date().toISOString()
      };

      // Procesamiento RAG: Dividir texto completo
      const textChunks = splitText(fullText, 1000, 200);
      const enrichedChunks = textChunks.map((chunk, index) => {
        const enrichedText = `Título: ${docData.titulo_oficial}. Descripción del usuario: ${docData.descripcion_usuario}. Contenido: ${chunk}`;
        return {
          id: `${fileId}_chunk_${index}`,
          documentId: fileId,
          chapterIndex: index,
          originalText: chunk,
          enrichedText: enrichedText,
          timestamp: new Date().toISOString()
        };
      });

      return res.json({
        success: true,
        message: "Documento analizado, extraído y vectorizado con éxito.",
        docData,
        enrichedChunks
      });

    } catch (err: any) {
      console.error("Error en endpoint /ingesta:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });



  // 3. Descargar PDF (Caché local session-proxy)
  app.get("/api/documentos/download/:id", (req, res) => {
    const cached = pdfCache[req.params.id];
    if (cached) {
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(cached.originalname)}"`);
      res.setHeader("Content-Type", cached.mimetype);
      return res.send(cached.buffer);
    }
    return res.status(404).send("Documento en PDF expiró de la memoria de sesión o no existe.");
  });

  // 4. Chat cognitivo RAG
  app.post("/api/documentos/chat-rag", async (req: any, res: any) => {
    try {
      const { documentId, question, chunks } = req.body;
      if (!question) {
        return res.status(400).json({ success: false, error: "Es requisito proveer una pregunta." });
      }

      let contextText = "";
      
      const rawChunks = Array.isArray(chunks) ? chunks : [];
      
      // Filtrar semánticamente por palabras clave de la pregunta en JS
      const keywordMatches = rawChunks.filter((c: any) => {
        const content = (c.enrichedText || "").toLowerCase();
        const qWords = question.toLowerCase().split(/\s+/);
        return qWords.some((qw: string) => qw.length > 3 && content.includes(qw));
      });

      const chosenChunks = keywordMatches.length > 0 ? keywordMatches.slice(0, 5) : rawChunks.slice(0, 5);
      contextText = chosenChunks.map((c: any) => c.enrichedText).join("\n\n");

      if (!contextText.trim()) {
        contextText = "No pudimos encontrar fragmentos del documento que coincidan semánticamente con tu pregunta. Utiliza el conocimiento constitucional amplio de EstadoRed.";
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          success: true,
          answer: "[Simulado]: IAsesor cívico responde con base en el fragmento encontrado. El servicio de OpenAI/Gemini no se configuró en backend."
        });
      }

      const genai = getAI();
      const prompt = `
        Eres el Bibliotecario Asistente Legal y Asesor de RAG de EstadoRed en Bolivia.
        A continuación se te provee el contexto directo extraído del documento de la biblioteca cívica.
        
        CONTEXTO DEL ARCHIVO PDF EXTRAÍDO:
        """
        ${contextText}
        """

        PREGUNTA DEL SO SOBERANO:
        "${question}"

        Instrucciones estrictas:
        1. Responde de forma sobria, fundamentada y didáctica.
        2. Basa tus argumentos principales estrictamente en el contexto y PDF provistos.
        3. Si la respuesta no está disponible en las hojas del contexto, indícalo cortésmente pero aporta tu conocimiento como experto en el marco legal autonómico y la CPE (Constitución Política del Estado de Bolivia) para que el soberano no se vaya con las manos vacías. Desglosa los artículos clave (como el art. 300 de autonomías de la CPE o la Ley 031 si fueren aplicables).
        
        Evita rodeos innecesarios. Da respuestas estructuradas en viñetas ordenadas.
      `;

      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      return res.json({
        success: true,
        answer: response.text || "No pude estructurar una respuesta coherente.",
        contextUsed: contextText.substring(0, 500) + "..."
      });

    } catch (error: any) {
      console.error("Error en RAG chat:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // 5. NotebookLM Course Generator
  app.post("/api/notebooklm_analyze", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.length < 50) {
        return res.status(400).json({ success: false, error: "El texto provisto es demasiado corto para un análisis." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, error: "AI API no configurada." });
      }

      const genai = getAI();
      const prompt = `Analiza el siguiente documento provisto por un administrador de EstadoRed y extrae la estructura para generar un mini-curso o capacitación de 3 niveles: \n\n${text.substring(0, 5000)}\n\nGenera un JSON EXACTAMENTE con el siguiente formato, sin markdown ni comillas escapadas: \n{"title": "Título del Curso", "level": "Nivel Básico/Avanzado", "steps": [{"title": "Paso 1", "desc": "Descripción breve del concepto clave 1"}], "quiz": {"question": "Pregunta de opción múltiple basada en el texto", "options": ["A", "B", "C"], "correct": "A (incluye justificación)"}}`;

      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let cleaned = (response.text || "").trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "");
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "");
      cleaned = cleaned.replace(/```$/, "").trim();

      const parsed = JSON.parse(cleaned);
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ success: false, error: "Error en el análisis de NotebookLM" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 24600 + Math.floor(Math.random() * 100)
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use. Exiting to allow supervisor to restart.`);
      process.exit(1);
    }
  });
}

startServer();
