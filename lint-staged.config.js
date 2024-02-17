const fs = require('fs');

module.exports = {
  '*': (files) => {
    const realFiles = files.filter(
      (file) => !fs.lstatSync(file).isSymbolicLink(),
    );
    return `prettier --write --ignore-unknown ${realFiles.join(' ')}`;
  },
};
