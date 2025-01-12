/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // for dub proxy
      {
        source: '/_proxy/dub/track/click',
        destination: 'https://api.dub.co/track/click',
      },
    ];
  },
};

export default nextConfig;
