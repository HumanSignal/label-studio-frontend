import Keymaster from "keymaster";
import { useEffect, useRef } from "react";
import { Hotkey } from "../core/Hotkey";

const hotkeys = Hotkey();

const attachHotkey = (key: string, handler: Keymaster.KeyHandler) => {
  if (Hotkey.keymap[key]) {
    hotkeys.overwriteNamed(key, handler);
  } else {
    hotkeys.overwriteKey(key, handler);
  }
};

const removeHotkey = (key: string) => {
  if (Hotkey.keymap[key]) {
    hotkeys.removeNamed(key);
  } else {
    hotkeys.removeKey(key);
  }
};

export const useHotkey = (hotkey?: string, handler?: Keymaster.KeyHandler) => {
  const lastHotkey = useRef<string | null>(null);
  const handlerFunction = useRef<Keymaster.KeyHandler | undefined>(handler);

  // we wanna cache handler function so the prop change does not trigger re-attaching a hotkey
  // refs are perfect fit for this purpose as they're mutable and cached during hook lifecycle
  const handlerWrapper = useRef<Keymaster.KeyHandler>((e, h) => {
    handlerFunction.current?.(e, h);
  });

  useEffect(() => {
    const hotkeyChanged = hotkey !== lastHotkey.current;

    // hotkey itself only references a cached version of a function
    // so it's never re-attached even if handler changes
    // handler update might happen if it's wrapped with useCallback
    // and will trigger infinite loop if we use it as a dependency for
    // current effect
    (() => {
      if (!hotkeyChanged) return;

      if (hotkey) {
        attachHotkey(hotkey, handlerWrapper.current);
        lastHotkey.current = hotkey;
      } else if (lastHotkey.current && !hotkey) {
        removeHotkey(lastHotkey.current);
        lastHotkey.current = null;
      }
    })();
  }, [hotkey]);

  // by changing the ref we can ensure that render won't be
  // triggered as refs are mutable and doesn't trigger any updates
  useEffect(() => {
    handlerFunction.current = handler;
  }, [handler]);
};
