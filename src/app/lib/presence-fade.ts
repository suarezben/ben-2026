/**
 * Keep presence fades on Motion's frame renderer. The installed Motion WAAPI
 * backend cancels the finished animation before its queued inline-style render.
 * Chromium can paint the underlying opacity: 1 in that gap, flashing outgoing
 * content before AnimatePresence removes it. An onUpdate subscriber selects the
 * JS renderer, which writes the final opacity before completing the exit.
 *
 * Deliberately limited to short content fades; logo motion remains CSS-driven.
 */
export const renderPresenceFade = () => {};
