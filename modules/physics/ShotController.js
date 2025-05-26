// ShotController.js - Handles shot execution and trajectory prediction
import * as THREE from 'three';

export class ShotController {
  constructor(ballPhysics) {
    // Store reference to main class
    this.ballPhysics = ballPhysics;
    
    // Shortcuts to commonly used properties
    this.ballPosition = ballPhysics.ballPosition;
    this.ballVelocity = ballPhysics.ballVelocity;
    this.gameState = ballPhysics.gameState;
    this.courseBuilder = ballPhysics.courseBuilder;
    this.physics = ballPhysics.physics;
    
    // Multiplier to correct distances (1 unit = 1 yard)
    this.distanceMultiplier = 8.4;
    
    // Putter-specific multiplier
    this.putterPowerMultiplier = 48.0;
  }
  
  // Execute a shot with the given power
  executeShot(power) {
    if (this.ballPhysics.simulationActive) return;
    
    try {
      console.log("%c[EXECUTING SHOT] Power:", "background: purple; color: white", power, "Club:", this.gameState.selectedClub);
      
      // Store previous position for camera updates
      this.ballPhysics.prevPosition = this.ballPosition.clone();
      
      // Calculate shot velocity based on club, power, and direction
      const direction = this.gameState.aimingDirection.clone();
      const clubDistance = this.gameState.getClubDistance(this.gameState.selectedClub);
      const isPutter = this.gameState.isPutter();
      
      // Apply power factor to velocity (0.2 to 1.0 range)
      const powerFactor = 0.2 + power * 0.8;
      
      this.physics.logPhysicsDebug('Shot parameters', {
        club: this.gameState.selectedClub,
        isPutter: isPutter,
        power: power,
        powerFactor: powerFactor,
        clubDistance: clubDistance,
        direction: direction.clone()
      });
      
      if (isPutter) {
        this.executePutterShot(direction, clubDistance, powerFactor);
      } else {
        this.executeNormalShot(direction, clubDistance, powerFactor);
      }
      
      console.log("%c[INITIAL VELOCITY]", "background: blue; color: white", this.ballVelocity.clone());
      
      // Start simulation
      this.ballPhysics.simulationActive = true;
      this.gameState.ballInMotion = true;
      this.gameState.swingState = 'aiming'; // Reset for next shot
      this.physics.bounceCount = 0;
      this.physics.lastBouncePosition = null;
      
      // Hide aim indicators during shot
      this.ballPhysics.hideAimingElements();
      
      // Emit event for the ball starting to move
      document.dispatchEvent(new CustomEvent('ballMoving', {
        detail: {
          position: this.ballPosition.clone(),
          prevPosition: this.ballPhysics.prevPosition,
          velocity: this.ballVelocity.clone()
        }
      }));
    } catch (error) {
      console.error("Error executing shot:", error);
    }
  }
  
  // Execute a putter shot
  executePutterShot(direction, clubDistance, powerFactor) {
    // Calculate putter speed with special multiplier
    const putterSpeed = clubDistance * 0.1 * this.putterPowerMultiplier * powerFactor;
    console.log("%c[PUTTING] Speed:", "background: green; color: white", putterSpeed);
    
    // Set primarily horizontal velocity for putters with minimal upward component
    this.ballVelocity.set(
      direction.x * putterSpeed,
      0.05, // Very minimal upward component
      direction.z * putterSpeed
    );
    
    // Mark as a putter shot for special timing
    this.physics.putterShotActive = true;
    this.physics.putterShotDuration = 0;
    
    this.physics.logPhysicsDebug('Putter velocity set', {
      putterSpeed: putterSpeed,
      putterMultiplier: this.putterPowerMultiplier,
      initialVelocity: this.ballVelocity.clone()
    });
  }
  
