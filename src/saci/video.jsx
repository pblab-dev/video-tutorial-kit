import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RBox, Env} from '../World.jsx';
import {FontGate} from '../fonts.jsx';
import {MONT, Floor} from '../badger/concept.jsx';
import {Room} from '../badger/rich.jsx';
import {Saci, Ground, Forest, Whirl, Tree, DUSK, RED} from './concept.jsx';
import {Quadro, usePhoto, QL} from './quadro.jsx';
import TL from '../../content/saci/timeline.json';

export const FPS = 30;
const TAIL = 0.9;
export const SACI_DURATION = Math.ceil((TL.duration + TAIL) * FPS);

const clamp = (x) => Math.min(1, Math.max(0, x));
const ez = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
const pr = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const backOut = (k) => { const c = 2.70158; k = clamp(k); return 1 + c * Math.pow(k - 1, 3) + (c - 1) * Math.pow(k - 1, 2); };
const M = ({c, r = 0.8, ...o}) => <meshStandardMaterial color={c} roughness={r} {...o} />;

// ---------------- palco ----------------
const Rig = ({pos, target, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(...target); camera.updateMatrixWorld();
  return null;
};
const camAt = (c, k) => {
  const T = c.target; const T2 = c.target2 || T; const e = ez(k);
  const tt = [lerp(T[0], T2[0], e), lerp(T[1], T2[1], e), lerp(T[2], T2[2], e)];
  const dy = c.dy ?? 0.9;
  const tg = [tt[0], tt[1] - dy, tt[2]];
  const kk = (Array.isArray(c.k) ? lerp(c.k[0], c.k[1], e) : (c.k ?? 1)) * (c.km ?? 1.5);
  const ang = (Array.isArray(c.orb) ? lerp(c.orb[0], c.orb[1], e) : (c.orb || 0)) * Math.PI / 180;
  const v = [c.pos[0] - T[0], c.pos[1] - T[1], c.pos[2] - T[2]];
  const vx = v[0] * Math.cos(ang) + v[2] * Math.sin(ang); const vz = -v[0] * Math.sin(ang) + v[2] * Math.cos(ang);
  return {pos: [tg[0] + vx * kk, tg[1] + v[1] * kk, tg[2] + vz * kk], target: tg, fov: c.fov || 32};
};
const Stage = ({cam: c, k, L, children}) => {
  const {width, height} = useVideoConfig();
  const cam = camAt(c, k);
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{fov: cam.fov, position: cam.pos, near: 0.1, far: 200}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: L.exposure || 1}}>
      <Rig pos={cam.pos} target={cam.target} fov={cam.fov} />
      <color attach="background" args={[L.bg]} />
      {L.fog && <fog attach="fog" args={[L.fog, 16, 46]} />}
      <Env intensity={L.env ?? 0.5} />
      <hemisphereLight args={[L.sky || '#fff', L.gnd || '#d8c8a0', L.hemi ?? 0.7]} />
      <directionalLight position={L.sunPos || [4, 8, 5]} intensity={L.sunI ?? 2.4} color={L.sunCol || '#fff0dc'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={0.5} shadow-camera-far={40} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      {children}
    </ThreeCanvas>
  );
};

