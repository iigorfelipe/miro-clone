"use cliente";

import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import Modal from "./modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface ActionsProps {
  children: React.ReactNode;
  id: string;
  title: string;
  side?: DropdownMenuContentProps["side"];
  sideOffset?: DropdownMenuContentProps["sideOffset"];
};

const Actions = ({
  children,
  id,
  title,
  side,
  sideOffset,
}: ActionsProps) => {
  const [newTitle, setNewTitle] = useState(title);

  useEffect(() => {
    setNewTitle(title); 
  }, [title]);

  const { mutate, pending } = useApiMutation(api.board.remove);
  const {
    mutate: mutatePath,
    pending: pendingPath
  } = useApiMutation(api.board.update);

  const onDelete = () => {
    mutate({ id })
      .then(() => toast.success("Board deleted"))
      .catch(() => toast.error("Failed to delete board"));
  };

  const onCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/board/${id}`
    )
  };

  const onSubmit = () => {
    mutatePath({ id, title: newTitle })
      .then(() => {
        toast.success("Board renamed");
        setNewTitle(newTitle);
      })
      .catch(() => toast.error("Failed to rename board"))
  };

  return (
    <DropdownMenu>
      
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        onClick={(e) => e.stopPropagation()}
        side={side}
        sideOffset={sideOffset}
        className="w-60"
      >
        <DropdownMenuItem 
          onClick={onCopyLink}
          className="p-3 cursor-pointer"
        >
          <Link2 className="h-4 w-4 mr-2" />
          Copy board link
        </DropdownMenuItem>

        {/* <DropdownMenuItem 
          onClick={() => onOpen(id, title)}
          className="p-3 cursor-pointer"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem> */}

        <Modal
          header="Edit board title"
          description="Edit a new title for this board."
          disabled={pendingPath || newTitle.trim().length === 0 || title === newTitle}
          onConfirm={onSubmit}
          onCancel={() => {
            setNewTitle(title);
            return undefined;
          }}
          extraContent={
            <Input
              disabled={pendingPath}
              required
              maxLength={60}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Board title"
            />
          }
        >
          <Button
            variant="ghost"
            // onClick={onDelete}
            className="p-3 cursor-pointer text-sm w-full justify-start font-normal"
          >
          <Pencil className="h-4 w-4 mr-2" />
          Rename
          </Button>
        </Modal>

        <Modal
          header="Delete board?"
          description="This will delete the board and all of its contents."
          disabled={pending}
          onConfirm={onDelete}
        >
          <Button
            variant="ghost"
            // onClick={onDelete}
            className="p-3 cursor-pointer text-sm w-full justify-start font-normal"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </Modal>

      </DropdownMenuContent>

    </DropdownMenu>
  );
};

export default Actions;
