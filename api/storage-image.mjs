const DEFAULT_SUPABASE_HOST = 'kgqgamlizrrpngdhcyhv.supabase.co';

function getAllowedHosts() {
    const hosts = new Set([DEFAULT_SUPABASE_HOST]);
    const supabaseUrl = process.env.SUPABASE_URL || '';

    if (supabaseUrl.startsWith('https://')) {
        try {
            hosts.add(new URL(supabaseUrl).hostname);
        } catch {
            // Ignore malformed env values and keep the default allowlist.
        }
    }

    return hosts;
}

function extractSourceUrl(request) {
    const requestUrl = new URL(request.url, `https://${request.headers.host || 'localhost'}`);
    const source = requestUrl.searchParams.get('src');

    if (!source) {
        return null;
    }

    try {
        return new URL(source);
    } catch {
        return null;
    }
}

export default async function handler(request, response) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        response.status(405).send('Method Not Allowed');
        return;
    }

    const sourceUrl = extractSourceUrl(request);

    if (!sourceUrl || sourceUrl.protocol !== 'https:') {
        response.status(400).send('Invalid src parameter');
        return;
    }

    const allowedHosts = getAllowedHosts();
    const isAllowedHost = allowedHosts.has(sourceUrl.hostname);
    const isStorageObject = sourceUrl.pathname.startsWith('/storage/v1/object/');

    if (!isAllowedHost || !isStorageObject) {
        response.status(403).send('Source host is not allowed');
        return;
    }

    try {
        const upstream = await fetch(sourceUrl, {
            method: request.method,
            headers: {
                Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
        });

        response.status(upstream.status);

        const contentType = upstream.headers.get('content-type');
        const cacheControl = upstream.headers.get('cache-control');
        const contentLength = upstream.headers.get('content-length');
        const etag = upstream.headers.get('etag');
        const lastModified = upstream.headers.get('last-modified');

        if (contentType) {
            response.setHeader('Content-Type', contentType);
        }

        if (cacheControl) {
            response.setHeader('Cache-Control', cacheControl);
        } else {
            response.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
        }

        if (contentLength) {
            response.setHeader('Content-Length', contentLength);
        }

        if (etag) {
            response.setHeader('ETag', etag);
        }

        if (lastModified) {
            response.setHeader('Last-Modified', lastModified);
        }

        if (request.method === 'HEAD') {
            response.end();
            return;
        }

        const body = Buffer.from(await upstream.arrayBuffer());
        response.send(body);
    } catch (error) {
        console.error('Failed to proxy storage image:', error);
        response.status(502).send('Failed to fetch image');
    }
}
