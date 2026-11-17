import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {RBox} from '../World.jsx';
import {Stage, MONT} from '../badger/concept.jsx';

const M = ({c, r = 0.8, m = 0, e, ei = 1, ...p}) => <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e || '#000'} emissiveIntensity={e ? ei : 0} {...p} />;
const Ball = ({p, r = 0.1, c = '#fff', sc = [1, 1, 1], rough = 0.7}) => <mesh position={p} scale={sc} castShadow><sphereGeometry args={[r, 24, 16]} /><M c={c} r={rough} /></mesh>;
const Cap = ({p, r = 0.1, h = 0.3, c = '#fff', rot = [0, 0, 0], rough = 0.7}) => <mesh position={p} rotation={rot} castShadow><capsuleGeometry args={[r, h, 8, 16]} /><M c={c} r={rough} /></mesh>;

// ---------- pessoa ----------
export const Person = ({p, ry = 0, skin = '#f0bd94', shirt = '#ff8a3d', pants = '#3b4a7a', hair = '#3a2416', arm = 0, arm2 = 0, rough = 0.7, pawn = false, s = 1}) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    {pawn && <mesh position={[0, 0.04, 0]} castShadow><cylinderGeometry args={[0.55, 0.62, 0.08, 32]} /><M c={shirt} r={0.4} /></mesh>}
    <group position={[0, pawn ? 0.08 : 0, 0]}>
      <Cap p={[-0.15, 0.48, 0]} r={0.11} h={0.62} c={pants} rough={rough} />
      <Cap p={[0.15, 0.48, 0]} r={0.11} h={0.62} c={pants} rough={rough} />
      <RBox size={[0.34, 0.1, 0.3]} r={0.04} color="#f4f1ea" position={[-0.15, 0.06, 0.05]} />
      <RBox size={[0.34, 0.1, 0.3]} r={0.04} color="#f4f1ea" position={[0.15, 0.06, 0.05]} />
      <RBox size={[0.62, 0.78, 0.38]} r={0.17} color={shirt} position={[0, 1.2, 0]} rough={rough} />
      <Cap p={[0, 1.7, 0]} r={0.075} h={0.08} c={skin} rough={rough} />
      <Ball p={[0, 1.92, 0]} r={0.27} c={skin} rough={rough} />
      <Ball p={[0, 2.03, -0.03]} r={0.285} c={hair} sc={[1, 0.72, 1]} rough={0.9} />
      <Ball p={[-0.095, 1.92, 0.245]} r={0.035} c="#1d1d24" />
      <Ball p={[0.095, 1.92, 0.245]} r={0.035} c="#1d1d24" />
      <Ball p={[0, 1.84, 0.262]} r={0.025} c="#d9906a" />
      {/* braços: pivô no ombro; arm = ângulo para frente (rad) */}
      <group position={[-0.4, 1.5, 0]} rotation={[-arm2, 0, 0.06]}>
        <Cap p={[0, -0.32, 0]} r={0.085} h={0.42} c={shirt} rough={rough} />
        <Ball p={[0, -0.68, 0]} r={0.1} c={skin} rough={rough} />
      </group>
      <group position={[0.4, 1.5, 0]} rotation={[-arm, 0, -0.06]}>
        <Cap p={[0, -0.32, 0]} r={0.085} h={0.42} c={shirt} rough={rough} />
        <Ball p={[0, -0.7, 0]} r={0.115} c={skin} rough={rough} />
      </group>
    </group>
  </group>
);

