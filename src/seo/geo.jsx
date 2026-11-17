import React, {useMemo, useContext} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {RBox, Env} from '../World.jsx';
import {prog, easeInOut, easeOut, easeOutBack, lerp, lerp3} from '../lib.js';
import {FontGate} from '../fonts.jsx';
import {pk, rn, arc3} from '../kit.jsx';
import {THEMES, ThemeCtx, CamCtx, useTheme, Scenery, Lights, pillTex, letterTex, cardTex, haloTex} from './theme.jsx';
import tl from '../../content/seo-geo-aeo/teaser.json';

const MONT = 'Montserrat, sans-serif';
export const FPS = 30;
const SEG = tl.segments[0];
export const GEO_DURATION = Math.ceil((tl.duration + 0.8) * FPS);

// ---------- câmera (perspectiva, órbita lenta) ----------
export const kf = (t, keys) => {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, easeInOut(prog(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
};
export const camAt = (t) => {
  const d = kf(t, [[0, 28], [3, 25.5], [5, 24.5], [8.5, 23.5], [10.4, 29], [99, 29]]);
  const az = kf(t, [[0, 0.5], [6, -0.05], [12, -0.3]]);
  const el = kf(t, [[0, 0.36], [8, 0.42], [11, 0.5]]);
  const target = [0, kf(t, [[0, 2.3], [5, 2.0], [10, 1.8]]), 0.6];
  const pos = [target[0] + d * Math.sin(az) * Math.cos(el), target[1] + d * Math.sin(el), target[2] + d * Math.cos(az) * Math.cos(el)];
  return {pos, target};
};
export const CameraRig = ({cam}) => {
  const {camera} = useThree();
  camera.position.set(...cam.pos);
  camera.fov = 30; camera.near = 1; camera.far = 220;
  camera.lookAt(...cam.target);
  camera.updateProjectionMatrix();
  return null;
};

// ---------- peças ----------
export const FaceP = ({p, w = 1.2, ratio = 0.25, tex, k = 1, op = 1}) => {
  const c = useContext(CamCtx);
  if (k <= 0.003) return null;
  const yaw = Math.atan2(c[0] - p[0], c[2] - p[2]);
  return (
    <mesh position={p} rotation={[0, yaw, 0]} scale={k} renderOrder={5}>
      <planeGeometry args={[w, w * ratio]} />
      <meshBasicMaterial map={tex} transparent opacity={op} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

export const Halo = ({p, color, s = 2, op = 0.6}) => {
  const th = useTheme();
  if (!th.glow || op <= 0.01) return null;
  return (
    <sprite position={p} scale={[s, s, 1]} renderOrder={4}>
      <spriteMaterial map={haloTex()} color={color} transparent opacity={op} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
    </sprite>
  );
};

export const Flask = ({p, color, k = 1, dim = 0, s = 1, bob = 0}) => {
  const th = useTheme();
  if (k <= 0.003) return null;
  const col = new THREE.Color(color).lerp(new THREE.Color('#7b8094'), dim);
  const ei = th.id === 'noite' ? 0.9 * (1 - dim) : 0;
  return (
    <group position={[p[0], p[1] + bob, p[2]]} scale={k * s}>
      <mesh position={[0, 0.34, 0]} castShadow><cylinderGeometry args={[0.34, 0.38, 0.62, 24]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={ei} roughness={th.rough * 0.7} metalness={th.metal} /></mesh>
      <mesh position={[0, 0.78, 0]} castShadow><cylinderGeometry args={[0.15, 0.3, 0.26, 20]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={ei} roughness={th.rough * 0.7} /></mesh>
      <mesh position={[0, 0.98, 0]} castShadow><cylinderGeometry args={[0.17, 0.17, 0.14, 16]} /><meshStandardMaterial color={dim > 0.5 ? '#9096a8' : '#f4f4f6'} roughness={0.5} /></mesh>
      <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.36, 0.4, 0.66, 24]} /><meshStandardMaterial color="#ffffff" transparent opacity={th.id === 'noite' ? 0.12 : 0.22} roughness={0.1} depthWrite={false} /></mesh>
    </group>
  );
};

export const Beam = ({a, b, color, op = 1, t, speed = 0.7, n = 3}) => {
  const th = useTheme();
  const curve = useMemo(() => {
    const m = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 1.4, (a[2] + b[2]) / 2];
    return new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(...m), new THREE.Vector3(...b));
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 28, 0.035, 6), [curve]);
  if (op <= 0.01) return null;
  return (
    <group>
      <mesh geometry={geo}><meshBasicMaterial color={color} transparent opacity={0.55 * op} toneMapped={false} depthWrite={false} /></mesh>
      {Array.from({length: n}, (_, i) => {
        const u = (t * speed + i / n) % 1;
        const p = curve.getPoint(u);
        return (
          <group key={i}>
            <mesh position={p} scale={op}><sphereGeometry args={[0.11, 12, 10]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
            <Halo p={[p.x, p.y, p.z]} color={color} s={0.9} op={0.7 * op} />
          </group>
        );
      })}
    </group>
  );
};

export const Blender = ({t, level, shake, mix}) => {
  const th = useTheme();
  const liquid = new THREE.Color(th.liquid).lerp(new THREE.Color(th.pal.brand), mix);
  const eiL = th.id === 'noite' ? 0.9 : 0;
  return (
    <group>
      <RBox size={[1.9, 0.7, 1.9]} r={0.2} color={th.id === 'noite' ? '#1b2766' : '#ff7a45'} rough={th.rough} metal={th.metal} position={[0, 0.7, 0]} />
      <RBox size={[1.95, 0.12, 1.95]} r={0.05} color={th.accent} emissive={th.accent} emissiveIntensity={th.id === 'noite' ? 1.2 : 0} position={[0, 1.08, 0]} cast={false} />
      <group rotation={[0, 0, shake]} position={[0, 0, 0]}>
        <mesh position={[0, 2.2, 0]} castShadow>
          <cylinderGeometry args={[1.0, 0.68, 2.3, 40, 1, true]} />
          <meshStandardMaterial color={th.jar} transparent opacity={th.glass} roughness={0.05} metalness={0.1} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[0, 3.36, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.0, 0.05, 8, 40]} /><meshStandardMaterial color={th.jar} emissive={th.accent} emissiveIntensity={th.id === 'noite' ? 0.8 : 0} roughness={0.2} /></mesh>
        {level > 0.01 && (
          <mesh position={[0, 1.12 + (2.1 * level) / 2, 0]} scale={[1, Math.max(level, 0.01), 1]}>
            <cylinderGeometry args={[0.93, 0.66, 2.1, 36]} />
            <meshStandardMaterial color={liquid} emissive={liquid} emissiveIntensity={eiL} roughness={0.25} transparent opacity={0.92} />
          </mesh>
        )}
        {level > 0.05 && Array.from({length: 7}, (_, i) => {
          const a = t * (1.6 + i * 0.15) + i * 0.9, r = 0.28 + 0.1 * (i % 3);
          const y = 1.4 + ((i * 0.37 + t * 0.35) % 1) * 1.6 * level;
          return <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]} rotation={[a, a, 0]}><boxGeometry args={[0.16, 0.16, 0.16]} /><meshStandardMaterial color={Object.values(th.pal)[i % 5]} emissive={Object.values(th.pal)[i % 5]} emissiveIntensity={th.id === 'noite' ? 0.9 : 0} /></mesh>;
        })}
      </group>
    </group>
  );
};

