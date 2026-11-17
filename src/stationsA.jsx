import React from 'react';
import {RBox} from './World.jsx';
import {prog, easeInOut, easeOut, easeOutBack, lerp, lerp3, clamp} from './lib.js';
import {pk, fade, arc3, rn, pulse, Cube, MiniLLM, Tx, Burst, Pkt, Coin, Wire} from './kit.jsx';

const Y0 = 0.12;
const PAL = ['#ffd23f', '#ff5a4f', '#3fa7ff', '#7be08a', '#c39bff'];

// engrenagem com eixo em x
export const GearX = ({p, r = 0.38, teeth = 8, rot = 0, color = '#c9ccd4', k = 1}) => (
  <group position={p} scale={k}>
    <group rotation={[0, 0, Math.PI / 2]}>
      <group rotation={[0, rot, 0]}>
        <mesh castShadow><cylinderGeometry args={[r, r, 0.22, 24]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.35} /></mesh>
        {Array.from({length: teeth}).map((_, i) => {
          const a = (i / teeth) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * (r + 0.05), 0, Math.sin(a) * (r + 0.05)]} rotation={[0, -a, 0]} castShadow>
              <boxGeometry args={[0.16, 0.22, 0.14]} />
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
            </mesh>
          );
        })}
        <mesh><cylinderGeometry args={[r * 0.35, r * 0.35, 0.26, 16]} /><meshStandardMaterial color="#555a66" /></mesh>
      </group>
    </group>
  </group>
);

// ---------------------------------------------------------------- 2 RAG
export const S2 = ({tau, b, c}) => {
  const zs = [-1.05, -0.35, 0.35, 1.05];
  const sel = [1, 2];
  const scan = easeInOut(prog(tau, b + 0.1, b + 1.3));
  const mz = lerp(-1.3, 1.3, scan);
  const fly0 = b + 1.45, fly1 = b + 2.15;
  const LL = [1.1, Y0, 0];
  const top = [1.1, Y0 + 1.3, 0];
  const bump = 1 + 0.14 * Math.sin(Math.PI * prog(tau, fly1, fly1 + 0.35));
  return (
    <group>
      {zs.map((z, i) => {
        const k = pk(tau, 0.15 + i * 0.14);
        if (k < 0.03) return null;
        const hl = sel.includes(i) && tau > b + 0.1 && mz >= z - 0.3;
        return (
          <group key={i} position={[-0.9, Y0, z]} scale={[1, Math.max(k, 0.001), 1]}>
            <RBox size={[0.1, 1.1, 0.55]} r={0.03} color={hl ? '#ffd23f' : '#f7f2e7'} emissive="#ffb800" emissiveIntensity={hl ? 0.5 : 0} position={[0, 0.55, 0]} />
            {[0.8, 0.62, 0.44].map((y, j) => (
              <RBox key={j} size={[0.02, 0.07, 0.34 - j * 0.06]} r={0.01} color={hl ? '#b27a00' : '#9a9aa8'} position={[0.06, y, 0.0]} />
            ))}
          </group>
        );
      })}
      <Wire tau={tau} t0={b + 0.9} a={[-0.7, Y0 + 0.12, 0]} b={[0.62, Y0 + 0.3, 0]} color="#ffd23f" lift={0.12} />
      <MiniLLM p={LL} k={pk(tau, 0.1, 0.4)} ei={tau > fly1 ? 0.5 * (1 - prog(tau, fly1 + 0.2, fly1 + 1.2)) : 0} s={0.95} />
      <group position={LL} scale={[1, bump, 1]} />
      {tau > 0.3 && tau < fly1 && <Tx text="?" p={[1.1, Y0 + 2.0, 0]} w={3.4} fg="#ffd23f" k={pk(tau, 0.3) * (1 - prog(tau, fly1 - 0.2, fly1))} />}
      {tau > fly1 && <Tx text="OK" p={[1.1, Y0 + 2.0, 0]} w={3.2} fg="#7be08a" k={pk(tau, fly1)} />}
      {tau > b + 0.05 && tau < b + 1.5 && (
        <group position={[-0.3, Y0 + 1.15, mz]} scale={Math.min(prog(tau, b + 0.05, b + 0.3), 1 - prog(tau, b + 1.3, b + 1.5))}>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[0.3, 0.065, 12, 32]} /><meshStandardMaterial color="#3b3b46" metalness={0.4} roughness={0.4} /></mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.27, 28]} /><meshStandardMaterial color="#bfe6ff" transparent opacity={0.35} /></mesh>
          <mesh position={[0, -0.55, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.5, 10]} /><meshStandardMaterial color="#3b3b46" /></mesh>
        </group>
      )}
      {sel.map((i, j) => {
        const t0 = fly0 + j * 0.12, t1 = fly1 - 0.05 + j * 0.12;
        if (tau < t0 || tau > t1) return null;
        const k = prog(tau, t0, t1);
        const p = arc3([-0.9, Y0 + 0.9, zs[i]], top, easeInOut(k), 0.9);
        return <RBox key={i} size={[0.5, 0.05, 0.6]} r={0.02} color="#ffd23f" emissive="#ffb800" emissiveIntensity={0.5} position={p} rotation={[0, k * 4, 0.3]} scale={1 - 0.5 * k} />;
      })}
    </group>
  );
};

