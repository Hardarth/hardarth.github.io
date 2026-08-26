/* Renders the index and case-study views from the data in data.js.
   No framework, no build step. The URL hash holds the open project,
   so every case study is linkable and the back button works. */

(function () {
  "use strict";

  var PAGE = document.body.dataset.page;          // "HW" or "SW"
  var DATA = window.SITE[PAGE];
  var P = DATA.projects;
  var HERO = DATA.hero;
  var root = document.getElementById("view");

  var OTHER = PAGE === "HW"
    ? { href: "software.html", label: "See the software work" }
    : { href: "index.html", label: "See the hardware work" };

  /* filter state — index view only */
  var filter = { disc: "All", q: "" };

  /* ---------- helpers ---------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function frag(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  var NDA_NOTE =
    "Geometry and imagery withheld under NDA. Everything on this page describes method, reasoning, and outcome only.";

  /* Media area: a real photo, the NDA lock, or a labelled empty slot.
     Photos in the case view are zoomable — they carry caption data the
     lightbox reads back out. */
  function media(opts) {
    if (opts.src) {
      var zoom = opts.zoom ? " zoomable" : "";
      return frag(
        '<div class="fill' + zoom + '"' +
        (opts.zoom ? ' data-zoom-src="' + esc(opts.src) + '"' +
          ' data-zoom-tag="' + esc(opts.tag || "") + '"' +
          ' data-zoom-cap="' + esc(opts.cap || opts.alt || "") + '"' : "") +
        '><img src="' + esc(opts.src) + '" alt="' + esc(opts.alt || "") + '" loading="lazy">' +
        (opts.zoom ? '<span class="zoom-hint">Click to enlarge</span>' : "") +
        "</div>"
      );
    }
    if (opts.nda) {
      return frag(
        '<div class="lock"><i class="d1"></i><i class="d2"></i><i class="d3"></i>' +
        (opts.ndaNote ? '<i class="note">' + esc(opts.ndaNote) + "</i>" : "") +
        "</div>"
      );
    }
    return frag(
      '<div class="pending"><b>Image slot</b><span>' + esc(opts.hint || "Add an image") + "</span></div>"
    );
  }

  /* ---------- index view ---------- */

  function disciplines() {
    var seen = [];
    P.forEach(function (p) { if (seen.indexOf(p.disc) < 0) seen.push(p.disc); });
    return ["All"].concat(seen);
  }

  function matches(p) {
    if (filter.disc !== "All" && p.disc !== filter.disc) return false;
    var q = filter.q.trim().toLowerCase();
    if (!q) return true;
    var hay = [p.title, p.kicker, p.metric, p.disc, p.rail, p.year]
      .concat(p.tags).join(" ").toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function buildTile(p, i) {
    var tile = el("button", "tile");
    tile.type = "button";
    tile.setAttribute("aria-label", "Open case study: " + p.title);

    var mediaBox = el("div", "tile-media");
    var inner = el("div", "media-inner");
    inner.appendChild(media({
      src: p.card, nda: p.nda, alt: p.title,
      hint: "Lead image — " + p.title
    }));
    mediaBox.appendChild(inner);
    mediaBox.appendChild(frag(
      '<div class="badges">' +
      '<span class="badge badge-disc">' + esc(p.disc) + "</span>" +
      '<span class="badge badge-plain">' + esc(p.year) + "</span>" +
      (p.nda ? '<span class="badge badge-plain badge-nda">Under NDA</span>' : "") +
      "</div>" +
      '<div class="tile-num">' + pad(i + 1) + "</div>"
    ));
    tile.appendChild(mediaBox);

    var body = frag(
      '<div class="tile-body">' +
      '<div class="tile-kicker">' + esc(p.kicker) + "</div>" +
      '<h2 class="tile-title">' + esc(p.title) + "</h2>" +
      '<div class="tile-metric"><span>' + esc(p.metric) + "</span></div>" +
      '<div class="tile-tags"></div>' +
      '<div class="tile-foot">' +
      '<span class="tile-open">Open case study &rarr;</span>' +
      '<span class="tile-bar"></span>' +
      "</div></div>"
    );
    var tagBox = body.querySelector(".tile-tags");
    p.tags.slice(0, 4).forEach(function (t) {
      tagBox.appendChild(el("span", "tile-tag", t));
    });
    if (p.tags.length > 4) {
      tagBox.appendChild(el("span", "tile-tag more", "+" + (p.tags.length - 4)));
    }
    tile.appendChild(body);

    tile.addEventListener("click", function () { open(p.id); });
    return tile;
  }

  function paintGrid() {
    var grid = document.getElementById("grid");
    var countEl = document.getElementById("count");
    if (!grid) return;
    var shown = [];
    P.forEach(function (p, i) { if (matches(p)) shown.push([p, i]); });

    grid.replaceChildren();
    if (!shown.length) {
      grid.appendChild(frag(
        '<div class="empty"><b>No projects match those filters.</b>' +
        "<span>Select a different discipline or clear the search.</span></div>"
      ));
    } else {
      shown.forEach(function (pair) { grid.appendChild(buildTile(pair[0], pair[1])); });
    }
    countEl.textContent = shown.length === P.length
      ? P.length + " projects"
      : shown.length + " of " + P.length;
    observeReveal(grid.querySelectorAll(".tile"));
  }

  function renderIndex() {
    var out = document.createDocumentFragment();

    var hero = frag(
      '<section class="hero">' +
      '<div class="diamond-a"></div><div class="diamond-b"></div>' +
      '<div class="hero-inner">' +
      '<div class="eyebrow">' + esc(HERO.kicker) + "</div>" +
      "<h1>" + esc(HERO.title) + "</h1>" +
      '<p class="hero-body">' + esc(HERO.body) + "</p>" +
      "</div>" +
      '<div class="stats"></div>' +
      "</section>"
    );
    var stats = hero.querySelector(".stats");
    HERO.stats.forEach(function (s) {
      var d = el("div", "stat");
      d.appendChild(el("div", "stat-v", s.v));
      d.appendChild(el("div", "stat-l", s.l));
      stats.appendChild(d);
    });
    out.appendChild(hero);

    var bar = frag(
      '<div class="toolbar">' +
      '<div class="chips"></div>' +
      '<div class="tb-spacer"></div>' +
      '<input class="search" id="search" type="search" placeholder="Search projects…" aria-label="Search projects">' +
      '<span class="count" id="count"></span>' +
      "</div>"
    );
    var chips = bar.querySelector(".chips");
    disciplines().forEach(function (d) {
      var c = el("button", "chip", d);
      c.type = "button";
      c.setAttribute("aria-pressed", String(d === filter.disc));
      c.addEventListener("click", function () {
        filter.disc = d;
        chips.querySelectorAll(".chip").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x.textContent === d));
        });
        paintGrid();
      });
      chips.appendChild(c);
    });
    var searchEl = bar.querySelector("#search");
    searchEl.value = filter.q;
    searchEl.addEventListener("input", function () {
      filter.q = searchEl.value;
      paintGrid();
    });
    out.appendChild(bar);

    out.appendChild(frag('<div class="grid-wrap"><div class="grid" id="grid"></div></div>'));

    out.appendChild(frag(
      '<footer class="foot">' +
      "<div>" +
      '<div class="foot-avail">Available Summer 2027</div>' +
      '<div class="foot-line">' + esc(HERO.foot) + "</div>" +
      "</div>" +
      '<div class="foot-contact">' +
      '<a href="mailto:harshaltawde@utexas.edu">harshaltawde@utexas.edu</a>' +
      "<span>(346) 213-2333</span><span>Austin, Texas</span>" +
      '<a class="foot-cross" href="' + OTHER.href + '">' + OTHER.label + " &rarr;</a>" +
      "</div></footer>"
    ));

    root.replaceChildren(out);
    paintGrid();
  }

  /* ---------- case study view ---------- */

  function renderCase(idx) {
    var cur = P[idx];
    var nextP = P[(idx + 1) % P.length];
    var prevP = P[(idx - 1 + P.length) % P.length];
    var out = document.createDocumentFragment();

    var sub = frag(
      '<nav class="subnav">' +
      '<button type="button" class="sub-index">&larr; Index</button>' +
      '<div class="sub-kicker"><span>' + esc(cur.kicker) + "</span></div>" +
      '<button type="button" class="sub-prev">&larr; Prev</button>' +
      '<button type="button" class="sub-next">Next &rarr;</button>' +
      "</nav>"
    );
    sub.querySelector(".sub-index").addEventListener("click", function () { open(null); });
    sub.querySelector(".sub-prev").addEventListener("click", function () { open(prevP.id); });
    sub.querySelector(".sub-next").addEventListener("click", function () { open(nextP.id); });
    out.appendChild(sub);

    var head = frag(
      '<section class="case-head">' +
      '<div class="case-head-main">' +
      '<div class="diamond-c"></div>' +
      '<div class="case-head-inner">' +
      '<div class="case-meta">' +
      '<span class="case-num">' + pad(idx + 1) + "</span>" +
      '<span class="dash"></span>' +
      '<span class="case-year">' + esc(cur.year) + "</span>" +
      "</div>" +
      "<h1>" + esc(cur.title) + "</h1>" +
      '<p class="case-lede">' + esc(cur.lede) + "</p>" +
      '<div class="tags"></div>' +
      "</div></div>" +
      '<div class="case-side">' +
      '<div class="case-side-media"></div>' +
      '<div class="outcomes"></div>' +
      "</div></section>"
    );
    var tags = head.querySelector(".tags");
    cur.tags.forEach(function (t) { tags.appendChild(el("span", "tag", t)); });
    head.querySelector(".case-side-media").appendChild(media({
      src: cur.hero, nda: cur.nda, ndaNote: NDA_NOTE, alt: cur.title, zoom: true,
      tag: "Lead", cap: cur.metric,
      hint: "Hero image — " + cur.title
    }));
    var outcomes = head.querySelector(".outcomes");
    cur.outcomes.forEach(function (o) {
      var d = el("div", "outcome");
      d.appendChild(el("div", "outcome-v", o.v));
      d.appendChild(el("div", "outcome-l", o.l));
      outcomes.appendChild(d);
    });
    out.appendChild(head);

    var probl = frag(
      '<section class="split">' +
      '<div class="col">' +
      '<div class="sec-label">01 &mdash; The problem</div>' +
      '<p class="prose-lead">' + esc(cur.problem) + "</p>" +
      '<p class="prose-sub">' + esc(cur.constraint) + "</p>" +
      "</div>" +
      '<div class="col tinted">' +
      '<div class="sec-label">02 &mdash; Requirements</div>' +
      '<div class="specs"></div>' +
      "</div></section>"
    );
    var specs = probl.querySelector(".specs");
    cur.specs.forEach(function (s) {
      var row = el("div", "spec");
      row.appendChild(el("span", "spec-k", s.k));
      row.appendChild(el("span", "spec-v", s.v));
      specs.appendChild(row);
    });
    out.appendChild(probl);

    out.appendChild(frag(
      '<div class="gallery-intro">' +
      '<div class="sec-label">03 &mdash; ' + esc(cur.galleryLabel) + "</div>" +
      '<p class="gallery-note">' + esc(cur.galleryNote) + "</p>" +
      "</div>"
    ));
    var gal = el("section", "gallery");
    cur.gallery.forEach(function (g) {
      var item = el("div", "gal-item");
      var box = el("div", "gal-media");
      box.appendChild(media({
        src: g.img, nda: g.nda, alt: g.cap, zoom: true,
        tag: g.tag, cap: g.cap,
        hint: g.hint || "Add an image"
      }));
      item.appendChild(box);
      item.appendChild(frag(
        '<div class="gal-cap">' +
        '<div class="gal-tag">' + esc(g.tag) + "</div>" +
        '<div class="gal-text">' + esc(g.cap) + "</div>" +
        "</div>"
      ));
      gal.appendChild(item);
    });
    out.appendChild(gal);

    var ana = frag(
      '<section class="split">' +
      '<div class="col">' +
      '<div class="sec-label wide">04 &mdash; Analysis &amp; data</div>' +
      '<div class="analysis-list"></div>' +
      "</div>" +
      '<div class="plot-col">' +
      '<div class="plot-media"></div>' +
      '<div class="plot-cap">' + esc(cur.plotCap) + "</div>" +
      "</div></section>"
    );
    var alist = ana.querySelector(".analysis-list");
    cur.analysis.forEach(function (a, i) {
      var row = el("div", "analysis-item");
      row.appendChild(el("div", "analysis-n", pad(i + 1)));
      var body = el("div");
      body.appendChild(el("div", "analysis-t", a.t));
      body.appendChild(el("div", "analysis-d", a.d));
      row.appendChild(body);
      alist.appendChild(row);
    });
    ana.querySelector(".plot-media").appendChild(media({
      src: cur.plot, nda: cur.nda, alt: cur.plotCap, zoom: true,
      tag: "Data", cap: cur.plotCap,
      hint: cur.plotHint || "Add a plot"
    }));
    out.appendChild(ana);

    var bv = frag(
      '<section class="split">' +
      '<div class="col">' +
      '<div class="sec-label wide">05 &mdash; ' + esc(cur.buildLabel) + "</div>" +
      '<div class="bullet-list build"></div>' +
      "</div>" +
      '<div class="col tinted">' +
      '<div class="sec-label wide">06 &mdash; Validation</div>' +
      '<div class="bullet-list validation"></div>' +
      '<div class="status">' +
      '<div class="status-label">Where it stands</div>' +
      '<div class="status-text">' + esc(cur.status) + "</div>" +
      "</div></div></section>"
    );
    var bl = bv.querySelector(".build");
    cur.build.forEach(function (b) {
      var row = el("div", "bullet");
      row.appendChild(el("span", null, b));
      bl.appendChild(row);
    });
    var vl = bv.querySelector(".validation");
    cur.validation.forEach(function (v) {
      var row = el("div", "bullet accent");
      row.appendChild(el("span", null, v));
      vl.appendChild(row);
    });
    out.appendChild(bv);

    var cfoot = frag(
      '<section class="case-foot">' +
      "<div>" +
      '<div class="upnext-label">Up next</div>' +
      '<button type="button" class="upnext">' + esc(nextP.title) + " &rarr;</button>" +
      "</div>" +
      '<button type="button" class="back-index">Back to index</button>' +
      "</section>"
    );
    cfoot.querySelector(".upnext").addEventListener("click", function () { open(nextP.id); });
    cfoot.querySelector(".back-index").addEventListener("click", function () { open(null); });
    out.appendChild(cfoot);

    root.replaceChildren(out);
    collectZoomable();
    observeReveal(root.querySelectorAll(".gal-item, .analysis-item, .outcome"));
  }

  /* ---------- lightbox ---------- */

  var shots = [];   // {src, tag, cap}
  var lbAt = 0;
  var lb, lbImg, lbCap, lbIdx;

  function buildLightbox() {
    lb = document.createElement("div");
    lb.className = "lb";
    lb.hidden = true;
    lb.innerHTML =
      '<div class="lb-top">' +
      '<span class="lb-index"></span>' +
      '<button type="button" class="lb-close">Close (Esc)</button>' +
      "</div>" +
      '<div class="lb-stage">' +
      '<button type="button" class="lb-arrow lb-prev" aria-label="Previous image">&larr;</button>' +
      '<img alt="">' +
      '<button type="button" class="lb-arrow lb-next" aria-label="Next image">&rarr;</button>' +
      "</div>" +
      '<div class="lb-cap"></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img");
    lbCap = lb.querySelector(".lb-cap");
    lbIdx = lb.querySelector(".lb-index");
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    lb.querySelector(".lb-prev").addEventListener("click", function () { stepLb(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { stepLb(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  }

  function collectZoomable() {
    shots = [];
    root.querySelectorAll(".fill.zoomable").forEach(function (n) {
      var rec = {
        src: n.dataset.zoomSrc,
        tag: n.dataset.zoomTag || "",
        cap: n.dataset.zoomCap || ""
      };
      var at = shots.length;
      shots.push(rec);
      n.addEventListener("click", function () { openLb(at); });
    });
  }

  function paintLb() {
    var s = shots[lbAt];
    lbImg.src = s.src;
    lbImg.alt = s.cap;
    lbCap.innerHTML = (s.tag ? "<b>" + esc(s.tag) + "</b>" : "") + esc(s.cap);
    lbIdx.textContent = (lbAt + 1) + " / " + shots.length;
  }

  function openLb(i) {
    if (!shots.length) return;
    lbAt = i;
    paintLb();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lb.querySelector(".lb-close").focus();
  }

  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  function stepLb(d) {
    lbAt = (lbAt + d + shots.length) % shots.length;
    paintLb();
  }

  /* ---------- reading progress ---------- */

  var progress = document.createElement("div");
  progress.className = "progress";
  document.body.appendChild(progress);

  function updateProgress() {
    var isCase = !!location.hash.slice(1);
    if (!isCase) { progress.style.width = "0"; return; }
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = pct + "%";
  }

  /* ---------- reveal on scroll ---------- */

  var io = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;

  function observeReveal(nodes) {
    if (!io) return;
    nodes.forEach(function (n) { n.classList.add("reveal"); io.observe(n); });
  }

  /* ---------- routing ---------- */

  function open(id) {
    if (id) {
      if (location.hash.slice(1) === id) route();
      else location.hash = id;
    } else if (location.hash) {
      history.pushState("", document.title, location.pathname + location.search);
      route();
    } else {
      route();
    }
    window.scrollTo(0, 0);
  }

  function route() {
    closeLb();
    var id = decodeURIComponent(location.hash.slice(1));
    var idx = P.findIndex(function (p) { return p.id === id; });
    if (idx >= 0) {
      renderCase(idx);
      document.title = P[idx].title + " — Harshal Tawde";
    } else {
      renderIndex();
      document.title = (PAGE === "HW" ? "Hardware" : "Software") + " — Harshal Tawde";
    }
    updateProgress();
  }

  window.addEventListener("hashchange", function () { route(); window.scrollTo(0, 0); });
  window.addEventListener("scroll", updateProgress, { passive: true });

  document.addEventListener("keydown", function (e) {
    if (!lb.hidden) {
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowRight") stepLb(1);
      if (e.key === "ArrowLeft") stepLb(-1);
      return;
    }
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") {
      if (e.key === "Escape") e.target.blur();
      return;
    }
    if (e.key === "/") {
      var s = document.getElementById("search");
      if (s) { e.preventDefault(); s.focus(); return; }
    }
    var idx = P.findIndex(function (p) { return p.id === location.hash.slice(1); });
    if (idx < 0) return;
    if (e.key === "ArrowRight") open(P[(idx + 1) % P.length].id);
    if (e.key === "ArrowLeft") open(P[(idx - 1 + P.length) % P.length].id);
    if (e.key === "Escape") open(null);
  });

  buildLightbox();
  route();
})();
