const STORAGE_KEY = "blog_cms_current_post";
const STORAGE_POSTS_KEY = "blog_cms_posts";
const SETTINGS_KEY = "blog_cms_settings";
const EXCERPT_MAX_LENGTH = 150;
const ALLOWED_HTML_TAGS = new Set([
  "a", "blockquote", "br", "code", "del", "div", "em", "figcaption", "figure",
  "h2", "h3", "h4", "hr", "img", "li", "ol", "p", "pre",
  "span", "strong", "table", "tbody", "td", "th", "thead", "tr", "u", "ul"
]);
const ALLOWED_HTML_ATTRIBUTES = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  table: new Set(["border"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"])
};
const DEFAULT_SETTINGS = {
  supabaseUrl: normalizeSupabaseUrl(window.CMS_CONFIG?.supabaseUrl || ""),
  supabaseAnon: window.CMS_CONFIG?.supabaseAnon || "",
  functionUrl: window.CMS_CONFIG?.functionUrl || ""
};

const state = {
  post: emptyPost(),
  posts: [],
  settings: loadSettings()
};

const els = {
  postList: document.getElementById("postList"),
  postCount: document.getElementById("postCount"),
  search: document.getElementById("searchInput"),
  title: document.getElementById("titleInput"),
  slug: document.getElementById("slugInput"),
  editor: document.getElementById("contentEditor"),
  toolbar: document.querySelector(".toolbar"),
  markdownPanel: document.getElementById("markdownPanel"),
  markdownInput: document.getElementById("markdownInput"),
  htmlCodePanel: document.getElementById("htmlCodePanel"),
  htmlCodeInput: document.getElementById("htmlCodeInput"),
  excerpt: document.getElementById("excerptInput"),
  excerptCount: document.getElementById("excerptCount"),
  excerptWarning: document.getElementById("excerptWarning"),
  labels: document.getElementById("labelsInput"),
  status: document.getElementById("statusInput"),
  publishAt: document.getElementById("publishAtInput"),
  wordCount: document.getElementById("wordCount"),
  charCount: document.getElementById("charCount"),
  saveState: document.getElementById("saveState"),
  toast: document.getElementById("toast"),
  previewTitle: document.getElementById("previewTitle"),
  previewExcerpt: document.getElementById("previewExcerpt"),
  previewLabels: document.getElementById("previewLabels"),
  previewLocation: document.getElementById("previewLocation"),
  previewContent: document.getElementById("previewContent"),
  locationName: document.getElementById("locationNameInput"),
  connectionDot: document.getElementById("connectionDot"),
  connectionText: document.getElementById("connectionText"),
  supabaseUrl: document.getElementById("supabaseUrlInput"),
  supabaseAnon: document.getElementById("supabaseAnonInput"),
  functionUrl: document.getElementById("functionUrlInput"),
  email: document.getElementById("emailInput"),
  password: document.getElementById("passwordInput")
};

init();

function init() {
  state.posts = loadPosts();
  state.post = loadPost();
  savePostToCollection(state.post);
  fillForm(state.post);
  fillSettings(state.settings);
  bindEvents();
  renderPostList();
  refreshStats();
  refreshConnection();
  renderPreview();
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => runCommand(button.dataset.command, button.dataset.value));
  });

  document.querySelectorAll("[data-editor-mode]").forEach((button) => {
    button.addEventListener("click", () => switchEditorMode(button.dataset.editorMode));
  });

  document.getElementById("imageBtn").addEventListener("click", insertImage);
  document.getElementById("convertMarkdownBtn").addEventListener("click", convertMarkdownToHtml);
  document.getElementById("loadHtmlToMarkdownBtn").addEventListener("click", loadHtmlIntoMarkdown);
  document.getElementById("applyHtmlCodeBtn").addEventListener("click", applyHtmlCode);
  document.getElementById("refreshHtmlCodeBtn").addEventListener("click", refreshHtmlCode);
  document.getElementById("newPostBtn").addEventListener("click", newPost);
  document.getElementById("saveDraftBtn").addEventListener("click", saveDraft);
  document.getElementById("deletePostBtn").addEventListener("click", deletePost);
  document.getElementById("publishBtn").addEventListener("click", publishPost);
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
  document.getElementById("loadSupabaseBtn").addEventListener("click", loadSupabasePosts);
  document.getElementById("syncPostsBtn").addEventListener("click", loadSupabasePosts);
  document.getElementById("loginBtn").addEventListener("click", login);
  document.getElementById("logoutBtn").addEventListener("click", logout);

  els.search.addEventListener("input", renderPostList);

  [els.title, els.slug, els.excerpt, els.labels, els.status, els.publishAt, els.locationName].forEach((input) => {
    input.addEventListener("input", handleChange);
  });

  els.title.addEventListener("input", () => {
    if (!els.slug.dataset.touched) {
      els.slug.value = slugify(els.title.value);
    }
  });

  els.slug.addEventListener("input", () => {
    els.slug.dataset.touched = "true";
    els.slug.value = slugify(els.slug.value);
  });

  els.editor.addEventListener("input", handleChange);
  els.editor.addEventListener("paste", pasteAsCleanHtml);
  els.markdownInput.addEventListener("input", () => {
    els.saveState.textContent = "Markdown belum dikonversi.";
  });
  els.htmlCodeInput.addEventListener("input", () => {
    els.saveState.textContent = "Kode HTML belum di-apply.";
  });
}

