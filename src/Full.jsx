import React, {useMemo, useRef, useLayoutEffect} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {Room, Dev, Env} from './World.jsx';
import {prog, easeInOut, easeOutBack, lerp, lerp3, clamp, toScreen} from './lib.js';
import {FontGate} from './fonts.jsx';
import {Scene as Scene0, camAt as camAt0, Terminal, STACK, RING_C, RING_W, RING_D} from './Piloto.jsx';
import {Base, Burst, Link, Cube, LabelCtx} from './kit.jsx';
import {S2, S3, S4, S5} from './stationsA.jsx';
import {S6, S7, S8, S9, S10, S11} from './stationsB.jsx';
import {S12, S13} from './stationsC.jsx';
import {Hub, HUB_X, HUB_CAM} from './hub.jsx';
import tl from '../content/completo/timeline.json';

const MONT = 'Montserrat, sans-serif';
export const FPS = 30;
export const FULL_DURATION = Math.ceil((tl.duration + 0.9) * FPS);

// ---------- linha do tempo dos passos (a partir das palavras da voz) ----------
const norm = (w) => w.toLowerCase().replace(/[.,!?:;…]/g, '');
const STEP_X = (s) => 7.4 + 4.7 * (s - 2);
const COLORS = {
  2: '#4aa8ff', 3: '#b07cff', 4: '#19c3b0', 5: '#ff9a3d', 6: '#ff5a8a', 7: '#8fd96b',
  8: '#35c6e8', 9: '#5a6f9a', 10: '#6e8bff', 11: '#ff6b6b', 12: '#9b6bff', 13: '#4f7cff',
};
const COMP = {2: S2, 3: S3, 4: S4, 5: S5, 6: S6, 7: S7, 8: S8, 9: S9, 10: S10, 11: S11, 12: S12, 13: S13};
const TERM = {
  2: ['ela não conhece seus documentos', 'busca os trechos certos e manda junto'],
  3: ['como achar o trecho certo?', 'transforma o texto em vetores'],
  4: ['comparar milhões de vetores é lento', 'guarda tudo num banco vetorial'],
  5: ['ela só fala, não executa nada', 'deixa a LLM chamar suas funções'],
  6: ['uma chamada só não resolve tudo', 'loop: pensa -> age -> observa'],
  7: ['a resposta vem em texto solto', 'exige JSON no formato certo'],
  8: ['o usuário espera 10s olhando a tela', 'manda a resposta token por token'],
  9: ['ela pode vazar dados ou errar feio', 'filtra a entrada e a saída'],
  10: ['o prompt gigante é cobrado sempre', 'reaproveita o prefixo em cache'],
  11: ['o provedor caiu', 'troca de modelo automaticamente'],
  12: ['mudou o prompt: melhorou ou piorou?', 'testa casos reais e mede'],
  13: ['deu erro e ninguém sabe o porquê', 'registra cada chamada, custo e tempo'],
};
const TAG_Y = {2: 3.0, 3: 3.3, 4: 3.0, 5: 3.0, 6: 2.6, 7: 3.1, 8: 3.0, 9: 3.2, 10: 3.0, 11: 3.0, 12: 3.0, 13: 3.1};

export const STEPS = [];
for (let s = 2; s <= 13; s++) {
  const seg = tl.segments[s - 1];
  const ws = seg.words;
  const iThen = ws.findIndex((w) => norm(w.w) === 'então');
  const iThis = ws.findIndex((w) => /^ess[ea]s?$/.test(norm(w.w)));
  STEPS.push({
    s, X: STEP_X(s), tag: seg.tag, color: COLORS[s],
    tA: seg.start, tB: ws[iThen].s, tC: ws[iThis].s, tE: seg.start + seg.dur,
    hlFrom: iThis + 3, words: ws,
  });
}
const INTRO_END = tl.segments[0].dur;
const FECHO = tl.segments[tl.segments.length - 1];

// ---------- câmera ----------
const stTarget = (X) => [X - 0.2, 0.95, 1.2];
const KEYS = [[13.3, [2.0, 0.6, 1.3], 135], [INTRO_END - 0.2, [2.0, 0.6, 1.3], 135]];
STEPS.forEach((st) => {
  KEYS.push([st.tA + 0.55, stTarget(st.X), 142]);
  KEYS.push([st.tE - 0.15, stTarget(st.X), 142]);
});
KEYS.push([FECHO.start + 0.1, stTarget(STEP_X(13)), 142]);
KEYS.push([FECHO.start + 1.5, HUB_CAM, 76]);
KEYS.push([FECHO.start + 6.0, HUB_CAM, 78]);
KEYS.push([9999, HUB_CAM, 78]);
export const camAt = (t) => {
  if (t <= 13.3) return camAt0(t);
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [t0, p0, z0] = KEYS[i], [t1, p1, z1] = KEYS[i + 1];
    if (t >= t0 && t <= t1) {
      const k = easeInOut(prog(t, t0, t1));
      return {target: lerp3(p0, p1, k), zoom: lerp(z0, z1, k)};
    }
  }
  return {target: KEYS[KEYS.length - 1][1], zoom: KEYS[KEYS.length - 1][2]};
};

