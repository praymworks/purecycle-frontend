import React from 'react';
import Modal from './Modal';
import { Button } from '../ui';

const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  isLoading = false,
  size = 'md',
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : submitText}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {children}
      </form>
    </Modal>
  );
};

export default FormModal;
