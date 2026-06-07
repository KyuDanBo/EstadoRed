import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Try to load service account if it exits
const run = async () => {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf-8'));
        initializeApp({
            credential: cert(serviceAccount)
        });
        
        const db = getFirestore();
        
        const collections = ['users', 'collective_nodes', 'networks', 'proposals'];
        for (const col of collections) {
            const snap = await db.collection(col).get();
            const batch = db.batch();
            snap.docs.forEach((doc) => {
                if (doc.id !== 'admin' && doc.id !== 'prueba') {
                    batch.delete(doc.ref);
                }
            });
            await batch.commit();
            console.log(`Cleared ${col}`);
        }
        console.log("Done clearing DB.");
    } catch(err) {
        console.error("Error", err);
    }
}
run();
