// Client-side DOM behavior:
//  - page-wide scroll reveals: one IntersectionObserver adds .is-visible per
//    element as it enters view (works for both the window scroller on mobile
//    and the deck's internal scroller on lg+), with per-batch stagger delays
//  - right section deck: active-section tracking for the sliding nav indicator
//  - snappy eased programmatic scrolling for nav anchors and back-to-top
//  - mouse-reactive background glow, terminal typewriter, CV preview modal
// Motion-heavy effects are gated behind prefers-reduced-motion; the modal,
// language switching, and scrolling itself always work.
import { THEMES, THEME_NAMES, THEME_STORAGE_KEY } from '../lib/themes';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Gates the hidden pre-reveal states in global.css. Base.astro also adds this
// class inline pre-paint so hidden states never flash before this module runs.
document.documentElement.classList.add('js');

// --- Theme switcher ---------------------------------------------------------
// The palette itself is chosen pre-paint by the inline script in Base.astro,
// which owns the random-on-first-visit draw and the persisted choice. This only
// exposes that choice, keeps the listbox state honest, and re-syncs the
// browser-chrome colour. Switching is one attribute write, so it needs no
// reload and no motion gate.
const themeToggle = document.querySelector<HTMLElement>('[data-theme-toggle]');
const themeMenu = document.querySelector<HTMLElement>('[data-theme-menu]');
const themeCurrents = Array.from(document.querySelectorAll<HTMLElement>('[data-theme-current]'));
const themeOptions = Array.from(document.querySelectorAll<HTMLElement>('[data-theme-option]'));

function syncThemeChrome(name: string): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--t-bg').trim();
  if (meta && bg) meta.setAttribute('content', bg);
  const label = THEMES.find((theme) => theme.name === name)?.label ?? name;
  // One span per locale: the i18n script decides which one is visible.
  for (const el of themeCurrents) el.textContent = label;
}

function setTheme(name: string, persist = true): void {
  if (!THEME_NAMES.includes(name)) return;
  const entry = THEMES.find((theme) => theme.name === name);
  document.documentElement.dataset.theme = name;
  // Mirrors the pre-paint script: CSS uses this to pick light/dark asset variants.
  document.documentElement.dataset.mode = entry?.mode ?? 'dark';
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, name);
    } catch {
      /* private mode: the palette still applies for this visit */
    }
  }
  for (const option of themeOptions) {
    option.setAttribute('aria-selected', String(option.dataset.themeOption === name));
  }
  syncThemeChrome(name);
}

