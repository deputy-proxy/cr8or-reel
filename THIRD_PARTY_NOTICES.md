# Third-party notices

## React Bits / Lightfall

The Lightfall background in `src/backgrounds/Lightfall.jsx` is adapted from the public React Bits Lightfall implementation by David Haz / React Bits.

Source: https://github.com/DavidHDev/react-bits
Component: `src/content/Backgrounds/Lightfall/Lightfall.jsx`

React Bits is licensed under the MIT + Commons Clause License Condition v1.0. The component may be used as part of an application, website, or product, subject to the license conditions. The component itself must not be sold, sublicensed, or redistributed as a standalone component or port.

The cr8or-reel integration changes the animation clock only: browser preview uses a real-time animation loop, while Remotion rendering drives the same shader from `frame / fps` so the resulting MP4 is deterministic.
