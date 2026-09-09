import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three';

// A small procedural screen: no downloaded image or per-frame texture rebuild.
export function createRadioDisplay(parent, keep) {
    const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 224;
    const ctx = canvas.getContext('2d');
    const texture = keep(new CanvasTexture(canvas)); texture.colorSpace = SRGBColorSpace;
    const material = keep(new MeshBasicMaterial({ map: texture, toneMapped: false }));
    const screen = new Mesh(keep(new PlaneGeometry(.81, 1.13)), material);
    screen.position.set(0, 1.09, .377); parent.add(screen);
    let lastStep = -1;
    return {
        update(phase, reduced) {
            const active = !reduced && phase >= .47 && phase <= .69;
            const step = active ? 1 + Math.floor((phase - .47) / .22 * 24) : 0;
            if (step === lastStep) return;
            lastStep = step;
            ctx.fillStyle = '#071d2b'; ctx.fillRect(0, 0, 160, 224);
            ctx.strokeStyle = active ? '#31dcff' : '#24526b'; ctx.lineWidth = 3; ctx.strokeRect(5, 5, 150, 214);
            ctx.textAlign = 'center'; ctx.font = 'bold 30px sans-serif';
            ctx.fillStyle = active ? '#e1fbff' : '#6b9cb0'; ctx.fillText('LoRa', 80, 43);
            ctx.font = 'bold 48px sans-serif'; ctx.fillStyle = active ? '#48e4ff' : '#37627a';
            ctx.fillText(active ? 'TX' : '•', 80, 108);
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = active && i <= step % 5 ? '#61f0ff' : '#163e50';
                ctx.fillRect(27 + i * 29, 176 - i * 12, 18, 18 + i * 12);
            }
            ctx.fillStyle = '#163e50'; ctx.fillRect(22, 202, 116, 5);
            if (active) { ctx.fillStyle = '#61f0ff'; ctx.fillRect(22, 202, 116 * step / 25, 5); }
            texture.needsUpdate = true;
        },
    };
}
