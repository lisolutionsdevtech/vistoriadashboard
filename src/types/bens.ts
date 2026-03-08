import { ComitenteResumo, ImagemLeilao, ApiDate } from "./leilao";

export interface BemCategoria {
  id: number;
  descricao: string;
}

export interface BemResumo {
  id: number;
  bloqueadoLeilao?: boolean;
  siteTitulo: string;
  descricaoInterna?: string;
  placa?: string;
  chassi?: string;
  renavam?: string;
  marcaModelo?: string;
  anoFabricacao?: number;
  anoModelo?: string | number;
  cor?: string | { id: number; nome: string };
  combustivel?: string;
  cidade?: string;
  uf?: string;
  image?: ImagemLeilao;
  comitente?: ComitenteResumo;
  categoria?: BemCategoria;
  status?: number;
  statusMessage?: string;
}

export interface ArquivoBem {
  id: number;
  url: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  versions?: {
    min?: { url: string };
    thumb?: { url: string };
  };
  tipo?: {
    id: number;
    nome: string;
    codigo: string;
  };
  referNome?: string;
}

export interface BemDetalhe extends BemResumo {
  descricao?: string;
  descricaoLeiloeiro?: string;
  km?: number;
  chassi?: string;
  placa?: string;
  renavam?: string;
  anoFabricacao?: number;
  anoModelo?: string;
  cor?: { id: number; nome: string };
  conservacao?: { id: number; nome: string };
  patio?: { id: number; nome: string; sigla: string };
  vaga?: string;
  dataEntrada?: ApiDate;
  dataSaida?: ApiDate;
  motivoBloqueio?: string;
  observacaoLeiloeiro?: string;
  arquivos?: ArquivoBem[];
  veiculo?: {
    id: number;
    sinistro?: string;
    numeroMotor?: string;
    municipioPlaca?: string;
  };
}

export interface BensResponse {
  result: BemResumo[];
  total: number;
  stats?: any;
}
