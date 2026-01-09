import { $ } from "../utils/dom.js";
import { SCREENS, showScreen } from "./screens.js";
import { listInspoByGroup, deleteInspo } from "../db/inspoStore.js";
import { getGroup } from "../db/groupsStore.js"; 

//used to keep track of which group is actually open so opening a group card sets it
let currentGroupId = null;

// set groupID to current group
export function getCurrentGroupId() {
  return currentGroupId;
}

export async function openGroup(groupId) {
  currentGroupId = groupId;
  showScreen(SCREENS.group);
  await renderGroupDetail();
}

// rendering the photos 
export async function renderGroupDetail() {
  const title = $("groupTitle");
  const grid = $("inspoGrid");
  const emptyHint = $("emptyInspoHint");

  //clears the grid
  grid.innerHTML = "";

  //loads group info
  const group = await getGroup(currentGroupId);
  title.textContent = group.name;

  //load that groups photos
  const photos = await listInspoByGroup(currentGroupId);
  photos.sort((a, b) => b.createdAt - a.createdAt);

  //if not photos show hint
  if (!photos.length) {
    emptyHint.classList.remove("hidden");
    return;
  }
  emptyHint.classList.add("hidden");

  //otherwise for each photo create button and show img
  for (const p of photos) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "inspoCard";

    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "10px";

    // create a temporary URL for the blob
    const url = URL.createObjectURL(p.blob);
    img.src = url;
    img.onload = () => URL.revokeObjectURL(url);

    tile.appendChild(img);

    // long-hold delete
    let pressTimer = null;
    let didLongPress = false;

    const startPress = () => {
      didLongPress = false;
      pressTimer = window.setTimeout(async () => {
        didLongPress = true;
        const ok = confirm("Delete this inspo photo?");
        if (!ok) return;

        try {
          await deleteInspo(p.id);
          await renderGroupDetail();
        } catch (err) {
          console.error(err);
          alert("Could not delete photo.");
        }
      }, 550);
    };

    const cancelPress = () => {
      if (pressTimer) window.clearTimeout(pressTimer);
      pressTimer = null;
    };

    tile.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      tile.setPointerCapture?.(e.pointerId);
      startPress();
    });
    tile.addEventListener("pointerup", cancelPress);
    tile.addEventListener("pointercancel", cancelPress);
    tile.addEventListener("pointerleave", cancelPress);

    tile.addEventListener("click", () => {
      if (didLongPress) return;
      // later: open preview modal
    });

    grid.appendChild(tile);
  }
}