// ---------------------------------------------------------------- 3 EMBEDDINGS
const H1 = [0.5, 1.1, 0.8, 1.5, 0.7];
const H2 = [0.56, 1.0, 0.86, 1.4, 0.76];
export const S3 = ({tau, b, c}) => {
  const words = [['gato', -1.0, 0], ['cão', 0, 1], ['carro', 1.0, 2]];
  const rows = [[1.15, H1, b + 0.9], [1.7, H2, b + 1.7]];
  const spin = tau * 1.6;
  const ringK = pk(tau, 0.2, 0.4);
  const ringGlow = fade(tau, b + 0.5, b + 2.4, 0.2) * 0.9;
  return (
    <group>
      <Wire tau={tau} t0={b + 0.05} a={[-1.1, Y0 + 0.1, 0]} b={[-0.1, Y0 + 0.4, 0]} color="#b07cff" lift={0.1} dur={0.4} />
      <Wire tau={tau} t0={b + 0.6} a={[0.5, Y0 + 0.4, 0]} b={[1.0, Y0 + 0.1, 0]} color="#b07cff" lift={0.1} dur={0.35} />
      {/* portal */}
      <group position={[0.2, Y0 + 0.95, 0]} scale={Math.max(ringK, 0.001)}>
        <mesh rotation={[0, Math.PI / 2, spin]} castShadow><torusGeometry args={[0.8, 0.09, 14, 40]} /><meshStandardMaterial color="#b07cff" emissive="#8a4dff" emissiveIntensity={0.3 + ringGlow} roughness={0.35} /></mesh>
        <mesh rotation={[0, Math.PI / 2, -spin * 0.7]}><torusGeometry args={[0.55, 0.035, 10, 32]} /><meshStandardMaterial color="#e1ccff" emissive="#b07cff" emissiveIntensity={0.5} /></mesh>
      </group>
      {words.map(([w, z, i]) => {
        const k = pk(tau, 0.2 + i * 0.15, 0.3);
        if (i === 0 || i === 1) {
          const t0 = rows[i][2] - 0.55, t1 = rows[i][2] + 0.1;
          if (tau >= t0) {
            if (tau > t1) return null;
            const q = easeInOut(prog(tau, t0, t1));
            const p = lerp3([-1.35, Y0, z], [0.1, Y0 + 0.45, 0], q);
            return (
              <group key={w}>
                <Cube p={p} s={0.6} color="#f4ecdc" k={1 - 0.6 * q} />
                <Tx text={w} p={[p[0], p[1] + 1.0, p[2]]} w={1.1} fg="#17171d" bg="#fff" font="800 62px Montserrat" k={1 - q} />
              </group>
            );
          }
        }
        return (
          <group key={w}>
            <Cube p={[-1.35, Y0, z]} s={0.6} color="#f4ecdc" k={k} />
            <Tx text={w} p={[-1.35, Y0 + 1.0, z]} w={1.1} fg="#17171d" bg="#fff" font="800 62px Montserrat" k={k} />
          </group>
        );
      })}
      {tau > 0.4 && tau < b + 0.7 && <Tx text="?" p={[-1.35, Y0 + 2.0, 0]} w={3.0} fg="#ffd23f" k={pk(tau, 0.4) * (1 - prog(tau, b + 0.5, b + 0.7))} />}
      {rows.map(([x, H, t0], r) => (
        <group key={r}>
          {H.map((h, j) => {
            const k = easeOutBack(prog(tau, t0 + j * 0.07, t0 + j * 0.07 + 0.35));
            if (k < 0.03) return null;
            return <RBox key={j} size={[0.16, Math.max(h * k, 0.01), 0.16]} r={0.04} color={PAL[(j + r) % 5]} position={[x, Y0 + (h * k) / 2, (j - 2) * 0.27]} />;
          })}
        </group>
      ))}
      {tau > rows[0][2] + 0.5 && <Tx text="[0.2, 0.8, 0.5 ...]" p={[1.2, Y0 + 2.2, 0]} w={2.2} fg="#e1ccff" font="700 40px JetBrains Mono" k={pk(tau, rows[0][2] + 0.5)} />}
      {tau > rows[1][2] + 0.6 && <Tx text="PARECIDOS" p={[1.45, Y0 + 2.7, 0]} w={1.35} fg="#17171d" bg="#fff" font="800 56px Montserrat" k={pk(tau, rows[1][2] + 0.6)} />}
    </group>
  );
};

