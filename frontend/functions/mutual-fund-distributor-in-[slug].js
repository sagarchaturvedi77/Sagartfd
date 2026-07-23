// Dynamic per-city Open Graph tags for /mutual-fund-distributor-in-:slug.
// Same rationale/pattern as functions/blog/[id].js: share-preview bots
// don't execute JS, so without this every city page's shared link showed
// the same generic site-wide tags instead of a per-city title/description
// and a city-specific banner image.
//
// CITY_LOOKUP is a small, deliberately duplicated slug->name/state table
// (kept in sync manually with frontend/src/data/cityPages.js's CITY_PAGES
// whenever a city is added/renamed) — Pages Functions run in an isolated
// bundle and importing the React data file directly risks pulling in
// unrelated frontend build dependencies, so a tiny standalone lookup is
// the more robust choice here.
const CITY_LOOKUP = {
  "sehore": { name: "Sehore", state: "Madhya Pradesh" },
  "bhopal": { name: "Bhopal", state: "Madhya Pradesh" },
  "indore": { name: "Indore", state: "Madhya Pradesh" },
  "gwalior": { name: "Gwalior", state: "Madhya Pradesh" },
  "jabalpur": { name: "Jabalpur", state: "Madhya Pradesh" },
  "ujjain": { name: "Ujjain", state: "Madhya Pradesh" },
  "dewas": { name: "Dewas", state: "Madhya Pradesh" },
  "nagda": { name: "Nagda", state: "Madhya Pradesh" },
  "ashta": { name: "Ashta", state: "Madhya Pradesh" },
  "sarangpur": { name: "Sarangpur", state: "Madhya Pradesh" },
  "shujalpur": { name: "Shujalpur", state: "Madhya Pradesh" },
  "vidisha": { name: "Vidisha", state: "Madhya Pradesh" },
  "mumbai": { name: "Mumbai", state: "Maharashtra" },
  "pune": { name: "Pune", state: "Maharashtra" },
  "nagpur": { name: "Nagpur", state: "Maharashtra" },
  "nashik": { name: "Nashik", state: "Maharashtra" },
  "ahmedabad": { name: "Ahmedabad", state: "Gujarat" },
  "surat": { name: "Surat", state: "Gujarat" },
  "vadodara": { name: "Vadodara", state: "Gujarat" },
  "rajkot": { name: "Rajkot", state: "Gujarat" },
  "dwarka": { name: "Dwarka", state: "Gujarat" },
  "delhi": { name: "Delhi", state: "Delhi NCR" },
  "gurgaon": { name: "Gurgaon", state: "Delhi NCR" },
  "noida": { name: "Noida", state: "Delhi NCR" },
  "ghaziabad": { name: "Ghaziabad", state: "Delhi NCR" },
  "lucknow": { name: "Lucknow", state: "Uttar Pradesh" },
  "kanpur": { name: "Kanpur", state: "Uttar Pradesh" },
  "raipur": { name: "Raipur", state: "Chhattisgarh" },
  "patna": { name: "Patna", state: "Bihar" },
  "jaipur": { name: "Jaipur", state: "Rajasthan" },
  "bangalore": { name: "Bangalore", state: "Karnataka" },
  "hyderabad": { name: "Hyderabad", state: "Telangana" },
  "chennai": { name: "Chennai", state: "Tamil Nadu" },
  "kolkata": { name: "Kolkata", state: "West Bengal" },
  "ludhiana": { name: "Ludhiana", state: "Punjab" },
  "madhya-pradesh": { name: "Madhya Pradesh", state: "Madhya Pradesh" },
  "chhattisgarh": { name: "Chhattisgarh", state: "Chhattisgarh" },
  "maharashtra": { name: "Maharashtra", state: "Maharashtra" },
  "gujarat": { name: "Gujarat", state: "Gujarat" },
  "uttar-pradesh": { name: "Uttar Pradesh", state: "Uttar Pradesh" },
  "bihar": { name: "Bihar", state: "Bihar" },
  "rajasthan": { name: "Rajasthan", state: "Rajasthan" },
  "karnataka": { name: "Karnataka", state: "Karnataka" },
  "telangana": { name: "Telangana", state: "Telangana" },
  "tamil-nadu": { name: "Tamil Nadu", state: "Tamil Nadu" },
  "west-bengal": { name: "West Bengal", state: "West Bengal" },
  "punjab": { name: "Punjab", state: "Punjab" },
};

const SITE_URL = "https://thefinancialdoctor.in";

const BOT_UA_PATTERN =
  /facebookexternalhit|Facebot|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Slackbot|Discordbot|Pinterest|redditbot|SkypeUriPreview|Iframely|Embedly|vkShare|W3C_Validator/i;

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function botHtml(city, pageUrl) {
  const title = `Best Mutual Fund Distributor in ${city.name} | The Financial Doctor`;
  const description = `Mutual fund SIP, term/health/motor insurance, free calculators, and a free portfolio review for ${city.name} investors — Sagar Chaturvedi (AMFI Registered, ARN-290298).`;
  const image = `${SITE_URL}/assets/og/city-${city.slug}.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(pageUrl)}" />
<meta property="og:site_name" content="The Financial Doctor" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${image}" />
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
<p><a href="${escapeHtml(pageUrl)}">Visit the ${escapeHtml(city.name)} page on The Financial Doctor</a></p>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent") || "";
  const isBot = BOT_UA_PATTERN.test(userAgent);

  if (isBot) {
    const city = CITY_LOOKUP[params.slug];
    if (city) {
      return new Response(botHtml({ ...city, slug: params.slug }, url.toString()), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      });
    }
  }

  const assetResponse = await env.ASSETS.fetch(url.origin + "/index.html");
  const headers = new Headers(assetResponse.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  return new Response(assetResponse.body, { status: 200, headers });
}
