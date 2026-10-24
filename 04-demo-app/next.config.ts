import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, images: { unoptimized: true }, async redirects() { return [
 {source:'/fa/facalities',destination:'/fa/facilities',permanent:false},
 {source:'/fa/blog',destination:'/fa/about',permanent:false},
 {source:'/en',destination:'/fa',permanent:false},
 {source:'/en/:path*',destination:'/fa',permanent:false},
 {source:'/virtual/index.htm',destination:'/fa/gallery',permanent:false},
 {source:'/shop/92852721',destination:'/fa/restaurant/menu',permanent:false},
 ]; } };
export default config;
