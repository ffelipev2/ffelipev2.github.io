// Stateless pick-and-place: seeking backwards retraces the same grasp precisely.
const PICK_X = 1.18, PICK_Z = .48, DROP_X = -.95, DROP_Z = .72;
const PICK_YAW = -Math.atan2(PICK_Z, PICK_X), DROP_YAW = -Math.atan2(DROP_Z, DROP_X);
const PICK_RADIUS = Math.hypot(PICK_X, PICK_Z), DROP_RADIUS = Math.hypot(DROP_X, DROP_Z);
const FIRST = Math.hypot(.65, 1.55), SECOND = Math.hypot(1.45, .6);
const smooth = (value, start, end) => {
    const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const xyz = (array, x, y, z, offset = 0) => { array[offset] = x; array[offset + 1] = y; array[offset + 2] = z; };

export function createRobotMotion() {
    const pose = { joints: new Float32Array(12), grip: new Float32Array(3), cube: new Float32Array(3), yaw: 0, cubeYaw: PICK_YAW, opening: .30, held: false };
    return {
        update(phase, reduced = false) {
            const p = reduced ? 1 : phase;
            const approach = smooth(p, .635, .70), lift = smooth(p, .73, .78);
            const carry = smooth(p, .78, .85), lower = smooth(p, .85, .90);
            const retreat = smooth(p, .925, .95), home = smooth(p, .95, 1);
            let radius = mix(1.3, PICK_RADIUS, approach);
            radius = mix(radius, DROP_RADIUS, carry);
            radius = mix(radius, 1.3, home);
            pose.yaw = mix(mix(0, PICK_YAW, approach), DROP_YAW, carry) * (1 - home);
            const gripY = mix(1.23, .19, approach) + .81 * lift - .81 * lower + 1.04 * retreat;
            pose.opening = .30 - .0925 * smooth(p, .70, .73) + .0925 * smooth(p, .90, .925);
            xyz(pose.grip, radius * Math.cos(pose.yaw), gripY, -radius * Math.sin(pose.yaw));
            pose.held = p >= .73 && p <= .90;
            if (p < .73) { xyz(pose.cube, PICK_X, .19, PICK_Z); pose.cubeYaw = PICK_YAW; }
            else if (p <= .90) { pose.cube.set(pose.grip); pose.cubeYaw = pose.yaw; }
            else { xyz(pose.cube, DROP_X, .19, DROP_Z); pose.cubeYaw = DROP_YAW; }

            // Solve the original first two links; retain the final sloping link
            // and vertical gripper. Their lengths never stretch during a grasp.
            const wristX = radius, wristY = gripY + .57;
            const targetX = wristX - .5, targetY = wristY + 1 - .65;
            const distance = Math.hypot(targetX, targetY);
            const cosine = Math.max(-1, Math.min(1, (FIRST * FIRST + distance * distance - SECOND * SECOND) / (2 * FIRST * distance)));
            const shoulder = Math.atan2(targetY, targetX) + Math.acos(cosine);
            xyz(pose.joints, 0, .65, 0);
            xyz(pose.joints, FIRST * Math.cos(shoulder), .65 + FIRST * Math.sin(shoulder), 0, 3);
            xyz(pose.joints, targetX, wristY + 1, 0, 6);
            xyz(pose.joints, wristX, wristY, 0, 9);
            return pose;
        },
    };
}
