import React, {useMemo, createContext, useContext} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RBox, Env} from '../World.jsx';
import {FontGate} from '../fonts.jsx';
import {mk, pillTex} from '../seo/theme.jsx';

// ===== BLOCKOUTS de conceito: tema energia solar (on-grid x off-grid) =====
const MONT = 'Montserrat, sans-serif';
const QCtx = createContext(new THREE.Quaternion());
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- primitivas ----------
const Cyl = ({r = 0.1, r2, h = 1, color = '#ccc', seg = 28, rough = 0.7, metal = 0, emissive, ei = 0, op = 1, cast = true, ...p}) => (
  <mesh castShadow={cast} receiveShadow {...p}>
    <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
    <meshStandardMaterial color={color} roughness={rough} metalness={metal} emissive={emissive || '#000'} emissiveIntensity={ei} transparent={op < 1} opacity={op} depthWrite={op >= 1} />
  </mesh>
);
const Ball = ({r = 0.5, color = '#fff', rough = 0.7, emissive, ei = 0, sc = [1, 1, 1], op = 1, ...p}) => (
  <mesh castShadow receiveShadow scale={sc} {...p}>
    <sphereGeometry args={[r, 32, 24]} />
    <meshStandardMaterial color={color} roughness={rough} emissive={emissive || '#000'} emissiveIntensity={ei} transparent={op < 1} opacity={op} />
  </mesh>
);
const Pill = ({text, p, w = 3, dot = '#ffb020', bg = '#fff', fg = '#111'}) => {
  const q = useContext(QCtx);
  const tex = pillTex(text, {bg, fg, dot, w: 640});
  return (
    <mesh position={p} quaternion={q} renderOrder={20}>
      <planeGeometry args={[w, w / 5]} />
      <meshBasicMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </mesh>
  );
};
const sag = (a, b, d = 0.25) => [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - d, (a[2] + b[2]) / 2], b];
const Cable = ({pts, r = 0.03, color = '#2a2a32', emissive, ei = 0}) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 40, r, 8), [JSON.stringify(pts), r]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={0.5} emissive={emissive || '#000'} emissiveIntensity={ei} />
    </mesh>
  );
};
const gridTex = () => mk('solargrid', 384, 256, (g, W, H) => {
  g.fillStyle = '#15347c'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#7fa8ff'; g.lineWidth = 3;
  for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo((i * W) / 6, 0); g.lineTo((i * W) / 6, H); g.stroke(); }
  for (let j = 0; j <= 4; j++) { g.beginPath(); g.moveTo(0, (j * H) / 4); g.lineTo(W, (j * H) / 4); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(0, H); g.lineTo(W * 0.5, 0); g.lineTo(W * 0.75, 0); g.lineTo(W * 0.25, H); g.fill();
});
const Panel = ({p = [0, 0, 0], rot = [0, 0, 0], w = 0.8, h = 0.8}) => (
  <group position={p} rotation={rot}>
    <RBox size={[w, 0.05, h]} r={0.02} color="#e4e7ee" cast />
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w - 0.07, h - 0.07]} />
      <meshStandardMaterial map={gridTex()} roughness={0.25} metalness={0.35} />
    </mesh>
  </group>
);
const roofGeo = (() => {
  const s = new THREE.Shape(); s.moveTo(-0.9, 0); s.lineTo(0.9, 0); s.lineTo(0, 0.6); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: 1.9, bevelEnabled: false}); return g;
})();
const House = ({p = [0, 0, 0], ry = 0, s = 1, wall = '#f4e9d3', roof = '#c8553d', lit = false, panels = true, glow = '#ffd98a'}) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <RBox size={[1.6, 1, 1.4]} r={0.06} color={wall} position={[0, 0.5, 0]} />
    <mesh geometry={roofGeo} position={[-0.95, 1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={roof} roughness={0.8} />
    </mesh>
    {[-0.45, 0.45].map((x) => (
      <RBox key={x} size={[0.3, 0.3, 0.05]} r={0.03} color={lit ? glow : '#51607f'} emissive={lit ? glow : undefined} emissiveIntensity={lit ? 1.4 : 0} position={[x, 0.62, 0.71]} cast={false} />
    ))}
    <RBox size={[0.3, 0.55, 0.05]} r={0.03} color="#7a4a2b" position={[0, 0.28, 0.71]} cast={false} />
    {panels && [-0.4, 0.4].map((x) => <Panel key={x} p={[x, 1.33, 0.46]} rot={[0.59, 0, 0]} w={0.72} h={0.95} />)}
    {lit && <pointLight position={[0, 0.8, 1.6]} intensity={2} color={glow} distance={4} />}
  </group>
);
const Pole = ({p = [0, 0, 0], h = 2.4, color = '#8a6a48'}) => (
  <group position={p}>
    <Cyl r={0.07} h={h} color={color} position={[0, h / 2, 0]} />
    <RBox size={[1, 0.07, 0.07]} r={0.02} color={color} position={[0, h - 0.2, 0]} />
    {[-0.4, 0.4].map((x) => <Cyl key={x} r={0.04} h={0.14} color="#eee" position={[x, h - 0.1, 0]} />)}
  </group>
);
const Pylon = ({p = [0, 0, 0], h = 3.4, color = '#aeb6c4'}) => (
  <group position={p}>
    <Cyl r={0.05} r2={0.25} h={h} color={color} position={[0, h / 2, 0]} rough={0.5} metal={0.3} seg={4} rotation={[0, Math.PI / 4, 0]} />
    {[0.62, 0.82].map((k) => <RBox key={k} size={[1.5 - 0.9 * k, 0.06, 0.06]} r={0.02} color={color} position={[0, h * k, 0]} />)}
    <RBox size={[0.06, 0.06, 0]} r={0.01} color={color} />
  </group>
);
const Battery = ({p = [0, 0, 0], lvl = 3, ei = 1.2}) => (
  <group position={p}>
    <RBox size={[0.85, 1.1, 0.6]} r={0.08} color="#2fbf71" position={[0, 0.55, 0]} />
    <Cyl r={0.09} h={0.12} color="#d8dde6" position={[-0.2, 1.15, 0]} /><Cyl r={0.09} h={0.12} color="#d8dde6" position={[0.2, 1.15, 0]} />
    <RBox size={[0.6, 0.8, 0.03]} r={0.02} color="#17301f" position={[0, 0.55, 0.31]} cast={false} />
    {[0, 1, 2, 3].map((i) => (
      <RBox key={i} size={[0.44, 0.13, 0.03]} r={0.02} color={i < lvl ? '#7dffa8' : '#2b3d31'} emissive={i < lvl ? '#4dff88' : undefined} emissiveIntensity={i < lvl ? ei : 0} position={[0, 0.3 + i * 0.18, 0.33]} cast={false} />
    ))}
  </group>
);
const Inverter = ({p = [0, 0, 0]}) => (
  <group position={p}>
    <RBox size={[0.55, 0.75, 0.25]} r={0.05} color="#f2f4f8" position={[0, 0.38, 0]} />
    <RBox size={[0.36, 0.2, 0.03]} r={0.02} color="#19f0ff" emissive="#19f0ff" emissiveIntensity={1} position={[0, 0.55, 0.14]} cast={false} />
    {[0, 1, 2].map((i) => <RBox key={i} size={[0.36, 0.03, 0.03]} r={0.01} color="#9aa3b3" position={[0, 0.3 - i * 0.07, 0.14]} cast={false} />)}
  </group>
);
const Sun = ({p = [0, 6, -6], r = 0.9, rays = 14}) => (
  <group position={p}>
    <Ball r={r} color="#ffd23f" emissive="#ffb300" ei={1.6} />
    {Array.from({length: rays}, (_, i) => {
      const a = (i / rays) * Math.PI * 2;
      return <RBox key={i} size={[0.14, 0.5, 0.14]} r={0.05} color="#ffd23f" emissive="#ffb300" emissiveIntensity={1} cast={false} position={[Math.cos(a) * (r + 0.55), Math.sin(a) * (r + 0.55), 0]} rotation={[0, 0, a - Math.PI / 2]} />;
    })}
  </group>
);
const Cloud = ({p, s = 1, color = '#fff'}) => (
  <group position={p} scale={s}>
    <Ball r={0.5} color={color} position={[0, 0, 0]} /><Ball r={0.4} color={color} position={[0.55, -0.1, 0]} /><Ball r={0.38} color={color} position={[-0.5, -0.12, 0]} /><Ball r={0.33} color={color} position={[0.1, 0.3, 0.05]} />
  </group>
);
const Tree = ({p, s = 1, color = '#4fb35e'}) => (
  <group position={p} scale={s}>
    <Cyl r={0.08} h={0.5} color="#8a5a35" position={[0, 0.25, 0]} />
    <Ball r={0.38} color={color} position={[0, 0.75, 0]} /><Ball r={0.27} color={color} position={[0.1, 1.1, 0]} />
  </group>
);
const winTex = (lit) => mk(`win|${lit}`, 128, 256, (g, W, H) => {
  g.fillStyle = '#0d1430'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 4; c++) {
    const on = lit && rnd(r * 9 + c * 31 + 5) < 0.18;
    g.fillStyle = on ? '#ffd98a' : '#2a3a78'; g.fillRect(10 + c * 29, 10 + r * 20, 18, 12);
  }
});
const Building = ({p, s = [1, 2, 1], lit = false, color = '#1a2350'}) => (
  <group position={p}>
    <RBox size={s} r={0.05} color={color} position={[0, s[1] / 2, 0]} rough={0.5} />
    <mesh position={[0, s[1] / 2, s[2] / 2 + 0.011]}>
      <planeGeometry args={[s[0] * 0.9, s[1] * 0.92]} />
      <meshBasicMaterial map={winTex(lit)} toneMapped={false} />
    </mesh>
  </group>
);

