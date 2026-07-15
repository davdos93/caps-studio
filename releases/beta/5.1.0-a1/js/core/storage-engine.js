(function () {
  "use strict";

  const STORAGE_KEY = "caps-studio-projects-v5-1-a1";

  function loadProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("CAPS: Projektdaten konnten nicht geladen werden.", error);
      return [];
    }
  }

  function saveProjects(projects) {
    if (!Array.isArray(projects)) {
      throw new TypeError("projects muss ein Array sein.");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.CAPS_Storage = {
    loadProjects,
    saveProjects,
    clearAll
  };
})();
