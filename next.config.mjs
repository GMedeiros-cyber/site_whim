// .mjs (e não .ts): a Hostinger compila sem o SWC nativo, que não carrega lá (glibc antiga).
/** @type {import("next").NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // A imagem de compartilhamento lê a fonte e o logo do disco: entram no pacote do servidor.
  outputFileTracingIncludes: {
    "/**": ["./src/assets/poppins-semibold.ttf", "./public/brand/whim-logo-branco.svg"],
  },
  // Uma URL só: o www vai para o endereço sem www (o mesmo do canonical e do sitemap).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.whimconfeccao.com.br" }],
        destination: "https://whimconfeccao.com.br/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Sempre HTTPS (1 ano). Sem includeSubDomains: os subdomínios de e-mail e do painel não são deste site.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          // O site não pode ser embutido em páginas de terceiros.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nada usa câmera, microfone, localização ou pagamento (o mapa do Google também não).
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
