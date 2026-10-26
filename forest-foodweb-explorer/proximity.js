export const ENTER_DISTANCE = 3.2;
export const EXIT_DISTANCE = 4;
// Use ground-plane distance so elevated birds and trees can be observed too.
export function getNearby(player, objects, currentId = null) {
  const measured = objects.map(o => ({ ...o, distance: Math.hypot(player.x-o.x,player.z-o.z) }));
  const nearby = measured.filter(o => o.distance <= ENTER_DISTANCE).sort((a,b) => a.distance-b.distance);
  const current = measured.find(o => o.id === currentId && o.distance <= EXIT_DISTANCE);
  // Small hysteresis prevents rapid switching at the boundary or between neighbours.
  const closest = nearby[0];
  const focused = current && (!closest || current.distance <= closest.distance + .6) ? current : closest || null;
  return { nearby, focused };
}
