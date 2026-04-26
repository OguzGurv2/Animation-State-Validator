import test from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultPresetFromDefinitions,
  getNextAnimationAfterDelete,
  getPreferredPresetFromDefinitions,
} from "../src/helpers/preset-utils.js";

test("idle-first preset selection prioritizes idle.json", () => {
  const definitions = {
    Hover: {
      animationName: "menu",
      fileName: "hover.json",
    },
    Idle: {
      animationName: "menu",
      fileName: "idle.json",
    },
    Click: {
      animationName: "menu",
      fileName: "click.json",
    },
  };

  const preset = getPreferredPresetFromDefinitions(definitions, "menu");
  assert.equal(preset, "Idle");
});

test("default preset selection uses first animation and idle-first rule", () => {
  const definitions = {
    Hover: {
      animationName: "alpha",
      fileName: "hover.json",
    },
    Idle: {
      animationName: "alpha",
      fileName: "idle.json",
    },
    OtherAnimIdle: {
      animationName: "beta",
      fileName: "idle.json",
    },
  };

  const preset = getDefaultPresetFromDefinitions(definitions);
  assert.equal(preset, "Idle");
});

test("deletion fallback picks first remaining animation when active animation was deleted", () => {
  const nextAnim = getNextAnimationAfterDelete({
    remainingAnimations: ["anim-b", "anim-c"],
    wasSelected: true,
    selectedAnimation: "anim-a",
  });

  assert.equal(nextAnim, "anim-b");
});

test("deletion fallback keeps current selection when deleted animation was not selected", () => {
  const nextAnim = getNextAnimationAfterDelete({
    remainingAnimations: ["anim-a", "anim-b"],
    wasSelected: false,
    selectedAnimation: "anim-b",
  });

  assert.equal(nextAnim, "anim-b");
});

test("deletion fallback returns null when no animations remain", () => {
  const nextAnim = getNextAnimationAfterDelete({
    remainingAnimations: [],
    wasSelected: true,
    selectedAnimation: "anim-a",
  });

  assert.equal(nextAnim, null);
});
