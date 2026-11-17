import React, {useMemo} from 'react';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {RBox, Env} from '../World.jsx';
import {FontGate} from '../fonts.jsx';
import {pillTex} from '../seo/theme.jsx';
import {useThree} from '@react-three/fiber';
import {Cyl, Ball, sag, Cable, House, Pole, Pylon, Battery, Inverter, Sun, Cloud, Tree, Building, Sea, Rail, Mount, QCtx, MONT} from './concept.jsx';

// ===== STORYBOARD / CLIPE: energia solar (A Ilha x Continente + D tabuleiro no fecho) =====
const clamp = (x) => Math.min(1, Math.max(0, x));
const sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const lerpA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const pop = (u, t0, d = 0.45) => { const k = clamp((u - t0) / d); const c = 1.70158 + 1; return k <= 0 ? 0 : 1 + c * Math.pow(k - 1, 3) + (c - 1) * Math.pow(k - 1, 2); };

const mixL = (a, b, k) => {
  const o = {...a};
  for (const key of Object.keys(a)) {
    const x = a[key], y = b[key];
    if (typeof x === 'number' && typeof y === 'number') o[key] = lerp(x, y, k);
    else if (typeof x === 'string' && x[0] === '#' && typeof y === 'string') o[key] = '#' + new THREE.Color(x).lerp(new THREE.Color(y), k).getHexString();
  }
  return o;
};
const GOLD = {bg: '#bfe3f7', sky: '#fff3dd', gnd: '#e7c98f', sunCol: '#ffd2a0', sunI: 2.3, hemi: 0.8, env: 0.4, sunPos: [6, 10, 7]};
const NIGHT = {bg: '#1b2a55', sky: '#6f86c9', gnd: '#1c2540', sunCol: '#8fa8ff', sunI: 0.5, hemi: 0.38, env: 0.1, sunPos: [6, 10, 7]};
const DUSK = {bg: '#46598f', sky: '#9db2e6', gnd: '#2a3555', sunCol: '#a9bcff', sunI: 0.75, hemi: 0.5, env: 0.14, sunPos: [6, 10, 7]};

const Rig2 = ({pos, target, w, h, off = 0.1}) => {
  const {camera} = useThree();
  camera.position.set(...pos); camera.lookAt(...target);
  camera.setViewOffset(w, h, 0, h * off, w, h); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return null;
};
// ---------- peças locais ----------
const Pill2 = ({text, p, w = 3, dot = '#ffb020', bg = '#fff', fg = '#111', sc = 1}) => {
  const tex = pillTex(text, {bg, fg, dot, w: 640});
  if (sc < 0.01) return null;
  return (
    <QCtx.Consumer>
      {(q) => (
        <mesh position={p} quaternion={q} scale={sc} renderOrder={20}>
          <planeGeometry args={[w, w / 5]} />
          <meshBasicMaterial map={tex} transparent depthTest={false} toneMapped={false} />
        </mesh>
      )}
    </QCtx.Consumer>
  );
};
const Pulses = ({pts, t, n = 4, speed = 0.5, color = '#ffe14d', r = 0.085, dir = 1, on = true}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), [JSON.stringify(pts)]);
  if (!on) return null;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        let k = (((t * speed + i / n) % 1) + 1) % 1;
        if (dir < 0) k = 1 - k;
        const q = curve.getPoint(k);
        return <Ball key={i} r={r} color={color} emissive={color} ei={2.2} position={[q.x, q.y, q.z]} />;
      })}
    </>
  );
};
const Lamp = ({p, on}) => (
  <group position={p}>
    <Cyl r={0.04} h={0.9} color="#6f6a64" position={[0, 0.45, 0]} />
    <Ball r={0.11} color={on ? '#fff2b0' : '#8c8c94'} emissive={on ? '#ffd45a' : undefined} ei={on ? 2 : 0} position={[0, 0.95, 0]} />
  </group>
);
const Meter = ({p, ok = true}) => (
  <group position={p}>
    <RBox size={[0.42, 0.5, 0.2]} r={0.05} color="#f2f4f8" position={[0, 0, 0]} />
    <Cyl r={0.13} h={0.04} color={ok ? '#19f0ff' : '#6a7280'} emissive={ok ? '#19f0ff' : undefined} ei={ok ? 1 : 0} position={[0, 0.02, 0.11]} rotation={[Math.PI / 2, 0, 0]} />
  </group>
);
const Coin = ({p}) => <Cyl r={0.26} h={0.07} color="#ffc82e" metal={0.4} rough={0.3} position={p} seg={24} />;

