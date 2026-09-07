import {
    Scene, Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, LineBasicMaterial,
    BoxGeometry, CylinderGeometry, SphereGeometry, BufferGeometry, Float32BufferAttribute,
    EdgesGeometry, LineSegments, Vector3, HemisphereLight, DirectionalLight,
    WebGLRenderer, SRGBColorSpace, ACESFilmicToneMapping, MathUtils,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCameraRig } from './camera-rig.js';

// Original stylized geometry, not manufacturer CAD. Replace individual stations
// with licensed low-poly assets here if more exact product shapes are needed.
export function createHeroScene(host, { compact, onContextLost }) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { alpha: true, antialias: !compact, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!context) throw new Error('WebGL2 unavailable');
    const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: !compact });
    const scene = new Scene();
    const resources = new Set();
    const keep = (resource) => { resources.add(resource); return resource; };
    let disposed = false;
    const cleanup = () => {
        if (disposed) return;
        disposed = true;
        canvas.removeEventListener('webglcontextlost', lost);
        resources.forEach((resource) => resource.dispose());
        scene.clear();
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
    };
    const lost = (event) => { event.preventDefault(); onContextLost(); };
    canvas.addEventListener('webglcontextlost', lost);
    try {
        renderer.setClearColor(0x07111f, 0);
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        const rig = createCameraRig();
        const material = (color, metalness = .35, roughness = .55) => keep(new MeshStandardMaterial({ color, metalness, roughness }));
        const mat = {
            base: material(0x142536, .55), steel: material(0xabb8c4, .62, .38),
            dark: material(0x09151e, .2), board: material(0x123c3b, .2),
            brass: material(0xb28650, .68), amber: keep(new MeshBasicMaterial({ color: 0xf59e42 })),
            blue: keep(new MeshBasicMaterial({ color: 0x3bd6ff })),
        };
        const boxGeometry = keep(new BoxGeometry(1, 1, 1));
        const cylinderGeometry = keep(new CylinderGeometry(1, 1, 1, compact ? 10 : 16));
        const sphereGeometry = keep(new SphereGeometry(1, compact ? 8 : 12, 8));
        const mesh = (parent, geometry, material, position, scale) => {
            const object = new Mesh(geometry, material);
            object.position.set(...position); object.scale.set(...scale); parent.add(object);
            return object;
        };
        const box = (parent, material, pos, size) => mesh(parent, boxGeometry, material, pos, size);
        const cylinder = (parent, material, pos, radius, height) => mesh(parent, cylinderGeometry, material, pos, [radius, height, radius]);
        const beam = (parent, material, a, b, thickness) => {
            const start = new Vector3(...a), end = new Vector3(...b);
            const object = box(parent, material, start.clone().add(end).multiplyScalar(.5).toArray(), [thickness, start.distanceTo(end), thickness]);
            object.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), end.sub(start).normalize());
            return object;
        };
        const xs = compact ? [-4.4, -2.2, 0, 2.2, 4.4] : [-8.8, -4.4, 0, 4.4, 8.8];
        const stations = xs.map((x) => {
            const group = new Group(); group.position.x = x; group.scale.setScalar(compact ? .54 : 1); scene.add(group);
            box(group, mat.base, [0, -.22, 0], [3.25, .38, 2.35]);
            box(group, mat.steel, [0, -.005, 0], [3.12, .05, 2.22]);
            box(group, mat.amber, [-.88, -.18, 1.19], [1.2, .035, .035]);
            return group;
        });
        // ESP32 development board, RF shield, chip, USB socket and pin headers.
        const pcb = new Group(); stations[0].add(pcb); pcb.position.y = .85; pcb.rotation.x = .48;
        box(pcb, mat.board, [0, 0, 0], [1.55, .12, 2.35]);
        box(pcb, mat.steel, [0, .18, -.37], [1.04, .24, 1.15]);
        box(pcb, mat.dark, [0, .13, .52], [.6, .17, .5]);
        box(pcb, mat.steel, [0, .13, 1.11], [.55, .25, .4]);
        box(pcb, mat.dark, [0, .14, 1.32], [.4, .13, .025]);
        for (const x of [-.68, .68]) for (let i = 0; i < (compact ? 7 : 13); i++) {
            box(pcb, mat.brass, [x, .12, -.97 + i * (compact ? .30 : .16)], [.08, .3, .07]);
        }
        if (!compact) for (let i = 0; i < 5; i++) box(pcb, mat.brass, [-.34 + i * .17, .08, -1.03], [.045, .02, .3]);
        box(pcb, mat.amber, [.44, .1, .7], [.08, .03, .1]);
        // Industrial sensor, threaded body and sensing face.
        cylinder(stations[1], mat.dark, [0, .35, 0], .5, .7);
        cylinder(stations[1], mat.steel, [0, .94, 0], .35, .65);
        cylinder(stations[1], mat.dark, [0, 1.34, 0], .42, .18);
        cylinder(stations[1], mat.amber, [0, 1.44, 0], .3, .025);
        if (!compact) for (let i = 0; i < 5; i++) cylinder(stations[1], mat.base, [0, .7 + i * .11, 0], .365, .035);
        // Outdoor LoRa enclosure and antenna.
        box(stations[2], mat.steel, [0, 1, 0], [1.22, 1.8, .65]);
        box(stations[2], mat.base, [0, 1, .345], [.98, 1.5, .05]);
        cylinder(stations[2], mat.dark, [.38, 2.52, 0], .045, 1.4);
        cylinder(stations[2], mat.brass, [.38, 1.9, 0], .10, .2);
        box(stations[2], mat.blue, [-.27, .49, .385], [.08, .04, .04]);
        // Stylized collaborative arm; the wrist responds by a few degrees.
        cylinder(stations[3], mat.base, [0, .22, 0], .7, .44);
        const arm = new Group(); stations[3].add(arm);
        const joints = [[0, .65, 0], [-.65, 2.2, 0], [.8, 2.8, 0], [1.3, 1.8, 0]];
        joints.forEach((p, i) => {
            mesh(arm, sphereGeometry, mat.steel, p, [.30, .30, .30]);
            if (i) beam(arm, mat.steel, joints[i - 1], p, .34);
            const cap = cylinder(arm, mat.base, [p[0], p[1], .25], .22, .08); cap.rotation.x = Math.PI / 2;
        });
        const wrist = new Group(); wrist.position.set(1.3, 1.65, 0); arm.add(wrist);
        box(wrist, mat.dark, [0, -.12, 0], [.42, .32, .35]);
        for (const x of [-.22, .22]) box(wrist, mat.steel, [x, -.42, 0], [.075, .45, .14]);
        box(stations[3], mat.amber, [1.22, .15, 0], [.25, .25, .25]);
        // A small physical plant becomes a digital wireframe at the last station.
        const twinMaterial = keep(new LineBasicMaterial({ color: 0x3bd6ff, transparent: true, opacity: .65 }));
        const twin = new Group(); stations[4].add(twin);
        const wire = (geometry, pos, scale) => {
            const edges = keep(new EdgesGeometry(geometry));
            const object = new LineSegments(edges, twinMaterial); object.position.set(...pos); object.scale.set(...scale); twin.add(object);
        };
        wire(boxGeometry, [0, 1.48, 0], [3.1, 2.95, 2]);
        wire(boxGeometry, [-.55, .65, .1], [1.4, 1.1, 1.1]);
        wire(cylinderGeometry, [.9, 1.15, -.3], [.38, 2.25, .38]);
        wire(cylinderGeometry, [-.8, 1.95, -.55], [.21, 1.6, .21]);
        for (let i = 0; i < 3; i++) wire(boxGeometry, [0, .5 + i * .65, 0], [2.9, .015, 1.9]);
        // Quiet rails and a few structural beams establish depth, no particles.
        box(scene, mat.base, [0, compact ? -.3 : -.48, 0], [compact ? 11 : 23, .1, compact ? 1.5 : 3]);
        if (!compact) {
            for (const z of [-2.4, 2.4]) box(scene, mat.base, [0, -.6, z], [26, .14, .12]);
            for (const x of [-12, -6, 0, 6, 12]) box(scene, mat.base, [x, 1.5, -4], [.12, 5, .12]);
        }
        // Merge static geometry per material: pins do not each cost a draw call.
        const batches = new Map();
        scene.updateMatrixWorld(true);
        scene.traverse((object) => {
            if (!object.isMesh || object.parent === wrist) return;
            const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
            if (!batches.has(object.material)) batches.set(object.material, []);
            batches.get(object.material).push({ geometry, object });
        });
        for (const [material, entries] of batches) {
            const merged = keep(mergeGeometries(entries.map((entry) => entry.geometry)));
            scene.add(new Mesh(merged, material));
            entries.forEach(({ geometry, object }) => { geometry.dispose(); object.removeFromParent(); });
        }
        const links = [];
        for (let i = 0; i < 4; i++) {
            const y = compact ? .05 : .08;
            const z = compact ? .75 : 1.4;
            const points = [xs[i], y, z, xs[i] + (xs[i + 1] - xs[i]) * .5, y, z, xs[i + 1], y, z];
            const geometry = keep(new BufferGeometry()); geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
            geometry.setIndex([0, 1, 1, 2]);
            const material = keep(new LineBasicMaterial({ color: 0x16b8e6, transparent: true, opacity: .25 }));
            scene.add(new LineSegments(geometry, material));
            const packet = mesh(scene, sphereGeometry, mat.blue, [xs[i], y, z], [compact ? .035 : .055, .055, .055]);
            links.push({ material, packet, start: xs[i], end: xs[i + 1] });
        }
        scene.add(new HemisphereLight(0xb5dfff, 0x14212e, 2.4));
        const key = new DirectionalLight(0xc5e5ff, 3.4); key.position.set(-3, 7, 5); scene.add(key);
        if (!compact) { const warm = new DirectionalLight(0xf5b366, 2); warm.position.set(-7, 3, -4); scene.add(warm); }
        const anchors = xs.map((x, i) => new Vector3(x, (compact ? .54 : 1) * [1.65, 1.9, 3.5, 3.35, 3.35][i], 0));
        const projected = new Vector3();
        let width = 1, height = 1, dpr = compact ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
        host.append(canvas);
        return {
            resize(w, h) { width = w; height = h; renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); },
            reduceQuality() { dpr = .85; renderer.setPixelRatio(dpr); renderer.setSize(width, height, false); },
            render(progress, labels) {
                rig.update(progress, width, height, compact);
                const step = Math.min(4, Math.floor(progress * 5));
                links.forEach((link, i) => {
                    const local = MathUtils.clamp(progress * 4 - i, 0, 1);
                    link.material.opacity = .18 + local * .72;
                    link.packet.position.x = MathUtils.lerp(link.start, link.end, local);
                    link.packet.visible = local > 0 && local < 1;
                });
                wrist.rotation.z = -.12 * MathUtils.smoothstep(progress, .55, .85);
                twinMaterial.opacity = .38 + .55 * MathUtils.smoothstep(progress, .65, 1);
                labels.forEach((label, i) => {
                    projected.copy(anchors[i]).project(rig.camera);
                    const x = (projected.x * .5 + .5) * width;
                    const y = (-projected.y * .5 + .5) * height;
                    const visible = Math.abs(projected.x) < .91 && projected.z < 1 && (!compact || i === step);
                    label.hidden = !visible;
                    const labelX = Math.max(80, Math.min(width - 80, x));
                    label.style.transform = `translate(${labelX.toFixed(1)}px, ${Math.max(30, y).toFixed(1)}px) translate(-50%, -100%)`;
                    label.classList.toggle('is-active', i === step);
                });
                renderer.render(scene, rig.camera);
            },
            dispose: cleanup,
        };
    } catch (error) { cleanup(); throw error; }
}
