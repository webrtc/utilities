/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */

'use strict';
var test = require('tape');

// Add all test files here with a short comment.

// Checks that the tests can start and that execution finishes.
require('./test');

// This is run as a test so it is executed after all tests
// have completed.
test('Shutdown', function(t) {
  var driver = require('../main.js').seleniumLib.buildDriver()
  driver.close()
  .then(function() {
    driver.quit().then(function() {
      t.end();
    });
  });
});
