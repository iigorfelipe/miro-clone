"use cliente";

import { api } from "@/convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { toast } from "sonner";

import Modal from "@/components/modal";
import { Input } from "@/components/ui/input";
import { ReactNode, useEffect, useState } from "react";

interface UpdateModalProps {
  id: string;
  title: string;
  children: ReactNode;
};

export const UpdateModal = ({
  id,
  title,
  children,
}: UpdateModalProps) => {
  const [newTitle, setNewTitle] = useState(title);

  useEffect(() => {
    setNewTitle(title); 
  }, [title]);

  const { mutate, pending } = useApiMutation(api.board.update);

  const onSubmit = () => {
    mutate({ id, title: newTitle })
      .then(() => {
        toast.success("Board renamed");
        setNewTitle(newTitle);
      })
      .catch(() => toast.error("Failed to rename board"))
  };

  return (
    <Modal
      header="Edit board title"
      description="Edit a new title for this board."
      disabled={pending || newTitle.trim().length === 0 || title === newTitle}
      onConfirm={onSubmit}
      onCancel={() => {
        setNewTitle(title);
        return undefined;
      }}
      extraContent={
        <Input
          disabled={pending}
          required
          maxLength={60}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Board title"
        />
      }
    >
      {children}
    </Modal>
  );
};
