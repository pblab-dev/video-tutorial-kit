import React from 'react';
import * as THREE from 'three';
import {RBox} from '../World.jsx';
import {Floor, Sofa} from './concept.jsx';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const M = ({c, r = 0.8, m = 0, e, ei = 1, ...p}) => <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e || '#000'} emissiveIntensity={e ? ei : 0} {...p} />;

// ================= SALA =================
const Cushion = ({p, c, rot = [0, 0, 0]}) => <RBox size={[0.75, 0.75, 0.22]} r={0.1} color={c} position={p} rotation={rot} rough={1} />;

const Frame = ({p, w = 0.9, h = 1.2, art = 0}) => (
  <group position={p}>
    <RBox size={[w + 0.14, h + 0.14, 0.06]} r={0.02} color="#5a3a22" />
    <RBox size={[w, h, 0.07]} r={0.01} color="#f4ead4" />
    {art === 0 && (<>
      <mesh position={[0, -0.12, 0.05]} scale={[w * 0.9, h * 0.3, 1]}><circleGeometry args={[0.5, 24, 0, Math.PI]} /><M c="#d9663a" r={1} /></mesh>
      <mesh position={[0.1, 0.22, 0.05]}><circleGeometry args={[0.13, 20]} /><M c="#f2b705" r={1} /></mesh>
    </>)}
    {art === 1 && [0, 1, 2].map((i) => <RBox key={i} size={[w * 0.7, 0.14, 0.08]} r={0.02} color={['#3f8f8a', '#e5a63a', '#c0503a'][i]} position={[0, 0.3 - i * 0.3, 0.02]} />)}
    {art === 2 && (<>
      <mesh position={[0, 0, 0.05]}><circleGeometry args={[0.3, 24]} /><M c="#3f6f9a" r={1} /></mesh>
      <mesh position={[0.12, -0.05, 0.06]}><circleGeometry args={[0.2, 24]} /><M c="#f2b705" r={1} /></mesh>
    </>)}
  </group>
);

const Shelf = ({p}) => (
  <group position={p}>
    <RBox size={[1.9, 3.5, 0.65]} r={0.06} color="#7a4f2f" position={[0, 1.75, 0]} rough={0.7} />
    {[0, 1, 2, 3].map((i) => {
      const y = 0.55 + i * 0.8;
      return (
        <group key={i}>
          <RBox size={[1.7, 0.7, 0.5]} r={0.02} color="#3a2616" position={[0, y + 0.05, 0.08]} rough={1} />
          {Array.from({length: 9}).map((_, k) => {
            const h = 0.4 + rnd(i * 20 + k) * 0.25; const col = ['#c0503a', '#3f8f8a', '#e5a63a', '#3f6f9a', '#8c5aa0', '#f1e6d2', '#6b9a4a'][Math.floor(rnd(i * 31 + k + 3) * 7)];
            return <RBox key={k} size={[0.13, h, 0.34]} r={0.02} color={col} position={[-0.72 + k * 0.17 - (i === 1 && k > 5 ? 0 : 0), y - 0.3 + h / 2 + 0.05, 0.22]} rotation={[0, 0, i === 2 && k === 8 ? 0.25 : 0]} rough={0.8} />;
          })}
        </group>
      );
    })}
  </group>
);

const Plant = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow><cylinderGeometry args={[0.5, 0.36, 0.8, 24]} /><M c="#c98558" r={0.9} /></mesh>
    <mesh position={[0, 0.82, 0]}><cylinderGeometry args={[0.48, 0.48, 0.05, 24]} /><M c="#2c1c10" r={1} /></mesh>
    {Array.from({length: 11}).map((_, i) => {
      const a = (i / 11) * 6.283 + rnd(i) * 0.5; const t = 0.35 + rnd(i + 4) * 0.5; const h = 1.1 + rnd(i + 9) * 0.9;
      return (
        <group key={i} rotation={[0, a, 0]}>
          <group rotation={[0, 0, -t]} position={[0, 0.8, 0]}>
            <mesh position={[0, h / 2, 0]} scale={[0.16, h / 2, 0.035]} castShadow><sphereGeometry args={[1, 14, 10]} /><M c={i % 2 ? '#3f7f3a' : '#4f9645'} r={0.7} /></mesh>
          </group>
        </group>
      );
    })}
  </group>
);

