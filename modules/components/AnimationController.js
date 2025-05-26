// components/AnimationController.js
// Handles creation and animation of dynamic elements like birds, fish, and spectators

import * as THREE from 'three';

export class AnimationController {
  constructor(scene) {
    this.scene = scene;
  }

  // Create birds flying in the sky
  createBirds() {
    const numBirds = 15;
    const birds = [];
    
    // Size factor increased by 15%
    const birdSizeFactor = 1.15;
    
    for (let i = 0; i < numBirds; i++) {
      // Create a bird group
      const bird = new THREE.Group();
      
      // Bird body (small elongated box) - INCREASED SIZE BY 15%
      const bodyGeometry = new THREE.BoxGeometry(
        0.3 * birdSizeFactor, 
        0.3 * birdSizeFactor, 
        0.6 * birdSizeFactor
      );
      
      const bodyMaterial = new THREE.MeshLambertMaterial({ 
        color: Math.random() > 0.5 ? 0x222222 : 0x555555 // Dark or light gray
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bird.add(body);
      
      // Wings (flat triangles) - INCREASED SIZE BY 15%
      const wingGeometry = new THREE.BufferGeometry();
      const wingVertices = new Float32Array([
        0, 0, 0,      // Center
        -1.5 * birdSizeFactor, 0, -0.3 * birdSizeFactor,  // Left back
        -1.5 * birdSizeFactor, 0, 0.3 * birdSizeFactor,   // Left front
      ]);
      wingGeometry.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
      wingGeometry.computeVertexNormals();
      
      const leftWing = new THREE.Mesh(wingGeometry, bodyMaterial);
      leftWing.position.set(-0.2 * birdSizeFactor, 0, 0);
      bird.add(leftWing);
      
      // Right wing (mirror of left)
      const rightWing = leftWing.clone();
      rightWing.scale.x = -1; // Mirror horizontally
      rightWing.position.set(0.2 * birdSizeFactor, 0, 0);
      bird.add(rightWing);
      
      // Position the bird randomly in the sky
      const birdX = (Math.random() - 0.5) * 1000;
      const birdY = 30 + Math.random() * 50;
      const birdZ = (Math.random() - 0.5) * 1000;
      
      bird.position.set(birdX, birdY, birdZ);
      
      // Random rotation
      bird.rotation.y = Math.random() * Math.PI * 2;
      
      // Store wing references for animation
      bird.userData.leftWing = leftWing;
      bird.userData.rightWing = rightWing;
      bird.userData.wingDirection = 1;
      bird.userData.wingSpeed = 0.05 + Math.random() * 0.1;
      bird.userData.flySpeed = 0.2 + Math.random() * 0.3;
      bird.userData.flyDirection = new THREE.Vector3(
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.1, // Mostly horizontal flight
        Math.random() - 0.5
      ).normalize();
      
      this.scene.add(bird);
      birds.push(bird);
    }
    
    return birds;
  }

  // Create fish jumping in water
  createJumpingFish() {
    // Find water hazards using positions (since we don't have direct access)
    const waterPositions = [
      { x: 50, y: -0.5, z: -150, width: 60, depth: 40 }
    ];
    
    const fish = [];
    const fishPerHazard = 3;
    
    waterPositions.forEach(hazard => {
      for (let i = 0; i < fishPerHazard; i++) {
        // Create fish group
        const fishObj = new THREE.Group();
        
        // Fish body
        const bodyGeometry = new THREE.ConeGeometry(0.4, 1.2, 5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x4d9be3, // Blue color
          shininess: 70
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        fishObj.add(body);
        
        // Tail fin
        const tailGeometry = new THREE.BufferGeometry();
        const tailVertices = new Float32Array([
          0, 0, -0.6,      // Center of tail
          0, 0.5, -1.0,    // Top of tail
          0, -0.5, -1.0,   // Bottom of tail
        ]);
        tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailVertices, 3));
        tailGeometry.computeVertexNormals();
        
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0x4d9be3 });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        fishObj.add(tail);
        
        // Position fish at random location in water hazard
        const hazardWidth = hazard.width || 40;
        const hazardDepth = hazard.depth || 40;
        
        const fishX = hazard.x + (Math.random() - 0.5) * (hazardWidth * 0.8);
        const fishZ = hazard.z + (Math.random() - 0.5) * (hazardDepth * 0.8);
        
        // Initially position fish under water
        fishObj.position.set(fishX, hazard.y - 0.5, fishZ);
        
        // Set animation parameters
        fishObj.userData.waterY = hazard.y;
        fishObj.userData.isJumping = false;
        fishObj.userData.jumpHeight = 1.5 + Math.random();
        fishObj.userData.jumpProgress = 0;
        fishObj.userData.jumpDelay = Math.random() * 30; // Random delay before first jump
        fishObj.userData.jumpSpeed = 0.02 + Math.random() * 0.02;
        
        this.scene.add(fishObj);
        fish.push(fishObj);
      }
    });
    