const starShape = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.17 : 0.4, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
})();

export const Seal = ({p, k, t}) => {
  const th = useTheme();
  const geo = useMemo(() => new THREE.ExtrudeGeometry(starShape, {depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2}), []);
  if (k <= 0.003) return null;
  return (
    <group position={p} scale={k}>
      <group rotation={[0, t * 2.2, 0]}>
        <mesh geometry={geo} position={[0, 0, -0.06]} castShadow><meshStandardMaterial color={th.gold} emissive={th.gold} emissiveIntensity={th.id === 'noite' ? 1.1 : 0.15} roughness={0.3} metalness={0.5} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}><torusGeometry args={[0.55, 0.05, 8, 40]} /><meshStandardMaterial color={th.gold} emissive={th.gold} emissiveIntensity={th.id === 'noite' ? 0.9 : 0.1} metalness={0.5} roughness={0.3} /></mesh>
      </group>
      <Halo p={[0, 0, 0]} color={th.gold} s={2.6} op={0.8} />
    </group>
  );
};

export const Confetti = ({o, tau, n = 36, seed = 1}) => {
  const th = useTheme();
  if (tau < 0 || tau > 1.8) return null;
  const cols = [...Object.values(th.pal), th.gold];
  return (
    <group>
      {Array.from({length: n}, (_, i) => {
        const a = rn(i, seed) * Math.PI * 2, v = 1.5 + rn(i, seed + 1) * 3.2, up = 2.5 + rn(i, seed + 2) * 3;
        const p = [o[0] + Math.cos(a) * v * tau, o[1] + up * tau - 4.5 * tau * tau, o[2] + Math.sin(a) * v * tau];
        return <mesh key={i} position={p} rotation={[tau * 6 + i, tau * 5, 0]} scale={1 - prog(tau, 1.2, 1.8)}><boxGeometry args={[0.13, 0.13, 0.04]} /><meshBasicMaterial color={cols[i % cols.length]} toneMapped={false} /></mesh>;
      })}
    </group>
  );
};