// ---------- móveis do quarto ----------
const Bed = ({p, c = {frame: '#a5693a', sheet: '#f4ecdc', blanket: '#d9663a', pillow: '#fff7e8'}, rough = 0.85}) => (
  <group position={p}>
    <RBox size={[2.5, 0.38, 3.2]} r={0.1} color={c.frame} position={[0, 0.32, 0]} rough={rough} />
    <RBox size={[2.36, 0.34, 3.05]} r={0.14} color={c.sheet} position={[0, 0.66, 0.02]} rough={rough} />
    <RBox size={[2.4, 0.3, 2.0]} r={0.13} color={c.blanket} position={[0, 0.84, 0.55]} rough={rough} />
    <RBox size={[2.5, 1.4, 0.22]} r={0.1} color={c.frame} position={[0, 0.9, -1.6]} rough={rough} />
    <RBox size={[1.0, 0.24, 0.6]} r={0.11} color={c.pillow} position={[-0.55, 0.96, -1.1]} rough={rough} />
    <RBox size={[1.0, 0.24, 0.6]} r={0.11} color={c.pillow} position={[0.55, 0.96, -1.1]} rough={rough} />
  </group>
);
const Lamp = ({p, shade = '#ffd88a', base = '#7a4a2a'}) => (
  <group position={p}>
    <RBox size={[0.9, 0.7, 0.8]} r={0.08} color={base} position={[0, 0.35, 0]} rough={0.8} />
    <mesh position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.04, 0.05, 0.5, 10]} /><M c={base} /></mesh>
    <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[0.2, 0.34, 0.42, 20, 1, true]} /><M c={shade} e={shade} ei={0.9} side={THREE.DoubleSide} /></mesh>
    <pointLight position={[0, 1.4, 0.2]} intensity={5} color={shade} distance={6} />
  </group>
);
const Window = ({p, glass = '#bfe3f5', frame = '#f6f2ea', curtain = '#e5a63a'}) => (
  <group position={p}>
    <RBox size={[1.8, 1.9, 0.1]} r={0.03} color={frame} />
    <RBox size={[1.55, 1.65, 0.08]} r={0.02} color={glass} emissive={glass} emissiveIntensity={0.9} position={[0, 0, 0.03]} cast={false} />
    <RBox size={[0.06, 1.65, 0.1]} r={0.02} color={frame} position={[0, 0, 0.07]} />
    <RBox size={[0.5, 2.2, 0.2]} r={0.09} color={curtain} position={[-1.15, -0.05, 0.15]} rough={1} />
    <RBox size={[0.5, 2.2, 0.2]} r={0.09} color={curtain} position={[1.15, -0.05, 0.15]} rough={1} />
  </group>
);

// ---------- quarto pronto (parede de fundo + parede lateral + piso) ----------
export const RoomBox = ({floor, wall, side, trim, bed, lampShade, rugC, rough = 0.85, extra, win}) => (
  <group>
    <RBox size={[5.2, 0.3, 4.4]} r={0.06} color={floor} position={[0, -0.15, 0.2]} rough={rough} />
    <RBox size={[5.2, 3.8, 0.24]} r={0.05} color={wall} position={[0, 1.9, -1.9]} rough={rough} />
    <RBox size={[0.24, 3.8, 4.4]} r={0.05} color={side} position={[-2.6, 1.9, 0.2]} rough={rough} />
    <RBox size={[5.2, 0.2, 0.12]} r={0.03} color={trim} position={[0, 0.1, -1.76]} rough={rough} />
    <mesh position={[0.1, 0.012, 0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[1.5, 48]} /><M c={rugC} r={1} /></mesh>
    <Window p={[0.2, 2.35, -1.76]} {...(win || {})} />
    <Bed p={[-1.15, 0, -0.2]} c={bed} rough={rough} />
    <Lamp p={[2.0, 0, -1.4]} shade={lampShade} />
    {extra}
  </group>
);

// ---------- ovo em corte ----------
export const Egg = ({p = [0, 0, 0], s = 1, cut = true, shell = '#f6ead2', yolk = '#ffb21c', glow = 0, ry = 0}) => {
  const geo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = Math.PI - (i / 40) * Math.PI; pts.push(new THREE.Vector2(Math.max(0.0001, 0.55 * Math.sin(t) * (1 - 0.16 * Math.cos(t))), 0.72 * Math.cos(t))); }
    return new THREE.LatheGeometry(pts, 48, cut ? Math.PI * 0.25 : 0, cut ? Math.PI * 1.5 : Math.PI * 2);
  }, [cut]);
  return (
    <group position={p} scale={s} rotation={[0, ry, 0]}>
      <mesh geometry={geo} castShadow><meshStandardMaterial color={shell} roughness={0.55} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={geo} scale={0.94}><meshStandardMaterial color="#fff8ee" roughness={0.4} emissive="#fff3d6" emissiveIntensity={0.25 + glow} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.05, 0]} castShadow><sphereGeometry args={[0.24, 28, 20]} /><M c={yolk} r={0.35} e={yolk} ei={0.35 + glow} /></mesh>
    </group>
  );
};

