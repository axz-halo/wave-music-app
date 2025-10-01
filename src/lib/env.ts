/**
 * Environment variable validation and access
 */

interface EnvConfig {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  youtubeApiKey: string | null;
}

class EnvironmentManager {
  private config: EnvConfig;

  constructor() {
    this.config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
      youtubeApiKey: process.env.YT_API_KEY || null,
    };
  }

  get supabase() {
    return {
      url: this.config.supabaseUrl,
      anonKey: this.config.supabaseAnonKey,
      isConfigured: Boolean(this.config.supabaseUrl && this.config.supabaseAnonKey),
    };
  }

  get youtube() {
    return {
      apiKey: this.config.youtubeApiKey,
      isConfigured: Boolean(this.config.youtubeApiKey),
    };
  }

  validateRequired() {
    const missing: string[] = [];

    if (!this.config.supabaseUrl) {
      missing.push('NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!this.config.supabaseAnonKey) {
      missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    if (missing.length > 0) {
      console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
    }

    return missing.length === 0;
  }

  validateOptional() {
    const missing: string[] = [];

    if (!this.config.youtubeApiKey) {
      missing.push('YT_API_KEY');
    }

    if (missing.length > 0) {
      console.info(`ℹ️  Missing optional environment variables: ${missing.join(', ')}`);
    }
  }

  getAll() {
    return { ...this.config };
  }
}

export const env = new EnvironmentManager();

// Validate on load (client-side only)
if (typeof window !== 'undefined') {
  env.validateRequired();
  env.validateOptional();
}

