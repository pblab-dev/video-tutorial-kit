import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RBox, Env} from '../World.jsx';
import {FontGate} from '../fonts.jsx';
import {Badger} from './badger.jsx';
import {Room, Savanna, Hoodie2, Smoker2} from './rich.jsx';
import {MONT, Floor, Wall, Sofa, Snake, Hive, Sand, Dune, Acacia, WARM, NAVY, GRAY, GOLD} from './concept.jsx';
import TL from '../../content/badger/timeline.json';

export const FPS = 30;
const TAIL = 1.6;
export const BADGER_DURATION = Math.ceil((TL.duration + TAIL) * FPS);

const clamp = (x) => Math.min(1, Math.max(0, x));
const ez = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
const pr = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const backOut = (k) => { const c = 2.70158; k = clamp(k); return 1 + c * Math.pow(k - 1, 3) + (c - 1) * Math.pow(k - 1, 2); };

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
  const kk = Array.isArray(c.k) ? lerp(c.k[0], c.k[1], e) : (c.k ?? 1.9);
  const ang = (Array.isArray(c.orb) ? lerp(c.orb[0], c.orb[1], e) : (c.orb || 0)) * Math.PI / 180;
  const v = [c.pos[0] - T[0], c.pos[1] - T[1], c.pos[2] - T[2]];
  const vx = v[0] * Math.cos(ang) + v[2] * Math.sin(ang); const vz = -v[0] * Math.sin(ang) + v[2] * Math.cos(ang);
  return {pos: [tg[0] + vx * kk, tg[1] + v[1] * kk + 0.4, tg[2] + vz * kk], target: tg, fov: c.fov || 32};
};

const Stage = ({cam: c, k, L, children}) => {
  const {width, height} = useVideoConfig();
  const cam = camAt(c, k);
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{fov: cam.fov, position: cam.pos, near: 0.1, far: 200}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: L.exposure || 1}}>
      <Rig pos={cam.pos} target={cam.target} fov={cam.fov} />
      <color attach="background" args={[L.bg]} />
      {L.fog && <fog attach="fog" args={[L.fog, 14, 40]} />}
      <Env intensity={L.env ?? 0.5} />
      <hemisphereLight args={[L.sky || '#fff', L.gnd || '#d8c8a0', L.hemi ?? 0.7]} />
      <directionalLight position={L.sunPos || [4, 8, 5]} intensity={L.sunI ?? 2.4} color={L.sunCol || '#fff0dc'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-camera-near={0.5} shadow-camera-far={30} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      {children}
    </ThreeCanvas>
  );
};

// ---------------- personagem com movimento ----------------
const Bg = ({p = [0, 0, 0], ry = 0, s = 1, twist = 0, lowerHead = 0, ts = 0, bob = 0.6, pitch = 0, roll = 0, walk = 0}) => {
  const b = bob ? Math.sin(ts * bob * 6.283) * 0.025 : 0;
  const w = walk ? Math.abs(Math.sin(ts * walk * 6.283)) * 0.07 : 0;
  const sway = walk ? Math.sin(ts * walk * 6.283) * 0.04 : 0;
  return (
    <group position={[p[0], p[1] + b + w, p[2]]} rotation={[pitch, 0, roll + sway]}>
      <Badger p={[0, 0, 0]} ry={ry} s={s} twist={twist} lowerHead={lowerHead} layers={12} />
    </group>
  );
};

// ---------------- adereços ----------------
const Bounce = ({ts, t0, from, to, children, spin = 6}) => {
  const tau = ts - t0; if (tau < 0) return null;
  let pos;
  if (tau < 0.35) { const k = tau / 0.35; pos = [lerp(from[0], to[0], k), lerp(from[1], to[1], k), lerp(from[2], to[2], k)]; }
  else { const u = tau - 0.35; pos = [to[0] + (from[0] - to[0]) * u * 1.3, to[1] + (from[1] - to[1]) * u * 1.3 + 3.2 * u - 5 * u * u, to[2] + (from[2] - to[2]) * u * 1.3]; }
  if (pos[1] < 0.05) return null;
  return <group position={pos} rotation={[tau * spin, tau * spin * 0.7, 0]}>{children}</group>;
};
const BeeP = () => (<group scale={2.4}><mesh scale={[1, 0.8, 1.5]} castShadow><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color="#f2b705" roughness={0.5} /></mesh><mesh position={[0, 0, -0.03]} scale={[1.02, 0.82, 0.3]}><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color="#2a2214" /></mesh><mesh position={[0, 0.08, 0]} scale={[1.6, 0.05, 0.9]}><sphereGeometry args={[0.08, 10, 6]} /><meshStandardMaterial color="#dfeeff" transparent opacity={0.7} /></mesh></group>);
const ThornP = () => (<mesh castShadow scale={2}><coneGeometry args={[0.06, 0.4, 8]} /><meshStandardMaterial color="#5a3f22" roughness={0.8} /></mesh>);
const ToothP = () => (<mesh castShadow scale={2}><coneGeometry args={[0.09, 0.3, 10]} /><meshStandardMaterial color="#fffaf0" roughness={0.3} /></mesh>);
const DropP = () => (<mesh castShadow scale={[1, 1.4, 1]}><sphereGeometry args={[0.1, 14, 12]} /><meshStandardMaterial color="#7be047" roughness={0.2} emissive="#2d8a10" emissiveIntensity={0.35} /></mesh>);

