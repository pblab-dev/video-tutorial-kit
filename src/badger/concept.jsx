import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RBox, Env} from '../World.jsx';
import {FontGate} from '../fonts.jsx';
import {mk} from '../seo/theme.jsx';
import {Badger} from './badger.jsx';

export const MONT = 'Montserrat, sans-serif';
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const Rig = ({pos, target}) => {
  const {camera} = useThree();
  camera.position.set(...pos); camera.lookAt(...target); camera.updateMatrixWorld();
  return null;
};

export const Stage = ({cam: cam0, L, label, cap, tag, children}) => {
  const {width, height} = useVideoConfig();
  const k = cam0.k ?? 1.9; const T = cam0.target; const tg = [T[0], T[1] - (cam0.dy ?? 0.9), T[2]];
  const cam = {...cam0, target: tg, pos: [tg[0] + (cam0.pos[0] - T[0]) * k, tg[1] + (cam0.pos[1] - T[1]) * k + 0.4, tg[2] + (cam0.pos[2] - T[2]) * k]};
  return (
    <AbsoluteFill style={{background: L.bg}}>
      <FontGate>
        <ThreeCanvas width={width} height={height} shadows camera={{fov: cam.fov || 34, position: cam.pos, near: 0.1, far: 200}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: L.exposure || 1}}>
          <Rig pos={cam.pos} target={cam.target} />
          <color attach="background" args={[L.bg]} />
          {L.fog && <fog attach="fog" args={[L.fog, 14, 40]} />}
          <Env intensity={L.env ?? 0.5} />
          <hemisphereLight args={[L.sky || '#fff', L.gnd || '#d8c8a0', L.hemi ?? 0.7]} />
          <directionalLight position={L.sunPos || [4, 8, 5]} intensity={L.sunI ?? 2.4} color={L.sunCol || '#fff0dc'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={0.5} shadow-camera-far={30} shadow-bias={-0.0004} shadow-normalBias={0.03} />
          {children}
        </ThreeCanvas>
        {/* etiqueta amarela pequena no topo (y~220) */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontFamily: MONT}}>
          <span style={{display: 'inline-block', transform: 'rotate(-3deg)', fontWeight: 900, fontSize: 40, letterSpacing: 1, color: '#ffd23f', WebkitTextStroke: '7px #3b2412', paintOrder: 'stroke fill', textShadow: '0 3px 0 #3b2412'}}>{label}</span>
        </div>
        {/* legenda 1 palavra (y~62%) */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 48, color: '#fff', textShadow: '0 3px 10px rgba(0,0,0,.55)'}}>{cap}</div>
        <div style={{position: 'absolute', left: 16, bottom: 14, fontFamily: MONT, fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,.85)', textShadow: '0 1px 4px #000'}}>{tag}</div>
      </FontGate>
    </AbsoluteFill>
  );
};

// ---------- cenário: piso terracota + parede ----------
const terra = () => mk('terra', 512, 512, (g, W, H) => {
  const n = 4; const s = W / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = rnd(i * 7 + j * 13);
    g.fillStyle = `hsl(${16 + v * 6}, ${62 + v * 10}%, ${42 + v * 9}%)`; g.fillRect(i * s, j * s, s, s);
    g.strokeStyle = '#8a4a2c'; g.lineWidth = 5; g.strokeRect(i * s, j * s, s, s);
  }
}, 3);
export const Floor = ({tex = true, color = '#c8643d', size = 30}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[size, size]} />
    <meshStandardMaterial map={tex ? terra() : null} color={tex ? '#fff' : color} roughness={0.8} />
  </mesh>
);
export const Wall = ({p, size, color}) => <RBox size={size} r={0.04} color={color} position={p} rough={0.9} />;

export const Sofa = ({p = [0, 0, 0]}) => (
  <group position={p}>
    <RBox size={[4.2, 0.7, 1.7]} r={0.25} color="#5b6b82" position={[0, 0.45, 0]} />
    <RBox size={[4.2, 1.3, 0.55]} r={0.25} color="#51607a" position={[0, 1.1, -0.65]} />
    <RBox size={[0.55, 1.0, 1.7]} r={0.22} color="#51607a" position={[-2.0, 0.8, 0]} />
    <RBox size={[0.55, 1.0, 1.7]} r={0.22} color="#51607a" position={[2.0, 0.8, 0]} />
  </group>
);

