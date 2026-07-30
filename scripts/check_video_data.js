const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const lines = envContent.split('\n').filter(Boolean);
const env = {};
lines.forEach(line => {
  const eqIdx = line.indexOf('=');
  if (eqIdx > 0) {
    const key = line.substring(0, eqIdx).trim();
    let val = line.substring(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

const projectId = env.FIREBASE_PROJECT_ID || 'pearlbloom-74976';
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
let privateKey = env.FIREBASE_PRIVATE_KEY;
privateKey = privateKey.replace(/\\n/g, '\n');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();
const slug = 'gold-plated-hoop-earrings-combo-set-for-women';

async function main() {
  // Find the product
  let docId = slug;
  let snap = await db.collection('products').doc(slug).get();
  if (!snap.exists) {
    const q = await db.collection('products').where('slug', '==', slug).limit(1).get();
    if (q.empty) {
      console.log('Product not found');
      return;
    }
    docId = q.docs[0].id;
    snap = q.docs[0];
  }

  const data = snap.data();
  const current = data.videoThumbnailImage;
  console.log('Current videoThumbnailImage:', JSON.stringify(current));

  if (typeof current === 'string' && current.startsWith('blob:')) {
    console.log('Fixing blob URL -> empty string');
    await db.collection('products').doc(docId).update({
      videoThumbnailImage: '',
    });
    console.log('Done! Field cleared.');
  } else {
    console.log('No blob URL found, no fix needed.');
  }

  // Verify
  const verify = await db.collection('products').doc(docId).get();
  console.log('Verified videoThumbnailImage:', JSON.stringify(verify.data().videoThumbnailImage));
}

main().catch(console.error);
