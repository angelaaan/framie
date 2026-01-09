import { STORE_INSPO, withStore } from "./db.js";

//
export function addInspoFiles(groupId, files) {
  const now = Date.now();
  const arr = Array.from(files || []);

  return withStore(STORE_INSPO, "readwrite", (store) => {
    return Promise.all(
      arr.map(
        (file, i) =>
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

// 
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

//
export function deleteInspo(id) {
  return withStore(STORE_INSPO, "readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}
