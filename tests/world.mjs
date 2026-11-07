import assert from 'node:assert/strict';
import { SCENES, pathTo, canStand, entrance } from '../terrain.js';
for (const [place,scene] of Object.entries(SCENES)) {
  for (const start of [scene.spawn, ...scene.spots]) for (const end of scene.spots) {
    const path = pathTo(place,start,end);
    assert(path.length,`${place}: ${start.id ?? 'spawn'} → ${end.id}`);
    let from = start;
    for (const to of path) {
      const steps=Math.ceil(Math.hypot(to.x-from.x,to.y-from.y));
      for(let i=1;i<=steps;i++) assert(canStand(place,from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps),`${place}: route cuts an obstacle`);
      from=to;
    }
  }
  for(const point of scene.spots.filter(p=>p.place)) {
    const entry=entrance(point.place,place);
    assert(canStand(point.place,entry.x,entry.y),`${place} → ${point.place} entrance`);
    assert(pathTo(point.place,entry,SCENES[point.place].spawn).length,'Entrance connects to scene');
  }
}
for(const [x,y] of [[423,210],[565,211],[308,360],[193,150]]) assert(!canStand('garden',x,y));
assert(canStand('garden',938,282));
console.log('World routes, workshop obstacles and return entrances passed.');
