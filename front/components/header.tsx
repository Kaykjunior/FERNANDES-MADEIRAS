"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home, ShoppingCart, UserCheck, Building2, BarChart3,
  DollarSign, ClipboardList, PackageSearch, PlusCircle,
  Warehouse, UserCog, Truck, ChevronDown, LogOut,
  Bell, UserCircle, MapPin, Menu, ShieldX, Lock,
  BanknoteArrowDown
} from "lucide-react";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { getUserCargp, getUserId, getUserNome } from "@/lib/auth";

export enum UserRole {
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',
  VENDEDOR = 'VENDEDOR',
  ESTOQUISTA = 'ESTOQUISTA',
  FINANCEIRO = 'FINANCEIRO',
}

const routePermissions: Record<string, UserRole[]> = {
  "/restrito/home": [UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR, UserRole.ESTOQUISTA, UserRole.FINANCEIRO],
  "/restrito/comercial/vendas": [UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR],
  "/restrito/vendedores": [UserRole.ADMIN, UserRole.GERENTE],
  "/restrito/pedidos": [UserRole.ADMIN, UserRole.GERENTE, UserRole.VENDEDOR],
  "/restrito/entidades": [UserRole.ADMIN, UserRole.GERENTE],
  "/restrito/financeiro": [UserRole.ADMIN, UserRole.GERENTE, UserRole.FINANCEIRO],
  "/restrito/financeiro/faturamento": [UserRole.ADMIN, UserRole.GERENTE, UserRole.FINANCEIRO],
  "/restrito/vendedores/pagamento-comissoes": [UserRole.ADMIN, UserRole.GERENTE, UserRole.FINANCEIRO],
  "restrito/financeiro/contas-pagar": [UserRole.ADMIN, UserRole.GERENTE, UserRole.FINANCEIRO],
  "/restrito/produtos": [UserRole.ADMIN, UserRole.GERENTE, UserRole.ESTOQUISTA],
  "/restrito/produtos/cadastro": [UserRole.ADMIN, UserRole.GERENTE],
  "/restrito/produtos/estoque": [UserRole.ADMIN, UserRole.GERENTE, UserRole.ESTOQUISTA],
  "/restrito/usuarios": [UserRole.ADMIN],
  "/restrito/expedicao": [UserRole.ADMIN, UserRole.GERENTE, UserRole.ESTOQUISTA],
};

function canAccess(route: string, role: UserRole | null): boolean {
  if (!role) return false;
  return routePermissions[route]?.includes(role) ?? false;
}

function getAllowedRolesLabel(route: string): string {
  const roles = routePermissions[route] ?? [];
  const labels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    GERENTE: "Gerente",
    VENDEDOR: "Vendedor",
    ESTOQUISTA: "Estoquista",
    FINANCEIRO: "Financeiro",
  };
  return roles.map(r => labels[r]).join(", ");
}

