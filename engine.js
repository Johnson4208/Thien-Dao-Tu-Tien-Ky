import { DEFAULT_MEDITATION_SPOT, GEAR, ITEMS, MEDITATION_SPOTS, QUESTS, REALMS, RECIPES, REGIONS } from './world.js?v=3';

export const SAVE_KEY = 'thien-dao-tu-tien-ky:v1';
export const ENERGY_MAX = 12;
export const ENERGY_INTERVAL = 120_000;
export const REST_DELAY = 55_000;
export const SECLUSION_TIME = 45_000;
export const MAX_STEP = 18;
export const MAX_GEAR = 6;

const stageNames = ['Tầng 1', 'Tầng 2', 'Viên mãn'];
const PRACTICE_BEAT = 10;

export function newGame(now = Date.now()) {
  return {
    version: 1, name: 'Vô Danh', step: 0, xp: 0, stones: 60, hp: 100,
    energy: ENERGY_MAX, nextEnergyAt: 0, restReadyAt: 0, seclusion: null,
    bag: { herb: 0, ore: 0, essence: 0, qiPill: 0, healPill: 1, seal: 0 },
    gear: { sword: 0, robe: 0 },
    regions: REGIONS.map(() => ({ wins: 0, boss: false })),
    counts: Object.fromEntries(QUESTS.map(quest => [quest.id, 0])),
    practiceProgress: 0,
    training: null,
    claimed: [],
    battle: null,
    logs: [{ text: 'Bạn đặt chân vào động phủ và bắt đầu tiên đồ.', kind: 'travel', at: now }],
  };
}

export function stats(state) {
  return {
    hp: 100 + state.step * 13 + state.gear.robe * 14,
    attack: 18 + state.step * 4 + state.gear.sword * 8,
    armor: 2 + Math.floor(state.step * 0.72) + state.gear.robe * 2,
  };
}

export function realmIndex(state) {
  return Math.floor(state.step / 3);
}

export function realmName(step) {
  const realm = REALMS[Math.floor(step / 3)];
  return step === MAX_STEP ? realm : `${realm} · ${stageNames[step % 3]}`;
}

export function xpNeeded(step) {
  return step === MAX_STEP ? 0 : 100 + 30 * (step % 3) + 95 * Math.floor(step / 3);
}

export function practiceRate(state, spotId = DEFAULT_MEDITATION_SPOT) {
  return state.step === MAX_STEP ? 0 : (2 + state.step) * MEDITATION_SPOTS[spotId].multiplier;
}

export function seclusionGain(state) {
  return 68 + state.step * 9;
}

export function forgeCost(state, item) {
  const level = state.gear[item];
  return { ore: 2 + level * 2, stones: 30 + level * 20 };
}

function readInt(value, fallback, max = 1_000_000_000) {
  return Number.isSafeInteger(value) ? Math.max(0, Math.min(value, max)) : fallback;
}

