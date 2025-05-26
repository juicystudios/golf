// Camera control and positioning
import * as THREE from 'three';

export class CameraController {
  constructor(camera, controls, gameState) {
    this.camera = camera;
    this.controls = controls;
    this.gameState = gameState;
    
    // Camera transition settings
    this.transitionSpeed = 0.15; // Speed of camera transitions
    this.isTransitioning = false;
    this.targetPosition = new THREE.Vector3();
    this.startPosition = new THREE.Vector3();
    this.transitionProgress = 0;
    this.transitionDuration = 1.0; // seconds
    
    // Last known ball position for camera reset
    this.lastBallPosition = new THREE.Vector3(0, 0, 0);
    
    // Camera positioning parameters
    this.followCameraDistance = 15; // Distance behind the ball
    this.followCameraHeight = 5; // Height above the ball
    this.overheadCameraHeight = 30;
    this.firstPersonCameraHeight = 1.7;
    
    // Putting specific camera settings
    this.putterCameraDistance = 3; // Even closer for putting
    this.putterCameraHeight = 1.5; // Lower for putting
    
    // Flag to prevent multiple camera updates during putter shots
    this.ignoreShotCompleteWhileMoving = false;
    
    // Force camera update flag
    this.forceNextShotUpdate = true;
    
    // Camera delay before updating after ball stops
    this.cameraUpdateDelay = 1000; // 1 second delay
    
    // Enable controls only if in free camera mode
    this.controls.enabled = (this.gameState.cameraMode === 'free');
    
    // Store the hole position for consistent camera positioning
    this.holePos = null;
    if (gameState.courseConfig && gameState.courseConfig.holePosition) {
      this.holePos = gameState.courseConfig.holePosition.clone();
    }
    
    // Set up event listeners for camera updates
    this.setupEventListeners();
    
    // Start animation loop for smooth camera transitions
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    
    // Update camera button text - MOVED to a separate method that's called after DOM is ready
    setTimeout(() => this.updateCameraModeButton(), 100);
    
    console.log("Camera controller initialized with mode:", this.gameState.cameraMode);
  }
  
  // Update camera mode button text
  updateCameraModeButton() {
    const cameraModeButton = document.getElementById('cameraModeButton');
    if (cameraModeButton) {
      cameraModeButton.textContent = 'CAMERA: ' + 
        this.gameState.cameraMode.toUpperCase() + 
        (this.gameState.cameraMode === 'free' ? ' (Press R to Reset)' : '');
    }
  }
    
    // Set up event listeners for different game events
    setupEventListeners() {
      // When the ball is moving, update camera accordingly
      document.addEventListener('ballMoving', (event) => {
        // Mark that we're following a moving ball - don't respond to shot complete
        // events until the ball has stopped completely
        this.ignoreShotCompleteWhileMoving = true;
        
        this.updateCameraDuringFlight(
          event.detail.position,
          event.detail.prevPosition,
          event.detail.velocity
        );
      });
      
      // When a shot is complete, update camera position
      document.addEventListener('shotComplete', (event) => {
        console.log("Shot complete event received, ignoreFlag =", this.ignoreShotCompleteWhileMoving);
        
        // If we're still tracking a moving ball, ignore shot complete events
        if (this.ignoreShotCompleteWhileMoving) {
          return;
        }
        
        // Force the camera to reposition for the next shot
        this.forceNextShotUpdate = true;
        
        // Position camera behind ball for next shot with delay
        setTimeout(() => {
          this.positionCameraBehindBall(event.detail.position);
          this.lastBallPosition.copy(event.detail.position);
        }, this.cameraUpdateDelay);
      });
      
      // Direct event for explicitly resetting camera
      document.addEventListener('resetCameraBehindBall', (event) => {
        console.log("***DIRECT CAMERA RESET EVENT RECEIVED***");
        
        // Reset the ignore flag - ball is definitely not moving now
        this.ignoreShotCompleteWhileMoving = false;
        
        // Add a delay to prevent abrupt camera changes
        setTimeout(() => {
          // Immediately position camera behind the ball
          this.positionCameraBehindBall(event.detail.position);
          
          // Remember this position
          this.lastBallPosition.copy(event.detail.position);
        }, this.cameraUpdateDelay);
      });
      
      // Listen for setup next shot event
      document.addEventListener('setupNextShot', (event) => {
        console.log("setupNextShot event received - repositioning camera");
        
        // Reset the ignore flag
        this.ignoreShotCompleteWhileMoving = false;
        
        // Added delay for camera repositioning
        setTimeout(() => {
          // Position camera behind ball for next shot
          this.positionCameraBehindBall(event.detail.position);
        }, this.cameraUpdateDelay);
      });
      
      // Listen for keyboard input for camera reset
      document.addEventListener('keydown', (e) => {
        // Reset camera to ball on 'R' key press
        if (e.code === 'KeyR') {
          this.resetCameraToBall();
        }
      });
      
      // Listen for club changes to adjust camera if needed
      document.addEventListener('clubChanged', (event) => {
        if (!this.gameState.ballInMotion) {
          // Adjust camera for club after a short delay
          setTimeout(() => {
            this.adjustCameraForClub(event.detail.club);
          }, 100);
        }
      });
    }
    
