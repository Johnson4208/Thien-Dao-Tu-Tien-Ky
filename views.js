import { GEAR, ITEMS, MEDITATION_SPOTS, QUESTS, REALMS, RECIPES, REGIONS } from './world.js?v=3';
import {
  ENERGY_MAX, MAX_GEAR, MAX_STEP, battleReward, breakthroughInfo, canAfford,
  encounterCost, forgeCost, heavyAttack, practiceRate, realmIndex, realmName,
  seclusionGain, stats, xpNeeded,
} from './engine.js?v=3';

const numbers = new Intl.NumberFormat('vi-VN');
const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
export const num = value => numbers.format(value);
export const icon = name => `<svg class="icon" aria-hidden="true"><use href="./icons.svg#${name}"></use></svg>`;
export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const countdown = (target, now) => `${Math.max(0, Math.ceil((target - now) / 1000))} giây`;
const twoDigits = value => String(value).padStart(2, '0');
const disabled = condition => condition ? ' disabled' : '';

function clock(type, target, now) {
  return `<span data-clock="${type}" data-until="${target}">${countdown(target, now)}</span>`;
}

function button(label, action, { id, iconName, style = 'secondary', blocked = false, autofocus = false } = {}) {
  return `<button type="button" class="button button-${style}" data-action="${action}"${id !== undefined ? ` data-id="${id}"` : ''}${disabled(blocked)}${autofocus ? ' autofocus' : ''}>${iconName ? icon(iconName) : ''}<span>${label}</span></button>`;
}

function meter(label, current, max, color, iconName, display = `${num(current)} / ${num(max)}`) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, 100 * current / max)) : 100;
  return `<div class="meter meter-${color}">
    <div class="meter-label"><span>${iconName ? icon(iconName) : ''}${label}</span><strong>${display}</strong></div>
    <div class="meter-track" role="progressbar" aria-label="${label}" aria-valuenow="${max ? Math.min(current, max) : 100}" aria-valuemin="0" aria-valuemax="${max || 100}" aria-valuetext="${display}">
      <span style="width:${percentage}%"></span>
    </div>
  </div>`;
}

function rewardChips(items, cost = false) {
  return `<div class="reward-chips">${Object.entries(items).map(([id, amount]) => {
    const item = ITEMS[id] ?? (id === 'xp'
      ? { icon: 'spark', name: 'tu vi', color: 'violet' }
      : { icon: 'gem', name: 'Linh thạch', color: 'amber' });
    return `<span class="reward-chip tone-${item.color}">${icon(item.icon)}${cost ? '' : '+'}${num(amount)} ${item.name}</span>`;
  }).join('')}</div>`;
}

function sectionHeading(title, subtitle, symbol, link = '') {
  return `<div class="section-heading">
    <div class="section-emblem">${icon(symbol)}</div>
    <div class="section-heading-copy"><h2>${title}</h2><p>${subtitle}</p></div>
    ${link}
  </div>`;
}

function pageHeading(title, subtitle, overline, symbol) {
  return `<div class="page-heading">
    <a class="breadcrumb" href="#dong-phu">${icon('temple')} Động phủ</a>
    <span class="breadcrumb-divider" aria-hidden="true">/</span><span class="breadcrumb-current">${overline}</span>
    <div class="page-title-row"><div class="page-symbol">${icon(symbol)}</div><div><h1>${title}</h1><p>${subtitle}</p></div></div>
  </div>`;
}

function profileCard(state, now) {
  const player = stats(state);
  const xpMax = xpNeeded(state.step);
  const isReady = breakthroughInfo(state).ready;
  return `<section class="panel profile-card" aria-labelledby="profile-title">
    <div class="panel-heading">
      <h2 id="profile-title">${icon('user')} Nhân vật</h2>
      <span class="tag profile-tag"><i></i> TÁN TU</span>
    </div>
    <div class="profile-identity">
      <div class="portrait">${icon('portrait')}</div>
      <div class="identity-copy"><strong>${escape(state.name)}</strong><span>${icon('spark')}${realmName(state.step)}</span></div>
    </div>
    <div class="profile-meters">
      ${meter('Tu vi', state.xp, xpMax, 'gold', 'lotus', xpMax ? undefined : 'Viên mãn')}
      ${meter('Sinh lực', state.hp, player.hp, 'jade', 'heart')}
      ${meter('Thể lực', state.energy, ENERGY_MAX, 'ice', 'bolt')}
    </div>
    <div class="profile-footer">
      <span class="profile-detail">${icon('sword')} ${num(player.attack)} công kích</span>
      ${state.step < MAX_STEP ? button('Đột phá', 'open-breakthrough', { iconName: 'spark', style: isReady ? 'primary small' : 'subtle small' }) : '<span class="tag unlocked">ĐÃ PHI THĂNG</span>'}
    </div>
    ${state.energy < ENERGY_MAX && state.nextEnergyAt > now ? `<span class="sr-only">Hồi 1 thể lực sau ${clock('energy', state.nextEnergyAt, now)}.</span>` : ''}
  </section>`;
}

