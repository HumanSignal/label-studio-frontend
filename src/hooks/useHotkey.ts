import Keymaster from "keymaster";
import { useEffect, useRef } from "react";
import { Hotkey } from "../core/Hotkey";

const hotkeys = Hotkey();

export const useHotkey = (hotkey?: string, handler?: Keymaster.KeyHandler) => {
  const currentHotkey = useRef<string | null>(null);
  const currentHandler = useRef<Keymaster.KeyHandler | null>(null);

  useEffect(() => {
    const hotkeyChanged = hotkey !== currentHotkey.current;
    const handlerChanged = handler !== currentHandler.current;

    if (hotkeyChanged || handlerChanged) {
      if (hotkey && handler) {
        if (Hotkey.keymap[hotkey]) {
          console.log(`added named hotkey ${hotkey}`);
          hotkeys.overwriteNamed(hotkey, handler);
        } else {
          console.log(`added hotkey ${hotkey}`);
          hotkeys.overwriteKey(hotkey, handler);
        }

        currentHotkey.current = hotkey;
        currentHandler.current = handler;
      } else if (currentHotkey.current && (!hotkey || !handler)) {
        if (Hotkey.keymap[currentHotkey.current]) {
          console.log(`removed named hotkey ${hotkey}`);
          hotkeys.removeNamed(currentHotkey.current);
        } else {
          console.log(`removed hotkey ${hotkey}`);
          hotkeys.removeKey(currentHotkey.current);
        }

        currentHotkey.current = null;
        currentHandler.current = null;
      }
    }
  }, [hotkey, handler]);
};