// ---------- cenário comum: balões/pílulas ----------
const Pill = ({x, y, text, dot = '#2fbf71', rot = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`, background: '#fff', borderRadius: 40, padding: '8px 18px 8px 12px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 16px rgba(0,0,0,.28)', fontFamily: MONT, fontWeight: 800, fontSize: 25, color: '#1f2733', whiteSpace: 'nowrap'}}>
    <span style={{width: 17, height: 17, borderRadius: 9, background: dot, display: 'inline-block'}} />{text}
  </div>
);

// ================= DIREÇÃO A — Diorama de argila =================
const LA = {bg: '#e8c9a0', sky: '#fff0d8', gnd: '#c99860', sunCol: '#ffe0b0', sunI: 2.0, hemi: 0.85, env: 0.5, exposure: 1.0, sunPos: [4, 9, 8]};
const Barn = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <RBox size={[1.5, 1.0, 1.2]} r={0.1} color="#c8422f" position={[0, 0.5, 0]} rough={1} />
    <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.55, 0.55, 1.4, 3]} /><M c="#8a2a20" r={1} /></mesh>
    <RBox size={[0.45, 0.65, 0.05]} r={0.02} color="#f4ead4" position={[0, 0.34, 0.62]} rough={1} />
  </group>
);
const Hay = ({p, s = 1}) => <mesh position={p} scale={s} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.38, 0.38, 0.6, 20]} /><M c="#e5c25a" r={1} /></mesh>;
const ClayTree = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.1, 0.14, 0.8, 10]} /><M c="#7a4a2a" r={1} /></mesh>
    <Ball p={[0, 1.0, 0]} r={0.5} c="#5fa043" rough={1} /><Ball p={[0.3, 0.8, 0.1]} r={0.32} c="#6fb04d" rough={1} />
  </group>
);
const ChickA = ({p, s = 1, ry = 0}) => (
  <group position={p} scale={s} rotation={[0, ry, 0]}>
    <Ball p={[0, 0.3, 0]} r={0.3} c="#ffd23f" sc={[1, 0.95, 1]} rough={1} /><Ball p={[0, 0.62, 0.08]} r={0.2} c="#ffd23f" rough={1} />
    <mesh position={[0, 0.6, 0.3]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.06, 0.14, 12]} /><M c="#ff8a2a" r={0.7} /></mesh>
    <Ball p={[-0.08, 0.68, 0.24]} r={0.03} c="#222" /><Ball p={[0.08, 0.68, 0.24]} r={0.03} c="#222" />
  </group>
);
const AClay = ({shot}) => (
  <>
    <mesh position={[0, -0.32, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 60]} /><M c="#c28a52" r={0.9} /></mesh>
    {shot === 1 ? (
      <>
        <RoomBox floor="#d9a066" wall="#f2d6a8" side="#e7bf88" trim="#fff4dc" bed={{frame: '#a5693a', sheet: '#f4ecdc', blanket: '#d9663a', pillow: '#fff7e8'}} lampShade="#ffd88a" rugC="#3f8f8a" rough={1}
          win={{curtain: '#e5a63a'}} />
        <Person p={[-0.4, 0, 1.5]} ry={Math.PI / 2 - 0.15} shirt="#4a8fd6" rough={1} />
        <Person p={[1.4, 0, 1.5]} ry={-Math.PI / 2 + 0.15} shirt="#ff8a3d" pants="#6a4a8a" hair="#1f1810" arm={1.45} rough={1} />
        {/* fazenda em miniatura na mesa (a mesa "vira fazenda") */}
        <Barn p={[3.6, 0, 1.6]} s={0.9} /><Hay p={[3.9, 0.38, 0.2]} /><ClayTree p={[-3.9, 0, 1.4]} s={1.1} /><ClayTree p={[4.1, 0, -1.2]} s={0.8} /><ChickA p={[2.5, 0, 2.8]} s={0.9} ry={0.5} />
      </>
    ) : (
      <>
        <Barn p={[-1.9, 0, -1.4]} s={1.3} /><Hay p={[2.0, 0.38, -1.2]} s={1.2} /><Hay p={[2.9, 0.38, -0.6]} s={1.0} /><ClayTree p={[-3.2, 0, 0.2]} s={1.2} /><ChickA p={[2.2, 0, 1.8]} s={1.1} ry={-0.6} />
        <RBox size={[2.6, 0.18, 2.6]} r={0.06} color="#c98b5b" position={[0, 0.09, 0.2]} rough={1} />
        <Egg p={[0, 1.1, 0.2]} s={1.9} ry={-0.2} shell="#f9ecd2" />
      </>
    )}
  </>
);

// ================= DIREÇÃO B — Galinheiro-laboratório =================
const LB = {bg: '#0e2a33', sky: '#d8f4ff', gnd: '#5c8e99', sunCol: '#dff6ff', sunI: 2.2, hemi: 0.8, env: 0.7, exposure: 1.0, sunPos: [-3, 9, 8]};
const Beaker = ({p, h = 0.8, liquid = '#6fe3d0', s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[0.28, 0.28, h, 28, 1, true]} /><M c="#dff6ff" r={0.1} transparent opacity={0.35} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, h * 0.3, 0]}><cylinderGeometry args={[0.26, 0.26, h * 0.6, 28]} /><M c={liquid} r={0.2} e={liquid} ei={0.3} transparent opacity={0.8} /></mesh>
  </group>
);
const Scope = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <RBox size={[0.7, 0.1, 0.55]} r={0.04} color="#e9eef2" position={[0, 0.05, 0]} rough={0.4} />
    <RBox size={[0.14, 0.9, 0.14]} r={0.05} color="#e9eef2" position={[0.2, 0.5, -0.1]} rough={0.4} />
    <mesh position={[0, 0.85, 0.05]} rotation={[0.5, 0, 0]} castShadow><cylinderGeometry args={[0.1, 0.12, 0.6, 16]} /><M c="#2a6f8f" r={0.35} m={0.3} /></mesh>
  </group>
);
const BClin = ({shot}) => (
  <>
    <mesh position={[0, -0.32, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 60]} /><M c="#12363f" r={0.9} /></mesh>
    {shot === 1 ? (
      <>
        <RoomBox floor="#e3f0f1" wall="#c4e7e0" side="#b2d9d3" trim="#ffffff" bed={{frame: '#dfe9ef', sheet: '#ffffff', blanket: '#4fb7c9', pillow: '#f2fbff'}} lampShade="#9ff1ff" rugC="#7fc7cf" rough={0.45}
          win={{glass: '#a9e6f5', frame: '#ffffff', curtain: '#4fb7c9'}}
          extra={<>
            <gridHelper args={[5, 10, '#7fc7cf', '#b6dde2']} position={[0, 0.02, 0.2]} />
            <RBox size={[1.5, 1.0, 0.08]} r={0.03} color="#ffffff" position={[-1.45, 2.45, -1.76]} rough={0.4} />
            <RBox size={[1.3, 0.8, 0.06]} r={0.02} color="#17323a" position={[-1.45, 2.45, -1.7]} rough={0.4} emissive="#17323a" />
            <RBox size={[0.55, 0.35, 0.05]} r={0.02} color="#ffd23f" position={[-1.45, 2.45, -1.65]} rough={0.5} />
          </>} />
        <Person p={[-0.4, 0, 1.5]} ry={Math.PI / 2 - 0.15} shirt="#e9eef2" pants="#3b5f7a" rough={0.45} />
        <Person p={[1.4, 0, 1.5]} ry={-Math.PI / 2 + 0.15} shirt="#e9eef2" pants="#3b5f7a" hair="#1f1810" arm={1.45} rough={0.45} />
        <pointLight position={[0, 3.6, 2]} intensity={10} color="#aeeeff" distance={9} />
      </>
    ) : (
      <>
        <RBox size={[4.6, 0.2, 2.4]} r={0.06} color="#c9d4da" position={[0, 0.0, 0.2]} rough={0.3} metal={0.6} />
        <RBox size={[4.4, 0.9, 2.2]} r={0.06} color="#1d4551" position={[0, -0.55, 0.2]} rough={0.5} />
        <Beaker p={[-1.7, 0.1, -0.4]} h={1.0} s={1.2} /><Beaker p={[-1.0, 0.1, -0.7]} h={0.7} liquid="#ffd23f" /><Scope p={[1.8, 0.1, -0.4]} s={1.4} />
        <mesh position={[1.1, 0.14, 0.8]}><cylinderGeometry args={[0.45, 0.45, 0.07, 32]} /><M c="#dff6ff" r={0.2} transparent opacity={0.6} /></mesh>
        <Egg p={[0, 1.4, 0.2]} s={1.9} ry={-0.2} shell="#f4e6cc" glow={0.2} />
        <mesh position={[0, 1.4, 0.2]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.3, 0.025, 12, 80]} /><M c="#3fe5ff" e="#3fe5ff" ei={2.2} /></mesh>
        <mesh position={[0, 1.4, 0.2]} rotation={[Math.PI / 2.4, 0.4, 0]}><torusGeometry args={[1.55, 0.015, 12, 80]} /><M c="#3fe5ff" e="#3fe5ff" ei={1.6} /></mesh>
      </>
    )}
  </>
);

// ================= DIREÇÃO C — Tabuleiro cartoon =================
export const LC = {bg: '#2f6fd4', sky: '#ffffff', gnd: '#f3cf80', sunCol: '#fff2d6', sunI: 2.4, hemi: 0.95, env: 0.5, exposure: 1.0, sunPos: [3, 10, 8]};
export const BOARDC = ['#ffd23f', '#ff5a5f', '#3fbf7f', '#4aa8ff', '#ff9a3c', '#a56bff'];
const Board = ({rows = 5}) => (
  <group>
    <RBox size={[9.5, 0.5, 9.5]} r={0.18} color="#f6e6bb" position={[0, -0.25, 0.3]} rough={0.6} />
    {Array.from({length: 8 * 8}, (_, i) => {
      const x = (i % 8) - 3.5, z = Math.floor(i / 8) - 3.5; if (Math.abs(x) < 1.6 && z > -3 && z < 1.6) return null;
      return <RBox key={i} size={[1.05, 0.06, 1.05]} r={0.02} color={BOARDC[(i + Math.floor(i / 8)) % BOARDC.length]} position={[x * 1.1, 0.03, z * 1.1 + 0.3]} rough={0.5} />;
    })}
  </group>
);
export const Dice = ({p, ry = 0.5}) => (
  <group position={p} rotation={[0.3, ry, 0.2]}>
    <RBox size={[0.8, 0.8, 0.8]} r={0.16} color="#fff" rough={0.3} />
    {[[0, 0, 0.41], [-0.2, 0.2, 0.41], [0.2, -0.2, 0.41]].map((d, i) => <mesh key={i} position={d}><sphereGeometry args={[0.07, 12, 10]} /><M c="#222" /></mesh>)}
    {[[0.41, 0.2, 0.2], [0.41, -0.2, -0.2], [0.41, 0, 0], [0.41, 0.2, -0.2], [0.41, -0.2, 0.2]].map((d, i) => <mesh key={'b' + i} position={d}><sphereGeometry args={[0.07, 12, 10]} /><M c="#222" /></mesh>)}
  </group>
);
const CTab = ({shot}) => (
  <>
    <mesh position={[0, -0.52, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[60, 60]} /><M c="#2557ad" r={0.9} /></mesh>
    <Board />
    {shot === 1 ? (
      <>
        <group position={[0, 0.06, 0.1]} scale={0.85}>
          <RoomBox floor="#ffe9a8" wall="#ff9a7a" side="#ff7a5f" trim="#fff4dc" bed={{frame: '#7a4ab8', sheet: '#ffffff', blanket: '#3fbf7f', pillow: '#fff7e8'}} lampShade="#ffe27a" rugC="#4aa8ff" rough={0.5} win={{glass: '#cdeeff', curtain: '#ff5a5f'}} />
          <Person p={[-0.4, 0, 1.5]} ry={Math.PI / 2 - 0.15} shirt="#4aa8ff" rough={0.5} pawn />
          <Person p={[1.4, 0, 1.5]} ry={-Math.PI / 2 + 0.15} shirt="#ff5a5f" pants="#6a4a8a" hair="#1f1810" arm={1.45} rough={0.5} pawn />
        </group>
        <Dice p={[3.0, 0.45, 3.4]} ry={0.8} /><Dice p={[-3.2, 0.45, 3.3]} ry={-0.4} />
        <RBox size={[1.8, 0.12, 1.1]} r={0.05} color="#ffd23f" position={[0, 0.06, 4.0]} rough={0.5} />
      </>
    ) : (
      <>
        <RBox size={[4.2, 0.2, 4.2]} r={0.08} color="#ffd23f" position={[0, 0.1, 0.3]} rough={0.5} />
        <RBox size={[3.8, 0.12, 3.8]} r={0.06} color="#fff4cf" position={[0, 0.22, 0.3]} rough={0.5} />
        <Egg p={[0, 1.55, 0.4]} s={1.8} ry={-0.2} shell="#fff1d6" />
        <Dice p={[3.4, 0.45, 3.2]} ry={0.8} />
      </>
    )}
  </>
);

export const OSHOTS = [
  {id: 'A1', L: LA, cam: {pos: [2.4, 4.6, 19.0], target: [0.0, 1.0, 0.3], fov: 34, k: 1, dy: 0}, label: 'SEU AMIGO TEM DOIS OVOS', cap: 'ovos', tag: 'A · Diorama de argila · gancho · blockout', el: <AClay shot={1} />},
  {id: 'A2', L: LA, cam: {pos: [-1.5, 3.2, 8.6], target: [0, 1.5, 0.2], fov: 34, k: 1, dy: 0}, label: 'A CASCA', cap: 'engenharia', tag: 'A · Diorama de argila · casca · blockout', el: <AClay shot={2} />, pills: [[170, 520, '95% cálcio', '#2fbf71', -4], [560, 600, 'poros', '#4a8fd6', 3], [300, 700, '20 h', '#ff8a3d', -2]]},
  {id: 'B1', L: LB, cam: {pos: [2.4, 4.6, 19.0], target: [0.0, 1.0, 0.3], fov: 34, k: 1, dy: 0}, label: 'SEU AMIGO TEM DOIS OVOS', cap: 'ovos', tag: 'B · Galinheiro-laboratório · gancho · blockout', el: <BClin shot={1} />},
  {id: 'B2', L: LB, cam: {pos: [-1.5, 3.2, 8.6], target: [0, 1.5, 0.2], fov: 34, k: 1, dy: 0}, label: 'A CASCA', cap: 'engenharia', tag: 'B · Galinheiro-laboratório · casca · blockout', el: <BClin shot={2} />, pills: [[170, 520, '95% cálcio', '#2fbf71', -4], [560, 600, 'poros', '#4a8fd6', 3], [300, 700, '20 h', '#ff8a3d', -2]]},
  {id: 'C1', L: LC, cam: {pos: [0.5, 8.4, 12.0], target: [0, 0.8, 0.3], fov: 34, k: 1, dy: 0}, label: 'SEU AMIGO TEM DOIS OVOS', cap: 'ovos', tag: 'C · Tabuleiro cartoon · gancho · blockout', el: <CTab shot={1} />},
  {id: 'C2', L: LC, cam: {pos: [0.5, 5.6, 8.4], target: [0, 1.2, 0.3], fov: 34, k: 1, dy: 0}, label: 'A CASCA', cap: 'engenharia', tag: 'C · Tabuleiro cartoon · casca · blockout', el: <CTab shot={2} />, pills: [[170, 520, '95% cálcio', '#2fbf71', -4], [560, 600, 'poros', '#4a8fd6', 3], [300, 700, '20 h', '#ff8a3d', -2]]},
];

export const OvosConcept = ({only}) => {
  const frame = useCurrentFrame();
  const s = OSHOTS[only ?? frame];
  return (
    <div style={{width: '100%', height: '100%', position: 'relative'}}>
      <Stage cam={s.cam} L={s.L} label={s.label} cap={s.cap} tag={s.tag}>{s.el}</Stage>
      {(s.pills || []).map((q, i) => <Pill key={i} x={q[0]} y={q[1]} text={q[2]} dot={q[3]} rot={q[4]} />)}
    </div>
  );
};