function activityCards(state, now) {
  const secluded = state.seclusion && state.seclusion.endAt > now;
  const seclusionName = state.seclusion && !secluded ? 'Xuất quan' : 'Bế quan';
  const seclusionDetail = secluded
    ? `Còn ${clock('seclusion', state.seclusion.endAt, now)}`
    : state.seclusion ? `Nhận ${num(state.seclusion.xp)} tu vi` : 'Tích tu vi trong 45 giây';
  const restDetail = state.restReadyAt > now
    ? `Hồi lại sau ${clock('rest', state.restReadyAt, now)}`
    : 'Hồi sinh lực và thể lực';
  const actions = [
    { title: 'Luyện công', detail: state.step === MAX_STEP ? 'Tu vi đã viên mãn' : `Bồ đoàn · +${practiceRate(state)} tu vi/giây`, action: 'open-meditation', icon: 'lotus', color: 'amber' },
    { title: 'Hái linh thảo', detail: 'Thu dược liệu · 2 thể lực', action: 'gather', icon: 'leaf', color: 'jade' },
    { title: 'Luyện đan', detail: 'Điều chế đan dược', action: 'open-alchemy', icon: 'cauldron', color: 'ember' },
    { title: 'Rèn pháp bảo', detail: 'Cường hóa trang bị', action: 'open-forge', icon: 'hammer', color: 'ice' },
    { title: seclusionName, detail: seclusionDetail, action: 'seclusion', icon: 'moon', color: 'violet' },
    { title: 'Nghỉ ngơi', detail: restDetail, action: 'rest', icon: 'tea', color: 'sky' },
  ];
  return `<div class="activity-grid">${actions.map(item => `<button class="activity-card tone-${item.color}" type="button" data-action="${item.action}">
    <span class="activity-icon">${icon(item.icon)}</span>
    <span class="activity-copy"><strong>${item.title}</strong><span>${item.detail}</span></span>
    <span class="activity-arrow">${icon('chevron')}</span>
  </button>`).join('')}</div>`;
}

function regionCard(state, index, detailed = false) {
  const region = REGIONS[index];
  const locked = index > realmIndex(state);
  const cleared = state.regions[index].boss;
  const badge = locked ? ['lock', 'Chưa mở', 'locked'] : cleared ? ['check', 'Đã hạ thủ lĩnh', 'unlocked'] : ['pin', 'Đang mở', 'unlocked'];
  return `<button type="button" class="region-card tone-${region.accent}${locked ? ' region-locked' : ''}" data-action="open-region" data-id="${index}" aria-label="${region.name}, ${badge[1]}">
    <span class="region-art" style="--region-image:url('./assets/${region.image}.webp')">
      <span class="region-top"><span class="region-number">VÙNG ${twoDigits(index + 1)}</span><span class="tag ${badge[2]}">${icon(badge[0])}${badge[1]}</span></span>
      <span class="region-name"><strong>${region.name}</strong>${detailed ? `<span>${region.line}</span>` : ''}</span>
    </span>
    <span class="region-footer"><span>${icon(locked ? 'lock' : 'swords')} ${REALMS[index]}</span>${icon('arrow')}</span>
  </button>`;
}

function questCard(state) {
  const quests = QUESTS.slice(0, 3).every(quest => state.claimed.includes(quest.id)) ? QUESTS.slice(3) : QUESTS.slice(0, 3);
  return `<section class="panel quest-card" aria-labelledby="quest-heading">
    <div class="panel-heading"><h2 id="quest-heading">${icon('scroll')} Nhiệm vụ</h2><button class="icon-button" type="button" aria-label="Xem mọi nhiệm vụ" data-action="open-quests">${icon('arrow')}</button></div>
    <p class="panel-note">${quests[0].id === 'practice' ? 'Những bước đầu trên tiên đồ' : 'Thử thách trên đường tu hành'}</p>
    <div class="quest-list">${quests.map(quest => {
      const claimed = state.claimed.includes(quest.id);
      const current = Math.min(quest.goal, state.counts[quest.id]);
      return `<div class="quest-row">
        <span class="quest-marker${claimed ? ' quest-complete' : ''}">${claimed ? icon('check') : '◆'}</span>
        <span class="quest-copy"><strong>${quest.title}</strong><span>${quest.desc}</span></span>
        ${current === quest.goal && !claimed
          ? button('Nhận', 'claim', { id: quest.id, style: 'subtle tiny' })
          : `<span class="quest-count">${current}/${quest.goal}</span>`}
      </div>`;
    }).join('')}</div>
  </section>`;
}

function logList(logs) {
  return `<ol class="timeline">${logs.map(entry => `<li class="timeline-entry kind-${entry.kind}">
    <span class="timeline-dot" aria-hidden="true"></span>
    <div><p>${escape(entry.text)}</p><time datetime="${new Date(entry.at).toISOString()}">${timeFormat.format(entry.at)}</time></div>
  </li>`).join('')}</ol>`;
}

function journalCard(state) {
  return `<section class="panel journal-card" aria-labelledby="journal-heading">
    <div class="panel-heading"><h2 id="journal-heading">${icon('journal')} Nhật ký tu hành</h2><button class="icon-button" type="button" aria-label="Mở nhật ký tu hành" data-action="open-journal">${icon('arrow')}</button></div>
    ${logList(state.logs.slice(0, 3))}
  </section>`;
}

