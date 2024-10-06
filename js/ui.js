import {openDB} from "https:unpkg.com/idb?module";

document.addEventListener("DOMContentLoaded", function(){
    // Sidenav initialization
    const menus = document.querySelector(".sidenav");
    M.Sidenav.init(menus, { edge: "right" });
    // Add Task
    const forms = document.querySelector(".side-form");
    M.Sidenav.init(forms, { edge: "left" });

    loadTasks();

    checkStorageUsage();
})

if("serviceWorker" in navigator){
    navigator.serviceWorker
        .register('/serviceworker.js')
        .then((req) => console.log('Service Worker Registered!', req))
        .catch((err) => console.log("Service Worker Registration Failed", err));
    
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



async function checkStorageUsage() {
    if(navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();

        const usageInMB = (usage / (1024 * 1024).toFixed(2));
        const quotaInMB = (quota / (1024 * 1024).toFixed(2));

        console.log(`Storage used: ${usageInMB} MB of ${quotaInMB} MB`);

        // update the UI
        const storageInfo = document.querySelector("#storage-info");
        if (storageInfo) {
            storageInfo.textContent = `Storage used: ${usageInMB} MB of ${quotaInMB} MB`;
        }

        if(usage/quota > 0.8) {
            const storageWarning = document.querySelector("#storage-warning");
            if(storageWarning) {
                storageWarning.textContent = "Warning: You are running low on data";
                storageWarning.style.display = "block";
            } else {
                const storageWarning = document.querySelector("#storage-warning");
                if(storageWarning) {
                    storageWarning.textContent = "";
                    storageWarning.style.display = "none";
                }
            }
        }
    }
}