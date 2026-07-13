import { Float, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function PortalRings() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.z += delta * 0.045;
    group.current.rotation.y = state.pointer.x * 0.08;
    group.current.rotation.x = -state.pointer.y * 0.05;
  });
  const rings = useMemo(() => [2.45, 2.62, 2.82], []);
  return (
    <group ref={group} position={[0.7, 0, 0]}>
      {rings.map((radius, i) => (
        <mesh key={radius} rotation={[0, i * 0.12, i * 0.3]}>
          <torusGeometry args={[radius, 0.012 + i * 0.007, 10, 130]} />
          <meshBasicMaterial
            color={i === 0 ? '#55e6ff' : i === 1 ? '#795cff' : '#f078ff'}
            transparent
            opacity={0.48 - i * 0.08}
          />
        </mesh>
      ))}
      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.4}>
        <mesh position={[-2.85, 1.4, 0.2]} rotation={[0.3, 0.4, 0.1]}>
          <octahedronGeometry args={[0.13, 0]} />
          <meshBasicMaterial color="#55e6ff" wireframe />
        </mesh>
        <mesh position={[2.8, -1.1, 0.1]} rotation={[0.1, 0.5, 0.5]}>
          <icosahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial color="#f078ff" wireframe />
        </mesh>
      </Float>
    </group>
  );
}

export default function PortalScene({ reduced = false }: { reduced?: boolean }) {
  if (reduced) return null;
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 1.4]}
      camera={{ position: [0, 0, 7.5], fov: 48 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
    >
      <PortalRings />
      <Stars radius={45} depth={18} count={480} factor={2.3} saturation={0.65} fade speed={0.28} />
    </Canvas>
  );
}
