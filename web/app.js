const STORAGE = {
  favorites: "ciap2.web.favorites.v1",
  history: "ciap2.web.history.v1",
  theme: "ciap2.web.theme.v1"
};

const VIEW_COPY = {
  search: ["Consulta rápida", "Buscar na CIAP-2", "Pesquise por código, termo clínico, descrição ou referência CID-10."],
  chapters: ["Navegação", "Capítulos", "Explore a classificação pelos 18 sistemas e áreas da Atenção Primária."],
  classifications: ["Organização clínica", "Classificações", "Consulte códigos por sinais e sintomas, infecções, diagnósticos e procedimentos."],
  favorites: ["Sua coleção", "Favoritos", "Acesso rápido aos códigos guardados neste navegador."]
};

const CLASS_COLORS = {
  "PROCEDIMENTOS": "#c1c0bc",
  "SINAIS/SINTOMAS": "#c0deaf",
  "INFECÇÕES": "#ffff8c",
  "NEOPLASIAS": "#bcd8da",
  "TRAUMATISMOS": "#ea9596",
  "ANOMALIAS CONGÊNITAS": "#a19dc0",
  "OUTROS DIAGNÓSTICOS": "#c497b8"
};

const CLASS_ICONS = {
  "PROCEDIMENTOS": "icons/classifications/procedimentos.png",
  "SINAIS/SINTOMAS": "icons/classifications/sintomas.png",
  "INFECÇÕES": "icons/classifications/infeccoes.png",
  "NEOPLASIAS": "icons/classifications/neoplasias.png",
  "TRAUMATISMOS": "icons/classifications/traumatismos.png",
  "ANOMALIAS CONGÊNITAS": "icons/classifications/anomalias.png",
  "OUTROS DIAGNÓSTICOS": "icons/classifications/outros.png"
};

const CHAPTER_ICONS = {
  "-": "icons/chapters/procedimentos.png",
  A: "icons/chapters/geral.png",
  B: "icons/chapters/sangue.png",
  D: "icons/chapters/digestivo.png",
  F: "icons/chapters/olho.png",
  H: "icons/chapters/ouvido.png",
  K: "icons/chapters/circulatorio.png",
  L: "icons/chapters/musculo.png",
  N: "icons/chapters/neurologico.png",
  P: "icons/chapters/psicologico.png",
  R: "icons/chapters/respiratorio.png",
  S: "icons/chapters/pele.png",
  T: "icons/chapters/endocrino.png",
  U: "icons/chapters/urinario.png",
  W: "icons/chapters/gravidez.png",
  X: "icons/chapters/feminino.png",
  Y: "icons/chapters/masculino.png",
  Z: "icons/chapters/sociais.png"
};

const CATALOG_PARTS = Object.freeze([
  "assets/catalog/98d22b3dec7a1b6e.bin",
  "assets/catalog/5090514bd2243e4e.bin",
  "assets/catalog/c0bc64a577cf2665.bin",
  "assets/catalog/cffe3ea7fa35961d.bin",
  "assets/catalog/5ae918125c880255.bin",
  "assets/catalog/75f1f90c3dff18ce.bin",
  "assets/catalog/15bfcf84e1a3d82c.bin",
  "assets/catalog/fca9ff4ffe427b62.bin",
  "assets/catalog/129dac477303a7dc.bin"
]);
const CATALOG_SHA256 = "ecdff528a56065d9fbb46a637bff15b5fb0acd5a07a57d0b220e22594f4a3340";

const CLASS_LABELS = {
  "PROCEDIMENTOS": "Procedimentos",
  "SINAIS/SINTOMAS": "Sinais e sintomas",
  "INFECÇÕES": "Infecções",
  "NEOPLASIAS": "Neoplasias",
  "TRAUMATISMOS": "Traumatismos",
  "ANOMALIAS CONGÊNITAS": "Anomalias congênitas",
  "OUTROS DIAGNÓSTICOS": "Outros diagnósticos"
};

