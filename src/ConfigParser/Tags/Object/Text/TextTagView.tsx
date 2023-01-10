import { useSettings } from '@atoms/Models/SettingsAtom/Hooks';
import { defineTagView } from '@tags/Base/Base/BaseTagController';
import { BaseTagView } from '@tags/Base/Base/BaseTagView';
import { FC, forwardRef, useRef } from 'react';
import { LoadingIndicator } from 'src/common/LoadingIndicator/LoadingIndicator';
import { Block, Elem } from 'src/utils/bem';
import './TextTag.styl';
import { TextTagController } from './TextTagController';
import { useIFrameHandler, useTextHandlers, useTextValue } from './TextTagHooks';
import { TextTagViewController, TextTagViewControllerClass } from './TextTagTypes';

export const CreateTextView = function <T extends TextTagViewControllerClass>(): BaseTagView<T> {
  return ({ controller }) => {
    const [settings] = useSettings();
    const loadingRef = useRef<HTMLElement>();
    const isText = controller.type === 'text';
    const inline = controller.inline.value ?? true;
    const value = useTextValue(controller.value.value, isText);

    if (!value) return null;

    return (
      <Block name="richtext">
        {!inline && (
          <Elem name="loading" ref={loadingRef}>
            <LoadingIndicator />
          </Elem>
        )}

        <TextContent
          isText={controller.type === 'text'}
          inline={inline}
          value={value}
          controller={controller}
          showLineNumbers={settings.showLineNumbers}
          setOriginalNodeRef={controller.setOriginalNodeRef}
          setVisibleNodeRef={controller.setVisibleNodeRef}
          setWorkingNodeRef={controller.setWorkingNodeRef}
        />
      </Block>
    );
  };
};

type TextContentProps = {
  inline: boolean,
  isText: boolean,
  showLineNumbers: boolean,
  value: string,
  controller: TextTagViewController,
  setVisibleNodeRef: (el: HTMLIFrameElement) => void,
  setOriginalNodeRef: (el: HTMLIFrameElement) => void,
  setWorkingNodeRef: (el: HTMLIFrameElement) => void,
}

const TextContent: FC<TextContentProps> = ({
  inline,
  isText,
  showLineNumbers,
  value,
  controller,
  setVisibleNodeRef,
  setOriginalNodeRef,
  setWorkingNodeRef,
}) => {
  const handlers = useTextHandlers(null, controller);
  const iframeHandler = useIFrameHandler(null, controller, handlers);

  return (
    <>
      <TextIframe
        name="root"
        inline={inline}
        value={value}
        ref={el => {
          // TODO: implemet async tags
          // item.setReady(false);
          setVisibleNodeRef(el as HTMLIFrameElement);
        }}
        data-linenumbers={isText && showLineNumbers ? 'enabled' : 'disabled'}
        className="htx-richtext"
        onLoad={iframeHandler}
        handlers={handlers}
      />
      <TextIframe
        name="orig-iframe"
        inline={inline}
        value={value}
        ref={el => setOriginalNodeRef(el as HTMLIFrameElement)}
        className="htx-richtext-orig"
      />
      <TextIframe
        name="work-iframe"
        inline={inline}
        ref={el => setWorkingNodeRef(el as HTMLIFrameElement)}
        className="htx-richtext-work"
      />
    </>
  );
};

type TextIframeProps = {
  name: string,
  value?: string,
  onLoad?: () => void,
  className?: string,
  inline?: boolean,
  lineNumbers?: boolean,
  handlers?: ReturnType<typeof useTextHandlers>,
}

const TextIframe = forwardRef<HTMLElement, TextIframeProps>(({
  inline,
  name,
  value,
  onLoad,
  className,
  lineNumbers,
  handlers,
}, ref) => {

  return inline ? (
    <Elem
      tag="div"
      key={name}
      name={name}
      className={className}
      data-linenumbers={lineNumbers ? 'enabled' : 'disabled'}
      ref={(el: HTMLDivElement) => {
        inline && onLoad?.();
        if (ref instanceof Function) ref(el);
        else if (ref) ref.current = el;
      }}
      dangerouslySetInnerHTML={{ __html: value }}
      {...(handlers ?? {})}
    />
  ) : (
    <Elem
      tag="iframe"
      key={name}
      name={name}
      className={className}
      referrerPolicy="no-referrer"
      sandbox="allow-same-origin allow-scripts"
      data-linenumbers={lineNumbers ? 'enabled' : 'disabled'}
      ref={ref}
      srcDoc={value}
      onLoad={onLoad}
    />
  );
});

const TextTagView = defineTagView(
  TextTagController,
  CreateTextView<typeof TextTagController>(),
);

export { TextTagView, TextTagController };
