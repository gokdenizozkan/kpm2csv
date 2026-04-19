const core = window.kpm2csvCore;
const cardMessages = {
    Website: {
        empty: "entries.",
        singular: "entry ready.",
        plural: "entries ready."
    },
    Application: {
        empty: "entries.",
        singular: "entry ready.",
        plural: "entries ready."
    },
    Other: {
        empty: "entries.",
        singular: "entry ready.",
        plural: "entries ready."
    },
    Note: {
        empty: "entries.",
        singular: "entry ready.",
        plural: "entries ready."
    }
};
const statusBadges = {
    idle: "Idle",
    processing: "Reading",
    converted: "Ready",
    empty: "Empty",
    error: "Error"
};
const entryTypes = core ? Array.from(core.entryTypeClasses.keys()) : Object.keys(cardMessages);
const downloadUrls = new Map();
let parseSequence = 0;
let dragDepth = 0;

const dom = {
    fileInput: document.getElementById("file-input"),
    resetButton: document.getElementById("reset-button"),
    dropZone: document.getElementById("drop-zone"),
    selectedFile: document.getElementById("selected-file"),
    statusPanel: document.getElementById("upload-status"),
    statusTitle: document.getElementById("status-title"),
    statusMessage: document.getElementById("status-message"),
    statusSteps: new Map(Object.keys(statusBadges).map((state) => [state, document.querySelector(`.status-step[data-state="${state}"]`)])),
    resultCards: new Map(entryTypes.map((type) => {
        const card = document.querySelector(`[data-entry-type="${type}"]`);
        return [type, {
            card,
            count: card.querySelector("[data-entry-count]"),
            state: card.querySelector("[data-entry-state]"),
            download: card.querySelector("[data-entry-download]")
        }];
    }))
};

function forEachEntryType(callback) {
    if (core) {
        core.entryTypeClasses.forEach((entryClass, type) => {
            callback(type, entryClass);
        });
        return;
    }

    entryTypes.forEach((type) => {
        callback(type, null);
    });
}

function createFile(data) {
    return new Blob([data], { type: "text/csv;charset=utf-8" });
}

function setStatus(state, title, message) {
    dom.statusPanel.dataset.state = state;
    dom.statusTitle.textContent = title;
    dom.statusMessage.textContent = message;
    dom.statusSteps.forEach((step, stepState) => {
        step.dataset.active = String(stepState === state);
    });
}

function setSelectedFile(fileName) {
    dom.selectedFile.textContent = fileName;
}

function setDropZoneState(isActive) {
    dom.dropZone.dataset.dragActive = String(isActive);
}

function revokeDownloadUrl(type) {
    const currentUrl = downloadUrls.get(type);
    if (!currentUrl) {
        return;
    }

    URL.revokeObjectURL(currentUrl);
    downloadUrls.delete(type);
}

function setResultCard(type, count, hasDownload) {
    const cardUi = dom.resultCards.get(type);
    const messageSet = cardMessages[type];
    const isActive = count > 0;

    cardUi.card.dataset.active = String(isActive);
    cardUi.count.textContent = String(count);
    cardUi.state.textContent = isActive
        ? count === 1 ? messageSet.singular : messageSet.plural
        : messageSet.empty;

    if (!hasDownload) {
        cardUi.download.hidden = true;
        cardUi.download.removeAttribute("href");
        cardUi.download.removeAttribute("download");
        cardUi.download.setAttribute("aria-disabled", "true");
        return;
    }

    cardUi.download.hidden = false;
    cardUi.download.setAttribute("aria-disabled", "false");
}

function resetResults() {
    forEachEntryType((type) => {
        revokeDownloadUrl(type);
        setResultCard(type, 0, false);
    });
}

function resetInterface() {
    resetResults();
    setSelectedFile("No file selected.");
    setStatus(
        "idle",
        "Choose a file.",
        "Processed locally."
    );
}

function sanitizeFileNamePart(fileName) {
    return fileName
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
}

function buildDownloadName(fileName, type) {
    const baseName = sanitizeFileNamePart(fileName) || "kpm-export";
    return `${baseName}-${type.toLowerCase()}.csv`;
}

function setDownload(type, blob, fileName) {
    const cardUi = dom.resultCards.get(type);
    const url = URL.createObjectURL(blob);

    revokeDownloadUrl(type);
    downloadUrls.set(type, url);

    cardUi.download.href = url;
    cardUi.download.download = buildDownloadName(fileName, type);
}

