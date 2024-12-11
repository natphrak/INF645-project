import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAPmDiR8aVnm_4exKevNqOYREaGNopxpPc",
    authDomain: "your-pet-aae02.firebaseapp.com",
    projectId: "your-pet-aae02",
    storageBucket: "your-pet-aae02.firebasestorage.app",
    messagingSenderId: "793576239399",
    appId: "1:793576239399:web:ad86587c866e15ba5fb902",
    measurementId: "G-Q7HTPMND9W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

export { db, auth, messaging, getToken, onMessage };