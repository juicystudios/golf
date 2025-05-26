// simplified-terrain-detection.js
// Add this as a new file to simplify terrain detection

import * as THREE from 'three';

export class TerrainDetection {
  constructor(courseBuilder) {
    this.courseBuilder = courseBuilder;
    this.terrainManager = courseBuilder.terrainManager;
    this.courseConfig = courseBuilder.courseConfig;
    
  // Add debug flags
  this.disableOuterRough = false; // Disable outer rough detection
  this.disableStandardRough = false; // Disable standard rough detection for testing
  this.debugLogging = true; // Enable verbose logging for terrain detection
  
  // Explicitly store terrain zones for easier detection
  this.fairwayZones = [];
  this.roughZones = [];
  this.outerRoughZones = [];
  this.sandZones = [];
  this.waterZones = [];
  this.greenZone = null;
}
  
  // Initialize terrain zones from course generation
  initializeZones(holePath) {
    console.log("Initializing terrain zones for detection...");
    
    // Clear existing zones
    this.fairwayZones = [];
    this.roughZones = [];
    this.outerRoughZones = [];
    
    // Create fairway zones
    this.createFairwayZones(holePath);
    
    // Create rough zones
    this.createRoughZones(holePath);
    
    // Create outer rough zones
    this.createOuterRoughZones(holePath);
    
    // Create green zone (circle around hole)
    this.createGreenZone();
    
    console.log(`Terrain zones initialized: ${this.fairwayZones.length} fairway, ${this.roughZones.length} rough, ${this.outerRoughZones.length} outer rough zones`);
  }
  
  // Create fairway zones along hole path
  createFairwayZones(holePath) {
    // Increase fairway width even more - make it 3x the configured width
    const fairwayWidth = this.courseConfig.fairwayWidth;
    
    if (this.debugLogging) {
      console.log(`%c[FAIRWAY DEBUG] Creating ${holePath.length - 1} fairway zones with width ${fairwayWidth}`, "color: blue");
    }
    
    for (let i = 0; i < holePath.length - 1; i++) {
      const start = holePath[i];
      const end = holePath[i + 1];
      
      if (this.debugLogging) {
        console.log(`%c[FAIRWAY DEBUG] Zone ${i}: Start (${start.x.toFixed(2)}, ${start.z.toFixed(2)}), End (${end.x.toFixed(2)}, ${end.z.toFixed(2)})`, "color: blue");
      }
      
      this.fairwayZones.push({
        start: start.clone(),
        end: end.clone(),
        width: fairwayWidth,
        // Helper functions
        getDistanceToPath: (position) => {
          return this.getDistanceToPath(position, start, end);
        },
        containsPoint: (position) => {
          const dist = this.getDistanceToPath(position, start, end);
          const result = dist <= fairwayWidth / 2;
          
          if (this.debugLogging) {
            console.log(`%c[FAIRWAY CHECK] Zone ${i}: Distance ${dist.toFixed(2)} <= ${(fairwayWidth / 2).toFixed(2)}? ${result}`, "color: blue");
          }
          
          return result;
        }
      });
    }
  }
  
  // Create rough zones along hole path
  createRoughZones(holePath) {
    const fairwayWidth = this.courseConfig.fairwayWidth;
    const roughWidth = this.courseConfig.roughWidth;
    
    for (let i = 0; i < holePath.length - 1; i++) {
      const start = holePath[i];
      const end = holePath[i + 1];
      
      this.roughZones.push({
        start: start.clone(),
        end: end.clone(),
        innerWidth: fairwayWidth / 2,
        outerWidth: roughWidth / 2 + fairwayWidth / 2,
        // Helper functions
        getDistanceToPath: (position) => {
          return this.getDistanceToPath(position, start, end);
        },
        containsPoint: (position) => {
          const dist = this.getDistanceToPath(position, start, end);
          return dist > fairwayWidth / 2 && dist <= roughWidth / 2 + fairwayWidth / 2;
        }
      });
    }
  }
  
