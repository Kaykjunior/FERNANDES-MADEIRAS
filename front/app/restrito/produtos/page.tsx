'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Save,
  Trash2,
  Edit,
  Eye,
  Filter,
  Download,
  Printer,
  RefreshCw,
  MoreVertical,
  Search,
  X,
  Building2,
  Package,
  Grid3x3,
  Ruler,
  Weight,
  DollarSign,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  BarChart3,
  Layers,
  TrendingUp,
  Activity
} from "lucide-react";
import { API_URL } from '@/lib/api';
import HeaderEnterprise from '@/components/header';
import { getToken } from '@/lib/auth';

// Tipos
interface EstoqueItem {
  id: string;
  quantidade: number;
  quantidadeReservada: number;
  custoMedio: number;
  localizacao: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Produto {
  id: string;
  nome: string;
  codigo_sku?: string;
  categoria_id: number;
  categoria?: {
    id: number;
    nome: string;
  };
  estoque?: EstoqueItem[];
  dimensao_ripa?: string;
  comprimento_mt: number;
  diametro_min: number;
  diametro_max: number;
  peso_unitario_kg: number;
  preco_venda_base: number;
  unidade_comercial: string;
  ncm: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  nome: string;
  codigo_sku: string;
  categoria_id: number;
  dimensao_ripa: string;
  comprimento_mt: number;
  diametro_min: number;
  diametro_max: number;
  peso_unitario_kg: number;
  preco_venda_base: number;
  unidade_comercial: string;
  ncm: string;
  ativo: boolean;
}

interface Categoria {
  id: number;
  nome: string;
}

// Valores iniciais
const initialFormData: FormData = {
  nome: '',
  codigo_sku: '',
  categoria_id: 0,
  dimensao_ripa: '',
  comprimento_mt: 0,
  diametro_min: 0,
  diametro_max: 0,
  peso_unitario_kg: 0,
  preco_venda_base: 0,
  unidade_comercial: 'UN',
  ncm: '',
  ativo: true,
};

// Componente de notificação
function Notification({ type, message, onClose }: {
  type: 'success' | 'error' | 'info',
  message: string,
  onClose: () => void
}) {
  const bgColor = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }[type];

