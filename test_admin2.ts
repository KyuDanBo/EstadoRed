import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const configUrl = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configUrl, 'utf8'));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const snap = await db.collection('biblioteca_digital').get();
    console.log("Read successful, size:", snap.size);
  } catch (err: any) {
    console.error("Error read dbExt:", err.message);
  }
}
run();
