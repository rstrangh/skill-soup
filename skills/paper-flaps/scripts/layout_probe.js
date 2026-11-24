// Runs in the browser.
// Layout probe for a paper-flaps page. Runs inside the page (via a headless
// browser's eval) and returns a JSON string with findings. Walks every chapter, opens every
// flap, then measures. Rules: references/ui-rules.md, entries marked [checked].
(async () => {
  const findings = [];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const add = (rule, where, detail) => findings.push({ rule, where, detail });
  const visible = el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.05;
  };
  const label = el => (el.id ? "#" + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : "")) +
    " „" + (el.textContent || el.getAttribute("alt") || "").trim().replace(/\s+/g, " ").slice(0, 40) + "“";
  const alpha = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 0; const p = m[1].split(",").map(Number); return p.length > 3 ? p[3] : 1; };
  const isCard = el => {
    const cs = getComputedStyle(el);
    const sides = ["Top", "Right", "Bottom", "Left"].filter(s => parseFloat(cs["border" + s + "Width"]) >= 1).length;
    return (sides >= 3 || (alpha(cs.backgroundColor) > 0.3 && parseFloat(cs.borderRadius) >= 6)) && parseFloat(cs.paddingTop) >= 6;
  };
  const textSel = "p, h1, h2, h3, li, blockquote, summary, dt, dd, label";
  const pages = window.paperFlaps ? window.paperFlaps.count : 1;
  // Fail closed: without the chapter API only the visible chapter gets measured.
  if (!window.paperFlaps && document.querySelectorAll(".chapter").length > 1)
    add("probe", "page", "window.paperFlaps missing: only the visible chapter was measured");

  for (let p = 0; p < pages; p++) {
    if (window.paperFlaps) window.paperFlaps.go(p, true);
    document.querySelectorAll("details").forEach(d => { d.open = true; });
    await wait(900);
    const where = window.paperFlaps ? "chapter " + (p + 1) : "page";

    if (document.documentElement.scrollWidth > innerWidth + 1)
      add("no-horizontal-scroll", where, `Inhalt ${document.documentElement.scrollWidth}px bei ${innerWidth}px Breite`);

    // Texts inside a figure and the floating lore panel sit on purpose next to pictures.
    const texts = [...document.querySelectorAll(textSel)].filter(t => visible(t) && !t.closest("figure, details.lore"));
    document.querySelectorAll("figure img, figure .stage, .stage img").forEach(pic => {
      if (!visible(pic)) return;
      const r = pic.getBoundingClientRect();
      let below = Infinity, above = Infinity, near = null;
      texts.forEach(t => {
        const q = t.getBoundingClientRect();
        if (q.right < r.left + 8 || q.left > r.right - 8) return;
        if (q.top >= r.bottom - 1 && q.top - r.bottom < below) { below = q.top - r.bottom; if (below < 16) near = t; }
        if (q.bottom <= r.top + 1 && r.top - q.bottom < above) { above = r.top - q.bottom; if (above < 16) near = t; }
      });
      if (Math.min(below, above) < 16) add("picture-text-gap", where, `${Math.round(Math.min(below, above))}px zwischen Bild und ${label(near)}`);
    });

    document.querySelectorAll("button, summary, select, .hotspot, .pager a, .pager button").forEach(el => {
      if (!visible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) add("hit-target", where, `${Math.round(r.width)}×${Math.round(r.height)}px ${label(el)}`);
    });

    document.querySelectorAll("main *").forEach(el => {
      if (!visible(el)) return;
      const cs = getComputedStyle(el);
      if (parseFloat(cs.borderLeftWidth) >= 3 && parseFloat(cs.borderTopWidth) < 1 && parseFloat(cs.borderRightWidth) < 1 && parseFloat(cs.borderBottomWidth) < 1)
        add("left-border-card", where, label(el));
      if (isCard(el) && !el.matches("details.flap, img")) {
        let a = el.parentElement;
        while (a && a !== document.body && !a.matches("main")) {
          // A flap counts as a card for everything except another flap.
          if (isCard(a) || a.matches("details.flap")) { add("nested-card", where, `${label(el)} in ${label(a)}`); break; }
          a = a.parentElement;
        }
      }
      const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      if (own && !el.closest("svg") && parseFloat(cs.fontSize) < 12) add("font-size", where, `${cs.fontSize} ${label(el)}`);
    });

    // SVG text shrinks with its drawing: font-size is in user units, the reader sees it scaled.
    document.querySelectorAll("main svg text").forEach(t => {
      const svg = t.ownerSVGElement;
      if (!visible(t) || !svg || !t.textContent.trim()) return;
      const vb = svg.viewBox.baseVal, w = svg.getBoundingClientRect().width;
      const scale = vb && vb.width ? w / vb.width : 1;
      const px = parseFloat(getComputedStyle(t).fontSize) * scale;
      if (px < 12) add("svg-font-size", where, `${px.toFixed(1)}px rendered „${t.textContent.trim().slice(0, 30)}“`);
    });
  }
  const seen = new Set();
  return JSON.stringify({ pages, width: innerWidth, findings: findings.filter(f => { const k = f.rule + f.detail; if (seen.has(k)) return false; seen.add(k); return true; }) });
})()
