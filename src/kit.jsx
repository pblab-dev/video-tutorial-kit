import React, {useMemo, useContext} from 'react';
import * as THREE from 'three';
import {RBox, FaceLabel, BILLBOARD} from './World.jsx';
import {prog, easeInOut, easeOut, easeOutBack, lerp, lerp3, clamp} from './lib.js';

export const LabelCtx = React.createContext(1);
export const pk = (tau, a, d = 0.32) => easeOutBack(prog(tau, a, a + d)); // pop-in
export const fade = (tau, a, b, d = 0.2) => prog(tau, a, a + d) * (1 - prog(tau, b, b + d));
export const arc3 = (a, b, k, h = 1.2) => {
  const p = lerp3(a, b, k);
  return [p[0], p[1] + Math.sin(Math.PI * k) * h, p[2]];
};
export const rn = (i, s = 1) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const pulse = (tau, a, d = 0.4, amp = 0.15) => 1 + amp * Math.sin(Math.PI * prog(tau, a, a + d));

// cor da base de cada estação
export const Base = ({color, k = 1, flash = 0}) => (
  <group scale={[Math.max(k, 0.001), 1, Math.max(k, 0.001)]}>
    <RBox size={[3.4, 0.12, 3.2]} r={0.05} color={color} emissive={color} emissiveIntensity={flash * 0.7} position={[0, 0.06, 0]} />
  </group>
);

export const Cube = ({p = [0, 0, 0], s = 0.5, color = '#fff', text, emissive, ei = 0, rot = [0, 0, 0], k = 1, font = '900 150px Montserrat', plate = false, op = 1}) => {
  if (k <= 0.003) return null;
  return (
    <group position={p} rotation={rot} scale={k}>
      <RBox size={[s, s, s]} r={s * 0.22} color={color} emissive={emissive || color} emissiveIntensity={ei} opacity={op} position={[0, s / 2, 0]} />
      {text && (
        <group position={[0, s / 2, 0]}>
          <FaceLabel text={text} half={s / 2} size={s * (plate ? 0.9 : 0.78)} font={font} plate={plate} y={plate ? -s * 0.1 : 0} />
        </group>
      )}
    </group>
  );
};

