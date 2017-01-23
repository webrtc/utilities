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
      .addArguments('mute-audio');

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

// A helper function to get the audio level from a MediaStream using WebAudio.
function getAudioLevel() {
  var callback = arguments[arguments.length - 1];

  var remoteVideo = document.getElementById('remoteVideo');

  var context = new AudioContext();
  var analyzer = context.createAnalyser();
  analyzer.fftSize = 1024;

  var source = context.createMediaStreamSource(remoteVideo.srcObject);
  source.connect(analyzer);

  window.setTimeout(function() {
    var buffer = new Uint8Array(analyzer.fftSize);
    analyzer.getByteTimeDomainData(buffer);

    var rms = 0;
    for (var i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
    }
    rms /= buffer.length;
    rms = Math.sqrt(rms);

    analyzer.disconnect();
    source.disconnect();
    context.close();
    callback(rms);
  }, 500);
}

// Helper function to get the video width, height and brightness for a
// video element.
function getVideoWidthHeightBrightness() {
  var remoteVideo = document.getElementById('remoteVideo');
  if (remoteVideo.videoWidth < 10 && remoteVideo.videoHeight < 10) {
    return [0, 0, 0];
  }
  var canvas = document.createElement('canvas');
  canvas.width = remoteVideo.videoWidth;
  canvas.height = remoteVideo.videoHeight;

  var context = canvas.getContext('2d');
  context.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
  var data = context.getImageData(0, 0, canvas.width/10, canvas.height/10).data;

  // taken from https://github.com/webrtc/testrtc
  var accumulatedLuma = 0;
  for (var i = 0; i < data.length; i += 4) {
    accumulatedLuma += 0.21 * data[i] + 0.72 * data[i+1] + 0.07 * data[i+2];
  }
  return [remoteVideo.videoWidth, remoteVideo.videoHeight, accumulatedLuma];
}

module.exports = {
  buildDriver: buildDriver,
  getAudioLevel: getAudioLevel,
  getStats: getStats,
  getVideoWidthHeightBrightness: getVideoWidthHeightBrightness
};
