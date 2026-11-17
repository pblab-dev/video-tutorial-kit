import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {RBox, Env} from '../World.jsx';
import {prog, easeInOut, easeOut, easeOutBack, lerp, lerp3, clamp} from '../lib.js';
import {FontGate} from '../fonts.jsx';
import {pk, rn, arc3, fade} from '../kit.jsx';
import {THEMES, ThemeCtx, CamCtx, useTheme, Scenery, Lights, pillTex, letterTex, haloTex, mk} from './theme.jsx';
import {kf, camAt, CameraRig, FaceP, Halo, Beam, Blender, Seal, Confetti, GeoScene} from './geo.jsx';
import tl from '../../content/seo-geo-aeo/timeline_v2.json';
import teaser from '../../content/seo-geo-aeo/teaser.json';

const MONT = 'Montserrat, sans-serif';
export const FPS = 30;
const SEGS = tl.segments;
const byId = Object.fromEntries(SEGS.map((s) => [s.id, s]));
export const SEOGEO_DURATION = Math.ceil((tl.duration + 1.6) * FPS);
const norm = (w) => w.toLowerCase().replace(/[.,!?:;…]/g, '');
// tempo (relativo ao início do segmento) da n-ésima palavra que começa com `w`
const wt = (id, w, nth = 0) => {
  const s = byId[id];
  const m = s.words.filter((x) => norm(x.w).startsWith(w));
  return m[nth].s - s.start;
};

// ---------- texturas novas ----------
const listCardTex = (th) =>
  mk(`listcard|${th.id}`, 768, 512, (g, W, H) => {
    g.fillStyle = th.cardBg; g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, 44); g.fill();
    g.strokeStyle = th.id === 'noite' ? th.accent : 'rgba(0,0,0,.18)'; g.lineWidth = 6; g.stroke();
    g.fillStyle = th.cardFg; g.font = '800 40px Montserrat'; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillText('RESPOSTA DA IA', 48, 70);
    g.fillStyle = th.gold; g.beginPath(); g.arc(W - 70, 70, 18, 0, 7); g.fill();
    g.fillStyle = th.cardBar;
    [[110, 0.9], [160, 0.75]].forEach(([y, f]) => { g.beginPath(); g.roundRect(48, y + 10, (W - 96) * f, 22, 11); g.fill(); });
    const cols = [th.pal.blog, th.pal.wiki, th.pal.news];
    ['MARCA A', 'MARCA B', 'MARCA C'].forEach((label, i) => {
      const y = 232 + i * 84;
      g.fillStyle = cols[i]; g.beginPath(); g.roundRect(48, y, 520, 68, 34); g.fill();
      g.fillStyle = '#111'; g.font = '800 34px Montserrat';
      g.fillText(`[${i + 1}]  ${label}`, 78, y + 36);
    });
  });

const aeoCardTex = (th) =>
  mk(`aeocard|${th.id}`, 768, 512, (g, W, H) => {
    g.fillStyle = th.cardBg; g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, 44); g.fill();
    g.strokeStyle = th.gold; g.lineWidth = 10; g.stroke();
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = th.cardFg; g.globalAlpha = 0.6; g.font = '700 32px Montserrat';
    g.fillText('O que é AEO?', 48, 62); g.globalAlpha = 1;
    g.fillStyle = th.cardFg; g.font = '900 56px Montserrat';
    g.fillText('RESPOSTA DIRETA', 48, 146);
    g.fillStyle = th.cardBar;
    [[210, 0.92], [262, 0.8], [314, 0.55]].forEach(([y, f]) => { g.beginPath(); g.roundRect(48, y, (W - 96) * f, 28, 14); g.fill(); });
    g.fillStyle = th.gold; g.beginPath(); g.roundRect(48, 388, 250, 70, 35); g.fill();
    g.fillStyle = '#111'; g.font = '800 32px Montserrat'; g.fillText('★  TOPO', 78, 424);
  });

const pageTex = (th) =>
  mk(`page|${th.id}`, 512, 768, (g, W, H) => {
    g.fillStyle = th.id === 'noite' ? '#101a44' : '#fffaf0'; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 36); g.fill();
    g.strokeStyle = th.id === 'noite' ? th.accent : 'rgba(0,0,0,.2)'; g.lineWidth = 6; g.stroke();
    g.fillStyle = th.id === 'noite' ? '#1b2766' : '#e4d9c3'; g.beginPath(); g.roundRect(4, 4, W - 8, 80, [36, 36, 0, 0]); g.fill();
    ['#ff6b6b', '#ffd23f', '#3ddc84'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(46 + i * 36, 44, 11, 0, 7); g.fill(); });
    g.fillStyle = th.cardBar; g.globalAlpha = 0.55;
    [[330, 0.8], [376, 0.9], [422, 0.7], [520, 0.85], [566, 0.6], [612, 0.9], [658, 0.5]].forEach(([y, f]) => { g.beginPath(); g.roundRect(48, y, (W - 96) * f, 22, 11); g.fill(); });
    g.globalAlpha = 1;
  });

// ---------- helpers ----------
const Pill = ({p, text, dot, w = 1.9, k = 1, op = 1}) => {
  const th = useTheme();
  return <FaceP p={p} w={w * 1.25} tex={pillTex(text, {bg: th.labelBg, fg: th.labelFg, dot})} k={k} op={op} />;
};

const Plate = ({k = 1, r = 4.3}) => {
  const th = useTheme();
  const kk = easeOutBack(clamp(k));
  return (
    <group scale={[kk, 1, kk]}>
      <mesh position={[0, 0.175, 0]} receiveShadow castShadow><cylinderGeometry args={[r, r + 0.2, 0.35, 64]} /><meshStandardMaterial color={th.plate} roughness={th.rough} metalness={th.metal} /></mesh>
      <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r - 0.3, r - 0.1, 64]} /><meshStandardMaterial color={th.accent} emissive={th.accent} emissiveIntensity={th.id === 'noite' ? 1.5 : 0} roughness={0.6} /></mesh>
    </group>
  );
};

const LetterBlocks = ({letters, tau, t0, z = 2.4, gap = 2.2, tw = [], sc = 1.35}) => {
  const th = useTheme();
  const cols = [th.pal.wiki, th.gold, th.pal.brand];
  return (
    <>
      {letters.map((ch, i) => {
        const a = t0 + i * 0.14;
        if (tau < a) return null;
        const e = easeOutBack(prog(tau, a, a + 0.45));
        const y = 0.35 + 0.55 * sc + (1 - e) * 5;
        const bump = tw[i] === undefined ? 0 : Math.sin(Math.PI * clamp((tau - tw[i]) / 0.5));
        return (
          <group key={ch} position={[(i - 1) * gap, y + 0.25 * bump, z]} scale={sc * (1 + 0.22 * bump)} rotation={[0, Math.sin(tau * 2 + i) * 0.1, 0]}>
            <RBox size={[1.1, 1.1, 1.1]} r={0.2} color={cols[i]} emissive={cols[i]} emissiveIntensity={th.id === 'noite' ? 0.7 : 0} rough={th.rough} />
            <mesh position={[0, 0, 0.56]}><planeGeometry args={[0.9, 0.9]} /><meshBasicMaterial map={letterTex(ch, '#ffffff', 'rgba(0,0,0,0)')} transparent toneMapped={false} /></mesh>
            <Halo p={[0, 0, 0]} color={cols[i]} s={2.6} op={0.7} />
          </group>
        );
      })}
    </>
  );
};

