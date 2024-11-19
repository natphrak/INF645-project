import { openDB } from "https:unpkg.com/idb?module";
import {
    addPetToFirebase,
    getPetsFromFirebase,
    deletePetFromFirebase,
    updatePetInFirebase,
    deactivateAllPets,
    getActivePetFromFirebase,
} from "./firebaseDB.js";

const STORAGE_THRESHOLD = 0.8;

const APP = {
    SW: null,
    init() {
        // called after DOMContentLoaded
        APP.registerSW();
        document
            .getElementById('newPetForm')
            .addEventListener('submit', APP.savePet);
    },
    // Register Servie Worker
    registerSW() {
        if ('serviceWorker' in navigator) {
        // Register a service worker hosted at the root of the site
        navigator.serviceWorker.register('/serviceworker.js').then(
            (registration) => {
            APP.SW =
                registration.installing ||
                registration.waiting ||
                registration.active;
            },
            (error) => {
            console.log('Service worker registration failed:', error);
            }
        );
        // listen for the latest service worker
        navigator.serviceWorker.addEventListener('controllerchange', async () => {
            APP.SW = navigator.serviceWorker.controller;
        });
        // listen for message sfrom the service worker
        navigator.serviceWorker.addEventListener('message', APP.onMessage);

        } else {
        console.log('Service workers are not supported.');
        }
    }
}

// --- Database ---

// Create or get IndexedDB database
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

// Sync unsynced pets from IndexedDB to Firebase
async function syncPets() {
const db = await getDB();
const tx = db.transaction("pets", "readonly");
const store = tx.objectStore("pets");
const pets = await store.getAll();
await tx.done;

for (const pet of pets) {
    if (!pet.synced && isOnline()) {
    try {
        const petToSync = {
        name: pet.name,
        species: pet.species,
        food: pet.food,
        clean: pet.clean,
        play: pet.play,
        status: pet.status,
        };
        const savedPet = await addPetToFirebase(petToSync);
        const txUpdate = db.transaction("pets", "readwrite");
        const storeUpdate = txUpdate.objectStore("pets");
        await storeUpdate.delete(pet.id);
        await storeUpdate.put({ ...pet, id: savedPet.id, synced: true });
        await txUpdate.done;
    } catch (error) {
        console.error("Error syncing pet:", error);
    }
    }
}
}

// Check if the app is online
function isOnline() {
return navigator.onLine;
}

// --- PET MANAGEMENT ---

// Add Pet (to Firebase or IndexedDB)
async function addPet(pet) {
const db = await getDB();
let petId;

if (isOnline()) {
    try {
    const savedPet = await addPetToFirebase(pet);
    petId = savedPet.id;
    const tx = db.transaction("pets", "readwrite");
    const store = tx.objectStore("pets");
    await store.put({ ...pet, id: petId, synced: true });
    await tx.done;
    } catch (error) {
    console.error("Error adding pet to Firebase:", error);
    }
} else {
    petId = `temp-${Date.now()}`;
    const petToStore = { ...pet, id: petId, synced: false };
    const tx = db.transaction("pets", "readwrite");
    const store = tx.objectStore("pets");
    await store.put(petToStore);
    await tx.done;
}

checkStorageUsage();
    return { ...pet, id: petId };
}

// Edit Pet with Transaction
async function editPet(id, updatedData) {
    if (!id) {
        console.error("Invalid ID passed to editPet.");
        return;
    }

    const db = await getDB();

    if (isOnline()) {
        try {
        await updatePetInFirebase(id, updatedData);
        // Update in IndexedDB as well
        const tx = db.transaction("pets", "readwrite");
        const store = tx.objectStore("pets");
        await store.put({ ...updatedData, id: id, synced: true });
        await tx.done;

        // Reload the entire pet list to reflect the updates
        loadPets(); // Call loadPets here to refresh the UI
        } catch (error) {
        console.error("Error updating pet in Firebase:", error);
        }
    } else {
        // If offline, make an IndexedDB transaction
        const tx = db.transaction("pets", "readwrite");
        const store = tx.objectStore("pets");
        await store.put({ ...updatedData, id: id, synced: false });
        await tx.done;
        loadPets(); // Refresh the UI with loadPets here as well
    }
}

