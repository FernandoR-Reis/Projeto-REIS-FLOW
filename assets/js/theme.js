// =============================================================
//  REIS FLOW — Tema global (Dark / Light)
// =============================================================

(function themeBootstrap() {
  const STORAGE_KEY = 'reisflow_theme';
  let currentTheme = 'dark';

  function resolveTheme(value) {
    return value === 'light' ? 'light' : 'dark';
  }

  function updateThemeButtons() {
    document.querySelectorAll('[data-theme-value]').forEach((button) => {
      const active = button.dataset.themeValue === currentTheme;
      button.classList.toggle('active', active);
    });

    const topbarIcon = document.querySelector('#theme-toggle-btn i');
    if (topbarIcon) {
      topbarIcon.className = currentTheme === 'light' ? 'ti ti-sun' : 'ti ti-moon';
    }
  }

  function applyTheme(theme) {
    currentTheme = resolveTheme(theme);
    document.body.classList.toggle('theme-light', currentTheme === 'light');
    updateThemeButtons();
  }

  function setTheme(theme) {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, currentTheme);
  }

  function toggleTheme() {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  function bindThemeButtons() {
    document.querySelectorAll('[data-theme-value]').forEach((button) => {
      if (button.dataset.themeBound === '1') return;
      button.dataset.themeBound = '1';
      button.addEventListener('click', () => {
        setTheme(button.dataset.themeValue);
      });
    });
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    applyTheme(savedTheme || 'dark');
    bindThemeButtons();
  }

  window.setTheme = setTheme;
  window.toggleTheme = toggleTheme;
  window.getCurrentTheme = () => currentTheme;

  window.addEventListener('DOMContentLoaded', initTheme);
})();
