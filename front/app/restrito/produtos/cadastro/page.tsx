'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Save,
  Calculator,
  Building2,
  Package,
  Grid3x3,
  Ruler,
  Weight,
  DollarSign,
  Hash,
  FileText,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle,
  Layers,
  Tag
} from "lucide-react";
import HeaderEnterprise from '@/components/header';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/api';
// URL da API

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

interface TabelaPreco {
  id: string;
  nome: string;
  tipo: string | null;
  ativo: boolean;
  padrao: boolean;
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

// Função para formatar números
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

export default function CadastroProduto() {
  const token = getToken();
  // Estados principais
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([
    { id: 1, nome: 'Mourões' },
    { id: 2, nome: 'Postinhos' },
    { id: 3, nome: 'Vigas' },
    { id: 4, nome: 'Resíduos (Serragem/Casca)' },
    { id: 5, nome: 'Ripas' },
    { id: 6, nome: 'Régua' },
  ]);

  // Tabelas de preço disponíveis e seleção do usuário
  const [tabelasPreco, setTabelasPreco] = useState<TabelaPreco[]>([]);
  const [loadingTabelas, setLoadingTabelas] = useState(true);
  // tabelaId -> { selecionada, preco }
  const [precosPorTabela, setPrecosPorTabela] = useState<Record<string, { selecionada: boolean; preco: string }>>({});

  // Estados para notificações e feedback
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Função para exibir notificação
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  // Buscar categorias da API (opcional)
  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_URL}/categorias`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      // Mantém as categorias padrão em caso de erro
    }
  };

  // Buscar tabelas de preço cadastradas
  const fetchTabelasPreco = async () => {
    try {
      setLoadingTabelas(true);
      const response = await fetch(`${API_URL}/tabelas-preco`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        const data: TabelaPreco[] = await response.json();
        setTabelasPreco(data.filter((t) => t.ativo));
      }
    } catch (error) {
      console.error('Erro ao buscar tabelas de preço:', error);
    } finally {
      setLoadingTabelas(false);
    }
  };

  const createProduto = async (data: any) => {
    try {
      const response = await fetch(`${API_URL}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Erro ao criar produto';

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  // Vincula o produto recém-criado às tabelas de preço selecionadas
  const vincularTabelasPreco = async (produtoId: string) => {
    const selecionadas = Object.entries(precosPorTabela).filter(([, v]) => v.selecionada);

    for (const [tabelaId, val] of selecionadas) {
      const preco = Number(String(val.preco).replace(',', '.'));
      const precoFinal = isNaN(preco) || preco <= 0 ? Number(formData.preco_venda_base) : preco;

      try {
        await fetch(`${API_URL}/tabelas-preco/${tabelaId}/itens/${produtoId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ preco: precoFinal, ativo: true }),
        });
      } catch (error) {
        console.error(`Erro ao vincular produto à tabela ${tabelaId}:`, error);
      }
    }
  };

  // Handlers
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberInputChange = (field: keyof FormData, value: string) => {
    const cleanedValue = value.replace(/[^\d.,]/g, '');

    if (!cleanedValue) {
      setFormData(prev => ({
        ...prev,
        [field]: 0
      }));
      return;
    }

    const normalizedValue = cleanedValue.replace(',', '.');
    const numericValue = parseFloat(normalizedValue);

    if (isNaN(numericValue)) {
      setFormData(prev => ({
        ...prev,
        [field]: 0
      }));
      return;
    }

    if (field === 'diametro_min' || field === 'diametro_max' || field === 'categoria_id') {
      setFormData(prev => ({
        ...prev,
        [field]: Math.floor(numericValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: numericValue
      }));
    }
  };

  // Alterna a seleção de uma tabela de preço para o produto
  const handleToggleTabelaPreco = (tabelaId: string) => {
    setPrecosPorTabela(prev => {
      const atual = prev[tabelaId];
      return {
        ...prev,
        [tabelaId]: {
          selecionada: !(atual?.selecionada),
          preco: atual?.preco ?? '',
        }
      };
    });
  };

  // Atualiza o preço específico do produto em uma tabela
  const handlePrecoTabelaChange = (tabelaId: string, value: string) => {
    setPrecosPorTabela(prev => ({
      ...prev,
      [tabelaId]: {
        selecionada: prev[tabelaId]?.selecionada ?? true,
        preco: value,
      }
    }));
  };

  const handleSave = async () => {
    // Validação básica
    if (!formData.nome.trim()) {
      showNotification('error', 'Nome do produto é obrigatório');
      return;
    }

    if (!formData.ncm.trim()) {
      showNotification('error', 'NCM é obrigatório para fins fiscais');
      return;
    }

    if (formData.comprimento_mt <= 0) {
      showNotification('error', 'Comprimento deve ser maior que zero');
      return;
    }

    if (formData.diametro_min > formData.diametro_max) {
      showNotification('error', 'Diâmetro mínimo não pode ser maior que o máximo');
      return;
    }

    try {
      setIsLoading(true);

      // Preparar dados para envio
      const dataToSend: any = {
        nome: formData.nome,
        ncm: formData.ncm,
        comprimento_mt: Number(formData.comprimento_mt),
        diametro_min: Number(formData.diametro_min),
        diametro_max: Number(formData.diametro_max),
        peso_unitario_kg: Number(formData.peso_unitario_kg),
        preco_venda_base: Number(formData.preco_venda_base),
        ativo: formData.ativo,
        unidade_comercial: formData.unidade_comercial,
      };

      // Campos opcionais
      if (formData.codigo_sku && formData.codigo_sku.trim()) {
        dataToSend.codigo_sku = formData.codigo_sku;
      }

      if (formData.categoria_id && formData.categoria_id > 0) {
        dataToSend.categoria_id = Number(formData.categoria_id);
      }

      if (formData.dimensao_ripa && formData.dimensao_ripa.trim()) {
        dataToSend.dimensao_ripa = formData.dimensao_ripa;
      }

      const result = await createProduto(dataToSend);

      // Vincula às tabelas de preço selecionadas (se houver)
      if (result?.id) {
        await vincularTabelasPreco(result.id);
      }

      showNotification('success', 'Produto cadastrado com sucesso!');

      // Limpar formulário após sucesso
      handleReset();

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      showNotification('error', error.message || 'Erro ao cadastrar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setPrecosPorTabela({});
  };

  // Carregar categorias e tabelas de preço ao iniciar
  useEffect(() => {
    fetchCategorias();
    fetchTabelasPreco();
  }, []);

  // Função para calcular preço sugerido
  const calcularPrecoSugerido = () => {
    const margem = 30;
    const custoBase = formData.preco_venda_base || 0;
    return custoBase * (1 + margem / 100);
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans pb-20">
      <HeaderEnterprise />
      {/* Notificação */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 mb-6 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" /> Cadastro de Produtos
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Preencha os dados do novo produto</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="text-slate-600 font-bold uppercase text-xs"
            onClick={handleReset}
            disabled={isLoading}
          >
            Limpar Formulário
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs px-10 shadow-lg"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Cadastrar Produto
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* SEÇÃO 1: IDENTIFICAÇÃO BÁSICA */}
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
              <Building2 className="h-4 w-4" /> 1. Identificação Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1">
                <Package className="h-3 w-3" /> Nome do Produto *
              </Label>
              <Input
                placeholder="Ex: Mourão de Eucalipto Tratado 10-12 / 2,20m"
                className="h-10 font-bold"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1">
                <Hash className="h-3 w-3" /> Código SKU
              </Label>
              <Input
                placeholder="Código único do produto"
                className="h-10 font-mono"
                value={formData.codigo_sku}
                onChange={(e) => handleInputChange('codigo_sku', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Categoria *</Label>
              <select
                className="w-full p-2 bg-white border border-slate-200 rounded text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none h-10"
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
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1">
                <Grid3x3 className="h-3 w-3" /> Dimensão Ripa
              </Label>
              <Input
                placeholder="Ex: 2.5x5, 5x10"
                className="h-10"
                value={formData.dimensao_ripa}
                onChange={(e) => handleInputChange('dimensao_ripa', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 2: DIMENSÕES E ESPECIFICAÇÕES */}
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
              <Ruler className="h-4 w-4 text-emerald-600" /> 2. Dimensões e Especificações
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Comprimento (metros) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 2.20"
                className="h-10 font-bold"
                value={formData.comprimento_mt || ''}
                onChange={(e) => handleNumberInputChange('comprimento_mt', e.target.value)}
              />
              <p className="text-[9px] text-slate-400 mt-1">Em metros</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Diâmetro Mínimo (cm)</Label>
              <Input
                type="number"
                placeholder="Ex: 10"
                className="h-10"
                value={formData.diametro_min || ''}
                onChange={(e) => handleNumberInputChange('diametro_min', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Diâmetro Máximo (cm)</Label>
              <Input
                type="number"
                placeholder="Ex: 12"
                className="h-10"
                value={formData.diametro_max || ''}
                onChange={(e) => handleNumberInputChange('diametro_max', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1">
                <Weight className="h-3 w-3" /> Peso Unitário (kg) *
              </Label>
              <Input
                type="number"
                step="0.001"
                placeholder="Ex: 12.500"
                className="h-10 font-bold"
                value={formData.peso_unitario_kg || ''}
                onChange={(e) => handleNumberInputChange('peso_unitario_kg', e.target.value)}
              />
              <p className="text-[9px] text-slate-400 mt-1">Em quilogramas</p>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3: PREÇO E COMERCIAL */}
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" /> 3. Preço e Comercial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Preço de Venda Base *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">R$</span>
                <Input
                  placeholder="0,00"
                  className="h-10 font-bold pl-10"
                  value={formData.preco_venda_base ? formatNumber(formData.preco_venda_base) : ''}
                  onChange={(e) => handleNumberInputChange('preco_venda_base', e.target.value)}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Preço de referência. As Tabelas de Preço abaixo podem sobrescrevê-lo por tabela.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">Unidade Comercial</Label>
              <Input
                placeholder="UN"
                className="h-10 font-bold uppercase"
                value={formData.unidade_comercial}
                onChange={(e) => handleInputChange('unidade_comercial', e.target.value.toUpperCase())}
              />
              <p className="text-[9px] text-slate-400 mt-1">Ex: UN, MT, KG</p>
            </div>
            <div className="space-y-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <Label className="text-[10px] uppercase font-black text-blue-700">Preço Sugerido (30% margem)</Label>
              <div className="text-lg font-black text-blue-800 pt-2">
                R$ {formatNumber(calcularPrecoSugerido())}
              </div>
            </div>
            <div className="space-y-1 flex flex-col">
              <Label className="text-[10px] uppercase font-black text-slate-400">Status</Label>
              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="text-blue-600 rounded"
                    checked={formData.ativo}
                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-600">Ativo</span>
                </label>
                <Badge className={formData.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                  {formData.ativo ? 'ATIVO' : 'INATIVO'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 4: TABELAS DE PREÇO */}
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-600" /> 4. Tabelas de Preço
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-[11px] text-slate-500 mb-4">
              Selecione em quais tabelas de preço este produto deve aparecer e, opcionalmente, defina um preço
              específico para cada tabela. Se nenhum preço for informado, será usado o <span className="font-bold">Preço de Venda Base</span>.
            </p>

            {loadingTabelas ? (
              <div className="text-center py-6 text-xs text-slate-400 uppercase">Carregando tabelas de preço...</div>
            ) : tabelasPreco.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 uppercase flex flex-col items-center gap-2">
                <Tag className="h-6 w-6 opacity-40" />
                Nenhuma tabela de preço cadastrada ainda.
                <span className="text-[10px]">Cadastre tabelas em "Tabelas de Preço" no menu.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tabelasPreco.map((tabela) => {
                  const sel = precosPorTabela[tabela.id];
                  return (
                    <div
                      key={tabela.id}
                      className={`p-3 rounded-lg border transition-all ${sel?.selecionada ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'}`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          className="text-violet-600 rounded h-4 w-4"
                          checked={!!sel?.selecionada}
                          onChange={() => handleToggleTabelaPreco(tabela.id)}
                        />
                        <span className="text-xs font-bold text-slate-700">{tabela.nome}</span>
                        {tabela.padrao && (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">Padrão</Badge>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">R$</span>
                        <Input
                          type="text"
                          disabled={!sel?.selecionada}
                          placeholder={formData.preco_venda_base ? formatNumber(formData.preco_venda_base) : '0,00'}
                          className="h-9 text-sm font-bold pl-8 disabled:bg-slate-50"
                          value={sel?.preco ?? ''}
                          onChange={(e) => handlePrecoTabelaChange(tabela.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 5: DADOS FISCAIS */}
        <Card className="border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
              <FileText className="h-4 w-4" /> 5. Dados Fiscais
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-slate-400">NCM *</Label>
              <Input
                placeholder="4403.99.00"
                className="h-10 font-mono text-sm uppercase"
                value={formData.ncm}
                onChange={(e) => handleInputChange('ncm', e.target.value)}
              />
              <p className="text-[9px] text-slate-400 mt-1">Classificação fiscal</p>
            </div>
            <div className="space-y-1 p-3 bg-slate-50 rounded border">
              <Label className="text-[10px] uppercase font-black text-slate-400">Resumo do Produto</Label>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-600">
                  <span className="font-bold">Comprimento:</span> {formData.comprimento_mt ? formatDecimal(formData.comprimento_mt, 2) : '0,00'} m
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-bold">Diâmetro:</span> {formData.diametro_min || '0'} a {formData.diametro_max || '0'} cm
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-bold">Peso:</span> {formData.peso_unitario_kg ? formatDecimal(formData.peso_unitario_kg, 3) : '0,000'} kg
                </p>
                <p className="text-xs text-slate-600">
                  <span className="font-bold">Preço Base:</span> R$ {formData.preco_venda_base ? formatNumber(formData.preco_venda_base) : '0,00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}