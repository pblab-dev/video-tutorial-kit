import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RBox, Room, Dev, Env, Billboard, FaceLabel} from './World.jsx';
import {prog, easeInOut, easeOut, easeOutBack, lerp, lerp3, clamp, toScreen} from './lib.js';
import {FontGate} from './fonts.jsx';
import data from '../content/piloto/words.json';

const MONT = 'Montserrat, sans-serif';
const MONO = '"JetBrains Mono", monospace';

export const LLM = [1.2, 0.96, 1.5]; // base da peça
export const LLM_TOP = [LLM[0], LLM[1] + 1.45, LLM[2]];
// histórico fica afastado do cubo (sem sobreposição); o cabo liga os dois
export const STACK = [3.4, 0.96, 0.55];
export const RING_C = [2.0, 1.02, 1.3];
export const RING_W = 3.8, RING_D = 3.0;

// cabo preto (como na referência) do histórico até a LLM
const CABLE = new THREE.CatmullRomCurve3(
  [[2.92, 1.12, 0.6], [2.7, 1.07, 0.85], [2.35, 1.07, 0.95], [2.05, 1.14, 0.98], [1.87, 1.3, 1.0]].map((p) => new THREE.Vector3(...p))
);

// câmera: [tempo, alvo, zoom]
const CAM = [
  [0, [-1.9, 1.5, -2.4], 150],
  [1.6, [-1.9, 1.5, -2.4], 150],
  [2.7, [1.75, 1.3, 1.3], 172],
  [9.3, [1.75, 1.3, 1.3], 172],
  [10.2, [2.5, 1.0, 1.0], 150],
  [12.2, [2.5, 1.0, 1.0], 150],
  [13.3, [2.0, 0.6, 1.3], 135],
  [99, [2.0, 0.6, 1.3], 135],
];
export const camAt = (t) => {
  for (let i = 0; i < CAM.length - 1; i++) {
    const [t0, p0, z0] = CAM[i], [t1, p1, z1] = CAM[i + 1];
    if (t >= t0 && t <= t1) {
      const k = easeInOut(prog(t, t0, t1));
      return {target: lerp3(p0, p1, k), zoom: lerp(z0, z1, k)};
    }
  }
  return {target: CAM[0][1], zoom: CAM[0][2]};
};

const CameraRig = ({t}) => {
  const {camera} = useThree();
  const {target, zoom} = camAt(t);
  camera.position.set(target[0] + 12, target[1] + 12, target[2] + 12);
  camera.zoom = zoom;
  camera.near = 0.1; camera.far = 80;
  camera.lookAt(target[0], target[1], target[2]);
  camera.updateProjectionMatrix();
  return null;
};

export const arc = (a, b, k, h = 1.2) => {
  const p = lerp3(a, b, k);
  return [p[0], p[1] + Math.sin(Math.PI * k) * h, p[2]];
};

export const rnd = (i, s = 1) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const Confetti = ({t, t0}) => {
  const tau = t - t0;
  if (tau < 0 || tau > 1.6) return null;
  const cols = ['#ffd23f', '#ff5a4f', '#3fa7ff', '#7be08a', '#c39bff'];
  return (
    <group>
      {Array.from({length: 18}).map((_, i) => {
        const vx = (rnd(i, 1) - 0.5) * 4, vz = (rnd(i, 2) - 0.5) * 4, vy = 2.5 + rnd(i, 3) * 2.5;
        const p = [LLM_TOP[0] + vx * tau, LLM_TOP[1] + vy * tau - 4.5 * tau * tau, LLM_TOP[2] + vz * tau];
        const s = 0.12 * (1 - prog(tau, 1.0, 1.6));
        return (
          <mesh key={i} position={p} rotation={[tau * 6 + i, tau * 5, i]} scale={s}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={cols[i % cols.length]} />
          </mesh>
        );
      })}
    </group>
  );
};