if (themeOptions.length > 0) {
  // The menu is `fixed` so the identity column's overflow clip cannot cut it
  // off, which means this code owns its coordinates: right-aligned to the
  // toggle, nudged inside the viewport, and re-anchored on resize or scroll.
  const positionThemeMenu = (): void => {
    if (!themeMenu || !themeToggle || themeMenu.hidden) return;
    const rect = themeToggle.getBoundingClientRect();
    const gap = 6;
    const margin = 8;
    const width = themeMenu.offsetWidth || 240;
    const height = themeMenu.offsetHeight || 320;
    const maxLeft = window.innerWidth - width - margin;
    themeMenu.style.left = `${Math.max(margin, Math.min(rect.right - width, maxLeft))}px`;
    // Prefer below the trigger, but flip above when it would not fit and clamp
    // to the viewport. Below lg the cluster is fixed at the bottom-right, so
    // "below" would open the panel off the bottom of the screen.
    const below = rect.bottom + gap;
    const above = rect.top - height - gap;
    const top = below + height <= window.innerHeight - margin ? below : above;
    const maxTop = window.innerHeight - height - margin;
    themeMenu.style.top = `${Math.max(margin, Math.min(top, maxTop))}px`;
  };

  const setMenuOpen = (open: boolean): void => {
    if (!themeMenu || !themeToggle) return;
    themeMenu.hidden = !open;
    themeToggle.setAttribute('aria-expanded', String(open));
    if (!open) return;
    positionThemeMenu();
    // Twenty-two rows do not fit in the panel, so open it showing the palette
    // that is actually active instead of always starting at the top.
    themeOptions
      .find((option) => option.getAttribute('aria-selected') === 'true')
      ?.scrollIntoView({ block: 'nearest' });
  };

  themeToggle?.addEventListener('click', () => setMenuOpen(Boolean(themeMenu?.hidden)));

  window.addEventListener('resize', positionThemeMenu);
  // The deck scrolls internally, so a fixed menu has to follow its anchor.
  window.addEventListener('scroll', positionThemeMenu, { passive: true, capture: true });

  for (const option of themeOptions) {
    option.addEventListener('click', () => {
      setTheme(option.dataset.themeOption ?? '');
      setMenuOpen(false);
      themeToggle?.focus();
    });
  }

  themeMenu?.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const index = themeOptions.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    themeOptions[(index + step + themeOptions.length) % themeOptions.length]?.focus();
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && themeMenu && !themeMenu.hidden) {
      setMenuOpen(false);
      themeToggle?.focus();
    }
  });

  document.addEventListener('click', (event: MouseEvent) => {
    if (!themeMenu || themeMenu.hidden) return;
    const node = event.target as Node;
    if (themeMenu.contains(node) || themeToggle?.contains(node)) return;
    setMenuOpen(false);
  });

  // The inline head script already set data-theme; this only mirrors it into
  // the listbox and the meta tag without re-persisting it.
  setTheme(document.documentElement.dataset.theme ?? 'tokyo-night', false);
}

const deckSections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));

// --- Scroll reveals (page-wide, per element) --------------------------------
const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

