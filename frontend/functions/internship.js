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
  const url = new URL(request.url);
  const indexRequest = new Request(new URL("/index.html", url.origin).toString(), request);
  const assetResponse = await env.ASSETS.fetch(indexRequest);
  const html = await assetResponse.text();
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Pragma": "no-cache",
    },
  });
}