// ---------- mundo A (continente + ilha) ----------
const BLD = [[-2.4, 1.2, 1], [-0.6, 1.9, 1], [0.8, 1.5, 1.1], [1.9, 2.3, 1]];
const World = ({t, u, mode}) => {
  // bo = tempo desde o apagão (só no modo apagao)
  const bo = mode === 'apagao' ? u - 1.6 : -1;
  const gridOn = mode !== 'apagao' || bo < 0;
  const offNight = mode === 'off' && u > 4.2;
  const lampsCityOn = (i) => (mode === 'apagao' ? bo < 0.5 + (3 - i) * 0.4 : true);
  const houseOnLit = mode === 'apagao' ? bo < 1.4 : mode === 'on' && u > 6.2;
  const islandLit = mode === 'apagao' || mode === 'custo' || offNight;
  const battLvl = mode === 'off' ? (u < 4.2 ? Math.min(4, 1 + Math.floor(u / 1.0)) : Math.max(2, 4 - Math.floor((u - 4.2) / 1.3))) : mode === 'custo' ? Math.max(1, 4 - Math.floor(u / 1.6)) : 3;
  const exportDir = mode === 'on' && u > 6.2 ? -1 : 1;
  const showCont = mode !== 'off' && mode !== 'custo';
  const showIsl = mode !== 'on';
  const cloudy = mode === 'custo';
  const cut = bo > 0;
  const pylonTop = [2.2, 3.55, -3.6];
  const poleTop = [1.1, 2.5, -2.1];
  const flash = bo > 0 && bo < 0.35 ? 1 - bo / 0.35 : 0;
  return (
    <>
      <RBox size={[70, 0.2, 70]} r={0.05} color="#52b4ee" rough={0.18} position={[0, -0.5, 0]} />
      {/* ===== continente (ON-GRID) ===== */}
      {showCont && <>
      <RBox size={[6.6, 0.8, 5.2]} r={0.2} color="#9bd36b" position={[0, -0.1, -3.4]} />
      <House p={[-1.4, 0.3, -3.3]} ry={0.15} lit={houseOnLit} />
      <Inverter p={[-0.15, 0.3, -2.6]} />
      <Pole p={[0.8, 0.3, -2.1]} />
      <Meter p={[0.8, 1.15, -1.95]} ok={gridOn} />
      <Pylon p={[2.2, 0.3, -3.6]} />
      {BLD.map((b, i) => (
        <Building key={i} p={[b[0], 0.3, -5.4]} s={[b[2], b[1] + 0.2, 1]} lit={mode === 'apagao' ? bo < 0.7 + (3 - i) * 0.4 : mode === 'on' && u > 6.2 ? true : false} color="#d9cfc0" />
      ))}
      {[-2.9, -1.2, 0.2].map((x, i) => <Lamp key={i} p={[x, 0.3, -1.3]} on={mode === 'apagao' ? bo < 0.9 + (2 - i) * 0.4 : mode === 'on' && u > 6.2} />)}
      {/* cabos */}
      <Cable pts={sag([-1.4, 1.8, -2.95], [-0.15, 1.05, -2.6], 0.25)} />
      <Cable pts={sag([-0.15, 1.05, -2.6], [0.8, 2.5, -2.1], 0.2)} />
      {!cut && <Cable pts={sag(poleTop, pylonTop, 0.35)} />}
      {cut && (
        <>
          <Cable pts={[poleTop, [1.3, 2.2, -2.3], [1.45, 1.4, -2.4]]} />
          <Cable pts={[pylonTop, [2.0, 3.1, -3.5], [1.85, 2.2, -3.4]]} />
        </>
      )}
      {flash > 0 && <Ball r={0.35 + flash * 0.4} color="#fff" emissive="#fff3a0" ei={4 * flash} position={[1.65, 3.0, -2.9]} />}
      {flash > 0 && Array.from({length: 7}, (_, i) => <Ball key={i} r={0.05} color="#ffe14d" emissive="#ffd000" ei={3} position={[1.65 + Math.cos(i * 0.9) * (1 - flash) * 0.9, 3.0 - (1 - flash) * (0.5 + i * 0.12), -2.9 + Math.sin(i * 0.9) * (1 - flash) * 0.5]} />)}
      {/* pulsos on-grid */}
      <Pulses pts={sag([-1.4, 1.8, -2.95], [-0.15, 1.05, -2.6], 0.25)} t={t} on={mode === 'on' && u > 1.0 && u < 6.2} n={3} />
      <Pulses pts={sag([-0.15, 1.05, -2.6], [0.8, 2.5, -2.1], 0.2)} t={t} on={mode === 'on' && u > 1.5 && u < 6.2} n={3} />
      <Pulses pts={sag(poleTop, pylonTop, 0.35)} t={t} on={mode === 'on' && u > 3.2} dir={exportDir} n={4} color={exportDir > 0 ? '#ffe14d' : '#7fd1ff'} />
      </>}
      {/* ===== ilha (OFF-GRID) ===== */}
      {showIsl && <>
      <Cyl r={2.7} h={0.8} color="#e8d29a" position={[0, -0.1, 3.3]} seg={48} />
      <Cyl r={2.5} h={0.12} color="#8fcf6a" position={[0, 0.36, 3.3]} seg={48} />
      <House p={[-1.5, 0.42, 2.8]} ry={-0.1} lit={islandLit} />
      <group position={[-0.35, 0.42, 3.9]}>
        <RBox size={[0.5, 0.5, 0.25]} r={0.05} color="#ffb020" position={[0, 0.25, 0]} />
        <RBox size={[0.3, 0.14, 0.03]} r={0.02} color="#fff" emissive="#fff3c0" emissiveIntensity={0.6} position={[0, 0.32, 0.14]} cast={false} />
      </group>
      <Battery p={[0.6, 0.42, 3.1]} lvl={battLvl} />
      <Inverter p={[1.5, 0.42, 3.9]} />
      <Tree p={[-2.0, 0.42, 4.3]} /><Tree p={[-1.6, 0.42, 4.8]} s={0.7} /><Tree p={[2.0, 0.42, 2.5]} s={0.8} />
      <Cable pts={sag([-1.5, 1.8, 3.2], [-0.35, 0.95, 3.9], 0.25)} />
      <Cable pts={sag([-0.35, 0.95, 3.9], [0.6, 1.6, 3.1], 0.2)} />
      <Cable pts={sag([0.6, 1.6, 3.1], [1.5, 1.2, 3.9], 0.2)} />
      <Cable pts={[[1.5, 0.7, 4.1], [0.3, 0.45, 4.85], [-1.25, 0.7, 3.55]]} />
      {mode === 'off' && (
        <>
          <Pulses pts={sag([-1.5, 1.8, 3.2], [-0.35, 0.95, 3.9], 0.25)} t={t} on={u > 0.8 && u < 4.2} n={3} />
          <Pulses pts={sag([-0.35, 0.95, 3.9], [0.6, 1.6, 3.1], 0.2)} t={t} on={u > 1.2 && u < 4.2} n={3} />
          <Pulses pts={sag([0.6, 1.6, 3.1], [1.5, 1.2, 3.9], 0.2)} t={t} on={u > 4.6} n={3} color="#7dffa8" />
          <Pulses pts={[[1.5, 0.7, 4.1], [0.3, 0.45, 4.85], [-1.25, 0.7, 3.55]]} t={t} on={u > 5.0} n={4} color="#7dffa8" />
        </>
      )}
      {mode === 'apagao' && (
        <>
          <Pulses pts={sag([0.6, 1.6, 3.1], [1.5, 1.2, 3.9], 0.2)} t={t} n={3} color="#7dffa8" />
          <Pulses pts={[[1.5, 0.7, 4.1], [0.3, 0.45, 4.85], [-1.25, 0.7, 3.55]]} t={t} n={4} color="#7dffa8" />
        </>
      )}
      </>}
      {/* céu */}
      {darkK(mode, u) < 0.55 ? <Sun p={[1.3, 6.4, -6]} r={0.85} /> : <Ball r={0.8} color="#f4f1e0" emissive="#cfd8ff" ei={0.9} position={[1.3, 6.4, -6]} />}
      {!cloudy && <><Cloud p={[-2.6, 5.4, -4]} s={0.8} /><Cloud p={[3.4, 4.6, -2]} s={0.6} /></>}
      {cloudy && (
        <>
          <Cloud p={[1.0, 5.8, -4.2]} s={1.5} color="#c9d2e0" /><Cloud p={[-0.4, 5.4, -3.6]} s={1.3} color="#b9c3d4" /><Cloud p={[2.4, 5.2, -4]} s={1.2} color="#c9d2e0" />
        </>
      )}
    </>
  );
};