export function decodeSave(value) {
  try {
    const raw = JSON.parse(value);
    if (raw?.version !== 1) return null;
    const state = newGame();
    state.name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 24) || state.name : state.name;
    state.step = readInt(raw.step, 0, MAX_STEP);
    state.xp = readInt(raw.xp, 0);
    state.stones = readInt(raw.stones, state.stones);
    for (const item of Object.keys(state.bag)) state.bag[item] = readInt(raw.bag?.[item], state.bag[item]);
    for (const item of Object.keys(state.gear)) state.gear[item] = readInt(raw.gear?.[item], 0, MAX_GEAR);
    state.hp = readInt(raw.hp, stats(state).hp, stats(state).hp);
    state.energy = readInt(raw.energy, ENERGY_MAX, ENERGY_MAX);
    state.nextEnergyAt = readInt(raw.nextEnergyAt, 0, Number.MAX_SAFE_INTEGER);
    state.restReadyAt = readInt(raw.restReadyAt, 0, Number.MAX_SAFE_INTEGER);
    if (Number.isSafeInteger(raw.seclusion?.endAt) && raw.seclusion.endAt > 0) {
      state.seclusion = { endAt: raw.seclusion.endAt, xp: readInt(raw.seclusion.xp, seclusionGain(state)) };
    }
    state.regions.forEach((region, index) => {
      region.wins = readInt(raw.regions?.[index]?.wins, 0);
      region.boss = raw.regions?.[index]?.boss === true;
    });
    for (const key of Object.keys(state.counts)) state.counts[key] = readInt(raw.counts?.[key], 0);
    state.practiceProgress = readInt(raw.practiceProgress, 0, PRACTICE_BEAT - 1);
    if (Array.isArray(raw.claimed)) state.claimed = QUESTS.filter(quest => raw.claimed.includes(quest.id)).map(quest => quest.id);
    if (Array.isArray(raw.logs)) {
      state.logs = raw.logs.filter(entry => typeof entry?.text === 'string').slice(0, 40).map(entry => ({
        text: entry.text.slice(0, 260),
        at: readInt(entry.at, Date.now(), 8_640_000_000_000_000),
        kind: ['cultivate', 'battle', 'travel', 'loot'].includes(entry.kind) ? entry.kind : 'travel',
      }));
    }
    const battle = raw.battle;
    const foe = REGIONS[battle?.region]?.foes?.[battle?.foe];
    if (foe && Number.isInteger(battle.region) && Number.isInteger(battle.foe) && state.hp > 0 && battle.region <= realmIndex(state)) {
      state.battle = {
        region: battle.region, foe: battle.foe, enemyHp: readInt(battle.enemyHp, foe.hp, foe.hp) || foe.hp,
        turn: readInt(battle.turn, 1) || 1, spirit: readInt(battle.spirit, 0, 3),
        logs: Array.isArray(battle.logs) ? battle.logs.filter(line => typeof line === 'string').slice(0, 5).map(line => line.slice(0, 180)) : [],
      };
    }
    const training = raw.training;
    if (!state.battle && !state.seclusion && state.step < MAX_STEP && Object.hasOwn(MEDITATION_SPOTS, training?.spot)
      && state.step >= MEDITATION_SPOTS[training.spot].minStep && Number.isSafeInteger(training.lastTick) && training.lastTick > 0) {
      state.training = { spot: training.spot, lastTick: training.lastTick, gained: readInt(training.gained, 0) };
    }
    return state;
  } catch {
    return null;
  }
}

export function refreshEnergy(state, now) {
  if (state.energy === ENERGY_MAX) return false;
  if (!state.nextEnergyAt) {
    state.nextEnergyAt = now + ENERGY_INTERVAL;
    return true;
  }
  if (now < state.nextEnergyAt) return false;
  const gained = 1 + Math.floor((now - state.nextEnergyAt) / ENERGY_INTERVAL);
  state.energy = Math.min(ENERGY_MAX, state.energy + gained);
  state.nextEnergyAt = state.energy === ENERGY_MAX ? 0 : state.nextEnergyAt + gained * ENERGY_INTERVAL;
  return true;
}

export function canAfford(state, costs) {
  return Object.entries(costs).every(([key, amount]) => (key === 'stones' ? state.stones : state.bag[key]) >= amount);
}

export function breakthroughInfo(state) {
  if (state.step === MAX_STEP) return { done: true, ready: false };
  const region = realmIndex(state);
  const xp = xpNeeded(state.step);
  const major = state.step % 3 === 2;
  return {
    xp, major, region, done: false, next: realmName(state.step + 1),
    ready: state.xp >= xp && (!major || (state.regions[region].boss && state.bag.seal > 0)),
  };
}

function spendEnergy(state, amount, now) {
  if (state.energy < amount) return false;
  if (state.energy === ENERGY_MAX || !state.nextEnergyAt) state.nextEnergyAt = now + ENERGY_INTERVAL;
  state.energy -= amount;
  return true;
}

