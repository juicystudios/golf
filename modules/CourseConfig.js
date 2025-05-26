// Course configuration settings
import * as THREE from 'three';

export class CourseConfig {
  constructor(config = {}) {
    // Use provided config or defaults
    this.groundSize = config.groundSize || 1200;
    this.fairwayWidth = config.fairwayWidth || 30;
    this.fairwayLength = config.fairwayLength || 450;
    this.roughWidth = config.roughWidth || 60;
    this.greenRadius = config.greenRadius || 15;
    this.holeDepth = config.holeDepth || 0.5;
    this.doglegPosition = config.doglegPosition || 250;
    this.doglegAngle = config.doglegAngle || Math.PI / 6;
    this.heightVariation = config.heightVariation || 10;
    this.treeDensity = config.treeDensity || 80;
    
    // Calculate the final hole position based on course layout
    this.holePosition = this.calculateHolePosition();
  }
  
    // Calculate the final hole position based on course layout
    calculateHolePosition() {
      const angle = this.doglegAngle;
      const remainingDistance = this.fairwayLength - this.doglegPosition;
      const x = Math.sin(angle) * remainingDistance;
      const z = -this.doglegPosition - Math.cos(angle) * remainingDistance;
      return new THREE.Vector3(x, 0, z);
    }
  
    // Generate the path for the hole
    generateHolePath() {
      const path = [];
      
      // First part - straight from tee to dogleg
      for (let i = 0; i <= this.doglegPosition; i += 10) {
        path.push(new THREE.Vector3(0, 0, -i));
      }
      
      // Second part - after the dogleg
      const doglegPoint = new THREE.Vector3(0, 0, -this.doglegPosition);
      const remainingDistance = this.fairwayLength - this.doglegPosition;
      
      for (let i = 10; i <= remainingDistance; i += 10) {
        // Apply the dogleg angle
        const angle = this.doglegAngle;
        const x = Math.sin(angle) * i;
        const z = -this.doglegPosition - Math.cos(angle) * i;
        path.push(new THREE.Vector3(x, 0, z));
      }
      
      return path;
    }
  
    // Check if a point is on the green
    isOnGreen(position) {
      const distanceToHole = Math.sqrt(
        Math.pow(position.x - this.holePosition.x, 2) + 
        Math.pow(position.z - this.holePosition.z, 2)
      );
      return distanceToHole < this.greenRadius;
    }
  }