import { openDB, STORE_CAMERA, withStore } from "./db/db.js";
import { initNavigation } from "./ui/navigation.js";
import { initCreateGroup } from "./ui/createGroup.js";
import { SCREENS, showScreen } from "./ui/screens.js";
import { initCameraScreen } from "./ui/camera.js";
import { initAlbumScreen } from "./ui/album.js";
const MAX_LIFESPAN = 10;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((reg) => {
        reg.update();
      });
  });
}

function blockIOSPinchZoom() {
  const block = (e) => e.preventDefault();

  document.addEventListener("gesturestart", block, { passive: false });
  document.addEventListener("gesturechange", block, { passive: false });
  document.addEventListener("gestureend", block, { passive: false });
}

document.addEventListener("DOMContentLoaded", async () => {
  // ensure DB is ready
  await openDB();
  await ageCameraPhotos();

  initNavigation();
  initCreateGroup();
  initCameraScreen();
  initAlbumScreen();

  showScreen(SCREENS.home);
});

async function ageCameraPhotos() {
  return withStore(STORE_CAMERA, "readwrite", (store) => {
    return new Promise((resolve) => {
      const req = store.getAll();

      req.onsuccess = () => {
        const photos = req.result || [];

        for (const photo of photos) {
          photo.lifespan = (photo.lifespan ?? 0) + 1;

          if (photo.lifespan >= MAX_LIFESPAN) {
            store.delete(photo.id);
          } else {
            store.put(photo);
          }
        }

        resolve();
      };
    });
  });
}