const ptTex = (text, th) =>
  mk(`pt|${text}|${th.id}`, 1024, 286, (g, W, H) => {
    g.fillStyle = th.labelBg; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 70); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 4; g.stroke();
    const ws = text.split(' ');
    let best = 1, bd = 1e9;
    for (let i = 1; i < ws.length; i++) { const d = Math.abs(ws.slice(0, i).join(' ').length - ws.slice(i).join(' ').length); if (d < bd) { bd = d; best = i; } }
    const lines = [ws.slice(0, best).join(' '), ws.slice(best).join(' ')];
    g.fillStyle = th.gold; g.beginPath(); g.arc(70, H / 2, 20, 0, 7); g.fill();
    g.fillStyle = th.labelFg; g.textBaseline = 'middle'; g.textAlign = 'center';
    let size = 80;
    g.font = `800 ${size}px Montserrat`;
    while (Math.max(...lines.map((l) => g.measureText(l).width)) > W - 190 && size > 24) { size -= 2; g.font = `800 ${size}px Montserrat`; }
    lines.forEach((l, i) => g.fillText(l, W / 2 + 36, H / 2 + (i - 0.5) * size * 1.15 + 4));
  });

const Expansion = ({words, tw, pt, tPT, tau, z = 2.4, gap = 2.2, y0 = 3.0}) => {
  const th = useTheme();
  const cols = [th.pal.wiki, th.gold, th.pal.brand];
  const ws = [1.9, 1.9, 2.5];
  const px = [-gap * 0.62, 0, gap * 0.5];
  return (
    <>
      {words.map((wd, i) => (
        <Pill key={wd} p={[px[i], y0 + i * 0.85, z]} text={wd.toUpperCase()} dot={cols[i]} w={ws[i]} k={pk(tau, tw[i], 0.3)} />
      ))}
      <FaceP p={[0, 0.55, z + 2.2]} w={4.6} ratio={0.28} tex={ptTex(pt, th)} k={pk(tau, tPT, 0.35)} />
    </>
  );
};

const Gold = ({children, k = 1, ...p}) => <group scale={k} {...p}>{children}</group>;

// ---------- ícones-miniatura dos 3 distritos ----------
const MiniSeo = ({k = 1, t = 0}) => {
  const th = useTheme();
  return (
    <group scale={k}>
      {[0, 1, 2].map((i) => <RBox key={i} size={[0.5, 0.3 + i * 0.28, 0.6]} r={0.08} color={i === 2 ? th.gold : th.pal.wiki} emissive={i === 2 ? th.gold : th.pal.wiki} emissiveIntensity={th.id === 'noite' ? 0.5 : 0} rough={th.rough} position={[(i - 1) * 0.52, (0.3 + i * 0.28) / 2, 0]} />)}
      <RBox size={[0.34, 0.34, 0.34]} r={0.08} color={th.pal.brand} emissive={th.pal.brand} emissiveIntensity={th.id === 'noite' ? 0.9 : 0} rough={th.rough} position={[0.52, 0.86 + 0.17 + Math.abs(Math.sin(t * 3)) * 0.08, 0]} />
    </group>
  );
};
const MiniAeo = ({k = 1}) => {
  const th = useTheme();
  return (
    <group scale={k}>
      <mesh position={[-0.55, 0.65, 0]}><cylinderGeometry args={[0.05, 0.05, 1.3, 10]} /><meshStandardMaterial color="#9aa3c0" roughness={0.5} /></mesh>
      <mesh position={[-0.3, 1.3, 0]} rotation={[0, 0, -0.9]}><cylinderGeometry args={[0.2, 0.12, 0.35, 16]} /><meshStandardMaterial color={th.gold} emissive={th.gold} emissiveIntensity={th.id === 'noite' ? 0.9 : 0.1} /></mesh>
      <mesh position={[0.05, 0.65, 0]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.6, 1.3, 24, 1, true]} /><meshBasicMaterial color={th.gold} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <RBox size={[0.8, 0.5, 0.06]} r={0.04} color={th.cardBg} position={[0.3, 0.45, 0]} rotation={[0, 0, 0]} />
      <RBox size={[0.5, 0.06, 0.07]} r={0.02} color={th.gold} position={[0.3, 0.6, 0.02]} cast={false} />
    </group>
  );
};
const MiniGeo = ({k = 1, t = 0}) => (
  <group scale={k * 0.36} position={[0, -0.12, 0]}><Blender t={t} level={0.7} shake={0} mix={0} /></group>
);

// ---------- câmeras ----------
const orbit = (tau, d, az, el, tg) => {
  const dd = kf(tau, d), a = kf(tau, az), e = kf(tau, el);
  const target = tg(tau);
  return {pos: [target[0] + dd * Math.sin(a) * Math.cos(e), target[1] + dd * Math.sin(e), target[2] + dd * Math.cos(a) * Math.cos(e)], target};
};
const warpTo = (() => {
  const go = teaser.segments[0].words.map((w) => w.s);
  const gn = byId.geo.words.slice(0, go.length).map((w) => w.s - byId.geo.start);
  return (tau) => {
    if (tau <= gn[0]) return tau - gn[0] + go[0];
    for (let i = 0; i < gn.length - 1; i++) if (tau <= gn[i + 1]) return lerp(go[i], go[i + 1], (tau - gn[i]) / (gn[i + 1] - gn[i]));
    return go[go.length - 1] + (tau - gn[gn.length - 1]);
  };
})();
const camFor = (id, tau) => {
  switch (id) {
    case 'gancho': return orbit(tau, [[-0.2, 36], [3, 27.5], [8, 25], [12, 26]], [[-0.2, 0.9], [4, 0.12], [12, -0.2]], [[-0.2, 0.62], [4, 0.4], [12, 0.38]], () => [0, 1.8, 0.8]);
    case 'seo': return orbit(tau, [[-0.2, 29], [7, 25], [10, 25.5], [15, 24]], [[-0.2, -0.35], [4, -0.12], [10, 0.1], [15, 0.0]], [[-0.2, 0.44], [10, 0.3], [15, 0.32]], () => [0.25, 2.1, 0.8]);
    case 'aeo': return orbit(tau, [[-0.2, 30], [9, 25], [11, 25.5], [15.5, 24]], [[-0.2, 0.3], [5, 0.0], [11, -0.2], [15.5, -0.05]], [[-0.2, 0.44], [11, 0.36], [15.5, 0.32]], () => [0, 1.8, 1.0]);
    case 'geo': return camAt(warpTo(tau));
    default: return orbit(tau, [[-0.2, 32], [7.3, 36], [12, 38]], [[-0.2, -0.3], [12, 0.2]], [[-0.2, 0.42], [7.3, 0.6], [12, 0.7]], () => [0, 1.4, 0]);
  }
};

