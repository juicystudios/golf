// components/ObjectPlacer.js
// Handles placement of objects like tee box, trees, hole, flag, and decorative objects

import * as THREE from 'three';

export class ObjectPlacer {
  constructor(scene, terrainManager, courseConfig) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.courseConfig = courseConfig;
  }

// Create a tee box at the starting point
createTeeBox() {
  // Get height at tee position
  const teeHeight = this.terrainManager.getHeightAt(0, 0);
  
  // Create a flat, short-grass area instead of a raised platform
  const teeAreaSize = 10; // Width of the tee area
  const teeAreaDepth = 6; // Depth of the tee area
  
  // Create flat tee area with short grass (use same material as green)
  const teeAreaGeometry = new THREE.PlaneGeometry(teeAreaSize, teeAreaDepth);
  const teeAreaMaterial = new THREE.MeshLambertMaterial({
    color: 0x90EE90, // Light green like fairway
    side: THREE.DoubleSide
  });
  
  const teeArea = new THREE.Mesh(teeAreaGeometry, teeAreaMaterial);
  teeArea.rotation.x = -Math.PI / 2;
  
  // Position slightly above terrain to avoid z-fighting
  teeArea.position.set(0, teeHeight + 0.01, 0);
  this.scene.add(teeArea);
  
  // Create blue tee markers (two small cylinders)
  const markerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
  const markerMaterial = new THREE.MeshLambertMaterial({ color: 0x1E90FF }); // Blue
  
  // Left tee marker - POSITIONED FURTHER LEFT
  const leftMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  leftMarker.position.set(-4, teeHeight + 0.15, 0); // Increased from -1 to -4
  this.scene.add(leftMarker);
  
  // Right tee marker - POSITIONED FURTHER RIGHT
  const rightMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  rightMarker.position.set(4, teeHeight + 0.15, 0); // Increased from 1 to 4
  this.scene.add(rightMarker);
  
  // Create actual golf tee model exactly at ball position
  // Using a cylinder for the tee with appropriate dimensions
  const teeGeometry = new THREE.CylinderGeometry(0.1, 0.03, 0.4, 8);
  const teeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // White tee
  const golfTee = new THREE.Mesh(teeGeometry, teeMaterial);
  
  // Position exactly at origin, with top of tee at height where ball will rest
  // Ball radius is typically 0.3 units, so tee top should be at ground + 0.2 units
  // Tee is 0.4 units tall, so center is 0.2 units above base
  const ballRadius = 0.3; // This should match the ball radius in BallPhysics
  const teeTopHeight = teeHeight + 0.2; // Height where ball will sit
  golfTee.position.set(0, teeTopHeight - 0.2, 0); // Compensate for center positioning
  
  this.scene.add(golfTee);
  
  // Add a small flat box at the ball starting position for consistent physics
  const teeSpotGeometry = new THREE.BoxGeometry(0.5, 0.02, 0.5);
  const teeSpotMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x90EE90, // Match the tee area color
    transparent: true,
    opacity: 0 // Make it invisible
  });
  
  const teeSpot = new THREE.Mesh(teeSpotGeometry, teeSpotMaterial);
  teeSpot.position.set(0, teeHeight, 0);
  this.scene.add(teeSpot);
  
  console.log("Created golf tee with wider marker spacing at height:", teeHeight);
}

  // Add trees around the course
  addTrees(holePath) {
    const numTrees = this.courseConfig.treeDensity;
    const trees = [];
    
    // Calculate the rough and tree line boundaries
    const roughWidth = this.courseConfig.roughWidth;
    
    // Buffer zone from fairway center
    const minDistFromFairway = this.courseConfig.fairwayWidth / 2;
    const maxDistFromFairway = roughWidth;
    
    for (let i = 0; i < numTrees; i++) {
      // Find a random position along the hole path
      const pathIndex = Math.floor(Math.random() * (holePath.length - 1));
      const pathPosition = holePath[pathIndex];
      const nextPathPosition = holePath[pathIndex + 1];
      
      // Interpolate between points
      const t = Math.random();
      const interpolatedPosition = new THREE.Vector3().lerpVectors(pathPosition, nextPathPosition, t);
      
      // Calculate direction and perpendicular
      const direction = new THREE.Vector3().subVectors(nextPathPosition, pathPosition).normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      
      // Random side and distance (outside the rough)
      const side = Math.random() > 0.5 ? 1 : -1;
      const distance = maxDistFromFairway + Math.random() * maxDistFromFairway * 0.5;
      
      // Position away from fairway and rough
      const treePosition = interpolatedPosition.clone().add(
        perpendicular.clone().multiplyScalar(side * distance)
      );
      
      // Get height from terrain
      treePosition.y = this.terrainManager.getHeightAt(treePosition.x, treePosition.z);
      
      // Ensure tree height is at or above base ground
      if (treePosition.y < -0.5) {
        treePosition.y = -0.5;
      }
      
      // Create tree
      const tree = this.createTree(treePosition);
      
      // Add collision data to the tree
      tree.userData.collidable = true;
      tree.userData.radius = 0.7; // Collision radius (trunk width)
      
      trees.push(tree);
    }
    
    return trees;
  }

  // Create a single tree at the specified position
  createTree(position) {
    // Tree trunk
    const trunkHeight = 4 + Math.random() * 3;
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    
    // Tree top (low-poly cone)
    const topHeight = 6 + Math.random() * 4;
    const topRadius = 2 + Math.random() * 2;
    const topGeometry = new THREE.ConeGeometry(topRadius, topHeight, 6);
    
    // Randomize the green color slightly
    const topMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(
        0.1 + Math.random() * 0.1,
        0.5 + Math.random() * 0.2,
        0.1 + Math.random() * 0.1
      )
    });
    
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = trunkHeight / 2 + topHeight / 2;
    top.castShadow = true;
    
    // Group tree parts
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(top);
    
    // Position tree on terrain
    tree.position.copy(position);
    tree.position.y += trunkHeight / 2;
    
    this.scene.add(tree);
    
    return tree;
  }

  // Add hole and flag at the hole position
  addHoleAndFlag() {
    // Hole
    const holeGeometry = new THREE.CircleGeometry(0.5, 32);
    const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.rotation.x = -Math.PI / 2;
    
    // Position at hole position
    const holeHeight = this.terrainManager.getHeightAt(
      this.courseConfig.holePosition.x, 
      this.courseConfig.holePosition.z
    );
    
    hole.position.copy(this.courseConfig.holePosition.clone());
    hole.position.y = holeHeight + 0.03;
    
    this.scene.add(hole);
    
    // Flag pole
    const poleHeight = 4;
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, poleHeight, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    
    // Position at hole
    pole.position.copy(this.courseConfig.holePosition.clone());
    pole.position.y = holeHeight + poleHeight / 2;
    
    this.scene.add(pole);
    
    // Flag
    const flagGeometry = new THREE.PlaneGeometry(2, 1);
    const flagMaterial = new THREE.MeshLambertMaterial({
      color: 0xFF0000,
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    
    // Position at top of pole
    flag.position.copy(this.courseConfig.holePosition.clone());
    flag.position.y = holeHeight + poleHeight - 0.5;
    flag.position.x += 0.8; // Offset from pole
    flag.rotation.y = Math.PI / 2;
    
    this.scene.add(flag);
  }
  
  // Create low-poly clouds in the sky
  createClouds() {
    const numClouds = 20;
    
    for (let i = 0; i < numClouds; i++) {
      // Create a cloud group
      const cloud = new THREE.Group();
      
      // Random cloud size and position
      const cloudSize = 5 + Math.random() * 15;
      const cloudX = (Math.random() - 0.5) * this.courseConfig.groundSize;
      const cloudZ = (Math.random() - 0.5) * this.courseConfig.groundSize;
      const cloudY = 50 + Math.random() * 30; // Height in the sky
      
      // Create 3-5 "puffs" per cloud
      const numPuffs = 3 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < numPuffs; j++) {
        // Use simple geometries for the puffs
        const geometry = new THREE.IcosahedronGeometry(cloudSize / 2, 1); // Low-poly sphere
        const material = new THREE.MeshLambertMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.9
        });
        
        const puff = new THREE.Mesh(geometry, material);
        
        // Position puffs randomly but clustered
        puff.position.x = (Math.random() - 0.5) * cloudSize;
        puff.position.z = (Math.random() - 0.5) * cloudSize;
        puff.position.y = (Math.random() - 0.5) * (cloudSize / 4);
        
        cloud.add(puff);
      }
      
      // Position the cloud in the scene
      cloud.position.set(cloudX, cloudY, cloudZ);
      
      // Add some random rotation
      cloud.rotation.y = Math.random() * Math.PI * 2;
      
      this.scene.add(cloud);
    }
  }

  // Create a low-poly alligator near the water hazard
  createAlligator(x, z) {
    // Create alligator group
    const alligator = new THREE.Group();
    
    // Body (elongated box)
    const bodyGeometry = new THREE.BoxGeometry(4, 1, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2e5d32 }); // Dark green
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    alligator.add(body);
    
    // Head (triangular prism)
    const headGeometry = new THREE.ConeGeometry(1, 3, 4);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x2e5d32 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.rotation.x = Math.PI / 2;
    head.position.z = 5.5;
    head.position.y = 0.2;
    alligator.add(head);
    
    // Tail (tapering boxes)
    const tailSegments = 3;
    let tailWidth = 3;
    let tailLength = 2;
    let tailOffset = -4;
    
    for (let i = 0; i < tailSegments; i++) {
      const tailGeometry = new THREE.BoxGeometry(tailWidth, 0.7, tailLength);
      const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
      tail.position.z = tailOffset - (tailLength / 2);
      alligator.add(tail);
      
      tailOffset -= tailLength;
      tailWidth *= 0.7;
      tailLength *= 0.9;
    }
    
    // Legs (small boxes)
    const legPositions = [
      { x: 1.5, z: 3 },   // Front right
      { x: -1.5, z: 3 },  // Front left
      { x: 1.5, z: -3 },  // Back right
      { x: -1.5, z: -3 }, // Back left
    ];
    
    legPositions.forEach(pos => {
      const legGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
      const leg = new THREE.Mesh(legGeometry, bodyMaterial);
      leg.position.set(pos.x, -0.5, pos.z);
      alligator.add(leg);
    });
    
    // Eyes (small white spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.2, 4, 4); // Low poly
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.5, 0.5, 6);
    alligator.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.5, 0.5, 6);
    alligator.add(rightEye);
    
    // Position alligator in the scene
    const terrainHeight = this.terrainManager.getHeightAt(x, z);
    alligator.position.set(x, terrainHeight + 0.5, z);
    
    // Rotate to face a random direction
    alligator.rotation.y = Math.random() * Math.PI * 2;
    
    this.scene.add(alligator);
    
    return alligator;
  }
}