  // Create outer rough zones along hole path
  createOuterRoughZones(holePath) {
    const fairwayWidth = this.courseConfig.fairwayWidth;
    const roughWidth = this.courseConfig.roughWidth;
    const outerRoughWidth = 30; // Width of the outer rough band
    
    for (let i = 0; i < holePath.length - 1; i++) {
      const start = holePath[i];
      const end = holePath[i + 1];
      
      const innerWidth = fairwayWidth / 2 + roughWidth;
      const outerWidth = innerWidth + outerRoughWidth;
      
      this.outerRoughZones.push({
        start: start.clone(),
        end: end.clone(),
        innerWidth: innerWidth,
        outerWidth: outerWidth,
        // Helper functions
        getDistanceToPath: (position) => {
          return this.getDistanceToPath(position, start, end);
        },
        containsPoint: (position) => {
          const dist = this.getDistanceToPath(position, start, end);
          return dist > innerWidth && dist <= outerWidth;
        }
      });
    }
  }
  
  // Create green zone around hole
  createGreenZone() {
    const holePosition = this.courseConfig.holePosition;
    const greenRadius = this.courseConfig.greenRadius;
    
    this.greenZone = {
      center: holePosition.clone(),
      radius: greenRadius,
      containsPoint: (position) => {
        const dx = position.x - holePosition.x;
        const dz = position.z - holePosition.z;
        const distSquared = dx * dx + dz * dz;
        return distSquared <= greenRadius * greenRadius;
      }
    };
  }
  
  // Add water hazard to detection system
  addWaterHazard(waterHazard) {
    this.waterZones.push(waterHazard);
  }
  
  // Add sand bunker to detection system
  addSandBunker(sandBunker) {
    this.sandZones.push(sandBunker);
  }
  
