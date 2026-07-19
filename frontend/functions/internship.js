// Dynamic handler for the /internship landing route.
//
// Some Cloudflare edge locations were serving a stale, long-cached static
// HTML asset at /internship for the apex host (a leftover from an old
// deployment) that zone cache purge / Page Rules / Development Mode could not
// evict. Serving this route through a Pages Function makes the edge invoke
// code per request instead of returning a cached static asset, and the
// no-store headers guarantee every visitor gets the current SPA shell.
export async function onRequest(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;
  // Fetch the built SPA shell with a clean request (no client conditional or
  // encoding headers) so ASSETS never replies 304 / empty.
  const assetResponse = await env.ASSETS.fetch(origin + "/index.html");
  const headers = new Headers(assetResponse.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");
  headers.delete("ETag");
  headers.delete("Last-Modified");
  return new Response(assetResponse.body, { status: 200, headers });
}
