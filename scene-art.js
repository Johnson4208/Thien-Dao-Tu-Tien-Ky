import { SCENES, SCENE_HEIGHT, SCENE_WIDTH } from './terrain.js';

const pictures = new Map();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function picture(place) {
  if (!pictures.has(place)) {
    const img = new Image();
    img.src = new URL(`./assets/${SCENES[place].image}.webp`, import.meta.url).href;
    pictures.set(place, img);
  }
  return pictures.get(place);
}

export function preloadScene(place) {
  picture(place);
}

function shape(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

const robe = {
  outline: '#152620', dark: '#23443a', main: '#3e6650', light: '#65856a',
  linen: '#eadbb4', fold: '#9dbd9d', belt: '#c49153',
  hair: '#182123', hairLight: '#354649', skin: '#dfaf81', skinShade: '#ad7458',
};

export function drawCultivator(ctx, pose, { time = 0, gait = 0, rise = 0, scale = 1.55, meditating = false } = {}) {
  const back = !meditating && pose.facing === 'up';
  const side = !meditating && ['left', 'right'].includes(pose.facing);
  const step = gait ? Math.round(Math.sin(gait * 0.15) * 2) : 0;
  const bob = gait ? Math.abs(step) / 2 : 0;
  const { x, y } = pose;
  ellipse(ctx, x, y + 1, 14 * scale, 4.2 * scale, 'rgba(14,29,19,.36)');

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - rise - bob));
  ctx.scale(pose.facing === 'left' && side ? -scale : scale, scale);
  ctx.lineJoin = 'round';

  if (meditating) {
    shape(ctx, robe.outline, [[-10,-6],[-15,-3],[-15,0],[15,0],[15,-3],[10,-6],[5,-9],[-5,-9]]);
    shape(ctx, robe.dark, [[-9,-7],[-14,-3],[-13,-1],[-2,-1],[0,-4],[3,-1],[13,-1],[14,-3],[9,-7]]);
    shape(ctx, robe.fold, [[-10,-4],[-4,-6],[-1,-3],[-10,-2]]);
    shape(ctx, robe.main, [[3,-5],[10,-5],[12,-2],[5,-2]]);
  } else {
    shape(ctx, robe.outline, [[-8,-8],[-2,-8],[-2,step],[ -9,step],[-10,step-2],[-8,step-3]]);
    shape(ctx, robe.outline, [[2,-8],[8,-8],[8,-step-3],[10,-step-2],[9,-step],[2,-step]]);
    shape(ctx, '#647966', [[-8,step-3],[-3,step-3],[-3,step-1],[-9,step-1]]);
    shape(ctx, '#647966', [[3,-step-3],[8,-step-3],[9,-step-1],[3,-step-1]]);
  }

  if (!meditating) {
    shape(ctx, '#192825', [[-11,-5],[-13,-6],[10,-29],[13,-30],[14,-28],[11,-25]]);
    shape(ctx, '#bb985d', [[-12,-6],[-11,-8],[12,-29],[13,-28]]);
    shape(ctx, '#dfc187', [[9,-30],[12,-32],[15,-29],[12,-26]]);
  }

  shape(ctx, robe.outline, [[-6,-25],[-10,-23],[-13,-19],[-12,-12],[-9,-11],[-11,-5],[-7,-4],[8,-4],[11,-6],[9,-11],[12,-13],[13,-19],[10,-23],[6,-25]]);
  shape(ctx, robe.main, [[-5,-24],[-9,-22],[-11,-19],[-10,-13],[-7,-13],[-9,-6],[8,-6],[7,-13],[10,-14],[11,-19],[8,-22],[5,-24]]);
  shape(ctx, robe.dark, [[0,-22],[6,-23],[10,-19],[9,-15],[6,-15],[8,-6],[3,-6],[1,-11]]);
  shape(ctx, robe.light, [[-8,-21],[-10,-18],[-9,-14],[-7,-14],[-6,-19],[-3,-21]]);
  if (back) {
    shape(ctx, robe.fold, [[-5,-22],[0,-18],[5,-22],[3,-17],[-3,-17]]);
    shape(ctx, '#b6ab7b', [[-6,-22],[-5,-23],[8,-10],[7,-9]]);
  } else {
    shape(ctx, robe.linen, [[-6,-24],[-8,-22],[-1,-15],[2,-15],[0,-18],[6,-23],[4,-24],[0,-20]]);
    shape(ctx, robe.fold, [[-1,-14],[1,-13],[-2,-7],[-5,-6]]);
  }
  shape(ctx, robe.belt, [[-8,-14],[-5,-13],[6,-13],[8,-14],[8,-11],[-8,-11]]);
  if (!back) shape(ctx, '#eed1a3', [[-2,-14],[2,-14],[2,-11],[-2,-11]]);
  if (meditating) {
    shape(ctx, robe.linen, [[-11,-14],[-9,-11],[-3,-9],[-2,-11],[-7,-14]]);
    shape(ctx, robe.linen, [[11,-14],[9,-11],[3,-9],[2,-11],[7,-14]]);
    shape(ctx, robe.skin, [[-4,-11],[4,-11],[5,-9],[-5,-9]]);
  }

  shape(ctx, robe.hair, [[-7,-36],[-5,-39],[-2,-40],[-3,-43],[0,-45],[3,-44],[4,-40],[7,-39],[10,-35],[10,-28],[7,-25],[5,-24],[-5,-24],[-8,-27],[-9,-30],[-9,-34]]);
  if (back) {
    shape(ctx, robe.hairLight, [[-7,-34],[-5,-38],[1,-39],[6,-37],[8,-33],[5,-31],[1,-34],[-4,-33],[-6,-29]]);
    const tail = meditating ? 0 : Math.round(Math.sin(time / 250) * 1.2);
    shape(ctx, robe.hair, [[-2,-28],[4,-29],[5 + tail,-16],[3 + tail,-13],[0,-15],[-2,-21]]);
    shape(ctx, '#617067', [[0,-39],[3,-39],[3,-37],[0,-37]]);
  } else if (side) {
    shape(ctx, robe.skin, [[1,-34],[7,-35],[8,-32],[11,-30],[8,-28],[8,-26],[5,-25],[1,-26],[-1,-29]]);
    shape(ctx, robe.hairLight, [[-7,-35],[-4,-38],[3,-38],[6,-37],[2,-34],[-3,-33],[-6,-29]]);
    shape(ctx, robe.hair, [[-6,-33],[-2,-35],[-1,-29],[-4,-26],[-7,-26]]);
    ctx.fillStyle = robe.hair;
    ctx.fillRect(6, -32, 2, 2);
  } else {
    shape(ctx, robe.skinShade, [[-7,-33],[7,-33],[8,-28],[5,-25],[2,-24],[-2,-24],[-5,-25],[-8,-28]]);
    shape(ctx, robe.skin, [[-6,-33],[-2,-35],[3,-35],[6,-32],[6,-28],[3,-25],[-3,-25],[-6,-28]]);
    shape(ctx, robe.hairLight, [[-8,-34],[-6,-37],[-2,-39],[4,-39],[8,-36],[7,-33],[3,-35],[0,-33],[-4,-32],[-6,-30]]);
    shape(ctx, robe.hair, [[-7,-33],[-3,-35],[1,-36],[-2,-32],[-6,-30],[-7,-28]]);
    ctx.fillStyle = robe.hair;
    ctx.fillRect(-4, -30, 2, meditating ? 1 : 2);
    ctx.fillRect(2, -30, 2, meditating ? 1 : 2);
    ctx.fillStyle = '#ae694b';
    ctx.fillRect(-1, -27, 2, 1);
  }
  ctx.fillStyle = '#c39b61';
  ctx.fillRect(-2, -41, 6, 1);
  ctx.restore();
}

