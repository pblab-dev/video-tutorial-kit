import React from 'react';
import {RBox} from './World.jsx';
import {prog, easeInOut, easeOut, easeOutBack, lerp, lerp3} from './lib.js';
import {pk, fade, arc3, rn, pulse, Cube, MiniLLM, Tx, TLine, Burst, Pkt, Coin, Wire} from './kit.jsx';

const Y0 = 0.12;
const PAL = ['#ffd23f', '#ff5a4f', '#3fa7ff', '#7be08a', '#c39bff'];

// ---------------------------------------------------------------- 6 AGENTE
export const S6 = ({tau, b, c}) => {
  const R = 1.15;
  const nodes = [
    {th: -Math.PI / 2, color: '#ffd23f', label: 'PENSA'},
    {th: -Math.PI / 2 + (2 * Math.PI) / 3, color: '#3fa7ff', label: 'AGE'},
    {th: -Math.PI / 2 + (4 * Math.PI) / 3, color: '#3fd07a', label: 'OBSERVA'},
  ];
  const ringK = pk(tau, b + 0.1, 0.5);
  const l0 = b + 0.75, l1 = b + 2.85;
  const loop = tau > l0 && tau < l1;
  const th = -Math.PI / 2 + (tau - l0) * 4.4;
  const done = tau > b + 2.8;
  const miss0 = 0.5, miss1 = 1.6;
  const flagOn = tau > l1;
  return (
    <group>
      <MiniLLM p={[0, Y0, 0]} k={pk(tau, 0.1, 0.4)} spin={loop ? (tau - l0) * 1.5 : 0} s={0.8} ei={flagOn ? 0.4 : 0} />
      <Wire tau={tau} t0={l1 - 0.2} a={[0.3, Y0 + 0.12, -0.2]} b={[1.4, Y0 + 0.12, -1.0]} color="#3fd07a" lift={0.1} dur={0.45} />
      {/* bandeira objetivo */}
      <group position={[1.45, Y0, -1.1]} scale={Math.max(pk(tau, 0.25), 0.001)}>
        <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 1.4, 10]} /><meshStandardMaterial color="#d6d8e0" /></mesh>
        <RBox size={[0.04, 0.4, 0.62]} r={0.02} color={flagOn ? '#3fd07a' : '#8a8f9b'} emissive={flagOn ? '#3fd07a' : '#000'} emissiveIntensity={flagOn ? 0.6 : 0} position={[0.0, 1.2, 0.33]} />
      </group>
      {/* tentativa única: cai antes de chegar */}
      <Pkt tau={tau} a={[-1.4, Y0 + 0.9, 0]} b={[-0.1, Y0 + 1.0, 0]} t0={miss0} t1={miss0 + 0.55} color="#ff5a8a" h={0.6} />
      <Pkt tau={tau} a={[0.1, Y0 + 1.0, 0]} b={[1.0, Y0 + 0.2, 0]} t0={miss0 + 0.8} t1={miss1 + 0.3} color="#ff5a8a" h={0.9} />
      {tau > miss1 + 0.3 && tau < b + 0.1 && <Tx text="X" p={[1.0, Y0 + 1.1, 0]} w={2.4} fg="#ff5a4f" k={pk(tau, miss1 + 0.3) * (1 - prog(tau, b - 0.2, b + 0.1))} />}
      {/* loop */}
      <group scale={Math.max(ringK, 0.001)}>
        <mesh position={[0, Y0 + 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow><torusGeometry args={[R, 0.055, 10, 64]} /><meshStandardMaterial color="#ffd0df" emissive="#ff5a8a" emissiveIntensity={0.25} /></mesh>
        {nodes.map((n, i) => {
          const d = Math.abs(((th - n.th + Math.PI * 100) % (2 * Math.PI)) - 0);
          const near = loop ? Math.max(0, 1 - Math.min(d, 2 * Math.PI - d) / 0.7) : 0;
          return (
            <group key={i} position={[Math.cos(n.th) * R, Y0 + 0.1, Math.sin(n.th) * R]}>
              <mesh castShadow scale={1 + near * 0.5}><sphereGeometry args={[0.2, 18, 18]} /><meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={0.25 + near * 1.0} /></mesh>
              <Tx text={n.label} p={[Math.cos(n.th) * 0.5, 0.75, Math.sin(n.th) * 0.5]} w={1.0} fg="#17171d" bg="#fff" font="800 52px Montserrat" k={pk(tau, b + 0.5 + i * 0.12)} />
            </group>
          );
        })}
      </group>
      {loop && <Cube p={[Math.cos(th) * R, Y0 + 0.2, Math.sin(th) * R]} s={0.42} color="#ff5a8a" emissive="#ff2d6a" ei={0.5} rot={[0, -th, 0]} k={1} />}
    </group>
  );
};

