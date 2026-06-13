"use client";

import React from "react";
import Image from "next/image";
import { MessageCircle, Phone, Mail, MapPin, ShieldCheck, TreeDeciduous, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ContatosPage() {
  const contatos = [
    {
      nome: "Vendedor Ailton",
      setor: "Comercial / Vendas",
      whats: "553898491321", // Coloque o número real aqui
      cor: "border-amber-500",
      icon: <TreeDeciduous className="w-5 h-5 text-amber-600" />
    },
    {
      nome: "Aguarde...",
      setor: "Financeiro / Suporte",
      whats: "5538977777777", // Coloque o número real aqui
      cor: "border-emerald-500",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      {/* HEADER / LOGO SECTION */}
      <div className="bg-slate-950 pt-12 pb-20 px-4 text-center">
        <div className="max-w-[280px] mx-auto mb-6 drop-shadow-2xl animate-in fade-in zoom-in duration-700">
          <Image
            src="/logo2.png" // Certifique-size que o nome do arquivo na pasta public está correto
            alt="Rei das Madeiras Logo"
            width={500}
            height={500}
            className="rounded-full border-4 border-amber-500 shadow-2xl"
          />
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter italic">
          Canais de Atendimento
        </h1>
        <p className="text-amber-500 font-bold uppercase text-xs tracking-[0.3em] mt-2">
          Eucalipto Tratado e In Natura
        </p>
      </div>

      {/* CONTACT CARDS SECTION */}
      <div className="max-w-md mx-auto px-4 -mt-10 space-y-4">
        {contatos.map((item, index) => (
          <Card key={index} className={`border-l-8 ${item.cor} shadow-xl hover:scale-[1.02] transition-transform`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-stone-100 p-3 rounded-full">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-lg leading-tight">{item.nome}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.setor}</p>
                </div>
              </div>
              <a 
                href={`https://wa.me/${item.whats}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="icon" className="bg-green-600 hover:bg-green-700 rounded-full h-12 w-12 shadow-lg animate-pulse">
                  <MessageCircle className="h-6 w-6 text-white" />
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* INFO EXTRA SECTION */}
      <div className="max-w-md mx-auto px-4 mt-8 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-stone-200">
          <div className="flex items-start gap-4 mb-4">
            <MapPin className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">Localização:</p>
              <p className="text-sm text-slate-600 italic">Itamarandiba / MG - O Rei do Eucalipto</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <Clock className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">Horário de Atendimento:</p>
              <p className="text-sm text-slate-600">Segunda a Sexta: 07:00 às 18:00</p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2026 Rei das Madeiras - Qualidade em cada fibra
          </p>
        </div>
      </div>
    </div>
  );
}