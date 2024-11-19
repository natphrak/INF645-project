const version = 2;

let staticName = `staticCache-${version}`;
let dynamicName = `dynamicCache`;
let imageName = `imageCache-${version}`;
let options = {
    ignoreSearch: false,
    ignoreMethod: false,
    ignoreVary: false,
};

let assets = [
    '/',
    '/index.html',
    '/404.html',
    '/manifest.json',
    '/js/app.js',
    '/js/materialize.js',
    '/css/materialize.css',
    '/pages/about.html',
    '/pages/pets.html',
    'https://fonts.googleapis.com/icon?family=Material+Icons'
];

let imageAssets = [
    '/img/pet.png',
    '/img/hungry.png',
    '/img/404.png'
];

// Install event, installs service worker
self.addEventListener('install', (event) => {
    // service worker has been installed.
    //Extendable Event
    console.log(`Version ${version} installed`);
    // build a cache
    event.waitUntil(
    caches.open(staticName)
        .then((cache) => {
        cache.addAll(assets).then(
            () => {
            //addAll == fetch() + put()
            console.log(`${staticName} has been updated.`);
            },
            (err) => {
            console.warn(`failed to update ${staticName}.`);
            }
        );
        })
        .then(() => {
        caches.open(imageName)
            .then((cache) => {
                cache.addAll(imageAssets).then(
                () => {
                    console.log(`${imageName} has been updated.`);
                },
                (err) => {
                    console.warn(`failed to update ${staticName}.`);
                }
                );
            });
        })
    );
});

// Activates
self.addEventListener('activate', (event) => {
    // when the service worker has been activated to replace an old one.
    //Extendable Event
    console.log('activated');
    // delete old versions of caches.
    event.waitUntil(
    caches.keys().then((keys) => {
        return Promise.all(
        keys
            .filter((key) => {
            if (key != staticName && key != imageName) {
                return true;
            }
            })
            .map((key) => caches.delete(key))
        ).then((empties) => {
        //empties is an Array of boolean values.
        //one for each cache deleted
        });
    })
    );
});

// Fetch
// checks the  cache and then does a fetch if missing
// Fetch event
self.addEventListener('fetch', (event) => {
    // Extendable Event.
    console.log(`MODE: ${event.request.mode} for ${event.request.url}`);

    event.respondWith(
    caches.match(event.request).then((cacheRes) => {
        return (
        cacheRes ||
        Promise.resolve().then(() => {
            let opts = {
            mode: event.request.mode, //cors, no-cors, same-origin, navigate
            cache: 'no-cache',
            };
            if (!event.request.url.startsWith(location.origin)) {
            //not on the same domain as my html file
            opts.mode = 'cors';
            opts.credentials = 'omit';
            }
            return fetch(event.request.url, opts).then(
            (fetchResponse) => {
                //we got a response from the server.
                if (fetchResponse.ok) {
                return handleFetchResponse(fetchResponse, event.request);
                }
                //not ok 404 error
                if (fetchResponse.status == 404) {
                if (event.request.url.match(/\.html/i)) {
                    return caches.open(staticName).then((cache) => {
                    return cache.match('/404.html');
                    });
                }
                if (
                    event.request.url.match(/\.jpg$/i) ||
                    event.request.url.match(/\.png$/i)
                ) {
                    return caches.open(imageName).then((cache) => {
                    return cache.match('./img/404.png');
                    });
                }
                }
            },
            (err) => {
                //this is the network failure
                //return the 404.html file if it is a request for an html file
                if (event.request.url.match(/\.html/i)) {
                return caches.open(staticName).then((cache) => {
                    return cache.match('./404.html');
                });
                }
            }
            );
            //.catch()
        })
        );
    }) //end of match().then()
    ); //end of respondWith
}); //end of fetch listener

const handleFetchResponse = (fetchResponse, request) => {
    let type = fetchResponse.headers.get('content-type');
    // console.log('handle request for', type, request.url);
    if (type && type.match(/^image\//i)) {
    //save the image in image cache
    console.log(`SAVED ${request.url} in image cache`);
    return caches.open(imageName).then((cache) => {
        cache.put(request, fetchResponse.clone());
        return fetchResponse;
    });
    } else {
    //save in dynamic cache - html, css, fonts, js, etc
    console.log(`SAVED ${request.url} in dynamic cache`);
    return caches.open(dynamicName).then((cache) => {
        cache.put(request, fetchResponse.clone());
        return fetchResponse;
    });
    }
};

// Message from web page event.data
self.addEventListener('message', (event) => {
    let data = event.data;
    // console.log({ ev });
    let clientId = event.source.id;
    console.log('Service Worker received', data, clientId);
    if('addPerson' in data) {
        let msg = 'thnx';
        sendMessage({
            code: 0,
            message: msg,
        }, clientId);
    }
    if('otherAction' in data) {
        let msg = 'hi';
        sendMessage(msg);
    }
});

const sendMessage = async (msg, clientId) => {
    let allClients = [];
    if(clientId) {
        let client = await allClients.get(clientId);
        allClients.push(client);
    } else {
        allClients = await allClients.matchAll({includeUncontrolled:true});
    }
    return Promise.all(
        allClients.map(client => {
            console.log('postMessage', msg, 'to', client.id);
            returnclient.postMessage(msg);
        })
    )
}