import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface WHIHexagonalSphereProps {
  workHealth?: {
    adaptivePerformanceIndex: number;
    cognitiveResilience: number;
    workRhythmRecovery: number;
  };
  isLoading?: boolean;
}

// Global singleton to ensure only one sphere exists
let globalSphereInstance: {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sphereGroup: THREE.Group;
  animationFrame: number | null;
  currentMount: HTMLDivElement | null;
} | null = null;

const WHIHexagonalSphere: React.FC<WHIHexagonalSphereProps> = ({ 
  workHealth, 
  isLoading = false 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef<boolean>(false);

  // Use actual data or fallback to defaults
  const whi_metrics = {
    performance: { 
      score: workHealth?.adaptivePerformanceIndex || 76, 
      color: 0x10b981, 
      name: 'Performance' 
    },
    resilience: { 
      score: workHealth?.cognitiveResilience || 72, 
      color: 0x3b82f6, 
      name: 'Resilience' 
    },
    sustainability: { 
      score: workHealth?.workRhythmRecovery || 79, 
      color: 0x6b7280, 
      name: 'Sustainability' 
    }
  };

  const createHexagonGeometry = (radius = 0.8) => {
    return new THREE.CylinderGeometry(radius, radius, 0.1, 6, 1);
  };

  const generateHexagonPositions = (sphereRadius = 8) => {
    const hexagons = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const hexagonCount = 120;
    
    for (let i = 0; i < hexagonCount; i++) {
      const y = 1 - (i / (hexagonCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      
      const position = new THREE.Vector3(x, y, z).multiplyScalar(sphereRadius);
      const region = assignRegion(new THREE.Vector3(x, y, z));
      const metric = whi_metrics[region];
      const isLit = Math.random() < (metric.score / 100);
      
      hexagons.push({
        position,
        region,
        metric,
        isLit,
        index: i
      });
    }
    
    return hexagons;
  };

  const assignRegion = (position: THREE.Vector3) => {
    const { x, y, z } = position;
    const phi = Math.atan2(z, x);
    const theta = Math.acos(y);
    
    if (theta < Math.PI * 0.4 && phi < 0) {
      return Math.random() < 0.9 ? 'performance' : 'resilience';
    } else if (theta > Math.PI * 0.6) {
      if (Math.random() < 0.8) return 'resilience';
      return Math.random() < 0.6 ? 'sustainability' : 'performance';
    } else if (phi > Math.PI * 0.2) {
      if (Math.random() < 0.75) return 'sustainability';
      return Math.random() < 0.5 ? 'resilience' : 'performance';
    } else {
      const rand = Math.random();
      if (theta < Math.PI * 0.5) {
        return rand < 0.5 ? 'performance' : 'sustainability';
      } else {
        return rand < 0.6 ? 'resilience' : rand < 0.8 ? 'sustainability' : 'performance';
      }
    }
  };

  const createHexagonMaterial = (hexData: any) => {
    const { metric, isLit } = hexData;
    const baseColor = new THREE.Color(metric.color);
    
    if (isLit) {
      return new THREE.MeshLambertMaterial({
        color: baseColor,
        transparent: false
      });
    } else {
      return new THREE.MeshLambertMaterial({
        color: baseColor.clone().multiplyScalar(0.7),
        transparent: true,
        opacity: 0.9
      });
    }
  };

  // Helper function to clean up global instance
  const cleanupGlobalInstance = () => {
    if (globalSphereInstance) {
      if (globalSphereInstance.animationFrame) {
        cancelAnimationFrame(globalSphereInstance.animationFrame);
      }
      
      if (globalSphereInstance.currentMount && globalSphereInstance.renderer.domElement) {
        if (globalSphereInstance.currentMount.contains(globalSphereInstance.renderer.domElement)) {
          globalSphereInstance.currentMount.removeChild(globalSphereInstance.renderer.domElement);
        }
      }
      
      // Dispose of Three.js resources
      globalSphereInstance.sphereGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      globalSphereInstance.scene.clear();
      globalSphereInstance.renderer.dispose();
      globalSphereInstance = null;
    }
  };

  // Helper function to create sphere instance
  const createSphereInstance = () => {
    if (!mountRef.current) return;

    // Clean up any existing instance first
    cleanupGlobalInstance();

    // Create new Three.js objects
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true 
    });
    renderer.setSize(400, 400);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Attach to mount
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(15, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create sphere group
    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    // Generate hexagons
    const hexagonData = generateHexagonPositions();
    const hexagonMeshes = hexagonData.map(hexData => {
      const geometry = createHexagonGeometry();
      const material = createHexagonMaterial(hexData);
      const hexagon = new THREE.Mesh(geometry, material);
      
      hexagon.position.copy(hexData.position);
      hexagon.lookAt(
        hexData.position.x * 2,
        hexData.position.y * 2,
        hexData.position.z * 2
      );
      
      hexagon.userData = hexData;
      hexagon.castShadow = true;
      hexagon.receiveShadow = true;
      
      return hexagon;
    });

    hexagonMeshes.forEach(hex => sphereGroup.add(hex));

    // Create global instance
    globalSphereInstance = {
      renderer,
      scene,
      camera,
      sphereGroup,
      animationFrame: null,
      currentMount: mountRef.current
    };

    // Start animation
    const animate = () => {
      if (!globalSphereInstance) return;
      
      globalSphereInstance.animationFrame = requestAnimationFrame(animate);

      globalSphereInstance.sphereGroup.rotation.y += 0.004;
      globalSphereInstance.sphereGroup.rotation.x += 0.001;
      
      const time = Date.now() * 0.001;
      const scale = 1 + Math.sin(time * 0.6) * 0.02;
      globalSphereInstance.sphereGroup.scale.setScalar(scale);

      globalSphereInstance.renderer.render(globalSphereInstance.scene, globalSphereInstance.camera);
    };
    
    animate();
    hasInitialized.current = true;
  };

  useEffect(() => {
    // Only create sphere if not loading and not already initialized
    if (!isLoading && !hasInitialized.current && mountRef.current) {
      createSphereInstance();
    }

    // Cleanup when component unmounts
    return () => {
      if (hasInitialized.current) {
        hasInitialized.current = false;
        cleanupGlobalInstance();
      }
    };
  }, [isLoading]);

  // Update sphere data when workHealth changes (without recreating the whole sphere)
  useEffect(() => {
    if (globalSphereInstance && !isLoading && hasInitialized.current) {
      // Clear existing hexagons
      globalSphereInstance.sphereGroup.clear();
      
      // Regenerate with new data
      const hexagonData = generateHexagonPositions();
      const hexagonMeshes = hexagonData.map(hexData => {
        const geometry = createHexagonGeometry();
        const material = createHexagonMaterial(hexData);
        const hexagon = new THREE.Mesh(geometry, material);
        
        hexagon.position.copy(hexData.position);
        hexagon.lookAt(
          hexData.position.x * 2,
          hexData.position.y * 2,
          hexData.position.z * 2
        );
        
        hexagon.userData = hexData;
        hexagon.castShadow = true;
        hexagon.receiveShadow = true;
        
        return hexagon;
      });

      hexagonMeshes.forEach(hex => globalSphereInstance!.sphereGroup.add(hex));
    }
  }, [workHealth?.adaptivePerformanceIndex, workHealth?.cognitiveResilience, workHealth?.workRhythmRecovery]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div 
        ref={mountRef} 
        className="w-full h-full max-w-md max-h-md"
      />
    </div>
  );
};

export default WHIHexagonalSphere;