if (!reducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      const revealed = entries.filter((entry) => entry.isIntersecting);
      if (revealed.length === 0) return;
      // Elements entering together cascade in reading order: sort each batch
      // top-to-bottom (DOM order as tiebreak) and stagger from there.
      revealed.sort((a, b) => {
        const delta = a.boundingClientRect.top - b.boundingClientRect.top;
        if (delta !== 0) return delta;
        return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
      revealed.forEach((entry, i) => {
        const el = entry.target as HTMLElement;
        el.style.setProperty('--reveal-delay', `${Math.min(i * 70, 320)}ms`);
        el.classList.add('is-visible');
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  // Reduced motion or no IO support: everything visible immediately.
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// --- Section deck: active section + nav indicator ---------------------------
const nav = document.querySelector<HTMLElement>('[data-split-nav]');
const navItems = nav ? Array.from(nav.querySelectorAll<HTMLElement>('[data-nav-item]')) : [];
const indicator = nav?.querySelector<HTMLElement>('[data-nav-indicator]');

function getDeckScroller(): HTMLElement | null {
  const el = document.querySelector<HTMLElement>('[data-scroll-root]');
  return el && el.scrollHeight > el.clientHeight + 1 ? el : null;
}

function positionIndicator(item: HTMLElement) {
  if (!indicator) return;
  indicator.style.height = `${item.offsetHeight}px`;
  indicator.style.transform = `translateY(${item.offsetTop}px)`;
}

function moveIndicatorToActive() {
  if (!indicator) return;
  const target = navItems.find((item) => item.dataset.navItem === activeId);
  indicator.style.opacity = target ? '1' : '0';
  if (target) positionIndicator(target);
}

let activeId: string | null = null;

function setActiveSection(section: HTMLElement | null) {
  const id = section?.id ?? null;
  if (id === activeId) return;
  activeId = id;
  for (const s of deckSections) s.classList.toggle('is-active', s === section);
  for (const item of navItems) item.classList.toggle('is-active', item.dataset.navItem === id);
  moveIndicatorToActive();
}

if (deckSections.length > 0) {
  // The active section is the last one whose top is above a band at ~25% of the
  // scrolling viewport. A scroll-position computation (instead of a ratio-based
  // IntersectionObserver) is deterministic even for sections taller than the
  // viewport, where a fixed intersection threshold could never be crossed.
  function computeActive() {
    const scroller = getDeckScroller();
    const isWindow = scroller === null;
    const containerTop = isWindow ? 0 : scroller.getBoundingClientRect().top;
    const containerHeight = isWindow ? window.innerHeight : scroller.clientHeight;
    const bandTop = containerHeight * 0.25;

    let current: HTMLElement | null = null;
    for (const section of deckSections) {
      // Viewport-relative position of the section top within the scroller.
      // rect.top alone is scroll-dependent; subtracting containerTop makes the
      // comparison stable as the deck scrolls.
      const sectionTop = section.getBoundingClientRect().top - containerTop;
      if (sectionTop <= bandTop) current = section;
    }
    setActiveSection(current ?? deckSections[0]);
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      computeActive();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  document.querySelector<HTMLElement>('[data-scroll-root]')?.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  computeActive();
}

// Nav hover micro-interaction: the indicator previews the hovered item and
// returns to the active section on leave.
if (nav) {
  for (const item of navItems) {
    item.addEventListener('pointerenter', () => positionIndicator(item));
  }
  nav.addEventListener('pointerleave', () => moveIndicatorToActive());
}

// --- Programmatic scrolling --------------------------------------------------
// Native smooth scrollIntoView takes long, browser-controlled paths that made
// the deck feel sluggish. These eased rAF scrolls run ~500ms with an out-expo
// curve: quick departure, gentle landing.
const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
let scrollAnimationFrame: number | null = null;

function animateScrollTo(targetTop: number, duration = 480): void {
  const deck = getDeckScroller();
  const from = deck ? deck.scrollTop : window.scrollY;
  const max = deck
    ? deck.scrollHeight - deck.clientHeight
    : document.documentElement.scrollHeight - window.innerHeight;
  const to = Math.max(0, Math.min(targetTop, max));

  if (scrollAnimationFrame !== null) cancelAnimationFrame(scrollAnimationFrame);
  if (reducedMotion || duration <= 0) {
    if (deck) deck.scrollTop = to;
    else window.scrollTo(0, to);
    return;
  }

  const start = performance.now();
  const step = (now: number): void => {
    const progress = Math.min(1, (now - start) / duration);
    const value = from + (to - from) * easeOutExpo(progress);
    if (deck) deck.scrollTop = value;
    else window.scrollTo(0, value);
    scrollAnimationFrame = progress < 1 ? requestAnimationFrame(step) : null;
  };
  scrollAnimationFrame = requestAnimationFrame(step);
}

function scrollToSection(target: HTMLElement): void {
  const deck = getDeckScroller();
  // Target position inside whichever container actually scrolls.
  const top =
    deck && target.closest('[data-scroll-root]')
      ? target.getBoundingClientRect().top - deck.getBoundingClientRect().top + deck.scrollTop
      : target.getBoundingClientRect().top + window.scrollY;
  animateScrollTo(top);
}

// --- Command palette (Ctrl/Cmd+K) --------------------------------------------
// Keyboard launcher for sections and quick actions. Seven rows fit on one screen,
// so there is no text field and nothing is filtered: the arrows move the selection
// and Enter runs it. The hidden state is driven by the [hidden] attribute so the
// global i18n toggle keeps working.
const cmdkRoot = document.querySelector<HTMLElement>('[data-cmdk]');
let paletteOpen = false;

if (cmdkRoot) {
  const panel = cmdkRoot.querySelector<HTMLElement>('[data-cmdk-panel]');
  const listEl = cmdkRoot.querySelector<HTMLElement>('[data-cmdk-list]');
  const allItems = () => Array.from(listEl?.querySelectorAll<HTMLElement>('[data-cmdk-item]') ?? []);

  const setSelected = (target: HTMLElement | null) => {
    for (const item of allItems()) {
      const on = item === target;
      item.classList.toggle('is-selected', on);
      if (on) {
        item.setAttribute('aria-selected', 'true');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.removeAttribute('aria-selected');
      }
    }
  };

  function closePalette() {
    paletteOpen = false;
    if (cmdkRoot) cmdkRoot.hidden = true;
  }

  function openPalette() {
    paletteOpen = true;
    if (cmdkRoot) cmdkRoot.hidden = false;
    // Focus goes to the panel, which is what receives the arrow keys. A text
    // input here also handed the palette to the browser's password manager on
    // every open, for a filter seven fixed rows never needed.
    setSelected(allItems()[0] ?? null);
    panel?.focus();
  }

  const executeItem = (item: HTMLElement) => {
    closePalette();
    if (item instanceof HTMLAnchorElement) {
      // Native navigation only. Calling item.click() here would re-enter through
      // the delegated handler below and loop, and assigning item.href would be an
      // unvalidated redirect. The delegation skips anchors, so the browser has
      // already followed the link by the time this runs.
      return;
    }
    const gotoId = item.getAttribute('data-cmdk-goto');
    if (gotoId) {
      const target = document.getElementById(gotoId);
      if (target) scrollToSection(target);
      return;
    }
    const action = item.getAttribute('data-cmdk-action');
    if (action === 'top') {
      animateScrollTo(0, 420);
    } else if (action === 'cv') {
      // Open the CV preview of whichever locale copy is currently visible.
      const openButton = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-cv-open]')).find(
        (button) => button.closest<HTMLElement>('[data-locale]')?.hidden === false,
      );
      openButton?.click();
    } else if (action === 'contact') {
      // Copy in-page on purpose. A `mailto:` here hands the click to the OS and
      // launches whatever the machine has registered for mail, which is not
      // something a web palette should do. The address stays reachable from the
      // hero's mail icon, where asking for a mail client is the obvious intent.
      const email = item.dataset.cmdkEmail ?? '';
      const note = item.querySelector<HTMLElement>('[data-cmdk-contact-note]');
      if (!email) return;
      const announce = (text: string): void => {
        if (!note) return;
        note.textContent = text;
        window.setTimeout(() => {
          note.textContent = '';
        }, 1800);
      };
      if (navigator.clipboard?.writeText) {
        // Confirm first, correct later. Waiting on the clipboard promise leaves
        // the visitor with no feedback at all when the write neither resolves
        // nor rejects, which is what happens in a headless or permission-gated
        // context.
        announce('copiado');
        navigator.clipboard.writeText(email).catch(() => announce(email));
      } else {
        announce(email);
      }
    }
  };

  for (const trigger of document.querySelectorAll<HTMLElement>('[data-cmdk-open]')) {
    trigger.addEventListener('click', openPalette);
  }

  // Rows are activated by click as well as by Enter. Without this delegation a
  // mouse click on a palette row did nothing at all: the only rows that reacted
  // were anchors, which followed their own href with no JavaScript involved -
  // which is exactly how the mailto row ended up handing the click to the OS
  // mail client while every other row looked inert.
  listEl?.addEventListener('click', (event: MouseEvent) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-cmdk-item]');
    if (!item) return;
    // Anchors are left alone so the browser navigates them natively; nothing
    // here ever assigns a URL, so there is no redirect to validate.
    if (item instanceof HTMLAnchorElement) return;
    event.preventDefault();
    executeItem(item);
  });
  cmdkRoot.querySelector('[data-cmdk-close]')?.addEventListener('click', closePalette);

  // Bound to the root, not to a row: keydown bubbles here from the focused panel
  // and from any row a click or Tab may have focused.
  cmdkRoot.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation(); // keep the page-level Escape handler out
      closePalette();
      return;
    }
    const visible = allItems();
    if (visible.length === 0) return;
    const current = visible.findIndex((item) => item.classList.contains('is-selected'));
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected(visible[(Math.max(current, 0) + 1) % visible.length]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected(current <= 0 ? visible[visible.length - 1] : visible[current - 1]);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      executeItem(visible[current] ?? visible[0]);
    }
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (paletteOpen) closePalette();
      else openPalette();
    } else if (event.key === 'Escape' && paletteOpen) {
      closePalette();
    }
  });
}

