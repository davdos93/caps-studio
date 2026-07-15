(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function toast(message) {
    document.querySelector(".toast")?.remove();

    const element = document.createElement("div");
    element.className = "toast";
    element.textContent = message;
    document.body.appendChild(element);

    window.setTimeout(() => element.remove(), 1800);
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    URL.revokeObjectURL(link.href);
  }

  window.CAPS_UI = {
    escapeHtml,
    toast,
    downloadFile
  };
})();
