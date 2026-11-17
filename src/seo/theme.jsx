import React, {useMemo, createContext, useContext} from 'react';
import * as THREE from 'three';
import {RBox} from '../World.jsx';
import {rn} from '../kit.jsx';
import {easeInOut, prog, lerp} from '../lib.js';

// ---------- temas visuais (mesma cena, duas "pegadas") ----------
export const THEMES = {
  noite: {
    id: 'noite', label: 'Maquete noturna neon', glow: true,
    bg: '#060a1c', fog: ['#0a1236', 38, 110], tone: THREE.ACESFilmicToneMapping, exposure: 1.15,
    rough: 0.35, metal: 0.25, ei: 0.9, glass: 0.2,
    pal: {blog: '#ff8a3d', wiki: '#4aa8ff', news: '#2effc4', forum: '#b07cff', brand: '#ff3df0'},
    gold: '#ffd23f', accent: '#19f0ff', plate: '#101a44', jar: '#8fe8ff', liquid: '#8b6bff',
    labelBg: '#0c1438', labelFg: '#bff6ff', cardBg: '#0c1438', cardFg: '#e6f6ff', cardBar: '#2a3a8a',
    capFg: '#fff', capHl: '#ffd23f',
  },
  cidade: {
    id: 'cidade', label: 'Cidade em argila (diurna)', glow: false,
    bg: '#bfe3ff', fog: ['#dff0ff', 46, 120], tone: THREE.NeutralToneMapping, exposure: 1,
    rough: 0.92, metal: 0, ei: 0, glass: 0.3,
    pal: {blog: '#ff9a3d', wiki: '#4aa8ff', news: '#19c3b0', forum: '#b07cff', brand: '#ff5a8a'},
    gold: '#ffc233', accent: '#ff7a45', plate: '#f4e9d3', jar: '#e8f6ff', liquid: '#7aa8ff',
    labelBg: '#f4ecdc', labelFg: '#1d1d22', cardBg: '#fffaf0', cardFg: '#1d1d22', cardBar: '#e4d9c3',
    capFg: '#fff', capHl: '#ffd23f',
  },
};
export const ThemeCtx = createContext(THEMES.noite);
export const CamCtx = createContext([0, 3, 20]);
export const useTheme = () => useContext(ThemeCtx);

// ---------- texturas (cache) ----------
const cache = new Map();
export const mk = (key, w, h, draw, repeat) => {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  cache.set(key, t);
  return t;
};

export const pillTex = (text, {bg = '#fff', fg = '#111', dot, font = 800, w = 512} = {}) =>
  mk(`pill|${text}|${bg}|${fg}|${dot}|${font}`, w, 128, (g, W, H) => {
    g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 58); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 4; g.stroke();
    let size = 64;
    g.font = `${font} ${size}px Montserrat`;
    const pad = dot ? 120 : 70;
    while (g.measureText(text).width > W - pad && size > 20) { size -= 2; g.font = `${font} ${size}px Montserrat`; }
    g.textBaseline = 'middle'; g.textAlign = 'center';
    g.fillStyle = fg; g.fillText(text, dot ? W / 2 + 22 : W / 2, H / 2 + 4);
    if (dot) { g.fillStyle = dot; g.beginPath(); g.arc(46, H / 2, 17, 0, 7); g.fill(); }
  });

export const letterTex = (ch, fg, bg) =>
  mk(`let|${ch}|${fg}|${bg}`, 256, 256, (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.font = '900 190px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = fg; g.fillText(ch, W / 2, H / 2 + 12);
  });

