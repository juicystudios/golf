// Modified CourseBuilder.js
// Focus on integrating the new terrain detection system

import * as THREE from 'three';
import { TerrainManager } from './TerrainManager.js';
import { TerrainGenerator } from './components/TerrainGenerator.js';
import { HazardManager } from './components/HazardManager.js';
import { ObjectPlacer } from './components/ObjectPlacer.js';
import { SkyboxManager } from './components/SkyboxManager.js';
import { AnimationController } from './components/AnimationController.js';
import { TerrainDetection } from './components/TerrainDetection.js'; // Import the new system

export class CourseBuilder {
  constructor(scene, courseConfig) {
    this.scene = scene;
    this.courseConfig = courseConfig;
    this.terrainManager = new TerrainManager(courseConfig);
    
    // Initialize specialized components
    this.terrainGenerator = new TerrainGenerator(scene, this.terrainManager, courseConfig);
    this.hazardManager = new HazardManager(scene, this.terrainManager, courseConfig);
    this.objectPlacer = new ObjectPlacer(scene, this.terrainManager, courseConfig);
    this.skyboxManager = new SkyboxManager(scene, courseConfig);
    this.animationController = new AnimationController(scene);
    
    // Initialize the new terrain detection system
    this.terrainDetection = new TerrainDetection(this);
    
    // Store collections of objects for access by other modules
    this.hazards = [];
    this.trees = [];
    this.groundMesh = null;
    
    // References to animated elements
    this.birds = [];
    this.fish = [];
    this.spectators = [];
    this.windyTrees = [];
  }

  // Generate the complete golf course
  generateCourse() {
    console.log("Generating course...");
    
    // Reset the hazards array to ensure clean start
    this.hazards = [];
    
    // Generate terrain heightmap
    this.terrainManager.generateHeightmap();
    
    // Create skybox
    this.skyboxManager.createProperSkybox();
    
    // Get hole path for the fairway
    const holePath = this.courseConfig.generateHolePath();
    
    // Create terrain and ground
    this.terrainGenerator.createBaseGround();
    this.groundMesh = this.terrainGenerator.createGround();
    
    // Create tee box
    this.objectPlacer.createTeeBox();
    
    // Create fairway and rough areas
    this.terrainGenerator.createFairway(holePath);
    // Collect hazards from rough creation
    const roughHazards = this.terrainGenerator.createRough(holePath);
    const outerRoughHazards = this.terrainGenerator.createOuterRough(holePath);
    
    // Add hazards to the main hazards array
    this.hazards = [...this.hazards, ...roughHazards, ...outerRoughHazards];
    
    // Add trees along the rough
    this.trees = this.objectPlacer.addTrees(holePath);
    
    // Create water hazard and add to hazards
    const waterHazards = this.createWaterHazard(50, -150, 60, 40);
    this.hazards = [...this.hazards, ...waterHazards];
    
    // Create green at the hole
    this.terrainGenerator.createGreen();
    
    // Create sand bunkers
    this.createSandBunkers();
    
    // Add hole and flag
    this.objectPlacer.addHoleAndFlag();
    
    // Add decorative elements
    this.createDecorativeElements();
    
    // Initialize the terrain detection system with the hole path
    this.terrainDetection.initializeZones(holePath);
    
    // Add water hazards to terrain detection
    for (const hazard of waterHazards) {
      this.terrainDetection.addWaterHazard(hazard);
    }
    
    // Add sand bunkers to terrain detection
    for (const hazard of this.hazards) {
      if (hazard.type === 'sand') {
        this.terrainDetection.addSandBunker(hazard);
      }
    }
    
    // Debug logging to verify hazards are created correctly
    console.log("Course generation complete with hazards:", this.hazards.length);
    console.log("Hazard types:", this.hazards.map(h => h.type));
  }
  
