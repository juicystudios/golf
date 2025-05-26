// TerrainInteraction.js - Handles ball interaction with terrain types
import * as THREE from 'three';

export class TerrainInteraction {
  constructor(ballPhysics) {
    // Store reference to main class
    this.ballPhysics = ballPhysics;
    
    // Shortcuts to commonly used properties
    this.ballPosition = ballPhysics.ballPosition;
    this.ballRadius = ballPhysics.ballRadius;
    this.gameState = ballPhysics.gameState;
    this.courseBuilder = ballPhysics.courseBuilder;
    this.terrainDetection = ballPhysics.terrainDetection;
  }
  
  // Check the current terrain where the ball is resting
  checkBallLie() {
    // Use the terrain detection system
    const ballLie = this.terrainDetection.getBallLie(this.ballPosition);
    
    // Debug
    console.log("Ball Lie:", ballLie);
    
    // If the ball is very close to the hole, force it to be on green
    const holePosition = this.courseBuilder.courseConfig.holePosition;
    const distToHole = Math.sqrt(
      Math.pow(this.ballPosition.x - holePosition.x, 2) +
      Math.pow(this.ballPosition.z - holePosition.z, 2)
    );
    
    if (distToHole < 5.0) {
      console.log("Ball is near hole! Force-detecting as on green");
      ballLie.onGreen = true;
    }
    
    return ballLie;
  }
  
  // Check if ball is on tee
  isOnTee() {
    // Check if ball is very close to the tee position (0,0)
    const distanceFromTee = Math.sqrt(
      this.ballPosition.x * this.ballPosition.x + 
      this.ballPosition.z * this.ballPosition.z
    );
    
    return distanceFromTee < 3; // Within 3 units of tee center
  }
  
  // Check for collision with trees
  checkTreeCollision() {
    // Get all trees from course builder
    const trees = this.courseBuilder.getTrees();
    
    // No trees to check
    if (!trees || trees.length === 0) return null;
    
    // Check collision with each tree
    for (const tree of trees) {
      if (!tree.userData || !tree.userData.collidable) continue;
      
      // Get trunk position (horizontal plane)
      const trunkPosition = new THREE.Vector2(
        tree.position.x,
        tree.position.z
      );
      
      // Get ball position (horizontal plane)
      const ballPosition = new THREE.Vector2(
        this.ballPosition.x,
        this.ballPosition.z
      );
      
      // Calculate distance between ball and tree trunk
      const distance = trunkPosition.distanceTo(ballPosition);
      
      // Check if distance is less than combined radii (collision)
      const collisionRadius = (tree.userData.radius || 0.7) + this.ballRadius;
      
      if (distance < collisionRadius) {      
        return {
          tree: tree,
          trunkPosition: new THREE.Vector3(tree.position.x, this.ballPosition.y, tree.position.z),
          distance: distance,
          normal: new THREE.Vector2(
            ballPosition.x - trunkPosition.x,
            ballPosition.y - trunkPosition.y
          ).normalize()
        };
      }
    }
    
    // No collision found
    return null;
  }
  
  // Handle water hazard
  handleWaterHazard(hazard) {
    // Stop ball motion
    this.ballPhysics.simulationActive = false;
    this.gameState.ballInMotion = false;
    
    // Add penalty stroke
    this.gameState.incrementStrokes();
    
    // Show penalty message
    alert('Water hazard! +1 penalty stroke');
    
    // Find nearest point to place the ball
    const newPosition = this.courseBuilder.findNearestPointOutsideHazard(
      this.ballPosition,
      hazard
    );
    
    // Place ball at new position
    this.ballPhysics.placeBallAfterPenalty(newPosition);
    
    // Force ball to stop completely
    this.ballPhysics.ballVelocity.set(0, 0, 0);
    this.ballPhysics.ball.position.copy(this.ballPosition);
  }
  
