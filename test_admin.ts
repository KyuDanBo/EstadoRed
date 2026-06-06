import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const docRef = db.collection('collective_nodes').doc('test');
    await docRef.set({ test: 1 });
    console.log("Write successful!");
    
    const snap = await db.collection('biblioteca_digital').get();
    console.log("Read successful, size:", snap.size);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
run();
