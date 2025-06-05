// Configuration
const totalClicksNeeded = 10;
let clickCount = 0;

// Load blocked sites and quotes
let blockedSites = [];
let quotes = [];
let currentQuoteIndex = 0; // Tracks the current quote index

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
  currentQuoteIndex = 0; // Reset to show first quote
  console.log('Quotes loaded:', quotes);
  console.log('Initial quote:', quotes[currentQuoteIndex]);
  
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
  console.log('Showing overlay, current index:', currentQuoteIndex);
  // Reset index to 0 when showing overlay
  currentQuoteIndex = 0;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'motivation-overlay';

  // Create quote element
  const quoteElement = document.createElement('div');
  quoteElement.className = 'quote';
  const quote = getRandomQuote();
  console.log('Displaying quote:', quote);
  quoteElement.textContent = quote;

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
  button.addEventListener('click', (e) => {
    // Prevent any default button behavior
    e.preventDefault();
    e.stopPropagation();
    
    clickCount++;
    console.log(`Button clicked ${clickCount} times`);

    if (clickCount >= totalClicksNeeded) {
      // Remove overlay and allow access
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      // Store that we've completed this session (resets on page reload)
      sessionStorage.setItem('motivationCompleted', 'true');
      console.log('Motivation completed, session storage updated');
    } else {
      // Change quote and move button
      const newQuote = getRandomQuote();
      console.log('New quote:', newQuote);
      quoteElement.textContent = newQuote;
      positionButtonRandomly(button);
    }
  });
}

function getRandomQuote() {
  if (!quotes.length) return 'Stay focused and keep going!';
  const quote = quotes[currentQuoteIndex];
  console.log('Current index:', currentQuoteIndex, 'Quote:', quote);
  // Move to next quote for next time
  currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
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
  const initExtension = () => {
    // Check if document is fully loaded
    if (document.readyState === 'complete') {
      checkIfBlocked();
    } else {
      // If not loaded yet, wait for the load event
      window.addEventListener('load', function() {
        // Small delay to ensure all resources are loaded
        setTimeout(checkIfBlocked, 100);
      }, { once: true });
    }
  };

  // Remove any existing listeners to prevent duplicates
  window.removeEventListener('load', initExtension);
  document.removeEventListener('DOMContentLoaded', initExtension);

  // Start initialization
  if (document.readyState === 'loading') {
    // If document is still loading, wait for it to finish
    document.addEventListener('DOMContentLoaded', initExtension, { once: true });
  } else {
    // If document is already loaded or in interactive state
    initExtension();
  }
}
