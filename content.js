// Configuration
const totalClicksNeeded = 10;
let clickCount = 0;
let currentQuoteIndex = 0;

// Load blocked sites and quotes
let blockedSites = [];
let quotes = [];

// Load blocked sites and quotes from JSON files
console.log('Starting to load data...');

Promise.all([
  fetch(chrome.runtime.getURL('blockedSites.json'))
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .catch(error => {
      console.error('Error loading blockedSites.json:', error);
      return { blockedSites: ['x.com', 'instagram.com', 'youtube.com'] };
    }),
    
  fetch(chrome.runtime.getURL('quotes.json'))
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .catch(error => {
      console.error('Error loading quotes.json:', error);
      return { 
        quotes: [
          "The future depends on what you do today.",
          "Stay focused and keep going!",
          "Success is not final, failure is not fatal: It is the courage to continue that counts."
        ] 
      };
    })
])
.then(([sitesData, quoteList]) => {
  // Extract the blockedSites array from the nested structure
  blockedSites = sitesData.blockedSites || [];
  quotes = quoteList.quotes || quoteList || [];
  
  console.log('Successfully loaded:');
  console.log('- Blocked sites:', blockedSites);
  console.log(`- Number of quotes: ${quotes.length}`);
  
  // Check if the current page should be blocked
  checkIfBlocked();
})
.catch(error => {
  console.error('Unexpected error in Promise.all:', error);
  // Fallback to default values
  blockedSites = ['x.com', 'instagram.com', 'youtube.com'];
  quotes = ['Stay focused and keep going!'];
  console.log('Using fallback data due to error');
  checkIfBlocked();
});

function checkIfBlocked() {
  const currentUrl = window.location.hostname;

  // Check if current URL matches any blocked site
  const isBlocked = blockedSites.some(site => {
    return currentUrl.includes(site) ||
      currentUrl.includes(wwwPrefix(site));
  });

  if (isBlocked) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => showMotivationOverlay());
    } else {
      showMotivationOverlay();
    }
  }
}

function showMotivationOverlay() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'motivation-overlay';

  // Create quote element
  const quoteElement = document.createElement('div');
  quoteElement.className = 'quote';
  quoteElement.textContent = getRandomQuote();

  // Create button
  const button = document.createElement('button');
  button.className = 'motivation-button';
  button.textContent = 'Click Me to Continue';

  // Add elements to overlay
  overlay.appendChild(quoteElement);
  overlay.appendChild(button);

  // Add to document
  document.body.appendChild(overlay);

  // Position button randomly
  positionButtonRandomly(button);

  // Add click handler
  button.addEventListener('click', () => {
    clickCount++;

    if (clickCount >= totalClicksNeeded) {
      // Remove overlay and allow access
      document.body.removeChild(overlay);
      // Store that we've completed this session (resets on page reload)
      sessionStorage.setItem('motivationCompleted', 'true');
    } else {
      // Change quote and move button
      quoteElement.textContent = getRandomQuote();
      positionButtonRandomly(button);
    }
  });
}

function getRandomQuote() {
  if (!quotes.length) return 'Stay focused and keep going!';
  const quote = quotes[currentQuoteIndex];
  // Only move to next quote after returning the current one
  setTimeout(() => {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
  }, 0);
  return quote;
}

function positionButtonRandomly(button) {
  const maxX = window.innerWidth - 200; // Account for button width
  const maxY = window.innerHeight - 50; // Account for button height

  const randomX = Math.max(20, Math.floor(Math.random() * maxX));
  const randomY = Math.max(20, Math.floor(Math.random() * maxY));

  button.style.position = 'absolute';
  button.style.left = `${randomX}px`;
  button.style.top = `${randomY}px`;
}

// Helper function to add www. prefix if not present
function wwwPrefix(url) {
  return url.startsWith('www.') ? url : `www.${url}`;
}

// Check if we've already completed the motivation for this session
if (sessionStorage.getItem('motivationCompleted') !== 'true') {
  // Check if document is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // If already loaded or in the process of loading
    setTimeout(checkIfBlocked, 1);
  } else {
    // If not loaded yet, wait for load event
    window.addEventListener('load', checkIfBlocked);
  }
}
