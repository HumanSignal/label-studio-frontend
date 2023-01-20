import { createRef } from 'react';
import { render } from 'react-dom';
import { cn } from '../../utils/bem';
import { Button, ButtonProps } from '../Button/Button';
import { Space } from '../Space/Space';
import { Modal, ModalProps } from './ModalPopup';

const standaloneModal = (props: ModalProps) => {
  const modalRef = createRef<Modal>();
  const rootDiv = document.createElement('div');

  rootDiv.className = cn('modal-holder').toClassName();

  document.body.appendChild(rootDiv);

  const renderModal = (props: ModalProps, animate?: boolean) => {
    render(
      <Modal
        ref={modalRef}
        {...props}
        onHide={() => {
          props.onHidden?.();
          rootDiv.remove();
        }}
        animateAppearance={animate}
      />,
      rootDiv,
    );
  };

  renderModal(props, true);

  return {
    update(newProps: ModalProps) {
      renderModal({ ...props, ...(newProps ?? {}) }, false);
    },
    close() {
      modalRef.current?.hide();
    },
  };
};

type ConfirmProps = {
  okText?: string,
  onOk?: () => void,
  cancelText?: string,
  onCancel?: () => void,
  buttonLook?: ButtonProps['look'],
} & ModalProps;

export const confirm = ({ okText, onOk, cancelText, onCancel, buttonLook, ...props }: ConfirmProps) => {
  const modal = standaloneModal({
    ...props,
    allowClose: false,
    footer: (
      <Space align="end">
        <Button
          onClick={() => {
            onCancel?.();
            modal.close();
          }}
          size="compact"
          autoFocus
        >
          {cancelText ?? 'Cancel'}
        </Button>

        <Button
          onClick={() => {
            onOk?.();
            modal.close();
          }}
          size="compact"
          look={buttonLook ?? 'primary'}
        >
          {okText ?? 'OK'}
        </Button>
      </Space>
    ),
  });

  return modal;
};

type InfoProps = {
  okText?: string,
  onOkPress?: () => void,
} & ModalProps

export const info = ({ okText, onOkPress, ...props }: InfoProps) => {
  const modal = standaloneModal({
    ...props,
    footer: (
      <Space align="end">
        <Button
          onClick={() => {
            onOkPress?.();
            modal.close();
          }}
          look="primary"
          size="compact"
        >
          {okText ?? 'OK'}
        </Button>
      </Space>
    ),
  });

  return modal;
};

export { standaloneModal as modal };
export { Modal };

Object.assign(Modal, {
  info,
  confirm,
  modal: standaloneModal,
});
