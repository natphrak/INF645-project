import { currentUser } from "./auth.js";
import { db } from "./firebaseConfig.js";
import {
collection,
addDoc,
setDoc,
getDocs,
deleteDoc,
updateDoc,
doc,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Add a pet
export async function addPetToFirebase(pet) {
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        console.log("userID: ", userId);
        const userRef = doc(db, "users", userId);
        await setDoc(
        userRef,
        {
            email: currentUser.email,
            name: currentUser.displayName,
        },
        { merge: true }
        );
        const petsRef = collection(userRef, "pets");
        const docRef = await addDoc(petsRef, pet);
        return { id: docRef.id, ...pet };
    } catch (e) {
        console.error("Error adding pet: ", e);
    }
}

export async function getPetsFromFirebase() {
    const pets = [];
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        const petRef = collection(doc(db, "users", userId), "pets");

        const querySnapshot = await getDocs(petRef);
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
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        await deleteDoc(doc(db, "users", userId, "pets", id));
    } catch (e) {
        console.error("Error deleting pet: ", e);
    }
}

export async function updatePetInFirebase(id, updatedData) {
console.log(updatedData, id);
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        const petRef = doc(db, "users", userId, "pets", id);

        await updateDoc(petRef, updatedData);
    } catch (e) {
        console.error("Error updating pet: ", e);
    }
}

export async function deactivateAllPets() {
    try {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        const petRef = doc(db, "users", userId, "pets", id);

        const querySnapshot = await getDocs(petRef);
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
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        const userId = currentUser.uid;
        const petRef = doc(db, "users", userId, "pets", id);

        // Create a query with the where clause
        const q = query(petRef, where("active", "==", true));
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