  // Execute a normal (non-putter) shot
  executeNormalShot(direction, clubDistance, powerFactor) {
    // Different clubs have different launch angles and characteristics
    let launchAngle;
    let speedFactor;
    
    switch (this.gameState.selectedClub) {
      case 'driver':
        launchAngle = Math.PI / 10; // ~18° - flatter for driver
        speedFactor = 1.0;
        break;
      case 'wood3':
        launchAngle = Math.PI / 9; // ~20°
        speedFactor = 0.95;
        break;
      case 'hybrid':
        launchAngle = Math.PI / 8.5; // ~21°
        speedFactor = 0.92;
        break;
      case 'iron2':
        launchAngle = Math.PI / 8; // ~22.5°
        speedFactor = 0.9;
        break;
      case 'iron3':
        launchAngle = Math.PI / 8; // ~22.5°
        speedFactor = 0.88;
        break;
      case 'iron4':
        launchAngle = Math.PI / 7.5; // ~24°
        speedFactor = 0.87;
        break;
      case 'iron5':
        launchAngle = Math.PI / 7.5; // ~24°
        speedFactor = 0.85;
        break;
      case 'iron6':
        launchAngle = Math.PI / 7; // ~25.7°
        speedFactor = 0.84;
        break;
      case 'iron7':
        launchAngle = Math.PI / 7; // ~25.7°
        speedFactor = 0.83;
        break;
      case 'iron8':
        launchAngle = Math.PI / 6.5; // ~27.7°
        speedFactor = 0.82;
        break;
      case 'iron9':
        launchAngle = Math.PI / 6; // ~30°
        speedFactor = 0.81;
        break;
      case 'pitchingWedge':
        launchAngle = Math.PI / 5.5; // ~32.7°
        speedFactor = 0.8;
        break;
      case 'sandWedge':
        launchAngle = Math.PI / 5; // ~36°
        speedFactor = 0.75;
        break;
      case 'lobWedge':
        launchAngle = Math.PI / 4.5; // ~40°
        speedFactor = 0.7;
        break;
      default:
        launchAngle = 0;
        speedFactor = 1.0;
    }
    
    this.physics.logPhysicsDebug('Club characteristics', {
      launchAngle: launchAngle * (180/Math.PI) + '°',
      speedFactor: speedFactor
    });
    
    // Adjust launch angle for different lies
    launchAngle = this.adjustLaunchAngleForLie(launchAngle, speedFactor);
    
    // Calculate initial speed based on club distance with proper multiplier
    const baseSpeed = Math.sqrt(clubDistance * 0.1 * this.physics.gravity);
    const speed = baseSpeed * 
               this.distanceMultiplier * 0.5 * // Apply distance multiplier
               powerFactor * 
               speedFactor;
    
    this.physics.logPhysicsDebug('Speed calculation', {
      baseSpeed: baseSpeed,
      finalSpeed: speed,
      distanceMultiplier: this.distanceMultiplier
    });
    
    // Set initial velocity with appropriate launch angle
    this.ballVelocity.set(
      direction.x * speed * Math.cos(launchAngle),
      speed * Math.sin(launchAngle),
      direction.z * speed * Math.cos(launchAngle)
    );
    
    // Add a small random factor for non-perfect shots
    // Higher power = less randomness
    const randomFactor = (1 - powerFactor) * 0.1;
    const randomX = (Math.random() * 2 - 1) * randomFactor * speed;
    const randomZ = (Math.random() * 2 - 1) * randomFactor * speed;
    
    this.ballVelocity.x += randomX;
    this.ballVelocity.z += randomZ;
    
    this.physics.logPhysicsDebug('Shot randomization', {
      randomFactor: randomFactor,
      randomX: randomX,
      randomZ: randomZ
    });
  }
  
  // Adjust launch angle based on ball lie
  adjustLaunchAngleForLie(launchAngle, speedFactor) {
    // Get current ball lie
    const ballLie = this.gameState.currentBallLie;
    
    // Adjust launch angle for sand shots
    if (ballLie && ballLie.inSand) {
      // Steeper launch angle from sand bunkers
      launchAngle += Math.PI / 15; // About +12 degrees steeper
      speedFactor *= 0.7; // 30% less distance from sand
    } else if (ballLie && ballLie.inRough) {
      // More unpredictable from rough
      launchAngle += (Math.random() - 0.5) * Math.PI / 10; // +/- 9 degrees random variance
      speedFactor *= 0.85; // 15% less distance from rough
      
      // Add distinction between standard and outer rough if possible
      if (ballLie && ballLie.inOuterRough) {
        // Even more unpredictable from outer rough
        launchAngle += (Math.random() - 0.5) * Math.PI / 8; // Additional variance
        speedFactor *= 0.7; // 30% additional distance loss (total ~50% loss)
      }
    }
    
    return launchAngle;
  }
  
