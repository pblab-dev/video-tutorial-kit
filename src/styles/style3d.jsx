import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RBox, Env} from '../World.jsx';
import {FontGate} from '../fonts.jsx';
import {mk} from '../seo/theme.jsx';
import {Cyl, Ball, sag, Cable, House, Pole, Pylon, Battery, Inverter, Sun, Cloud, Tree, rnd, MONT} from '../solar/concept.jsx';

// ===== Miniatura do estilo "3D animado": diorama rico (argila / low-poly) =====
const winDay = (seed) => mk(`wd|${seed}`, 128, 256, (g, W, H) => {
  g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, W, H);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 4; c++) {
    const on = rnd(r * 9 + c * 31 + seed) < 0.25;
    g.fillStyle = on ? '#ffe9a8' : '#7fb4dc'; g.fillRect(12 + c * 28, 14 + r * 24, 18, 14);
  }
});
const Block = ({p, s, color, seed = 1, roof = '#e9e2d6'}) => (
  <group position={p}>
    <RBox size={s} r={0.06} color={color} position={[0, s[1] / 2, 0]} />
    <RBox size={[s[0] + 0.1, 0.1, s[2] + 0.1]} r={0.03} color={roof} position={[0, s[1] + 0.05, 0]} />
    <mesh position={[0, s[1] / 2, s[2] / 2 + 0.012]}>
      <planeGeometry args={[s[0] * 0.86, s[1] * 0.9]} />
      <meshBasicMaterial map={winDay(seed)} transparent toneMapped={false} />
    </mesh>
  </group>
);
const Pine = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <Cyl r={0.07} h={0.4} color="#7a4e2e" position={[0, 0.2, 0]} />
    {[0, 1, 2].map((i) => <Cyl key={i} r={0.01} r2={0.5 - i * 0.12} h={0.6} color={i % 2 ? '#2f8f55' : '#3aa766'} position={[0, 0.65 + i * 0.38, 0]} seg={10} />)}
  </group>
);
const Bush = ({p, s = 1, color = '#58bd62', flower}) => (
  <group position={p} scale={s}>
    <Ball r={0.26} color={color} position={[0, 0.2, 0]} /><Ball r={0.2} color={color} position={[0.2, 0.15, 0.05]} />
    {flower && [[-0.1, 0.4, 0.15], [0.12, 0.34, 0.2], [0.2, 0.3, -0.05]].map((q, i) => <Ball key={i} r={0.06} color={flower} position={q} />)}
  </group>
);
const Rock = ({p, s = 1, color = '#a5adb8'}) => <mesh position={p} scale={s} castShadow receiveShadow rotation={[0.3, 0.6, 0.2]}><dodecahedronGeometry args={[0.3, 0]} /><meshStandardMaterial color={color} roughness={0.9} flatShading /></mesh>;
const Car = ({p, color = '#e8503a', ry = 0}) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RBox size={[0.9, 0.25, 0.45]} r={0.08} color={color} position={[0, 0.22, 0]} />
    <RBox size={[0.5, 0.22, 0.4]} r={0.08} color="#dff1ff" position={[-0.03, 0.44, 0]} />
    {[[-0.28, 0.2], [0.28, 0.2], [-0.28, -0.2], [0.28, -0.2]].map((w, i) => <Cyl key={i} r={0.1} h={0.1} color="#2b2f3a" position={[w[0], 0.1, w[1]]} rotation={[Math.PI / 2, 0, 0]} />)}
    <Ball r={0.04} color="#fff4c2" emissive="#ffe08a" ei={1} position={[0.45, 0.24, 0.13]} /><Ball r={0.04} color="#fff4c2" emissive="#ffe08a" ei={1} position={[0.45, 0.24, -0.13]} />
  </group>
);
const Turbine = ({p, f, s = 1, ph = 0}) => (
  <group position={p} scale={s}>
    <Cyl r={0.06} r2={0.1} h={2.6} color="#f4f6fa" position={[0, 1.3, 0]} />
    <RBox size={[0.22, 0.2, 0.4]} r={0.06} color="#e4e8ef" position={[0, 2.65, 0]} />
    <group position={[0, 2.65, 0.25]} rotation={[0, 0, f * 0.06 + ph]}>
      <Ball r={0.1} color="#fff" />
      {[0, 1, 2].map((i) => <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}><RBox size={[0.1, 1.15, 0.03]} r={0.012} color="#fff" position={[0, 0.62, 0]} /></group>)}
    </group>
  </group>
);
const Person = ({p, ry = 0, shirt = '#ff8a3d', hat = '#ffd23f'}) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Cyl r={0.05} h={0.3} color="#3b4a7a" position={[-0.07, 0.15, 0]} /><Cyl r={0.05} h={0.3} color="#3b4a7a" position={[0.07, 0.15, 0]} />
    <Cyl r={0.14} r2={0.12} h={0.36} color={shirt} position={[0, 0.48, 0]} />
    <Ball r={0.12} color="#f1c6a0" position={[0, 0.8, 0]} />
    <Cyl r={0.14} h={0.04} color={hat} position={[0, 0.88, 0]} /><Cyl r={0.08} h={0.1} color={hat} position={[0, 0.93, 0]} />
  </group>
);
const Sheep = ({p, ry = 0}) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Ball r={0.2} color="#fff" sc={[1.25, 1, 1]} position={[0, 0.3, 0]} /><Ball r={0.12} color="#fff" position={[0.12, 0.42, 0]} />
    <Ball r={0.09} color="#3b3b44" position={[0.3, 0.34, 0]} />
    {[[-0.12, 0.08], [0.12, 0.08], [-0.12, -0.08], [0.12, -0.08]].map((l, i) => <Cyl key={i} r={0.025} h={0.16} color="#3b3b44" position={[l[0], 0.08, l[1]]} />)}
  </group>
);
const Fence = ({a, n = 6, step = 0.32, dir = [1, 0]}) => (
  <group>
    {Array.from({length: n}, (_, i) => <RBox key={i} size={[0.06, 0.32, 0.06]} r={0.02} color="#fff" position={[a[0] + dir[0] * i * step, 0.55, a[1] + dir[1] * i * step]} />)}
    <RBox size={[Math.abs(dir[0]) * (n - 1) * step + 0.06, 0.05, Math.abs(dir[1]) * (n - 1) * step + 0.06]} r={0.015} color="#fff" position={[a[0] + (dir[0] * (n - 1) * step) / 2, 0.6, a[1] + (dir[1] * (n - 1) * step) / 2]} />
  </group>
);
const Lamp = ({p}) => (
  <group position={p}>
    <Cyl r={0.03} h={0.9} color="#4a4f5c" position={[0, 0.45, 0]} /><Ball r={0.08} color="#fff4c2" emissive="#ffe08a" ei={1} position={[0, 0.95, 0]} />
  </group>
);
const Bird = ({p, f, ph = 0}) => {
  const w = Math.sin(f * 0.35 + ph) * 0.5;
  return <group position={p}><RBox size={[0.35, 0.03, 0.12]} r={0.01} color="#2b2f3a" rotation={[0, 0, w]} position={[-0.17, 0, 0]} cast={false} /><RBox size={[0.35, 0.03, 0.12]} r={0.01} color="#2b2f3a" rotation={[0, 0, -w]} position={[0.17, 0, 0]} cast={false} /></group>;
};
const Duck = ({p}) => <group position={p}><Ball r={0.1} color="#fff" sc={[1.2, 0.8, 1]} /><Ball r={0.06} color="#fff" position={[0.09, 0.09, 0]} /><RBox size={[0.06, 0.02, 0.04]} r={0.01} color="#ff9a2b" position={[0.16, 0.09, 0]} /></group>;