// ---------------- adereços ----------------
const Fireflies = ({ts, n = 24}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const a = rnd(i) * 6.28 + ts * (0.25 + rnd(i + 3) * 0.4);
      return <mesh key={i} position={[Math.cos(a) * (2 + rnd(i + 7) * 6), 0.8 + rnd(i + 9) * 4.2 + Math.sin(ts * 1.5 + i) * 0.2, -1 + Math.sin(a) * (1.5 + rnd(i + 5) * 4)]}>
        <sphereGeometry args={[0.045, 8, 8]} /><meshBasicMaterial color="#e9ff7a" />
      </mesh>;
    })}
  </group>
);
const Moon = ({p = [-9, 11, -16], r = 1.6, color = '#fff6d6'}) => (
  <mesh position={p}><sphereGeometry args={[r, 24, 18]} /><meshBasicMaterial color={color} /></mesh>
);
const Puff = ({src, ts, n = 16, color = '#777', size = 0.35, rise = 1.6, spread = 0.5, per = 1.8}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const age = ((ts - i * (per / n)) % per + per) % per; if (ts < i * (per / n)) return null;
      const k = age / per;
      return <mesh key={i} position={[src[0] + Math.sin(i * 2.7 + age * 2) * spread * k, src[1] + rise * age * 1.1, src[2] + Math.cos(i * 1.9) * spread * k]} scale={size * (0.6 + k * 2.4)}>
        <sphereGeometry args={[1, 14, 12]} /><meshStandardMaterial color={color} transparent opacity={0.65 * (1 - k)} roughness={1} depthWrite={false} />
      </mesh>;
    })}
  </group>
);
const Sparks = ({c, ts, n = 26, rad = 1.6, color = '#ffe45a'}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const per = 1.1; const age = ((ts + rnd(i) * per) % per) / per; const a = rnd(i + 2) * 6.28; const b = (rnd(i + 5) - 0.2) * 2.4;
      const r = 0.3 + age * rad;
      return <mesh key={i} position={[c[0] + Math.cos(a) * r, c[1] + Math.sin(b) * r * 0.8 + age * 0.5, c[2] + Math.sin(a) * r * 0.8]} scale={(1 - age) * 1.2}>
        <octahedronGeometry args={[0.07, 0]} /><meshBasicMaterial color={color} />
      </mesh>;
    })}
  </group>
);
const Tire = ({p, s = 1, ts}) => (
  <group position={p} scale={s} rotation={[0, 0.3, ts * 2]}>
    <mesh castShadow><torusGeometry args={[0.55, 0.24, 16, 36]} /><M c="#1e1e22" r={0.9} /></mesh>
    <mesh position={[0, 0, 0.0]} castShadow><cylinderGeometry args={[0.32, 0.32, 0.3, 24]} /><M c="#b9bdc7" r={0.3} metalness={0.7} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.32, 0.32, 0.34, 24]} /><M c="#b9bdc7" r={0.3} metalness={0.7} /></mesh>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.2566) * 0.2, Math.sin(i * 1.2566) * 0.2, 0.17]}><sphereGeometry args={[0.04, 8, 8]} /><M c="#555" /></mesh>)}
  </group>
);
const Battery = ({p, ts, t0, s = 1}) => {
  const lv = Math.min(4, Math.floor(Math.max(0, ts - t0) / 0.28));
  const pop = backOut(pr(ts, t0 - 0.2, t0 + 0.1));
  return (
    <group position={[p[0], p[1] + Math.sin(ts * 2.4) * 0.08, p[2]]} scale={s * pop} rotation={[0, 0.0, 0.0]}>
      <RBox size={[2.2, 1.2, 0.5]} r={0.2} color="#2b2f38" rough={0.4} position={[0, 0, 0]} />
      <RBox size={[0.22, 0.5, 0.4]} r={0.08} color="#2b2f38" rough={0.4} position={[1.2, 0, 0]} />
      {[0, 1, 2, 3].map((i) => (i < lv || (lv >= 4 && Math.floor(ts * 3) % 2 === 0 && false)) ? <RBox key={i} size={[0.38, 0.8, 0.12]} r={0.05} color="#52e05a" rough={0.3} emissive="#34c43e" emissiveIntensity={0.9} position={[-0.75 + i * 0.5, 0, 0.28]} /> : <RBox key={i} size={[0.38, 0.8, 0.1]} r={0.05} color="#3b414c" rough={0.6} position={[-0.75 + i * 0.5, 0, 0.27]} />)}
      <mesh position={[0, 0, 0.4]} scale={[1, 1, 1]}><planeGeometry args={[0.001, 0.001]} /><meshBasicMaterial color="#fff" /></mesh>
    </group>
  );
};
const SoundRings = ({c, ts, t0 = 0}) => (
  <group>
    {[0, 1, 2, 3].map((i) => {
      const age = ((ts - t0 - i * 0.45) % 1.8 + 1.8) % 1.8; if (ts - t0 < i * 0.45) return null; const k = age / 1.8;
      return <mesh key={i} position={c}><torusGeometry args={[0.4 + k * 3.2, 0.05, 8, 48]} /><meshBasicMaterial color="#ffe9a0" transparent opacity={0.8 * (1 - k)} /></mesh>;
    })}
  </group>
);