  // Create water hazard - FIXED IMPLEMENTATION
  createWaterHazard(x, z, width, depth) {
    // Water surface
    const waterGeometry = new THREE.PlaneGeometry(width, depth);
    const waterMaterial = new THREE.MeshLambertMaterial({
      color: 0x3333ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    
    // Position below terrain for a sunken effect
    const avgHeight = this.terrainManager.getHeightAt(x, z) - 0.5;
    water.position.set(x, avgHeight, z);
    
    this.scene.add(water);
    
    // Add to hazards list for collision detection
    const waterHazard = {
      type: 'water',
      position: new THREE.Vector3(x, avgHeight, z),
      width: width,
      depth: depth,
      checkCollision: (position) => {
        // More precise boundary detection - reduce the buffer zone
        return (
          position.x > x - width/2 && 
          position.x < x + width/2 && 
          position.z > z - depth/2 && 
          position.z < z + depth/2 &&
          // Limit the vertical detection height
          position.y <= avgHeight + 0.8 // Reduced from +2 to +0.8
        );
      }
    };

    console.log("Created water hazard at position:", x, z, "with height:", avgHeight);
    
    return [waterHazard];
  }
  
  // Create sand bunkers
  createSandBunkers() {
    // Original bunkers
    const sandHazards1 = this.hazardManager.createSandBunker(this.courseConfig.holePosition.x - 15, this.courseConfig.holePosition.z - 10, 10, 7);
    const sandHazards2 = this.hazardManager.createSandBunker(this.courseConfig.holePosition.x + 20, this.courseConfig.holePosition.z + 5, 12, 8);
    const sandHazards3 = this.hazardManager.createSandBunker(40, -180, 15, 10);
    
    // Additional bunkers around the green
    const sandHazards4 = this.hazardManager.createSandBunker(this.courseConfig.holePosition.x - 5, this.courseConfig.holePosition.z + 20, 8, 6);
    const sandHazards5 = this.hazardManager.createSandBunker(this.courseConfig.holePosition.x + 10, this.courseConfig.holePosition.z + 20, 7, 5);
    const sandHazards6 = this.hazardManager.createSandBunker(this.courseConfig.holePosition.x, this.courseConfig.holePosition.z - 20, 12, 5);
    
    // Add all sand hazards to the main hazards array
    this.hazards = [
      ...this.hazards,
      ...sandHazards1,
      ...sandHazards2,
      ...sandHazards3,
      ...sandHazards4,
      ...sandHazards5,
      ...sandHazards6
    ];
  }
  
  // Create decorative elements
  createDecorativeElements() {
    // Add clouds in the sky
    this.objectPlacer.createClouds();
    
    // Add alligator near the water hazard
    this.objectPlacer.createAlligator(50 + 10, -150 - 10);
    
    // Add birds in the sky
    this.birds = this.animationController.createBirds();
    
    // Add fish jumping in water
    this.fish = this.animationController.createJumpingFish();
    
    // Add spectators
    this.spectators = this.animationController.createSpectators();
    
    // Add wind effects to trees
    this.windyTrees = this.animationController.addWindEffects(this.trees);
  }

  // Get the height at a specific world position (delegated to terrain manager)
  getHeightAt(x, z) {
    return this.terrainManager.getHeightAt(x, z);
  }

  // Get all hazards for collision detection
  getHazards() {
    return this.hazards;
  }

  // Get tree positions for collision detection
  getTrees() {
    return this.trees || [];
  }

  // Find the nearest point outside a hazard (for water hazard penalties)
  findNearestPointOutsideHazard(position, hazard) {
    if (hazard.type === 'water') {
      // Calculate vector from hazard center to ball
      const directionVector = new THREE.Vector3()
        .subVectors(position, hazard.position)
        .setY(0) // Keep on ground plane
        .normalize();
      
      // Calculate distance to place the ball outside hazard (half width/depth + safety margin)
      const distanceFromCenter = Math.max(hazard.width, hazard.depth) / 2 + 5;
      
      // Return position outside the hazard
      return hazard.position.clone().add(
        directionVector.multiplyScalar(distanceFromCenter)
      );
    }
    
    // Default - should never reach here
    return position.clone();
  }
  
  // Check if a position is in water
  isInWater(position) {
    for (const hazard of this.hazards) {
      if (hazard.type === 'water' && hazard.checkCollision(position)) {
        return true;
      }
    }
    return false;
  }
  
  // Check if a position is in sand
  isInSand(position) {
    for (const hazard of this.hazards) {
      if (hazard.type === 'sand' && hazard.checkCollision(position)) {
        return true;
      }
    }
    return false;
  }
  
  // Check if a position is in standard rough
  isInStandardRough(position) {
    for (const hazard of this.hazards) {
      if (hazard.type === 'standardRough' && hazard.checkCollision(position)) {
        return true;
      }
    }
    return false;
  }
}