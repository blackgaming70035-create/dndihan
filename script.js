const PERSONAL_PASSWORD = "18.03.2023"; // Client-side gate only. Not secure authentication.

const tabs = [...document.querySelectorAll('.tab')];
const professional = document.getElementById('professional');
const personal = document.getElementById('personal');
const personalContent = document.getElementById('personal-content');
const partnerContent = document.getElementById('partner-content');
const partnerTab = document.querySelector('[data-tab="partner"]');
const indicator = document.querySelector('.tab-indicator');
const form = document.getElementById('unlock-form');
const passwordInput = document.getElementById('password');
const message = document.getElementById('unlock-message');
const lockAgain = document.getElementById('lock-again');
const year = document.getElementById('year');

let currentTab = 'professional';
let unlocked = false;
let isAnimating = false;
const tabScrollPositions = {
  professional: 0,
  personal: 0,
  partner: 0
};
if (partnerTab) partnerTab.hidden = true;

function updateIndicator(activeButton) {
  if (!activeButton || !indicator) return;
  const tabBar = document.querySelector('.tabs');
  if (!tabBar) return;
  const barRect = tabBar.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  indicator.style.width = `${buttonRect.width}px`;
  indicator.style.transform = `translateX(${buttonRect.left - barRect.left}px)`;
}

function scrollActiveTabIntoView(activeButton) {
  if (!activeButton) return;
  const tabBar = document.querySelector('.tabs');
  if (!tabBar) return;
  requestAnimationFrame(() => {
    const maxScroll = Math.max(0, tabBar.scrollWidth - tabBar.clientWidth);
    let targetLeft = activeButton.offsetLeft - (tabBar.clientWidth - activeButton.offsetWidth) / 2;
    targetLeft = Math.max(0, Math.min(targetLeft, maxScroll));
    tabBar.scrollTo({ left: targetLeft, behavior: 'smooth' });
    requestAnimationFrame(() => updateIndicator(activeButton));
  });
}

function saveCurrentTabScroll() {
  tabScrollPositions[currentTab] = window.scrollY || window.pageYOffset || 0;
}

function restoreTabScroll(tabName) {
  const y = Number.isFinite(tabScrollPositions[tabName]) ? tabScrollPositions[tabName] : 0;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }));
  });
}

let revealObserver = null;

function revealElements(root) {
  const items = [...root.querySelectorAll('.reveal')];
  const nestedSelectors = '.service-list article, .timeline-item, .project-card, .creator-card, .personal-card, .bio-grid > div, .skill-wrap span, .contact-links > *, .partner-signal, .partner-section, .journey-node, .encounter-timeline article, .dynamic-grid article, .partner-footer-card';
  root.querySelectorAll(nestedSelectors).forEach((el) => el.classList.add('reveal-item'));
  const nested = [...root.querySelectorAll('.reveal-item')];
  const targets = [...new Set([...items, ...nested])];

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('visible'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.revealDelay || 0);
        window.setTimeout(() => el.classList.add('visible'), delay);
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  }

  targets.forEach((el, index) => {
    el.classList.remove('visible');
    el.classList.add('reveal-pre');
    el.dataset.revealDelay = Math.min(index * 65, 520);
    revealObserver.observe(el);
  });
}

function hideSection(section) {
  section.classList.add('is-exiting');
  return new Promise(resolve => setTimeout(() => {
    section.hidden = true;
    section.classList.remove('is-exiting');
    resolve();
  }, 380));
}

function showSection(section) {
  section.hidden = false;
  section.classList.add('is-exiting');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => section.classList.remove('is-exiting'));
  });
  revealElements(section);
}

async function switchTab(target) {
  if (isAnimating || target === currentTab) return;
  if (target === 'partner' && !unlocked) return;
  isAnimating = true;

  saveCurrentTabScroll();

  const currentSection = currentTab === 'professional'
    ? professional
    : currentTab === 'personal'
      ? (unlocked ? personalContent : personal)
      : partnerContent;

  const targetSection = target === 'professional'
    ? professional
    : target === 'personal'
      ? (unlocked ? personalContent : personal)
      : partnerContent;

  tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === target));
  const activeTabButton = tabs.find(tab => tab.dataset.tab === target);
  updateIndicator(activeTabButton);
  scrollActiveTabIntoView(activeTabButton);

  if (currentSection && currentSection !== targetSection && !currentSection.hidden) {
    await hideSection(currentSection);
  }

  if (targetSection) showSection(targetSection);

  currentTab = target;
  isAnimating = false;
  restoreTabScroll(target);

  if (target === 'personal' && !unlocked) {
    setTimeout(() => passwordInput.focus(), 350);
  }
}

tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));

