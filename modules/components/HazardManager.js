// components/HazardManager.js - Updated with improved hazard types
// Ensures compatibility with BallPhysics.js

import * as THREE from 'three';

export class HazardManager {
  constructor(scene, terrainManager, courseConfig) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.courseConfig = courseConfig;
  }

  // Create a water hazard
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
    
    // Create hazard object for collision detection - using exact same structure as original code
    const waterHazard = {
      type: 'water',
      position: new THREE.Vector3(x, avgHeight, z),
      width: width,
      depth: depth,
      checkCollision: (position) => {
        // Exact same check as in original code
        return (
          position.x > x - width/2 && 
          position.x < x + width/2 && 
          position.z > z - depth/2 && 
          position.z < z + depth/2 &&
          position.y <= avgHeight + 0.8
        );
      }
    };
    
    console.log("Created water hazard with type:", waterHazard.type);
    return [waterHazard];
  }

  // Create a sand bunker
  createSandBunker(x, z, width, depth) {
    // Create a simple plane geometry for the sand bunker - just like water
    const bunkerGeometry = new THREE.PlaneGeometry(width, depth);
    
    // Sand color material - brighter, more noticeable
    const bunkerMaterial = new THREE.MeshLambertMaterial({
      color: 0xf2d2a9, // Sand color
      side: THREE.DoubleSide
    });
    
    const bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.rotation.x = -Math.PI / 2;
    
    // Position slightly above terrain for better visibility but still sunken
    const avgHeight = this.terrainManager.getHeightAt(x, z) - 0.3; // Slightly sunken
    bunker.position.set(x, avgHeight, z);
    
    this.scene.add(bunker);
    
    // Create hazard object with exactly the same structure as original code
    const sandHazard = {
      type: 'sand',
      position: new THREE.Vector3(x, avgHeight, z),
      width: width,
      depth: depth,
      checkCollision: (position) => {
        // Exact same check as in original code
        return (
          position.x > x - width/2 && 
          position.x < x + width/2 && 
          position.z > z - depth/2 && 
          position.z < z + depth/2 &&
          Math.abs(position.y - avgHeight) < 0.8
        );
      }
    };
    
    console.log("Created sand hazard with type:", sandHazard.type);
    return [sandHazard];
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
}