for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-scroll-to]')) {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('data-scroll-to');
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    scrollToSection(target);
  });
}

for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-scroll-top]')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    animateScrollTo(0, 420);
  });
}

// --- Keyboard section navigation (ArrowUp/ArrowDown/j/k/Home/End) ------------
// The deck reads like slides, so the same keys page through sections with the
// same eased scrolls as the nav. Typing targets and an open CV modal take
// precedence over page shortcuts.
const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (isTypingTarget(event.target)) return;
  if (paletteOpen) return; // the palette owns the keyboard while open
  const key = event.key;
  const down = key === 'ArrowDown' || key === 'j';
  const up = key === 'ArrowUp' || key === 'k';
  const home = key === 'Home';
  const end = key === 'End';
  if (!down && !up && !home && !end) return;

  for (const modal of document.querySelectorAll<HTMLElement>('[data-cv-modal]')) {
    if (!modal.hidden) return; // modal open: it owns the keyboard
  }

  event.preventDefault();

  if (home) {
    animateScrollTo(0, 420);
    return;
  }
  if (end) {
    animateScrollTo(document.documentElement.scrollHeight, 480);
    return;
  }

  const currentIndex = deckSections.findIndex((section) => section.id === activeId);
  const targetSection = down
    ? currentIndex < 0
      ? deckSections[0]
      : deckSections[Math.min(deckSections.length - 1, currentIndex + 1)]
    : currentIndex <= 0
      ? deckSections[0]
      : deckSections[currentIndex - 1];
  if (!targetSection) return;
  scrollToSection(targetSection);
});

