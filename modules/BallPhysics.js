// Refactored BallPhysics.js - Main coordinator class
import * as THREE from 'three';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { TerrainInteraction } from './physics/TerrainInteraction.js';
import { ShotController } from './physics/ShotController.js';
import { VisualComponents } from './physics/VisualComponents.js';
import { UIInteractions } from './physics/UIInteractions.js';

export class BallPhysics {
  constructor(scene, gameState, courseBuilder) {
    this.scene = scene;
    this.gameState = gameState;
    this.courseBuilder = courseBuilder;
    this.terrainDetection = courseBuilder.terrainDetection;
    
    // Ball properties
    this.ballRadius = 0.3;
    this.ballPosition = new THREE.Vector3(0, 0, 0);
    this.ballVelocity = new THREE.Vector3(0, 0, 0);
    this.ballInHole = false;
    
    // Simulation properties
    this.simulationActive = false;
    this.prevPosition = new THREE.Vector3();
    
    // Initialize helper modules
    this.physics = new PhysicsEngine(this);
    this.terrainInteraction = new TerrainInteraction(this);
    this.shotController = new ShotController(this);
    this.visuals = new VisualComponents(this);
    this.ui = new UIInteractions(this);
    
    // Create visual components
    this.ball = this.visuals.createBall();
    const aimComponents = this.visuals.createAimDirectionIndicator();
    this.aimLine = aimComponents.aimLine;
    this.aimArrow = aimComponents.aimArrow;
    this.trajectoryLine = this.visuals.createTrajectoryArc();
    
    // Set up clock for animation
    this.clock = new THREE.Clock();
    
    // Bind animation method
    this.animate = this.animate.bind(this);
    
    // Add animation to render loop
    this.startAnimation();
  
    // Make this instance globally available for debugging and reset
    window.ballPhysics = this;
  }
  
  // ========================================
  // Public API methods - maintained for compatibility
  // ========================================
  
  // Place ball on tee
  placeBallOnTee() {
    // Set initial ball position
    const teeHeight = this.courseBuilder.getHeightAt(0, 0);
    this.ballPosition.set(0, teeHeight + 0.2 + this.ballRadius, 0);
    this.ball.position.copy(this.ballPosition);
    this.prevPosition = this.ballPosition.clone();
    
    // Reset ball state
    this.ballVelocity.set(0, 0, 0);
    this.simulationActive = false;
    this.ballInHole = false;
    
    // Reset game state
    this.gameState.swingState = 'aiming';
    this.gameState.ballInMotion = false;
    
    // Force driver selection at tee
    this.gameState.selectedClub = 'driver';
    document.dispatchEvent(new CustomEvent('clubChanged', { 
      detail: { club: 'driver' } 
    }));
    
    // Update ball lie - override to ensure "fairway" lie for tee shots
    const ballLie = this.terrainInteraction.checkBallLie();
    // Force fairway lie for tee shots regardless of detected lie
    ballLie.onFairway = true;
    ballLie.inRough = false;
    ballLie.inSand = false;
    ballLie.onGreen = false;
    this.gameState.currentBallLie = ballLie;
    
    // Dispatch custom event to update UI with proper lie
    document.dispatchEvent(new CustomEvent('ballLieChanged', {
      detail: { lie: ballLie }
    }));
    
    // Update aiming indicators
    this.updateAimDirection();
    this.updateTrajectoryArc();
    
    // Update distance display
    this.updateDistanceToHole();
  }
  
