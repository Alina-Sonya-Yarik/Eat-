(() => {
    const config = window.SUPABASE_CONFIG || {};
    const hasValidConfig =
        typeof config.url === 'string' &&
        typeof config.anonKey === 'string' &&
        config.url.startsWith('https://') &&
        !config.url.includes('YOUR_PROJECT_ID') &&
        !config.anonKey.includes('YOUR_SUPABASE_ANON_KEY');

    function getSupabaseClient() {
        if (!hasValidConfig) {
            return null;
        }

        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.warn('Supabase client library is not loaded.');
            return null;
        }

        if (!window.__SUPABASE_CLIENT__) {
            window.__SUPABASE_CLIENT__ = window.supabase.createClient(config.url, config.anonKey);
        }

        return window.__SUPABASE_CLIENT__;
    }

    window.appSupabase = {
        getClient: getSupabaseClient,
        isConfigured: () => Boolean(getSupabaseClient()),
    };
})();