function drawFoe(ctx, spot, time) {
  const rabbit = spot.id === 'rabbit';
  const walk = Math.sin(time / (rabbit ? 570 : 780) + spot.x) * (rabbit ? 5 : 6);
  const y = spot.y - 3;
  const x = spot.x + walk;
  const hop = rabbit ? Math.max(0, Math.sin(time / 370)) * 4 : 0;
  ellipse(ctx, x, y + 1, rabbit ? 14 : 23, 5, '#0b20115a');
  ctx.save();
  ctx.translate(x, y - hop);
  if (rabbit) {
    shape(ctx, '#50625a', [[-14,-6],[-11,-12],[-5,-13],[-5,-17],[-6,-28],[-1,-30],[3,-20],[6,-30],[11,-28],[11,-18],[15,-13],[15,-6],[11,-3],[-8,-3]]);
    shape(ctx, '#e9dec4', [[-12,-7],[-10,-11],[-4,-12],[-3,-18],[-4,-27],[-1,-27],[3,-18],[6,-19],[7,-27],[10,-27],[9,-16],[13,-13],[13,-6],[9,-5],[-7,-5]]);
    shape(ctx, '#c2a887', [[-9,-8],[-3,-10],[2,-9],[2,-5],[-8,-5]]);
    ctx.fillStyle = '#534339';
    ctx.fillRect(8, -13, 2, 2);
  } else {
    shape(ctx, '#293b38', [[-23,-6],[-21,-15],[-27,-22],[-23,-24],[-15,-19],[-7,-20],[4,-19],[8,-24],[11,-28],[14,-22],[21,-28],[24,-19],[24,-12],[28,-8],[23,-4],[13,-5],[9,-2],[5,-2],[5,-9],[-9,-9],[-11,-2],[-16,-2],[-16,-7]]);
    shape(ctx, '#657870', [[-23,-20],[-16,-17],[-11,-16],[-4,-18],[6,-17],[12,-23],[13,-19],[20,-24],[21,-18],[22,-12],[26,-8],[22,-6],[15,-7],[10,-10],[7,-5],[6,-9],[-9,-11],[-14,-6],[-14,-13],[-18,-14]]);
    shape(ctx, '#a1ad91', [[12,-14],[21,-11],[24,-8],[17,-8]]);
    ctx.fillStyle = '#ecbb74';
    ctx.fillRect(18, -15, 3, 2);
  }
  ctx.restore();
}