const Puffs = ({t, t0}) => {
  const tau = t - t0;
  if (tau < 0 || tau > 1.3) return null;
  return (
    <group>
      {Array.from({length: 8}).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r = 0.5 + tau * 1.2;
        const s = 0.22 * Math.sin(Math.PI * clamp(tau / 1.3)) + 0.02;
        return (
          <mesh key={i} position={[LLM[0] + Math.cos(a) * r, LLM[1] + 1.4 + tau * 1.1, LLM[2] + Math.sin(a) * r]} scale={s}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#cfd3d9" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
};

const Sheet = ({t, i, tIn}) => {
  const k = easeOut(prog(t, tIn, tIn + 0.55));
  if (t < tIn) return null;
  const end = [STACK[0], STACK[1] + 0.05 + i * 0.1, STACK[2]];
  const start = [STACK[0] + 4, STACK[1] + 3.2, STACK[2] - 4];
  const p = arc(start, end, k, 0.8);
  return (
    <RBox size={[0.95, 0.07, 1.2]} r={0.025} color="#f7f2e7" rough={0.8} position={p} rotation={[0, (rnd(i, 4) - 0.5) * 0.5 + (1 - k) * 1.2, 0]} />
  );
};

// cabo que "cresce" do histórico até a LLM + conectores azuis
const Cable = ({t, t0, t1}) => {
  if (t < t0) return null;
  const k = easeOut(prog(t, t0, t1));
  const N = 36;
  const n = Math.max(2, Math.round(k * N) + 1);
  const pts = CABLE.getPoints(N).slice(0, n);
  const geo = React.useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.06, 8, false), [n]);
  const a = CABLE.getPoint(0), b = CABLE.getPoint(1);
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#5ec2ff" emissive="#2ea0ff" emissiveIntensity={0.55} roughness={0.4} />
      </mesh>
      <RBox size={[0.2, 0.17, 0.2]} r={0.05} color="#ffffff" position={[a.x, a.y, a.z]} rotation={[0, 0.6, 0]} />
      {k > 0.97 && <RBox size={[0.16, 0.2, 0.2]} r={0.05} color="#ffffff" position={[b.x + 0.02, b.y, b.z]} />}
    </group>
  );
};

// pulso de dados percorrendo o cabo
const Pulse = ({t, t0, t1}) => {
  if (t < t0 || t > t1) return null;
  const k = easeInOut(prog(t, t0, t1));
  const p = CABLE.getPoint(k);
  const s = Math.sin(Math.PI * clamp((t - t0) / (t1 - t0))) * 0.5 + 0.5;
  return (
    <mesh position={[p.x, p.y + 0.13, p.z]} scale={s}>
      <sphereGeometry args={[0.13, 14, 14]} />
      <meshStandardMaterial color="#5ec2ff" emissive="#2ea0ff" emissiveIntensity={1.2} />
    </mesh>
  );
};

export const Packet = ({t, a, b, t0, t1, color, text, h = 1.4, size = 0.46, fadeIn = 0.12}) => {
  if (t < t0 || t > t1 + 0.2) return null;
  const k = prog(t, t0, t1);
  const p = arc(a, b, easeInOut(k), h);
  const s = prog(t, t0, t0 + fadeIn) * (1 - prog(t, t1, t1 + 0.2));
  return (
    <group position={p} scale={Math.max(s, 0.001)} rotation={[0, k * 3, 0]}>
      <RBox size={[size, size, size]} r={0.09} color={color} />
      {text && <FaceLabel text={text} half={size / 2} size={size * 0.8} font="900 150px Montserrat" />}
    </group>
  );
};

