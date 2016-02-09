#
#  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
#
#  Use of this source code is governed by a BSD-style license
#  that can be found in the LICENSE file in the root of the source
#  tree.
#!/bin/sh

# Run with a default set of parameters
BINDIR=./browsers/bin
export BROWSER=${BROWSER-chrome}
export BVER=${BVER-stable}
BROWSERBIN=$BINDIR/$BROWSER-$BVER
if [ ! -x $BROWSERBIN ]; then
  echo "Installing browser"
  ./node_modules/travis-multirunner/setup.sh
fi
echo "Starting browser"
PATH=$PATH:./node_modules/.bin

node ./test/run-tests.js
