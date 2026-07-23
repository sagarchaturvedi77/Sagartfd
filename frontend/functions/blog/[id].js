// Dynamic per-post Open Graph tags for /blog/:id.
//
// This is a client-rendered SPA with one static index.html, so share-
// preview bots (WhatsApp, LinkedIn, Instagram, Facebook, Telegram, Slack,
// Twitter/X) — which fetch the raw HTML and do NOT execute JavaScript —
// always saw the same generic index.html tags, never the per-post title/
// description SEO.jsx sets client-side. Real browsers (which DO run JS)
// were never affected; this only fixes what bots see when a link is
// shared. Real human visitors always get the normal SPA shell via the
// pass-through branch below, unaffected by any of this.
//
// BACKEND_BASE is the public FastAPI URL (Render) — hardcoded the same
// way SITE_URL is hardcoded across the frontend (SEO.jsx, PublicBlog.jsx,
// CityLandingPage.jsx); no Pages env var plumbing exists for this yet.
const BACKEND_BASE = "https://sagartfd.onrender.com";
const SITE_URL = "https://thefinancialdoctor.in";

// One share image per topic (see backend/scripts/generate_topic_share_cards.py)
// instead of a single generic card reused for all 150 posts — a SIP post
// looks visibly different from a tax-saving or market-history one when shared.
const KNOWN_TOPICS = new Set([
  "sip", "lumpsum", "swp", "financial_planning", "term_insurance",
  "health_insurance", "elss_tax_saving", "retirement_planning",
  "general_investing", "awareness", "brand_comparison", "other",
]);
function ogImageFor(post) {
  const topic = KNOWN_TOPICS.has(post.topic) ? post.topic : "other";
  return `${SITE_URL}/assets/og/blog-${topic}.png`;
}

// Every major share-preview/link-unfurl bot. Deliberately excludes
// Googlebot — Google's own crawler DOES execute JS and reads the final
// rendered DOM, so it already gets accurate per-page tags without this.
const BOT_UA_PATTERN =
  /facebookexternalhit|Facebot|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Slackbot|Discordbot|Pinterest|redditbot|SkypeUriPreview|Iframely|Embedly|vkShare|W3C_Validator/i;

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function pickTitle(post, lang) {
  if (lang === "en" && post.title_en) return post.title_en;
  return post.title;
}

function pickDescription(post, lang) {
  if (post.meta_description) return post.meta_description;
  const body = lang === "en" && post.body_en ? post.body_en : post.body;
  return body ? `${body.slice(0, 150).trim()}...` : "Practical guides on SIP, lumpsum, SWP, tax-saving and financial planning from The Financial Doctor.";
}

function botHtml(post, lang, pageUrl) {
  const title = `${escapeHtml(pickTitle(post, lang))} | The Financial Doctor`;
  const description = escapeHtml(pickDescription(post, lang));
  const image = ogImageFor(post);
  return `<!DOCTYPE html>
<html lang="${lang === "en" ? "en" : "hi"}">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${escapeHtml(pageUrl)}" />
<meta property="og:site_name" content="The Financial Doctor" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="article:author" content="Sagar Chaturvedi" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
<p><a href="${escapeHtml(pageUrl)}">Read the full article on The Financial Doctor</a></p>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = BOT_UA_PATTERN.test(userAgent);

  if (isBot) {
    const id = params.id;
    const lang = url.searchParams.get("lang") === "en" ? "en" : "hinglish";
    try {
      const apiRes = await fetch(`${BACKEND_BASE}/api/internship/public/content/${id}`);
      if (apiRes.ok) {
        const post = await apiRes.json();
        return new Response(botHtml(post, lang, url.toString()), {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      }
    } catch {
      // Backend unreachable — fall through to the normal SPA shell below
      // rather than showing a bot a broken page.
    }
  }

  // Real visitors (and any bot fallback above) get the normal SPA shell,
  // same pattern as functions/internship.js — React Router takes over
  // client-side once index.html loads.
  const assetResponse = await env.ASSETS.fetch(url.origin + "/index.html");
  const headers = new Headers(assetResponse.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(assetResponse.body, { status: 200, headers });
}
