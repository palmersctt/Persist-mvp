declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    ANTHROPIC_API_KEY: string;
    // Wearable providers — optional. When unset, the provider's connect
    // button is disabled and the demo provider is used instead.
    STRAVA_CLIENT_ID?: string;
    STRAVA_CLIENT_SECRET?: string;
    WHOOP_CLIENT_ID?: string;
    WHOOP_CLIENT_SECRET?: string;
  }
}