  const textColor = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  }[type];

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle
  }[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md border ${bgColor} shadow-lg max-w-sm`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${textColor}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Função para formatar números (usada apenas para exibição, não durante edição)
function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDecimal(value: number, decimals: number = 3): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Converte string digitada (com vírgula ou ponto) para number
function parseInputToNumber(value: string): number {
  if (!value) return 0;
  // Remove tudo exceto dígitos, vírgula e ponto
  const cleaned = value.replace(/[^\d.,]/g, '');
  // Substitui vírgula por ponto para parseFloat
  const normalized = cleaned.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

// Modal de Edição
function EditarProdutoModal({
  isOpen,
  onClose,
  produto,
  onSave,
  categorias
}: {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onSave: (data: any) => Promise<void>;
  categorias: Categoria[];
}) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de string separados para campos de preço/peso/comprimento
  // Isso evita o bug de reformatar o valor enquanto o usuário digita
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({
    preco_venda_base: '',
    comprimento_mt: '',
    peso_unitario_kg: '',
    diametro_min: '',
    diametro_max: '',
  });

  useEffect(() => {
    if (produto) {
      const data: FormData = {
        nome: produto.nome || '',
        codigo_sku: produto.codigo_sku || '',
        categoria_id: Number(produto.categoria_id) || 0,
        dimensao_ripa: produto.dimensao_ripa || '',
        comprimento_mt: Number(produto.comprimento_mt) || 0,
        diametro_min: Number(produto.diametro_min) || 0,
        diametro_max: Number(produto.diametro_max) || 0,
        peso_unitario_kg: Number(produto.peso_unitario_kg) || 0,
        preco_venda_base: Number(produto.preco_venda_base) || 0,
        unidade_comercial: produto.unidade_comercial || 'UN',
        ncm: produto.ncm || '',
        ativo: produto.ativo !== undefined ? produto.ativo : true,
      };
      setFormData(data);

      // Inicializa os rawInputs com o valor formatado do produto
      setRawInputs({
        preco_venda_base: data.preco_venda_base ? formatNumber(data.preco_venda_base) : '',
        comprimento_mt: data.comprimento_mt ? String(data.comprimento_mt) : '',
        peso_unitario_kg: data.peso_unitario_kg ? String(data.peso_unitario_kg) : '',
        diametro_min: data.diametro_min ? String(data.diametro_min) : '',
        diametro_max: data.diametro_max ? String(data.diametro_max) : '',
      });
    }
  }, [produto]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler para campos numéricos com rawInput (sem reformatar enquanto digita)
  const handleRawNumberChange = (field: keyof FormData, value: string) => {
    // Permite apenas dígitos, vírgula e ponto
    const cleaned = value.replace(/[^\d.,]/g, '');

    // Atualiza o estado de string "bruta"
    setRawInputs(prev => ({ ...prev, [field]: cleaned }));

    // Converte para número e atualiza o formData
    const numeric = parseInputToNumber(cleaned);

    if (field === 'diametro_min' || field === 'diametro_max' || field === 'categoria_id') {
      setFormData(prev => ({ ...prev, [field]: Math.floor(numeric) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: numeric }));
    }
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      alert('Nome do produto é obrigatório');
      return;
    }

    if (!formData.ncm.trim()) {
      alert('NCM é obrigatório para fins fiscais');
      return;
    }

    try {
      setIsLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[75vh] overflow-hidden flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-2 border-b bg-slate-950 text-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {produto ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <p className="text-sm text-amber-500 mt-1">
              {produto ? `Editando: ${produto.nome}` : 'Preencha os dados do produto'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Coluna Esquerda */}
            <div className="space-y-6">
              {/* Identificação Básica */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Identificação Básica
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Nome do Produto *</Label>
                    <Input
                      placeholder="Ex: Mourão de Eucalipto Tratado 10-12 / 2,20m"
                      className="h-10 font-medium"
                      value={formData.nome}
                      onChange={(e) => handleInputChange('nome', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Código SKU</Label>
                    <Input
                      placeholder="Código único do produto"
                      className="h-10 font-mono"
                      value={formData.codigo_sku}
                      onChange={(e) => handleInputChange('codigo_sku', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Categoria *</Label>
                    <select
                      className="w-full p-2 bg-white border border-slate-300 rounded text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none h-10"
                      value={formData.categoria_id}
                      onChange={(e) => handleInputChange('categoria_id', parseInt(e.target.value) || 0)}
                    >
                      <option value="0">Selecione uma categoria</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dimensões */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-emerald-600" />
                  Dimensões e Especificações
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Comprimento (m) *</Label>
                    <Input
                      placeholder="Ex: 2,20"
                      className="h-10"
                      value={rawInputs.comprimento_mt}
                      onChange={(e) => handleRawNumberChange('comprimento_mt', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Peso (kg) *</Label>
                    <Input
                      placeholder="Ex: 12,500"
                      className="h-10"
                      value={rawInputs.peso_unitario_kg}
                      onChange={(e) => handleRawNumberChange('peso_unitario_kg', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Diâmetro Mín (cm)</Label>
                    <Input
                      placeholder="Ex: 10"
                      className="h-10"
                      value={rawInputs.diametro_min}
                      onChange={(e) => handleRawNumberChange('diametro_min', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Diâmetro Máx (cm)</Label>
                    <Input
                      placeholder="Ex: 12"
                      className="h-10"
                      value={rawInputs.diametro_max}
                      onChange={(e) => handleRawNumberChange('diametro_max', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-6">
              {/* Preço e Comercial */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Preço e Comercial
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Preço de Venda Base *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none">R$</span>
                      <Input
                        placeholder="0,00"
                        className="h-10 pl-10 font-medium"
                        // Usa o rawInput para exibir, não o formatNumber (que reformata e causa bug)
                        value={rawInputs.preco_venda_base}
                        onChange={(e) => handleRawNumberChange('preco_venda_base', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Unidade Comercial</Label>
                    <Input
                      placeholder="UN"
                      className="h-10 font-medium uppercase"
                      value={formData.unidade_comercial}
                      onChange={(e) => handleInputChange('unidade_comercial', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Status</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="text-blue-600 rounded"
                          checked={formData.ativo}
                          onChange={(e) => handleInputChange('ativo', e.target.checked)}
                        />
                        <span className="text-sm font-medium text-slate-700">Produto Ativo</span>
                      </label>
                      <Badge className={formData.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                        {formData.ativo ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Fiscais */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Dados Fiscais
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">NCM *</Label>
                    <Input
                      placeholder="4403.99.00"
                      className="h-10 font-mono text-sm uppercase"
                      value={formData.ncm}
                      onChange={(e) => handleInputChange('ncm', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Dimensão Ripa</Label>
                    <Input
                      placeholder="Ex: 2.5x5, 5x10"
                      className="h-10"
                      value={formData.dimensao_ripa}
                      onChange={(e) => handleInputChange('dimensao_ripa', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Resumo — usa formData (números) para exibição formatada */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-bold text-blue-700 mb-3">Resumo do Produto</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <p className="text-slate-600">Comprimento:</p>
                    <p className="font-semibold text-slate-800">
                      {formData.comprimento_mt ? formatDecimal(formData.comprimento_mt, 2) : '0,00'} m
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-600">Diâmetro:</p>
                    <p className="font-semibold text-slate-800">
                      {formData.diametro_min || '0'} a {formData.diametro_max || '0'} cm
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-600">Peso Unitário:</p>
                    <p className="font-semibold text-slate-800">
                      {formData.peso_unitario_kg ? formatDecimal(formData.peso_unitario_kg, 3) : '0,000'} kg
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-600">Preço Base:</p>
                    <p className="font-semibold text-slate-800">
                      R$ {formData.preco_venda_base ? formatNumber(formData.preco_venda_base) : '0,00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="flex justify-end gap-3 p-2 border-t bg-slate-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ListagemProdutos() {

  function calcularEstoqueDisponivel(estoque: EstoqueItem[] | undefined): number {
    if (!estoque || estoque.length === 0) return 0;
    return estoque.reduce((sum, item) => sum + item.quantidade, 0);
  }

  const token = getToken();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    valorTotalEstoque: 0,
    totalEstoque: 0,
    produtosSemEstoque: 0,
    produtosBaixoEstoque: 0
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  const fetchProdutos = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/produtos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const filteredData = searchTerm
        ? data.filter((produto: Produto) =>
          produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          produto.codigo_sku?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : data;

      setProdutos(filteredData);

      const total = data.length;
      const ativos = data.filter((p: Produto) => p.ativo).length;
      const valorTotal = data.reduce((sum: number, p: Produto) => sum + (p.preco_venda_base || 0), 0);

      const totalEstoque = data.reduce((sum: number, p: Produto) => {
        if (p.estoque && p.estoque.length > 0) {
          return sum + p.estoque.reduce((estoqueSum, item) => estoqueSum + item.quantidade, 0);
        }
        return sum;
      }, 0);

      const produtosSemEstoque = data.filter((p: Produto) => {
        if (!p.estoque || p.estoque.length === 0) return true;
        return p.estoque.reduce((sum, item) => sum + item.quantidade, 0) === 0;
      }).length;

      const produtosBaixoEstoque = data.filter((p: Produto) => {
        if (!p.estoque || p.estoque.length === 0) return false;
        const total = p.estoque.reduce((sum, item) => sum + item.quantidade, 0);
        return total > 0 && total < 10;
      }).length;

      setStats({
        total,
        ativos,
        inativos: total - ativos,
        valorTotalEstoque: valorTotal,
        totalEstoque,
        produtosSemEstoque,
        produtosBaixoEstoque
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      showNotification('error', 'Erro ao carregar lista de produtos');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_URL}/categorias`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      } else {
        setCategorias([
          { id: 1, nome: 'Mourões' },
          { id: 2, nome: 'Postinhos' },
          { id: 3, nome: 'Vigas' },
          { id: 4, nome: 'Resíduos (Serragem/Casca)' },
          { id: 5, nome: 'Ripas' },
          { id: 6, nome: 'Régua' },
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      setCategorias([
        { id: 1, nome: 'Mourões' },
        { id: 2, nome: 'Postinhos' },
        { id: 3, nome: 'Vigas' },
        { id: 4, nome: 'Resíduos (Serragem/Casca)' },
        { id: 5, nome: 'Ripas' },
        { id: 6, nome: 'Régua' },
      ]);
    }
  };

  const updateProduto = async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Erro ao atualizar produto';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  const deleteProduto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const response = await fetch(`${API_URL}/produtos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error('Erro ao excluir produto');

      showNotification('success', 'Produto excluído com sucesso!');
      fetchProdutos();
    } catch (error: any) {
      showNotification('error', error.message || 'Erro ao excluir produto');
    }
  };

  const handleEdit = (produto: Produto) => {
    setProdutoParaEditar(produto);
    setModalOpen(true);
  };

  const handleSaveProduto = async (data: any) => {
    if (!produtoParaEditar) return;

    try {
      setIsLoading(true);
      await updateProduto(produtoParaEditar.id, data);
      showNotification('success', 'Produto atualizado com sucesso!');
      fetchProdutos();
    } catch (error: any) {
      showNotification('error', error.message || 'Erro ao atualizar produto');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
  }, [fetchProdutos]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProdutos();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchProdutos]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <EditarProdutoModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setProdutoParaEditar(null);
        }}
        produto={produtoParaEditar}
        onSave={handleSaveProduto}
        categorias={categorias}
      />

      <HeaderEnterprise />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard de Estatísticas */}
        <div className="hidden md:flex md:flex-row gap-6 mb-8">
          <Card className="bg-gradient-to-r w-full p-2 from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="px-2 py-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Total de Produtos</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <Layers className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r w-full p-2 from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="px-2 py-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100">Produtos Ativos</p>
                  <p className="text-3xl font-bold mt-2">{stats.ativos}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r w-full p-2 from-amber-500 to-amber-600 text-white border-0 shadow-lg">
            <CardContent className="px-2 py-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-100">Produtos Inativos</p>
                  <p className="text-3xl font-bold mt-2">{stats.inativos}</p>
                </div>
                <Activity className="h-10 w-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Principal */}
        <Card className="shadow-xl border-0 p-0">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
            <div className="flex justify-between items-center p-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Catálogo de Produtos
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar produtos..."
                    className="pl-10 pr-4 py-2 bg-white/10 border-white/20 text-white placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 uppercase">Produto</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 uppercase">Categoria</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 uppercase">Dimensões</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 uppercase">Estoque</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 uppercase">Preço</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 uppercase">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 uppercase">Última Atualização</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
                          <p className="text-slate-500">Carregando produtos...</p>
                        </div>
                      </td>
                    </tr>
                  ) : produtos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Package className="h-12 w-12 text-slate-300 mb-4" />
                          <p className="text-slate-500">Nenhum produto encontrado</p>
                          <p className="text-sm text-slate-400 mt-1">
                            {searchTerm ? 'Tente alterar os termos da busca' : 'Cadastre seu primeiro produto'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    produtos.map((produto) => {
                      const estoqueDisponivel = calcularEstoqueDisponivel(produto.estoque);
                      const estaBaixoEstoque = estoqueDisponivel < 10;

                      return (
                        <tr key={produto.id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-slate-800">{produto.nome}</p>
                              <p className="text-sm text-slate-500 font-mono">{produto.codigo_sku || 'Sem SKU'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {produto.categoria?.nome || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-600">
                              <p>{produto.comprimento_mt}m</p>
                              <p className="text-xs">{produto.diametro_min}-{produto.diametro_max}cm</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-lg ${estaBaixoEstoque ? 'text-amber-600' : 'text-green-600'}`}>
                                  {estoqueDisponivel}
                                </span>
                                <span className="text-sm text-slate-500">{produto.unidade_comercial}</span>
                              </div>
                              {estaBaixoEstoque && estoqueDisponivel > 0 && (
                                <Badge className="mt-1 bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                  Baixo estoque
                                </Badge>
                              )}
                              {estoqueDisponivel === 0 && (
                                <Badge className="mt-1 bg-red-100 text-red-800 border-red-200 text-xs">
                                  Sem estoque
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-slate-800">
                              R$ {formatNumber(produto.preco_venda_base)}
                            </p>
                            <p className="text-xs text-slate-500">{produto.unidade_comercial}</p>
                          </td>
                          <td className="p-4">
                            <Badge className={
                              produto.ativo
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }>
                              {produto.ativo ? 'ATIVO' : 'INATIVO'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-slate-600">
                              {new Date(produto.updated_at).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(produto.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => handleEdit(produto)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => deleteProduto(produto.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {produtos.length > 0 && (
              <div className="flex justify-between items-center p-4 border-t bg-slate-50">
                <p className="text-sm text-slate-600">
                  Mostrando <span className="font-semibold">{produtos.length}</span> de <span className="font-semibold">{stats.total}</span> produtos
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>Anterior</Button>
                  <Button variant="outline" size="sm" disabled>Próximo</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}