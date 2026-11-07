import { SCENES, SCENE_HEIGHT, SCENE_WIDTH, WALK_SPEED, REACH, canStand, distance, entrance, pathTo } from './terrain.js';
import { paintWorld, preloadScene } from './scene-art.js';
import { icon } from './views.js?v=2';

const WORLD_SAVE = 'thien-dao-tu-tien-ky:world:v1';
const MOVES = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};
const DIRECTIONS = ['up', 'down', 'left', 'right'];
const SCENE_HINTS = {
  garden: 'Đến cửa căn nhà để bắt đầu tu luyện.',
  room: 'Đến bồ đoàn để vận khí và tích tu vi.',
  bamboo: 'Đến gần yêu thú để mở trận giao đấu.',
};

function restorePose() {
  try {
    const saved = JSON.parse(localStorage.getItem(WORLD_SAVE));
    if (saved && Object.hasOwn(SCENES, saved.place) && Number.isFinite(saved.x) && Number.isFinite(saved.y)
      && canStand(saved.place, saved.x, saved.y) && DIRECTIONS.includes(saved.facing)) {
      return { place: saved.place, x: saved.x, y: saved.y, facing: saved.facing };
    }
  } catch {
    // A fresh world is usable when the browser blocks storage.
  }
  return { place: 'garden', ...entrance('garden') };
}

