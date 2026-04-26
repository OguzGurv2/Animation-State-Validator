import {
  Alignment,
  Fit,
  Layout,
  Rive,
  StateMachineInputType,
} from "@rive-app/canvas";
import rivePresetUrl from "../assets/rive/cart-icon-final.riv";
import {
  clearElementChildren,
  createAnimChipGroup,
  createMetaChip,
  decoratePlaybackButtons,
  formatFileNameLabel,
  renderPlaybackControls,
  toggleButtonMapSelection,
} from "./chips";
import {
  getDefaultPresetFromDefinitions,
  getNextAnimationAfterDelete,
  getPreferredPresetFromDefinitions,
} from "./helpers/preset-utils";

export function initRiveFeature(elements) {
  const {
    riveCanvas,
    riveFileInput,
    openRiveFilePickerBtn,
    riveStatus,
    rivePlayButton,
    rivePauseButton,
    riveStopButton,
    riveAnimChips,
    riveStatesChips,
  } = elements;

  const riveControlButtons = {
    playing: rivePlayButton,
    paused: rivePauseButton,
    stopped: riveStopButton,
  };

  const riveUiState = {
    loaded: false,
    selectedAnimation: null,
    selectedPreset: null,
    playback: "stopped",
  };

  const rivePresetButtons = new Map();
  const riveAnimButtons = new Map();

  const RIVE_PRESET_ANIM_NAME = "cart-icon-final";
  const RIVE_PRESET_FILE_NAME = "cart-icon-final.riv";
  const RIVE_PRESET_DEFINITIONS = {
    Idle: {
      animationName: RIVE_PRESET_ANIM_NAME,
      fileName: "idle.json",
      source: rivePresetUrl,
      actionName: "Idle",
    },
    Hover: {
      animationName: RIVE_PRESET_ANIM_NAME,
      fileName: "hover.json",
      source: rivePresetUrl,
      actionName: "Hover",
    },
    Click: {
      animationName: RIVE_PRESET_ANIM_NAME,
      fileName: "click.json",
      source: rivePresetUrl,
      actionName: "Click",
    },
  };

  let currentRive = null;
  let activeRiveObjectUrl = null;
  let riveLoadToken = 0;

  function updateStatus(message, isError = false) {
    if (!riveStatus) {
      return;
    }

    riveStatus.textContent = message;
    riveStatus.dataset.state = isError ? "error" : "ok";
  }

  function updateRivePlaybackState(nextState) {
    riveUiState.playback = nextState;
    renderRiveControls();
  }

  function renderRiveControls() {
    toggleButtonMapSelection(riveAnimButtons, riveUiState.selectedAnimation);
    toggleButtonMapSelection(rivePresetButtons, riveUiState.selectedPreset);
    renderPlaybackControls({
      controlButtons: riveControlButtons,
      playbackState: riveUiState.playback,
      isLoaded: riveUiState.loaded,
    });
  }

  function getPreferredRivePresetForAnimation(animName) {
    return getPreferredPresetFromDefinitions(RIVE_PRESET_DEFINITIONS, animName);
  }

  function getDefaultRivePresetSelection() {
    return getDefaultPresetFromDefinitions(RIVE_PRESET_DEFINITIONS);
  }

  function getRiveStateFilesForAnimation(animName) {
    return Object.values(RIVE_PRESET_DEFINITIONS)
      .filter((definition) => definition.animationName === animName)
      .map((definition) => definition.fileName);
  }

  function clearRiveCanvas() {
    if (!riveCanvas) {
      return;
    }

    const width = riveCanvas.width;
    const height = riveCanvas.height;
    riveCanvas.width = width;
    riveCanvas.height = height;
  }

  function disposeRive() {
    if (currentRive) {
      currentRive.cleanup();
      currentRive = null;
    }

    if (activeRiveObjectUrl) {
      URL.revokeObjectURL(activeRiveObjectUrl);
      activeRiveObjectUrl = null;
    }

    clearRiveCanvas();
  }

  function setRiveAnimMeta(
    animName,
    stateFiles,
    { interactiveStates = false } = {},
  ) {
    clearElementChildren(riveAnimChips);
    clearElementChildren(riveStatesChips);
    riveAnimButtons.clear();
    rivePresetButtons.clear();

    if (riveAnimChips) {
      if (!interactiveStates) {
        riveAnimChips.appendChild(
          createMetaChip(formatFileNameLabel(animName)),
        );
      } else {
        const { group } = createAnimChipGroup(formatFileNameLabel(animName), {
          onSelect: () => {
            const defaultPreset = getPreferredRivePresetForAnimation(animName);
            if (defaultPreset) {
              void loadRivePreset(defaultPreset);
            }
          },
          onDelete: () => deleteRiveAnimation(animName),
        });
        riveAnimButtons.set(animName, group);
        riveAnimChips.appendChild(group);
      }
    }

    if (!riveStatesChips) {
      return;
    }

    stateFiles.forEach((stateFile) => {
      const stateLabel = formatFileNameLabel(stateFile);

      if (!interactiveStates) {
        riveStatesChips.appendChild(createMetaChip(stateLabel));
        return;
      }

      const presetName = Object.keys(RIVE_PRESET_DEFINITIONS).find(
        (name) =>
          RIVE_PRESET_DEFINITIONS[name].fileName === stateFile &&
          RIVE_PRESET_DEFINITIONS[name].animationName === animName,
      );

      if (!presetName) {
        riveStatesChips.appendChild(createMetaChip(stateLabel));
        return;
      }

      const { group: stateGroup } = createAnimChipGroup(stateLabel, {
        onSelect: () => void loadRivePreset(presetName),
        onDelete: () => deleteRiveState(presetName, animName),
      });
      rivePresetButtons.set(presetName, stateGroup);
      riveStatesChips.appendChild(stateGroup);
    });

    renderRiveControls();
  }

  function getRiveCanvasCenter() {
    if (!riveCanvas) {
      return null;
    }

    const rect = riveCanvas.getBoundingClientRect();
    return {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };
  }

  function dispatchRivePointerEvent(type, init = {}) {
    if (!riveCanvas) {
      return;
    }

    const center = getRiveCanvasCenter();
    if (!center) {
      return;
    }

    const baseInit = {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: 0,
      ...center,
      ...init,
    };

    if (typeof PointerEvent !== "undefined") {
      riveCanvas.dispatchEvent(new PointerEvent(type, baseInit));
      return;
    }

    riveCanvas.dispatchEvent(new MouseEvent(type, baseInit));
  }

  function dispatchRiveMouseEvent(type, init = {}) {
    if (!riveCanvas) {
      return;
    }

    const center = getRiveCanvasCenter();
    if (!center) {
      return;
    }

    riveCanvas.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 0,
        ...center,
        ...init,
      }),
    );
  }

  function runRivePointerQuickAction(actionName) {
    if (!riveCanvas) {
      return false;
    }

    if (actionName === "Hover") {
      dispatchRivePointerEvent("pointerenter");
      dispatchRivePointerEvent("pointermove");
      dispatchRiveMouseEvent("mouseenter");
      dispatchRiveMouseEvent("mousemove");
      return true;
    }

    if (actionName === "Idle") {
      dispatchRivePointerEvent("pointerleave");
      dispatchRiveMouseEvent("mouseleave");
      return true;
    }

    if (actionName === "Click") {
      dispatchRivePointerEvent("pointerenter");
      dispatchRivePointerEvent("pointermove");
      dispatchRivePointerEvent("pointerdown", { buttons: 1 });
      dispatchRivePointerEvent("pointerup", { buttons: 0 });
      dispatchRiveMouseEvent("mousedown", { buttons: 1 });
      dispatchRiveMouseEvent("mouseup", { buttons: 0 });
      dispatchRiveMouseEvent("click");
      return true;
    }

    return false;
  }

  function matchRiveInput(term) {
    if (!currentRive) {
      return null;
    }

    const normalizedTerm = term.toLowerCase();
    for (const machineName of currentRive.stateMachineNames) {
      const inputs = currentRive.stateMachineInputs(machineName);
      const matchedInput = inputs.find((input) =>
        input.name.toLowerCase().includes(normalizedTerm),
      );
      if (matchedInput) {
        return { machineName, input: matchedInput };
      }
    }

    return null;
  }

  function ensureRiveLoaded() {
    if (!currentRive) {
      updateStatus("Load a Rive animation first", true);
      return false;
    }

    return true;
  }

  function applyRiveQuickAction(actionName) {
    if (!ensureRiveLoaded()) {
      return;
    }

    const term = actionName.toLowerCase();
    const inputMatch = matchRiveInput(term);
    if (inputMatch) {
      const { machineName, input } = inputMatch;

      if (input.type === StateMachineInputType.Trigger) {
        input.fire();
      } else if (input.type === StateMachineInputType.Boolean) {
        input.value = actionName !== "Idle";

        if (actionName === "Idle") {
          const hoverInput = matchRiveInput("hover")?.input;
          const clickInput = matchRiveInput("click")?.input;
          if (hoverInput?.type === StateMachineInputType.Boolean) {
            hoverInput.value = false;
          }
          if (clickInput?.type === StateMachineInputType.Boolean) {
            clickInput.value = false;
          }
        }
      } else {
        input.value = actionName === "Idle" ? 0 : 1;
      }

      updateStatus(
        `${actionName} applied via input "${input.name}" on "${machineName}"`,
      );
      return;
    }

    const animationMatch = currentRive.animationNames.find((name) =>
      name.toLowerCase().includes(term),
    );
    if (animationMatch) {
      currentRive.play(animationMatch);
      updateStatus(`${actionName} applied via animation "${animationMatch}"`);
      return;
    }

    if (runRivePointerQuickAction(actionName)) {
      updateStatus(`${actionName} applied via pointer interaction fallback`);
      return;
    }

    updateStatus(
      `No matching Rive input or animation found for "${actionName}"`,
      true,
    );
  }

  async function resolveRiveSource(source) {
    if (source instanceof ArrayBuffer) {
      return { buffer: source };
    }

    if (typeof source !== "string") {
      return { src: source };
    }

    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      return { buffer };
    } catch {
      return { src: source };
    }
  }

  async function loadRiveAnimation(source, sourceLabel, options = {}) {
    const hasPresetSelection = Boolean(
      options.animationName || options.presetName,
    );

    if (hasPresetSelection) {
      riveUiState.selectedAnimation = options.animationName || null;
      riveUiState.selectedPreset = options.presetName || null;
    }

    disposeRive();
    riveUiState.loaded = false;
    updateRivePlaybackState("stopped");
    const currentToken = ++riveLoadToken;

    try {
      const resolvedSource = await resolveRiveSource(source);
      if (currentToken !== riveLoadToken) {
        return;
      }

      currentRive = new Rive({
        ...resolvedSource,
        canvas: riveCanvas,
        autoplay: true,
        layout: new Layout({
          fit: Fit.Contain,
          alignment: Alignment.Center,
        }),
        onLoad: () => {
          currentRive.resizeDrawingSurfaceToCanvas();
          riveUiState.loaded = true;
          riveUiState.selectedAnimation = options.animationName || null;
          riveUiState.selectedPreset = options.presetName || null;
          updateRivePlaybackState("playing");
          updateStatus(`Loaded Rive from ${sourceLabel}`);
          if (options.actionName) {
            applyRiveQuickAction(options.actionName);
          }
        },
        onLoadError: (event) => {
          riveUiState.loaded = false;
          if (!hasPresetSelection) {
            riveUiState.selectedAnimation = null;
            riveUiState.selectedPreset = null;
          }
          updateRivePlaybackState("stopped");
          const loadError = event?.data || "Unknown load error";
          updateStatus(
            `Failed to load Rive (${sourceLabel}): ${String(loadError)}`,
            true,
          );
        },
      });
    } catch (error) {
      riveUiState.loaded = false;
      if (!hasPresetSelection) {
        riveUiState.selectedAnimation = null;
        riveUiState.selectedPreset = null;
      }
      updateRivePlaybackState("stopped");
      updateStatus(
        `Failed to initialize Rive (${sourceLabel}): ${error.message}`,
        true,
      );
    }
  }

  async function loadRivePreset(presetName) {
    const definition = RIVE_PRESET_DEFINITIONS[presetName];
    if (!definition) {
      return;
    }

    riveUiState.selectedAnimation = definition.animationName;
    riveUiState.selectedPreset = presetName;
    renderRiveControls();

    await loadRiveAnimation(
      definition.source,
      `preset: ${RIVE_PRESET_FILE_NAME}`,
      {
        animationName: definition.animationName,
        presetName,
        actionName: definition.actionName,
      },
    );

    const stateFiles = getRiveStateFilesForAnimation(definition.animationName);
    setRiveAnimMeta(definition.animationName, stateFiles, {
      interactiveStates: true,
    });
  }

  function deleteRiveAnimation(animName) {
    const wasSelected = riveUiState.selectedAnimation === animName;
    for (const key of Object.keys(RIVE_PRESET_DEFINITIONS)) {
      if (RIVE_PRESET_DEFINITIONS[key].animationName === animName) {
        delete RIVE_PRESET_DEFINITIONS[key];
      }
    }

    if (wasSelected) {
      riveUiState.selectedAnimation = null;
      riveUiState.selectedPreset = null;
      disposeRive();
      riveUiState.loaded = false;
      updateRivePlaybackState("stopped");
      updateStatus("No Rive loaded");
    }

    const remainingAnims = [
      ...new Set(
        Object.values(RIVE_PRESET_DEFINITIONS).map(
          (definition) => definition.animationName,
        ),
      ),
    ];

    if (!remainingAnims.length) {
      riveUiState.selectedAnimation = null;
      riveUiState.selectedPreset = null;
      disposeRive();
      riveUiState.loaded = false;
      updateRivePlaybackState("stopped");
      updateStatus("No Rive loaded");

      clearElementChildren(riveAnimChips);
      clearElementChildren(riveStatesChips);
      riveAnimButtons.clear();
      rivePresetButtons.clear();
      return;
    }

    const activeAnim = getNextAnimationAfterDelete({
      remainingAnimations: remainingAnims,
      wasSelected,
      selectedAnimation: riveUiState.selectedAnimation,
    });
    const stateFilesForActive = getRiveStateFilesForAnimation(activeAnim);
    setRiveAnimMeta(activeAnim, stateFilesForActive, {
      interactiveStates: true,
    });

    if (wasSelected) {
      const defaultPreset = getPreferredRivePresetForAnimation(activeAnim);
      if (defaultPreset) {
        void loadRivePreset(defaultPreset);
      }
    }
  }

  function deleteRiveState(presetKey, animName) {
    const definition = RIVE_PRESET_DEFINITIONS[presetKey];
    if (!definition) {
      return;
    }
    delete RIVE_PRESET_DEFINITIONS[presetKey];

    const updatedFiles = getRiveStateFilesForAnimation(animName);
    if (!updatedFiles.length) {
      deleteRiveAnimation(animName);
      return;
    }

    const wasSelected = riveUiState.selectedPreset === presetKey;
    if (wasSelected) {
      riveUiState.selectedPreset = null;
    }
    setRiveAnimMeta(animName, updatedFiles, { interactiveStates: true });
    if (wasSelected) {
      const defaultPreset = getPreferredRivePresetForAnimation(animName);
      if (defaultPreset) {
        void loadRivePreset(defaultPreset);
      }
    }
  }

  riveFileInput?.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (!file) {
      return;
    }

    activeRiveObjectUrl = URL.createObjectURL(file);
    void loadRiveAnimation(activeRiveObjectUrl, `file: ${file.name}`);
    setRiveAnimMeta(file.name, [file.name]);
  });

  openRiveFilePickerBtn?.addEventListener("click", () => {
    if (!riveFileInput) {
      return;
    }

    riveFileInput.value = "";
    riveFileInput.click();
  });

  rivePlayButton?.addEventListener("click", () => {
    if (!ensureRiveLoaded()) {
      return;
    }

    currentRive?.play();
    updateRivePlaybackState("playing");
    updateStatus("Playback: Playing");
  });

  rivePauseButton?.addEventListener("click", () => {
    if (!ensureRiveLoaded()) {
      return;
    }

    currentRive?.pause();
    updateRivePlaybackState("paused");
    updateStatus("Playback: Paused");
  });

  riveStopButton?.addEventListener("click", () => {
    if (!ensureRiveLoaded()) {
      return;
    }

    currentRive?.stop();
    updateRivePlaybackState("stopped");
    updateStatus("Playback: Stopped");
  });

  decoratePlaybackButtons(riveControlButtons, "rive-control-btn");
  setRiveAnimMeta(
    RIVE_PRESET_ANIM_NAME,
    getRiveStateFilesForAnimation(RIVE_PRESET_ANIM_NAME),
    {
      interactiveStates: true,
    },
  );
  renderRiveControls();

  const defaultRivePreset = getDefaultRivePresetSelection();
  if (defaultRivePreset) {
    void loadRivePreset(defaultRivePreset);
  }
}