// ---------- cena GEO ----------
const FL = [
  {id: 'blog', label: 'BLOG', p: [-3.0, 0.35, 0.7], cited: true},
  {id: 'wiki', label: 'WIKI', p: [-2.1, 0.35, -1.9], cited: true},
  {id: 'news', label: 'NOTÍCIA', p: [2.1, 0.35, -1.9]},
  {id: 'forum', label: 'FÓRUM', p: [3.0, 0.35, 0.7]},
  {id: 'brand', label: 'SUA MARCA', p: [0, 0.35, 2.7]},
];
const HERO = [0, 0.35, 2.6];
const MOUTH = [0, 3.35, 0];

export const GeoScene = ({t, gap = 1.4, lsc = 1}) => {
  const th = useTheme();
  const tm = t; // tempo do segmento (teaser começa em 0)
  const mixing = prog(tm, 1.0, 1.4) * (1 - prog(tm, 2.7, 3.0));
  const level = easeOut(prog(tm, 1.0, 2.5)) * 0.78;
  const shake = Math.sin(tm * 38) * 0.012 * mixing;
  const mix = prog(tm, 5.0, 6.2);
  // brand hop
  const hk = easeInOut(prog(tm, 4.1, 5.2));
  const hero = arc3(FL[4].p, HERO, hk, 1.8);
  const heroS = 1 + 0.5 * hk;
  const finalOut = 1 - prog(tm, 9.35, 9.7);
  const wid = {blog: 0, wiki: 1, news: 2, forum: 3, brand: 4};
  const words = SEG.words;
  const wt = (w) => words.find((x) => x.w.toLowerCase().startsWith(w)).s;
  const badges = [
    ['DADOS', th.pal.wiki, wt('dados'), 0],
    ['AUTORIDADE', th.gold, wt('autoridade'), 2.1],
    ['MARCA CLARA', th.pal.brand, wt('marca'), 4.2],
  ];
  return (
    <>
      {/* plataforma */}
      <group scale={[easeOutBack(prog(tm, 0, 0.6)), 1, easeOutBack(prog(tm, 0, 0.6))]}>
        <mesh position={[0, 0.175, 0]} receiveShadow castShadow><cylinderGeometry args={[4.3, 4.5, 0.35, 64]} /><meshStandardMaterial color={th.plate} roughness={th.rough} metalness={th.metal} /></mesh>
        <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[4.0, 4.2, 64]} /><meshStandardMaterial color={th.accent} emissive={th.accent} emissiveIntensity={th.id === 'noite' ? 1.5 : 0} roughness={0.6} /></mesh>
      </group>
      <Blender t={t} level={level} shake={shake} mix={mix} />
      <Halo p={[0, 2.3, 0]} color={th.liquid} s={5.5} op={0.55 * prog(tm, 1.0, 1.8)} />
      <group scale={finalOut}>
        {FL.map((f, i) => {
          const isBrand = f.id === 'brand';
          const pop = pk(tm, 0.05 + i * 0.13);
          const dimStage = isBrand ? 0 : f.cited ? 0.85 * prog(tm, 4.1, 4.6) : 0.7 * prog(tm, 2.7, 3.3) + 0.15 * prog(tm, 4.1, 4.6);
          const pos = isBrand ? hero : f.p;
          const s = isBrand ? heroS : 1 - 0.1 * prog(tm, 4.1, 4.6);
          const b = isBrand && hk >= 1 ? Math.sin(tm * 3) * 0.06 : 0;
          const col = th.pal[f.id];
          // feixes
          const a0 = prog(tm, 1.0 + i * 0.12, 1.3 + i * 0.12);
          let op;
          if (isBrand) op = Math.min(1, a0 * (1 - prog(tm, 2.7, 3.2)) + prog(tm, 5.0, 5.4));
          else if (f.cited) op = a0 * (1 - prog(tm, 4.1, 4.5));
          else op = a0 * (1 - prog(tm, 2.7, 3.2));
          const a = [pos[0], pos[1] + 0.95 * s, pos[2]];
          return (
            <group key={f.id}>
              <Flask p={pos} color={col} k={pop} dim={dimStage} s={s} bob={b} />
              <Halo p={[pos[0], pos[1] + 0.5 * s, pos[2]]} color={col} s={1.7 * s} op={0.55 * pop * (1 - dimStage)} />
              <FaceP p={[pos[0], pos[1] + 1.55 * s + b, pos[2]]} w={isBrand ? 2.1 : 1.65} tex={pillTex(f.label, {bg: th.labelBg, fg: th.labelFg, dot: col})} k={pk(tm, 0.3 + i * 0.13) * (isBrand && hk > 0 ? 1.15 : 1)} op={1 - 0.6 * dimStage} />
              <Beam a={a} b={MOUTH} color={col} op={op} t={tm} />
            </group>
          );
        })}
        {/* cartões de resposta */}
        {(() => {
          const ka = pk(tm, 2.55, 0.5) * (1 - prog(tm, 4.0, 4.35));
          const kb = pk(tm, 5.6, 0.5);
          const rise = easeOut(prog(tm, 2.55, 3.1));
          return (
            <>
              <FaceP p={[0, 3.9 + 1.7 * rise, 0]} w={3.5} ratio={0.667} tex={cardTex(th, 'a')} k={ka} />
              <FaceP p={[0, 5.6, 0]} w={3.5} ratio={0.667} tex={cardTex(th, 'b')} k={kb} />
            </>
          );
        })()}
        {/* selo e badges em volta da marca */}
        <Seal p={[hero[0], hero[1] + 2.9 + Math.sin(tm * 2.5) * 0.08, hero[2]]} k={pk(tm, 5.45, 0.5) * (tm > 5.4 ? 1 : 0)} t={tm} />
        {badges.map(([text, col, t0, ph], i) => {
          const ang = ph + tm * 0.9;
          const p = [hero[0] + Math.cos(ang) * 1.9, hero[1] + 1.3 + Math.sin(tm * 2 + i) * 0.12, hero[2] + Math.sin(ang) * 0.9];
          return <FaceP key={text} p={p} w={2.1} tex={pillTex(text, {bg: th.labelBg, fg: th.labelFg, dot: col})} k={pk(tm, t0, 0.35)} />;
        })}
      </group>
      <Confetti o={[0, 2.5, 2.2]} tau={tm - 5.45} seed={3} n={26} />
      <Confetti o={[0, 1.4, 2.2]} tau={tm - 9.6} seed={7} n={44} />
      {/* letras GEO */}
      {['G', 'E', 'O'].map((ch, i) => {
        const t0 = 9.5 + i * 0.14;
        const k = easeOutBack(prog(tm, t0, t0 + 0.45));
        if (tm < t0) return null;
        const y = 0.35 + 0.55 + (1 - easeOutBack(prog(tm, t0, t0 + 0.45))) * 5 + Math.max(0, Math.sin((tm - t0 - 0.5) * 4)) * 0.0;
        const col = [th.pal.wiki, th.gold, th.pal.brand][i];
        return (
          <group key={ch} position={[(i - 1) * gap, y + 0.55 * (lsc - 1), 2.0]} scale={lsc} rotation={[0, Math.sin(tm * 2 + i) * 0.1, 0]}>
            <RBox size={[1.1, 1.1, 1.1]} r={0.2} color={col} emissive={col} emissiveIntensity={th.id === 'noite' ? 0.7 : 0} rough={th.rough} />
            <mesh position={[0, 0, 0.56]}><planeGeometry args={[0.9, 0.9]} /><meshBasicMaterial map={letterTex(ch, '#ffffff', 'rgba(0,0,0,0)')} transparent toneMapped={false} /></mesh>
            <Halo p={[0, 0, 0]} color={col} s={2.6} op={0.7} />
          </group>
        );
      })}
    </>
  );
};