// cavalo com trança
const Horse = ({p, ts, braids = 0, t0 = 0}) => (
  <group position={p}>
    <mesh position={[0, 1.75, 0]} scale={[1.6, 0.78, 0.72]} castShadow><sphereGeometry args={[1, 28, 20]} /><M c="#7a4a2a" r={0.85} /></mesh>
    {[[-0.95, 0.4], [-0.95, -0.4], [0.9, 0.4], [0.9, -0.4]].map(([x, z], i) => (
      <group key={i}>
        <mesh position={[x, 0.9, z]} castShadow><cylinderGeometry args={[0.15, 0.1, 1.6, 12]} /><M c="#6e4226" r={0.9} /></mesh>
        <mesh position={[x, 0.08, z]} castShadow><cylinderGeometry args={[0.13, 0.15, 0.18, 12]} /><M c="#2a1c12" r={0.8} /></mesh>
      </group>
    ))}
    <mesh position={[1.35, 2.5, 0]} rotation={[0, 0, -0.75]} castShadow><cylinderGeometry args={[0.36, 0.52, 1.7, 18]} /><M c="#7a4a2a" r={0.85} /></mesh>
    <group position={[2.05, 3.25, 0]} rotation={[0, 0, -0.55]}>
      <mesh scale={[1.0, 0.5, 0.42]} castShadow><sphereGeometry args={[0.6, 20, 16]} /><M c="#7a4a2a" r={0.85} /></mesh>
      <mesh position={[0.5, -0.1, 0]} scale={[0.5, 0.4, 0.36]}><sphereGeometry args={[0.4, 16, 12]} /><M c="#c9a27a" r={0.85} /></mesh>
      <mesh position={[0.05, 0.1, 0.34]}><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color="#120a06" /></mesh>
      {[-0.17, 0.17].map((z, i) => <mesh key={i} position={[-0.2, 0.4, z]} rotation={[0, 0, 0.2]}><coneGeometry args={[0.1, 0.35, 8]} /><M c="#6e4226" /></mesh>)}
    </group>
    {/* crina */}
    {Array.from({length: 9}).map((_, i) => { const t = i / 8; const x = lerp(0.95, 1.65, t) - 0.28; const y = lerp(2.0, 3.05, t) + 0.28; return <mesh key={i} position={[x, y, 0]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.1, 0.45, 8]} /><M c="#2a1a10" r={1} /></mesh>; })}
    <mesh position={[-1.55, 1.9, 0]} rotation={[0, 0, 0.9]}><coneGeometry args={[0.16, 1.2, 10]} /><M c="#2a1a10" r={1} /></mesh>
    {/* tranças */}
    {Array.from({length: 6}).map((_, i) => {
      const t = i / 5; const x = lerp(1.0, 1.55, t) - 0.28; const y = lerp(2.05, 2.95, t) + 0.12; const a = backOut(pr(ts, t0 + i * 0.28, t0 + i * 0.28 + 0.3)) * (braids ? 1 : 0); if (a <= 0.01) return null;
      return (
        <group key={i} position={[x - 0.05, y, 0.4]} scale={a}>
          {[0, 1, 2, 3, 4].map((j) => <mesh key={j} position={[-0.04 * j, -0.17 * j, (j % 2 ? 0.04 : -0.04)]} castShadow><sphereGeometry args={[0.1 - j * 0.008, 10, 10]} /><M c={j % 2 ? '#2a1a10' : '#3b2616'} r={0.9} /></mesh>)}
          <mesh position={[-0.2, -0.86, 0]}><sphereGeometry args={[0.11, 10, 10]} /><M c="#ff4aa0" r={0.4} emissive="#ff2a88" emissiveIntensity={0.4} /></mesh>
        </group>
      );
    })}
  </group>
);

// trasgo (duende de gorro vermelho)
const Trasgo = ({p, ts, s = 1}) => {
  const hop = Math.abs(Math.sin(ts * 3.2)) * 0.25;
  return (
    <group position={[p[0], p[1] + hop, p[2]]} scale={s} rotation={[0, Math.sin(ts * 1.2) * 0.4, 0]}>
      <mesh position={[0, 0.75, 0]} castShadow><coneGeometry args={[0.55, 1.2, 18]} /><M c="#4f7a3a" r={0.9} /></mesh>
      <mesh position={[0, 0.55, 0]}><torusGeometry args={[0.38, 0.05, 8, 24]} /><M c="#3a2a14" /></mesh>
      <mesh position={[0, 1.6, 0]} castShadow><sphereGeometry args={[0.42, 20, 16]} /><M c="#d0a47c" r={0.7} /></mesh>
      {[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.46, 1.68, 0]} rotation={[0, 0, -sx * 1.15]} castShadow><coneGeometry args={[0.13, 0.5, 8]} /><M c="#d0a47c" r={0.7} /></mesh>)}
      <mesh position={[0, 1.55, 0.42]}><sphereGeometry args={[0.09, 10, 10]} /><M c="#c28a62" /></mesh>
      {[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.15, 1.7, 0.36]}><sphereGeometry args={[0.055, 10, 10]} /><meshBasicMaterial color="#111" /></mesh>)}
      <mesh position={[0, 2.15, 0]} rotation={[0.2, 0, 0.15]} castShadow><coneGeometry args={[0.4, 0.95, 20]} /><M c={RED} r={0.8} emissive={RED} emissiveIntensity={0.25} /></mesh>
      <mesh position={[0, 1.88, 0]}><cylinderGeometry args={[0.43, 0.43, 0.14, 20]} /><M c={RED} r={0.8} /></mesh>
      {[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.2, 0.1, 0.1]} castShadow><sphereGeometry args={[0.16, 10, 10]} /><M c="#3a2a14" /></mesh>)}
    </group>
  );
};
const Shroom = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.1, 0.13, 0.4, 10]} /><M c="#f2ead8" /></mesh>
    <mesh position={[0, 0.42, 0]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.3, 16, 12, 0, 6.283, 0, 1.6]} /><M c="#e0392d" r={0.6} /></mesh>
  </group>
);
const Hills = ({color = '#2f4a3a'}) => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 80]} /><M c={color} r={1} /></mesh>
    {[[-7, -9, 6, 3], [4, -12, 8, 4.4], [-1, -16, 10, 5], [10, -7, 5, 2.6], [-12, -13, 7, 4]].map(([x, z, w, h], i) => <mesh key={i} position={[x, -0.2, z]} scale={[w, h, w * 0.8]} receiveShadow castShadow><sphereGeometry args={[1, 28, 16]} /><M c={i % 2 ? '#26402f' : '#2f4a3a'} r={1} /></mesh>)}
    {Array.from({length: 18}).map((_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 20, 0.35, -3 - rnd(i + 3) * 7]} rotation={[0, 0, 0]} castShadow><dodecahedronGeometry args={[0.35 + rnd(i + 6) * 0.45, 0]} /><M c="#6c7078" r={1} /></mesh>)}
  </>
);