    // Specifically position camera directly behind ball, regardless of current mode
    positionCameraBehindBall(position) {
      // Ensure we have hole position
      const holePosition = this.getHolePosition();
      
      // FIXED: Calculate direction from ball to hole (not hole to ball)
      const dirBallToHole = new THREE.Vector3()
        .subVectors(holePosition, position)
        .normalize();
      
      // Check if we're using a putter
      const isPutter = this.gameState.isPutter && this.gameState.isPutter();
      
      // Use putter-specific settings if appropriate
      const cameraDistance = isPutter ? this.putterCameraDistance : this.followCameraDistance;
      const cameraHeight = isPutter ? this.putterCameraHeight : this.followCameraHeight;
      
      // CRITICAL FIX: Position camera OPPOSITE to ball-to-hole direction
      // This ensures the camera is behind the ball relative to the hole
      const cameraPosition = new THREE.Vector3(
        position.x - dirBallToHole.x * cameraDistance,
        position.y + cameraHeight,
        position.z - dirBallToHole.z * cameraDistance
      );
      
      console.log("Positioning camera behind ball at:", cameraPosition);
      
      // Use smooth transition for camera movement
      this.startCameraTransition(cameraPosition, position, 0.5);
      
      // Target look at the ball
      this.controls.target.copy(position);
      
      // Disable orbit controls except in free mode
      this.controls.enabled = (this.gameState.cameraMode === 'free');
      
      // Force controls update
      this.controls.update();
      
      // Save previous mode
      const previousMode = this.gameState.cameraMode;
      
      // Temporarily set to follow mode
      if (previousMode !== 'follow' && previousMode !== 'free') {
        // If not already in follow or free mode, temporarily switch to follow
        this.gameState.cameraMode = 'follow';
        this.updateCameraModeButton(); // Use the method instead of direct access
      }
    }
    
    // Adjust camera based on selected club
    adjustCameraForClub(club) {
      if (club === 'putter') {
        // Lower camera height for putting
        this.followCameraHeight = this.putterCameraHeight;
        this.followCameraDistance = this.putterCameraDistance;
      } else {
        // Normal height for other clubs - use the new increased values
        this.followCameraHeight = 5; // Match the new default height
        this.followCameraDistance = 15; // Match the new default distance
      }
      
      // If the forceNextShotUpdate flag is set, reposition camera
      if (this.forceNextShotUpdate) {
        // Position camera for the next shot
        this.positionCameraBehindBall(this.lastBallPosition);
        this.forceNextShotUpdate = false;
      }
    }
    