const OrbitBees = ({c, ts, n = 30, rad = 1.4, speed = 3, calm = 0}) => {
  const sp = lerp(speed, 0.5, calm); const rr = lerp(rad, rad * 0.6, calm);
  return (
    <group>
      {Array.from({length: n}).map((_, i) => {
        const a = rnd(i) * 6.28 + ts * sp * (0.6 + rnd(i + 5)); const b = 0.4 + rnd(i + 50) * 2.4; const r = 0.4 + rnd(i + 90) * rr;
        return (
          <mesh key={i} position={[c[0] + Math.cos(a) * Math.sin(b) * r, c[1] + Math.cos(b) * r * 0.7 + Math.sin(ts * 9 + i) * 0.04, c[2] + Math.sin(a) * Math.sin(b) * r]} scale={[1.3, 1.1, 2]} castShadow>
            <sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color={i % 3 ? '#f2b705' : '#2a2214'} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

const Smoke = ({src, ts, t0 = 0, n = 14, dir = [0.6, 0.5, -0.2], color = '#9bb86a', size = 0.3}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const per = 1.6; const age = ((ts - t0 - i * (per / n)) % per + per) % per; if (ts - t0 < i * (per / n)) return null;
      const k = age / per;
      return (
        <mesh key={i} position={[src[0] + dir[0] * age * 1.2 + Math.sin(i * 3) * 0.1, src[1] + dir[1] * age * 1.3 + 0.2 * age, src[2] + dir[2] * age * 1.2 + Math.cos(i * 2) * 0.1]} scale={size * (0.5 + k * 2.4)}>
          <sphereGeometry args={[1, 14, 12]} /><meshStandardMaterial color={color} transparent opacity={0.55 * (1 - k)} roughness={1} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

const Dirt = ({src, ts, t0 = 0, dirx = -1}) => (
  <group>
    {Array.from({length: 16}).map((_, i) => {
      const per = 0.9; const off = rnd(i) * per; const age = ((ts - t0 + off) % per + per) % per;
      const vx = dirx * (1.2 + rnd(i + 3) * 1.8); const vy = 2.2 + rnd(i + 8) * 1.8; const vz = (rnd(i + 12) - 0.5) * 1.6;
      const y = src[1] + vy * age - 5 * age * age; if (y < 0.03) return null;
      return <mesh key={i} position={[src[0] + vx * age, y, src[2] + vz * age]} castShadow scale={0.5 + rnd(i + 20) * 0.7}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#6e4a2e" roughness={1} /></mesh>;
    })}
  </group>
);

const snakePts = (ts, a, b, rise = 1.2, amp = 0.28, fr = 4) => Array.from({length: 9}, (_, i) => {
  const u = i / 8;
  return [lerp(a[0], b[0], u) + Math.sin(u * 18.8 - ts * fr) * amp * (1 - u * 0.4), a[1] + rise * Math.pow(u, 3) + 0.14 * (1 - Math.pow(u, 3)) * 0, lerp(a[2], b[2], u) + Math.cos(u * 12.5 - ts * fr) * amp * (1 - u * 0.4)];
});

const Hoodie = ({p, ts}) => (
  <group position={[p[0], p[1] + 0.15 * Math.sin(ts * 2.4), p[2]]} rotation={[0, ts * 0.7, 0]}>
    <RBox size={[1.5, 1.6, 0.6]} r={0.28} color="#8c8f9c" position={[0, 1.0, 0]} rough={1} />
    {[-1, 1].map((s) => <RBox key={s} size={[0.55, 1.35, 0.55]} r={0.24} color="#868997" position={[s * 1.0, 0.95, 0]} rotation={[0, 0, s * 0.35]} rough={1} />)}
    <RBox size={[0.8, 0.55, 0.62]} r={0.2} color="#797c8a" position={[0, 0.7, 0.05]} rough={1} />
    <mesh position={[0, 1.95, -0.05]} scale={[1, 0.8, 0.9]} castShadow><sphereGeometry args={[0.5, 24, 16]} /><meshStandardMaterial color="#868997" roughness={1} /></mesh>
  </group>
);

const Lion = ({p, ry = 0, ts = 0}) => (
  <group position={p} rotation={[0, ry, 0]}>
    <mesh position={[0, 0.85, 0]} scale={[0.7, 0.62, 1.3]} castShadow><sphereGeometry args={[1, 24, 18]} /><meshStandardMaterial color="#d9a64a" roughness={0.9} /></mesh>
    {[[-0.4, 0.5], [0.4, 0.5], [-0.4, -0.7], [0.4, -0.7]].map(([x, z], i) => <mesh key={i} position={[x, 0.35, z]} castShadow><cylinderGeometry args={[0.14, 0.12, 0.75, 10]} /><meshStandardMaterial color="#cf9a40" roughness={0.9} /></mesh>)}
    <group position={[0, 1.2 + 0.03 * Math.sin(ts * 2), 1.2]}>
      <mesh position={[0, 0, -0.15]} scale={[1, 1, 0.6]} castShadow><sphereGeometry args={[0.62, 20, 16]} /><meshStandardMaterial color="#7a4a1f" roughness={1} /></mesh>
      <mesh castShadow scale={[1, 0.95, 1.1]}><sphereGeometry args={[0.36, 20, 16]} /><meshStandardMaterial color="#e2b25a" roughness={0.8} /></mesh>
      <mesh position={[0, -0.08, 0.3]} scale={[0.6, 0.45, 0.6]}><sphereGeometry args={[0.2, 14, 12]} /><meshStandardMaterial color="#f0d9a8" roughness={0.8} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.14, 0.1, 0.33]}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color="#201008" /></mesh>)}
    </group>
    <mesh position={[0, 0.9, -1.4]} rotation={[0.9, 0, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.9, 8]} /><meshStandardMaterial color="#cf9a40" /></mesh>
  </group>
);

const Excavator = ({p, ts}) => {
  const a1 = -0.6 + 0.25 * Math.sin(ts * 3); const a2 = 0.9 + 0.35 * Math.sin(ts * 3 + 1);
  return (
    <group position={p}>
      <RBox size={[2.4, 0.45, 1.3]} r={0.15} color="#2c2c2c" position={[0, 0.25, 0]} />
      <RBox size={[1.3, 0.75, 1.1]} r={0.15} color="#f2b400" position={[0, 0.85, 0]} />
      <RBox size={[0.8, 0.8, 0.9]} r={0.15} color="#ffd94a" position={[0.3, 1.5, 0]} />
      <RBox size={[0.55, 0.45, 0.02]} r={0.02} color="#a9d8f0" position={[0.55, 1.55, 0.46]} opacity={0.8} />
      <group position={[-0.6, 1.0, 0]} rotation={[0, 0, a1 - 0.9]}>
        <RBox size={[1.9, 0.22, 0.25]} r={0.08} color="#f2b400" position={[-0.95, 0, 0]} />
        <group position={[-1.9, 0, 0]} rotation={[0, 0, a2]}>
          <RBox size={[1.4, 0.2, 0.22]} r={0.08} color="#e5a800" position={[-0.7, 0, 0]} />
          <RBox size={[0.5, 0.4, 0.8]} r={0.1} color="#555" position={[-1.45, -0.05, 0]} />
        </group>
      </group>
    </group>
  );
};

const Lock = ({p, shake = 0}) => (
  <group position={[p[0] + Math.sin(shake * 40) * 0.04 * (shake > 0 ? 1 : 0), p[1], p[2]]}>
    <RBox size={[1.2, 1.0, 0.5]} r={0.2} color="#e0b030" metal={0.6} rough={0.3} position={[0, 0, 0]} />
    <mesh position={[0, 0.5, 0]}><torusGeometry args={[0.36, 0.09, 12, 24, Math.PI]} /><meshStandardMaterial color="#c9ccd4" metalness={0.8} roughness={0.25} /></mesh>
    <mesh position={[0, 0.02, 0.27]}><cylinderGeometry args={[0.1, 0.1, 0.05, 16]} /><meshStandardMaterial color="#222" /></mesh>
    <RBox size={[0.07, 0.3, 0.05]} r={0.02} color="#222" position={[0, -0.18, 0.28]} />
  </group>
);
const Key = ({p, rot = 0}) => (
  <group position={p} rotation={[0, 0, rot]}>
    <mesh><torusGeometry args={[0.2, 0.07, 12, 24]} /><meshStandardMaterial color="#7be047" metalness={0.6} roughness={0.3} /></mesh>
    <RBox size={[0.09, 0.9, 0.09]} r={0.03} color="#7be047" metal={0.6} rough={0.3} position={[0, -0.55, 0]} />
    <RBox size={[0.25, 0.1, 0.09]} r={0.03} color="#7be047" metal={0.6} rough={0.3} position={[0.15, -0.85, 0]} />
    <RBox size={[0.18, 0.1, 0.09]} r={0.03} color="#7be047" metal={0.6} rough={0.3} position={[0.12, -0.65, 0]} />
  </group>
);

const Smoker = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.35, 0.35, 0.9, 20]} /><meshStandardMaterial color="#9aa0aa" metalness={0.7} roughness={0.35} /></mesh>
    <mesh position={[0, 1.15, 0]} castShadow><coneGeometry args={[0.35, 0.45, 20]} /><meshStandardMaterial color="#8a909a" metalness={0.7} roughness={0.35} /></mesh>
    <RBox size={[0.25, 0.7, 0.8]} r={0.1} color="#a0522d" position={[0.5, 0.4, 0]} rotation={[0, 0, -0.3]} rough={0.9} />
  </group>
);

const Cam = ({p, ts}) => (
  <group position={p}>
    {[[-0.5, 0.2], [0.5, 0.2], [0, -0.55]].map(([x, z], i) => <mesh key={i} position={[x * 0.9, 0.55, z]} rotation={[z * 0.3, 0, -x * 0.3]}><cylinderGeometry args={[0.04, 0.04, 1.2, 8]} /><meshStandardMaterial color="#2b2b2b" /></mesh>)}
    <RBox size={[0.7, 0.6, 1.2]} r={0.12} color="#2a2d33" position={[0, 1.25, 0]} />
    <mesh position={[0, 1.25, 0.8]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.24, 0.28, 0.5, 20]} /><meshStandardMaterial color="#15171b" metalness={0.5} roughness={0.3} /></mesh>
    <mesh position={[0.2, 1.62, -0.3]}><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color={Math.floor(ts * 2) % 2 ? '#ff2a2a' : '#5a0f0f'} /></mesh>
  </group>
);

