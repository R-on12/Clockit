import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log('Connecting to database:', firebaseConfig.firestoreDatabaseId);
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    console.log(`Successfully fetched users. Total count of registered documents: ${querySnapshot.size}\n`);
    
    const users: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name || 'N/A',
        email: data.email || 'N/A',
        isOnline: data.isOnline ?? false,
        createdAt: data.createdAt || 'N/A',
        membership: data.membership || 'N/A',
        clockLevel: data.clockLevel || data.zenLevel || 'N/A'
      });
    });

    console.log('\n--- REGISTERED USERS LIST ---');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }
}

run();
