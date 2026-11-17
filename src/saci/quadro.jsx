import React, {useMemo, useState, useEffect} from 'react';
import * as THREE from 'three';
import {useCurrentFrame, staticFile, delayRender, continueRender} from 'remotion';
import {RBox} from '../World.jsx';
import {Stage, MONT} from '../badger/concept.jsx';
import {Room} from '../badger/rich.jsx';

const W = 1.9, H = 2.42; // proporção da foto 265x337

export const usePhoto = () => {
  const [tex, setTex] = useState(null);
  const [h] = useState(() => delayRender('foto-saci'));
  useEffect(() => {
    new THREE.TextureLoader().load(staticFile('saci/saci.jpg'), (t) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; setTex(t); continueRender(h);
    });
  }, []);
  return tex;
};

const Ring = ({p, r = 0.3, color = '#ff2b2b'}) => (
  <mesh position={p}>
    <torusGeometry args={[r, 0.028, 12, 48]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
  </mesh>
);

// quadro dourado com a foto, passe-partout e luminária de quadro
export const Quadro = ({p = [0.6, 3.75, -3.0], marks = false, tex, rz = 0, flash = 0}) => (
  <group position={p} rotation={[0, 0, rz]}>
    <RBox size={[W + 0.55, H + 0.55, 0.12]} r={0.05} color="#b8892f" position={[0, 0, 0.0]} rough={0.35} />
    <RBox size={[W + 0.38, H + 0.38, 0.14]} r={0.03} color="#7a5418" position={[0, 0, 0.02]} rough={0.5} />
    <RBox size={[W + 0.22, H + 0.22, 0.16]} r={0.02} color="#d9ae4c" position={[0, 0, 0.03]} rough={0.3} />
    <RBox size={[W + 0.1, H + 0.1, 0.18]} r={0.01} color="#f6efdc" position={[0, 0, 0.04]} rough={0.9} />
    {tex && (
      <mesh position={[0, 0, 0.14]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={tex} roughness={0.85} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.35} />
      </mesh>
    )}
    {/* luminária de quadro */}
    <RBox size={[1.2, 0.09, 0.09]} r={0.03} color="#3a2a14" position={[0, H / 2 + 0.5, 0.25]} rough={0.4} />
    <mesh position={[0, H / 2 + 0.5, 0.3]}><sphereGeometry args={[0.04, 10, 8]} /><meshStandardMaterial color="#fff2c0" emissive="#ffe49a" emissiveIntensity={3} /></mesh>
    {marks && (<>
      <Ring p={[-0.52, -H / 2 + 0.28, 0.2]} r={0.34} />
      <Ring p={[0.62, -H / 2 + 0.28, 0.2]} r={0.34} />
    </>)}
    <pointLight position={[0, H / 2 + 0.6, 1.2]} intensity={6 + flash * 40} color="#ffe2a8" distance={7} />
  </group>
);

export const QL = {bg: '#2a1a14', sky: '#ffe9cf', gnd: '#6a4a38', sunCol: '#ffe2b8', sunI: 1.6, sunPos: [3, 7, 6], hemi: 0.6, env: 0.4, exposure: 1.0};

export const QSHOTS = [
  {id: 'Q1', cam: {pos: [1.6, 3.7, 9.5], target: [0.6, 3.7, -3], fov: 34, k: 1, dy: 0}, label: 'O SACI PERERÊ', cap: 'Olha esse quadro', marks: false, q: false},
  {id: 'Q2', cam: {pos: [1.2, 3.4, 4.6], target: [0.6, 3.7, -3], fov: 34, k: 1, dy: 0}, label: 'O SACI PERERÊ', cap: 'Um saci', marks: false, q: false},
  {id: 'Q3', cam: {pos: [0.9, 3.4, 4.9], target: [0.6, 3.75, -3], fov: 34, k: 1, dy: 0}, label: 'MAS ESPERA...', cap: 'Duas pernas?', marks: true, q: true},
];

export const SaciQuadro = ({only}) => {
  const frame = useCurrentFrame();
  const s = QSHOTS[only ?? frame];
  const tex = usePhoto();
  return (
    <div style={{width: '100%', height: '100%', position: 'relative'}}>
      <Stage cam={s.cam} L={QL} label={s.label} cap={s.cap} tag="Saci · abertura: quadro na parede · rascunho">
        <Room wall="#a9744a" frames={false} />
        <Quadro tex={tex} marks={s.marks} />
      </Stage>
      {s.q && (
        <div style={{position: 'absolute', left: 330, right: 0, top: 380, textAlign: 'center', fontFamily: MONT, fontWeight: 900, fontSize: 190, color: '#ffd23f', WebkitTextStroke: '10px #3b2412', paintOrder: 'stroke fill', transform: 'rotate(8deg)', textShadow: '0 6px 0 #3b2412'}}>?</div>
      )}
    </div>
  );
};