function explorerPanel() {
  return `<section class="explorer" data-explorer aria-label="Khu vực chơi">
    <div class="world-topbar">
      <span class="world-location">${icon('pin')}<strong data-world-location>Sân vườn Thanh Vân</strong></span>
      <span class="world-explore-tag"><i></i> KHÁM PHÁ TỰ DO</span>
    </div>
    <div class="world-viewport">
      <canvas tabindex="0" aria-describedby="world-controls">Sân vườn Thanh Vân</canvas>
      <div class="world-markers" data-world-markers></div>
    </div>
    <div class="world-controls" id="world-controls">
      <div class="world-control-copy">
        <p class="world-hint" data-world-hint aria-live="polite">Đến cửa căn nhà để bắt đầu tu luyện.</p>
        <p class="world-keyboard"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> hoặc <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> để đi <span>·</span> <kbd>E</kbd> tương tác</p>
        <p class="world-touch-hint">Chạm xuống đất hoặc giữ phím hướng để đi.</p>
      </div>
      <div class="world-dpad" role="group" aria-label="Phím di chuyển">
        ${[['KeyW', 'Đi lên'], ['KeyA', 'Sang trái'], ['KeyS', 'Đi xuống'], ['KeyD', 'Sang phải']].map(([key, label]) =>
          `<button type="button" aria-label="${label}" data-world-move="${key}">${icon('chevron')}</button>`).join('')}
      </div>
      <button class="button button-subtle world-use" type="button" data-world-use disabled>${icon('spark')}<span>Tương tác</span></button>
    </div>
  </section>`;
}

function beginnerGuide() {
  const steps = [
    ['temple', 'Vào căn nhà nhỏ', 'Bấm vào tên căn nhà để nhân vật tự đi tới cửa.'],
    ['lotus', 'Tĩnh tọa trên bồ đoàn', 'Bấm Luyện công một lần để nhận tu vi mỗi giây.'],
    ['leaf', 'Hái thuốc rồi xuất hành', 'Thu Linh Thảo trong vườn, sau đó qua cổng đến Thanh Trúc Lâm.'],
  ];
  return `<section class="panel journey-guide">
    <div class="panel-heading"><h2>${icon('compass')} Lối vào tiên đạo</h2></div>
    <ol>${steps.map(([symbol, title, description], index) => `<li>
      <span class="guide-icon">${icon(symbol)}</span>
      <div><strong>${title}</strong><p>${description}</p></div>
      <span class="guide-number">0${index + 1}</span>
    </li>`).join('')}</ol>
  </section>`;
}

export function home(state, now) {
  return `<div class="journey-heading">
    <div><div class="eyebrow"><i></i> CHƯƠNG I <span>·</span> NƠI TIÊN ĐỒ BẮT ĐẦU</div>
    <h1>Tiểu viện Thanh Vân</h1><p>Một mái nhà bên rừng trúc, nơi bạn bắt đầu tu hành.</p></div>
    <a class="button button-secondary" href="#ban-do">${icon('compass')} Bản đồ tu tiên</a>
  </div>
  <div class="dashboard home-adventure">
    <div class="main-column">
      ${explorerPanel()}
      <section class="activity-section">
        ${sectionHeading('Hoạt động tu luyện', 'Tích lũy tu vi và chuẩn bị cho lần xuất hành tiếp theo.', 'lotus')}
        ${activityCards(state, now)}
      </section>
      <section class="world-section">
        ${sectionHeading('Bản đồ tu tiên', 'Khám phá linh địa và khiêu chiến yêu thú.', 'compass', `<a class="section-link" href="#ban-do">Xem bản đồ ${icon('arrow')}</a>`)}
        <div class="region-grid">${REGIONS.slice(0, 3).map((_, index) => regionCard(state, index)).join('')}</div>
      </section>
    </div>
    <aside class="side-column" aria-label="Tiến độ tu hành">
      ${profileCard(state, now)}
      ${beginnerGuide()}
      ${questCard(state)}
      ${journalCard(state)}
    </aside>
  </div>`;
}

function requirementRows(state, info) {
  const requirements = [{ met: state.xp >= info.xp, label: `Tích lũy ${num(info.xp)} tu vi`, detail: `${num(state.xp)} / ${num(info.xp)}` }];
  if (info.major) requirements.push(
    { met: state.regions[info.region].boss, label: `Hạ ${REGIONS[info.region].foes[2].name}`, detail: REGIONS[info.region].name },
    { met: state.bag.seal > 0, label: 'Chuẩn bị 1 Phá Cảnh Đan', detail: `Đang có ${num(state.bag.seal)}` },
  );
  return `<ul class="requirement-list">${requirements.map(req => `<li class="${req.met ? 'met' : ''}">
    ${icon(req.met ? 'check' : 'lock')}<span>${req.label}</span><small>${req.detail}</small>
  </li>`).join('')}</ul>`;
}

function realmRoadmap(state) {
  const current = realmIndex(state);
  return `<section class="panel roadmap-card">
    <div class="panel-heading"><h2>${icon('compass')} Cảnh giới</h2><span class="tag profile-tag">${twoDigits(current + 1)} / ${twoDigits(REALMS.length)}</span></div>
    <ol class="realm-list">${REALMS.map((realm, index) => `<li class="${index === current ? 'realm-current' : index < current ? 'realm-past' : 'realm-future'}">
      <span class="realm-dot">${icon(index < current ? 'check' : index === current ? 'spark' : 'lock')}</span>
      <span>${realm}</span>${index === current ? '<small>Hiện tại</small>' : ''}
    </li>`).join('')}</ol>
  </section>`;
}

