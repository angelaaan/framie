import { STORE_GROUPS, withStore } from "./db.js";

export function listGroups() {
  // opens the db and starts a read only transaction 
  // gives access to the groups store
  return withStore(STORE_GROUPS, "readonly", (store) => {
    // wrapping getall in a promise si req.result becomes the array of groups
    return new Promise((resolve, reject) => {
        //gets all rows in teh group store
        const req = store.getAll(); 
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
  });
}

export function addGroup(name) {
    const now = Date.now();
    // a normal js object 
    const group = {
        id: crypto.randomUUID(),
        name,
        nameLower: name.toLowerCase(),
        createdAt: now,
    };

    // get the write access to change the database
    return withStore(STORE_GROUPS, "readwrite", (store) => {
        return new Promise((resolve, reject) => {
        // add group to the database
        const req = store.add(group);
        req.onsuccess = () => resolve(group);
        req.onerror = () => reject(req.error);
        });
    });
}

export function deleteGroup(groupId) {
  return withStore(STORE_GROUPS, "readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(groupId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}