// --- Terminal typewriter: types a Python print in a loop --------------------
// Both locale copies stay in sync, so a language toggle always shows the
// already-typed result.
const typed = 'print("I love cats")';
const termEls = Array.from(document.querySelectorAll<HTMLElement>('.terminal-text'));
if (termEls.length > 0) {
  if (reducedMotion) {
    termEls.forEach((el) => {
      el.textContent = typed;
    });
  } else {
    let index = 0;
    let deleting = false;
    const typeDelay = 85;
    const holdDelay = 2400;
    const paint = () => {
      termEls.forEach((el) => {
        el.textContent = typed.slice(0, index);
      });
    };
    const step = () => {
      if (deleting) {
        index -= 1;
        paint();
        if (index === 0) deleting = false;
        window.setTimeout(step, typeDelay / 2);
      } else if (index < typed.length) {
        index += 1;
        paint();
        window.setTimeout(step, typeDelay);
      } else {
        window.setTimeout(() => {
          deleting = true;
          step();
        }, holdDelay);
      }
    };
    step();
  }
}

// --- Mouse-reactive background glow (lerped follow) ---
// Two brand-tinted layers: a small bright core that tracks the pointer closely
// plus a wide soft halo that breathes with it. The rAF loop only runs while
// the pointer is actually moving and parks itself once the glow settles, so
// an idle page costs zero frames. Expressed against --color-primary so the
// glow follows the active palette instead of pinning Linear's lavender.
if (!reducedMotion) {
  const glow = document.querySelector<HTMLElement>('.mouse-glow');
  if (glow) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let rafId: number | null = null;
    const render = () => {
      x += (targetX - x) * 0.09;
      y += (targetY - y) * 0.09;
      const px = x.toFixed(1);
      const py = y.toFixed(1);
      glow.style.background = `radial-gradient(200px circle at ${px}px ${py}px, color-mix(in oklch, var(--color-primary) 10%, transparent), transparent 60%), radial-gradient(640px circle at ${px}px ${py}px, color-mix(in oklch, var(--color-primary) 7%, transparent), transparent 70%)`;
      rafId =
        Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5
          ? requestAnimationFrame(render)
          : null;
    };
    window.addEventListener(
      'pointermove',
      (event: PointerEvent) => {
        targetX = event.clientX;
        targetY = event.clientY;
        if (rafId === null) rafId = requestAnimationFrame(render);
      },
      { passive: true },
    );
  }
}

