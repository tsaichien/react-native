/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

describe('AnimatedValue', () => {
  let NativeAnimatedHelper;
  let AnimatedValue;

  function createNativeAnimatedValue(): AnimatedValue {
    return new AnimatedValue(0, {useNativeDriver: true});
  }

  function emitMockUpdate(node: AnimatedValue, mockValue: number): void {
    const nativeTag = node.__nativeTag;
    expect(nativeTag).not.toBe(undefined);

    NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
      tag: nativeTag,
      value: mockValue,
    });
  }

  beforeEach(() => {
    jest.resetModules();

    jest.mock('../NativeAnimatedTurboModule', () => ({
      __esModule: true,
      default: {
        addListener: jest.fn(),
        createAnimatedNode: jest.fn(),
        dropAnimatedNode: jest.fn(),
        removeListeners: jest.fn(),
        startListeningToAnimatedNodeValue: jest.fn(),
        stopListeningToAnimatedNodeValue: jest.fn(),
        // ...
      },
    }));

    NativeAnimatedHelper =
      require('../../../src/private/animated/NativeAnimatedHelper').default;
    AnimatedValue = require('../nodes/AnimatedValue').default;

    jest.spyOn(NativeAnimatedHelper.API, 'createAnimatedNode');
    jest.spyOn(NativeAnimatedHelper.API, 'dropAnimatedNode');
  });

  it('emits update events for listeners added', () => {
    const callback = jest.fn();
    const node = createNativeAnimatedValue();
    node.__attach();
    const id = node.addListener(callback);

    const nativeTag = node.__nativeTag;
    expect(nativeTag).not.toBe(undefined);

    emitMockUpdate(node, 123);
    expect(callback).toBeCalledTimes(1);

    node.removeListener(id);

    emitMockUpdate(node, 456);
    expect(callback).toBeCalledTimes(1);
  });

  it('creates a native node on attach', () => {
    const node = createNativeAnimatedValue();
    node.__attach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
  });

  it('drops a created native node on detach', () => {
    const node = createNativeAnimatedValue();
    node.__attach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
    expect(NativeAnimatedHelper.API.dropAnimatedNode).toBeCalledTimes(0);

    node.__detach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
    expect(NativeAnimatedHelper.API.dropAnimatedNode).toBeCalledTimes(1);
  });

  it('emits update events for listeners added after re-attach', () => {
    const callbackA = jest.fn();
    const node = createNativeAnimatedValue();
    node.__attach();

    node.addListener(callbackA);
    emitMockUpdate(node, 123);
    expect(callbackA).toBeCalledTimes(1);

    node.__detach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);

    const callbackB = jest.fn();
    node.__attach();
    node.addListener(callbackB);

    emitMockUpdate(node, 456);
    expect(callbackA).toBeCalledTimes(1);
    expect(callbackB).toBeCalledTimes(1);
  });
});