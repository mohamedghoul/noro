/**
 * Configuration Template for Noro Extension
 *
 * IMPORTANT: DO NOT COMMIT THIS FILE WITH ACTUAL CREDENTIALS!
 *
 * Instructions:
 * 1. Copy this file to 'config.ts' in the same directory
 * 2. Replace the placeholder values with your actual AWS credentials
 * 3. The config.ts file is gitignored and will not be committed
 *
 * For production releases:
 * - Use GitHub Secrets to store credentials securely
 * - Credentials should be injected during the build process
 */

export interface APIConfig {
	baseUrl: string;
	apiKey: string;
	endpoints: {
		context: string;
		insights: string;
		health: string;
	};
}

export interface RateLimitConfig {
	maxRequestsPerMinute: number;
	maxRequestsPerHour: number;
	minIntervalMs: number;
}

// AWS API Configuration
export const API_CONFIG: APIConfig = {
	baseUrl: "YOUR_AWS_API_GATEWAY_URL", // e.g., "https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"
	apiKey: "YOUR_AWS_API_KEY_HERE", // Get this from AWS API Gateway
	endpoints: {
		context: "", // Will be computed as baseUrl + "/context"
		insights: "", // Will be computed as baseUrl + "/insights"
		health: "", // Will be computed as baseUrl + "/health"
	},
};

// Compute endpoints
API_CONFIG.endpoints.context = `${API_CONFIG.baseUrl}/context`;
API_CONFIG.endpoints.insights = `${API_CONFIG.baseUrl}/insights`;
API_CONFIG.endpoints.health = `${API_CONFIG.baseUrl}/health`;

// Rate limiting configuration
export const RATE_LIMITS: RateLimitConfig = {
	maxRequestsPerMinute: 5,
	maxRequestsPerHour: 20,
	minIntervalMs: 12000, // 12 seconds between requests (5 per minute)
};