function spend(state, costs) {
  for (const [key, amount] of Object.entries(costs)) {
    if (key === 'stones') state.stones -= amount;
    else state.bag[key] -= amount;
  }
}

function grant(state, rewards) {
  for (const [key, amount] of Object.entries(rewards)) {
    if (key === 'stones') state.stones += amount;
    else if (key === 'xp') {
      if (state.step < MAX_STEP) state.xp += amount;
    } else {
      state.bag[key] += amount;
    }
  }
  state.counts.herbs += rewards.herb || 0;
}

function record(state, text, kind, now) {
  state.logs.unshift({ text, kind, at: now });
  state.logs.length = Math.min(state.logs.length, 40);
}

const ok = (message, extras = {}) => ({ ok: true, message, ...extras });
const fail = message => ({ ok: false, message });

function finishTraining(state, now) {
  const session = state.training;
  state.training = null;
  if (session.gained) {
    record(state, `Tĩnh tọa tại ${MEDITATION_SPOTS[session.spot].title}, tăng ${session.gained} tu vi.`, 'cultivate', now);
  }
}

export function refreshTraining(state, now) {
  const session = state.training;
  if (!session) return false;
  const remaining = xpNeeded(state.step) - state.xp;
  if (remaining <= 0) {
    finishTraining(state, now);
    return true;
  }

  const elapsed = Math.floor((now - session.lastTick) / 1000);
  if (elapsed < 1) return false;
  const rate = practiceRate(state, session.spot);
  const seconds = Math.min(elapsed, Math.ceil(remaining / rate));
  const gained = Math.min(remaining, seconds * rate);
  grant(state, { xp: gained });
  session.gained += gained;
  session.lastTick += seconds * 1000;
  const progress = state.practiceProgress + seconds;
  state.counts.practice += Math.floor(progress / PRACTICE_BEAT);
  state.practiceProgress = progress % PRACTICE_BEAT;
  if (gained === remaining) finishTraining(state, now);
  return true;
}

function actionPractice(state, id, now) {
  if (state.step === MAX_STEP) return fail('Bạn đã phi thăng và tu vi đã viên mãn.');
  if (state.training) return fail('Bạn đang luyện công.');
  if (state.seclusion) return fail('Hãy xuất quan trước khi luyện công.');
  if (state.xp >= xpNeeded(state.step)) return fail('Tu vi đã đủ cho lần đột phá kế tiếp.');
  const spot = id || DEFAULT_MEDITATION_SPOT;
  if (!Object.hasOwn(MEDITATION_SPOTS, spot)) return fail('Điểm thiền chưa khả dụng.');
  const info = MEDITATION_SPOTS[spot];
  if (state.step < info.minStep) return fail(`Điểm thiền mở từ ${realmName(info.minStep)}.`);
  state.training = { spot, lastTick: now, gained: 0 };
  return ok('');
}

function actionStopPractice(state, id, now) {
  if (state.training && (!id || state.training.spot === id)) finishTraining(state, now);
  return ok('');
}

function actionGather(state, now) {
  if (!spendEnergy(state, 2, now)) return fail('Cần 2 thể lực để hái linh thảo.');
  const herb = 2 + Math.floor(realmIndex(state) / 2);
  const ore = 1 + Math.floor(realmIndex(state) / 3);
  grant(state, { herb, ore });
  record(state, `Thu hái ${herb} Linh Thảo và ${ore} Tinh Thiết.`, 'loot', now);
  return ok(`+${herb} Linh Thảo, +${ore} Tinh Thiết`);
}