// cozinha
const Kitchen = () => (
  <>
    <Floor tex={false} color="#dcc9a2" />
    <RBox size={[18, 6.2, 0.3]} r={0.04} color="#e9d79b" position={[0, 3.1, -3.2]} rough={0.95} />
    <RBox size={[9, 1.0, 1.0]} r={0.06} color="#8a5a34" position={[-1.2, 0.5, -2.6]} rough={0.8} />
    <RBox size={[9, 0.12, 1.1]} r={0.03} color="#e8e2d4" position={[-1.2, 1.05, -2.6]} rough={0.4} />
    <RBox size={[2.2, 1.0, 0.2]} r={0.05} color="#7a4a2a" position={[3.6, 4.2, -2.9]} rough={0.8} />
    {[0, 1, 2].map((i) => <mesh key={i} position={[-3.6 + i * 1.0, 3.6, -2.9]}><cylinderGeometry args={[0.28, 0.28, 0.5, 14]} /><M c={['#c0503a', '#e5a63a', '#4f9a7a'][i]} /></mesh>)}
    {/* mesa */}
    <RBox size={[3.6, 0.14, 1.9]} r={0.05} color="#a8703c" position={[2.0, 1.2, 0.2]} rough={0.7} />
    {[[-1.6, -0.8], [1.6, -0.8], [-1.6, 0.8], [1.6, 0.8]].map(([x, z], i) => <RBox key={i} size={[0.18, 1.2, 0.18]} r={0.05} color="#8a5a30" position={[2.0 + x, 0.6, 0.2 + z]} />)}
  </>
);
const Jar = ({p, fill = 0.7}) => (
  <group position={p}>
    <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.42, 0.42, 1.0, 28]} /><meshStandardMaterial color="#cfe9f5" transparent opacity={0.35} roughness={0.1} depthWrite={false} /></mesh>
    <mesh position={[0, fill * 0.5, 0]}><cylinderGeometry args={[0.38, 0.38, fill, 24]} /><M c="#fffdf6" r={1} /></mesh>
    <mesh position={[0, 1.02, 0]}><cylinderGeometry args={[0.35, 0.35, 0.08, 20]} /><M c="#a8703c" /></mesh>
  </group>
);
const SaltShaker = ({p, tilt = 0}) => (
  <group position={p} rotation={[0, 0, tilt]}>
    <mesh><cylinderGeometry args={[0.2, 0.24, 0.6, 18]} /><meshStandardMaterial color="#e8f4ff" transparent opacity={0.6} roughness={0.1} /></mesh>
    <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.2, 0.2, 0.12, 18]} /><M c="#aab0bb" metalness={0.8} r={0.3} /></mesh>
    <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.18, 0.22, 0.4, 18]} /><M c="#ffffff" r={1} /></mesh>
  </group>
);
const Stove = ({p, ts, burn = 0}) => (
  <group position={p}>
    <RBox size={[2.6, 0.9, 1.6]} r={0.08} color="#3a3d44" rough={0.45} position={[0, 0.45, 0]} />
    {[[-0.6, 0.35], [0.6, 0.35], [-0.6, -0.4], [0.6, -0.4]].map(([x, z], i) => <mesh key={i} position={[x, 0.93, z]}><cylinderGeometry args={[0.28, 0.28, 0.05, 20]} /><M c="#17181c" /></mesh>)}
    <group position={[-0.6, 0.95, 0.35]}>
      {[0, 1, 2, 3, 4, 5].map((i) => <mesh key={i} position={[Math.cos(i * 1.047) * 0.2, 0.12 + 0.03 * Math.sin(ts * 14 + i), Math.sin(i * 1.047) * 0.2]} scale={[1, 1 + 0.3 * Math.sin(ts * 17 + i * 2), 1]}><coneGeometry args={[0.07, 0.3, 8]} /><meshBasicMaterial color={i % 2 ? '#ff9a2a' : '#ffd24a'} /></mesh>)}
      <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.46, 0.4, 0.62, 24]} /><M c={burn > 0.5 ? '#1b1b1b' : '#545861'} r={0.4} metalness={0.5} /></mesh>
      <mesh position={[0, 0.78, 0]}><cylinderGeometry args={[0.42, 0.42, 0.05, 24]} /><M c={burn > 0.5 ? '#2a1608' : '#6b3d1c'} r={1} /></mesh>
      <RBox size={[0.7, 0.1, 0.12]} r={0.04} color="#222" position={[0.7, 0.6, 0]} />
    </group>
  </group>
);

