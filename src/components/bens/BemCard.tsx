"use client";

import { BemResumo } from "@/types/bens";
import { pegarImagemBem, formatarStatusBem, badgeColor } from "@/utils/bens";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Tag, Box, Info } from "lucide-react";
import Image from "next/image";

const proxyImageUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("http")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

interface BemCardProps {
  bem: BemResumo;
  onClick?: (id: number) => void;
}

export function BemCard({ bem, onClick }: BemCardProps) {
  const capaUrl = pegarImagemBem(bem);
  const titulo = bem.siteTitulo || bem.descricaoInterna || "Sem título";
  const statusTexto = bem.statusMessage || formatarStatusBem(bem.status);

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-muted/60 bg-card/50 backdrop-blur-sm"
      onClick={() => onClick?.(bem.id)}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {capaUrl ? (
          <Image
            src={proxyImageUrl(capaUrl) || ""}
            alt={titulo}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10">
            <Box className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}

        <div className="absolute top-1 left-1 md:top-2 md:left-2">
          <Badge
            className={`${badgeColor(bem.status)} text-[10px] py-0 px-1 shadow-sm`}
          >
            {statusTexto}
          </Badge>
        </div>
        <div className="absolute top-1 right-1 md:top-2 md:right-2">
          {bem.comitente?.image?.thumb && (
            <Image
              src={bem.comitente.image.thumb}
              alt={bem.comitente?.pessoa?.name || ""}
              width={40}
              height={40}
              className="rounded-md"
            />
          )}
        </div>
      </div>

      <CardHeader className="p-4 pb-2 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <Badge
            variant="outline"
            className="text-[10px] md:text-xs font-mono text-muted-foreground"
          >
            ID: {bem.id}
          </Badge>

          {bem.categoria?.descricao && (
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {bem.categoria.descricao}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-xs md:text-sm leading-tight line-clamp-2 min-h-[3.5rem]">
          {titulo}
        </h3>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow space-y-3">
        {bem.bloqueadoLeilao && (
          <Badge variant="destructive" className="text-[10px] md:text-xs">
            Bloqueado para leilão
          </Badge>
        )}
        <div className="grid grid-cols-1 gap-y-2 text-xs md:text-sm text-muted-foreground">
          {bem.marcaModelo && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {bem.marcaModelo}
              </span>
            </div>
          )}

          {(bem.cidade || bem.uf) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>
                {bem.cidade}, {bem.uf}
              </span>
            </div>
          )}

          {bem.comitente?.pessoa?.name && (
            <div className="flex items-center gap-1.5">
              <Building className="h-4 w-4" />

              <span className="font-semibold">{bem.comitente.pessoa.name}</span>
            </div>
          )}

          {(bem.placa || bem.chassi) && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
              <Info className="h-4 w-4" />
              <span className="text-[10px] md:text-xs">
                {bem.placa && `Placa: ${bem.placa}`}
                {bem.placa && bem.chassi && " | "}
                {bem.chassi && `Chassi: ${bem.chassi}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
