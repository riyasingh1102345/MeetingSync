// Run this ONCE in your browser console on the app to delete all YOUR test meetings
// Go to: http://localhost:5173/dashboard, open DevTools > Console, paste and run this

import { db } from './src/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
if (!user) { console.error('Not logged in!'); }

const q = query(collection(db, 'meetings'), where('userId', '==', user.uid));
const snap = await getDocs(q);
console.log(`Found ${snap.size} meetings to delete...`);
for (const d of snap.docs) {
  await deleteDoc(doc(db, 'meetings', d.id));
  console.log('Deleted:', d.id);
}
console.log('Done! All test meetings cleared.');
