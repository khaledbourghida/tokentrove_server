// routes/referral.js
import express from 'express';
import crypto from 'crypto';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const router = express.Router();
const db = admin.firestore();

// Simple hash generator for IP + UserAgent
function hash(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Visitor enters referral link: /ref/:slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const ua = req.get('user-agent') || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
    const ipHash = hash(`${ip}-${ua}`);
    const day = new Date().toISOString().slice(0, 10);

    const refDoc = db.collection('referrals').doc(slug);
    const refSnap = await refDoc.get();
    if (!refSnap.exists || !refSnap.data().active) {
      return res.status(404).send('Invalid referral link');
    }

    const ownerUid = refSnap.data().ownerUid;

    // Check if visitor already claimed today
    const claimDoc = refDoc.collection('claims').doc(`${ipHash}-${day}`);
    const claimSnap = await claimDoc.get();

    if (!claimSnap.exists) {
      // Create claim
      await claimDoc.set({
        ipHash,
        ua,
        day,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Log every click (optional analytics)
    await db.collection('referralClicks').add({
      slug,
      ownerUid,
      ipHash,
      ua,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.redirect('https://comforting-torte-626735.netlify.app/');
  } catch (err) {
    console.error('Referral error:', err);
    res.status(500).send('Something went wrong');
  }
});

export default router;
