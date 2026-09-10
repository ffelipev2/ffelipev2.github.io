// Scroll owns the sequence. Finish a bounded catch-up, then rest without a timer.
export const STATION_PHASES = [.20, .35, .50, .65, .86];
export const DEPARTURE_PHASES = [.27, .42, .57, .77];
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const envelope = (phase, start, end) => {
    const t = clamp01((phase - start) / (end - start));
    return Math.sin(t * Math.PI) ** 2;
};

export function createAnimationSequence({ mobile = false } = {}) {
    const state = { phase: 0, active: false, pulses: new Float32Array(5), scanner: 0, sync: 0 };
    return {
        reset() {
            state.phase = 0; state.active = false;
            state.pulses.fill(0); state.scanner = 0; state.sync = 0;
        },
        update(delta, scroll, reduced) {
            if (reduced) {
                state.phase = 1; state.active = false;
                state.pulses.fill(0); state.scanner = 0; state.sync = 0;
                return state;
            }
            // Only effects catch up to fast gestures; camera/page follow native
            // scrolling directly. Elapsed time can never select another stage.
            const target = clamp01(scroll);
            const distance = target - state.phase;
            // Give the grasp and rotation time to read, including after a fling.
            const inRobot = Math.max(target, state.phase) > .635 && Math.min(target, state.phase) < 1;
            const speed = inRobot && state.phase >= .635 ? (mobile ? .15 : .22) : (mobile ? .35 : .55);
            const step = Math.max(0, Math.min(delta, .064)) * speed;
            state.phase += Math.sign(distance) * Math.min(Math.abs(distance), step);
            state.active = Math.abs(target - state.phase) > .0001;
            if (!state.active) state.phase = target;
            for (let i = 0; i < 5; i++) state.pulses[i] = envelope(state.phase, STATION_PHASES[i] - .025, STATION_PHASES[i] + .11);
            state.scanner = envelope(state.phase, .79, .98);
            state.sync = envelope(state.phase, .86, 1);
            return state;
        },
    };
}