function paintBackground(ctx, place) {
  ctx.fillStyle = '#20352a';
  ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  const img = picture(place);
  if (img.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, SCENE_WIDTH, SCENE_HEIGHT);
}

function paintAir(ctx, place, time) {
  for (let i = 0; i < 17; i += 1) {
    const x = (i * 193 + time * (0.008 + i % 3 * 0.002)) % SCENE_WIDTH;
    const y = (i * 127 + Math.sin(time / 900 + i) * 14 + 600) % SCENE_HEIGHT;
    ctx.globalAlpha = .26 + .2 * Math.sin(time / 750 + i * 2);
    ctx.fillStyle = place === 'room' ? '#f9d9a0' : i % 3 ? '#ffe6a2' : '#f2b98a';
    ctx.fillRect(x, y, i % 3 ? 2 : 3, i % 3 ? 2 : 3);
  }
  ctx.globalAlpha = 1;
}

function paintDestination(ctx, destination, time) {
  const pulse = Math.sin(time / 130) * 2;
  ctx.beginPath();
  ctx.ellipse(destination.x, destination.y, 11 + pulse, 5 + pulse / 2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff0bcdd';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ellipse(ctx, destination.x, destination.y, 2.5, 1.5, '#e9d299');
}

export function paintWorld(ctx, pose, camera, { time, gait, destination, reduced }) {
  const sx = ctx.canvas.width / camera.width;
  const sy = ctx.canvas.height / SCENE_HEIGHT;
  ctx.setTransform(sx, 0, 0, sy, -camera.x * sx, 0);
  paintBackground(ctx, pose.place);
  if (!reduced) paintAir(ctx, pose.place, time);
  if (destination) paintDestination(ctx, destination, time);
  if (pose.place === 'bamboo') {
    const foes = SCENES.bamboo.spots.slice(0, 2);
    foes.filter(foe => foe.y < pose.y).forEach(foe => drawFoe(ctx, foe, time));
    drawCultivator(ctx, pose, { gait, time });
    foes.filter(foe => foe.y >= pose.y).forEach(foe => drawFoe(ctx, foe, time));
  } else {
    drawCultivator(ctx, pose, { gait, time });
  }
}

function ritualRing(ctx, x, y, radius, alpha, color, tilt = 0) {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.65;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * .36, tilt, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const a = i * Math.PI / 4;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius * .36;
    shape(ctx, color, [[px,py-3],[px+3,py],[px,py+3],[px-3,py]]);
  }
  ctx.restore();
}

