// components/TerrainGenerator.js
// Handles creation of terrain, fairway, rough, and green

import * as THREE from 'three';

export class TerrainGenerator {
  constructor(scene, terrainManager, courseConfig) {
    this.scene = scene;
    this.terrainManager = terrainManager;
    this.courseConfig = courseConfig;
    this.baseGroundMesh = null;
    this.groundMesh = null;
  }

  // Create a large flat base ground that extends far beyond the course
  createBaseGround() {
    // Create a much larger ground plane that extends far in all directions
    const baseGroundSize = this.courseConfig.groundSize * 3; // 3x the normal ground size
    const baseGroundGeometry = new THREE.PlaneGeometry(
      baseGroundSize,
      baseGroundSize
    );
    
    const baseGroundMaterial = new THREE.MeshLambertMaterial({
      color: 0x3d9e41, // Green grass color
      wireframe: false
    });
    
    this.baseGroundMesh = new THREE.Mesh(baseGroundGeometry, baseGroundMaterial);
    this.baseGroundMesh.rotation.x = -Math.PI / 2;
    this.baseGroundMesh.position.y = -1; // Set slightly below the terrain ground
    this.baseGroundMesh.receiveShadow = true;
    this.scene.add(this.baseGroundMesh);
    
    console.log("Base ground created with size:", baseGroundSize);
    return this.baseGroundMesh;
  }

  // Create the ground mesh with terrain
  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(
      this.courseConfig.groundSize,
      this.courseConfig.groundSize,
      this.courseConfig.groundSize / 10,
      this.courseConfig.groundSize / 10
    );
    
