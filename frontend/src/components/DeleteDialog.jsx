// src/components/common/modal/DeleteDialog.jsx
const DeleteDialog = ({ onConfirm, title, description, children }) => {
  const handleClick = () => {
    const ok = window.confirm(
      `${title}\n\n${description ?? ""}`.trim()
    );
    if (ok && onConfirm) onConfirm();
  };

  // Wrap the trigger element so clicking it opens confirm
  return (
    <span onClick={handleClick}>
      {children}
    </span>
  );
};

export default DeleteDialog;