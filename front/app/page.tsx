"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Phone, MapPin,
  ArrowRight, Menu, X, Star, CheckCircle2, Leaf, Shield, Check
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPageFernandesMadeira() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const products = [
    {
      title: "Mourões Selecionados",
      subtitle: "Alta densidade para cercas rurais e urbanas que duram décadas.",
      dims: "Ø 8–25cm · 1,5–3m",
      badge: "Mais Procurado",
      img: "https://www.madesch.com.br/wp-content/uploads/2023/05/madesch-empresa-referencia-em-tratamento-de-madeira-em-santa-catarina-1024x576.png",
      highlight: true
    },
    {
      title: "Postes Estruturais",
      subtitle: "Robustez testada para sustentação, redes elétricas e galpões.",
      dims: "Ø 10–20cm · 6–12m",
      badge: "Alta Resistência",
      img: "https://images.tcdn.com.br/img/img_prod/985953/kit_2_eucaliptos_tratados_18_a_20_6m_central_norte_madeiras_1043_1_224478cd7fe9361ddb6854c50bf85828.jpg",
      highlight: false
    },
    {
      title: "Vigas e Caibros",
      subtitle: "Alinhamento perfeito e resistência mecânica para o seu telhado.",
      dims: "Seções variadas · Sob medida",
      badge: "Corte Preciso",
      img: "https://brisamadeiras.com.br/product_images/r/eucalipto_tratado_grosso__81343_zoom__34475_zoom.jpg",
      highlight: false
    },
    {
      title: "Eucalipto In Natura",
      subtitle: "",
      dims: "",
      badge: "Linha In Natura",
      img: "data:image/jpeg;base64,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",
      highlight: false
    },
  ];

  return (
    <div className="font-sans bg-[#F8FAFC] text-slate-900 overflow-x-hidden antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .font-display { font-family: 'Cabinet Grotesk', sans-serif; }
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .text-gradient-green {
          background: linear-gradient(135deg, #047857 0%, #064E3B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .shadow-soft {
          box-shadow: 0 4px 40px -2px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* ── NAVBAR ESTILO BANCO (CLEAN & TRUST) ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-3" : "bg-white/80 backdrop-blur-sm border-b border-slate-200 py-4"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* O ideal é usar a logo, deixei o texto estilizado como fallback caso a imagem falhe */}
            <Image src="/logoFM.png" alt="Fernandes Madeira" width={50} height={50} className="h-auto w-auto max-h-[45px] object-contain" priority />
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-xl text-[#064E3B] leading-none tracking-tight">FERNANDES</h1>
              <span className="font-body font-medium text-xs text-slate-500 tracking-widest uppercase">Madeiras</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {["Produtos", "Qualidade", "Garantia", "Contato"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="font-body text-sm font-medium text-slate-600 hover:text-[#047857] transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <Phone size={16} className="text-[#047857]" />
              <span className="font-body font-semibold text-sm text-slate-700">(38) 99902-8181</span>
            </div>
            <Link href="/contato">
              <Button className="bg-[#064E3B] hover:bg-[#047857] text-white font-body font-semibold text-sm rounded-lg px-6 py-5 transition-all shadow-md hover:shadow-lg">
                Solicitar Cotação
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-slate-800" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-6 flex flex-col gap-4 shadow-lg absolute w-full">
            {["Produtos", "Qualidade", "Garantia", "Contato"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="font-body font-medium text-base text-slate-600 py-3 border-b border-slate-100">
                {item}
              </a>
            ))}
            <div className="flex items-center gap-2 py-2 text-slate-700">
              <Phone size={18} className="text-[#047857]" />
              <span className="font-body font-bold">(38) 99902-8181</span>
            </div>
            <Link href="/contato" className="w-full mt-2">
              <Button className="w-full bg-[#064E3B] text-white font-semibold py-6 rounded-xl">Solicitar Cotação</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION: LEVEZA, NATUREZA E CORPORATIVO ── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <img src="https://portalcelulose.com.br/wp-content/uploads/2023/10/Florestas-de-eucalipto-da-Suzano-devem-ocupar-17-milhao-de-hectares-ate-2024.jpg" alt="Floresta de Eucalipto" className="w-full h-full object-cover opacity-[0.07]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-[#F8FAFC]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-2 rounded-full shadow-sm">
              <ShieldCheck size={16} className="text-[#059669]" />
              <span className="font-body text-xs font-semibold text-[#064E3B] uppercase tracking-wide">Direto da Fonte • Itamarandiba/MG</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-6xl lg:text-[4rem] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Solidez que a sua obra exige. <br />
              <span className="text-gradient-green">Preço que o seu negócio precisa.</span>
            </h1>
            
            <p className="font-body text-slate-600 text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Madeira de eucalipto tratada em autoclave com rigorosos padrões de qualidade. Garantimos segurança estrutural, durabilidade e as melhores condições diretas do produtor.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link href="/contato" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#064E3B] hover:bg-[#047857] text-white font-body font-semibold px-8 py-7 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Solicitar Orçamento
                </Button>
              </Link>
              <Link href="#produtos" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-body font-semibold px-8 py-7 rounded-xl text-sm transition-colors">
                  Conhecer Produtos
                </Button>
              </Link>
            </div>
          </div>

          {/* CARD DE BENEFÍCIOS TIPO "FINTECH/BANCO" */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#059669]/10 to-transparent rounded-3xl blur-2xl transform -rotate-6"></div>
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-soft relative z-10">
              <h3 className="font-display text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Shield className="text-[#059669]" size={24} /> Vantagens Corporativas
              </h3>
              <div className="space-y-5">
                {[
                  { t: "Atendimento Especializado", d: "Consultoria técnica para grandes volumes e construtoras." },
                  { t: "Logística Própria", d: "Entregas rastreadas, seguras e pontuais para todo o Brasil." },
                  { t: "Certificação de Tratamento", d: "Garantia real contra agentes causadores de danos." },
                ].map((b, i) => (
                  <div key={i} className="flex gap-4 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="bg-[#ECFDF5] p-2 rounded-lg shrink-0">
                      <Check className="text-[#059669]" size={18} />
                    </div>
                    <div>
                      <h4 className="font-body font-semibold text-slate-800">{b.t}</h4>
                      <p className="font-body text-sm text-slate-500 mt-1 leading-relaxed">{b.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO VITRINE: PRODUTOS ── */}
      <section id="produtos" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-body text-sm font-bold tracking-widest text-[#059669] uppercase flex justify-center items-center gap-2">
              <Leaf size={16} /> Nosso Portfólio
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 mt-4">
              Soluções Estruturais
            </h2>
            <p className="font-body text-slate-600 mt-4 text-lg">
              Madeiras rigorosamente selecionadas para atender às normas técnicas do seu projeto, garantindo o melhor acabamento e vida útil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, idx) => (
              <div key={idx} className={`bg-white rounded-2xl overflow-hidden border ${product.highlight ? 'border-[#059669] shadow-lg relative transform lg:-translate-y-2' : 'border-slate-200 shadow-sm'} flex flex-col justify-between transition-all hover:shadow-xl group`}>
                {product.highlight && (
                  <div className="bg-[#059669] text-white text-center text-xs font-bold uppercase py-1.5 font-body tracking-wider">
                    Destaque
                  </div>
                )}
                <div className="relative h-56 bg-slate-100 overflow-hidden">
                  <img src={product.img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-800 font-body text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-sm">
                    {product.badge}
                  </span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">{product.title}</h3>
                    <p className="font-body text-sm font-medium text-[#059669] mt-1">{product.dims}</p>
                    <p className="font-body text-sm text-slate-600 mt-3 line-clamp-3 leading-relaxed">{product.subtitle}</p>
                  </div>

                  <Link href="/contato" className="block pt-6">
                    <Button className={`w-full font-body text-sm font-semibold py-6 rounded-xl transition-all flex items-center justify-center gap-2 ${product.highlight ? 'bg-[#064E3B] text-white hover:bg-[#047857]' : 'bg-slate-50 text-slate-700 hover:bg-[#064E3B] hover:text-white'}`}>
                      Fazer Pedido <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO QUALIDADE: MATRIZ ESTILO BANCO ── */}
      <section id="qualidade" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="font-body text-sm font-bold tracking-widest text-[#059669] uppercase">Transparência Total</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Investimento inteligente para longo prazo.
            </h2>
            <p className="font-body text-slate-600 text-lg leading-relaxed">
              O barato sai caro na construção civil. Nosso foco é entregar o menor custo por ano útil do mercado, combinando matéria-prima de excelência com tratamento de verdade.
            </p>
          </div>

          <div className="lg:col-span-7 bg-white shadow-soft border border-slate-200 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 p-5 font-body text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <div>Fator de Qualidade</div>
              <div className="text-[#064E3B]">Fernandes Madeiras</div>
              <div className="text-slate-400">Padrão de Mercado</div>
            </div>
            <div className="divide-y divide-slate-100 font-body text-sm">
              {[
                { f: "Origem do Eucalipto", a: "Itamarandiba/MG (Referência)", b: "Fontes não certificadas" },
                { f: "Tratamento (Autoclave)", a: "Penetração total no alburno", b: "Tratamento superficial" },
                { f: "Índice de Rachaduras", a: "Baixíssimo (Secagem Controlada)", b: "Alta incidência e perda" },
                { f: "Cadeia de Fornecimento", a: "Direto da Produção", b: "Múltiplos intermediários" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="text-slate-700 font-semibold">{row.f}</div>
                  <div className="text-[#059669] font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0" /> {row.a}
                  </div>
                  <div className="text-slate-500">{row.b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER CORPORATIVO ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#064E3B]">
          {/* Textura sutil de fundo */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-8">
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} size={20} className="fill-[#F59E0B] text-[#F59E0B]" />)}
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Pronto para fechar o melhor negócio?
          </h2>
          <p className="font-body font-medium text-[#D1FAE5] max-w-2xl mx-auto text-lg">
            Envie sua lista de medidas e especificações. Nossa equipe está a postos para estruturar um orçamento imbatível com logística otimizada para sua região.
          </p>
          <div className="pt-4 flex justify-center">
            <Link href="https://wa.me/5538999028181">
              <Button className="bg-white text-[#064E3B] hover:bg-slate-100 font-body font-bold text-sm uppercase tracking-wide px-10 py-7 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center gap-2">
                Falar com Consultor Agora <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER INSTITUCIONAL ── */}
      <footer id="contato" className="bg-[#022C22] pt-16 pb-8 px-6 text-slate-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 border-b border-white/10 pb-16">
          
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white/5 inline-block p-4 rounded-xl border border-white/10">
               <Image src="/logoFM.png" alt="Fernandes Madeira" width={120} height={40} className="object-contain brightness-0 invert" />
            </div>
            <p className="font-body text-sm text-slate-400 leading-relaxed pr-8">
              Referência em tratamento de madeiras de alto padrão. Produção direta de Itamarandiba/MG para garantir a segurança da sua obra.
            </p>
            <div className="font-body text-sm font-semibold text-white bg-white/5 inline-block px-4 py-2 rounded-lg border border-white/10">
              CNPJ: 50.775.091/0001-05
            </div>
          </div>
          
          <div className="md:col-span-3 space-y-6">
            <h4 className="font-body font-bold text-sm uppercase tracking-widest text-[#10B981]">Escritório & Fábrica</h4>
            <div className="flex items-start gap-3 text-sm text-slate-400 font-body">
              <MapPin size={18} className="text-[#10B981] shrink-0 mt-1" />
              <p className="leading-relaxed">Centro de Distribuição Base<br />Itamarandiba, Minas Gerais<br />Capital Nacional do Eucalipto</p>
            </div>
          </div>

          <div className="md:col-span-3 space-y-6">
            <h4 className="font-body font-bold text-sm uppercase tracking-widest text-[#10B981]">Canais de Atendimento</h4>
            <div className="space-y-4 text-sm text-slate-400 font-body">
              <a href="https://wa.me/5538999028181" className="flex items-center gap-3 hover:text-white transition-colors group">
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-[#10B981] transition-colors"><Phone size={16} className="text-white" /></div> 
                <span className="font-semibold text-white">(38) 99902-8181</span>
              </a>
              
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col justify-end pb-2">
            <Link href="/contato">
              <Button className="w-full bg-[#064E3B] hover:bg-[#047857] text-white font-body text-sm font-semibold rounded-xl py-6 transition-colors shadow-lg border border-white/10">
                Área do Cliente
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-body text-slate-500 text-xs font-medium tracking-wide">
            © {new Date().getFullYear()} Fernandes Madeiras. Todos os direitos reservados.
          </p>
          <p className="font-body text-slate-500 text-xs font-medium tracking-wide">
            Desenvolvido por{" "}
            <a href="https://wa.me/5538998542340?text=Olá%20Kayk" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white underline decoration-slate-600 underline-offset-4">
              Kayk
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}