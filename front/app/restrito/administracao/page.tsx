import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShieldCheck, 
  Settings, 
  Users, 
  Activity, 
  Lock, 
  Key, 
  Database,
  Terminal,
  AlertTriangle,
  FileCode,
  RefreshCcw
} from "lucide-react";
import HeaderEnterprise from "@/components/header";

export default function AdministracaoAuditoria() {
  return (
    <div className="bg-slate-100 min-h-screen font-sans pb-10">
      <HeaderEnterprise />

      {/* HEADER ADMINISTRATIVO */}
      <header className="bg-slate-900 text-white p-4 md:p-6 mb-4 md:mb-6 shadow-xl border-b-4 border-blue-600">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Painel de Controle e Compliance</h1>
            </div>
            <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-widest mt-1">
              Configurações de Sistema, Segurança e Logs de Auditoria
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none border-slate-700 text-white bg-slate-800 uppercase text-[10px] h-9">
              <Database className="mr-2 h-4 w-4" /> Backup do Sistema
            </Button>
            <Button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] h-9 px-6">
              <RefreshCcw className="mr-2 h-4 w-4" /> Sincronizar Fiscais
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6">
        <Tabs defaultValue="auditoria" className="space-y-6">
          <TabsList className="bg-slate-200 p-1 h-11 border-b border-slate-300 w-full md:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="auditoria" className="uppercase text-[10px] font-black px-6 data-[state=active]:bg-white">
              <Activity className="h-3 w-3 mr-2" /> Logs de Atividade
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="uppercase text-[10px] font-black px-6 data-[state=active]:bg-white">
              <Users className="h-3 w-3 mr-2" /> Gestão de Usuários
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="uppercase text-[10px] font-black px-6 data-[state=active]:bg-white">
              <Settings className="h-3 w-3 mr-2" /> Configurações Globais
            </TabsTrigger>
          </TabsList>

          {/* ABA AUDITORIA: MONITORAMENTO DE QUEM FEZ O QUÊ */}
          <TabsContent value="auditoria" className="space-y-4">
            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <Terminal className="h-4 w-4" /> Auditoria de Eventos do Sistema
                </CardTitle>
                <div className="flex gap-2">
                   <Input placeholder="Filtrar por Usuário ou Ação..." className="h-8 text-[10px] w-64 bg-white" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="w-[180px] text-[9px] font-black uppercase">Data / Hora</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Operador</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Módulo / Tabela</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Ação Realizada</TableHead>
                      <TableHead className="text-[9px] font-black uppercase">Impacto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { data: "29/01/2026 16:42:10", user: "CARLOS.VENDAS", mod: "VENDAS", acao: "Alteração de Preço Unitário", doc: "PED-2045", crit: "ALTA" },
                      { data: "29/01/2026 15:20:05", user: "ANA.ADMIN", mod: "FINANCEIRO", acao: "Baixa Manual de Título", doc: "DOC-99231", crit: "MÉDIA" },
                      { data: "29/01/2026 14:15:33", user: "JOAO.EXPEDICAO", mod: "ROMANEIO", acao: "Impressão de Guia de Carga", doc: "ROM-088", crit: "BAIXA" },
                      { data: "29/01/2026 09:05:12", user: "SISTEMA", mod: "ESTOQUE", acao: "Baixa Automática (Venda)", doc: "SKU-PIN12", crit: "BAIXA" },
                    ].map((log, i) => (
                      <TableRow key={i} className="hover:bg-slate-50 border-b">
                        <TableCell className="py-3 font-mono text-[10px] font-bold text-slate-500">{log.data}</TableCell>
                        <TableCell className="font-black text-[10px] text-slate-800 uppercase italic">{log.user}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[8px] font-black">{log.mod}</Badge></TableCell>
                        <TableCell>
                          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">{log.acao}</p>
                          <p className="text-[9px] text-blue-600 font-mono">Ref: {log.doc}</p>
                        </TableCell>
                        <TableCell>
                          <span className={`text-[8px] font-black px-2 py-1 rounded ${
                            log.crit === 'ALTA' ? 'bg-rose-100 text-rose-700' : 
                            log.crit === 'MÉDIA' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            CRITICIDADE {log.crit}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA USUÁRIOS: CONTROLE DE PERMISSÕES */}
          <TabsContent value="usuarios" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-slate-50 border-b py-3">
                <CardTitle className="text-xs font-black text-slate-600 uppercase">Novo Operador</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Nome Completo</Label>
                  <Input className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Login / E-mail</Label>
                  <Input className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Perfil de Acesso</Label>
                  <select className="w-full h-9 bg-white border border-slate-200 rounded px-2 text-[10px] font-black uppercase">
                    <option>Administrador</option>
                    <option>Vendedor</option>
                    <option>Operador de Pátio</option>
                    <option>Financeiro</option>
                  </select>
                </div>
                <Button className="w-full bg-slate-900 text-[10px] font-black uppercase">Criar Credenciais</Button>
              </CardContent>
            </Card>

            <div className="col-span-2 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <p className="text-[10px] font-bold text-amber-900 uppercase">Atenção: A deleção de usuários preservará os históricos de auditoria para fins de compliance.</p>
              </div>
              {/* Tabela de Usuários Ativos aqui... */}
            </div>
          </TabsContent>

          {/* ABA FISCAL: REGRAS DE NEGÓCIO */}
          <TabsContent value="fiscal" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-slate-50 border-b py-3">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <FileCode className="h-4 w-4" /> Parâmetros Fiscais (NF-e/MDF-e)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Ambiente SEFAZ</Label>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 uppercase text-[10px] w-full justify-center">Homologação</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Série NF-e</Label>
                    <Input defaultValue="1" className="h-9 text-sm text-center font-black" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Alíquota de Comissão Padrão (%)</Label>
                  <Input defaultValue="1.50" className="h-9 text-sm font-black text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-slate-50 border-b py-3">
                <CardTitle className="text-xs font-black text-slate-600 uppercase flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Segurança de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-700">Backup Automático (Nuvem)</p>
                    <p className="text-[9px] text-slate-500">Executado diariamente às 23:59h</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none uppercase text-[8px] font-black">Ativo</Badge>
                </div>
                <Button variant="outline" className="w-full text-[10px] font-black uppercase h-8 border-slate-300">
                   Alterar Chaves de API (Certificado Digital)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}