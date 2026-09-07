import { PerspectiveCamera, Vector3, MathUtils } from 'three';

// Fixed FOV, gentle lateral dolly, no orbit or pointer controls.
export function createCameraRig() {
    const camera = new PerspectiveCamera(34, 1, 0.1, 90);
    const target = new Vector3();
    return {
        camera,
        update(progress, width, height, compact) {
            const t = MathUtils.smoothstep(progress, 0, 1);
            camera.aspect = width / height;
            const distance = compact ? 10.8 : Math.max(10.6, 12.8 / (camera.aspect * Math.tan(17 * Math.PI / 180)));
            const lateral = compact ? -2.5 + t * 5 : t * 2.5;
            target.set(lateral, compact ? 0.75 : 1.25, 0);
            camera.position.set(lateral + (compact ? 0.6 : 1.5), distance * (0.40 - t * 0.035), distance * (1 - t * (compact ? 0.015 : 0.065)));
            camera.lookAt(target);
            camera.updateProjectionMatrix();
            camera.updateMatrixWorld();
        },
    };
}
