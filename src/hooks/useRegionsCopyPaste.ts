import { useEffect } from 'react';

export const useRegionsCopyPaste = (entity: any) => {
  useEffect(()=>{
    const copyToClipboard = (ev: ClipboardEvent) => {
      const { clipboardData } = ev;
      const results = entity.serializedSelection;

      clipboardData?.setData('application/json', JSON.stringify(results));
      ev.preventDefault();
    };

    const pasteFromClipboard = (ev: ClipboardEvent) => {
      const { clipboardData } = ev;
      const data = clipboardData?.getData('application/json');

      try {
        const results = data ? JSON.parse(data) : {};

        entity.appendResults(results);
        ev.preventDefault();
      } catch (e) {
        return;
      }
    };

    const copyHandler = (ev: Event) =>{
      const selection = window.getSelection();
      const exceptionList = ['input', 'textarea'];
      const target = (ev.target as HTMLElement | null)?.tagName?.toLowerCase();

      if (!selection?.isCollapsed || (target && exceptionList.includes(target))) return;

      copyToClipboard(ev as ClipboardEvent);
    };

    const pasteHandler = (ev: Event) =>{
      const selection = window.getSelection();
      const focusNode = selection?.focusNode;

      if (Node.ELEMENT_NODE === focusNode?.nodeType && ('focus' in focusNode)) return;

      pasteFromClipboard(ev as ClipboardEvent);
    };

    const cutHandler = (ev: Event) =>{
      const selection = window.getSelection();

      if (!selection?.isCollapsed) return;

      copyToClipboard(ev as ClipboardEvent);
      entity.deleteSelectedRegions();
    };

    window.addEventListener('copy', copyHandler);
    window.addEventListener('paste', pasteHandler);
    window.addEventListener('cut', cutHandler);
    return () => {
      window.removeEventListener('copy', copyHandler);
      window.removeEventListener('paste', pasteHandler);
      window.removeEventListener('cut', cutHandler);
    };
  }, [entity.pk ?? entity.id]);
};