// Delete Pet with Transaction
async function deletePet(id) {
    if (!id) {
        console.error("Invalid ID passed to deletePet.");
        return;
    }
    const db = await getDB();
    if (isOnline()) {
        try {
        await deletePetFromFirebase(id);
        } catch (error) {
        console.error("Error deleting pet from Firebase:", error);
        }
    }

    const tx = db.transaction("pets", "readwrite");
    const store = tx.objectStore("pets");
    try {
        await store.delete(id);
    } catch (e) {
        console.error("Error deleting pet from IndexedDB:", e);
    }
    await tx.done;

    const petCard = document.querySelector(`[data-id="${id}"]`);
    if (petCard) {
        petCard.remove();
    }
    checkStorageUsage();
}

async function makeActive(id, active) {
    if (!id) {
        console.error("Invalid ID passed to editPet.");
        return;
    }
    if (active) {
        alert("Already active.");
        return;
    }

    const db = await getDB();

    const updatedData = {
        active: true
    };

    async function update() {
        if (isOnline()) {
            try {
            await updatePetInFirebase(id, updatedData);
            // Update in IndexedDB as well
            const tx = db.transaction("pets", "readwrite");
            const store = tx.objectStore("pets");
            await store.put({ ...updatedData, id: id, synced: true });
            await tx.done;
    
            // Reload the entire pet list to reflect the updates
            loadPets(); // Call loadPets here to refresh the UI
            } catch (error) {
            console.error("Error updating pet in Firebase:", error);
            }
        } else {
            // If offline, make an IndexedDB transaction
            const tx = db.transaction("pets", "readwrite");
            const store = tx.objectStore("pets");
            await store.put({ ...updatedData, id: id, synced: false });
            await tx.done;
            loadPets(); // Refresh the UI with loadPets here as well
        }
    }

    deactivateAllPets().then(update);
}

// --- UI Functions ---
// Load pets and sync with Firebase if online
export async function loadPets() {
    const db = await getDB();
    const petContainer = document.querySelector(".pets");
    petContainer.innerHTML = "";

    if (isOnline()) {
        const firebasePets = await getPetsFromFirebase();
        const tx = db.transaction("pets", "readwrite");
        const store = tx.objectStore("pets");

        for (const pet of firebasePets) {
        await store.put({ ...pet, synced: true });
        displayPet(pet);
        }
        await tx.done;
    } else {
        const tx = db.transaction("pets", "readonly");
        const store = tx.objectStore("pets");
        const pets = await store.getAll();
        pets.forEach((pet) => {
        displayPet(pet);
        });
        await tx.done;
    }
}

// Display Pet in the UI
function displayPet(pet) {
    const petContainer = document.querySelector(".pets");

    // Check if the pet already exists in the UI and remove it
    const existingPet = petContainer.querySelector(`[data-id="${pet.id}"]`);
    if (existingPet) {
        existingPet.remove();
    }

    // Create new pet HTML and add it to the container
    const html = `
    <div class="card-panel row valign-wrapper white" data-id="${pet.id}">
        <div class="col s10">
            <h5 class="pet-name red-text text-lighten-2">${pet.name}</h5>
            <div class="grey-text text-darken-2">
            <p>
                    Active: ${pet.active}
                </p>
                <p>
                    Species: ${pet.species}
                </p>
                <p>
                    Times fed: ${pet.food}
                </p>
                <p>
                    Times cleaned: ${pet.clean}
                </p>
                <p>
                    Times played with: ${pet.play}
                </p>
            </div>
        </div>
            <div class="col s2 right-align">
            <button class="pet-active btn-flat" aria-label="Make active">
            <i class="material-icons black-text text-darken-1" style="font-size: 30px">star</i>
            </button>
            <button class="pet-delete btn-flat" aria-label="Delete pet">
            <i class="material-icons black-text text-darken-1" style="font-size: 30px">delete</i>
            </button>
            <button class="pet-edit btn-flat" data-target="side-form" aria-label="Edit pet">
            <i class="material-icons black-text text-darken-1" style="font-size: 30px">edit</i>
            </button>
        </div>
    </div>
    `;
    petContainer.insertAdjacentHTML("beforeend", html);

    const activeButton = petContainer.querySelector(`[data-id="${pet.id}"] .pet-active`);
    activeButton.addEventListener("click", () => makeActive(pet.id, pet.active));

    const deleteButton = petContainer.querySelector(
        `[data-id="${pet.id}"] .pet-delete`
    );
    deleteButton.addEventListener("click", () => deletePet(pet.id));

    const editButton = petContainer.querySelector(
        `[data-id="${pet.id}"] .pet-edit`
    );
    editButton.addEventListener("click", () => {
        console.log('edit button pressed');
        console.log(`${pet.id} ${pet.name} ${pet.species}`);
        openEditForm(pet.id, pet.name, pet.species);
        
        }
    );
}



