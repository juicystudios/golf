// Main entry point for the Daily Golf Challenge game
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GameState } from '../modules/GameState.js';
import { CourseConfig } from '../modules/CourseConfig.js';
import { CourseBuilder } from '../modules/CourseBuilder.js';
import { BallPhysics } from '../modules/BallPhysics.js';
import { CameraController } from '../modules/CameraController.js';
import { UIController } from '../modules/UIController.js';
import { InputController } from '../modules/InputController.js';
import { HoleSelector } from '../modules/HoleSelector.js';

// Initialize the game
class GolfGame {
  constructor() {
    // Set up basic render context but don't initialize full game yet
    this.initRenderer();
    
    // Track if animation has been started to avoid duplicate loops
    this.animationStarted = false;
    
    // Make game instance globally available
    window.golfGame = this;
    
    // Add hole selector
    this.holeSelector = new HoleSelector();
    
    // Set up event listeners for splash screen buttons
    const playTodayBtn = document.getElementById('playTodayBtn');
    if (playTodayBtn) {
      playTodayBtn.addEventListener('click', () => {
        // Select today's hole and initialize game
        this.holeSelector.selectTodaysHole();
        this.initializeAfterSplash();
      });
    } else {
      console.warn("Play Today button not found in the DOM. Game will not initialize automatically.");
    }
    
    const freePlayBtn = document.getElementById('freePlayBtn');
    if (freePlayBtn) {
      freePlayBtn.addEventListener('click', () => {
        // Show hole browser
        const browser = this.holeSelector.createHoleBrowser((selectedHole) => {
          // When a hole is selected, initialize the game with it
          this.holeSelector.selectedHoleConfig = selectedHole;
          this.initializeAfterSplash();
        });
        document.body.appendChild(browser);
      });
    }
    
    // Listen for reset game event
    document.addEventListener('resetGame', this.resetGame.bind(this));
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  // Initialize renderer (needed even before game starts to prevent errors)
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    
    // Only append to DOM if game container exists and is visible
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer && gameContainer.style.display === 'block') {
      gameContainer.appendChild(this.renderer.domElement);
    } else {
      // Keep renderer ready but don't add to DOM yet
      console.log("Game container not visible, renderer created but not attached");
    }
  }

  // Initialize the full game after splash screen is hidden
  initializeAfterSplash() {
    console.log("Initializing game after splash screen");
    
    // Get the game container
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
      console.error("Game container not found!");
      return;
    }
    
    // Attach renderer to game container if not already attached
    if (this.renderer.domElement.parentNode !== gameContainer) {
      gameContainer.appendChild(this.renderer.domElement);
    }
    
    // Initialize remaining components
    this.initScene();
    this.initCamera();
    this.initLights();
    
    // Initialize game modules using the selected hole config
    this.gameState = new GameState();
    
    // Use selected hole config or create a default one
    this.courseConfig = new CourseConfig(this.holeSelector.selectedHoleConfig || {});
    this.gameState.courseConfig = this.courseConfig;
    
    // Update hole info in UI if available
    this.updateHoleInfoDisplay();
    
    // Assign ballPosition in gameState for club selection
    this.gameState.ballPosition = new THREE.Vector3(0, 0, 0);
    
    // Create controllers
    this.courseBuilder = new CourseBuilder(this.scene, this.courseConfig);
    this.ballPhysics = new BallPhysics(this.scene, this.gameState, this.courseBuilder);
    this.cameraController = new CameraController(this.camera, this.controls, this.gameState);
    this.uiController = new UIController(this.gameState, this.courseConfig);
    this.inputController = new InputController(
      this.gameState, 
      this.ballPhysics, 
      this.cameraController,
      this.uiController
    );

    // Generate the course and place the ball
    this.courseBuilder.generateCourse();
    this.ballPhysics.placeBallOnTee();

    // Initial camera and aiming setup
    this.ballPhysics.aimTowardHole();
    this.ballPhysics.updateTrajectoryArc();
    if (this.controls && this.ballPhysics.ball) {
      this.controls.target.copy(this.ballPhysics.ball.position);
      this.controls.update();
    }
    
    // Make instances available globally for debugging and reset
    window.gameState = this.gameState;
    window.ballPhysics = this.ballPhysics;
    
    // Start animation loop if not already started
    if (!this.animationStarted) {
      this.animate = this.animate.bind(this);
      this.animate();
      this.animationStarted = true;
      console.log("Animation loop started");
    }
    
    // Check if on mobile device and adjust UI accordingly
    if (this.isMobileDevice() && this.uiController) {
      this.uiController.adjustForMobile();
    }
    
    // Show game container (make it visible)
    gameContainer.style.display = 'block';
    
    // Hide splash screen if it exists
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
      splashScreen.style.display = 'none';
    }
  }
  
  // Update hole info on the UI
  updateHoleInfoDisplay() {
    // Update hole info in the scorecard
    const holeName = document.getElementById('holeName');
    if (holeName && this.holeSelector.selectedHoleConfig) {
      // Format the date nicely
      let displayName = this.holeSelector.selectedHoleConfig.name || 'Today\'s Hole';
      
      // If it's a date string, format it
      if (this.holeSelector.selectedHoleConfig.id) {
        try {
          const dateObj = new Date(this.holeSelector.selectedHoleConfig.id);
          const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
          displayName = dateObj.toLocaleDateString(undefined, options);
        } catch (e) {
          // Use the id as is if date parsing fails
          displayName = this.holeSelector.selectedHoleConfig.id;
        }
      }
      
      holeName.textContent = displayName;
    }
    
    // Update par and distance
    const holeDetails = document.getElementById('holeDetails');
    if (holeDetails && this.holeSelector.selectedHoleConfig) {
      const yards = this.holeSelector.selectedHoleConfig.fairwayLength || 450;
      // Calculate par based on distance
      let par = 4; // Default
      if (yards < 250) par = 3;
      else if (yards > 470) par = 5;
      
      holeDetails.textContent = `Par ${par} • ${yards} yards`;
    }
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 30, 50);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.maxDistance = 200;
    this.controls.minDistance = 5;
    this.controls.enabled = true;
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.far = 500;
    this.scene.add(directionalLight);
  }
  
  // Reset the game state
  resetGame() {
    console.log("Resetting game...");
    
    if (!this.gameState || !this.ballPhysics) {
      console.warn("Game not fully initialized yet, cannot reset");
      return;
    }
    
    // Reset game state
    this.gameState.resetForNewHole();
    
    // Place ball back on tee
    this.ballPhysics.placeBallOnTee();
    
    // Reset camera
    if (this.cameraController) {
      this.cameraController.positionCameraBehindBall(this.ballPhysics.ballPosition);
    }
    
    console.log("Game reset complete");
  }

  // Add a method to update animated elements
  updateAnimatedElements() {
    // Skip if elements aren't defined yet
    if (!this.courseBuilder) return;
    
    const time = performance.now() * 0.001; // Current time in seconds
    
    // Animate birds
    if (this.courseBuilder.birds && this.courseBuilder.birds.length > 0) {
      this.courseBuilder.birds.forEach(bird => {
        // Wing flapping animation
        if (bird.userData.leftWing && bird.userData.rightWing) {
          const wingAngle = Math.sin(time * 10 * bird.userData.wingSpeed) * 0.3;
          bird.userData.leftWing.rotation.z = wingAngle;
          bird.userData.rightWing.rotation.z = -wingAngle;
        }
        
        // Move bird forward in its direction
        const direction = bird.userData.flyDirection;
        bird.position.x += direction.x * bird.userData.flySpeed;
        bird.position.y += direction.y * bird.userData.flySpeed;
        bird.position.z += direction.z * bird.userData.flySpeed;
        
        // Rotate bird to face its direction of travel
        if (direction.x !== 0 || direction.z !== 0) {
          bird.rotation.y = Math.atan2(direction.x, direction.z);
        }
        
        // Wrap around when bird flies too far
        const maxDist = this.courseBuilder.courseConfig.groundSize * 0.5;
        if (bird.position.x > maxDist || bird.position.x < -maxDist ||
            bird.position.z > maxDist || bird.position.z < -maxDist) {
          // Reset position to the opposite side
          bird.position.x = -bird.position.x * 0.9;
          bird.position.z = -bird.position.z * 0.9;
        }
      });
    }
    
    // Animate fish
    if (this.courseBuilder.fish && this.courseBuilder.fish.length > 0) {
      this.courseBuilder.fish.forEach(fish => {
        if (fish.userData.isJumping) {
          // Update jump progress
          fish.userData.jumpProgress += fish.userData.jumpSpeed;
          
          // Jump parabola
          const jumpPhase = Math.sin(fish.userData.jumpProgress * Math.PI);
          fish.position.y = fish.userData.waterY + jumpPhase * fish.userData.jumpHeight;
          
          // Rotate during jump
          fish.rotation.x = jumpPhase * Math.PI * 0.5;
          
          // End jump when complete
          if (fish.userData.jumpProgress >= 1) {
            fish.userData.isJumping = false;
            fish.userData.jumpDelay = 20 + Math.random() * 100; // Delay before next jump
            fish.position.y = fish.userData.waterY - 0.5; // Back underwater
            fish.rotation.x = 0;
          }
        } else {
          // Count down to next jump
          fish.userData.jumpDelay--;
          
          if (fish.userData.jumpDelay <= 0) {
            // Start a new jump
            fish.userData.isJumping = true;
            fish.userData.jumpProgress = 0;
            
            // Random small position change for next jump
            const hazardWidth = 40;
            const hazardDepth = 40;
            fish.position.x += (Math.random() - 0.5) * 5;
            fish.position.z += (Math.random() - 0.5) * 5;
            
            // Keep within water hazard bounds
            const waterPosition = new THREE.Vector3(50, 0, -150); // Center of water
            if (fish.position.x > waterPosition.x + hazardWidth/2 - 2) 
              fish.position.x = waterPosition.x + hazardWidth/2 - 2;
            if (fish.position.x < waterPosition.x - hazardWidth/2 + 2) 
              fish.position.x = waterPosition.x - hazardWidth/2 + 2;
            if (fish.position.z > waterPosition.z + hazardDepth/2 - 2) 
              fish.position.z = waterPosition.z + hazardDepth/2 - 2;
            if (fish.position.z < waterPosition.z - hazardDepth/2 + 2) 
              fish.position.z = waterPosition.z - hazardDepth/2 + 2;
          }
        }
      });
    }
    
    // Animate spectators
    if (this.courseBuilder.spectators && this.courseBuilder.spectators.length > 0) {
      this.courseBuilder.spectators.forEach(group => {
        group.children.forEach(spectator => {
          // Simple bobbing animation for spectators
          if (spectator.userData.bobSpeed) {
            const bobAmount = Math.sin(time * spectator.userData.bobSpeed + spectator.userData.bobPhase) * spectator.userData.bobHeight;
            spectator.position.y = bobAmount;
          }
        });
      });
    }
    
    // Animate wind in trees
    if (this.courseBuilder.windyTrees && this.courseBuilder.windyTrees.length > 0) {
      this.courseBuilder.windyTrees.forEach(tree => {
        // Only apply to the tree top (index 1 in the group)
        const treeTop = tree.children[1];
        if (treeTop && tree.userData.windSpeed) {
          const windX = Math.sin(time * tree.userData.windSpeed + tree.userData.windPhase) * tree.userData.windStrength;
          const windZ = Math.cos(time * tree.userData.windSpeed * 0.7 + tree.userData.windPhase) * tree.userData.windStrength;
          
          treeTop.rotation.x = windX;
          treeTop.rotation.z = windZ;
        }
      });
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    
    // Only update controls in free camera mode
    if (this.gameState && this.gameState.cameraMode === 'free' && this.controls) {
      this.controls.update();
    }
    
    // Update animated elements
    this.updateAnimatedElements();
    
    // Only render if the renderer is initialized and attached to DOM
    if (this.renderer && this.renderer.domElement.parentNode && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  // Cleanup method to properly dispose resources
  cleanup() {
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    
    // Dispose of Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Cancel animation frame if active
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.controls = null;
    
    console.log("Game resources cleaned up");
  }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, creating GolfGame instance");
  new GolfGame();
  
  // Create collapsible instructions after a delay to ensure other elements are loaded
  setTimeout(createCollapsibleInstructions, 500);
});

// Create the collapsible instructions container
const createCollapsibleInstructions = () => {
  // Check if existing instructions exist and remove them
  const existingInstructions = document.getElementById('instructions');
  if (existingInstructions) {
    existingInstructions.remove();
  }
  
  // Create the new collapsible container
  const instructionsContainer = document.createElement('div');
  instructionsContainer.id = 'instructions';
  instructionsContainer.style.position = 'absolute';
  instructionsContainer.style.top = '80px';
  instructionsContainer.style.left = '20px';
  instructionsContainer.style.background = 'rgba(255, 255, 255, 0.9)';
  instructionsContainer.style.padding = '15px';
  instructionsContainer.style.borderRadius = '10px';
  instructionsContainer.style.maxWidth = '300px';
  instructionsContainer.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
  instructionsContainer.style.transition = 'all 0.3s ease';
  
  // Create the header with toggle button
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '10px';
  header.style.cursor = 'pointer';
  
  const title = document.createElement('h3');
  title.textContent = 'How to Play';
  title.style.margin = '0';
  title.style.color = '#2c3e50';
  title.style.borderBottom = 'none';
  title.style.paddingBottom = '0';
  
  const toggleIcon = document.createElement('span');
  toggleIcon.id = 'instructionsToggle';
  toggleIcon.textContent = '▼'; // Down arrow to indicate expand
  toggleIcon.style.fontSize = '14px';
  toggleIcon.style.color = '#3498db';
  toggleIcon.style.transition = 'transform 0.3s ease';
  
  header.appendChild(title);
  header.appendChild(toggleIcon);
  instructionsContainer.appendChild(header);
  
  // Create the content container (initially collapsed)
  const contentContainer = document.createElement('div');
  contentContainer.id = 'instructionsContent';
  contentContainer.style.maxHeight = '0';
  contentContainer.style.overflow = 'hidden';
  contentContainer.style.transition = 'max-height 0.3s ease';
  
  // Add instruction content
  const content = `
    <div class="instruction">
      <span class="instruction-icon">1</span>
      <span>Aim using the left/right buttons or arrow keys</span>
    </div>
    <div class="instruction">
      <span class="instruction-icon">2</span>
      <span>Click SWING button to start power meter</span>
    </div>
    <div class="instruction">
      <span class="instruction-icon">3</span>
      <span>Click HIT button when power meter reaches desired level</span>
    </div>
    <div class="divider"></div>
    <div class="instruction">
      <span class="instruction-icon">C</span>
      <span>Change camera view with the CAMERA button</span>
    </div>
    <div class="instruction">
      <span class="instruction-icon">K</span>
      <span>Keyboard shortcuts: Arrow keys to aim, Spacebar to swing/hit, 1-7 for club selection</span>
    </div>
  `;
  
  contentContainer.innerHTML = content;
  instructionsContainer.appendChild(contentContainer);
  
  // Only add instructions to the game container if it's visible
  const gameContainer = document.getElementById('gameContainer');
  if (gameContainer && gameContainer.style.display === 'block') {
    gameContainer.appendChild(instructionsContainer);
  } else {
    // Store instructions to add later when game starts
    window.pendingInstructions = instructionsContainer;
  }
  
  // Add toggle functionality
  let isExpanded = false;
  
  const toggleInstructions = () => {
    isExpanded = !isExpanded;
    if (isExpanded) {
      contentContainer.style.maxHeight = '500px'; // Arbitrary large value
      toggleIcon.textContent = '▲'; // Up arrow to indicate collapse
      toggleIcon.style.transform = 'rotate(180deg)';
    } else {
      contentContainer.style.maxHeight = '0';
      toggleIcon.textContent = '▼'; // Down arrow to indicate expand
      toggleIcon.style.transform = 'rotate(0deg)';
    }
  };
  
  // Add click event to the header
  header.addEventListener('click', toggleInstructions);
  
  return instructionsContainer;
};