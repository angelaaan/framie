// ui/album.js
// album screen: shows all photos the user has taken (across all groups)
// tap a tile -> full-screen viewer + "save to gallery" button

import { $ } from "../utils/dom.js";
import { SCREENS, showScreen } from "./screens.js";
import { STORE_CAMERA, withStore } from "../db/db.js";

let currentViewerUrl = null;
let currentPhoto = null;

// keep track of thumb URLs so we can revoke them on re-render
let activeThumbUrls = [];

function revokeThumbUrls() {
  for (const url of activeThumbUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
  activeThumbUrls = [];
}

function revokeViewerUrl() {
  if (currentViewerUrl) {
    try {
      URL.revokeObjectURL(currentViewerUrl);
    } catch {}
  }
  currentViewerUrl = null;
}

async function listAllCameraPhotos() {
  return withStore(STORE_CAMERA, "readonly", (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

function openViewer(photo) {
  const viewer = $("albumViewer");
  const img = $("viewerImg");

  currentPhoto = photo;

  revokeViewerUrl();
  currentViewerUrl = URL.createObjectURL(photo.blob);

  img.src = currentViewerUrl;
  img.alt = "";

  viewer.classList.remove("hidden");
}

function closeViewer() {
  $("albumViewer").classList.add("hidden");
  $("viewerImg").src = "";
  revokeViewerUrl();
  currentPhoto = null;
}

async function saveCurrentToGallery() {
  if (!currentPhoto?.blob) return;

  // best-effort "save": download link (works on most browsers),
  // iOS/PWA may open a preview instead — user can then Save/Share from there.
  const blobUrl = URL.createObjectURL(currentPhoto.blob);
  const filename = `framie_${currentPhoto.createdAt || Date.now()}.jpg`;

  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // fallback: if download is blocked, open in a new tab
    // (some iOS cases ignore download attribute)
    setTimeout(() => {
      try {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      } catch {}
    }, 250);
  } finally {
    // let the navigation happen first, then cleanup
    setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }, 3000);
  }
}

export async function renderAlbum() {
  const grid = $("albumGrid");
  const emptyHint = $("emptyAlbumHint");

  if (!grid) return;

  // clear
  revokeThumbUrls();
  grid.innerHTML = "";

  let photos = [];
  try {
    photos = await listAllCameraPhotos();
  } catch (err) {
    console.error(err);
    alert("Could not load album photos.");
    return;
  }

  // newest first
  photos.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  if (!photos.length) {
    emptyHint?.classList.remove("hidden");
    return;
  }
  emptyHint?.classList.add("hidden");

  for (const p of photos) {
    if (!p?.blob) continue;

    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "inspoCard"; // re-use your existing grid tile styling

    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";

    const url = URL.createObjectURL(p.blob);
    activeThumbUrls.push(url);
    img.src = url;

    tile.appendChild(img);

    tile.addEventListener("click", () => openViewer(p));

    grid.appendChild(tile);
  }
}

export async function openAlbum() {
  showScreen(SCREENS.album);
  closeViewer();
  await renderAlbum();
}

export function initAlbumScreen() {
  // back to home from album (if your HTML has this id)
  const backBtn = $("backToHomeFromAlbum");
  backBtn?.addEventListener("click", () => {
    closeViewer();
    showScreen(SCREENS.home);
  });

  // viewer close
  $("closeViewer")?.addEventListener("click", closeViewer);

  // save
  $("saveToGalleryBtn")?.addEventListener("click", saveCurrentToGallery);
}