// ---------- cobra (adereço de brinquedo realista simples) ----------
export const Snake = ({pts, r = 0.14, color = '#6b6a3a', hood = null}) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 80, r, 12), [JSON.stringify(pts), r]);
  const last = pts[pts.length - 1];
  return (
    <group>
      <mesh geometry={geo} castShadow><meshStandardMaterial color={color} roughness={0.5} /></mesh>
      <mesh position={last} castShadow scale={[1, 0.8, 1.3]}><sphereGeometry args={[r * 1.4, 20, 16]} /><meshStandardMaterial color={color} roughness={0.45} /></mesh>
      {hood && (
        <mesh position={[last[0], last[1] - 0.45, last[2] - 0.05]} scale={[1.0, 1.5, 0.22]} castShadow>
          <sphereGeometry args={[0.55, 24, 20]} /><meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      )}
      <mesh position={[last[0] + 0.1, last[1] + 0.03, last[2] + 0.22]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color="#ffdd55" /></mesh>
      <mesh position={[last[0] - 0.1, last[1] + 0.03, last[2] + 0.22]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color="#ffdd55" /></mesh>
    </group>
  );
};

// ---------- colmeia + abelhas ----------
export const Hive = ({p = [0, 0, 0]}) => (
  <group position={p}>
    <RBox size={[1.3, 0.35, 1.1]} r={0.04} color="#e8d9a8" position={[0, 0.18, 0]} />
    {[0, 1, 2].map((i) => <RBox key={i} size={[1.2, 0.55, 1.0]} r={0.04} color={i % 2 ? '#e9c25a' : '#f3ecd0'} position={[0, 0.63 + i * 0.57, 0]} />)}
    <RBox size={[1.35, 0.12, 1.15]} r={0.03} color="#8b6a43" position={[0, 2.4, 0]} />
    <RBox size={[0.55, 0.1, 0.05]} r={0.02} color="#2b1b0c" position={[0, 0.55, 0.52]} />
  </group>
);
const Bees = ({c = [0, 1.2, 0], n = 36, rad = 1.5}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const a = rnd(i) * 6.28; const b = rnd(i + 50) * 3.14; const r = 0.5 + rnd(i + 90) * rad;
      return (
        <mesh key={i} position={[c[0] + Math.cos(a) * Math.sin(b) * r, c[1] + Math.cos(b) * r * 0.7, c[2] + Math.sin(a) * Math.sin(b) * r]} scale={[1, 0.8, 1.5]} castShadow>
          <sphereGeometry args={[0.055, 10, 8]} /><meshStandardMaterial color={i % 3 ? '#f2b705' : '#2a2214'} roughness={0.5} />
        </mesh>
      );
    })}
  </group>
);

// ---------- Kalahari ----------
export const Dune = ({p, s, color = '#d9a766'}) => <mesh position={p} scale={s} receiveShadow castShadow><sphereGeometry args={[1, 40, 24]} /><meshStandardMaterial color={color} roughness={1} /></mesh>;
export const Acacia = ({p = [0, 0, 0], s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.1, 0.18, 2.4, 10]} /><meshStandardMaterial color="#5a4630" roughness={0.9} /></mesh>
    {[[0, 2.6, 0, 1.8], [-0.9, 2.3, 0.2, 1.1], [1.0, 2.35, -0.2, 1.2]].map(([x, y, z, w], i) => (
      <mesh key={i} position={[x, y, z]} scale={[w, 0.28, w * 0.8]} castShadow><sphereGeometry args={[1, 24, 14]} /><meshStandardMaterial color="#7a8a3a" roughness={0.9} /></mesh>
    ))}
  </group>
);
export const Sand = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#d8a867" roughness={1} /></mesh>
);
export const Wall2 = ({p}) => <RBox size={[0.5, 2.6, 7]} r={0.05} color="#bdb6a8" position={p} rough={0.95} />;
const Ramp = ({p}) => (
  <group position={p}>
    {Array.from({length: 14}).map((_, i) => {
      const k = i % 7; const row = Math.floor(i / 7);
      return <mesh key={i} position={[-0.9 + k * -0.4, 0.2 + (6 - k) * 0.0 + row * 0.35 + (k < 3 ? 0.3 : 0), (rnd(i) - 0.5) * 0.4]} castShadow><sphereGeometry args={[0.28 + rnd(i + 3) * 0.08, 16, 12]} /><meshStandardMaterial color="#6e4a2e" roughness={1} /></mesh>;
    })}
  </group>
);

