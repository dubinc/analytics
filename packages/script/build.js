const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const baseConfig = {
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2015',
};

// Order matters: variant names list extensions in this order (e.g. script.site-visit.identity.js)
const EXTENSIONS = [
  'site-visit',
  'outbound-domains',
  'conversion-tracking',
  'identity',
];

// Helper to read and combine files
const combineFiles = (files) => {
  // Just concatenate the files, esbuild will handle the IIFE wrapping
  return files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
};

// Every subset of EXTENSIONS, keeping their order
const combinations = EXTENSIONS.reduce(
  (subsets, extension) => [
    ...subsets,
    ...subsets.map((subset) => [...subset, extension]),
  ],
  [[]],
);

// Ensure dist/analytics exists
fs.mkdirSync(path.join(__dirname, 'dist/analytics'), { recursive: true });

// Copy _redirects to dist folder
fs.copyFileSync(
  path.join(__dirname, 'public/_redirects'),
  path.join(__dirname, 'dist/_redirects'),
);

// Build all variants (16 combinations of 4 extensions), plus the identity agent they load on demand
Promise.all([
  ...combinations.map((extensions) =>
    esbuild.build({
      ...baseConfig,
      stdin: {
        contents: combineFiles([
          'src/base.js',
          ...extensions.map((extension) => `src/extensions/${extension}.js`),
        ]),
        resolveDir: __dirname,
        sourcefile: extensions.length ? 'combined.js' : 'base.js',
      },
      outfile: `dist/analytics/${['script', ...extensions, 'js'].join('.')}`,
    }),
  ),

  esbuild.build({
    ...baseConfig,
    entryPoints: ['src/identity-agent.js'],
    define: {
      'process.env.DUB_FINGERPRINT_PUBLIC_KEY': JSON.stringify(
        process.env.DUB_FINGERPRINT_PUBLIC_KEY ?? '',
      ),
    },
    outfile: 'dist/analytics/identity-agent.js',
  }),
]).catch(() => process.exit(1));
