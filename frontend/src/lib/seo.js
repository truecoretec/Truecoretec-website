import { useEffect } from "react";

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content || "");
}

export function usePageMeta({ title, description, noindex = false, image } = {}) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", title || "");
    setMeta("property", "og:description", description || "");
    setMeta("property", "og:type", "website");
    if (image) setMeta("property", "og:image", image);
    setMeta("name", "twitter:card", "summary_large_image");

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + window.location.pathname);
  }, [title, description, noindex, image]);
}

export function useStructuredData(data) {
  useEffect(() => {
    if (!data) return undefined;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, [data]);
}
