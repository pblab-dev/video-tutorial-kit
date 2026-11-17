import React, {useMemo} from 'react';
import * as THREE from 'three';

// ===== Texugo-do-mel procedural com pelo em camadas (shell fur) =====
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

let _noise = null;
const noiseTex = () => {
  if (_noise) return _noise;
  const N = 128; const d = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) { const v = Math.floor(rnd(i + 17) * 255); d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.needsUpdate = true;
  _noise = t; return t;
};

// elipsoide com cor por vértice (cima = cinza/branco, baixo = preto) e deslocamento para camadas de pelo
const ellGeo = (sc, off, colorFn, seed = 0) => {
  const g = new THREE.SphereGeometry(1, 48, 36);
  const p = g.attributes.position; const n = new THREE.Vector3();
  const col = new Float32Array(p.count * 3); const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    n.set(x / (sc[0] * sc[0]), y / (sc[1] * sc[1]), z / (sc[2] * sc[2])).normalize();
    p.setXYZ(i, x * sc[0] + n.x * off, y * sc[1] + n.y * off, z * sc[2] + n.z * off);
    colorFn(c, x, y, z, rnd(i + seed));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
};

const BLACK = new THREE.Color('#1b1917'); const GREY = new THREE.Color('#bdb7a9'); const DGREY = new THREE.Color('#8f8a80');
const topColor = (thr, soft = 0.07) => (c, x, y, z, r) => {
  const t = THREE.MathUtils.smoothstep(y, thr - soft, thr + soft);
  c.copy(BLACK).lerp(GREY, t); c.multiplyScalar(0.86 + 0.28 * r);
};
const allBlack = (c, x, y, z, r) => { c.copy(BLACK).multiplyScalar(0.8 + 0.4 * r); };

const FurPart = ({sc, p = [0, 0, 0], rot = [0, 0, 0], colorFn = allBlack, layers = 16, len = 0.18, seed = 0}) => {
  const geos = useMemo(() => Array.from({length: layers + 1}, (_, k) => ellGeo(sc, (k / layers) * len, colorFn, seed)), [sc.join(), layers, len]);
  const nt = noiseTex();
  return (
    <group position={p} rotation={rot}>
      {geos.map((g, k) => {
        const t = k / layers;
        return (
          <mesh key={k} geometry={g} castShadow={k === 0} receiveShadow={k === 0}>
            <meshStandardMaterial vertexColors roughness={0.95} color={new THREE.Color().setScalar(0.55 + 0.45 * t)}
              alphaMap={k === 0 ? null : nt} alphaTest={k === 0 ? 0 : 0.12 + 0.8 * t} transparent={false}
              onBeforeCompile={undefined} />
          </mesh>
        );
      })}
    </group>
  );
};

const Claw = ({p, rot = [0, 0, 0], len = 0.32}) => (
  <mesh position={p} rotation={rot} castShadow>
    <coneGeometry args={[0.035, len, 10]} />
    <meshStandardMaterial color="#efe6d2" roughness={0.45} />
  </mesh>
);

// Texugo olhando para +z. A escala base: corpo ~2,6 de comprimento.
export const Badger = ({p = [0, 0, 0], ry = 0, s = 1, twist = 0, lowerHead = 0, layers = 14}) => {
  const bodyCol = useMemo(() => topColor(0.12), []);
  const headCol = useMemo(() => topColor(0.2, 0.05), []);
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      {/* quadril/corpo */}
      <FurPart sc={[0.62, 0.52, 1.15]} p={[0, 0.66, 0]} colorFn={bodyCol} layers={layers} len={0.17} seed={3} />
      {/* parte da frente que gira dentro da pele */}
      <group position={[0, 0.66, 0.7]} rotation={[0, twist, 0]}>
        <FurPart sc={[0.55, 0.47, 0.7]} p={[0, 0.02, 0.3]} colorFn={bodyCol} layers={layers} len={0.17} seed={9} />
        <group position={[0, -0.05, 0.9]} rotation={[lowerHead, 0, 0]}>
          <FurPart sc={[0.38, 0.32, 0.5]} p={[0, 0.0, 0.2]} colorFn={headCol} layers={layers} len={0.07} seed={21} />
          {/* focinho */}
          <FurPart sc={[0.17, 0.15, 0.3]} p={[0, -0.06, 0.62]} colorFn={allBlack} layers={8} len={0.05} seed={31} />
          <mesh position={[0, -0.03, 0.9]} castShadow><sphereGeometry args={[0.08, 20, 16]} /><meshStandardMaterial color="#0c0b0b" roughness={0.25} /></mesh>
          {/* olhos (cartoon: branco + pupila, bem visíveis) */}
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <mesh position={[sx * 0.2, 0.09, 0.6]} scale={[1, 1.1, 0.7]}><sphereGeometry args={[0.1, 20, 16]} /><meshStandardMaterial color="#f7f3ea" roughness={0.3} /></mesh>
              <mesh position={[sx * 0.19, 0.085, 0.67]}><sphereGeometry args={[0.055, 18, 14]} /><meshStandardMaterial color="#0d0907" roughness={0.1} /></mesh>
              <mesh position={[sx * 0.172, 0.11, 0.718]}><sphereGeometry args={[0.016, 8, 8]} /><meshBasicMaterial color="#fff" /></mesh>
              <mesh position={[sx * 0.2, 0.2, 0.62]} rotation={[0, 0, sx * 0.32]} scale={[1.2, 0.3, 0.8]}><sphereGeometry args={[0.1, 14, 10]} /><meshStandardMaterial color="#141210" roughness={0.95} /></mesh>
              <FurPart sc={[0.07, 0.09, 0.05]} p={[sx * 0.32, 0.26, 0.05]} colorFn={allBlack} layers={4} len={0.03} seed={41} />
            </group>
          ))}
        </group>
        {/* patas da frente + garras longas */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.4, -0.35, 0.35]}>
            <FurPart sc={[0.16, 0.34, 0.19]} p={[0, -0.15, 0]} layers={8} len={0.07} seed={51} />
            {[-0.07, 0, 0.07].map((dx, i) => <Claw key={i} p={[dx, -0.5, 0.2]} rot={[1.35, 0, 0]} len={0.34} />)}
          </group>
        ))}
      </group>
      {/* patas traseiras */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.38, 0.3, -0.7]}>
          <FurPart sc={[0.17, 0.32, 0.22]} p={[0, 0, 0]} layers={8} len={0.07} seed={61} />
          {[-0.05, 0.05].map((dx, i) => <Claw key={i} p={[dx, -0.3, 0.17]} rot={[1.35, 0, 0]} len={0.14} />)}
        </group>
      ))}
      {/* rabo curto */}
      <FurPart sc={[0.12, 0.12, 0.3]} p={[0, 0.8, -1.3]} rot={[-0.4, 0, 0]} layers={8} len={0.09} colorFn={bodyCol} seed={71} />
    </group>
  );
};