// ---------------------------------------------------------------- 7 STRUCTURED OUTPUT
const SHEETS = Array.from({length: 8}).map((_, i) => ({
  p: [lerp(-1.5, 0.1, rn(i, 1)), Y0 + lerp(0.4, 1.6, rn(i, 2)), lerp(-1.2, 1.2, rn(i, 3))],
  r: [rn(i, 4) * 1.2, rn(i, 5) * 6, rn(i, 6) * 1.2],
}));
const JSON_LINES = [
  ['{', '#e8f3ff'],
  ['  "nome": "Ana",', '#7fd1ff'],
  ['  "idade": 29,', '#ffd23f'],
  ['  "ativo": true', '#7be08a'],
  ['}', '#e8f3ff'],
];
export const S7 = ({tau, b, c}) => {
  const PANEL = [1.15, Y0, 0];
  const arrive = b + 0.9;
  const pPulse = pulse(tau, arrive, 0.4, 0.04);
  return (
    <group>
      {SHEETS.map((s, i) => {
        const k = pk(tau, 0.1 + i * 0.1, 0.3);
        const t0 = b + 0.2 + i * 0.08, t1 = t0 + 0.55;
        let p = [s.p[0], s.p[1] + Math.sin(tau * 2 + i) * 0.09, s.p[2]];
        let sc = k;
        let rot = [s.r[0] + tau * 0.3, s.r[1] + tau * 0.6, s.r[2]];
        if (tau >= t0) {
          if (tau > t1) return null;
          const q = easeInOut(prog(tau, t0, t1));
          p = arc3(s.p, [PANEL[0] - 0.3, Y0 + 1.5, 0], q, 0.7);
          sc = 1 - 0.6 * q;
        }
        return (
          <group key={i} position={p} rotation={rot} scale={Math.max(sc, 0.001)}>
            <RBox size={[0.55, 0.05, 0.7]} r={0.02} color="#f7f2e7" />
            <RBox size={[0.4, 0.06, 0.05]} r={0.01} color={PAL[i % 5]} position={[0, 0.02, 0.1]} />
            <RBox size={[0.3, 0.06, 0.05]} r={0.01} color="#9a9aa8" position={[-0.05, 0.02, -0.05]} />
          </group>
        );
      })}
      <MiniLLM p={[-1.25, Y0, -1.0]} k={pk(tau, 0.1, 0.4)} s={0.7} />
      <Wire tau={tau} t0={b + 0.1} a={[-0.85, Y0 + 0.12, -1.0]} b={[1.02, Y0 + 0.25, -0.9]} color="#8fd96b" lift={0.1} dur={0.7} />
      {tau > 0.3 && tau < b + 0.5 && <Tx text="?" p={[-0.7, Y0 + 2.2, 0]} w={2.4} fg="#ffd23f" k={pk(tau, 0.3) * (1 - prog(tau, b + 0.3, b + 0.5))} />}
      {/* painel JSON */}
      {tau > b - 0.08 && <group position={PANEL} scale={[1, Math.max(pk(tau, b - 0.1, 0.45), 0.001), 1]}>
        <group scale={[pPulse, 1, pPulse]}>
          <RBox size={[0.14, 1.9, 2.3]} r={0.06} color="#14233a" position={[0, 0.95, 0]} emissive="#3fa7ff" emissiveIntensity={fade(tau, arrive, arrive + 0.6) * 0.25} />
          <RBox size={[0.4, 0.1, 1.0]} r={0.04} color="#0c1626" position={[0.1, 0.05, 0]} />
        </group>
        {JSON_LINES.map(([txt, col], i) => (
          <TLine key={i} text={txt} color={col} p={[0.08, 1.62 - i * 0.33, 0]} w={2.0} k={pk(tau, arrive + 0.15 + i * 0.22, 0.2)} />
        ))}
      </group>}
    </group>
  );
};