const CameraRig = ({cam}) => {
  const {camera} = useThree();
  const {target, zoom} = cam;
  camera.position.set(target[0] + 12, target[1] + 12, target[2] + 12);
  camera.zoom = zoom;
  camera.near = 0.1; camera.far = 90;
  camera.lookAt(target[0], target[1], target[2]);
  camera.updateProjectionMatrix();
  return null;
};

const Lights = ({target}) => {
  const ref = useRef();
  const tgt = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => { ref.current.target = tgt; }, [tgt]);
  tgt.position.set(target[0], 0, target[2]);
  tgt.updateMatrixWorld();
  return (
    <>
      <primitive object={tgt} />
      <directionalLight ref={ref} position={[target[0] + 7, 13, target[2] + 6]} intensity={2.4} color="#fff0dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={1} shadow-camera-far={45} shadow-bias={-0.0004} shadow-normalBias={0.03} />
    </>
  );
};

const World = ({t}) => {
  const cam = camAt(t);
  const cx = cam.target[0];
  return (
    <>
      <color attach="background" args={['#ecd0a8']} />
      <hemisphereLight args={['#fff4e6', '#c79a6a', 0.7]} />
      <Lights target={cam.target} />
      <Env />
      <CameraRig cam={cam} />
      <Room end={76} />
      <Dev t={t} />
      {Math.abs(cx - 2) < 12 && <Scene0 t={Math.min(t, 15)} bare />}
      {t >= FECHO.start - 0.2 && <Hub tau={t - FECHO.start} />}
      {STEPS.map((st, i) => {
        const prevRight = st.s === 2 ? 3.95 : STEP_X(st.s - 1) + 1.7;
        const vis = t >= st.tA - 0.35 && Math.abs(cx - st.X) < 11;
        if (!vis) return null;
        const C = COMP[st.s];
        const tau = t - st.tA;
        const flash = Math.sin(Math.PI * prog(t, st.tC, st.tC + 0.6));
        return (
          <React.Fragment key={st.s}>
            <group position={[st.X, 1.01, 1.2]}>
              <Base color={st.color} k={easeOutBack(prog(tau, -0.3, 0.3))} flash={flash} />
              <LabelCtx.Provider value={1 - prog(t, st.tE + 0.1, st.tE + 0.6)}>
                <C tau={tau} b={st.tB - st.tA} c={st.tC - st.tA} e={st.tE - st.tA} />
              </LabelCtx.Provider>
              <Burst tau={tau} c={st.tC - st.tA} />
            </group>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---------- HUD ----------
const TERM0 = [
  [0.0, 'integra o sistema com a API da LLM'],
  [3.4, 'manda uma pergunta, recebe a resposta'],
  [7.5, 'a LLM não guarda memória'],
  [9.4, 'manda o histórico em toda chamada'],
];
const TERMINAL_LINES = [...TERM0];
STEPS.forEach((st) => {
  TERMINAL_LINES.push([st.tA + 0.1, TERM[st.s][0]]);
  TERMINAL_LINES.push([st.tB + 0.05, TERM[st.s][1]]);
});
TERMINAL_LINES.push([FECHO.start + 0.1, 'agente de IA integrado no seu app']);

const KW0 = ['llm', 'api', 'histórico', 'esquece', 'janela', 'contexto', 'pergunta', 'responde'];
const KWF = ['agente', 'ia', 'tutoriais'];
const ALLW = [];
tl.segments.forEach((seg, si) => {
  const ws = seg.words;
  const st = STEPS.find((x) => x.s === si + 1 && si >= 1 && si <= 12);
  ws.forEach((w, i) => {
    let hl = false;
    if (si === 0) hl = KW0.includes(norm(w.w));
    else if (st) hl = i >= st.hlFrom;
    else hl = KWF.includes(norm(w.w));
    ALLW.push({...w, hl});
  });
});

const Caption = ({t}) => {
  const ws = ALLW;
  let idx = -1;
  for (let i = 0; i < ws.length; i++) if (ws[i].s - 0.03 <= t) idx = i;
  if (idx < 0) return null;
  const w = ws[idx];
  const next = ws[idx + 1];
  const hideAt = Math.min(w.e + 0.35, next ? next.s : 1e9);
  if (t > hideAt && !(idx === ws.length - 1 && t < w.e + 0.6)) return null;
  const clean = w.w.replace(/[.,!?…:;]/g, '');
  const k = easeOutBack(prog(t, w.s - 0.03, w.s + 0.1));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 842, textAlign: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 56, lineHeight: 1.1, color: w.hl ? '#ffd23f' : '#fff', textShadow: '0 3px 10px rgba(0,0,0,.55), 0 1px 2px rgba(0,0,0,.6)', transform: `scale(${0.8 + 0.2 * k})`}}>
      {clean}
    </div>
  );
};

const Counter = ({t}) => {
  const times = [13.6, ...STEPS.map((s) => s.tC + 0.3)];
  const n = times.filter((x) => t >= x).length;
  const last = times.filter((x) => t >= x).pop();
  const sc = last !== undefined && t - last < 0.5 ? 1 + 0.25 * Math.sin(Math.PI * prog(t, last, last + 0.5)) : 1;
  return (
    <div style={{position: 'absolute', top: 40, right: 30, background: '#fff', color: '#17171d', borderRadius: 12, padding: '7px 18px', fontFamily: MONT, fontWeight: 800, fontSize: 21, transform: `scale(${sc})`, transformOrigin: 'right center', boxShadow: '0 3px 10px rgba(0,0,0,.25)'}}>
      PEÇAS {n}/13
    </div>
  );
};

const Tag = ({t, t0, t1 = 99999, at, text, dot = '#ff3b4a', w, h}) => {
  if (t < t0 || t > t1) return null;
  const {target, zoom} = camAt(t);
  const [x, yy] = toScreen(at, target, zoom, w, h);
  const y = Math.max(yy, 330);
  const k = easeOutBack(prog(t, t0, t0 + 0.3)) * (1 - prog(t, t1 - 0.2, t1));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) scale(${Math.max(k, 0.001)})`, transformOrigin: '50% 100%', background: '#fff', color: '#17171d', borderRadius: 999, padding: '7px 20px 7px 16px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONT, fontWeight: 800, fontSize: 22, letterSpacing: 0.3, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,.3)'}}>
      <span style={{width: 13, height: 13, borderRadius: 7, background: dot}} />
      {text}
    </div>
  );
};

const CTA = ({t}) => {
  const t0 = FECHO.start + 5.7;
  if (t < t0) return null;
  const k = easeOutBack(prog(t, t0, t0 + 0.5));
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'rgba(18,18,26,0.45)', opacity: prog(t, t0, t0 + 0.5)}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', transform: `scale(${Math.max(k, 0.001)})`, fontFamily: MONT}}>
        <div style={{display: 'inline-block', background: '#fff', borderRadius: 28, padding: '30px 46px', boxShadow: '0 12px 40px rgba(0,0,0,.4)'}}>
          <div style={{fontWeight: 900, fontSize: 46, color: '#17171d', lineHeight: 1.1}}>Agente de IA<br />em 13 passos</div>
          <div style={{marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 10, background: '#17171d', color: '#fff', borderRadius: 999, padding: '10px 26px', fontWeight: 800, fontSize: 30}}>
            <span style={{width: 14, height: 14, borderRadius: 7, background: '#ff3b4a'}} />@idielsilva
          </div>
        </div>
      </div>
    </>
  );
};

export const Full = ({tList} = {}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = tList ? tList[frame] : frame / FPS;
  const ringBack = [RING_C[0] - RING_W / 2, RING_C[1] + 0.12, RING_C[2] - RING_D / 2];
  return (
    <AbsoluteFill style={{background: '#ecd0a8'}}>
      {!tList && <Audio src={staticFile("completo/voz.mp3")} />}
      <FontGate>
        <ThreeCanvas width={width} height={height} orthographic shadows camera={{position: [10, 10, 10], zoom: 150, near: 0.1, far: 90}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping}}>
          <World t={t} />
        </ThreeCanvas>
        <Tag t={t} t0={10.5} t1={INTRO_END + 0.2} at={[STACK[0], STACK[1] + 0.75, STACK[2]]} text="HISTÓRICO" dot="#5ec2ff" w={width} h={height} />
        <Tag t={t} t0={12.7} t1={INTRO_END + 0.2} at={ringBack} text="JANELA DE CONTEXTO" dot="#ffc233" w={width} h={height} />
        {STEPS.map((st) => (
          <Tag key={st.s} t={t} t0={st.tC} t1={st.tE + 0.1} at={[st.X, 1.13 + (TAG_Y[st.s] || 3.4), 1.2]} text={st.tag} dot={st.color} w={width} h={height} />
        ))}
        <Terminal t={t} lines={TERMINAL_LINES} />
        <Counter t={t} />
        <CTA t={t} />
        <Caption t={t} />
        <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.85)', fontFamily: MONT, fontWeight: 700, fontSize: 22, textShadow: '0 2px 6px rgba(0,0,0,.6)'}}>@idielsilva</div>
      </FontGate>
    </AbsoluteFill>
  );
};
