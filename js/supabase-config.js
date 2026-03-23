(() => {
    const currentConfig = window.SUPABASE_CONFIG || {};
    const hasRuntimeConfig =
        typeof currentConfig.url === 'string' &&
        typeof currentConfig.anonKey === 'string' &&
        currentConfig.url.startsWith('https://') &&
        currentConfig.anonKey.length > 10;

    if (hasRuntimeConfig) {
        return;
    }

    // Safe default config. For local development you can create
    // js/supabase-config.local.js based on js/supabase-config.local.example.js.
    window.SUPABASE_CONFIG = {
        url: '',
        anonKey: '',
    };
})();