export function createExplorer({ onAction, enabled }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const keys = new Set();
  let pose = restorePose();
  let canvas, ctx, root, labels, location, hint, use, resize, listeners;
  let markers = [];
  let path = [];
  let target = null;
  let interaction = null;
  let nearby = null;
  let pointer = null;
  let frame = 0;
  let previous = 0;
  let lastSave = 0;
  let gait = 0;
  let dirty = false;
  let camera = { x: 0, width: SCENE_WIDTH };

  function remember() {
    if (!dirty) return;
    try {
      localStorage.setItem(WORLD_SAVE, JSON.stringify(pose));
    } catch {
      // The current scene stays playable for the rest of the session.
    }
    dirty = false;
  }

  function clearPath() {
    path = [];
    target = null;
    interaction = null;
  }

  function releaseControls() {
    keys.clear();
    pointer = null;
    clearPath();
  }

  function face(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) pose.facing = dx < 0 ? 'left' : 'right';
    else if (dy) pose.facing = dy < 0 ? 'up' : 'down';
  }

  function step(dx, dy) {
    const nextX = pose.x + dx;
    const nextY = pose.y + dy;
    let moved = false;
    face(dx, dy);
    if (dx && dy && canStand(pose.place, nextX, nextY)) {
      pose.x = nextX;
      pose.y = nextY;
      return true;
    }
    if (dx && canStand(pose.place, nextX, pose.y)) {
      pose.x = nextX;
      moved = true;
    }
    if (dy && canStand(pose.place, pose.x, nextY)) {
      pose.y = nextY;
      moved = true;
    }
    return moved;
  }

  function closestSpot() {
    let result = null;
    let range = REACH;
    for (const point of SCENES[pose.place].spots) {
      const gap = distance(pose, point);
      if (gap <= range) {
        result = point;
        range = gap;
      }
    }
    return result;
  }

  function syncSpot() {
    const next = closestSpot();
    if (next === nearby) return;
    nearby = next;
    for (const { point, el } of markers) el.classList.toggle('is-nearby', point === nearby);
    hint.textContent = nearby ? `Đã đến ${nearby.title}.` : SCENE_HINTS[pose.place];
    use.disabled = !nearby;
    use.querySelector('span').textContent = nearby?.use ?? 'Tương tác';
  }

  function updateCamera(snap = false) {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(box.width * pixelRatio);
    const height = Math.round(box.height * pixelRatio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    camera.width = Math.min(SCENE_WIDTH, SCENE_HEIGHT * box.width / box.height);
    const next = Math.max(0, Math.min(SCENE_WIDTH - camera.width, pose.x - camera.width / 2));
    camera.x = snap ? next : camera.x + (next - camera.x) * .22;
    camera.x = Math.max(0, Math.min(camera.x, SCENE_WIDTH - camera.width));
  }

  function updateMarkers() {
    for (const { point, el } of markers) {
      const x = 100 * (point.x - camera.x) / camera.width;
      el.hidden = x < 0 || x > 100;
      el.style.left = `${Math.max(12, Math.min(88, x))}%`;
      el.style.top = `${100 * (point.y - (point.foe === undefined ? 14 : 35)) / SCENE_HEIGHT}%`;
    }
  }

  function setLocation() {
    const area = SCENES[pose.place];
    root.dataset.place = pose.place;
    location.textContent = area.name;
    canvas.textContent = area.name;
    canvas.setAttribute('aria-label', `${area.name}. Dùng WASD hoặc phím mũi tên để di chuyển.`);
    labels.innerHTML = area.spots.map(point => `<button type="button" class="world-marker${point.foe === undefined ? '' : ' world-marker-foe'}"
      data-world-target="${point.id}" title="${point.use}" aria-label="${point.use}">
      ${icon(point.icon)}<span>${point.title}</span><kbd aria-hidden="true">E</kbd></button>`).join('');
    markers = [...labels.querySelectorAll('[data-world-target]')].map((el, i) => ({ el, point: area.spots[i] }));
    nearby = null;
    hint.textContent = SCENE_HINTS[pose.place];
    use.disabled = true;
    use.querySelector('span').textContent = 'Tương tác';
    updateCamera(true);
    updateMarkers();
    syncSpot();
  }

  function travel(place) {
    if (!Object.hasOwn(SCENES, place) || pose.place === place) return;
    remember();
    releaseControls();
    pose = { place, ...entrance(place, pose.place) };
    gait = 0;
    dirty = true;
    remember();
    preloadScene(place);
    if (root) {
      setLocation();
      if (!reduced.matches) root.querySelector('.world-viewport').animate([{ opacity: .48 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
      canvas.focus({ preventScroll: true });
    }
  }

  function activate(point) {
    if (!point || !enabled() || distance(pose, point) > REACH) return;
    releaseControls();
    remember();
    if (point.place) travel(point.place);
    else onAction(point.action, point.foe === undefined ? '' : `0:${point.foe}`);
  }

  function startPath(destination, point = null) {
    if (!enabled()) return;
    if (point && distance(pose, point) <= REACH) {
      activate(point);
      return;
    }
    const nextPath = pathTo(pose.place, pose, destination);
    if (!nextPath.length) return;
    keys.clear();
    path = nextPath;
    target = destination;
    interaction = point;
    canvas.focus({ preventScroll: true });
  }

  function walk(delta) {
    const movement = [...keys].map(key => MOVES[key]);
    if (pointer) movement.push(MOVES[pointer.key]);
    const [dx, dy] = movement.reduce(([x, y], [mx, my]) => [x + mx, y + my], [0, 0]);
    const amount = WALK_SPEED * delta;
    if (dx || dy) {
      clearPath();
      const length = Math.hypot(dx, dy);
      return step(amount * dx / length, amount * dy / length);
    }
    if (!path.length) return false;

    const next = path[0];
    const gap = distance(pose, next);
    if (gap <= Math.max(1.5, amount)) {
      face(next.x - pose.x, next.y - pose.y);
      pose.x = next.x;
      pose.y = next.y;
      path.shift();
      if (!path.length) {
        const point = interaction;
        clearPath();
        if (point) activate(point);
      }
      return gap > .1;
    }
    const x = amount * (next.x - pose.x) / gap;
    const y = amount * (next.y - pose.y) / gap;
    const moved = step(x, y);
    if (delta && !moved) clearPath();
    return moved;
  }

  function tick(now) {
    const delta = Math.min(.12, Math.max(0, (now - (previous || now)) / 1000));
    previous = now;
    if (enabled()) {
      const steps = Math.ceil(delta / .035);
      let moved = false;
      for (let i = 0; i < steps && enabled(); i += 1) {
        moved = walk(delta / steps) || moved;
      }
      if (moved) {
        gait += delta * 126;
        dirty = true;
        if (now - lastSave > 650) {
          remember();
          lastSave = now;
        }
      } else {
        gait = 0;
      }
    } else {
      releaseControls();
      gait = 0;
    }
    const next = Math.max(0, Math.min(SCENE_WIDTH - camera.width, pose.x - camera.width / 2));
    camera.x += (next - camera.x) * .22;
    updateMarkers();
    syncSpot();
    paintWorld(ctx, pose, camera, { time: reduced.matches ? 0 : now, gait, destination: target, reduced: reduced.matches });
    frame = requestAnimationFrame(tick);
  }

  function allowKeys(event) {
    const target = event.target;
    return enabled() && !event.altKey && !event.ctrlKey && !event.metaKey && !target?.isContentEditable
      && !target?.closest?.('input, textarea, select, a, button');
  }

  function mount(element) {
    root = element;
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    labels = root.querySelector('[data-world-markers]');
    location = root.querySelector('[data-world-location]');
    hint = root.querySelector('[data-world-hint]');
    use = root.querySelector('[data-world-use]');
    listeners = new AbortController();
    const options = { signal: listeners.signal };
    preloadScene(pose.place);
    setLocation();

    if (!ctx) {
      hint.textContent = 'Trình duyệt này không hỗ trợ cảnh 2D. Bạn vẫn có thể mở Tu luyện và Bản đồ.';
      return;
    }

    resize = new ResizeObserver(() => updateCamera(true));
    resize.observe(canvas);
    window.addEventListener('keydown', event => {
      if (!allowKeys(event)) return;
      if (Object.hasOwn(MOVES, event.code)) {
        event.preventDefault();
        clearPath();
        if (!keys.has(event.code)) {
          const [dx, dy] = MOVES[event.code];
          dirty = step(dx * 6, dy * 6) || dirty;
        }
        keys.add(event.code);
      } else if (event.code === 'KeyE' && !event.repeat) {
        event.preventDefault();
        activate(closestSpot());
      } else if (event.code === 'Escape') {
        clearPath();
      }
    }, options);
    window.addEventListener('keyup', event => {
      keys.delete(event.code);
      remember();
    }, options);
    window.addEventListener('blur', () => {
      keys.clear();
      pointer = null;
      remember();
    }, options);
    window.addEventListener('pagehide', remember, options);

    root.addEventListener('click', event => {
      const point = event.target.closest('[data-world-target]');
      if (point) {
        const destination = SCENES[pose.place].spots.find(item => item.id === point.dataset.worldTarget);
        if (destination) startPath(destination, destination);
      } else if (event.target.closest('[data-world-use]')) {
        activate(closestSpot());
      } else if (event.target === canvas) {
        const box = canvas.getBoundingClientRect();
        startPath({
          x: camera.x + (event.clientX - box.left) * camera.width / box.width,
          y: (event.clientY - box.top) * SCENE_HEIGHT / box.height,
        });
      } else if (event.detail === 0) {
        const direction = event.target.closest('[data-world-move]');
        if (!direction || !enabled()) return;
        const [dx, dy] = MOVES[direction.dataset.worldMove];
        clearPath();
        dirty = step(dx * 16, dy * 16) || dirty;
        remember();
      }
    }, options);
    root.addEventListener('pointerdown', event => {
      const direction = event.target.closest('[data-world-move]');
      if (!direction || !enabled() || event.button !== 0) return;
      event.preventDefault();
      direction.setPointerCapture(event.pointerId);
      pointer = { key: direction.dataset.worldMove, id: event.pointerId };
      clearPath();
      const [dx, dy] = MOVES[pointer.key];
      dirty = step(dx * 7, dy * 7) || dirty;
    }, options);
    const releasePointer = event => {
      if (event.pointerId !== pointer?.id) return;
      pointer = null;
      remember();
    };
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) root.addEventListener(name, releasePointer, options);
    previous = 0;
    frame = requestAnimationFrame(tick);
  }

  function unmount() {
    remember();
    releaseControls();
    listeners?.abort();
    resize?.disconnect();
    cancelAnimationFrame(frame);
    root = null;
  }

  return {
    mount, unmount, travel,
    snapshot: () => ({ ...pose }),
    focus: () => canvas?.isConnected && canvas.focus({ preventScroll: true }),
  };
}
