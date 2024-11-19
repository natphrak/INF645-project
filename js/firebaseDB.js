// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add a pet
export async function addPetToFirebase(pet) {
    try {
        const docRef = await addDoc(collection(db, "pets"), pet);
        return { id: docRef.id, ...pet };
    } catch (e) {
        console.error("Error adding pet: ", e);
    }
}

export async function getPetsFromFirebase() {
    const pets = [];
    try {
        const querySnapshot = await getDocs(collection(db, "pets"));
        querySnapshot.forEach((doc) => {
        pets.push({ id: doc.id, ...doc.data() });
        });
    } catch (e) {
        console.error("Error retrieving pets: ", e);
    }
    return pets;
}

export async function deletePetFromFirebase(id) {
    try {
        await deleteDoc(doc(db, "pets", id));
    } catch (e) {
        console.error("Error deleting pet: ", e);
    }
}

export async function updatePetInFirebase(id, updatedData) {
    console.log(updatedData, id);
    try {
        const petRef = doc(db, "pets", id);
        console.log(petRef);
        await updateDoc(petRef, updatedData);
    } catch (e) {
        console.error("Error updating pet: ", e);
    }
}

export async function deactivateAllPets() {
    try {
        const querySnapshot = await getDocs(collection(db, "pets"));
        querySnapshot.forEach(doc => {
            updateDoc(doc.ref, { active: false });
        })
        console.log('deactivated pets');
    } catch (e) {
        console.error('Error deactivating pets: ', e);
    }
}

export async function getActivePetFromFirebase() {
    try {
        // Create a query with the where clause
        const q = query(collection(db, "pets"), where("active", "==", true));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null; // No active pet found
        }
        const activePetDoc = querySnapshot.docs[0]; // Get the first active pet's DocumentSnapshot
        const activePet = {
            id: activePetDoc.id, // Get the ID from the DocumentSnapshot
            ...activePetDoc.data() // Get the data fields
        };
        return activePet;
    } catch (e) {
        console.error("Error retrieving active pet: ", e);
        return null;
    }
}
