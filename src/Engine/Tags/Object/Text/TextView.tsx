import { useTagRegions } from '@atoms/Models/AnnotationsAtom/Hooks/useAnnotationRegions';
import { defineTagView } from '@tags/Base/TagController';
import { TagView } from '@tags/Base/TagView';
import { LoadingIndicator } from '@UI/LoadingIndicator/LoadingIndicator';
import { FC, forwardRef, useEffect, useState } from 'react';
import { AnnotationAtom } from 'src/Engine/Atoms/Models/AnnotationsAtom/Types';
import { useSettings } from 'src/Engine/Atoms/Models/SettingsAtom/Hooks';
import { Block, Elem } from 'src/utils/bem';
import './Text.styl';
import { TextController } from './TextController';
import { useIFrameHandler, useTextHandlers, useTextValue } from './TextHooks';
import { TextViewController, TextViewControllerClass } from './TextTypes';

export const CreateTextView = function <T extends TextViewControllerClass>(): TagView<T> {
  return ({ controller, annotationAtom }) => {
    const [settings] = useSettings();
    const regions = useTagRegions(annotationAtom, controller.name.value);
    const isText = controller.type === 'text';
    const inline = controller.inline.value ?? true;
    const value = useTextValue(controller.value.value, isText);

    if (!value) return null;

    useEffect(() => {
      controller.applyHighlight();
    }, [regions]);

    return (
      <Block name="richtext">
        {!inline && <ContentPreloader isReady={controller.isReady}/>}

        <TagContent
          isText={controller.type === 'text'}
          inline={inline}
          value={value}
          controller={controller}
          annotationAtom={annotationAtom}
          showLineNumbers={settings.showLineNumbers}
          setOriginalNodeRef={controller.setOriginalNodeRef}
          setVisibleNodeRef={controller.setVisibleNodeRef}
          setWorkingNodeRef={controller.setWorkingNodeRef}
          onLoad={() => controller.markAsReady()}
        />
      </Block>
    );
  };
};

const ContentPreloader: FC<{
  isReady: PromiseLike<boolean>,
}> = ({
  isReady,
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isReady.then(() => {
      setLoading(false);
    });
  }, []);

  return loading ? (
    <Elem name="loading">
      <LoadingIndicator />
    </Elem>
  ) : null;
};

type TextContentProps = {
  inline: boolean,
  isText: boolean,
  showLineNumbers: boolean,
  annotationAtom: AnnotationAtom,
  value: string,
  controller: TextViewController,
  onLoad: () => void,
  setVisibleNodeRef: (el: HTMLIFrameElement) => void,
  setOriginalNodeRef: (el: HTMLIFrameElement) => void,
  setWorkingNodeRef: (el: HTMLIFrameElement) => void,
}

const TagContent: FC<TextContentProps> = ({
  inline,
  isText,
  showLineNumbers,
  value,
  controller,
  annotationAtom,
  onLoad,
  setVisibleNodeRef,
  setOriginalNodeRef,
  setWorkingNodeRef,
}) => {
  const handlers = useTextHandlers(null, controller, annotationAtom);
  const iframeHandler = useIFrameHandler(null, controller, handlers);

  return (
    <>
      <TextContainer
        name="root"
        inline={inline}
        value={value}
        ref={el => {
          // TODO: implemet async tags
          controller.markAsReady();
          setVisibleNodeRef(el as HTMLIFrameElement);
        }}
        data-linenumbers={isText && showLineNumbers ? 'enabled' : 'disabled'}
        className="htx-richtext"
        onLoad={() => {
          onLoad();
          iframeHandler();
        }}
        handlers={handlers}
      />
      <TextContainer
        name="orig-iframe"
        inline={inline}
        value={value}
        ref={el => setOriginalNodeRef(el as HTMLIFrameElement)}
        className="htx-richtext-orig"
      />
      <TextContainer
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

const TextContainer = forwardRef<HTMLElement, TextIframeProps>(({
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

const TextView = defineTagView(
  TextController,
  CreateTextView<typeof TextController>(),
);

export { TextView, TextController };