    // Apply heightmap to the ground geometry
    this.terrainManager.applyHeightmapToGeometry(groundGeometry);
    
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x3d9e41, // Green grass color for the rough
      wireframe: false
    });
    
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
    
    console.log("Terrain ground created");
    return this.groundMesh;
  }

  // Create fairway segments following a path
  createFairway(holePath) {
    const fairwayMaterial = new THREE.MeshLambertMaterial({
      color: 0x90EE90, // Lighter green for fairway
      side: THREE.DoubleSide
    });
    
    const fairwaySegments = [];
    
    // Create fairway segments
    for (let i = 0; i < holePath.length - 1; i++) {
      const start = holePath[i];
      const end = holePath[i + 1];
      
      // Calculate direction and perpendicular
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      
      // Create vertices for the fairway segment
      const halfWidth = this.courseConfig.fairwayWidth / 2;
      const v1 = start.clone().add(perpendicular.clone().multiplyScalar(halfWidth));
      const v2 = start.clone().add(perpendicular.clone().multiplyScalar(-halfWidth));
      const v3 = end.clone().add(perpendicular.clone().multiplyScalar(-halfWidth));
      const v4 = end.clone().add(perpendicular.clone().multiplyScalar(halfWidth));
      
      // Apply height from the terrain
      v1.y = this.terrainManager.getHeightAt(v1.x, v1.z) + 0.01;
      v2.y = this.terrainManager.getHeightAt(v2.x, v2.z) + 0.01;
      v3.y = this.terrainManager.getHeightAt(v3.x, v3.z) + 0.01;
      v4.y = this.terrainManager.getHeightAt(v4.x, v4.z) + 0.01;
      
      // Create fairway segment geometry
      const fairwaySegmentGeometry = new THREE.BufferGeometry().setFromPoints([v1, v2, v3, v1, v3, v4]);
      fairwaySegmentGeometry.computeVertexNormals();
      
      const fairwaySegment = new THREE.Mesh(fairwaySegmentGeometry, fairwayMaterial);
      this.scene.add(fairwaySegment);
      fairwaySegments.push(fairwaySegment);
    }
    
    return fairwaySegments;
  }

  // Create rough areas between fairway and tree line
  createRough(holePath) {
    const roughMaterial = new THREE.MeshLambertMaterial({
      color: 0x4CAF50, // Medium green for rough
      side: THREE.DoubleSide
    });
    
    const roughWidth = this.courseConfig.roughWidth;
    const roughSegments = [];
    const roughHazards = [];
    
    // Create rough segments along the path
    for (let i = 0; i < holePath.length - 1; i++) {
      const start = holePath[i];
      const end = holePath[i + 1];
      
      // Calculate direction and perpendicular
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      
      // Create vertices for the rough segment
      const fairwayHalfWidth = this.courseConfig.fairwayWidth / 2;
      const roughHalfWidth = roughWidth / 2;
      
      // Inner vertices (fairway boundary)
      const v1 = start.clone().add(perpendicular.clone().multiplyScalar(fairwayHalfWidth));
      const v2 = start.clone().add(perpendicular.clone().multiplyScalar(-fairwayHalfWidth));
      const v3 = end.clone().add(perpendicular.clone().multiplyScalar(-fairwayHalfWidth));
      const v4 = end.clone().add(perpendicular.clone().multiplyScalar(fairwayHalfWidth));
      
      // Outer vertices (rough boundary)
      const v5 = start.clone().add(perpendicular.clone().multiplyScalar(roughHalfWidth));
      const v6 = start.clone().add(perpendicular.clone().multiplyScalar(-roughHalfWidth));
      const v7 = end.clone().add(perpendicular.clone().multiplyScalar(-roughHalfWidth));
      const v8 = end.clone().add(perpendicular.clone().multiplyScalar(roughHalfWidth));
      
      // Apply height from the terrain
      v1.y = this.terrainManager.getHeightAt(v1.x, v1.z) + 0.02;
      v2.y = this.terrainManager.getHeightAt(v2.x, v2.z) + 0.02;
      v3.y = this.terrainManager.getHeightAt(v3.x, v3.z) + 0.02;
      v4.y = this.terrainManager.getHeightAt(v4.x, v4.z) + 0.02;
      v5.y = this.terrainManager.getHeightAt(v5.x, v5.z) + 0.02;
      v6.y = this.terrainManager.getHeightAt(v6.x, v6.z) + 0.02;
      v7.y = this.terrainManager.getHeightAt(v7.x, v7.z) + 0.02;
      v8.y = this.terrainManager.getHeightAt(v8.x, v8.z) + 0.02;
      
      // Create left rough (between v1-v5-v8-v4)
      const leftRoughGeometry = new THREE.BufferGeometry();
      leftRoughGeometry.setFromPoints([v1, v5, v8, v1, v8, v4]);
      leftRoughGeometry.computeVertexNormals();
      const leftRough = new THREE.Mesh(leftRoughGeometry, roughMaterial);
      
      // Create right rough (between v2-v6-v7-v3)
      const rightRoughGeometry = new THREE.BufferGeometry();
      rightRoughGeometry.setFromPoints([v2, v6, v7, v2, v7, v3]);
      rightRoughGeometry.computeVertexNormals();
      const rightRough = new THREE.Mesh(rightRoughGeometry, roughMaterial);
      
      this.scene.add(leftRough);
      this.scene.add(rightRough);
      roughSegments.push(leftRough, rightRough);
      
      // Add rough hazard for ball physics with improved collision detection
      const roughHazard = {
        type: 'standardRough', // Make sure this is 'standardRough' not just 'rough'
        pathStart: start,
        pathEnd: end,
        fairwayHalfWidth: fairwayHalfWidth,
        roughHalfWidth: roughHalfWidth,
        checkCollision: (position) => {
          // Calculate distance to path segment
          const distToPath = this.terrainManager.distanceToPath(position, start, end);
          
          // Only in standard rough if outside fairway boundary but inside rough boundary
          const isOutsideFairway = distToPath > fairwayHalfWidth;
          const isInsideRough = distToPath < roughHalfWidth;
          
          // Add more detailed logging for debugging
          if (Math.abs(position.x) < 10 && Math.abs(position.z) < 10) {
            console.log(`[STANDARD ROUGH CHECK] Pos: (${position.x.toFixed(1)},${position.z.toFixed(1)}), Dist: ${distToPath.toFixed(1)}, Outside fairway: ${isOutsideFairway}, Inside rough: ${isInsideRough}`);
          }
          
          return isOutsideFairway && isInsideRough;
        }
      };
      
      console.log("Created standardRough hazard");
      roughHazards.push(roughHazard);
    }
    
    return roughHazards;
  }

  // Create outer rough areas beyond standard rough
  createOuterRough(holePath) {
    console.log("Creating explicit outer rough areas as an extension of the standard rough");
    
    // Create visually distinct material for outer rough
    const outerRoughMaterial = new THREE.MeshLambertMaterial({
      color: 0x0a3b0a, // Much darker green for outer rough
      side: THREE.DoubleSide
    });
    
    // Define outer rough width - wider than standard rough
    const outerRoughWidth = 30; // Width of the outer rough band
    const outerRoughSegments = [];
    const outerRoughHazards = [];
    
    // Create outer rough segments along the path
    for (let i = 0; i < holePath.length - 1; i++) {
      const start = holePath[i];
      const end = holePath[i + 1];
      
      // Calculate direction and perpendicular
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      
      // Define boundaries
      const fairwayHalfWidth = this.courseConfig.fairwayWidth / 2;
      const standardRoughWidth = this.courseConfig.roughWidth;
      const combinedInnerWidth = fairwayHalfWidth + standardRoughWidth;
      const outerRoughOuterBoundary = combinedInnerWidth + outerRoughWidth;
      
      // Inner vertices (standard rough boundary)
      const v1 = start.clone().add(perpendicular.clone().multiplyScalar(combinedInnerWidth));
      const v2 = start.clone().add(perpendicular.clone().multiplyScalar(-combinedInnerWidth));
      const v3 = end.clone().add(perpendicular.clone().multiplyScalar(-combinedInnerWidth));
      const v4 = end.clone().add(perpendicular.clone().multiplyScalar(combinedInnerWidth));
      
      // Outer vertices (outer rough boundary)
      const v5 = start.clone().add(perpendicular.clone().multiplyScalar(outerRoughOuterBoundary));
      const v6 = start.clone().add(perpendicular.clone().multiplyScalar(-outerRoughOuterBoundary));
      const v7 = end.clone().add(perpendicular.clone().multiplyScalar(-outerRoughOuterBoundary));
      const v8 = end.clone().add(perpendicular.clone().multiplyScalar(outerRoughOuterBoundary));
      
      // Apply height from the terrain
      v1.y = this.terrainManager.getHeightAt(v1.x, v1.z) + 0.03;
      v2.y = this.terrainManager.getHeightAt(v2.x, v2.z) + 0.03;
      v3.y = this.terrainManager.getHeightAt(v3.x, v3.z) + 0.03;
      v4.y = this.terrainManager.getHeightAt(v4.x, v4.z) + 0.03;
      v5.y = this.terrainManager.getHeightAt(v5.x, v5.z) + 0.03;
      v6.y = this.terrainManager.getHeightAt(v6.x, v6.z) + 0.03;
      v7.y = this.terrainManager.getHeightAt(v7.x, v7.z) + 0.03;
      v8.y = this.terrainManager.getHeightAt(v8.x, v8.z) + 0.03;
      
      // Create left outer rough segment (between v1-v5-v8-v4)
      const leftOuterRoughGeometry = new THREE.BufferGeometry();
      leftOuterRoughGeometry.setFromPoints([v1, v5, v8, v1, v8, v4]);
      leftOuterRoughGeometry.computeVertexNormals();
      const leftOuterRough = new THREE.Mesh(leftOuterRoughGeometry, outerRoughMaterial);
      
      // Create right outer rough segment (between v2-v6-v7-v3)
      const rightOuterRoughGeometry = new THREE.BufferGeometry();
      rightOuterRoughGeometry.setFromPoints([v2, v6, v7, v2, v7, v3]);
      rightOuterRoughGeometry.computeVertexNormals();
      const rightOuterRough = new THREE.Mesh(rightOuterRoughGeometry, outerRoughMaterial);
      
      this.scene.add(leftOuterRough);
      this.scene.add(rightOuterRough);
      outerRoughSegments.push(leftOuterRough, rightOuterRough);
      
      // Add outer rough hazard for ball physics with FIXED collision detection
      const outerRoughHazard = {
        type: 'outerRough',
        pathStart: start,
        pathEnd: end,
        standardRoughWidth: combinedInnerWidth,
        outerRoughWidth: outerRoughOuterBoundary,
        // IMPROVED COLLISION DETECTION LOGIC
        checkCollision: (position) => {
          // Calculate distance to path segment
          const distToPath = this.terrainManager.distanceToPath(position, start, end);
          
          // IMPROVED LOGIC:
          // 1. Check if we're outside the standard rough boundary (inner boundary of outer rough)
          const isOutsideStandardRough = distToPath > combinedInnerWidth;
          
          // 2. Check if we're inside the outer boundary of outer rough
          const isInsideOuterBound = distToPath < outerRoughOuterBoundary;
          
          // 3. Make sure we're not on the fairway (with a small buffer)
          const isOnFairway = distToPath < fairwayHalfWidth + 1;
          
          // Only add debugging for positions near the center for performance
          const isNearCenter = Math.abs(position.x) < 50 && Math.abs(position.z) < 50;
          
          if (isNearCenter && isOutsideStandardRough && isInsideOuterBound) {
            console.log(`%c[OUTER ROUGH DETAIL] Pos: (${position.x.toFixed(1)},${position.z.toFixed(1)}), Dist: ${distToPath.toFixed(1)}, isFairway: ${isOnFairway}`, 
                        "background: #330000; color: white");
          }
          
          // For positions to be in outer rough, they must be:
          // - Outside standard rough
          // - Inside outer boundary
          // - NOT on fairway
          return isOutsideStandardRough && isInsideOuterBound && !isOnFairway;
        }
      };
      
      outerRoughHazards.push(outerRoughHazard);
    }
    
    console.log("Created outer rough areas with improved collision detection");
    return outerRoughHazards;
  }

  // Create the green around the hole
  createGreen() {
    const greenGeometry = new THREE.CircleGeometry(this.courseConfig.greenRadius, 32);
    const greenMaterial = new THREE.MeshLambertMaterial({
      color: 0x2E8B57, // Darker green for putting green
      side: THREE.DoubleSide
    });
    
    const green = new THREE.Mesh(greenGeometry, greenMaterial);
    green.rotation.x = -Math.PI / 2;
    
    // Position on terrain with slight offset
    green.position.copy(this.courseConfig.holePosition.clone());
    green.position.y = this.terrainManager.getHeightAt(
      this.courseConfig.holePosition.x, 
      this.courseConfig.holePosition.z
    ) + 0.02;
    
    this.scene.add(green);
    return green;
  }
}