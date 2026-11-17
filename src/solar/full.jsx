import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SolarStory} from './story.jsx';
import {FontGate} from '../fonts.jsx';
import {MONT} from './concept.jsx';
import TL from '../../content/solar/timeline.json';

export const FPS = 30;
const TAIL = 1.9;
export const SOLAR_DURATION = Math.ceil((TL.duration + TAIL + 0.3) * FPS);
const SEGS = TL.segments;

const clamp = (x) => Math.min(1, Math.max(0, x));
const norm = (w) => w.toLowerCase().replace(/[.,!?:;…]/g, '');

// ancoras [tau real da cena (s), u de design da animação]
const ANCH = {
  gancho: [[0, 0], [8.7, 8.7]],
  on: [[0, 0], [1.7, 1.0], [3.2, 3.2], [3.8, 3.8], [5.0, 5.6], [5.9, 6.8], [7.2, 7.0], [7.9, 7.3], [8.9, 7.7], [9.9, 9.0], [11.3, 12]],
  off: [[0, 0], [2.3, 0.8], [4.4, 3.6], [5.4, 5.4], [6.1, 6.2], [6.7, 6.8], [7.6, 7.3], [8.3, 7.8], [9.3, 9.5], [10.76, 12]],
  apagao: [[0, 0], [1.6, 1.6], [3.3, 3.5], [3.7, 3.65], [5.9, 4.4], [7.47, 6.0]],
  custo: [[0, 0], [1.9, 1.0], [2.9, 2.8], [3.9, 3.6], [5.2, 5.0], [6.2, 6.4], [8.96, 10]],
  fecho: [[0, 0], [1.3, 1.0], [2.3, 1.4], [3.8, 3.2], [6.0, 5.6], [7.2, 7.4], [8.7, 9.5], [9.8, 9.9], [11.9, 10.0], [12.8, 11.0], [13.3, 12.6], [14.8, 15]],
};
const warp = (id, tau) => {
  const A = ANCH[id];
  if (tau <= A[0][0]) return A[0][1];
  for (let i = 1; i < A.length; i++) {
    if (tau <= A[i][0]) { const k = (tau - A[i - 1][0]) / (A[i][0] - A[i - 1][0]); return A[i - 1][1] + k * (A[i][1] - A[i - 1][1]); }
  }
  return A[A.length - 1][1] + (tau - A[A.length - 1][0]);
};

const KW = new Set(['on-grid', 'off-grid', 'rede', 'bateria', 'apagão', 'híbrido', 'sol', 'crédito', 'inversor', 'painel', 'controlador', 'cara', 'nublados', 'cidade', 'sítio', 'erro', 'pergunta', 'solar']);
const ALLW = SEGS.flatMap((s) => s.words.map((w) => ({...w, hl: KW.has(norm(w.w))})));
const sceneIndex = (t) => {
  let si = 0;
  for (let i = 1; i < SEGS.length; i++) if (t >= SEGS[i].start - 0.2) si = i;
  return si;
};
const easeOutBack = (k) => { const c = 1.70158 + 1; return 1 + c * Math.pow(k - 1, 3) + (c - 1) * Math.pow(k - 1, 2); };
const prog = (t, a, b) => clamp((t - a) / (b - a));

const Karaoke = ({t}) => {
  let idx = -1;
  for (let i = 0; i < ALLW.length; i++) if (ALLW[i].s - 0.03 <= t) idx = i;
  if (idx < 0) return null;
  const w = ALLW[idx], next = ALLW[idx + 1];
  const hideAt = Math.min(w.e + 0.35, next ? next.s : 1e9);
  if (t > hideAt && !(idx === ALLW.length - 1 && t < w.e + 0.6)) return null;
  const k = easeOutBack(prog(t, w.s - 0.03, w.s + 0.1));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 900, textAlign: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 60, lineHeight: 1.1, color: w.hl ? '#ffd23f' : '#fff', textShadow: '0 3px 12px rgba(0,0,0,.6), 0 1px 2px rgba(0,0,0,.7)', transform: `scale(${0.8 + 0.2 * k})`}}>
      {w.w.replace(/[.,!?…:;]/g, '')}
    </div>
  );
};

export const SolarFull = ({tList, audio = 'solar/voz.mp3'}) => {
  const frame = useCurrentFrame();
  const t = tList ? tList[frame] : frame / FPS;
  const si = sceneIndex(t);
  const seg = SEGS[si];
  const tau = Math.max(0, t - seg.start);
  const u = warp(seg.id, tau);
  const nextStart = si < SEGS.length - 1 ? SEGS[si + 1].start - 0.2 : 1e9;
  const veil = Math.max(si > 0 ? 1 - prog(t, seg.start - 0.2, seg.start + 0.12) : 0, prog(t, nextStart - 0.14, nextStart));
  const cta = seg.id === 'fecho' ? easeOutBack(prog(tau, 11.9 + 1.4, 11.9 + 1.9)) : 0;
  return (
    <AbsoluteFill style={{background: '#bfe3f7'}}>
      {!tList && <Audio src={staticFile(audio)} />}
      <SolarStory scene={seg.id} uFixed={u} capNode={<Karaoke t={t} />} />
      <FontGate>
        <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center', fontFamily: MONT, fontWeight: 800, color: 'rgba(255,255,255,.92)', fontSize: 22, textShadow: '0 2px 6px rgba(0,0,0,.6)', opacity: 1 - cta}}>@idielsilva</div>
      </FontGate>
      <div style={{position: 'absolute', inset: 0, background: '#1a1f36', opacity: veil, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