// ---------------------------------------------------------------- 8 STREAMING
const WORDS = ['O', 'gato', 'subiu', 'no', 'telhado', 'e', 'miou', 'alto'];
export const S8 = ({tau, b, c}) => {
  const SCR = [1.25, Y0, 0];
  const n = Math.max(0, Math.floor((tau - (b + 0.8)) / 0.3) + 1);
  const shown = WORDS.slice(0, Math.min(n, WORDS.length));
  const L = [0, 2, 4, 6].map((i) => shown.slice(i, i + 2).join(' '));
  const spinOn = tau > 0.4 && tau < b + 0.8;
  return (
    <group>
      <MiniLLM p={[-1.2, Y0, 0]} k={pk(tau, 0.1, 0.4)} ei={tau > b ? 0.35 : 0} />
      {/* tela */}
      {tau > 0.22 && <group position={SCR} scale={[1, Math.max(pk(tau, 0.2, 0.4), 0.001), 1]}>
        <RBox size={[0.14, 1.6, 2.1]} r={0.06} color="#1d2230" position={[0, 0.8, 0]} />
        <RBox size={[0.12, 0.08, 0.9]} r={0.03} color="#11141d" position={[0, 0.04, 0]} />
        {L.map((ln, i) => ln && <TLine key={i} text={ln} color="#e8f3ff" p={[0.08, 1.3 - i * 0.3, 0]} w={2.3} center />)}
        {spinOn && (
          <group position={[0.1, 0.8, 0]} rotation={[0, Math.PI / 2, 0]} scale={prog(tau, 0.4, 0.7) * (1 - prog(tau, b + 0.6, b + 0.8))}>
            <mesh rotation={[0, 0, -tau * 5]}><torusGeometry args={[0.3, 0.07, 10, 24, 4.4]} /><meshStandardMaterial color="#35c6e8" emissive="#35c6e8" emissiveIntensity={0.6} /></mesh>
          </group>
        )}
      </group>}
      {tau > 0.6 && tau < b + 0.8 && <Tx text="10 s..." p={[1.25, Y0 + 2.35, 0]} w={2.6} fg="#ff7a7a" k={pk(tau, 0.6) * (1 - prog(tau, b + 0.5, b + 0.8))} />}
      {/* tubo + tokens */}
      {tau > b + 0.1 && (
        <group position={[0, Y0 + 0.55, 0]} scale={[Math.max(easeOut(prog(tau, b + 0.1, b + 0.5)), 0.001), 1, 1]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.24, 0.24, 1.5, 18, 1, true]} /><meshStandardMaterial color="#b6ecf8" transparent opacity={0.3} side={2} /></mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const ph = ((tau - b - 0.3) * 0.9 + i / 6) % 1;
            return <mesh key={i} position={[lerp(-0.7, 0.7, ph), 0, 0]} scale={0.7 * Math.sin(Math.PI * ph) + 0.15} castShadow><boxGeometry args={[0.34, 0.34, 0.34]} /><meshStandardMaterial color={PAL[i % 5]} emissive={PAL[i % 5]} emissiveIntensity={0.3} /></mesh>;
          })}
        </group>
      )}
    </group>
  );
};