function actionRest(state, now) {
  const maxHp = stats(state).hp;
  if (now < state.restReadyAt) return fail('Bạn vừa nghỉ ngơi. Hãy chờ hồi sức thêm.');
  if (state.hp === maxHp && state.energy === ENERGY_MAX) return fail('Sinh lực và thể lực đã đầy.');
  const hp = Math.min(maxHp - state.hp, Math.ceil(maxHp * 0.55));
  const energy = Math.min(ENERGY_MAX - state.energy, 6);
  state.hp += hp;
  state.energy += energy;
  if (state.energy === ENERGY_MAX) state.nextEnergyAt = 0;
  state.restReadyAt = now + REST_DELAY;
  record(state, `Nghỉ ngơi, hồi ${hp} sinh lực và ${energy} thể lực.`, 'cultivate', now);
  return ok(`Đã hồi ${hp} sinh lực và ${energy} thể lực.`);
}

function actionSeclusion(state, now) {
  if (state.seclusion) {
    if (now < state.seclusion.endAt) return fail('Bạn đang bế quan.');
    const xp = state.seclusion.xp;
    state.seclusion = null;
    grant(state, { xp });
    record(state, `Xuất quan, tăng ${xp} tu vi.`, 'cultivate', now);
    return ok(`Xuất quan · +${xp} tu vi`);
  }
  if (state.step === MAX_STEP) return fail('Bạn đã phi thăng và tu vi đã viên mãn.');
  if (!spendEnergy(state, 4, now)) return fail('Cần 4 thể lực để bế quan.');
  state.seclusion = { endAt: now + SECLUSION_TIME, xp: seclusionGain(state) };
  record(state, 'Bắt đầu bế quan trong động phủ.', 'cultivate', now);
  return ok('Đã nhập quan. Có thể xuất quan sau 45 giây.');
}

function actionBreakthrough(state, now) {
  const info = breakthroughInfo(state);
  if (!info.ready) return fail('Bạn chưa đủ điều kiện đột phá.');
  if (info.major) state.bag.seal -= 1;
  state.xp -= info.xp;
  state.step += 1;
  state.hp = stats(state).hp;
  if (state.step === MAX_STEP) {
    state.xp = 0;
    state.seclusion = null;
  }
  record(state, `Đột phá thành công, đạt ${realmName(state.step)}!`, 'cultivate', now);
  return ok(`Đột phá thành công · ${realmName(state.step)}`, { breakthrough: true });
}

function actionCraft(state, item, now) {
  const recipe = RECIPES.find(entry => entry.item === item);
  if (!recipe || !canAfford(state, recipe.costs)) return fail('Bạn chưa đủ nguyên liệu luyện đan.');
  spend(state, recipe.costs);
  grant(state, { [item]: 1 });
  state.counts.pills += 1;
  record(state, `Luyện thành 1 ${ITEMS[item].name}.`, 'loot', now);
  return ok(`Đã luyện thành 1 ${ITEMS[item].name}.`);
}

function actionForge(state, item, now) {
  if (!Object.hasOwn(GEAR, item) || state.gear[item] >= MAX_GEAR) return fail('Trang bị đã đạt cấp tối đa.');
  const costs = forgeCost(state, item);
  if (!canAfford(state, costs)) return fail('Bạn chưa đủ nguyên liệu cường hóa.');
  const oldHp = stats(state).hp;
  spend(state, costs);
  state.gear[item] += 1;
  state.hp += stats(state).hp - oldHp;
  record(state, `Cường hóa ${GEAR[item].name} lên +${state.gear[item]}.`, 'loot', now);
  return ok(`${GEAR[item].name} +${state.gear[item]} đã được trang bị.`);
}

function heal(state) {
  const maxHp = stats(state).hp;
  const amount = Math.min(maxHp - state.hp, Math.ceil(maxHp * 0.55));
  state.hp += amount;
  state.bag.healPill -= 1;
  return amount;
}