export const Scene = ({t, bare = false}) => {
  const pop = easeOutBack(prog(t, 2.55, 3.05));
  const bounce = (t0) => 1 + 0.16 * Math.sin(Math.PI * prog(t, t0, t0 + 0.35)) * (1 - prog(t, t0, t0 + 0.35) * 0.3);
  const squash = bounce(4.5) * bounce(6.34);
  const shake = Math.sin(t * 45) * 0.07 * (prog(t, 7.6, 7.8) * (1 - prog(t, 8.7, 9.0)));
  const spin = easeInOut(prog(t, 8.0, 8.9)) * Math.PI * 2;
  const glow = Math.max(0, Math.sin(Math.PI * prog(t, 11.6, 12.4))) * 0.5;
  const ringK = easeOutBack(prog(t, 12.5, 13.1));
  const ringPulse = 1 + 0.02 * Math.sin(t * 6);
  const th = 0.09;
  return (
    <>
      {!bare && (
        <>
      <color attach="background" args={['#ecd0a8']} />
      <hemisphereLight args={['#fff4e6', '#c79a6a', 0.7]} />
      <directionalLight position={[7, 13, 6]} intensity={2.4} color="#fff0dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={40} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      <Env />
      <CameraRig t={t} />
      <Room />
      <Dev t={t} />
        </>
      )}

      {/* peça LLM */}
      {t >= 2.55 && (
        <group position={[LLM[0], LLM[1], LLM[2]]} scale={[pop * (2 - squash), pop * squash, pop * (2 - squash)]}>
          <group position={[0, 0.65, 0]} rotation={[0, spin, shake]}>
            <RBox size={[1.3, 1.3, 1.3]} r={0.22} color="#ff5a4f" emissive="#ff3b30" emissiveIntensity={glow} />
            <FaceLabel text="LLM" half={0.65} size={0.7} plate y={-0.3} font="800 120px Montserrat" />
          </group>
          <mesh position={[0, 1.45 + Math.sin(t * 3) * 0.06, 0]} rotation={[0, t * 2, 0]} scale={[0.17, 0.26, 0.17]} castShadow>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#ffd23f" emissive="#ffb800" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* pergunta entra, resposta sai */}
      <Packet t={t} a={[LLM_TOP[0] - 3, LLM_TOP[1] + 4, LLM_TOP[2] + 3]} b={[LLM_TOP[0], LLM_TOP[1] - 0.3, LLM_TOP[2]]} t0={3.55} t1={4.5} color="#ffd23f" text="?" />
      <Packet t={t} a={[LLM_TOP[0], LLM_TOP[1] - 0.2, LLM_TOP[2]]} b={[LLM_TOP[0] + 3.6, LLM_TOP[1] + 3.2, LLM_TOP[2] - 3.6]} t0={5.0} t1={6.2} color="#3fd07a" text="A" h={1.8} />
      <Confetti t={t} t0={6.34} />
      <Puffs t={t} t0={8.05} />
      {t > 8.0 && t < 9.4 && <Billboard text="???" size={1.6} position={[LLM_TOP[0] + 0.1, LLM_TOP[1] + 1.1, LLM_TOP[2] + 0.1]} scale={easeOutBack(prog(t, 8.0, 8.3)) * (1 - prog(t, 9.1, 9.4))} />}

      {/* histórico: 3 folhas chegam a cada chamada */}
      <Sheet t={t} i={0} tIn={9.85} />
      <Sheet t={t} i={1} tIn={10.45} />
      <Sheet t={t} i={2} tIn={11.0} />
      {/* linha de conexão histórico -> LLM, com pulsos de dados */}
      <Cable t={t} t0={10.7} t1={11.4} />
      {[0, 1, 2].map((i) => (
        <Pulse key={i} t={t} t0={11.5 + i * 0.25} t1={12.0 + i * 0.25} />
      ))}

      {/* "janela" de contexto: moldura amarela em volta de tudo */}
      {t >= 12.5 && (
        <group position={RING_C} scale={[ringK * ringPulse, 1, ringK * ringPulse]}>
          <RBox size={[RING_W, th, th]} r={0.03} color="#ffd23f" emissive="#ffb800" emissiveIntensity={0.6} position={[0, 0, -RING_D / 2]} />
          <RBox size={[RING_W, th, th]} r={0.03} color="#ffd23f" emissive="#ffb800" emissiveIntensity={0.6} position={[0, 0, RING_D / 2]} />
          <RBox size={[th, th, RING_D]} r={0.03} color="#ffd23f" emissive="#ffb800" emissiveIntensity={0.6} position={[-RING_W / 2, 0, 0]} />
          <RBox size={[th, th, RING_D]} r={0.03} color="#ffd23f" emissive="#ffb800" emissiveIntensity={0.6} position={[RING_W / 2, 0, 0]} />
        </group>
      )}
    </>
  );
};

// ---------- HUD (HTML) ----------
const TERMINAL = [
  [0.0, 'integra o sistema com a API da LLM'],
  [3.4, 'manda uma pergunta, recebe a resposta'],
  [7.5, 'a LLM não guarda memória'],
  [9.4, 'manda o histórico em toda chamada'],
];

const KEYWORDS = ['llm', 'api', 'histórico', 'esquece', 'janela', 'contexto', 'pergunta', 'responde'];

const TERM_FONT = 22; // px
const TERM_CHAR = TERM_FONT * 0.6;

export const Terminal = ({t, lines = TERMINAL}) => {
  let cur = lines[0];
  for (const l of lines) if (t >= l[0]) cur = l;
  const n = Math.floor((t - cur[0]) * 34);
  const txt = cur[1].slice(0, Math.max(0, n));
  const blink = Math.floor(t * 2.5) % 2 === 0;
  return (
    <div style={{position: 'absolute', top: 96, left: 38, right: 38, background: '#17171d', borderRadius: 16, padding: '12px 22px 16px', boxShadow: '0 8px 24px rgba(0,0,0,.35)', overflow: 'hidden'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10}}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 12, height: 12, borderRadius: 6, background: c}} />)}
        <div style={{marginLeft: 14, fontFamily: MONO, fontWeight: 500, fontSize: 14, color: '#7d7d8a'}}>claude — ~/app-ia</div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: TERM_FONT, color: '#f1f1f4', whiteSpace: 'nowrap', height: 30}}>
        <span style={{color: '#ffc233', marginRight: TERM_CHAR}}>&gt;</span>
        <span style={{whiteSpace: 'pre'}}>{txt}</span>
        <span style={{display: 'inline-block', width: TERM_CHAR * 0.8, height: TERM_FONT * 1.05, marginLeft: 2, background: blink ? '#ff9f1a' : 'transparent'}} />
      </div>
    </div>
  );
};