function switchView(viewName) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("is-visible");
  });

  document.getElementById(`${viewName}View`).classList.add("is-visible");

  if (viewName === "preview") {
    renderPreview();
  }
}

function switchEditorMode(mode) {
  document.querySelectorAll("[data-editor-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.editorMode === mode);
  });

  const isVisual = mode === "visual";
  const isMarkdown = mode === "markdown";
  const isHtml = mode === "html";
  els.markdownPanel.hidden = !isMarkdown;
  els.htmlCodePanel.hidden = !isHtml;
  els.toolbar.hidden = !isVisual;
  els.editor.hidden = !isVisual;

  if (isMarkdown && !els.markdownInput.value.trim()) {
    els.markdownInput.value = htmlToPlainMarkdown(els.editor.innerHTML);
  }

  if (isHtml) {
    refreshHtmlCode();
  }
}

function runCommand(command, value) {
  els.editor.focus();
  if (command === "createLink") {
    const url = window.prompt("URL link:");
    if (!url) return;
    document.execCommand("createLink", false, url);
  } else if (command === "formatBlock") {
    if (!["h2", "h3", "h4"].includes(value)) return;
    document.execCommand("formatBlock", false, value);
  } else {
    document.execCommand(command, false, value || null);
  }
  handleChange();
}

function insertImage() {
  const url = window.prompt("URL gambar:");
  if (!url) return;
  els.editor.focus();
  document.execCommand("insertHTML", false, `<figure><img src="${escapeAttribute(url)}" alt="" style="max-width:100%;height:auto;"><figcaption></figcaption></figure>`);
  handleChange();
}

function pasteAsCleanHtml(event) {
  event.preventDefault();
  const text = event.clipboardData.getData("text/plain");
  document.execCommand("insertText", false, text);
}

function convertMarkdownToHtml() {
  if (!window.marked?.parse) {
    showToast("Markdown parser belum siap. Refresh halaman lalu coba lagi.");
    return;
  }

  const markdown = prepareMarkdownForBlogger(els.markdownInput.value || "");
  const rawHtml = window.marked.parse(markdown, {
    breaks: true,
    gfm: true,
    mangle: false,
    headerIds: false
  });
  const cleanHtml = sanitizeEditorHtml(rawHtml);

  els.editor.innerHTML = cleanHtml || "<p></p>";
  els.htmlCodeInput.value = formatHtmlCode(els.editor.innerHTML);
  switchEditorMode("visual");
  handleChange();
  showToast("Markdown sudah dikonversi ke HTML bersih.");
}

function loadHtmlIntoMarkdown() {
  els.markdownInput.value = htmlToPlainMarkdown(els.editor.innerHTML);
  showToast("Konten editor dimuat ke Markdown.");
}

