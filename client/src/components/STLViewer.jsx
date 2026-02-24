import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls, Stage, Center, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import * as THREE from 'three';

const Model = ({ url, wireframe, transparent }) => {
    const geom = useLoader(STLLoader, url);
    const meshRef = useRef();

    // Basic auto-rotation effect or just centering
    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x = -Math.PI / 2;
        }
    }, [geom]);

    return (
        <mesh ref={meshRef}>
            <primitive object={geom} attach="geometry" />
            <meshStandardMaterial
                color="#60a5fa"
                metalness={0.6}
                roughness={0.4}
                wireframe={wireframe}
                transparent={transparent}
                opacity={transparent ? 0.4 : 1}
            />
        </mesh>
    );
};

export default function STLViewer({ url, wireframe = false, transparent = false }) {
    if (!url) return null;

    return (
        <div style={{ width: '100%', height: '400px', background: '#080e1a', borderRadius: '16px', overflow: 'hidden', marginTop: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Canvas shadows camera={{ position: [0, 0, 150], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[100, 100, 100]} intensity={1} castShadow />

                <Stage environment="city" intensity={0.5} contactShadow={false}>
                    <Center>
                        <Model url={url} wireframe={wireframe} transparent={transparent} />
                    </Center>
                </Stage>

                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
            </Canvas>
        </div>
    );
}
