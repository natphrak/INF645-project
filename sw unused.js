// Install event
self.addEventListener("install", event => {
    console.log("Service worker: Installing...");
    event.waitUntil(caches.open(CACHE_NAME).then(cache => {
            console.log("Service worker: Caching files");
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});


// Activate event
self.addEventListener("activate", (event) => {
    console.log("Service Worker: Activating...");
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if(cache !== CACHE_NAME) {
                        console.log("Service Worker: Deleting old Cache");
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});


// Fetch event
self.addEventListener("fetch", (event) => {
    console.log(`MODE: ${ev.request.mode} for ${ev.request.url}`);

    ev. respondWith(
        caches.match(ev.request.then((cachesRes) => {
            return (
                cachesRes ||
                fetch(ev.request.url).then((fetchResponse) => {
                    if (fetchResponse.ok) {
                        return handleFetchResponse(fetchResponse, ev.request);
                    }
                },
                (err) => {
                    // network failure
                    if(ev.request.url.match(/\.html/i)) {
                        return caches.open(staticName).then((cache) => {
                            return cache.match('/404.html');
                        });
                    }
                })
            );
        }))
    );
});

const handleFetchResponse = (fetchResponse, request) => {
    let type = fetchResponse.headers.get('content-type');

    if (type && type.match(/^image\//i)) {
        //save the image in image cache
        console.log(`SAVE ${request.url} in image  cache`);
        return caches.open(imageName).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
        });
    } else {
        console.log(`SAVE ${request.url} in dynamic cache`);
        return caches.open(dynamicName).cache((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
        });
    }
};

