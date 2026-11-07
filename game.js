import { ENERGY_MAX, SAVE_KEY, applyAction, decodeSave, newGame, realmIndex, refreshEnergy, refreshTraining, stats } from './engine.js?v=4';
import { DEFAULT_MEDITATION_SPOT, MEDITATION_SPOTS, REGIONS } from './world.js?v=4';
import { countdown, cultivation, dialogView, escape, home, icon, inventory, map, num, syncMeditation } from './views.js?v=4';
import { createExplorer } from './exploration.js?v=4';
import { playBreakthrough, playMeditation } from './scene-art.js?v=4';

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
  'open-market': 'market',
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
let clockPending = false;
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

function renderDialog(now = Date.now()) {
  if (!activeDialog) return;
  if (activeDialog.type === 'battle' && !state.battle) {
    closeDialog();
    return;
  }
  if (dialog.open && activeDialog.type === 'breakthrough-effect' && renderedEffect === activeDialog.argument) return;
  if (dialog.open && activeDialog.type === 'meditation' && renderedEffect === activeDialog.argument) {
    syncMeditation(dialog, state, activeDialog.argument, now);
    return;
  }
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
  if (activeDialog.type === 'meditation') syncMeditation(dialog, state, activeDialog.argument, now);
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
  } else if (activeDialog.type === 'meditation') {
    const spot = activeDialog.argument;
    renderedEffect = spot;
    stopEffect = playMeditation(dialog.querySelector('[data-meditation-canvas]'), MEDITATION_SPOTS[spot], () => state.training?.spot === spot);
  }
}

function rememberDialogFocus() {
  if (!dialog.open) restoreFocus = { element: document.activeElement, token: controlToken(document.activeElement) };
}

function openDialog(type, argument) {
  if (type === 'region' && !REGIONS[argument]) return;
  if (type === 'battle' && !state.battle) return;
  if (type === 'meditation' && !Object.hasOwn(MEDITATION_SPOTS, argument)) return;
  const previous = activeDialog;
  rememberDialogFocus();
  if (activeDialog && activeDialog.type !== type) dialog.scrollTop = 0;
  activeDialog = { type, argument };
  renderDialog();
  if (previous?.type === 'meditation' && (type !== 'meditation' || previous.argument !== argument)) {
    leaveMeditation(previous.argument);
  }
}

function closeDialog(restore = true) {
  if (!dialog.open) return;
  const previous = activeDialog;
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
  if (previous?.type === 'meditation') leaveMeditation(previous.argument);
}

function leaveMeditation(spot) {
  if (state.training?.spot === spot) void dispatch('stop-practice', spot);
  else renderMain(Date.now());
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
    if (action === 'practice' && (!dialog.open || activeDialog?.type !== 'meditation' || activeDialog.argument !== id)) return;
    const next = readSaved() ?? state;
    const now = Date.now();
    const clockChanged = advanceClocks(next, now);
    const prior = action === 'breakthrough' ? { step: next.step, realm: realmIndex(next), stats: stats(next) } : null;
    const result = applyAction(next, action, id, now);
    if (result.ok || clockChanged) save(next);
    else state = next;

    if (result.started) {
      rememberDialogFocus();
      activeDialog = { type: 'battle' };
    }
    if (result.combatResult) activeDialog = { type: 'result', argument: result.combatResult };
    if (result.breakthrough) {
      const spot = Object.hasOwn(MEDITATION_SPOTS, id) ? MEDITATION_SPOTS[id] : null;
      activeDialog = {
        type: 'breakthrough-effect',
        argument: {
          from: prior.step, to: next.step, major: realmIndex(next) > prior.realm,
          before: prior.stats, after: stats(next),
          pose: spot ? { place: spot.place, x: spot.x, y: spot.y, facing: 'down' } : explorer.snapshot(),
          meditationSpot: spot ? id : undefined,
        },
      };
      dialog.scrollTop = 0;
    }

    renderMain(now);
    renderDialog(now);
    if (!result.breakthrough) notify(result.message, result.ok ? 'success' : 'warn');
  });
}

function advanceClocks(next, now) {
  const energyChanged = refreshEnergy(next, now);
  return refreshTraining(next, now) || energyChanged;
}

function renderClockViews(now) {
  if (activeDialog?.type === 'meditation') {
    lastClock = snapshotClock(now);
    renderDialog(now);
  } else {
    renderMain(now);
    if (activeDialog?.type === 'region') renderDialog(now);
  }
}

function updateTimers() {
  const now = Date.now();
  const energyDue = state.energy < ENERGY_MAX && now >= state.nextEnergyAt;
  const trainingDue = state.training && now - state.training.lastTick >= 1000;
  if ((energyDue || trainingDue) && !clockPending) {
    clockPending = true;
    void exclusive(() => {
      const next = readSaved() ?? state;
      const at = Date.now();
      if (advanceClocks(next, at)) save(next);
      else state = next;
      renderClockViews(at);
    }).finally(() => { clockPending = false; });
  } else if (snapshotClock(now) !== lastClock) {
    renderClockViews(now);
  } else if (activeDialog?.type === 'meditation' && state.seclusion) {
    renderDialog(now);
  }
  for (const timer of document.querySelectorAll('[data-clock]')) {
    const remaining = countdown(Number(timer.dataset.until), now);
    if (timer.textContent !== remaining) timer.textContent = remaining;
  }
}

function perform(action, id) {
  if (action === 'close-dialog') {
    closeDialog();
  } else if (action === 'travel-city' || action === 'travel-bamboo' || action === 'return-to-garden') {
    closeDialog(false);
    explorer.travel(action === 'travel-city' ? 'city' : action === 'travel-bamboo' ? 'bamboo' : 'garden');
    if (currentRoute !== 'dong-phu') location.hash = 'dong-phu';
    else explorer.focus();
  } else if (Object.hasOwn(openingActions, action)) {
    const type = openingActions[action];
    if (type === 'meditation') openDialog(type, id ?? state.training?.spot ?? DEFAULT_MEDITATION_SPOT);
    else openDialog(type, type === 'region' ? Number(id) : id);
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
  const now = Date.now();
  if (activeDialog?.type === 'meditation') renderClockViews(now);
  else {
    renderMain(now);
    if (activeDialog?.type !== 'profile') renderDialog(now);
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateTimers();
});

const now = Date.now();
if (!savedGame) save(state);
renderMain(now);
if (state.battle) openDialog('battle');
else if (state.training) openDialog('meditation', state.training.spot);
updateTimers();
window.setInterval(updateTimers, 250);
