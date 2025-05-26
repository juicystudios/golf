// PhysicsEngine.js - Core physics simulation logic
import * as THREE from 'three';

export class PhysicsEngine {
  constructor(ballPhysics) {
    // Store reference to main class
    this.ballPhysics = ballPhysics;
    
    // Shortcuts to commonly used properties
    this.ballPosition = ballPhysics.ballPosition;
    this.ballVelocity = ballPhysics.ballVelocity;
    this.gameState = ballPhysics.gameState;
    this.courseBuilder = ballPhysics.courseBuilder;
    this.terrainDetection = ballPhysics.terrainDetection;
    
    // Physics constants
    this.gravity = 9.81;
    this.airResistance = 0.004; // Slightly reduced to allow more distance
    this.groundFriction = 0.2;
    this.standardRoughFriction = 0.5; // Medium friction for light rough
    this.outerRoughFriction = 0.9; // High friction for deep rough
    this.sandFriction = 0.6;
    this.greenFriction = 0.01;
    this.fairwayFriction = 0.2;
    
    // Bounce parameters
    this.bounceEnergyRetention = 0.65;
    this.maxBounces = 4;
    this.bounceCount = 0;
    this.lastBouncePosition = null;
    
    // Rest threshold - when to stop ball simulation
    this.restThreshold = 0.5;
    
    // Putter-specific timing
    this.putterShotActive = false;
    this.putterShotDuration = 0;
    this.minPutterShotTime = 0.6;
    
    // Jitter detection
    this.slowRollStartTime = null;
    this.lastPositions = [];
    this.positionSamples = 5; // Number of previous positions to track
    this.jitterThreshold = 0.01; // Distance threshold for detecting jitter
    this.jitterCounter = 0;
    this.maxJitterCount = 3; // How many jitter detections before forcing stop
    
    // Debug settings
    this.debugPhysics = false;
  }
  
  // Main physics update called each frame
  updatePhysics(deltaTime) {
    // Skip if game is paused or ball is not in motion
    if (!this.ballPhysics.simulationActive) return;
    
    // Check the current ball lie at the start of physics update
    const ballLie = this.ballPhysics.terrainInteraction.checkBallLie();
    
    // Store previous position for camera updates
    this.ballPhysics.prevPosition = this.ballPhysics.ballPosition.clone();
    
    // Check if we're using the putter
    const isPutter = this.gameState.isPutter();
    
    // For putter shots, track the total shot duration
    if (this.putterShotActive) {
      this.putterShotDuration += deltaTime;
    }
    
    // Apply gravity
    if (isPutter) {
      this.ballVelocity.y -= this.gravity * deltaTime * 0.1; // Reduced gravity for putters
    } else {
      this.ballVelocity.y -= this.gravity * deltaTime;
    }
    
    // Apply air resistance
    if (isPutter) {
      this.ballVelocity.multiplyScalar(1 - this.airResistance * deltaTime * 0.1);
    } else {
      this.ballVelocity.multiplyScalar(1 - this.airResistance * deltaTime);
    }
    
    // Update position
    const movement = this.ballVelocity.clone().multiplyScalar(deltaTime);
    this.ballPosition.add(movement);
    
    // Check for water hazard collision
    this.checkWaterHazardCollision();
    
    // Check for tree collision
    this.checkTreeCollision();
    
    // Handle ground collision and bounce physics
    this.handleGroundCollision(ballLie, isPutter);
    
    // Check for final stop condition
    this.checkBallStopped(ballLie);
    
    // Final position adjustment to prevent floating
    this.preventFloatingBall();
    
    // Update ball mesh position
    this.ballPhysics.ball.position.copy(this.ballPosition);
    
    // Update rotation based on movement
    this.updateBallRotation(movement);
    
    // Emit event for camera updates if ball is still moving
    if (this.ballPhysics.simulationActive) {
      document.dispatchEvent(new CustomEvent('ballMoving', {
        detail: {
          position: this.ballPosition.clone(),
          prevPosition: this.ballPhysics.prevPosition,
          velocity: this.ballVelocity.clone()
        }
      }));
    }
    
    // Update distance display
    this.ballPhysics.updateDistanceToHole();
  }
  
