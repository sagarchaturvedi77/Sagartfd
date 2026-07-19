// Dynamic handler for /internship/* SPA sub-routes (login, signup, dashboard,
// etc.). Mirrors functions/internship.js: serves the current SPA shell with
// no-store headers so no Cloudflare edge location can pin a stale static asset
// for the internship section.
export async function onRequest(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;
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