// Modal de acesso negado
function AccessDeniedModal({
  open,
  onClose,
  routeLabel,
  route,
  userCargo,
}: {
  open: boolean;
  onClose: () => void;
  routeLabel: string;
  route: string;
  userCargo: UserRole | null;
}) {
  const allowedRoles = getAllowedRolesLabel(route);
  const cargoLabels: Record<string, string> = {
    ADMIN: "Administrador", GERENTE: "Gerente", VENDEDOR: "Vendedor",
    ESTOQUISTA: "Estoquista", FINANCEIRO: "Financeiro",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20">
              <ShieldX className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg font-black uppercase tracking-wide">
                Acesso Restrito
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                Permissão insuficiente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-300">
            Seu cargo não possui permissão para acessar{" "}
            <span className="font-bold text-white">"{routeLabel}"</span>.
          </p>

          <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 uppercase tracking-wider font-bold">Seu cargo</span>
              <Badge variant="outline" className="border-rose-500/40 text-rose-400 font-black text-[10px] uppercase">
                {userCargo ? (cargoLabels[userCargo] ?? userCargo) : "—"}
              </Badge>
            </div>
            <div className="h-px bg-slate-700" />
            <div className="space-y-1.5">
              <span className="text-slate-400 uppercase tracking-wider font-bold text-xs">Cargos permitidos</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(routePermissions[route] ?? []).map((role) => (
                  <Badge key={role} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                    {cargoLabels[role] ?? role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="h-3 w-3 flex-shrink-0" />
            Solicite ao administrador do sistema caso precise de acesso.
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-xs border border-slate-600"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Item de menu com suporte a bloqueio
function RestrictedDropdownItem({
  href,
  label,
  icon,
  allowed,
  onDenied,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  allowed: boolean;
  onDenied: (route: string, label: string) => void;
}) {
  if (allowed) {
    return (
      <DropdownMenuItem asChild>
        <Link href={href} className="cursor-pointer text-xs font-bold uppercase py-2">
          {icon} {label}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      className="text-xs font-bold uppercase py-2 text-slate-500 cursor-pointer focus:bg-slate-800/50 focus:text-slate-400"
      onClick={() => onDenied(href, label)}
    >
      <span className="flex items-center gap-2 w-full">
        <span className="opacity-40">{icon}</span>
        <span className="flex-1">{label}</span>
        <Lock className="h-3 w-3 text-rose-500/60 flex-shrink-0" />
      </span>
    </DropdownMenuItem>
  );
}

// Item mobile com bloqueio
function MobileNavItem({
  href,
  icon,
  label,
  allowed,
  onDenied,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  allowed: boolean;
  onDenied?: (route: string, label: string) => void;
}) {
  if (allowed) {
    return (
      <Link href={href} className="w-full">
        <Button variant="ghost" className="w-full justify-start text-[11px] font-black uppercase hover:bg-slate-900 gap-3 h-11 transition-colors">
          <span className="text-amber-500">{icon}</span> {label}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => onDenied?.(href, label)}
      className="w-full justify-start text-[11px] font-black uppercase hover:bg-slate-900/50 gap-3 h-11 transition-colors text-slate-500"
    >
      <span className="opacity-30">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <Lock className="h-3 w-3 text-rose-500/50" />
    </Button>
  );
}

export default function HeaderEnterprise() {
  const [UserName, setUserName] = useState<string | null>('');
  const [UserCargo, setUserCargo] = useState<UserRole | null>(null);

  // Estado do modal
  const [deniedModal, setDeniedModal] = useState<{ open: boolean; route: string; label: string }>({
    open: false, route: "", label: "",
  });

  useEffect(() => {
    setUserName(getUserNome());
    setUserCargo(getUserCargp() as UserRole);
  }, []);

  const can = (route: string) => canAccess(route, UserCargo);

  const handleDenied = (route: string, label: string) => {
    setDeniedModal({ open: true, route, label });
  };

  const navigationStructure = [
    {
      department: "ADMINISTRATIVO",
      routes: [{ path: "/restrito/home", label: "Dashboard", icon: <Home className="h-4 w-4 text-amber-500" /> }],
    },
    {
      department: "COMERCIAL",
      routes: [
        { path: "/restrito/comercial/vendas", label: "Nova Venda", icon: <ShoppingCart className="h-4 w-4 text-amber-500" /> },
        { path: "/restrito/vendedores", label: "Vendedores", icon: <UserCheck className="h-4 w-4 text-amber-500" /> },
        { path: "/restrito/pedidos", label: "Pedidos", icon: <ClipboardList className="h-4 w-4 text-amber-500" /> },
      ],
    },
    {
      department: "ENTIDADES",
      routes: [{ path: "/restrito/entidades", label: "Gerenciar Entidades", icon: <Building2 className="h-4 w-4 text-amber-500" /> }],
    },
    {
      department: "FINANCEIRO",
      routes: [
        { path: "/restrito/financeiro", label: "Visão Geral", icon: <BarChart3 className="h-4 w-4 text-amber-500" /> },
        { path: "/restrito/financeiro/faturamento", label: "Faturamento", icon: <DollarSign className="h-4 w-4 text-amber-500" /> },
        { path: "/restrito/financeiro/contas-pagar", label: "Faturamento", icon: <DollarSign className="h-4 w-4 text-amber-500" /> },
        { path: "/restrito/vendedores/pagamento-comissoes", label: "Comissões", icon: <DollarSign className="h-4 w-4 text-amber-500" /> },
      ],
    },
    {
      department: "PRODUTOS",
      routes: [
        { path: "/restrito/produtos", label: "Visão Geral", icon: <PackageSearch className="h-4 w-4 text-amber-500" /> },
        { path: "/restrito/produtos/cadastro", label: "Cadastrar Produto", icon: <PlusCircle className="h-4 w-4 text-amber-500" /> },
      ],
    },
    {
      department: "ESTOQUE",
      routes: [{ path: "/restrito/produtos/estoque", label: "Movimentações", icon: <Warehouse className="h-4 w-4 text-amber-500" /> }],
    },
    {
      department: "USUÁRIOS",
      routes: [{ path: "/restrito/usuarios", label: "Gerenciar Usuários", icon: <UserCog className="h-4 w-4 text-amber-500" /> }],
    },
  ];

  return (
    <>
      {/* Modal de acesso negado */}
      <AccessDeniedModal
        open={deniedModal.open}
        onClose={() => setDeniedModal({ open: false, route: "", label: "" })}
        routeLabel={deniedModal.label}
        route={deniedModal.route}
        userCargo={UserCargo}
      />

      <header className="w-full bg-slate-950 text-slate-200 border-b border-slate-800 sticky top-0 z-[100] shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex h-16 items-center px-4 md:px-6 gap-4">

          {/* MOBILE */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-200 hover:bg-slate-900">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-slate-950 border-slate-800 text-slate-200 p-0 w-72">
                <nav className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                  {navigationStructure.map((group) => (
                    <div key={group.department}>
                      <div className="mt-4 mb-2 px-4 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                        {group.department}
                      </div>
                      {group.routes.map((route) => (
                        <MobileNavItem
                          key={route.path}
                          href={route.path}
                          icon={route.icon}
                          label={route.label}
                          allowed={can(route.path)}
                          onDenied={handleDenied}
                        />
                      ))}
                    </div>
                  ))}
                  <div className="mt-4 mb-2 px-4 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                    OPERACIONAL
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* DESKTOP */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 px-4">
            <Link href="/restrito/home">
              <Button variant="ghost" className="text-[11px] font-black uppercase hover:bg-slate-900 h-10 px-3 transition-all">
                <Home className="mr-2 h-4 w-4" /> Início
              </Button>
            </Link>

            {/* COMERCIAL */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-[11px] font-black uppercase hover:bg-slate-900 h-10 px-3 gap-1 rounded-md transition-all outline-none">
                  Comercial <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-200 w-56">
                <RestrictedDropdownItem href="/restrito/comercial/vendas" label="Nova Venda" icon={<ShoppingCart className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/comercial/vendas")} onDenied={handleDenied} />
                <RestrictedDropdownItem href="/restrito/vendedores" label="Vendedores" icon={<UserCheck className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/vendedores")} onDenied={handleDenied} />
                <RestrictedDropdownItem href="/restrito/pedidos" label="Pedidos" icon={<ClipboardList className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/pedidos")} onDenied={handleDenied} />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ENTIDADES */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-[11px] font-black uppercase hover:bg-slate-900 h-10 px-3 gap-1 rounded-md transition-all outline-none">
                  Entidades <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-200 w-56">
                <RestrictedDropdownItem href="/restrito/entidades" label="Clientes/Fornecedores" icon={<Building2 className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/entidades")} onDenied={handleDenied} />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* FINANCEIRO */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-[11px] font-black uppercase hover:bg-slate-900 h-10 px-3 gap-1 rounded-md transition-all outline-none text-emerald-400">
                  Financeiro <ChevronDown className="h-3 w-3 text-emerald-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-200 w-56">
                <RestrictedDropdownItem href="/restrito/financeiro" label="Visão Geral" icon={<BarChart3 className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/financeiro")} onDenied={handleDenied} />
                <RestrictedDropdownItem href="/restrito/financeiro/faturamento" label="Faturamento" icon={<DollarSign className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/financeiro/faturamento")} onDenied={handleDenied} />
                <RestrictedDropdownItem href="/restrito/financeiro/contas-pagar" label="Despesas" icon={<BanknoteArrowDown className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("restrito/financeiro/contas-pagar")} onDenied={handleDenied} />
                <RestrictedDropdownItem href="/restrito/vendedores/pagamento-comissoes" label="Comissões" icon={<UserCheck className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/vendedores/pagamento-comissoes")} onDenied={handleDenied} />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* PRODUTOS */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-[11px] font-black uppercase hover:bg-slate-900 h-10 px-3 gap-1 rounded-md transition-all outline-none">
                  Produtos <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-200 w-56">
                <RestrictedDropdownItem href="/restrito/produtos" label="Visão Geral" icon={<PackageSearch className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/produtos")} onDenied={handleDenied} />
                <RestrictedDropdownItem href="/restrito/produtos/cadastro" label="Cadastrar Produto" icon={<PlusCircle className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/produtos/cadastro")} onDenied={handleDenied} />
                <RestrictedDropdownItem href="/restrito/produtos/estoque" label="Estoque" icon={<Warehouse className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/produtos/estoque")} onDenied={handleDenied} />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* USUÁRIOS */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-[11px] font-black uppercase hover:bg-slate-900 h-10 px-3 gap-1 rounded-md transition-all outline-none">
                  Usuários <ChevronDown className="h-3 w-3 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-200 w-56">
                <RestrictedDropdownItem href="/restrito/usuarios" label="Gerenciar Usuários" icon={<UserCog className="mr-2 h-4 w-4 text-amber-500" />} allowed={can("/restrito/usuarios")} onDenied={handleDenied} />
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden xl:flex flex-col items-end border-l border-slate-800 pl-4 h-8 justify-center">
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none">Unidade</span>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                <MapPin className="h-3 w-3" /> Itamarandiba/MG
              </div>
            </div>

            <Button variant="ghost" size="icon" className="relative hover:bg-slate-900 rounded-full h-9 w-9 border border-slate-800">
              <Bell className="h-4 w-4 text-slate-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-600 rounded-full border border-slate-950 animate-pulse" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-slate-900 p-1 pr-3 rounded-full transition-all border border-transparent hover:border-slate-700 group outline-none">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-amber-500">
                    <UserCircle className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="hidden sm:block text-left leading-none">
                    <p className="text-[10px] font-black text-white uppercase">{UserName}</p>
                    <p className="text-[8px] text-amber-500 font-bold uppercase tracking-tighter mt-1">{UserCargo}</p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-600 group-hover:text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 shadow-2xl">
                <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Configurações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs font-black uppercase cursor-pointer text-rose-600 focus:bg-rose-50">
                  <LogOut className="h-3 w-3 mr-2" /> Sair do Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}