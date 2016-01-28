/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';

// Add all modules to be exported here.
var seleniumLib = require('./src/selenium/selenium-lib.js');

module.exports = {
  seleniumLib: seleniumLib
};
