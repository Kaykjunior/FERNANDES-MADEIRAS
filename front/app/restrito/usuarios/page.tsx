'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Users,
    UserPlus,
    Search,
    Edit,
    Trash2,
    UserCog,
    CheckCircle,
    XCircle,
    Shield,
    Briefcase,
    Store,
    Package,
    DollarSign,
    Loader2,
    Eye,
    EyeOff,
    AlertCircle,
    Save
} from "lucide-react";
import HeaderEnterprise from "@/components/header";
import { getAuthHeader, getToken, logout } from '@/lib/auth';
import { API_URL } from '@/lib/api';
// URL da API

// Tipos
type UserRole = 'ADMIN' | 'GERENTE' | 'VENDEDOR' | 'ESTOQUISTA' | 'FINANCEIRO';

interface Usuario {
    id: string;
    nome: string;
    email: string;
    cargo: UserRole;
    comissaoPercentual: number;
    ativo: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

interface FormData {
    nome: string;
    email: string;
    senha: string;
    confirmarSenha: string;
    cargo: UserRole;
    comissaoPercentual: number;
    ativo: boolean;
}

// Valores iniciais
const initialFormData: FormData = {
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cargo: 'VENDEDOR',
    comissaoPercentual: 0,
    ativo: true
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

// Componente de confirmação
function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'warning'
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'warning' | 'danger';
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant={type === 'danger' ? 'destructive' : 'default'}
                            onClick={onConfirm}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GestaoUsuarios() {
    // Estados principais
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Estados para modais e confirmações
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'warning' | 'danger';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => { }
    });

