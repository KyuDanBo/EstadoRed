import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import * as fs from 'fs';

const rawConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const firebaseConfig = rawConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function wipeData() {
  try {
    const cred = await signInWithEmailAndPassword(auth, 'admin@estadored.app', 'administrador');
    console.log("Logged in as admin:", cred.user.email);
    const token = await cred.user.getIdTokenResult();
    console.log("Token claims:", token.claims);
    
    const collectionsToClear = [
      'users',
      'proposals',
      'votos_presidenciales',
      'resultados_votaciones',
      'citizen_observations',
      'physical_node_requests',
      'territorial_network_requests'
    ];

    for (const collName of collectionsToClear) {
      console.log(`Wiping collection: ${collName}`);
      let deleted = 0;
      try {
        const snap = await getDocs(collection(db, collName));
        for (const d of snap.docs) {
          if (collName === 'users') {
            const uemail = d.data().email || "";
            if (uemail === 'daren.bo.lp@gmail.com' || uemail === 'admin@estadored.app') {
              console.log(`Skipping admin user doc: ${d.id}`);
              continue;
            }
          }
          try {
            await deleteDoc(d.ref);
            deleted++;
          } catch (e) {
            console.log(`Failed to delete ${d.id}:`, e.message);
          }
        }
        console.log(`Deleted ${deleted} items from ${collName}`);
      } catch (err) {
        console.error(`Failed to GET docs for ${collName}:`, err.message);
      }
    }
    console.log("Wipe complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error wiping data:", err);
    process.exit(1);
  }
}

wipeData();
