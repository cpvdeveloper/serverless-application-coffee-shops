#!/bin/bash

set -o errexit # Exit on error
CWD=$(pwd)
BUILD_PATH_LAYERS=$CWD/layers
cd $CWD

# Package TypeScript code and zip
yarn install
yarn build
cd build
zip -q -r archive.zip functions/*

# Package node_modules as lambda layer
mkdir -p $BUILD_PATH_LAYERS
cp $CWD/package.json $BUILD_PATH_LAYERS/package.json
cd $BUILD_PATH_LAYERS
yarn install --production
mkdir -p ./nodejs
mv node_modules nodejs/node_modules
zip -q -r archive.zip *
rm -rf nodejs

cd $CWD
echo "Done."