// ---------------------------------------------------------------- 9 GUARDRAILS
const Gate = ({x, flash = 0, k = 1, label}) => (k < 0.03 ? null :
  <group position={[x, Y0, 0]} scale={[1, Math.max(k, 0.001), 1]}>
    {[-0.62, 0.62].map((z) => <RBox key={z} size={[0.18, 1.5, 0.18]} r={0.05} color="#3fcf7a" position={[0, 0.75, z]} />)}
    <RBox size={[0.18, 0.18, 1.42]} r={0.05} color="#3fcf7a" position={[0, 1.5, 0]} />
    <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[1.1, 1.3]} />
      <meshStandardMaterial color={flash > 0.01 ? '#ff3b4a' : '#7be08a'} emissive={flash > 0.01 ? '#ff3b4a' : '#3fcf7a'} emissiveIntensity={0.4 + flash * 1.2} transparent opacity={0.22 + flash * 0.3} side={2} depthWrite={false} />
    </mesh>
    <Tx text={label} p={[0, 2.15, 0]} w={1.2} fg="#17171d" bg="#fff" font="800 56px Montserrat" k={k} />
  </group>
);
export const S9 = ({tau, b, c}) => {
  const A = -1.4, B = 1.3, LX = -0.05;
  const hitA = fade(tau, b + 0.65, b + 0.8, 0.1);
  const hitB = fade(tau, b + 1.2, b + 1.35, 0.1);
  const gp = prog(tau, b + 1.5, b + 2.55);
  return (
    <group>
      <MiniLLM p={[LX, Y0, 0]} k={pk(tau, 0.1, 0.4)} s={0.8} />
      {/* A: vazamento */}
      <Pkt tau={tau} a={[LX, Y0 + 1.0, 0]} b={[2.2, Y0 + 0.2, 0.8]} t0={0.7} t1={1.8} color="#ff3b4a" text="!" h={1.0} />
      {tau > 1.3 && tau < b + 0.1 && <Tx text="VAZOU DADO" p={[1.0, Y0 + 2.0, 0]} w={1.5} fg="#fff" bg="#ff3b4a" font="800 54px Montserrat" k={pk(tau, 1.3) * (1 - prog(tau, b - 0.2, b + 0.1))} />}
      <Wire tau={tau} t0={b + 0.1} a={[A + 0.12, Y0 + 0.1, 0]} b={[LX - 0.4, Y0 + 0.2, 0]} color="#3fcf7a" lift={0.04} dur={0.35} />
      <Wire tau={tau} t0={b + 0.1} a={[LX + 0.4, Y0 + 0.2, 0]} b={[B - 0.12, Y0 + 0.1, 0]} color="#3fcf7a" lift={0.04} dur={0.35} />
      <Gate x={A} flash={hitA} k={pk(tau, b - 0.1, 0.4)} label="ENTRADA" />
      <Gate x={B} flash={hitB} k={pk(tau, b - 0.1, 0.4)} label="SAÍDA" />
      {/* ruim bate na entrada e volta */}
      <Pkt tau={tau} a={[-1.7, Y0 + 0.5, 0]} b={[A - 0.15, Y0 + 0.5, 0]} t0={b + 0.15} t1={b + 0.65} color="#ff3b4a" text="!" h={0.1} />
      <Pkt tau={tau} a={[A - 0.15, Y0 + 0.5, 0]} b={[-1.7, Y0 + 0.9, 1.0]} t0={b + 0.7} t1={b + 1.2} color="#ff3b4a" text="!" h={0.7} />
      {/* ruim sai da LLM e bate na saída */}
      <Pkt tau={tau} a={[LX + 0.3, Y0 + 0.5, 0]} b={[B - 0.15, Y0 + 0.5, 0]} t0={b + 0.7} t1={b + 1.2} color="#ff3b4a" text="!" h={0.1} />
      <Pkt tau={tau} a={[B - 0.15, Y0 + 0.5, 0]} b={[0.8, Y0 + 1.0, 1.1]} t0={b + 1.25} t1={b + 1.7} color="#ff3b4a" text="!" h={0.7} />
      {/* bom passa por tudo */}
      {tau > b + 1.5 && tau < b + 2.75 && <Cube p={[lerp(-1.7, 2.0, gp), Y0 + 0.25 + Math.sin(Math.PI * gp) * 0.15, 0]} s={0.3} color="#3fd07a" text="OK" k={Math.min(1, prog(tau, b + 1.5, b + 1.65)) * (1 - prog(tau, b + 2.6, b + 2.75))} />}
    </group>
  );
};

