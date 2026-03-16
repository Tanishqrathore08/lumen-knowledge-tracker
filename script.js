
const STORAGE_KEY = "lumen_data";
const TAGS = ["AI", "Coding", "Cloud", "Design", "Business", "Science", "Math", "Other"];

function getLearnings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveLearningsToStorage(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}


let learnings = getLearnings();
let selectedTag = "Coding";
let activeFilter = null;
let searchQuery = "";


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("footer-year").textContent = new Date().getFullYear();
  renderTagButtons();
  renderFilterTags();
  renderCards();
  updateAnalytics();
  updateHeroSubtitle();
});


function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}


function updateHeroSubtitle() {
  const el = document.getElementById("hero-subtitle");
  el.textContent = learnings.length > 0
    ? learnings.length + " insights archived"
    : "Your knowledge repository";
}


function handleFetch() {
  const url = document.getElementById("url-input").value.trim();
  if (!url) return;

  const ytId = extractYouTubeId(url);
  const thumbEl = document.getElementById("preview-thumb");
  const titleEl = document.getElementById("title-input");

  if (ytId) {
    thumbEl.src = "https://img.youtube.com/vi/" + ytId + "/maxresdefault.jpg";
    thumbEl.classList.remove("hidden");
    titleEl.value = "New Learning from YouTube";
  } else {
    thumbEl.classList.add("hidden");
    thumbEl.src = "";
    titleEl.value = "";
  }

  document.getElementById("preview-area").classList.remove("hidden");
}

function handleSave() {
  const title = document.getElementById("title-input").value.trim();
  if (!title) return;

  const item = {
    id: Date.now(),
    title: title,
    notes: document.getElementById("notes-input").value,
    tag: selectedTag,
    thumb: document.getElementById("preview-thumb").src || "",
    url: document.getElementById("url-input").value,
    date: new Date().toISOString()
  };

  learnings.unshift(item);
  saveLearningsToStorage(learnings);

  // Reset
  document.getElementById("url-input").value = "";
  document.getElementById("title-input").value = "";
  document.getElementById("notes-input").value = "";
  document.getElementById("preview-thumb").src = "";
  document.getElementById("preview-thumb").classList.add("hidden");
  document.getElementById("preview-area").classList.add("hidden");

  renderCards();
  updateAnalytics();
  updateHeroSubtitle();
}

function renderTagButtons() {
  const container = document.getElementById("tag-buttons");
  container.innerHTML = TAGS.map(t =>
    '<button class="tag-btn' + (t === selectedTag ? ' active' : '') + '" onclick="selectTag(\'' + t + '\')">' + t + '</button>'
  ).join("");
}

function selectTag(t) {
  selectedTag = t;
  renderTagButtons();
}

function renderFilterTags() {
  const container = document.getElementById("filter-tags");
  let html = '<button class="filter-btn' + (!activeFilter ? ' active' : '') + '" onclick="setFilter(null)">All</button>';
  TAGS.forEach(t => {
    html += '<button class="filter-btn' + (activeFilter === t ? ' active' : '') + '" onclick="setFilter(\'' + t + '\')">' + t + '</button>';
  });
  container.innerHTML = html;
}

function setFilter(t) {
  activeFilter = activeFilter === t ? null : t;
  renderFilterTags();
  renderCards();
}

function filterLearnings() {
  searchQuery = document.getElementById("search-input").value.toLowerCase();
  renderCards();
}

function renderCards() {
  const grid = document.getElementById("cards-grid");
  const filtered = learnings.filter(l => {
    const matchSearch = !searchQuery || l.title.toLowerCase().includes(searchQuery) || l.notes.toLowerCase().includes(searchQuery);
    const matchTag = !activeFilter || l.tag === activeFilter;
    return matchSearch && matchTag;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p class="empty-title">No insights yet</p><p class="empty-sub">Start by pasting a link above</p></div>';
    return;
  }

  grid.innerHTML = filtered.map((item, i) => {
    const date = new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const thumbHtml = item.thumb ? '<img src="' + item.thumb + '" alt="' + item.title + '" class="card-thumb" />' : '';
    const notesHtml = item.notes ? '<p class="card-notes">' + escapeHtml(item.notes) + '</p>' : '';

    return '<div class="learning-card" style="animation-delay:' + (i * 0.05) + 's">'
      + thumbHtml
      + '<div class="card-body">'
      + '<div class="card-header"><span class="card-tag">' + escapeHtml(item.tag) + '</span>'
      + '<button class="card-delete" onclick="deleteLearning(' + item.id + ')" title="Delete">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
      + '</button></div>'
      + '<h3 class="card-title">' + escapeHtml(item.title) + '</h3>'
      + notesHtml
      + '<p class="card-date">' + date + '</p>'
      + '</div></div>';
  }).join("");
}

function deleteLearning(id) {
  learnings = learnings.filter(l => l.id !== id);
  saveLearningsToStorage(learnings);
  renderCards();
  updateAnalytics();
  updateHeroSubtitle();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}


function updateAnalytics() {
  document.getElementById("stat-total").textContent = learnings.length;

 
  const now = new Date();
  const weekData = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  learnings.forEach(l => {
    const d = new Date(l.date);
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff < 7) weekData[d.getDay()]++;
  });

  const thisWeek = weekData.reduce((a, b) => a + b, 0);
  document.getElementById("stat-week").textContent = thisWeek;


  const streak = getStreak();
  document.getElementById("stat-streak").textContent = streak;

  renderChart(dayNames, weekData);
}

function getStreak() {
  if (!learnings.length) return 0;
  const dates = [...new Set(learnings.map(l => new Date(l.date).toDateString()))]
    .sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (new Date(dates[i]).toDateString() === expected.toDateString()) {
      streak++;
    } else break;
  }
  return streak;
}

function renderChart(labels, data) {
  const container = document.getElementById("chart-container");
  const max = Math.max(...data, 1);

  container.innerHTML = labels.map((label, i) => {
    const heightPct = (data[i] / max) * 100;
    return '<div class="chart-bar-wrapper">'
      + '<div class="chart-bar" style="height:' + Math.max(heightPct, 2) + '%"></div>'
      + '<span class="chart-label">' + label + '</span>'
      + '</div>';
  }).join("");
}
