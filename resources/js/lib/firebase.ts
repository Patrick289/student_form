import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyD2SE9RVMFTw-HV-EBV362eHUFe9McFQ2A',
    authDomain: 'student-form-d3f20.firebaseapp.com',
    projectId: 'student-form-d3f20',
    storageBucket: 'student-form-d3f20.firebasestorage.app',
    messagingSenderId: '981566001434',
    appId: '1:981566001434:web:b884ee6baf4aa5ad3e9ca3',
    measurementId: 'G-1Y5FQB47PV',
};

const firebaseApp = initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