export const GeoWorld = ({t}) => {
  const th = useTheme();
  const cam = camAt(t);
  return (
    <>
      <color attach="background" args={[th.bg]} />
      <fog attach="fog" args={th.fog} />
      <Lights t={t} />
      <Env intensity={th.id === 'noite' ? 0.12 : 0.35} />
      <CameraRig cam={cam} />
      <Scenery t={t} />
      <GeoScene t={t} />
    </>
  );
};

// ---------- HUD ----------
const KW = ['fontes', 'fonte', 'dados', 'autoridade', 'marca', 'geo', 'ia'];
const norm = (w) => w.toLowerCase().replace(/[.,!?:;…]/g, '');
const ALLW = SEG.words.map((w) => ({...w, hl: KW.includes(norm(w.w))}));

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

const Header = ({t, th, active}) => (
  <div style={{position: 'absolute', top: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12, fontFamily: MONT}}>
    {['SEO', 'AEO', 'GEO'].map((n) => {
      const on = n === active;
      const sc = on ? 1 + 0.06 * Math.sin(t * 4) : 1;
      return (
        <div key={n} style={{padding: '9px 24px', borderRadius: 999, fontWeight: 900, fontSize: 24, letterSpacing: 1, transform: `scale(${sc})`, background: on ? th.gold : (th.id === 'noite' ? 'rgba(12,20,56,.75)' : 'rgba(255,255,255,.7)'), color: on ? '#17171d' : (th.id === 'noite' ? '#7e94d8' : '#6b6b78'), boxShadow: on ? `0 0 ${th.id === 'noite' ? 24 : 8}px ${th.gold}` : 'none', border: th.id === 'noite' ? `2px solid ${on ? th.gold : '#243072'}` : '2px solid rgba(0,0,0,.08)'}}>{n}</div>
      );
    })}
  </div>
);