// ---------------------------------------------------------------- 4 BANCO VETORIAL
const CLOUD = Array.from({length: 36}).map((_, i) => ({
  p: [lerp(-1.5, 0.1, rn(i, 1)), Y0 + lerp(0.5, 1.9, rn(i, 2)), lerp(-1.25, 1.25, rn(i, 3))],
  c: PAL[i % 5],
  ph: rn(i, 4) * 6.28,
}));
export const S4 = ({tau, b, c}) => {
  const DB = [0.95, Y0, 0];
  const top = [DB[0], Y0 + 1.4, DB[2]];
  const dbK = pk(tau, b - 0.1, 0.4);
  const glow = fade(tau, b + 2.3, b + 3.2, 0.2) * 0.6;
  const slow = prog(tau, 0.3, b) * 0.3;
  const full = easeOut(prog(tau, b + 2.3, b + 2.7));
  const fill = tau < b + 2.3 ? slow : lerp(0.3, 1, full);
  return (
    <group>
      {CLOUD.map((s, i) => {
        const k = pk(tau, 0.1 + i * 0.03, 0.25);
        const t0 = b + 0.25 + i * 0.045, t1 = t0 + 0.55;
        let p = [s.p[0], s.p[1] + Math.sin(tau * 2 + s.ph) * 0.07, s.p[2]];
        let sc = k;
        if (tau >= t0) {
          if (tau > t1) return null;
          const q = easeInOut(prog(tau, t0, t1));
          p = arc3(s.p, top, q, 0.6);
          sc = 1 - 0.55 * q;
        }
        return <mesh key={i} position={p} scale={Math.max(sc, 0.001)} castShadow><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color={s.c} emissive={s.c} emissiveIntensity={0.25} /></mesh>;
      })}
      <Wire tau={tau} t0={b} a={[-1.3, Y0 + 0.12, 0]} b={[0.2, Y0 + 0.3, 0]} color="#19c3b0" lift={0.1} dur={0.45} />
      {/* barra de progresso */}
      <group position={[-0.4, Y0 + 0.08, 1.45]} scale={pk(tau, 0.2)}>
        <RBox size={[1.7, 0.16, 0.16]} r={0.05} color="#26262e" />
        <RBox size={[Math.max(1.6 * fill, 0.02), 0.2, 0.2]} r={0.05} color={fill > 0.9 ? '#3fd07a' : '#ff5a4f'} emissive={fill > 0.9 ? '#3fd07a' : '#ff5a4f'} emissiveIntensity={0.4} position={[-0.8 + (1.6 * fill) / 2, 0.03, 0]} />
      </group>
      {tau > 0.4 && tau < b && <Tx text="LENTO..." p={[-0.4, Y0 + 2.3, 0]} w={2.4} fg="#ff7a7a" k={pk(tau, 0.4) * (1 - prog(tau, b - 0.3, b))} />}
      {/* banco (cilindros empilhados) */}
      <group position={DB} scale={Math.max(dbK, 0.001)}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0.2 + i * 0.46, 0]}>
            <mesh castShadow receiveShadow><cylinderGeometry args={[0.78, 0.78, 0.38, 36]} /><meshStandardMaterial color="#19c3b0" emissive="#19c3b0" emissiveIntensity={glow} roughness={0.4} /></mesh>
            <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.78, 0.78, 0.02, 36]} /><meshStandardMaterial color="#8af2e4" emissive="#19c3b0" emissiveIntensity={glow * 0.8} /></mesh>
            <mesh position={[0.72, 0, 0.05]} rotation={[0, 0.0, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#fff" emissive="#8af2e4" emissiveIntensity={0.9} /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- 5 TOOL CALLING
export const S5 = ({tau, b, c}) => {
  const LL = [-1.15, Y0, 0];
  const lid = easeOut(prog(tau, b + 0.1, b + 0.6));
  const up = (i) => easeOutBack(prog(tau, b + 0.35 + i * 0.15, b + 0.85 + i * 0.15));
  const use0 = b + 1.2, use1 = b + 1.85, back1 = b + 2.6;
  const working = tau > use1 && tau < back1;
  const gearRot = tau * 1.5 + (working ? (tau - use1) * 8 : 0);
  const bump = pulse(tau, back1, 0.35, 0.15);
  return (
    <group>
      <group scale={[bump, bump, bump]} position={LL}>
        <MiniLLM p={[0, 0, 0]} k={pk(tau, 0.1, 0.4)} ei={tau > back1 ? 0.5 : 0} />
      </group>
      {tau > 0.35 && tau < b + 0.1 && <Tx text="blá blá blá" p={[-1.15, Y0 + 2.0, 0]} w={1.5} fg="#17171d" bg="#fff" font="800 52px Montserrat" k={pk(tau, 0.35) * (1 - prog(tau, b - 0.1, b + 0.1))} />}
      <Wire tau={tau} t0={b + 0.1} a={[-0.6, Y0 + 0.15, 0.5]} b={[0.55, Y0 + 0.3, 0.5]} color="#ff9a3d" lift={0.1} dir={0} />
      {/* caixa de ferramentas */}
      <group position={[1.15, Y0, 0]} scale={Math.max(pk(tau, 0.25, 0.4), 0.001)}>
        <RBox size={[1.2, 0.5, 1.9]} r={0.07} color="#ff9a3d" position={[0, 0.25, 0]} />
        <RBox size={[1.2, 0.08, 0.5]} r={0.03} color="#c96d1a" position={[0, 0.54, 0]} />
        <group position={[-0.6, 0.5, 0]} rotation={[0, 0, 1.9 * lid]}>
          <RBox size={[1.2, 0.1, 1.9]} r={0.05} color="#ffb061" position={[0.6, 0.05, 0]} />
        </group>
      </group>
      {/* ferramentas */}
      <group position={[1.15, Y0 + 0.5, 0]}>
        {up(0) > 0.01 && <GearX p={[0.0, 0.55 * up(0) + 0.15, -0.8]} r={0.34} rot={gearRot} k={Math.max(up(0), 0.001)} />}
        {up(1) > 0.01 && (
          <group position={[0, 0.2 + 0.42 * up(1), 0.05]} scale={Math.max(up(1), 0.001)}>
            <RBox size={[0.3, 0.75, 0.5]} r={0.05} color="#3a3d4a" position={[0, 0.3, 0]} />
            <RBox size={[0.02, 0.2, 0.4]} r={0.01} color="#7be08a" emissive="#3fd07a" emissiveIntensity={0.5} position={[0.16, 0.55, 0]} />
            {[0, 1, 2].map((r) => [0, 1, 2].map((cc) => (
              <RBox key={r * 3 + cc} size={[0.02, 0.07, 0.1]} r={0.01} color="#d6d8e0" position={[0.16, 0.34 - r * 0.12, -0.14 + cc * 0.14]} />
            )))}
          </group>
        )}
        {up(2) > 0.01 && (
          <group position={[0, 0.2 + 0.5 * up(2), 0.8]} scale={Math.max(up(2), 0.001)}>
            <mesh position={[0, 0.35, 0]} castShadow><sphereGeometry args={[0.33, 20, 20]} /><meshStandardMaterial color="#3fa7ff" roughness={0.4} /></mesh>
            <mesh position={[0, 0.35, 0]} rotation={[0.4, 0, 0.3 + tau * 0.8]}><torusGeometry args={[0.43, 0.025, 8, 36]} /><meshStandardMaterial color="#e8f3ff" /></mesh>
          </group>
        )}
      </group>
      <Pkt tau={tau} a={[-1.15, Y0 + 1.4, 0]} b={[1.15, Y0 + 1.5, -0.8]} t0={use0} t1={use1} color="#ffd23f" text="fn" h={0.9} />
      <Pkt tau={tau} a={[1.15, Y0 + 1.5, -0.8]} b={[-1.15, Y0 + 1.4, 0]} t0={use1 + 0.4} t1={back1} color="#3fd07a" text="OK" h={1.1} />
    </group>
  );
};
