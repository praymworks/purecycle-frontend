import React from 'react';
import Modal from './Modal';
import { Button } from '../ui';

const ViewModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'lg',
  closeText = 'Close',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        footer || (
          <Button variant="outline" onClick={onClose}>
            {closeText}
          </Button>
        )
      }
    >
      {children}
    </Modal>
  );
};

export default ViewModal;
