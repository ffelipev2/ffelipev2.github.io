import { Group, BufferGeometry, Float32BufferAttribute, Line, LineSegments, LineBasicMaterial, Mesh, MeshBasicMaterial, PlaneGeometry, Points, PointsMaterial, DoubleSide } from 'three';
import { clamp01 } from './animation-sequence.js';

// All rings, scanners and data samples are allocated once, then reused.
export function createNarrativeEffects({ scene, stations, compact, keep, twinPositions }) {
    const scale = compact ? .6 : 1;
    let simplified = false;
    const lineMaterial = (color, opacity) => keep(new LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false }));
    const ringPositions = [];
    for (let i = 0; i <= 40; i++) {
        const a = i / 40 * Math.PI * 2;
        ringPositions.push(Math.cos(a), 0, Math.sin(a));
    }
    const ringGeometry = keep(new BufferGeometry());
    ringGeometry.setAttribute('position', new Float32BufferAttribute(ringPositions, 3));
    const createRings = (parent, color, count, height, vertical) => Array.from({ length: count }, () => {
        const ring = new Line(ringGeometry, lineMaterial(color, 0));
        ring.position.set(vertical ? .38 : 0, height, 0);
        if (vertical) ring.rotation.x = Math.PI / 2;
        parent.add(ring);
        return ring;
    });
    const sensorRings = createRings(stations[1], 0xf59e42, 2, 1.46, false);
    const radioRings = createRings(stations[2], 0x3bd6ff, compact ? 2 : 3, 3.15, true);

    const scanGeometry = keep(new BufferGeometry());
    scanGeometry.setAttribute('position', new Float32BufferAttribute([
        -1.25, 0, -1, 1.75, 0, -1, 1.75, 0, -1, 1.75, 0, 1,
        1.75, 0, 1, -1.25, 0, 1, -1.25, 0, 1, -1.25, 0, -1,
    ], 3));
    const makeScanner = (parent, withPlane) => {
        const group = new Group(); parent.add(group);
        const border = new LineSegments(scanGeometry, lineMaterial(0x3bd6ff, 0)); group.add(border);
        let plane = null;
        if (withPlane) {
            const geometry = keep(new PlaneGeometry(3, 2).rotateX(-Math.PI / 2));
            plane = new Mesh(geometry, keep(new MeshBasicMaterial({ color: 0x16b8e6, transparent: true, opacity: 0, side: DoubleSide, depthWrite: false, toneMapped: false })));
            plane.position.x = .25; group.add(plane);
        }
        return { group, border, plane };
    };
    const robotScan = makeScanner(stations[3], !compact);
    const twinScan = makeScanner(stations[4], false);
    const count = compact ? 4 : 12;
    const samples = keep(new BufferGeometry());
    const samplePositions = new Float32Array(count * 3);
    samples.setAttribute('position', new Float32BufferAttribute(samplePositions, 3));
    const points = new Points(samples, keep(new PointsMaterial({ color: 0x3bd6ff, size: compact ? .045 : .065, transparent: true, opacity: .8, depthWrite: false, toneMapped: false })));
    points.frustumCulled = false; scene.add(points);
    const start = new Float32Array(count * 3), end = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const vertex = Math.floor(i * twinPositions.count / count);
        start.set([stations[3].position.x + Math.sin(i * 2.4) * .65 * scale, (.55 + (i % 5) * .48) * scale, stations[3].position.z + Math.cos(i * 2.4) * .28 * scale], i * 3);
        end.set([stations[4].position.x + twinPositions.getX(vertex) * scale, twinPositions.getY(vertex) * scale, stations[4].position.z + twinPositions.getZ(vertex) * scale], i * 3);
    }
    // A second small batch follows actual wireframe edges during synchronization.
    const edgeCount = compact ? 2 : 5;
    const edgeGeometry = keep(new BufferGeometry());
    const edgePositions = new Float32Array(edgeCount * 3);
    edgeGeometry.setAttribute('position', new Float32BufferAttribute(edgePositions, 3));
    const edgePoints = new Points(edgeGeometry, points.material);
    edgePoints.frustumCulled = false; stations[4].add(edgePoints);
    const gridGeometry = keep(new BufferGeometry());
    const gridVertices = [];
    const extent = compact ? 4 : 13;
    for (let x = -extent; x <= extent; x += compact ? 1 : 2) gridVertices.push(x, -.66, -4, x, -.66, 3);
    for (let z = -4; z <= 3; z++) gridVertices.push(-extent, -.66, z, extent, -.66, z);
    gridGeometry.setAttribute('position', new Float32BufferAttribute(gridVertices, 3));
    const grid = new LineSegments(gridGeometry, lineMaterial(0x5e91aa, .085)); scene.add(grid);
    const updateRings = (rings, phase, begin, duration, base, spread, opacity) => {
        for (let i = 0; i < rings.length; i++) {
            const t = (phase - begin - i * .017) / duration;
            const ring = rings[i];
            ring.visible = !simplified && t > 0 && t < 1;
            if (!ring.visible) continue;
            ring.scale.setScalar(base + t * spread);
            ring.material.opacity = Math.sin(Math.PI * t) * (1 - t) * opacity;
        }
    };
    return {
        simplify() { simplified = true; },
        update(state, reduced, pointerX) {
            const p = state.phase;
            updateRings(sensorRings, p, .335, .16, .32, .55, .55);
            updateRings(radioRings, p, .49, .19, .09, .85, .80);
            if (reduced) { sensorRings.forEach((ring) => { ring.visible = false; }); radioRings.forEach((ring) => { ring.visible = false; }); }
            robotScan.group.visible = !reduced && state.scanner > .001;
            robotScan.group.position.y = .3 + clamp01((p - .80) / .15) * 2.85;
            robotScan.border.material.opacity = state.scanner * .58;
            if (robotScan.plane) robotScan.plane.material.opacity = simplified ? 0 : state.scanner * .045;
            twinScan.group.visible = !reduced && state.sync > .001;
            twinScan.group.position.y = .15 + clamp01((p - .86) / .13) * 2.8;
            twinScan.border.material.opacity = state.sync * .34;
            points.visible = !reduced && p > .82 && p < .985;
            let first = count, last = -1;
            for (let i = 0; i < count; i++) {
                const t = (p - .82 - i * .003) / .13;
                if (t <= 0 || t >= 1 || (simplified && i >= 2)) continue;
                first = Math.min(first, i); last = i;
                const smooth = t * t * (3 - 2 * t);
                // The destination is an articulated hologram, not a static box.
                const vertex = Math.floor(i * twinPositions.count / count);
                end[i * 3] = stations[4].position.x + twinPositions.getX(vertex) * scale;
                end[i * 3 + 1] = twinPositions.getY(vertex) * scale;
                end[i * 3 + 2] = stations[4].position.z + twinPositions.getZ(vertex) * scale;
                for (let j = 0; j < 3; j++) samplePositions[i * 3 + j] = start[i * 3 + j] + (end[i * 3 + j] - start[i * 3 + j]) * smooth;
                samplePositions[i * 3 + 1] += Math.sin(t * Math.PI) * .4 * scale;
            }
            samples.setDrawRange(first, Math.max(0, last - first + 1));
            samples.attributes.position.needsUpdate = points.visible;
            edgePoints.visible = !reduced && !simplified && state.sync > .04;
            for (let i = 0; i < edgeCount; i++) {
                const edge = Math.floor((i + 1) * twinPositions.count / (edgeCount + 1) / 2) * 2;
                const t = clamp01((p - .87) / .12);
                for (let j = 0; j < 3; j++) {
                    const a = twinPositions.array[edge * 3 + j], b = twinPositions.array[(edge + 1) * 3 + j];
                    edgePositions[i * 3 + j] = a + (b - a) * t;
                }
            }
            edgeGeometry.attributes.position.needsUpdate = edgePoints.visible;
            grid.position.x = compact ? 0 : pointerX * .025;
        },
    };
}