export const cardTex = (th, variant) =>
  mk(`card|${th.id}|${variant}`, 768, 512, (g, W, H) => {
    g.fillStyle = th.cardBg; g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, 44); g.fill();
    g.strokeStyle = th.id === 'noite' ? th.accent : 'rgba(0,0,0,.18)'; g.lineWidth = th.id === 'noite' ? 6 : 5; g.stroke();
    g.fillStyle = th.cardFg; g.font = '800 40px Montserrat'; g.textBaseline = 'middle';
    g.fillText('RESPOSTA DA IA', 48, 70);
    g.fillStyle = th.gold; g.beginPath(); g.arc(W - 70, 70, 18, 0, 7); g.fill();
    g.fillStyle = th.cardBar;
    [[110, 0.92], [160, 0.8], [210, 0.86], [260, 0.5]].forEach(([y, f]) => { g.beginPath(); g.roundRect(48, y + 18, (W - 96) * f, 24, 12); g.fill(); });
    const chips = variant === 'a' ? [['1', 'BLOG', th.pal.blog], ['2', 'WIKI', th.pal.wiki]] : [['1', 'SUA MARCA', th.gold]];
    let x = 48;
    chips.forEach(([n, label, col]) => {
      g.font = '800 34px Montserrat';
      const wd = g.measureText(label).width + 100;
      g.fillStyle = col; g.beginPath(); g.roundRect(x, 340, wd, 76, 38); g.fill();
      g.fillStyle = '#111'; g.textAlign = 'left';
      g.fillText(`[${n}]`, x + 20, 380); g.fillText(label, x + 84, 380);
      x += wd + 18;
    });
    g.fillStyle = th.cardFg; g.globalAlpha = 0.55; g.font = '700 26px Montserrat'; g.textAlign = 'left';
    g.fillText(variant === 'a' ? 'fontes citadas' : 'a IA escolheu a sua marca', 48, 462);
    g.globalAlpha = 1;
  });

export const haloTex = () =>
  mk('halo', 128, 128, (g, W, H) => {
    const r = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
  });

const gridTex = () =>
  mk('grid', 512, 512, (g, W, H) => {
    g.fillStyle = '#060a22'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(25,240,255,.55)'; g.lineWidth = 3; g.strokeRect(0, 0, W, H);
    g.strokeStyle = 'rgba(80,110,255,.35)'; g.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.moveTo(0, i * H / 4); g.lineTo(W, i * H / 4); g.stroke(); }
  }, 36);

const winTex = () =>
  mk('win', 128, 256, (g, W, H) => {
    g.fillStyle = '#0b1233'; g.fillRect(0, 0, W, H);
    const cols = ['#19f0ff', '#ff3df0', '#ffd23f', '#7aa8ff'];
    for (let y = 8; y < H - 8; y += 16) for (let x = 8; x < W - 8; x += 16) {
      const r = rn(x * 7 + y * 13, 3);
      if (r > 0.55) { g.fillStyle = cols[Math.floor(r * 40) % 4]; g.globalAlpha = 0.5 + rn(x + y, 9) * 0.5; g.fillRect(x, y, 9, 9); }
    }
    g.globalAlpha = 1;
  });

// ---------- cenário (muda por tema) ----------
const PASTEL = ['#ff9a8a', '#ffd27a', '#9ad7a8', '#8ec5ff', '#c7a8ff', '#ffb3d1', '#f4ecdc'];

