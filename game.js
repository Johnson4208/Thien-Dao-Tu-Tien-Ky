import { ENERGY_MAX, SAVE_KEY, applyAction, decodeSave, newGame, realmIndex, refreshEnergy, stats } from './engine.js';
import { REGIONS } from './world.js';
import { countdown, cultivation, dialogView, escape, home, icon, inventory, map, num } from './views.js?v=2';
import { createExplorer } from './exploration.js';
import { playBreakthrough } from './scene-art.js';

const main = document.querySelector('#content');
const dialog = document.querySelector('#game-dialog');
const stones = document.querySelector('#stones');
const resume = document.querySelector('.resume-button');
const saveStatus = document.querySelector('#save-status');
const toasts = document.querySelector('#toasts');
const navLinks = [...document.querySelectorAll('[data-nav]')];

const routes = { 'dong-phu': home, 'tu-luyen': cultivation, 'ban-do': map, 'hanh-trang': inventory };
const openingActions = {
  'open-alchemy': 'alchemy', 'open-forge': 'forge', 'open-quests': 'quests',
  'open-journal': 'journal', 'open-region': 'region', 'open-profile': 'profile',
  'open-help': 'help', 'open-battle': 'battle', 'open-breakthrough': 'breakthrough',
  'open-meditation': 'meditation',
};

let storageAvailable = true;
let activeDialog = null;
let restoreFocus = null;
let stopEffect = null;
let renderedEffect = null;
let currentRoute = routeFromHash();
const savedGame = readSaved();
let state = savedGame ?? newGame();
let lastClock = '';
const explorer = createExplorer({ onAction: perform, enabled: () => !dialog.open && !state.battle });

function routeFromHash() {
  const route = location.hash.slice(1);
  return Object.hasOwn(routes, route) ? route : 'dong-phu';
}

function readSaved() {
  try {
    return decodeSave(localStorage.getItem(SAVE_KEY));
  } catch {
    storageAvailable = false;
    return null;
  }
}

function save(next) {
  state = next;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}

function exclusive(task) {
  if (navigator.locks) return navigator.locks.request(SAVE_KEY, task);
  return Promise.resolve(task());
}

function snapshotClock(now) {
  return [
    state.seclusion ? state.seclusion.endAt > now : '',
    state.restReadyAt > now,
    state.nextEnergyAt > now,
  ].join(':');
}

function controlToken(element) {
  return element?.dataset.action ? { action: element.dataset.action, id: element.dataset.id } : null;
}

function findControl(container, token) {
  return token && [...container.querySelectorAll('[data-action]')].find(element => {
    return element.dataset.action === token.action && element.dataset.id === token.id && !element.disabled && !element.hidden;
  });
}