  // Debug method to visualize terrain boundaries
  debugTerrainBoundaries() {
    const position = this.ballPosition.clone();
    
    // Get all hazards
    const hazards = this.courseBuilder.getHazards();
    
    console.log("Current ball position:", position);
    console.log("Testing all hazards at current position:");
    
    hazards.forEach((hazard, index) => {
      const isColliding = hazard.checkCollision(position);
      console.log(`Hazard #${index} (${hazard.type}): ${isColliding ? 'COLLIDING' : 'not colliding'}`);
      
      // Add visual debug for hazard boundaries
      if (hazard.type === 'outerRough') {
        this.visualizeHazardBoundary(hazard, 0xff0000); // Red
      } else if (hazard.type === 'standardRough') {
        this.visualizeHazardBoundary(hazard, 0x00ff00); // Green
      }
    });
    
    // Add a marker for current ball position
    this.addPositionMarker(position, 0xffff00); // Yellow
  }
  
  // Helper to visualize a hazard boundary
  visualizeHazardBoundary(hazard, color) {
    if (hazard.pathStart && hazard.pathEnd) {
      // For path-based hazards
      const direction = new THREE.Vector3().subVectors(hazard.pathEnd, hazard.pathStart).normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      
      // Draw inner boundary
      const innerWidth = hazard.type === 'standardRough' ? 
                       this.courseBuilder.courseConfig.fairwayWidth / 2 : 
                       hazard.standardRoughWidth;
                       
      // Draw outer boundary
      const outerWidth = hazard.type === 'standardRough' ? 
                       hazard.roughHalfWidth :
                       hazard.outerRoughWidth;
                       
      this.drawPathBoundary(hazard.pathStart, hazard.pathEnd, innerWidth, color, 0.3);
      this.drawPathBoundary(hazard.pathStart, hazard.pathEnd, outerWidth, color, 0.6);
    }
  }
  
  // Helper to draw a path boundary
  drawPathBoundary(start, end, width, color, opacity) {
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
    
    const v1 = start.clone().add(perpendicular.clone().multiplyScalar(width));
    const v2 = start.clone().add(perpendicular.clone().multiplyScalar(-width));
    const v3 = end.clone().add(perpendicular.clone().multiplyScalar(-width));
    const v4 = end.clone().add(perpendicular.clone().multiplyScalar(width));
    
    // Apply height from the terrain
    v1.y = this.courseBuilder.getHeightAt(v1.x, v1.z) + 0.1;
    v2.y = this.courseBuilder.getHeightAt(v2.x, v2.z) + 0.1;
    v3.y = this.courseBuilder.getHeightAt(v3.x, v3.z) + 0.1;
    v4.y = this.courseBuilder.getHeightAt(v4.x, v4.z) + 0.1;
    
    // Create line geometry
    const lineGeometry1 = new THREE.BufferGeometry().setFromPoints([v1, v4]);
    const lineGeometry2 = new THREE.BufferGeometry().setFromPoints([v2, v3]);
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      transparent: true,
      opacity: opacity
    });
    
    const line1 = new THREE.Line(lineGeometry1, lineMaterial);
    const line2 = new THREE.Line(lineGeometry2, lineMaterial);
    
    this.ballPhysics.scene.add(line1);
    this.ballPhysics.scene.add(line2);
    
    // Remove after 5 seconds
    setTimeout(() => {
      this.ballPhysics.scene.remove(line1);
      this.ballPhysics.scene.remove(line2);
    }, 5000);
  }
  
  // Add a visual marker at a position
  addPositionMarker(position, color) {
    const markerGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    
    this.ballPhysics.scene.add(marker);
    
    // Remove after 5 seconds
    setTimeout(() => {
      this.ballPhysics.scene.remove(marker);
    }, 5000);
  }
  
  // Debug method to visualize terrain zones
  debugTerrainZones() {
    if (this.terrainDetection) {
      this.terrainDetection.visualizeTerrainZones(this.ballPhysics.scene);
      console.log("Visualizing terrain zones for 10 seconds");
    } else {
      console.log("Terrain detection system not available");
    }
  }
}