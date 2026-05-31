// =============================================================
//  REIS FLOW — Protecao best effort de interface
// =============================================================

(function protectionBootstrap() {
  const PROTECTION_ENABLED = true;
  if (!PROTECTION_ENABLED) return;

  function notify(message) {
    if (typeof showToast === 'function') {
      showToast(message, 'warning');
    }
  }

  function blockEvent(event, message) {
    event.preventDefault();
    event.stopPropagation();
    notify(message);
  }

  // Impede menu de contexto para dificultar copia rapida.
  document.addEventListener('contextmenu', (event) => {
    blockEvent(event, 'Clique direito desabilitado nesta interface');
  });

  // Bloqueios de atalhos comuns de inspeção/cópia/export.
  document.addEventListener('keydown', (event) => {
    const key = String(event.key || '').toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;

    if (key === 'f12') {
      blockEvent(event, 'Ferramentas de desenvolvedor bloqueadas neste modo');
      return;
    }

    if (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c', 's'].includes(key)) {
      blockEvent(event, 'Atalho de inspeção/captura bloqueado');
      return;
    }

    if (ctrlOrMeta && ['u', 's', 'p'].includes(key)) {
      blockEvent(event, 'Atalho bloqueado neste ambiente');
      return;
    }

    if (key === 'printscreen') {
      blockEvent(event, 'Captura via tecla PrintScreen bloqueada');
    }
  });

  // Bloqueio de captura programatica de tela (nao bloqueia gravacao do sistema).
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getDisplayMedia = (...args) => {
      notify('Captura de tela pelo navegador foi bloqueada');
      return Promise.reject(new Error('Screen capture blocked by policy'));
    };

    navigator.mediaDevices.getDisplayMedia._original = originalGetDisplayMedia;
  }
})();
