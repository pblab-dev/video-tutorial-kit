import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {RBox} from '../World.jsx';
import {Stage} from '../badger/concept.jsx';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const SKIN = '#6a3d24'; export const SKIN2 = '#7a4a2e'; export const RED = '#d11f2a'; const LEATHER = '#3a2414'; const LEATHER2 = '#5a3a20';
const Y = new THREE.Vector3(0, 1, 0);

// segmento cônico entre dois pontos (r0 em a, r1 em b)
export const Seg = ({a, b, r0, r1, color = SKIN, rough = 0.7, seg = 16, cast = true}) => {
  const A = new THREE.Vector3(...a); const B = new THREE.Vector3(...b);
  const d = B.clone().sub(A); const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(Y, d.clone().normalize());
  const mid = A.clone().add(B).multiplyScalar(0.5);
  return (
    <mesh position={mid.toArray()} quaternion={q} castShadow={cast} receiveShadow>
      <cylinderGeometry args={[r1, r0, len, seg]} />
      <meshStandardMaterial color={color} roughness={rough} />
    </mesh>
  );
};
export const Ball = ({p, r, color = SKIN, s = [1, 1, 1], rough = 0.7}) => (
  <mesh position={p} scale={s} castShadow receiveShadow><sphereGeometry args={[r, 24, 18]} /><meshStandardMaterial color={color} roughness={rough} /></mesh>
);
export const Limb = ({pts, rs, color = SKIN}) => (
  <group>
    {pts.slice(0, -1).map((p, i) => <Seg key={i} a={p} b={pts[i + 1]} r0={rs[i]} r1={rs[i + 1]} color={color} />)}
    {pts.map((p, i) => <Ball key={i} p={p} r={rs[i]} color={color} />)}
  </group>
);

export const Sneaker = ({p, ry = 0, hole = false}) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RBox size={[0.62, 0.12, 1.15]} r={0.05} color="#f4f0e8" position={[0, 0.06, 0.12]} rough={0.9} />
    <RBox size={[0.58, 0.3, 1.0]} r={0.14} color={RED} position={[0, 0.27, 0.1]} rough={0.55} />
    <RBox size={[0.5, 0.36, 0.5]} r={0.15} color={RED} position={[0, 0.42, -0.14]} rough={0.55} />
    <RBox size={[0.4, 0.05, 0.36]} r={0.02} color="#f4f0e8" position={[0, 0.33, 0.3]} rough={0.9} />
    {[0, 1, 2].map((i) => <RBox key={i} size={[0.42, 0.04, 0.05]} r={0.015} color="#fff" position={[0, 0.36, 0.1 + i * 0.13]} rough={0.9} />)}
    {hole && <mesh position={[0, 0.62, -0.14]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.2, 0.05, 10, 24]} /><meshStandardMaterial color="#f4f0e8" roughness={0.9} /></mesh>}
  </group>
);