  // Update the trajectory arc preview
  updateTrajectoryArc() {
    if (this.ballPhysics.gameState.ballInMotion) return;
    
    try {
      // Simulate trajectory
      const points = [];
      const numPoints = 150; // Increased for smoother arc
      const timeStep = 0.03; // Smaller timestep for more accurate simulation
      
      // Current club max distance
      const clubDistance = this.gameState.getClubDistance(this.gameState.selectedClub);
      const isPutter = this.gameState.isPutter();
      
      // Starting conditions (full power)
      const position = this.ballPosition.clone();
      
      // IMPORTANT: Make sure we're using the current aim direction
      const direction = this.gameState.aimingDirection.clone();
      
      // Calculate initial velocity based on club
      let velocity;
      
      if (isPutter) {
        velocity = this.calculatePutterVelocity(direction, clubDistance);
      } else {
        velocity = this.calculateClubVelocity(direction, clubDistance);
      }
      
      // Simulate trajectory
      points.push(position.clone());
      
      let simTime = 0;
      let bounceCount = 0;
      const maxBounces = 3;
      let hasLanded = false;
      
      // Trajectory simulation loop
      for (let i = 1; i < numPoints; i++) {
        // Apply gravity - less for putters
        if (isPutter) {
          velocity.y -= this.physics.gravity * timeStep * 0.1;
        } else {
          velocity.y -= this.physics.gravity * timeStep;
        }
        
        // Apply air resistance - less for putters
        if (isPutter) {
          velocity.multiplyScalar(1 - this.physics.airResistance * timeStep * 0.1);
        } else {
          velocity.multiplyScalar(1 - this.physics.airResistance * timeStep);
        }
        
        // Update position
        position.add(velocity.clone().multiplyScalar(timeStep));
        
        // Add point after position update
        points.push(position.clone());
        
        // Check for ground collision
        const terrainHeight = this.courseBuilder.getHeightAt(position.x, position.z);
        
        if (position.y < terrainHeight + this.ballPhysics.ballRadius) {
          // Ball has hit the ground
          hasLanded = true;
          position.y = terrainHeight + this.ballPhysics.ballRadius;
          
          // For putter, stop after first bounce
          if (isPutter) {
            // Apply minimal bounce and mostly roll
            velocity.y = 0;
            
            // Apply terrain slope effect to rolling
            const slopeX = this.courseBuilder.getHeightAt(position.x + 0.5, position.z) - 
                        this.courseBuilder.getHeightAt(position.x - 0.5, position.z);
            const slopeZ = this.courseBuilder.getHeightAt(position.x, position.z + 0.5) - 
                        this.courseBuilder.getHeightAt(position.x, position.z - 0.5);
            
            velocity.x += slopeX * 0.01;
            velocity.z += slopeZ * 0.01;
            
            // Putting has much less friction on greens
            if (this.courseBuilder.courseConfig.isOnGreen(position)) {
              velocity.x *= 0.99;
              velocity.z *= 0.99;
            } else {
              velocity.x *= 0.95;
              velocity.z *= 0.95;
            }
          } else {
            // Normal bounce with energy loss
            velocity.y *= -0.6; // Bounce with 60% energy conservation
            
            // Apply friction in horizontal direction
            velocity.x *= 0.8;
            velocity.z *= 0.8;
          }
          
          bounceCount++;
          
          // Stop if max bounces reached or very low energy
          if (bounceCount >= maxBounces || velocity.length() < 0.1) {
            break;
          }
        }
        
        // Stop if the ball goes too far or simulation runs too long
        simTime += timeStep;
        if (simTime > 20 || position.distanceTo(this.ballPosition) > clubDistance * 2) {
          break;
        }
      }
      
      // Update trajectory line geometry
      const lineGeometry = this.ballPhysics.trajectoryLine.geometry;
      const positions = lineGeometry.attributes.position.array;
      
      for (let i = 0; i < numPoints; i++) {
        if (i < points.length) {
          const point = points[i];
          const idx = i * 3;
          positions[idx] = point.x;
          positions[idx + 1] = point.y;
          positions[idx + 2] = point.z;
        } else {
          // If we have fewer simulation points than line segments,
          // just repeat the last point
          const point = points[points.length - 1];
          const idx = i * 3;
          positions[idx] = point.x;
          positions[idx + 1] = point.y;
          positions[idx + 2] = point.z;
        }
      }
      
      lineGeometry.attributes.position.needsUpdate = true;
      
      // Show trajectory only when aiming
      this.ballPhysics.trajectoryLine.visible = !this.gameState.ballInMotion && this.gameState.swingState === 'aiming';
    } catch (error) {
      console.error("Error updating trajectory arc:", error);
    }
  }
  