const els = {
  shell: document.querySelector("#appShell"),
  content: document.querySelector("#content"),
  searchPanel: document.querySelector("#searchPanel"),
  searchInput: document.querySelector("#searchInput"),
  viewEyebrow: document.querySelector("#viewEyebrow"),
  viewTitle: document.querySelector("#viewTitle"),
  viewDescription: document.querySelector("#viewDescription"),
  favoriteCount: document.querySelector("#favoriteCount"),
  exportButton: document.querySelector("#exportButton"),
  themeButton: document.querySelector("#themeButton"),
  mobileThemeButton: document.querySelector("#mobileThemeButton"),
  detailDialog: document.querySelector("#detailDialog"),
  detailContent: document.querySelector("#detailContent"),
  closeDetail: document.querySelector("#closeDetail"),
  copyDetail: document.querySelector("#copyDetail"),
  shareDetail: document.querySelector("#shareDetail"),
  favoriteDetail: document.querySelector("#favoriteDetail"),
  toast: document.querySelector("#toast")
};

const state = {
  codes: [],
  codeMap: new Map(),
  chapters: [],
  view: "classifications",
  browse: null,
  favorites: new Set(readStorage(STORAGE.favorites, [])),
  history: readStorage(STORAGE.history, []),
  activeCode: null,
  toastTimer: null,
  dialogPushed: false
};

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing can block storage. */ }
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hasContent(value) {
  return Boolean(value && String(value).trim() && String(value).trim() !== "-");
}

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9.-]+/g, " ")
    .trim();
}

function prepareCode(code) {
  const searchable = [
    code.code, code.title, code.plainTitle, code.classification, code.chapter,
    code.possibleCid10, code.frequentCid10, code.definition, code.inclusion,
    code.exclusion, code.consider, code.note
  ].filter(Boolean).join(" ");
  return { ...code, searchText: normalize(searchable), titleText: normalize(code.title) };
}