// ---------- fecho D: tabuleiro ----------
const along = (pts, k) => {
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const tot = L.reduce((a, b) => a + b, 0);
  let d = clamp(k) * tot;
  for (let i = 0; i < L.length; i++) {
    if (d <= L[i] || i === L.length - 1) { const r = L[i] ? d / L[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], r), lerp(pts[i][1], pts[i + 1][1], r)]; }
    d -= L[i];
  }
  return pts[pts.length - 1];
};
const Board = ({t, u}) => {
  const left = [[0, 4.3], [0, 0.6], [-1.6, -1.2], [-1.6, -3.0]];
  const right = [[0, 4.3], [0, 0.6], [1.6, -1.2], [1.6, -3.0]];
  const p1 = along(left, sm(3.2, 5.6, u));
  const p2 = along(right, sm(7.4, 9.6, u));
  const showP2 = u > 7.2;
  const hybrid = u > 10.0;
  return (
    <>
      <RBox size={[7.4, 0.2, 11.6]} r={0.1} color="#2f6fb3" position={[0, -0.25, 0]} rough={0.2} />
      <RBox size={[6.6, 0.3, 11]} r={0.15} color="#f4ecdc" position={[0, 0.1, 0]} />
      <Rail a={[0, 4.3]} b={[0, 0.6]} /><Rail a={[0, 0.6]} b={[-1.6, -1.2]} /><Rail a={[0, 0.6]} b={[1.6, -1.2]} />
      <Rail a={[-1.6, -1.2]} b={[-1.6, -3.0]} /><Rail a={[1.6, -1.2]} b={[1.6, -3.0]} />
      {/* partida */}
      <RBox size={[1.8, 0.1, 1.2]} r={0.05} color="#ffd23f" position={[0, 0.3, 4.4]} />
      <Pill2 text="VOCÊ" p={[0, 1.9, 4.4]} dot="#ffd23f" w={1.8} sc={pop(u, 0.2) * (u < 3.4 ? 1 : 0)} />
      {/* peões (casinhas) */}
      <House p={[p1[0], 0.3, p1[1]]} s={0.6} panels />
      {showP2 && <House p={[p2[0], 0.3, p2[1]]} s={0.6} panels lit />}
      {/* poste da decisão */}
      <Cyl r={0.05} h={1.4} color="#7a4a2b" position={[0, 0.9, 0.6]} />
      <Pill2 text="Tem rede por perto?" p={[0, 2.3, 0.6]} dot="#ff9a3d" w={3.8} sc={pop(u, 1.4)} />
      <RBox size={[2.9, 0.1, 2.9]} r={0.08} color="#ffe3c2" position={[-1.6, 0.3, -3.5]} />
      <RBox size={[2.9, 0.1, 2.9]} r={0.08} color="#d4f2dc" position={[1.6, 0.3, -3.5]} />
      {/* destino esquerdo: cidade */}
      {[[-2.3, 1.3], [-1.6, 1.9], [-0.9, 1.1]].map((b, i) => <Building key={i} p={[b[0], 0.25, -3.9 - i * 0.2]} s={[0.6, b[1], 0.6]} color="#c7d3ea" lit={u > 5.8} />)}
      <Pylon p={[-2.7, 0.25, -3.0]} h={2} />
      <Pill2 text={hybrid ? 'HÍBRIDO (+ bateria)' : 'SIM · ON-GRID'} p={[-1.6, 2.9, -2.3]} dot={hybrid ? '#b07cff' : '#ff9a3d'} w={hybrid ? 3.3 : 2.8} sc={pop(u, hybrid ? 10.0 : 5.6)} />
      {hybrid && <group scale={pop(u, 10.2)}><Battery p={[-1.9, 0.25, -2.2]} lvl={4} /></group>}
      {/* destino direito: sem rede */}
      <Mount p={[2.5, 0.25, -4.4]} /><Mount p={[0.9, 0.25, -4.6]} r={0.7} h={1.1} />
      <House p={[1.6, 0.25, -3.5]} s={0.75} lit={u > 9.4} panels />
      <Tree p={[2.5, 0.25, -2.7]} s={0.7} />
      <Pill2 text="NÃO · OFF-GRID" p={[1.6, 2.9, -2.3]} dot="#2fbf71" w={2.8} sc={pop(u, 9.4)} />
      {/* CTA */}
      <Pill2 text="@idielsilva" p={[0, 0.9, 4.9]} dot="#ff2d2d" w={3.2} sc={pop(u, 12.6)} />
      <Sun p={[-0.4, 6.2, -5.5]} r={0.7} />
    </>
  );
};