// --- Project pagination ------------------------------------------------------
// One static frame per section, pages swapped behind it. The scope is the pages
// wrapper's own parent, not the document: both locales render a full set of
// pages and their own arrows, so a document-wide query counted eight pages and
// left the counter reading "01 / 04" while disabling the arrow two pages late.
for (const group of document.querySelectorAll<HTMLElement>('[data-project-pages]')) {
  const pages = Array.from(group.querySelectorAll<HTMLElement>('[data-project-page]'));
  if (pages.length < 2) continue;

  const scope = group.parentElement ?? group;
  const prevButtons = Array.from(scope.querySelectorAll<HTMLButtonElement>('[data-project-prev]'));
  const nextButtons = Array.from(scope.querySelectorAll<HTMLButtonElement>('[data-project-next]'));
  const counters = Array.from(scope.querySelectorAll<HTMLElement>('[data-project-counter]'));
  const lastPage = pages.length - 1;
  const pad = (value: number): string => String(value).padStart(2, '0');
  let page = 0;

  const show = (next: number): void => {
    page = Math.max(0, Math.min(lastPage, next));
    for (const element of pages) {
      const index = Number(element.dataset.projectPage ?? '0');
      element.dataset.active = String(index === page);
      element.setAttribute('aria-hidden', String(index !== page));
    }
    for (const button of prevButtons) button.disabled = page === 0;
    for (const button of nextButtons) button.disabled = page === lastPage;
    for (const counter of counters) {
      counter.textContent = `${pad(page + 1)} / ${pad(pages.length)}`;
    }
  };

  for (const button of prevButtons) button.addEventListener('click', () => show(page - 1));
  for (const button of nextButtons) button.addEventListener('click', () => show(page + 1));
  show(0);
}

