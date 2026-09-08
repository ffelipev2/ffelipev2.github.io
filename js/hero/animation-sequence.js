// One clock for automatic playback and scroll. Quiet intervals need no RAF.
export const STATION_PHASES = [.20, .35, .50, .65, .86];
export const DEPARTURE_PHASES = [.27, .42, .57, .77];
const PERIOD = 5.6;
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const envelope = (phase, start, end) => {
    const t = clamp01((phase - start) / (end - start));
    return Math.sin(t * Math.PI) ** 2;
};

export function createAnimationSequence() {
    let clock = 0, lastScroll = 0, manualUntil = -1, automatic = true;
    const state = { phase: 0, active: false, wakeAfter: 0, pulses: new Float32Array(5), scanner: 0, sync: 0 };
    return {
        update(delta, scroll, reduced) {
            if (reduced) {
                state.phase = 1; state.active = false; state.wakeAfter = 0;
                state.pulses.fill(0); state.scanner = 0; state.sync = 0;
                return state;
            }
            clock += delta;
            if (Math.abs(scroll - lastScroll) > .0001) { manualUntil = clock + 2; automatic = false; }
            lastScroll = scroll;
            if (clock < manualUntil) {
                // Only the effects catch up to fast gestures; the camera and page
                // retain their existing direct response to native scroll.
                const distance = scroll - state.phase;
                const step = Math.min(delta, .064) * .72;
                state.phase += Math.sign(distance) * Math.min(Math.abs(distance), step);
                state.active = Math.abs(scroll - state.phase) > .0001;
                state.wakeAfter = state.active ? 0 : Math.max(0, manualUntil - clock);
            } else {
                if (!automatic) { clock = state.phase * PERIOD; automatic = true; }
                state.phase = (clock % PERIOD) / PERIOD;
                state.active = state.phase >= .20;
                state.wakeAfter = state.active ? 0 : (.20 - state.phase) * PERIOD;
            }
            for (let i = 0; i < 5; i++) state.pulses[i] = envelope(state.phase, STATION_PHASES[i] - .025, STATION_PHASES[i] + .11);
            state.scanner = envelope(state.phase, .79, .98);
            state.sync = envelope(state.phase, .86, 1);
            return state;
        },
    };
}
