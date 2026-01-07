const SCREENS = {
    home: "screen-home",
    inspo: "screen-inspo",
    create: "screen-create",
};

function $(id){
    return document.getElementById(id);
}

// there are multiple screens on one page and we only want one visible at a time
// hide everything but the one i want shown!
function showScreen(screenId) {
    //querySelectorAll gives you all the elements that have the calss "screen"
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    // the for each line loops through every screen and adds the hidden class  to visually hide it so all screens are hidden

    // show just ONE screen 
    $(screenId).classList.remove("hidden");
}

// just protects from messy user input
function cleanName(str) {
    return (str || "").trim().replace(/\s+/g, " ");
}

// IndexedDB setup !!----------------------------------
const DB_NAME = "framieDB"; // name of the database saved in safari storage
const DB_VERSION = 1; // version number of the schema so when we change the stores later we bump it as upgrade code runs
const STORE_GROUPS = "groups"; // constant so no typos

// ask browser to open the database
function openDB() { 
  return new Promise((resolve, reject) => {
    //open the database called framieDB in a returned request
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    
    // first time setup so runs when the DB is brand new (or updated maybe)
    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // groups store
      if (!db.objectStoreNames.contains(STORE_GROUPS)) {
        // fast loopup path based on this field
        const store = db.createObjectStore(STORE_GROUPS, { keyPath: "id" }); //each group obj must have an id whoch is the PK
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("nameLower", "nameLower", { unique: true }); // prevents duplicate names by checkign its lowercase vers
      }
    };

    //database opened, return the DB connection
    req.onsuccess = () => resolve(req.result);
    //smth ffailed, reject so you can catch it 
    req.onerror = () => reject(req.error);
  });
}

// a helper to make creatiing groups easier because indexedDB is finicky
// it requires an open database, to start the transaction, picking the store and running the request and waiting for it all to finish
// this helper function allowss it to happen in one line
async function withStore(storeName, mode, fn) {
        // open framie db
    const db = await openDB();

    // perform every read/write inside a controlled transaction
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const result = fn(store);

        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

// DB operations (groups)-------------------
// reads all the groups currently saved
// this comes of listGroups: 
// [
//   {
//     id,
//     name,
//     nameLower,
//     createdAt
//   },
//   ...
// ]
function listGroups() {
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

// create group
function addGroup(name) {
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

//UI rendering --------------------

async function renderGroups() {
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
        // create each group card from scratch 
        const card = document.createElement("button");
        //defines the 
        card.type = "button"; //semantics
        card.className = "groupCard"; //styling
        card.innerHTML = `<span>${g.name}</span>`; //g.name

        // click behaviour
        card.addEventListener("click", () => {
            // stub: group page comes next
            alert(`Open group: ${g.name} (group page next)`);
        });
        list.appendChild(card);
  }
}

// Navigation + Create Group-----------------------
function initNavigation() {
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
}

function initCreateGroup() {
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

// Boot (app startup sequence)-------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // ensure DB is ready
  await openDB();

  initNavigation();
  initCreateGroup();

  showScreen(SCREENS.home);
});