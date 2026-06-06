import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import * as fs from 'fs';

const rawConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const firebaseConfig = rawConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function createVoting() {
  try {
    const cred = await signInWithEmailAndPassword(auth, 'admin@estadored.app', 'administrador');
    
    await addDoc(collection(db, 'votaciones'), {
      title: "Resolución de Conflicto Nacional",
      context: "Ante la imposibilidad de dialogo con los sectores movilizados ¿Qué debería hacer el Gobierno nacional?",
      level: "Nacional",
      status: "activa",
      options: [
        { id: "opcion_1", label: "Convocar a Referendum revocatorio." },
        { id: "opcion_2", label: "Dictar Estado de Excepción." },
        { id: "opcion_3", label: "Renunciar." }
      ],
      createdAt: new Date().toISOString()
    });

    console.log("Votación creada exitosamente.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

createVoting();
