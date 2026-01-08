import { openDB } from "./db/db.js";
import { initNavigation } from "./ui/navigation.js";
import { initCreateGroup } from "./ui/createGroup.js";
import { SCREENS, showScreen } from "./ui/screens.js";

document.addEventListener("DOMContentLoaded", async () => {
  // ensure DB is ready
  await openDB();

  initNavigation();
  initCreateGroup();

  showScreen(SCREENS.home);
});