export const WARM = {bg: '#c9774a', sky: '#fff1dd', gnd: '#b06a40', sunCol: '#ffe2b8', sunI: 2.6, sunPos: [4, 7, 6]};
export const NAVY = {bg: '#0f1f3d', sky: '#7f9ad0', gnd: '#101a30', sunCol: '#cfe0ff', sunI: 2.4, hemi: 0.5, env: 0.3, sunPos: [-4, 8, 6]};
export const GRAY = {bg: '#3b3f46', sky: '#e8ecf5', gnd: '#555a63', sunCol: '#fff6e6', sunI: 2.4, sunPos: [3, 6, 6]};
export const GOLD = {bg: '#f4cf9a', sky: '#ffe9c4', gnd: '#c9965a', sunCol: '#ffc98a', sunI: 3.0, hemi: 0.8, fog: '#f4cf9a', sunPos: [-6, 4, 6], exposure: 1.0};

export const BSHOTS = [
  {id: 'A1', L: WARM, cam: {pos: [3.6, 1.7, 6.2], target: [0, 0.9, 0], fov: 32, k: 2.7}, label: 'O MOLETOM DELE', cap: 'Moletom', tag: 'A · Doméstico · blockout',
    el: (<><Floor /><Wall p={[0, 3, -3.2]} size={[16, 6, 0.3]} color="#8d5a3a" /><Sofa p={[0.5, 0, -2.3]} /><Badger p={[0, 0, 0.3]} ry={0.75} twist={0.0} /></>)},
  {id: 'A2', L: WARM, cam: {pos: [2.4, 5.6, 4.2], target: [0, 0.5, 0.5], fov: 32}, label: 'O MOLETOM DELE', cap: 'Pele', tag: 'A · Doméstico · topo, vira na própria pele · blockout',
    el: (<><Floor /><Badger p={[0, 0, 0]} ry={0.2} twist={1.0} lowerHead={0.15} /></>)},
  {id: 'B1', L: NAVY, cam: {pos: [-3.4, 1.6, 6.4], target: [0.2, 0.9, 0], fov: 32, k: 2.7}, label: 'A FECHADURA TROCADA DELE', cap: 'Veneno', tag: 'B · Estúdio por cena · blockout',
    el: (<><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#14284d" roughness={0.9} /></mesh>
      <Snake pts={[[3.0, 0.14, -1.2], [2.0, 0.14, -0.2], [1.6, 0.14, 1.2], [2.6, 0.2, 2.2], [3.2, 0.8, 2.6], [3.2, 1.5, 2.55]]} hood /><Badger p={[-0.8, 0, 1.4]} ry={0.9} lowerHead={0.08} /></>)},
  {id: 'B2', L: GRAY, cam: {pos: [1.2, 0.9, 4.2], target: [0, 0.35, 1.5], fov: 30, k: 1.9, dy: 0.1}, label: 'A RETROESCAVADEIRA DELE', cap: 'Garras', tag: 'B · macro das garras · blockout',
    el: (<><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color="#5c5f66" roughness={1} /></mesh><Badger p={[0, 0, -0.4]} ry={0.35} lowerHead={0.55} /></>)},
  {id: 'C1', L: GOLD, cam: {pos: [-3.6, 1.8, 7.2], target: [0.4, 1.0, 0], fov: 32, k: 2.7}, label: 'O FUMACÊ DELE', cap: 'Fumacê', tag: 'C · Kalahari fim de tarde · blockout',
    el: (<><Sand /><Dune p={[-6, -0.8, -8]} s={[9, 2, 5]} /><Dune p={[7, -1, -9]} s={[8, 2.2, 5]} color="#cf9a5c" /><Acacia p={[-4, 0, -5]} s={1.4} />
      <Hive p={[2.6, 0, -0.6]} /><Bees c={[2.6, 1.7, -0.2]} /><Badger p={[-0.5, 0, 1.0]} ry={0.95} lowerHead={0.0} /></>)},
  {id: 'C2', L: GOLD, cam: {pos: [-0.5, 2.4, 9.0], target: [0.6, 1.2, 0], fov: 30, k: 1.8}, label: 'O PUXADINHO DELE', cap: 'Puxadinho', tag: 'C · muro + rampa de lama (caso Stoffel) · blockout',
    el: (<><Sand /><Dune p={[-6, -0.8, -9]} s={[9, 2, 5]} /><Wall2 p={[2.4, 1.3, -0.5]} /><Ramp p={[1.2, 0, 0.8]} /><Badger p={[-1.0, 0, 1.4]} ry={1.0} /></>)},
];

export const BadgerConcept = ({only}) => {
  const frame = useCurrentFrame();
  const s = BSHOTS[only ?? frame];
  return <Stage cam={s.cam} L={s.L} label={s.label} cap={s.cap} tag={s.tag}>{s.el}</Stage>;
};
