import { $ } from "../utils/dom.js";
import { SCREENS, showScreen } from "./screens.js";
import { renderGroups } from "./groups.js";

export function initNavigation() {
    //what happens when user clicks [inspo] button from landing page
    $("goInspo").addEventListener("click", async () => {
        showScreen(SCREENS.inspo);
        await renderGroups();
    });

    //what happens when user clicks [album] button from landing page
    $("goAlbum").addEventListener("click", () => {
        alert("Album page next after groups !!!"); // TO DO !! ADD ALBUM PAGE
    });

    // what happens when user clicks the back button to go to home page
    $("backHome").addEventListener("click", () => {
        showScreen(SCREENS.home);
    });

    // clickign the + in the groups page
    $("newGroup").addEventListener("click", () => {
        showScreen(SCREENS.create);
        $("groupName").value = "";
        $("createGroupBtn").disabled = true;
        $("groupName").focus();
    });

    // clicking the back button to go back to inspo groups
    $("backToInspo").addEventListener("click", async () => {
        showScreen(SCREENS.inspo);
        await renderGroups();
    });

    // clicking to go back to the inspo groups
    $("backToGroups").addEventListener("click", async () => {
        showScreen(SCREENS.inspo);
        await renderGroups();
        });

    // add photos
    $("addInspo").addEventListener("click", () => {
        alert("Next: add photo picker + save photo to IndexedDB tied to this group!");
    });

}
