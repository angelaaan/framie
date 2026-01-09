import { $ } from "../utils/dom.js";
import { listGroups, getGroup, deleteGroup } from "../db/groupsStore.js";
import { showScreen, SCREENS } from "./screens.js";
import { openGroup } from "./groupDetail.js";

export async function renderGroups() {
    // grabbing DOM elements
    const list = $("groupsList");
    const emptyHint = $("emptyHint"); //no groups yet msg

    // clearing the list which wipes the existing buttons to prevent dupes
    // makes re-rendering safe
    list.innerHTML = "";

    // rendering waits for the data before touching the ODM
    const groups = await listGroups();
    //empty state handling
    if (!groups.length) { // if no groups
        emptyHint.classList.remove("hidden");
        return;
    } // stop rendering 
    emptyHint.classList.add("hidden");

    // sort by newest first
    groups.sort((a, b) => b.createdAt - a.createdAt);

    //loop thru the groups
    for (const g of groups) {
        // create each group card
        const card = document.createElement("button");
        //defines the 
        card.type = "button"; //semantics
        card.className = "groupCard"; //styling
        card.innerHTML = `<span>${g.name}</span>`; //g.name

        //long press to show the delete option
        let pressTimer = null;
        let didLongPress = false;

        // starting the long press
        const startPress = () => {
            didLongPress = false;
            pressTimer = window.setTimeout(async () => {
                didLongPress = true;

                //confirm + delete logic
                const ok = confirm(`Delete group "${g.name}"? This can't be undone.`);
                if (!ok) return;
                //try catch lock
                try {
                    await deleteGroup(g.id); //removes from indexedDB
                    await renderGroups();
                } catch (err) {
                    console.error(err);
                    alert("Something went wrong deleting the group.");
                }
            }, 550); // long-press threshold (ms)
        };

        //prevents accidental deletes if user lets go early/moves finger away.cancels touch
        const cancelPress = () => {
            if (pressTimer) window.clearTimeout(pressTimer);
            pressTimer = null;
        };

        // Pointer events work great for mouse + touch
        card.addEventListener("pointerdown", (e) => {
            // only primary press
            if (e.button !== undefined && e.button !== 0) return;
            card.setPointerCapture?.(e.pointerId);
            startPress();
        });

        //time the hold
        card.addEventListener("pointerup", cancelPress);
        card.addEventListener("pointercancel", cancelPress);
        card.addEventListener("pointerleave", cancelPress);

        // Normal tap = open group (but NOT if a long-press already happened)
        card.addEventListener("click", () => {
            if (didLongPress) return; // prevents the click after long press
            openGroup(g.id);
        });

        list.appendChild(card);
  }
}