// ---------- cenas: câmera, luz, rótulos, legenda ----------
const CAM_WIDE = {pos: [0, 22, 17], target: [0, 0, -0.2], fov: 38};
const darkK = (sid, u) => (sid === 'on' ? sm(5.6, 6.8, u) : sid === 'off' ? sm(3.6, 5.4, u) : sid === 'apagao' ? sm(1.2, 3.4, u) : 0);
export const SCENES = {
  gancho: {n: 1, nome: 'GANCHO', dur: 9, cam: (u) => ({pos: lerpA([0, 27, 27], CAM_WIDE.pos, sm(0, 5, u)), target: CAM_WIDE.target, fov: 38}), L: () => GOLD,
    caps: [[0, 2.8, 'Energia solar: on-grid ou off-grid?'], [2.8, 5.2, 'A maioria escolhe pelo preço. E erra.'], [5.2, 9, 'A escolha começa numa pergunta: tem rede por perto?']]},
  on: {n: 2, nome: 'ON-GRID · continente', dur: 12, cam: (u) => ({pos: lerpA([-0.4, 14.0, 14.2], [0.8, 13.4, 13.6], sm(0, 12, u)), target: [0.2, 0.8, -3.0], fov: 40}), L: (u) => mixL(GOLD, NIGHT, sm(5.6, 6.8, u)),
    caps: [[0, 3.5, 'Painel, inversor e a rede da distribuidora.'], [3.5, 6.2, 'De dia, você usa o sol. O que sobra vira crédito na conta.'], [6.2, 9.0, 'À noite, você puxa da rede.'], [9.0, 12, 'Esse é o on-grid.']]},
  off: {n: 3, nome: 'OFF-GRID · ilha', dur: 12, cam: (u) => ({pos: lerpA([-0.4, 12.8, 18.0], [0.8, 12.2, 17.2], sm(0, 12, u)), target: [0.0, 0.8, 3.0], fov: 40}), L: (u) => mixL(GOLD, NIGHT, sm(3.6, 5.4, u)),
    caps: [[0, 3.8, 'Já o off-grid não tem rede.'], [3.8, 6.8, 'O sol carrega a bateria. A bateria acende a casa à noite.'], [6.8, 9.5, 'Painel, controlador, bateria e inversor.'], [9.5, 12, 'Esse é o off-grid.']]},
  apagao: {n: 4, nome: 'APAGÃO · o erro comum', dur: 11, cam: () => CAM_WIDE, L: (u) => mixL(GOLD, NIGHT, sm(1.2, 3.4, u)),
    caps: [[0, 1.6, 'Agora o erro mais comum.'], [1.6, 4.4, 'Acaba a luz na cidade. O on-grid desliga junto, por segurança.'], [4.4, 8, 'O off-grid segue ligado.'], [8, 11, 'Rede caiu? Quem tem bateria não percebe.']]},
  custo: {n: 5, nome: 'CUSTO · a bateria', dur: 10, cam: (u) => ({pos: lerpA([1.0, 12.5, 22.5], [0.6, 11.8, 21.5], sm(0, 10, u)), target: [0.6, 1.0, 3.4], fov: 40}), L: (u) => mixL(GOLD, {...DUSK, bg: '#8aa0b8', sunI: 1.1, hemi: 0.7, env: 0.3}, sm(0, 3, u)),
    caps: [[0, 3.2, 'Mas off-grid não é de graça.'], [3.2, 6.6, 'A bateria é a parte cara. E precisa aguentar dias nublados.'], [6.6, 10, 'Dimensionar errado é o erro que mais custa.']]},
  fecho: {n: 6, nome: 'FECHO · qual indicar', dur: 15, cam: (u) => ({pos: lerpA([0, 24, 17], [0, 17.2, 12.6], sm(0, 3, u)), target: [0, 0, -1.4], fov: 40}), L: () => GOLD, board: true,
    caps: [[0, 3.2, 'Então, qual é o melhor para você?'], [3.2, 6.8, 'Tem rede por perto? Casa ou comércio na cidade: on-grid.'], [6.8, 10, 'Sítio sem rede: off-grid.'], [10, 15, 'E se quiser segurança no apagão: híbrido.']]},
};

