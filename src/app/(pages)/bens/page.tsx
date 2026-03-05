"use client";

import { useState } from "react";
import useSWR from "swr";
import { BensResponse } from "@/types/bens";
import { BemCard } from "@/components/bens/BemCard";
import { BemDetalhesDialog } from "@/components/bens/BemDetalhesDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BensPage() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedBemId, setSelectedBemId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const limit = 20;

  const { data, error, mutate, isLoading } = useSWR<BensResponse>(
    `/api/bens?search=${encodeURIComponent(busca)}&page=${page}${status ? `&status=${status}` : ""}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const bens = data?.result || [];
  const totalItems = data?.total || 0;
  const itensPorPagina = limit;
  const totalPaginas = Math.ceil(totalItems / itensPorPagina);

  const handleRefresh = () => {
    mutate();
  };

  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusca(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value || undefined);
    setPage(1); // Reset to first page on new filter
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Search Header Area */}
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-bens"
              name="search"
              placeholder="Buscar bens..."
              className="pl-9 text-lg"
              value={busca}
              onChange={handleBuscaChange}
            />
          </div>
          <select
            id="status-filter"
            value={status || ""}
            onChange={handleStatusChange}
            className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todos os status</option>
            <option value="0">Rascunho</option>
            <option value="1">Cadastrado</option>
            <option value="2">Em Remoção</option>
            <option value="3">No Pátio</option>
            <option value="4">Em Leilão</option>
            <option value="5">Devolvido</option>
            <option value="6">Doado</option>
            <option value="100">Leiloado</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleRefresh()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="min-h-[200px]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                Não foi possível carregar os bens. Por favor, tente novamente.
              </AlertDescription>
            </Alert>
          ) : bens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Nenhum bem encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar seus filtros de busca.
                </p>
              </div>
              <Button variant="outline" onClick={() => setBusca("")}>
                Limpar busca
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {bens.map((bem) => (
                  <BemCard
                    key={bem.id}
                    bem={bem}
                    onClick={(id) => {
                      setSelectedBemId(id);
                      setIsDialogOpen(true);
                    }}
                  />
                ))}
              </div>

              <BemDetalhesDialog
                id={selectedBemId}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={bens.find((b) => b.id === selectedBemId)}
              />
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && !error && totalPaginas > 1 && (
          <div className="mt-10 flex flex-col items-center justify-center gap-4 py-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center gap-1 px-4 text-sm font-medium">
                <span>Página</span>
                <span className="text-primary">{page}</span>
                <span>de</span>
                <span>{totalPaginas}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p: number) => Math.min(totalPaginas, p + 1))
                }
                disabled={page === totalPaginas}
                className="gap-1"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Mostrando {bens.length} de {totalItems} itens encontrados
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
