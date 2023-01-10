import { TagType } from '@tags/Base/Base/BaseTagController';
import { BaseObjectTagController } from '@tags/Base/BaseObject/BaseObjectTagController';
import { createRef, MutableRefObject } from 'react';
import { attr } from 'src/ConfigParser/ConfigTree/Attributes/AttributeCreators';
import './TextTagView';

class TextTagController extends BaseObjectTagController {
  static type = TagType.text;

  /** ATTRIBUTES */
  /**
   * Represents a value to be displayed in the interface. Could be either plain text/html
   * or a url to a resource.
   */
  value = attr.dataValue();

  /** Defines the type of data to be shown */
  valuetype = attr.oneOf(['text', 'url'], window.LS_SECURE_MODE ? 'url' : 'text');

  /** Inlines content into the page instead of using iframe */
  inline = attr.boolean(false);

  /** Whether or not to save selected text to the serialized data */
  savetextresult = attr.boolean(window.LS_SECURE_MODE ? false : true);

  selectionenabled = attr.boolean(true);

  clickablelinks = attr.boolean(false).required();

  highlightcolor = attr.string();

  showlabels = attr.boolean();

  encoding = attr.oneOf(['none', 'base64', 'base64unicode'], 'none');

  granularity = attr.oneOf(['symbol', 'word', 'sentence', 'paragraph'], 'symbol');

  /** ATTRIBUTES */
  visibleNodeRef = createRef() as MutableRefObject<HTMLIFrameElement>;
  originalContentRef = createRef() as MutableRefObject<HTMLIFrameElement>;
  workingNodeRef = createRef() as MutableRefObject<HTMLIFrameElement>;

  setVisibleNodeRef = (ref: HTMLIFrameElement) => {
    this.setRef(this.visibleNodeRef, ref);
  };

  setOriginalNodeRef = (ref: HTMLIFrameElement) => {
    this.setRef(this.originalContentRef, ref);
  };

  setWorkingNodeRef = (ref: HTMLIFrameElement) => {
    this.setRef(this.workingNodeRef, ref);
  };

  markObjectAsLoaded() {
    console.log('loaded');
  }

  private setRef<T>(ref: MutableRefObject<T>, value: T) {
    if (!ref.current) return;

    if (ref.current instanceof Function) {
      ref.current(value);
    }

    ref.current = value;
  }
}

export { TextTagController };