const Overlay = ({scene, u, capNode}) => {
  const cap = scene.caps.find((c) => u >= c[0] && u < c[1]) || scene.caps[scene.caps.length - 1];
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontFamily: MONT}}>
        <div style={{display: 'inline-block', padding: '10px 24px', borderRadius: 40, background: 'rgba(255,255,255,.95)', color: '#111', fontWeight: 800, fontSize: 24, boxShadow: '0 2px 10px rgba(0,0,0,.25)'}}>
          {scene.n} · {scene.nome}
        </div>
      </div>
      {capNode ? capNode : (
      <div style={{position: 'absolute', left: 0, right: 0, top: 842, textAlign: 'center', fontFamily: MONT, fontWeight: 900, fontSize: 46, lineHeight: 1.18, color: '#fff', textShadow: '0 3px 10px rgba(0,0,0,.65)', padding: '0 44px'}}>
        {cap[2]}
      </div>)}
    </>
  );
};

export const SolarStory = ({scene = 'on', u0 = 0, list, uFixed = null, capNode = null}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  let sid = scene, u = u0 + frame / fps;
  if (list) { const it = list[frame % list.length]; sid = it.s; u = it.u; }
  if (uFixed !== null) u = uFixed;
  const S = SCENES[sid];
  const cam = S.cam(u);
  const L = S.L(u);
  const q = useMemo(() => {
    const c = new THREE.PerspectiveCamera(); c.position.set(...cam.pos); c.lookAt(...cam.target); c.updateMatrixWorld(); return c.quaternion.clone();
  }, [cam.pos.join(), cam.target.join()]);
  return (
    <AbsoluteFill style={{background: L.bg}}>
      <FontGate>
        <QCtx.Provider value={q}>
          <ThreeCanvas width={width} height={height} shadows camera={{fov: cam.fov, position: cam.pos, near: 0.5, far: 200}} gl={{antialias: true, toneMapping: THREE.NeutralToneMapping}}>
            <Rig2 pos={cam.pos} target={cam.target} w={width} h={height} off={S.board ? 0.075 : sid === 'gancho' || sid === 'apagao' ? 0.08 : 0.1} />
            <color attach="background" args={[L.bg]} />
            <Env intensity={L.env} />
            <hemisphereLight args={[L.sky, L.gnd, L.hemi]} />
            <directionalLight position={L.sunPos} intensity={L.sunI} color={L.sunCol} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-0.0005} />
            {S.board ? <Board t={u} u={u} /> : <World t={u} u={u} mode={sid} />}
            {!S.board && <ScenePills sid={sid} u={u} />}
            {sid === 'apagao' && <pointLight position={[-0.8, 1.6, 3.9]} intensity={5 * darkK(sid, u)} color="#ffd98a" distance={7} />}
            {sid === 'off' && <pointLight position={[-0.8, 1.6, 3.9]} intensity={5 * darkK(sid, u)} color="#ffd98a" distance={7} />}
          </ThreeCanvas>
        </QCtx.Provider>
        <Overlay scene={S} u={u} capNode={capNode} />
      </FontGate>
    </AbsoluteFill>
  );
};