export function cultivation(state, now) {
  const info = breakthroughInfo(state);
  const art = `<div class="cultivation-orbit" aria-hidden="true"><i></i><i></i><i></i>${icon('lotus')}<span>✦</span></div>`;
  return `${pageHeading('Động phủ tu luyện', 'Vận khí, tích tu vi và khai mở từng cảnh giới.', 'Tu luyện', 'lotus')}
    <div class="interior-grid">
      <div class="main-column">
        <section class="panel cultivation-feature">
          ${art}
          <div class="cultivation-copy">
            <div class="eyebrow"><i></i> CẢNH GIỚI HIỆN TẠI</div>
            <h2>${realmName(state.step)}</h2>
            <p>${info.done ? 'Bạn đã vượt qua thiên kiếp và mở cửa tiên giới.' : `Tiếp theo · ${info.next}`}</p>
          </div>
          ${meter('Tiến độ tu vi', state.xp, info.xp || 0, 'gold', 'spark', info.done ? 'Viên mãn' : undefined)}
          ${info.done ? '' : `${requirementRows(state, info)}<div class="feature-actions">${button('Luyện công', 'open-meditation', { iconName: 'lotus', style: 'primary' })}${button('Đột phá', 'open-breakthrough', { iconName: 'spark', style: info.ready ? 'primary' : 'secondary' })}</div>`}
        </section>
        <section class="activity-section">${sectionHeading('Lịch tu hành', 'Chọn một hoạt động để tiếp tục tích lũy.', 'moon')}${activityCards(state, now)}</section>
      </div>
      <aside class="side-column" aria-label="Cảnh giới và nhân vật">${profileCard(state, now)}${realmRoadmap(state)}</aside>
    </div>`;
}

export function map(state) {
  const open = Math.min(REGIONS.length, realmIndex(state) + 1);
  const bosses = state.regions.filter(region => region.boss).length;
  return `${pageHeading('Bản đồ tu tiên', 'Từ rừng trúc dưới chân núi đến cửa trời Linh Tiêu.', 'Bản đồ', 'compass')}
    <section class="map-banner panel">
      <div><div class="eyebrow"><i></i> THIÊN HẠ CHI ĐỒ</div><h2>Qua núi, vượt mây</h2><p>Thắng hai trận với yêu thú trong mỗi vùng để gặp thủ lĩnh trấn giữ.</p></div>
      <div class="map-stats"><div><strong>${twoDigits(open)}<small> / ${twoDigits(REGIONS.length)}</small></strong><span>Vùng đã mở</span></div><div><strong>${twoDigits(bosses)}<small> / ${twoDigits(REGIONS.length)}</small></strong><span>Thủ lĩnh đã hạ</span></div></div>
    </section>
    <div class="region-grid map-grid">${REGIONS.map((_, index) => regionCard(state, index, true)).join('')}</div>`;
}

function equipmentRows(state, forging = false) {
  return `<div class="item-list">${Object.entries(GEAR).map(([id, gear]) => {
    const level = state.gear[id];
    const costs = forgeCost(state, id);
    const maxed = level >= MAX_GEAR;
    return `<div class="item-row tone-${gear.color}">
      <span class="activity-icon">${icon(gear.icon)}</span>
      <div class="item-copy"><strong>${level ? gear.name : gear.base}${level ? ` <span>+${level}</span>` : ''}</strong>
        <p>${gear.effect}</p>${forging && !maxed ? rewardChips(costs, true) : ''}
      </div>
      ${forging ? button(maxed ? 'Tối đa' : 'Cường hóa', 'forge', { id, style: 'subtle small', blocked: maxed || !canAfford(state, costs) }) : '<span class="tag unlocked">Đang dùng</span>'}
    </div>`;
  }).join('')}</div>`;
}

export function inventory(state) {
  const slots = Object.values(state.bag).filter(amount => amount > 0).length;
  const materials = ['herb', 'ore', 'essence'];
  const pills = ['qiPill', 'healPill', 'seal'];
  function itemTiles(ids) {
    return `<div class="inventory-grid">${ids.map(id => {
      const item = ITEMS[id];
      const usable = id === 'qiPill' || id === 'healPill';
      const blocked = !state.bag[id] || (id === 'healPill' && state.hp === stats(state).hp) || (id === 'qiPill' && state.step === MAX_STEP);
      return `<article class="inventory-card tone-${item.color}">
        <div class="inventory-card-top"><span class="activity-icon">${icon(item.icon)}</span><span class="quantity">×${num(state.bag[id])}</span></div>
        <h3>${item.name}</h3><p>${item.detail}</p>
        ${usable ? button('Dùng đan', 'pill', { id, style: 'subtle small', blocked }) : ''}
      </article>`;
    }).join('')}</div>`;
  }
  return `${pageHeading('Hành trang', 'Theo dõi tài nguyên, đan dược và trang bị đang dùng.', 'Hành trang', 'bag')}
    <div class="interior-grid">
      <div class="main-column">
        <section class="panel inventory-panel">
          <div class="panel-heading"><h2>${icon('bag')} Túi trữ vật</h2><span class="tag profile-tag">${slots} loại vật phẩm</span></div>
          <h3 class="item-group">Nguyên liệu</h3>${itemTiles(materials)}
          <h3 class="item-group">Đan dược</h3>${itemTiles(pills)}
        </section>
      </div>
      <aside class="side-column">
        <section class="panel equipment-panel"><div class="panel-heading"><h2>${icon('shield')} Trang bị</h2></div>${equipmentRows(state)}${button('Mở lò rèn', 'open-forge', { iconName: 'hammer', style: 'secondary' })}</section>
      </aside>
    </div>`;
}

