/**
 * Convert a file-like token into a human-readable UI label.
 */
export function formatFileNameLabel(fileName) {
  return fileName
    .replace(/\.json$/i, "")
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Remove all child nodes from an element if it exists.
 */
export function clearElementChildren(element) {
  if (element) {
    element.innerHTML = "";
  }
}

/**
 * Create a passive metadata chip or a button-like chip.
 */
export function createMetaChip(label, { clickable = false } = {}) {
  const chip = document.createElement(clickable ? "button" : "span");
  chip.className = clickable
    ? "lottie-preset-btn meta-chip is-clickable"
    : "lottie-preset-btn meta-chip";
  chip.textContent = label;
  if (clickable) {
    chip.type = "button";
  }

  return chip;
}

/**
 * Create a chip group with optional select, add-state, and delete actions.
 */
export function createAnimChipGroup(
  label,
  { onSelect, onAddState, onDelete } = {},
) {
  const group = document.createElement("span");
  group.className = "meta-chip-group";

  const labelBtn = document.createElement("button");
  labelBtn.type = "button";
  labelBtn.className = "meta-chip";
  labelBtn.textContent = label;
  if (onSelect) {
    labelBtn.addEventListener("click", onSelect);
  }

  group.appendChild(labelBtn);

  if (onAddState) {
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "chip-action chip-action-add";
    addBtn.setAttribute("aria-label", "Add state");
    addBtn.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i>';
    addBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      onAddState();
    });
    group.appendChild(addBtn);
  }

  if (onDelete) {
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "chip-action chip-action-delete";
    delBtn.setAttribute("aria-label", "Delete");
    delBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    delBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      onDelete();
    });
    group.appendChild(delBtn);
  }

  return { group };
}

/**
 * Apply selected styling and aria state for chips tracked in a key->element map.
 */
export function toggleButtonMapSelection(buttonMap, selectedKey) {
  buttonMap.forEach((button, key) => {
    if (!button) {
      return;
    }

    const isSelected = key === selectedKey;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
}

/**
 * Synchronize playback controls with current playback and load state.
 */
export function renderPlaybackControls({
  controlButtons,
  playbackState,
  isLoaded,
}) {
  Object.entries(controlButtons).forEach(([stateName, button]) => {
    if (!button) {
      return;
    }

    const isActive = playbackState === stateName;
    button.disabled = !isLoaded;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

/**
 * Add iconography, labels, and role classes to playback control buttons.
 */
export function decoratePlaybackButtons(controlButtons, roleClassName) {
  const buttonConfig = {
    playing: {
      icon: "fa-play",
      label: "Start",
      roleClass: "is-play",
    },
    paused: {
      icon: "fa-pause",
      label: "Pause",
      roleClass: "is-pause",
    },
    stopped: {
      icon: "fa-stop",
      label: "Stop",
      roleClass: "is-stop",
    },
  };

  Object.entries(controlButtons).forEach(([stateName, button]) => {
    if (!button) {
      return;
    }

    const config = buttonConfig[stateName];
    button.classList.add(roleClassName);
    button.classList.add(config.roleClass);
    button.innerHTML = `<i class="fa-solid ${config.icon}" aria-hidden="true"></i>`;
    button.setAttribute("aria-label", config.label);
    button.setAttribute("title", config.label);
  });
}
