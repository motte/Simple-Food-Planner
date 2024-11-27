import React from 'react';
import './Modal.css'; // Optional: Add styles for the modal

interface ModalProps {
  onClose: () => void; // Define the type for onClose
  children: React.ReactNode; // Add children prop for custom content
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close the modal if the overlay is clicked
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ resize: 'both', overflow: 'auto' }}>
        <div onClick={onClose} style={{color: '#141414', cursor: 'pointer'}}>Close</div>
        <hr style={{border: '0.1px solid #ddd'}}/>
        {children} {/* Render custom content here */}
      </div>
    </div>
  );
};

export default Modal;