  // Check for water hazard collision
  checkWaterHazardCollision() {
    for (const hazard of this.courseBuilder.getHazards()) {
      if (hazard.type === 'water' && hazard.checkCollision(this.ballPosition)) {
        console.log("%c[WATER HAZARD] Ball landed in water", "color: blue; font-weight: bold");
        this.ballPhysics.terrainInteraction.handleWaterHazard(hazard);
        return true;
      }
    }
    return false;
  }
  
  // Check for tree collision
  checkTreeCollision() {
    const treeCollision = this.ballPhysics.terrainInteraction.checkTreeCollision();
    if (treeCollision) {
      console.log("%c[TREE COLLISION] Ball hit a tree!", "color: green; font-weight: bold");
      
      // Get collision details
      const { tree, trunkPosition, normal } = treeCollision;
      
      // Move ball outside the tree trunk
      const collisionRadius = (tree.userData.radius || 0.7) + this.ballPhysics.ballRadius;
      const distance = new THREE.Vector2(
        this.ballPosition.x - trunkPosition.x,
        this.ballPosition.z - trunkPosition.z
      ).length();
      const penetrationDepth = collisionRadius - distance;
      
      if (penetrationDepth > 0) {
        // Create direction vector from trunk to ball (horizontal only)
        const directionFromTrunk = new THREE.Vector2(
          this.ballPosition.x - trunkPosition.x,
          this.ballPosition.z - trunkPosition.z
        ).normalize();
        
        // Move ball out of tree
        this.ballPosition.x += directionFromTrunk.x * penetrationDepth;
        this.ballPosition.z += directionFromTrunk.y * penetrationDepth;
      }
      
      // Reflect velocity based on collision normal
      const ballSpeed = this.ballVelocity.length();
      const velocityXZ = new THREE.Vector2(this.ballVelocity.x, this.ballVelocity.z);
      
      // Calculate reflection direction
      const dot = velocityXZ.dot(normal) * 2;
      velocityXZ.x -= normal.x * dot;
      velocityXZ.y -= normal.y * dot;
      
      // Set new velocity with energy loss (30% energy loss from tree hit)
      this.ballVelocity.x = velocityXZ.x * 0.7;
      this.ballVelocity.z = velocityXZ.y * 0.7;
      
      // Reduce vertical velocity 
      this.ballVelocity.y *= 0.7;
      
      // Add a random factor to make bounces more realistic
      const randomFactor = 0.2; // 20% randomness
      this.ballVelocity.x += (Math.random() - 0.5) * randomFactor * ballSpeed;
      this.ballVelocity.z += (Math.random() - 0.5) * randomFactor * ballSpeed;
      
      // Add bounce count to help ball come to rest after hitting trees
      this.bounceCount += 1;
      
      return true;
    }
    return false;
  }
  
  // Handle ground collision and bounces
  handleGroundCollision(ballLie, isPutter) {
    // Get terrain height at current position
    const terrainHeight = this.courseBuilder.getHeightAt(this.ballPosition.x, this.ballPosition.z);
    
    // Ground collision and bounce physics
    if (this.ballPosition.y <= terrainHeight + this.ballPhysics.ballRadius + 0.01) {
      // Set ball at proper height above ground
      this.ballPosition.y = terrainHeight + this.ballPhysics.ballRadius;
      
      // Check for hole collision when on green
      console.log("--- CHECKING HOLE COLLISION ---");
      console.log("Ball is on green:", ballLie.onGreen);
      if (ballLie.onGreen) {
        const holePosition = this.courseBuilder.courseConfig.holePosition;
        console.log("Hole position:", holePosition);
        console.log("Ball position:", this.ballPosition);
        const distanceToHole = Math.sqrt(
          Math.pow(this.ballPosition.x - holePosition.x, 2) +
          Math.pow(this.ballPosition.z - holePosition.z, 2)
        );
        console.log("Distance to hole:", distanceToHole);
        console.log("Is close enough to hole:", distanceToHole < 1.0);
        
        // Ball falls in hole
        if (distanceToHole < 1.5) {
          console.log("BALL IN HOLE DETECTED! Distance:", distanceToHole);
          this.ballPhysics.ballInHole = true;
          this.ballPhysics.simulationActive = false;
          this.gameState.ballInMotion = false;
          
          // Position ball at hole and sink it
          this.ballPosition.x = holePosition.x;
          this.ballPosition.z = holePosition.z;
          this.ballPosition.y = terrainHeight - 0.3; // Sink the ball
          this.ballPhysics.ball.position.copy(this.ballPosition);
          
          // Complete hole after animation delay
          setTimeout(() => {
            this.gameState.completeHole();
          }, 800);
          
          return;
        }
      }
      
      // Get the vertical component of velocity
      const verticalVelocity = this.ballVelocity.y;
      
      // BOUNCE: If moving downward with significant velocity
      if (verticalVelocity < -0.5) {
        this.handleBounce(ballLie, isPutter, verticalVelocity);
      }
      // ROLL: If moving horizontally or with minimal vertical component
      else {
        this.handleRoll(ballLie, terrainHeight);
      }
    }
  }
  