// Add/Edit Pet Button Listener
const addPetButton = document.querySelector("#form-action-btn");
addPetButton.addEventListener("click", async () => {
    let petName = document.getElementById('name');
    let petSpecies = document.getElementById('species');

    const petIdInput = document.querySelector("#pet-id");
    const formActionButton = document.querySelector("#form-action-btn");
    // Prepare the pet data
    const petId = petIdInput.value; // If editing, this will have a value
    const petData = {
        active: false,
        name: petName.value,
        species: petSpecies.value,
        food: 0,
        clean: 0,
        play: 0,
        status: "pending",
    };
    if (!petId) {
        // If no petId, we are adding a new pet
        const savedPet = await addPet(petData);
        displayPet(savedPet); // Display new pet in the UI
    } else {
        // If petId exists, we are editing an existing pet
        await editPet(petId, petData); // Edit pet in Firebase and IndexedDB
        loadPets(); // Refresh pet list to show updated data
    }
    // Reset the button text and close the form
    formActionButton.textContent = "Add";
    closeForm();
});

// Open Edit Form with Existing Pet Data
function openEditForm(id, name, species) {
    let petName  = document.getElementById('name');
    let petSpecies = document.getElementById('species');
    const petIdInput = document.querySelector("#pet-id");
    const formActionButton = document.querySelector("#form-action-btn");

    // Fill in the form with existing pet data
    petName.value = name;
    petSpecies.value = species;
    petIdInput.value = id; // Set petId for the edit operation
    formActionButton.textContent = "Edit"; // Change the button text to "Edit"

    //M.updateTextFields(); // not working for some reason

    // Open the side form
    const forms = document.querySelector(".side-form");
    const instance = M.Sidenav.getInstance(forms);
    instance.open();
}

// Helper function to reset the form after use
function closeForm() {
    let petName = document.getElementById('name');
    let petSpecies = document.getElementById('species');
    const petIdInput = document.querySelector("#pet-id");
    const formActionButton = document.querySelector("#form-action-btn");
    petName.value = "";
    petSpecies.value = "";
    petIdInput.value = "";
    formActionButton.textContent = "Add";
    const forms = document.querySelector(".side-form");
    const instance = M.Sidenav.getInstance(forms);
    instance.close();
}

// Check storage usage and display warnings
async function checkStorageUsage() {
if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    const usageInMB = (usage / (1024 * 1024)).toFixed(2);
    const quotaInMB = (quota / (1024 * 1024)).toFixed(2);
    console.log(`Storage used: ${usageInMB} MB of ${quotaInMB} MB`);

    const storageInfo = document.querySelector("#storage-info");
    if (storageInfo) {
    storageInfo.textContent = `Storage used: ${usageInMB} MB of ${quotaInMB} MB`;
    }

    const storageWarning = document.querySelector("#storage-warning");
    if (usage / quota > STORAGE_THRESHOLD) {
    if (storageWarning) {
        storageWarning.textContent = "Warning: Running low on storage space.";
        storageWarning.style.display = "block";
    }
    } else if (storageWarning) {
    storageWarning.textContent = "";
    storageWarning.style.display = "none";
    }
}
}

// Request persistent storage
async function requestPersistentStorage() {
if (navigator.storage && navigator.storage.persist) {
    const isPersistent = await navigator.storage.persist();
    console.log(`Persistent storage granted: ${isPersistent}`);

    const storageMessage = document.querySelector("#persistent-storage-info");
    if (storageMessage) {
    storageMessage.textContent = isPersistent
        ? "Persistent storage granted!"
        : "Data might be cleared under storage pressure.";
    storageMessage.classList.toggle("green-text", isPersistent);
    storageMessage.classList.toggle("red-text", !isPersistent);
    }
}
}

document.addEventListener('DOMContentLoaded', function(){
    APP.init();

    // Sidenav initialization
    const menus = document.querySelector(".sidenav");
    M.Sidenav.init(menus, { edge: "right" });
    // Add Task
    const forms = document.querySelector(".side-form");
    M.Sidenav.init(forms, { edge: "left" });

    loadPets();
    syncPets();
    checkStorageUsage();
    requestPersistentStorage();
});