  // Calculate the lie of the ball at a given position
  getBallLie(position) {
    // Create default lie (assume fairway)
    const ballLie = {
      inSand: false,
      inRough: false,
      inOuterRough: false,
      inWater: false,
      onGreen: false,
      onFairway: true // Default to fairway
    };
    
    // Special case: near the tee
    if (this.isNearTee(position)) {
      console.log("%c[TERRAIN DETECTION] Ball is on tee", "color: lightblue; font-weight: bold");
      return ballLie; // Keep default fairway lie for tee shots
    }
    
    // Special case: check if position is very far from course
    const distanceFromOrigin = Math.sqrt(position.x * position.x + position.z * position.z);
    const farDistanceThreshold = 500;
    
    if (distanceFromOrigin > farDistanceThreshold) {
      console.log(`%c[TERRAIN DETECTION] Ball is very far (${distanceFromOrigin.toFixed(0)} units) from course, defaulting to outer rough`, "color: purple; font-weight: bold");
      
      // Far-off positions should be treated as outer rough
      ballLie.inOuterRough = true;
      ballLie.onFairway = false;
      return ballLie;
    }
    
    // Log current position for debugging
    if (this.debugLogging) {
      console.log(`%c[TERRAIN DEBUG] Checking position (${position.x.toFixed(2)}, ${position.z.toFixed(2)})`, "color: purple");
    }
    
    // Check green first (highest priority, except for water)
    if (this.greenZone && this.greenZone.containsPoint(position)) {
      ballLie.onGreen = true;
      ballLie.onFairway = false;
      console.log("%c[TERRAIN DETECTION] Ball is on green", "color: green; font-weight: bold");
      return ballLie;
    }
    
    // Check water hazards (highest priority)
    for (const waterZone of this.waterZones) {
      if (waterZone.checkCollision(position)) {
        ballLie.inWater = true;
        ballLie.onFairway = false;
        console.log("%c[TERRAIN DETECTION] Ball is in water", "color: blue; font-weight: bold");
        return ballLie;
      }
    }
    
    // Check sand bunkers
    for (const sandZone of this.sandZones) {
      if (sandZone.checkCollision(position)) {
        ballLie.inSand = true;
        ballLie.onFairway = false;
        console.log("%c[TERRAIN DETECTION] Ball is in sand", "color: yellow; font-weight: bold");
        return ballLie;
      }
    }
    
    // IMPORTANT CHANGE: Check fairway zones FIRST before rough
    // This way, if a ball is within both fairway and rough zones, fairway takes precedence
    let onFairway = false;
    let closestFairwayDist = Number.MAX_VALUE;
    
    for (const fairwayZone of this.fairwayZones) {
      const dist = fairwayZone.getDistanceToPath(position);
      if (dist < closestFairwayDist) {
        closestFairwayDist = dist;
      }
      
      if (fairwayZone.containsPoint(position)) {
        onFairway = true;
        break;
      }
    }
    
    if (onFairway) {
      // Ball is explicitly on fairway
      ballLie.onFairway = true;
      console.log(`%c[TERRAIN DETECTION] Ball is on fairway (${closestFairwayDist.toFixed(1)} units from center)`, "color: lightgreen; font-weight: bold");
      return ballLie;
    }
    
    console.log(`%c[TERRAIN DETECTION] Ball is NOT on fairway (${closestFairwayDist.toFixed(1)} units from closest fairway)`, "color: orange; font-weight: bold");
    
    // Only check standard rough if we're not disabling it for testing
    if (!this.disableStandardRough) {
      // Check standard rough
      let inRough = false;
      for (const roughZone of this.roughZones) {
        if (roughZone.containsPoint(position)) {
          inRough = true;
          break;
        }
      }
      
      if (inRough) {
        ballLie.inRough = true;
        ballLie.onFairway = false;
        console.log("%c[TERRAIN DETECTION] Ball is in standard rough", "color: darkgreen; font-weight: bold");
        return ballLie;
      }
    }
    
    // Only check outer rough if we're not disabling it for testing
    if (!this.disableOuterRough) {
      // Check outer rough
      let inOuterRough = false;
      for (const outerRoughZone of this.outerRoughZones) {
        if (outerRoughZone.containsPoint(position)) {
          inOuterRough = true;
          break;
        }
      }
      
      if (inOuterRough) {
        ballLie.inOuterRough = true;
        ballLie.onFairway = false;
        console.log("%c[TERRAIN DETECTION] Ball is in outer rough", "color: darkred; font-weight: bold");
        return ballLie;
      }
    }
    
// Check the distance to the closest fairway zone
let minDistanceToFairway = Number.MAX_VALUE;
let closestFairwayZone = null;

for (const fairwayZone of this.fairwayZones) {
  const dist = fairwayZone.getDistanceToPath(position);
  if (dist < minDistanceToFairway) {
    minDistanceToFairway = dist;
    closestFairwayZone = fairwayZone;
  }
}

// The rough should be between fairway and outer rough
// If ball is somewhat close to fairway but not in it, treat as standard rough
const fairwayWidth = this.courseConfig.fairwayWidth;
const roughDetectionDistance = fairwayWidth * 2; // Distance that should be considered rough

if (minDistanceToFairway <= roughDetectionDistance) {
  ballLie.inRough = true;
  ballLie.onFairway = false;
  console.log(`%c[TERRAIN DETECTION] Ball is near fairway (${minDistanceToFairway.toFixed(1)} units) but outside, detecting as standard rough`, "color: darkgreen; font-weight: bold");
} else {
  // If far from fairway, treat as outer rough
  ballLie.inOuterRough = true;
  ballLie.onFairway = false;
  console.log(`%c[TERRAIN DETECTION] Ball is far from fairway (${minDistanceToFairway.toFixed(1)} units), detecting as outer rough`, "color: darkred; font-weight: bold");
}

return ballLie;
  }
  
  // Check if position is near tee
  isNearTee(position) {
    const distanceFromTee = Math.sqrt(
      position.x * position.x + 
      position.z * position.z
    );
    
    return distanceFromTee < 3; // Within 3 units of tee center
  }
  
  // Helper function to get distance from a point to a path segment
  getDistanceToPath(position, start, end) {
    const a = new THREE.Vector2(start.x, start.z);
    const b = new THREE.Vector2(end.x, end.z);
    const p = new THREE.Vector2(position.x, position.z);
    
    // For very distant positions, use a simplified check
    const maxProcessingDistance = 500; // Don't do complex calculations for positions beyond this distance
    const originDistance = new THREE.Vector2(0, 0).distanceTo(p);
    
    if (originDistance > maxProcessingDistance) {
      if (this.debugLogging) {
        console.log(`[PATH DEBUG] Position (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) too distant (${originDistance.toFixed(2)}), using simplified distance`);
      }
      return originDistance; // Use distance from origin for very distant points
    }
    
    // Vector from a to b
    const ab = new THREE.Vector2().subVectors(b, a);
    
    // Check if path segment has zero length (avoid division by zero)
    if (ab.lengthSq() < 0.0001) {
      // If points are too close, just return distance to start point
      return a.distanceTo(p);
    }
    
    // Vector from a to p
    const ap = new THREE.Vector2().subVectors(p, a);
    
    // Project ap onto ab, clamped to [0, 1]
    const t = Math.max(0, Math.min(1, ap.dot(ab) / ab.dot(ab)));
    
    // Closest point on line segment
    const closest = new THREE.Vector2().copy(a).addScaledVector(ab, t);
    
    // Distance from p to closest point
    const distance = p.distanceTo(closest);
    
    if (this.debugLogging) {
      console.log(`[PATH DEBUG] Distance from (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) to path: ${distance.toFixed(2)}`);
    }
    
    return distance;
  }

