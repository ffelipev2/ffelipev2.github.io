import {
    Scene, Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, LineBasicMaterial,
    BoxGeometry, CylinderGeometry, SphereGeometry, PlaneGeometry, CanvasTexture, BufferGeometry, Float32BufferAttribute,
    LineSegments, Vector3, HemisphereLight, DirectionalLight, PointLight,
    WebGLRenderer, PMREMGenerator, SRGBColorSpace, ACESFilmicToneMapping, MathUtils,
} from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createCameraRig } from './camera-rig.js';
import { STATION_PHASES, DEPARTURE_PHASES, envelope } from './animation-sequence.js';
import { createNarrativeEffects } from './narrative-effects.js';
import { createRobotMotion } from './robot-motion.js';
import { createRobotAssembly } from './robot-assembly.js';
import { createRadioDisplay } from './radio-display.js';
export { createAnimationSequence } from './animation-sequence.js';

// Original stylized geometry, not manufacturer CAD. Replace individual stations
// with licensed low-poly assets here if more exact product shapes are needed.
export function createHeroScene(host, { compact, onContextLost }) {
    const canvas = document.createElement('canvas');
    // Keep the low-poly geometry lightweight without sacrificing edge quality.
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!context) throw new Error('WebGL2 unavailable');
    const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
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
        // Small procedural studio reflection, baked once; nothing is downloaded
        // and no reflection cameras or shadow maps run during scrolling.
        const studio = new RoomEnvironment();
        const reflectionGenerator = new PMREMGenerator(renderer);
        try {
            const reflection = keep(reflectionGenerator.fromScene(studio, .025, .1, 100, { size: 128 }));
            scene.environment = reflection.texture;
            scene.environmentIntensity = .85;
            scene.environmentRotation.y = Math.PI / 6;
        } finally {
            studio.dispose();
            reflectionGenerator.dispose();
        }
        const rig = createCameraRig();
        const material = (color, metalness = .35, roughness = .55) => keep(new MeshStandardMaterial({ color, metalness, roughness }));
        const mat = {
            base: material(0x142536, .45, .48), steel: material(0xabb8c4, .82, .28),
            deck: material(0x344d60, .45, .52),
            dark: material(0x09151e, .12, .7), board: material(0x123c3b, .18, .58),
            brass: material(0xb28650, .8, .3), amber: keep(new MeshBasicMaterial({ color: 0xf59e42 })),
            blue: keep(new MeshBasicMaterial({ color: 0x3bd6ff })),
        };
        // Painted supports stay matte; the hardware carries the studio highlights.
        mat.base.envMapIntensity = .16;
        mat.deck.envMapIntensity = .25;
        mat.dark.envMapIntensity = .18;
        mat.board.envMapIntensity = .28;
        for (const painted of [mat.base, mat.deck, mat.dark, mat.board]) {
            painted.envMap = scene.environment;
            painted.envMapRotation.copy(scene.environmentRotation);
        }
        const boxGeometry = keep(new BoxGeometry(1, 1, 1));
        const bevelSource = new RoundedBoxGeometry(1, 1, 1, 1, .055);
        const beveledGeometry = keep(mergeVertices(bevelSource));
        bevelSource.dispose();
        const cylinderGeometry = keep(new CylinderGeometry(1, 1, 1, 16));
        const sphereGeometry = keep(new SphereGeometry(1, 12, 8));
        const mesh = (parent, geometry, material, position, scale) => {
            const object = new Mesh(geometry, material);
            object.position.set(...position); object.scale.set(...scale); parent.add(object);
            return object;
        };
        const box = (parent, material, pos, size) => mesh(parent, boxGeometry, material, pos, size);
        const beveledBox = (parent, material, pos, size) => mesh(parent, beveledGeometry, material, pos, size);
        const cylinder = (parent, material, pos, radius, height) => mesh(parent, cylinderGeometry, material, pos, [radius, height, radius]);
        // Same five stations; a folded path retains the complete system on phones.
        const xs = compact ? [-2.25, 0, 2.25, 1.45, -1.45] : [-8.8, -4.4, 0, 4.4, 8.8];
        const zs = compact ? [-1.5, -1.5, -1.5, 1.65, 1.65] : [0, 0, 0, 0, 0];
        const stationScale = compact ? .6 : 1;
        // One shared alpha texture grounds the hardware and its platforms. These
        // static contact patches join a single material batch below.
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = shadowCanvas.height = 64;
        const shadowContext = shadowCanvas.getContext('2d');
        const gradient = shadowContext.createRadialGradient(32, 32, 3, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(0,0,0,.85)');
        gradient.addColorStop(.45, 'rgba(0,0,0,.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        shadowContext.fillStyle = gradient;
        shadowContext.fillRect(0, 0, 64, 64);
        const contactTexture = keep(new CanvasTexture(shadowCanvas));
        const contactMaterial = keep(new MeshBasicMaterial({ map: contactTexture, transparent: true, opacity: .8, depthWrite: false, toneMapped: false }));
        const contactGeometry = keep(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
        const contactSizes = [[2.2, 2.1], [1.4, 1.4], [1.7, 1.25], [1.9, 1.9]];
        const indicators = xs.map((_, i) => keep(new MeshBasicMaterial({ color: i < 2 ? 0xf59e42 : 0x3bd6ff })));
        const stations = xs.map((x, i) => {
            const group = new Group(); group.position.set(x, 0, zs[i]); group.scale.setScalar(stationScale); scene.add(group);
            beveledBox(group, mat.base, [0, -.22, 0], [3.25, .38, 2.35]);
            box(group, mat.deck, [0, -.005, 0], [3.12, .05, 2.22]);
            box(group, indicators[i], [-.88, -.18, 1.19], [1.2, .035, .035]);
            if (i < 4) mesh(group, contactGeometry, contactMaterial, [0, .028, 0], [contactSizes[i][0], 1, contactSizes[i][1]]);
            mesh(scene, contactGeometry, contactMaterial, [x, compact ? -.248 : -.425, zs[i]], [3.7 * stationScale, 1, 2.8 * stationScale]);
            return group;
        });
        // ESP32 development board, RF shield, chip, USB socket and pin headers.
        const pcb = new Group(); stations[0].add(pcb); pcb.position.y = .85; pcb.rotation.x = .48;
        box(pcb, mat.board, [0, 0, 0], [1.55, .12, 2.35]);
        beveledBox(pcb, mat.steel, [0, .18, -.37], [1.04, .24, 1.15]);
        box(pcb, mat.dark, [0, .13, .52], [.6, .17, .5]);
        box(pcb, mat.steel, [0, .13, 1.11], [.55, .25, .4]);
        box(pcb, mat.dark, [0, .14, 1.32], [.4, .13, .025]);
        for (const x of [-.68, .68]) for (let i = 0; i < 13; i++) {
            box(pcb, mat.brass, [x, .12, -.97 + i * .16], [.08, .3, .07]);
        }
        for (let i = 0; i < 5; i++) box(pcb, mat.brass, [-.34 + i * .17, .08, -1.03], [.045, .02, .3]);
        // Raised LED lens, separate from the platform strip so its blink reads
        // on the PCB even at the smaller mobile scale. Local halo, no bloom.
        const ledMaterial = keep(new MeshBasicMaterial({ color: 0xff3528, toneMapped: false }));
        box(pcb, mat.dark, [-.43, .13, .72], [.30, .05, .29]);
        box(pcb, ledMaterial, [-.43, .19, .72], [.22, .10, .24]);
        const ledCanvas = document.createElement('canvas');
        ledCanvas.width = ledCanvas.height = 32;
        const ledContext = ledCanvas.getContext('2d');
        const ledGradient = ledContext.createRadialGradient(16, 16, 0, 16, 16, 16);
        ledGradient.addColorStop(0, 'rgba(255,255,255,1)');
        ledGradient.addColorStop(.3, 'rgba(255,255,255,.5)');
        ledGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ledContext.fillStyle = ledGradient; ledContext.fillRect(0, 0, 32, 32);
        const ledGlow = keep(new MeshBasicMaterial({ map: keep(new CanvasTexture(ledCanvas)), color: 0xff4938, transparent: true, opacity: .3, depthWrite: false, toneMapped: false }));
        mesh(pcb, contactGeometry, ledGlow, [-.43, .245, .72], [.70, 1, .70]);
        // Industrial sensor, threaded body and sensing face.
        cylinder(stations[1], mat.dark, [0, .35, 0], .5, .7);
        cylinder(stations[1], mat.steel, [0, .94, 0], .35, .65);
        cylinder(stations[1], mat.dark, [0, 1.34, 0], .42, .18);
        cylinder(stations[1], indicators[1], [0, 1.44, 0], .3, .025);
        for (let i = 0; i < 5; i++) cylinder(stations[1], mat.base, [0, .7 + i * .11, 0], .365, .035);
        // Outdoor LoRa enclosure and antenna.
        beveledBox(stations[2], mat.steel, [0, 1, 0], [1.22, 1.8, .65]);
        box(stations[2], mat.base, [0, 1, .345], [.98, 1.5, .05]);
        cylinder(stations[2], mat.dark, [.38, 2.52, 0], .045, 1.4);
        cylinder(stations[2], mat.brass, [.38, 1.9, 0], .10, .2);
        box(stations[2], indicators[2], [-.27, .49, .385], [.08, .04, .04]);
        // Fixed pedestal; the articulated assembly is added after static batching.
        cylinder(stations[3], mat.base, [0, .22, 0], .7, .44);
        cylinder(stations[4], mat.base, [0, .08, 0], .73, .12);
        // Quiet rails and a few structural beams establish depth, no particles.
        box(scene, mat.base, [0, compact ? -.3 : -.48, 0], [compact ? 6.8 : 23, .1, compact ? 4.8 : 3]);
        if (!compact) {
            for (const z of [-2.4, 2.4]) box(scene, mat.base, [0, -.6, z], [26, .14, .12]);
            for (const x of [-12, -6, 0, 6, 12]) box(scene, mat.base, [x, 1.5, -4], [.12, 5, .12]);
        }
        // Merge static geometry per material: pins do not each cost a draw call.
        const batches = new Map();
        scene.updateMatrixWorld(true);
        scene.traverse((object) => {
            if (!object.isMesh) return;
            const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
            if (!batches.has(object.material)) batches.set(object.material, []);
            batches.get(object.material).push({ geometry, object });
        });
        for (const [material, entries] of batches) {
            const merged = keep(mergeGeometries(entries.map((entry) => entry.geometry)));
            scene.add(new Mesh(merged, material));
            entries.forEach(({ geometry, object }) => { geometry.dispose(); object.removeFromParent(); });
        }
        const robotMotion = createRobotMotion();
        const radioDisplay = createRadioDisplay(stations[2], keep);
        const robotSurface = material(0xc4ced7, .5, .34);
        const robotAssembly = createRobotAssembly({ parent: stations[3], keep,
            geometries: { box: boxGeometry, link: keep(new CylinderGeometry(.5, .5, 1, 24)), cylinder: keep(new CylinderGeometry(1, 1, 1, 32)), sphere: keep(new SphereGeometry(1, 24, 16)) },
            materials: [robotSurface, mat.base, mat.amber] });
        robotAssembly.update(robotMotion.update(0));
        let robotPhase = 0, robotReduced = false;
        const hologramFill = keep(new MeshBasicMaterial({ color: 0x16b8e6, transparent: true, opacity: .18, depthWrite: false, toneMapped: false }));
        const hologramDetail = keep(new MeshBasicMaterial({ color: 0x77edff, transparent: true, opacity: .3, depthWrite: false, toneMapped: false }));
        const hologramCube = keep(new MeshBasicMaterial({ color: 0xaff8ff, transparent: true, opacity: .3, depthWrite: false, toneMapped: false }));
        const twinMaterial = keep(new LineBasicMaterial({ color: 0x66e6ff, transparent: true, opacity: .4, depthWrite: false, toneMapped: false }));
        robotAssembly.createHologram(stations[4], [hologramFill, hologramDetail, hologramCube], twinMaterial);
        const positions = robotAssembly.edges.attributes.position;
        const projectorVertices = [];
        for (const radius of [.78, 1.04, 1.3]) for (let i = 0; i < 48; i++) {
            const a = i * Math.PI / 24, b = (i + 1) * Math.PI / 24;
            projectorVertices.push(Math.cos(a) * radius, .035, Math.sin(a) * radius * .72, Math.cos(b) * radius, .035, Math.sin(b) * radius * .72);
        }
        const projectorGeometry = keep(new BufferGeometry());
        projectorGeometry.setAttribute('position', new Float32BufferAttribute(projectorVertices, 3));
        stations[4].add(new LineSegments(projectorGeometry, twinMaterial));
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
            const packet = mesh(scene, sphereGeometry, mat.blue, start.toArray(), [compact ? .065 : .075, .075, .075]);
            const firstLength = start.distanceTo(corner);
            links.push({ material, packet, start, corner, end, split: firstLength / (firstLength + corner.distanceTo(end)) });
        }
        scene.add(new HemisphereLight(0xb5dfff, 0x14212e, 1.05));
        const key = new DirectionalLight(0xd9e8f3, 3.6); key.position.set(-3, 7, 5); scene.add(key);
        const rim = new DirectionalLight(0x5edcff, 1.8); rim.position.set(6, 4, -5); scene.add(rim);
        const warm = new DirectionalLight(0xf5b366, 1.5); warm.position.set(-7, 3, -4); scene.add(warm);
        // The finished wireframe lights its own base, without a bloom pass.
        const twinLight = new PointLight(0x3bd6ff, 0, 4 * stationScale, 2);
        twinLight.position.set(xs[4], 1.3 * stationScale, zs[4] + .45 * stationScale);
        scene.add(twinLight);
        const effects = createNarrativeEffects({ scene, stations, compact, keep, twinPositions: positions });
        const anchors = xs.map((x, i) => new Vector3(x, compact && i >= 3 ? -.23 * stationScale : stationScale * [1.55, 1.47, 3.22, 3.12, 2.98][i], zs[i] + (compact && i >= 3 ? stationScale * 1.19 : 0)));
        const projected = new Vector3();
        const labelWidths = new Float32Array(compact ? [70, 85, 57, 85, 120] : [78, 96, 70, 96, 130]);
        const labelHeights = new Float32Array(5).fill(30);
        const labelXs = new Float32Array(5), labelYs = new Float32Array(5), anchorXs = new Float32Array(5);
        const labelRows = compact ? [[0, 1, 2], [4, 3]] : [[0, 1, 2, 3, 4]];
        const statuses = ['STATUS / ONLINE', 'SENSOR / SAMPLE', 'TX / ACTIVE', 'STATUS / READY', 'SYNC / ACTIVE'];
        // Static callers (e.g. resolution checks) can still render one frame.
        const stillAnimation = { phase: 0, pulses: new Float32Array(5), scanner: 0, sync: 0 };
        const stillPointer = { x: 0, y: 0 };
        let labelsMeasured = false;
        // One quality policy for every layout. Native density up to 4x, bounded
        // by four million pixels and hardware limits, including external displays.
        const maxDimension = Math.min(context.getParameter(context.MAX_RENDERBUFFER_SIZE), renderer.capabilities.maxTextureSize);
        let width = 0, height = 0, dpr = 1, nativeDpr = 0;
        host.append(canvas);
        return {
            resize(w, h) {
                const density = window.devicePixelRatio || 1;
                // Text can reflow even when the canvas itself keeps its size.
                labelsMeasured = false;
                // Mobile toolbar resizes must not clear/reallocate an unchanged canvas.
                if (w === width && h === height && density === nativeDpr) return;
                width = w; height = h; nativeDpr = density;
                dpr = Math.min(density, 4, Math.sqrt(4_000_000 / (w * h)), maxDimension / w, maxDimension / h);
                renderer.setDrawingBufferSize(w, h, dpr);
            },
            reduceQuality() {
                effects.simplify();
                if (dpr <= 1) return false;
                dpr = Math.max(1, dpr * .8);
                renderer.setDrawingBufferSize(width, height, dpr);
                return true;
            },
            render(progress, labels, reduced = false, animation = stillAnimation, pointer = stillPointer) {
                rig.update(progress, width, height, compact, pointer);
                const phase = animation.phase;
                for (let i = 0; i < links.length; i++) {
                    const link = links[i];
                    const local = MathUtils.smoothstep(phase, DEPARTURE_PHASES[i], STATION_PHASES[i + 1]);
                    link.material.opacity = .18 + MathUtils.smoothstep(progress, DEPARTURE_PHASES[i], STATION_PHASES[i + 1]) * .25 + envelope(phase, DEPARTURE_PHASES[i], STATION_PHASES[i + 1] + .02) * .42;
                    if (link.split > 0 && local <= link.split) link.packet.position.lerpVectors(link.start, link.corner, local / link.split);
                    else link.packet.position.lerpVectors(link.corner, link.end, link.split < 1 ? (local - link.split) / (1 - link.split) : 1);
                    link.packet.visible = !reduced && local > 0 && local < 1;
                }
                for (let i = 0; i < indicators.length; i++) {
                    const material = indicators[i];
                    const enter = MathUtils.smoothstep(progress, STATION_PHASES[i] - .025, STATION_PHASES[i] + .025);
                    material.color.setHex(i < 2 ? 0xf59e42 : 0x3bd6ff).multiplyScalar(.42 + enter * .20 + animation.pulses[i] * .50);
                }
                const ledBlink = reduced ? 0 : Math.max(envelope(phase, .20, .29), envelope(phase, .30, .39));
                ledMaterial.color.setRGB(1, .04 + ledBlink * .68, .02 + ledBlink * .48).multiplyScalar(.75 + ledBlink * .25);
                ledGlow.opacity = reduced ? .3 : .3 + ledBlink * .45;
                radioDisplay.update(phase, reduced);
                if (phase !== robotPhase || reduced !== robotReduced) {
                    robotAssembly.update(robotMotion.update(phase, reduced));
                    robotPhase = phase; robotReduced = reduced;
                }
                const build = reduced ? 1 : MathUtils.smoothstep(phase, .78, .96);
                twinLight.intensity = (3.5 * build + animation.sync) * stationScale * stationScale;
                hologramFill.opacity = .16 + build * .19 + animation.sync * .06;
                hologramDetail.opacity = .26 + build * .28;
                hologramCube.opacity = .32 + build * .25;
                twinMaterial.opacity = .35 + build * .40 + animation.sync * .15;
                effects.update(animation, reduced, pointer.x);
                if (!labelsMeasured && labels[0]?.offsetWidth) {
                    labels.forEach((label, i) => { labelWidths[i] = label.offsetWidth; labelHeights[i] = label.offsetHeight; });
                    labelsMeasured = true;
                }
                for (let i = 0; i < labels.length; i++) {
                    const label = labels[i];
                    projected.copy(anchors[i]).project(rig.camera);
                    const x = (projected.x * .5 + .5) * width + pointer.x * 2;
                    const y = (-projected.y * .5 + .5) * height + pointer.y;
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
                    const active = reduced || animation.pulses[i] > .08 || (i === 3 && animation.scanner > .08) || (i === 4 && animation.sync > .08);
                    label.classList.toggle('is-active', active);
                    label.classList.toggle('is-complete', progress > STATION_PHASES[i] + .1);
                    const status = active && !reduced && width > 900 && labelYs[i] > 55 ? statuses[i] : '';
                    if (label.dataset.status !== status) label.dataset.status = status;
                }
                renderer.render(scene, rig.camera);
            },
            dispose: cleanup,
        };
    } catch (error) { cleanup(); throw error; }
}
