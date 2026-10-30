export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — শেফা ফার্মেসি` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — শেফা ফার্মেসি` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
