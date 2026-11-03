'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Two markers so a run is visible even if npm drops the environment variable.
fs.writeFileSync(path.join(__dirname, 'ran.txt'), 'ran\n');

const target = process.env.INSTALL_POLICY_RAN;
if (target) {
  fs.writeFileSync(target, 'ran\n');
}
