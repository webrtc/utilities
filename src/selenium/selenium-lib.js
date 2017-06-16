/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';

// https://code.google.com/p/selenium/wiki/WebDriverJs
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var firefox = require('selenium-webdriver/firefox');
var edge = require('selenium-webdriver/edge');
var fs = require('fs');

var sharedDriver = null;

function getBrowserVersion() {
  var browser = process.env.BROWSER;
  var browserChannel = process.env.BVER;
  var symlink = './browsers/bin/' + browser + '-' + browserChannel + '/';
  var symPath = fs.readlink(symlink);

  // Browser reg expressions and position to look for the milestone version.
  var chromeExp = '/Chrom(e|ium)\/([0-9]+)\./';
  var firefoxExp = '/Firefox\/([0-9]+)\./';
  var chromePos = 2;
  var firefoxPos = 1;

  var browserVersion = function(path, expr, pos) {
    var match = path.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
  };

  switch (browser) {
    case 'chrome':
      return browserVersion(symPath, chromeExp, chromePos);
    case 'firefox':
      return browserVersion(symPath, firefoxExp, firefoxPos);
    default:
      return 'non supported browser.';
  }
}

function buildDriver() {
  if (sharedDriver) {
    return sharedDriver;
  }
  // Enable console logging. Add logging for firefox once it's supported
  // properly-
  var logging = webdriver.logging;
  var prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

  // Firefox options.
  // http://selenium.googlecode.com/git/docs/api/javascript/module_selenium-webdriver_firefox.html
  var profile = new firefox.Profile();
  profile.setPreference('media.navigator.streams.fake', true);
  // This enables device labels for enumerateDevices when using fake devices.
  profile.setPreference('media.navigator.permission.disabled', true);
  // Currently the FF webdriver extension is not signed and FF 41 no longer
  // allows unsigned extensions by default.
  // TODO: Remove this once FF no longer allow turning this off and the
  // selenium team starts making a signed FF webdriver extension.
  // https://github.com/SeleniumHQ/selenium/issues/901.
  profile.setPreference('xpinstall.signatures.required', false);

  var firefoxOptions = new firefox.Options()
      .setProfile(profile)
      .setBinary('node_modules/.bin/start-firefox');

  // Chrome options.
  // http://selenium.googlecode.com/git/docs/api/javascript/module_selenium-webdriver_chrome_class_Options.html#addArguments
  var chromeOptions = new chrome.Options()
      .setChromeBinaryPath('node_modules/.bin/start-chrome')
      .addArguments('allow-file-access-from-files')
      .addArguments('use-fake-device-for-media-stream')
      .addArguments('use-fake-ui-for-media-stream')
      .addArguments('disable-translate')
      .addArguments('no-process-singleton-dialog')
      .addArguments('mute-audio')
      .setLoggingPrefs(prefs);

  // Only enable this for Chrome >= 49.
  if (process.env.BROWSER === 'chrome' && getBrowserVersion >= '49') {
    chromeOptions.addArguments('--enable-experimental-web-platform-features');
  }

  var edgeOptions = new edge.Options();

  sharedDriver = new webdriver.Builder()
      .forBrowser(process.env.BROWSER)
      .setFirefoxOptions(firefoxOptions)
      .setChromeOptions(chromeOptions)
      .setEdgeOptions(edgeOptions);

  if (process.env.BROWSER === 'firefox' && getBrowserVersion >= '47') {
    sharedDriver.getCapabilities().set('marionette', true);
  }
  sharedDriver = sharedDriver.build();

  // Set global executeAsyncScript() timeout (default is 0) to allow async
  // callbacks to be caught in tests.
  sharedDriver.manage().timeouts().setScriptTimeout(2000);

  return sharedDriver;
}

// Webdriver logging output only prints the first argument for console.log.
// trace in common.js in the webrtc/samples prefixes a timestamp as a first
// argument. This overrides this to ensure we can get full console logging.
function overrideTrace(driver) {
  driver.executeScript('window.trace = function(arg) { console.log(arg); };');
}

// A helper function to query stats from a PeerConnection.
function getStats(driver, peerConnection) {
  // Execute getStats on peerconnection named `peerConnection`.
  driver.manage().timeouts().setScriptTimeout(1000);
  return driver.executeAsyncScript(
      'var callback = arguments[arguments.length - 1];' +
      peerConnection + '.getStats(null).then(function(report) {' +
      '  callback(report.entries ? [...report.entries()] : report);' +
      '});')
    .then(function(entries) {
      if (Array.isArray(entries)) {
        return new Map(entries);
      }
      return entries;
    });
}

// Provide the webdriver driver and type of logging:
// https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/logging_exports_Type.html
// Browser console logs: webdriver.logging.Type.BROWSER
// WebDriver driver logs: webdriver.logging.Type.DRIVER
function getLogs(driver, type) {
  // https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_Logs.html
  driver.manage().logs().get(type)
  .then(function(entries) {
    return entries;
  });
}

// Provide the webdriver driver and type of logging:
// https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/logging_exports_Type.html
// Browser console logs: webdriver.logging.Type.BROWSER
// WebDriver driver logs: webdriver.logging.Type.DRIVER
function printLogs(driver, type) {
  // https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/lib/webdriver_exports_Logs.html
  driver.manage().logs().get(type)
  .then(function(entries) {
    entries.forEach(function(entry) {
      console.log('[%s] %s', entry.level.name, entry.message);
    });
  });
}

module.exports = {
  buildDriver: buildDriver,
  getStats: getStats,
  getLogs: getLogs,
  overrideTrace: overrideTrace,
  printLogs: printLogs
};
