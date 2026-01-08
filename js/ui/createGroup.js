import { $ , cleanName } from "../utils/dom.js";
import { SCREENS, showScreen } from "./screens.js";
import { addGroup } from "../db/groupsStore.js";
import { renderGroups } from "./groups.js";

export function initCreateGroup() {
    // grabs the UI elements
    const input = $("groupName");
    const btn = $("createGroupBtn");

    //everytime the user types clean the input and if its empty, disable the button but if it has real text, enable it
    input.addEventListener("input", () => {
        btn.disabled = cleanName(input.value).length === 0;
    });

    // define the actual createGroup function
    async function createGroup() {
        //DEFENSIVE PROGRAMMING to prevent race condiitons and keyboard shortcutes
        const name = cleanName(input.value);
        if (!name) return;

        // atry to add the group
        try {
        await addGroup(name);
        showScreen(SCREENS.inspo);
        await renderGroups();
        } catch (err) {
        // If duplicate index triggers, user tried same name
        if (String(err).toLowerCase().includes("constraint")) {
            alert("That group already exists!");
            return;
        }
        // error handling if smth went wrong
        console.error(err);
        alert("Something went wrong creating the group.");
        }
    }

    // wire the create button
    btn.addEventListener("click", createGroup);

    // keyboard supports the enter key to submit the group
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !btn.disabled) createGroup();
    });
}

