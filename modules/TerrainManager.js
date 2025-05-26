// Terrain management and heightmap generation
import * as THREE from 'three';

export class TerrainManager {
    constructor(courseConfig) {
      this.courseConfig = courseConfig;
      this.heightmapSize = 100;
      this.heightmap = new Array(this.heightmapSize).fill(0).map(() => new Array(this.heightmapSize).fill(0));
    }
  
    // Generate the heightmap for the terrain
    generateHeightmap() {
      // Simple noise generation - in a real game you'd use Perlin/Simplex noise
      for (let i = 0; i < this.heightmapSize; i++) {
        for (let j = 0; j < this.heightmapSize; j++) {
          // Add some randomness but keep it smooth by averaging
          this.heightmap[i][j] = (Math.random() * 2 - 1) * this.courseConfig.heightVariation * 0.5;
          
          // Ensure the tee and green areas are relatively flat
          const teeDistance = Math.sqrt(
            Math.pow(i - this.heightmapSize/2, 2) + 
            Math.pow(j - 0, 2)
          ) / this.heightmapSize;
          
          const greenDistance = Math.sqrt(
            Math.pow(i - (this.heightmapSize/2 + Math.sin(this.courseConfig.doglegAngle) * this.courseConfig.doglegPosition / 10), 2) + 
            Math.pow(j - (-this.courseConfig.fairwayLength / 10 + Math.cos(this.courseConfig.doglegAngle) * (this.courseConfig.fairwayLength - this.courseConfig.doglegPosition) / 10), 2)
          ) / this.heightmapSize;
          
          // Flatten areas near tee and green
          if (teeDistance < 0.05) {
            this.heightmap[i][j] *= teeDistance * 20; // Gradually increase height from the tee
          }
          
          if (greenDistance < 0.05) {
            this.heightmap[i][j] *= greenDistance * 20; // Gradually increase height from the green
          }
          
          // Add some smoothing by averaging with neighbors
          if (i > 0 && j > 0 && i < this.heightmapSize - 1 && j < this.heightmapSize - 1) {
            this.heightmap[i][j] = (
              this.heightmap[i][j] * 0.4 +
              this.heightmap[i-1][j] * 0.15 +
              this.heightmap[i+1][j] * 0.15 +
              this.heightmap[i][j-1] * 0.15 +
              this.heightmap[i][j+1] * 0.15
            );
          }
        }
      }
      
      // Create strategic terrain features
      this.addTerrainFeature(this.heightmapSize/2 - 10, -30, 15, 5); // Hill on the left before dogleg
      this.addTerrainFeature(this.heightmapSize/2 + 15, -100, 20, -3); // Valley on the right
      this.addTerrainFeature(this.heightmapSize/2 + 25, -200, 25, 4); // Hill after dogleg
    }
  
    // Add a terrain feature (hill or valley)
    addTerrainFeature(centerX, centerZ, radius, height) {
      for (let i = 0; i < this.heightmapSize; i++) {
        for (let j = 0; j < this.heightmapSize; j++) {
          // Convert heightmap coordinates to world coordinates
          const x = (i - this.heightmapSize/2) * 10;
          const z = j * 10 - 10;
          
          // Calculate distance to feature center
          const distance = Math.sqrt(
            Math.pow(x - centerX, 2) + 
            Math.pow(z - centerZ, 2)
          );
          
          // Apply height change based on distance (bell curve)
          if (distance < radius) {
            const factor = Math.cos((distance / radius) * Math.PI/2);
            this.heightmap[i][j] += height * factor;
          }
        }
      }
    }
  
    // Get height at a specific world position
    getHeightAt(x, z) {
      // Convert world coordinates to heightmap indices
      const i = Math.floor((x / 10) + this.heightmapSize/2);
      const j = Math.floor((z + 10) / 10);
      
      // Check if within bounds
      if (i >= 0 && i < this.heightmapSize && j >= 0 && j < this.heightmapSize) {
        return this.heightmap[i][j];
      }
      
      return 0; // Default height if out of bounds
    }
  
    // Apply heightmap to a geometry
    applyHeightmapToGeometry(geometry) {
      const positionAttribute = geometry.getAttribute('position');
      
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);
        
        // Sample height from the heightmap
        const y = this.getHeightAt(x, z);
        
        positionAttribute.setY(i, y);
      }
      
      // Necessary after modifying the attributes
      geometry.computeVertexNormals();
      
      return geometry;
    }
  
    // Calculate the distance from a point to a path segment
    distanceToPath(point, pathStart, pathEnd) {
      const pathDir = new THREE.Vector3().subVectors(pathEnd, pathStart).normalize();
      
      // Project point onto path segment line
      const pointVector = new THREE.Vector3().subVectors(point, pathStart);
      const projectionLength = pointVector.dot(pathDir);
      
      // Clamp projection to path segment
      const clampedProjection = Math.max(0, Math.min(projectionLength, pathEnd.distanceTo(pathStart)));
      
      // Find closest point on path
      const closestPoint = pathStart.clone().add(pathDir.clone().multiplyScalar(clampedProjection));
      
      // Return distance to closest point
      return closestPoint.distanceTo(point);
    }
  }