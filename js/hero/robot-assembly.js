import { BufferGeometry, Float32BufferAttribute, DynamicDrawUsage, Mesh, LineSegments, Vector3, Quaternion, Matrix4, Matrix3, EdgesGeometry } from 'three';

// Three material batches for the complete articulated robot and its payload.
// Physical and holographic meshes share these buffers: one pose, no duplicate IK.
export function createRobotAssembly({ parent, keep, geometries, materials }) {
    const parts = [], batches = materials.map(material => ({ material, parts: [], count: 0 }));
    const sourceCache = new Map();
    let edgeCount = 0;
    const add = (shape, materialIndex, kind, index = 0, outline = true) => {
        const source = geometries[shape];
        if (!sourceCache.has(source)) {
            const geometry = source.index ? source.toNonIndexed() : source.clone();
            const edges = new EdgesGeometry(source, 25);
            sourceCache.set(source, { positions: geometry.attributes.position.array.slice(), normals: geometry.attributes.normal.array.slice(), edges: edges.attributes.position.array.slice() });
            geometry.dispose(); edges.dispose();
        }
        const data = sourceCache.get(source), batch = batches[materialIndex];
        const part = { ...data, kind, index, offset: batch.count, edgeOffset: edgeCount, outline, batch };
        batch.count += data.positions.length;
        if (outline) edgeCount += data.edges.length;
        batch.parts.push(part); parts.push(part);
    };
    for (let i = 0; i < 4; i++) {
        add('sphere', 0, 'joint', i, false);
        add('cylinder', 1, 'cap', i);
        if (i) add('bevel', 0, 'link', i);
    }
    add('box', 1, 'wrist');
    add('box', 0, 'finger', -1); add('box', 0, 'finger', 1);
    add('box', 2, 'cube');
    for (const batch of batches) {
        batch.positions = new Float32Array(batch.count);
        batch.normals = new Float32Array(batch.count);
        batch.geometry = keep(new BufferGeometry());
        batch.geometry.setAttribute('position', new Float32BufferAttribute(batch.positions, 3).setUsage(DynamicDrawUsage));
        batch.geometry.setAttribute('normal', new Float32BufferAttribute(batch.normals, 3).setUsage(DynamicDrawUsage));
        // Float32BufferAttribute copies arrays; update its actual upload buffer.
        batch.positions = batch.geometry.attributes.position.array;
        batch.normals = batch.geometry.attributes.normal.array;
        const mesh = new Mesh(batch.geometry, batch.material);
        mesh.frustumCulled = false; parent.add(mesh);
    }
    const edges = keep(new BufferGeometry());
    edges.setAttribute('position', new Float32BufferAttribute(new Float32Array(edgeCount), 3).setUsage(DynamicDrawUsage));
    const edgePositions = edges.attributes.position.array;
    const position = new Vector3(), scale = new Vector3(), direction = new Vector3(), up = new Vector3(0, 1, 0);
    const rotation = new Quaternion(), matrix = new Matrix4(), yawMatrix = new Matrix4(), normalMatrix = new Matrix3();
    const transform = (source, destination, offset, m) => {
        for (let i = 0; i < source.length; i += 3) {
            const x = source[i], y = source[i + 1], z = source[i + 2];
            destination[offset + i] = m[0] * x + m[4] * y + m[8] * z + m[12];
            destination[offset + i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
            destination[offset + i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
        }
    };
    return {
        edges,
        createHologram(target, fills, outline) {
            batches.forEach((batch, i) => {
                const mesh = new Mesh(batch.geometry, fills[i]);
                mesh.frustumCulled = false; target.add(mesh);
            });
            const wire = new LineSegments(edges, outline);
            wire.frustumCulled = false; target.add(wire);
        },
        update(pose) {
            yawMatrix.makeRotationY(pose.yaw);
            const j = pose.joints;
            for (const part of parts) {
                rotation.identity();
                if (part.kind === 'joint' || part.kind === 'cap') {
                    position.fromArray(j, part.index * 3);
                    if (part.kind === 'joint') scale.setScalar(.30);
                    else { position.z += .25; scale.set(.22, .08, .22); rotation.setFromAxisAngle(up.set(1, 0, 0), Math.PI / 2); up.set(0, 1, 0); }
                } else if (part.kind === 'link') {
                    position.fromArray(j, (part.index - 1) * 3);
                    direction.fromArray(j, part.index * 3).sub(position);
                    position.addScaledVector(direction, .5);
                    scale.set(.34, direction.length(), .34);
                    rotation.setFromUnitVectors(up, direction.normalize());
                } else if (part.kind === 'cube') {
                    position.fromArray(pose.cube); scale.setScalar(.34);
                    rotation.setFromAxisAngle(up, pose.cubeYaw);
                } else {
                    position.fromArray(j, 9);
                    if (part.kind === 'wrist') { position.y -= .23; scale.set(.42, .32, .35); }
                    else { position.x += part.index * pose.opening; position.y -= .55; scale.set(.075, .36, .14); }
                }
                matrix.compose(position, rotation, scale);
                if (part.kind !== 'cube') matrix.premultiply(yawMatrix);
                transform(part.positions, part.batch.positions, part.offset, matrix.elements);
                if (part.outline) transform(part.edges, edgePositions, part.edgeOffset, matrix.elements);
                normalMatrix.getNormalMatrix(matrix);
                const n = normalMatrix.elements;
                for (let i = 0; i < part.normals.length; i += 3) {
                    const x = part.normals[i], y = part.normals[i + 1], z = part.normals[i + 2], offset = part.offset + i;
                    part.batch.normals[offset] = n[0] * x + n[3] * y + n[6] * z;
                    part.batch.normals[offset + 1] = n[1] * x + n[4] * y + n[7] * z;
                    part.batch.normals[offset + 2] = n[2] * x + n[5] * y + n[8] * z;
                }
            }
            batches.forEach(batch => { batch.geometry.attributes.position.needsUpdate = true; batch.geometry.attributes.normal.needsUpdate = true; });
            edges.attributes.position.needsUpdate = true;
        },
    };
}
