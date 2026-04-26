import "./style.css";
import { initLottieFeature } from "./lottie";
import { initRiveFeature } from "./rive";

initLottieFeature({
  lottieContainer: document.querySelector("#lottieContainer"),
  lottieStatus: document.querySelector("#lottieStatus"),
  lottiePlayButton: document.querySelector("#lottiePlay"),
  lottiePauseButton: document.querySelector("#lottiePause"),
  lottieStopButton: document.querySelector("#lottieStop"),
  lottieAnimChips: document.querySelector("#lottieAnimChips"),
  lottieStatesChips: document.querySelector("#lottieStatesChips"),
  openAddLottieModalBtn: document.querySelector("#openAddLottieModal"),
  addLottieModalEl: document.querySelector("#addLottieModal"),
  closeAddLottieModalBtn: document.querySelector("#closeAddLottieModal"),
  cancelAddLottieModalBtn: document.querySelector("#cancelAddLottieModal"),
  confirmAddLottieModalBtn: document.querySelector("#confirmAddLottieModal"),
  modalAnimNameInput: document.querySelector("#modalAnimName"),
  modalStatesList: document.querySelector("#modalStatesList"),
  modalAddStateRowBtn: document.querySelector("#modalAddStateRow"),
  modalErrorEl: document.querySelector("#modalError"),
});

initRiveFeature({
  riveCanvas: document.querySelector("#riveCanvas"),
  riveFileInput: document.querySelector("#riveFile"),
  openRiveFilePickerBtn: document.querySelector("#openRiveFilePicker"),
  riveStatus: document.querySelector("#riveStatus"),
  rivePlayButton: document.querySelector("#rivePlay"),
  rivePauseButton: document.querySelector("#rivePause"),
  riveStopButton: document.querySelector("#riveStop"),
  riveAnimChips: document.querySelector("#riveAnimChips"),
  riveStatesChips: document.querySelector("#riveStatesChips"),
});
