/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

// React Native shouldn't be exporting itself like this, the Community Template should be be directly
// depending on and injecting:
// - @react-native-community/cli-platform-android
// - @react-native-community/cli-platform-ios
// - @react-native/community-cli-plugin (via the @react-native/core-cli-utils package)
// - codegen command should be inhoused into @react-native-community/cli
//
// This is a temporary workaround.

const verbose = process.env.DEBUG && process.env.DEBUG.includes('react-native');

function findCommunityPlatformPackage(spec, startDir = process.cwd()) {
  try {
    // In monorepos, we cannot make any assumptions on where
    // `@react-native-community/*` gets installed. The safest way to find it
    // (barring adding an optional peer dependency) is to start from the project
    // root, assuming the project root is the current working directory.
    const main = require.resolve(spec, { paths: [startDir] });
    return require(main);
  } catch (_) {
    return require(spec);
  }
}

let android;
try {
  android = findCommunityPlatformPackage('@react-native-community/cli-platform-android');
} catch {
  if (verbose) {
    console.warn(
      '@react-native-community/cli-platform-android not found, the react-native.config.js may be unusable.',
    );
  }
}

let ios;
try {
  ios = findCommunityPlatformPackage('@react-native-community/cli-platform-ios');
} catch {
  if (verbose) {
    console.warn(
      '@react-native-community/cli-platform-ios not found, the react-native.config.js may be unusable.',
    );
  }
}

const commands = [];

try {
  const {
    bundleCommand,
    startCommand,
  } = require('@react-native/community-cli-plugin');
  commands.push(bundleCommand, startCommand);
} catch (e) {
  const known =
    e.code === 'MODULE_NOT_FOUND' &&
    e.message.includes('@react-native-community/cli-server-api');

  if (!known) {
    throw e;
  }

  if (verbose) {
    console.warn(
      '@react-native-community/cli-server-api not found, the react-native.config.js may be unusable.',
    );
  }
}

const codegenCommand = {
  name: 'codegen',
  options: [
    {
      name: '--path <path>',
      description: 'Path to the React Native project root.',
      default: process.cwd(),
    },
    {
      name: '--platform <string>',
      description:
        'Target platform. Supported values: "android", "ios", "all".',
      default: 'all',
    },
    {
      name: '--outputPath <path>',
      description: 'Path where generated artifacts will be output to.',
    },
  ],
  func: (argv, config, args) =>
    require('./scripts/codegen/generate-artifacts-executor').execute(
      args.path,
      args.platform,
      args.outputPath,
    ),
};

commands.push(codegenCommand);

const config = {
  commands,
  platforms: {},
};

if (ios != null) {
  config.commands.push(...ios.commands);
  config.platforms.ios = {
    projectConfig: ios.projectConfig,
    dependencyConfig: ios.dependencyConfig,
  };
}

if (android != null) {
  config.commands.push(...android.commands);
  config.platforms.android = {
    projectConfig: android.projectConfig,
    dependencyConfig: android.dependencyConfig,
  };
}

module.exports = config;
