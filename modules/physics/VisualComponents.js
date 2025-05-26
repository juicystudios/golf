// VisualComponents.js - Handles visual elements like ball, aim indicators, etc.
import * as THREE from 'three';

export class VisualComponents {
  constructor(ballPhysics) {
    // Store reference to main class
    this.ballPhysics = ballPhysics;
    
    // Shortcuts to commonly used properties
    this.scene = ballPhysics.scene;
    this.gameState = ballPhysics.gameState;
    this.ballPosition = ballPhysics.ballPosition;
    this.ballRadius = ballPhysics.ballRadius;
    
    // References to visual objects
    this.ball = null;
    this.aimLine = null;
    this.aimArrow = null;
    this.trajectoryLine = null;
  }
  
  // Create the golf ball
  createBall() {
    try {
      const ballGeometry = new THREE.SphereGeometry(this.ballRadius, 32, 32);
      const ballMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        specular: 0x333333,
        shininess: 50
      });
      
      this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
      this.ball.castShadow = true;
      this.ball.receiveShadow = false;
      
      this.scene.add(this.ball);
      console.log("Ball created successfully");
      
      return this.ball;
    } catch (error) {
      console.error("Error creating ball:", error);
      throw error;
    }
  }
  
  // Create aim direction indicator
  createAimDirectionIndicator() {
    try {
      // Create a more visible and longer aim line
      const points = [];
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(0, 0, -20)); // Extended line
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        linewidth: 3 // Thicker line (note: some browsers limit line width)
      });
      
      this.aimLine = new THREE.Line(lineGeometry, lineMaterial);
      this.aimLine.frustumCulled = false;
      
      // Create larger arrow head
      const arrowGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
      const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      this.aimArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      this.aimArrow.rotation.x = Math.PI / 2;
      
      // Add to scene
      this.scene.add(this.aimLine);
      this.scene.add(this.aimArrow);
      console.log("Aim direction indicator created");
      
      return {
        aimLine: this.aimLine,
        aimArrow: this.aimArrow
      };
    } catch (error) {
      console.error("Error creating aim direction indicator:", error);
      throw error;
    }
  }
  
  // Create trajectory arc preview
  createTrajectoryArc() {
    try {
      // Use more points for a smoother trajectory arc
      const points = [];
      for (let i = 0; i < 150; i++) {
        points.push(new THREE.Vector3(0, 0, 0));
      }
      
      const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const trajectoryMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00aaff,
        transparent: true,
        opacity: 0.8, // Increased for better visibility
        linewidth: 2
      });
      
      this.trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
      this.trajectoryLine.frustumCulled = false;
      this.trajectoryLine.visible = true;
      
      this.scene.add(this.trajectoryLine);
      console.log("Trajectory arc created");
      
      return this.trajectoryLine;
    } catch (error) {
      console.error("Error creating trajectory arc:", error);
      throw error;
    }
  }
  
  // Update aim direction based on current aiming angle
  updateAimDirection() {
    // Skip if ball is in motion
    if (this.gameState.ballInMotion) return;
    
    try {
      // Calculate aim direction vector
      const angle = this.gameState.aimingAngle;
      const x = Math.sin(angle);
      const z = -Math.cos(angle);
      
      this.gameState.aimingDirection.set(x, 0, z).normalize();
      
      // Update aim line geometry
      const lineLength = 20; // Longer line
      const startPoint = this.ballPosition.clone();
      startPoint.y += 0.05; // Slightly above ground
      
      const endPoint = startPoint.clone().add(
        this.gameState.aimingDirection.clone().multiplyScalar(lineLength)
      );
      
      const lineGeometry = this.aimLine.geometry;
      const positions = lineGeometry.attributes.position.array;
      
      positions[0] = startPoint.x;
      positions[1] = startPoint.y;
      positions[2] = startPoint.z;
      
      positions[3] = endPoint.x;
      positions[4] = endPoint.y;
      positions[5] = endPoint.z;
      
      lineGeometry.attributes.position.needsUpdate = true;
      
      // Update arrow position and rotation
      this.aimArrow.position.copy(endPoint);
      this.aimArrow.rotation.y = angle;
      
      // Make aim indicators visible only in aiming mode
      const visible = this.gameState.swingState === 'aiming';
      this.aimLine.visible = visible;
      this.aimArrow.visible = visible;
      this.trajectoryLine.visible = visible;
      
      // Force trajectory update to match aim direction
      this.ballPhysics.updateTrajectoryArc();
    } catch (error) {
      console.error("Error updating aim direction:", error);
    }
  }
}