// Proxies /sitemap-blog.xml on the main domain through to the backend
// (Render), which is where this sitemap is actually generated from live
// blog data (see server.py's /sitemap-blog.xml route). Without this,
// requesting the path directly on thefinancialdoctor.in fell through to
// React Router's catch-all "*" route, which client-redirects to "/" —
// so a browser or Search Console hitting the frontend domain got the
// homepage instead of XML. This keeps everything on one canonical domain
// (search engines trust a same-domain sitemap more than a third-party
// host) while the backend stays the actual source of truth.
const BACKEND_SITEMAP_URL = "https://sagartfd.onrender.com/sitemap-blog.xml";

export async function onRequest() {
  try {
    const upstream = await fetch(BACKEND_SITEMAP_URL, { cf: { cacheTtl: 3600 } });
    if (!upstream.ok) {
      return new Response("Upstream sitemap unavailable", { status: 502 });
    }
    const xml = await upstream.text();
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Upstream sitemap unreachable", { status: 502 });
  }
}