const FloorLamp = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.35, 0.4, 0.1, 24]} /><M c="#2b2b2b" m={0.5} r={0.4} /></mesh>
    <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.04, 0.04, 3, 10]} /><M c="#2b2b2b" m={0.5} r={0.4} /></mesh>
    <mesh position={[0, 3.0, 0]}><cylinderGeometry args={[0.38, 0.62, 0.8, 28, 1, true]} /><M c="#ffe3a8" e="#ffb85a" ei={1.1} r={0.9} side={THREE.DoubleSide} /></mesh>
    <pointLight position={[0, 2.9, 0.3]} intensity={2.2} distance={7} color="#ffc680" />
  </group>
);

const SideTable = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.78, 0]} castShadow receiveShadow><cylinderGeometry args={[0.7, 0.7, 0.08, 28]} /><M c="#8a5a36" r={0.6} /></mesh>
    {[0, 1, 2].map((i) => <mesh key={i} position={[Math.cos(i * 2.094) * 0.42, 0.38, Math.sin(i * 2.094) * 0.42]} rotation={[Math.sin(i * 2.094) * 0.12, 0, -Math.cos(i * 2.094) * 0.12]} castShadow><cylinderGeometry args={[0.04, 0.05, 0.8, 8]} /><M c="#5a3a22" /></mesh>)}
    <mesh position={[0.12, 0.99, 0.05]} castShadow><cylinderGeometry args={[0.14, 0.12, 0.3, 20]} /><M c="#f4f1ea" r={0.3} /></mesh>
    <mesh position={[0.12, 1.14, 0.05]}><cylinderGeometry args={[0.12, 0.12, 0.02, 20]} /><M c="#4a2a12" r={0.3} /></mesh>
    <mesh position={[-0.25, 0.92, -0.1]} castShadow><cylinderGeometry args={[0.12, 0.1, 0.16, 16]} /><M c="#d9663a" r={0.8} /></mesh>
    <mesh position={[-0.25, 1.08, -0.1]} scale={[1, 1.6, 1]} castShadow><sphereGeometry args={[0.09, 12, 10]} /><M c="#4f9645" r={0.8} /></mesh>
  </group>
);

const Rug = ({p = [0, 0.012, 0.4], r = 3.0}) => (
  <group position={p} rotation={[-Math.PI / 2, 0, 0]}>
    <mesh receiveShadow><circleGeometry args={[r, 64]} /><M c="#27406b" r={1} /></mesh>
    <mesh position={[0, 0, 0.004]} receiveShadow><ringGeometry args={[r * 0.78, r * 0.86, 64]} /><M c="#f1e6d2" r={1} /></mesh>
    <mesh position={[0, 0, 0.004]} receiveShadow><ringGeometry args={[r * 0.5, r * 0.55, 64]} /><M c="#e5a63a" r={1} /></mesh>
    <mesh position={[0, 0, 0.003]} receiveShadow><ringGeometry args={[r * 0.92, r, 64]} /><M c="#c0503a" r={1} /></mesh>
  </group>
);

const Toys = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.22, 0]} castShadow><sphereGeometry args={[0.22, 20, 16]} /><M c="#d33a2c" r={0.4} /></mesh>
    <mesh position={[0.7, 0.1, 0.5]} rotation={[0, 0.6, Math.PI / 2]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.55, 12]} /><M c="#f4ead4" r={0.5} /></mesh>
    <RBox size={[0.9, 0.5, 0.7]} r={0.03} color="#b98a55" position={[-1.0, 0.25, -0.3]} rotation={[0, 0.4, 0]} rough={1} />
  </group>
);

