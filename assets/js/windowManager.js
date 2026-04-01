/**
 * macOS Window Manager
 * Supports multiple windows, open/close animations, minimize into dock,
 * maximize, resize, drag, z-index focus.
 */

const WindowManager = (() => {
  let windowZIndex = 400;
  const windows = new Map(); // windowId -> windowState
  let windowIdCounter = 0;

  // App registry
  const appRegistry = {
    'pages': { title: 'Pages', src: 'assets/componets/pages.html', icon: 'assets/icon/notes.png', defaultWidth: 800, defaultHeight: 550 },
    'calculator': { title: 'Calculator', src: 'assets/componets/calculator.html', icon: 'assets/icon/calculator.png', defaultWidth: 420, defaultHeight: 580 },
    'converter': { title: 'Converter', src: 'assets/componets/converter.html', icon: 'assets/icon/converter.png', defaultWidth: 900, defaultHeight: 600 },
    'tools': { title: 'Tools', src: 'assets/componets/converter.html', icon: 'assets/icon/tools.png', defaultWidth: 900, defaultHeight: 600, onLoad: (iframe) => {
      setTimeout(() => {
        try {
          const toolsTab = iframe.contentDocument.getElementById('tools-tab');
          if (toolsTab) toolsTab.click();
        } catch(e) {}
      }, 200);
    }},
  };

  // Stagger offset for new windows
  let staggerOffset = 0;

  // ─── Dock divider management ───
  let dockDivider = null;

  function ensureDockDivider() {
    if (dockDivider && dockDivider.parentNode) return dockDivider;
    const dockbar = document.querySelector('.dockbar');
    if (!dockbar) return null;

    dockDivider = document.createElement('li');
    dockDivider.className = 'dock-divider';
    dockDivider.innerHTML = '<span class="dock-divider-line"></span>';
    dockbar.appendChild(dockDivider);

    // Animate in
    requestAnimationFrame(() => {
      dockDivider.classList.add('dock-divider-visible');
    });

    return dockDivider;
  }

  function removeDockDividerIfEmpty() {
    // Check if there are any minimized items left in the dock
    const minimizedItems = document.querySelectorAll('.wm-dock-item');
    if (minimizedItems.length === 0 && dockDivider) {
      dockDivider.classList.remove('dock-divider-visible');
      dockDivider.classList.add('dock-divider-removing');
      setTimeout(() => {
        if (dockDivider && dockDivider.parentNode) {
          dockDivider.remove();
        }
        dockDivider = null;
      }, 300);
    }
  }

  // ─── Window element creation ───
  function createWindowElement(id, app) {
    const el = document.createElement('div');
    el.className = 'wm-window';
    el.id = `wm-window-${id}`;
    el.dataset.windowId = id;
    el.dataset.appName = app.title;

    el.innerHTML = `
      <div class="wm-titlebar" data-window-id="${id}">
        <div class="wm-traffic-lights">
          <button class="wm-btn wm-close" data-action="close" data-window-id="${id}" title="Close">
            <svg width="6" height="6" viewBox="0 0 6 6"><path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
          <button class="wm-btn wm-minimize" data-action="minimize" data-window-id="${id}" title="Minimize">
            <svg width="8" height="2" viewBox="0 0 8 2"><path d="M1 1H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
          <button class="wm-btn wm-maximize" data-action="maximize" data-window-id="${id}" title="Maximize">
            <svg width="6" height="6" viewBox="0 0 6 6"><path d="M1 1h4v4H1z" stroke="currentColor" stroke-width="1" fill="none"/></svg>
          </button>
        </div>
        <div class="wm-title">${app.title}</div>
      </div>
      <div class="wm-content">
        <iframe src="${app.src}" class="wm-iframe" id="wm-iframe-${id}"></iframe>
      </div>
      <!-- Resize handles -->
      <div class="wm-resize wm-resize-n" data-resize="n"></div>
      <div class="wm-resize wm-resize-s" data-resize="s"></div>
      <div class="wm-resize wm-resize-e" data-resize="e"></div>
      <div class="wm-resize wm-resize-w" data-resize="w"></div>
      <div class="wm-resize wm-resize-ne" data-resize="ne"></div>
      <div class="wm-resize wm-resize-nw" data-resize="nw"></div>
      <div class="wm-resize wm-resize-se" data-resize="se"></div>
      <div class="wm-resize wm-resize-sw" data-resize="sw"></div>
    `;

    return el;
  }

  function getWindowContainer() {
    let container = document.getElementById('wm-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'wm-container';
      document.querySelector('.content').appendChild(container);
    }
    return container;
  }

  // ─── Open window ───
  function openWindow(appName) {
    const app = appRegistry[appName];
    if (!app) return;

    const id = windowIdCounter++;
    const container = getWindowContainer();
    const el = createWindowElement(id, app);

    // Calculate centered position with stagger
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const startX = Math.max(60, (viewW - app.defaultWidth) / 2 + staggerOffset * 30);
    const startY = Math.max(40, (viewH - app.defaultHeight) / 2 + staggerOffset * 30);

    staggerOffset = (staggerOffset + 1) % 8;

    // Set initial styles
    el.style.width = app.defaultWidth + 'px';
    el.style.height = app.defaultHeight + 'px';
    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    el.style.zIndex = ++windowZIndex;

    container.appendChild(el);

    const state = {
      id,
      appName,
      app,
      el,
      isMaximized: false,
      isMinimized: false,
      prevBounds: null,
      width: app.defaultWidth,
      height: app.defaultHeight,
      x: startX,
      y: startY,
      dockItem: null, // reference to the minimized dock <li>
    };

    windows.set(id, state);

    // Trigger open animation
    requestAnimationFrame(() => {
      el.classList.add('wm-opening');
      requestAnimationFrame(() => {
        el.classList.add('wm-visible');
        el.classList.remove('wm-opening');
      });
    });

    // iframe onload callback
    if (app.onLoad) {
      const iframe = el.querySelector('.wm-iframe');
      iframe.onload = () => app.onLoad(iframe);
    }

    // Setup drag, resize, buttons
    setupWindowInteractions(state);
    focusWindow(id);

    // Add bounce to the app icon on the desktop
    const iconEl = document.getElementById(`${appName === 'pages' ? 'notes' : appName}-app-icon`);
    if (iconEl) {
      iconEl.classList.add('wm-icon-bounce');
      setTimeout(() => iconEl.classList.remove('wm-icon-bounce'), 800);
    }

    return id;
  }

  // ─── Focus ───
  function focusWindow(id) {
    const state = windows.get(id);
    if (!state) return;
    state.el.style.zIndex = ++windowZIndex;
    windows.forEach((s, wid) => {
      s.el.classList.toggle('wm-focused', wid === id);
    });
  }

  // ─── Close ───
  function closeWindow(id) {
    const state = windows.get(id);
    if (!state) return;

    const el = state.el;
    el.classList.add('wm-closing');
    el.classList.remove('wm-visible');

    el.addEventListener('animationend', () => {
      el.remove();
      windows.delete(id);
      removeDockMinimizedItem(id);
    }, { once: true });
  }

  // ─── Minimize — genie effect into the main dock ───
  function minimizeWindow(id) {
    const state = windows.get(id);
    if (!state || state.isMinimized) return;

    state.isMinimized = true;
    const el = state.el;

    // First create the dock item so we know where to animate to
    const dockItem = addDockMinimizedItem(id, state);
    state.dockItem = dockItem;

    // Get positions
    const windowRect = el.getBoundingClientRect();
    const dockItemRect = dockItem.getBoundingClientRect();

    // Target center
    const targetCX = dockItemRect.left + dockItemRect.width / 2;
    const targetCY = dockItemRect.top + dockItemRect.height / 2;
    const windowCX = windowRect.left + windowRect.width / 2;
    const windowCY = windowRect.top + windowRect.height / 2;

    const translateX = targetCX - windowCX;
    const translateY = targetCY - windowCY;
    const scaleX = 40 / windowRect.width;
    const scaleY = 40 / windowRect.height;

    // Create a thumbnail snapshot for the genie effect
    el.style.transformOrigin = 'center bottom';
    el.style.transition = 'none';
    el.style.willChange = 'transform, opacity, border-radius';

    requestAnimationFrame(() => {
      el.style.transition = 
        'transform 0.5s cubic-bezier(0.4, 0, 0.15, 1), ' +
        'opacity 0.4s cubic-bezier(0.4, 0, 0.15, 1), ' +
        'border-radius 0.4s ease';
      el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
      el.style.opacity = '0';
      el.style.borderRadius = '8px';
    });

    // After animation completes, hide the window
    setTimeout(() => {
      el.style.display = 'none';
      el.style.transition = '';
      el.style.willChange = '';
      // Add the active dot indicator to the dock item
      dockItem.classList.add('wm-dock-item-active');
    }, 520);
  }

  // ─── Restore — reverse genie from dock ───
  function restoreWindow(id) {
    const state = windows.get(id);
    if (!state || !state.isMinimized) return;

    state.isMinimized = false;
    const el = state.el;

    // Show element — it still has its minimized transform
    el.style.display = '';

    requestAnimationFrame(() => {
      el.style.transformOrigin = 'center bottom';
      el.style.transition = 
        'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), ' +
        'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), ' +
        'border-radius 0.35s ease';
      el.style.transform = state.isMaximized ? 'scale(1)' : '';
      el.style.opacity = '1';
      el.style.borderRadius = '12px';

      setTimeout(() => {
        el.style.transition = '';
        el.style.transformOrigin = '';
        el.style.willChange = '';
      }, 470);
    });

    // Remove the dock item with animation
    removeDockMinimizedItem(id);
    state.dockItem = null;
    focusWindow(id);
  }

  // ─── Maximize ───
  function maximizeWindow(id) {
    const state = windows.get(id);
    if (!state) return;

    if (state.isMaximized) {
      state.isMaximized = false;
      const el = state.el;
      el.classList.remove('wm-maximized');

      if (state.prevBounds) {
        el.style.width = state.prevBounds.width + 'px';
        el.style.height = state.prevBounds.height + 'px';
        el.style.left = state.prevBounds.x + 'px';
        el.style.top = state.prevBounds.y + 'px';
      }
    } else {
      state.prevBounds = {
        width: state.el.offsetWidth,
        height: state.el.offsetHeight,
        x: parseInt(state.el.style.left) || 0,
        y: parseInt(state.el.style.top) || 0,
      };
      state.isMaximized = true;
      state.el.classList.add('wm-maximized');
    }
  }

  // ─── Dock item management — inject into the REAL dock ───
  function addDockMinimizedItem(id, state) {
    const dockbar = document.querySelector('.dockbar');
    if (!dockbar) return null;

    // Ensure a divider separates normal dock items from minimized ones
    ensureDockDivider();

    const li = document.createElement('li');
    li.className = 'dockitems wm-dock-item';
    li.dataset.windowId = id;
    li.innerHTML = `
      <span class="dockitemlabel">${state.app.title}</span>
      <a href="#" class="dockitemlink wm-dock-link" title="${state.app.title}">
        <img src="${state.app.icon}" alt="${state.app.title}" class="dockitemicon" />
      </a>
      <span class="wm-dock-dot"></span>
    `;

    // Handle click to restore
    li.querySelector('.wm-dock-link').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      restoreWindow(id);
    });

    // Insert after the divider
    if (dockDivider && dockDivider.parentNode) {
      dockDivider.after(li);
    } else {
      dockbar.appendChild(li);
    }

    // Animate in with a subtle pop
    li.style.width = '0';
    li.style.opacity = '0';
    li.style.overflow = 'hidden';
    li.style.transition = 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, margin 0.35s ease';

    requestAnimationFrame(() => {
      li.style.width = '40px';
      li.style.opacity = '1';
      li.style.margin = '0 4px';
    });

    // After animation, clean inline styles
    setTimeout(() => {
      li.style.transition = '';
      li.style.overflow = '';
    }, 380);

    return li;
  }

  function removeDockMinimizedItem(id) {
    const item = document.querySelector(`.wm-dock-item[data-window-id="${id}"]`);
    if (!item) return;

    // Animate out
    item.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 1, 1), opacity 0.25s ease, margin 0.3s ease';
    item.style.width = '0';
    item.style.opacity = '0';
    item.style.margin = '0';
    item.style.overflow = 'hidden';

    setTimeout(() => {
      item.remove();
      removeDockDividerIfEmpty();
    }, 320);
  }

  // ─── Window interactions (drag, resize, buttons) ───
  function setupWindowInteractions(state) {
    const { el, id } = state;

    // Focus on click
    el.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.wm-btn')) {
        focusWindow(id);
      }
    });

    // Traffic light buttons
    el.querySelectorAll('.wm-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const wid = parseInt(btn.dataset.windowId);
        if (action === 'close') closeWindow(wid);
        else if (action === 'minimize') minimizeWindow(wid);
        else if (action === 'maximize') maximizeWindow(wid);
      });
    });

    // Titlebar drag
    const titlebar = el.querySelector('.wm-titlebar');
    let isDragging = false;
    let dragOffsetX, dragOffsetY;

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.wm-btn') || e.target.closest('.wm-traffic-lights')) return;
      if (state.isMaximized) return;

      isDragging = true;
      const rect = el.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      el.classList.add('wm-dragging');
      focusWindow(id);
      e.preventDefault();
    });

    // Double-click titlebar to maximize
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.wm-btn')) return;
      maximizeWindow(id);
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffsetX;
      const newY = Math.max(0, e.clientY - dragOffsetY);
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        el.classList.remove('wm-dragging');
      }
    });

    // Resize handles
    setupResize(state);
  }

  function setupResize(state) {
    const { el, id } = state;
    const handles = el.querySelectorAll('.wm-resize');
    let isResizing = false;
    let resizeDir = '';
    let startX, startY, startW, startH, startLeft, startTop;

    const MIN_W = 320;
    const MIN_H = 250;

    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        if (state.isMaximized) return;
        isResizing = true;
        resizeDir = handle.dataset.resize;
        startX = e.clientX;
        startY = e.clientY;
        startW = el.offsetWidth;
        startH = el.offsetHeight;
        startLeft = parseInt(el.style.left) || 0;
        startTop = parseInt(el.style.top) || 0;
        el.classList.add('wm-resizing');
        focusWindow(id);
        e.preventDefault();
        e.stopPropagation();
      });
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newW = startW;
      let newH = startH;
      let newLeft = startLeft;
      let newTop = startTop;

      if (resizeDir.includes('e')) newW = Math.max(MIN_W, startW + dx);
      if (resizeDir.includes('w')) {
        newW = Math.max(MIN_W, startW - dx);
        if (newW !== MIN_W) newLeft = startLeft + dx;
      }
      if (resizeDir.includes('s')) newH = Math.max(MIN_H, startH + dy);
      if (resizeDir.includes('n')) {
        newH = Math.max(MIN_H, startH - dy);
        if (newH !== MIN_H) newTop = startTop + dy;
      }

      el.style.width = newW + 'px';
      el.style.height = newH + 'px';
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        el.classList.remove('wm-resizing');
      }
    });
  }

  // Public API
  return {
    open: openWindow,
    close: closeWindow,
    minimize: minimizeWindow,
    restore: restoreWindow,
    maximize: maximizeWindow,
    focus: focusWindow,
    getWindows: () => windows,
    registerApp: (name, config) => { appRegistry[name] = config; },
  };
})();

// Export for use
window.WindowManager = WindowManager;
