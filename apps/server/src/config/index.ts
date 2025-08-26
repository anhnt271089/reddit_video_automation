import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenvConfig();

interface DatabaseConfig {
  path: string;
}

interface ApiKeysConfig {
  reddit: {
    clientId: string;
    clientSecret: string;
  };
  claude: string;
  pexels: string;
  elevenLabs: string;
}

interface Config {
  nodeEnv: string;
  port: number;
  database: DatabaseConfig;
  apiKeys: ApiKeysConfig;
  jwt: {
    secret: string;
  };
  logLevel: string;
}

function validateEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

function createConfig(): Config {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3001', 10),
    
    database: {
      path: process.env.DATABASE_URL || join(process.cwd(), 'data', 'video_automation.db'),
    },
    
    apiKeys: {
      reddit: {
        clientId: validateEnvVar('REDDIT_CLIENT_ID', 'your_reddit_client_id'),
        clientSecret: validateEnvVar('REDDIT_CLIENT_SECRET', 'your_reddit_client_secret'),
      },
      claude: validateEnvVar('CLAUDE_API_KEY', 'your_claude_api_key'),
      pexels: validateEnvVar('PEXELS_API_KEY', 'your_pexels_api_key'),
      elevenLabs: validateEnvVar('ELEVENLABS_API_KEY', 'your_elevenlabs_api_key'),
    },
    
    jwt: {
      secret: validateEnvVar('JWT_SECRET', 'your_jwt_secret_key_change_in_production'),
    },
    
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

// Validate configuration on startup
function validateConfig(config: Config): void {
  const errors: string[] = [];

  // Port validation
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  // API key validation (check for placeholder values)
  const placeholderKeys = [
    'your_reddit_client_id',
    'your_reddit_client_secret', 
    'your_claude_api_key',
    'your_pexels_api_key',
    'your_elevenlabs_api_key',
  ];

  if (placeholderKeys.includes(config.apiKeys.reddit.clientId)) {
    console.warn('Warning: Using placeholder Reddit client ID');
  }
  
  if (placeholderKeys.includes(config.apiKeys.reddit.clientSecret)) {
    console.warn('Warning: Using placeholder Reddit client secret');
  }
  
  if (placeholderKeys.includes(config.apiKeys.claude)) {
    console.warn('Warning: Using placeholder Claude API key');
  }
  
  if (placeholderKeys.includes(config.apiKeys.pexels)) {
    console.warn('Warning: Using placeholder Pexels API key');
  }
  
  if (placeholderKeys.includes(config.apiKeys.elevenLabs)) {
    console.warn('Warning: Using placeholder ElevenLabs API key');
  }

  // JWT secret validation
  if (config.jwt.secret === 'your_jwt_secret_key_change_in_production') {
    if (config.nodeEnv === 'production') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    } else {
      console.warn('Warning: Using default JWT secret in development');
    }
  }

  // Log level validation
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(config.logLevel)) {
    errors.push(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Create and validate configuration
export const config = createConfig();

try {
  validateConfig(config);
  console.log('Configuration loaded and validated successfully');
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

export default config;