// segunda perna: linguiça grossa com veias, enfiada no tênis
export const Linguica = ({base = [-0.46, 0.62, -0.04], top = [-0.4, 1.45, 0.02], R = 0.21}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(base[0], base[1], base[2]),
    new THREE.Vector3(base[0] - 0.05, 0.95, 0.0),
    new THREE.Vector3(base[0] - 0.02, 1.2, 0.04),
    new THREE.Vector3(top[0], top[1], top[2]),
  ]), []);
  const rad = (t) => R;
  const veins = useMemo(() => Array.from({length: 9}).map((_, k) => {
    const ph = k * 0.9 + 0.3; const turns = 0.02 + rnd(k) * 0.05;
    const pts = Array.from({length: 40}).map((_, i) => {
      const t = 0.05 + (i / 39) * 0.9;
      const c = curve.getPoint(t); const tg = curve.getTangent(t);
      const n = new THREE.Vector3(1, 0, 0).cross(tg).normalize(); const m = tg.clone().cross(n).normalize();
      const ang = ph + t * turns * 6.0 + Math.sin(t * 7 + k * 2) * 0.16;
      const r = rad(t) * 1.0 + 0.012;
      return c.add(n.multiplyScalar(Math.cos(ang) * r)).add(m.multiplyScalar(Math.sin(ang) * r));
    });
    return new THREE.CatmullRomCurve3(pts);
  }), [curve]);
  const ringTs = [0.28, 0.5, 0.72];
  return (
    <group>
      {/* corpo da linguiça */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 40, R, 20, false]} />
        <meshStandardMaterial color="#b4583f" roughness={0.35} />
      </mesh>
      <Ball p={curve.getPoint(0.99).toArray()} r={R * 1.0} color="#b4583f" rough={0.45} />
      {/* veias saltadas */}
      {veins.map((v, i) => (
        <mesh key={i} castShadow>
          <tubeGeometry args={[v, 60, 0.014 + (i % 3) * 0.004, 8, false]} />
          <meshStandardMaterial color={i % 2 ? '#6a2b55' : '#8a3a4a'} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
};

export const Saci = ({p = [0, 0, 0], ry = 0, showTag = true, swing = 0, lean = 0, glow = 0}) => (
  <group position={p} rotation={[0, ry, lean]}>
    {/* perna de verdade (direita) */}
    <Limb pts={[[0.3, 1.55, 0], [0.38, 0.95, 0.06], [0.45, 0.5, 0.1]]} rs={[0.27, 0.2, 0.14]} />
    <Sneaker p={[0.46, 0, 0.12]} ry={-0.1} />
    {/* linguiça com veias como "segunda perna" (esquerda), enfiada no sapato */}
    <Sneaker p={[-0.46, 0, 0.1]} ry={0.1} hole />
    <group position={[-0.46, 0.62, -0.04]} rotation={[0, 0, swing]}><group position={[0.46, -0.62, 0.04]}><Linguica /></group></group>
    {/* bermuda vermelha */}
    <RBox size={[1.2, 0.6, 0.8]} r={0.2} color={RED} position={[0, 1.6, 0]} rough={0.85} />
    <RBox size={[1.24, 0.1, 0.84]} r={0.04} color="#fff" position={[0, 1.88, 0]} rough={0.9} />
    {/* tronco musculoso */}
    <RBox size={[1.05, 0.9, 0.7]} r={0.25} color={SKIN} position={[0, 2.25, 0]} rough={0.65} />
    <RBox size={[1.6, 0.95, 0.85]} r={0.35} color={SKIN} position={[0, 2.85, 0]} rough={0.65} />
    <Ball p={[-0.38, 2.95, 0.36]} r={0.34} color={SKIN2} s={[1, 0.75, 0.6]} />
    <Ball p={[0.38, 2.95, 0.36]} r={0.34} color={SKIN2} s={[1, 0.75, 0.6]} />
    {[0, 1, 2].map((i) => [-1, 1].map((s) => <Ball key={i + '_' + s} p={[s * 0.19, 2.5 - i * 0.2, 0.36]} r={0.14} color={SKIN2} s={[1, 0.8, 0.5]} />))}
    {/* braços */}
    <Limb pts={[[-0.9, 3.05, 0], [-1.35, 2.5, 0.1], [-1.0, 2.0, 0.5]]} rs={[0.3, 0.2, 0.17]} />
    <Limb pts={[[0.9, 3.05, 0], [1.35, 2.5, 0.1], [1.0, 2.0, 0.5]]} rs={[0.3, 0.2, 0.17]} />
    <Ball p={[-1.0, 1.9, 0.55]} r={0.2} color={SKIN2} />
    <Ball p={[1.0, 1.9, 0.55]} r={0.2} color={SKIN2} />
    {/* pescoço e cabeça */}
    <Seg a={[0, 3.2, 0]} b={[0, 3.6, 0.03]} r0={0.24} r1={0.22} />
    <Ball p={[0, 3.95, 0.05]} r={0.55} color={SKIN2} s={[0.95, 1.05, 1]} />
    <Ball p={[-0.2, 4.05, 0.5]} r={0.13} color="#fff" rough={0.3} /><Ball p={[0.2, 4.05, 0.5]} r={0.13} color="#fff" rough={0.3} />
    <Ball p={[-0.19, 4.04, 0.61]} r={0.06} color="#111" rough={0.3} /><Ball p={[0.21, 4.04, 0.61]} r={0.06} color="#111" rough={0.3} />
    <RBox size={[0.22, 0.05, 0.05]} r={0.02} color="#2a160c" position={[-0.2, 4.24, 0.56]} rotation={[0, 0, 0.25]} />
    <RBox size={[0.22, 0.05, 0.05]} r={0.02} color="#2a160c" position={[0.2, 4.25, 0.56]} rotation={[0, 0, -0.25]} />
    {/* sorriso */}
    <RBox size={[0.5, 0.15, 0.1]} r={0.05} color="#fff" position={[-0.02, 3.75, 0.5]} rotation={[0, 0, 0.08]} rough={0.3} />
    {/* cachimbo */}
    <Seg a={[0.1, 3.72, 0.52]} b={[0.45, 3.65, 0.68]} r0={0.03} r1={0.03} color="#3a2414" />
    <Ball p={[0.48, 3.7, 0.72]} r={0.1} color="#e6b422" rough={0.3} />
    {/* carapuça vermelha */}
    <mesh position={[0, 4.35, 0.02]} castShadow><cylinderGeometry args={[0.52, 0.57, 0.3, 24]} /><meshStandardMaterial color={RED} roughness={0.8} emissive={RED} emissiveIntensity={glow} /></mesh>
    <mesh position={[-0.05, 4.8, -0.18]} rotation={[-0.45, 0, 0.2]} castShadow><coneGeometry args={[0.47, 0.95, 24]} /><meshStandardMaterial color={RED} roughness={0.8} emissive={RED} emissiveIntensity={glow} /></mesh>
    <Ball p={[-0.2, 5.2, -0.5]} r={0.1} color={RED} />
  </group>
);

export const Tree = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.2, 0.32, 3.2, 10]} /><meshStandardMaterial color="#3a2a1c" roughness={1} /></mesh>
    {[[0, 3.6, 0, 1.5], [-0.8, 3.1, 0.3, 1.0], [0.9, 3.3, -0.2, 1.1]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color={i % 2 ? '#2f5a34' : '#3a6b3a'} roughness={0.95} flatShading /></mesh>
    ))}
  </group>
);
export const Whirl = ({t = 0, n = 70}) => (
  <group>
    {Array.from({length: n}).map((_, i) => {
      const k = i / n; const h = 0.2 + k * 5.2; const ang = k * 14 + t * 2.2 + rnd(i) * 0.8; const rad = 0.9 + k * 1.9 + rnd(i + 9) * 0.3;
      return <mesh key={i} position={[Math.cos(ang) * rad, h, Math.sin(ang) * rad]} rotation={[rnd(i) * 3, ang, rnd(i + 4) * 3]} castShadow>
        <boxGeometry args={[0.28, 0.02, 0.18]} /><meshStandardMaterial color={['#7a8a3a', '#a0702a', '#4f7a3a', '#c0902e'][i % 4]} roughness={0.9} />
      </mesh>;
    })}
  </group>
);
export const Ground = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#4a3a24" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><circleGeometry args={[4.5, 40]} /><meshStandardMaterial color="#6b5030" roughness={1} /></mesh>
    {Array.from({length: 40}).map((_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 18, 0.15, -2 - rnd(i + 3) * 10 + (i % 3) * 5]} castShadow><coneGeometry args={[0.1, 0.4, 5]} /><meshStandardMaterial color="#58803a" roughness={1} /></mesh>)}
  </>
);
export const Forest = () => (<>{[[-6, 0, -7, 1.3], [-3, 0, -10, 1.6], [3.5, 0, -9, 1.4], [7, 0, -6, 1.2], [0, 0, -14, 2], [-8, 0, -12, 1.7]].map(([x, y, z, s], i) => <Tree key={i} p={[x, y, z]} s={s} />)}</>);