export const Counter0 = ({t}) => {
  const done = t >= 13.6;
  const sc = done ? 1 + 0.25 * Math.sin(Math.PI * prog(t, 13.6, 14.1)) : 1;
  return (
    <div style={{position: 'absolute', top: 40, right: 30, background: '#fff', color: '#17171d', borderRadius: 12, padding: '7px 18px', fontFamily: MONT, fontWeight: 800, fontSize: 21, transform: `scale(${sc})`, transformOrigin: 'right center', boxShadow: '0 3px 10px rgba(0,0,0,.25)'}}>
      PEÇAS {done ? 1 : 0}/13
    </div>
  );
};

const Caption = ({t}) => {
  const ws = data.words;
  let idx = -1;
  for (let i = 0; i < ws.length; i++) if (ws[i].s - 0.03 <= t) idx = i;
  if (idx < 0) return null;
  const w = ws[idx];
  const next = ws[idx + 1];
  const hideAt = Math.min(w.e + 0.35, next ? next.s : 1e9);
  if (t > hideAt && !(idx === ws.length - 1 && t < w.e + 0.6)) return null;
  const clean = w.w.replace(/[.,!?…]/g, '');
  const hl = KEYWORDS.includes(clean.toLowerCase());
  const k = easeOutBack(prog(t, w.s - 0.03, w.s + 0.1));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 842, textAlign: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 56, lineHeight: 1.1, color: hl ? '#ffd23f' : '#fff', textShadow: '0 3px 10px rgba(0,0,0,.55), 0 1px 2px rgba(0,0,0,.6)', transform: `scale(${0.8 + 0.2 * k})`}}>
      {clean}
    </div>
  );
};

// etiqueta "pílula" ancorada num ponto 3D (como "● FORA DO AR" da referência)
const Tag = ({t, t0, t1 = 999, at, text, dot = '#ff3b4a', w, h}) => {
  if (t < t0 || t > t1) return null;
  const {target, zoom} = camAt(t);
  const [x, y] = toScreen(at, target, zoom, w, h);
  const k = easeOutBack(prog(t, t0, t0 + 0.3)) * (1 - prog(t, t1 - 0.2, t1));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) scale(${Math.max(k, 0.001)})`, transformOrigin: '50% 100%', background: '#fff', color: '#17171d', borderRadius: 999, padding: '7px 20px 7px 16px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONT, fontWeight: 800, fontSize: 22, letterSpacing: 0.3, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,.3)'}}>
      <span style={{width: 13, height: 13, borderRadius: 7, background: dot}} />
      {text}
    </div>
  );
};

export const FPS = 30;
export const PILOTO_DURATION = Math.ceil((data.duration + 0.7) * FPS);

export const Piloto = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame / FPS;
  const ringBack = [RING_C[0] - RING_W / 2, RING_C[1] + 0.12, RING_C[2] - RING_D / 2];
  return (
    <AbsoluteFill style={{background: '#ecd0a8'}}>
      <Audio src={staticFile('piloto/voz.mp3')} />
      <FontGate>
        <ThreeCanvas width={width} height={height} orthographic shadows camera={{position: [10, 10, 10], zoom: 150, near: 0.1, far: 80}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping}}>
          <Scene t={t} />
        </ThreeCanvas>
        <Tag t={t} t0={10.5} at={[STACK[0], STACK[1] + 0.75, STACK[2]]} text="HISTÓRICO" dot="#5ec2ff" w={width} h={height} />
        <Tag t={t} t0={12.7} at={ringBack} text="JANELA DE CONTEXTO" dot="#ffc233" w={width} h={height} />
        <Terminal t={t} />
        <Counter t={t} />
        <Caption t={t} />
        <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.85)', fontFamily: MONT, fontWeight: 700, fontSize: 22, textShadow: '0 2px 6px rgba(0,0,0,.6)'}}>@idielsilva</div>
      </FontGate>
    </AbsoluteFill>
  );
};
