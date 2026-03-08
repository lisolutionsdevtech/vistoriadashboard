"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

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
  const [activeImage, setActiveImage] = useState<string | null>(null);

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
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  console.log("Arquivos selecionados:", files);
                  // Lógica de upload entrará aqui
                }
              }}
            />

            <input
              type="file"
              id="camera-foto-bem"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  console.log("Foto tirada na câmera:", files);
                  // Lógica de upload entrará aqui
                }
              }}
            />

            {imageFiles.length > 0 ? (
              <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide">
                <div className="flex w-max min-w-full gap-2 px-1 text-sm">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg border-2 border-dashed border-primary/50 text-primary bg-primary/5 transition-all hover:bg-primary/10 hover:border-primary flex flex-col items-center justify-center gap-1 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        type="button"
                        title="Adicionar fotos"
                      >
                        <ImagePlus className="h-5 w-5 md:h-6 md:w-6 transition-transform duration-300 group-hover:scale-110" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 z-[100]">
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer font-medium"
                        onClick={() => document.getElementById("camera-foto-bem")?.click()}
                      >
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span>Tirar Foto</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 cursor-pointer font-medium"
                        onClick={() => document.getElementById("upload-foto-bem")?.click()}
                      >
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span>Escolher da Galeria</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {imageFiles.map((arq) => {
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

                    return (
                      <button
                        key={key}
                        onClick={() => setActiveImage(originalUrl || null)}
                        className={cn(
                          "relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg border overflow-hidden bg-muted transition-all hover:opacity-80",
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
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex justify-start px-1 mt-2 text-sm">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-primary/50 text-primary bg-primary/5 transition-all hover:bg-primary/10 hover:border-primary group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      type="button"
                    >
                      <ImagePlus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-xs md:text-sm font-medium">Adicionar 1ª foto</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 z-[100]">
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer font-medium"
                      onClick={() => document.getElementById("camera-foto-bem")?.click()}
                    >
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <span>Tirar Foto</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer font-medium"
                      onClick={() => document.getElementById("upload-foto-bem")?.click()}
                    >
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      <span>Escolher da Galeria</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

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