export const Room = ({wall = "#3f6f73", frames = true}) => (
  <>
    <Floor />
    <Rug />
    <RBox size={[18, 6.2, 0.3]} r={0.04} color={wall} position={[0, 3.1, -3.2]} rough={0.95} />
    <RBox size={[18, 0.28, 0.12]} r={0.03} color="#f1e6d2" position={[0, 0.14, -3.02]} rough={0.7} />
    <RBox size={[18, 0.12, 0.1]} r={0.02} color="#f1e6d2" position={[0, 5.0, -3.02]} rough={0.7} />
    {/* janela com cortinas */}
    <group position={[-3.6, 2.9, -3.03]}>
      <RBox size={[2.4, 2.8, 0.1]} r={0.03} color="#f6f2ea" />
      <RBox size={[2.1, 2.5, 0.08]} r={0.02} color="#bfe3f5" emissive="#9fd4f2" emissiveIntensity={0.9} position={[0, 0, 0.03]} cast={false} />
      <RBox size={[0.07, 2.5, 0.1]} r={0.02} color="#f6f2ea" position={[0, 0, 0.07]} />
      <RBox size={[2.1, 0.07, 0.1]} r={0.02} color="#f6f2ea" position={[0, 0, 0.07]} />
      <RBox size={[0.7, 3.4, 0.22]} r={0.1} color="#e5a63a" position={[-1.45, -0.1, 0.2]} rough={1} />
      <RBox size={[0.7, 3.4, 0.22]} r={0.1} color="#e5a63a" position={[1.45, -0.1, 0.2]} rough={1} />
      <mesh position={[0, 1.7, 0.2]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 4.0, 10]} /><M c="#3a2616" r={0.5} /></mesh>
    </group>
    {/* quadros */}
    {frames && <>
    <Frame p={[-0.7, 3.2, -3.0]} art={0} />
    <Frame p={[0.7, 3.5, -3.0]} w={1.2} h={0.9} art={1} />
    <Frame p={[2.1, 3.1, -3.0]} w={0.8} h={0.8} art={2} />
    </>}
    <Sofa p={[0.5, 0, -2.3]} />
    <Cushion p={[-0.9, 1.15, -1.6]} c="#e5a63a" rot={[-0.25, 0.25, 0.15]} />
    <Cushion p={[0.0, 1.15, -1.62]} c="#c0503a" rot={[-0.25, -0.1, -0.08]} />
    <Cushion p={[1.9, 1.15, -1.6]} c="#f1e6d2" rot={[-0.25, -0.3, 0.1]} />
    <RBox size={[1.4, 0.08, 0.7]} r={0.03} color="#3f8f8a" position={[1.1, 0.88, -1.2]} rotation={[0, 0, 0.05]} rough={1} />
    <Shelf p={[4.5, 0, -2.75]} />
    <Plant p={[-5.6, 0, -2.4]} s={1.15} />
    <Plant p={[3.2, 0, -2.5]} s={0.7} />
    <FloorLamp p={[-2.4, 0, -2.5]} />
    <SideTable p={[-4.0, 0, -0.9]} />
    <Toys p={[-3.2, 0, 1.6]} />
  </>
);

// ================= SAVANA =================
const Tuft = ({p, s = 1, c = '#c9b25a'}) => (
  <group position={p} scale={s}>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[(rnd(i + p[0]) - 0.5) * 0.12, 0.2, (rnd(i + p[2]) - 0.5) * 0.12]} rotation={[(rnd(i + 3) - 0.5) * 0.7, 0, (rnd(i + 6) - 0.5) * 0.7]}><coneGeometry args={[0.035, 0.45 + rnd(i + 9) * 0.25, 4]} /><M c={c} r={1} /></mesh>)}
  </group>
);
const Rock = ({p, s = [1, 0.6, 1], c = '#8a7458'}) => <mesh position={p} scale={s} castShadow receiveShadow><dodecahedronGeometry args={[0.5, 1]} /><M c={c} r={1} /></mesh>;
const Termite = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow><coneGeometry args={[0.55, 1.1, 14]} /><M c="#a86a3e" r={1} /></mesh>
    <mesh position={[0.2, 0.25, 0.25]} castShadow><coneGeometry args={[0.25, 0.5, 10]} /><M c="#9a5f36" r={1} /></mesh>
  </group>
);
const Baobab = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 2.2, 0]} castShadow><cylinderGeometry args={[0.9, 1.3, 4.4, 20]} /><M c="#8a6a50" r={1} /></mesh>
    {[[-1.2, 4.8, 0, 1.4], [1.1, 5.0, 0.3, 1.2], [0, 5.4, -0.4, 1.0]].map(([x, y, z, w], i) => <mesh key={i} position={[x, y, z]} scale={[w, 0.6, w]} castShadow><sphereGeometry args={[1, 18, 12]} /><M c="#6f8a3a" r={1} /></mesh>)}
    {[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.8, 4.5, 0]} rotation={[0, 0, -sx * 0.7]} castShadow><cylinderGeometry args={[0.18, 0.28, 1.6, 10]} /><M c="#8a6a50" r={1} /></mesh>)}
  </group>
);
const Acac = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 1.3, 0]} rotation={[0, 0, 0.08]} castShadow><cylinderGeometry args={[0.1, 0.2, 2.6, 10]} /><M c="#4e3a28" r={1} /></mesh>
    {[[0, 2.75, 0, 2.0], [-1.0, 2.45, 0.2, 1.3], [1.1, 2.5, -0.2, 1.4]].map(([x, y, z, w], i) => <mesh key={i} position={[x, y, z]} scale={[w, 0.3, w * 0.8]} castShadow><sphereGeometry args={[1, 24, 14]} /><M c={i === 0 ? '#7f9a3a' : '#6f8a30'} r={1} /></mesh>)}
  </group>
);

