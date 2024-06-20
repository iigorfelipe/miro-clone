"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface ModalProps {
  children: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  header: string;
  disabled?: boolean;
  description?: string;
  extraContent?: React.ReactNode;
};

const Modal = ({
  children,
  onConfirm,
  onCancel,
  header,
  disabled,
  description,
  extraContent,
}: ModalProps) => {

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog>

      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>

      <AlertDialogContent>

        <AlertDialogHeader>

          <AlertDialogTitle>
            {header}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>

          {extraContent}

        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel || undefined}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={disabled}
            onClick={handleConfirm}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>

      </AlertDialogContent>

    </AlertDialog>
  );
};

export default Modal;