export const Scenery = ({t}) => {
  const th = useTheme();
  const items = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 110; i++) {
      const a = rn(i, 1) * Math.PI * 2;
      const r = 15 + rn(i, 2) * 24;
      // setor da câmera (z>0, perto do eixo +z): sem prédios
      if (Math.sin(a) > 0 && Math.abs(Math.cos(a)) < 1.3 * Math.sin(a)) continue;
      arr.push({x: Math.cos(a) * r, z: Math.sin(a) * r, w: 1.6 + rn(i, 3) * 2.2, d: 1.6 + rn(i, 4) * 2.2, h: 1.4 + rn(i, 5) * (th.id === 'noite' ? 9 : 2.6), c: PASTEL[Math.floor(rn(i, 6) * PASTEL.length)]});
    }
    return arr;
  }, [th.id]);
  const trees = useMemo(() => Array.from({length: 26}, (_, i) => {
    const a = rn(i, 11) * Math.PI * 2, r = 6.5 + rn(i, 12) * 5.5;
    return {x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.6 + rn(i, 13) * 0.6};
  }), []);
  const stars = useMemo(() => {
    const p = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const a = rn(i, 21) * Math.PI * 2, e = 0.15 + rn(i, 22) * 1.1, r = 70;
      p[i * 3] = Math.cos(a) * Math.cos(e) * r; p[i * 3 + 1] = Math.sin(e) * r + 6; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    return p;
  }, []);
  const night = th.id === 'noite';
  const grid = night ? gridTex() : null;
  const win = night ? winTex() : null;
  return (
    <group>
      {/* chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[240, 240]} />
        {night
          ? <meshStandardMaterial map={grid} emissiveMap={grid} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.5} metalness={0.3} />
          : <meshStandardMaterial color="#cfe0a3" roughness={1} />}
      </mesh>
      {!night && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><ringGeometry args={[11, 13.2, 64]} /><meshStandardMaterial color="#a9abb6" roughness={1} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow><ringGeometry args={[11.95, 12.05, 64]} /><meshStandardMaterial color="#fff3c4" roughness={1} /></mesh>
        </>
      )}
      {/* prédios */}
      {items.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          {night ? (
            <mesh position={[0, b.h / 2, 0]}>
              <boxGeometry args={[b.w, b.h, b.d]} />
              <meshStandardMaterial map={win} emissiveMap={win} emissive="#ffffff" emissiveIntensity={0.9} roughness={0.4} metalness={0.2} />
            </mesh>
          ) : (
            <>
              <RBox size={[b.w, b.h, b.d]} r={0.25} color={b.c} rough={0.95} position={[0, b.h / 2, 0]} cast={false} />
              <RBox size={[b.w + 0.2, 0.22, b.d + 0.2]} r={0.08} color="#e7d9bd" rough={0.95} position={[0, b.h + 0.1, 0]} cast={false} />
            </>
          )}
        </group>
      ))}
      {/* árvores (cidade) */}
      {!night && trees.map((tr, i) => (
        <group key={i} position={[tr.x, 0, tr.z]} scale={tr.s}>
          <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.12, 0.16, 0.8, 8]} /><meshStandardMaterial color="#9c6b43" roughness={1} /></mesh>
          <mesh position={[0, 1.2, 0]}><icosahedronGeometry args={[0.7, 1]} /><meshStandardMaterial color="#58b86a" roughness={1} flatShading /></mesh>
        </group>
      ))}
      {/* nuvens (cidade) */}
      {!night && [0, 1, 2, 3].map((i) => (
        <group key={i} position={[-30 + i * 22 + t * 0.5, 14 + (i % 2) * 3, -22 - (i % 3) * 5]}>
          {[[0, 0, 0, 2.2], [2, -0.3, 0.3, 1.7], [-2, -0.4, 0, 1.6], [0.6, 0.6, 0, 1.5]].map(([x, y, z, s], k) => (
            <mesh key={k} position={[x, y, z]}><sphereGeometry args={[s, 16, 12]} /><meshStandardMaterial color="#fff" roughness={1} /></mesh>
          ))}
        </group>
      ))}
      {/* estrelas (noite) */}
      {night && (
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry>
          <pointsMaterial color="#cfe0ff" size={0.5} sizeAttenuation transparent opacity={0.8} fog={false} />
        </points>
      )}
    </group>
  );
};

export const Lights = ({t}) => {
  const th = useTheme();
  if (th.id === 'noite') {
    const pulse = 0.85 + 0.15 * Math.sin(t * 3);
    return (
      <>
        <ambientLight intensity={0.55} color="#4a5cff" />
        <directionalLight position={[-6, 13, 7]} intensity={1.0} color="#9fbfff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={40} shadow-bias={-0.0004} shadow-normalBias={0.03} />
        <pointLight position={[0, 3.2, 0.4]} intensity={45 * pulse} color="#19f0ff" distance={14} />
        <pointLight position={[3.5, 2.4, 3.5]} intensity={26} color="#ff3df0" distance={12} />
        <pointLight position={[-3.5, 2.4, -2]} intensity={18} color="#4aa8ff" distance={12} />
      </>
    );
  }
  return (
    <>
      <hemisphereLight args={['#ffffff', '#d8c8a0', 0.9]} />
      <directionalLight position={[7, 14, 6]} intensity={2.3} color="#fff0dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={45} shadow-bias={-0.0004} shadow-normalBias={0.03} />
    </>
  );
};
