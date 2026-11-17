import * as THREE from 'three';

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// progresso 0..1 de t entre a e b
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const easeOutBack = (x) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const lerp = (a, b, k) => a + (b - a) * k;
export const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// Textura de texto num canvas (rótulos nas faces das peças)
export function labelTexture(text, {bg = 'rgba(0,0,0,0)', fg = '#fff', size = 256, font = '900 120px Montserrat'} = {}) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, size, size);
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineJoin = 'round';
  g.strokeText(text, size / 2, size / 2 + 6);
  g.fillStyle = fg; g.fillText(text, size / 2, size / 2 + 6);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function floorTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const cols = ['#d9a066', '#d29a5f', '#dfa86f', '#cf9559'];
  const n = 16, w = 1024 / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[i % cols.length];
    g.fillRect(i * w, 0, w, 1024);
    g.fillStyle = 'rgba(90,50,20,0.28)';
    g.fillRect(i * w, 0, 3, 1024);
    // emendas
    const off = (i * 197) % 512;
    g.fillRect(i * w, off, w, 3);
    g.fillRect(i * w, (off + 512) % 1024, w, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = 8;
  return tex;
}

// placa creme com texto escuro (rótulo nas faces das peças, como na referência)
export function plateTexture(text, {bg = '#f4ecdc', fg = '#1d1d22', font = '800 128px Montserrat'} = {}) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(8, 8, 496, 240, 44); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 6; g.stroke();
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = fg; g.fillText(text, 256, 136);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// projeta ponto 3D -> pixel da tela (mesma câmera ortográfica isométrica do CameraRig)
export function toScreen(p, target, zoom, w, h) {
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 80);
  cam.position.set(target[0] + 12, target[1] + 12, target[2] + 12);
  cam.zoom = zoom;
  cam.lookAt(target[0], target[1], target[2]);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  const v = new THREE.Vector3(p[0], p[1], p[2]).project(cam);
  return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
}