  // Handle ball bouncing off ground
  handleBounce(ballLie, isPutter, verticalVelocity) {
    console.log("%c*** BOUNCE PHYSICS APPLIED ***", "color: red; font-weight: bold", verticalVelocity);
    
    // Apply different bounce physics based on terrain type
    let progressiveLoss;
    
    if (ballLie.inSand) {
      // Much higher energy loss in sand
      progressiveLoss = this.bounceEnergyRetention * 0.1 * Math.pow(0.3, this.bounceCount);
      // Add extra bounce counts to stop faster in sand
      this.bounceCount += 2;
    } 
    else if (ballLie.inOuterRough) {
      // High energy loss in outer rough
      progressiveLoss = this.bounceEnergyRetention * 0.2 * Math.pow(0.3, this.bounceCount);
      // Add extra bounce counts to stop faster in outer rough
      this.bounceCount += 2;
    } 
    else if (ballLie.inRough) {
      // Medium energy loss in standard rough
      progressiveLoss = this.bounceEnergyRetention * 0.3 * Math.pow(0.5, this.bounceCount);
      // Add some bounce counts
      this.bounceCount += 1;
    } 
    else {
      // Bounces on fairway or green - use higher energy retention
      progressiveLoss = this.bounceEnergyRetention * Math.pow(0.7, this.bounceCount);
      
      // Special case for first two bounces on fairway
      if (this.bounceCount <= 1 && !isPutter) {
        // Reduce energy to early bounces to get less bounce action
        progressiveLoss *= 0.9;
        console.log("%c[FAIRWAY BOUNCE] Reducing bounce energy for bounce #" + this.bounceCount, "color: purple; font-weight: bold");
      }
    }
    
    // Set a maximum bounce height by capping vertical velocity
    const maxBounceVelocity = ballLie.onFairway ? 6.0 : 3.0; // Higher cap for fairway
    const newVelocity = -verticalVelocity * progressiveLoss;
    this.ballVelocity.y = Math.min(newVelocity, maxBounceVelocity);
    
    // Record bounce position and increment counter
    this.lastBouncePosition = this.ballPosition.clone();
    this.bounceCount++;
    
    // Apply appropriate friction to horizontal movement based on surface
    let frictionFactor;
    if (ballLie.inSand) {
      frictionFactor = 0.8;
    } 
    else if (ballLie.inOuterRough) {
      frictionFactor = 0.7;
    } 
    else if (ballLie.inRough) {
      frictionFactor = 0.5;
    } 
    else {
      // For fairway - use lower friction for early bounces
      if (this.bounceCount <= 2 && !isPutter) {
        frictionFactor = 0.25;
        console.log("%c[FAIRWAY BOUNCE] Using medium friction for bounce #" + this.bounceCount, "color: purple; font-weight: bold");
      } else {
        frictionFactor = isPutter ? 0.5 : 0.3;
      }
    }
    
    // Apply the friction factor to slow horizontal movement
    this.ballVelocity.x *= (1 - frictionFactor);
    this.ballVelocity.z *= (1 - frictionFactor);
    
    // Special case: for fairway hits with downward velocity, convert less energy to horizontal
    if (!ballLie.inSand && !ballLie.inRough && !ballLie.inOuterRough && !ballLie.onGreen && !isPutter) {
      // Convert more vertical energy to horizontal for better bounces and rolls
      const horizontalBoost = Math.abs(verticalVelocity) * 0.05;
      const currentDirection = new THREE.Vector2(this.ballVelocity.x, this.ballVelocity.z).normalize();
      
      // Only boost if we have a valid direction
      if (!isNaN(currentDirection.x) && !isNaN(currentDirection.y)) {
        this.ballVelocity.x += currentDirection.x * horizontalBoost;
        this.ballVelocity.z += currentDirection.y * horizontalBoost;
        console.log("%c[FAIRWAY BOUNCE] Converting vertical to horizontal energy", "color: purple; font-weight: bold");
      }
    }
    
    // Force ball to stop after maxBounces
    if (this.bounceCount >= this.maxBounces) {
      // Only apply strong slowdown on non-fairway terrain
      if (!ballLie.onFairway) {
        console.log("%c[BOUNCE LIMIT] Maximum number of bounces reached on non-fairway, slowing ball", "color: red; font-weight: bold");
        // Drastically reduce velocity to make ball stop
        this.ballVelocity.multiplyScalar(0.2);
      } else {
        // On fairway, just apply a gentle slowdown
        console.log("%c[BOUNCE LIMIT] Maximum number of bounces reached on fairway, slight slowdown", "color: orange; font-weight: bold");
        this.ballVelocity.multiplyScalar(0.9);
      }
    }
  }
  
