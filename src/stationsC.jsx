import React from 'react';
import {RBox} from './World.jsx';
import {prog, easeInOut, easeOut, easeOutBack, lerp} from './lib.js';
import {pk, fade, rn, pulse, Cube, Tx, TLine} from './kit.jsx';

const Y0 = 0.12;

// ---------------------------------------------------------------- 12 EVALS
export const S12 = ({tau, b, c}) => {
  const casesT0 = b + 0.15;
  const bars = [[0.6, 0.7, '#ff9a3d', '62%'], [-0.6, 1.5, '#3fd07a', '91%']];
  const barsT0 = b + 1.65;
  const ARCH = -0.45;
  return (
    <group>
      {/* prompt */}
      <group position={[-1.3, Y0, 1.0]} scale={Math.max(pk(tau, 0.1), 0.001)}>
        <RBox size={[0.7, 0.9, 0.08]} r={0.03} color="#f7f2e7" position={[0, 0.45, 0]} />
        <RBox size={[0.45, 0.07, 0.02]} r={0.01} color="#ffd23f" position={[0, 0.7, 0.05]} />
        <RBox size={[0.45, 0.07, 0.02]} r={0.01} color="#9a9aa8" position={[0, 0.5, 0.05]} />
        <RBox size={[0.3, 0.07, 0.02]} r={0.01} color="#9a9aa8" position={[-0.07, 0.3, 0.05]} />
      </group>
      {tau > 0.3 && tau < b + 0.3 && <Tx text="MELHOROU?" p={[-1.1, Y0 + 1.7, 0.9]} w={1.5} fg="#17171d" bg="#fff" font="800 54px Montserrat" k={pk(tau, 0.3) * (1 - prog(tau, b - 0.1, b + 0.3))} />}
      {/* scanner */}
      {tau > b - 0.08 && <group position={[ARCH, Y0, 0]} scale={[1, Math.max(pk(tau, b - 0.1, 0.4), 0.001), 1]}>
        {[-1.0, 1.0].map((z) => <RBox key={z} size={[0.16, 0.9, 0.16]} r={0.05} color="#9b6bff" position={[0, 0.45, z]} />)}
        <RBox size={[0.16, 0.16, 2.16]} r={0.05} color="#9b6bff" position={[0, 0.9, 0]} />
        <mesh position={[0, 0.45, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.84, 0.8]} /><meshStandardMaterial color="#c9b0ff" emissive="#9b6bff" emissiveIntensity={0.5} transparent opacity={0.18} side={2} depthWrite={false} /></mesh>
      </group>}
      {/* casos de teste */}
      {[0, 1, 2, 3, 4].map((j) => {
        const z = (j - 2) * 0.5 - 0.1;
        const t0 = casesT0 + j * 0.27;
        const q = easeInOut(prog(tau, t0, t0 + 0.8));
        const x = lerp(-1.25, 0.25, q);
        const passed = x > ARCH + 0.05;
        const ok = j !== 3;
        const col = !passed ? '#b9bcc8' : ok ? '#3fd07a' : '#ff4a55';
        const k = pk(tau, 0.2 + j * 0.06, 0.25);
        if (tau < 0.2) return null;
        return <Cube key={j} p={[tau > t0 ? x : -1.25, Y0, tau > t0 ? z : z]} s={0.3} color={col} text={passed ? (ok ? 'OK' : 'X') : undefined} k={k} font="900 140px Montserrat" />;
      })}
      {/* gráfico antes/depois */}
      {bars.map(([z, h, col, lab], i) => {
        const k = easeOutBack(prog(tau, barsT0 + i * 0.35, barsT0 + 0.5 + i * 0.35));
        if (k < 0.03) return null;
        return (
          <group key={i} position={[1.5, Y0, z]}>
            <RBox size={[0.42, Math.max(h * k, 0.01), 0.42]} r={0.07} color={col} position={[0, (h * k) / 2, 0]} />
            <Tx text={lab} p={[0, h * k + 0.5, 0]} w={2.2} fg="#fff" k={k > 0.6 ? 1 : 0} />
          </group>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- 13 OBSERVABILIDADE
const LOG = [
  ['POST /chat  200', '#7be08a'],
  ['tempo: 1.2s', '#e8f3ff'],
  ['tokens: 812', '#7fd1ff'],
  ['custo: $0.003', '#ffd23f'],
];
export const S13 = ({tau, b, c}) => {
  const slide = easeInOut(prog(tau, b + 0.1, b + 0.8));
  const blink = Math.floor(tau * 3) % 2 === 0;
  const open = tau > b + 0.2;
  const panelK = pk(tau, b + 0.5, 0.45);
  const barsT0 = b + 1.9;
  const bh = [0.2, 0.4, 0.28, 0.55, 0.35];
  return (
    <group>
      {/* caixa-preta */}
      <group position={[lerp(0.0, -1.0, slide), Y0, 0]} scale={pk(tau, 0.1, 0.4)}>
        <RBox size={[1.2, 0.9, 1.2]} r={0.1} color="#34343f" position={[0, 0.45, 0]} />
        <RBox size={[0.25, 0.1, 0.25]} r={0.03} color={tau < b ? (blink ? '#ff3b4a' : '#5a1b20') : '#3fd07a'} emissive={tau < b ? '#ff3b4a' : '#3fd07a'} emissiveIntensity={tau < b ? (blink ? 1.2 : 0.1) : 0.9} position={[0, 0.95, 0]} />
        {!open && <Tx text="?" p={[0, 1.7, 0]} w={2.6} fg="#ffd23f" k={pk(tau, 0.3)} />}
      </group>
      {tau > 0.5 && tau < b + 0.3 && <Tx text="ERRO!" p={[0, Y0 + 2.2, 0]} w={1.0} fg="#fff" bg="#ff3b4a" font="800 56px Montserrat" k={pk(tau, 0.5) * (1 - prog(tau, b, b + 0.3))} />}
      {/* cabo + painel */}
      {tau > b + 0.4 && (
        <group position={[-0.4, Y0 + 0.2, 0]} scale={[Math.max(easeOut(prog(tau, b + 0.4, b + 0.9)), 0.001), 1, 1]}>
          <mesh position={[0.5, 0, 0]}><boxGeometry args={[1.0, 0.09, 0.09]} /><meshStandardMaterial color="#5ec2ff" emissive="#2ea0ff" emissiveIntensity={0.6} /></mesh>
        </group>
      )}
      {panelK > 0.03 && <group position={[1.1, Y0, 0]} scale={[1, Math.max(panelK, 0.001), 1]}>
        <RBox size={[0.14, 2.0, 2.3]} r={0.06} color="#14233a" position={[0, 1.0, 0]} />
        <RBox size={[0.4, 0.1, 1.0]} r={0.04} color="#0c1626" position={[0.1, 0.05, 0]} />
        {LOG.map(([txt, col], i) => (
          <TLine key={i} text={txt} color={col} p={[0.08, 1.75 - i * 0.3, 0]} w={2.0} k={pk(tau, b + 0.85 + i * 0.22, 0.2)} />
        ))}
        {bh.map((h, i) => {
          const k = easeOutBack(prog(tau, barsT0 + i * 0.07, barsT0 + 0.35 + i * 0.07));
          if (k < 0.03) return null;
          return <RBox key={i} size={[0.07, Math.max(h * k, 0.01), 0.22]} r={0.02} color={i === 3 ? '#ff7a7a' : '#5ec2ff'} emissive={i === 3 ? '#ff3b4a' : '#2ea0ff'} emissiveIntensity={0.4} position={[0.1, 0.25 + (h * k) / 2, -0.55 + i * 0.28]} />;
        })}
      </group>}
    </group>
  );
};