    // Função para exibir notificação
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
    };

    // Funções de API
    const fetchUsuarios = async () => {
        try {
            setIsLoadingList(true);

            // Pega o token diretamente
            const token = getToken(); // Alterado para getToken()

            if (!token) {
                showNotification('error', 'Usuário não autenticado. Faça login novamente.');
                return;
            }

            const response = await fetch(`${API_URL}/usuario`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Token direto, não objeto
                },
            });


            if (!response.ok) {
                if (response.status === 401) {
                    showNotification('error', 'Sessão expirada. Faça login novamente.');
                    logout(); // Chama logout para limpar localStorage
                    return;
                }
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setUsuarios(data);
            showNotification('success', `Usuários carregados: ${data.length} encontrados`);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            showNotification('error', 'Erro ao carregar lista de usuários');
        } finally {
            setIsLoadingList(false);
        }
    };

    const fetchUsuarioById = async (id: string) => {
        try {
            setIsLoading(true);
            const token = getToken(); // Alterado para getToken()

            if (!token) {
                showNotification('error', 'Usuário não autenticado. Faça login novamente.');
                return;
            }

            const response = await fetch(`${API_URL}/usuario/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar usuário');
            }

            const usuario: Usuario = await response.json();

            setFormData({
                nome: usuario.nome,
                email: usuario.email,
                senha: '',
                confirmarSenha: '',
                cargo: usuario.cargo,
                comissaoPercentual: usuario.comissaoPercentual,
                ativo: usuario.ativo
            });

            setIsEditing(true);
            setCurrentId(id);
            showNotification('success', 'Usuário carregado para edição');
        } catch (error: any) {
            console.error('Erro:', error);
            showNotification('error', error.message || 'Erro ao carregar usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const createUsuario = async () => {
        try {
            setIsLoading(true);
            const token = getToken(); // Alterado para getToken()

            if (!token) {
                showNotification('error', 'Usuário não autenticado. Faça login novamente.');
                return;
            }

            const response = await fetch(`${API_URL}/usuario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: formData.nome,
                    email: formData.email,
                    senha: formData.senha,
                    cargo: formData.cargo,
                    comissaoPercentual: formData.comissaoPercentual
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar usuário');
            }

            await fetchUsuarios();
            resetForm();
            showNotification('success', 'Usuário criado com sucesso!');
        } catch (error: any) {
            showNotification('error', error.message || 'Erro ao criar usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const updateUsuario = async () => {
        if (!currentId) return;

        try {
            setIsLoading(true);
            const token = getToken(); // Alterado para getToken()

            if (!token) {
                showNotification('error', 'Usuário não autenticado. Faça login novamente.');
                return;
            }

            const updateData: any = {
                nome: formData.nome,
                email: formData.email,
                cargo: formData.cargo,
                comissaoPercentual: Number(formData.comissaoPercentual),
            };

            // Só atualiza a senha se foi fornecida
            if (formData.senha) {
                updateData.senha = formData.senha;
            }

            const response = await fetch(`${API_URL}/usuario/${currentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao atualizar usuário');
            }

            await fetchUsuarios();
            resetForm();
            showNotification('success', 'Usuário atualizado com sucesso!');
        } catch (error: any) {
            showNotification('error', error.message || 'Erro ao atualizar usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteUsuario = async (id: string) => {
        try {
            const token = getToken(); // Alterado para getToken()

            if (!token) {
                showNotification('error', 'Usuário não autenticado. Faça login novamente.');
                return;
            }

            const response = await fetch(`${API_URL}/usuario/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir usuário');
            }

            await fetchUsuarios();
            showNotification('success', 'Usuário excluído com sucesso!');
        } catch (error: any) {
            showNotification('error', error.message || 'Erro ao excluir usuário');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            setIsLoading(true);
            const token = getToken(); // Alterado para getToken()

            if (!token) {
                showNotification('error', 'Usuário não autenticado. Faça login novamente.');
                return;
            }

            const response = await fetch(`${API_URL}/usuario/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ativo: !currentStatus }),
            });

            if (!response.ok) {
                throw new Error('Erro ao alterar status do usuário');
            }

            await fetchUsuarios();
            showNotification('success', `Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`);
        } catch (error: any) {
            showNotification('error', error.message || 'Erro ao alterar status');
        } finally {
            setIsLoading(false);
        }
    };

    // Handlers
    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Validações
        if (!formData.nome.trim()) {
            showNotification('error', 'Nome é obrigatório');
            return;
        }

        if (!formData.email.trim()) {
            showNotification('error', 'E-mail é obrigatório');
            return;
        }

        if (!isEditing && !formData.senha) {
            showNotification('error', 'Senha é obrigatória para novo usuário');
            return;
        }

        if (formData.senha && formData.senha.length < 6) {
            showNotification('error', 'Senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (formData.senha !== formData.confirmarSenha) {
            showNotification('error', 'As senhas não coincidem');
            return;
        }

        if (isEditing) {
            updateUsuario();
        } else {
            createUsuario();
        }
    };

    const handleEdit = (usuario: Usuario) => {
        fetchUsuarioById(usuario.id);
    };

    const handleDelete = (usuario: Usuario) => {
        setConfirmationModal({
            isOpen: true,
            title: 'Excluir Usuário',
            message: `Tem certeza que deseja excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`,
            type: 'danger',
            onConfirm: () => {
                deleteUsuario(usuario.id);
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleToggleStatus = (usuario: Usuario) => {
        setConfirmationModal({
            isOpen: true,
            title: usuario.ativo ? 'Desativar Usuário' : 'Ativar Usuário',
            message: `Tem certeza que deseja ${usuario.ativo ? 'desativar' : 'ativar'} o usuário "${usuario.nome}"?`,
            type: 'warning',
            onConfirm: () => {
                toggleStatus(usuario.id, usuario.ativo);
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleNew = () => {
        resetForm();
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setIsEditing(false);
        setCurrentId(null);
    };

    // Ícones para cada cargo
    const cargoIcons = {
        ADMIN: Shield,
        GERENTE: Briefcase,
        VENDEDOR: UserCog,
        ESTOQUISTA: Package,
        FINANCEIRO: DollarSign
    };

    // Cores para cada cargo
    const cargoColors = {
        ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
        GERENTE: 'bg-blue-100 text-blue-800 border-blue-200',
        VENDEDOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        ESTOQUISTA: 'bg-amber-100 text-amber-800 border-amber-200',
        FINANCEIRO: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };

    // Nomes amigáveis para cargos
    const cargoNames = {
        ADMIN: 'Administrador',
        GERENTE: 'Gerente',
        VENDEDOR: 'Vendedor',
        ESTOQUISTA: 'Estoquista',
        FINANCEIRO: 'Financeiro'
    };

    // Filtrar usuários
    const filteredUsuarios = usuarios.filter(usuario => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            usuario.nome.toLowerCase().includes(searchLower) ||
            usuario.email.toLowerCase().includes(searchLower) ||
            usuario.cargo.toLowerCase().includes(searchLower) ||
            cargoNames[usuario.cargo].toLowerCase().includes(searchLower)
        );
    });

    // Carregar usuários ao montar componente
    useEffect(() => {
        fetchUsuarios();
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

                <ConfirmationModal
                    isOpen={confirmationModal.isOpen}
                    onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmationModal.onConfirm}
                    title={confirmationModal.title}
                    message={confirmationModal.message}
                    type={confirmationModal.type}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulário */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <Edit className="h-5 w-5" />
                                            Editar Usuário
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-5 w-5" />
                                            Novo Usuário
                                        </>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nome">Nome Completo *</Label>
                                            <Input
                                                id="nome"
                                                value={formData.nome}
                                                onChange={(e) => handleInputChange('nome', e.target.value)}
                                                placeholder="Nome do usuário"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">E-mail *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="usuario@empresa.com"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="senha">
                                                    {isEditing ? 'Nova Senha (opcional)' : 'Senha *'}
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="senha"
                                                        type={showPassword ? "text" : "password"}
                                                        value={formData.senha}
                                                        onChange={(e) => handleInputChange('senha', e.target.value)}
                                                        placeholder={isEditing ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                                                <Input
                                                    id="confirmarSenha"
                                                    type={showPassword ? "text" : "password"}
                                                    value={formData.confirmarSenha}
                                                    onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                                                    placeholder="Confirme a senha"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="cargo">Cargo *</Label>
                                                <Select
                                                    value={formData.cargo}
                                                    onValueChange={(value: UserRole) => handleInputChange('cargo', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o cargo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(cargoIcons).map(([key, Icon]) => (
                                                            <SelectItem key={key} value={key}>
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className="h-4 w-4" />
                                                                    <span>{cargoNames[key as UserRole]}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="comissaoPercentual">Comissão (%)</Label>
                                                <Input
                                                    id="comissaoPercentual"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                    value={formData.comissaoPercentual}
                                                    onChange={(e) => handleInputChange('comissaoPercentual', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="ativo"
                                                    checked={formData.ativo}
                                                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <Label htmlFor="ativo" className="cursor-pointer">
                                                    Usuário ativo
                                                </Label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            className="flex-1"
                                            disabled={isLoading}
                                        >
                                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            {isEditing ? 'Atualizar Usuário' : 'Criar Usuário'}
                                        </Button>

                                        {isEditing && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleNew}
                                                disabled={isLoading}
                                            >
                                                Novo Usuário
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Estatísticas */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Estatísticas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {Object.entries(cargoIcons).map(([key, Icon]) => {
                                        const count = usuarios.filter(u => u.cargo === key).length;
                                        const activeCount = usuarios.filter(u => u.cargo === key && u.ativo).length;

                                        return (
                                            <div key={key} className="text-center">
                                                <div className={`inline-flex items-center justify-center p-3 rounded-full ${cargoColors[key as UserRole].split(' ')[0]}`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div className="mt-2">
                                                    <div className="text-lg font-semibold">{count}</div>
                                                    <div className="text-sm text-gray-500">{cargoNames[key as UserRole]}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {activeCount} ativo{activeCount !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lista de Usuários */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserCog className="h-5 w-5" />
                                    Usuários Cadastrados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Filtro */}
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                <Input
                                                    placeholder="Buscar por nome, e-mail ou cargo..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={fetchUsuarios}
                                            variant="outline"
                                            disabled={isLoadingList}
                                        >
                                            <Search className="h-4 w-4 mr-2" />
                                            Atualizar
                                        </Button>
                                    </div>

                                    {/* Tabela */}
                                    {isLoadingList ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                        </div>
                                    ) : filteredUsuarios.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                            <p>Nenhum usuário encontrado</p>
                                            {searchTerm && (
                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={() => setSearchTerm('')}
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
                                                        <TableHead>Usuário</TableHead>
                                                        <TableHead>Cargo</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredUsuarios.map((usuario) => {
                                                        const CargoIcon = cargoIcons[usuario.cargo];

                                                        return (
                                                            <TableRow key={usuario.id}>
                                                                <TableCell>
                                                                    <div className="font-medium">{usuario.nome}</div>
                                                                    <div className="text-sm text-gray-500">{usuario.email}</div>
                                                                    <div className="text-xs text-gray-400">
                                                                        Comissão: {usuario.comissaoPercentual}%
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`${cargoColors[usuario.cargo]} flex items-center gap-1 w-fit`}
                                                                    >
                                                                        <CargoIcon className="h-3 w-3" />
                                                                        {cargoNames[usuario.cargo]}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        variant={usuario.ativo ? 'default' : 'secondary'}
                                                                        className="flex items-center gap-1 w-fit"
                                                                    >
                                                                        {usuario.ativo ? (
                                                                            <>
                                                                                <CheckCircle className="h-3 w-3" />
                                                                                Ativo
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <XCircle className="h-3 w-3" />
                                                                                Inativo
                                                                            </>
                                                                        )}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleEdit(usuario)}
                                                                            disabled={isLoading}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleToggleStatus(usuario)}
                                                                            disabled={isLoading}
                                                                        >
                                                                            {usuario.ativo ? (
                                                                                <XCircle className="h-4 w-4 text-gray-500" />
                                                                            ) : (
                                                                                <CheckCircle className="h-4 w-4 text-gray-500" />
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleDelete(usuario)}
                                                                            disabled={isLoading}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Contador */}
                                    <div className="text-sm text-gray-500">
                                        {filteredUsuarios.length > 0 && (
                                            <p>
                                                Mostrando {filteredUsuarios.length} de {usuarios.length} usuário(s)
                                                {searchTerm && ` - Filtro: "${searchTerm}"`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dicas */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    Informações Importantes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-purple-500 mt-0.5" />
                                        <span><strong>Administrador:</strong> Acesso total ao sistema</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Briefcase className="h-4 w-4 text-blue-500 mt-0.5" />
                                        <span><strong>Gerente:</strong> Acesso a relatórios e gestão de equipe</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <UserCog className="h-4 w-4 text-emerald-500 mt-0.5" />
                                        <span><strong>Vendedor:</strong> Criação de vendas e comissões</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Package className="h-4 w-4 text-amber-500 mt-0.5" />
                                        <span><strong>Estoquista:</strong> Gestão de estoque e movimentações</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <DollarSign className="h-4 w-4 text-indigo-500 mt-0.5" />
                                        <span><strong>Financeiro:</strong> Contas a receber/pagar e caixa</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}