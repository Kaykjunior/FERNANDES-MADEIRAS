export interface Produto {
  id: string;
  nome: string;
  sku: string;
  preco: number; // ou valorUnitario, conforme seu banco
  unidadeMedida: string; // Ex: "M³", "UN"
  estoqueAtual: number;
  categoriaId?: number;
}