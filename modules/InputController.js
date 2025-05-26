// Handle user input and game controls
export class InputController {
    constructor(gameState, ballPhysics, cameraController, uiController) {
      this.gameState = gameState;
      this.ballPhysics = ballPhysics;
      this.cameraController = cameraController;
      this.uiController = uiController;
      
      // Set up event listeners
      this.setupEventListeners();
    }
    
    // Set up all event listeners
    setupEventListeners() {
      // Listen for aim adjustments
      document.addEventListener('adjustAim', (event) => {
        this.handleAimAdjustment(event.detail.direction, event.detail.amount);
      });
      
      // Listen for shots
      document.addEventListener('executeShot', (event) => {
        this.handleShot(event.detail.power);
      });
      
      // Listen for camera mode toggle
      document.addEventListener('toggleCameraMode', () => {
        this.cameraController.toggleCameraMode();
      });
      
      // Listen for club changes
      document.addEventListener('clubChanged', (event) => {
        this.handleClubChange(event.detail.club);
      });
    }
    
    // Handle aim adjustment
    handleAimAdjustment(direction, amount) {
      if (this.gameState.ballInMotion || this.gameState.swingState !== 'aiming') return;
      
      if (direction === 'left') {
        // Adjust aiming angle counterclockwise
        this.gameState.aimingAngle -= amount;
      } else if (direction === 'right') {
        // Adjust aiming angle clockwise
        this.gameState.aimingAngle += amount;
      }
      
      // Update aim direction visualization
      this.ballPhysics.updateAimDirection();
    }
    
    // Handle shot execution
    handleShot(power) {
      if (this.gameState.ballInMotion || this.gameState.holeCompleted) return;
      
      // Update game state
      this.gameState.incrementStrokes();
      
      // Execute the shot with the current power level
      this.ballPhysics.executeShot(power);
    }
    
    // Handle club change
    handleClubChange(club) {
      if (this.gameState.ballInMotion) return;
      
      this.gameState.selectedClub = club;
      
      // Update trajectory arc for new club
      this.ballPhysics.updateTrajectoryArc();
    }
  }