function titleBlock(title, subtitle, symbol, color = 'amber') {
  return `<div class="modal-title-row tone-${color}"><div class="activity-icon">${icon(symbol)}</div><div><h2 id="dialog-title">${title}</h2><p>${subtitle}</p></div></div>`;
}

function alchemy(state) {
  return `${titleBlock('Lò luyện đan', 'Dùng dược liệu để luyện đan hỗ trợ tu hành.', 'cauldron', 'ember')}
    <div class="item-list">${RECIPES.map(recipe => {
      const item = ITEMS[recipe.item];
      return `<div class="item-row tone-${item.color}">
        <span class="activity-icon">${icon(item.icon)}</span>
        <div class="item-copy"><strong>${item.name}</strong><p>${item.detail}</p>${rewardChips(recipe.costs, true)}</div>
        ${button('Luyện đan', 'craft', { id: recipe.item, style: 'subtle small', blocked: !canAfford(state, recipe.costs) })}
      </div>`;
    }).join('')}</div>
    <div class="modal-resources">${icon('leaf')} ${num(state.bag.herb)} Linh Thảo ${icon('orb')} ${num(state.bag.essence)} Yêu Đan ${icon('gem')} ${num(state.stones)} Linh thạch</div>`;
}

function forge(state) {
  return `${titleBlock('Lò rèn pháp bảo', 'Cường hóa kiếm và hộ bào. Trang bị được sử dụng ngay sau khi rèn.', 'hammer', 'ice')}
    ${equipmentRows(state, true)}
    <div class="modal-resources">${icon('gem')} ${num(state.bag.ore)} Tinh Thiết ${icon('gem')} ${num(state.stones)} Linh thạch</div>`;
}

function questsDialog(state) {
  return `${titleBlock('Nhiệm vụ tu hành', 'Nhận thưởng sau khi hoàn thành từng mục tiêu.', 'scroll')}
    <div class="item-list">${QUESTS.map(quest => {
      const claimed = state.claimed.includes(quest.id);
      const current = Math.min(quest.goal, state.counts[quest.id]);
      return `<div class="item-row quest-detail-row">
        <span class="quest-marker${claimed ? ' quest-complete' : ''}">${claimed ? icon('check') : '◆'}</span>
        <div class="item-copy"><strong>${quest.title}</strong><p>${quest.desc} · ${current}/${quest.goal}</p>${rewardChips(quest.reward)}</div>
        ${claimed ? '<span class="tag unlocked">Đã nhận</span>' : button('Nhận thưởng', 'claim', { id: quest.id, style: 'subtle small', blocked: current < quest.goal })}
      </div>`;
    }).join('')}</div>`;
}

function regionDialog(state, index) {
  const region = REGIONS[index];
  const locked = index > realmIndex(state);
  const progress = state.regions[index];
  return `<div class="region-modal-art tone-${region.accent}" style="--region-image:url('./assets/${region.image}.webp')">
    <span class="eyebrow"><i></i> VÙNG ${twoDigits(index + 1)} · ${REALMS[index]}</span><h2 id="dialog-title">${region.name}</h2>
    <p>${region.story}</p>
  </div>
  ${locked ? `<div class="locked-note">${icon('lock')}<div><strong>Chưa thể vào vùng này</strong><p>Đạt ${realmName(index * 3)} để mở đường.</p></div></div>
      <a class="button button-primary" href="#tu-luyen" data-close-route>${icon('lotus')} Về tu luyện</a>`
    : `<div class="region-encounters">
      ${index === 0 ? button('Đi bộ vào rừng trúc', 'travel-bamboo', { iconName: 'compass', style: 'subtle small' }) : ''}
      <div class="encounter-heading"><h3>Chọn đối thủ</h3><span>${icon('bolt')} ${state.energy}/${ENERGY_MAX} thể lực</span></div>
      ${region.foes.map((foe, foeIndex) => {
        const boss = foeIndex === 2;
        const gated = boss && progress.wins < 2;
        const cost = encounterCost(foeIndex);
        const reward = battleReward(index, foeIndex, !progress.boss);
        const short = gated ? `Thắng yêu thú ${progress.wins}/2 trận để mở` : `${foe.hp} sinh lực · ${cost} thể lực`;
        return `<div class="item-row encounter-row tone-${boss ? 'ember' : region.accent}">
          <span class="activity-icon">${icon(foe.icon)}</span>
          <div class="item-copy"><strong>${foe.name}${boss ? ' <span class="tag boss-tag">Thủ lĩnh</span>' : ''}</strong><p>${short}</p>
            ${gated ? '' : `<p class="encounter-reward">${icon('spark')} +${num(reward.xp)} tu vi ${icon('gem')} +${num(reward.stones)} Linh thạch</p>`}
          </div>
          ${button(gated ? 'Đang khóa' : 'Giao đấu', 'start-fight', { id: `${index}:${foeIndex}`, iconName: gated ? 'lock' : 'swords', style: boss ? 'subtle small' : 'secondary small', blocked: gated || state.energy < cost || state.hp < 1 || Boolean(state.battle) })}
        </div>`;
      }).join('')}
      ${state.hp === 0 ? '<p class="small-note">Hãy nghỉ ngơi hoặc dùng Hồi Xuân Đan để hồi sinh lực.</p>' : state.energy < 3 ? '<p class="small-note">Cần ít nhất 3 thể lực để giao đấu. Bạn có thể nghỉ ngơi tại động phủ.</p>' : ''}
    </div>`}`;
}

