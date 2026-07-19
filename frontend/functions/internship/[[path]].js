// Dynamic handler for /internship/* SPA sub-routes (login, signup, dashboard,
// etc.). Mirrors functions/internship.js: serves the current SPA shell with
// no-store headers so no Cloudflare edge location can pin a stale static asset
// for the internship section.
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
