import { BemResumo } from "@/types/bens";

export function pegarImagemBem(bem: BemResumo): string | null {
  if (bem.image?.min?.url) return bem.image.min.url;
  if (bem.image?.thumb?.url) return bem.image.thumb.url;
  if (bem.image?.full?.url) return bem.image.full.url;
  return null;
}

export function formatarStatusBem(status?: number): string {
  switch (status) {
    case 0:
      return "Rascunho";
    case 1:
      return "Cadastrado";
    case 2:
      return "Em Remoção";
    case 3:
      return "No Pátio";
    case 4:
      return "Em Leilão";
    case 5:
      return "Devolvido";
    case 6:
      return "Doado";
    case 100:
      return "Leiloado";
    default:
      return "Desconhecido";
  }
}

export function badgeColor(status?: number): string {
  switch (status) {
    case 0:
      return "bg-gray-500";
    case 1:
      return "bg-gray-100 text-gray-800 border-[1px] border-gray-800";
    case 2:
      return "";
    case 3:
      return "bg-yellow-100 text-yellow-800 border-[1px] border-yellow-800";
    case 4:
      return "bg-green-500";
    case 5:
      return "bg-purple-500";
    case 6:
      return "bg-pink-500";
    case 100:
      return "bg-orange-500";
    default:
      return "bg-gray-500";
  }
}
