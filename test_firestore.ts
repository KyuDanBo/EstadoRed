import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const configUrl = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configUrl, 'utf8'));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app, config.firestoreDatabaseId);

db.collection('biblioteca_digital').get()
  .then(s => console.log('Docs:', s.size))
  .catch(e => console.error('Error:', e.message));
