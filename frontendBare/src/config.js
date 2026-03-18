/**
 * App Configuration
 * 
 * Change the BACKEND_IP to match your computer's IP address
 * Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find your IP
 */

// Backend IP Configuration
// For Android emulator: use '10.0.2.2'
// For iOS simulator: use 'localhost' 
// For physical device: use your computer's IP (e.g., '192.168.29.52')

export const BACKEND_IP = '192.168.29.52'; // Change this to your computer's IP
export const BACKEND_PORT = '8000';
export const API_BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;

// Development flags
export const IS_DEVELOPMENT = true;
export const LOG_NETWORK_REQUESTS = true;