  // Calculate velocity for a putter shot
  calculatePutterVelocity(direction, clubDistance) {
    // Calculate putter speed with special multiplier
    const putterSpeed = clubDistance * 0.1 * this.putterPowerMultiplier;
    
    // Set primarily horizontal velocity for putters
    return new THREE.Vector3(
      direction.x * putterSpeed,
      0.05, // Very minimal upward component
      direction.z * putterSpeed
    );
  }
  
  // Calculate velocity for a club shot
  calculateClubVelocity(direction, clubDistance) {
    // Different clubs have different launch angles
    let launchAngle;
    switch (this.gameState.selectedClub) {
      case 'driver':
        launchAngle = Math.PI / 10; // ~18° - flatter for driver
        break;
      case 'wood3':
        launchAngle = Math.PI / 9; // ~20°
        break;
      case 'hybrid':
        launchAngle = Math.PI / 8.5; // ~21°
        break;
      case 'iron2':
      case 'iron3':
        launchAngle = Math.PI / 8; // ~22.5°
        break;
      case 'iron4':
      case 'iron5':
        launchAngle = Math.PI / 7.5; // ~24°
        break;
      case 'iron6':
      case 'iron7':
        launchAngle = Math.PI / 7; // ~25.7°
        break;
      case 'iron8':
      case 'iron9':
        launchAngle = Math.PI / 6; // ~30°
        break;
      case 'pitchingWedge':
        launchAngle = Math.PI / 5.5; // ~32.7°
        break;
      case 'sandWedge':
        launchAngle = Math.PI / 5; // ~36°
        break;
      case 'lobWedge':
        launchAngle = Math.PI / 4.5; // ~40°
        break;
      default:
        launchAngle = Math.PI / 7; // Default
    }
    
    // Calculate velocity needed to reach max club distance
    // Use the distanceMultiplier to get proper distances
    const speed = Math.sqrt(clubDistance * 0.1 * this.physics.gravity) * this.distanceMultiplier * 0.5;
    
    // Set initial velocity with appropriate launch angle
    return new THREE.Vector3(
      direction.x * speed * Math.cos(launchAngle),
      speed * Math.sin(launchAngle),
      direction.z * speed * Math.cos(launchAngle)
    );
  }
  
// Setup for the next shot
setupNextShot() {
  console.log("Setting up for next shot - STARTING SEQUENCE");
  
  // Reset game state for next shot
  this.gameState.swingState = 'aiming';
  this.gameState.ballInMotion = false;
  
  // Force correct ball height
  const correctHeight = this.courseBuilder.getHeightAt(this.ballPosition.x, this.ballPosition.z) + this.ballPhysics.ballRadius;
  if (Math.abs(this.ballPosition.y - correctHeight) > 0.01) {
    this.ballPosition.y = correctHeight;
    this.ballPhysics.ball.position.y = correctHeight;
    console.log("Fixed ball height in setupNextShot");
  }
  
  // Check ball lie and update game state
  const ballLie = this.ballPhysics.terrainInteraction.checkBallLie();
  this.gameState.currentBallLie = ballLie;
  
  // Calculate distance to hole
  const holePosition = this.courseBuilder.courseConfig.holePosition;
  const distanceToHole = Math.sqrt(
    Math.pow(this.ballPosition.x - holePosition.x, 2) +
    Math.pow(this.ballPosition.z - holePosition.z, 2)
  );
  
  // Update the ballPosition in gameState for UI to access
  this.gameState.ballPosition = this.ballPosition.clone();
  
  // Auto-select appropriate club
  this.autoSelectClubBasedOnContext(distanceToHole, ballLie);
  
  // Show aiming elements again
  if (this.ballPhysics.showAimingElements) {
    this.ballPhysics.showAimingElements();
  } else {
    console.warn("showAimingElements method not available");
  }
  
  // Auto-aim toward the hole for next shot
  this.ballPhysics.aimTowardHole();
  
  // Update trajectory for the next shot
  this.updateTrajectoryArc();
  
  // Update distance display
  this.ballPhysics.updateDistanceToHole();
  
  // Force the camera to reset position (with a small delay)
  setTimeout(() => {
    console.log("Forcing camera reset event");
    this.ballPhysics.forceCameraReset();
  }, 300);
}
  
