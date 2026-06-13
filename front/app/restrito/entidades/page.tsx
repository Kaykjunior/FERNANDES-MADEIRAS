'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_URL } from '@/lib/api';
import {
  UserPlus,
  Search,
  MapPin,
  FileText,
  Save,
  History,
  Trash2,
  Globe,
  Building2,
  Phone,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle,
  Home,
  Package,
  CreditCard,
  Briefcase,
  Star,
  Plus,
  Edit,
  X
} from "lucide-react";
import HeaderEnterprise from "@/components/header";
import { getToken } from '@/lib/auth';

// URL da API
const token = getToken();

// Tipos
type TipoEntidade = 'CLIENTE' | 'FORNECEDOR' | 'TRANSPORTADORA' | 'AMBOS';
type TipoPessoa = 'F' | 'J';
type TipoEndereco = 'PRINCIPAL' | 'COBRANCA' | 'ENTREGA' | 'COMERCIAL' | 'RESIDENCIAL' | 'OUTROS';

interface Endereco {
  id: string;
  entidadeId: string;
  tipoEndereco: TipoEndereco;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  padrao: boolean;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Entidade {
  id: string;
  tipoEntidade: TipoEntidade;
  tipoPessoa: TipoPessoa;
  documento: string;
  rgIe?: string;
  indicadorIe: 1 | 2 | 9;
  nomeRazaoSocial: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  observacoes?: string;
  regimeTributario?: 1 | 3;
  enderecos?: Endereco[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface FormData {
  tipo_entidade: TipoEntidade;
  tipo_pessoa: TipoPessoa;
  documento: string;
  rg_ie: string;
  indicador_ie: 1 | 2 | 9;
  nome_razao_social: string;
  nome_fantasia: string;
  email: string;
  telefone: string;
  celular: string;
  observacoes: string;
  regime_tributario: 1 | 3 | undefined;
}

interface EnderecoFormData {
  tipo_endereco: TipoEndereco;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  padrao: boolean;
  observacoes: string;
}

// Valores iniciais
const initialFormData: FormData = {
  tipo_entidade: 'CLIENTE',
  tipo_pessoa: 'J',
  documento: '',
  rg_ie: '',
  indicador_ie: 9,
  nome_razao_social: '',
  nome_fantasia: '',
  email: '',
  telefone: '',
  celular: '',
  observacoes: '',
  regime_tributario: undefined,
};

const initialEnderecoForm: EnderecoFormData = {
  tipo_endereco: 'PRINCIPAL',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  pais: 'Brasil',
  padrao: false,
  observacoes: ''
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

// Componente de Modal para Endereço
function EnderecoModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  isSubmitting,
  isEditing,
  entidadeNome
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: EnderecoFormData;
  onChange: (field: keyof EnderecoFormData, value: any) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  entidadeNome: string;
}) {
  if (!isOpen) return null;

  const tipoEnderecoIcons = {
    PRINCIPAL: Home,
    COBRANCA: CreditCard,
    ENTREGA: Package,
    COMERCIAL: Briefcase,
    RESIDENCIAL: Home,
    OUTROS: MapPin
  };

  const estadosBrasil = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const formatCEP = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value);
    onChange('cep', formatted);

    // Consulta CEP se tiver 8 dígitos
    const cleanCep = formatted.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` // Token direto, não objeto
            },
          }
        );
        const data = await response.json();

        if (!data.erro) {
          onChange('logradouro', data.logradouro || '');
          onChange('bairro', data.bairro || '');
          onChange('cidade', data.localidade || '');
          onChange('estado', data.uf || '');
        }
      } catch (error) {
        console.error('Erro ao consultar CEP:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold">
                  {isEditing ? 'Editar Endereço' : 'Adicionar Endereço'}
                </h2>
                <p className="text-sm text-gray-500">
                  {entidadeNome}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_endereco">Tipo de Endereço</Label>
              <Select
                value={formData.tipo_endereco}
                onValueChange={(value: TipoEndereco) => onChange('tipo_endereco', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoEnderecoIcons).map(([key, Icon]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{key.charAt(0) + key.slice(1).toLowerCase()}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="logradouro">Logradouro *</Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={(e) => onChange('logradouro', e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => onChange('numero', e.target.value)}
                placeholder="123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => onChange('complemento', e.target.value)}
                placeholder="Apto, Bloco, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => onChange('bairro', e.target.value)}
                placeholder="Centro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => onChange('cidade', e.target.value)}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => onChange('estado', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {estadosBrasil.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                value={formData.pais}
                onChange={(e) => onChange('pais', e.target.value)}
                placeholder="Brasil"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => onChange('observacoes', e.target.value)}
                placeholder="Informações adicionais"
                rows={3}
              />
            </div>

            <div className="md:col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="padrao"
                checked={formData.padrao}
                onChange={(e) => onChange('padrao', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="padrao" className="cursor-pointer">
                Definir como endereço padrão
              </Label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !formData.logradouro || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado || !formData.cep}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Atualizar Endereço' : 'Adicionar Endereço'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GestaoEntidadesCorporativas() {
  // Estados principais
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  // Estados para endereços
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [showEnderecoModal, setShowEnderecoModal] = useState(false);
  const [enderecoForm, setEnderecoForm] = useState<EnderecoFormData>(initialEnderecoForm);
  const [isEditingEndereco, setIsEditingEndereco] = useState(false);
  const [currentEnderecoId, setCurrentEnderecoId] = useState<string | null>(null);
  const [selectedEntidade, setSelectedEntidade] = useState<Entidade | null>(null);

  // Estados para notificações e feedback
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Função para exibir notificação
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  // Funções auxiliares
  const formatDocument = (value: string, tipoPessoa: TipoPessoa): string => {
    const numbers = value.replace(/\D/g, '');

    if (tipoPessoa === 'F') {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    } else {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}`;
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 10) {
      if (numbers.length <= 2) return `(${numbers}`;
      if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    } else {
      if (numbers.length <= 2) return `(${numbers}`;
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // Função para testar a conexão com a API
  const testApiConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/entidades`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Token direto, não objeto
          },
        }
      );
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response Data:', data);
        return true;
      } else {
        console.error('API Error:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('API Connection Error:', error);
      return false;
    }
  };

  // Funções de API com fetch
  const fetchEntidades = useCallback(async () => {
    try {
      setIsLoadingList(true);

      // Testar conexão primeiro
      const isConnected = await testApiConnection();
      if (!isConnected) {
        showNotification('error', 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        return;
      }

      const params = new URLSearchParams();
      params.append('limit', '10');

      if (searchTerm) {
        if (searchTerm.replace(/\D/g, '').length >= 11) {
          params.append('documento', searchTerm.replace(/\D/g, ''));
        } else {
          params.append('nome', searchTerm);
        }
      }

      if (filterTipo !== 'all') {
        params.append('tipo_entidade', filterTipo);
      }

      console.log('Fetching from:', `${API_URL}/entidades?${params.toString()}`);

      const response = await fetch(`${API_URL}/entidades?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          showNotification('error', 'Endpoint não encontrado. Verifique se a rota está correta.');
          throw new Error('Endpoint não encontrado');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Data received:', data);
      setEntidades(data.data || data || []);
    } catch (error) {
      console.error('Erro ao buscar entidades:', error);
      showNotification('error', 'Erro ao carregar lista de entidades. Verifique o console.');
    } finally {
      setIsLoadingList(false);
    }
  }, [searchTerm, filterTipo]);

  const fetchEntidadeById = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/entidades/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Entidade não encontrada');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const entidade: Entidade = await response.json();

      setFormData({
        tipo_entidade: entidade.tipoEntidade,
        tipo_pessoa: entidade.tipoPessoa,
        documento: formatDocument(entidade.documento, entidade.tipoPessoa),
        rg_ie: entidade.rgIe || '',
        indicador_ie: entidade.indicadorIe,
        nome_razao_social: entidade.nomeRazaoSocial,
        nome_fantasia: entidade.nomeFantasia || '',
        email: entidade.email || '',
        telefone: entidade.telefone ? formatPhone(entidade.telefone) : '',
        celular: entidade.celular ? formatPhone(entidade.celular) : '',
        observacoes: entidade.observacoes || '',
        regime_tributario: entidade.regimeTributario,
      });

      setIsEditing(true);
      setCurrentId(id);
      setSelectedEntidade(entidade);
      showNotification('success', 'Entidade carregada para edição');
    } catch (error: any) {
      console.error('Erro:', error);
      showNotification('error', error.message || 'Erro ao carregar entidade');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para Endereços
  const fetchEnderecosByEntidade = async (entidadeId: string) => {
    try {
      const response = await fetch(`${API_URL}/enderecos/entidade/${entidadeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEnderecos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
    }
  };

  const createEndereco = async () => {
    if (!selectedEntidade) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/enderecos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },

        body: JSON.stringify({
          ...enderecoForm,
          entidade_id: selectedEntidade.id,
          cep: enderecoForm.cep.replace(/\D/g, '')
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar endereço');
      }

      const newEndereco = await response.json();
      setEnderecos([...enderecos, newEndereco]);
      setShowEnderecoModal(false);
      setEnderecoForm(initialEnderecoForm);
      showNotification('success', 'Endereço adicionado com sucesso!');
    } catch (error) {
      showNotification('error', 'Erro ao adicionar endereço');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEndereco = async () => {
    if (!currentEnderecoId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/enderecos/${currentEnderecoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...enderecoForm,
          cep: enderecoForm.cep.replace(/\D/g, '')
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar endereço');
      }

      const updatedEndereco = await response.json();
      setEnderecos(enderecos.map(addr =>
        addr.id === currentEnderecoId ? updatedEndereco : addr
      ));
      setShowEnderecoModal(false);
      setEnderecoForm(initialEnderecoForm);
      setCurrentEnderecoId(null);
      showNotification('success', 'Endereço atualizado com sucesso!');
    } catch (error) {
      showNotification('error', 'Erro ao atualizar endereço');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEndereco = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;

    try {
      const response = await fetch(`${API_URL}/enderecos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir endereço');
      }

      setEnderecos(enderecos.filter(addr => addr.id !== id));
      showNotification('success', 'Endereço excluído com sucesso!');
    } catch (error) {
      showNotification('error', 'Erro ao excluir endereço');
    }
  };

  const setEnderecoAsPadrao = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/enderecos/${id}/padrao`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao definir endereço como padrão');
      }

      const updatedEndereco = await response.json();
      setEnderecos(enderecos.map(addr => ({
        ...addr,
        padrao: addr.id === id ? true : false
      })));
      showNotification('success', 'Endereço definido como padrão!');
    } catch (error) {
      showNotification('error', 'Erro ao definir endereço como padrão');
    }
  };

  const openEnderecoModal = (entidade: Entidade, endereco?: Endereco) => {
    setSelectedEntidade(entidade);

    if (endereco) {
      setEnderecoForm({
        tipo_endereco: endereco.tipoEndereco,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento || '',
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
        pais: endereco.pais,
        padrao: endereco.padrao,
        observacoes: endereco.observacoes || ''
      });
      setIsEditingEndereco(true);
      setCurrentEnderecoId(endereco.id);
    } else {
      setEnderecoForm(initialEnderecoForm);
      setIsEditingEndereco(false);
      setCurrentEnderecoId(null);
    }

    setShowEnderecoModal(true);
  };

  // Handlers
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      if (field === 'documento') {
        newData.documento = formatDocument(value, prev.tipo_pessoa);
      }

      if (field === 'telefone') {
        newData.telefone = formatPhone(value);
      }

      if (field === 'celular') {
        newData.celular = formatPhone(value);
      }

      return newData;
    });
  };

  const handleEnderecoFormChange = (field: keyof EnderecoFormData, value: any) => {
    setEnderecoForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validação básica
    if (!formData.nome_razao_social.trim()) {
      showNotification('error', 'Nome/Razão Social é obrigatório');
      return;
    }

    if (!formData.documento.trim()) {
      showNotification('error', 'Documento (CPF/CNPJ) é obrigatório');
      return;
    }

    try {
      setIsLoading(true);

      // Preparar dados para envio
      const dataToSend: any = {
        tipo_entidade: formData.tipo_entidade,
        tipo_pessoa: formData.tipo_pessoa,
        documento: formData.documento.replace(/\D/g, ''),
        indicador_ie: formData.indicador_ie,
        nome_razao_social: formData.nome_razao_social,
      };

      // Campos opcionais
      if (formData.rg_ie) dataToSend.rg_ie = formData.rg_ie;
      if (formData.nome_fantasia) dataToSend.nome_fantasia = formData.nome_fantasia;
      if (formData.email) dataToSend.email = formData.email;
      if (formData.telefone) dataToSend.telefone = formData.telefone.replace(/\D/g, '');
      if (formData.celular) dataToSend.celular = formData.celular.replace(/\D/g, '');
      if (formData.observacoes) dataToSend.observacoes = formData.observacoes;
      if (formData.tipo_pessoa === 'J' && formData.regime_tributario) {
        dataToSend.regime_tributario = formData.regime_tributario;
      }

      let response;
      if (isEditing && currentId) {
        response = await fetch(`${API_URL}/entidades/${currentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Token direto, não objeto
          },
          body: JSON.stringify(dataToSend),
        });
      } else {
        response = await fetch(`${API_URL}/entidades`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Token direto, não objeto
          },
          body: JSON.stringify(dataToSend),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar entidade');
      }

      const savedEntidade = await response.json();

      // Resetar formulário
      setFormData(initialFormData);
      setIsEditing(false);
      setCurrentId(null);

      // Atualizar lista
      await fetchEntidades();

      showNotification('success', isEditing
        ? 'Entidade atualizada com sucesso!'
        : 'Entidade criada com sucesso!');

    } catch (error: any) {
      console.error('Erro:', error);
      showNotification('error', error.message || 'Erro ao salvar entidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta entidade?')) return;

    try {
      const response = await fetch(`${API_URL}/entidades/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir entidade');
      }

      await fetchEntidades();
      showNotification('success', 'Entidade excluída com sucesso!');
    } catch (error: any) {
      showNotification('error', error.message || 'Erro ao excluir entidade');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/entidades/${id}/restore`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Token direto, não objeto
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao restaurar entidade');
      }

      await fetchEntidades();
      showNotification('success', 'Entidade restaurada com sucesso!');
    } catch (error: any) {
      showNotification('error', error.message || 'Erro ao restaurar entidade');
    }
  };

  const handleEdit = (entidade: Entidade) => {
    fetchEntidadeById(entidade.id);
    fetchEnderecosByEntidade(entidade.id);
  };

  const handleNew = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setCurrentId(null);
    setSelectedEntidade(null);
    setEnderecos([]);
  };

  // Carregar entidades ao montar componente
  useEffect(() => {
    fetchEntidades();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderEnterprise />

      <main className="container mx-auto px-4 py-8">
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Edit className="h-5 w-5" />
                      Editar Entidade
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Nova Entidade
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_entidade">Tipo de Entidade</Label>
                      <Select
                        value={formData.tipo_entidade}
                        onValueChange={(value: TipoEntidade) => handleInputChange('tipo_entidade', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLIENTE">Cliente</SelectItem>
                          <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                          <SelectItem value="TRANSPORTADORA">Transportadora</SelectItem>
                          <SelectItem value="AMBOS">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
                      <Select
                        value={formData.tipo_pessoa}
                        onValueChange={(value: TipoPessoa) => handleInputChange('tipo_pessoa', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="F">Pessoa Física</SelectItem>
                          <SelectItem value="J">Pessoa Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documento">
                        {formData.tipo_pessoa === 'F' ? 'CPF' : 'CNPJ'} *
                      </Label>
                      <Input
                        id="documento"
                        value={formData.documento}
                        onChange={(e) => handleInputChange('documento', e.target.value)}
                        placeholder={formData.tipo_pessoa === 'F' ? '000.000.000-00' : '00.000.000/0000-00'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rg_ie">
                        {formData.tipo_pessoa === 'F' ? 'RG' : 'Inscrição Estadual'}
                      </Label>
                      <Input
                        id="rg_ie"
                        value={formData.rg_ie}
                        onChange={(e) => handleInputChange('rg_ie', e.target.value)}
                        placeholder={formData.tipo_pessoa === 'F' ? '00.000.000-0' : '000.000.000'}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="nome_razao_social">
                        {formData.tipo_pessoa === 'F' ? 'Nome Completo *' : 'Razão Social *'}
                      </Label>
                      <Input
                        id="nome_razao_social"
                        value={formData.nome_razao_social}
                        onChange={(e) => handleInputChange('nome_razao_social', e.target.value)}
                        placeholder={formData.tipo_pessoa === 'F' ? 'Nome completo' : 'Razão social'}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                      <Input
                        id="nome_fantasia"
                        value={formData.nome_fantasia}
                        onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                        placeholder="Nome fantasia (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        placeholder="(00) 0000-0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="celular">Celular</Label>
                      <Input
                        id="celular"
                        value={formData.celular}
                        onChange={(e) => handleInputChange('celular', e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    {formData.tipo_pessoa === 'J' && (
                      <div className="space-y-2">
                        <Label htmlFor="regime_tributario">Regime Tributário</Label>
                        <Select
                          value={formData.regime_tributario?.toString() || ''}
                          onValueChange={(value) => handleInputChange('regime_tributario', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Simples Nacional</SelectItem>
                            <SelectItem value="3">Lucro Real</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="indicador_ie">Indicador de IE</Label>
                      <Select
                        value={formData.indicador_ie.toString()}
                        onValueChange={(value) => handleInputChange('indicador_ie', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Contribuinte</SelectItem>
                          <SelectItem value="2">Isento</SelectItem>
                          <SelectItem value="9">Não Contribuinte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        placeholder="Observações adicionais"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {isEditing ? 'Atualizar Entidade' : 'Criar Entidade'}
                    </Button>

                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleNew}
                        disabled={isLoading}
                      >
                        Nova Entidade
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Seção de Endereços (mostra apenas quando uma entidade está selecionada) */}
            {selectedEntidade && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Endereços
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openEnderecoModal(selectedEntidade)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {enderecos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum endereço cadastrado</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => openEnderecoModal(selectedEntidade)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Endereço
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enderecos.map((endereco) => (
                        <div key={endereco.id} className={`border rounded-lg p-4 ${endereco.padrao ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {endereco.padrao && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                              <Badge variant={endereco.padrao ? "default" : "outline"}>
                                {endereco.tipoEndereco}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEnderecoAsPadrao(endereco.id)}
                                disabled={endereco.padrao}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEnderecoModal(selectedEntidade, endereco)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteEndereco(endereco.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">{endereco.logradouro}, {endereco.numero}</p>
                            {endereco.complemento && (
                              <p className="text-gray-600">Complemento: {endereco.complemento}</p>
                            )}
                            <p className="text-gray-600">{endereco.bairro}</p>
                            <p className="text-gray-600">{endereco.cidade} - {endereco.estado}</p>
                            <p className="text-gray-600">CEP: {endereco.cep}</p>
                            {endereco.observacoes && (
                              <p className="text-gray-600 text-xs mt-1">{endereco.observacoes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lista de Entidades */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Entidades Cadastradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filtros */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Buscar por nome ou documento..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <Select
                      value={filterTipo}
                      onValueChange={setFilterTipo}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="CLIENTE">Clientes</SelectItem>
                        <SelectItem value="FORNECEDOR">Fornecedores</SelectItem>
                        <SelectItem value="TRANSPORTADORA">Transportadoras</SelectItem>
                        <SelectItem value="AMBOS">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={fetchEntidades}
                      variant="outline"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                  </div>

                  {/* Tabela */}
                  {isLoadingList ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : entidades.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma entidade encontrada</p>
                      {searchTerm && (
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setSearchTerm('');
                            fetchEntidades();
                          }}
                        >
                          Limpar busca
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome/Razão Social</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entidades.map((entidade) => (
                            <TableRow key={entidade.id}>
                              <TableCell>
                                <div className="font-medium">{entidade.nomeRazaoSocial}</div>
                                {entidade.nomeFantasia && (
                                  <div className="text-sm text-gray-500">{entidade.nomeFantasia}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-mono text-sm">
                                  {formatDocument(entidade.documento, entidade.tipoPessoa)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={
                                    entidade.tipoEntidade === 'CLIENTE' ? 'default' :
                                      entidade.tipoEntidade === 'FORNECEDOR' ? 'secondary' :
                                        entidade.tipoEntidade === 'TRANSPORTADORA' ? 'outline' : 'destructive'
                                  }>
                                    {entidade.tipoEntidade}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {entidade.tipoPessoa === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(entidade)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {entidade.deletedAt ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRestore(entidade.id)}
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDelete(entidade.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="text-sm text-gray-500">
                    {entidades.length > 0 && (
                      <p>Mostrando {entidades.length} entidade(s)</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Endereço */}
      <EnderecoModal
        isOpen={showEnderecoModal}
        onClose={() => {
          setShowEnderecoModal(false);
          setEnderecoForm(initialEnderecoForm);
          setCurrentEnderecoId(null);
        }}
        onSubmit={isEditingEndereco ? updateEndereco : createEndereco}
        formData={enderecoForm}
        onChange={handleEnderecoFormChange}
        isSubmitting={isLoading}
        isEditing={isEditingEndereco}
        entidadeNome={selectedEntidade?.nomeRazaoSocial || ''}
      />
    </div>
  );
}