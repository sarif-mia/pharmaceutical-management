/** Product name shown in tab titles, login, and install prompts. The shop's own name lives in settings.shopName. */
export const APP_NAME = "ফার্মেসি ম্যানেজার";

export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — ${APP_NAME}` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — ${APP_NAME}` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