// ---------- cena base ----------
const Rig = ({pos, target}) => {
  const {camera} = useThree();
  camera.position.set(...pos); camera.lookAt(...target); camera.updateMatrixWorld();
  return null;
};
const Stage = ({cam, L, children, label, sub}) => {
  const {width, height} = useVideoConfig();
  const q = useMemo(() => {
    const c = new THREE.PerspectiveCamera(); c.position.set(...cam.pos); c.lookAt(...cam.target); c.updateMatrixWorld(); return c.quaternion.clone();
  }, [cam.pos.join(), cam.target.join()]);
  return (
    <AbsoluteFill style={{background: L.bg}}>
      <FontGate>
        <QCtx.Provider value={q}>
          <ThreeCanvas width={width} height={height} shadows camera={{fov: cam.fov || 36, position: cam.pos, near: 0.5, far: 200}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: L.exposure || 1}}>
            <Rig pos={cam.pos} target={cam.target} />
            <color attach="background" args={[L.bg]} />
            {L.fog && <fog attach="fog" args={[L.fog, 25, 70]} />}
            <Env intensity={L.env ?? 0.4} />
            <hemisphereLight args={[L.sky || '#fff', L.gnd || '#d8c8a0', L.hemi ?? 0.8]} />
            <directionalLight position={L.sunPos || [6, 12, 7]} intensity={L.sunI ?? 2.2} color={L.sunCol || '#fff0dc'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-near={1} shadow-camera-far={45} shadow-bias={-0.0004} shadow-normalBias={0.03} />
            {children}
          </ThreeCanvas>
        </QCtx.Provider>
        <div style={{position: 'absolute', left: 0, right: 0, top: 36, textAlign: 'center', fontFamily: MONT, color: L.txt || '#1d1d22'}}>
          <div style={{display: 'inline-block', padding: '10px 22px', borderRadius: 40, background: 'rgba(255,255,255,.92)', color: '#111', fontWeight: 800, fontSize: 24, boxShadow: '0 2px 10px rgba(0,0,0,.25)'}}>{label}</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center', fontFamily: MONT, fontWeight: 700, fontSize: 21, color: L.txt2 || '#fff', textShadow: '0 2px 6px rgba(0,0,0,.55)', padding: '0 40px'}}>{sub}</div>
      </FontGate>
    </AbsoluteFill>
  );
};