const Plate = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.05, 0]} receiveShadow castShadow><cylinderGeometry args={[0.85, 0.7, 0.1, 32]} /><meshStandardMaterial color="#f4f1ea" roughness={0.3} /></mesh>
  </group>
);

const Ground = ({color, size = 60}) => <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[size, size]} /><meshStandardMaterial color={color} roughness={0.95} /></mesh>;
const Rocks = () => (<>{Array.from({length: 14}).map((_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 12, 0.05, (rnd(i + 9) - 0.5) * 8 - 1]} scale={[0.3 + rnd(i + 4) * 0.4, 0.15 + rnd(i + 6) * 0.2, 0.3 + rnd(i + 2) * 0.4]} castShadow receiveShadow><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#6b6f77" roughness={1} /></mesh>)}</>);

const SAV = <Savanna />;
const DOM = <Room />;

const WALLH = 1.1;
const RampBuild = ({ts, t0 = 0}) => (
  <group>
    {Array.from({length: 12}).map((_, i) => {
      const a = pr(ts, t0 + i * 0.1, t0 + i * 0.1 + 0.2); if (a <= 0) return null;
      const x = -1.9 + i * 0.4; const y = 0.1 + i * 0.1;
      return <mesh key={i} position={[x, y, 0]} scale={backOut(a) * 1} castShadow receiveShadow><sphereGeometry args={[0.34, 14, 12]} /><meshStandardMaterial color={i % 2 ? '#6e4a2e' : '#7c5636'} roughness={1} /></mesh>;
    })}
    {Array.from({length: 12}).map((_, i) => {
      const a = pr(ts, t0 + i * 0.1, t0 + i * 0.1 + 0.2); if (a <= 0 || i < 4) return null;
      return <mesh key={i} position={[-1.9 + i * 0.4, 0.1 + i * 0.05, 0.35]} scale={backOut(a)} castShadow><sphereGeometry args={[0.3, 12, 10]} /><meshStandardMaterial color="#6e4a2e" roughness={1} /></mesh>;
    })}
  </group>
);
const Fence = ({z = 0}) => (
  <group position={[0, 0, z]}>
    {Array.from({length: 9}).map((_, i) => <RBox key={i} size={[0.1, 0.9, 0.1]} r={0.02} color="#6b4a2a" position={[-3.6 + i * 0.9, 0.45, 0]} />)}
    {[0.35, 0.75].map((y) => <RBox key={y} size={[7.4, 0.07, 0.06]} r={0.02} color="#7b5a38" position={[0, y, 0]} />)}
  </group>
);

// ---------------- lista de planos ----------------
// cada plano: start (s global), L (luz), cam, el(ts, dur)
const CAM_A1 = {pos: [3.6, 1.7, 6.2], target: [0, 0.9, 0], fov: 32};
const FACE = {pos: [3.1, 0.95, 3.7], target: [1.1, 0.65, 1.5], fov: 32, dy: 0.5};

const SHOTS = [
  // ---- c1 gancho ----
  {s: 0.0, L: WARM, cam: {...CAM_A1, k: [2.4, 1.9], orb: [0, -8]}, el: (ts) => (<>{DOM}<Bg p={[0, 0, 0.3]} ry={0.75} ts={ts} /></>)},
  {s: 1.95, L: WARM, cam: {...FACE, k: [1.8, 1.45]}, el: (ts) => (<>{DOM}<Bg p={[0, 0, 0.3]} ry={0.75} ts={ts} lowerHead={0.0} /></>)},
  // ---- c2 pele ----
  {s: 4.1, L: WARM, cam: {pos: [2.4, 5.6, 4.2], target: [0, 0.8, 0.5], fov: 32, k: [1.9, 1.7]}, el: (ts) => (<><Floor /><Bg p={[0, 0.9 + 0.1 * Math.sin(ts * 3), 0]} ry={0.2} twist={0} lowerHead={0.25} ts={ts} pitch={0.25} bob={0} /></>)},
  {s: 5.95, L: WARM, cam: {pos: [2.4, 5.6, 4.2], target: [0, 0.5, 0.5], fov: 32, k: [1.8, 1.9]}, el: (ts) => (<><Floor /><Bg p={[0, 0, 0]} ry={0.2} twist={ez(pr(ts, 1.4, 3.0)) * 1.15} lowerHead={0.15 + 0.35 * ez(pr(ts, 2.8, 3.2))} ts={ts} /></>)},
  {s: 9.9, L: WARM, cam: {...CAM_A1, k: [2.3, 1.9]}, el: (ts) => (
    <>{DOM}<Bg p={[0, 0, 0.3]} ry={0.75} ts={ts} />
      <Bounce ts={ts} t0={0.1} from={[-2.4, 1.6, 2.2]} to={[0.1, 1.1, 0.7]}><BeeP /></Bounce>
      <Bounce ts={ts} t0={0.9} from={[-2.6, 1.0, 2.6]} to={[0.2, 0.9, 0.8]}><ThornP /></Bounce>
      <Bounce ts={ts} t0={1.5} from={[-2.0, 2.0, 2.0]} to={[0.4, 1.15, 0.5]}><ToothP /></Bounce></>)},
  {s: 13.85, L: WARM, cam: {pos: [0.5, 1.6, 7.5], target: [0.4, 1.0, 0], fov: 32, k: [1.9, 1.5]}, el: (ts) => (<>{DOM}<Bg p={[-1.0, 0, 0.3]} ry={0.55} ts={ts} /><Hoodie2 p={[1.9, 0.0, 0.2]} ts={ts} /></>)},
  // ---- c3 abelhas ----
  {s: 16.3, L: GOLD, cam: {pos: [-3.6, 1.8, 7.2], target: [0.4, 1.0, 0], fov: 32, k: [2.7, 2.2]}, el: (ts) => { const k = ez(pr(ts, 0, 1.7)); return (<>{SAV}<Hive p={[2.6, 0, -0.6]} /><OrbitBees c={[2.6, 1.6, -0.2]} ts={ts} /><Bg p={[lerp(-4, 0.6, k), 0, lerp(2.2, 0.7, k)]} ry={lerp(1.35, 1.9, k)} ts={ts} walk={1.6 * (1 - k * 0.9)} bob={0} /></>); }},
  {s: 18.1, L: GOLD, cam: {pos: [0, 1.4, 5], target: [1.6, 0.9, 0.2], fov: 32, k: [2.1, 1.8]}, el: (ts) => (<>{SAV}<Hive p={[2.6, 0, -0.6]} /><OrbitBees c={[2.6, 1.6, -0.2]} ts={ts + 10} /><Bg p={[0.6, 0, 0.7]} ry={1.9} lowerHead={0.18 + 0.12 * Math.sin(ts * 5)} ts={ts} /></>)},
  {s: 21.0, L: GOLD, cam: {pos: [0.9, 1.0, 2.8], target: [2.1, 0.7, 0.2], fov: 32, k: [1.9, 1.6], dy: 0.5}, el: (ts) => (<>{SAV}<Hive p={[2.6, 0, -0.6]} /><OrbitBees c={[2.0, 0.9, 0.3]} ts={ts + 20} n={34} rad={0.9} speed={4} /><Bg p={[0.6, 0, 0.7]} ry={1.9} lowerHead={0.1} ts={ts} /></>)},
  {s: 22.5, L: GOLD, cam: {pos: [-2, 1.5, 6], target: [1.0, 0.8, 0], fov: 32, k: [2.0, 1.7]}, el: (ts) => (<>{SAV}<Hive p={[2.6, 0, -0.6]} /><OrbitBees c={[2.6, 1.4, -0.2]} ts={ts + 30} calm={pr(ts, 0.5, 2.4)} /><Smoke src={[-0.5, 0.7, 1.0]} ts={ts} dir={[0.9, 0.35, -0.3]} /><Bg p={[0.6, 0, 0.7]} ry={1.9} ts={ts} /></>)},
  {s: 25.15, L: GOLD, cam: {pos: [0, 1.6, 6.5], target: [0, 0.9, 1], fov: 32, k: [1.7, 1.4]}, el: (ts) => (<>{SAV}<Smoker2 p={[-1.7, 0, 1.6]} /><Smoke src={[-1.7, 1.45, 1.6]} ts={ts} dir={[0.25, 0.9, 0]} color="#c8c0b0" size={0.22} /><Bg p={[0.9, 0, 1.2]} ry={-0.5} ts={ts} /><Hive p={[3.5, 0, -2]} /></>)},
  // ---- c4 cobra ----
  {s: 27.6, L: NAVY, cam: {pos: [-3.4, 1.6, 6.4], target: [0.5, 0.9, 0.5], fov: 32, k: [2.4, 2.0]}, el: (ts) => (<><Ground color="#14284d" /><Snake pts={snakePts(ts, [3.6, 0.14, -1.4], [2.4, 1.3, 0.6])} hood /><Bg p={[-0.8, 0, 1.4]} ry={0.9} lowerHead={0.05} ts={ts} /></>)},
  {s: 29.0, L: NAVY, cam: {pos: [2.2, 1.6, 4.4], target: [0, 0.4, 1.2], fov: 32, k: [1.3, 1.0], dy: 0.5}, el: (ts) => (<><Ground color="#14284d" /><Plate p={[1.4, 0, 2.2]} /><Snake pts={Array.from({length: 14}, (_, i) => { const a = i * 0.9 + ts * 0.8; const r = 0.5 - i * 0.025; return [1.4 + Math.cos(a) * r, 0.2 + i * 0.012, 2.2 + Math.sin(a) * r]; })} r={0.08} color="#6b6a3a" /><Bg p={[-0.6, 0, 1.0]} ry={1.15} lowerHead={0.4 + 0.1 * Math.sin(ts * 4)} ts={ts} /></>)},
  {s: 30.1, L: NAVY, cam: {pos: [-3.0, 1.5, 6.0], target: [0.2, 0.7, 1.2], fov: 32, k: [1.9, 1.5], orb: [0, 15]}, el: (ts, d, g) => { const mamba = g >= 32.3; return (<><Ground color="#14284d" /><Snake pts={snakePts(ts, [3.2, 0.14, -0.6], [1.2, 0.55, 1.7], 0.5, 0.35, 9)} r={0.12} color={mamba ? '#1c1c1c' : '#6b6a3a'} /><Bg p={[-0.5, 0, 1.2]} ry={1.05} lowerHead={0.55 + 0.15 * Math.sin(ts * 7)} ts={ts} bob={0} /></>); }},
  {s: 33.3, L: NAVY, cam: {pos: [-3.4, 1.6, 6.4], target: [0.2, 0.9, 0.5], fov: 32, k: [2.2, 1.8]}, el: (ts) => (<><Ground color="#14284d" /><Bg p={[-0.2, 0, 1.2]} ry={0.9} ts={ts} />
      {[0, 1, 2, 3, 4].map((i) => <Bounce key={i} ts={ts} t0={0.15 + i * 0.4} from={[3.2, 1.8 + (i % 2) * 0.6, 2.8]} to={[0.5, 0.95, 1.7]} spin={3}><DropP /></Bounce>)}</>)},
  {s: 36.1, L: NAVY, cam: {pos: [0.8, 1.2, 5.5], target: [0, 1.0, 0], fov: 32, k: [1.5, 1.2], dy: 0.6}, el: (ts) => (<><Ground color="#14284d" /><Lock p={[0, 1.2, 0]} shake={pr(ts, 1.0, 2.0) * (1 - pr(ts, 1.9, 2.1))} /><Key p={[lerp(2.4, 0.15, ez(pr(ts, 0.2, 0.9))) + (ts > 1.0 ? Math.sin(ts * 38) * 0.03 : 0), lerp(2.2, 1.3, ez(pr(ts, 0.2, 0.9))), 0.5]} rot={ts > 1.0 ? 0.3 : 1.2 * (1 - ez(pr(ts, 0.2, 0.9)))} /><Bg p={[-2.4, 0, 1.2]} ry={0.5} ts={ts} s={0.8} /></>)},
  // ---- c5 cavar ----
  {s: 38.8, L: GRAY, cam: {pos: [0.8, 1.0, 6], target: [0, 0.7, 0], fov: 32, k: [1.3, 1.05], dy: 0.5}, el: (ts) => (<><Ground color="#5c5f66" /><Rocks /><Bg p={[0, 0, 0]} ry={0.2 + 0.1 * Math.sin(ts * 2)} lowerHead={0.1} ts={ts} /></>)},
  {s: 40.4, L: GRAY, cam: {pos: [0.5, 2.2, 8], target: [0.4, 0.6, 0], fov: 32, k: [1.5, 1.1]}, el: (ts, d, g) => { const h = pr(ts, 0, 1.7); return (<><Ground color="#5c5f66" /><Rocks /><mesh position={[1.9, 0.015, 0]} scale={[0.1 + 1.1 * h, 1, 0.1 + 0.9 * h]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1, 32]} /><meshStandardMaterial color="#17181b" roughness={1} /></mesh><Bg p={[-0.3, 0, 0]} ry={1.571} lowerHead={0.5} roll={-0.25 + 0.06 * Math.sin(ts * 14)} ts={ts} bob={0} /><Dirt src={[1.4, 0.3, 0]} ts={ts} dirx={-1} /></>); }},
  {s: 42.1, L: GRAY, cam: {pos: [1.2, 0.9, 4.2], target: [0, 0.35, 1.5], fov: 30, k: [1.9, 1.4], dy: 0.1}, el: (ts) => (<><Ground color="#5c5f66" /><Bg p={[0, 0, -0.4]} ry={0.35} lowerHead={0.55} ts={ts} bob={0} /><Dirt src={[0.4, 0.2, 1.8]} ts={ts} dirx={0.7} /></>)},
  {s: 43.8, L: GRAY, cam: {pos: [0, 2.0, 8.5], target: [0.6, 1.0, 0], fov: 32, k: [1.5, 1.3]}, el: (ts) => (<><Ground color="#5c5f66" /><Rocks /><Excavator p={[2.2, 0, -0.3]} ts={ts} /><Bg p={[-1.8, 0, 0.5]} ry={1.57} lowerHead={0.4} roll={-0.2 + 0.05 * Math.sin(ts * 14)} ts={ts} bob={0} /><Dirt src={[-0.6, 0.3, 0.5]} ts={ts} dirx={-1} /></>)},
  // ---- c6 Stoffel ----
  {s: 46.3, L: GOLD, cam: {pos: [-3, 3, 12], target: [1, 1, 0], fov: 32, k: [1.1, 0.85]}, el: (ts) => (<>{SAV}<Fence z={-0.5} /><Fence z={0.6} /><Bg p={[-0.5, 0, 0]} ry={1.2 + 0.3 * Math.sin(ts)} s={0.7} ts={ts} /></>)},
  {s: 49.1, L: GOLD, cam: {pos: [4.5, 1.8, 6], target: [0, 0.8, 0], fov: 32, k: [1.8, 1.5]}, el: (ts) => {
      const cyc = (ts * 0.5) % 2; const out = cyc < 1; const u = out ? cyc : 2 - cyc; const z = lerp(-1.6, 1.8, ez(u)); const hop = Math.sin(Math.PI * ez(u)) * 0.9;
      return (<>{SAV}<Fence z={0} /><Bg p={[0, hop * 1.0, z]} ry={out ? 0 : Math.PI} ts={ts} walk={3} bob={0} /></>); }},
  {s: 53.1, L: GOLD, cam: {pos: [3.2, 1.8, 3.2], target: [0, 1.0, -2.5], fov: 32, k: [1.3, 1.05]}, el: (ts) => (<>{SAV}<Wall p={[0, WALLH / 2, -1.6]} size={[9, WALLH, 0.45]} color="#bdb6a8" /><Lion p={[-1.3, 0.35, -4.4]} ts={ts} ry={0.2} /><Lion p={[1.4, 0.35, -5.2]} ts={ts + 1} ry={-0.3} /><Bg p={[-0.2, 0, -0.1]} ry={Math.PI + 0.1} lowerHead={0.05} ts={ts} /></>)},
  {s: 55.3, L: GOLD, cam: {pos: [-1.5, 1.4, 5.2], target: [0.2, 1.0, 0], fov: 32, k: [1.4, 1.15], dy: 0.6}, el: (ts) => (<>{SAV}<Cam p={[-1.1, 0, 2.6]} ts={ts} /><Bg p={[0.6, 0, -0.8]} ry={-0.9} ts={ts} walk={1.6} bob={0} /></>)},
  {s: 57.2, L: GOLD, cam: {pos: [1.0, 2.2, 8.6], target: [0.6, 0.8, 0], fov: 32, k: [1.3, 1.1]}, el: (ts) => {
      const c = pr(ts, 1.5, 2.7); const x = lerp(-2.6, 2.1, ez(c)); const y = lerp(0.05, 1.25, ez(c)) + (c > 0.9 ? 0 : 0); const jump = pr(ts, 2.7, 2.95);
      return (<>{SAV}<Wall p={[2.8, WALLH / 2, 0]} size={[0.5, WALLH, 8]} color="#bdb6a8" /><RampBuild ts={ts} t0={0.1} /><Bg p={[jump > 0 ? lerp(2.1, 3.6, jump) : x, jump > 0 ? lerp(1.25, 0, jump) + Math.sin(Math.PI * jump) * 0.6 : (ts < 1.5 ? 0 : y), 0]} ry={1.571} lowerHead={ts < 1.5 ? 0.3 : 0} pitch={0} ts={ts} walk={c > 0 && c < 1 ? 3 : 0} /></>); }},
  {s: 60.1, L: GOLD, cam: {pos: [-0.5, 2.4, 9.0], target: [0.6, 1.2, 0], fov: 30, k: [1.8, 1.5]}, el: (ts) => (<>{SAV}<Wall p={[2.8, WALLH / 2, 0]} size={[0.5, WALLH, 8]} color="#bdb6a8" /><RampBuild ts={9} /><Bg p={[2.7, 1.25, 0.2]} ry={1.571} lowerHead={0.1} ts={ts} /></>)},
  // ---- c7 fecho ----
  {s: 62.2, L: WARM, cam: {pos: [1.8, 1.4, 7.5], target: [0, 0.9, 0], fov: 32, k: [1.7, 1.4]}, el: (ts) => (<>{DOM}<Bg p={[-0.3, 0, lerp(-1.8, 1.6, ts / 2.5)]} ry={0.15} ts={ts} walk={1.7} bob={0} /></>)},
  {s: 64.7, L: GOLD, cam: {pos: [0.5, 1.6, 6.5], target: [0, 0.9, 0], fov: 32, k: [1.5, 1.2]}, el: (ts) => (<>{SAV}<OrbitBees c={[0, 1.0, 0.3]} ts={ts + 40} n={40} rad={1.6} speed={5} /><Bg p={[0, 0, 0.3]} ry={0.5} ts={ts} /></>)},
  {s: 66.7, L: NAVY, cam: {pos: [-3.0, 1.5, 6.0], target: [0.2, 0.7, 1.2], fov: 32, k: [1.9, 1.5]}, el: (ts) => (<><Ground color="#14284d" /><Snake pts={snakePts(ts + 2, [3.2, 0.14, -0.6], [1.2, 0.55, 1.7], 0.5, 0.35, 9)} r={0.12} color="#6b6a3a" /><Bg p={[-0.5, 0, 1.2]} ry={1.05} lowerHead={0.5 + 0.15 * Math.sin(ts * 7)} ts={ts} bob={0} /></>)},
  {s: 68.1, L: GOLD, cam: {pos: [1.0, 2.2, 8.6], target: [0.6, 0.8, 0], fov: 32, k: [1.3, 1.1]}, el: (ts) => { const c = pr(ts, 0, 1.0); const jump = pr(ts, 1.0, 1.5); return (<>{SAV}<Wall p={[2.8, WALLH / 2, 0]} size={[0.5, WALLH, 8]} color="#bdb6a8" /><RampBuild ts={9} /><Bg p={[jump > 0 ? lerp(2.1, 3.7, jump) : lerp(-1.6, 2.1, ez(c)), jump > 0 ? lerp(1.25, 0, jump) + Math.sin(Math.PI * jump) * 0.6 : lerp(0.05, 1.25, ez(c)), 0]} ry={1.571} ts={ts} walk={c < 1 ? 3 : 0} /></>); }},
  {s: 69.8, L: WARM, cam: {pos: [1.8, 1.5, 6.8], target: [0, 0.9, 0], fov: 32, k: [1.6, 1.3]}, el: (ts) => (<>{DOM}<mesh position={[0, 0.06, 0.2]} receiveShadow castShadow><cylinderGeometry args={[1.2, 1.3, 0.12, 40]} /><meshStandardMaterial color="#d9d9de" roughness={0.3} metalness={0.4} /></mesh><RBox size={[0.9, 0.12, 0.12]} r={0.04} color="#222" position={[0, 0.06, 1.4]} /><Bg p={[0, 0.12, 0.2]} ry={0.6} ts={ts} /></>)},
  {s: 71.9, L: WARM, cam: {...CAM_A1, k: [2.4, 1.9], orb: [0, -8]}, el: (ts) => (<>{DOM}<Bg p={[0, 0, 0.3]} ry={0.75} ts={ts} /></>)},
  {s: 74.1, L: WARM, cam: {...FACE, k: [1.8, 1.45]}, el: (ts) => (<>{DOM}<Bg p={[0, 0, 0.3]} ry={0.75} ts={ts} /></>)},
];

const LABELS = [
  {a: 0.0, b: 3.9, t: 'SEU CUNHADO'},
  {a: 13.9, b: 16.1, t: 'O MOLETOM DELE'},
  {a: 25.2, b: 27.5, t: 'O FUMACÊ DELE'},
  {a: 36.1, b: 38.7, t: 'A FECHADURA TROCADA DELE'},
  {a: 43.8, b: 46.2, t: 'A RETROESCAVADEIRA DELE'},
  {a: 50.3, b: 52.5, t: 'STOFFEL'},
  {a: 60.1, b: 62.2, t: 'O PUXADINHO DELE'},
];
const PILLS = [
  {a: 41.4, b: 43.6, t: '⏱ 10 MINUTOS'},
  {a: 32.3, b: 33.3, t: 'MAMBA-NEGRA'},
  {a: 34.6, b: 36.1, t: 'NÃO ENCAIXA', red: true},
  {a: 46.5, b: 50.0, t: '2014 · ÁFRICA DO SUL'},
  {a: 56.1, b: 57.2, t: 'VÍDEO DA BBC'},
  {a: 70.4, b: 72.0, t: '16 KG', big: true},
];

const WORDS = TL.segments.flatMap((s) => s.words);
const Karaoke = ({t}) => {
  let idx = -1; for (let i = 0; i < WORDS.length; i++) if (WORDS[i].s - 0.03 <= t) idx = i;
  if (idx < 0) return null;
  const w = WORDS[idx], nx = WORDS[idx + 1]; const hide = Math.min(w.e + 0.4, nx ? nx.s : 1e9);
  if (t > hide && !(idx === WORDS.length - 1 && t < w.e + 0.9)) return null;
  const k = backOut(pr(t, w.s - 0.03, w.s + 0.1)); const txt = w.w.replace(/[.,!?…:;]/g, '');
  return <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 54, color: '#fff', textShadow: '0 3px 12px rgba(0,0,0,.6)', transform: `scale(${0.85 + 0.15 * k})`}}>{txt}</div>;
};

