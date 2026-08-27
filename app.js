try {
  var savedTheme = localStorage.getItem('checker-theme') || 'light';
  var savedScale = localStorage.getItem('checker-font-scale') || '1.1';
  document.documentElement.dataset.theme = savedTheme;
  document.documentElement.style.setProperty('--font-scale', savedScale);
} catch (e) {}

document.addEventListener('DOMContentLoaded', function () {
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwQwu2vDjlbFjiXEO5nPHtupE8J0hC1LSRm1iXJQ2Y049FMkTh0NYwgnDcy2oTiLpxv/exec';

// SVG icons used in action buttons
var ICON_CHECK = '<i data-lucide="check"></i>';
var ICON_FLAG  = '<i data-lucide="flag"></i>';
var ICON_NOTE  = '<i data-lucide="message-square-text"></i>';

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

(function () {
  "use strict";

  var RECORDS = [];
  var currentDataset = localStorage.getItem('selected_dataset') || 'FL_dataset1';
  var state = { query: "", activeFilter: "all", sort: "id" };
  var ARCHIVE_REFERENCE_OVERRIDES = { C031: 'a) 8', C039: 'KRK 46:18' };

  function extractArchiveReference(metadata, fallback) {
    var text = String(metadata || '').replace(/\s+/g, ' ').trim();
    var match;
    if (!text) return String(fallback || '').trim();

    match = text.match(/\bHAKS\b(?:(?!\b(?:18|19|20)\d{2}\b).){0,80}?\b(\d{3,6})\b/i);
    if (match) return 'HAKS ' + match[1];

    match = text.match(/\b(?:Frans\s+Kärki|Tuomela,\s*Arvo|Valve,\s*A\.)\s*[.,]?\s*(\d{1,6})\b/i);
    if (match) return match[1];

    match = text.match(/\b(TK|KT|KRK|KRA|PK|KFK)\s*[.:]?\s*(\d+)(?:\s*[:.]\s*(\d+))?/i);
    if (match) {
      var item = match[3] || '';
      if (!item) {
        var tail = text.slice(match.index + match[0].length).split(/\b(?:18|19|20)\d{2}\b|<|\s[-–]\s/, 1)[0];
        var numbers = tail.match(/\b\d{1,4}\b/g);
        if (numbers && numbers.length) item = numbers[numbers.length - 1];
      }
      return match[1].toUpperCase() + ' ' + match[2] + (item ? ':' + item : '');
    }

    var yearIndex = text.search(/\b(?:18|19|20)\d{2}\b/);
    var citation = yearIndex >= 0 ? text.slice(0, yearIndex) : text;
    var markerPattern = /\b(II\s+)?([ab])\s*\)?\s*(\d+)\b/ig;
    var marker;
    while ((match = markerPattern.exec(citation)) !== null) marker = match;
    if (marker) return (marker[1] ? 'II ' : '') + marker[2].toLowerCase() + ') ' + marker[3];

    return String(fallback || '').trim();
  }

  function showLoading(msg) {
    var el = document.getElementById('loadingMsg');
    if (el) { el.textContent = msg || 'Loading...'; el.style.display = 'block'; el.style.color = '#3A4358'; }
    document.getElementById('cardList').style.opacity = '0.4';
  }
  function hideLoading() {
    var el = document.getElementById('loadingMsg');
    if (el) el.style.display = 'none';
    document.getElementById('cardList').style.opacity = '1';
  }
  function showError(msg) {
    var el = document.getElementById('loadingMsg');
    if (el) { el.textContent = 'Could not load data: ' + msg; el.style.display = 'block'; el.style.color = '#9E2335'; }
  }

  function updateReviewerDisplay() {
    var name = localStorage.getItem('reviewer_name') || '';
    var display = document.getElementById('reviewerDisplay');
    var nameEl  = document.getElementById('reviewerNameDisplay');
    if (!display || !nameEl) return;
    display.style.display = 'flex';
    if (name) {
      nameEl.innerHTML = '<b style="color:var(--text-1);">' + name + '</b> &nbsp;<button onclick="localStorage.removeItem(\'reviewer_name\');updateReviewerDisplay();document.getElementById(\'modalNameInput\').value=\'\';document.getElementById(\'reviewerModal\').classList.remove(\'hidden\');document.getElementById(\'modalNameInput\').focus();" style="background:none;border:none;color:var(--focus);font-size:11px;cursor:pointer;padding:0;text-decoration:underline;font-family:var(--sans);">change</button>';
    } else {
      nameEl.innerHTML = '<span style="color:var(--text-3);font-style:italic;">not set</span> &nbsp;<button onclick="document.getElementById(\'modalNameInput\').value=\'\';document.getElementById(\'reviewerModal\').classList.remove(\'hidden\');document.getElementById(\'modalNameInput\').focus();" style="background:none;border:none;color:var(--focus);font-size:11px;cursor:pointer;padding:0;text-decoration:underline;font-family:var(--sans);">set name</button>';
    }
  }

  function getReviewerName() {
    return localStorage.getItem('reviewer_name') || '';
  }

  function setSaveIndicator(msg, color) {
    var el = document.getElementById('saveIndicator');
    if (!el) return;
    el.textContent = msg;
    el.style.color = color || 'rgba(255,255,255,.35)';
  }

  function loadFromSheets() {
    showLoading('Loading cards from Google Sheets...');
    fetch(SHEETS_URL + '?dataset=' + encodeURIComponent(currentDataset))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.ok) throw new Error(data.error || 'Server error');
        RECORDS = data.records.map(function(r) {
          var id = String(r.id || r.ID || '');
          var storedReference = r.archive_reference || r['Archive reference'] || r.code || r['TK code'] || '';
          var sourceMetadata = r.source_metadata || r['Source metadata'] || '';
          var archiveReference = ARCHIVE_REFERENCE_OVERRIDES[id] || extractArchiveReference(sourceMetadata, storedReference);
          return {
            id:          id,
            image:       r.image              || r['Image file']          || '',
            fi:          r.fi                 || r['Finnish text']        || '',
            en:          r.en                 || r['English translation'] || '',
            place:       r.place              || r.Place                  || '',
            source:      r.source             || r['Collector / source']  || '',
            code:        archiveReference,
            archiveRef:  archiveReference,
            date:        String(r.date        || r.Year                   || ''),
            informant:   r.informant          || r.Informant              || '',
            status:      r.status             || r.Status                 || 'unreviewed',
            note:        r.note               || r.Note                   || '',
            reviewed_by: r.reviewed_by        || r['Reviewed by']         || '',
            reviewed_at: r.reviewed_at        || r['Reviewed at']         || ''
          };
        });
        hideLoading();
        renderChips();
        renderCards();
        updateProgress();
      })
      .catch(function(err) { showError(err.message); });
  }

  function saveToSheets(id, patch) {
    var rec = RECORDS.find(function(r) { return r.id === id; });
    if (!rec) return;
    Object.assign(rec, patch);
    renderChips();
    renderCards();
    updateProgress();

    setSaveIndicator('saving...', 'rgba(255,255,255,.5)');

    var payload = JSON.stringify(Object.assign({ id: id, dataset: currentDataset }, patch, {
      reviewed_by: getReviewerName(),
      reviewed_at: new Date().toISOString()
    }));

    fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: payload
    })
    .then(function() {
      setSaveIndicator('saved', 'rgba(191,227,218,.8)');
      setTimeout(function(){ setSaveIndicator(''); }, 2000);
    })
    .catch(function(e) {
      setSaveIndicator('save failed', 'rgba(216,112,127,.9)');
      console.warn('POST failed:', e);
    });
  }

  function getStatus(id) {
    var rec = RECORDS.find(function(r) { return r.id === id; });
    if (!rec) return { checked: false, flagged: false, note: '' };
    return { checked: rec.status === 'checked', flagged: rec.status === 'flagged', note: rec.note || '' };
  }

  function buildChips() {
    var chips = [{ key: "all", label: "All cards", count: RECORDS.length }];
    chips.push({ key: "unreviewed", label: "Unreviewed", count: RECORDS.filter(function(r){ return !r.status || r.status === 'unreviewed'; }).length });
    chips.push({ key: "checked",    label: "Checked",    count: RECORDS.filter(function(r){ return r.status === 'checked'; }).length });
    chips.push({ key: "flagged",    label: "Flagged",    count: RECORDS.filter(function(r){ return r.status === 'flagged'; }).length });
    return chips;
  }

  function renderChips() {
    buildChips().forEach(function(chip) {
      var count = document.querySelector('[data-filter-count="' + chip.key + '"]');
      if (count) count.textContent = chip.count;
    });
    document.querySelectorAll('.sidebar-item[data-filter]').forEach(function(item) {
      item.classList.toggle('active-filter', item.getAttribute('data-filter') === state.activeFilter);
    });
    document.querySelectorAll('[data-stat-filter]').forEach(function(item) {
      var active = item.getAttribute('data-stat-filter') === state.activeFilter;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    var row = document.getElementById("chipRow");
    if (!row) return;
    row.innerHTML = "";
    buildChips().forEach(function(chip) {
      var btn = document.createElement("button");
      btn.className = "chip" + (state.activeFilter === chip.key ? " active" : "");
      btn.innerHTML = chip.label + ' <span class="n">' + chip.count + "</span>";
      btn.addEventListener("click", function() {
        state.activeFilter = (state.activeFilter === chip.key) ? "all" : chip.key;
        renderChips(); renderCards();
      });
      row.appendChild(btn);
    });
  }

  function matchesFilter(r) {
    var f = state.activeFilter;
    if (f === "all") return true;
    if (f === "unreviewed") return !r.status || r.status === 'unreviewed';
    return r.status === f;
  }

  function matchesQuery(r, q) {
    if (!q) return true;
    return [r.fi, r.en, r.place, r.source, r.code, r.date, r.informant].join(" ").toLowerCase().indexOf(q.toLowerCase()) !== -1;
  }

  function getFiltered() {
    var list = RECORDS.filter(function(r) { return matchesFilter(r) && matchesQuery(r, state.query); });
    if (state.sort === "code") {
      list = list.slice().sort(function(a,b){ return (a.code||"").localeCompare(b.code||"", undefined, {numeric:true}); });
    } else {
      list = list.slice().sort(function(a,b){ return a.id.localeCompare(b.id, undefined, {numeric:true}); });
    }
    return list;
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      var d = new Date(isoStr);
      return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) +
             ' ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    } catch(e) { return isoStr; }
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function highlight(text, q) {
    var escaped = escapeHtml(text).replace(/\n{2,}/g, '\n');
    if (!q) return escaped;
    try {
      var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + ")", "ig");
      return escaped.replace(re, "<mark>$1</mark>");
    } catch(e) { return escaped; }
  }

  function renderCards() {
    var list = getFiltered();
    var container = document.getElementById("cardList");
    var noResults = document.getElementById("noResults");
    var resultCount = document.getElementById("resultCount");
    if (resultCount) resultCount.textContent = "Showing " + list.length + " of " + RECORDS.length;
    container.innerHTML = "";
    if (noResults) noResults.style.display = list.length === 0 ? "block" : "none";

    list.forEach(function(r) {
      var s = getStatus(r.id);
      var card = document.createElement("article");
      card.className = "card" + (r.status === 'checked' ? ' status-checked' : r.status === 'flagged' ? ' status-flagged' : '');
      card.id = "card-" + r.id;
      var checkedBadge = s.checked ? '<span class="badge badge-ok">&#10003; Approved</span>' : '';
      var flagBadge    = s.flagged ? '<span class="badge badge-flag">&#9873; Flagged</span>' : '';
      var archiveReference = r.archiveRef || r.code;
      var imageUrl = 'images/' + encodeURIComponent((r.image || '').normalize('NFC'));
      card.innerHTML =
        '<div class="card-head">' +
          '<span class="card-num">' + r.id + '</span>' +
          checkedBadge + flagBadge +
          '<span class="card-head-meta">' + escapeHtml(r.place) + (r.date ? ' &middot; ' + escapeHtml(r.date) : '') + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-img" data-img="' + imageUrl + '" data-cap="' + escapeHtml(r.code || ('Card ' + r.id)) + '">' +
            '<div class="card-img-inner"><img src="' + imageUrl + '" alt="Scanned card ' + r.id + '" loading="lazy"></div>' +
            '<span class="zoom-hint">tap to zoom</span>' +
          '</div>' +
          '<div class="card-text">' +
            '<div class="field-label">Finnish &mdash; original</div>' +
            '<div class="field-fi">' + highlight(r.fi, state.query) + '</div>' +
            '<div class="field-label en">English translation</div>' +
            '<div class="field-en">' + highlight(r.en, state.query) + '</div>' +
            '<div class="meta-row">' +
              '<span><b>Place:</b> ' + escapeHtml(r.place || 'Not recorded') + '</span>' +
              '<span><b>Source:</b> ' + escapeHtml(r.source || 'Not recorded') + '</span>' +
              '<span><b>Informant:</b> ' + escapeHtml(r.informant || 'Not recorded') + '</span>' +
              '<span class="meta-archive' + (archiveReference ? '' : ' missing') + '"><b>Archive reference:</b> ' + escapeHtml(archiveReference || 'Not recorded') + '</span>' +
            '</div>' +
            '<div class="actions">' +
              '<button class="action-btn' + (s.checked ? ' active-ok' : '') + '" data-action="checked" data-id="' + r.id + '">' + ICON_CHECK + (s.checked ? 'Approved' : 'Approve') + '</button>' +
              '<button class="action-btn' + (s.flagged ? ' active-flag' : '') + '" data-action="flagged" data-id="' + r.id + '">' + ICON_FLAG + (s.flagged ? 'Flagged' : 'Flag') + '</button>' +
              '<button class="note-toggle" data-action="note" data-id="' + r.id + '">' + ICON_NOTE + (s.note ? 'Edit comment' : 'Add comment') + '</button>' +
            '</div>' +
            (( r.status === 'checked' || r.status === 'flagged') && (r.reviewed_by || r.reviewed_at) ? '<div class="reviewed-by">' +
              (r.reviewed_by ? 'Reviewed by <b>' + escapeHtml(r.reviewed_by) + '</b>' : 'Reviewed') +
              (r.reviewed_at ? ' &middot; ' + formatDate(r.reviewed_at) : '') +
            '</div>' : '') +
            '<div class="note-wrapper' + (s.note ? ' open' : '') + '" data-id="' + r.id + '">' +
              '<div class="note-wrapper-label">' + ICON_NOTE + 'Reviewer note</div>' +
              '<textarea class="note-box" data-id="' + r.id + '" placeholder="e.g. line 3 misread &mdash; should be ...">' + escapeHtml(s.note) + '</textarea>' +
            '</div>' +
          '</div>' +
        '</div>';
      container.appendChild(card);
    });
    attachCardHandlers();
    updateProgress();
    refreshIcons();
  }

  var pendingAction = null;

  function requireReviewer(callback) {
    var name = getReviewerName();
    if (name.trim()) {
      callback();
    } else {
      window._pendingAction = callback;
      document.getElementById('reviewerModal').classList.remove('hidden');
      document.getElementById('modalNameInput').focus();
    }
  }

  document.getElementById('modalNameInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var n = document.getElementById('modalNameInput').value.trim();
      if (!n) return;
      localStorage.setItem('reviewer_name', n);
      document.getElementById('reviewerModal').classList.add('hidden');
      if (window._pendingAction) { window._pendingAction(); window._pendingAction = null; }
    }
  });

  function attachCardHandlers() {
    document.querySelectorAll(".action-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id     = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        requireReviewer(function() {
          var rec = RECORDS.find(function(r){ return r.id === id; });
          if (!rec) return;
          if (action === "checked") {
            var ns = rec.status === 'checked' ? 'unreviewed' : 'checked';
            if (ns === 'unreviewed') { rec.reviewed_by = ''; rec.reviewed_at = ''; }
            saveToSheets(id, { status: ns, note: rec.note || '', reviewed_by: ns === 'unreviewed' ? '' : getReviewerName(), reviewed_at: ns === 'unreviewed' ? '' : new Date().toISOString() });
          } else if (action === "flagged") {
            var ns = rec.status === 'flagged' ? 'unreviewed' : 'flagged';
            if (ns === 'unreviewed') { rec.reviewed_by = ''; rec.reviewed_at = ''; }
            saveToSheets(id, { status: ns, note: rec.note || '', reviewed_by: ns === 'unreviewed' ? '' : getReviewerName(), reviewed_at: ns === 'unreviewed' ? '' : new Date().toISOString() });
          }
        });
      });
    });

    document.querySelectorAll(".note-toggle").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id      = btn.getAttribute("data-id");
        var wrapper = document.querySelector('.note-wrapper[data-id="' + id + '"]');
        wrapper.classList.toggle("open");
        if (wrapper.classList.contains("open")) wrapper.querySelector('.note-box').focus();
      });
    });

    document.querySelectorAll(".note-box").forEach(function(box) {
      var timer;
      box.addEventListener("input", function() {
        var id  = box.getAttribute("data-id");
        var rec = RECORDS.find(function(r){ return r.id === id; });
        if (!rec) return;
        rec.note = box.value;
        clearTimeout(timer);
        timer = setTimeout(function() {
          saveToSheets(id, { status: rec.status, note: box.value });
        }, 1200);
      });
    });

    document.querySelectorAll(".card-img").forEach(function(pane) {
      pane.addEventListener("click", function() {
        openLightbox(pane.getAttribute("data-img"), pane.getAttribute("data-cap"));
      });
    });
  }

  function updateProgress() {
    var total     = RECORDS.length;
    var checked   = RECORDS.filter(function(r){ return r.status === 'checked'; }).length;
    var flagged   = RECORDS.filter(function(r){ return r.status === 'flagged'; }).length;
    var remaining = total - checked - flagged;
    if (document.getElementById("stat-total"))     document.getElementById("stat-total").textContent     = total;
    if (document.getElementById("stat-checked"))   document.getElementById("stat-checked").textContent   = checked;
    if (document.getElementById("stat-flagged"))   document.getElementById("stat-flagged").textContent   = flagged;
    if (document.getElementById("stat-remaining")) document.getElementById("stat-remaining").textContent = remaining;
    if (document.getElementById("progressLabel"))  document.getElementById("progressLabel").textContent  = (checked + flagged) + " / " + total + " reviewed";
    if (document.getElementById("fillChecked"))    document.getElementById("fillChecked").style.width    = (total ? checked / total * 100 : 0) + "%";
    if (document.getElementById("fillFlagged"))    document.getElementById("fillFlagged").style.width    = (total ? flagged / total * 100 : 0) + "%";
  }

  function openLightbox(src, caption) {
    document.getElementById("lightboxImg").src = src;
    document.getElementById("lightboxCaption").textContent = caption;
    document.getElementById("lightbox").classList.add("open");
  }
  document.getElementById("lightboxClose").addEventListener("click", function(){ document.getElementById("lightbox").classList.remove("open"); });
  document.getElementById("lightbox").addEventListener("click", function(e){ if (e.target.id === "lightbox") document.getElementById("lightbox").classList.remove("open"); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") document.getElementById("lightbox").classList.remove("open"); });

  document.getElementById("searchInput").addEventListener("input", function(e) {
    state.query = e.target.value.trim();
    renderCards();
  });

  document.querySelectorAll('.sidebar-item[data-sort]').forEach(function(item) {
    item.addEventListener('click', function() {
      document.querySelectorAll('.sidebar-item[data-sort]').forEach(function(i){ i.classList.remove('active'); });
      item.classList.add('active');
      state.sort = item.getAttribute('data-sort');
      renderCards();
    });
  });

  document.querySelectorAll('.sidebar-item[data-filter]').forEach(function(item) {
    item.addEventListener('click', function() {
      state.activeFilter = item.getAttribute('data-filter');
      renderChips(); renderCards();
    });
  });

  document.querySelectorAll('[data-stat-filter]').forEach(function(item) {
    item.addEventListener('click', function() {
      state.activeFilter = item.getAttribute('data-stat-filter');
      renderChips();
      renderCards();
    });
  });

  var layoutDiv = document.querySelector('.layout');
  var cardListEl = document.getElementById('cardList');
  document.getElementById('btnList').addEventListener('click', function() {
    cardListEl.classList.remove('view-grid');
    layoutDiv.classList.remove('grid-mode');
    document.getElementById('btnList').classList.add('active');
    document.getElementById('btnGrid').classList.remove('active');
  });
  document.getElementById('btnGrid').addEventListener('click', function() {
    cardListEl.classList.add('view-grid');
    layoutDiv.classList.add('grid-mode');
    document.getElementById('btnGrid').classList.add('active');
    document.getElementById('btnList').classList.remove('active');
  });
  document.querySelector('.main-col').classList.add('view-list');

  document.getElementById("resetProgress").addEventListener("click", function() {
    loadFromSheets();
  });

  var datasetTabs = document.querySelectorAll('.dataset-tab');
  function updateDatasetTabs() {
    datasetTabs.forEach(function(tab) {
      var active = tab.dataset.dataset === currentDataset;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('tabindex', active ? '0' : '-1');
    });
  }
  updateDatasetTabs();
  datasetTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      if (tab.dataset.dataset === currentDataset) return;
      currentDataset = tab.dataset.dataset;
      localStorage.setItem('selected_dataset', currentDataset);
      RECORDS = [];
      state.query = '';
      state.activeFilter = 'all';
      document.getElementById('searchInput').value = '';
      updateDatasetTabs();
      loadFromSheets();
    });
  });

  var rootElement = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  function applyTheme(theme) {
    rootElement.dataset.theme = theme;
    localStorage.setItem('checker-theme', theme);
    var dark = theme === 'dark';
    themeToggle.innerHTML = '<i data-lucide="' + (dark ? 'sun' : 'moon') + '"></i>';
    themeToggle.setAttribute('aria-label', dark ? 'Turn on light mode' : 'Turn on dark mode');
    refreshIcons();
  }
  applyTheme(rootElement.dataset.theme || 'light');
  themeToggle.addEventListener('click', function() {
    applyTheme(rootElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  var fontScale = Number(localStorage.getItem('checker-font-scale') || 1.1);
  function applyFontScale(value) {
    fontScale = Math.max(0.9, Math.min(1.6, Math.round(value * 10) / 10));
    rootElement.style.setProperty('--font-scale', String(fontScale));
    localStorage.setItem('checker-font-scale', String(fontScale));
    document.getElementById('fontDown').disabled = fontScale <= 0.9;
    document.getElementById('fontUp').disabled = fontScale >= 1.6;
  }
  document.getElementById('fontDown').addEventListener('click', function() {
    applyFontScale(fontScale - 0.1);
  });
  document.getElementById('fontUp').addEventListener('click', function() {
    applyFontScale(fontScale + 0.1);
  });
  applyFontScale(fontScale);
  refreshIcons();

  document.getElementById('modalNameInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      var n = document.getElementById('modalNameInput').value.trim();
      if (!n) return;
      localStorage.setItem('reviewer_name', n);
      document.getElementById('reviewerModal').classList.add('hidden');
      updateReviewerDisplay();
      if (window._pendingAction) { window._pendingAction(); window._pendingAction = null; }
    }
  });

  updateReviewerDisplay();
  loadFromSheets();

})();
});
