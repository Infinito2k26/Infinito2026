/** @type {import('next').NextConfig} */
const nextConfig = {
  // ponytail: this repo has its own CLAUDE.md/CONSTITUTION.md convention;
  // don't let `next dev` scaffold a shadow AGENTS.md/CLAUDE.md in apps/web.
  agentRules: false,

  images: {
    // The key art is illustration, and ships as 1.3MB PNGs / 1.4MB JPEGs at
    // source. AVIF first cuts the hero to roughly a tenth of that; WebP covers
    // everything that can't take AVIF.
    formats: ["image/avif", "image/webp"],
    // Widths the layout actually asks for: poster cards in a 2/3/4-up grid,
    // event detail, and the full-bleed hero at 1x and 2x.
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [180, 240, 320, 420],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