// chibata saindo do quadro em direção à câmera
const Emerge = ({len}) => {
  const curve = useMemo(() => null, []);
  if (len <= 0.05) return null;
  const pts = Array.from({length: 14}, (_, i) => { const u = i / 13; return new THREE.Vector3(lerp(0.15, 0.7, u) + Math.sin(u * 6) * 0.05, lerp(2.7, 3.4, u * u), -2.6 + u * len); });
  const c = new THREE.CatmullRomCurve3(pts);
  return (
    <group>
      <mesh castShadow><tubeGeometry args={[c, 60, 0.26, 20, false]} /><M c="#b4583f" r={0.35} /></mesh>
      <mesh position={pts[13].toArray()} castShadow><sphereGeometry args={[0.26, 20, 16]} /><M c="#b4583f" r={0.45} /></mesh>
      {Array.from({length: 7}).map((_, k) => {
        const vp = Array.from({length: 40}, (_, i) => { const t = 0.03 + (i / 39) * 0.94; const p = c.getPoint(t); const a = k * 0.9 + t * 3; return p.add(new THREE.Vector3(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0)); });
        return <mesh key={k}><tubeGeometry args={[new THREE.CatmullRomCurve3(vp), 60, 0.017, 6, false]} /><M c={k % 2 ? '#6a2b55' : '#8a3a4a'} r={0.4} /></mesh>;
      })}
    </group>
  );
};

// ---------------- cenas ----------------
const SK = <><Ground /><Forest /><Moon /></>;
const NIGHT = {bg: '#0f1a33', sky: '#5d78b8', gnd: '#1e1a12', sunCol: '#aac4ff', sunI: 1.8, hemi: 0.5, env: 0.3, sunPos: [-5, 8, 6], fog: '#0f1a33'};
const KIT = {bg: '#e9d79b', sky: '#fff3d6', gnd: '#b88a52', sunCol: '#ffe9c4', sunI: 2.4, hemi: 0.8, env: 0.5, sunPos: [3, 7, 6]};
const MIST = {bg: '#16243c', sky: '#7fa0d8', gnd: '#1c2a20', sunCol: '#b5ccff', sunI: 1.9, hemi: 0.55, env: 0.3, sunPos: [-5, 8, 5], fog: '#16243c'};

const hopY = (ts, f = 1.7, h = 0.9) => Math.abs(Math.sin(ts * f * 3.1416)) * h;