  // Auto-select appropriate club based on context
  autoSelectClubBasedOnContext(distance, ballLie) {
    // Check if we're on the green and auto-select putter
    if (this.isOnGreen()) {
      this.autoSelectPutter();
    }
    // Check if we're in sand and suggest sand wedge
    else if (ballLie.inSand) {
      this.autoSelectSandWedge();
    }
    // Otherwise auto-select an appropriate club based on distance
    else {
      this.autoSelectClubBasedOnDistance(distance, ballLie);
    }
  }
  
  // Auto-select club based on distance
  autoSelectClubBasedOnDistance(distance, ballLie) {
    // Get recommended clubs based on distance and lie
    const recommendedClubs = this.gameState.getRecommendedClubs(
      distance,
      ballLie.inSand,
      ballLie.inRough,
      ballLie.onGreen
    );
    
    // Select the first recommended club if there are any
    if (recommendedClubs && recommendedClubs.length > 0) {
      const selectedClub = recommendedClubs[0];
      
      // Directly set the club in gameState first
      this.gameState.selectedClub = selectedClub;
      
      // Then dispatch event for UI updates
      document.dispatchEvent(new CustomEvent('selectClub', {
        detail: { club: selectedClub }
      }));
      
      console.log(`Auto-selected ${selectedClub} for ${distance.toFixed(1)} yard shot`);
      
      // Show a tip about the auto-selected club
      this.ballPhysics.ui.showTip(`${distance.toFixed(0)} yards to the hole. ${this.gameState.clubDisplayNames[selectedClub]} selected.`);
    }
  }
  
  // Check if on green
  isOnGreen() {
    if (this.ballPhysics.terrainDetection && this.ballPhysics.terrainDetection.greenZone) {
      return this.ballPhysics.terrainDetection.greenZone.containsPoint(this.ballPosition);
    }
    // Fall back to original method if new system not available
    return this.courseBuilder.courseConfig.isOnGreen(this.ballPosition);
  }
  
  // Auto-select putter when on green
  autoSelectPutter() {
    if (this.isOnGreen() && this.gameState.selectedClub !== 'putter') {
      // Set in gameState first
      this.gameState.selectedClub = 'putter';
      
      // Then dispatch event for UI updates
      document.dispatchEvent(new CustomEvent('selectClub', {
        detail: { club: 'putter' }
      }));
      
      // Show a tip
      this.ballPhysics.ui.showTip("You're on the green! Putter selected.");
    }
  }
  
  // Auto-select sand wedge when in a bunker
  autoSelectSandWedge() {
    if (this.gameState.currentBallLie && this.gameState.currentBallLie.inSand) {
      // Set in gameState first
      this.gameState.selectedClub = 'sandWedge';
      
      // Then dispatch event for UI updates
      document.dispatchEvent(new CustomEvent('selectClub', {
        detail: { club: 'sandWedge' }
      }));
      
      // Show a tip for the player
      this.ballPhysics.ui.showTip("You're in a sand bunker! Sand wedge selected for best escape.");
    }
  }
}