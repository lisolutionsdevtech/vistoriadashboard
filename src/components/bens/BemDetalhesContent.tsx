"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";

import { BemDetalhe } from "@/types/bens";
import { formatarStatusBem, badgeColor } from "@/utils/bens";
import { formatarData } from "@/utils/leilao";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

import {
  Building,
  MapPin,
  Tag,
  Box,
  Info,
  Calendar,
  Warehouse,
  AlertCircle,
  Truck,
  ImagePlus,
  Camera,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Star, Eye, EyeOff, Save } from "lucide-react";

// Helper para converter File para Base64 comprimido (Web/PWA)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Apenas com imagens maiores faremos compressão
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = (error) => reject(error);
    reader.onload = (e) => {
      const img = new globalThis.Image();
      img.onerror = (error) => reject(error);
      img.onload = () => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback silencioso para raw
          return resolve(e.target?.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Comprime para formato JPEG a 75%
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const proxyImageUrl = (url: string | null | undefined) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
};

interface BemDetalhesContentProps {
  bem: BemDetalhe | undefined;
  isLoading: boolean;
  error: unknown;
  TitleComponent?: ComponentType<any>;
  HeaderComponent?: ComponentType<any>;
}

export function BemDetalhesContent({
  bem,
  isLoading,
  error,
  TitleComponent,
  HeaderComponent,
}: BemDetalhesContentProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // --- Filas de operações pendentes (modo rascunho) ---
  type PendingUpload = { previewUrl: string; base64: string; filename: string };
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<Set<number>>(new Set());
  const [visibilityOverrides, setVisibilityOverrides] = useState<
    Record<number, boolean>
  >({});
  const [pendingCapaId, setPendingCapaId] = useState<number | null>(null);

  const hasPendingChanges =
    pendingUploads.length > 0 ||
    pendingDeletes.size > 0 ||
    Object.keys(visibilityOverrides).length > 0 ||
    pendingCapaId !== null;

  // Determina se o arquivo está visível no site
  const isArqVisible = (arq: any): boolean => {
    if (arq.id && visibilityOverrides[arq.id] !== undefined) {
      return visibilityOverrides[arq.id];
    }
    if (typeof arq.site === "boolean") return arq.site;
    if (arq.tipo?.id !== undefined) return arq.tipo.id === 1;
    return true;
  };

  const isFotoCapa = (arq: any) => {
    // Se o usuário escolheu uma nova capa localmente, usar essa
    if (pendingCapaId !== null) return arq.id === pendingCapaId;
    const arqUrl = (arq.url || "").trim().toLowerCase();
    const coverFull = (bem?.image?.full?.url || "").trim().toLowerCase();
    const coverThumb = (bem?.image?.thumb?.url || "").trim().toLowerCase();
    return arqUrl !== "" && (arqUrl === coverFull || arqUrl === coverThumb);
  };

  const refreshData = async () => {
    setVisibilityOverrides({});
    setPendingDeletes(new Set());
    setPendingUploads((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u.previewUrl));
      return [];
    });
    setPendingCapaId(null);

    // Revalida sem apagar o cache para não fechar o dialog do lote (LotesTabContent)
    await mutate(
      () => true,
      (currentData: any) => currentData, // Preserva o cache atual enquanto revalida
      { revalidate: true }
    );
    router.refresh();
  };

  // --- HANDLERS (modo rascunho — só altera estado local) ---

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUploads: PendingUpload[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        const base64 = await fileToBase64(file);
        newUploads.push({
          previewUrl,
          base64,
          filename: file.name || `foto_pwa_${Date.now()}_${i}.jpg`,
        });
      }
      setPendingUploads((prev) => [...prev, ...newUploads]);
      toast({
        title: `${newUploads.length} foto(s) adicionada(s)`,
        description: "Clique em Salvar para confirmar.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível processar as imagens.",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = (arq: any) => {
    if (!arq.id) return;
    const isCapa = isFotoCapa(arq);
    const msg = isCapa
      ? "Deseja mesmo excluí-la? Esta é a Foto Principal (Capa)!"
      : "Tem certeza que deseja apagar essa foto?";
    if (!confirm(msg)) return;

    setPendingDeletes((prev) => new Set(prev).add(arq.id));
    if (activeImage === proxyImageUrl(arq.url || "")) setActiveImage(null);
    if (isCapa) setPendingCapaId(null);
    toast({
      title: "Foto marcada para exclusão",
      description: "Clique em Salvar para confirmar.",
    });
  };

  const handleSetCapa = (idArquivo: number) => {
    setPendingCapaId(idArquivo);
    toast({
      title: "Capa alterada",
      description: "Clique em Salvar para confirmar.",
    });
  };

  const handleToggleVisibility = (arq: any) => {
    if (!arq.id) return;
    if (isFotoCapa(arq)) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "A foto capa deve ser sempre visível.",
      });
      return;
    }
    const newVal = !isArqVisible(arq);
    setVisibilityOverrides((prev) => ({ ...prev, [arq.id]: newVal }));
    toast({
      title: `Foto ${newVal ? "visível" : "oculta"}`,
      description: "Clique em Salvar para confirmar.",
    });
  };

  // --- HANDLER SALVAR (processa tudo de uma vez) ---
  const handleSave = async () => {
    if (!bem?.id) return;
    setIsSaving(true);
    let erros = 0;

    try {
      // 1. Processar uploads pendentes
      for (const upload of pendingUploads) {
        try {
          const res = await fetch(`/api/bens/${bem.id}/arquivos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: upload.base64,
              filename: upload.filename,
              tipo: 1,
              permissao: 0,
            }),
          });
          if (!res.ok) erros++;
        } catch {
          erros++;
        }
      }

      // 2. Processar exclusões pendentes
      for (const idArq of pendingDeletes) {
        try {
          // Verifica se era capa original
          const arqOriginal = imageFiles.find((a) => a.id === idArq);
          if (arqOriginal) {
            const arqUrl = (arqOriginal.url || "").trim().toLowerCase();
            const coverFull = (bem?.image?.full?.url || "")
              .trim()
              .toLowerCase();
            if (arqUrl && arqUrl === coverFull) {
              await fetch(`/api/bens/${bem.id}/photo`, { method: "DELETE" });
            }
          }
          const res = await fetch(`/api/bens/${bem.id}/arquivos/${idArq}`, {
            method: "DELETE",
          });
          if (!res.ok) erros++;
        } catch {
          erros++;
        }
      }

      // 3. Processar mudanças de visibilidade
      for (const [idStr, siteVal] of Object.entries(visibilityOverrides)) {
        try {
          const res = await fetch(`/api/bens/${bem.id}/arquivos/${idStr}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ site: siteVal }),
          });
          if (!res.ok) erros++;
        } catch {
          erros++;
        }
      }

      // 4. Processar nova capa
      if (pendingCapaId !== null) {
        try {
          const res = await fetch(
            `/api/bens/${bem.id}/arquivos/${pendingCapaId}/definirFotoPrincipal`,
            { method: "POST" },
          );
          if (!res.ok) erros++;
        } catch {
          erros++;
        }
      }

      // 5. Refresh final
      await refreshData();

      if (erros > 0) {
        toast({
          variant: "destructive",
          title: "Atenção",
          description: `Salvo com ${erros} erro(s). Verifique.`,
        });
      } else {
        toast({
          title: "Salvo!",
          description: "Todas as alterações foram aplicadas.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao salvar alterações.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const imageFiles = useMemo(() => {
    const arquivos = bem?.arquivos ?? [];
    return arquivos.filter((arq) => {
      const url = arq.url?.trim();
      if (!url) return false;

      const mimeOk = !!arq.mimeType?.startsWith("image/");
      const extOk = arq.filename
        ? /\.(jpg|jpeg|png|webp|gif)$/i.test(arq.filename)
        : false;
      const tipoOk = arq.tipo?.nome
        ? arq.tipo.nome.toLowerCase().includes("foto")
        : false;

      return mimeOk || extOk || tipoOk;
    });
  }, [bem?.arquivos]);

  const imagemPadrao: string | null = useMemo(() => {
    const url =
      imageFiles[0]?.url ??
      bem?.image?.full?.url ??
      bem?.image?.min?.url ??
      bem?.image?.thumb?.url ??
      null;

    if (!url) return null;
    const trimmed = url.trim();
    return trimmed ? trimmed : null;
  }, [
    imageFiles,
    bem?.image?.full?.url,
    bem?.image?.min?.url,
    bem?.image?.thumb?.url,
  ]);

  useEffect(() => {
    if (!bem) {
      setActiveImage(null);
      return;
    }
    setActiveImage(imagemPadrao);
  }, [bem?.id, imagemPadrao]);

  const HeaderWrapper = HeaderComponent ?? ((props: any) => <div {...props} />);
  const TituloWrapper = TitleComponent ?? ((props: any) => <h2 {...props} />);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full min-w-0 overflow-hidden">
        <HeaderWrapper className="p-6 border-b shrink-0 bg-muted/20 min-w-0">
          <TituloWrapper className="text-lg md:text-2xl font-bold tracking-tight text-foreground leading-none min-w-0">
            <Skeleton className="h-8 w-3/4 mb-2" />
          </TituloWrapper>
          <Skeleton className="h-4 w-1/4" />
        </HeaderWrapper>
        <div className="flex-grow p-6 space-y-6 overflow-auto min-w-0">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !bem) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-4 min-w-0 overflow-hidden">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div>
          <h3 className="text-lg font-semibold">Erro ao carregar detalhes</h3>
          <p className="text-muted-foreground">
            Não foi possível recuperar as informações do bem.
          </p>
        </div>
      </div>
    );
  }

  const titulo = bem.siteTitulo || bem.descricaoInterna || "Sem título";
  const statusTexto = bem.statusMessage || formatarStatusBem(bem.status);
  const dataEntrada = formatarData(bem.dataEntrada);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden min-w-0 pb-10">
      <HeaderWrapper className="p-4 md:p-6 border-b shrink-0 bg-muted/10 min-w-0 overflow-hidden">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
            <TituloWrapper className="text-lg md:text-2xl font-bold tracking-tight text-foreground leading-none min-w-0">
              {titulo}
            </TituloWrapper>

            <div className="flex gap-2 items-center">
              <Badge
                className={`${badgeColor(bem.status)} text-[10px] py-0 px-1 shadow-sm`}
              >
                {statusTexto}
              </Badge>

              {bem.bloqueadoLeilao && (
                <Badge
                  variant="destructive"
                  className="px-2 py-0.5 text-[10px] md:text-xs"
                >
                  Bloqueado
                </Badge>
              )}
            </div>
          </div>

          <div className="text-xs md:text-sm text-muted-foreground font-mono flex items-center gap-2 mt-0.5 min-w-0 overflow-hidden">
            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold text-muted-foreground/80 shrink-0">
              ID: {bem.id}
            </span>
            {bem.categoria?.descricao && (
              <span className="opacity-70 truncate">
                • {bem.categoria.descricao}
              </span>
            )}
          </div>
        </div>
      </HeaderWrapper>
      <div className="overflow-auto">
        <div className="p-4 md:p-6 space-y-6 pb-20 min-w-0 overflow-x-hidden">
          {/* Main Image and Gallery Preview */}
          <div className="space-y-3 min-w-0">
            <div className="relative w-full h-[250px] md:h-[400px] overflow-hidden rounded-xl border bg-muted shadow-sm flex items-center justify-center min-w-0">
              {activeImage ? (
                <Image
                  src={proxyImageUrl(activeImage)}
                  alt={titulo}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 opacity-20">
                  <Box className="h-16 w-16" />
                  <span className="text-xs font-medium">
                    Sem imagem disponível
                  </span>
                </div>
              )}
            </div>

            <input
              type="file"
              id="upload-foto-bem"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleUpload}
            />

            <input
              type="file"
              id="camera-foto-bem"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleUpload}
            />

            {imageFiles.length > 0 || pendingUploads.length > 0 ? (
              <div className="w-full min-w-0 overflow-x-auto pb-4 pt-3 scrollbar-hide">
                <div className="flex w-max min-w-full gap-3 px-1 text-sm">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="relative w-20 h-20 md:w-32 md:h-32 shrink-0 rounded-lg border-2 border-dashed border-primary/50 text-primary bg-primary/5 transition-all hover:bg-primary/10 hover:border-primary flex flex-col items-center justify-center gap-1 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        title="Adicionar fotos"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin" />
                        ) : (
                          <ImagePlus className="h-6 w-6 md:h-8 md:w-8 transition-transform duration-300 group-hover:scale-110" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 z-[100]">
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer font-medium"
                        onClick={() =>
                          document.getElementById("camera-foto-bem")?.click()
                        }
                      >
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span>Tirar Foto</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer font-medium"
                        onClick={() =>
                          document.getElementById("upload-foto-bem")?.click()
                        }
                      >
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span>Escolher da Galeria</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {imageFiles
                    .filter((arq) => !pendingDeletes.has(arq.id!))
                    .map((arq) => {
                      const originalUrl = (arq.url ?? "").trim();
                      const key =
                        arq.id ?? originalUrl ?? `${arq.filename ?? "foto"}`;
                      const thumbUrl = (
                        arq.versions?.thumb?.url ||
                        arq.url ||
                        ""
                      ).trim();
                      const isActive =
                        (activeImage ?? "").trim() === (arq.url ?? "").trim();
                      const isCapa = isFotoCapa(arq);

                      return (
                        <div
                          key={key}
                          className="relative group shrink-0 w-20 h-20 md:w-32 md:h-32"
                        >
                          <button
                            onClick={() => setActiveImage(originalUrl || null)}
                            className={cn(
                              "relative w-full h-full rounded-lg border overflow-hidden bg-muted transition-all hover:opacity-80 block",
                              isActive
                                ? "ring-2 ring-primary ring-offset-2 border-primary"
                                : "border-border",
                            )}
                            type="button"
                          >
                            <Image
                              src={proxyImageUrl(thumbUrl)}
                              alt={arq.referNome || "Foto"}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </button>

                          {isCapa && (
                            <Badge className="absolute bottom-0 inset-x-0 rounded-none rounded-b-lg text-[8px] md:text-[10px] py-0.5 px-1 justify-center bg-yellow-500 hover:bg-yellow-600 text-white border-0 z-10 pointer-events-none text-center">
                              Capa
                            </Badge>
                          )}

                          {/* Botão excluir */}
                          {arq.id && (
                            <button
                              type="button"
                              onClick={() => handleDelete(arq)}
                              className="absolute -top-2 -right-2 bg-destructive text-white p-1 md:p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}

                          {/* Botão Tornar Capa */}
                          {!isCapa && arq.id && (
                            <button
                              type="button"
                              onClick={() => handleSetCapa(arq.id!)}
                              title="Tornar imagem de capa"
                              className="absolute -top-2 -left-2 bg-background border border-border text-yellow-500 p-1 md:p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-50 z-20"
                            >
                              <Star className="h-3 w-3 fill-current" />
                            </button>
                          )}

                          {/* Botão Alternar Visibilidade */}
                          {!isCapa &&
                            arq.id &&
                            (() => {
                              const visible = isArqVisible(arq);
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleVisibility(arq);
                                  }}
                                  title={
                                    visible
                                      ? "Ocultar do Site"
                                      : "Exibir no Site"
                                  }
                                  className={cn(
                                    "absolute -bottom-1 -left-1 border p-1.5 md:p-2 rounded-full shadow-md transition-all z-20",
                                    visible
                                      ? "bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600"
                                      : "bg-red-500 border-red-600 text-white hover:bg-red-600",
                                  )}
                                >
                                  {visible ? (
                                    <Eye className="h-3.5 w-3.5" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              );
                            })()}
                        </div>
                      );
                    })}

                  {/* Cards de preview local (uploads pendentes) */}
                  {pendingUploads.map((upload, idx) => (
                    <div
                      key={`pending-${idx}`}
                      className="relative group shrink-0 w-20 h-20 md:w-32 md:h-32"
                    >
                      <button
                        onClick={() => setActiveImage(upload.previewUrl)}
                        className={cn(
                          "relative w-full h-full rounded-lg border-2 border-dashed border-emerald-500 overflow-hidden bg-muted transition-all hover:opacity-80 block",
                          activeImage === upload.previewUrl &&
                          "ring-2 ring-primary ring-offset-2",
                        )}
                        type="button"
                      >
                        <Image
                          src={upload.previewUrl}
                          alt={upload.filename}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                      <Badge className="absolute bottom-0 inset-x-0 rounded-none rounded-b-lg text-[8px] md:text-[10px] py-0.5 px-1 justify-center bg-emerald-500 text-white border-0 z-10 pointer-events-none text-center">
                        Nova
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(upload.previewUrl);
                          setPendingUploads((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                          toast({ title: "Upload cancelado" });
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-white p-1 md:p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-start px-1 mt-2 text-sm">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-primary/50 text-primary bg-primary/5 transition-all hover:bg-primary/10 hover:border-primary group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      )}
                      <span className="text-xs md:text-sm font-medium">
                        {isUploading ? "Enviando..." : "Adicionar 1ª foto"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 z-[100]">
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer font-medium"
                      onClick={() =>
                        document.getElementById("camera-foto-bem")?.click()
                      }
                    >
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <span>Tirar Foto</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer font-medium"
                      onClick={() =>
                        document.getElementById("upload-foto-bem")?.click()
                      }
                    >
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      <span>Escolher da Galeria</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Botão Salvar Alterações — aparece quando há mudanças pendentes */}
          {hasPendingChanges && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all font-semibold text-sm disabled:opacity-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
            {(bem.marcaModelo ||
              bem.anoFabricacao ||
              bem.anoModelo ||
              bem.cor ||
              bem.combustivel) && (
                <div className="space-y-3 p-4 rounded-xl border bg-card/50 min-w-0">
                  <h4 className="font-semibold flex items-center gap-2 text-primary">
                    <Truck className="h-4 w-4" /> Especificações
                  </h4>

                  <div className="grid grid-cols-2 gap-y-2 text-sm min-w-0">
                    {bem.marcaModelo && (
                      <div className="col-span-2 flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">
                          Marca/Modelo
                        </span>
                        <span className="font-medium break-words">
                          {bem.marcaModelo}
                        </span>
                      </div>
                    )}

                    {bem.anoFabricacao && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">
                          Ano Fab.
                        </span>
                        <span className="font-medium">{bem.anoFabricacao}</span>
                      </div>
                    )}

                    {bem.anoModelo && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">
                          Ano Mod.
                        </span>
                        <span className="font-medium">{bem.anoModelo}</span>
                      </div>
                    )}

                    {bem.cor && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">Cor</span>
                        <span className="font-medium break-words">
                          {typeof bem.cor === "string" ? bem.cor : bem.cor.nome}
                        </span>
                      </div>
                    )}

                    {bem.combustivel && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">
                          Combustível
                        </span>
                        <span className="font-medium break-words">
                          {bem.combustivel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {(bem.placa || bem.chassi || bem.renavam) && (
              <div className="space-y-3 p-4 rounded-xl border bg-card/50 min-w-0">
                <h4 className="font-semibold flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" /> Identificação
                </h4>

                <div className="space-y-2 text-sm min-w-0">
                  {bem.placa && (
                    <div className="flex justify-between border-b border-border/50 pb-1 gap-2 min-w-0">
                      <span className="text-muted-foreground shrink-0">
                        Placa
                      </span>
                      <span className="font-mono font-bold truncate">
                        {bem.placa}
                      </span>
                    </div>
                  )}

                  {bem.chassi && (
                    <div className="flex flex-col border-b border-border/50 pb-1 min-w-0">
                      <span className="text-xs text-muted-foreground">
                        Chassi
                      </span>
                      <span className="font-mono text-xs break-all">
                        {bem.chassi}
                      </span>
                    </div>
                  )}

                  {bem.renavam && (
                    <div className="flex justify-between border-b border-border/50 pb-1 gap-2 min-w-0">
                      <span className="text-muted-foreground shrink-0">
                        Renavam
                      </span>
                      <span className="font-mono truncate">{bem.renavam}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(bem.cidade || bem.patio || bem.comitente) && (
              <div className="space-y-3 p-4 rounded-xl border bg-card/50 min-w-0">
                <h4 className="font-semibold flex items-center gap-2 text-primary">
                  <MapPin className="h-4 w-4" /> Localização & Custódia
                </h4>

                <div className="space-y-3 text-sm min-w-0">
                  {bem.comitente?.pessoa?.name && (
                    <div className="flex items-start gap-2 min-w-0">
                      <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">
                          Comitente
                        </span>
                        <span className="font-semibold break-words">
                          {bem.comitente.pessoa.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {bem.patio && (
                    <div className="flex items-start gap-2 min-w-0">
                      <Warehouse className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">
                          Pátio
                        </span>
                        <span className="font-medium break-words">
                          {bem.patio.nome} ({bem.patio.sigla})
                        </span>
                        {bem.vaga && (
                          <span className="text-xs">Vaga: {bem.vaga}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {(bem.cidade || bem.uf) && (
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-muted-foreground">
                          Localidade
                        </span>
                        <span className="break-words">
                          {bem.cidade}
                          {bem.uf ? `, ${bem.uf}` : ""}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 p-4 rounded-xl border bg-card/50 min-w-0">
              <h4 className="font-semibold flex items-center gap-2 text-primary">
                <Calendar className="h-4 w-4" /> Informações Operativas
              </h4>

              <div className="space-y-3 text-sm min-w-0">
                <div className="flex items-start gap-2 min-w-0">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground">
                      Data Entrada
                    </span>
                    <span className="break-words">{dataEntrada}</span>
                  </div>
                </div>

                {bem.conservacao && (
                  <div className="flex items-start gap-2 min-w-0">
                    <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-muted-foreground">
                        Estado de Conservação
                      </span>
                      <span className="font-medium break-words">
                        {bem.conservacao.nome}
                      </span>
                    </div>
                  </div>
                )}

                {bem.motivoBloqueio && (
                  <div className="flex items-start gap-2 text-destructive min-w-0">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs opacity-70">
                        Motivo de Bloqueio
                      </span>
                      <span className="text-xs font-medium break-words">
                        {bem.motivoBloqueio}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {bem.descricao && (
            <div className="space-y-2 min-w-0">
              <h4 className="font-semibold text-primary">
                Descrição Detalhada
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed p-4 rounded-xl border bg-muted/30 min-w-0 break-words">
                {bem.descricao}
              </p>
            </div>
          )}

          {bem.observacaoLeiloeiro && (
            <div className="space-y-2 min-w-0">
              <h4 className="font-semibold text-primary">
                Observações do Leiloeiro
              </h4>
              <p className="text-sm text-foreground bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 p-4 rounded-xl border italic min-w-0 break-words">
                "{bem.observacaoLeiloeiro}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