export const Savanna = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#d8a867" roughness={1} /></mesh>
    {/* sol grande no horizonte */}
    <mesh position={[-14, 5.5, -34]}><circleGeometry args={[4.2, 40]} /><meshBasicMaterial color="#fff0b8" fog={false} /></mesh>
    <mesh position={[-14, 5.5, -34.2]}><circleGeometry args={[8, 40]} /><meshBasicMaterial color="#ffd98a" transparent opacity={0.35} fog={false} /></mesh>
    {/* colinas */}
    <mesh position={[-8, -0.9, -14]} scale={[10, 2.3, 5]} receiveShadow><sphereGeometry args={[1, 40, 24]} /><M c="#d1965a" r={1} /></mesh>
    <mesh position={[9, -1.1, -15]} scale={[9, 2.5, 5]} receiveShadow><sphereGeometry args={[1, 40, 24]} /><M c="#c98a50" r={1} /></mesh>
    <mesh position={[0, -1.4, -24]} scale={[22, 3.2, 6]}><sphereGeometry args={[1, 40, 24]} /><M c="#b97d4a" r={1} /></mesh>
    <Baobab p={[7.5, 0, -8]} s={1.1} />
    <Acac p={[-5.5, 0, -6]} s={1.5} />
    <Acac p={[-9, 0, -10]} s={1.1} />
    <Acac p={[11, 0, -12]} s={1.2} />
    <Termite p={[-3.2, 0, -3.4]} s={1.3} />
    <Termite p={[4.8, 0, -4.2]} s={1.0} />
    {[[-4, 0.15, 1.8], [-4.5, 0.12, 2.3], [5.6, 0.2, 1.2], [3.8, 0.12, -1.8], [-2.6, 0.14, -2.0], [6.4, 0.18, -2.6]].map((q, i) => <Rock key={i} p={q} s={[1.1 + rnd(i) * 0.9, 0.55 + rnd(i + 3) * 0.4, 0.9 + rnd(i + 7) * 0.7]} c={i % 2 ? '#8a7458' : '#9a8266'} />)}
    {Array.from({length: 46}).map((_, i) => {
      const x = (rnd(i + 1) - 0.5) * 22; const z = (rnd(i + 70) - 0.5) * 14 - 1;
      if (Math.abs(x) < 1.6 && z > -0.5 && z < 2.6) return null;
      return <Tuft key={i} p={[x, 0, z]} s={0.8 + rnd(i + 9) * 0.9} c={i % 3 ? '#c9b25a' : '#a89a48'} />;
    })}
    {[[-6.2, 0.4, -2.4], [8.2, 0.4, -5.6]].map((q, i) => <mesh key={i} position={q} scale={[1.1, 0.55, 1]} castShadow><sphereGeometry args={[0.8, 14, 10]} /><M c="#7a8a3a" r={1} /></mesh>)}
  </>
);