  // Handle ball rolling on ground
  handleRoll(ballLie, terrainHeight) {
    // Set vertical velocity to zero (ball is rolling on ground)
    this.ballVelocity.y = 0;
    
    // Apply terrain slope effects for rolling
    const sampleDistance = 0.5;
    const heightLeft = this.courseBuilder.getHeightAt(this.ballPosition.x - sampleDistance, this.ballPosition.z);
    const heightRight = this.courseBuilder.getHeightAt(this.ballPosition.x + sampleDistance, this.ballPosition.z);
    const heightForward = this.courseBuilder.getHeightAt(this.ballPosition.x, this.ballPosition.z + sampleDistance);
    const heightBackward = this.courseBuilder.getHeightAt(this.ballPosition.x, this.ballPosition.z - sampleDistance);
    
    const slopeX = heightRight - heightLeft;
    const slopeZ = heightForward - heightBackward;
    
    // Apply slope effect (balls roll downhill)
    this.ballVelocity.x += slopeX * 0.1;
    this.ballVelocity.z += slopeZ * 0.1;
    
    // Apply rolling friction based on terrain type
    let frictionCoefficient;
    
    if (ballLie.onGreen) {
      // Very low friction for green
      frictionCoefficient = this.greenFriction;
      console.log("%c[ROLLING ON GREEN] Using green friction:", "color: green; font-weight: bold", this.greenFriction);
    }
    else if (ballLie.inSand) {
      frictionCoefficient = this.sandFriction;
      // Apply additional drag in sand
      this.ballVelocity.x *= 0.7; // 30% reduction
      this.ballVelocity.z *= 0.7; // 30% reduction
      console.log("%c[ROLLING IN SAND] Using sand friction:", "color: orange; font-weight: bold", this.sandFriction);
    }
    else if (ballLie.inOuterRough) {
      frictionCoefficient = this.outerRoughFriction;
      // Apply massive drag to horizontal components in outer rough
      this.ballVelocity.x *= 0.3; // 70% reduction
      this.ballVelocity.z *= 0.3; // 70% reduction
      console.log("%c[ROLLING IN OUTER ROUGH] Using high friction:", "color: red; font-weight: bold", this.outerRoughFriction);
    }
    else if (ballLie.inRough) {
      frictionCoefficient = this.standardRoughFriction;
      // Apply additional drag in standard rough
      this.ballVelocity.x *= 0.8; // 20% reduction
      this.ballVelocity.z *= 0.8; // 20% reduction
      console.log("%c[ROLLING IN STANDARD ROUGH] Using medium friction:", "color: darkgreen; font-weight: bold", this.standardRoughFriction);
    }
    else {
      // For fairway rolling, use defined fairway friction with progressive increase
      // Get the horizontal speed to adjust friction as ball slows
      const horizontalSpeed = Math.sqrt(
        this.ballVelocity.x * this.ballVelocity.x + 
        this.ballVelocity.z * this.ballVelocity.z
      );
      
      // Base fairway friction
      frictionCoefficient = this.fairwayFriction;
      
      // Progressive increase in friction as ball slows down
      // This simulates the ball losing energy and helps it stop
      if (horizontalSpeed < 10) {
        // Add more friction as speed decreases
        const speedFactor = 1.0 - (horizontalSpeed / 10);
        frictionCoefficient = this.fairwayFriction * (1.0 + speedFactor * 7.0);
        
        console.log("%c[PROGRESSIVE ROLLING] Speed: " + horizontalSpeed.toFixed(2) + ", Increased friction to: " + frictionCoefficient.toFixed(3), "color: blue; font-weight: bold");
      } else {
        console.log("%c[ROLLING ON FAIRWAY] Using fairway friction:", "color: blue; font-weight: bold", frictionCoefficient);
      }
    }
    
    // Apply friction to slow the ball
    const frictionFactor = 1 - frictionCoefficient * 3.0;
    this.ballVelocity.x *= frictionFactor;
    this.ballVelocity.z *= frictionFactor;
    
    // Additional direct speed reduction - helps the ball stop more naturally
    const slowdownFactor = 0.995; // Slight constant slowdown
    this.ballVelocity.x *= slowdownFactor;
    this.ballVelocity.z *= slowdownFactor;
  }
  
// Check if ball has stopped moving and handle accordingly
checkBallStopped(ballLie) {
  const terrainHeight = this.courseBuilder.getHeightAt(this.ballPosition.x, this.ballPosition.z);
  const isBallRestingOnGround = this.ballPosition.y <= terrainHeight + this.ballPhysics.ballRadius + 0.01;
  const ballSpeed = this.ballVelocity.length();
  
  // ANTI-JITTER: Track previous positions to detect oscillation
  if (isBallRestingOnGround && ballSpeed < this.restThreshold * 8) {
    // Store current position
    this.lastPositions.push({
      x: this.ballPosition.x, 
      z: this.ballPosition.z
    });
    
    // Keep only the last N positions
    if (this.lastPositions.length > this.positionSamples) {
      this.lastPositions.shift();
    }
    
    // If we have enough samples, check for jittering
    if (this.lastPositions.length === this.positionSamples) {
      // Look for oscillation pattern (back and forth movement)
      let isJittering = this.detectJitter();
      
      if (isJittering) {
        this.jitterCounter++;
        console.log(`%c[JITTER DETECTED] Counter: ${this.jitterCounter}/${this.maxJitterCount}`, "color: magenta; font-weight: bold");
        
        if (this.jitterCounter >= this.maxJitterCount) {
          console.log("%c[ANTI-JITTER] Jitter threshold exceeded, forcing ball to stop", "color: red; font-weight: bold");
          this.forceStopBall();
          return;
        }
      } else {
        // Reset jitter counter if no jitter detected
        this.jitterCounter = Math.max(0, this.jitterCounter - 1);
      }
    }
  }
  
  // Track how long the ball has been moving slowly
  if (!this.slowRollStartTime && ballSpeed < this.restThreshold * 4 && isBallRestingOnGround) {
    this.slowRollStartTime = performance.now();
    console.log("%c[SLOW ROLL] Started tracking slow roll time", "color: orange; font-weight: bold");
  }
  
  // Force stop after 1.5 seconds of slow rolling on fairway (reduced from 2 seconds)
  const isSlowRolling = this.slowRollStartTime && (performance.now() - this.slowRollStartTime > 1500);
  if (isSlowRolling && ballLie.onFairway && isBallRestingOnGround) {
    console.log("%c[FORCE STOP] Ball has been rolling slowly for too long, forcing stop", "color: red; font-weight: bold");
    this.forceStopBall();
    return;
  }
  
  // Set a lower threshold specifically for fairway to ensure ball actually stops
  // The fairway-specific threshold is higher to catch those near-zero velocities
  const effectiveThreshold = ballLie.onFairway ? this.restThreshold * 1.5 : this.restThreshold;
  
  // More aggressive early stopping for very slow rolling on fairway
  if (ballSpeed < effectiveThreshold * 4 && isBallRestingOnGround) {
    // Apply much stronger deceleration for slow rolls
    const decelerationFactor = ballLie.onFairway ? 0.3 : 0.5; // More aggressive on fairway
    this.ballVelocity.x *= decelerationFactor;
    this.ballVelocity.z *= decelerationFactor;
    console.log("%c[SLOW ROLL] Applying strong deceleration", "color: orange; font-weight: bold");
  }
  
  // Check for final stop condition - use the effective threshold
  if (ballSpeed < effectiveThreshold && isBallRestingOnGround) {
    // For putter shots, enforce minimum duration
    if (this.putterShotActive && this.putterShotDuration < this.minPutterShotTime) {
      // Keep the ball moving very slowly
      this.ballVelocity.x *= 0.95;
      this.ballVelocity.z *= 0.95;
      return; // Skip the rest of the function to avoid stopping the ball
    } 
    
    // Ball is now at rest - FORCE STOP EVERYTHING
    console.log("%c[BALL STOPPED] Ball speed below threshold, stopping simulation", "color: green; font-weight: bold");
    
    // Force velocity to absolute zero
    this.ballVelocity.set(0, 0, 0);
    
    // Ensure ball is at correct height above terrain
    this.ballPosition.y = terrainHeight + this.ballPhysics.ballRadius;
    
    // Update ball mesh position one final time
    this.ballPhysics.ball.position.copy(this.ballPosition);
    
    // IMPORTANT: Set all simulation flags to inactive immediately
    this.ballPhysics.simulationActive = false;
    this.gameState.ballInMotion = false;
    this.putterShotActive = false;
    this.slowRollStartTime = null; // Reset slow roll timer
    this.lastPositions = []; // Clear position history
    this.jitterCounter = 0; // Reset jitter counter
    
    // Update gameState ballPosition
    this.gameState.ballPosition = this.ballPosition.clone();
    
    console.log("%c[BALL STOPPED] Final position:", "background: black; color: white", this.ballPosition.clone());
    
    // Set up for next shot after a short delay
    setTimeout(() => {
      console.log("%c[SETUP NEXT SHOT] Setting up next shot now", "color: blue; font-weight: bold");
      this.ballPhysics.setupNextShot();
    }, this.gameState.isPutter() ? 800 : 200);
  }
}

// New helper method to detect jittering motion
detectJitter() {
  if (this.lastPositions.length < 3) return false;
  
  // Calculate the total distance the ball has traveled in this sample window
  let totalDistance = 0;
  for (let i = 1; i < this.lastPositions.length; i++) {
    const prev = this.lastPositions[i-1];
    const curr = this.lastPositions[i];
    const dx = curr.x - prev.x;
    const dz = curr.z - prev.z;
    totalDistance += Math.sqrt(dx*dx + dz*dz);
  }
  
  // Calculate the direct distance between start and end positions
  const start = this.lastPositions[0];
  const end = this.lastPositions[this.lastPositions.length - 1];
  const directDx = end.x - start.x;
  const directDz = end.z - start.z;
  const directDistance = Math.sqrt(directDx*directDx + directDz*directDz);
  
  // If the ball is moving back and forth, the total distance will be much larger
  // than the direct distance between start and end positions
  const ratio = directDistance > 0.001 ? totalDistance / directDistance : 999;
  
  // Check for direction changes
  let directionChanges = 0;
  let prevDx = 0;
  let prevDz = 0;
  
  for (let i = 1; i < this.lastPositions.length; i++) {
    const prev = this.lastPositions[i-1];
    const curr = this.lastPositions[i];
    const dx = curr.x - prev.x;
    const dz = curr.z - prev.z;
    
    // Count significant direction changes (indicates oscillation)
    if (i > 1 && ((Math.sign(dx) !== Math.sign(prevDx) && Math.abs(dx) > 0.001) || 
                 (Math.sign(dz) !== Math.sign(prevDz) && Math.abs(dz) > 0.001))) {
      directionChanges++;
    }
    
    prevDx = dx;
    prevDz = dz;
  }
  
  // Debug output
  console.log(`Jitter analysis: ratio=${ratio.toFixed(2)}, dirChanges=${directionChanges}, totalDist=${totalDistance.toFixed(4)}, directDist=${directDistance.toFixed(4)}`);
  
  // Detect jitter: either ratio is very high (path much longer than direct distance)
  // or we have multiple direction changes with minimal overall movement
  return (ratio > 3 && totalDistance > 0.01) || 
         (directionChanges >= 2 && directDistance < 0.05);
}
  
  
  // Prevent ball from floating slightly above or below ground
  preventFloatingBall() {
    if (!this.ballPhysics.simulationActive && this.ballVelocity.length() < 0.1) {
      // If ball is at rest, ensure it's exactly at the correct height
      const finalTerrainHeight = this.courseBuilder.getHeightAt(this.ballPosition.x, this.ballPosition.z);
      
      // If more than a tiny bit off, adjust it
      if (Math.abs(this.ballPosition.y - (finalTerrainHeight + this.ballPhysics.ballRadius)) > 0.01) {
        // Snap to correct height
        this.ballPosition.y = finalTerrainHeight + this.ballPhysics.ballRadius;
        this.ballPhysics.ball.position.y = this.ballPosition.y;
        console.log("Corrected ball floating, adjusted to proper height");
      }
    }
  }
  
