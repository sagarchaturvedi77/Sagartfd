import { useEffect } from "react";

const SITE_URL = "https://thefinancialdoctor.in";

function setMeta(attr, key, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(path) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", `${SITE_URL}${path}`);
}

// Sets document.title + meta description/keywords + Open Graph/Twitter tags
// for the current route. No react-helmet dependency — plain DOM mutation on
// mount/update, matching the existing document.title pattern already used
// in CalculatorsPage.jsx, just extended to cover description/OG/canonical
// too and centralised so every page does it the same way.
//
// Caveat (documented here rather than silently overpromising): this is a
// client-rendered SPA with one static index.html — WhatsApp/Facebook/etc.
// link-preview bots do NOT execute JS, so they'll always see index.html's
// static OG tags regardless of what this sets at runtime. Google's own
// crawler DOES execute JS and reads the final DOM, so title/description/
// canonical here are still real, working SEO signals for search — it's
// specifically social-share preview cards that stay generic per-page.
export default function SEO({ title, description, keywords, path, ogImage }) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("name", "author", "Sagar Chaturvedi");
    if (path) setCanonical(path);

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    if (path) setMeta("property", "og:url", `${SITE_URL}${path}`);
    if (ogImage) setMeta("property", "og:image", ogImage);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    if (ogImage) setMeta("name", "twitter:image", ogImage);
  }, [title, description, keywords, path, ogImage]);

  return null;
}
