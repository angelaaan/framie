// database api to store photos taken by user
// almost the same as inspoStore
import { STORE_CAMERA, withStore } from "./db.js";

export function addCameraPhoto(groupId, blob) {
  const record = {
    id: crypto.randomUUID(),
    groupId,
    createdAt: Date.now(),
    blob,
    mime: blob.type || "image/jpeg",
  };

  return withStore(STORE_CAMERA, "readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.add(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  });
}

export function listCameraPhotosByGroup(groupId) {
  return withStore(STORE_CAMERA, "readonly", (store) => {
    return new Promise((resolve, reject) => {
      const idx = store.index("groupId");
      const req = idx.getAll(IDBKeyRange.only(groupId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

export function deleteCameraPhoto(id) {
  return withStore(STORE_CAMERA, "readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}
