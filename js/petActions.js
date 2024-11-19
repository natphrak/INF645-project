import { openDB } from "https:unpkg.com/idb?module";
import {
    updatePetInFirebase,
    getActivePetFromFirebase,
} from "./firebaseDB.js";

let dbPromise;

async function getDB() {
    if (!dbPromise) {
        dbPromise = openDB("petManager", 1, {
            upgrade(db) {
                const store = db.createObjectStore("pets", {
                    keyPath: "id",
                    autoIncrement: true,
                });
                store.createIndex("status", "status");
                store.createIndex("synced", "synced");
            },
        });
    }
    return dbPromise;
}


// --- MAIN GAME ---
// Displays active pet
async function displayActivePet() {
    const activePet = await getActivePetFromFirebase(); // Get the active pet from Firebase
    console.log(activePet);

    if (activePet) {
        // Update the HTML elements with the active pet's data
        const petNameElement = document.getElementById('pet-name');
        const petImageElement = document.querySelector('#pet-info img');

        petNameElement.textContent = activePet.name;
        petImageElement.src = `img/${activePet.species}.png`;
    } else {
        console.log("No active pet found.");
        petNameElement.textContent = 'No active pet.';
    }
}

async function handleFeed() {
    const activePet = await getActivePetFromFirebase();
    if (activePet) {
        const petId = activePet.id;
        const updatedData = {
            food: activePet.food + 1
        };

        // Store data in IndexedDB
        await storePetInIndexedDB(petId, updatedData);

        const log = document.getElementById('pet-log');
        log.innerHTML += `<p>You fed ${activePet.name}.</p>`

        displayActivePet();
    }
}

async function handleClean() {
    const activePet = await getActivePetFromFirebase();
    if (activePet) {
        const petId = activePet.id;
        const updatedData = {
            clean: activePet.clean + 1
        };
        
        // Store data in IndexedDB
        await storePetInIndexedDB(petId, updatedData);

        const log = document.getElementById('pet-log');
        log.innerHTML += `<p>You brushed ${activePet.name}.</p>`

        await displayActivePet();
    }
}

async function handlePlay() {
    const activePet = await getActivePetFromFirebase();
    if (activePet) {
        const petId = activePet.id;
        const updatedData = {
            play: activePet.play + 1
        };
        
        // Store data in IndexedDB
        await storePetInIndexedDB(petId, updatedData);

        const log = document.getElementById('pet-log');
        log.innerHTML += `<p>You and ${activePet.name} played together.</p>`

        await displayActivePet();
    }
}

async function storePetInIndexedDB(petId, updatedData) {
    const db = await getDB();
    const tx = db.transaction("pets", "readwrite");
    const store = tx.objectStore("pets");
    await store.put({ ...updatedData, id: petId, synced: false });
    await tx.done;
}

async function syncPets() {
    const db = await getDB();
    const tx = db.transaction("pets", "readonly");
    const store = tx.objectStore("pets");
    const pets = await store.getAll();
    await tx.done;

    for (const pet of pets) {
        if (!pet.synced && isOnline()) {
            try {
                await updatePetInFirebase(pet.id, pet);
                // Update the synced flag in IndexedDB
                const txUpdate = db.transaction("pets", "readwrite");
                const storeUpdate = txUpdate.objectStore("pets");
                await storeUpdate.put({ ...pet, synced: true }); // Update the synced flag
                await txUpdate.done;
            } catch (error) {
                console.error("Error syncing pet:", error);
            }
        }
    }
}

function isOnline() {
    return navigator.onLine;
}

window.addEventListener('online', syncPets);

document.addEventListener('DOMContentLoaded', () => {
    displayActivePet();

    const feedButton = document.querySelector('.pet-buttons #feed');
    const cleanButton = document.querySelector('.pet-buttons #clean');
    const playButton = document.querySelector('.pet-buttons #play');

    feedButton.addEventListener('click', handleFeed);
    cleanButton.addEventListener('click', handleClean);
    playButton.addEventListener('click', handlePlay);
})