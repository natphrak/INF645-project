# INF645 Project PWA: Your Pet
Your Pet is a web app that allows you to create, play, pet, and clean your own virtual pet.

The website is currently in beta, so to view it is recommended to open the folder in Visual Studio Code, then use Live Server to view.

This websites includes a service worker and a manifest.json, making it capable of working offline. Upon loading a page, the website installs the service worker and begins to cache all necessary files to run the page offline (images, css, HTML pages, JavaScript files). When offline, the service worker will fetch these files from local storage and display them.

The manifest.json will allow users to install the website onto their devices as an app. It contains information such as app name, icons, and theme colors.
