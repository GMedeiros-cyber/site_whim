import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/monte-sua-peca", "/privacidade"].map((caminho) => ({
    url: `${SITE_URL}${caminho === "/" ? "" : caminho}`,
  }));
}