const SHOTS = [
  // ---- c1 abertura: quadro ----
  {s: 0.0, L: QL, cam: {pos: [1.6, 3.7, 9.5], target: [0.6, 3.7, -3], fov: 34, km: 1, k: [1.05, 0.72], dy: 0.6}, el: (ts, d, g, tex) => (<><Room wall="#a9744a" frames={false} /><Quadro tex={tex} /></>)},
  {s: 1.3, L: QL, cam: {pos: [1.2, 3.6, 4.6], target: [0.6, 3.7, -3], fov: 34, km: 1, k: [1.0, 0.88], dy: 0.5}, el: (ts, d, g, tex) => (<><Room wall="#a9744a" frames={false} /><Quadro tex={tex} /></>)},
  {s: 3.7, L: QL, cam: {pos: [0.9, 3.4, 4.9], target: [0.6, 3.75, -3], fov: 34, km: 1, k: [1.0, 0.86], dy: 0.5}, el: (ts, d, g, tex) => (<><Room wall="#a9744a" frames={false} /><Quadro tex={tex} marks /></>)},
  {s: 5.5, L: QL, cam: {pos: [1.6, 3.7, 9.5], target: [0.6, 3.7, -3], fov: 34, km: 1, k: [0.8, 1.0], dy: 0.6}, el: (ts, d, g, tex) => (<><Room wall="#a9744a" frames={false} /><Quadro tex={tex} marks /></>)},
  // ---- c2 chibata ----
  {s: 7.27, L: DUSK, cam: {pos: [3.2, 2.4, 8.4], target: [0, 2.3, 0], fov: 32, k: [1.5, 1.3], dy: 0.5, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={-0.3} swing={0.05 * Math.sin(ts * 2)} /></>)},
  {s: 8.5, L: DUSK, cam: {pos: [-3.0, 1.4, 5.0], target: [-0.4, 1.3, 0.1], fov: 32, k: [1.2, 1.0], dy: 0.25, orb: [0, 10], km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={0.2} swing={0.04 * Math.sin(ts * 3)} /></>)},
  {s: 11.8, L: DUSK, cam: {pos: [-2.2, 1.2, 4.2], target: [-0.46, 0.6, 0.1], fov: 32, k: [1.3, 1.05], dy: 0.1, orb: [-10, 12], km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={0.2} /></>)},
  {s: 14.0, L: DUSK, cam: {pos: [1.2, 4.2, 5.4], target: [0, 4.0, 0.4], fov: 32, k: [1.3, 1.05], dy: 0.2, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={-0.2 + 0.1 * Math.sin(ts * 3)} /></>)},
  // ---- c3 estepe ----
  {s: 16.26, L: DUSK, cam: {pos: [0, 2.6, 10], target: [-3.4, 2.6, 0], target2: [3.4, 2.6, 0], fov: 32, k: 1.3, dy: 0.3, km: 1}, el: (ts, d, g) => { const x = lerp(-3.4, 3.4, ez(ts / d)); return (<>{SK}<Fireflies ts={ts} /><Saci p={[x, hopY(ts, 1.7, 0.9), 0]} ry={Math.PI / 2 - 0.4} lean={-0.08} swing={0.3 * Math.sin(ts * 5.3)} /></>); }},
  {s: 20.1, L: DUSK, cam: {pos: [1.8, 2.6, 9.5], target: [0, 2.6, 0], fov: 32, k: 1.3, dy: 0.3, km: 1}, el: (ts, d, g) => {
      const sa = pr(ts, 0, 2.9); const sp = [lerp(-8, 8, sa), 7.5 * Math.sin(Math.PI * sa) + 1.2, -12];
      return (<>{SK}<mesh position={sp}><sphereGeometry args={[1.1, 24, 18]} /><meshBasicMaterial color="#ffd24a" /></mesh><Fireflies ts={ts} /><Saci p={[0, hopY(ts, 1.7, 0.7), 0]} ry={-0.5} swing={0.35 * Math.sin(ts * 5.3)} /></>); }},
  {s: 23.0, L: DUSK, cam: {pos: [-3.0, 1.4, 5.0], target: [-0.4, 1.3, 0.1], fov: 32, k: [1.3, 1.05], dy: 0.25, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci p={[0, hopY(ts, 1.7, 0.15), 0]} ry={0.2} swing={0.3 * Math.sin(ts * 5.3)} /></>)},
  {s: 24.5, L: DUSK, cam: {pos: [-3.2, 1.4, 5.4], target: [-0.9, 1.2, 0.1], fov: 32, k: [1.1, 1.25], dy: 0.25, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={0.2} swing={0.06 * Math.sin(ts * 3)} /><Tire p={[-1.7, 0.75 + 0.05 * Math.sin(ts * 3), 0.7]} s={backOut(pr(ts, 0.0, 0.35)) * 0.85} ts={ts * 0.3} /></>)},
  // ---- c4 carapuça ----
  {s: 26.6, L: DUSK, cam: {pos: [1.0, 4.9, 5.4], target: [0, 4.7, 0.1], fov: 32, k: [1.25, 1.05], dy: 0.9, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={0} /></>)},
  {s: 28.3, L: MIST, cam: {pos: [0, 2.2, 7.5], target: [0, 1.4, 0], fov: 32, k: [1.1, 0.9], dy: 0.1, orb: [-20, 10], km: 1}, el: (ts) => (<><Hills /><Moon p={[-6, 9, -14]} /><Shroom p={[-1.6, 0, 1.2]} s={1.2} /><Shroom p={[1.8, 0, 0.8]} /><Shroom p={[-2.4, 0, 0.2]} s={0.8} /><Trasgo p={[0, 0, 0]} ts={ts} /><Fireflies ts={ts} n={14} /></>)},
  {s: 31.0, L: MIST, cam: {pos: [1.2, 2.4, 6.5], target: [0, 1.9, 0], fov: 32, k: [1.1, 0.9], dy: 0.3, orb: [10, -15], km: 1}, el: (ts) => (<><Hills /><Moon p={[-6, 9, -14]} /><Shroom p={[-1.2, 0, 0.9]} s={1.2} /><Trasgo p={[0, 0, 0]} ts={ts} s={1.3} /><Fireflies ts={ts} n={14} /></>)},
  {s: 33.8, L: DUSK, cam: {pos: [1.0, 5.0, 6.0], target: [0, 4.8, 0], fov: 32, k: [1.1, 1.25], dy: 0.9, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={0} glow={0.4 + 0.5 * Math.sin(ts * 6) ** 2} /><Sparks c={[0, 5.0, 0.2]} ts={ts} rad={2.2} /></>)},
  {s: 35.5, L: DUSK, cam: {pos: [0.8, 5.4, 8.6], target: [0, 5.3, 0], fov: 32, k: [1.35, 1.25], dy: 0.5, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={0} glow={0.5 + 0.3 * Math.sin(ts * 6) ** 2} /><Battery p={[0, 6.5, 0.3]} ts={ts} t0={0.3} s={0.85} /><Sparks c={[0, 5.0, 0.2]} ts={ts} rad={1.8} /></>)},
  // ---- c5 travessuras ----
  {s: 37.63, L: DUSK, cam: {pos: [3.4, 3.2, 8.0], target: [0.4, 2.4, 0], fov: 32, k: [1.5, 1.25], dy: 0.5, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Horse p={[-0.8, 0, 0]} ts={ts} braids={1} t0={0.7} /></>)},
  {s: 39.9, L: KIT, cam: {pos: [3.0, 3.0, 6.0], target: [2.0, 1.9, 0.2], fov: 32, k: [1.7, 1.45], dy: 0.5, km: 1}, el: (ts) => {
      const pour = pr(ts, 0.7, 1.1);
      return (<><Kitchen /><Jar p={[1.7, 1.27, 0.1]} fill={0.7 + 0.12 * pr(ts, 0.9, 1.5)} /><Jar p={[2.9, 1.27, 0.0]} fill={0.5} />
        <SaltShaker p={[1.7 + 0.1 * Math.sin(ts * 20) * pour, lerp(3.2, 2.5, ez(pr(ts, 0, 0.5))), 0.1]} tilt={-2.2 * ez(pr(ts, 0.35, 0.8))} />
        {pour > 0.2 && Array.from({length: 14}).map((_, i) => { const age = ((ts * 1.6 + i * 0.07) % 0.6) / 0.6; return <mesh key={i} position={[1.75 + (rnd(i) - 0.5) * 0.15, lerp(2.45, 1.95, age), 0.1 + (rnd(i + 3) - 0.5) * 0.15]}><sphereGeometry args={[0.03, 6, 6]} /><meshBasicMaterial color="#fff" /></mesh>; })}</>); }},
  {s: 41.5, L: KIT, cam: {pos: [-4.4, 2.8, 5.8], target: [-3.6, 2.0, -2.2], fov: 32, k: [1.7, 1.45], dy: 0.5, km: 1}, el: (ts) => (<><Kitchen /><Stove p={[-3.6, 1.1, -2.6]} ts={ts} burn={ts > 0.8 ? 1 : 0} /><Puff src={[-4.2, 2.3, -2.2]} ts={ts} color={ts > 1.3 ? '#222' : '#aaa'} size={0.45} rise={2.0} spread={0.9} /></>)},
  {s: 43.3, L: NIGHT, cam: {pos: [2.6, 2.8, 8.0], target: [-0.3, 2.6, 0], fov: 32, k: [1.5, 1.3], dy: 0.4, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Tree p={[1.8, 0, -1.6]} s={1.4} /><Saci p={[-0.6, 0, -0.4]} ry={0.6} /><SoundRings c={[-0.5, 4.0, 0.6]} ts={ts} t0={0.1} /></>)},
  {s: 45.8, L: DUSK, cam: {pos: [3.5, 3.2, 8.0], target: [0, 2.8, 0], fov: 32, k: [1.55, 1.45], dy: 0.4, orb: [-25, 25], km: 1}, el: (ts) => (<>{SK}<Whirl t={ts * 2.2} n={90} /><Saci p={[0, 0.6 + 0.4 * Math.sin(ts * 3), 0]} ry={ts * 6} lean={0.2} /></>)},
  // ---- c6 fecho ----
  {s: 49.44, L: DUSK, cam: {pos: [3.2, 2.4, 8.4], target: [0, 2.3, 0], fov: 32, k: [1.6, 1.4], dy: 0.5, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={-0.3} /></>)},
  {s: 50.4, L: DUSK, cam: {pos: [2.6, 1.6, 4.4], target: [0.45, 1.0, 0.1], fov: 32, k: [1.6, 1.35], dy: 0.3, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={-0.2} /></>)},
  {s: 51.4, L: DUSK, cam: {pos: [1.0, 4.9, 5.4], target: [0, 4.7, 0.1], fov: 32, k: [1.25, 1.05], dy: 0.9, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={0} glow={0.3} /></>)},
  {s: 52.6, L: DUSK, cam: {pos: [-3.0, 1.4, 5.0], target: [-0.4, 1.3, 0.1], fov: 32, k: [1.2, 1.0], dy: 0.25, km: 1}, el: (ts) => (<>{SK}<Fireflies ts={ts} /><Saci ry={0.2} swing={0.1 * Math.sin(ts * 4)} /></>)},
  {s: 53.8, L: QL, cam: {pos: [1.6, 3.7, 9.5], target: [0.6, 3.7, -3], fov: 34, km: 1, k: [0.95, 0.8], dy: 0.6}, el: (ts, d, g, tex) => (<><Room wall="#a9744a" frames={false} /><Quadro tex={tex} rz={g > 55.1 && g < 56.0 ? 0.05 * Math.sin((g - 55.1) * 45) : 0} flash={g > 55.1 && g < 55.45 ? 1 : 0} /></>)},
  {s: 56.0, L: QL, cam: {pos: [0.9, 3.4, 4.9], target: [0.6, 3.75, -3], fov: 34, km: 1, k: [1.05, 0.9], dy: 0.5}, el: (ts, d, g, tex) => (<><Room wall="#a9744a" frames={false} /><Quadro tex={tex} /><Emerge len={lerp(0.1, 8.6, ez(pr(g, 57.2, 58.8)))} /></>)},
];

