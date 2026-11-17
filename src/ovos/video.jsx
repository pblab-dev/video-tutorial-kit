import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RBox, Env} from '../World.jsx';
import {FontGate} from '../fonts.jsx';
import {MONT} from '../badger/concept.jsx';
import {Person, RoomBox, Dice, LC, BOARDC} from './concept.jsx';
import TL from '../../content/ovos/timeline.json';

export const FPS = 30;
const TAIL = 0.9;
export const OVOS_DURATION = Math.ceil((TL.duration + TAIL) * FPS);

const clamp = (x) => Math.min(1, Math.max(0, x));
const ez = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
const pr = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const backOut = (k) => { const c = 2.70158; k = clamp(k); return 1 + c * Math.pow(k - 1, 3) + (c - 1) * Math.pow(k - 1, 2); };
const bounce = (k) => { k = clamp(k); const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) { k -= 1.5 / d; return n * k * k + 0.75; } if (k < 2.5 / d) { k -= 2.25 / d; return n * k * k + 0.9375; } k -= 2.625 / d; return n * k * k + 0.984375; };
const M = ({c, r = 0.55, m = 0, e, ei = 1, ...o}) => <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e || '#000'} emissiveIntensity={e ? ei : 0} {...o} />;
const Ball = ({p, r = 0.1, c = '#fff', sc = [1, 1, 1], rough = 0.5, e, ei}) => <mesh position={p} scale={sc} castShadow><sphereGeometry args={[r, 24, 16]} /><M c={c} r={rough} e={e} ei={ei} /></mesh>;
const Cap = ({p, r = 0.1, h = 0.3, c = '#fff', rot = [0, 0, 0], rough = 0.5}) => <mesh position={p} rotation={rot} castShadow><capsuleGeometry args={[r, h, 8, 16]} /><M c={c} r={rough} /></mesh>;
const Cyl = ({p, r = 0.1, h = 0.3, c = '#fff', rot = [0, 0, 0], rough = 0.5, seg = 24, r2}) => <mesh position={p} rotation={rot} castShadow><cylinderGeometry args={[r2 ?? r, r, h, seg]} /><M c={c} r={rough} /></mesh>;

// ---------------- palco ----------------
const Rig = ({pos, target, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(...target); camera.updateMatrixWorld();
  return null;
};
// pos: vetor relativo ao alvo; o alvo é rebaixado para o assunto ficar na faixa superior (acima da legenda)
const camAt = (c, k) => {
  const e = ez(k); const T = c.target; const T2 = c.target2 || T;
  const tt = [lerp(T[0], T2[0], e), lerp(T[1], T2[1], e), lerp(T[2], T2[2], e)];
  const kk = Array.isArray(c.k) ? lerp(c.k[0], c.k[1], e) : (c.k ?? 1);
  const ang = (Array.isArray(c.orb) ? lerp(c.orb[0], c.orb[1], e) : (c.orb || 0)) * Math.PI / 180;
  const v = c.pos;
  const vx = (v[0] * Math.cos(ang) + v[2] * Math.sin(ang)) * kk; const vy = v[1] * kk; const vz = (-v[0] * Math.sin(ang) + v[2] * Math.cos(ang)) * kk;
  const dist = Math.hypot(vx, vy, vz);
  const tg = [tt[0], tt[1] - 0.05 * dist, tt[2]];
  return {pos: [tg[0] + vx, tg[1] + vy, tg[2] + vz], target: tg, fov: c.fov || 34};
};
const Stage = ({cam: c0, k, L, dm = 1, children}) => {
  const {width, height} = useVideoConfig();
  const c = {...c0, pos: c0.pos.map((v) => v * dm)};
  const cam = camAt(c, k);
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{fov: cam.fov, position: cam.pos, near: 0.1, far: 200}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1}}>
      <Rig pos={cam.pos} target={cam.target} fov={cam.fov} />
      <color attach="background" args={[L.bg]} />
      <Env intensity={L.env ?? 0.5} />
      <hemisphereLight args={[L.sky || '#fff', L.gnd || '#d8c8a0', L.hemi ?? 0.7]} />
      <directionalLight position={L.sunPos || [4, 8, 5]} intensity={L.sunI ?? 2.4} color={L.sunCol || '#fff0dc'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={0.5} shadow-camera-far={40} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      {children}
    </ThreeCanvas>
  );
};