// ========== DIREÇÃO A: Ilha × Continente ==========
const Sea = () => <RBox size={[16, 0.2, 18]} r={0.05} color="#52b4ee" rough={0.18} position={[0, -0.5, 0]} />;
const SceneA = ({night}) => {
  const lit = night;
  return (
    <>
      <Sea />
      {/* continente */}
      <RBox size={[6.6, 0.8, 5.2]} r={0.2} color="#9bd36b" position={[0, -0.1, -3.4]} />
      <House p={[-1.4, 0.3, -3.3]} ry={0.15} lit={false} />
      <Pole p={[0.8, 0.3, -2.1]} /><Pylon p={[2.2, 0.3, -3.6]} />
      <Cable pts={sag([-1.25, 1.2, -2.8], [0.5, 2.5, -2.1])} /><Cable pts={sag([1.1, 2.5, -2.1], [2.05, 3.4, -3.6], 0.35)} />
      {[[-2.4, 1.2, 1], [-0.6, 1.9, 1], [0.8, 1.5, 1.1], [1.9, 2.3, 1]].map((b, i) => <Building key={i} p={[b[0], 0.3, -5.4]} s={[b[2], b[1] + 0.2, 1]} lit={false} color={night ? '#3a4770' : '#d9cfc0'} />)}
      {/* ilha */}
      <Cyl r={2.7} h={0.8} color="#e8d29a" position={[0, -0.1, 3.3]} seg={48} />
      <Cyl r={2.5} h={0.12} color="#8fcf6a" position={[0, 0.36, 3.3]} seg={48} />
      <House p={[-0.9, 0.42, 3.1]} ry={-0.1} lit={lit} />
      <Inverter p={[0.9, 0.42, 3.9]} /><Battery p={[1.6, 0.42, 3.0]} lvl={night ? 3 : 4} />
      <Cable pts={sag([-0.3, 1.7, 3.2], [0.9, 0.9, 3.9], 0.3)} /><Cable pts={sag([1.1, 0.7, 3.9], [1.6, 0.7, 3.3], 0.1)} />
      <Tree p={[-1.8, 0.42, 4.3]} /><Tree p={[-1.4, 0.42, 4.8]} s={0.7} />
      {night ? <Ball r={0.7} color="#f4f1e0" emissive="#cfd8ff" ei={0.8} position={[1.5, 6, -6]} /> : <Sun p={[1.3, 6.4, -6]} />}
      {!night && <><Cloud p={[-2.6, 5.4, -4]} s={0.8} /><Cloud p={[3.2, 4.5, -2]} s={0.6} /></>}
      <Pill text="ON-GRID · ligado à rede" p={[-0.9, 3.6, -3.2]} dot="#ff9a3d" w={3.6} />
      <Pill text="OFF-GRID · ilha de energia" p={[-0.2, 3.5, 3.1]} dot="#2fbf71" w={3.6} />
      {night && <Pill text="APAGÃO" p={[0.6, 1.2, -1.2]} dot="#ff3b3b" w={2.4} />}
    </>
  );
};

