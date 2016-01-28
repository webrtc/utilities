/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* jshint node: true */

'use strict';

// This is a basic test file for use with testling and webdriver.
// The test script language comes from tape.
var test = require('tape');

// Start of tests.

test('Check Selenium lib buildDriver method', function(t) {
  var driver = require('../main.js').seleniumLib.buildDriver();

  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.pass('Page loaded, buildDriver OK.');
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});
