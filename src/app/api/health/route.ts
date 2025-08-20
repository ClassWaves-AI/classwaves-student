/**
 * ClassWaves Student Health Endpoint
 * 
 * Comprehensive health check for the student PWA application.
 * Validates WebSocket connectivity, audio capabilities, PWA functionality,
 * and overall system health.
 * 
 * GET /api/health - Returns health status for load balancers and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    websocket: 'healthy' | 'degraded' | 'unhealthy';
    audio: 'healthy' | 'degraded' | 'unhealthy'; 
    pwa: 'healthy' | 'degraded' | 'unhealthy';
    backend: 'healthy' | 'degraded' | 'unhealthy';
  };
  uptime: number;
  environment: string;
  features: {
    mediaRecorder: boolean;
    webRTC: boolean;
    serviceWorker: boolean;
    notifications: boolean;
    offlineStorage: boolean;
  };
}

/**
 * Check if MediaRecorder API is available for audio recording
 */
function checkAudioCapabilities(): 'healthy' | 'degraded' | 'unhealthy' {
  try {
    // Check if MediaRecorder is available
    if (typeof MediaRecorder === 'undefined') {
      return 'unhealthy';
    }

    // Check if getUserMedia is available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return 'healthy';
    }

    return 'degraded';
  } catch (error) {
    return 'unhealthy';
  }
}

/**
 * Check PWA and service worker capabilities
 */
function checkPWACapabilities(): 'healthy' | 'degraded' | 'unhealthy' {
  try {
    // Check if service workers are supported
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      return 'healthy';
    }
    return 'degraded';
  } catch (error) {
    return 'unhealthy';
  }
}

/**
 * Check WebSocket connectivity capability
 */
function checkWebSocketCapabilities(): 'healthy' | 'degraded' | 'unhealthy' {
  try {
    // Check if WebSocket is available
    if (typeof WebSocket !== 'undefined') {
      return 'healthy';
    }
    return 'unhealthy';
  } catch (error) {
    return 'unhealthy';
  }
}

/**
 * Check backend connectivity
 */
async function checkBackendConnectivity(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    
    // Quick timeout check to backend health
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(`${backendUrl}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return 'healthy';
    }
    
    return 'degraded';
  } catch (error) {
    return 'unhealthy';
  }
}

/**
 * Determine overall system health based on service statuses
 */
function calculateOverallHealth(services: HealthResponse['services']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services);
  
  // If any critical service is unhealthy, system is unhealthy
  if (statuses.includes('unhealthy')) {
    return 'unhealthy';
  }
  
  // If any service is degraded, system is degraded
  if (statuses.includes('degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * Get feature availability information
 */
function getFeatureAvailability(): HealthResponse['features'] {
  return {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    webRTC: typeof navigator !== 'undefined' && 
            typeof navigator.mediaDevices !== 'undefined' && 
            typeof navigator.mediaDevices.getUserMedia !== 'undefined',
    serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    notifications: typeof Notification !== 'undefined',
    offlineStorage: typeof indexedDB !== 'undefined' || typeof localStorage !== 'undefined',
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Perform health checks with timeout protection
    const healthCheckPromise = async (): Promise<HealthResponse> => {
      // Check individual services
      const audioHealth = checkAudioCapabilities();
      const pwaHealth = checkPWACapabilities();
      const websocketHealth = checkWebSocketCapabilities();
      const backendHealth = await checkBackendConnectivity();
      
      const services = {
        websocket: websocketHealth,
        audio: audioHealth,
        pwa: pwaHealth,
        backend: backendHealth,
      };
      
      const overallStatus = calculateOverallHealth(services);
      
      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        services,
        uptime: Math.floor(process.uptime ? process.uptime() : (Date.now() - startTime) / 1000),
        environment: process.env.NODE_ENV || 'development',
        features: getFeatureAvailability(),
      };
    };

    // Race against timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), 3000); // 3 second timeout
    });

    const healthData = await Promise.race([healthCheckPromise(), timeoutPromise]);
    
    // Set appropriate HTTP status code
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json(healthData, { status: statusCode });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    // Return unhealthy status on any error
    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      services: {
        websocket: 'unhealthy',
        audio: 'unhealthy',
        pwa: 'unhealthy',
        backend: 'unhealthy',
      },
      uptime: 0,
      environment: process.env.NODE_ENV || 'development',
      features: {
        mediaRecorder: false,
        webRTC: false,
        serviceWorker: false,
        notifications: false,
        offlineStorage: false,
      },
    };
    
    const response = NextResponse.json(errorResponse, { status: 503 });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
}

// Support HEAD requests for load balancer health checks
export async function HEAD(request: NextRequest) {
  const response = await GET(request);
  // Return same status but no body for HEAD requests
  return new NextResponse(null, { 
    status: response.status,
    headers: response.headers 
  });
}