const LABELS = [
  {a: 0.0, b: 3.7, t: 'O SACI PERERÊ'},
  {a: 3.7, b: 7.2, t: 'MAS ESPERA...'},
  {a: 8.5, b: 11.7, t: 'A CHIBATA DELE'},
  {a: 24.5, b: 26.6, t: 'O ESTEPE DELE'},
  {a: 26.7, b: 28.2, t: 'A CARAPUÇA DELE'},
  {a: 35.5, b: 37.6, t: 'A BATERIA DELE'},
  {a: 37.7, b: 39.8, t: 'TRANÇA NA CRINA'},
  {a: 47.5, b: 49.4, t: 'O UBER DELE'},
  {a: 53.8, b: 55.9, t: 'O SACI É DANADO'},
];
const PILLS = [
  {a: 9.9, b: 10.6, t: 'GROSSA'},
  {a: 10.6, b: 11.8, t: 'CHEIA DE VEIA'},
  {a: 11.8, b: 14.0, t: 'ENFIADA NO TÊNIS'},
  {a: 14.0, b: 16.0, t: 'VIU, HEIN?', red: true},
  {a: 17.4, b: 20.0, t: 'PERERÊ = IR AOS SALTOS'},
  {a: 22.1, b: 23.0, t: '1 PERNA SÓ'},
  {a: 28.3, b: 29.1, t: 'PORTUGAL'},
  {a: 29.1, b: 31.0, t: 'TRASGO · TRÁS-OS-MONTES'},
  {a: 32.4, b: 33.7, t: 'GORRO VERMELHO'},
  {a: 34.5, b: 35.4, t: 'PODERES!', big: true},
  {a: 40.2, b: 41.4, t: 'SAL NO AÇÚCAR', red: true},
  {a: 41.8, b: 43.2, t: 'FEIJÃO TORRADO', red: true},
  {a: 43.3, b: 44.5, t: 'ASSOBIO'},
  {a: 44.6, b: 45.7, t: 'DE ONDE VEM?', red: true},
  {a: 48.3, b: 49.4, t: 'NOTA 4,9 · SEM PLACA'},
  {a: 50.4, b: 51.4, t: '1 PERNA'},
  {a: 51.4, b: 52.6, t: '1 CARAPUÇA'},
  {a: 52.6, b: 53.8, t: '1 CHIBATA', red: true},
];
const QMARK = {a: 4.5, b: 7.3};

