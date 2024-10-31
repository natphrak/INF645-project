const APP = {
    SW: null,
    init() {
        // called after DOMContentLoaded
        APP.registerSW();
        document
            .getElementById('newPetForm')
            .addEventListener('submit', APP.savePet);
    },
    registerSW() {
        if ('serviceWorker' in navigator) {
        // Register a service worker hosted at the root of the site
        navigator.serviceWorker.register('./serviceworker.js').then(
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
    },
    savePet(event) {
        event.preventDefault();
        let n = document.getElementById('name');
        let petSpecies = document.getElementById('species').value;
        let petName = n.value.trim();
        if (petName && petSpecies) {
            let pet = {
                id: Date.now(),
                name: petName,
                species: petSpecies,
            };
            console.log('Save', pet);
            // send data to the service worker
            APP.sendMessage({ addPet: pet });
        }
    },
    // call by using APP.sendMessage({ someAction: value });
    sendMessage(msg) {
        //send some structured-cloneable data from the webpage to the sw
        if(navigator.serviceWorker.controller){
            navigator.serviceWorker.controller.postMessage(msg);
        }
    },
    onMessage({ data }) {
        // got a message from the service worker
        console.log('Web page receiving', data);
    },
}

// create indexDB database
async function createDB(params) {
    const db = await openDB("taskManager", 1, {
        upgrade(db) {
            const store = db.createObjectStore("tasks", {
                keyPath: "idk",
                autoIncrement: true,
            });
            store.createIndex("status", "status");
        },
    });
    return db;
}

document.addEventListener('DOMContentLoaded', function(){
    APP.init();
});