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
export function createHeroScene(host, { compact, lowDetail = compact, onContextLost }) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { alpha: true, antialias: !lowDetail, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!context) throw new Error('WebGL2 unavailable');
    const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: !lowDetail });
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
        const cylinderGeometry = keep(new CylinderGeometry(1, 1, 1, lowDetail ? 10 : 16));
        const sphereGeometry = keep(new SphereGeometry(1, lowDetail ? 8 : 12, 8));
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
        // Same five stations; a folded path retains the complete system on phones.
        const xs = compact ? [-2.25, 0, 2.25, 1.45, -1.45] : [-8.8, -4.4, 0, 4.4, 8.8];
        const zs = compact ? [-1.5, -1.5, -1.5, 1.65, 1.65] : [0, 0, 0, 0, 0];
        const stationScale = compact ? .6 : 1;
        const indicators = xs.map((_, i) => keep(new MeshBasicMaterial({ color: i < 2 ? 0xf59e42 : 0x3bd6ff })));
        const stations = xs.map((x, i) => {
            const group = new Group(); group.position.set(x, 0, zs[i]); group.scale.setScalar(stationScale); scene.add(group);
            box(group, mat.base, [0, -.22, 0], [3.25, .38, 2.35]);
            box(group, mat.steel, [0, -.005, 0], [3.12, .05, 2.22]);
            box(group, indicators[i], [-.88, -.18, 1.19], [1.2, .035, .035]);
            return group;
        });
        // ESP32 development board, RF shield, chip, USB socket and pin headers.
        const pcb = new Group(); stations[0].add(pcb); pcb.position.y = .85; pcb.rotation.x = .48;
        box(pcb, mat.board, [0, 0, 0], [1.55, .12, 2.35]);
        box(pcb, mat.steel, [0, .18, -.37], [1.04, .24, 1.15]);
        box(pcb, mat.dark, [0, .13, .52], [.6, .17, .5]);
        box(pcb, mat.steel, [0, .13, 1.11], [.55, .25, .4]);
        box(pcb, mat.dark, [0, .14, 1.32], [.4, .13, .025]);
        for (const x of [-.68, .68]) for (let i = 0; i < (lowDetail ? 7 : 13); i++) {
            box(pcb, mat.brass, [x, .12, -.97 + i * (lowDetail ? .30 : .16)], [.08, .3, .07]);
        }
        if (!lowDetail) for (let i = 0; i < 5; i++) box(pcb, mat.brass, [-.34 + i * .17, .08, -1.03], [.045, .02, .3]);
        box(pcb, indicators[0], [.44, .1, .7], [.08, .03, .1]);
        // Industrial sensor, threaded body and sensing face.
        cylinder(stations[1], mat.dark, [0, .35, 0], .5, .7);
        cylinder(stations[1], mat.steel, [0, .94, 0], .35, .65);
        cylinder(stations[1], mat.dark, [0, 1.34, 0], .42, .18);
        cylinder(stations[1], indicators[1], [0, 1.44, 0], .3, .025);
        if (!lowDetail) for (let i = 0; i < 5; i++) cylinder(stations[1], mat.base, [0, .7 + i * .11, 0], .365, .035);
        // Outdoor LoRa enclosure and antenna.
        box(stations[2], mat.steel, [0, 1, 0], [1.22, 1.8, .65]);
        box(stations[2], mat.base, [0, 1, .345], [.98, 1.5, .05]);
        cylinder(stations[2], mat.dark, [.38, 2.52, 0], .045, 1.4);
        cylinder(stations[2], mat.brass, [.38, 1.9, 0], .10, .2);
        box(stations[2], indicators[2], [-.27, .49, .385], [.08, .04, .04]);
        // Stylized collaborative arm; the wrist responds by a few degrees.
        cylinder(stations[3], mat.base, [0, .22, 0], .7, .44);
        const arm = new Group(); stations[3].add(arm);
        const joints = [[0, .65, 0], [-.65, 2.2, 0], [.8, 2.8, 0], [1.3, 1.8, 0]];
        joints.forEach((p, i) => {
            mesh(arm, sphereGeometry, mat.steel, p, [.30, .30, .30]);
            if (i) beam(arm, mat.steel, joints[i - 1], p, .34);
            const cap = cylinder(arm, mat.base, [p[0], p[1], .25], .22, .08); cap.rotation.x = Math.PI / 2;
        });
        const wrist = new Group(); wrist.position.set(1.3, 1.8, 0); arm.add(wrist);
        box(wrist, mat.dark, [0, -.27, 0], [.42, .32, .35]);
        for (const x of [-.22, .22]) box(wrist, mat.steel, [x, -.57, 0], [.075, .45, .14]);
        box(stations[3], mat.amber, [1.22, .15, 0], [.25, .25, .25]);
        // A small physical plant becomes a digital wireframe at the last station.
        const twinMaterial = keep(new LineBasicMaterial({ color: 0x3bd6ff, transparent: true, opacity: .28 }));
        const twinOutline = keep(new LineBasicMaterial({ color: 0x3bd6ff, transparent: true, opacity: .16 }));
        const twin = new Group(); stations[4].add(twin);
        const twinParts = [];
        const wire = (geometry, pos, scale) => {
            const edges = keep(new EdgesGeometry(geometry));
            const object = new LineSegments(edges, twinMaterial); object.position.set(...pos); object.scale.set(...scale); twin.add(object);
            twinParts.push(object);
        };
        wire(boxGeometry, [0, 1.48, 0], [3.1, 2.95, 2]);
        wire(boxGeometry, [-.55, .65, .1], [1.4, 1.1, 1.1]);
        wire(cylinderGeometry, [.9, 1.15, -.3], [.38, 2.25, .38]);
        wire(cylinderGeometry, [-.8, 1.95, -.55], [.21, 1.6, .21]);
        for (let i = 0; i < 3; i++) wire(boxGeometry, [0, .5 + i * .65, 0], [2.9, .015, 1.9]);
        // Reuse the wireframe itself. Sort its edges by height once, then reveal
        // existing segments in two material groups; no clipping shader or new mesh.
        twin.updateMatrix();
        const edgePieces = twinParts.map((part) => {
            part.updateMatrix();
            return part.geometry.clone().applyMatrix4(part.matrix);
        });
        const twinGeometry = keep(mergeGeometries(edgePieces));
        edgePieces.forEach((geometry) => geometry.dispose());
        twinParts.forEach((part) => part.removeFromParent());
        const positions = twinGeometry.getAttribute('position');
        const segments = Array.from({ length: positions.count / 2 }, (_, i) => i);
        segments.sort((a, b) => Math.max(positions.getY(a * 2), positions.getY(a * 2 + 1)) - Math.max(positions.getY(b * 2), positions.getY(b * 2 + 1)));
        const sorted = new Float32Array(positions.array.length);
        segments.forEach((segment, i) => sorted.set(positions.array.subarray(segment * 6, segment * 6 + 6), i * 6));
        positions.array.set(sorted);
        positions.needsUpdate = true;
        twinGeometry.addGroup(0, 0, 0);
        twinGeometry.addGroup(0, positions.count, 1);
        twin.add(new LineSegments(twinGeometry, [twinMaterial, twinOutline]));
        // Quiet rails and a few structural beams establish depth, no particles.
        box(scene, mat.base, [0, compact ? -.3 : -.48, 0], [compact ? 6.8 : 23, .1, compact ? 4.8 : 3]);
        if (!lowDetail) {
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
            const front = stationScale * 1.4;
            const start = new Vector3(xs[i], y, zs[i] + front);
            const end = new Vector3(xs[i + 1], y, zs[i + 1] + front);
            const corner = new Vector3(end.x, y, start.z);
            // Route LoRa around the platform edge to the front row.
            if (compact && i === 2) corner.set(start.x, y, end.z);
            const points = [...start.toArray(), ...corner.toArray(), ...end.toArray()];
            const geometry = keep(new BufferGeometry()); geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
            geometry.setIndex([0, 1, 1, 2]);
            const material = keep(new LineBasicMaterial({ color: 0x16b8e6, transparent: true, opacity: .25 }));
            scene.add(new LineSegments(geometry, material));
            const packet = mesh(scene, sphereGeometry, i === 0 ? mat.amber : mat.blue, start.toArray(), [compact ? .04 : .055, .055, .055]);
            if (i === 0) material.color.setHex(0xf59e42);
            const firstLength = start.distanceTo(corner);
            links.push({ material, packet, start, corner, end, split: firstLength / (firstLength + corner.distanceTo(end)) });
        }
        scene.add(new HemisphereLight(0xb5dfff, 0x14212e, 2.4));
        const key = new DirectionalLight(0xc5e5ff, 3.4); key.position.set(-3, 7, 5); scene.add(key);
        if (!lowDetail) { const warm = new DirectionalLight(0xf5b366, 2); warm.position.set(-7, 3, -4); scene.add(warm); }
        const anchors = xs.map((x, i) => new Vector3(x, compact && i >= 3 ? -.23 * stationScale : stationScale * [1.55, 1.47, 3.22, 3.12, 2.98][i], zs[i] + (compact && i >= 3 ? stationScale * 1.19 : 0)));
        const projected = new Vector3();
        const arrivals = [0, .18, .38, .58, .78];
        const departures = [.08, .27, .47, .67];
        const labelWidths = new Float32Array(compact ? [70, 85, 57, 85, 120] : [78, 96, 70, 96, 130]);
        const labelHeights = new Float32Array(5).fill(30);
        const labelXs = new Float32Array(5), labelYs = new Float32Array(5), anchorXs = new Float32Array(5);
        const labelRows = compact ? [[0, 1, 2], [4, 3]] : [[0, 1, 2, 3, 4]];
        let labelsMeasured = false;
        let width = 1, height = 1, dpr = lowDetail ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
        host.append(canvas);
        return {
            resize(w, h) { width = w; height = h; renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); labelsMeasured = false; },
            reduceQuality() { dpr = .85; renderer.setPixelRatio(dpr); renderer.setSize(width, height, false); },
            render(progress, labels, reduced = false) {
                rig.update(progress, width, height, compact);
                let step = 0;
                for (let i = 1; i < 5; i++) if (progress >= arrivals[i]) step = i;
                for (let i = 0; i < links.length; i++) {
                    const link = links[i];
                    const local = MathUtils.smoothstep(progress, departures[i], arrivals[i + 1]);
                    link.material.opacity = .15 + local * .55;
                    if (local <= link.split) link.packet.position.lerpVectors(link.start, link.corner, local / link.split);
                    else link.packet.position.lerpVectors(link.corner, link.end, (local - link.split) / (1 - link.split));
                    link.packet.visible = !reduced && local > 0 && local < 1;
                }
                for (let i = 0; i < indicators.length; i++) {
                    const material = indicators[i];
                    const enter = i === 0 ? 1 : MathUtils.smoothstep(progress, arrivals[i] - .025, arrivals[i] + .025);
                    const leave = i === 4 ? 0 : MathUtils.smoothstep(progress, arrivals[i + 1] - .025, arrivals[i + 1] + .025);
                    const pulse = i === 1 && !reduced ? Math.sin(Math.PI * MathUtils.smoothstep(progress, .18, .27)) * .14 : 0;
                    material.color.setHex(i < 2 ? 0xf59e42 : 0x3bd6ff).multiplyScalar(.32 + enter * .30 + (enter - leave) * .38 + pulse);
                }
                // A short six-degree wrist excursion, pivoted on the existing joint.
                wrist.rotation.z = reduced ? 0 : -.105 * Math.sin(Math.PI * MathUtils.smoothstep(progress, .58, .67));
                const build = MathUtils.smoothstep(progress, .78, .92);
                const litVertices = 2 * Math.floor(segments.length * (.07 + .93 * build));
                twinGeometry.groups[0].count = litVertices;
                twinGeometry.groups[1].start = litVertices;
                twinGeometry.groups[1].count = positions.count - litVertices;
                twinOutline.visible = build < 1;
                twinMaterial.opacity = .28 + .65 * build;
                if (!labelsMeasured && labels[0]?.offsetWidth) {
                    labels.forEach((label, i) => { labelWidths[i] = label.offsetWidth; labelHeights[i] = label.offsetHeight; });
                    labelsMeasured = true;
                }
                for (let i = 0; i < labels.length; i++) {
                    const label = labels[i];
                    projected.copy(anchors[i]).project(rig.camera);
                    const x = (projected.x * .5 + .5) * width;
                    const y = (-projected.y * .5 + .5) * height;
                    const visible = Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && projected.z < 1;
                    label.hidden = !visible;
                    const halfWidth = labelWidths[i] / 2;
                    anchorXs[i] = x;
                    labelXs[i] = Math.max(halfWidth + 8, Math.min(width - halfWidth - 8, x));
                    const below = compact && i >= 3;
                    labelYs[i] = below ? Math.min(height - labelHeights[i] - 8, y + 14) : Math.max(labelHeights[i] + 8, y - 14);
                }
                // Pack only when necessary; leaders stay attached to projected
                // anchors. Buffers and row order are reused throughout the scroll.
                for (const row of labelRows) {
                    for (let j = 1; j < row.length; j++) {
                        const i = row[j], previous = row[j - 1];
                        labelXs[i] = Math.max(labelXs[i], labelXs[previous] + (labelWidths[previous] + labelWidths[i]) / 2 + 6);
                    }
                    const last = row[row.length - 1];
                    labelXs[last] = Math.min(labelXs[last], width - labelWidths[last] / 2 - 8);
                    for (let j = row.length - 2; j >= 0; j--) {
                        const i = row[j], next = row[j + 1];
                        labelXs[i] = Math.min(labelXs[i], labelXs[next] - (labelWidths[next] + labelWidths[i]) / 2 - 6);
                    }
                }
                for (let i = 0; i < labels.length; i++) {
                    const label = labels[i], below = compact && i >= 3;
                    label.style.transform = `translate(${labelXs[i].toFixed(1)}px, ${labelYs[i].toFixed(1)}px) translate(-50%, ${below ? '0' : '-100%'})`;
                    label.style.setProperty('--guide-x', `${(anchorXs[i] - labelXs[i]).toFixed(1)}px`);
                    label.classList.toggle('is-below', below);
                    label.classList.toggle('is-active', reduced || i === step);
                    label.classList.toggle('is-complete', progress >= arrivals[i] && i < step);
                }
                renderer.render(scene, rig.camera);
            },
            dispose: cleanup,
        };
    } catch (error) { cleanup(); throw error; }
}
