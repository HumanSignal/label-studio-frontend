import { AnnotationAtom } from '@atoms/Models/AnnotationsAtom/Types';
import { LabelController } from '@tags/AllTags';
import { ObjectController } from '@tags/Base/Object/ObjectController';
import { TagType } from '@tags/Base/TagController';
import { createRef, MutableRefObject } from 'react';
import { attr } from 'src/Engine/ConfigTree/Attributes/AttributeCreators';
import { Awaiter } from 'src/utils/Awaiter';
import { NormedRange } from 'xpath-range';
import { TextResult } from './TextResult';
import { DoubleClickSelection } from './TextTypes';
import './TextView';

class TextAttributes extends ObjectController {
  static type = TagType.text;

  /** ATTRIBUTES */
  /**
   * Represents a value to be displayed in the interface. Could be either plain text/html
   * or a url to a resource.
   */
  value = attr.dataValue<string>().required();

  /** Defines the type of data to be shown */
  valuetype = attr.oneOf(['text', 'url'], window.LS_SECURE_MODE ? 'url' : 'text');

  /** Inlines content into the page instead of using iframe */
  inline = attr.boolean(false);

  /** Whether or not to save selected text to the serialized data */
  savetextresult = attr.boolean(window.LS_SECURE_MODE ? false : true);

  selectionenabled = attr.boolean(true);

  clickablelinks = attr.boolean(false);

  highlightcolor = attr.string();

  showlabels = attr.boolean();

  encoding = attr.oneOf(['none', 'base64', 'base64unicode'], 'none');

  granularity = attr.oneOf(['symbol', 'word', 'sentence', 'paragraph'], 'symbol');
}

class TextController extends TextAttributes {
  /** INTERNAL PROPERTIES */
  visibleNodeRef = createRef() as MutableRefObject<HTMLIFrameElement>;
  originalContentRef = createRef() as MutableRefObject<HTMLIFrameElement>;
  workingNodeRef = createRef() as MutableRefObject<HTMLIFrameElement>;
  iframeLoaded = Awaiter<boolean>();

  /** Ref controls */
  setVisibleNodeRef = (ref: HTMLIFrameElement) => {
    this.setRef(this.visibleNodeRef, ref);
  };

  setOriginalNodeRef = (ref: HTMLIFrameElement) => {
    this.setRef(this.originalContentRef, ref);
  };

  setWorkingNodeRef = (ref: HTMLIFrameElement) => {
    this.setRef(this.workingNodeRef, ref);
  };

  /** Controller utils */
  setHighlight() {
    console.warn('Not implemented setHighlight');
  }

  applyHighlight() {
    console.warn('Not implemented applyHighlight');
  }

  selectRegions(multiselect: boolean) {
    console.warn('Not implemented selectRegions', multiselect);
  }

  addRegion(
    annotationAtom: AnnotationAtom,
    fromName: string,
    input: {
      xpathRange: NormedRange,
      nativeRange: Range,
      isText: boolean,
      text: string,
      dynamic: boolean,
      selectedLabels: LabelController[],
      doubleClick: DoubleClickSelection | null,
    },
  ) {
    if (input.selectedLabels.length === 0) return;

    const resultValue = new TextResult(this.sdk.store);

    // const result = this.sdk.annotations.createResult(resultValue, annotationAtom, {
    //   fromName,
    //   toName: this.name.value,
    //   type: this.type,
    // });

    // const labels = input.doubleClick?.value ?? input.selectedLabels.map((l) => l.value.value);
    const root = this.originalContentRef.current?.contentDocument?.body;

    resultValue.configure({
      xpathRange: input.xpathRange,
      range: input.nativeRange,
      text: input.text,
    });

    resultValue.updateGlobalOffsets(root);
  }

  /**
   * Marks the object tag as fully loaded. Called whenever
   * all the async work is done.
   */
  markObjectAsLoaded() {
    this.iframeLoaded.resolve(true);
  }

  private setRef<T>(ref: MutableRefObject<T>, value: T) {
    if (ref.current instanceof Function) {
      ref.current(value);
    }

    ref.current = value;
  }
}

export { TextController };