// ======================= GANCHO =======================
const GANCHO_TW = [wt('gancho', 'você', 1), wt('gancho', 'jogar'), wt('gancho', 'três', 1) + 0.1];
const Gancho = ({tau}) => {
  const th = useTheme();
  const tGoogle = wt('gancho', 'google'), tIA = wt('gancho', 'ia'), tFala = wt('gancho', 'fala'), tVoce = wt('gancho', 'você');
  const tPor = wt('gancho', 'por'), tJogos = wt('gancho', 'jogos');
  const tW = GANCHO_TW;
  const out = 1 - easeInOut(prog(tau, tPor + 0.05, tPor + 0.65));
  const dim = prog(tau, tVoce, tVoce + 0.5);
  const brand = new THREE.Color(th.pal.brand).lerp(new THREE.Color('#7b8094'), 0.8 * dim);
  const site = pk(tau, 0.0, 0.5);
  // esfera "?"
  const dropT = tPor + 0.0;
  const dk = prog(tau, dropT, dropT + 0.6);
  const bounce = dk < 1 ? 0 : Math.abs(Math.sin((tau - dropT - 0.6) * 5)) * 0.5 * Math.exp(-(tau - dropT - 0.6) * 2.2);
  const qy = lerp(9, 2.0, dk * dk) + bounce;
  const qScale = 1 - easeInOut(prog(tau, tJogos, tJogos + 0.25));
  // orbes que se separam
  const orbCols = [th.pal.wiki, th.gold, th.pal.brand];
  const PX = [-2.4, 0, 2.4], PZ = 1.5;
  const names = ['SEO', 'AEO', 'GEO'];
  return (
    <group>
      <Plate k={prog(tau, -0.2, 0.5)} />
      {/* SEU SITE */}
      <group position={[-2.1, 0.35, 0.2]} scale={site * out}>
        <RBox size={[1.5, 2.2, 1.5]} r={0.18} color={brand} emissive={brand} emissiveIntensity={th.id === 'noite' ? 0.35 : 0} rough={th.rough} position={[0, 1.1, 0]} />
        <RBox size={[1.1, 0.9, 1.1]} r={0.15} color={brand} emissive={brand} emissiveIntensity={th.id === 'noite' ? 0.35 : 0} rough={th.rough} position={[0, 2.65, 0]} />
        {[0.6, 1.2, 1.8].map((y) => [-0.35, 0.35].map((x) => <RBox key={`${x}${y}`} size={[0.28, 0.28, 0.05]} r={0.03} color={dim > 0.5 ? '#9096a8' : th.gold} emissive={dim > 0.5 ? '#000' : th.gold} emissiveIntensity={th.id === 'noite' ? 0.9 : 0.2} position={[x, y, 0.76]} cast={false} />))}
        <Halo p={[0, 1.5, 0]} color={th.pal.brand} s={3.4} op={0.5 * (1 - dim)} />
        {dim > 0.01 && [1, -1].map((s) => <mesh key={s} position={[0, 1.4, 0.9]} rotation={[0, 0, s * 0.78]} scale={pk(tau, tVoce + 0.1, 0.3)}><boxGeometry args={[2.0, 0.22, 0.12]} /><meshBasicMaterial color="#ff4d5e" toneMapped={false} /></mesh>)}
      </group>
      <Pill p={[-2.1, 4.35, 0.2]} text="SEU SITE" dot={th.pal.brand} w={1.7} k={pk(tau, 0.3, 0.3) * out} />
      <Pill p={[-2.1, 5.15, 0.2]} text="NO GOOGLE" dot="#3ddc84" w={1.9} k={pk(tau, tGoogle, 0.3) * out} />
      {/* IA */}
      <group position={[2.4, 0.35, -0.2]} scale={pk(tau, tIA - 0.1, 0.4) * out}>
        <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.7, 0.85, 0.4, 32]} /><meshStandardMaterial color={th.plate} roughness={th.rough} metalness={th.metal} /></mesh>
        <mesh position={[0, 1.45, 0]}><sphereGeometry args={[0.9, 32, 24]} /><meshStandardMaterial color={th.jar} transparent opacity={0.3} roughness={0.05} depthWrite={false} /></mesh>
        <mesh position={[0, 1.45, 0]} rotation={[tau * 1.2, tau * 1.6, 0]}><icosahedronGeometry args={[0.42, 0]} /><meshStandardMaterial color={th.accent} emissive={th.accent} emissiveIntensity={th.id === 'noite' ? 1.2 : 0.2} roughness={0.3} /></mesh>
        <Halo p={[0, 1.45, 0]} color={th.accent} s={3} op={0.5} />
      </group>
      <Pill p={[2.4, 2.95, -0.2]} text="IA" dot={th.accent} w={1.0} k={pk(tau, tIA, 0.3) * out} />
      <FaceP p={[2.4, 4.9, 0.0]} w={2.7} ratio={0.667} tex={listCardTex(th)} k={pk(tau, tFala, 0.4) * out} />
      <Pill p={[-2.1, 5.9, 0.2]} text="NUNCA CITADO" dot="#ff4d5e" w={2.2} k={pk(tau, tVoce + 0.1, 0.3) * out} />
      {/* esfera "?" */}
      {tau > dropT - 0.05 && (
        <group position={[0, qy, 1.2]} scale={qScale}>
          <mesh castShadow><sphereGeometry args={[1.3, 32, 24]} /><meshStandardMaterial color={th.jar} transparent opacity={0.38} roughness={0.05} depthWrite={false} /></mesh>
          <FaceP p={[0, 0, 0]} w={1.6} ratio={1} tex={letterTex('?', th.gold, 'rgba(0,0,0,0)')} k={1} />
          <Halo p={[0, 0, 0]} color={th.gold} s={3.4} op={0.6} />
        </group>
      )}
      {/* orbes -> distritos */}
      {PX.map((x, i) => {
        const tw = tW[i];
        const dep = prog(tau, tw - 0.55, tw);
        const here = tau >= tJogos && dep < 1;
        const ang = tau * 1.6 + (i * Math.PI * 2) / 3;
        const hover = [Math.cos(ang) * 0.95, 2.6 + Math.sin(tau * 2 + i) * 0.1, 1.2 + Math.sin(ang) * 0.45];
        const spawn = easeOut(prog(tau, tJogos, tJogos + 0.35));
        const pos = arc3(hover, [x, 1.55, PZ], easeInOut(dep), 1.0);
        const sc = (dep < 1 ? 0.42 * spawn : 0) * (1 - 0.0);
        const ik = pk(tau, tw, 0.4);
        return (
          <group key={i}>
            {tau >= tJogos - 0.1 && <group position={[x, 0.35, PZ]} scale={easeOutBack(prog(tau, tJogos + 0.1, tJogos + 0.5))}>
              <mesh position={[0, 0.2, 0]} receiveShadow castShadow><cylinderGeometry args={[0.95, 1.05, 0.4, 40]} /><meshStandardMaterial color={th.plate} roughness={th.rough} metalness={th.metal} /></mesh>
              <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.8, 0.9, 40]} /><meshStandardMaterial color={orbCols[i]} emissive={orbCols[i]} emissiveIntensity={th.id === 'noite' ? 1.4 : 0} /></mesh>
            </group>}
            {here && (
              <group position={pos} scale={sc}>
                <mesh><sphereGeometry args={[1, 24, 18]} /><meshStandardMaterial color={orbCols[i]} emissive={orbCols[i]} emissiveIntensity={th.id === 'noite' ? 1.0 : 0.15} roughness={0.3} /></mesh>
                <Halo p={[0, 0, 0]} color={orbCols[i]} s={4} op={0.6} />
              </group>
            )}
            <group position={[x, 0.78, PZ]}>
              {i === 0 && <MiniSeo k={ik * 1.1} t={tau} />}
              {i === 1 && <MiniAeo k={ik * 1.1} />}
              {i === 2 && <MiniGeo k={ik * 1.1} t={tau} />}
            </group>
            <Halo p={[x, 1.4, PZ]} color={orbCols[i]} s={3} op={0.5 * ik} />
            <Pill p={[x, 3.05, PZ]} text={names[i]} dot={orbCols[i]} w={1.35} k={pk(tau, tw + 0.05, 0.3)} />
          </group>
        );
      })}
      <Confetti o={[0, 2.5, 1.5]} tau={tau - tW[2]} seed={5} n={34} />
    </group>
  );
};