// ---------------- tabuleiro ----------------
const TILE = new THREE.BoxGeometry(1.0, 0.1, 1.0);
const Board = ({hole = [-3.1, 3.1, -3.1, 3.1], rot = 0}) => {
  const tiles = useMemo(() => {
    const a = [];
    for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) {
      const x = (i - 6.5) * 1.1, z = (j - 6.5) * 1.1;
      if (x > hole[0] - 0.5 && x < hole[1] + 0.5 && z > hole[2] - 0.5 && z < hole[3] + 0.5) continue;
      a.push([x, z, BOARDC[(i + 2 * j) % BOARDC.length]]);
    }
    return a;
  }, [hole[0], hole[1], hole[2], hole[3]]);
  return (
    <group rotation={[0, rot, 0]}>
      <mesh position={[0, -0.6, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><M c="#2557ad" r={0.9} /></mesh>
      <RBox size={[16.5, 0.5, 16.5]} r={0.2} color="#f6e6bb" position={[0, -0.28, 0]} rough={0.6} />
      {tiles.map((t, i) => <mesh key={i} geometry={TILE} position={[t[0], 0.0, t[1]]} receiveShadow><M c={t[2]} r={0.5} /></mesh>)}
    </group>
  );
};
const Casa = ({color = '#ffd23f'}) => (
  <group>
    <RBox size={[6.2, 0.34, 6.2]} r={0.12} color={color} position={[0, 0.1, 0]} rough={0.5} />
    <RBox size={[5.7, 0.1, 5.7]} r={0.06} color="#fff4cf" position={[0, 0.3, 0]} rough={0.5} />
  </group>
);
const Surf = ({children, hole, color, rot}) => (<><Board hole={hole} rot={rot} /><Casa color={color} /><group position={[0, 0.35, 0]}>{children}</group></>);

// ---------------- sprites de texto ----------------
const Tag3D = ({p, text, bg = '#e5392d', fg = '#fff', s = 1}) => {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 176; const g = c.getContext('2d');
    g.fillStyle = bg; g.beginPath(); g.roundRect(8, 8, 496, 160, 80); g.fill();
    g.lineWidth = 10; g.strokeStyle = '#fff'; g.stroke();
    g.fillStyle = fg; g.font = `900 100px Montserrat, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 92);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [text, bg, fg]);
  return <sprite position={p} scale={[1.6 * s, 0.55 * s, 1]}><spriteMaterial map={tex} transparent depthTest={false} /></sprite>;
};

// ---------------- personagens e objetos ----------------
const Chick = ({p = [0, 0, 0], s = 1, ry = 0, open = 0, scared = 0, squash = 0, tooth = 0, bob = 0, shell = null}) => (
  <group position={p} scale={[s * (1 + squash * 0.7), s * (1 - squash * 0.72), s * (1 + squash * 0.7)]} rotation={[0, ry, 0]}>
    <group position={[0, bob, 0]}>
      <Ball p={[0, 0.3, 0]} r={0.3} c="#ffd23f" sc={[1, 0.95, 1]} rough={1} />
      <Ball p={[0, 0.66, 0.06]} r={0.22} c="#ffd23f" rough={1} />
      <Ball p={[-0.3, 0.32, 0]} r={0.12} c="#ffc21f" sc={[0.5, 1, 1]} rough={1} /><Ball p={[0.3, 0.32, 0]} r={0.12} c="#ffc21f" sc={[0.5, 1, 1]} rough={1} />
      <Ball p={[0, 0.9, 0.04]} r={0.05} c="#ffc21f" sc={[0.7, 1.4, 0.7]} rough={1} />
      {/* bico: parte de cima e de baixo */}
      <mesh position={[0, 0.67 + open * 0.02, 0.3]} rotation={[Math.PI / 2 - open * 0.15, 0, 0]} scale={[1, 1, 0.55]} castShadow><coneGeometry args={[0.075, 0.2, 14]} /><M c="#ff8a2a" r={0.6} /></mesh>
      <mesh position={[0, 0.6 - open * 0.08, 0.28]} rotation={[Math.PI / 2 + open * 0.55, 0, 0]} scale={[1, 1, 0.5]} castShadow><coneGeometry args={[0.06, 0.15, 14]} /><M c="#e5731c" r={0.6} /></mesh>
      {tooth > 0 && <mesh position={[0, 0.655 + open * 0.01, 0.395]} rotation={[Math.PI / 2, 0, 0]} scale={[tooth, tooth, tooth]}><coneGeometry args={[0.022, 0.06, 8]} /><M c="#fff" e="#fff" ei={1.2} /></mesh>}
      {/* olhos */}
      <Ball p={[-0.095, 0.72, 0.2]} r={0.06 + scared * 0.03} c="#fff" /><Ball p={[0.095, 0.72, 0.2]} r={0.06 + scared * 0.03} c="#fff" />
      <Ball p={[-0.095, 0.72, 0.255]} r={0.032 - scared * 0.01} c="#1d1d24" /><Ball p={[0.095, 0.72, 0.255]} r={0.032 - scared * 0.01} c="#1d1d24" />
    </group>
    <Cyl p={[-0.1, 0.07, 0.02]} r={0.015} h={0.14} c="#ff8a2a" /><Cyl p={[0.1, 0.07, 0.02]} r={0.015} h={0.14} c="#ff8a2a" />
    <RBox size={[0.16, 0.025, 0.2]} r={0.01} color="#ff8a2a" position={[-0.1, 0.012, 0.07]} /><RBox size={[0.16, 0.025, 0.2]} r={0.01} color="#ff8a2a" position={[0.1, 0.012, 0.07]} />
    {shell}
  </group>
);
const Hen = ({p = [0, 0, 0], s = 1, ry = 0, peck = 0}) => (
  <group position={p} scale={s} rotation={[0, ry, 0]}>
    <Ball p={[0, 0.62, 0]} r={0.62} c="#fff6ea" sc={[1, 0.9, 1.15]} rough={0.9} />
    <Ball p={[0, 1.18, 0.5 + peck * 0.1]} r={0.3} c="#fff6ea" rough={0.9} />
    <Ball p={[0, 1.5, 0.52]} r={0.1} c="#e5392d" sc={[0.6, 1.2, 1]} /><Ball p={[0, 1.46, 0.6]} r={0.1} c="#e5392d" sc={[0.6, 1.2, 1]} />
    <Ball p={[0, 0.98, 0.78]} r={0.09} c="#e5392d" sc={[0.8, 1.2, 0.8]} />
    <mesh position={[0, 1.2, 0.84 + peck * 0.1]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.1, 0.28, 14]} /><M c="#ff8a2a" /></mesh>
    <Ball p={[-0.15, 1.28, 0.74]} r={0.05} c="#1d1d24" /><Ball p={[0.15, 1.28, 0.74]} r={0.05} c="#1d1d24" />
    <Ball p={[-0.58, 0.7, 0]} r={0.35} c="#ffe9d0" sc={[0.35, 0.8, 1]} /><Ball p={[0.58, 0.7, 0]} r={0.35} c="#ffe9d0" sc={[0.35, 0.8, 1]} />
    <Ball p={[0, 0.95, -0.85]} r={0.3} c="#fff6ea" sc={[0.5, 1.2, 0.6]} />
    <Cyl p={[-0.2, 0.12, 0.1]} r={0.04} h={0.3} c="#ff8a2a" /><Cyl p={[0.2, 0.12, 0.1]} r={0.04} h={0.3} c="#ff8a2a" />
  </group>
);
const Clock = ({p, s = 1, turns = 0, face = '#fff', rim = '#e5392d', ry = 0}) => (
  <group position={p} scale={s} rotation={[0, ry, 0]}>
    <Cyl p={[0, 0, 0]} r={1} h={0.3} c={rim} rot={[Math.PI / 2, 0, 0]} />
    <Cyl p={[0, 0, 0.04]} r={0.88} h={0.3} c={face} rot={[Math.PI / 2, 0, 0]} />
    {Array.from({length: 12}, (_, i) => { const a = i * Math.PI / 6; return <RBox key={i} size={[0.07, i % 3 === 0 ? 0.2 : 0.11, 0.05]} r={0.01} color="#222" position={[Math.sin(a) * 0.72, Math.cos(a) * 0.72, 0.21]} rotation={[0, 0, -a]} />; })}
    <group position={[0, 0, 0.26]} rotation={[0, 0, -turns * Math.PI * 2]}><RBox size={[0.1, 0.6, 0.05]} r={0.02} color="#222" position={[0, 0.28, 0]} /></group>
    <group position={[0, 0, 0.3]} rotation={[0, 0, -turns * Math.PI * 24]}><RBox size={[0.06, 0.78, 0.04]} r={0.02} color="#e5392d" position={[0, 0.36, 0]} /></group>
    <Ball p={[0, 0, 0.3]} r={0.08} c="#222" />
  </group>
);
const Hand = ({p, ry = 0, open = 1, rz = 0, rx = 0}) => (
  <group position={p} rotation={[rx, ry, rz]}>
    <RBox size={[0.7, 0.6, 0.3]} r={0.14} color="#f4f4f6" position={[0, 0, 0]} rough={0.6} />
    {[-0.24, -0.08, 0.08, 0.24].map((x, i) => <Cap key={i} p={[x, 0.05 + open * 0.0, 0.3 + 0.14 * (1 - open) * 0]} r={0.075} h={0.34 - (1 - open) * 0.18} c="#f4f4f6" rot={[Math.PI / 2 - (1 - open) * 0.9, 0, 0]} />)}
    <Cap p={[0.42, -0.1, 0.12]} r={0.085} h={0.28} c="#f4f4f6" rot={[Math.PI / 2, 0, -0.9]} />
    <RBox size={[0.8, 0.7, 0.34]} r={0.1} color="#e5392d" position={[0, 0, -0.5]} rough={0.6} />
    <Cap p={[0, 0, -3.2]} r={0.3} h={5} c="#4aa8ff" rot={[Math.PI / 2, 0, 0]} />
  </group>
);
const Hardhat = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh castShadow><sphereGeometry args={[0.5, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c="#ffd23f" r={0.4} /></mesh>
    <RBox size={[1.3, 0.07, 0.8]} r={0.03} color="#ffd23f" position={[0, 0.03, 0.22]} />
    <RBox size={[0.12, 0.5, 0.9]} r={0.04} color="#e8b800" position={[0, 0.25, 0]} />
  </group>
);
const EggH = ({p = [0, 0, 0], s = 1, ry = 0, cut = false, thin = 0.94, glow = 0, shell = '#fff1d6', yolk = true, open = 0, opacity = 1, children}) => {
  const mk = (a, b, cutO) => {
    const pts = [];
    for (let i = a; i <= b; i++) { const t = Math.PI - (i / 40) * Math.PI; pts.push(new THREE.Vector2(Math.max(0.0001, 0.55 * Math.sin(t) * (1 - 0.16 * Math.cos(t))), 0.72 * Math.cos(t))); }
    return new THREE.LatheGeometry(pts, 48, cutO ? Math.PI * 0.25 : 0, cutO ? Math.PI * 1.5 : Math.PI * 2);
  };
  const full = useMemo(() => mk(0, 40, cut), [cut]);
  const lo = useMemo(() => mk(0, 24, false), []);
  const hi = useMemo(() => mk(24, 40, false), []);
  const sm = <meshStandardMaterial color={shell} roughness={0.5} side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} />;
  const inn = <meshStandardMaterial color="#fff8ee" roughness={0.4} emissive="#fff3d6" emissiveIntensity={0.25 + glow} side={THREE.DoubleSide} />;
  return (
    <group position={p} scale={s} rotation={[0, ry, 0]}>
      {open > 0 ? (
        <>
          <mesh geometry={lo} castShadow>{sm}</mesh>
          <group position={[0.3 * open, 0.9 * open, 0]} rotation={[0, 0, -1.1 * open]}><mesh geometry={hi} castShadow>{sm}</mesh></group>
        </>
      ) : (
        <>
          <mesh geometry={full} castShadow>{sm}</mesh>
          {cut && <mesh geometry={full} scale={thin}>{inn}</mesh>}
        </>
      )}
      {cut && yolk && <mesh position={[0, -0.05, 0]} castShadow><sphereGeometry args={[0.24, 28, 20]} /><M c="#ffb21c" r={0.35} e="#ffb21c" ei={0.35 + glow} /></mesh>}
      {children}
    </group>
  );
};
const Particles = ({n = 16, ts, f, size = 0.05, color = '#fff'}) => (
  <>{Array.from({length: n}, (_, i) => { const q = f(i, ts); return q ? <mesh key={i} position={q}><sphereGeometry args={[size, 8, 8]} /><meshBasicMaterial color={color} /></mesh> : null; })}</>
);
const Bacteria = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <Ball p={[0, 0, 0]} r={0.28} c="#6bd04a" rough={0.7} />
    {Array.from({length: 8}, (_, i) => { const a = i * Math.PI / 4; return <mesh key={i} position={[Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0]} rotation={[0, 0, a - Math.PI / 2]}><coneGeometry args={[0.06, 0.14, 8]} /><M c="#3f9f2a" /></mesh>; })}
    <Ball p={[-0.09, 0.06, 0.24]} r={0.06} c="#fff" /><Ball p={[0.09, 0.06, 0.24]} r={0.06} c="#fff" />
    <Ball p={[-0.09, 0.05, 0.29]} r={0.03} c="#222" /><Ball p={[0.09, 0.05, 0.29]} r={0.03} c="#222" />
    <RBox size={[0.22, 0.03, 0.03]} r={0.01} color="#222" position={[-0.09, 0.17, 0.26]} rotation={[0, 0, -0.4]} /><RBox size={[0.22, 0.03, 0.03]} r={0.01} color="#222" position={[0.09, 0.17, 0.26]} rotation={[0, 0, 0.4]} />
  </group>
);
const Hammer = ({p, rz = 0, s = 1}) => (
  <group position={p} rotation={[0, 0, rz]} scale={s}>
    <Cyl p={[0, 0.9, 0]} r={0.07} h={1.8} c="#a5693a" />
    <RBox size={[0.9, 0.5, 0.5]} r={0.08} color="#8a8f99" metal={0.3} position={[0, 1.85, 0]} />
  </group>
);
const Hourglass = ({p, s = 1, k = 0}) => (
  <group position={p} scale={s}>
    <Cyl p={[0, 0, 0]} r={0.7} h={0.14} c="#a5693a" /><Cyl p={[0, 2.1, 0]} r={0.7} h={0.14} c="#a5693a" />
    <mesh position={[0, 0.55, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.55, 0.95, 24]} /><meshStandardMaterial color="#cfe9ff" transparent opacity={0.5} /></mesh>
    <mesh position={[0, 1.55, 0]}><coneGeometry args={[0.55, 0.95, 24]} /><meshStandardMaterial color="#cfe9ff" transparent opacity={0.5} /></mesh>
    <mesh position={[0, 0.2 + 0.2 * k, 0]}><coneGeometry args={[0.38 * k + 0.05, 0.4 * k + 0.05, 16]} /><M c="#ffd23f" r={1} /></mesh>
    <mesh position={[0, 1.2 + 0.4 * (1 - k) * 0.6, 0]}><coneGeometry args={[0.45 * (1 - k) + 0.05, 0.7 * (1 - k) + 0.05, 16]} /><M c="#ffd23f" r={1} /></mesh>
    {[-0.55, 0.55].map((x, i) => <Cyl key={i} p={[x, 1.05, 0]} r={0.05} h={2.1} c="#a5693a" />)}
  </group>
);
const Calendar = ({p, s = 1, page = 1, ry = 0}) => (
  <group position={p} scale={s} rotation={[0, ry, 0]}>
    <RBox size={[1.9, 2.1, 0.2]} r={0.08} color="#e5392d" position={[0, 0, 0]} />
    <RBox size={[1.7, 1.55, 0.06]} r={0.04} color="#fff" position={[0, -0.18, 0.12]} />
    {[-0.6, 0, 0.6].map((x, i) => <Cyl key={i} p={[x, 0.97, 0.05]} r={0.07} h={0.3} c="#444" rot={[Math.PI / 2, 0, 0]} />)}
    {[0, 1, 2, 3, 4].map((i) => { const f = ((page * 5 + i * 1.3) % 6) / 6; return <RBox key={i} size={[1.6, 1.45, 0.02]} r={0.01} color="#fff" position={[0, -0.18, 0.15 + i * 0.01]} rotation={[0, 0, 0]} />; })}
  </group>
);
const Heart = ({p, s = 1, c = '#ff4d79'}) => {
  const geo = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(0, -0.5); sh.bezierCurveTo(-0.9, 0.1, -0.5, 0.8, 0, 0.4); sh.bezierCurveTo(0.5, 0.8, 0.9, 0.1, 0, -0.5); return new THREE.ExtrudeGeometry(sh, {depth: 0.15, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3}); }, []);
  return <mesh geometry={geo} position={p} scale={s}><M c={c} r={0.4} e={c} ei={0.3} /></mesh>;
};
const Coop = ({p, s = 1, lamp = 1}) => (
  <group position={p} scale={s}>
    <RBox size={[3.0, 1.6, 2.4]} r={0.1} color="#c8422f" position={[0, 0.8, 0]} rough={0.8} />
    <RBox size={[0.9, 1.0, 0.1]} r={0.04} color="#3b2412" position={[0.6, 0.55, 1.2]} />
    <mesh position={[0, 1.95, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1.05, 1.05, 3.2, 3]} /><M c="#7a2a20" r={0.9} /></mesh>
    <RBox size={[0.7, 0.55, 0.1]} r={0.04} color="#fff4cf" position={[-0.75, 1.0, 1.21]} />
    {[-1.35, 1.35].map((x, i) => <RBox key={i} size={[0.08, 0.55, 2.0]} r={0.03} color="#f4ead4" position={[x, 0.3, 2.0]} />)}
    <RBox size={[2.8, 0.08, 0.08]} r={0.03} color="#f4ead4" position={[0, 0.6, 3.0]} />
    <Cyl p={[0, 1.3, 1.4]} r={0.03} h={0.5} c="#444" />
    <mesh position={[0, 1.0, 1.4]}><coneGeometry args={[0.3, 0.22, 20, 1, true]} /><M c="#e5392d" side={THREE.DoubleSide} /></mesh>
    <Ball p={[0, 0.9, 1.4]} r={0.12 + 0.03 * lamp} c="#fff3c4" e="#ffcf5a" ei={2 * lamp} />
    <pointLight position={[0, 0.9, 1.5]} intensity={6 * lamp} color="#ffb347" distance={5} />
  </group>
);
const Feeder = ({p}) => (
  <group position={p}>
    <Cyl p={[0, 0.1, 0]} r={0.5} h={0.2} c="#ffd23f" /><Cyl p={[0, 0.22, 0]} r={0.4} h={0.06} c="#e5b13a" r2={0.4} />
    {Array.from({length: 20}, (_, i) => <Ball key={i} p={[(rnd(i) - 0.5) * 0.6, 0.27 + rnd(i + 9) * 0.05, (rnd(i + 3) - 0.5) * 0.6]} r={0.04} c="#e8c25a" />)}
  </group>
);
const Water = ({p}) => (
  <group position={p}>
    <Cyl p={[0, 0.1, 0]} r={0.5} h={0.2} c="#4aa8ff" /><Cyl p={[0, 0.2, 0]} r={0.4} h={0.05} c="#bfe8ff" />
  </group>
);
const Hourglass2 = Hourglass;
const Scale = ({p, tilt = 0, s = 1, left = null, right = null}) => (
  <group position={p} scale={s}>
    <RBox size={[1.6, 0.25, 0.9]} r={0.1} color="#e5392d" position={[0, 0.12, 0]} />
    <Cyl p={[0, 1.4, 0]} r={0.08} h={2.6} c="#444" />
    <group position={[0, 2.7, 0]} rotation={[0, 0, tilt]}>
      <RBox size={[4.2, 0.12, 0.14]} r={0.04} color="#ffd23f" />
      <group position={[-2.0, 0, 0]} rotation={[0, 0, -tilt]}><Cyl p={[0, -0.6, 0]} r={0.015} h={1.2} c="#444" /><Cyl p={[0, -1.25, 0]} r={0.65} h={0.08} c="#4aa8ff" /><group position={[0, -1.2, 0]}>{left}</group></group>
      <group position={[2.0, 0, 0]} rotation={[0, 0, -tilt]}><Cyl p={[0, -0.6, 0]} r={0.015} h={1.2} c="#444" /><Cyl p={[0, -1.25, 0]} r={0.65} h={0.08} c="#ff9a3c" /><group position={[0, -1.2, 0]}>{right}</group></group>
    </group>
    <Ball p={[0, 2.7, 0]} r={0.14} c="#444" />
  </group>
);
const Confetti = ({ts, n = 60, y0 = 7}) => (
  <>{Array.from({length: n}, (_, i) => {
    const age = (ts * 0.5 + rnd(i) * 1.5) % 1.8; const col = BOARDC[i % BOARDC.length];
    return <mesh key={i} position={[(rnd(i + 1) - 0.5) * 9 + Math.sin(ts * 3 + i) * 0.4, y0 - age * 3.4, (rnd(i + 2) - 0.5) * 7]} rotation={[ts * 3 + i, ts * 2, i]}><boxGeometry args={[0.2, 0.03, 0.12]} /><meshBasicMaterial color={col} /></mesh>;
  })}</>
);
const Cracks = ({s = 1, k = 1}) => (
  <group scale={s}>
    {[[0.0, 0.1, 0.4, 0.55, 0.35], [0.12, 0.3, -0.5, 0.4, 0.3], [-0.12, 0.0, 0.7, 0.35, 0.25], [0.0, -0.18, -0.35, 0.4, 0.28]].map((q, i) => <RBox key={i} size={[q[3] * k, 0.025, 0.04]} r={0.01} color="#3b2412" position={[q[0], q[1], 0.56 - Math.abs(q[0]) * 0.3]} rotation={[0, 0, q[2]]} cast={false} />)}
  </group>
);
const Marble = ({p, s = 1, ry = 0}) => (
  <group position={p} scale={s} rotation={[0, ry, 0]}>
    <RBox size={[1.5, 1.1, 1.0]} r={0.06} color="#f4f4f6" position={[0, 0.55, 0]} rough={0.15} />
    {[[-0.3, 0.7, 0.5, 0.7, 0.5], [0.3, 0.4, 0.51, 0.5, -0.8], [0.0, 0.25, 0.51, 0.4, 0.4]].map((q, i) => <RBox key={i} size={[q[3], 0.02, 0.01]} r={0.005} color="#8a93a6" position={[q[0], q[1], q[2]]} rotation={[0, 0, q[4]]} cast={false} />)}
  </group>
);
const Ropes = ({k = 1}) => (
  <group scale={k}>
    {[[0, 0, 0], [1.1, 0.3, 0], [-1.1, -0.3, 0.6]].map((r, i) => <mesh key={i} rotation={[r[0] + Math.PI / 2 * (i === 0 ? 1 : 0.4), r[1] + i * 0.6, r[2]]}><torusGeometry args={[0.6, 0.03, 8, 40]} /><M c="#ff9a3c" r={0.5} /></mesh>)}
    <Ball p={[0.58, 0, 0.12]} r={0.07} c="#e5392d" />
  </group>
);

// ---------------- cenas ----------------
const FR = LC;
const YOU = {shirt: '#4aa8ff', rough: 0.5};
const FRIEND = {shirt: '#ff5a5f', pants: '#6a4a8a', hair: '#1f1810', rough: 0.5};
const roomEl = (extra) => (
  <group position={[0, 0.06, 0.1]} scale={0.85}>
    <RoomBox floor="#ffe9a8" wall="#ff9a7a" side="#ff7a5f" trim="#fff4dc" bed={{frame: '#7a4ab8', sheet: '#ffffff', blanket: '#3fbf7f', pillow: '#fff7e8'}} lampShade="#ffe27a" rugC="#4aa8ff" rough={0.5} win={{glass: '#cdeeff', curtain: '#ff5a5f'}} />
    {extra}
  </group>
);
const ROOMHOLE = [-3.2, 3.2, -2.6, 3.0];
const Room = ({ts, g, arm = 1.45, you = 0, egg = null, hand = null}) => (
  <>
    <Board hole={ROOMHOLE} />
    {roomEl(<>
      <Person p={[-0.4, 0, 1.5]} ry={Math.PI / 2 - 0.15} arm={you} {...YOU} />
      <Person p={[1.4, 0, 1.5]} ry={-Math.PI / 2 + 0.15} arm={arm} {...FRIEND} />
      {egg}
    </>)}
    {hand}
    <Dice p={[3.7, 0.5, 3.4]} ry={0.8} /><Dice p={[-3.9, 0.5, 3.3]} ry={-0.4} />
  </>
);

const SHOTS = [
  // ===== CASA 1 · gancho (0 – 8,7) =====
  {s: 0.0, cam: {pos: [0.6, 8.6, 12.4], target: [0, 1.1, 0.4], k: [1.08, 0.98]}, el: (ts, d, g) => <Room g={g} arm={0.4 + 1.05 * ez(pr(ts, 0.8, 2.4))} />},
  {s: 2.7, cam: {pos: [-0.6, 3.2, 7.0], target: [0.5, 1.6, 1.5], k: [1.05, 0.85]}, el: (ts, d, g) => <Room g={g} arm={1.45 + 0.05 * Math.sin(ts * 5)} />},
  {s: 4.2, cam: {pos: [2.8, 2.2, 6.2], target: [0.2, 1.6, 1.5], k: [1.0, 0.82], orb: [0, -14]}, el: (ts, d, g) => <Room g={g} arm={1.45 + 0.08 * Math.sin(ts * 9)} you={0.5 * ez(pr(ts, 0.3, 1.2))} />},
  {s: 5.6, cam: {pos: [0.6, 7.0, 10.0], target: [0.4, 1.0, 1.5], k: [1.0, 0.9]}, el: (ts, d, g) => {
    const k = pr(ts, 0.05, 0.75);
    const yy = 0.65 * 0.9 + (1 - bounce(k)) * 4.2;
    return <Room g={g} arm={1.4} you={1.2} egg={<EggH p={[0.5, yy, 1.55]} s={0.9} ry={-0.3} />} hand={ts > 0.5 ? <group><Hand p={[0.3, lerp(6.2, 2.3, ez(pr(ts, 0.6, 1.5))), 1.9]} rx={Math.PI / 2} ry={0.3} /><Tag3D p={[-1.1, lerp(6.2, 3.4, ez(pr(ts, 0.6, 1.5))), 2.3]} text="QI −1" s={1.15} /></group> : null} />; }},
  {s: 7.0, cam: {pos: [0.6, 5.0, 8.5], target: [0.2, 1.4, 1.7], k: [1.18, 1.12]}, el: (ts, d, g) => <Room g={g} arm={1.4} you={1.2} egg={<EggH p={[0.5, 0.65 * 0.9, 1.55]} s={0.9} ry={-0.3} />} hand={<group><Hand p={[0.3 + 0.04 * Math.sin(ts * 35), 2.3, 1.9]} rx={Math.PI / 2} ry={0.3} /><Tag3D p={[-1.1, 3.4, 2.3]} text="QI −1" s={1.15} /><Tag3D p={[1.3, 3.5, 2.3]} text="NÃO" s={0.95} bg="#222" /></group>} />},

  // ===== CASA 2 · casca (8,7 – 29,9) =====
  {s: 8.7, cam: {pos: [2.0, 4.4, 9.2], target: [0, 1.7, 0], k: [1.15, 0.95]}, el: (ts) => <Surf color="#ff5a5f"><EggH p={[0, 1.4, 0]} s={1.9} ry={-0.2 + ts * 0.15} /><Dice p={[3.3, 0.55, 2.4]} /></Surf>},
  {s: 10.4, cam: {pos: [1.6, 3.2, 7.4], target: [0, 2.0, 0], k: [1.0, 0.85]}, el: (ts) => <Surf color="#ff5a5f"><EggH p={[0, 1.4, 0]} s={1.9} ry={-0.2} /><group position={[0, lerp(6, 3.15, bounce(pr(ts, 0, 0.5))), 0]}><Hardhat p={[0, 0, 0]} s={1.5} /></group></Surf>},
  {s: 12.2, cam: {pos: [2.2, 2.6, 6.6], target: [0, 1.9, 0], k: [1.0, 0.8]}, el: (ts) => <Surf color="#ff5a5f"><EggH p={[0, 1.4, 0]} s={1.9} cut ry={0.2 + ts * 0.1} glow={0.1 * Math.sin(ts * 3)} /></Surf>},
  {s: 15.6, cam: {pos: [0.6, 3.6, 9.4], target: [0.4, 1.4, 0], k: [1.0, 0.9]}, el: (ts) => <Surf color="#ff5a5f"><EggH p={[-1.1, 1.0, 0]} s={1.5} ry={-0.2} /><Marble p={[1.6, 0, 0]} s={1.5 * ez(pr(ts, 0.0, 0.4)) + 0.01} ry={-0.4} /></Surf>},
  {s: 17.4, cam: {pos: [2.0, 2.8, 6.4], target: [0, 1.8, 0], k: [1.0, 0.85]}, el: (ts) => <Surf color="#ff5a5f"><group position={[0, 1.4, 0]} scale={1.9}><EggH ry={-0.2} /><group rotation={[0, ts * 0.5, 0]}><Ropes k={1.15 * ez(pr(ts, 0.1, 0.9)) + 0.01} /></group></group></Surf>},
  {s: 19.4, cam: {pos: [1.6, 2.2, 5.2], target: [0, 2.0, 0.4], k: [1.0, 0.85]}, el: (ts) => <Surf color="#ff5a5f"><group position={[0, 1.4, 0]} scale={1.9}><EggH ry={0.2} />
      {Array.from({length: 26}, (_, i) => { const a = rnd(i) * 6.28, b = (rnd(i + 5) - 0.5) * 2.2; const r = 0.5 * Math.cos(b) + 0.02; return <Ball key={i} p={[Math.sin(a) * r * 1.0 * (0.55 / 0.6), b * 0.62, Math.cos(a) * r]} r={0.028} c="#3a2a22" />; })}</group>
      <Particles n={14} ts={ts} f={(i, t) => { const age = ((t * 0.7 + i * 0.13) % 1); if (age > 1) return null; return [lerp(-2.6, -0.5, age) + (rnd(i) - 0.5) * 0.3, 2.8 + (rnd(i + 4) - 0.5) * 1.3, 0.8 + rnd(i + 8)]; }} size={0.09} color="#bfe8ff" /></Surf>},
  {s: 21.9, cam: {pos: [0.6, 3.0, 8.2], target: [0, 1.9, 0], k: [1.0, 0.9]}, el: (ts) => {
    const sw = Math.sin(ts * 3.2); const hit = sw > 0.9; const hz = -0.8 + 0.9 * (0.5 + 0.5 * sw);
    return <Surf color="#ff5a5f"><EggH p={[0, 1.4, 0]} s={1.9} ry={-0.2} /><Hammer p={[-2.1, 0.9, 0.9]} rz={-0.9 + 1.0 * ez(clamp(0.5 + 0.5 * sw)) - (hit ? 0.1 : 0)} s={1.1} />
      <Bacteria p={[1.9 + 0.5 * Math.max(0, Math.sin(ts * 3.5 + 1)), 1.5 + 0.2 * Math.sin(ts * 5), 0.9]} s={1.2} /><Bacteria p={[2.0 + 0.4 * Math.max(0, Math.sin(ts * 3.1)), 2.5, 0.3]} s={0.9} />
      <mesh position={[1.3, 1.9, 0.5]} rotation={[0, -0.9, 0]}><circleGeometry args={[1.2, 32]} /><meshStandardMaterial color="#6fd0ff" transparent opacity={0.28} side={THREE.DoubleSide} /></mesh></Surf>; }},
  {s: 24.3, cam: {pos: [1.0, 3.4, 9.0], target: [0, 1.6, 0], k: [1.1, 0.92]}, el: (ts) => <Surf color="#ff5a5f"><Hen p={[-1.7, 0, 0.3]} s={1.5} ry={0.5} peck={Math.sin(ts * 6)} /><Clock p={[1.6, 2.6, -0.3]} s={1.4} turns={ts * 0.25} ry={-0.2} /><EggH p={[-0.3, 0.55, 2.3]} s={0.75} /></Surf>},
  {s: 27.0, cam: {pos: [1.2, 2.6, 6.8], target: [0, 1.9, 0], k: [1.05, 0.85]}, el: (ts) => {
    const hit = ts > 0.8; const fx = lerp(-3.6, -0.7, ez(pr(ts, 0.1, 0.8)));
    return <Surf color="#ff5a5f"><EggH p={[0, 1.4, 0]} s={1.9} ry={-0.2} />{hit && <group position={[0, 1.4, 0]} scale={1.9}><Cracks s={1.2} k={ez(pr(ts, 0.8, 1.2))} /></group>}
      <Cap p={[fx, 3.0 - 0.6 * ez(pr(ts, 0.1, 0.8)) , 0.7]} r={0.14} h={0.9} c="#f0bd94" rot={[0, 0, -Math.PI / 2 + 0.3]} />
      <Clock p={[2.5, 3.6, -0.5]} s={0.9} turns={ts * 0.4} ry={-0.3} rim="#222" /></Surf>; }},

  // ===== CASA 3 · esperar (29,9 – 46,9) =====
  {s: 29.94, cam: {pos: [1.6, 3.8, 9.0], target: [0, 1.7, 0], k: [1.1, 0.95]}, el: (ts) => <Surf color="#3fbf7f"><Person p={[-1.8, 0, 0.8]} ry={0.7} arm={0.0} {...YOU} /><Hourglass p={[1.4, 0, 0]} s={1.15} k={clamp(ts / 2.2)} /><EggH p={[-0.1, 0.55, 2.4]} s={0.75} /></Surf>},
  {s: 32.2, cam: {pos: [1.2, 2.8, 8.0], target: [0, 1.9, 0], k: [1.0, 0.88]}, el: (ts) => <Surf color="#3fbf7f"><Calendar p={[1.7, 2.1, 0]} s={1.5} page={Math.floor(ts * 8)} ry={-0.3} /><EggH p={[-1.3, 1.0, 0.2]} s={1.5} ry={-0.2} glow={0.05} /></Surf>},
  {s: 34.6, cam: {pos: [1.0, 2.6, 6.8], target: [0, 1.9, 0], k: [1.0, 0.88]}, el: (ts, d, g) => {
    const o = ez(pr(ts, 0.0, 0.5)); const up = ez(pr(ts, 0.3, 0.9));
    return <Surf color="#3fbf7f"><EggH p={[0, 1.4, 0]} s={1.9} ry={-0.2} open={o} /><Chick p={[0, 0.5 + 1.5 * up, 0]} s={1.5 * up + 0.01} ry={0} bob={0.04 * Math.sin(ts * 8)} /><Confetti ts={ts} n={34} y0={6} /></Surf>; }},
  {s: 35.7, cam: {pos: [2.0, 2.6, 6.4], target: [0, 1.9, 0], k: [1.0, 0.84], orb: [0, 22]}, el: (ts) => {
    const thin = 0.93 + 0.06 * pr(ts, 0.3, 4.5);
    return <Surf color="#3fbf7f"><EggH p={[0, 1.4, 0]} s={1.9} cut thin={thin} yolk={false} ry={0.3}><group position={[0, -0.12, 0]}><Chick s={0.9} p={[0, -0.2, 0]} bob={0.02 * Math.sin(ts * 4)} /></group></EggH>
      <Particles n={22} ts={ts} f={(i, t) => { const age = ((t * 0.5 + i * 0.09) % 1); const a = rnd(i) * 6.28; return [lerp(Math.sin(a) * 1.0, 0, age), lerp(1.4 + (rnd(i + 3) - 0.3) * 1.8, 1.4, age), lerp(Math.cos(a) * 1.0, 0.2, age)]; }} size={0.07} color="#fff" /></Surf>; }},
  {s: 40.9, cam: {pos: [1.2, 1.8, 4.6], target: [0, 1.4, 0], k: [1.25, 1.05]}, el: (ts) => <Surf color="#3fbf7f"><Chick p={[0, 0, 0.4]} s={2.6} open={0.5 + 0.5 * Math.sin(ts * 7)} /><Cap p={[0.7, 0.35, 1.9]} r={0.2} h={0.35} c="#fff1d6" rot={[0, 0, 1]} /><Cap p={[-0.6, 0.2, 1.6]} r={0.15} h={0.3} c="#fff1d6" rot={[0, 0, -0.5]} /></Surf>},
  {s: 42.6, cam: {pos: [0.9, 1.4, 4.0], target: [0.0, 1.8, 0.8], k: [1.2, 0.95]}, el: (ts) => <Surf color="#3fbf7f"><Chick p={[0, 0, 0.4]} s={3.2} open={0.9} tooth={1 + 0.2 * Math.sin(ts * 8)} />
      <mesh position={[0, 2.1, 1.85]}><torusGeometry args={[0.34, 0.045, 12, 40]} /><M c="#e5392d" e="#e5392d" ei={0.8} /></mesh></Surf>},

  // ===== CASA 4 · pinto (46,9 – 61,4) =====
  {s: 46.93, cam: {pos: [1.8, 3.4, 8.6], target: [0, 1.5, 0.4], k: [1.1, 0.92]}, el: (ts) => <Surf color="#4aa8ff"><EggH p={[-1.7, 0.55, 0.3]} s={0.9} open={1} /><Chick p={[0.1, 0, 1.0]} s={2.0} ry={-0.3} bob={Math.abs(0.1 * Math.sin(ts * 6))} /><Person p={[2.2, 0, -0.6]} ry={-1.0} arm={1.2} {...FRIEND} /></Surf>},
  {s: 49.4, cam: {pos: [-2.2, 2.8, 8.0], target: [-0.1, 1.6, 0.4], k: [1.0, 0.88]}, el: (ts) => <Surf color="#4aa8ff"><Chick p={[1.0, 0, 0.8]} s={2.0} ry={-0.5} scared={ez(pr(ts, 0.6, 1.2))} /><Person p={[lerp(-3.0, -1.4, ez(pr(ts, 0, 1.2))), 0, 0.6]} ry={Math.PI / 2 - 0.2} arm={1.5} {...YOU} /></Surf>},
  {s: 51.4, cam: {pos: [0.0, 3.2, 9.4], target: [0, 2.0, 0], k: [0.95, 0.9]}, el: (ts) => <Surf color="#4aa8ff"><Scale p={[0, 0, 0]} s={1.2} tilt={0.0 + 0.04 * Math.sin(ts * 3)} left={<Chick s={1.0} p={[0, 0.02, 0]} ry={0.2} />} right={<Cyl p={[0, 0.2, 0]} r={0.15} h={0.3} c="#9aa3b2" />} /></Surf>},
  {s: 55.5, cam: {pos: [0.0, 3.4, 10.0], target: [0, 2.2, 0], k: [0.95, 0.9]}, el: (ts) => {
    const t = ez(pr(ts, 0.1, 0.8));
    return <Surf color="#4aa8ff"><Scale p={[0, 0, 0]} s={1.2} tilt={0.0 - 0.38 * t} left={<Chick s={1.0} p={[0, 0.02, 0]} ry={0.2} scared={t} />} right={<Person p={[0, 0.02, 0]} s={0.7} ry={0.2} {...YOU} />} /></Surf>; }},
  {s: 58.4, cam: {pos: [1.2, 2.2, 7.0], target: [0, 1.5, 0.4], k: [0.8, 0.7]}, el: (ts) => {
    const sit = ez(pr(ts, 0.2, 0.9)); const sq = ez(pr(ts, 0.85, 1.0));
    return <Surf color="#4aa8ff"><Chick p={[0, 0, 0.5]} s={1.6} ry={0} squash={sq} scared={sq} />
      <group position={[0, lerp(3.4, 0.45, sit), 0.5]}><group scale={[1.1, 1 - 0.3 * sit, 1.1]}><Person p={[0, 0, 0]} ry={0.4} arm={0.1} {...YOU} /></group></group>
      {sq > 0.5 && Array.from({length: 5}, (_, i) => <Ball key={i} p={[Math.cos(i * 1.26 + ts * 8) * 0.9, 0.9 + 0.2 * Math.sin(ts * 12 + i), 0.5 + Math.sin(i * 1.26 + ts * 8) * 0.9]} r={0.1} c="#ffd23f" e="#ffd23f" ei={1} />)}</Surf>; }},

  // ===== CASA 5 · galinheiro (61,4 – 73,8) =====
  {s: 61.48, cam: {pos: [1.2, 3.8, 9.0], target: [0.4, 1.6, 0.6], k: [1.1, 0.95]}, el: (ts) => { const x = lerp(-2.5, 0.6, ez(pr(ts, 0.1, 2.0)));
    return <Surf color="#ff9a3c"><Coop p={[2.4, 0, -1.0]} s={0.8} lamp={0.7} /><Person p={[x, 0, 1.2]} ry={Math.PI / 2 - 0.2} arm={0.9} {...FRIEND} /><Chick p={[x + 0.5, 1.15, 1.45]} s={0.55} ry={0.5} /></Surf>; }},
  {s: 63.6, cam: {pos: [-1.0, 2.8, 8.6], target: [0, 1.6, 0.6], k: [1.0, 0.85]}, el: (ts) => <Surf color="#ff9a3c"><Coop p={[0, 0, -1.2]} s={0.95} lamp={1 + 0.2 * Math.sin(ts * 4)} /><Feeder p={[-1.7, 0, 2.6]} /><Water p={[1.7, 0, 2.6]} /></Surf>},
  {s: 66.9, cam: {pos: [1.0, 2.2, 6.4], target: [0, 1.4, 1.0], k: [1.0, 0.85]}, el: (ts) => <Surf color="#ff9a3c"><Coop p={[0, 0, -1.6]} s={0.95} lamp={1.2} /><Chick p={[-0.9, 0, 1.6]} s={1.3} ry={0.4} bob={Math.abs(0.1 * Math.sin(ts * 6))} /><Chick p={[0.6, 0, 1.8]} s={1.1} ry={-0.4} bob={Math.abs(0.1 * Math.sin(ts * 6 + 2))} />
      {[0, 1, 2, 3].map((i) => { const age = ((ts * 0.6 + i * 0.25) % 1); return <Heart key={i} p={[-1.2 + i * 0.8, 1.8 + age * 1.8, 1.8]} s={0.38 * (1 - age * 0.4)} />; })}</Surf>},
  {s: 68.8, cam: {pos: [0.8, 3.0, 7.2], target: [0, 1.6, 0.4], k: [1.0, 0.88]}, el: (ts) => <Surf color="#ff9a3c"><Person p={[0, 0, 0.6]} ry={0.2} arm={0.0} arm2={ts > 0.6 ? 2.7 : 0} {...YOU} /><Tag3D p={[0, 3.4, 0.6]} text="QI −1" s={1.6} />{[0, 1, 2].map((i) => <Ball key={i} p={[Math.cos(ts * 4 + i * 2.1) * 0.65, 2.45 + 0.1 * Math.sin(ts * 6 + i), 0.6 + Math.sin(ts * 4 + i * 2.1) * 0.65]} r={0.08} c="#ffd23f" e="#ffd23f" ei={1} />)}</Surf>},
  {s: 71.0, cam: {pos: [1.2, 6.6, 12.0], target: [0, 1.2, 0.4], k: [0.7, 0.8]}, el: (ts) => <Surf color="#ff9a3c"><Coop p={[-1.4, 0, -1.4]} s={0.9} lamp={1} /><Chick p={[-0.1, 0, 1.6]} s={1.4} bob={Math.abs(0.1 * Math.sin(ts * 6))} /><Person p={[1.9, 0, 0.8]} ry={-0.8} arm={1.4} {...FRIEND} /><Person p={[-2.2, 0, 1.6]} ry={0.8} arm={0.2} {...YOU} /><Confetti ts={ts} n={70} y0={8} />
      <group position={[2.4, 0, -2.2]}><Cyl p={[0, 1.6, 0]} r={0.05} h={3.2} c="#444" /><RBox size={[1.2, 0.8, 0.05]} r={0.02} color="#fff" position={[0.6, 2.8, 0]} />{[0, 1, 2, 3].map((i) => <RBox key={i} size={[0.3, 0.4, 0.06]} r={0.01} color="#222" position={[0.15 + i * 0.3, 2.6 + (i % 2) * 0.4 - 0.2 + 0.2, 0.01]} />)}</group></Surf>},
];

// ---------------- textos ----------------
const LABELS = [
  {a: 0.0, b: 2.6, t: 'VOCÊ E SEU AMIGO'},
  {a: 2.7, b: 5.5, t: 'QI NEGATIVO'},
  {a: 5.7, b: 8.6, t: 'PÉSSIMA IDEIA', red: true},
  {a: 8.8, b: 12.2, t: 'A CASCA'},
  {a: 30.0, b: 32.2, t: 'ESPERAR'},
  {a: 47.0, b: 49.4, t: 'O PINTO'},
  {a: 61.5, b: 63.6, t: 'O CERTO'},
];
const PILLS = [
  {a: 12.2, b: 15.5, t: '95% CARBONATO DE CÁLCIO'},
  {a: 15.6, b: 17.3, t: 'IGUAL AO MÁRMORE'},
  {a: 17.4, b: 19.4, t: 'AMARRADO POR PROTEÍNAS'},
  {a: 19.5, b: 21.9, t: 'POROS: O OVO RESPIRA'},
  {a: 22.0, b: 24.2, t: 'BATIDA E BACTÉRIA: NÃO'},
  {a: 24.3, b: 27.0, t: 'GALINHA: 20 HORAS'},
  {a: 27.1, b: 29.9, t: 'VOCÊ: 2 SEGUNDOS', red: true},
  {a: 32.3, b: 34.5, t: '21 DIAS', big: true},
  {a: 34.7, b: 35.8, t: 'NASCEU!', big: true},
  {a: 35.9, b: 40.8, t: 'CASCA → CÁLCIO → ESQUELETO'},
  {a: 41.0, b: 42.5, t: 'COME A PRÓPRIA CASA', red: true},
  {a: 42.7, b: 46.4, t: 'DENTE DE OVO'},
  {a: 49.5, b: 51.3, t: 'NÃO MEXE', red: true},
  {a: 51.9, b: 55.4, t: 'PINTINHO: 37 g'},
  {a: 55.6, b: 58.3, t: 'VOCÊ: 2.000× MAIS', red: true},
  {a: 58.5, b: 61.3, t: 'CUIDADO!', red: true},
  {a: 64.0, b: 65.5, t: 'PEQUENO E QUENTINHO'},
  {a: 65.6, b: 66.9, t: 'RAÇÃO E ÁGUA'},
  {a: 67.0, b: 68.7, t: 'VIVE FELIZ'},
  {a: 72.0, b: 74.7, t: 'NINGUÉM FOI ESMAGADO', green: true},
];
const CASAS = [{a: 0.0, n: 1}, {a: 8.7, n: 2}, {a: 29.94, n: 3}, {a: 46.93, n: 4}, {a: 61.48, n: 5}];

const WORDS = TL.segments.flatMap((s) => s.words);
const Karaoke = ({t}) => {
  let idx = -1; for (let i = 0; i < WORDS.length; i++) if (WORDS[i].s - 0.03 <= t) idx = i;
  if (idx < 0) return null;
  const w = WORDS[idx], nx = WORDS[idx + 1]; const hide = Math.min(w.e + 0.4, nx ? nx.s : 1e9);
  if (t > hide && !(idx === WORDS.length - 1 && t < w.e + 0.9)) return null;
  const k = backOut(pr(t, w.s - 0.03, w.s + 0.1)); const txt = w.w.replace(/[.,!?…:;"“”]/g, '');
  return <div style={{position: 'absolute', left: 0, right: 0, top: 800, textAlign: 'center', fontFamily: MONT, fontWeight: 900, fontSize: 60, color: '#fff', WebkitTextStroke: '8px #14305f', paintOrder: 'stroke fill', textShadow: '0 4px 0 #14305f', transform: `scale(${0.85 + 0.15 * k})`}}>{txt}</div>;
};

export const OvosVideo = ({tList}) => {
  const frame = useCurrentFrame();
  const g = tList ? tList[frame] : frame / FPS;
  let si = 0; for (let i = 0; i < SHOTS.length; i++) if (g >= SHOTS[i].s - 1e-6) si = i;
  const sh = SHOTS[si]; const end = si < SHOTS.length - 1 ? SHOTS[si + 1].s : TL.duration + TAIL;
  const ts = g - sh.s; const dur = end - sh.s;
  const lab = LABELS.find((l) => g >= l.a && g < l.b);
  const pills = PILLS.filter((p) => g >= p.a && g < p.b);
  let casa = CASAS[0]; for (const c of CASAS) if (g >= c.a - 1e-6) casa = c;
  const fade = 1 - pr(g, TL.duration + 0.3, TL.duration + 0.85);
  return (
    <AbsoluteFill style={{background: FR.bg}}>
      {!tList && <Audio src={staticFile('ovos/voz.mp3')} />}
      <FontGate>
        <Stage cam={sh.cam} k={ts / dur} L={FR} dm={sh.s >= 8.7 ? 1.85 : 1}>{sh.el(ts, dur, g)}</Stage>
        <div style={{position: 'absolute', left: 28, top: 52, width: 120, height: 120, transform: `scale(${backOut(pr(g, casa.a, casa.a + 0.35))}) rotate(-6deg)`, fontFamily: MONT, textAlign: 'center'}}>
          <div style={{width: 120, height: 120, borderRadius: 60, background: '#ffd23f', border: '8px solid #fff', boxShadow: '0 6px 0 rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{fontWeight: 900, fontSize: 19, letterSpacing: 2, color: '#14305f', marginTop: 2}}>CASA</div>
            <div style={{fontWeight: 900, fontSize: 62, lineHeight: '56px', color: '#e5392d'}}>{casa.n}</div>
          </div>
        </div>
        {lab && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: MONT}}>
            <span style={{display: 'inline-block', transform: `rotate(-3deg) scale(${backOut(pr(g, lab.a, lab.a + 0.25))})`, fontWeight: 900, fontSize: lab.t.length > 16 ? 38 : 46, letterSpacing: 1, color: lab.red ? '#ff5a5f' : '#ffd23f', WebkitTextStroke: '8px #14305f', paintOrder: 'stroke fill', textShadow: '0 4px 0 #14305f'}}>{lab.t}</span>
          </div>
        )}
        {pills.map((p) => (
          <div key={p.t} style={{position: 'absolute', left: 0, right: 0, top: p.big ? 300 : 295, textAlign: 'center', fontFamily: MONT}}>
            <span style={{display: 'inline-block', transform: `scale(${backOut(pr(g, p.a, p.a + 0.25))})`, fontWeight: 900, fontSize: p.big ? 76 : p.green ? 40 : 32, padding: p.big ? '8px 36px' : '10px 26px', borderRadius: 999, background: p.red ? '#e5392d' : p.green ? '#2fbf71' : '#fff', color: (p.red || p.green) ? '#fff' : '#14305f', boxShadow: '0 6px 0 rgba(0,0,0,.35)'}}>{p.t}</span>
          </div>
        ))}
        <Karaoke t={g} />
        {fade < 1 && <AbsoluteFill style={{background: '#14305f', opacity: 1 - fade}} />}
      </FontGate>
    </AbsoluteFill>
  );
};

export const OVOS_CHECK_T = SHOTS.map((s, i) => { const e = i < SHOTS.length - 1 ? SHOTS[i + 1].s : TL.duration; return s.s + Math.min(1.1, (e - s.s) * 0.7); });
export const OVOS_SHOTS_N = SHOTS.length;