export function playBreakthrough(canvas, source, major) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const pose = { ...source, facing: 'down' };
  const start = performance.now();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const width = canvas.width;
  const height = canvas.height;
  const hue = major ? '#e3bbff' : '#fff1ab';
  let frame;

  function draw(now) {
    const time = reduced ? 2.4 : Math.min(3.4, (now - start) / 1000);
    const burst = clamp((time - 1.16) / .73, 0, 1);
    const lift = Math.sin(Math.min(time, 2.8) / 2.8 * Math.PI) * 32;
    const zoom = Math.max(width / SCENE_WIDTH, height / SCENE_HEIGHT) * 1.72;
    const tx = clamp(width / 2 - pose.x * zoom, width - SCENE_WIDTH * zoom, 0);
    const ty = clamp(height * .59 - pose.y * zoom, height - SCENE_HEIGHT * zoom, 0);
    ctx.setTransform(zoom, 0, 0, zoom, tx, ty);
    paintBackground(ctx, pose.place);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const x = pose.x * zoom + tx;
    const y = pose.y * zoom + ty;
    const focus = ctx.createRadialGradient(x, y - 28, 8, x, y - 28, width * .56);
    focus.addColorStop(0, '#1820171c');
    focus.addColorStop(.38, '#141b21a8');
    focus.addColorStop(1, '#0b110ff2');
    ctx.fillStyle = focus;
    ctx.fillRect(0, 0, width, height);

    const power = Math.min(1, .34 + time * .73);
    const glow = ctx.createRadialGradient(x, y - 33, 0, x, y - 33, 114 + burst * 46);
    glow.addColorStop(0, major ? '#eed4ffd6' : '#f9dfa6d4');
    glow.addColorStop(.28, major ? '#9e83de65' : '#d8ac6265');
    glow.addColorStop(1, '#fff0b300');
    ctx.globalAlpha = power;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    ritualRing(ctx, x, y + 4, 47 + Math.sin(time * 3) * 6, power, hue);
    ritualRing(ctx, x, y + 7, 71, power * .66, '#b9e8c8');
    ritualRing(ctx, x, y - lift - 41, 53 + Math.cos(time * 4) * 12, power * .5, hue, Math.sin(time * 2) * .25);
    if (burst > 0) ritualRing(ctx, x, y + 1, 68 + burst * 143, (1 - burst) * .95, hue);

    if (time > .36 && time < 2.44) {
      const beam = ctx.createLinearGradient(x, 0, x, y);
      beam.addColorStop(0, '#fff2b700');
      beam.addColorStop(.65, major ? '#edb9fc69' : '#ffdf9860');
      beam.addColorStop(1, '#fff2b700');
      ctx.globalAlpha = Math.sin((time - .36) / 2.08 * Math.PI) * .84;
      shape(ctx, beam, [[x-14,0],[x+14,0],[x+41,y],[x-41,y]]);
      ctx.globalAlpha = 1;
    }

    drawCultivator(ctx, { ...pose, x, y }, { time: now, scale: 2.15, rise: lift, meditating: time < 2.7 });

    for (let i = 0; i < 46; i += 1) {
      const angle = i * 2.39996 + time * (i % 2 ? .87 : -.57);
      const spread = 18 + i % 9 * 7 + burst * (20 + i % 6 * 10);
      const py = y - (i % 11) * 9 - (time * (15 + i % 4 * 5) % 50);
      const px = x + Math.sin(angle) * spread;
      const size = i % 5 === 0 ? 3 : 1.5;
      ctx.globalAlpha = power * (.48 + .36 * Math.sin(i + time * 2.8));
      shape(ctx, i % 3 ? hue : '#b5ebcb', [[px,py-size*1.8],[px+size,py],[px,py+size*1.8],[px-size,py]]);
    }
    ctx.globalAlpha = 1;
    if (!reduced && time < 3.4) frame = requestAnimationFrame(draw);
  }

  preloadScene(pose.place);
  frame = requestAnimationFrame(draw);
  const img = picture(pose.place);
  const redraw = () => { if (reduced) draw(performance.now()); };
  img.addEventListener('load', redraw, { once: true });
  return () => {
    cancelAnimationFrame(frame);
    img.removeEventListener('load', redraw);
  };
}
