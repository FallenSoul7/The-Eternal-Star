function readPackage(pkg, context) {
  // Allow all build scripts for these packages
  if (
    pkg.name === 'esbuild' ||
    pkg.name === 'msgpackr-extract' ||
    pkg.name === 'sharp' ||
    pkg.name === 'unrs-resolver'
  ) {
    pkg.scripts = pkg.scripts || {};
    // Add a dummy install script to trigger execution if necessary
    pkg.scripts.install = "node -e 'console.log(\"Approving build for " + pkg.name + "\")'";
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};
