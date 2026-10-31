/* FONTE DE SABER — interacções (sem dependências).
   Cada bloco está isolado numa IIFE para poder ser colado num bloco HTML do WordPress em separado. */
document.documentElement.classList.add('js');

/* Header: fundo sólido ao fazer scroll + MobileMenu + dropdown "Cursos" */
(function () {
  var header = document.querySelector('[data-header]');
  if (!header) return;

  var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var toggle = header.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');
  var setMenu = function (open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.hidden = !open;
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
  };
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1120) setMenu(false); });
  }

  var drop = header.querySelector('.nav__drop-toggle');
  if (drop) {
    var list = document.getElementById(drop.getAttribute('aria-controls'));
    var setDrop = function (open) { drop.setAttribute('aria-expanded', String(open)); list.classList.toggle('is-open', open); };
    drop.addEventListener('click', function () { setDrop(drop.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav__item--drop')) setDrop(false); });
    drop.parentElement.addEventListener('focusout', function (e) { if (!drop.parentElement.contains(e.relatedTarget)) setDrop(false); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    if (drop && drop.getAttribute('aria-expanded') === 'true') { drop.setAttribute('aria-expanded', 'false'); document.getElementById('menu-cursos').classList.remove('is-open'); drop.focus(); }
  });
})();

/* Animações de entrada ao fazer scroll
   - variante automática por tipo de elemento (data-anim): imagens com "clip", colunas laterais com "left"/"right", cartões com "zoom"
   - escalonamento automático (--d) entre irmãos que não tenham atraso definido no HTML
   - no fim da entrada retira .reveal para o elemento voltar às suas próprias transições (hover) */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var variants = [
    ['.media, .intro__visual, .map', 'clip'],
    ['.form-aside, .location__card, .req__intro', 'left'],
    ['.form-card', 'right'],
    ['.edu-card, .course-card, .why-card, .req-card, .contact-card, .health-card, .level-card, .paths__node, .periods, .gallery__preview', 'zoom']
  ];
  items.forEach(function (el) {
    if (el.hasAttribute('data-anim')) return;
    for (var i = 0; i < variants.length; i++) { if (el.matches(variants[i][0])) { el.setAttribute('data-anim', variants[i][1]); return; } }
    el.setAttribute('data-anim', 'up');
  });
  // irmãos .reveal sem --d no HTML entram um a seguir ao outro
  var groups = new Map();
  items.forEach(function (el) {
    if (el.style.getPropertyValue('--d')) return;
    var p = el.parentElement, list = groups.get(p) || [];
    list.push(el); groups.set(p, list);
  });
  groups.forEach(function (list) {
    if (list.length < 2) return;
    list.forEach(function (el, i) { el.style.setProperty('--d', Math.min(i * 0.09, 0.45).toFixed(2) + 's'); });
  });

  var finish = function (el) {
    var delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
    var dur = el.getAttribute('data-anim') === 'clip' ? 1700 : 1200;
    setTimeout(function () { el.classList.remove('reveal', 'is-visible'); el.removeAttribute('data-anim'); }, (reduce ? 800 : dur) + delay * 1000);
  };
  var lines = document.querySelectorAll('.timeline, .paths__line');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); finish(el); });
    lines.forEach(function (el) { el.classList.add('is-drawn'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      if (el.classList.contains('reveal')) { el.classList.add('is-visible'); finish(el); } else { el.classList.add('is-drawn'); }
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (el) { io.observe(el); });
  lines.forEach(function (el) { io.observe(el); });
})();

/* Barra de progresso de leitura */
(function () {
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  var update = function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
    ticking = false;
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Transição entre páginas: os browsers com View Transitions tratam disso no CSS;
   nos restantes, fade-out rápido antes de seguir o link interno */
(function () {
  if ('CSSViewTransitionRule' in window) return;
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.origin !== location.origin) return;
    if (a.pathname === location.pathname && a.hash) return; // âncoras na mesma página
    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(function () { location.href = a.href; }, 240);
  });
  // ao voltar com o botão "anterior" (bfcache) a página não pode ficar invisível
  window.addEventListener('pageshow', function (e) { if (e.persisted) document.body.classList.remove('is-leaving'); });
})();

