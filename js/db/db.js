export const DB_NAME = "framieDB";
export const DB_VERSION = 3;

export const STORE_GROUPS = "groups";
export const STORE_INSPO = "inspoPhotos";
export const STORE_CAMERA = "cameraPhotos";

// ask browser to open the database
export function openDB() { 
  return new Promise((resolve, reject) => {
    //open the database called framieDB in a returned request
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    
    // first time setup so runs when the DB is brand new (or updated maybe)
    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // groups store
      if (!db.objectStoreNames.contains(STORE_GROUPS)) {
        // fast loopup path based on this field
        const store = db.createObjectStore(STORE_GROUPS, { keyPath: "id" }); //each group obj must have an id whoch is the PK
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("nameLower", "nameLower", { unique: true }); // prevents duplicate names by checkign its lowercase vers
      }

      // inspo photos store
      if (!db.objectStoreNames.contains(STORE_INSPO)) {
        const store = db.createObjectStore(STORE_INSPO, {keyPath : "id"});
        store.createIndex("groupId", "groupId", {unique: false});
        store.createIndex("createdAt", "createdAt", {unique: false});
      }

      // camera photos store
      if (!db.objectStoreNames.contains(STORE_CAMERA)){
        const store = db.createObjectStore(STORE_CAMERA, {keyPath: "id"});
        store.createIndex("groupId", "groupId", {unique: false});
        store.createIndex("createdAt", "createdAt", {unique: false});
      }
    };

    //database opened, return the DB connection
    req.onsuccess = () => resolve(req.result);
    //smth ffailed, reject so you can catch it 
    req.onerror = () => reject(req.error);
  });
}

export async function withStore(storeName, mode, fn) {
        // open framie db
    const db = await openDB();

    // perform every read/write inside a controlled transaction
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const result = fn(store);

        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}
