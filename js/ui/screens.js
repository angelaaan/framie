import { $ } from "../utils/dom.js";

export const SCREENS = {
  home: "screen-home",
  inspo: "screen-inspo",
  create: "screen-create",
};

export function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  $(screenId).classList.remove("hidden");
}