// ======================= SEO =======================
const NSTEP = 10;
const slotX = (k) => (5.5 - k) * 0.62;
const stepH = (k) => 0.4 + (NSTEP - k) * 0.3;
const slotH = (k) => {
  const k0 = clamp(Math.floor(k), 1, NSTEP), k1 = clamp(k0 + 1, 1, NSTEP);
  return lerp(stepH(k0), stepH(k1), k - k0);
};
const COMP_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 10];

const Magnet = ({p, k = 1}) => {
  const th = useTheme();
  return (
    <group position={p} scale={k}>
      <mesh rotation={[0, 0, 0]}><torusGeometry args={[0.38, 0.13, 10, 20, Math.PI]} /><meshStandardMaterial color="#e0334a" roughness={0.4} metalness={0.3} /></mesh>
      {[-0.38, 0.38].map((x) => <mesh key={x} position={[x, -0.12, 0]}><boxGeometry args={[0.26, 0.3, 0.26]} /><meshStandardMaterial color="#e8ecf5" roughness={0.4} metalness={0.4} /></mesh>)}
      <Halo p={[0, -0.3, 0]} color={th.pal.wiki} s={1.8} op={0.5} />
    </group>
  );
};

const boltShape = (() => {
  const s = new THREE.Shape();
  [[0.1, 0.55], [-0.28, -0.05], [-0.02, -0.05], [-0.14, -0.6], [0.3, 0.12], [0.03, 0.12], [0.1, 0.55]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  return s;
})();

const SeoScene = ({tau}) => {
  const th = useTheme();
  const tGoogle = wt('seo', 'google'), tEntao = wt('seo', 'então'), tRanking = wt('seo', 'ranking');
  const tPal = wt('seo', 'palavra'), tLinks = wt('seo', 'links'), tRap = wt('seo', 'rápido'), tSEO = wt('seo', 'seo');
  const sceneK = 1 - easeInOut(prog(tau, tSEO + 0.25, tSEO + 0.85));
  const b = 9 - 3 * easeInOut(prog(tau, tPal, tPal + 0.7)) - 3 * easeInOut(prog(tau, tLinks, tLinks + 0.7)) - 2 * easeInOut(prog(tau, tRap, tRap + 0.8));
  const hops = Math.abs(Math.sin(Math.PI * clamp((tau - tPal) / 0.7))) * (tau < tLinks ? 1 : 0)
    + (tau >= tLinks && tau < tRap ? Math.sin(Math.PI * clamp((tau - tLinks) / 0.7)) : 0)
    + (tau >= tRap ? Math.sin(Math.PI * clamp((tau - tRap) / 0.8)) : 0);
  const bx = slotX(b), by = slotH(b) + 0.5 + hops * 0.9;
  const brandPop = pk(tau, 0.5, 0.4);
  const rank = Math.round(b);
  const done = tau > tRap + 0.85;
  // lupa
  const lt = prog(tau, tGoogle, tEntao - 0.1);
  const lk = clamp(lt * 4) * (1 - clamp((lt - 0.85) * 6.6));
  const lSlot = lerp(10.8, 0.4, easeInOut(lt));
  const lx = slotX(lSlot), ly = slotH(clamp(lSlot, 1, 10)) + 1.5 + Math.sin(tau * 5) * 0.08;
  return (
    <group>
      <Plate k={prog(tau, -0.2, 0.5)} />
      <group scale={Math.max(sceneK, 0.001)} visible={sceneK > 0.002}>
      {Array.from({length: NSTEP}, (_, i) => {
        const k = NSTEP - i; // 10 .. 1
        const pop = pk(tau, 0.0 + i * 0.07, 0.35);
        const h = stepH(k);
        const top = k === 1;
        return (
          <group key={k} scale={[1, pop, 1]} position={[slotX(k), 0.35, 0]}>
            <RBox size={[0.58, h, 1.0]} r={0.1} color={top ? th.gold : th.plate} emissive={top ? th.gold : th.accent} emissiveIntensity={th.id === 'noite' ? (top ? 0.5 : 0.12) : 0} rough={th.rough} metal={th.metal} position={[0, h / 2, 0]} />
            <mesh position={[0, Math.min(h * 0.5, 0.45), 0.46]}><planeGeometry args={[0.4, 0.4]} /><meshBasicMaterial map={letterTex(String(k), th.id === 'noite' ? '#bff6ff' : '#1d1d22', 'rgba(0,0,0,0)')} transparent toneMapped={false} /></mesh>
          </group>
        );
      })}
      {/* concorrentes */}
      {COMP_RANKS.map((r) => {
        const sh = clamp(r - b + 0.5) - clamp(r - 9 + 0.5);
        const slot = r + easeInOut(clamp(sh));
        const cx = slotX(slot), cy = 0.35 + slotH(slot) + 0.27;
        const col = ['#8e93a8', '#a3a8bd', '#767c93'][r % 3];
        return <RBox key={r} size={[0.5, 0.5, 0.5]} r={0.1} color={col} rough={th.rough} position={[cx, cy, 0]} scale={pk(tau, 0.2 + (10 - r) * 0.05, 0.3)} />;
      })}
      {/* marca */}
      <group position={[bx, 0.35 + by, 0]} scale={brandPop * (1 + (done ? 0.12 : 0))}>
        <RBox size={[0.6, 0.6, 0.6]} r={0.13} color={th.pal.brand} emissive={th.pal.brand} emissiveIntensity={th.id === 'noite' ? 0.9 : 0} rough={th.rough} />
        <Halo p={[0, 0, 0]} color={th.pal.brand} s={2.2} op={0.7} />
      </group>
      <Pill p={[Math.min(bx, 1.5), 0.35 + by + 1.0, 0.2]} text={`SEU SITE · #${clamp(rank, 1, 9)}`} dot={th.pal.brand} w={2.1} k={brandPop} />
      {/* lupa */}
      {lk > 0.01 && (
        <group position={[lx, 0.35 + ly, 1.0]} scale={lk * 2.2} rotation={[0, 0, -0.2]}>
          <mesh><torusGeometry args={[0.42, 0.07, 10, 32]} /><meshStandardMaterial color={th.accent} emissive={th.accent} emissiveIntensity={th.id === 'noite' ? 1 : 0.1} metalness={0.4} roughness={0.3} /></mesh>
          <mesh><circleGeometry args={[0.4, 32]} /><meshStandardMaterial color={th.jar} transparent opacity={0.3} depthWrite={false} /></mesh>
          <mesh position={[0.42, -0.5, 0]} rotation={[0, 0, 0.8]}><cylinderGeometry args={[0.06, 0.06, 0.6, 8]} /><meshStandardMaterial color="#8a6a4a" roughness={0.6} /></mesh>
          <Halo p={[0, 0, 0]} color={th.accent} s={1.8} op={0.4} />
        </group>
      )}
      <Pill p={[-0.2, 4.2, 0.4]} text="GOOGLE · LISTA" dot={th.pal.wiki} w={2.3} k={fade(tau, tGoogle, tEntao, 0.3) } />
      {/* boosts */}
      <Pill p={[bx - 0.8, 0.35 + by + 2.9, 0.2]} text="PALAVRA-CHAVE" dot="#ffd23f" w={2.5} k={fade(tau, tPal, tLinks - 0.05, 0.3)} />
      {tau > tPal && tau < tPal + 0.9 && (
        <group position={lerp3([bx - 0.9, by + 3.2, 0.3], [bx, 0.35 + by + 0.5, 0.1], easeInOut(prog(tau, tPal, tPal + 0.5)))} scale={1 - prog(tau, tPal + 0.5, tPal + 0.9)} rotation={[0, tau * 6, 0]}>
          <RBox size={[0.5, 0.26, 0.08]} r={0.05} color={th.gold} emissive={th.gold} emissiveIntensity={th.id === 'noite' ? 0.8 : 0} />
          <mesh position={[-0.3, 0, 0]}><torusGeometry args={[0.09, 0.03, 8, 16]} /><meshStandardMaterial color="#e8ecf5" /></mesh>
        </group>
      )}
      <Pill p={[bx - 0.8, 0.35 + by + 2.9, 0.2]} text="BACKLINKS" dot={th.pal.wiki} w={2.1} k={fade(tau, tLinks, tRap - 0.05, 0.3)} />
      {tau > tLinks - 0.05 && tau < tRap && <Magnet p={[bx, 0.35 + by + 1.85, 0]} k={0.8 * pk(tau, tLinks, 0.3) * (1 - prog(tau, tRap - 0.3, tRap))} />}
      {[0, 1, 2].map((i) => {
        const s0 = [[-3.4, 4.2, 1.0], [3.4, 4.6, 1.0], [0.6, 5.4, 1.5]][i];
        const a = tLinks + 0.05 + i * 0.12;
        const kk = prog(tau, a, a + 0.6);
        if (kk <= 0 || kk >= 1) return null;
        const p = arc3(s0, [bx, 0.35 + by + 0.6, 0.1], easeInOut(kk), 0.6);
        return <RBox key={i} size={[0.42, 0.24, 0.24]} r={0.07} color={th.pal.wiki} emissive={th.pal.wiki} emissiveIntensity={th.id === 'noite' ? 0.9 : 0} position={p} rotation={[kk * 5, kk * 4, 0]} scale={1 - 0.5 * kk} />;
      })}
      <Pill p={[bx - 0.8, 0.35 + by + 2.9, 0.2]} text="SITE RÁPIDO" dot="#3ddc84" w={2.2} k={fade(tau, tRap, tRap + 1.3, 0.3)} />
      {tau > tRap && tau < tRap + 1.1 && (
        <group position={[bx + 0.9, 0.35 + by + 0.5, 0.3]} scale={pk(tau, tRap, 0.3) * (1 - prog(tau, tRap + 0.8, tRap + 1.1))}>
          <mesh rotation={[0, 0, 0]}><extrudeGeometry args={[boltShape, {depth: 0.12, bevelEnabled: false}]} /><meshStandardMaterial color={th.gold} emissive={th.gold} emissiveIntensity={th.id === 'noite' ? 1.2 : 0.3} /></mesh>
          {[0, 1, 2].map((i) => <mesh key={i} position={[0.6 + i * 0.35, 0.3 - i * 0.18, 0]}><boxGeometry args={[0.5 - i * 0.1, 0.05, 0.05]} /><meshBasicMaterial color={th.gold} toneMapped={false} /></mesh>)}
        </group>
      )}
      {/* chegada ao topo */}
      <Seal p={[bx, 0.35 + by + 1.9, 0]} k={pk(tau, tRap + 0.85, 0.5)} t={tau} />
      <Pill p={[bx - 0.9, 0.35 + by + 2.9, 0.2]} text="TOP 1" dot={th.gold} w={1.5} k={pk(tau, tRap + 0.95, 0.3)} />
      <Confetti o={[bx, 3.2, 0.3]} tau={tau - (tRap + 0.85)} seed={2} n={30} />
      </group>
      <LetterBlocks letters={['S', 'E', 'O']} tau={tau} t0={tSEO} tw={[wt('seo', 'search'), wt('seo', 'engine'), wt('seo', 'optimization')]} />
      <Expansion words={['Search', 'Engine', 'Optimization']} tw={[wt('seo', 'search'), wt('seo', 'engine'), wt('seo', 'optimization')]} pt="OTIMIZAÇÃO PARA MECANISMOS DE BUSCA" tPT={wt('seo', 'otimização')} tau={tau} />
    </group>
  );
};

// ======================= AEO =======================
const AeoScene = ({tau}) => {
  const th = useTheme();
  const tLista = wt('aeo', 'lista'), tQuer = wt('aeo', 'quer', 1), tResp = wt('aeo', 'resposta'), tEntao = wt('aeo', 'então');
  const tEsc = wt('aeo', 'escreve'), tCurta = wt('aeo', 'curta'), tDireta = wt('aeo', 'direta'), tLogo = wt('aeo', 'logo');
  const tTopo = wt('aeo', 'topo'), tPag = wt('aeo', 'página'), tAEO = wt('aeo', 'aeo');
  const sceneK = 1 - easeInOut(prog(tau, tAEO + 0.25, tAEO + 0.85));
  const dim = prog(tau, tQuer, tQuer + 0.5);
  const spot = prog(tau, tQuer + 0.1, tQuer + 0.9);
  // cartão: máquina -> pedestal -> topo da página
  const e1 = easeInOut(prog(tau, tEntao + 0.2, tEntao + 1.0));
  const e2 = easeInOut(prog(tau, tLogo + 0.25, tLogo + 1.0));
  const PED = [0, 1.95, 1.4], TOP = [0, 2.8, 0.5], SLOT = [0, 1.5, -1.5];
  const cp = tau < tLogo + 0.25 ? arc3(SLOT, PED, e1, 1.3) : arc3(PED, TOP, e2, 0.8);
  const cw = lerp(2.5, 1.9, e2);
  const cardK = pk(tau, tEntao + 0.2, 0.35);
  const mAct = prog(tau, tResp, tResp + 0.4);
  const pageK = pk(tau, tLogo, 0.5);
  const sp = prog(tau, tPag - 0.1, tPag + 0.3);
  const listCols = [th.pal.blog, th.pal.wiki, th.pal.news, th.pal.forum, th.pal.brand];
  return (
    <group>
      <Plate k={prog(tau, -0.2, 0.5)} />
      <group scale={Math.max(sceneK, 0.001)} visible={sceneK > 0.002}>
      {/* lista */}
      <group position={[-2.6, 0.35, -0.6]} scale={1 - 0.15 * dim}>
        {listCols.map((c, i) => {
          const col = new THREE.Color(c).lerp(new THREE.Color('#6e7388'), 0.85 * dim);
          return (
            <group key={i} position={[0, 0.3 + i * 0.52, 0]} scale={pk(tau, 0.02 + i * 0.1, 0.3)}>
              <RBox size={[2.0, 0.38, 0.5]} r={0.1} color={th.id === 'noite' ? '#1b2766' : '#f4ecdc'} rough={th.rough} />
              <RBox size={[0.3, 0.3, 0.55]} r={0.08} color={col} emissive={col} emissiveIntensity={th.id === 'noite' ? 0.7 * (1 - dim) : 0} position={[-0.7, 0, 0]} />
              <mesh position={[0.25, 0, 0.26]}><planeGeometry args={[1.0, 0.09]} /><meshBasicMaterial color={th.cardBar} toneMapped={false} /></mesh>
            </group>
          );
        })}
      </group>
      <Pill p={[-2.6, 3.7, -0.4]} text="LISTA" dot={th.pal.wiki} w={1.3} k={fade(tau, tLista - 0.05, tQuer, 0.3)} />
      <Pill p={[-2.6, 3.7, -0.4]} text="CLIQUES: 0" dot="#ff4d5e" w={2.0} k={pk(tau, tQuer + 0.2, 0.3)} />
      {/* máquina de respostas */}
      <group position={[0, 0.35, -2.1]} scale={pk(tau, tQuer - 0.2, 0.4)}>
        <RBox size={[1.9, 1.7, 1.2]} r={0.2} color={th.id === 'noite' ? '#1b2766' : '#ff7a45'} rough={th.rough} metal={th.metal} position={[0, 0.85, 0]} />
        <RBox size={[1.3, 0.14, 0.2]} r={0.04} color="#0b0f24" position={[0, 1.15, 0.58]} cast={false} />
        <RBox size={[1.4, 0.12, 1.3]} r={0.05} color={th.accent} emissive={th.accent} emissiveIntensity={th.id === 'noite' ? 0.8 * mAct : 0.1} position={[0, 1.75, 0]} cast={false} />
        <Halo p={[0, 1.2, 0.7]} color={th.gold} s={2.6} op={0.7 * mAct * (1 - e1)} />
      </group>
      <Pill p={[0, 3.0, -2.1]} text="MÁQUINA DE RESPOSTAS" dot={th.accent} w={3.2} k={pk(tau, tResp, 0.3) * (1 - e2)} />
      {/* holofote */}
      <group position={[0, 0, 1.4]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow><cylinderGeometry args={[1.0, 1.1, 0.5, 40]} /><meshStandardMaterial color={th.plate} roughness={th.rough} metalness={th.metal} /></mesh>
        <mesh position={[0, 0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.8, 0.95, 40]} /><meshStandardMaterial color={th.gold} emissive={th.gold} emissiveIntensity={th.id === 'noite' ? 1.5 * spot : 0.1} /></mesh>
        <mesh position={[0, 3.35, 0]}><coneGeometry args={[1.9, 5.4, 40, 1, true]} /><meshBasicMaterial color={th.gold} transparent opacity={0.17 * spot} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
        <mesh position={[0, 6.15, 0]} rotation={[Math.PI, 0, 0]}><cylinderGeometry args={[0.5, 0.28, 0.6, 24]} /><meshStandardMaterial color="#2b3050" roughness={0.4} metalness={0.5} /></mesh>
        <Halo p={[0, 5.8, 0]} color={th.gold} s={2.4} op={0.8 * spot} />
        {th.id === 'noite' && <pointLight position={[0, 4.5, 0.5]} intensity={30 * spot} color={th.gold} distance={9} />}
      </group>
      {/* página */}
      <group position={[0, 0.35, 0.2]} scale={[1, pageK, 1]}>
        <RBox size={[2.5, 3.4, 0.12]} r={0.1} color={th.id === 'noite' ? '#101a44' : '#fffaf0'} rough={th.rough} position={[0, 1.7, 0]} />
        <mesh position={[0, 1.7, 0.07]}><planeGeometry args={[2.4, 3.3]} /><meshBasicMaterial map={pageTex(th)} transparent toneMapped={false} /></mesh>
      </group>
      <Pill p={[0, 5.0, 0.6]} text="TOPO DA PÁGINA" dot={th.gold} w={2.6} k={pk(tau, tTopo, 0.3)} />
      {/* cartão */}
      <FaceP p={cp} w={cw} ratio={0.667} tex={aeoCardTex(th)} k={cardK} />
      <Halo p={cp} color={th.gold} s={cw * 1.5} op={0.35 * cardK} />
      <Pill p={[-2.0, 3.25, 1.9]} text="CURTA" dot={th.pal.wiki} w={1.5} k={fade(tau, tCurta, tLogo, 0.3)} />
      <Pill p={[2.0, 3.25, 1.9]} text="DIRETA" dot={th.pal.news} w={1.5} k={fade(tau, tDireta, tLogo, 0.3)} />
      {/* alto-falante */}
      <group position={[2.5, 0.35, 1.0]} scale={pk(tau, tPag - 0.1, 0.4)}>
        <RBox size={[1.0, 1.6, 0.9]} r={0.16} color="#232a4a" rough={0.5} position={[0, 0.8, 0]} />
        {[[0.45, 0.3], [1.1, 0.2]].map(([y, r]) => <mesh key={y} position={[0, y, 0.46]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[r, r, 0.08, 24]} /><meshStandardMaterial color={th.accent} emissive={th.accent} emissiveIntensity={th.id === 'noite' ? 0.8 : 0.1} /></mesh>)}
      </group>
      {sp > 0 && [0, 1, 2].map((i) => {
        const u = (tau * 0.9 + i / 3) % 1;
        return <mesh key={i} position={[2.5, 1.3, 1.5]} scale={0.4 + u * 1.5}><torusGeometry args={[0.5, 0.03, 8, 32]} /><meshBasicMaterial color={th.accent} transparent opacity={0.8 * (1 - u) * sp} toneMapped={false} depthWrite={false} /></mesh>;
      })}
      <Pill p={[2.0, 3.0, 1.0]} text="EM VOZ ALTA" dot={th.accent} w={2.2} k={pk(tau, tPag, 0.3)} />
      </group>
      <Confetti o={[0, 2.6, 1.6]} tau={tau - tAEO} seed={9} n={30} />
      <LetterBlocks letters={['A', 'E', 'O']} tau={tau} t0={tAEO} tw={[wt('aeo', 'answer'), wt('aeo', 'engine'), wt('aeo', 'optimization')]} />
      <Expansion words={['Answer', 'Engine', 'Optimization']} tw={[wt('aeo', 'answer'), wt('aeo', 'engine'), wt('aeo', 'optimization')]} pt="OTIMIZAÇÃO PARA MOTORES DE RESPOSTA" tPT={wt('aeo', 'otimização')} tau={tau} />
    </group>
  );
};

// ======================= FECHO =======================
const Fecho = ({tau, t}) => {
  const th = useTheme();
  const tSEO = wt('fecho', 'seo'), tAEO = wt('fecho', 'aeo'), tGEO = wt('fecho', 'geo'), tSoma = wt('fecho', 'somam');
  const D = [
    {id: 'seo', p: [-2.9, 0.35, 1.0], c: th.pal.wiki, t0: tSEO, label: 'SEO · NA LISTA'},
    {id: 'aeo', p: [2.9, 0.35, 1.0], c: th.gold, t0: tAEO, label: 'AEO · A RESPOSTA'},
    {id: 'geo', p: [0, 0.35, -2.7], c: th.pal.brand, t0: tGEO, label: 'GEO · A CITAÇÃO'},
  ];
  const C = [0, 5.6, 0.8];
  return (
    <group>
      <Plate k={prog(tau, -0.2, 0.6)} r={5.3} />
      {D.map((d) => {
        const k = pk(tau, d.t0, 0.5);
        return (
          <group key={d.id}>
            <group position={d.p} scale={k}>
              <mesh position={[0, 0.1, 0]} receiveShadow castShadow><cylinderGeometry args={[1.55, 1.65, 0.2, 48]} /><meshStandardMaterial color={th.plate} roughness={th.rough} metalness={th.metal} /></mesh>
              <mesh position={[0, 0.215, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.35, 1.48, 48]} /><meshStandardMaterial color={d.c} emissive={d.c} emissiveIntensity={th.id === 'noite' ? 1.5 : 0} /></mesh>
              <group position={[0, 0.25, 0]}>
                {d.id === 'seo' && <MiniSeo k={1.6} t={t} />}
                {d.id === 'aeo' && <MiniAeo k={1.6} />}
                {d.id === 'geo' && <MiniGeo k={1.6} t={t} />}
              </group>
            </group>
            <Halo p={[d.p[0], 1.6, d.p[2]]} color={d.c} s={5} op={0.55 * k} />
            <Pill p={[d.p[0], 3.3, d.p[2]]} text={d.label} dot={d.c} w={2.4} k={pk(tau, d.t0 + 0.1, 0.3)} />
          </group>
        );
      })}
      {D.map((d, i) => <Beam key={d.id} a={[d.p[0], 2.3, d.p[2]]} b={C} color={d.c} op={prog(tau, tSoma + i * 0.12, tSoma + 0.4 + i * 0.12)} t={tau} />)}
      <Seal p={[C[0], C[1] + Math.sin(tau * 2) * 0.08, C[2]]} k={pk(tau, tSoma + 0.1, 0.6) * 2.2} t={tau} />
      <Pill p={[0, 7.4, 0.8]} text="SUA MARCA CITADA" dot={th.gold} w={3.0} k={pk(tau, tSoma + 0.5, 0.3)} />
      <Confetti o={[0, 5.6, 0.8]} tau={tau - (tSoma + 0.5)} seed={4} n={44} />
    </group>
  );
};

// ======================= HUD =======================
const KW = new Set(['google', 'lista', 'resposta', 'ranking', 'palavra-chave', 'links', 'rápido', 'seo', 'aeo', 'geo', 'ia', 'fontes', 'dados', 'autoridade', 'marca', 'topo', 'curta', 'direta', 'cita', 'citar', 'três', 'nunca']);
const ALLW = SEGS.flatMap((s) => s.words.map((w) => ({...w, hl: KW.has(norm(w.w))})));

const Caption = ({t, th}) => {
  let idx = -1;
  for (let i = 0; i < ALLW.length; i++) if (ALLW[i].s - 0.03 <= t) idx = i;
  if (idx < 0) return null;
  const w = ALLW[idx], next = ALLW[idx + 1];
  const hideAt = Math.min(w.e + 0.35, next ? next.s : 1e9);
  if (t > hideAt && !(idx === ALLW.length - 1 && t < w.e + 0.6)) return null;
  const k = easeOutBack(prog(t, w.s - 0.03, w.s + 0.1));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', fontFamily: MONT, fontWeight: 800, fontSize: 60, lineHeight: 1.1, color: w.hl ? th.capHl : th.capFg, textShadow: '0 3px 12px rgba(0,0,0,.6), 0 1px 2px rgba(0,0,0,.7)', transform: `scale(${0.8 + 0.2 * k})`}}>
      {w.w.replace(/[.,!?…:;]/g, '')}
    </div>
  );
};

const Header = ({t, th, on}) => (
  <div style={{position: 'absolute', top: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, fontFamily: MONT}}>
    {['SEO', 'AEO', 'GEO'].map((n) => {
      const act = on.includes(n);
      const sc = act ? 1 + 0.06 * Math.sin(t * 4) : 1;
      return (
        <div key={n} style={{padding: '9px 24px', borderRadius: 999, fontWeight: 900, fontSize: 24, letterSpacing: 1, transform: `scale(${sc})`, background: act ? th.gold : (th.id === 'noite' ? 'rgba(12,20,56,.75)' : 'rgba(255,255,255,.7)'), color: act ? '#17171d' : (th.id === 'noite' ? '#7e94d8' : '#6b6b78'), boxShadow: act ? `0 0 ${th.id === 'noite' ? 24 : 8}px ${th.gold}` : 'none', border: th.id === 'noite' ? `2px solid ${act ? th.gold : '#243072'}` : '2px solid rgba(0,0,0,.08)'}}>{n}</div>
      );
    })}
  </div>
);

const Fx = ({th}) => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 330, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', maskImage: 'linear-gradient(#000 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(#000 0%, transparent 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', maskImage: 'linear-gradient(transparent 0%, #000 70%)', WebkitMaskImage: 'linear-gradient(transparent 0%, #000 70%)'}} />
    <div style={{position: 'absolute', inset: 0, background: th.id === 'noite' ? 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(2,4,16,.65) 100%)' : 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(60,40,10,.28) 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'linear-gradient(transparent, rgba(0,0,0,.35))'}} />
  </>
);

const sceneIndex = (t) => {
  let si = 0;
  for (let i = 1; i < SEGS.length; i++) if (t >= SEGS[i].start - 0.2) si = i;
  return si;
};

const activeNames = (id, tau) => {
  if (id === 'seo') return ['SEO'];
  if (id === 'aeo') return ['AEO'];
  if (id === 'geo') return ['GEO'];
  if (id === 'fecho') return ['SEO', 'AEO', 'GEO'].filter((n, i) => tau >= [wt('fecho', 'seo') - 0.05, wt('fecho', 'aeo') - 0.05, wt('fecho', 'geo') - 0.05][i]);
  const tW = GANCHO_TW;
  return ['SEO', 'AEO', 'GEO'].filter((n, i) => tau >= tW[i] - 0.05 && tau < tW[i] + 0.55);
};

const World = ({id, tau, t}) => {
  const th = useTheme();
  const cam = camFor(id, tau);
  return (
    <>
      <color attach="background" args={[th.bg]} />
      <fog attach="fog" args={th.fog} />
      <Lights t={t} />
      <Env intensity={th.id === 'noite' ? 0.12 : 0.35} />
      <CameraRig cam={cam} />
      <Scenery t={t} />
      {id === 'gancho' && <Gancho tau={tau} />}
      {id === 'seo' && <SeoScene tau={tau} />}
      {id === 'aeo' && <AeoScene tau={tau} />}
      {id === 'geo' && <GeoScene t={warpTo(tau)} gap={2.2} lsc={1.35} />}
      {id === 'geo' && <Expansion words={['Generative', 'Engine', 'Optimization']} tw={[wt('geo', 'generative'), wt('geo', 'engine'), wt('geo', 'optimization')]} pt="OTIMIZAÇÃO PARA MOTORES GENERATIVOS" tPT={wt('geo', 'otimização')} tau={tau} z={2.0} gap={2.2} y0={3.7} />}
      {id === 'fecho' && <Fecho tau={tau} t={t} />}
    </>
  );
};

export const SeoGeoAeo = ({theme = 'noite', tList, audio = 'seo-geo-aeo/voz_v2.mp3'}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = tList ? tList[frame] : frame / FPS;
  const th = THEMES[theme];
  const si = sceneIndex(t);
  const seg = SEGS[si];
  const tau = t - seg.start;
  const cam = camFor(seg.id, tau);
  const nextStart = si < SEGS.length - 1 ? SEGS[si + 1].start - 0.2 : 1e9;
  // dip de cor entre cenas
  const veil = Math.max(si > 0 ? 1 - prog(t, seg.start - 0.2, seg.start + 0.12) : 0, prog(t, nextStart - 0.14, nextStart));
  const fechoCta = seg.id === 'fecho' ? easeOutBack(prog(tau, wt('fecho', 'somam') + 0.15, wt('fecho', 'somam') + 0.65)) : 0;
  return (
    <AbsoluteFill style={{background: th.bg}}>
      {!tList && <Audio src={staticFile(audio)} />}
      <FontGate>
        <ThemeCtx.Provider value={th}>
          <CamCtx.Provider value={cam.pos}>
            <ThreeCanvas width={width} height={height} shadows camera={{fov: 30, position: cam.pos, near: 1, far: 220}} gl={{antialias: true, toneMapping: th.tone, toneMappingExposure: th.exposure}}>
              <World id={seg.id} tau={tau} t={t} />
            </ThreeCanvas>
          </CamCtx.Provider>
        </ThemeCtx.Provider>
        <Fx th={th} />
        <Header t={t} th={th} on={activeNames(seg.id, tau)} />
        <Caption t={t} th={th} />
        <div style={{position: 'absolute', bottom: 56 + 30 * fechoCta, left: 0, right: 0, textAlign: 'center', fontFamily: MONT, fontWeight: 800, color: fechoCta > 0 ? '#17171d' : 'rgba(255,255,255,.9)', fontSize: 22 + 14 * fechoCta, textShadow: fechoCta > 0 ? 'none' : '0 2px 6px rgba(0,0,0,.6)'}}>
          {fechoCta > 0 ? <span style={{display: 'inline-block', background: th.gold, padding: '10px 30px', borderRadius: 999, boxShadow: `0 0 ${th.id === 'noite' ? 30 : 10}px ${th.gold}`, transform: `scale(${0.8 + 0.2 * fechoCta})`}}>@idielsilva</span> : '@idielsilva'}
        </div>
        <div style={{position: 'absolute', inset: 0, background: th.bg, opacity: veil, pointerEvents: 'none'}} />
      </FontGate>
    </AbsoluteFill>
  );
};
