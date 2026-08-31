/** @type {import('next').NextConfig} */
const nextConfig = {
  // ponytail: this repo has its own CLAUDE.md/CONSTITUTION.md convention;
  // don't let `next dev` scaffold a shadow AGENTS.md/CLAUDE.md in apps/web.
  agentRules: false,
};

export default nextConfig;