export const DUSK = {bg: '#28385c', sky: '#9fb4e6', gnd: '#3a2a18', sunCol: '#ffcf8a', sunI: 2.6, hemi: 0.55, env: 0.35, sunPos: [-4, 7, 6], fog: '#28385c'};

export const SSHOTS = [
  {id: 'S1', L: DUSK, cam: {pos: [3.2, 2.4, 8.4], target: [0, 2.3, 0], fov: 32, k: 1.7, dy: 0.3}, label: 'O SACI PERERÊ', cap: 'Uma perna', tag: 'Saci · herói + redemoinho · blockout',
    el: (<><Ground /><Forest /><Whirl /><Saci ry={-0.3} /></>)},
  {id: 'S2', L: DUSK, cam: {pos: [-2.8, 1.1, 4.0], target: [-0.45, 0.8, 0.1], fov: 30, k: 1.0, dy: 0.0}, label: 'A SEGUNDA PERNA DELE', cap: 'Linguiça', tag: 'Saci · close na linguiça calçada · blockout',
    el: (<><Ground /><Forest /><Saci ry={0.2} /></>)},
  {id: 'S3', L: DUSK, cam: {pos: [-6.5, 2.6, 3.0], target: [0, 1.8, 0], fov: 30, k: 1.0, dy: 0.0}, label: 'LINGUIÇA = PERNA', cap: 'Perna', tag: 'Saci · perfil, linguiça do quadril ao pé · blockout',
    el: (<><Ground /><Forest /><Saci ry={1.2} /></>)},
];

export const SaciConcept = ({only}) => {
  const frame = useCurrentFrame();
  const s = SSHOTS[only ?? frame];
  return <Stage cam={s.cam} L={s.L} label={s.label} cap={s.cap} tag={s.tag}>{s.el}</Stage>;
};