  logFairwayZones() {
    console.log(`%c[FAIRWAY INFO] Number of fairway zones: ${this.fairwayZones.length}`, "color: blue; font-weight: bold");
    
    this.fairwayZones.forEach((zone, index) => {
      const start = zone.start;
      const end = zone.end;
      
      console.log(`%c[FAIRWAY INFO] Zone ${index}: Start (${start.x.toFixed(2)}, ${start.z.toFixed(2)}), End (${end.x.toFixed(2)}, ${end.z.toFixed(2)}), Width: ${zone.width.toFixed(2)}`, "color: blue");
    });
  }
  
  // Debug function to visualize terrain zones
  visualizeTerrainZones(scene) {
      // Log fairway zones for debugging
  this.logFairwayZones();
    const zonesHeight = 0.1; // Height above terrain for visualization
    
    // Visualize fairway zones
    this.fairwayZones.forEach(zone => {
      const color = 0x90EE90; // Light green
      this.visualizeZone(scene, zone.start, zone.end, zone.width, color, 0.3, zonesHeight);
    });
    
    // Visualize rough zones
    this.roughZones.forEach(zone => {
      const color = 0x4CAF50; // Medium green
      this.visualizeZone(scene, zone.start, zone.end, zone.outerWidth, color, 0.3, zonesHeight);
      this.visualizeZone(scene, zone.start, zone.end, zone.innerWidth, color, 0.1, zonesHeight);
    });
    
    // Visualize outer rough zones
    this.outerRoughZones.forEach(zone => {
      const color = 0x0a3b0a; // Dark green
      this.visualizeZone(scene, zone.start, zone.end, zone.outerWidth, color, 0.3, zonesHeight);
      this.visualizeZone(scene, zone.start, zone.end, zone.innerWidth, color, 0.1, zonesHeight);
    });
    
    // Visualize green zone
    if (this.greenZone) {
      const center = this.greenZone.center;
      const radius = this.greenZone.radius;
      const greenGeometry = new THREE.CircleGeometry(radius, 32);
      const greenMaterial = new THREE.MeshBasicMaterial({
        color: 0x2E8B57, // Dark green
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      
      const green = new THREE.Mesh(greenGeometry, greenMaterial);
      green.rotation.x = -Math.PI / 2;
      green.position.copy(center);
      green.position.y += zonesHeight;
      
      scene.add(green);
      
      // Remove visualization after 10 seconds
      setTimeout(() => {
        scene.remove(green);
      }, 10000);
    }
  }
  
  // Helper to visualize a zone
  visualizeZone(scene, start, end, width, color, opacity, height) {
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
    
    // Vertices for zone boundary
    const p1 = start.clone().add(perpendicular.clone().multiplyScalar(width / 2));
    const p2 = start.clone().add(perpendicular.clone().multiplyScalar(-width / 2));
    const p3 = end.clone().add(perpendicular.clone().multiplyScalar(-width / 2));
    const p4 = end.clone().add(perpendicular.clone().multiplyScalar(width / 2));
    
    // Adjust heights
    p1.y = this.terrainManager.getHeightAt(p1.x, p1.z) + height;
    p2.y = this.terrainManager.getHeightAt(p2.x, p2.z) + height;
    p3.y = this.terrainManager.getHeightAt(p3.x, p3.z) + height;
    p4.y = this.terrainManager.getHeightAt(p4.x, p4.z) + height;
    
    // Create outline lines
    const lineGeometry1 = new THREE.BufferGeometry().setFromPoints([p1, p2, p3, p4, p1]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      linewidth: 2
    });
    
    const line = new THREE.Line(lineGeometry1, lineMaterial);
    scene.add(line);
    
    // Remove visualization after 10 seconds
    setTimeout(() => {
      scene.remove(line);
    }, 10000);
  }
}