const ScenePills = ({sid, u}) => {
  if (sid === 'gancho') {
    return (
      <>
        <Pill2 text="?" p={[0, 3.6, 0.2]} dot="#ff9a3d" w={2.6} sc={pop(u, 6.0) * (1 + 0.04 * Math.sin(u * 5))} />
        <Pill2 text="ON-GRID" p={[-1.2, 3.2, -2.4]} dot="#ff9a3d" w={2.8} sc={pop(u, 1.0)} />
        <Pill2 text="OFF-GRID" p={[0.4, 2.3, 3.2]} dot="#2fbf71" w={2.8} sc={pop(u, 2.0)} />
      </>
    );
  }
  if (sid === 'on') {
    return (
      <>
        <Pill2 text="Painel solar" p={[-1.9, 3.1, -2.6]} dot="#2f6fe0" w={2.3} sc={pop(u, 7.0)} />
        <Pill2 text="Inversor" p={[-0.1, 2.1, -1.9]} dot="#19c3d6" w={1.9} sc={pop(u, 7.3)} />
        <Pill2 text="Rede da distribuidora" p={[2.0, 4.8, -3.2]} dot="#ff9a3d" w={3.2} sc={pop(u, 7.7)} />
        <Pill2 text={u < 6.2 ? 'Sobrou? Vira crédito ➜' : '⬅ Noite: puxa da rede'} p={[0.9, 3.6, -1.6]} dot={u < 6.2 ? '#ffc82e' : '#7fd1ff'} w={3.3} sc={pop(u, 3.4) * (u > 6.95 ? 0 : 1)} />
        {u > 9.0 && <Pill2 text="ON-GRID" p={[0, 5.8, -3.3]} dot="#ff9a3d" w={2.6} bg="#ff9a3d" fg="#fff" sc={pop(u, 9.0)} />}
      </>
    );
  }
  if (sid === 'off') {
    return (
      <>
        <Pill2 text="Painel" p={[-1.7, 3.0, 2.9]} dot="#2f6fe0" w={1.7} sc={pop(u, 6.2)} />
        <Pill2 text="Controlador" p={[-0.1, 1.7, 5.0]} dot="#ffb020" w={2.3} sc={pop(u, 6.8)} />
        <Pill2 text="Bateria" p={[0.9, 3.0, 3.1]} dot="#2fbf71" w={1.8} sc={pop(u, 7.3)} />
        <Pill2 text="Inversor" p={[1.8, 2.0, 4.4]} dot="#19c3d6" w={1.9} sc={pop(u, 7.8)} />
        <Pill2 text="SEM REDE" p={[0, 4.6, 3.0]} dot="#2fbf71" w={2.3} sc={pop(u, 0.2) * (u < 3.8 ? 1 : 0)} />
        {u > 9.5 && <Pill2 text="OFF-GRID" p={[0, 4.6, 3.0]} dot="#2fbf71" w={2.6} bg="#2fbf71" fg="#fff" sc={pop(u, 9.5)} />}
      </>
    );
  }
  if (sid === 'apagao') {
    return (
      <>
        <Pill2 text="ON-GRID" p={[-1.2, 3.4, -3.2]} dot="#ff9a3d" w={2.4} sc={pop(u, 0.2) * (u < 1.6 ? 1 : 0)} />
        {u > 1.6 && <Pill2 text="REDE CAIU" p={[2.0, 4.6, -2.4]} dot="#ff3b3b" w={2.4} bg="#ff3b3b" fg="#fff" sc={pop(u, 1.6)} />}
        {u > 3.65 && <Pill2 text="Desliga junto (segurança)" p={[-1.2, 3.4, -2.6]} dot="#ff3b3b" w={3.7} sc={pop(u, 3.65)} />}
        {u > 4.4 && <Pill2 text="OFF-GRID segue ligado" p={[0.1, 3.0, 3.4]} dot="#2fbf71" w={3.7} sc={pop(u, 4.4)} />}
      </>
    );
  }
  if (sid === 'custo') {
    const coins = Math.min(9, Math.floor(u * 1.4));
    const day = Math.max(1, Math.min(3, 1 + Math.floor((u - 3.6) / 1.1)));
    return (
      <>
        <group>{Array.from({length: coins}, (_, i) => <Coin key={i} p={[2.3, 0.5 + i * 0.075, 4.3]} />)}</group>
        <Pill2 text="A parte cara do sistema" p={[1.4, 2.6, 5.4]} dot="#ffc82e" w={3.2} sc={pop(u, 2.8)} />
        <Pill2 text={`Dia nublado ${day}`} p={[-0.4, 3.8, 1.2]} dot="#8a96ab" w={2.5} sc={pop(u, 3.6)} />
        {u > 6.4 && <Pill2 text="Dimensione com folga" p={[0.0, 1.4, 6.6]} dot="#2fbf71" w={3.3} sc={pop(u, 6.4)} />}
      </>
    );
  }
  return null;
};

// ---- composições ----
export const STORY_LIST = [
  {s: 'gancho', u: 1.0}, {s: 'gancho', u: 7.4},
  {s: 'on', u: 2.2}, {s: 'on', u: 4.6},
  {s: 'off', u: 2.6}, {s: 'off', u: 8.0},
  {s: 'apagao', u: 1.0}, {s: 'apagao', u: 1.75}, {s: 'apagao', u: 3.4}, {s: 'apagao', u: 6.0},
  {s: 'custo', u: 5.0}, {s: 'custo', u: 8.0},
  {s: 'fecho', u: 2.4}, {s: 'fecho', u: 4.4}, {s: 'fecho', u: 8.6}, {s: 'fecho', u: 13.0},
];
export const SCENE_DUR = Object.fromEntries(Object.entries(SCENES).map(([k, v]) => [k, v.dur]));