function renderMain(now) {
  const previousFocus = document.activeElement;
  const focused = main.contains(previousFocus) ? controlToken(previousFocus) : null;
  const liveScene = main.querySelector('[data-explorer]');
  const view = document.createElement('template');
  view.innerHTML = routes[currentRoute](state, now);
  const sceneSlot = view.content.querySelector('[data-explorer]');
  if (liveScene && sceneSlot) sceneSlot.replaceWith(liveScene);
  else if (liveScene) explorer.unmount();
  main.dataset.view = currentRoute;
  main.replaceChildren(view.content);
  if (sceneSlot && !liveScene) explorer.mount(sceneSlot);
  if (liveScene?.contains(previousFocus) && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
  else findControl(main, focused)?.focus({ preventScroll: true });
  stones.textContent = num(state.stones);
  resume.hidden = !state.battle;
  saveStatus.classList.toggle('unsaved', !storageAvailable);
  saveStatus.innerHTML = storageAvailable ? '<i></i> Đã lưu trên thiết bị' : '<i></i> Tiến độ chỉ lưu trong phiên này';
  for (const link of navLinks) {
    if (link.dataset.nav === currentRoute) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  lastClock = snapshotClock(now);
}

function renderDialog() {
  if (!activeDialog) return;
  if (activeDialog.type === 'battle' && !state.battle) {
    closeDialog();
    return;
  }
  if (dialog.open && activeDialog.type === 'breakthrough-effect' && renderedEffect === activeDialog.argument) return;
  stopEffect?.();
  stopEffect = null;
  renderedEffect = null;
  const wasOpen = dialog.open;
  const focused = wasOpen ? controlToken(document.activeElement) : null;
  const scrollTop = dialog.scrollTop;
  dialog.className = `modal modal-${activeDialog.type}`;
  dialog.innerHTML = `<div class="modal-inner">
    <button class="icon-button modal-close" type="button" data-action="close-dialog" aria-label="Đóng">${icon('close')}</button>
    ${dialogView(state, activeDialog)}
    <div class="modal-notices" aria-live="polite" aria-atomic="false"></div>
  </div>`;
  if (wasOpen) {
    dialog.scrollTop = scrollTop;
    (findControl(dialog, focused) ?? dialog.querySelector('.modal-close')).focus({ preventScroll: true });
  } else {
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  if (activeDialog.type === 'breakthrough-effect') {
    renderedEffect = activeDialog.argument;
    stopEffect = playBreakthrough(dialog.querySelector('[data-breakthrough-canvas]'), renderedEffect.pose, renderedEffect.major);
  }
}

function rememberDialogFocus() {
  if (!dialog.open) restoreFocus = { element: document.activeElement, token: controlToken(document.activeElement) };
}

function openDialog(type, argument) {
  if (type === 'region' && !REGIONS[argument]) return;
  if (type === 'battle' && !state.battle) return;
  rememberDialogFocus();
  if (activeDialog && activeDialog.type !== type) dialog.scrollTop = 0;
  activeDialog = { type, argument };
  renderDialog();
}

function closeDialog(restore = true) {
  if (!dialog.open) return;
  stopEffect?.();
  stopEffect = null;
  renderedEffect = null;
  dialog.close();
  document.body.classList.remove('modal-open');
  activeDialog = null;
  if (restore) {
    const target = restoreFocus?.element?.isConnected ? restoreFocus.element : findControl(document, restoreFocus?.token);
    (target ?? main).focus({ preventScroll: true });
  }
  restoreFocus = null;
}

function notify(message, kind = 'success') {
  if (!message) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${kind}`;
  toast.innerHTML = `${icon(kind === 'success' ? 'check' : 'alert')}<span>${escape(message)}</span>`;
  const stack = dialog.open ? dialog.querySelector('.modal-notices') : toasts;
  if (stack.childElementCount >= 3) stack.firstElementChild.remove();
  stack.append(toast);
  window.setTimeout(() => toast.remove(), 3300);
}

function dispatch(action, id = '') {
  return exclusive(() => {
    const next = readSaved() ?? state;
    const now = Date.now();
    const energyChanged = refreshEnergy(next, now);
    const prior = action === 'breakthrough' ? { step: next.step, realm: realmIndex(next), stats: stats(next) } : null;
    const result = applyAction(next, action, id, now);
    if (result.ok || energyChanged) save(next);
    else state = next;

    if (result.started) {
      rememberDialogFocus();
      activeDialog = { type: 'battle' };
    }
    if (result.combatResult) activeDialog = { type: 'result', argument: result.combatResult };
    if (result.breakthrough) {
      activeDialog = {
        type: 'breakthrough-effect',
        argument: {
          from: prior.step, to: next.step, major: realmIndex(next) > prior.realm,
          before: prior.stats, after: stats(next), pose: explorer.snapshot(),
        },
      };
      dialog.scrollTop = 0;
    }

    renderMain(now);
    renderDialog();
    if (!result.breakthrough) notify(result.message, result.ok ? 'success' : 'warn');
  });
}

function updateTimers() {
  const now = Date.now();
  if (state.energy < ENERGY_MAX && state.nextEnergyAt && now >= state.nextEnergyAt) {
    void exclusive(() => {
      const next = readSaved() ?? state;
      if (refreshEnergy(next, now)) save(next);
      else state = next;
      renderMain(now);
      if (['region', 'meditation'].includes(activeDialog?.type)) renderDialog();
    });
  } else if (snapshotClock(now) !== lastClock) {
    renderMain(now);
    if (activeDialog?.type === 'meditation') renderDialog();
  }
  for (const timer of document.querySelectorAll('[data-clock]')) timer.textContent = countdown(Number(timer.dataset.until), now);
}

function perform(action, id) {
  if (action === 'close-dialog') {
    closeDialog();
  } else if (action === 'travel-bamboo' || action === 'return-to-garden') {
    closeDialog(false);
    explorer.travel(action === 'travel-bamboo' ? 'bamboo' : 'garden');
    if (currentRoute !== 'dong-phu') location.hash = 'dong-phu';
    else explorer.focus();
  } else if (Object.hasOwn(openingActions, action)) {
    openDialog(openingActions[action], id === undefined ? undefined : Number(id));
  } else {
    void dispatch(action, id);
  }
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action], [data-close-route]');
  if (!target) return;
  if (target.hasAttribute('data-close-route')) {
    closeDialog(false);
    if (target.hash === location.hash || (target.hash === '#dong-phu' && !location.hash)) main.focus({ preventScroll: true });
    return;
  }
  if (!target.disabled) perform(target.dataset.action, target.dataset.id);
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'rename-form') return;
  event.preventDefault();
  const name = new FormData(event.target).get('name');
  void dispatch('rename', String(name ?? ''));
});

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView({ block: 'start' });
});

dialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeDialog();
});

dialog.addEventListener('click', event => {
  if (event.target === dialog) closeDialog();
});

window.addEventListener('hashchange', () => {
  const nextRoute = routeFromHash();
  if (nextRoute === currentRoute) return;
  closeDialog(false);
  currentRoute = nextRoute;
  renderMain(Date.now());
  window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
});

window.addEventListener('storage', event => {
  if (event.key !== SAVE_KEY) return;
  const next = decodeSave(event.newValue);
  if (!next) return;
  state = next;
  renderMain(Date.now());
  if (activeDialog?.type !== 'profile') renderDialog();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateTimers();
});

const now = Date.now();
if (refreshEnergy(state, now) || !savedGame) save(state);
renderMain(now);
if (state.battle) openDialog('battle');
window.setInterval(updateTimers, 1000);
