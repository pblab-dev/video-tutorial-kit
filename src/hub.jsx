import React, {useMemo} from 'react';
import * as THREE from 'three';
import {BILLBOARD} from './World.jsx';
import {RBox} from './World.jsx';
import {prog, easeOutBack, easeOut} from './lib.js';
import {Cube, MiniLLM, Wire, Burst, pk} from './kit.jsx';

// Cena final: arquitetura completa, com o fluxo REAL (não é tudo ligado na LLM):
//  entrada : Embeddings -> Vetorial -> RAG -> Contexto -> LLM ;  Cache -> LLM
//  LLM     : <-> Tools ; <-> Fallback
//  saída   : LLM -> Guardrails -> JSON -> Streaming
//  observ. : Logs (observa a LLM) e Evals (observa a saída) com linha tracejada
//  AGENTE  : isolado, sem cabos — é o resultado de integrar tudo (entra por último)
export const HUB_X = 65.4;
export const HUB_CAM = [HUB_X + 1.0, 1.0, 2.2]; // alvo da câmera (sobe a cena p/ não bater na legenda)
export const AGENT_T = 4.0; // segundos desde o início do fecho (narração: "integrado")

// Layout em coordenadas de TELA (v = direita, u = para baixo/frente) convertidas p/ o mundo (x,z)
const R2 = Math.SQRT1_2;
const cv = ([v, u]) => [(u + v) * R2, (u - v) * R2];

// id: [rótulo, cor, [v,u]]
const M = {
  EMB: ['EMBEDDINGS', '#b07cff', [-1.9, -4.4]],
  VET: ['VETORIAL', '#19c3b0', [1.9, -4.4]],
  RAG: ['RAG', '#4aa8ff', [2.3, -2.8]],
  CTX: ['CONTEXTO', '#5ec2ff', [0, -2.3]],
  CACHE: ['CACHE', '#6e8bff', [-2.3, -2.0]],
  TOOLS: ['TOOLS', '#ff9a3d', [-2.3, 1.8]],
  FALL: ['FALLBACK', '#ff6b6b', [-2.3, 3.4]],
  GUARD: ['GUARDRAILS', '#5a6f9a', [2.3, 0.0]],
  JSON: ['JSON', '#8fd96b', [2.3, 1.6]],
  STREAM: ['STREAMING', '#35c6e8', [2.3, 3.2]],
  EVALS: ['EVALS', '#9b6bff', [0, 2.6]],
  LOGS: ['LOGS', '#4f7cff', [-2.3, -0.1]],
};
// ordem de entrada em cena
const ORDER = ['EMB', 'VET', 'RAG', 'CTX', 'CACHE', 'LOGS', 'TOOLS', 'FALL', 'GUARD', 'JSON', 'STREAM', 'EVALS'];
const LLM = [0, 0];
const AGENT = ['AGENTE', '#ffcb2f', [0, 5.0]];

// [de, para, dir (1 de->para, 0 vai e volta), tracejado]
const EDGES = [
  ['EMB', 'VET', 1], ['VET', 'RAG', 1], ['RAG', 'CTX', 1], ['CTX', 'LLM', 1],
  ['CACHE', 'LLM', 1], ['TOOLS', 'LLM', 0], ['FALL', 'LLM', 0],
  ['LLM', 'GUARD', 1], ['GUARD', 'JSON', 1], ['JSON', 'STREAM', 1],
  ['EVALS', 'JSON', 1, true], ['LOGS', 'LLM', 1, true],
];

