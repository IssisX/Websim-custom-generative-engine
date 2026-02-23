import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane, useSphere, useCompoundBody } from '@react-three/cannon';
import { EffectComposer, Bloom, DepthOfField, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { OrbitControls, Environment, Text, MeshReflectorMaterial, Sparkles, Grid, Float, SoftShadows, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

// --- Advanced Physics & Visual Components ---

function Floor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -0.01, 0] }));
  return (
    <group>
      {/* Invisible physics plane */}
      <mesh ref={ref as any} visible={false}>
        <planeGeometry args={[100, 100]} />
      </mesh>
      {/* Visual reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={80}
          roughness={0.2}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0a0a"
          metalness={0.8}
          mirror={1}
        />
      </mesh>
      <Grid infiniteGrid fadeDistance={40} sectionColor="#ffffff" cellColor="#ffffff" sectionThickness={1} cellThickness={0.5} sectionSize={5} cellSize={1} position={[0, 0.01, 0]} opacity={0.1} transparent />
    </group>
  );
}

const getMaterialProps = (type: string, color: string) => {
  switch(type) {
    case 'glass': 
      return { transmission: 1, opacity: 1, metalness: 0.1, roughness: 0.1, ior: 1.5, thickness: 0.5, color };
    case 'neon': 
      return { emissive: color, emissiveIntensity: 4, toneMapped: false, color: '#000000' };
    case 'metal': 
      return { metalness: 1, roughness: 0.2, color };
    case 'matte':
    default: 
      return { metalness: 0.1, roughness: 0.8, color };
  }
};

function CompositeShape({ position, parts, mass = 10 }: any) {
  const [ref, api] = useCompoundBody(() => ({
    mass,
    position,
    shapes: parts.map((p: any) => ({
      type: 'Box',
      position: p.position || [0,0,0],
      args: p.scale ? [p.scale[0]/2, p.scale[1]/2, p.scale[2]/2] : [0.5, 0.5, 0.5]
    }))
  }));

  const [hovered, setHovered] = useState(false);

  return (
    <group 
      ref={ref as any} 
      onClick={(e) => { e.stopPropagation(); api.applyImpulse([0, 20, 0], [0, 0, 0]); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {parts.map((p: any, i: number) => (
        <mesh key={i} position={p.position} castShadow receiveShadow>
          <boxGeometry args={p.scale || [1,1,1]} />
          <meshPhysicalMaterial 
            {...getMaterialProps(p.material, p.color || '#ffffff')} 
            emissive={hovered && p.material !== 'neon' ? p.color : (p.material === 'neon' ? p.color : '#000000')}
            emissiveIntensity={hovered ? 0.5 : (p.material === 'neon' ? 4 : 0)}
          />
        </mesh>
      ))}
    </group>
  );
}

// --- Main Scene ---

export default function Scene() {
  const objects = useStore((state) => state.objects);
  const gravity = useStore((state) => state.gravity);

  return (
    <Canvas shadows camera={{ position: [8, 8, 12], fov: 45 }} gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}>
      <SoftShadows size={15} focus={0.5} samples={10} />
      <color attach="background" args={['#020202']} />
      <fog attach="fog" args={['#020202', 10, 40]} />
      
      <ambientLight intensity={0.1} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-bias={-0.0001}
      />
      <spotLight position={[-10, 10, -10]} intensity={2} color="#4488ff" penumbra={1} />
      
      <Environment preset="studio" />
      
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
        <Text position={[0, 8, -10]} fontSize={3} font="/fonts/Inter-Bold.woff" color="#ffffff" material-toneMapped={false} material-emissive="#ffffff" material-emissiveIntensity={0.2} anchorX="center" anchorY="middle" letterSpacing={0.1}>
          A.I. STUDIO
        </Text>
      </Float>

      <Sparkles count={200} scale={20} size={2} speed={0.4} opacity={0.2} color="#aaccff" />
      <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

      <Physics gravity={[0, gravity, 0]} defaultContactMaterial={{ friction: 0.5, restitution: 0.3 }}>
        <Floor />
        {objects.map((obj: any) => {
            if (obj.type === 'composite' && obj.parts) {
                return <CompositeShape key={obj.id} position={obj.position || [0, 10, 0]} parts={obj.parts} />;
            }
            return null;
        })}
      </Physics>

      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} minDistance={2} maxDistance={30} autoRotate autoRotateSpeed={0.2} />
      
      <EffectComposer multisampling={4}>
        <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
        <DepthOfField focusDistance={0.01} focalLength={0.1} bokehScale={3} />
        <ChromaticAberration offset={[0.001, 0.001] as any} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
}
