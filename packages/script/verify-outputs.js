const fs = require('fs');

// Fails the build when an output is missing or empty, so a broken build never deploys
function verifyOutputs(files) {
  const broken = files.filter(
    (file) => !fs.existsSync(file) || fs.statSync(file).size === 0,
  );

  if (broken.length) {
    throw new Error(`Missing or empty build output: ${broken.join(', ')}`);
  }
}

module.exports = {
  verifyOutputs,
};