function applyHtmlCode() {
  const cleanHtml = sanitizeEditorHtml(els.htmlCodeInput.value || "");
  els.editor.innerHTML = cleanHtml || "<p></p>";
  els.htmlCodeInput.value = formatHtmlCode(cleanHtml);
  switchEditorMode("visual");
  handleChange();
  showToast("Kode HTML sudah di-apply.");
}

function refreshHtmlCode() {
  els.htmlCodeInput.value = formatHtmlCode(sanitizeEditorHtml(els.editor.innerHTML));
}

function prepareMarkdownForBlogger(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const output = [];

  lines.forEach((line, index) => {
    const previous = lines[index - 1] || "";
    const next = lines[index + 1] || "";
    const startsTable = isMarkdownTableRow(line) && isMarkdownTableDivider(next);
    const endsTable = isMarkdownTableRow(previous) && !isMarkdownTableRow(line);

    if (startsTable && output.length && output[output.length - 1].trim()) {
      output.push("");
    }

    if (endsTable && output.length && output[output.length - 1].trim()) {
      output.push("");
    }

    output.push(line);
  });

  return output.join("\n");
}

function isMarkdownTableRow(line) {
  const value = line.trim();
  return value.startsWith("|") && value.endsWith("|") && value.split("|").length > 3;
}