  // Set ball position after a penalty
  placeBallAfterPenalty(position) {
    this.ballPosition.copy(position);
    // Add small lift to ensure ball isn't in ground
    this.ballPosition.y = this.courseBuilder.getHeightAt(position.x, position.z) + this.ballRadius + 0.05;
    this.ball.position.copy(this.ballPosition);
    this.prevPosition = this.ballPosition.clone();
    
    // Reset ball state
    this.ballVelocity.set(0, 0, 0);
    this.simulationActive = false;
    
    // Reset game state
    this.gameState.swingState = 'aiming';
    this.gameState.ballInMotion = false;
    
    // Update ball lie
    const ballLie = this.terrainInteraction.checkBallLie();
    
    // Ensure it's on fairway when placed after penalty
    ballLie.onFairway = true;
    ballLie.inRough = false;
    ballLie.inSand = false;
    this.gameState.currentBallLie = ballLie;
    
    // Dispatch event with updated lie
    document.dispatchEvent(new CustomEvent('ballLieChanged', {
      detail: { lie: ballLie }
    }));
    
    // Show aim indicators for the next shot
    this.showAimingElements();
    
    // Update aiming indicators
    this.updateAimDirection();
    this.updateTrajectoryArc();
    
    // Update distance display
    this.updateDistanceToHole();
    
    // Explicitly reposition camera
    this.forceCameraReset();
  }
  
  // Update aim direction based on current aiming angle
  updateAimDirection() {
    this.visuals.updateAimDirection();
  }
  
  // Auto-aim toward the hole
  aimTowardHole() {
    if (this.gameState.ballInMotion) return;
    
    // Get direction from ball to hole
    const holePosition = this.courseBuilder.courseConfig.holePosition;
    const direction = new THREE.Vector3()
      .subVectors(holePosition, this.ballPosition)
      .normalize();
    
    // Calculate angle from direction
    const angle = Math.atan2(direction.x, -direction.z);
    
    // Update game state
    this.gameState.aimingAngle = angle;
    this.gameState.aimingDirection.copy(direction);
    
    // Update aim visuals
    this.updateAimDirection();
    
    // Force trajectory update to match new aim
    this.updateTrajectoryArc();
  }
  
  // Update the trajectory arc preview
  updateTrajectoryArc() {
    this.shotController.updateTrajectoryArc();
  }
  
  // Execute a shot with the given power
  executeShot(power) {
    this.shotController.executeShot(power);
  }
  
  // Check if ball is on tee
  isOnTee() {
    return this.terrainInteraction.isOnTee();
  }
  
  // Check the lie of the ball
  checkBallLie() {
    return this.terrainInteraction.checkBallLie();
  }
  
  // Hide aiming elements during ball flight
  hideAimingElements() {
    if (this.aimLine) this.aimLine.visible = false;
    if (this.aimArrow) this.aimArrow.visible = false;
    if (this.trajectoryLine) this.trajectoryLine.visible = false;
  }
  
// Show aiming elements for the next shot
showAimingElements() {
  console.log("showAimingElements called, elements:", {
    aimLine: this.aimLine,
    aimArrow: this.aimArrow,
    trajectoryLine: this.trajectoryLine
  });

  // Add null checks before setting properties
  if (this.aimLine) this.aimLine.visible = true;
  if (this.aimArrow) this.aimArrow.visible = true;
  if (this.trajectoryLine) this.trajectoryLine.visible = true;
  
  // Update aiming indicators
  this.updateAimDirection();
}
  
  // Physics animation update
  animate() {
    if (this.simulationActive) {
      try {
        const deltaTime = Math.min(this.clock.getDelta(), 0.05); // Cap to 20fps minimum
        this.physics.updatePhysics(deltaTime);
      } catch (error) {
        console.error("Error in animation loop:", error);
        this.simulationActive = false; // Stop simulation on error
        this.setupNextShot(); // Attempt to recover by setting up next shot
      }
    }
    
    requestAnimationFrame(this.animate);
  }
  
  // Start animation loop
  startAnimation() {
    this.animate();
    console.log("Ball physics animation started");
  }
  
  // Update distance to hole display
  updateDistanceToHole() {
    this.ui.updateDistanceToHole();
  }
  
  // Setup for next shot after ball stops
  setupNextShot() {
    this.shotController.setupNextShot();
  }
  
  // Force camera to reset to behind-ball position
  forceCameraReset() {
    this.ui.forceCameraReset();
  }
}