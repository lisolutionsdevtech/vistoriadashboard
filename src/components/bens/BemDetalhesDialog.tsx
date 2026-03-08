"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BemDetalhe, BemResumo } from "@/types/bens";
import useSWR from "swr";
import axios from "axios";
import { BemDetalhesContent } from "./BemDetalhesContent";

interface BemDetalhesDialogProps {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: BemResumo;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function BemDetalhesDialog({
  id,
  open,
  onOpenChange,
  initialData,
}: BemDetalhesDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const {
    data: bem,
    error,
    isLoading,
    mutate,
  } = useSWR<BemDetalhe>(id ? `/api/bens/${id}` : null, fetcher, {
    fallbackData: initialData as any,
    revalidateOnFocus: false,
    revalidateOnMount: true,
  });

  useEffect(() => {
    if (open && id) {
      mutate(undefined, { revalidate: true });
    }
  }, [open, id, mutate]);

  if (!id) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] h-[90vh] md:w-[1000px] md:h-[800px] p-0 overflow-hidden flex flex-col border-none shadow-2xl min-w-0">
          <BemDetalhesContent
            bem={bem}
            isLoading={isLoading}
            error={error}
            TitleComponent={DialogTitle}
            HeaderComponent={DialogHeader}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-dvh p-0 flex flex-col border-none rounded-t-none min-w-0">
        <BemDetalhesContent
          bem={bem}
          isLoading={isLoading}
          error={error}
          TitleComponent={DrawerTitle}
          HeaderComponent={DrawerHeader}
        />
      </DrawerContent>
    </Drawer>
  );
}
