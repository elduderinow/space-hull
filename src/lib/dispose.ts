type Disposable = { dispose: () => void };

const queue: Disposable[] = [];
let scheduled = false;

function flush() {
  scheduled = false;
  for (const item of queue.splice(0, queue.length)) item.dispose();
}

/**
 * Disposes a geometry two frames after whatever replaced it went on screen.
 *
 * React effects run between frames, but the renderer's last frame still holds
 * the geometry it drew, and taking its buffers away mid-flight loses the WebGPU
 * device. Waiting is the whole point: by the next frame the mesh is carrying the
 * new geometry and nothing refers to the old one.
 *
 * A shared queue rather than a timer per geometry, because a slider drag
 * replaces faster than the frames arrive and a per-call schedule would keep
 * cancelling itself and never free anything.
 */
export function disposeSoon(item: Disposable) {
  queue.push(item);
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => requestAnimationFrame(flush));
}