function renderEntries(entries, fileName) {
    let totalEntries = 0;
    let activeCategories = 0;

    core.entryTypeClasses.forEach((entryClass, type) => {
        const items = entries.get(type);
        const count = items.length;
        totalEntries += count;

        if (count === 0) {
            setResultCard(type, 0, false);
            return;
        }

        activeCategories += 1;
        const csv = core.toCsv(items, entryClass);
        setDownload(type, createFile(csv), fileName);
        setResultCard(type, count, true);
    });

    return { totalEntries, activeCategories };
}

function isLikelyTextFile(file) {
    return file.type === "" || file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt");
}

function parseFile(file, sequence) {
    if (!core) {
        setStatus("error", "Parser unavailable.", "Reload the page and try again.");
        return;
    }

    resetResults();
    setSelectedFile(file.name);
    setStatus("processing", "Reading file.", "Processing locally.");

    const reader = new FileReader();
    reader.onload = ({ target }) => {
        if (sequence !== parseSequence) {
            return;
        }

        try {
            const entries = core.parse(String(target.result || ""));
            const { totalEntries, activeCategories } = renderEntries(entries, file.name);
            if (totalEntries === 0) {
                setStatus(
                    "empty",
                    "Nothing found.",
                    "No supported entries in this file."
                );
                return;
            }

            setStatus(
                "converted",
                "Ready.",
                `${totalEntries} entries in ${activeCategories} ${activeCategories === 1 ? "category" : "categories"}.`
            );
        } catch (error) {
            console.error(error);
            resetResults();
            setStatus(
                "error",
                "Could not parse file.",
                "Choose a plain-text KPM export."
            );
        }
    };

    reader.onerror = () => {
        if (sequence !== parseSequence) {
            return;
        }

        resetResults();
        setStatus(
            "error",
            "Could not read file.",
            "Try the export again."
        );
    };

    reader.readAsText(file, "utf-8");
}

function handleFiles(fileList) {
    const [file] = fileList || [];
    parseSequence += 1;

    if (!file) {
        resetInterface();
        return;
    }

    setSelectedFile(file.name);
    resetResults();

    if (!isLikelyTextFile(file)) {
        setStatus(
            "error",
            "Unsupported file.",
            "Choose a plain-text KPM export (.txt)."
        );
        return;
    }

    const sequence = parseSequence;
    parseFile(file, sequence);
}

function handleFileSelection(event) {
    handleFiles(event.target.files);
}

function syncInputFiles(fileList) {
    if (!fileList || fileList.length === 0) {
        return;
    }

    try {
        dom.fileInput.files = fileList;
        return;
    } catch {
    }

    if (typeof DataTransfer !== "function") {
        return;
    }

    try {
        const transfer = new DataTransfer();
        Array.from(fileList).forEach((file) => transfer.items.add(file));
        dom.fileInput.files = transfer.files;
    } catch {
    }
}

function handleDrop(event) {
    event.preventDefault();
    dragDepth = 0;
    setDropZoneState(false);
    syncInputFiles(event.dataTransfer.files);
    handleFiles(event.dataTransfer.files);
}

function handleDragEnter(event) {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) {
        return;
    }

    event.preventDefault();
    dragDepth += 1;
    setDropZoneState(true);
}

function handleDragLeave(event) {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) {
        return;
    }

    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
        setDropZoneState(false);
    }
}

function handleDragOver(event) {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) {
        return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
}

function resetFileSelection() {
    parseSequence += 1;
    dom.fileInput.value = "";
    dragDepth = 0;
    setDropZoneState(false);
    resetInterface();
}

dom.fileInput.addEventListener("change", handleFileSelection);
dom.resetButton.addEventListener("click", resetFileSelection);
dom.dropZone.addEventListener("dragenter", handleDragEnter);
dom.dropZone.addEventListener("dragleave", handleDragLeave);
dom.dropZone.addEventListener("dragover", handleDragOver);
dom.dropZone.addEventListener("drop", handleDrop);
window.addEventListener("beforeunload", () => {
    forEachEntryType((type) => revokeDownloadUrl(type));
});

resetInterface();

if (!core) {
    setStatus("error", "Parser unavailable.", "Reload the page and try again.");
}