const WORDS = TL.segments.flatMap((s) => s.words);
const Karaoke = ({t}) => {
  let idx = -1; for (let i = 0; i < WORDS.length; i++) if (WORDS[i].s - 0.03 <= t) idx = i;
  if (idx < 0) return null;
  const w = WORDS[idx], nx = WORDS[idx + 1]; const hide = Math.min(w.e + 0.4, nx ? nx.s : 1e9);
  if (t > hide && !(idx === WORDS.length - 1 && t < w.e + 0.9)) return null;
  const k = backOut(pr(t, w.s - 0.03, w.s + 0.1)); const txt = w.w.replace(/[.,!?…:;"“”]/g, '');
  return <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 54, color: '#fff', textShadow: '0 3px 12px rgba(0,0,0,.6)', transform: `scale(${0.85 + 0.15 * k})`}}>{txt}</div>;
};

export const SaciVideo = ({tList}) => {
  const frame = useCurrentFrame();
  const g = tList ? tList[frame] : frame / FPS;
  const tex = usePhoto();
  let si = 0; for (let i = 0; i < SHOTS.length; i++) if (g >= SHOTS[i].s - 1e-6) si = i;
  const sh = SHOTS[si]; const end = si < SHOTS.length - 1 ? SHOTS[si + 1].s : TL.duration + TAIL;
  const ts = g - sh.s; const dur = end - sh.s;
  const lab = LABELS.find((l) => g >= l.a && g < l.b);
  const pills = PILLS.filter((p) => g >= p.a && g < p.b);
  const black = pr(g, 58.95, 59.15);
  return (
    <AbsoluteFill style={{background: sh.L.bg}}>
      {!tList && <Audio src={staticFile('saci/voz.mp3')} />}
      <FontGate>
        <Stage cam={sh.cam} k={ts / dur} L={sh.L}>{sh.el(ts, dur, g, tex)}</Stage>
        {lab && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: MONT}}>
            <span style={{display: 'inline-block', transform: `rotate(-3deg) scale(${backOut(pr(g, lab.a, lab.a + 0.25))})`, fontWeight: 900, fontSize: lab.t.length > 16 ? 36 : 44, letterSpacing: 1, color: '#ffd23f', WebkitTextStroke: '7px #3b2412', paintOrder: 'stroke fill', textShadow: '0 3px 0 #3b2412'}}>{lab.t}</span>
          </div>
        )}
        {pills.map((p) => (
          <div key={p.t} style={{position: 'absolute', left: 0, right: 0, top: p.big ? 300 : 290, textAlign: 'center', fontFamily: MONT}}>
            <span style={{display: 'inline-block', transform: `scale(${backOut(pr(g, p.a, p.a + 0.25))})`, fontWeight: 900, fontSize: p.big ? 84 : 32, padding: p.big ? '8px 36px' : '10px 26px', borderRadius: 999, background: p.red ? '#e5392d' : '#fff', color: p.red ? '#fff' : '#2a1608', boxShadow: '0 6px 0 rgba(0,0,0,.35)'}}>{p.t}</span>
          </div>
        ))}
        {g >= QMARK.a && g < QMARK.b && (
          <div style={{position: 'absolute', left: 330, right: 0, top: 330, textAlign: 'center', fontFamily: MONT, fontWeight: 900, fontSize: 170, color: '#ffd23f', WebkitTextStroke: '10px #3b2412', paintOrder: 'stroke fill', transform: `rotate(8deg) scale(${backOut(pr(g, QMARK.a, QMARK.a + 0.25))})`, textShadow: '0 6px 0 #3b2412'}}>?</div>
        )}
        <Karaoke t={g} />
        {black > 0 && <AbsoluteFill style={{background: '#000', opacity: black}} />}
      </FontGate>
    </AbsoluteFill>
  );
};

export const SACI_CHECK_T = SHOTS.map((s, i) => { const e = i < SHOTS.length - 1 ? SHOTS[i + 1].s : TL.duration; return s.s + Math.min(1.2, (e - s.s) * 0.7); });
export const SACI_SHOTS_N = SHOTS.length;
