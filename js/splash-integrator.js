// splash-integrator.js
// This file serves as the bridge between your splash screen and the game

// Save references to key DOM elements
const splashScreen = document.getElementById('splashScreen');
const gameContainer = document.getElementById('gameContainer');

// Create a global namespace for game functionality
window.WeeTeeTime = window.WeeTeeTime || {};

// Expose initialization function globally so it can be called from splash screen
window.WeeTeeTime.initializeGame = function() {
  console.log("Initializing game from splash screen");
  
  // Make sure the game container is visible
  gameContainer.style.display = 'block';
  
  // Create the golf game instance (assuming this is your original initialization)
  if (typeof GolfGame === 'function') {
    window.gameInstance = new GolfGame();
    console.log("Game created successfully");
  } else {
    console.error("GolfGame constructor not found. Make sure main.js is loaded properly.");
  }
};

// Function to return to splash screen (can be called from game)
window.WeeTeeTime.returnToSplash = function() {
  // Hide game container
  gameContainer.style.display = 'none';
  
  // Show splash screen
  splashScreen.style.display = 'flex';
  
  // Clean up game instance if needed
  if (window.gameInstance && typeof window.gameInstance.cleanup === 'function') {
    window.gameInstance.cleanup();
  }
  
  // Optional: Reset the game state for next play
  if (window.gameState) {
    window.gameState.resetForNewHole();
  }
};

// Function to update today's hole info on the splash screen
function updateTodaysHoleInfo() {
  try {
    // Wait until the HoleGenerator.js script is loaded
    const checkForHoleGenerator = () => {
      import('../modules/HoleGenerator.js').then(module => {
        const HoleGenerator = module.HoleGenerator;
        const generator = new HoleGenerator();
        const todaysHole = generator.getTodaysHoleInfo();
        
        if (todaysHole) {
          // Calculate par based on length (if not already set)
          const yards = todaysHole.fairwayLength;
          let par = todaysHole.par || 4;
          if (!todaysHole.par) {
            if (yards < 250) par = 3;
            else if (yards > 470) par = 5;
          }
          
          // Format the date
          let dateDisplay = 'Today';
          if (todaysHole.id) {
            try {
              const dateObj = new Date(todaysHole.id);
              if (!isNaN(dateObj)) {
                const options = { month: 'long', day: 'numeric' };
                dateDisplay = dateObj.toLocaleDateString(undefined, options);
              }
            } catch (e) {
              console.log("Date formatting error:", e);
            }
          }
          
          // Update button text
          const playTodayBtn = document.getElementById('playTodayBtn');
          if (playTodayBtn) {
            const btnInner = playTodayBtn.querySelector('.btn-inner');
            if (btnInner) {
              const btnText = btnInner.querySelector('.btn-text');
              const btnSubtext = btnInner.querySelector('.btn-subtext');
              
              if (btnText) btnText.textContent = `Play ${dateDisplay}'s Hole`;
              if (btnSubtext) btnSubtext.textContent = `Par ${par} • ${yards} yards`;
            }
          }
          
          // Store today's hole info for later reference
          window.WeeTeeTime.todaysHoleInfo = todaysHole;
        }
      }).catch(err => {
        console.error("Error importing HoleGenerator:", err);
        // If import fails, try again after a short delay
        setTimeout(checkForHoleGenerator, 500);
      });
    };
    
    // Start checking for HoleGenerator
    checkForHoleGenerator();
  } catch (error) {
    console.error("Error updating today's hole info:", error);
  }
}

// Event listener for game initialization from splash screen
document.addEventListener('DOMContentLoaded', function() {
  // Make the gameContainer initially hidden
  if (gameContainer) {
    gameContainer.style.display = 'none';
  }
  
  // Update Play Today's Hole button with accurate hole info
  updateTodaysHoleInfo();
});

// Add analytics tracking (placeholder - implement with your analytics provider)
window.WeeTeeTime.trackEvent = function(category, action, label) {
  console.log(`ANALYTICS: ${category} - ${action} - ${label}`);
  // Implement with your analytics provider
  // Example: gtag('event', action, { 'event_category': category, 'event_label': label });
};

// Track page views
window.WeeTeeTime.trackPageView = function(page) {
  console.log(`ANALYTICS: Page View - ${page}`);
  // Implement with your analytics provider
  // Example: gtag('config', 'UA-XXXXX-Y', { 'page_path': page });
};

// Supabase integration (placeholder - implement with your Supabase account)
window.WeeTeeTime.supabase = {
  auth: {
    signIn: async function(email, password) {
      console.log(`SUPABASE: Sign in attempt for ${email}`);
      // Implement with Supabase
      // Example: const { user, error } = await supabase.auth.signIn({ email, password });
      return { success: true, user: { email: email, id: '123' } }; // Mock response
    },
    signUp: async function(email, password, username) {
      console.log(`SUPABASE: Sign up attempt for ${email} (${username})`);
      // Implement with Supabase
      // Example: const { user, error } = await supabase.auth.signUp({ email, password });
      return { success: true, user: { email: email, id: '123' } }; // Mock response
    },
    signOut: async function() {
      console.log(`SUPABASE: Sign out`);
      // Implement with Supabase
      // Example: await supabase.auth.signOut();
      return { success: true }; // Mock response
    }
  },
  scores: {
    saveScore: async function(userId, holeId, strokes, par) {
      console.log(`SUPABASE: Saving score for user ${userId}: ${strokes} strokes on hole ${holeId}`);
      // Implement with Supabase
      // Example: const { data, error } = await supabase.from('scores').insert([{ user_id: userId, hole_id: holeId, strokes, par }]);
      return { success: true, scoreId: '456' }; // Mock response
    },
    getLeaderboard: async function(timeframe = 'today') {
      console.log(`SUPABASE: Getting leaderboard for ${timeframe}`);
      // Implement with Supabase
      // Example: const { data, error } = await supabase.from('scores').select('*').order('strokes', { ascending: true }).limit(10);
      return { success: true, data: [] }; // Mock response
    }
  }
};

// Console logging
console.log("WeeTeeTime splash integrator loaded successfully");