/* Gallery: filtros + Lightbox */
(function () {
  var gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;
  var items = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__item'));

  // Filtros
  var filters = document.querySelectorAll('.gallery__filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      items.forEach(function (it) { it.hidden = cat !== 'todos' && it.getAttribute('data-cat') !== cat; });
    });
  });

  // Lightbox
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Visualizador de fotografias');
  box.innerHTML =
    '<span class="lightbox__count" aria-live="polite"></span>' +
    '<figure class="lightbox__figure"><img class="lightbox__img" alt=""><figcaption class="lightbox__caption"></figcaption></figure>' +
    '<button class="lightbox__btn lightbox__close" type="button" aria-label="Fechar"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>' +
    '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Fotografia anterior"><svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg></button>' +
    '<button class="lightbox__btn lightbox__next" type="button" aria-label="Fotografia seguinte"><svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg></button>';
  document.body.appendChild(box);

  var img = box.querySelector('.lightbox__img');
  var cap = box.querySelector('.lightbox__caption');
  var count = box.querySelector('.lightbox__count');
  var current = 0, lastFocus = null;

  var visible = function () { return items.filter(function (it) { return !it.hidden; }); };
  var show = function (i) {
    var list = visible();
    current = (i + list.length) % list.length;
    var btn = list[current].querySelector('.gallery__btn');
    var thumb = btn.querySelector('img');
    img.src = btn.getAttribute('data-full');
    img.alt = thumb.alt;
    cap.textContent = btn.getAttribute('data-caption') || '';
    count.textContent = (current + 1) + ' / ' + list.length;
  };
  var open = function (item) {
    lastFocus = document.activeElement;
    show(visible().indexOf(item));
    box.hidden = false;
    document.body.classList.add('no-scroll');
    box.querySelector('.lightbox__close').focus();
  };
  var close = function () {
    box.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  };

  gallery.addEventListener('click', function (e) {
    var btn = e.target.closest('.gallery__btn');
    if (btn) open(btn.closest('.gallery__item'));
  });
  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
  box.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'Tab') { // manter o foco dentro do lightbox
      var f = box.querySelectorAll('button');
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();

/* Formulário de pré-inscrição (apenas frontend).
   WordPress: substituir por Contact Form 7 / WPForms / Elementor Form, mantendo os mesmos campos. */
(function () {
  var form = document.querySelector('[data-preinscricao]');
  if (!form) return;
  var success = document.querySelector('[data-preinscricao-ok]');
  var waBtn = document.querySelector('[data-preinscricao-wa]');

  var setError = function (field, msg) {
    var input = form.elements[field];
    var err = form.querySelector('[data-error="' + field + '"]');
    if (input && input.setAttribute) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = {
      nome: form.elements.nome.value.trim(),
      telefone: form.elements.telefone.value.trim(),
      whatsapp: form.elements.whatsapp.value.trim(),
      encarregado: form.elements.encarregado.value.trim(),
      curso: form.elements.curso.value,
      periodo: (form.querySelector('input[name="periodo"]:checked') || {}).value || '',
      mensagem: form.elements.mensagem.value.trim()
    };
    var ok = true;
    var phoneOk = function (v) { return v.replace(/\D/g, '').length >= 9; };
    setError('nome', d.nome.length < 3 ? 'Indique o nome completo.' : ''); if (d.nome.length < 3) ok = false;
    setError('telefone', !phoneOk(d.telefone) ? 'Indique um número de telefone válido.' : ''); if (!phoneOk(d.telefone)) ok = false;
    setError('curso', !d.curso ? 'Escolha a classe ou o curso pretendido.' : ''); if (!d.curso) ok = false;
    var perr = form.querySelector('[data-error="periodo"]');
    if (perr) perr.textContent = d.periodo ? '' : 'Escolha o período pretendido.';
    if (!d.periodo) ok = false;
    if (!ok) { var first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }

    // Mensagem pronta para enviar pelo WhatsApp oficial (não há envio automático para servidor)
    if (waBtn) {
      var txt = 'Olá, gostaria de fazer a pré-inscrição na FONTE DE SABER.\n\n' +
        'Nome: ' + d.nome + '\n' +
        'Telefone: ' + d.telefone + '\n' +
        (d.whatsapp ? 'WhatsApp: ' + d.whatsapp + '\n' : '') +
        (d.encarregado ? 'Encarregado de educação: ' + d.encarregado + '\n' : '') +
        'Classe / Curso: ' + d.curso + '\n' +
        'Período: ' + d.periodo +
        (d.mensagem ? '\n\nMensagem: ' + d.mensagem : '');
      waBtn.href = 'https://wa.me/244945265853?text=' + encodeURIComponent(txt);
    }
    form.hidden = true;
    success.hidden = false;
    success.setAttribute('tabindex', '-1');
    success.focus();
  });

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target.name, '');
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'periodo') { var p = form.querySelector('[data-error="periodo"]'); if (p) p.textContent = ''; }
  });

  var again = document.querySelector('[data-preinscricao-reset]');
  if (again) again.addEventListener('click', function () {
    form.reset(); form.hidden = false; success.hidden = true; form.elements.nome.focus();
  });
})();
