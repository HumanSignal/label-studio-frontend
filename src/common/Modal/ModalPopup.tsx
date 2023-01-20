import { Component, ComponentClass, createRef, CSSProperties, FC, ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LsRemove } from '../../assets/icons';
import { BemWithSpecifiContext, cn } from '../../utils/bem';
import { aroundTransition } from '../../utils/transition';
import { Button } from '../Button/Button';
import './Modal.styl';

const { Block, Elem } = BemWithSpecifiContext();

type ModalContentNode = FC | ComponentClass | ReactNode | (() => ReactElement);

export type ModalTransition = (
  | 'before-appear'
  | 'appear'
  | 'before-disappear'
  | 'disappear'
  | 'visible'
)

export type ModalProps = {
  title?: string,
  body?: ModalContentNode,
  footer?: ModalContentNode,
  animateAppearance?: boolean,
  closeOnClickOutside?: boolean,
  bare?: boolean,
  fullscreen?: boolean,
  visible?: boolean,
  className?: string,
  allowClose?: boolean,
  style?: CSSProperties,
  onShow?: () => void,
  onHide?: () => void,
  onHidden?: () => void,
  children?: React.ReactNode,
}

export type ModalState = {
  title?: string,
  body?: ModalProps['body'],
  footer?: ModalProps['footer'],
  visible?: boolean,
  transition: ModalTransition | null,
}

export class Modal extends Component<ModalProps, ModalState> {
  static Header: typeof Header;
  static Footer: typeof Footer;

  modalRef = createRef<HTMLElement>();

  constructor(props: ModalProps) {
    super(props);

    this.state = {
      title: props.title,
      body: props.body,
      footer: props.footer,
      visible: props.animateAppearance ? false : props.visible ?? false,
      transition: props.visible ? 'visible' : null,
    };
  }

  componentDidMount() {
    if (this.props.animateAppearance) {
      setTimeout(() => this.show(), 30);
    }
  }

  setBody(body: ReactNode) {
    this.setState({ body });
  }

  show(onShow?: () => void) {
    return new Promise<void>(resolve => {
      this.setState({ visible: true }, async () => {
        onShow?.();
        this.props.onShow?.();
        await this.transition('appear', resolve);
      });
    });
  }

  async hide(onHidden?: () => void) {
    return new Promise<void>(resolve => {
      this.transition('disappear', () => {
        this.setState({ visible: false }, () => {
          this.props.onHide?.();
          resolve();
          onHidden?.();
        });
      });
    });
  }

  render() {
    if (!this.state.visible) return null;

    const bare = this.props.bare;

    const mods = {
      fullscreen: !!this.props.fullscreen,
      bare: this.props.bare,
      visible: this.props.visible || this.state.visible,
    };

    const mixes = [this.transitionClass, this.props.className];

    const modalContent = (
      <Block name="modal" ref={this.modalRef} mod={mods} mix={mixes} onClick={this.onClickOutside}>
        <Elem name="wrapper">
          <Elem name="content" style={this.props.style}>
            {!bare && (
              <Modal.Header>
                <Elem name="title">{this.state.title}</Elem>
                {this.props.allowClose !== false && (
                  <Elem tag={Button} name="close" type="text" icon={<LsRemove />} style={{ padding: 0 }} />
                )}
              </Modal.Header>
            )}
            <Elem name="body" mod={{ bare }}>
              {this.body}
            </Elem>
            {this.state.footer && <Modal.Footer>{this.footer}</Modal.Footer>}
          </Elem>
        </Elem>
      </Block>
    );

    console.log([
      this.body,
      this.state.body,
      this.props.children,
    ]);

    return createPortal(modalContent, document.body) as ReactNode;
  }

  onClickOutside = (e: MouseEvent) => {
    const { closeOnClickOutside } = this.props;
    const target = e.target as HTMLElement;
    const isInModal = this.modalRef.current?.contains(target);
    const content = cn('modal')
      .elem('content')
      .closest(target);
    const close = cn('modal')
      .elem('close')
      .closest(target);

    if ((isInModal && close) || (content === null && closeOnClickOutside !== false)) {
      this.hide();
    }
  };

  transition(type: 'appear' | 'disappear', onFinish?: () => void) {
    if (!this.modalRef.current) return Promise.resolve();

    return aroundTransition(this.modalRef.current, {
      transition: async () =>
        new Promise(resolve => {
          this.setState({ transition: type }, () => {
            resolve();
          });
        }),
      beforeTransition: async () =>
        new Promise(resolve => {
          this.setState({ transition: `before-${type}` }, () => {
            resolve();
          });
        }),
      afterTransition: async () =>
        new Promise(resolve => {
          this.setState({ transition: type === 'appear' ? 'visible' : null }, () => {
            onFinish?.();
            resolve();
          });
        }),
    });
  }

  get transitionClass() {
    switch (this.state.transition) {
      case 'before-appear':
        return 'before-appear';
      case 'appear':
        return 'appear before-appear';
      case 'before-disappear':
        return 'before-disappear';
      case 'disappear':
        return 'disappear before-disappear';
      case 'visible':
        return 'visible';
    }
    return null;
  }

  get body() {
    if (!this.state.body) this.props.children;

    const Body = this.state.body;

    return Body instanceof Function ? <Body /> : Body;
  }

  get footer() {
    if (!this.state.footer) return null;

    const Footer = this.state.footer;

    return Footer instanceof Function ? <Footer /> : Footer;
  }
}

const Header: FC<{
  divided?: boolean,
  children: ReactNode,
}> = ({ children, divided }) => (
  <Elem name="header" mod={{ divided }}>
    {children}
  </Elem>
);

const Footer: FC<{
  children: ReactNode,
}> = ({ children }) => <Elem name="footer">{children}</Elem>;

Modal.Header = Header;
Modal.Footer = Footer;
