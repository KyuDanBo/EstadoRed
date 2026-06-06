// frontend test
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const configUrl = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configUrl, 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

getDocs(collection(db, 'biblioteca_digital'))
  .then(s => console.log('Docs (client):', s.size))
  .catch(e => console.error('Error (client):', e.message));