const Rig = ({pos, target}) => {
  const {camera} = useThree();
  camera.position.set(...pos); camera.lookAt(...target); camera.updateMatrixWorld();
  return null;
};

const Diorama = ({f}) => {
  const carX = -3.2 + ((f * 0.045) % 7.4);
  return (
    <>
      {/* ilha flutuante */}
      <RBox size={[6.9, 0.9, 9.1]} r={0.2} color="#8a6240" position={[0, -0.75, 0]} rough={1} />
      <RBox size={[5.2, 0.8, 7.2]} r={0.2} color="#6f4e33" position={[0, -1.5, 0]} rough={1} />
      <RBox size={[3.0, 0.7, 4.6]} r={0.2} color="#5a3f29" position={[0, -2.2, 0]} rough={1} />
      <RBox size={[7.2, 0.5, 9.4]} r={0.2} color="#7fcb5a" position={[0, 0.0, 0]} />
      <RBox size={[7.3, 0.28, 9.5]} r={0.12} color="#9a6b43" position={[0, -0.3, 0]} />
      {/* cidade ao fundo */}
      <Block p={[-2.5, 0.25, -4.0]} s={[1.1, 2.4, 0.9]} color="#f2a65a" seed={1} />
      <Block p={[-1.2, 0.25, -4.1]} s={[1.0, 3.3, 0.9]} color="#7ecbe6" seed={5} />
      <Block p={[0.05, 0.25, -3.9]} s={[1.2, 2.0, 1.0]} color="#f27b8a" seed={9} />
      <Block p={[1.35, 0.25, -4.1]} s={[1.0, 2.9, 0.9]} color="#b79af0" seed={13} />
      <Block p={[2.55, 0.25, -3.9]} s={[1.05, 1.8, 0.9]} color="#f5d36a" seed={17} />
      {/* estrada */}
      <RBox size={[7.2, 0.06, 0.95]} r={0.02} color="#4a4f5c" position={[0, 0.27, -2.45]} rough={0.9} />
      {[-3, -2, -1, 0, 1, 2, 3].map((x) => <RBox key={x} size={[0.4, 0.02, 0.07]} r={0.01} color="#fff" position={[x, 0.31, -2.45]} cast={false} />)}
      <Car p={[carX, 0.3, -2.25]} color="#e8503a" />
      <Car p={[-carX * 0.9, 0.3, -2.65]} color="#3a8fe8" ry={Math.PI} />
      {[-2.6, 0.3, 2.9].map((x) => <Lamp key={x} p={[x, 0.3, -1.85]} />)}
      {/* rede elétrica */}
      <Pylon p={[3.0, 0.3, -1.3]} h={2.8} />
      <Pole p={[0.9, 0.3, -1.45]} h={2.0} color="#8a6a48" />
      <Cable pts={sag([1.0, 1.95, -1.45], [2.85, 2.55, -1.3], 0.3)} />
      <Cable pts={sag([0.9, 1.9, -1.45], [-0.95, 1.65, 0.3], 0.2)} />
      {/* turbinas */}
      <Turbine p={[-2.6, 0.3, -0.8]} f={f} s={0.95} />
      <Turbine p={[-2.3, 0.3, -0.1]} f={f} s={0.75} ph={1.1} />
      {/* casa herói */}
      <House p={[-1.2, 0.3, 0.7]} s={1.35} ry={0.18} lit={false} />
      <Rock p={[-2.55, 0.4, 1.9]} s={0.8} />
      <Fence a={[-2.3, 2.0]} n={6} />
      <RBox size={[0.4, 0.04, 0.9]} r={0.02} color="#e8dcc0" position={[-1.2, 0.3, 1.9]} />
      <Inverter p={[0.45, 0.3, 0.45]} /><Battery p={[0.55, 0.3, 1.4]} lvl={3} />
      <Cable pts={sag([-0.3, 0.75, 0.9], [0.4, 0.7, 0.55], 0.1)} color="#19f0ff" emissive="#19f0ff" ei={1} />
      <Cable pts={[[0.5, 0.7, 0.9], [0.5, 0.9, 1.35]]} color="#19f0ff" emissive="#19f0ff" ei={1} />
      {/* caixa de correio + jardim */}
      <group position={[-2.3, 0.3, 2.35]}><Cyl r={0.03} h={0.5} color="#7a4e2e" position={[0, 0.25, 0]} /><RBox size={[0.22, 0.16, 0.16]} r={0.04} color="#e8503a" position={[0, 0.55, 0]} /></group>
      <Bush p={[-2.6, 0.3, 0.3]} flower="#ff6fa8" /><Bush p={[-0.2, 0.3, 1.75]} s={0.8} flower="#ffd23f" /><Bush p={[-2.3, 0.3, 1.1]} s={0.9} color="#4aa853" />
      {/* árvores */}
      <Tree p={[-3.0, 0.3, 3.1]} s={1.5} /><Tree p={[-2.2, 0.3, 3.6]} s={1.1} color="#6bc15a" />
      <Pine p={[3.0, 0.3, 0.4]} s={1.4} /><Pine p={[2.5, 0.3, 1.2]} s={1.05} /><Pine p={[3.1, 0.3, 1.6]} s={1.2} />
      <Tree p={[1.2, 0.3, -0.9]} s={1.0} color="#78c850" />
      {/* lago com patos */}
      <Cyl r={1.15} h={0.12} color="#4fb4ef" position={[1.5, 0.3, 3.1]} seg={36} rough={0.15} scale={[1.2, 1, 1]} />
      <Cyl r={0.3} h={0.04} color="#4aa853" position={[1.9, 0.38, 3.3]} seg={14} cast={false} />
      <Duck p={[1.2, 0.42, 3.0]} /><Duck p={[1.75, 0.42, 2.7]} />
      <Rock p={[0.2, 0.4, 3.0]} s={0.7} /><Rock p={[3.0, 0.4, 3.4]} s={0.9} color="#b8bfc9" />
      {/* gente e animais */}
      <Person p={[-0.4, 0.3, 2.35]} ry={0.6} />
      <Person p={[0.9, 0.3, 2.0]} ry={-0.8} shirt="#3aa766" hat="#e8503a" />
      <Sheep p={[-1.9, 0.3, 2.7]} ry={0.5} /><Sheep p={[-1.2, 0.3, 3.4]} ry={-0.3} />
      {/* céu */}
      <Sun p={[2.4, 6.6, -9]} r={0.9} />
      <Cloud p={[-2.5 + (f * 0.003) % 1, 6.6, -6]} s={1.3} /><Cloud p={[1.8 + (f * 0.004) % 1, 4.9, -7]} s={1.0} /><Cloud p={[-3.4, 3.8, -4.5]} s={0.8} />
      <Bird p={[-1.4, 5.3, -3]} f={f} /><Bird p={[-0.6, 5.7, -3.5]} f={f} ph={1.7} /><Bird p={[0.3, 5.0, -3]} f={f} ph={3.1} />
    </>
  );
};

export const Style3D = ({f: f0}) => {
  const frame = useCurrentFrame();
  const f = f0 ?? frame;
  const {width, height} = useVideoConfig();
  const cam = {pos: [0, 12.4, 16.2], target: [0, 0.2, 0.0], fov: 46};
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#5fb8ef 0%,#9bd5f6 45%,#d9f0fb 100%)'}}>
      <FontGate>
        <ThreeCanvas width={width} height={height} shadows camera={{fov: cam.fov, position: cam.pos, near: 0.5, far: 200}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping}}>
          <Rig pos={cam.pos} target={cam.target} />
          <Env intensity={0.45} />
          <hemisphereLight args={['#ffffff', '#e8d9a8', 0.8]} />
          <directionalLight position={[5, 12, 8]} intensity={2.4} color="#fff2dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={1} shadow-camera-far={45} shadow-bias={-0.0004} shadow-normalBias={0.03} />
          <Diorama f={f} />
        </ThreeCanvas>
      </FontGate>
    </AbsoluteFill>
  );
};