// pílula de texto com largura proporcional ao texto (escala constante entre rótulos)
const PU = 0.0037; // unidades por pixel do canvas
const pillCache = new Map();
const pillTex = (text) => {
  if (pillCache.has(text)) return pillCache.get(text);
  const g0 = document.createElement('canvas').getContext('2d');
  g0.font = '800 46px Montserrat';
  const tw = Math.ceil(g0.measureText(text).width);
  const W = tw + 56, H = 84;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(2, 2, W - 4, H - 4, 40); g.fill();
  g.font = '800 46px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#17171d'; g.fillText(text, W / 2, H / 2 + 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const r = {tex, W, H};
  pillCache.set(text, r);
  return r;
};
const Pill = ({text, p, k = 1}) => {
  const {tex, W, H} = useMemo(() => pillTex(text), [text]);
  if (k <= 0.003) return null;
  return (
    <mesh position={p} rotation={BILLBOARD} scale={k}>
      <planeGeometry args={[W * PU, H * PU]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// linha tracejada (observador): bolinhas pequenas ao longo da reta, sem pulsos de dado
const Dash = ({tau, t0, a, b, color = '#ffffff', dur = 0.4}) => {
  const k = easeOut(prog(tau, t0, t0 + dur));
  if (k < 0.02) return null;
  const n = 11;
  const m = Math.max(1, Math.round(k * n));
  return (
    <group>
      {Array.from({length: m}).map((_, i) => {
        const f = (i + 0.5) / n;
        const y = a[1] + (b[1] - a[1]) * f + 0.12 * Math.sin(Math.PI * f);
        return (
          <mesh key={i} position={[a[0] + (b[0] - a[0]) * f, y, a[2] + (b[2] - a[2]) * f]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
};

const hyp = (dx, dz) => Math.hypot(dx, dz) || 1;

export const Hub = ({tau}) => {
  // tau = segundos desde o início do fecho
  const T0 = 0.55, DT = 0.21;
  const base = easeOutBack(prog(tau, 0.0, 0.5));
  const llmK = easeOutBack(prog(tau, 0.3, 0.8));
  const spin = Math.sin(tau * 1.2) * 0.12;
  const tOf = {LLM: 0.3};
  ORDER.forEach((id, i) => { tOf[id] = T0 + i * DT; });
  const posVU = (id) => (id === 'LLM' ? LLM : M[id][2]);
  const rad = (id) => (id === 'LLM' ? 0.8 : 0.42);
  const ay = (id) => (id === 'LLM' ? 0.75 : 0.45);

  // agente isolado (sem cabos)
  const aK = easeOutBack(prog(tau, AGENT_T, AGENT_T + 0.5));
  const glow = 0.35 + 0.25 * Math.sin(tau * 4);
  const [ax, az] = cv(AGENT[2]);

  return (
    <group position={[HUB_X, 1.01, 1.2]}>
      <group rotation={[0, Math.PI / 4, 0]} position={[0, 0, 0.5 * 0]} scale={[Math.max(base, 0.001), 1, Math.max(base, 0.001)]}>
        <RBox size={[7.8, 0.12, 11.6]} r={0.06} color="#3b4064" position={[0, 0.06, 0.25]} />
        <RBox size={[7.1, 0.05, 10.9]} r={0.05} color="#4a5080" position={[0, 0.13, 0.25]} />
      </group>
      <MiniLLM p={[0, 0.14, 0]} k={llmK} s={1.3} ei={0.25 + 0.2 * Math.sin(tau * 3)} spin={spin} />
      <Pill text="LLM" p={[0.2, 2.0, 0.2]} k={pk(tau, 0.7, 0.3)} />

      {ORDER.map((id) => {
        const [label, color, vu] = M[id];
        const [x, z] = cv(vu);
        const t0 = tOf[id];
        return (
          <React.Fragment key={id}>
            <Cube p={[x, 0.14, z]} s={0.55} color={color} k={pk(tau, t0, 0.35)} ei={0.1} />
            <Pill text={label} p={[x, 1.1, z]} k={pk(tau, t0 + 0.1, 0.3)} />
          </React.Fragment>
        );
      })}

      {EDGES.map(([f, t, dir, dashed], i) => {
        const [fx, fz] = cv(posVU(f)), [tx, tz] = cv(posVU(t));
        const dx = tx - fx, dz = tz - fz;
        const d = hyp(dx, dz);
        const ux = dx / d, uz = dz / d;
        const a = [fx + ux * rad(f), ay(f), fz + uz * rad(f)];
        const b = [tx - ux * rad(t), ay(t), tz - uz * rad(t)];
        const tw = Math.max(tOf[f], tOf[t]) + 0.12;
        const color = M[f] ? M[f][1] : M[t][1];
        return dashed
          ? <Dash key={i} tau={tau} t0={tw} a={a} b={b} color={color} />
          : <Wire key={i} tau={tau} t0={tw} a={a} b={b} color={color} lift={0.16} dur={0.35} dir={dir} pulses={2} speed={0.6} r={0.04} />;
      })}

      {/* AGENTE: sozinho, sem nenhum cabo — o resultado de integrar todo o resto */}
      {aK > 0.003 && (
        <group position={[ax, 0.14, az]}>
          <group rotation={[0, Math.PI / 4, 0]}>
            <RBox size={[1.7, 0.1, 1.7]} r={0.05} color="#ffe28a" position={[0, 0, 0]} />
          </group>
          <Cube p={[0, 0.05, 0]} s={0.85} color={AGENT[1]} k={aK} ei={glow} />
          <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={aK * (1 + 0.04 * Math.sin(tau * 4))}>
            <torusGeometry args={[0.95, 0.03, 8, 48]} />
            <meshStandardMaterial color="#ffd23f" emissive="#ffd23f" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}
      <Pill text="AGENTE" p={[ax, 1.7, az]} k={pk(tau, AGENT_T + 0.15, 0.3)} />
      <Burst tau={tau} c={AGENT_T + 0.2} p={[ax, 1.4, az]} />
    </group>
  );
};
