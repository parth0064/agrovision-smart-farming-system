import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function Leaf({ position, color, speed, scale = 0.4 }: { position: [number, number, number]; color: string; speed: number; scale?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed) * 0.3;
    ref.current.rotation.z = Math.cos(state.clock.elapsedTime * speed * 0.7) * 0.2;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.2;
  });

  const leafShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.15, 0.25, 0, 0.5);
    shape.quadraticCurveTo(-0.15, 0.25, 0, 0);
    return shape;
  }, []);

  return (
    <Float speed={speed} rotationIntensity={0.3} floatIntensity={0.3}>
      <mesh ref={ref} position={position} scale={scale}>
        <shapeGeometry args={[leafShape]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>
    </Float>
  );
}

function Particles() {
  const count = 30;
  const ref = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#4ade80" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        <Leaf position={[-3.5, 1.5, 0]} color="#22c55e" speed={1.2} scale={0.5} />
        <Leaf position={[3.5, -0.5, -1]} color="#16a34a" speed={0.8} scale={0.4} />
        <Leaf position={[-2, -1.5, 0.5]} color="#4ade80" speed={1} scale={0.35} />
        <Leaf position={[2.8, 1.2, -0.5]} color="#15803d" speed={1.5} scale={0.45} />
        <Leaf position={[-0.5, 2, -1]} color="#86efac" speed={0.6} scale={0.3} />
        <Leaf position={[1, -1.8, 0]} color="#22c55e" speed={0.9} scale={0.35} />
        
        <Particles />
      </Canvas>
    </div>
  );
}
