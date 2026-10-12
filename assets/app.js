// Loads site content from data/, content/ and writing/ and renders it into index.html.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = (text) => (window.marked ? marked.parse(text) : "<p>" + esc(text) + "</p>");
  const getJSON = (p) => fetch(p, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(p); return r.json(); });
  const getText = (p) => fetch(p, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(p); return r.text(); });
  const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const fail = (el, what) => { el.innerHTML = `<p class="empty">Could not load ${esc(what)}.</p>`; };

  let profile = { name: "" };
  let posts = [];

  // ---------- profile + news ----------
  const profileReady = getJSON("data/profile.json").then((p) => {
    profile = p;
    document.title = p.name ? p.name : document.title;
    $("name").textContent = p.name;
    $("role").innerHTML = (p.affiliation || []).map(esc).join("<br>");
    if (p.photo) $("portrait").innerHTML = `<img src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}">`;
    const links = [];
    if (p.email) links.push(`<li class="email">${esc(p.email)}</li>`);
    (p.links || []).forEach((l) => links.push(`<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`));
    $("links").innerHTML = links.join("");
    $("news").innerHTML = (p.news || []).map((n) => `<li><time>${esc(n.date)}</time><span>${md(n.text).replace(/^<p>|<\/p>\s*$/g, "")}</span></li>`).join("") || `<li class="empty">No news yet.</li>`;
    $("footer").textContent = p.updated ? `Last updated ${p.updated}` : "";
  }).catch(() => { $("name").textContent = "Could not load profile"; });

  // ---------- markdown pages ----------
  getText("content/about.md").then((t) => ($("about-md").innerHTML = md(t))).catch(() => fail($("about-md"), "about.md"));
  getText("content/research.md").then((t) => ($("research-md").innerHTML = md(t))).catch(() => fail($("research-md"), "research.md"));

  // ---------- publications ----------
  profileReady.then(() => getJSON("data/publications.json")).then((pubs) => {
    if (!pubs.length) return ($("pubs").innerHTML = `<p class="empty">Publications coming soon.</p>`);
    const byYear = {};
    pubs.forEach((p) => (byYear[p.year] = byYear[p.year] || []).push(p));
    const me = (profile.name || "").trim();
    $("pubs").innerHTML = Object.keys(byYear).sort((a, b) => b - a).map((y) =>
      `<div class="pubyear">${esc(y)}</div><ol class="pubs">` + byYear[y].map((p) => {
        const authors = (p.authors || []).map((a) => (a === me && !p.equal_contribution ? `<u>${esc(a)}</u>` : esc(a))).join(", ");
        const links = Object.entries(p.links || {}).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`).join("");
        const award = p.award ? `<span class="award">${esc(p.award)}</span>` : "";
        return `<li class="pub"><div class="t">${esc(p.title)}</div><div class="a${p.equal_contribution ? " eq" : ""}">${authors}</div><div class="v">${esc(p.venue)}</div>${links || award ? `<div class="badges">${links}${award}</div>` : ""}</li>`;
      }).join("") + `</ol>`).join("");
  }).catch(() => fail($("pubs"), "publications.json"));

  // ---------- cv ----------
  getJSON("data/cv.json").then((cv) => {
    const pdf = cv.pdf ? `<p><a href="${esc(cv.pdf)}" target="_blank" rel="noopener">Download full CV (PDF)</a></p>` : "";
    $("cvbody").innerHTML = pdf + (cv.sections || []).map((s, i) =>
      `<h3${i === 0 ? ' style="margin-top:0"' : ""}>${esc(s.heading)}</h3><dl class="cv">` +
      s.items.map((it) => `<dt>${esc(it.when)}</dt><dd><span class="cvw">${esc(it.what)}</span>${it.detail ? `<small>${esc(it.detail)}</small>` : ""}${(it.bullets || []).length ? `<ul>${it.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}</dd>`).join("") + `</dl>`).join("");
  }).catch(() => fail($("cvbody"), "cv.json"));

  // ---------- writing ----------
  const postsReady = getJSON("data/posts.json").then((list) => {
    posts = list.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    $("postlist").innerHTML = posts.map((p) =>
      `<li><a href="#${esc(p.slug)}"><span>${p.tag ? `<span class="tag">${esc(p.tag)}</span><br>` : ""}<span class="pt">${esc(p.title)}</span></span><span class="pd">${fmtDate(p.date)}</span>${p.excerpt ? `<span class="px">${esc(p.excerpt)}</span>` : ""}</a></li>`).join("") || "";
  }).catch(() => fail($("postlist"), "posts.json"));

  function showPost(p) {
    const el = $("postbody");
    el.innerHTML = `<a class="back" href="#writing">← All writing</a><h1>${esc(p.title)}</h1><div class="meta">${fmtDate(p.date)}${p.tag ? " · " + esc(p.tag) : ""}</div><div class="body"><p class="empty">Loading…</p></div>`;
    getText(`writing/${p.slug}.md`).then((t) => (el.querySelector(".body").innerHTML = md(t))).catch(() => fail(el.querySelector(".body"), `writing/${p.slug}.md`));
    document.title = p.title + (profile.name ? " · " + profile.name : "");
  }

  // ---------- routing (#about, #research, #publications, #writing, #cv, #<post-slug>) ----------
  const views = [...document.querySelectorAll("[data-view]")];
  const navLinks = [...document.querySelectorAll("nav.tabs a")];
  async function route() {
    const h = decodeURIComponent((location.hash || "#about").slice(1));
    let show = "about";
    if (h !== "post" && $(h) && $(h).hasAttribute("data-view")) show = h;
    else {
      await postsReady;
      const p = posts.find((x) => x.slug === h);
      if (p) { show = "post"; showPost(p); }
    }
    if (show !== "post" && profile.name) document.title = profile.name;
    views.forEach((v) => (v.hidden = v.id !== show));
    const active = show === "post" ? "writing" : show;
    navLinks.forEach((a) => (a.getAttribute("href") === "#" + active ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    window.scrollTo(0, 0);
  }
  addEventListener("hashchange", route);
  route();
})();