// ---------------------------------------------------------------- 10 PROMPT CACHE
export const S10 = ({tau, b, c}) => {
  const calls = [0.6, 1.4, 2.2].map((t) => ({t, n: 6, color: '#ffd23f'}))
    .concat([b + 1.3, b + 1.9, b + 2.5].map((t) => ({t, n: 1, color: '#3fd07a'})));
  const coins = [];
  let idx = 0;
  calls.forEach((cl) => {
    for (let i = 0; i < cl.n; i++) {
      coins.push({t0: cl.t + i * 0.07, idx: idx++, color: cl.color});
    }
  });
  const cacheK = pk(tau, b + 0.3, 0.45);
  const frozen = tau > b + 0.55;
  const topPulse = (t) => 1 + 0.12 * Math.sin(Math.PI * prog(tau, t, t + 0.35));
  return (
    <group>
      {/* pilha de prompt: 4 de prefixo + 1 pergunta */}
      <group position={[-0.75, Y0, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const k = pk(tau, 0.1 + i * 0.08, 0.3);
          const top = i === 4;
          const pulseS = calls.some((cl) => tau >= cl.t && tau <= cl.t + 0.35 && (top || cl.n > 1)) ? calls.reduce((m, cl) => (top || cl.n > 1 ? Math.max(m, topPulse(cl.t) - 1) : m), 0) + 1 : 1;
          return <RBox key={i} size={[1.5, 0.15, 1.0]} r={0.05} color={top ? '#ffd23f' : frozen ? '#cfe8ff' : '#f4ecdc'} emissive={frozen && !top ? '#6ab8ff' : '#000'} emissiveIntensity={frozen && !top ? 0.25 : 0} position={[0, 0.1 + i * 0.2, 0]} scale={[pulseS, Math.max(k, 0.001), pulseS]} />;
        })}
        {cacheK > 0.01 && (
          <group position={[0, 0.5, 0]} scale={Math.max(cacheK, 0.001)}>
            <RBox size={[1.75, 0.95, 1.25]} r={0.1} color="#8fd0ff" opacity={0.28} emissive="#6ab8ff" emissiveIntensity={0.4} cast={false} position={[0, 0.0, 0]} />
          </group>
        )}
        <Tx text={tau < b ? 'PROMPT GIGANTE' : 'PREFIXO EM CACHE'} p={[0, 1.75, 0]} w={tau < b ? 1.7 : 1.9} fg="#17171d" bg="#fff" font="800 44px Montserrat" k={pk(tau, 0.5)} />
      </group>
      <MiniLLM p={[1.4, Y0, -1.15]} k={pk(tau, 0.1, 0.4)} s={0.7} />
      <Wire tau={tau} t0={0.5} a={[0.0, Y0 + 0.12, -0.45]} b={[1.0, Y0 + 0.2, -1.1]} color="#6ab8ff" lift={0.1} dur={0.5} />
      {/* moedas */}
      {coins.map((cn) => {
        const q = prog(tau, cn.t0, cn.t0 + 0.4);
        if (tau < cn.t0) return null;
        const col = cn.idx % 3, row = Math.floor(cn.idx / 3) % 2, layer = Math.floor(cn.idx / 6);
        const fx = 1.05 + (col - 1) * 0.45, fz = (row - 0.5) * 0.5;
        const ty = Y0 + 0.05 + layer * 0.07;
        const y = lerp(Y0 + 2.6, ty, easeInOut(q) * 0.0 + q * q);
        return <Coin key={cn.idx} p={[fx, y, fz]} color={cn.color} />;
      })}
      {tau > 0.5 && <Tx text={tau < b ? '$$$' : '$'} p={[1.05, Y0 + 2.2, 0]} w={2.4} fg={tau < b ? "#ff7a7a" : "#7be08a"} k={pk(tau, 0.5)} />}
    </group>
  );
};