  // Update ball rotation based on movement
  updateBallRotation(movement) {
    const ballSpeed = this.ballVelocity.length();
    
    // Only calculate ball roll rotation if significant movement
    if (ballSpeed > 0.1) {
      // Create rotation axis perpendicular to velocity
      const axis = new THREE.Vector3(this.ballVelocity.z, 0, -this.ballVelocity.x).normalize();
      
      // Calculate rotation amount based on distance traveled
      const rotationSpeed = movement.length() / this.ballPhysics.ballRadius;
      
      // Apply rotation to the ball mesh
      if (axis.length() > 0 && !isNaN(rotationSpeed)) {
        this.ballPhysics.ball.rotateOnAxis(axis, rotationSpeed);
      }
    }
  }
  
  // Helper method for physics debugging
  logPhysicsDebug(message, data) {
    if (this.debugPhysics) {
      console.log(`%c[PHYSICS DEBUG] ${message}`, 'background: #222; color: #bada55', data || '');
    }
  }
  forceStopBall() {
    console.log("%c[FORCE STOP] Emergency force stop triggered", "background: red; color: white");
    
    // Force velocity to absolute zero
    this.ballVelocity.set(0, 0, 0);
    
    // Get current terrain height
    const terrainHeight = this.courseBuilder.getHeightAt(this.ballPosition.x, this.ballPosition.z);
    
    // Ensure ball is at correct height above terrain
    this.ballPosition.y = terrainHeight + this.ballPhysics.ballRadius;
    
    // Update ball mesh position
    this.ballPhysics.ball.position.copy(this.ballPosition);
    
    // IMPORTANT: Set all simulation flags to inactive immediately
    this.ballPhysics.simulationActive = false;
    this.gameState.ballInMotion = false;
    this.putterShotActive = false;
    
    // Update gameState ballPosition
    this.gameState.ballPosition = this.ballPosition.clone();
    
    // Set up for next shot
    setTimeout(() => {
      console.log("%c[EMERGENCY RECOVERY] Setting up next shot", "color: blue; font-weight: bold");
      this.ballPhysics.setupNextShot();
    }, 200);
  }
}