async function loadCatalog() {
  const parts = await Promise.all(CATALOG_PARTS.map(async (path) => {
    const response = await fetch(path, { cache: "force-cache", credentials: "same-origin" });
    if (!response.ok) throw new Error(`Catalog part unavailable: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }));

  const length = parts.reduce((total, part) => total + part.length, 0);
  const encoded = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    encoded.set(part, offset);
    offset += part.length;
  });

  const decoded = new Uint8Array(length);
  let stream = 0x6d2b79f5;
  for (let index = 0; index < encoded.length; index += 1) {
    stream ^= stream << 13;
    stream ^= stream >>> 17;
    stream ^= stream << 5;
    stream >>>= 0;
    const mask = (stream + Math.imul(index + 1, 0x45d9f3b)) & 0xff;
    const rotation = (index * 29 + 71) & 0xff;
    decoded[index] = ((encoded[index] - rotation) & 0xff) ^ mask;
  }

  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", decoded));
  const checksum = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (checksum !== CATALOG_SHA256) throw new Error("Catalog integrity check failed");

  return JSON.parse(new TextDecoder().decode(decoded));
}

function codeRow(code) {
  const favorite = state.favorites.has(code.code);
  const classColor = CLASS_COLORS[code.classification] || CLASS_COLORS["OUTROS DIAGNÓSTICOS"];
  return `
    <article class="codeRow" data-code="${escapeHTML(code.code)}" tabindex="0" role="button" aria-label="${escapeHTML(code.code)}, ${escapeHTML(code.title)}" style="--classification-color:${classColor}">
      <span class="codeBadge">${escapeHTML(code.code)}</span>
      <span class="codeInfo">
        <strong>${escapeHTML(code.title)}</strong>
        <small>${escapeHTML(code.chapter)} · ${escapeHTML(CLASS_LABELS[code.classification] || code.classification)}</small>
      </span>
      <button class="rowFavorite${favorite ? " isFavorite" : ""}" data-favorite="${escapeHTML(code.code)}" type="button" aria-label="${favorite ? "Remover dos" : "Adicionar aos"} favoritos"></button>
    </article>`;
}

function emptyState(icon, title, message, action = "") {
  return `<div class="emptyState"><span class="emptyIcon" aria-hidden="true">${icon}</span><h2>${escapeHTML(title)}</h2><p>${escapeHTML(message)}</p>${action}</div>`;
}

function dashboard() {
  const recents = state.history.length
    ? `<section class="recentSection"><div class="sectionHeader"><h2>Pesquisas recentes</h2><button class="textButton" data-action="clear-history" type="button">Limpar</button></div><div class="recentList">${state.history.map((term) => `<button class="recentChip" data-query="${escapeHTML(term)}" type="button">${escapeHTML(term)}</button>`).join("")}</div></section>`
    : "";

  return `
    <section>
      <div class="sectionHeader"><h2>Atalhos de busca</h2><p>726 códigos disponíveis</p></div>
      <div class="quickGrid">
        <button class="quickCard" data-query="diabetes" type="button"><img src="icons/chapters/endocrino.png" alt=""><strong>Diabetes</strong></button>
        <button class="quickCard" data-query="hipertensão" type="button"><img src="icons/chapters/circulatorio.png" alt=""><strong>Hipertensão</strong></button>
        <button class="quickCard" data-query="tosse" type="button"><img src="icons/chapters/respiratorio.png" alt=""><strong>Tosse</strong></button>
        <button class="quickCard" data-query="ansiedade" type="button"><img src="icons/chapters/psicologico.png" alt=""><strong>Ansiedade</strong></button>
      </div>
    </section>${recents}`;
}

function scoreCode(code, query, terms) {
  if (!terms.every((term) => code.searchText.includes(term))) return -1;
  let score = 1;
  const normalizedCode = code.code.toLowerCase();
  if (normalizedCode === query) score += 140;
  else if (normalizedCode.startsWith(query)) score += 80;
  else if (normalizedCode.includes(query)) score += 35;
  if (code.titleText === query) score += 110;
  else if (code.titleText.startsWith(query)) score += 60;
  else if (code.titleText.includes(query)) score += 32;
  if (normalize(code.possibleCid10).includes(query) || normalize(code.frequentCid10).includes(query)) score += 42;
  if (normalize(code.inclusion).includes(query)) score += 20;
  if (state.favorites.has(code.code)) score += 4;
  return score;
}

function renderSearch() {
  const rawQuery = els.searchInput.value.trim();
  const query = normalize(rawQuery);
  if (!query) {
    els.content.innerHTML = dashboard();
    return;
  }

  const terms = query.split(/\s+/).filter(Boolean);
  const results = state.codes
    .map((code) => ({ code, score: scoreCode(code, query, terms) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.code.code.localeCompare(b.code.code, "pt-BR"))
    .map((item) => item.code);

  if (!results.length) {
    els.content.innerHTML = emptyState("⌕", "Nenhum código encontrado", `Não encontramos resultados para “${rawQuery}”. Tente outro termo, código ou referência CID-10.`);
    return;
  }

  const shown = results.slice(0, 120);
  const classifications = [...new Set(results.map((code) => code.classification))];
  els.content.innerHTML = `
    <div class="filterBar" aria-label="Filtrar resultados">
      <button class="filterChip isActive" data-result-filter="all" type="button">Todos · ${results.length}</button>
      ${classifications.map((classification) => `<button class="filterChip" data-result-filter="${escapeHTML(classification)}" type="button">${escapeHTML(CLASS_LABELS[classification] || classification)}</button>`).join("")}
    </div>
    <div class="sectionHeader"><h2>Resultados</h2><p class="resultMeta">${shown.length}${results.length > shown.length ? ` de ${results.length}` : ""}</p></div>
    <div class="codeList" data-results>${shown.map(codeRow).join("")}</div>`;

  els.content.dataset.allResults = JSON.stringify(results.map((code) => code.code));
}

function renderChapters() {
  if (state.browse?.type === "chapter") {
    renderBrowseList();
    return;
  }
  const counts = new Map();
  state.codes.forEach((code) => counts.set(code.chapter, (counts.get(code.chapter) || 0) + 1));
  els.content.innerHTML = `<div class="chapterGrid">${state.chapters.map((chapter) => `
    <button class="chapterCard" data-browse-type="chapter" data-browse-value="${escapeHTML(chapter.name)}" type="button">
      <img class="categoryIcon" src="${CHAPTER_ICONS[chapter.code]}" alt="">
      <span class="categoryCopy"><strong>${escapeHTML(toTitleCase(chapter.name))}</strong><small>${counts.get(chapter.name) || 0} códigos</small></span>
      <span class="chevron" aria-hidden="true"></span>
    </button>`).join("")}</div>`;
}

function renderClassifications() {
  if (state.browse?.type === "classification") {
    renderBrowseList();
    return;
  }
  const groups = Object.keys(CLASS_LABELS).map((classification) => ({
    classification,
    count: state.codes.filter((code) => code.classification === classification).length
  }));
  els.content.innerHTML = `<div class="classificationGrid">${groups.map(({ classification, count }) => `
    <button class="classificationCard" data-browse-type="classification" data-browse-value="${escapeHTML(classification)}" type="button" style="--class-color:${CLASS_COLORS[classification]}">
      <img class="categoryIcon" src="${CLASS_ICONS[classification]}" alt="">
      <span class="categoryCopy"><strong>${escapeHTML(CLASS_LABELS[classification])}</strong><small>${count} códigos</small></span>
      <span class="chevron" aria-hidden="true"></span>
    </button>`).join("")}</div>`;
}

function renderBrowseList() {
  const { type, value } = state.browse;
  const codes = state.codes.filter((code) => type === "chapter" ? code.chapter === value : code.classification === value);
  const label = type === "chapter" ? toTitleCase(value) : CLASS_LABELS[value];
  els.content.innerHTML = `
    <div class="sectionHeader"><button class="secondaryButton" data-action="back-grid" type="button">← Voltar</button><p>${codes.length} códigos</p></div>
    <h2 class="isHidden">${escapeHTML(label)}</h2>
    <div class="codeList">${codes.map(codeRow).join("")}</div>`;
}

function renderFavorites() {
  const favorites = [...state.favorites].map((code) => state.codeMap.get(code)).filter(Boolean);
  if (!favorites.length) {
    els.content.innerHTML = emptyState("☆", "Nenhum favorito ainda", "Abra um código e toque na estrela para guardá-lo. Seus favoritos ficam somente neste navegador.", `<button class="primaryButton" data-action="go-search" type="button">Buscar códigos</button>`);
    return;
  }
  favorites.sort((a, b) => a.code.localeCompare(b.code, "pt-BR"));
  els.content.innerHTML = `<div class="sectionHeader"><h2>${favorites.length} ${favorites.length === 1 ? "código guardado" : "códigos guardados"}</h2><p>Armazenamento local</p></div><div class="codeList">${favorites.map(codeRow).join("")}</div>`;
}

function renderCurrentView() {
  if (state.view === "search") renderSearch();
  if (state.view === "chapters") renderChapters();
  if (state.view === "classifications") renderClassifications();
  if (state.view === "favorites") renderFavorites();
}

function setView(view, { focusSearch = false } = {}) {
  state.view = view;
  state.browse = null;
  const [eyebrow, title, description] = VIEW_COPY[view];
  els.viewEyebrow.textContent = eyebrow;
  els.viewTitle.textContent = title;
  els.viewDescription.textContent = description;
  els.searchPanel.classList.toggle("isHidden", view !== "search");
  els.exportButton.classList.toggle("isHidden", view !== "favorites" || state.favorites.size === 0);
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("isActive", button.dataset.view === view));
  renderCurrentView();
  if (focusSearch) requestAnimationFrame(() => els.searchInput.focus());
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toTitleCase(value) {
  return String(value).toLocaleLowerCase("pt-BR").replace(/(^|[\s/-])([a-záàâãéêíóôõúç])/g, (_, prefix, letter) => prefix + letter.toLocaleUpperCase("pt-BR"));
}

function toggleFavorite(codeValue, announce = true) {
  if (state.favorites.has(codeValue)) {
    state.favorites.delete(codeValue);
    if (announce) showToast(`${codeValue} removido dos favoritos`);
  } else {
    state.favorites.add(codeValue);
    if (announce) showToast(`${codeValue} adicionado aos favoritos`);
  }
  writeStorage(STORAGE.favorites, [...state.favorites]);
  updateFavoriteUI();
  renderCurrentView();
}

function updateFavoriteUI() {
  els.favoriteCount.textContent = state.favorites.size;
  els.exportButton.classList.toggle("isHidden", state.view !== "favorites" || state.favorites.size === 0);
  if (state.activeCode) {
    const favorite = state.favorites.has(state.activeCode.code);
    els.favoriteDetail.classList.toggle("isFavorite", favorite);
    els.favoriteDetail.setAttribute("aria-label", favorite ? "Remover dos favoritos" : "Adicionar aos favoritos");
  }
}

function extractLinkedCodes(value) {
  return [...new Set(String(value || "").match(/(?:\b[A-Z][0-9]{2}\b|-[3-9][0-9]\b)/g) || [])].filter((code) => state.codeMap.has(code));
}

function cidPills(value) {
  const cids = [...new Set(String(value || "").match(/\b[A-Z][0-9]{2}(?:\.[0-9A-Z])?\b/g) || [])];
  return cids.length ? `<div class="pillRow">${cids.map((cid) => `<span class="cidPill">${escapeHTML(cid)}</span>`).join("")}</div>` : "";
}

function linkedPills(value) {
  const codes = extractLinkedCodes(value);
  return codes.length ? `<div class="pillRow">${codes.map((code) => `<button class="linkedCode" data-code-link="${escapeHTML(code)}" type="button">Ver ${escapeHTML(code)}</button>`).join("")}</div>` : "";
}

function detailField(label, value, extras = "") {
  if (!hasContent(value)) return "";
  return `<section class="detailField"><h3>${escapeHTML(label)}</h3><p>${escapeHTML(value)}</p>${extras}</section>`;
}

function openDetail(codeValue, { push = true } = {}) {
  const code = state.codeMap.get(codeValue);
  if (!code) return;
  state.activeCode = code;
  els.detailContent.innerHTML = `
    <span class="detailCode" style="--classification-color:${CLASS_COLORS[code.classification] || CLASS_COLORS["OUTROS DIAGNÓSTICOS"]}">${escapeHTML(code.code)}</span>
    <h2 id="detailTitle">${escapeHTML(code.title)}</h2>
    <div class="detailMeta"><span class="metaPill">${escapeHTML(toTitleCase(code.chapter))}</span><span class="metaPill">${escapeHTML(CLASS_LABELS[code.classification] || code.classification)}</span></div>
    ${detailField("Título leigo", code.plainTitle)}
    ${detailField("Critérios de inclusão", code.inclusion, linkedPills(code.inclusion))}
    ${detailField("Critérios de exclusão", code.exclusion, linkedPills(code.exclusion))}
    ${detailField("CID-10 possíveis", code.possibleCid10, cidPills(code.possibleCid10))}
    ${detailField("CID-10 mais frequente", code.frequentCid10, cidPills(code.frequentCid10))}
    ${detailField("Definição", code.definition)}
    ${detailField("Considerar", code.consider, linkedPills(code.consider))}
    ${detailField("Nota", code.note)}
    <p class="detailDisclaimer">Ferramenta de referência para profissionais e estudantes. A escolha do código deve considerar o contexto clínico e não substitui avaliação profissional.</p>`;
  updateFavoriteUI();
  if (!els.detailDialog.open) els.detailDialog.showModal();
  els.detailDialog.scrollTop = 0;

  if (push) {
    const url = new URL(location.href);
    url.searchParams.set("code", code.code);
    history.pushState({ code: code.code }, "", url);
    state.dialogPushed = true;
  }
}

function closeDetail({ useHistory = true } = {}) {
  if (els.detailDialog.open) els.detailDialog.close();
  state.activeCode = null;
  if (useHistory && state.dialogPushed && new URL(location.href).searchParams.has("code")) {
    history.back();
  } else {
    const url = new URL(location.href);
    url.searchParams.delete("code");
    history.replaceState({}, "", url);
  }
  state.dialogPushed = false;
}

function shareText(code) {
  let text = `${code.code} — ${code.title}\n${CLASS_LABELS[code.classification] || code.classification}`;
  if (hasContent(code.inclusion)) text += `\n\nCritérios de inclusão:\n${code.inclusion}`;
  if (hasContent(code.possibleCid10)) text += `\n\nCID-10 possíveis: ${code.possibleCid10}`;
  return `${text}\n\n— CIAP2`;
}

async function copyActiveCode() {
  if (!state.activeCode) return;
  const text = shareText(state.activeCode);
  try {
    await navigator.clipboard.writeText(text);
    showToast("Código copiado");
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("Código copiado");
  }
}

async function shareActiveCode() {
  if (!state.activeCode) return;
  const url = new URL(location.href);
  url.searchParams.set("code", state.activeCode.code);
  const data = { title: `${state.activeCode.code} — ${state.activeCode.title}`, text: shareText(state.activeCode), url: url.href };
  if (navigator.share) {
    try { await navigator.share(data); } catch { /* User cancelled. */ }
  } else {
    await navigator.clipboard.writeText(url.href);
    showToast("Link copiado");
  }
}

function addHistory(value) {
  const term = value.trim();
  if (!term) return;
  state.history = [term, ...state.history.filter((item) => normalize(item) !== normalize(term))].slice(0, 8);
  writeStorage(STORAGE.history, state.history);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("isVisible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => els.toast.classList.remove("isVisible"), 2200);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  writeStorage(STORAGE.theme, theme);
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#000000" : "#f2f2f7";
}

function toggleTheme() {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

function exportFavorites() {
  const codes = [...state.favorites].map((value) => state.codeMap.get(value)).filter(Boolean).map(({ searchText, ...code }) => code);
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), favorites: codes }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ciap2-favoritos.json";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Favoritos exportados");
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view, { focusSearch: button.dataset.view === "search" })));
  els.searchInput.addEventListener("input", renderSearch);
  els.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addHistory(els.searchInput.value);
      renderSearch();
    }
  });

  els.content.addEventListener("click", (event) => {
    const favorite = event.target.closest("[data-favorite]");
    if (favorite) {
      event.stopPropagation();
      toggleFavorite(favorite.dataset.favorite);
      return;
    }
    const row = event.target.closest("[data-code]");
    if (row) { openDetail(row.dataset.code); return; }
    const query = event.target.closest("[data-query]");
    if (query) {
      els.searchInput.value = query.dataset.query;
      setView("search", { focusSearch: true });
      renderSearch();
      return;
    }
    const browse = event.target.closest("[data-browse-type]");
    if (browse) {
      state.browse = { type: browse.dataset.browseType, value: browse.dataset.browseValue };
      renderCurrentView();
      return;
    }
    const filter = event.target.closest("[data-result-filter]");
    if (filter) {
      document.querySelectorAll("[data-result-filter]").forEach((item) => item.classList.toggle("isActive", item === filter));
      const allCodes = JSON.parse(els.content.dataset.allResults || "[]").map((code) => state.codeMap.get(code)).filter(Boolean);
      const selected = filter.dataset.resultFilter;
      const filtered = selected === "all" ? allCodes : allCodes.filter((code) => code.classification === selected);
      document.querySelector("[data-results]").innerHTML = filtered.slice(0, 120).map(codeRow).join("");
      document.querySelector(".resultMeta").textContent = `${Math.min(filtered.length, 120)}${filtered.length > 120 ? ` de ${filtered.length}` : ""}`;
      return;
    }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "clear-history") {
      state.history = [];
      writeStorage(STORAGE.history, []);
      renderSearch();
    }
    if (action === "back-grid") {
      state.browse = null;
      renderCurrentView();
    }
    if (action === "go-search") setView("search", { focusSearch: true });
  });

  els.content.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-code]")) {
      event.preventDefault();
      openDetail(event.target.dataset.code);
    }
  });

  els.detailContent.addEventListener("click", (event) => {
    const link = event.target.closest("[data-code-link]");
    if (link) openDetail(link.dataset.codeLink);
  });
  els.closeDetail.addEventListener("click", () => closeDetail());
  els.copyDetail.addEventListener("click", copyActiveCode);
  els.shareDetail.addEventListener("click", shareActiveCode);
  els.favoriteDetail.addEventListener("click", () => state.activeCode && toggleFavorite(state.activeCode.code));
  els.detailDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDetail(); });
  els.detailDialog.addEventListener("click", (event) => {
    const rect = els.detailDialog.getBoundingClientRect();
    if (event.clientX < rect.left) closeDetail();
  });
  els.themeButton.addEventListener("click", toggleTheme);
  els.mobileThemeButton.addEventListener("click", toggleTheme);
  els.exportButton.addEventListener("click", exportFavorites);

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !els.detailDialog.open && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      setView("search", { focusSearch: true });
    }
  });

  window.addEventListener("popstate", () => {
    const code = new URL(location.href).searchParams.get("code");
    if (code) openDetail(code, { push: false });
    else if (els.detailDialog.open) closeDetail({ useHistory: false });
  });
}

async function init() {
  const storedTheme = readStorage(STORAGE.theme, null);
  applyTheme(storedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  bindEvents();

  try {
    const data = await loadCatalog();
    state.codes = data.codes.map(prepareCode);
    state.codeMap = new Map(state.codes.map((code) => [code.code, code]));
    state.chapters = data.chapters;
    els.shell.setAttribute("aria-busy", "false");
    updateFavoriteUI();
    setView("classifications");

    const initialCode = new URL(location.href).searchParams.get("code");
    if (initialCode) openDetail(initialCode.toUpperCase(), { push: false });
  } catch (error) {
    console.error(error);
    els.shell.setAttribute("aria-busy", "false");
    els.content.innerHTML = emptyState("!", "Não foi possível carregar os dados", "Verifique sua conexão e tente novamente.", `<button class="primaryButton" onclick="location.reload()" type="button">Tentar novamente</button>`);
  }

  if ("serviceWorker" in navigator) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
}

init();
