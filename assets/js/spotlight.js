(function () {
  const spotlight = document.getElementById("spotlight");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const clearBtn = document.getElementById("clearBtn");
  const quickLinksBtn = document.getElementById("quickLinksBtn");
  const resultsPanel = document.getElementById("resultsPanel");
  const resultsInner = document.getElementById("resultsInner");

  let isOpen = false;
  let selectedIndex = -1;
  let resultItems = [];
  let debounceTimer = null;
  let quickLinksVisible = false;

  const quickLinks = [
    { icon: "🔍", title: "Google", subtitle: "www.google.com", url: "https://www.google.com", type: "google" },
    { icon: "📧", title: "Gmail", subtitle: "mail.google.com", url: "https://mail.google.com", type: "google" },
    { icon: "📺", title: "YouTube", subtitle: "www.youtube.com", url: "https://www.youtube.com", type: "google" },
    { icon: "🗺️", title: "Google Maps", subtitle: "maps.google.com", url: "https://maps.google.com", type: "google" },
    { icon: "📰", title: "Google News", subtitle: "news.google.com", url: "https://news.google.com", type: "google" },
  ];

  function openSpotlight() {
    if (isOpen) return;
    isOpen = true;
    spotlight.classList.add("active");
    searchInput.focus();
  }

  function closeSpotlight() {
    if (!isOpen) return;
    isOpen = false;
    spotlight.classList.remove("active");
    resultsPanel.classList.remove("open");
    selectedIndex = -1;
    quickLinksVisible = false;
    quickLinksBtn.classList.remove("active");
  }

  function showDefaultResults() {
    let html = '<div class="section-label">Quick Links</div>';
    quickLinks.forEach((item, i) => {
      html += `
          <div class="result-item" data-index="${i}" data-url="${item.url}" onclick="window.open('${item.url}', '_blank')">
            <div class="result-icon ${item.type}">${item.icon}</div>
            <div class="result-text">
              <div class="result-title">${item.title}</div>
              <div class="result-subtitle">${item.subtitle}</div>
            </div>
            <div class="result-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>`;
    });
    resultsInner.innerHTML = html;
    resultsPanel.classList.add("open");
    resultItems = resultsInner.querySelectorAll(".result-item");
    selectedIndex = -1;
  }

  function showSearchSuggestions(query) {
    if (!query.trim()) {
      if (!quickLinksVisible) {
        resultsPanel.classList.remove("open");
        resultsInner.innerHTML = "";
        resultItems = [];
        selectedIndex = -1;
      }
      return;
    }
    quickLinksVisible = false;
    quickLinksBtn.classList.remove("active");

    const suggestions = [
      `${query}`,
      `${query} tutorial`,
      `${query} examples`,
      `${query} documentation`,
      `${query} reddit`,
      `how to ${query}`,
      `best ${query}`,
    ];

    let html = '<div class="section-label">Search Google</div>';
    suggestions.forEach((s, i) => {
      html += `
          <div class="result-item" data-index="${i}" data-query="${s}" onclick="searchGoogle('${s.replace(/'/g, "\\'")}')">
            <div class="result-icon suggestion">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(100,200,255,0.7)" stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div class="result-text">
              <div class="result-title">${highlightMatch(s, query)}</div>
              <div class="result-subtitle">Search Google</div>
            </div>
            <div class="result-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>`;
    });

    resultsInner.innerHTML = html;
    resultsPanel.classList.add("open");
    resultItems = resultsInner.querySelectorAll(".result-item");
    selectedIndex = 0;
    updateSelection();
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return `${before}<strong style="color:#fff;font-weight:500">${match}</strong>${after}`;
  }

  window.searchGoogle = function (query) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
  };

  function updateSelection() {
    resultItems.forEach((item, i) => {
      item.classList.toggle("selected", i === selectedIndex);
    });
    if (selectedIndex >= 0 && resultItems[selectedIndex]) {
      resultItems[selectedIndex].scrollIntoView({ block: "nearest" });
    }
  }

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (isOpen) closeSpotlight();
      return;
    }

    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      closeSpotlight();
      return;
    }

    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (resultItems.length > 0) {
        selectedIndex = (selectedIndex + 1) % resultItems.length;
        updateSelection();
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (resultItems.length > 0) {
        selectedIndex = (selectedIndex - 1 + resultItems.length) % resultItems.length;
        updateSelection();
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && resultItems[selectedIndex]) {
        const item = resultItems[selectedIndex];
        const url = item.dataset.url;
        const query = item.dataset.query;
        if (url) {
          window.open(url, "_blank");
        } else if (query) {
          window.searchGoogle(query);
        }
      } else if (searchInput.value.trim()) {
        window.searchGoogle(searchInput.value.trim());
      }
    }
  });

  searchInput.addEventListener("input", () => {
    const val = searchInput.value;
    clearBtn.classList.toggle("show", val.length > 0);

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      showSearchSuggestions(val);
    }, 100);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.classList.remove("show");
    searchInput.focus();
    resultsPanel.classList.remove("open");
    resultsInner.innerHTML = "";
    resultItems = [];
    selectedIndex = -1;
    quickLinksVisible = false;
    quickLinksBtn.classList.remove("active");
  });

  quickLinksBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (quickLinksVisible) {
      quickLinksVisible = false;
      quickLinksBtn.classList.remove("active");
      if (searchInput.value.trim()) {
        showSearchSuggestions(searchInput.value);
      } else {
        resultsPanel.classList.remove("open");
        resultsInner.innerHTML = "";
        resultItems = [];
        selectedIndex = -1;
      }
    } else {
      quickLinksVisible = true;
      quickLinksBtn.classList.add("active");
      showDefaultResults();
    }
    searchInput.focus();
  });

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (searchInput.value.trim()) {
      window.searchGoogle(searchInput.value.trim());
    }
  });

  const googleDockLink = document.getElementById('googleDockLink');
  if (googleDockLink) {
    googleDockLink.addEventListener("click", (e) => {
      e.preventDefault();
      openSpotlight();
    });
  }
})();
