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

    // Local fallback when the runtime config is not provided by Vercel.
    window.SUPABASE_CONFIG = {
        url: 'https://kgqgamlizrrpngdhcyhv.supabase.co',
        anonKey: 'sb_publishable_rNCmgTB-VZFOOlB-8jX2zw_uEypjfI6',
    };
})();
