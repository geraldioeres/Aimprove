import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

const SELF_HANDLED_ROLES = new Set(['button', 'link', 'tab', 'switch', 'checkbox', 'radio', 'menuitem']);

/**
 * Enter runs the screen's main action (Next, Start quiz…) on the web, as long
 * as the person isn't typing in a field or focused on a button: a field's own
 * submit and a focused button's own Enter take care of those, so nothing
 * fires twice. Pass null when there's nothing for Enter to do.
 */
export function useEnterKey(action: (() => void) | null) {
  // Screens stay mounted under the one on top; only the visible one listens.
  const focused = useRef(true);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
      };
    }, [])
  );
  const latest = useRef(action);
  latest.current = action;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || e.isComposing) return;
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el) {
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable) return;
        if (tag === 'BUTTON' || tag === 'A' || SELF_HANDLED_ROLES.has(el.getAttribute('role') || '')) return;
      }
      const run = latest.current;
      if (!run || !focused.current) return;
      e.preventDefault();
      run();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