function isMarkdownTableDivider(line) {
  const value = line.trim();
  if (!isMarkdownTableRow(value)) return false;
  return value
    .slice(1, -1)
    .split("|")
    .every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function handleChange() {
  readForm();
  persistPost();
  savePostToCollection(state.post);
  refreshExcerptCount();
  refreshStats();
  renderPreview();
  renderPostList();
  els.saveState.textContent = `Auto saved ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

function readForm() {
  state.post.title = els.title.value.trim();
  state.post.slug = els.slug.value.trim();
  state.post.content_html = sanitizeEditorHtml(els.editor.innerHTML);
  state.post.excerpt = limitText(els.excerpt.value.trim(), EXCERPT_MAX_LENGTH);
  els.excerpt.value = state.post.excerpt;
  state.post.labels = els.labels.value.split(",").map((label) => label.trim()).filter(Boolean);
  state.post.location_name = els.locationName.value.trim();
  state.post.status = els.status.value;
  state.post.publish_at = els.publishAt.value || null;
  state.post.updated_at = new Date().toISOString();
}

function fillForm(post) {
  els.title.value = post.title;
  els.slug.value = post.slug || "";
  els.slug.dataset.touched = post.slug ? "true" : "";
  els.editor.innerHTML = post.content_html || "<p>Tulis artikel di sini...</p>";
  els.excerpt.value = limitText(post.excerpt || "", EXCERPT_MAX_LENGTH);
  els.labels.value = (post.labels || []).join(", ");
  els.locationName.value = post.location_name || "";
  els.status.value = post.status || "draft";
  els.publishAt.value = toDatetimeLocal(post.publish_at);
  refreshExcerptCount();
}

function fillSettings(settings) {
  els.supabaseUrl.value = settings.supabaseUrl || "";
  els.supabaseAnon.value = settings.supabaseAnon || "";
  els.functionUrl.value = settings.functionUrl || "";
}

async function saveDraft() {
  readForm();
  state.post.status = "draft";
  els.status.value = "draft";
  persistPost();
  savePostToCollection(state.post);

  const savedRemote = await upsertSupabasePost(state.post, { silent: true });
  if (savedRemote) {
    state.post = savedRemote;
    persistPost();
    savePostToCollection(state.post);
    fillForm(state.post);
    renderPostList();
  }
  showToast(savedRemote ? "Draft tersimpan ke Supabase." : "Draft tersimpan lokal.");
}

function newPost() {
  state.post = emptyPost();
  els.slug.dataset.touched = "";
  fillForm(state.post);
  persistPost();
  savePostToCollection(state.post);
  refreshStats();
  renderPreview();
  renderPostList();
  showToast("Dokumen baru siap ditulis.");
}

async function deletePost() {
  if (!state.post?.id) return;
  const title = state.post.title || "Untitled";
  if (!window.confirm(`Hapus "${title}"?`)) return;

  await deleteSupabasePost(state.post.id, { silent: true });
  state.posts = state.posts.filter((post) => post.id !== state.post.id);
  persistPosts();

  state.post = state.posts[0] || emptyPost();
  fillForm(state.post);
  persistPost();
  renderPostList();
  renderPreview();
  refreshStats();
  showToast("Artikel dihapus.");
}

async function publishPost() {
  readForm();

  if (!state.post.title || !stripHtml(state.post.content_html)) {
    showToast("Judul dan konten wajib diisi.");
    return;
  }

  const savedPost = await upsertSupabasePost(state.post, { silent: true });
  if (savedPost) {
    state.post = savedPost;
    persistPost();
    savePostToCollection(state.post);
  }

  if (!state.settings.functionUrl || !state.settings.supabaseAnon) {
    showToast("Isi Publish Function URL dan Anon Key di Settings dulu.");
    switchView("settings");
    return;
  }

  const token = await getSessionToken();
  if (!token) {
    showToast("Login admin dulu sebelum publish.");
    switchView("settings");
    return;
  }

  try {
    const response = await fetch(state.settings.functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ ...state.post, status: "published" })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `Publish gagal dengan status ${response.status}`);
    }

    state.post.status = "published";
    state.post.blogger_post_id = result.blogger_post_id || state.post.blogger_post_id || null;
    state.post.blogger_url = result.blogger_url || state.post.blogger_url || null;
    state.post.updated_at = new Date().toISOString();
    persistPost();
    savePostToCollection(state.post);
    await upsertSupabasePost(state.post, { silent: true });
    fillForm(state.post);
    renderPostList();
    showToast("Artikel berhasil dikirim ke Blogger.");
  } catch (error) {
    showToast(error.message);
  }
}

function saveSettings() {
  state.settings = {
    supabaseUrl: normalizeSupabaseUrl(els.supabaseUrl.value),
    supabaseAnon: els.supabaseAnon.value.trim(),
    functionUrl: els.functionUrl.value.trim()
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  getSupabaseClient.instance = null;
  fillSettings(state.settings);
  refreshConnection();
  showToast("Settings tersimpan.");
}

async function login() {
  saveSettings();
  const client = getSupabaseClient();
  if (!client) {
    showToast("Supabase URL dan Anon Key wajib diisi.");
    return;
  }

  const { error } = await client.auth.signInWithPassword({
    email: els.email.value.trim(),
    password: els.password.value
  });

  if (error) {
    showToast(error.message);
    return;
  }

  refreshConnection();
  showToast("Login berhasil.");
  await loadSupabasePosts();
}

async function logout() {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
  refreshConnection();
  showToast("Logout berhasil.");
}

async function loadSupabasePosts() {
  const client = getSupabaseClient();
  if (!client) {
    showToast("Isi Supabase URL dan Anon Key dulu.");
    switchView("settings");
    return;
  }

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    showToast("Login admin dulu buat load posts.");
    switchView("settings");
    return;
  }

  const { data, error } = await client
    .from("cms_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    showToast(error.message);
    return;
  }

  state.posts = mergePosts(state.posts, data || []);
  persistPosts();

  const active = state.posts.find((post) => post.id === state.post.id) || state.posts[0] || emptyPost();
  state.post = normalizePost(active);
  fillForm(state.post);
  persistPost();
  renderPostList();
  renderPreview();
  refreshStats();
  showToast(`${data.length} artikel dimuat dari Supabase.`);
}

async function upsertSupabasePost(post, options = {}) {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) return null;

  const payload = toSupabasePayload(post, sessionData.session.user.id);
  const { data, error } = await client
    .from("cms_posts")
    .upsert(payload)
    .select()
    .single();

  if (error) {
    if (!options.silent) showToast(error.message);
    return null;
  }

  return normalizePost(data);
}

async function deleteSupabasePost(id, options = {}) {
  const client = getSupabaseClient();
  if (!client) return false;

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) return false;

  const { error } = await client.from("cms_posts").delete().eq("id", id);
  if (error) {
    if (!options.silent) showToast(error.message);
    return false;
  }

  return true;
}

function renderPostList() {
  const query = (els.search.value || "").toLowerCase().trim();
  const posts = state.posts
    .map(normalizePost)
    .filter((post) => {
      const text = `${post.title} ${post.slug} ${post.status} ${(post.labels || []).join(" ")}`.toLowerCase();
      return !query || text.includes(query);
    })
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  els.postCount.textContent = `${state.posts.length} post`;
  els.postList.innerHTML = "";

  if (!posts.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = "Belum ada artikel.";
    els.postList.appendChild(empty);
    return;
  }

  posts.forEach((post) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "post-item";
    button.classList.toggle("is-active", post.id === state.post.id);
    button.innerHTML = `
      <strong>${escapeHtml(post.title || "Untitled")}</strong>
      <span>${escapeHtml(post.status || "draft")} · ${formatDate(post.updated_at)}</span>
      <small>${escapeHtml((post.labels || []).slice(0, 3).join(", ") || post.slug || "Tanpa label")}</small>
    `;
    button.addEventListener("click", () => selectPost(post.id));
    els.postList.appendChild(button);
  });
}

function selectPost(id) {
  const post = state.posts.find((item) => item.id === id);
  if (!post) return;

  state.post = normalizePost(post);
  fillForm(state.post);
  persistPost();
  renderPostList();
  renderPreview();
  refreshStats();
  els.saveState.textContent = `Membuka ${state.post.title || "Untitled"}.`;
}

function renderPreview() {
  els.previewTitle.textContent = state.post.title || "Judul artikel";
  els.previewExcerpt.textContent = state.post.excerpt || "";
  els.previewLabels.textContent = (state.post.labels || []).join(" / ");
  els.previewLocation.textContent = formatLocationLabel(state.post);
  els.previewContent.innerHTML = state.post.content_html || "";
}

function refreshStats() {
  const text = els.editor.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  els.wordCount.textContent = words;
  els.charCount.textContent = text.length;
}

function refreshExcerptCount() {
  const length = els.excerpt.value.length;
  const isLimit = length >= EXCERPT_MAX_LENGTH;
  els.excerptCount.textContent = `${length}/${EXCERPT_MAX_LENGTH} karakter`;
  els.excerptCount.classList.toggle("is-limit", isLimit);
  els.excerptWarning.classList.toggle("is-visible", isLimit);
}

function refreshConnection() {
  const connected = Boolean(state.settings.functionUrl && state.settings.supabaseAnon);
  els.connectionDot.classList.toggle("is-connected", connected);
  els.connectionText.textContent = connected ? "Publish endpoint ready" : "Local draft mode";
}

function getSupabaseClient() {
  if (!state.settings.supabaseUrl || !state.settings.supabaseAnon || !window.supabase) {
    return null;
  }
  if (!getSupabaseClient.instance) {
    getSupabaseClient.instance = window.supabase.createClient(
      state.settings.supabaseUrl,
      state.settings.supabaseAnon
    );
  }
  return getSupabaseClient.instance;
}

function normalizeSupabaseUrl(value) {
  const rawValue = value.trim();
  if (!rawValue) return "";

  try {
    const url = new URL(rawValue);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawValue.replace(/\/rest\/v1.*$/, "").replace(/\/$/, "");
  }
}

async function getSessionToken() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token || null;
}

function savePostToCollection(post) {
  const normalized = normalizePost(post);
  const index = state.posts.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    state.posts[index] = normalized;
  } else {
    state.posts.unshift(normalized);
  }
  persistPosts();
}

function persistPost() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.post));
}

function persistPosts() {
  localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(state.posts.map(normalizePost)));
}

function loadPost() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (current?.id) return normalizePost(current);
  } catch {
    return state.posts[0] || emptyPost();
  }
  return state.posts[0] || emptyPost();
}

function loadPosts() {
  try {
    const posts = JSON.parse(localStorage.getItem(STORAGE_POSTS_KEY));
    if (Array.isArray(posts)) return posts.map(normalizePost);
  } catch {
    return [];
  }

  try {
    const legacyPost = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return legacyPost?.id ? [normalizePost(legacyPost)] : [];
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    return mergeSettings(DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {});
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function mergeSettings(defaults, saved) {
  return {
    supabaseUrl: saved.supabaseUrl || defaults.supabaseUrl,
    supabaseAnon: saved.supabaseAnon || defaults.supabaseAnon,
    functionUrl: saved.functionUrl || defaults.functionUrl
  };
}

function emptyPost() {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: "",
    slug: "",
    content_html: "<p>Tulis artikel di sini...</p>",
    excerpt: "",
    labels: [],
    location_name: "",
    status: "draft",
    publish_at: null,
    blogger_post_id: null,
    blogger_url: null,
    created_at: now,
    updated_at: now
  };
}

function normalizePost(post) {
  return {
    ...emptyPost(),
    ...post,
    labels: Array.isArray(post?.labels) ? post.labels : [],
    status: post?.status || "draft"
  };
}

function mergePosts(localPosts, remotePosts) {
  const byId = new Map();
  [...localPosts, ...remotePosts].forEach((post) => {
    const normalized = normalizePost(post);
    const current = byId.get(normalized.id);
    if (!current || new Date(normalized.updated_at || 0) >= new Date(current.updated_at || 0)) {
      byId.set(normalized.id, normalized);
    }
  });
  return [...byId.values()].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
}

function toSupabasePayload(post, userId) {
  return {
    id: post.id,
    user_id: userId,
    title: post.title || "Untitled",
    slug: post.slug || null,
    content_html: post.content_html || "",
    excerpt: limitText(post.excerpt || "", EXCERPT_MAX_LENGTH) || null,
    labels: post.labels || [],
    location_name: post.location_name || null,
    status: post.status || "draft",
    publish_at: post.publish_at || null,
    blogger_post_id: post.blogger_post_id || null,
    blogger_url: post.blogger_url || null
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeEditorHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
  normalizeBodyHeadings(template.content);
  template.content.querySelectorAll("*").forEach((node) => {
    const tagName = node.tagName.toLowerCase();
    if (!ALLOWED_HTML_TAGS.has(tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }

    const allowedAttributes = ALLOWED_HTML_ATTRIBUTES[tagName] || new Set();
    [...node.attributes].forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      if (attributeName.startsWith("on") || attributeName === "style" || !allowedAttributes.has(attributeName)) {
        node.removeAttribute(attribute.name);
      }
    });

    cleanSafeUrlAttribute(node, "href");
    cleanSafeUrlAttribute(node, "src");

    if (tagName === "a" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  return template.innerHTML.trim();
}

function normalizeBodyHeadings(root) {
  root.querySelectorAll("h1, h5, h6").forEach((heading) => {
    const sourceLevel = Number(heading.tagName.slice(1));
    const targetLevel = sourceLevel === 1 ? 2 : 4;
    const replacement = document.createElement(`h${targetLevel}`);
    replacement.innerHTML = heading.innerHTML;
    heading.replaceWith(replacement);
  });
}

function cleanSafeUrlAttribute(node, attributeName) {
  const value = node.getAttribute(attributeName);
  if (!value) return;

  const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(value);
  if (!safe) node.removeAttribute(attributeName);
}

function formatHtmlCode(html) {
  return String(html || "")
    .replace(/></g, ">\n<")
    .trim();
}

function htmlToPlainMarkdown(html) {
  const template = document.createElement("template");
  template.innerHTML = sanitizeEditorHtml(html || "");
  return template.content.textContent.trim();
}

function stripHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html || "";
  return template.content.textContent.trim();
}

function limitText(value, maxLength) {
  return String(value || "").slice(0, maxLength);
}

function formatLocationLabel(post) {
  const location = buildBloggerLocation(post);
  if (!location) return "";
  return location.name || "";
}

function buildBloggerLocation(post) {
  const name = (post.location_name || "").trim();

  if (!name) return null;

  return { name };
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function escapeAttribute(value) {
  return value.replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2600);
}
