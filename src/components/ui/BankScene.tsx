
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BankSceneProps {
  className?: string;
}

const BankScene: React.FC<BankSceneProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 5, 15);
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Bank building base (ground/foundation)
    const groundGeometry = new THREE.BoxGeometry(20, 0.5, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xe9ecef });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -3;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Bank main building
    const buildingGeometry = new THREE.BoxGeometry(12, 6, 8);
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x0A2463 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 0;
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    
    // Bank roof (slightly wider than building)
    const roofGeometry = new THREE.BoxGeometry(13, 0.5, 9);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x3E92CC });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3.25;
    roof.castShadow = true;
    scene.add(roof);
    
    // Bank pillars
    const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 32);
    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0xf8f9fa });
    
    // Create and position the pillars
    const pillarPositions = [
      { x: -5, z: 3 },
      { x: -5, z: -3 },
      { x: 5, z: 3 },
      { x: 5, z: -3 }
    ];
    
    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos.x, 0, pos.z);
      pillar.castShadow = true;
      scene.add(pillar);
    });
    
    // Steps (stairs) leading to the entrance
    const stepsGroup = new THREE.Group();
    
    const stepsWidths = [8, 7, 6];
    const stepsDepths = [2, 1.5, 1];
    
    for (let i = 0; i < 3; i++) {
      const stepGeometry = new THREE.BoxGeometry(stepsWidths[i], 0.5, stepsDepths[i]);
      const stepMaterial = new THREE.MeshStandardMaterial({ color: 0xe9ecef });
      const step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.z = 4 + i;
      step.position.y = -2.5 + i * 0.5;
      step.castShadow = true;
      step.receiveShadow = true;
      stepsGroup.add(step);
    }
    
    scene.add(stepsGroup);
    
    // Create decorative elements - golden dome on top
    const domeGeometry = new THREE.SphereGeometry(1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      metalness: 0.7,
      roughness: 0.3,
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 3.5;
    dome.castShadow = true;
    scene.add(dome);
    
    // Add bank entrance (door)
    const doorGeometry = new THREE.PlaneGeometry(3, 4);
    const doorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      side: THREE.DoubleSide,
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0, 4.01);
    scene.add(door);
    
    // Add bank windows
    const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
    const windowMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x6CACE4,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    
    // Create and position windows
    const windowPositions = [
      { x: -3, y: 0, z: 4.01 },
      { x: 3, y: 0, z: 4.01 },
      { x: -3, y: 0, z: -4.01 },
      { x: 0, y: 0, z: -4.01 },
      { x: 3, y: 0, z: -4.01 },
      { x: -6.01, y: 0, z: 0, rotY: Math.PI / 2 },
      { x: -6.01, y: 0, z: -2, rotY: Math.PI / 2 },
      { x: 6.01, y: 0, z: 0, rotY: Math.PI / 2 },
      { x: 6.01, y: 0, z: -2, rotY: Math.PI / 2 },
    ];
    
    windowPositions.forEach(pos => {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(pos.x, pos.y, pos.z);
      if (pos.rotY) window.rotation.y = pos.rotY;
      scene.add(window);
    });
    
    // Add floating coins
    const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    const coinMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFD700,
      metalness: 0.8,
      roughness: 0.2,
    });
    
    const coins = [];
    for (let i = 0; i < 10; i++) {
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      
      // Random positions around the bank
      coin.position.x = Math.random() * 16 - 8;
      coin.position.y = Math.random() * 5 + 3;
      coin.position.z = Math.random() * 16 - 8;
      
      // Random rotation
      coin.rotation.x = Math.PI / 2; // Make coin flat
      
      coin.castShadow = true;
      scene.add(coin);
      coins.push({
        mesh: coin,
        speed: Math.random() * 0.02 + 0.01,
        rotationSpeed: Math.random() * 0.02 + 0.01,
        floatHeight: Math.random() * 0.5 + 0.5,
        initialY: coin.position.y
      });
    }
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    let rotationAngle = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate building slowly
      rotationAngle += 0.002;
      const radius = 15;
      camera.position.x = Math.sin(rotationAngle) * radius;
      camera.position.z = Math.cos(rotationAngle) * radius;
      camera.position.y = 5 + Math.sin(rotationAngle * 0.5) * 1;
      camera.lookAt(0, 0, 0);
      
      // Animate dome (pulsing light effect)
      domeMaterial.emissive.setRGB(
        0.1 + Math.sin(Date.now() * 0.001) * 0.05,
        0.1 + Math.sin(Date.now() * 0.001) * 0.05,
        0
      );
      
      // Animate floating coins
      coins.forEach(coin => {
        coin.mesh.rotation.z += coin.rotationSpeed;
        coin.mesh.position.y = coin.initialY + Math.sin(Date.now() * 0.001 * coin.speed) * coin.floatHeight;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full min-h-[400px] rounded-lg overflow-hidden ${className}`}
    />
  );
};

export default BankScene;