// ========== DIREÇÃO B: Cidade em apagão (noite neon) ==========
const SceneB = ({shot}) => {
  const bl = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
    if (r === 4 && c === 2) continue;
    const i = r * 5 + c;
    bl.push(<Building key={i} p={[(c - 2) * 1.9, 0.1, -r * 1.9 - 0.5]} s={[1.2, 1 + rnd(i) * 3, 1.1]} lit={false} color="#26336b" />);
  }
  if (shot === 1) {
    return (
      <>
        <RBox size={[14, 0.2, 18]} r={0.05} color="#0b1030" position={[0, 0, -4]} rough={0.4} metal={0.3} />
        {bl}
        {/* casa herói acesa */}
        <House p={[0, 0.1, 2.2]} s={1.15} lit glow="#ffe0a0" />
        <Battery p={[1.5, 0.1, 2.3]} />
        <pointLight position={[0, 3, 3.5]} intensity={40} color="#19f0ff" distance={11} />
        <Pill text="APAGÃO NO BAIRRO" p={[0, 6.3, 0]} dot="#ff3b3b" w={3.8} />
        <Pill text="Só uma casa segue acesa" p={[0, 3.9, 2.4]} dot="#19f0ff" w={3.8} />
      </>
    );
  }
  // hero: cabo cortado
  return (
    <>
      <RBox size={[12, 0.2, 12]} r={0.05} color="#0b1030" position={[0, 0, 0]} rough={0.4} metal={0.3} />
      <House p={[-0.6, 0.1, 0.5]} s={1.4} lit glow="#ffe0a0" />
      <Battery p={[1.9, 0.1, 0.8]} /><Inverter p={[1.9, 0.1, -0.3]} />
      <Pole p={[-3, 0.1, -1.4]} h={3} color="#4a5380" />
      <Cable pts={sag([-3.3, 2.75, -1.4], [-4.8, 3.2, -3], 0.3)} />
      <Cable pts={[[-2.7, 2.75, -1.4], [-2.3, 2.4, -1.2], [-2.1, 1.7, -0.8]]} color="#ff7a45" emissive="#ff7a45" ei={0.8} />
      {[[-2.1, 1.6, -0.8], [-2.0, 1.5, -0.7], [-2.3, 1.5, -0.8], [-1.9, 1.7, -0.9]].map((q, i) => <Ball key={i} r={0.06} color="#ffe27a" emissive="#ffd23f" ei={4} position={q} />)}
      <Cable pts={sag([-1.0, 1.9, 0.5], [1.7, 0.9, -0.3], 0.3)} color="#19f0ff" emissive="#19f0ff" ei={1.2} />
      <Cable pts={[[2.0, 0.9, -0.3], [2.0, 0.9, 0.5]]} color="#19f0ff" emissive="#19f0ff" ei={1.2} />
      <pointLight position={[0, 3, 3]} intensity={40} color="#19f0ff" distance={11} />
      <Pill text="Rede caiu" p={[-1.9, 3.9, -1.4]} dot="#ff3b3b" w={2.2} />
      <Pill text="Bateria assume a casa" p={[0.9, 4.0, 1.6]} dot="#19f0ff" w={3.2} />
    </>
  );
};