    return fish;
  }

  // Create low-poly spectators - positioned away from the green
  createSpectators() {
    const spectatorGroups = [];
    const greenRadius = 20; // Default green radius if not specified in config
    
    // Define hole position - this would normally come from courseConfig
    const holePosition = new THREE.Vector3(100, 0, -250); // Representative values
    
    // Positions around the course where spectators will be placed
    // Ensuring they're away from the green area
    const spectatorLocations = [
      // Near the tee - far from green
      { x: 10, z: 5, count: 5 },
      { x: -10, z: 5, count: 3 },
      
      // Around the green (but at a safe distance from green edge)
      { x: holePosition.x + (greenRadius + 25), z: holePosition.z, count: 4 },
      { x: holePosition.x - (greenRadius + 25), z: holePosition.z + 5, count: 3 },
      { x: holePosition.x, z: holePosition.z + (greenRadius + 25), count: 4 },
      { x: holePosition.x, z: holePosition.z - (greenRadius + 25), count: 3 },
      
      // Along the fairway (well away from the green)
      { x: 30, z: -70, count: 3 },
      { x: -20, z: -120, count: 2 },
      { x: 25, z: -200, count: 3 },
    ];
    
    spectatorLocations.forEach(location => {
      const group = new THREE.Group();
      
      // Calculate distance to hole position
      const distToHole = Math.sqrt(
        Math.pow(location.x - holePosition.x, 2) + 
        Math.pow(location.z - holePosition.z, 2)
      );
      
      // Double-check: skip if too close to green
      if (distToHole < greenRadius + 20) {
        console.log("Skipping spectator group too close to green");
        return;
      }
      
      for (let i = 0; i < location.count; i++) {
        const spectator = this.createSingleSpectator();
        
        // Position within the group with small random offsets
        const offsetX = (Math.random() - 0.5) * 8;
        const offsetZ = (Math.random() - 0.5) * 8;
        
        spectator.position.set(offsetX, 0, offsetZ);
        
        // Make spectators face toward the green/hole
        const dirToHole = new THREE.Vector2(
          holePosition.x - (location.x + offsetX),
          holePosition.z - (location.z + offsetZ)
        ).normalize();
        
        spectator.rotation.y = Math.atan2(dirToHole.x, dirToHole.y);
        
        group.add(spectator);
      }
      
      // Position the entire group (simplified height calculation)
      group.position.set(location.x, 0, location.z);
      
      this.scene.add(group);
      spectatorGroups.push(group);
    });
    
    return spectatorGroups;
  }

  // Helper method to create a single spectator
  createSingleSpectator() {
    const spectator = new THREE.Group();
    
    // Random color for clothes
    const colors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xe67e22];
    const colorIndex = Math.floor(Math.random() * colors.length);
    const shirtColor = colors[colorIndex];
    
    // Head (simple sphere)
    const headGeometry = new THREE.IcosahedronGeometry(0.4, 1); // Low-poly sphere
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xecdbba }); // Skin tone
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.7;
    spectator.add(head);
    
    // Body (box)
    const bodyGeometry = new THREE.BoxGeometry(0.7, 1, 0.4);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: shirtColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    spectator.add(body);
    
    // Legs (2 thin boxes)
    const legGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e }); // Dark blue/gray
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.45, 0);
    spectator.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.45, 0);
    spectator.add(rightLeg);
    
    // Arms (very simple)
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.45, 1.0, 0);
    spectator.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.45, 1.0, 0);
    spectator.add(rightArm);
    
    // Random rotation - will be overridden to face hole
    spectator.rotation.y = Math.random() * Math.PI * 2;
    
    // Add animation properties
    spectator.userData.bobSpeed = 0.01 + Math.random() * 0.01;
    spectator.userData.bobHeight = 0.05 + Math.random() * 0.05;
    spectator.userData.bobPhase = Math.random() * Math.PI * 2;
    
    return spectator;
  }

  // Add wind effects to trees
  addWindEffects(trees) {
    if (!trees || trees.length === 0) return [];
    
    // Add wind animation properties to each tree
    trees.forEach(tree => {
      // Only apply to the tree top (index 1 in the group)
      const treeTop = tree.children[1];
      if (treeTop) {
        tree.userData.windPhase = Math.random() * Math.PI * 2;
        tree.userData.windSpeed = 0.005 + Math.random() * 0.005;
        tree.userData.windStrength = 0.01 + Math.random() * 0.02;
      }
    });
    
    return trees;
  }
}