form.addEventListener('submit', event => {
  event.preventDefault();
  const entered = passwordInput.value;
  if (entered === PERSONAL_PASSWORD) {
    unlocked = true;
    if (partnerTab) partnerTab.hidden = false;
    message.textContent = '';
    passwordInput.value = '';
    hideSection(personal).then(() => {
      tabScrollPositions.personal = 0;
      showSection(personalContent);
      currentTab = 'personal';
      const activePersonalTab = document.querySelector('[data-tab="personal"]');
      tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === 'personal'));
      updateIndicator(activePersonalTab);
      scrollActiveTabIntoView(activePersonalTab);
      restoreTabScroll('personal');
    });
  } else {
    message.textContent = 'That password did not match.';
    passwordInput.select();
    form.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-3px)' },
      { transform: 'translateX(3px)' },
      { transform: 'translateX(0)' }
    ], { duration: 260, easing: 'ease-out' });
  }
});

function relockPrivateSections() {
  unlocked = false;
  if (partnerTab) partnerTab.hidden = true;
  const activePrivate = currentTab === 'partner' ? partnerContent : personalContent;
  hideSection(activePrivate).then(() => {
    currentTab = 'personal';
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === 'personal'));
    updateIndicator(document.querySelector('[data-tab="personal"]'));
    showSection(personal);
    setTimeout(() => passwordInput.focus(), 350);
  });
}

lockAgain.addEventListener('click', relockPrivateSections);
document.getElementById('lock-partner')?.addEventListener('click', relockPrivateSections);

// Summary index: open the dedicated partner tab instead of jumping to a hidden section.
document.querySelector('[data-open-partner]')?.addEventListener('click', (event) => {
  event.preventDefault();
  if (unlocked) switchTab('partner');
});



/* ===== Selected work: filter + reliable horizontal slider ===== */
(function initWorkSlider(){
  const track = document.getElementById('workTrack');
  const tabs = [...document.querySelectorAll('.work-tab')];
  const next = document.querySelector('[data-work-next]');
  const prev = document.querySelector('[data-work-prev]');
  if (!track) return;

  const cards = [...track.querySelectorAll('.work-card-thumb')];
  let visibleCards = cards;

  function refresh(key='all'){
    tabs.forEach(tab => {
      const active = tab.dataset.workTab === key;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    cards.forEach(card => {
      const types = card.dataset.workType.split(/\s+/);
      card.hidden = key !== 'all' && !types.includes(key);
    });
    visibleCards = cards.filter(card => !card.hidden);
    track.scrollTo({left:0, behavior:'smooth'});
  }

  tabs.forEach(tab => tab.addEventListener('click', () => refresh(tab.dataset.workTab)));

  function move(direction){
    const card = visibleCards.find(card => !card.hidden);
    if (!card) return;
    const distance = card.getBoundingClientRect().width + 12;
    track.scrollBy({left:distance * direction, behavior:'smooth'});
  }
  next?.addEventListener('click', () => move(1));
  prev?.addEventListener('click', () => move(-1));
  refresh('all');
})();

/* ===== Worked-with: seamless always-on marquee ===== */
(function initCreatorMarquee(){
  const viewport = document.getElementById('creatorCarousel');
  const track = document.getElementById('creatorTrack');
  if (!viewport || !track || track.dataset.loopReady === '1') return;

  const items = [...track.children];
  if (!items.length) return;
  items.forEach(item => track.appendChild(item.cloneNode(true)));
  track.dataset.loopReady = '1';

  let position = 0;
  let last = performance.now();
  const speed = 42;

  function frame(now){
    const dt = Math.min(40, now - last);
    last = now;
    if (!document.hidden){
      position += speed * dt / 1000;
      const half = track.scrollWidth / 2;
      if (half > 0 && position >= half) position -= half;
      track.style.transform = `translate3d(${-position}px,0,0)`;
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();

/* ===== Result counters ===== */
(function initCounters(){
  const counters = [...document.querySelectorAll('.count-up[data-target]')];
  if (!counters.length) return;
  const animate = (el) => {
    if (el.dataset.counted === '1') return;
    el.dataset.counted = '1';
    const target = Number(el.dataset.target || 0);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    const duration = 1100;
    function frame(now){
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animate);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.35});
  counters.forEach((counter) => observer.observe(counter));
})();

window.addEventListener('resize', () => { const active = tabs.find(tab => tab.dataset.tab === currentTab); scrollActiveTabIntoView(active); });
year.textContent = new Date().getFullYear();
updateIndicator(tabs[0]);
revealElements(professional);



/* ===== Book reader modal ===== */
(function initBookReader(){
  const open = document.getElementById('open-book-reader');
  const modal = document.getElementById('book-reader-modal');
  if (!open || !modal) return;
  const closeButtons = [...modal.querySelectorAll('[data-close-book-reader]')];
  const close = () => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('book-reader-open');
  };
  open.addEventListener('click', () => {
    modal.hidden = false;
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('book-reader-open');
  });
  closeButtons.forEach(btn => btn.addEventListener('click', close));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });
})();

/* ===== FACEBOOK WORKS: embedded player cards ===== */