// ========== DIREÇÃO C: energia como água ==========
const WaterTower = ({p}) => (
  <group position={p}>
    {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map((l, i) => <Cyl key={i} r={0.06} h={2.6} color="#9aa7b8" position={[l[0], 1.3, l[1]]} />)}
    <Cyl r={0.9} h={1.2} color="#4aa8ff" position={[0, 3.2, 0]} rough={0.4} />
    <Cyl r={0.05} r2={1} h={0.6} color="#2d7fd0" position={[0, 4.1, 0]} />
  </group>
);
const Tank = ({p, lvl = 0.62, h = 2.2, r = 0.7}) => (
  <group position={p}>
    <Cyl r={r} h={h} color="#dff3ff" op={0.28} rough={0.1} position={[0, h / 2, 0]} cast={false} />
    <Cyl r={r - 0.04} h={h * lvl} color="#3b9cff" op={0.9} rough={0.1} position={[0, (h * lvl) / 2, 0]} cast={false} />
    <Cyl r={r + 0.03} h={0.1} color="#e4e7ee" position={[0, 0.05, 0]} /><Cyl r={r + 0.03} h={0.1} color="#e4e7ee" position={[0, h, 0]} />
    {[0.25, 0.5, 0.75].map((k) => <RBox key={k} size={[0.2, 0.04, 0.04]} r={0.01} color="#fff" position={[r + 0.02, h * k, 0]} cast={false} />)}
  </group>
);
const Funnel = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <Cyl r={0.15} r2={0.75} h={0.7} color="#ffd23f" position={[0, 0.35, 0]} op={0.95} />
  </group>
);
const Drops = ({p, n = 6}) => (
  <group position={p}>{Array.from({length: n}, (_, i) => <Ball key={i} r={0.08} sc={[1, 1.5, 1]} color="#6cb8ff" position={[(rnd(i) - 0.5) * 0.5, 1.4 - i * 0.22, (rnd(i + 9) - 0.5) * 0.4]} />)}</group>
);
const SceneC = ({shot}) => {
  if (shot === 1) {
    return (
      <>
        <RBox size={[7.4, 0.5, 11]} r={0.2} color="#bfe7c0" position={[0, -0.25, 0]} />
        <RBox size={[7.4, 0.04, 0.9]} r={0.01} color="#b8a98a" position={[0, 0.02, 0]} />
        {/* rede pública (topo) */}
        <WaterTower p={[-1.9, 0, -3.8]} />
        <Cyl r={0.12} h={3.4} color="#7f8da0" position={[-0.7, 0.18, -2.1]} rotation={[0, 0, Math.PI / 2]} />
        <House p={[-0.3, 0, -1.7]} ry={0.1} panels={false} />
        <Funnel p={[-0.3, 1.75, -1.7]} s={0.6} />
        <Cyl r={0.12} h={1.7} color="#7f8da0" position={[-1.9, 0.12, -2.9]} rotation={[Math.PI / 2, 0, 0]} />
        {/* cisterna própria (base) */}
        <House p={[-0.9, 0, 3.0]} ry={-0.1} panels={false} />
        <Funnel p={[-0.9, 1.75, 3.0]} s={0.6} />
        <Tank p={[1.7, 0, 3.4]} lvl={0.6} h={1.8} r={0.6} />
        <Cyl r={0.08} h={1.4} color="#7f8da0" position={[0.9, 0.35, 3.3]} rotation={[0, 0, Math.PI / 2]} />
        <Tree p={[-2.5, 0, 4.4]} /><Tree p={[2.7, 0, -3.2]} s={0.8} />
        <Pill text="ON-GRID = caixa d'água da cidade" p={[-0.3, 3.5, -1.9]} dot="#ff9a3d" w={4.3} />
        <Pill text="OFF-GRID = sua cisterna" p={[0.3, 3.6, 3.1]} dot="#2fbf71" w={3.6} />
        <Sun p={[2.2, 6.5, -4]} r={0.7} />
      </>
    );
  }
  return (
    <>
      <RBox size={[7, 0.5, 8]} r={0.2} color="#bfe7c0" position={[0, -0.25, 0]} />
      <Sun p={[-1.4, 6.6, -2]} r={0.8} />
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => <RBox key={i} size={[0.08, 1.4, 0.08]} r={0.03} color="#ffd23f" emissive="#ffb300" emissiveIntensity={0.8} cast={false} position={[x * 0.5 - 0.4, 4.9, -1.2]} rotation={[0, 0, 0.25]} />)}
      <Funnel p={[0, 3.55, 0]} s={1.5} />
      <Drops p={[0, 3.05, 0]} n={5} />
      <Tank p={[0, 0, 0]} lvl={0.62} h={2.6} r={0.9} />
      <Cyl r={0.07} h={1.2} color="#7f8da0" position={[1.35, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} />
      <Cyl r={0.05} h={0.5} color="#7f8da0" position={[1.95, 0.7, 0]} />
      <Ball r={0.34} color="#fff6c8" emissive="#ffd23f" ei={1.2} position={[2.3, 1.3, 0]} />
      <Pill text="Bateria = cisterna de energia" p={[0, 4.6, 1.5]} dot="#2fbf71" w={4.3} />
      <Pill text="Sol enche · você gasta" p={[0, 0.9, 2.4]} dot="#4aa8ff" w={3.4} />
    </>
  );
};

