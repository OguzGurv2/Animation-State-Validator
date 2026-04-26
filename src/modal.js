/**
 * Build a controller around the Add Lottie modal lifecycle and validation.
 */
export function createLottieModalController({
  addLottieModalEl,
  closeAddLottieModalBtn,
  cancelAddLottieModalBtn,
  confirmAddLottieModalBtn,
  modalAnimNameInput,
  modalStatesList,
  modalAddStateRowBtn,
  modalErrorEl,
  formatFileNameLabel,
  onConfirm,
}) {
  let modalMode = "add";
  let modalTargetAnimName = null;

  // Each row captures one state name + JSON source pair.
  function createModalStateRow() {
    const row = document.createElement("div");
    row.className = "modal-state-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "state-name-input";
    nameInput.placeholder = "State name";

    const fileLabel = document.createElement("label");
    fileLabel.className = "state-file-label";

    const fileIcon = document.createElement("i");
    fileIcon.className = "fa-solid fa-folder-open";
    fileIcon.setAttribute("aria-hidden", "true");

    const fileHint = document.createElement("span");
    fileHint.className = "state-file-hint";
    fileHint.textContent = "Choose file";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "state-file-input";
    fileInput.accept = ".json,application/json";

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) {
        return;
      }

      fileHint.textContent = file.name;
      fileHint.classList.add("has-file");
      if (!nameInput.value.trim()) {
        nameInput.value = formatFileNameLabel(file.name);
      }
    });

    fileLabel.appendChild(fileIcon);
    fileLabel.appendChild(fileHint);
    fileLabel.appendChild(fileInput);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "state-row-remove";
    removeBtn.setAttribute("aria-label", "Remove state");
    removeBtn.innerHTML =
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    removeBtn.addEventListener("click", () => {
      row.remove();
    });

    row.appendChild(nameInput);
    row.appendChild(fileLabel);
    row.appendChild(removeBtn);

    return row;
  }

  /** Display an inline validation or processing error in the modal. */
  function showModalError(message) {
    if (modalErrorEl) {
      modalErrorEl.textContent = message;
      modalErrorEl.hidden = false;
    }
  }

  /** Reset modal error UI back to a clean state. */
  function hideModalError() {
    if (modalErrorEl) {
      modalErrorEl.textContent = "";
      modalErrorEl.hidden = true;
    }
  }

  /** Collect valid state rows, skipping rows without a selected file. */
  function collectStateEntries() {
    const rows = modalStatesList?.querySelectorAll(".modal-state-row") ?? [];
    const stateEntries = [];

    for (const row of rows) {
      const file = row.querySelector(".state-file-input")?.files[0];
      if (!file) {
        continue;
      }

      const nameVal = (
        row.querySelector(".state-name-input")?.value ?? ""
      ).trim();
      stateEntries.push({
        stateName: nameVal || formatFileNameLabel(file.name),
        file,
      });
    }

    return stateEntries;
  }

  /** Open modal in either add-animation mode or add-states mode. */
  function open(options = {}) {
    if (!addLottieModalEl) {
      return;
    }

    modalMode = options.mode ?? "add";
    modalTargetAnimName = options.animName ?? null;

    const titleEl = addLottieModalEl.querySelector("#addLottieModalTitle");
    const nameField = addLottieModalEl.querySelector(".modal-name-field");

    if (modalMode === "add-states") {
      if (titleEl) {
        titleEl.textContent = `Add States - ${formatFileNameLabel(modalTargetAnimName)}`;
      }
      if (nameField) {
        nameField.hidden = true;
      }
      if (confirmAddLottieModalBtn) {
        confirmAddLottieModalBtn.textContent = "Add States";
      }
    } else {
      if (titleEl) {
        titleEl.textContent = "Add Lottie Animation";
      }
      if (nameField) {
        nameField.hidden = false;
      }
      if (confirmAddLottieModalBtn) {
        confirmAddLottieModalBtn.textContent = "Add Animation";
      }
      if (modalAnimNameInput) {
        modalAnimNameInput.value = "";
        modalAnimNameInput.classList.remove("is-error");
      }
    }

    hideModalError();

    if (modalStatesList) {
      modalStatesList.innerHTML = "";
      modalStatesList.appendChild(createModalStateRow());
    }

    addLottieModalEl.showModal();
  }

  /** Close modal regardless of current mode. */
  function close() {
    addLottieModalEl?.close();
  }

  // Validate inputs, delegate persistence to onConfirm, then close on success.
  async function handleConfirm() {
    let animName;
    if (modalMode === "add-states") {
      animName = modalTargetAnimName ?? "";
    } else {
      animName = (modalAnimNameInput?.value ?? "").trim();
      if (!animName) {
        if (modalAnimNameInput) {
          modalAnimNameInput.classList.add("is-error");
          modalAnimNameInput.focus();
        }
        showModalError("Animation name is required.");
        return;
      }
      modalAnimNameInput?.classList.remove("is-error");
    }

    const stateEntries = collectStateEntries();
    if (!stateEntries.length) {
      showModalError("Add at least one state with a JSON file.");
      return;
    }

    hideModalError();
    const result = await onConfirm({
      mode: modalMode,
      targetAnimName: modalTargetAnimName,
      animName,
      stateEntries,
    });

    if (result?.error) {
      showModalError(result.error);
      return;
    }

    close();
  }

  closeAddLottieModalBtn?.addEventListener("click", close);
  cancelAddLottieModalBtn?.addEventListener("click", close);
  confirmAddLottieModalBtn?.addEventListener("click", () => {
    void handleConfirm();
  });

  modalAddStateRowBtn?.addEventListener("click", () => {
    if (modalStatesList) {
      modalStatesList.appendChild(createModalStateRow());
    }
  });

  addLottieModalEl?.addEventListener("click", (event) => {
    if (event.target === addLottieModalEl) {
      close();
    }
  });

  return {
    open,
    close,
    showModalError,
    hideModalError,
  };
}
