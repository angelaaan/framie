//database api for inspo photos
import { STORE_INSPO, withStore } from "./db.js";

//input current group id + files picked from camera roll
export function addInspoFiles(groupId, files) {
  const now = Date.now();
  const arr = Array.from(files || []);

  return withStore(STORE_INSPO, "readwrite", (store) => {
    //returns promise when all files are saved
    return Promise.all(
        //loops each file and store.add(record) into IndexedDB
      arr.map(
        (file, i) =>
        
            //every inspo is owned by a groupId
          new Promise((resolve, reject) => {
            const record = {
              id: crypto.randomUUID(),
              groupId,
              createdAt: now + i,
              blob: file, // File is a Blob, IndexedDB can store it
              mime: file.type,
              name: file.name,
            };

            const req = store.add(record);
            req.onsuccess = () => resolve(record);
            req.onerror = () => reject(req.error);
          })
      )
    );
  });
}

// fetches all the photos already in that group
export function listInspoByGroup(groupId) {
  return withStore(STORE_INSPO, "readonly", (store) => {
    return new Promise((resolve, reject) => {
      const idx = store.index("groupId");
      const req = idx.getAll(IDBKeyRange.only(groupId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

//input photo id to delete record from the store
export function deleteInspo(id) {
  return withStore(STORE_INSPO, "readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}