    // Update camera during ball flight
    updateCameraDuringFlight(position, prevPosition, velocity) {
      // Calculate direction of movement
      const movementDirection = new THREE.Vector3()
        .subVectors(position, prevPosition)
        .normalize();
      
      // Only update if there's significant movement
      if (movementDirection.length() > 0.01) {
        switch (this.gameState.cameraMode) {
          case 'follow':
            // FIXED: Calculate direction from ball to hole
            const holePosition = this.getHolePosition();
            
            // Direction from ball to hole (for consistent camera orientation)
            const dirBallToHole = new THREE.Vector3()
              .subVectors(holePosition, position)
              .normalize();
            
            // Blend direction of travel with consistent camera orientation
            // Use movement direction primarily, but keep some orientation relative to hole
            const blendFactor = 0.7; // 70% movement, 30% consistent orientation
            const blendedDirection = new THREE.Vector3()
              .addScaledVector(movementDirection, blendFactor)
              .addScaledVector(dirBallToHole, 1 - blendFactor)
              .normalize();
              
            // CRITICAL FIX: Position camera opposite to ball direction (behind ball)
            this.camera.position.set(
              position.x - blendedDirection.x * this.followCameraDistance,
              position.y + this.followCameraHeight,
              position.z - blendedDirection.z * this.followCameraDistance
            );
            
            // Look at the ball
            this.controls.target.copy(position);
            break;
            
          case 'overhead':
            // Move camera above ball, smoothly following
            this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, position.x, 0.05);
            this.camera.position.y = position.y + this.overheadCameraHeight;
            this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, position.z, 0.05);
            this.controls.target.copy(position);
            break;
            
          case 'first-person':
            // FIXED: Position camera behind the ball in the direction of travel
            const firstPersonOffset = 1.5; // Distance behind ball
            this.camera.position.x = position.x - movementDirection.x * firstPersonOffset;
            this.camera.position.y = position.y + this.firstPersonCameraHeight;
            this.camera.position.z = position.z - movementDirection.z * firstPersonOffset;
            
            // Look ahead in direction of travel
            this.controls.target.copy(
              position.clone().add(movementDirection.multiplyScalar(10))
            );
            break;
            
          case 'free':
            // For free camera mode, update the target but maintain camera position
            this.controls.target.copy(position);
            this.controls.update();
            break;
        }
      } else {
        // If ball is no longer moving significantly, clear the ignore flag
        this.ignoreShotCompleteWhileMoving = false;
      }
    }
    
    // Reset camera to focus on ball (for 'R' key press)
    resetCameraToBall() {
      // Use the last known ball position
      const ballPosition = this.lastBallPosition;
      
      // Position camera behind ball
      this.positionCameraBehindBall(ballPosition);
      
      console.log("Camera reset to ball position");
    }
    
    // Start a smooth camera transition 
    startCameraTransition(targetCameraPos, targetLookAt, speedMultiplier = 1.0) {
      this.isTransitioning = true;
      this.transitionProgress = 0;
      this.transitionSpeedMultiplier = speedMultiplier;
      
      // Store start and target positions
      this.startPosition.copy(this.camera.position);
      this.targetPosition.copy(targetCameraPos);
      
      // Set target for controls
      this.controls.target.copy(targetLookAt);
    }
    
    // Animate camera transitions
    animate() {
      // Handle smooth camera transitions
      if (this.isTransitioning) {
        // Use slower transition for smoother motion
        const increment = 0.01 * (this.transitionSpeedMultiplier || 1.0);
        this.transitionProgress += increment;
        
        if (this.transitionProgress >= 1) {
          // Transition complete
          this.transitionProgress = 1;
          this.isTransitioning = false;
        }
        
        // Use ease-out function for smoother motion
        const t = 1 - Math.pow(1 - this.transitionProgress, 3);
        
        // Interpolate camera position
        this.camera.position.lerpVectors(
          this.startPosition,
          this.targetPosition,
          t
        );
        
        // Update controls
        this.controls.update();
      }
      
      requestAnimationFrame(this.animate);
    }
    
    // Set camera position based on mode and target position
    setCameraToPosition(position) {
      console.log("setCameraToPosition called with position:", position, "Mode:", this.gameState.cameraMode);
      
      // If we're setting up for the next shot, use the behind-ball positioning
      if (this.forceNextShotUpdate) {
        this.positionCameraBehindBall(position);
        this.forceNextShotUpdate = false;
        return;
      }
      
      switch (this.gameState.cameraMode) {
        case 'follow':
          // FIXED: Get direction from ball to hole (for consistent orientation)
          const holePosition = this.getHolePosition();
          const dirBallToHole = new THREE.Vector3()
            .subVectors(holePosition, position)
            .normalize();
          
          // Use putter-specific settings if appropriate
          const isPutter = this.gameState.isPutter && this.gameState.isPutter();
          const cameraDistance = isPutter ? this.putterCameraDistance : this.followCameraDistance;
          const cameraHeight = isPutter ? this.putterCameraHeight : this.followCameraHeight;
          
          // Position camera behind ball (opposite to ball-to-hole direction)
          const cameraPosition = new THREE.Vector3(
            position.x - dirBallToHole.x * cameraDistance,
            position.y + cameraHeight,
            position.z - dirBallToHole.z * cameraDistance
          );
          
          // Start smooth transition to new position
          this.startCameraTransition(cameraPosition, position);
          
          // Look at the ball
          this.controls.target.copy(position);
          this.controls.enabled = false;
          break;
          
        case 'overhead':
          // Position camera directly above the ball
          const overheadPosition = new THREE.Vector3(
            position.x,
            position.y + this.overheadCameraHeight,
            position.z
          );
          
          // Start smooth transition
          this.startCameraTransition(overheadPosition, position);
          
          this.controls.target.copy(position);
          this.controls.enabled = false;
          break;
          
        case 'first-person':
          // Get direction from ball to hole
          const holePosFirstPerson = this.getHolePosition();
          const dirToHoleFirstPerson = new THREE.Vector3()
            .subVectors(holePosFirstPerson, position)
            .normalize();
          
          // Position camera at eye level looking toward hole
          const firstPersonPosition = new THREE.Vector3(
            position.x - dirToHoleFirstPerson.x * 1.5,
            position.y + this.firstPersonCameraHeight,
            position.z - dirToHoleFirstPerson.z * 1.5
          );
          
          // Start smooth transition
          this.startCameraTransition(firstPersonPosition, position);
          
          // Look toward the hole
          this.controls.target.copy(holePosFirstPerson);
          this.controls.enabled = false;
          break;
          
        case 'free':
          // In free mode, don't move camera but update target to ball
          this.controls.target.copy(position);
          this.controls.enabled = true;
          break;
      }
      
      // Update controls
      this.controls.update();
      
      // Store the last ball position
      this.lastBallPosition.copy(position);
    }
    
    // Toggle between camera modes
    toggleCameraMode() {
      // Save current ball position for camera update
      const ballPosition = this.lastBallPosition.clone();
      
      // Turn off the force update flag when manually changing modes
      this.forceNextShotUpdate = false;
      
      // Cycle through camera modes
      switch (this.gameState.cameraMode) {
        case 'follow':
          this.gameState.cameraMode = 'overhead';
          break;
          
        case 'overhead':
          this.gameState.cameraMode = 'first-person';
          break;
          
        case 'first-person':
          this.gameState.cameraMode = 'free';
          // Enable orbit controls for free camera mode
          this.controls.enabled = true;
          break;
          
        case 'free':
          this.gameState.cameraMode = 'follow';
          break;
      }
      
      // Update the camera mode button
      this.updateCameraModeButton();
      
      // Update camera to the new mode
      this.setCameraToPosition(ballPosition);
    }
    
    // Get direction vector from a position to the hole
    getDirectionToHole(position) {
      const holePosition = this.getHolePosition();
      
      return new THREE.Vector3()
        .subVectors(holePosition, position)
        .normalize();
    }
    
    // Get the hole position
    getHolePosition() {
      // First check if we cached the hole position (for consistency)
      if (this.holePos) {
        return this.holePos;
      }
      
      // This method abstracts the hole position access
      // so we can change the course config structure if needed
      if (this.gameState.courseConfig && this.gameState.courseConfig.holePosition) {
        // Cache the hole position for future use
        this.holePos = this.gameState.courseConfig.holePosition.clone();
        return this.holePos;
      }
      
      // Default fallback position
      return new THREE.Vector3(0, 0, -180);
    }
}