// --- Card detail modal ------------------------------------------------------
// One modal serves every project and plugin card. Cards are buttons carrying
// their own payload in data attributes, so nothing here hard-codes an entry and
// no modal markup is duplicated per locale.
const cardModal = document.querySelector<HTMLElement>('[data-card-modal]');
if (cardModal) {
  const img = cardModal.querySelector<HTMLImageElement>('[data-card-modal-img]');
  const monogram = cardModal.querySelector<HTMLElement>('[data-card-modal-monogram]');
  const titleEl = cardModal.querySelector<HTMLElement>('[data-card-modal-title]');
  const descEl = cardModal.querySelector<HTMLElement>('[data-card-modal-desc]');
  const stackEl = cardModal.querySelector<HTMLElement>('[data-card-modal-stack]');
  const repoLink = cardModal.querySelector<HTMLAnchorElement>('[data-card-modal-repo]');
  const siteLink = cardModal.querySelector<HTMLAnchorElement>('[data-card-modal-site]');
  const marketplaceLink = cardModal.querySelector<HTMLAnchorElement>(
    '[data-card-modal-marketplace]',
  );
  const starsEl = cardModal.querySelector<HTMLElement>('[data-card-modal-stars]');
  const starsCountEl = cardModal.querySelector<HTMLElement>('[data-card-modal-stars-count]');
  const focusables = (): HTMLElement[] =>
    Array.from(
      cardModal.querySelectorAll<HTMLElement>('a:not([hidden]), button:not([hidden])'),
    );
  let lastFocus: HTMLElement | null = null;

  const closeCardModal = (): void => {
    cardModal.hidden = true;
    lastFocus?.focus();
    lastFocus = null;
  };

  const fill = (card: HTMLElement): void => {
    const mode = card.dataset.cardCoverMode ?? 'none';
    const base = card.dataset.cardCover ?? '';
    // The lockup pair ships in dark and light variants; the palette kind decides
    // which one. Reading it here avoids putting the asset-* classes on this
    // image, which would hide a single-preview cover on a light palette.
    const light = document.documentElement.dataset.mode === 'light';
    const src = mode === 'lockup' ? `${base}/lockup-${light ? 'light' : 'dark'}.png` : base;

    if (img) {
      img.hidden = mode === 'none' || !src;
      if (src) img.src = src;
    }
    if (monogram) {
      monogram.hidden = mode !== 'none';
      monogram.textContent = mode === 'none' ? (card.dataset.cardMonogram ?? '') : '';
    }
    if (titleEl) titleEl.textContent = card.dataset.cardTitle ?? '';
    if (descEl) descEl.textContent = card.dataset.cardDesc ?? '';

    if (stackEl) {
      stackEl.textContent = '';
      for (const tech of (card.dataset.cardMeta ?? '').split(' · ').filter(Boolean)) {
        const li = document.createElement('li');
        li.className = 'tag';
        li.textContent = tech;
        stackEl.append(li);
      }
      stackEl.hidden = stackEl.childElementCount === 0;
    }

    const repo = card.dataset.cardRepo ?? '';
    const site = card.dataset.cardSite ?? '';
    if (repoLink) {
      repoLink.hidden = !repo;
      if (repo) repoLink.href = repo;
    }
    if (siteLink) {
      siteLink.hidden = !site;
      if (site) siteLink.href = site;
    }

    // Plugin cards carry the page of the Omarchy Plugin Marketplace where the
    // plugin is published; project cards leave it empty and the action is gone.
    const marketplace = card.dataset.cardMarketplace ?? '';
    if (marketplaceLink) {
      marketplaceLink.hidden = !marketplace;
      if (marketplace) marketplaceLink.href = marketplace;
    }

    // Star count is build-time data; absent when the repo is missing, private
    // or the fetch failed, in which case the label stays hidden entirely.
    const stars = card.dataset.cardStars ?? '';
    if (starsEl) {
      starsEl.hidden = stars === '';
      if (starsCountEl) starsCountEl.textContent = stars;
    }
  };

  for (const card of document.querySelectorAll<HTMLElement>('[data-card-open]')) {
    card.addEventListener('click', () => {
      lastFocus = card;
      fill(card);
      cardModal.hidden = false;
      focusables()[0]?.focus();
    });
  }

  for (const closer of cardModal.querySelectorAll<HTMLElement>('[data-card-modal-close]')) {
    closer.addEventListener('click', closeCardModal);
  }

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !cardModal.hidden) closeCardModal();
    // Keep focus inside the dialog while it is open.
    if (event.key === 'Tab' && !cardModal.hidden) {
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
}

// --- CV preview modal ---
for (const button of document.querySelectorAll<HTMLElement>('[data-cv-open]')) {
  button.addEventListener('click', () => {
    const locale = button.closest('[data-locale]')?.getAttribute('data-locale');
    const modal = document.querySelector<HTMLElement>(
      `[data-cv-modal][data-cv-locale="${locale}"]`,
    );
    if (!modal) return;
    modal.hidden = false;
  });
}

for (const el of document.querySelectorAll<HTMLElement>('[data-cv-close]')) {
  el.addEventListener('click', () => {
    const modal = el.closest<HTMLElement>('[data-cv-modal]');
    if (modal) modal.hidden = true;
  });
}

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return;
  for (const modal of document.querySelectorAll<HTMLElement>('[data-cv-modal]')) {
    if (!modal.hidden) modal.hidden = true;
  }
});