function actionPill(state, item, now) {
  if (item !== 'qiPill' && item !== 'healPill') return fail('Đan dược này dùng khi đột phá.');
  if (!state.bag[item]) return fail('Bạn đã hết loại đan này.');
  if (item === 'healPill' && state.hp === stats(state).hp) return fail('Sinh lực đã đầy.');
  if (item === 'qiPill' && state.step === MAX_STEP) return fail('Tu vi đã viên mãn.');
  let result;
  if (item === 'qiPill') {
    state.bag.qiPill -= 1;
    grant(state, { xp: 45 });
    result = 'tăng 45 tu vi';
  } else {
    result = `hồi ${heal(state)} sinh lực`;
  }
  record(state, `Dùng ${ITEMS[item].name}, ${result}.`, 'cultivate', now);
  return ok(`${ITEMS[item].name} · ${result}`);
}

function actionQuest(state, id, now) {
  const quest = QUESTS.find(entry => entry.id === id);
  if (!quest || state.claimed.includes(id) || state.counts[id] < quest.goal) return fail('Chưa có thưởng để nhận.');
  state.claimed.push(id);
  grant(state, quest.reward);
  record(state, `Hoàn thành nhiệm vụ ${quest.title}.`, 'loot', now);
  return ok(`Đã nhận thưởng · ${quest.title}`);
}

export function encounterCost(foe) {
  return foe === 2 ? 4 : 3;
}

export function battleReward(region, foe, firstBoss) {
  if (foe === 2) {
    const multiplier = firstBoss ? 1 : 0.6;
    return {
      xp: Math.round((100 + 35 * region) * multiplier),
      stones: Math.round((85 + 28 * region) * multiplier),
      ore: firstBoss ? 4 + region : 2,
      essence: firstBoss ? 3 : 2,
    };
  }
  return {
    xp: 28 + 13 * region + foe * 8,
    stones: 20 + 9 * region + foe * 6,
    herb: 1 + Math.floor(region / 2),
    ore: 1 + Math.floor(region / 3),
    essence: foe === 0 ? 1 : 2,
  };
}

function startFight(state, region, foe, now) {
  const enemy = REGIONS[region]?.foes[foe];
  if (!enemy || !Number.isInteger(region) || !Number.isInteger(foe) || realmIndex(state) < region) return fail('Khu vực này chưa mở.');
  if (foe === 2 && state.regions[region].wins < 2) return fail('Thắng 2 trận với yêu thú trong vùng để mở thủ lĩnh.');
  if (state.hp < 1) return fail('Hãy nghỉ ngơi hoặc dùng Hồi Xuân Đan để hồi sinh lực.');
  const cost = encounterCost(foe);
  if (!spendEnergy(state, cost, now)) return fail(`Cần ${cost} thể lực để vào trận.`);
  state.battle = { region, foe, turn: 1, enemyHp: enemy.hp, spirit: 0, logs: [`${enemy.name} xuất hiện!`] };
  return ok('', { started: true });
}

export function heavyAttack(battle) {
  return battle.foe === 2 && battle.turn % 3 === 0;
}

function finishFight(state, outcome, now) {
  const battle = state.battle;
  const region = REGIONS[battle.region];
  const enemy = region.foes[battle.foe];
  let reward = {};
  if (outcome === 'win') {
    const firstBoss = !state.regions[battle.region].boss;
    reward = battleReward(battle.region, battle.foe, firstBoss);
    if (state.step === MAX_STEP) delete reward.xp;
    grant(state, reward);
    state.counts.wins += 1;
    if (battle.foe === 2) {
      if (firstBoss) state.counts.bosses += 1;
      state.regions[battle.region].boss = true;
    } else {
      state.regions[battle.region].wins += 1;
    }
    record(state, `Đánh bại ${enemy.name} tại ${region.name}.`, 'battle', now);
  } else {
    record(state, outcome === 'lose' ? `Bại trận trước ${enemy.name}.` : `Rút lui khỏi trận với ${enemy.name}.`, 'battle', now);
  }
  state.battle = null;
  return ok('', { combatResult: { outcome, region: battle.region, foe: battle.foe, reward, hp: state.hp, logs: battle.logs } });
}