// ---------------------------------------------------------------- 11 FALLBACK
export const S11 = ({tau, b, c}) => {
  const APP = [-1.4, Y0, -1.2], PA = [0.35, Y0, -0.95], PB = [0.0, Y0, 0.95], DST = [1.45, Y0, 0.45];
  const down = tau > 2.1;
  const shake = down ? Math.sin(tau * 50) * 0.05 * (1 - prog(tau, 2.1, 2.6)) : 0;
  const bOn = tau > b + 1.1;
  return (
    <group>
      <Wire tau={tau} t0={0.4} a={[-1.1, Y0 + 0.15, -1.15]} b={[-0.1, Y0 + 0.2, -0.95]} color="#ffd23f" lift={0.08} dur={0.4} cut={down} />
      <Wire tau={tau} t0={1.1} a={[0.85, Y0 + 0.15, -0.8]} b={[1.3, Y0 + 0.15, 0.3]} color="#3fd07a" lift={0.08} dur={0.4} cut={down} />
      <Wire tau={tau} t0={b + 0.3} a={[-1.1, Y0 + 0.15, -1.0]} b={[-0.45, Y0 + 0.2, 0.8]} color="#ffd23f" lift={0.08} dur={0.4} />
      <Wire tau={tau} t0={b + 1.0} a={[0.45, Y0 + 0.2, 0.95]} b={[1.3, Y0 + 0.15, 0.55]} color="#3fd07a" lift={0.08} dur={0.4} />
      <Cube p={APP} s={0.6} color="#f4ecdc" text="app" plate font="800 100px Montserrat" k={pk(tau, 0.1)} />
      <Cube p={DST} s={0.6} color="#3fd07a" text="OK" k={pk(tau, 0.2)} />
      <group position={[shake, 0, 0]}>
        <Cube p={PA} s={0.95} color={down ? '#4a4d57' : '#ff6b6b'} text="A" k={pk(tau, 0.15, 0.4)} font="900 130px Montserrat" />
      </group>
      <Cube p={PB} s={0.95} color="#4a9bff" emissive="#4a9bff" ei={bOn ? 0.5 : 0} text="B" k={pk(tau, b - 0.1, 0.4)} font="900 130px Montserrat" />
      <Pkt tau={tau} a={[APP[0], Y0 + 0.7, 0]} b={[PA[0], Y0 + 1.2, PA[2]]} t0={0.5} t1={1.15} color="#ffd23f" h={0.6} />
      <Pkt tau={tau} a={[PA[0], Y0 + 1.2, PA[2]]} b={[DST[0], Y0 + 0.8, 0]} t0={1.15} t1={1.8} color="#3fd07a" h={0.6} />
      {down && [0, 1, 2, 3].map((i) => {
        const q = ((tau - 2.1 - i * 0.25) % 1.0 + 1.0) % 1.0;
        return <mesh key={i} position={[PA[0] + (i - 1.5) * 0.12, Y0 + 1.1 + q * 0.9, PA[2]]} scale={0.18 * Math.sin(Math.PI * q) + 0.02}><sphereGeometry args={[1, 10, 10]} /><meshStandardMaterial color="#8a8f9b" roughness={1} /></mesh>;
      })}
      {tau > 2.3 && <Tx text="FORA DO AR" p={[PA[0], Y0 + 1.75, PA[2]]} w={1.3} fg="#fff" bg="#ff3b4a" font="800 52px Montserrat" k={pk(tau, 2.3)} />}
      <Pkt tau={tau} a={[APP[0], Y0 + 0.7, 0]} b={[PB[0], Y0 + 1.2, PB[2]]} t0={b + 0.4} t1={b + 1.1} color="#ffd23f" h={0.6} />
      <Pkt tau={tau} a={[PB[0], Y0 + 1.2, PB[2]]} b={[DST[0], Y0 + 0.8, 0]} t0={b + 1.1} t1={b + 1.8} color="#3fd07a" h={0.6} />
      {bOn && <Tx text="NO AR" p={[PB[0], Y0 + 1.75, PB[2]]} w={1.0} fg="#fff" bg="#1fae5f" font="800 52px Montserrat" k={pk(tau, b + 1.1)} />}
    </group>
  );
};
