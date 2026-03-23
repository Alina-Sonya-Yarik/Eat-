export default function handler(request, response) {
    const url = process.env.SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    const hasRuntimeConfig = url.startsWith('https://') && anonKey.length > 10;
    const payload = hasRuntimeConfig
        ? `window.SUPABASE_CONFIG = ${JSON.stringify({ url, anonKey })};`
        : 'window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {};';

    response.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).send(payload);
}
