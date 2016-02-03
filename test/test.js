/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */

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

test('Check Selenium lib getStats method', function(t) {
  if (process.env.BROWSER === 'firefox') {
    t.skip('getStats not supported on Firefox.');
    t.end();
    return;
  }
  var driver = require('../main.js').seleniumLib.buildDriver();
  var getStats = require('../main.js').seleniumLib.getStats;

  driver.get('file://' + process.cwd() + '/test/testpage.html')
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeScript('window.pc1 = new RTCPeerConnection();' +
        'return window.pc1;');
  })
  .then(function(peerConnection) {
    if (typeof peerConnection.remoteDescription === 'object') {
      t.pass('PeerConnection created, calling on getStats.')
      return getStats(driver, 'pc1');
    }
  })
  .then(function(response) {
    for (var object in response) {
      t.ok(object.toString().match('googLibjingleSession_') !== null,
          'getStats response OK!');
    }
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});
