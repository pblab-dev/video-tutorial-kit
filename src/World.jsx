import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {labelTexture, plateTexture, floorTexture} from './lib.js';

// caixa arredondada (estilo toy)
export const RBox = ({size = [1, 1, 1], r = 0.08, color = '#fff', rough = 0.55, metal = 0, emissive, emissiveIntensity = 0, opacity = 1, cast = true, receive = true, children, ...p}) => {
  const geo = useMemo(() => new RoundedBoxGeometry(size[0], size[1], size[2], 4, Math.min(r, Math.min(...size) / 2 - 0.001)), [size[0], size[1], size[2], r]);
  return (
    <mesh geometry={geo} castShadow={cast} receiveShadow={receive} {...p}>
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} emissive={emissive || '#000'} emissiveIntensity={emissiveIntensity} transparent={opacity < 1} opacity={opacity} />
      {children}
    </mesh>
  );
};

export const Env = ({intensity = 0.45}) => {
  const {gl, scene} = useThree();
  const tex = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return t;
  }, [gl]);
  scene.environment = tex;
  scene.environmentIntensity = intensity;
  return null;
};

// plano de texto/ícone voltado para a câmera isométrica (câmera em +x,+y,+z)
export const BILLBOARD = new THREE.Euler(-0.6155, Math.PI / 4, 0, 'YXZ');
export const Billboard = ({text, size = 1, fg = '#ffd23f', position, scale = 1, opacity = 1, font}) => {
  const tex = useMemo(() => labelTexture(text, {fg, font}), [text, fg]);
  return (
    <mesh position={position} rotation={BILLBOARD} scale={scale}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// rótulo nas duas faces visíveis (+z e +x) de uma peça cúbica
export const FaceLabel = ({text, half, size = 0.9, fg = '#fff', font, plate = false, y = 0}) => {
  const tex = useMemo(() => (plate ? plateTexture(text, {font}) : labelTexture(text, {fg, font})), [text, fg, plate]);
  const mat = <meshBasicMaterial map={tex} transparent toneMapped={false} />;
  const args = plate ? [size, size / 2] : [size, size];
  return (
    <>
      <mesh position={[0, y, half + 0.004]}><planeGeometry args={args} />{mat}</mesh>
      <mesh position={[half + 0.004, y, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={args} />{mat}</mesh>
    </>
  );
};

const codeTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  g.fillStyle = '#14233a'; g.fillRect(0, 0, 512, 320);
  const cols = ['#5ec2ff', '#ffd23f', '#7be08a', '#ff7a7a', '#c39bff'];
  for (let i = 0; i < 12; i++) {
    let x = 24 + (i % 3) * 22;
    for (let k = 0; k < 3; k++) {
      const w = 40 + ((i * 53 + k * 71) % 110);
      g.fillStyle = cols[(i + k) % cols.length];
      g.fillRect(x, 26 + i * 23, w, 10);
      x += w + 14;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const Room = ({end = 4.4}) => {
  const L = end + 1.4; // comprimento da esteira (de x=-1.4 até end)
  const FW = end + 10; // largura do piso/parede
  const FC = (end - 6) / 2 - 0.1;
  const floor = useMemo(() => {
    const t = floorTexture();
    t.repeat.set((3 * FW) / 22, 3);
    return t;
  }, [FW]);
  const code = useMemo(() => codeTexture(), []);
  const wall = '#ecd0a8';
  return (
    <group>
      {/* piso e paredes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[FC, 0, 1]} receiveShadow>
        <planeGeometry args={[FW, 22]} />
        <meshStandardMaterial map={floor} roughness={0.7} />
      </mesh>
      <mesh position={[FC, 6, -4.4]} receiveShadow>
        <planeGeometry args={[FW, 12]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      <mesh position={[-5.2, 6, 1]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[22, 12]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      {/* rodapé */}
      <RBox size={[FW, 0.25, 0.1]} r={0.03} color="#c9a37a" position={[FC, 0.125, -4.35]} cast={false} />
      <RBox size={[0.1, 0.25, 22]} r={0.03} color="#c9a37a" position={[-5.15, 0.125, 1]} cast={false} />

      {/* mesa-esteira: preta com borda verde */}
      <RBox size={[L + 0.4, 0.2, 4.6]} r={0.06} color="#1fbf8f" position={[-1.4 + L / 2, 0.82, 1.2]} />
      <RBox size={[L, 0.14, 4.2]} r={0.05} color="#1c1c22" rough={0.4} position={[-1.4 + L / 2, 0.94, 1.2]} />
      <RBox size={[L, 0.72, 4.2]} r={0.05} color="#25252d" position={[-1.4 + L / 2, 0.36, 1.2]} />

      {/* mesa de trabalho */}
      <RBox size={[2.6, 0.12, 1.2]} r={0.04} color="#c98a4b" position={[-2.4, 0.86, -3.5]} />
      {[[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]].map(([x, z], i) => (
        <RBox key={i} size={[0.1, 0.8, 0.1]} r={0.03} color="#a86f38" position={[-2.4 + x * 1.15, 0.4, -3.5 + z * 1.0]} />
      ))}
      {/* monitor */}
      <RBox size={[0.14, 0.3, 0.14]} r={0.03} color="#222" position={[-2.4, 1.08, -3.75]} />
      <RBox size={[1.7, 1.05, 0.1]} r={0.05} color="#16161a" position={[-2.4, 1.75, -3.8]} />
      <mesh position={[-2.4, 1.75, -3.745]}>
        <planeGeometry args={[1.55, 0.9]} />
        <meshBasicMaterial map={code} toneMapped={false} />
      </mesh>
      <RBox size={[0.8, 0.04, 0.26]} r={0.015} color="#2b2b33" position={[-2.4, 0.94, -3.2]} />

      {/* planta */}
      <mesh position={[-4.5, 0.3, -3.7]} castShadow><cylinderGeometry args={[0.3, 0.24, 0.6, 20]} /><meshStandardMaterial color="#b5653a" roughness={0.7} /></mesh>
      {[[0, 0.95, 0, 0.5], [0.25, 1.25, 0.1, 0.38], [-0.2, 1.2, -0.1, 0.34]].map(([x, y, z, s], i) => (
        <mesh key={i} position={[-4.5 + x, y, -3.7 + z]} castShadow><icosahedronGeometry args={[s, 1]} /><meshStandardMaterial color="#3fae5b" roughness={0.6} flatShading /></mesh>
      ))}
    </group>
  );
};

export const Dev = ({t}) => {
  const bob = Math.sin(t * 9) * 0.04;
  const bob2 = Math.sin(t * 9 + 2) * 0.04;
  return (
    <group position={[-2.4, 0, -2.45]}>
      {/* cadeira */}
      <RBox size={[0.75, 0.12, 0.75]} r={0.05} color="#26262e" position={[0, 0.58, 0.05]} />
      <RBox size={[0.75, 0.9, 0.12]} r={0.05} color="#26262e" position={[0, 1.1, 0.42]} />
      <mesh position={[0, 0.3, 0.05]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.5, 12]} /><meshStandardMaterial color="#444" /></mesh>
      <mesh position={[0, 0.07, 0.05]} castShadow><cylinderGeometry args={[0.45, 0.45, 0.07, 5]} /><meshStandardMaterial color="#33333b" /></mesh>
      {/* pernas */}
      {[-0.15, 0.15].map((x, i) => (
        <group key={i}>
          <RBox size={[0.22, 0.22, 0.6]} r={0.05} color="#2d3f6b" position={[x, 0.76, -0.2]} />
          <RBox size={[0.22, 0.6, 0.22]} r={0.05} color="#2d3f6b" position={[x, 0.4, -0.46]} />
          <RBox size={[0.24, 0.12, 0.34]} r={0.04} color="#f4f4f4" position={[x, 0.08, -0.52]} />
        </group>
      ))}
      {/* tronco verde */}
      <RBox size={[0.6, 0.78, 0.34]} r={0.07} color="#2bb673" position={[0, 1.1, 0.08]} />
      {/* braços digitando */}
      <RBox size={[0.17, 0.17, 0.62]} r={0.05} color="#2bb673" position={[-0.4, 1.12 + bob, -0.3]} />
      <RBox size={[0.17, 0.17, 0.62]} r={0.05} color="#2bb673" position={[0.4, 1.12 + bob2, -0.3]} />
      {/* cabeça */}
      <RBox size={[0.52, 0.52, 0.52]} r={0.08} color="#f0b48a" position={[0, 1.78, 0.02 + bob * 0.4]} />
      <RBox size={[0.56, 0.2, 0.56]} r={0.07} color="#4a3020" position={[0, 2.05, 0.02 + bob * 0.4]} />
      <RBox size={[0.56, 0.36, 0.16]} r={0.06} color="#4a3020" position={[0, 1.86, 0.25 + bob * 0.4]} />
    </group>
  );
};