export const BadgerVideo = ({tList}) => {
  const frame = useCurrentFrame();
  const g = tList ? tList[frame] : frame / FPS;
  let si = 0; for (let i = 0; i < SHOTS.length; i++) if (g >= SHOTS[i].s - 1e-6) si = i;
  const sh = SHOTS[si]; const end = si < SHOTS.length - 1 ? SHOTS[si + 1].s : TL.duration + TAIL;
  const ts = g - sh.s; const dur = end - sh.s;
  const lab = LABELS.find((l) => g >= l.a && g < l.b);
  const pills = PILLS.filter((p) => g >= p.a && g < p.b);
  return (
    <AbsoluteFill style={{background: sh.L.bg}}>
      {!tList && <Audio src={staticFile('badger/voz.mp3')} />}
      <FontGate>
        <Stage cam={sh.cam} k={ts / dur} L={sh.L}>{sh.el(ts, dur, g)}</Stage>
        {lab && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: MONT}}>
            <span style={{display: 'inline-block', transform: `rotate(-3deg) scale(${backOut(pr(g, lab.a, lab.a + 0.25))})`, fontWeight: 900, fontSize: lab.t.length > 18 ? 36 : 44, letterSpacing: 1, color: '#ffd23f', WebkitTextStroke: '7px #3b2412', paintOrder: 'stroke fill', textShadow: '0 3px 0 #3b2412'}}>{lab.t}</span>
          </div>
        )}
        {pills.map((p) => (
          <div key={p.t} style={{position: 'absolute', left: 0, right: 0, top: p.big ? 330 : 300, textAlign: 'center', fontFamily: MONT}}>
            <span style={{display: 'inline-block', transform: `scale(${backOut(pr(g, p.a, p.a + 0.25))})`, fontWeight: 900, fontSize: p.big ? 96 : 32, padding: p.big ? '8px 36px' : '10px 26px', borderRadius: 999, background: p.red ? '#e5392d' : '#fff', color: p.red ? '#fff' : '#2a1a10', boxShadow: '0 6px 18px rgba(0,0,0,.35)'}}>{p.t}</span>
          </div>
        ))}
        <Karaoke t={g} />
      </FontGate>
    </AbsoluteFill>
  );
};

export const BADGER_CHECK_T = SHOTS.map((s, i) => { const e = i < SHOTS.length - 1 ? SHOTS[i + 1].s : TL.duration; return s.s + Math.min(1.1, (e - s.s) * 0.6); });
export const BADGER_SHOTS_N = SHOTS.length;
