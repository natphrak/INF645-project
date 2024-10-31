import {openDB} from "https:unpkg.com/idb?module";

document.addEventListener("DOMContentLoaded", function(){
    // Sidenav initialization
    const menus = document.querySelector(".sidenav");
    M.Sidenav.init(menus, { edge: "right" });
    // Add Task
    const forms = document.querySelector(".side-form");
    M.Sidenav.init(forms, { edge: "left" });
})

