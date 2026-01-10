// everything about the camera screen
import { $ } from "../utils/dom.js";
import { SCREENS, showScreen } from "./screens.js";
import { listInspoByGroup } from "../db/inspoStore.js";
import { addCameraPhoto } from "../db/cameraStore.js";
import { getCurrentGroupId, renderGroupDetail } from "./groupDetail.js";
import { openAlbum } from "./album.js";

let stream = null;
let activeOverlayUrl = null;
let facingMode = "environment";

function revokeOverlayUrl() {
  if (activeOverlayUrl && activeOverlayUrl.startsWith("blob:")) {
    URL.revokeObjectURL(activeOverlayUrl);
  }
  activeOverlayUrl = null;
}

//starting the real device camera
async function startCamera() {
  stopCamera();

  //invokes the devices camera
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: false,
  });

  const video = $("cameraVideo");
  video.srcObject = stream;
  await video.play();
}

//stopping real device camera
function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
  stream = null;
}

// showing inspo carousel from indexedDB inspo store
async function renderCarousel(groupId) {
  const wrap = $("cameraCarousel");
  //clear carousel first everytime so it can be re-rendered
  wrap.innerHTML = "";

  //load inspo photos by groupId
  const photos = await listInspoByGroup(groupId);

  // if none, show a lil hint so it doesn't look broken
  if (!photos.length) {
    const msg = document.createElement("div");
    msg.textContent = "no inspo yet !!! add some and they will appear here !";
    msg.style.color = "rgba(255,255,255,0.7)";
    msg.style.fontSize = "14px";
    msg.style.padding = "8px 2px";
    wrap.appendChild(msg);

    // also clear overlay 
    $("cameraOverlay").src = "";
    revokeOverlayUrl();
    return;
  }

  // FIRST ADDED first (oldest -> newest)
  photos.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  const setOverlayFromBlob = (blob) => {
    revokeOverlayUrl();
    activeOverlayUrl = URL.createObjectURL(blob);
    $("cameraOverlay").src = activeOverlayUrl;
  };

  //building each thumbnails
  photos.forEach((p, idx) => {
    const thumb = document.createElement("img");
    //each inspo gets a thumbnail
    thumb.className = "carousel-thumb";
    thumb.alt = "";

    // safety: if blob missing, skip
    if (!p.blob) return;

    //setting the source
    thumb.src = URL.createObjectURL(p.blob);
    //click handler to replace the overlay on the video
    thumb.addEventListener("click", () => {
      wrap.querySelectorAll(".carousel-thumb").forEach((t) =>
        t.classList.remove("is-selected")
      );
      thumb.classList.add("is-selected");
      setOverlayFromBlob(p.blob);
    });

    wrap.appendChild(thumb);

    // Auto-overlay 1st photo  by default
    if (idx === 0) {
      thumb.classList.add("is-selected");
      setOverlayFromBlob(p.blob);
    }
  });
}

//take photo code
async function captureToBlob() {
  const video = $("cameraVideo");
  if (!video.videoWidth) return null;

  //uses the hidden canvas and sets to match video frame
  const canvas = $("captureCanvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  //draws current video frame onto the canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //converts to jpeg blob
  return await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });
}

// call this when user enters the camera screen
export async function openCamera() {
  const groupId = getCurrentGroupId();
  if (!groupId) return;

  showScreen(SCREENS.camera);

  // default opacity mid
  $("opacitySlider").value = "0.5";
  $("cameraOverlay").style.opacity = "0.5";
  $("cameraOverlay").src = "";
  revokeOverlayUrl();

  // try camera, but DO NOT block carousel if it fails
  try {
    await startCamera();
  } catch (err) {
    console.error("Camera blocked:", err);
    // optional: show a friendly hint in the camera area
    const video = $("cameraVideo");
    video.removeAttribute("srcObject");
    // leave the viewport black/empty — carousel will still work
  }

  // carousel should always load
  await renderCarousel(groupId);
}

// call once on app init
export function initCameraScreen() {
  // opacity slider
  $("opacitySlider").addEventListener("input", (e) => {
    $("cameraOverlay").style.opacity = String(e.target.value);
  });

  // shutter
  $("shutterBtn").addEventListener("click", async () => {
    const groupId = getCurrentGroupId();
    if (!groupId) return;

    const blob = await captureToBlob();
    if (!blob) return;

    try {
      await addCameraPhoto(groupId, blob);
      // tiny feedback
      $("shutterBtn").animate(
        [{ transform: "scale(0.95)" }, { transform: "scale(1)" }],
        { duration: 120 }
      );
    } catch (err) {
      console.error(err);
      alert("Could not save photo.");
    }
  });

  // back (bottom-left)
  $("cameraBackBtn").addEventListener("click", async () => {
    stopCamera();
    revokeOverlayUrl();
    showScreen(SCREENS.group);
    await renderGroupDetail();
  });

  // flip camera
  $("cameraFlipBtn").addEventListener("click", async () => {
    facingMode = facingMode === "environment" ? "user" : "environment";
    try {
      await startCamera();
    } catch (err) {
      console.error(err);
      alert("Could not flip camera.");
    }
  });
}