// ================= OBJETOS =================
export const Hoodie2 = ({p, ts}) => (
  <group position={[p[0], p[1] + 0.12 * Math.sin(ts * 2.4), p[2]]} rotation={[0, ts * 0.7, 0]}>
    <RBox size={[1.9, 1.9, 0.85]} r={0.34} color="#4d5b7a" position={[0, 1.15, 0]} rough={1} />
    <RBox size={[1.95, 0.22, 0.9]} r={0.09} color="#3d4963" position={[0, 0.28, 0]} rough={1} />
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 1.25, 1.35, 0]} rotation={[0, 0, s * 0.55]}>
        <RBox size={[0.7, 1.7, 0.65]} r={0.3} color="#475472" position={[0, -0.35, 0]} rough={1} />
        <RBox size={[0.72, 0.22, 0.68]} r={0.09} color="#3d4963" position={[0, -1.15, 0]} rough={1} />
      </group>
    ))}
    <RBox size={[1.15, 0.65, 0.5]} r={0.22} color="#42506d" position={[0, 0.72, 0.4]} rough={1} />
    <mesh position={[0, 0.76, 0.66]}><boxGeometry args={[0.7, 0.02, 0.02]} /><M c="#2c3650" /></mesh>
    {/* capuz */}
    <mesh position={[0, 2.25, -0.15]} scale={[1.0, 0.75, 0.85]} castShadow><sphereGeometry args={[0.72, 28, 20]} /><M c="#4d5b7a" r={1} /></mesh>
    <mesh position={[0, 2.12, 0.28]} scale={[0.78, 0.62, 0.5]}><sphereGeometry args={[0.55, 24, 18]} /><M c="#161c2c" r={1} /></mesh>
    <mesh position={[0, 1.95, 0.45]} rotation={[0, 0, 0]}><torusGeometry args={[0.5, 0.08, 10, 28]} /><M c="#5b6a8a" r={1} /></mesh>
    {[-1, 1].map((s) => (
      <group key={s}>
        <mesh position={[s * 0.28, 1.55, 0.5]}><cylinderGeometry args={[0.025, 0.025, 0.8, 8]} /><M c="#f1e6d2" r={0.8} /></mesh>
        <mesh position={[s * 0.28, 1.12, 0.5]}><cylinderGeometry args={[0.05, 0.05, 0.14, 10]} /><M c="#f1e6d2" r={0.4} m={0.3} /></mesh>
      </group>
    ))}
    <RBox size={[0.9, 0.12, 0.02]} r={0.02} color="#f2b705" position={[0, 1.55, 0.44]} rough={0.8} />
  </group>
);

export const Smoker2 = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[0.36, 0.36, 1.0, 24]} /><M c="#b9bfc9" m={0.75} r={0.3} /></mesh>
    {[0.2, 0.55, 0.9].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.365, 0.02, 8, 28]} /><M c="#8a909a" m={0.7} r={0.35} /></mesh>)}
    <mesh position={[0, 1.2, 0]} castShadow><coneGeometry args={[0.37, 0.45, 24]} /><M c="#a2a8b2" m={0.75} r={0.3} /></mesh>
    <mesh position={[0.18, 1.5, 0]} rotation={[0, 0, -0.9]} castShadow><cylinderGeometry args={[0.07, 0.11, 0.5, 14]} /><M c="#a2a8b2" m={0.75} r={0.3} /></mesh>
    <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.4, 0.4, 0.1, 24]} /><M c="#4a3a2c" r={0.8} /></mesh>
    {/* fole sanfonado */}
    <group position={[0.58, 0.55, 0]} rotation={[0, 0, -0.35]}>
      <RBox size={[0.06, 0.82, 0.62]} r={0.03} color="#7a4f2f" position={[0.38, 0, 0]} rough={0.7} />
      <RBox size={[0.06, 0.8, 0.6]} r={0.03} color="#7a4f2f" position={[-0.05, 0, 0]} rough={0.7} />
      {[0, 1, 2, 3, 4].map((i) => <RBox key={i} size={[0.1, 0.7 - Math.abs(i - 2) * 0.03, 0.55]} r={0.03} color={i % 2 ? '#5a3a22' : '#a56a3a'} position={[0.04 + i * 0.07, 0, 0]} rough={1} />)}
    </group>
  </group>
);