function breakthroughDialog(state, spotId) {
  const info = breakthroughInfo(state);
  if (info.done) return titleBlock('Đã phi thăng', 'Bạn đã đạt cảnh giới cao nhất.', 'spark');
  return `${titleBlock('Đột phá cảnh giới', `${realmName(state.step)} → ${info.next}`, 'spark')}
    ${requirementRows(state, info)}
    <div class="modal-actions">${button('Đột phá', 'breakthrough', { id: spotId, iconName: 'spark', style: 'primary', blocked: !info.ready })}${info.major ? `<button class="button button-secondary" type="button" data-action="open-region" data-id="${info.region}">${icon('compass')} Xem vùng đất</button>` : ''}</div>`;
}

function meditationDialog(state, spotId) {
  const spot = MEDITATION_SPOTS[spotId];
  return `<div class="meditation-stage" data-spot="${spotId}" data-multiplier="${spot.multiplier}">
    <canvas data-meditation-canvas width="960" height="448" aria-hidden="true"></canvas>
    <div class="meditation-heading">
      <div class="eyebrow"><i></i> TĨNH TỌA</div>
      <h2 id="dialog-title">${spot.title}</h2>
    </div>
    <div class="meditation-rate">
      <span class="meditation-multiplier">${icon('lotus')} ×${spot.multiplier} LINH KHÍ</span>
      <span><strong data-meditation-rate>+${practiceRate(state, spotId)}</strong> tu vi/giây</span>
    </div>
    <div class="meditation-status" data-meditation-status aria-live="polite"><i></i><span></span></div>
  </div>
  <div class="meditation-controls">
    <div class="meditation-summary">
      <div class="meditation-summary-head">
        <strong data-meditation-realm>${realmName(state.step)}</strong>
        <span data-meditation-gained hidden></span>
      </div>
      ${meter('Tu vi', state.xp, xpNeeded(state.step), 'gold', 'spark', state.step === MAX_STEP ? 'Viên mãn' : undefined)}
    </div>
    <div class="meditation-actions">
      <button class="button button-primary meditation-practice" type="button" data-action="practice" data-id="${spotId}">
        ${icon('lotus')}<span>Luyện công</span>
      </button>
      ${button('Bế quan', 'seclusion', { iconName: 'moon' })}
      ${button('Đột phá', 'open-breakthrough', { id: spotId, iconName: 'spark', style: 'subtle' })}
    </div>
    <p class="meditation-note" data-meditation-note></p>
  </div>`;
}

