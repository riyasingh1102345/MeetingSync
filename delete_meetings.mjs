import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// ── Paste your firebase config here (same as your firebase.js) ──
const firebaseConfig = {
  apiKey: "AIzaSyDxM03U-7RSiJfEoopXHGEJb7roDLWzTDc",
  authDomain: "meeting-review-1102.firebaseapp.com",
  projectId: "meeting-review-1102",
  storageBucket: "meeting-review-1102.firebasestorage.app",
  messagingSenderId: "508683465120",
  appId: "1:508683465120:web:baa8e937be5cc583bc74c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllMeetings() {
  const snap = await getDocs(collection(db, 'meetings'));
  console.log(`Found ${snap.size} meetings. Deleting...`);
  for (const d of snap.docs) {
    await deleteDoc(doc(db, 'meetings', d.id));
    console.log('Deleted:', d.id, d.data().title || d.data().name || 'Untitled');
  }
  console.log('✅ All meetings deleted!');
}

deleteAllMeetings().catch(console.error);
