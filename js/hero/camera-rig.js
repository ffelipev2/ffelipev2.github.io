import { PerspectiveCamera, Vector3, MathUtils } from 'three';

// Fixed FOV, gentle lateral dolly, no orbit or pointer controls.
export function createCameraRig() {
    const camera = new PerspectiveCamera(34, 1, 0.1, 90);
    const target = new Vector3();
    let aspect = 0;
    return {
        camera,
        update(progress, width, height, compact) {
            // Constant travel per scroll pixel; hold the final composition at 90%.
            const t = MathUtils.clamp(progress / .9, 0, 1);
            if (aspect !== width / height) {
                aspect = width / height;
                camera.aspect = aspect;
                camera.updateProjectionMatrix();
            }
            const distance = compact ? Math.max(9.8, 4.05 / (aspect * Math.tan(17 * Math.PI / 180))) : Math.max(10.8, 13.1 / (aspect * Math.tan(17 * Math.PI / 180)));
            const lateral = compact ? -.10 + t * .20 : -.35 + t * .9;
            target.set(lateral, compact ? .8 : 1.05, 0);
            camera.position.set(lateral + (compact ? .15 : 1.1), distance * (compact ? .78 : .39 - t * .012), distance * (1 - t * (compact ? .008 : .025)));
            camera.lookAt(target);
            camera.updateMatrixWorld();
        },
    };
}