export function syncMeditation(container, state, spotId, now) {
  const spot = MEDITATION_SPOTS[spotId];
  const info = breakthroughInfo(state);
  const active = state.training?.spot === spotId;
  const full = !info.done && state.xp >= info.xp;
  const locked = state.step < spot.minStep;
  const waiting = state.seclusion && now < state.seclusion.endAt;
  const rate = practiceRate(state, spotId);
  const setText = (selector, value) => {
    const element = container.querySelector(selector);
    if (element.textContent !== value) element.textContent = value;
  };

  let status = 'Sẵn sàng tĩnh tọa';
  let note = 'Bấm Luyện công một lần. Tu vi tăng mỗi giây và tự dừng khi đủ.';
  if (active) {
    status = 'Đang luyện công';
    note = `Còn khoảng ${num(Math.ceil((info.xp - state.xp) / rate))} giây để đủ tu vi. Đóng màn thiền để dừng.`;
  } else if (info.done) {
    status = 'Tu vi viên mãn';
    note = 'Bạn đã đạt cảnh giới Phi Thăng.';
  } else if (locked) {
    status = 'Điểm thiền đang khóa';
    note = `Điểm thiền mở từ ${realmName(spot.minStep)}.`;
  } else if (state.battle) {
    status = 'Đang giao đấu';
    note = 'Hãy kết thúc trận đấu trước khi tĩnh tọa.';
  } else if (state.training) {
    status = 'Đang luyện ở nơi khác';
    note = `Buổi thiền đang diễn ra tại ${MEDITATION_SPOTS[state.training.spot].title}.`;
  } else if (full) {
    status = 'Đã đủ tu vi';
    note = info.ready ? 'Bạn có thể đột phá ngay.' : 'Xem điều kiện đột phá để chuẩn bị bước tiếp.';
  } else if (state.seclusion) {
    status = waiting ? 'Đang bế quan' : 'Có thể xuất quan';
    note = waiting ? `Có thể xuất quan sau ${countdown(state.seclusion.endAt, now)}.` : 'Chọn Xuất quan để nhận tu vi đã tích lũy.';
  }

  const statusBadge = container.querySelector('[data-meditation-status]');
  statusBadge.dataset.active = String(active);
  setText('[data-meditation-status] span', status);
  setText('[data-meditation-note]', note);
  setText('[data-meditation-rate]', `+${num(rate)}`);
  setText('[data-meditation-realm]', realmName(state.step));
  const gained = container.querySelector('[data-meditation-gained]');
  gained.hidden = !active;
  if (active) setText('[data-meditation-gained]', `Buổi này +${num(state.training.gained)} tu vi`);

  const max = info.xp || 0;
  const shown = max ? `${num(state.xp)} / ${num(max)}` : 'Viên mãn';
  const track = container.querySelector('.meditation-summary .meter-track');
  setText('.meditation-summary .meter-label strong', shown);
  track.setAttribute('aria-valuenow', String(max ? Math.min(state.xp, max) : 100));
  track.setAttribute('aria-valuemax', String(max || 100));
  track.setAttribute('aria-valuetext', shown);
  track.firstElementChild.style.width = `${max ? Math.min(100, 100 * state.xp / max) : 100}%`;

  const practice = container.querySelector('.meditation-practice');
  practice.dataset.action = active ? 'stop-practice' : 'practice';
  practice.disabled = !active && Boolean(info.done || full || locked || state.seclusion || state.battle || state.training);
  setText('.meditation-practice span', active ? 'Dừng luyện' : 'Luyện công');
  const seclusion = container.querySelector('[data-action="seclusion"]');
  seclusion.disabled = Boolean(state.training || locked || info.done || state.battle || waiting || (!state.seclusion && state.energy < 4));
  setText('[data-action="seclusion"] span', waiting ? 'Đang bế quan' : state.seclusion ? 'Xuất quan' : 'Bế quan');
  const breakthrough = container.querySelector('[data-action="open-breakthrough"]');
  breakthrough.disabled = Boolean(info.done || state.training || state.battle);
  breakthrough.classList.toggle('is-ready', info.ready);
}

function profileDialog(state) {
  const player = stats(state);
  return `${titleBlock('Hồ sơ tu sĩ', realmName(state.step), 'user')}
    <div class="character-stats"><div>${icon('heart')}<strong>${num(player.hp)}</strong><span>Sinh lực tối đa</span></div><div>${icon('sword')}<strong>${num(player.attack)}</strong><span>Công kích</span></div><div>${icon('shield')}<strong>${num(player.armor)}</strong><span>Phòng ngự</span></div></div>
    <form id="rename-form" class="rename-form">
      <label for="dao-hieu">Đạo hiệu</label><div><input id="dao-hieu" name="name" value="${escape(state.name)}" type="text" maxlength="24" autocomplete="off" required><button class="button button-primary" type="submit">Lưu đạo hiệu</button></div>
    </form>`;
}

function help() {
  return `${titleBlock('Hướng dẫn nhập môn', 'Bắt đầu tu hành tại Tiểu viện Thanh Vân.', 'journal')}
    <ol class="help-list">
      <li><strong>Đi lại và tương tác</strong><p>Dùng WASD, phím mũi tên hoặc chạm vào mặt đất để đi. Đến gần một địa điểm và nhấn E hoặc nút tương tác. Chọn tên địa điểm để nhân vật tự đi đến đó.</p></li>
      <li><strong>Luyện công</strong><p>Bấm Luyện công một lần để tự tích tu vi mỗi giây. Lên tầng mới sẽ luyện nhanh hơn. Bồ đoàn ×1, bệ sen ×2 và linh đài ×3. Khi sang đại cảnh giới mới, bạn cần hạ thủ lĩnh của vùng hiện tại và dùng một Phá Cảnh Đan.</p></li>
      <li><strong>Chuẩn bị hành trang</strong><p>Hái Linh Thảo và thu Tinh Thiết để luyện đan, rèn kiếm và hộ bào. Nghỉ ngơi hồi sinh lực và thể lực. Mỗi hai phút bạn tự hồi một thể lực.</p></li>
      <li><strong>Du hành và trừ yêu</strong><p>Xuất kiếm tích linh lực, dùng hai điểm để tung Kiếm khí. Khi thủ lĩnh tụ lực, Hộ thể giảm 70% sát thương. Thắng hai yêu thú để mở thủ lĩnh của vùng.</p></li>
    </ol>`;
}