// ========== DIREÇÃO D: tabuleiro / trilhos de decisão ==========
const Rail = ({a, b, w = 0.3, color = '#f4b860'}) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz);
  return <RBox size={[w, 0.08, L]} r={0.03} color={color} position={[(a[0] + b[0]) / 2, 0.27, (a[1] + b[1]) / 2]} rotation={[0, Math.atan2(dx, dz), 0]} />;
};
const Mount = ({p, r = 0.9, h = 1.5, color = '#8fa2b8'}) => (
  <group position={p}><Cyl r={0.05} r2={r} h={h} color={color} seg={6} position={[0, h / 2, 0]} /><Cyl r={0.03} r2={r * 0.35} h={h * 0.3} color="#fff" seg={6} position={[0, h * 0.85, 0]} /></group>
);
const SceneD = ({shot}) => {
  if (shot === 1) {
    return (
      <>
        <RBox size={[6.6, 0.3, 11]} r={0.15} color="#f4ecdc" position={[0, 0.1, 0]} />
        <RBox size={[6.9, 0.2, 11.3]} r={0.15} color="#3b4a7a" position={[0, -0.12, 0]} />
        <Rail a={[0, 4]} b={[0, 0.6]} /><Rail a={[0, 0.6]} b={[-1.6, -1.2]} /><Rail a={[0, 0.6]} b={[1.6, -1.2]} />
        <Rail a={[-1.6, -1.2]} b={[-1.6, -3.0]} /><Rail a={[1.6, -1.2]} b={[1.6, -3.0]} />
        <RBox size={[1.8, 0.1, 1.2]} r={0.05} color="#ffd23f" position={[0, 0.3, 4.4]} />
        <House p={[0, 0.3, 4.3]} s={0.55} panels />
        <Pill text="VOCÊ" p={[0, 1.8, 4.3]} dot="#ffd23f" w={1.8} />
        {/* poste da decisão */}
        <Cyl r={0.05} h={1.4} color="#7a4a2b" position={[0, 0.9, 0.6]} />
        <Pill text="Tem rede por perto?" p={[0, 2.2, 0.6]} dot="#ff9a3d" w={3.6} />
        {/* destino esquerdo: cidade */}
        {[[-2.3, 1.3], [-1.6, 1.9], [-0.9, 1.1]].map((b, i) => <Building key={i} p={[b[0], 0.25, -3.9 - i * 0.2]} s={[0.6, b[1], 0.6]} color="#c7d3ea" />)}
        <Pylon p={[-2.7, 0.25, -3.0]} h={2} />
        <Pill text="ON-GRID" p={[-1.6, 3.5, -3.4]} dot="#ff9a3d" w={2.4} />
        {/* destino direito: sem rede */}
        <Mount p={[2.5, 0.25, -4.4]} /><Mount p={[0.9, 0.25, -4.6]} r={0.7} h={1.1} />
        <House p={[1.6, 0.25, -3.5]} s={0.75} lit panels />
        <Tree p={[2.5, 0.25, -2.7]} s={0.7} />
        <Pill text="OFF-GRID" p={[1.6, 3.1, -3.5]} dot="#2fbf71" w={2.4} />
        <Sun p={[-0.4, 6.2, -5.5]} r={0.7} />
      </>
    );
  }
  const cards = [
    ['Casa na cidade', 'ON-GRID', '#ff9a3d'], ['Comércio (consome de dia)', 'ON-GRID', '#ff9a3d'],
    ['Sítio sem rede', 'OFF-GRID', '#2fbf71'], ['Quer backup?', 'HÍBRIDO', '#b07cff'],
  ];
  return (
    <>
      <RBox size={[6.6, 0.3, 10]} r={0.15} color="#f4ecdc" position={[0, 0.1, 0]} />
      <RBox size={[6.9, 0.2, 10.3]} r={0.15} color="#3b4a7a" position={[0, -0.12, 0]} />
      {cards.map((c, i) => {
        const x = (i % 2 ? 1 : -1) * 1.5, z = -2.6 + Math.floor(i / 2) * 3.6;
        return (
          <group key={i} position={[x, 0.3, z]} rotation={[0, (i % 2 ? -1 : 1) * 0.06, 0]}>
            <RBox size={[2.6, 0.12, 3.0]} r={0.08} color="#fff" position={[0, 0.06, 0]} />
            <RBox size={[2.6, 0.13, 0.5]} r={0.05} color={c[2]} position={[0, 0.07, -1.25]} />
            {i === 0 && <House p={[0, 0.12, -0.1]} s={0.6} panels />}
            {i === 1 && <><RBox size={[1.6, 0.8, 1]} r={0.05} color="#9fd0ff" position={[0, 0.52, -0.1]} /><Panel p={[0, 1.0, -0.1]} w={1.5} h={0.9} /></>}
            {i === 2 && <><House p={[-0.3, 0.12, -0.1]} s={0.55} panels lit /><Battery p={[0.7, 0.12, 0.2]} lvl={4} /></>}
            {i === 3 && <><House p={[-0.5, 0.12, -0.1]} s={0.5} panels lit /><Battery p={[0.5, 0.12, 0.2]} lvl={3} /><Pylon p={[0.9, 0.12, -0.8]} h={1.4} /></>}
            <Pill text={c[0]} p={[0, 2.2, 0.3]} dot={c[2]} w={2.5} />
            <Pill text={c[1]} p={[0, 0.9, 1.6]} dot={c[2]} w={1.8} bg={c[2]} fg="#fff" />
          </group>
        );
      })}
    </>
  );
};

