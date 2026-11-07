export const SCENE_WIDTH = 960;
export const SCENE_HEIGHT = 540;
export const WALK_SPEED = 174;
export const REACH = 39;

const rect = (left, top, right, bottom) => [[left, top], [right, top], [right, bottom], [left, bottom]];

export const SCENES = {
  garden: {
    name: 'Sân vườn Thanh Vân',
    image: 'scene-garden',
    walk: [[26, 37], [929, 37], [929, 466], [499, 466], [499, 522], [405, 522], [405, 466], [26, 466]],
    blocks: [
      rect(27, 20, 348, 205),
      [[453, 37], [619, 37], [624, 77], [601, 107], [556, 124], [501, 102], [462, 77]],
      rect(655, 68, 903, 205),
      [[26, 252], [118, 263], [159, 310], [144, 396], [119, 451], [26, 462]],
      rect(157, 408, 243, 436),
      [[547, 465], [583, 399], [630, 351], [702, 333], [758, 307], [824, 303], [850, 269], [896, 285], [929, 340], [929, 466]],
    ],
    spawn: { x: 441, y: 355, facing: 'down' },
    spots: [
      { id: 'cabin', x: 193, y: 224, title: 'Căn nhà nhỏ', use: 'Vào nhà', icon: 'temple', place: 'room' },
      { id: 'herbs', x: 773, y: 221, title: 'Vườn linh thảo', use: 'Hái linh thảo', icon: 'leaf', action: 'gather' },
      { id: 'bench', x: 202, y: 448, title: 'Ghế nghỉ', use: 'Nghỉ ngơi', icon: 'tea', action: 'rest' },
      { id: 'gate', x: 451, y: 492, title: 'Lối ra rừng trúc', use: 'Vào Thanh Trúc Lâm', icon: 'compass', place: 'bamboo' },
    ],
  },
  room: {
    name: 'Nhà nhỏ Thanh Vân',
    image: 'scene-room',
    walk: [[32, 123], [920, 123], [940, 431], [555, 431], [555, 510], [400, 510], [400, 431], [19, 431]],
    blocks: [rect(36, 62, 337, 155), rect(676, 62, 906, 166), rect(862, 207, 939, 318)],
    spawn: { x: 477, y: 394, facing: 'up' },
    spots: [
      { id: 'mat', x: 483, y: 213, title: 'Bồ đoàn', use: 'Ngồi tu luyện', icon: 'lotus', action: 'open-meditation' },
      { id: 'bed', x: 805, y: 188, title: 'Giường gỗ', use: 'Nghỉ ngơi', icon: 'moon', action: 'rest' },
      { id: 'door', x: 477, y: 464, title: 'Cửa ra sân', use: 'Ra sân vườn', icon: 'temple', place: 'garden' },
    ],
  },
  bamboo: {
    name: 'Thanh Trúc Lâm',
    image: 'scene-bamboo',
    walk: [[33, 285], [88, 189], [139, 155], [239, 123], [361, 132], [434, 147], [476, 136], [550, 136], [630, 133], [744, 126], [829, 152], [910, 230], [927, 309], [864, 370], [745, 391], [623, 413], [532, 446], [515, 521], [436, 521], [424, 449], [338, 415], [197, 390], [104, 353]],
    blocks: [],
    spawn: { x: 471, y: 416, facing: 'up' },
    spots: [
      { id: 'rabbit', x: 242, y: 253, title: 'Trúc Linh Thỏ', use: 'Đánh Trúc Linh Thỏ', icon: 'swords', action: 'start-fight', foe: 0 },
      { id: 'wolf', x: 714, y: 260, title: 'Thanh Nha Lang', use: 'Đánh Thanh Nha Lang', icon: 'swords', action: 'start-fight', foe: 1 },
      { id: 'shrine', x: 489, y: 164, title: 'Miếu Yêu Vương', use: 'Khiêu chiến Yêu Vương', icon: 'crown', action: 'start-fight', foe: 2 },
      { id: 'bridge', x: 475, y: 484, title: 'Cầu về tiểu viện', use: 'Về sân vườn', icon: 'temple', place: 'garden' },
    ],
  },
};

export function entrance(place, from) {
  if (place === 'garden' && from === 'room') return { x: 193, y: 262, facing: 'down' };
  if (place === 'garden' && from === 'bamboo') return { x: 451, y: 447, facing: 'up' };
  return { ...SCENES[place].spawn };
}

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function inside(x, y, polygon) {
  let contained = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [ax, ay] = polygon[i];
    const [bx, by] = polygon[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) contained = !contained;
  }
  return contained;
}

const feet = [[0, 0], [-8, 0], [8, 0], [0, -7], [0, 7]];

export function canStand(place, x, y) {
  const area = SCENES[place];
  return feet.every(([dx, dy]) => inside(x + dx, y + dy, area.walk)
    && !area.blocks.some(shape => inside(x + dx, y + dy, shape)));
}

function lineClear(place, from, to) {
  const steps = Math.ceil(distance(from, to) / 6);
  for (let step = 1; step <= steps; step += 1) {
    if (!canStand(place, from.x + (to.x - from.x) * step / steps, from.y + (to.y - from.y) * step / steps)) return false;
  }
  return true;
}

const CELL = 16;
const COLS = Math.ceil(SCENE_WIDTH / CELL);
const ROWS = Math.ceil(SCENE_HEIGHT / CELL);
const nodes = Array.from({ length: COLS * ROWS }, (_, i) => ({
  x: (i % COLS + 0.5) * CELL,
  y: (Math.floor(i / COLS) + 0.5) * CELL,
}));
const meshes = new Map();
const directions = [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];

function mesh(place) {
  if (!meshes.has(place)) meshes.set(place, nodes.map(node => canStand(place, node.x, node.y)));
  return meshes.get(place);
}

function closestNode(place, position, passable) {
  let best = -1;
  let closest = CELL * 2.5;
  nodes.forEach((node, index) => {
    const gap = distance(node, position);
    if (passable[index] && gap < closest && lineClear(place, position, node)) {
      best = index;
      closest = gap;
    }
  });
  return best;
}

export function pathTo(place, from, to) {
  if (!canStand(place, to.x, to.y)) return [];
  if (lineClear(place, from, to)) return [to];

  const passable = mesh(place);
  const start = closestNode(place, from, passable);
  const goal = closestNode(place, to, passable);
  if (start < 0 || goal < 0) return [];

  const parents = new Int32Array(nodes.length).fill(-1);
  const queue = [start];
  parents[start] = start;
  for (let i = 0; i < queue.length && parents[goal] === -1; i += 1) {
    const current = queue[i];
    const col = current % COLS;
    const row = Math.floor(current / COLS);
    for (const [dx, dy] of directions) {
      const nextCol = col + dx;
      const nextRow = row + dy;
      if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) continue;
      const next = nextRow * COLS + nextCol;
      if (!passable[next] || parents[next] !== -1 || !lineClear(place, nodes[current], nodes[next])) continue;
      parents[next] = current;
      queue.push(next);
    }
  }
  if (parents[goal] === -1) return [];

  const path = [to];
  for (let node = goal; node !== start; node = parents[node]) path.push(nodes[node]);
  path.push(nodes[start]);
  path.reverse();

  const direct = [];
  let origin = from;
  while (path.length) {
    let next = path.length - 1;
    while (next > 0 && !lineClear(place, origin, path[next])) next -= 1;
    origin = path[next];
    direct.push(origin);
    path.splice(0, next + 1);
  }
  return direct;
}
