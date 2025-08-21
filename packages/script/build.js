const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const baseConfig = {
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2015',
};

// Helper to read and combine files
const combineFiles = (files) => {
  // Just concatenate the files, esbuild will handle the IIFE wrapping
  return files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
};

// Ensure dist/analytics exists
fs.mkdirSync(path.join(__dirname, 'dist/analytics'), { recursive: true });

// Copy _redirects to dist folder
fs.copyFileSync(
  path.join(__dirname, 'public/_redirects'),
  path.join(__dirname, 'dist/_redirects'),
);

// Build all variants (8 total combinations of 3 extensions)
Promise.all([
  // 1. Base script (no extensions)
  esbuild.build({
    ...baseConfig,
    stdin: {
      contents: fs.readFileSync('src/base.js', 'utf8'),
      resolveDir: __dirname,
      sourcefile: 'base.js',
    },
    outfile: 'dist/analytics/script.js',
  }),

  // 2. Site visit only
  esbuild.build({
    ...baseConfig,
    stdin: {
      contents: combineFiles(['src/base.js', 'src/extensions/site-visit.js']),
      resolveDir: __dirname,
      sourcefile: 'combined.js',
    },
    outfile: 'dist/analytics/script.site-visit.js',
  }),

  // 3. Outbound domains only
  esbuild.build({
    ...baseConfig,
    stdin: {
      contents: combineFiles([
        'src/base.js',
        'src/extensions/outbound-domains.js',
      ]),
      resolveDir: __dirname,
      sourcefile: 'combined.js',
    },
    outfile: 'dist/analytics/script.outbound-domains.js',
  }),

  // 4. Conversion tracking only
  esbuild.build({
    ...baseConfig,
    stdin: {
      contents: combineFiles([
        'src/base.js',
        'src/extensions/conversion-tracking.js',
      ]),
      resolveDir: __dirname,
      sourcefile: 'combined.js',
    },
    outfile: 'dist/analytics/script.conversion-tracking.js',
  }),

  // 5. Site visit + Outbound domains
  esbuild.build({
    ...baseConfig,
    stdin: {
      contents: combineFiles([
        'src/base.js',
        'src/extensions/site-visit.js',
        'src/extensions/outbound-domains.js',
      ]),
      resolveDir: __dirname,
      sourcefile: 'combined.js',
    },
    outfile: 'dist/analytics/script.site-visit.outbound-domains.js',
  }),

  // 6. Site visit + Conversion tracking
  esbuild.build({
    ...baseConfig,
    stdin: {
      contents: combineFiles([
        'src/base.js',
        'src/extensions/site-visit.js',
        'src/extensions/conversion-tracking.js',
      ]),
      resolveDir: __dirname,
      sourcefile: 'combined.js',
    },
    outfile: 'dist/analytics/script.site-visit.conversion-tracking.js',
  }),

  // 7. Outbound domains + Conversion tracking
  esbuild.build({
    ...baseConfig,
    stdin: {
      contents: combineFiles([
        'src/base.js',
        'src/extensions/outbound-domains.js',
        'src/extensions/conversion-tracking.js',
      ]),
      resolveDir: __dirname,
      sourcefile: 'combined.js',
    },
    outfile: 'dist/analytics/script.outbound-domains.conversion-tracking.js',
  }),

  // 8. All extensions combined
  esbuild.build({
    ...baseConfig,
    stdin: {
      contents: combineFiles([
        'src/base.js',
        'src/extensions/site-visit.js',
        'src/extensions/outbound-domains.js',
        'src/extensions/conversion-tracking.js',
      ]),
      resolveDir: __dirname,
      sourcefile: 'combined.js',
    },
    outfile:
      'dist/analytics/script.site-visit.outbound-domains.conversion-tracking.js',
  }),
]).catch(() => process.exit(1));
