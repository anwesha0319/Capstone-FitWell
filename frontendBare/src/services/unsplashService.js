// Unsplash API Service for Real Food Images
// Free tier: 50 requests/hour - perfect for meal planning

const UNSPLASH_ACCESS_KEY = 'Kz8WQ5GeuOZ8xn3YdWPcPb1ODWnjqFdcYxVy1WhspCE'; // Get from https://unsplash.com/developers
const UNSPLASH_API_URL = 'https://api.unsplash.com';

// Image cache to avoid repeated API calls
const imageCache = new Map();

/**
 * Get a real food image from Unsplash
 * @param {string} foodName - Name of the food (e.g., "grilled chicken salad")
 * @returns {Promise<string|null>} - Image URL or null
 */
export const getFoodImage = async (foodName) => {
  // Check cache first
  if (imageCache.has(foodName)) {
    return imageCache.get(foodName);
  }

  // If no API key, return null (will use icon fallback)
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'Kz8WQ5GeuOZ8xn3YdWPcPb1ODWnjqFdcYxVy1WhspCE') {
    return null;
  }

  try {
    const query = `${foodName} food meal`;
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.warn('Unsplash API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular; // High quality image
      imageCache.set(foodName, imageUrl);
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error('Error fetching food image:', error);
    return null;
  }
};

/**
 * Get a combined meal image from Unsplash
 * For meals with multiple items, creates a search query like "banana and mashed potatoes on a plate"
 * @param {Array<string>} foodItems - Array of food names (e.g., ["banana", "mashed potatoes"])
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 * @returns {Promise<string|null>} - Image URL or null
 */
export const getCombinedMealImage = async (foodItems, mealType = 'meal') => {
  if (!foodItems || foodItems.length === 0) {
    return null;
  }

  // Create a combined search query
  const combinedQuery = foodItems.length === 1
    ? `${foodItems[0]} ${mealType} food plate`
    : `${foodItems.join(' and ')} on a plate ${mealType} food`;

  // Check cache first
  const cacheKey = `combined_${combinedQuery}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  // If no API key, return null (will use icon fallback)
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'Kz8WQ5GeuOZ8xn3YdWPcPb1ODWnjqFdcYxVy1WhspCE') {
    return null;
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(combinedQuery)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.warn('Unsplash API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular;
      imageCache.set(cacheKey, imageUrl);
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error('Error fetching combined meal image:', error);
    return null;
  }
};

/**
 * Preload images for a meal plan
 * @param {Array} mealItems - Array of meal items with names
 * @returns {Promise<Map>} - Map of food names to image URLs
 */
export const preloadMealImages = async (mealItems) => {
  const imageMap = new Map();
  
  // Process in batches to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < mealItems.length; i += batchSize) {
    const batch = mealItems.slice(i, i + batchSize);
    const promises = batch.map(async (item) => {
      const imageUrl = await getFoodImage(item.name);
      if (imageUrl) {
        imageMap.set(item.name, imageUrl);
      }
    });
    
    await Promise.all(promises);
    
    // Small delay between batches
    if (i + batchSize < mealItems.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return imageMap;
};

/**
 * Clear the image cache
 */
export const clearImageCache = () => {
  imageCache.clear();
};

/**
 * Get cache size
 */
export const getCacheSize = () => {
  return imageCache.size;
};
