"use client";
import React from "react";
import Image from "next/image";
import { MessageCircle, Phone, MapPin, Clock, User, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ContatosPage() {
  // Ajustado com o nome e o número conforme solicitado
  const contatos = [
    {
      nome: "Vicente Mateus",
      setor: "Consultor Comercial",
      whats: "5538999028181", 
      icon: <User className="w-6 h-6 text-[#064E3B]" />
    },
    {
      nome: "André Luiz",
      setor: "Consultor Comercial",
      whats: "5538999994304", 
      icon: <User className="w-6 h-6 text-[#064E3B]" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-body">
      {/* HEADER ELEGANTE */}
      <div className="bg-[#064E3B] pt-20 pb-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
        <div className="relative z-10 max-w-[150px] mx-auto mb-6">
          <Image
            src="/logoFM.png" 
            alt="Fernandes Madeira"
            width={200}
            height={200}
            className="brightness-0 invert object-contain"
          />
        </div>
        <h1 className="relative z-10 text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tight">
          Canais de Atendimento
        </h1>
        <p className="relative z-10 text-[#A7F3D0] font-medium uppercase text-xs tracking-[0.3em] mt-3">
          Fernandes Madeiras • Qualidade e Confiança
        </p>
      </div>

      {/* CARDS DE CONTATO */}
      <div className="max-w-md mx-auto px-4 mt-8 space-y-6">
        {contatos.map((item, index) => (
          <Card key={index} className="shadow-soft border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="bg-[#ECFDF5] p-4 rounded-2xl">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-xl">{item.nome}</h3>
                  <p className="text-xs font-bold text-[#059669] uppercase tracking-wider">{item.setor}</p>
                </div>
              </div>
              
              <a 
                href={`https://wa.me/${item.whats}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="bg-[#064E3B] hover:bg-[#047857] text-white rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform">
                  <MessageCircle className="h-6 w-6" />
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}

        {/* INFO EXTRA SECTION */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="flex items-start gap-4">
            <div className="bg-slate-100 p-3 rounded-xl">
              <MapPin className="text-[#059669]" size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Localização Base</p>
              <p className="text-sm text-slate-500 mt-1">Itamarandiba / MG - Onde a qualidade começa.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="bg-slate-100 p-3 rounded-xl">
              <Clock className="text-[#059669]" size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Horário de Atendimento</p>
              <p className="text-sm text-slate-500 mt-1">Segunda a Sexta: 07:00 às 18:00</p>
            </div>
          </div>
        </div>

        {/* BOTÃO VOLTAR */}
        <div className="text-center pt-4">
          <a href="/" className="inline-flex items-center gap-2 text-[#064E3B] font-bold text-sm hover:underline">
             Voltar para o Início <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}