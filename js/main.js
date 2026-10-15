(function () {
  const root = document.documentElement, $ = id => document.getElementById(id);
  const cover = id => 'games/cover-' + id + '.jpg';
  const tagList = s => s.split('|').map(t => t.trim()).filter(Boolean);
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hue = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Theme */
  const meta = document.querySelector('meta[name="theme-color"]');
  const syncMeta = () => meta && meta.setAttribute('content', root.dataset.theme === 'dark' ? '#0d0f17' : '#f3f4f8');
  syncMeta();
  $('theme-toggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncMeta();
  });

  /* Cards */
  const extIcon = '<span class="ext"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg></span>';
  const grid = $('games');
  grid.innerHTML = GAMES.map((g, i) => {
    const inner = '<span class="clip"><span class="ph">' + esc(g.name.replace(/^\W+/, '')[0] || '?') + '</span><img src="' + cover(g.id) + '" alt="" loading="lazy" decoding="async"></span>' +
      (i === 0 ? '<span class="badge">new</span>' : '') + (g.page ? extIcon : '') + '<span class="glare"></span>' +
      '<span class="cap"><b>' + esc(g.name) + '</b><small>' + esc(tagList(g.tags).join(' / ')) + '</small></span>';
    const st = ' style="--h:' + hue(g.id) + '" data-tags="' + esc(g.tags) + '"';
    return g.page
      ? '<a class="card" target="_blank" href="' + g.page + '" aria-label="' + esc(g.name) + '"' + st + '>' + inner + '</a>'
      : '<button class="card" type="button" data-id="' + g.id + '" aria-haspopup="dialog"' + st + '>' + inner + '</button>';
  }).join('');
  grid.querySelectorAll('img').forEach(im => im.addEventListener('error', () => im.remove()));

  /* Reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.style.setProperty('--d', (e.target.dataset.d || 0) + 'ms'); e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  const watch = () => { let k = 0; grid.querySelectorAll('.card:not([hidden]):not(.in)').forEach(c => { c.dataset.d = (k++ % 3) * 90; io.observe(c); }); };
  watch();

  /* Filter chips */
  const tags = [...new Set(GAMES.flatMap(g => tagList(g.tags)))];
  const chips = $('chips');
  chips.innerHTML = ['all', ...tags].map((t, i) => '<button type="button" aria-pressed="' + (i === 0) + '" data-t="' + t + '">' + t + '</button>').join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    chips.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    grid.querySelectorAll('.card').forEach(c => {
      c.hidden = b.dataset.t !== 'all' && !tagList(c.dataset.tags).includes(b.dataset.t);
      c.classList.remove('in');
    });
    requestAnimationFrame(watch);
  });

  /* Marquee: clickable names (page link or popup, same as the covers) */
  // const mq = GAMES.map(g => g.page
  //   ? '<a class="mi" href="' + g.page + '">' + esc(g.name) + '</a>'
  //   : '<button type="button" class="mi" data-id="' + g.id + '">' + esc(g.name) + '</button>').join('');
  // $('marquee').innerHTML = mq + mq.replace(/class="mi"/g, 'class="mi" tabindex="-1" aria-hidden="true"');
  // $('marquee').addEventListener('click', e => {
  //   const b = e.target.closest('button.mi'); if (!b) return;
  //   opener = grid.querySelector('button.card[data-id="' + b.dataset.id + '"]'); openGame(b.dataset.id);
  // });

  /* Hero: rotating scrambled word + counters */
  const rot = $('rot'), words = rot.dataset.words.split('|'); let wi = 0;
  rot.innerHTML = words.map(w => '<span class="rs" aria-hidden="true">' + esc(w) + '</span>').join('') + '<span class="rot-v">' + esc(words[0]) + '</span>';
  const rv = rot.querySelector('.rot-v'), glyphs = '#%&*+=?/<>01';
  /* Layout is always built from the FINAL letters; scrambled glyphs are only painted on top, so nothing can reflow */
  const setText = to => { rv.innerHTML = [...to].map(c => c === ' ' ? ' ' : '<span class="c">' + esc(c) + '</span>').join(''); };
  function scramble(to) {
    setText(to); if (calm) return;
    const cs = [...rv.querySelectorAll('.c')]; let f = 0;
    const t = setInterval(() => {
      cs.forEach((c, i) => { if (i < f / 2) c.classList.remove('s'); else { c.classList.add('s'); c.dataset.g = glyphs[Math.random() * glyphs.length | 0]; } });
      if (++f > to.length * 2) { clearInterval(t); cs.forEach(c => c.classList.remove('s')); }
    }, 32);
  }
  setText(words[0]);
  setInterval(() => { wi = (wi + 1) % words.length; scramble(words[wi]); }, 3200);

  /* Pointer: subtle card tilt, aurora parallax, magnetic icons */
  if (fine && !calm) {
    addEventListener('pointermove', e => {
      root.style.setProperty('--px', (e.clientX / innerWidth - .5).toFixed(3));
      root.style.setProperty('--py', (e.clientY / innerHeight - .5).toFixed(3));
    });
    const flat = c => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); };
    grid.addEventListener('pointermove', e => {
      const c = e.target.closest('.card'); if (!c) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', ((x - .5) * 6).toFixed(2) + 'deg');
      c.style.setProperty('--rx', ((.5 - y) * 5).toFixed(2) + 'deg');
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    });
    grid.addEventListener('pointerout', e => { const c = e.target.closest('.card'); if (c && !c.contains(e.relatedTarget)) flat(c); });
    const nav = document.querySelector('.socials');
    nav.addEventListener('pointermove', e => { const a = e.target.closest('a'); if (!a) return; const r = a.getBoundingClientRect(); a.style.translate = (e.clientX - r.left - r.width / 2) * .35 + 'px ' + (e.clientY - r.top - r.height / 2) * .35 + 'px'; });
    nav.addEventListener('pointerout', e => { const a = e.target.closest('a'); if (a) a.style.translate = ''; });
  }

  /* Scroll progress */
  const bar = $('progress');
  const prog = () => bar.style.transform = 'scaleX(' + (scrollY / Math.max(1, root.scrollHeight - innerHeight)) + ')';
  addEventListener('scroll', prog, { passive: true }); prog();

  /* Popup */
  const dlg = $('popup'); let opener = null;
  function openGame(id, fromHash) {
    const g = GAMES.find(x => x.id === id && !x.page); if (!g) return;
    $('popup-shot').src = cover(g.id);
    $('popup-media').style.setProperty('--shot', 'url("' + new URL(cover(g.id), document.baseURI).href + '")');
    $('popup-shot').alt = g.name + ' screenshot';
    $('popup-title').textContent = g.name; $('popup-desc').textContent = g.desc;
    $('popup-tags').innerHTML = tagList(g.tags).map(t => '<span>' + esc(t) + '</span>').join('');
    const dl = $('popup-dl'); dl.hidden = !g.download; if (g.download) dl.href = g.download;
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0; document.body.classList.add('locked');
    if (!fromHash) history.replaceState(null, '', '#' + g.id);
  }
  grid.addEventListener('click', e => { const b = e.target.closest('button.card'); if (b) { opener = b; openGame(b.dataset.id); } });
  dlg.querySelector('.popup-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { document.body.classList.remove('locked'); history.replaceState(null, '', location.pathname + location.search); if (opener) opener.focus({ preventScroll: true }); });
  const fromHash = () => { const id = location.hash.slice(1); if (id) openGame(id, true); };
  addEventListener('hashchange', fromHash); fromHash();

  $('year').textContent = new Date().getFullYear();
})();
