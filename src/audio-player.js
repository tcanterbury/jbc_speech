export function activateSymbol(event, item, insert, preview) {
  // Shift-click always takes the preview path, even if no recording exists.
  return event.shiftKey ? preview(item) : insert(item);
}

export function createAudioPlayer(makeAudio, report) {
  let active;
  let generation = 0;
  function stop() {
    generation++;
    if (active) {
      active.onended = null;
      active.onerror = null;
      active.pause();
      active.removeAttribute('src');
      active.load();
      active = undefined;
    }
  }
  async function play(paths, label) {
    stop();
    if (!paths.length) { report('missing', label); return; }
    const token = generation;
    let index = 0;
    async function next() {
      if (token !== generation) return;
      const audio = makeAudio();
      active = audio;
      audio.preload = 'none';
      audio.src = paths[index];
      audio.onended = () => {
        if (token !== generation) return;
        if (++index < paths.length) void next();
        else { stop(); report('ended', label); }
      };
      function failed(error) {
        if (token !== generation) return;
        stop();
        report('error', label, error);
      }
      audio.onerror = failed;
      report('playing', `${label}${paths.length > 1 ? ` · example ${index + 1}/${paths.length}` : ''}`);
      try { await audio.play(); } catch (error) { failed(error); }
    }
    await next();
  }
  return { play, stop };
}