function battleTurn(state, move, now, random) {
  const battle = state.battle;
  if (move === 'flee') return finishFight(state, 'flee', now);
  const foe = REGIONS[battle.region].foes[battle.foe];
  const player = stats(state);
  let playerLine;
  if (move === 'attack' || move === 'skill') {
    if (move === 'skill' && battle.spirit < 2) return fail('Cần 2 linh lực để tung kiếm khí.');
    const damage = Math.max(1, Math.round(player.attack * (move === 'skill' ? 1.85 : 1)) + Math.floor(random() * 5) - 2 - foe.armor);
    battle.enemyHp = Math.max(0, battle.enemyHp - damage);
    battle.spirit = move === 'skill' ? battle.spirit - 2 : Math.min(3, battle.spirit + 1);
    playerLine = move === 'skill' ? `Kiếm khí gây ${damage} sát thương.` : `Bạn xuất kiếm, gây ${damage} sát thương.`;
  } else if (move === 'guard') {
    battle.spirit = Math.min(3, battle.spirit + 1);
    playerLine = 'Bạn vận khí hộ thể và tích 1 linh lực.';
  } else if (move === 'heal') {
    if (!state.bag.healPill || state.hp === player.hp) return fail('Chưa thể dùng Hồi Xuân Đan.');
    playerLine = `Hồi Xuân Đan hồi ${heal(state)} sinh lực.`;
  } else {
    return fail('Chiêu thức không khả dụng.');
  }

  if (!battle.enemyHp) {
    battle.logs = [playerLine, ...battle.logs].slice(0, 5);
    return finishFight(state, 'win', now);
  }

  const heavy = heavyAttack(battle);
  const rawDamage = Math.max(1, Math.round(foe.attack * (heavy ? 1.85 : 1)) + Math.floor(random() * 5) - 2 - player.armor);
  const damage = move === 'guard' ? Math.max(1, Math.ceil(rawDamage * 0.3)) : rawDamage;
  state.hp = Math.max(0, state.hp - damage);
  const enemyLine = heavy ? `Tuyệt kỹ của thủ lĩnh gây ${damage} sát thương.` : `${foe.name} phản công, gây ${damage} sát thương.`;
  battle.logs = [`${playerLine} ${enemyLine}`, ...battle.logs].slice(0, 5);
  if (!state.hp) return finishFight(state, 'lose', now);
  battle.turn += 1;
  return ok('');
}

export function applyAction(state, action, id = '', now = Date.now(), random = Math.random) {
  refreshEnergy(state, now);
  refreshTraining(state, now);
  if (state.battle) {
    return action === 'battle-move' ? battleTurn(state, id, now, random) : fail('Hãy kết thúc trận đấu đang diễn ra.');
  }
  if (state.training && action !== 'practice' && action !== 'stop-practice') {
    return fail('Hãy dừng luyện công trước khi thực hiện hoạt động khác.');
  }
  switch (action) {
    case 'practice': return actionPractice(state, id, now);
    case 'stop-practice': return actionStopPractice(state, id, now);
    case 'gather': return actionGather(state, now);
    case 'rest': return actionRest(state, now);
    case 'seclusion': return actionSeclusion(state, now);
    case 'breakthrough': return actionBreakthrough(state, now);
    case 'craft': return actionCraft(state, id, now);
    case 'forge': return actionForge(state, id, now);
    case 'pill': return actionPill(state, id, now);
    case 'claim': return actionQuest(state, id, now);
    case 'start-fight': {
      const [region, foe] = id.split(':').map(Number);
      return startFight(state, region, foe, now);
    }
    case 'rename': {
      const name = id.trim().slice(0, 24);
      if (!name) return fail('Hãy nhập đạo hiệu của bạn.');
      state.name = name;
      return ok('Đã đổi đạo hiệu.');
    }
    default: return fail('Hoạt động này chưa khả dụng.');
  }
}
