import lottie from "lottie-web";
import idleAnimation from "../assets/lottie/select-advanced-plan/idle.json";
import clickAnimation from "../assets/lottie/select-advanced-plan/click.json";
import hoverAnimation from "../assets/lottie/select-advanced-plan/hover.json";
import hoverOffAnimation from "../assets/lottie/select-advanced-plan/hover-off.json";
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
import { createLottieModalController } from "./modal";

export function initLottieFeature(elements) {
  const {
    lottieContainer,
    lottieStatus,
    lottiePlayButton,
    lottiePauseButton,
    lottieStopButton,
    lottieAnimChips,
    lottieStatesChips,
    openAddLottieModalBtn,
    addLottieModalEl,
    closeAddLottieModalBtn,
    cancelAddLottieModalBtn,
    confirmAddLottieModalBtn,
    modalAnimNameInput,
    modalStatesList,
    modalAddStateRowBtn,
    modalErrorEl,
  } = elements;

  const lottieControlButtons = {
    playing: lottiePlayButton,
    paused: lottiePauseButton,
    stopped: lottieStopButton,
  };

  const lottieUiState = {
    loaded: false,
    selectedAnimation: null,
    selectedPreset: null,
    playback: "stopped",
  };

  const lottiePresetButtons = new Map();
  const lottieAnimButtons = new Map();

  const LOTTIE_PRESET_ANIM_NAME = "select-advanced-plan";
  const LOTTIE_PRESET_STATE_FILES = [
    "idle.json",
    "click.json",
    "hover.json",
    "hover-off.json",
  ];
  const LOTTIE_PRESET_DEFINITIONS = {
    Idle: {
      animationName: LOTTIE_PRESET_ANIM_NAME,
      fileName: "idle.json",
      data: idleAnimation,
    },
    Click: {
      animationName: LOTTIE_PRESET_ANIM_NAME,
      fileName: "click.json",
      data: clickAnimation,
    },
    Hover: {
      animationName: LOTTIE_PRESET_ANIM_NAME,
      fileName: "hover.json",
      data: hoverAnimation,
    },
    HoverOff: {
      animationName: LOTTIE_PRESET_ANIM_NAME,
      fileName: "hover-off.json",
      data: hoverOffAnimation,
    },
  };

  const lottieAnimStateFilesMap = new Map([
    [LOTTIE_PRESET_ANIM_NAME, LOTTIE_PRESET_STATE_FILES],
  ]);

  let currentLottie = null;

  function updateStatus(message, isError = false) {
    if (!lottieStatus) {
      return;
    }

    lottieStatus.textContent = message;
    lottieStatus.dataset.state = isError ? "error" : "ok";
  }

  function renderLottiePresetSelection() {
    toggleButtonMapSelection(
      lottieAnimButtons,
      lottieUiState.selectedAnimation,
    );
    toggleButtonMapSelection(lottiePresetButtons, lottieUiState.selectedPreset);
  }

  function renderLottieControls() {
    renderPlaybackControls({
      controlButtons: lottieControlButtons,
      playbackState: lottieUiState.playback,
      isLoaded: lottieUiState.loaded,
    });
  }

  function updateLottiePlaybackState(nextState) {
    lottieUiState.playback = nextState;
    renderLottieControls();
  }

  function setLottieStatusForSource(sourceLabel) {
    if (sourceLabel.startsWith("preset:")) {
      const presetFile = sourceLabel.replace("preset:", "").trim();
      const selectedState = formatFileNameLabel(presetFile);
      updateStatus(`Selected state: ${selectedState}`);
      return;
    }

    if (sourceLabel.startsWith("file:")) {
      const fileName = sourceLabel.replace("file:", "").trim();
      updateStatus(`Loaded local Lottie: ${fileName}`);
      return;
    }

    updateStatus(`Loaded Lottie from ${sourceLabel}`);
  }

  function getPreferredPresetForAnimation(animName) {
    return getPreferredPresetFromDefinitions(
      LOTTIE_PRESET_DEFINITIONS,
      animName,
    );
  }

  function getDefaultPresetSelection() {
    return getDefaultPresetFromDefinitions(LOTTIE_PRESET_DEFINITIONS);
  }

  async function loadLottieAnimation(animationData, sourceLabel, options = {}) {
    try {
      if (currentLottie) {
        currentLottie.destroy();
        currentLottie = null;
      }

      lottieContainer.innerHTML = "";
      currentLottie = lottie.loadAnimation({
        container: lottieContainer,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData,
      });

      lottieUiState.loaded = true;
      lottieUiState.selectedAnimation = options.animationName || null;
      lottieUiState.selectedPreset = options.presetName || null;
      renderLottiePresetSelection();
      updateLottiePlaybackState("playing");
      setLottieStatusForSource(sourceLabel);
    } catch (error) {
      lottieUiState.loaded = false;
      lottieUiState.selectedAnimation = null;
      lottieUiState.selectedPreset = null;
      renderLottiePresetSelection();
      updateLottiePlaybackState("stopped");
      updateStatus(`Failed to load Lottie: ${error.message}`, true);
    }
  }

  async function loadLottiePreset(presetName) {
    const definition = LOTTIE_PRESET_DEFINITIONS[presetName];
    if (!definition) {
      return;
    }

    const stateFiles =
      lottieAnimStateFilesMap.get(definition.animationName) ??
      LOTTIE_PRESET_STATE_FILES;

    await loadLottieAnimation(
      definition.data,
      `preset: ${definition.fileName}`,
      {
        animationName: definition.animationName,
        presetName,
      },
    );

    setLottieAnimMeta(definition.animationName, stateFiles, {
      interactiveStates: true,
    });
  }

  function setLottieAnimMeta(
    animName,
    stateFiles,
    { interactiveStates = false } = {},
  ) {
    clearElementChildren(lottieAnimChips);
    clearElementChildren(lottieStatesChips);
    lottieAnimButtons.clear();
    lottiePresetButtons.clear();

    if (lottieAnimChips) {
      const allAnimNames = interactiveStates
        ? [...lottieAnimStateFilesMap.keys()]
        : [animName];

      for (const knownAnimName of allAnimNames) {
        if (!interactiveStates) {
          lottieAnimChips.appendChild(
            createMetaChip(formatFileNameLabel(knownAnimName)),
          );
        } else {
          const { group } = createAnimChipGroup(
            formatFileNameLabel(knownAnimName),
            {
              onSelect: () => {
                const defaultPreset =
                  getPreferredPresetForAnimation(knownAnimName);
                if (defaultPreset) {
                  void loadLottiePreset(defaultPreset);
                }
              },
              onAddState: () =>
                modalController.open({
                  mode: "add-states",
                  animName: knownAnimName,
                }),
              onDelete: () => deleteLottieAnimation(knownAnimName),
            },
          );
          lottieAnimButtons.set(knownAnimName, group);
          lottieAnimChips.appendChild(group);
        }
      }
    }

    if (!lottieStatesChips) {
      return;
    }

    stateFiles.forEach((stateFile) => {
      const stateLabel = formatFileNameLabel(stateFile);

      if (!interactiveStates) {
        lottieStatesChips.appendChild(createMetaChip(stateLabel));
        return;
      }

      const presetName = Object.keys(LOTTIE_PRESET_DEFINITIONS).find(
        (name) =>
          LOTTIE_PRESET_DEFINITIONS[name].fileName === stateFile &&
          LOTTIE_PRESET_DEFINITIONS[name].animationName === animName,
      );

      if (!presetName) {
        lottieStatesChips.appendChild(createMetaChip(stateLabel));
        return;
      }

      const { group: stateGroup } = createAnimChipGroup(stateLabel, {
        onSelect: () => void loadLottiePreset(presetName),
        onDelete: () => deleteLottieState(presetName, animName),
      });
      lottiePresetButtons.set(presetName, stateGroup);
      lottieStatesChips.appendChild(stateGroup);
    });

    renderLottiePresetSelection();
  }

  function ensureLottieLoaded() {
    if (!currentLottie) {
      updateStatus("Load a Lottie animation first", true);
      return false;
    }

    return true;
  }

  function deleteLottieAnimation(animName) {
    const wasSelected = lottieUiState.selectedAnimation === animName;
    for (const key of Object.keys(LOTTIE_PRESET_DEFINITIONS)) {
      if (LOTTIE_PRESET_DEFINITIONS[key].animationName === animName) {
        delete LOTTIE_PRESET_DEFINITIONS[key];
      }
    }
    lottieAnimStateFilesMap.delete(animName);

    if (wasSelected) {
      lottieUiState.selectedAnimation = null;
      lottieUiState.selectedPreset = null;
      if (currentLottie) {
        currentLottie.destroy();
        currentLottie = null;
      }
      if (lottieContainer) {
        lottieContainer.innerHTML = "";
      }
      lottieUiState.loaded = false;
      updateLottiePlaybackState("stopped");
      updateStatus("No Lottie loaded");
    }

    const remainingAnims = [...lottieAnimStateFilesMap.keys()];
    if (!remainingAnims.length) {
      clearElementChildren(lottieAnimChips);
      clearElementChildren(lottieStatesChips);
      lottieAnimButtons.clear();
      lottiePresetButtons.clear();
      return;
    }

    const activeAnim = getNextAnimationAfterDelete({
      remainingAnimations: remainingAnims,
      wasSelected,
      selectedAnimation: lottieUiState.selectedAnimation,
    });
    const stateFilesForActive = lottieAnimStateFilesMap.get(activeAnim) ?? [];
    setLottieAnimMeta(activeAnim, stateFilesForActive, {
      interactiveStates: true,
    });

    if (wasSelected) {
      const defaultPreset = getPreferredPresetForAnimation(activeAnim);
      if (defaultPreset) {
        void loadLottiePreset(defaultPreset);
      }
    }
  }

  function deleteLottieState(presetKey, animName) {
    const definition = LOTTIE_PRESET_DEFINITIONS[presetKey];
    if (!definition) {
      return;
    }
    const fileName = definition.fileName;
    delete LOTTIE_PRESET_DEFINITIONS[presetKey];

    const stateFiles = lottieAnimStateFilesMap.get(animName) ?? [];
    const updatedFiles = stateFiles.filter((file) => file !== fileName);
    if (!updatedFiles.length) {
      deleteLottieAnimation(animName);
      return;
    }
    lottieAnimStateFilesMap.set(animName, updatedFiles);

    const wasSelected = lottieUiState.selectedPreset === presetKey;
    if (wasSelected) {
      lottieUiState.selectedPreset = null;
    }
    setLottieAnimMeta(animName, updatedFiles, { interactiveStates: true });
    if (wasSelected) {
      const defaultPreset = getPreferredPresetForAnimation(animName);
      if (defaultPreset) {
        void loadLottiePreset(defaultPreset);
      }
    }
  }

  const modalController = createLottieModalController({
    addLottieModalEl,
    closeAddLottieModalBtn,
    cancelAddLottieModalBtn,
    confirmAddLottieModalBtn,
    modalAnimNameInput,
    modalStatesList,
    modalAddStateRowBtn,
    modalErrorEl,
    formatFileNameLabel,
    onConfirm: async ({ mode, animName, stateEntries }) => {
      let stateResults;
      try {
        stateResults = await Promise.all(
          stateEntries.map(async ({ stateName, file }) => {
            const text = await file.text();
            const data = JSON.parse(text);
            return { stateName, fileName: file.name, data };
          }),
        );
      } catch (error) {
        return { error: `Invalid JSON: ${error.message}` };
      }

      stateResults.sort((a, b) => {
        const aIdle = /^idle/i.test(a.stateName) || /^idle/i.test(a.fileName);
        const bIdle = /^idle/i.test(b.stateName) || /^idle/i.test(b.fileName);
        return aIdle === bIdle ? 0 : aIdle ? -1 : 1;
      });

      const existingFiles = lottieAnimStateFilesMap.get(animName) ?? [];
      const newFileNames = [];
      for (const { stateName, fileName, data } of stateResults) {
        const presetKey = `${animName}::${stateName}`;
        if (LOTTIE_PRESET_DEFINITIONS[presetKey]) {
          continue;
        }
        LOTTIE_PRESET_DEFINITIONS[presetKey] = {
          animationName: animName,
          fileName,
          data,
        };
        newFileNames.push(fileName);
      }

      lottieAnimStateFilesMap.set(animName, [
        ...existingFiles,
        ...newFileNames,
      ]);

      if (mode === "add-states") {
        const allFiles = lottieAnimStateFilesMap.get(animName) ?? [];
        setLottieAnimMeta(animName, allFiles, { interactiveStates: true });
        return { ok: true };
      }

      const defaultPreset = getPreferredPresetForAnimation(animName);
      if (defaultPreset) {
        await loadLottiePreset(defaultPreset);
      }

      return { ok: true };
    },
  });

  openAddLottieModalBtn?.addEventListener("click", () => {
    modalController.open();
  });

  lottiePlayButton?.addEventListener("click", () => {
    if (!ensureLottieLoaded()) {
      return;
    }

    currentLottie?.play();
    updateLottiePlaybackState("playing");
    updateStatus("Playback: Playing");
  });

  lottiePauseButton?.addEventListener("click", () => {
    if (!ensureLottieLoaded()) {
      return;
    }

    currentLottie?.pause();
    updateLottiePlaybackState("paused");
    updateStatus("Playback: Paused");
  });

  lottieStopButton?.addEventListener("click", () => {
    if (!ensureLottieLoaded()) {
      return;
    }

    currentLottie?.stop();
    updateLottiePlaybackState("stopped");
    updateStatus("Playback: Stopped");
  });

  decoratePlaybackButtons(lottieControlButtons, "lottie-control-btn");

  setLottieAnimMeta(LOTTIE_PRESET_ANIM_NAME, LOTTIE_PRESET_STATE_FILES, {
    interactiveStates: true,
  });
  renderLottiePresetSelection();
  renderLottieControls();

  const defaultLottiePreset = getDefaultPresetSelection();
  if (defaultLottiePreset) {
    void loadLottiePreset(defaultLottiePreset);
  }
}
