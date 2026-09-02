/* ============================================================
   StudyMate AI — frontend logic
   Handles: mode selection, input validation, API calls,
   loading state, result/error display, copy-to-clipboard.
   ============================================================ */

(() => {
  const MIN_LENGTH = 10;
  const MAX_LENGTH = 6000;

  // Elements
  const hero = document.getElementById("hero");
  const workspace = document.getElementById("workspace");
  const modeGrid = document.getElementById("modeGrid");
  const backBtn = document.getElementById("backBtn");

  const wsIcon = document.getElementById("wsIcon");
  const wsTitle = document.getElementById("wsTitle");
  const wsDesc = document.getElementById("wsDesc");

  const contentInput = document.getElementById("contentInput");
  const charCount = document.getElementById("charCount");
  const inputError = document.getElementById("inputError");

  const clearBtn = document.getElementById("clearBtn");
  const generateBtn = document.getElementById("generateBtn");
  const generateLabel = document.getElementById("generateLabel");
  const spinner = document.getElementById("spinner");

  const resultCard = document.getElementById("resultCard");
  const resultContent = document.getElementById("resultContent");
  const copyBtn = document.getElementById("copyBtn");

  const errorCard = document.getElementById("errorCard");
  const errorText = document.getElementById("errorText");

  let currentMode = null;

  // ---------- Mode selection ----------

  modeGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".mode-card");
    if (!card) return;

    currentMode = card.dataset.mode;
    wsIcon.textContent = card.dataset.icon;
    wsTitle.textContent = card.dataset.title;
    wsDesc.textContent = card.dataset.desc;

    resetWorkspace();

    hero.hidden = true;
    workspace.hidden = false;
    contentInput.focus();
  });

  backBtn.addEventListener("click", () => {
    workspace.hidden = true;
    hero.hidden = false;
  });

  // ---------- Character counter + live validation ----------

  contentInput.addEventListener("input", () => {
    const len = contentInput.value.length;
    charCount.textContent = `${len} / ${MAX_LENGTH}`;
    if (inputError.textContent) {
      clearInputError();
    }
  });

  // ---------- Clear button ----------

  clearBtn.addEventListener("click", () => {
    resetWorkspace();
    contentInput.focus();
  });

  function resetWorkspace() {
    contentInput.value = "";
    charCount.textContent = `0 / ${MAX_LENGTH}`;
    clearInputError();
    hideResult();
    hideError();
    setLoading(false);
  }

  // ---------- Validation ----------

  function validateInput(value) {
    if (!value.trim()) {
      return "Please enter some content first.";
    }
    if (value.trim().length < MIN_LENGTH) {
      return "Please provide a little more content.";
    }
    if (value.length > MAX_LENGTH) {
      return `Your input is too long. Please limit it to ${MAX_LENGTH} characters.`;
    }
    return null;
  }

  function showInputError(message) {
    inputError.textContent = message;
    contentInput.classList.add("is-invalid");
  }

  function clearInputError() {
    inputError.textContent = "";
    contentInput.classList.remove("is-invalid");
  }

  // ---------- Generate ----------

  generateBtn.addEventListener("click", async () => {
    const value = contentInput.value;
    const validationMessage = validateInput(value);

    hideError();

    if (validationMessage) {
      showInputError(validationMessage);
      return;
    }
    clearInputError();

    setLoading(true);
    hideResult();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: currentMode, content: value.trim() }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("The server sent back an unexpected response. Please try again.");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      showResult(data.response);
    } catch (err) {
      showError(err.message || "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    clearBtn.disabled = isLoading;
    spinner.hidden = !isLoading;
    generateLabel.textContent = isLoading ? "Generating..." : "Generate";
  }

  // ---------- Result rendering ----------

  function showResult(text) {
    resultContent.innerHTML = renderMarkdownLite(text);
    resultCard.hidden = false;
  }

  function hideResult() {
    resultCard.hidden = true;
    resultContent.innerHTML = "";
  }

  function showError(message) {
    errorText.textContent = message;
    errorCard.hidden = false;
  }

  function hideError() {
    errorCard.hidden = true;
    errorText.textContent = "";
  }

  // Very small, safe markdown-ish renderer: escapes HTML first, then
  // turns "## Heading" lines into <h2> and "- item" lines into bullets.
  function renderMarkdownLite(raw) {
    const escape = (s) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const lines = escape(raw).split("\n");
    let html = "";
    let inList = false;

    for (const line of lines) {
      const heading = line.match(/^##\s+(.*)/);
      const bullet = line.match(/^[-*]\s+(.*)/);

      if (heading) {
        if (inList) { html += "</ul>"; inList = false; }
        html += `<h2>${boldify(heading[1])}</h2>`;
      } else if (bullet) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += `<li>${boldify(bullet[1])}</li>`;
      } else if (line.trim() === "") {
        if (inList) { html += "</ul>"; inList = false; }
        html += "<br>";
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        html += `<p>${boldify(line)}</p>`;
      }
    }
    if (inList) html += "</ul>";
    return html;
  }

  function boldify(text) {
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  // ---------- Copy ----------

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(resultContent.innerText);
      const original = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = original), 1500);
    } catch {
      copyBtn.textContent = "Copy failed";
      setTimeout(() => (copyBtn.textContent = "Copy Response"), 1500);
    }
  });
})();