const Fx = ({th}) => (
  <>
    {/* tilt-shift: desfoca faixas no topo e embaixo */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 330, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', maskImage: 'linear-gradient(#000 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(#000 0%, transparent 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', maskImage: 'linear-gradient(transparent 0%, #000 70%)', WebkitMaskImage: 'linear-gradient(transparent 0%, #000 70%)'}} />
    <div style={{position: 'absolute', inset: 0, background: th.id === 'noite' ? 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(2,4,16,.65) 100%)' : 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(60,40,10,.28) 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'linear-gradient(transparent, rgba(0,0,0,.35))'}} />
  </>
);

export const GeoTeaser = ({theme = 'noite', tList, audio = 'seo-geo-aeo/teaser.mp3'}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = tList ? tList[frame] : frame / FPS;
  const th = THEMES[theme];
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{background: th.bg}}>
      {!tList && <Audio src={staticFile(audio)} />}
      <FontGate>
        <ThemeCtx.Provider value={th}>
          <CamCtx.Provider value={cam.pos}>
            <ThreeCanvas width={width} height={height} shadows camera={{fov: 30, position: cam.pos, near: 1, far: 220}} gl={{antialias: true, toneMapping: th.tone, toneMappingExposure: th.exposure}}>
              <GeoWorld t={t} />
            </ThreeCanvas>
          </CamCtx.Provider>
        </ThemeCtx.Provider>
        <Fx th={th} />
        <Header t={t} th={th} active="GEO" />
        <Caption t={t} th={th} />
        <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.9)', fontFamily: MONT, fontWeight: 700, fontSize: 22, textShadow: '0 2px 6px rgba(0,0,0,.6)'}}>@idielsilva</div>
      </FontGate>
    </AbsoluteFill>
  );
};