function battleDialog(state) {
  const battle = state.battle;
  const region = REGIONS[battle.region];
  const enemy = region.foes[battle.foe];
  const player = stats(state);
  const heavy = heavyAttack(battle);
  return `<div class="combat-title"><span class="eyebrow"><i></i> ${region.name} · HIỆP ${battle.turn}</span><h2 id="dialog-title">Giao đấu</h2></div>
    <div class="arena tone-${region.accent}" style="--region-image:url('./assets/${region.image}.webp')">
      <div class="combatant combatant-player"><div class="fighter-emblem">${icon('player')}</div><strong>${escape(state.name)}</strong>${meter('Sinh lực của bạn', state.hp, player.hp, 'jade', '')}</div>
      <div class="versus" aria-hidden="true"><span>VS</span></div>
      <div class="combatant combatant-enemy"><div class="fighter-emblem">${icon(enemy.icon)}</div><strong>${enemy.name}</strong>${meter('Sinh lực đối thủ', battle.enemyHp, enemy.hp, 'ember', '')}</div>
    </div>
    <div class="battle-status${heavy ? ' is-danger' : ''}">
      <span>${icon(heavy ? 'alert' : 'orb')}${heavy ? 'Thủ lĩnh đang tụ lực. Dùng Hộ thể để giảm sát thương.' : 'Linh lực'}</span>
      <span class="spirit-pips" aria-label="${battle.spirit}/3 linh lực">${[1, 2, 3].map(index => `<i class="${index <= battle.spirit ? 'lit' : ''}"></i>`).join('')}</span>
    </div>
    <div class="move-grid">
      <button class="move-button tone-amber" type="button" data-action="battle-move" data-id="attack">${icon('sword')}<strong>Xuất kiếm</strong><span>+1 linh lực</span></button>
      <button class="move-button tone-violet" type="button" data-action="battle-move" data-id="skill"${disabled(battle.spirit < 2)}>${icon('spark')}<strong>Kiếm khí</strong><span>−2 linh lực</span></button>
      <button class="move-button tone-ice${heavy ? ' move-highlight' : ''}" type="button" data-action="battle-move" data-id="guard">${icon('shield')}<strong>Hộ thể</strong><span>Giảm 70% sát thương</span></button>
      <button class="move-button tone-jade" type="button" data-action="battle-move" data-id="heal"${disabled(!state.bag.healPill || state.hp === player.hp)}>${icon('pill')}<strong>Hồi Xuân Đan</strong><span>Còn ${num(state.bag.healPill)} viên</span></button>
    </div>
    <div class="battle-log" role="log" aria-label="Diễn biến trận đấu"><p>${escape(battle.logs[0] || 'Trận đấu bắt đầu.')}</p>${battle.logs[1] ? `<p>${escape(battle.logs[1])}</p>` : ''}</div>
    <button class="text-button flee-button" type="button" data-action="battle-move" data-id="flee">${icon('flag')} Rút lui</button>`;
}

function resultDialog(result) {
  const name = REGIONS[result.region].foes[result.foe].name;
  const win = result.outcome === 'win';
  const heading = win ? 'Chiến thắng' : result.outcome === 'lose' ? 'Bại trận' : 'Đã rút lui';
  const detail = win ? `Bạn đã đánh bại ${name}.` : result.outcome === 'lose' ? `${name} đã khiến bạn trọng thương. Về động phủ nghỉ ngơi để hồi sinh lực.` : `Bạn đã rời trận đấu với ${name}.`;
  return `<div class="result-header tone-${win ? 'amber' : 'ember'}"><div class="result-emblem">${icon(win ? 'crown' : 'flag')}</div><h2 id="dialog-title">${heading}</h2><p>${detail}</p></div>
    ${win ? rewardChips(result.reward) : ''}
    <div class="modal-actions result-actions">
      ${win ? button('Tiếp tục săn', 'open-region', { id: result.region, iconName: 'swords', style: 'primary' }) : ''}
      ${button('Về động phủ', 'return-to-garden', { iconName: 'temple' })}
    </div>`;
}

function breakthroughEffect(info) {
  const ascended = info.to === MAX_STEP;
  return `<div class="ritual-stage${info.major ? ' ritual-major' : ''}">
    <canvas data-breakthrough-canvas width="940" height="465" aria-hidden="true"></canvas>
    <div class="ritual-caption">
      <span class="eyebrow"><i></i> ${info.major ? 'KHAI MỞ ĐẠI CẢNH GIỚI' : 'LINH KHÍ NHẬP THỂ'}</span>
      <h2 id="dialog-title">${ascended ? 'Phi thăng thành tiên' : 'Đột phá thành công'}</h2>
      <p>${realmName(info.from)} <span>→</span> <strong>${realmName(info.to)}</strong></p>
    </div>
  </div>
  <div class="ritual-result">
    <div class="ritual-stats"><span>${icon('heart')} +${num(info.after.hp - info.before.hp)} sinh lực tối đa</span>
      <span>${icon('sword')} +${num(info.after.attack - info.before.attack)} công kích</span></div>
    ${info.meditationSpot && !ascended
      ? button('Tiếp tục tu luyện', 'open-meditation', { id: info.meditationSpot, iconName: 'arrow', style: 'primary' })
      : button('Tiếp tục', 'close-dialog', { iconName: 'arrow', style: 'primary' })}
  </div>`;
}

export function dialogView(state, { type, argument }) {
  switch (type) {
    case 'alchemy': return alchemy(state);
    case 'forge': return forge(state);
    case 'quests': return questsDialog(state);
    case 'journal': return `${titleBlock('Nhật ký tu hành', 'Những dấu mốc bạn đã đi qua.', 'journal')}${logList(state.logs)}`;
    case 'region': return regionDialog(state, argument);
    case 'meditation': return meditationDialog(state, argument);
    case 'breakthrough': return breakthroughDialog(state, argument);
    case 'breakthrough-effect': return breakthroughEffect(argument);
    case 'profile': return profileDialog(state);
    case 'help': return help();
    case 'battle': return state.battle ? battleDialog(state) : '';
    case 'result': return resultDialog(argument);
    default: return '';
  }
}