export const MiniLLM = ({p = [0, 0, 0], k = 1, ei = 0, spin = 0, shake = 0, s = 0.95}) => {
  if (k <= 0.003) return null;
  return (
    <group position={p} scale={k}>
      <group position={[0, s / 2, 0]} rotation={[0, spin, shake]}>
        <RBox size={[s, s, s]} r={0.18} color="#ff5a4f" emissive="#ff3b30" emissiveIntensity={ei} />
        <FaceLabel text="LLM" half={s / 2} size={s * 0.78} plate y={-s * 0.22} font="800 120px Montserrat" />
      </group>
      <mesh position={[0, s + 0.3, 0]} rotation={[0, spin * 2 + 0.7, 0]} scale={[0.12, 0.19, 0.12]} castShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffd23f" emissive="#ffb800" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
};

// rótulo largo (texto) voltado para a câmera
const wideCache = new Map();
const wideTex = (text, fg, font, bg) => {
  const key = text + fg + font + bg;
  if (wideCache.has(key)) return wideCache.get(key);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, 504, 120, 56); g.fill(); }
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (!bg) { g.lineWidth = 12; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineJoin = 'round'; g.strokeText(text, 256, 70); }
  g.fillStyle = fg; g.fillText(text, 256, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  wideCache.set(key, tex);
  return tex;
};
export const Tx = ({text, p, w = 1.4, fg = '#fff', font = '900 78px Montserrat', bg, k = 1, op = 1}) => {
  const tex = useMemo(() => wideTex(text, fg, font, bg), [text, fg, font, bg]);
  const lk = useContext(LabelCtx);
  k = k * lk;
  if (k <= 0.003) return null;
  return (
    <mesh position={p} rotation={BILLBOARD} scale={k}>
      <planeGeometry args={[w, w / 4]} />
      <meshBasicMaterial map={tex} transparent opacity={op} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// linha de código (mono) numa face +x
const lineCache = new Map();
const lineTex = (text, color, center = false) => {
  const key = text + color + center;
  if (lineCache.has(key)) return lineCache.get(key);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  g.font = '700 40px "JetBrains Mono"'; g.textAlign = center ? 'center' : 'left'; g.textBaseline = 'middle';
  g.fillStyle = color; g.fillText(text, center ? 256 : 8, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  lineCache.set(key, tex);
  return tex;
};
export const TLine = ({text, color = '#7be08a', p, w = 1.7, k = 1, center = false}) => {
  const tex = useMemo(() => lineTex(text, color, center), [text, color, center]);
  if (k <= 0.003) return null;
  return (
    <mesh position={p} rotation={[0, Math.PI / 2, 0]} scale={[k, 1, 1]}>
      <planeGeometry args={[w, w / 8]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// explosão de confete local
export const Burst = ({tau, c, p = [0, 1.9, 0]}) => {
  const q = tau - c;
  if (q < 0 || q > 1.5) return null;
  const cols = ['#ffd23f', '#ff5a4f', '#3fa7ff', '#7be08a', '#c39bff'];
  return (
    <group>
      {Array.from({length: 16}).map((_, i) => {
        const vx = (rn(i, 1) - 0.5) * 4, vz = (rn(i, 2) - 0.5) * 4, vy = 2.2 + rn(i, 3) * 2.2;
        const pos = [p[0] + vx * q, p[1] + vy * q - 4.5 * q * q, p[2] + vz * q];
        const s = 0.11 * (1 - prog(q, 0.9, 1.5));
        return (
          <mesh key={i} position={pos} rotation={[q * 6 + i, q * 5, i]} scale={s}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={cols[i % cols.length]} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Gear = ({p, r = 0.38, teeth = 8, rot = 0, color = '#c9ccd4', k = 1}) => (
  <group position={p} rotation={[0, 0, 0]} scale={k}>
    <group rotation={[0, 0, 0]}>
      <group rotation={[Math.PI / 2, 0, rot]}>
        <mesh castShadow><cylinderGeometry args={[r, r, 0.22, 24]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.35} /></mesh>
        {Array.from({length: teeth}).map((_, i) => {
          const a = (i / teeth) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * (r + 0.06), 0, Math.sin(a) * (r + 0.06)]} rotation={[0, -a, 0]} castShadow>
              <boxGeometry args={[0.16, 0.22, 0.14]} />
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.0, 0]}><cylinderGeometry args={[r * 0.35, r * 0.35, 0.26, 16]} /><meshStandardMaterial color="#555a66" /></mesh>
      </group>
    </group>
  </group>
);

// pacote que voa em arco (local)
export const Pkt = ({tau, a, b, t0, t1, color, text, h = 1.2, s = 0.34}) => {
  if (tau < t0 || tau > t1 + 0.15) return null;
  const k = prog(tau, t0, t1);
  const sc = prog(tau, t0, t0 + 0.1) * (1 - prog(tau, t1, t1 + 0.15));
  return <Cube p={arc3(a, b, easeInOut(k), h)} s={s} color={color} text={text} k={Math.max(sc, 0.004)} rot={[0, k * 3, 0]} />;
};

export const Coin = ({p, k = 1, color = '#ffd23f'}) => (
  <mesh position={p} scale={k} castShadow>
    <cylinderGeometry args={[0.2, 0.2, 0.06, 20]} />
    <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} emissive={color} emissiveIntensity={0.15} />
  </mesh>
);

// cabo entre estações (coordenadas de mundo)
export const Link = ({t, t0, x0, x1, color = '#5ec2ff', y = 1.1, z = 1.2}) => {
  if (t < t0) return null;
  const k = easeOut(prog(t, t0, t0 + 0.7));
  const len = x1 - x0;
  return (
    <group position={[x0, y, z]}>
      <group scale={[Math.max(k, 0.001), 1, 1]}>
        <mesh position={[len / 2, 0, 0]} castShadow>
          <boxGeometry args={[len, 0.1, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.4} />
        </mesh>
      </group>
      <RBox size={[0.18, 0.2, 0.2]} r={0.05} color="#fff" position={[0, 0.02, 0]} />
      {k > 0.97 && <RBox size={[0.18, 0.2, 0.2]} r={0.05} color="#fff" position={[len, 0.02, 0]} />}
      {k > 0.97 && [0, 1].map((i) => {
        const ph = (((t - t0) * 0.55 + i * 0.5) % 1);
        return (
          <mesh key={i} position={[len * ph, 0.12, 0]} scale={0.8 * Math.sin(Math.PI * ph) + 0.2}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={1.2} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- Wire
// cabo entre DOIS objetos (coords locais da estação): cresce de a até b, tem plugues nas pontas
// e pulsos de dado no sentido do fluxo. dir: 1 = a->b, -1 = b->a, 0 = vai e volta.
// cut = cabo rompido (cinza, sem fluxo).
const WN = 28;
export const Wire = ({tau, t0, a, b, color = '#5ec2ff', lift = 0.25, side = 0, r = 0.045, dur = 0.5, dir = 1, cut = false, pulses = 2, speed = 0.7}) => {
  const curve = useMemo(() => {
    const m = [(a[0] + b[0]) / 2 + side * 0.0, Math.max(a[1], b[1]) + lift, (a[2] + b[2]) / 2 + side];
    return new THREE.CatmullRomCurve3([new THREE.Vector3(...a), new THREE.Vector3(...m), new THREE.Vector3(...b)]);
  }, [a[0], a[1], a[2], b[0], b[1], b[2], lift, side]);
  const k = easeOut(prog(tau, t0, t0 + dur));
  const n = Math.max(2, Math.round(k * WN));
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve.getPoints(WN).slice(0, n + 1)), n * 2, r, 8, false), [curve, n, r]);
  if (tau < t0 || k < 0.02) return null;
  const col = cut ? '#7b7f8a' : color;
  const done = k > 0.97;
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={cut ? 0 : 0.5} roughness={0.4} />
      </mesh>
      <RBox size={[0.17, 0.17, 0.17]} r={0.04} color="#fff" position={a} />
      {done && <RBox size={[0.17, 0.17, 0.17]} r={0.04} color="#fff" position={b} />}
      {done && !cut && Array.from({length: pulses}).map((_, i) => {
        const raw = ((tau - t0 - dur) * speed + i / pulses) % 1;
        const ph = dir === 0 ? 0.5 - 0.5 * Math.cos(raw * Math.PI * 2) : dir > 0 ? raw : 1 - raw;
        const p = curve.getPoint(clamp(ph, 0, 1));
        return (
          <mesh key={i} position={[p.x, p.y + 0.09, p.z]} scale={0.75 * Math.sin(Math.PI * raw) + 0.25}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color="#fff" emissive={col} emissiveIntensity={1.3} />
          </mesh>
        );
      })}
    </group>
  );
};