// ---------- folha de conceitos ----------
const WARM = {bg: '#ffe9c4', sky: '#fff6e0', gnd: '#e7d2a0', sunCol: '#ffd9a0', sunI: 2.4, sunPos: [6, 12, 8]};
const DUSK = {bg: '#2b3f66', sky: '#8aa4d8', gnd: '#2a3555', sunCol: '#9fb7ff', sunI: 0.9, hemi: 0.5, env: 0.15, txt2: '#fff'};
const NEON = {bg: '#060a1c', sky: '#3a4cff', gnd: '#0a1030', sunCol: '#9fbfff', sunI: 1.0, hemi: 0.45, env: 0.12, txt2: '#bff6ff', sunPos: [-6, 13, 7]};
const MINT = {bg: '#d5f1ff', sky: '#ffffff', gnd: '#cfe8c8', sunCol: '#fff0dc', sunI: 2.2, txt2: '#1d1d22'};
const PAPER = {bg: '#2a355f', sky: '#fff', gnd: '#c8b89a', sunCol: '#fff0dc', sunI: 2.2, txt2: '#fff'};
const camTop = {pos: [0, 12.5, 12.5], target: [0, 0.3, 0.2], fov: 38};

export const SHOTS = [
  {id: 'A1', L: WARM, cam: camTop, label: 'A · Ilha × Continente', sub: 'blockout · argila, luz de fim de tarde', el: <SceneA />},
  {id: 'A2', L: DUSK, cam: camTop, label: 'A · O apagão', sub: 'blockout · só a ilha continua acesa', el: <SceneA night />},
  {id: 'B1', L: NEON, cam: {pos: [0, 12.5, 12], target: [0, 0.5, -1.8], fov: 40}, label: 'B · Cidade em apagão', sub: 'blockout · maquete noturna neon', el: <SceneB shot={1} />},
  {id: 'B2', L: NEON, cam: {pos: [0.3, 8.5, 13.8], target: [-0.1, 1.3, 0], fov: 40}, label: 'B · Cabo cortado', sub: 'blockout · a bateria assume a casa', el: <SceneB shot={2} />},
  {id: 'C1', L: MINT, cam: {pos: [0, 13, 12], target: [0, 1.0, 0.2], fov: 40}, label: 'C · Energia como água', sub: 'blockout · rede = caixa d\'água · off-grid = cisterna', el: <SceneC shot={1} />},
  {id: 'C2', L: MINT, cam: {pos: [0, 6.5, 12], target: [0, 2.0, 0], fov: 40}, label: 'C · Bateria = cisterna', sub: 'blockout · objeto herói', el: <SceneC shot={2} />},
  {id: 'D1', L: PAPER, cam: {pos: [0, 15, 11], target: [0, 0, -0.3], fov: 40}, label: 'D · Trilhos de decisão', sub: 'blockout · tabuleiro: “tem rede por perto?”', el: <SceneD shot={1} />},
  {id: 'D2', L: PAPER, cam: {pos: [0, 14, 9.5], target: [0, 0.3, 0], fov: 40}, label: 'D · Cartas de situação', sub: 'blockout · qual solução para cada usuário', el: <SceneD shot={2} />},
];

export const SolarConcept = ({only}) => {
  const frame = useCurrentFrame();
  const s = SHOTS[only ?? frame];
  return <Stage cam={s.cam} L={s.L} label={s.label} sub={s.sub}>{s.el}</Stage>;
};

export {Cyl, Ball, sag, Cable, Panel, House, Pole, Pylon, Battery, Inverter, Sun, Cloud, Tree, Building, Sea, Rail, Mount, QCtx, Rig, rnd, MONT};
