"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Truck, Phone, MapPin, Award,
  ArrowRight, Menu, X, Star, CheckCircle2, TrendingDown, Sparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPageFernandesMadeira() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const products = [
    {
      title: "Mourões Selecionados",
      subtitle: "Alta densidade para cercas rurais e urbanas que duram décadas.",
      dims: "Ø 8–25cm · 1,5–3m",
      badge: "Campeão de Vendas",
      img: "https://www.madesch.com.br/wp-content/uploads/2023/05/madesch-empresa-referencia-em-tratamento-de-madeira-em-santa-catarina-1024x576.png",
      highlight: true
    },
    {
      title: "Postes Estruturais",
      subtitle: "Robustez testada para sustentação, redes elétricas e galpões.",
      dims: "Ø 10–20cm · 6–12m",
      badge: "Força Máxima",
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
      title: "Ripas & Decks Nobres",
      subtitle: "Tratamento de autoclave premium para acabamentos de alto padrão.",
      dims: "Espessuras de 2–5cm",
      badge: "Linha Premium",
      img: "https://madeireirapinhal.com.br/deck",
      highlight: false
    },
  ];

  return (
    <div className="font-sans bg-[#0A0A0A] text-white overflow-x-hidden antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .font-display { font-family: 'Cabinet Grotesk', sans-serif; }
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .text-gradient-orange {
          background: linear-gradient(135deg, #F7941D 0%, #FFC15E 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-gradient-green {
          background: linear-gradient(135deg, #39E639 0%, #1F7A2E 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .bg-glow-green {
          box-shadow: 0 0 50px -10px rgba(57, 230, 57, 0.15);
        }
      `}</style>

      {/* ── NAVBAR RETRÁTIL PREMIUM ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 py-3" : "bg-transparent py-5"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Image src="/logoFM.png" alt="Fernandes Madeira" width={80} height={80} className="h-auto w-auto max-h-[50px] object-contain" priority />
          
          <div className="hidden md:flex items-center gap-8">
            {["Produtos", "Custo-Benefício", "Garantia", "Contato"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace('í', 'i')}`} className="font-body text-sm text-gray-300 hover:text-[#F7941D] transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <Link href="/contato">
              <Button className="bg-gradient-to-r from-[#F7941D] to-[#FFC15E] text-black font-body font-bold text-xs uppercase tracking-wider rounded-lg px-5 py-5 hover:opacity-90 transition-opacity">
                Falar com Vendedor
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-[#0A0A0A] border-t border-white/10 px-6 py-6 flex flex-col gap-4">
            {["Produtos", "Custo-Benefício", "Garantia", "Contato"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace('í', 'i')}`} onClick={() => setIsMenuOpen(false)} className="font-body text-base text-gray-300 py-2 border-b border-white/5">
                {item}
              </a>
            ))}
            <Link href="/contato" className="w-full mt-2">
              <Button className="w-full bg-gradient-to-r from-[#F7941D] to-[#FFC15E] text-black font-bold py-4">Falar com Vendedor</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION: FOCO EM VENDAS AGRESSIVAS ── */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-radial-gradient">
        <div className="absolute inset-0 z-0">
          <img src="https://portalcelulose.com.br/wp-content/uploads/2023/10/Florestas-de-eucalipto-da-Suzano-devem-ocupar-17-milhao-de-hectares-ate-2024.jpg" alt="" className="w-full h-full object-cover opacity-20 filter grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#39E639]/10 border border-[#39E639]/30 px-4 py-1.5 rounded-full">
              <TrendingDown size={16} className="text-[#39E639]" />
              <span className="font-body text-xs font-semibold text-[#39E639] uppercase tracking-wider">Direto de Itamarandiba: Sem Intermediários</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-tight uppercase">
              MADEIRA TRATADA DE VERDADE. <br />
              <span className="text-gradient-orange">PREÇO DE QUEM PRODUZ.</span>
            </h1>
            
            <p className="font-body text-gray-400 text-base sm:text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Economize no seu projeto sem abrir mão da segurança. Conectamos sua demanda direto aos melhores lotes de eucalipto tratado da região, garantindo logística rápida e o melhor preço por metro linear do mercado brasileiro.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link href="/contato" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-[#F7941D] to-[#FFC15E] text-black font-body font-bold px-8 py-7 rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-[#F7941D]/20 hover:scale-[1.02] transition-transform">
                  Cotar via WhatsApp
                </Button>
              </Link>
              <Link href="/orcamento" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-transparent border border-white/20 hover:bg-white/5 text-white font-body font-bold px-8 py-7 rounded-xl text-sm uppercase tracking-wider transition-colors">
                  Ver Tabela de Preços
                </Button>
              </Link>
            </div>
          </div>

          {/* CARD DE BENEFÍCIO RÁPIDO */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md bg-glow-green space-y-6">
            <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white flex items-center gap-2">
              <Sparkles className="text-[#39E639]" size={20} /> Condições Especiais Comercial
            </h3>
            <hr className="border-white/10" />
            <div className="space-y-4">
              {[
                { t: "Carga Fechada c/ Desconto", d: "Preços de atacado imbatíveis para grandes volumes." },
                { t: "Logística Própria e Ágil", d: "Entregas programadas e coordenadas de forma segura." },
                { t: "Tratamento em Autoclave Real", d: "Garantia total contra cupins e umidade do solo." },
              ].map((b, i) => (
                <div key={i} className="flex gap-3">
                  <CheckCircle2 className="text-[#39E639] shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-body font-bold text-sm text-gray-200">{b.t}</h4>
                    <p className="font-body text-xs text-gray-400 mt-0.5">{b.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO VITRINE: PRODUTOS SEM REPETIÇÃO ── */}
      <section id="produtos" className="py-24 bg-[#F4F1EA] text-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <span className="font-body text-xs font-bold tracking-widest text-[#F7941D] uppercase">Catálogo Industrial</span>
            <h2 className="font-display text-3xl sm:text-5xl font-black uppercase mt-2">
              Soluções Prontas para a sua Estrutura
            </h2>
            <p className="font-body text-gray-600 mt-4 text-sm sm:text-base">
              Chega de layouts confusos. Apresentamos nossa linha completa de cortes padrão de forma limpa, direta e focada nas especificações técnicas exigidas pelos engenheiros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <div key={idx} className={`bg-white rounded-2xl overflow-hidden border border-[#E5E0D5] flex flex-col justify-between transition-all hover:shadow-xl ${product.highlight ? "ring-2 ring-[#F7941D]" : ""}`}>
                <div className="relative h-48 bg-gray-200">
                  <img src={product.img} alt={product.title} className="w-full h-full object-cover" />
                  <span className="absolute top-4 left-4 bg-[#0A0A0A] text-white font-body text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">
                    {product.badge}
                  </span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-tight">{product.title}</h3>
                    <p className="font-body text-xs text-gray-500 mt-1">{product.dims}</p>
                    <p className="font-body text-sm text-gray-600 mt-3 line-clamp-3">{product.subtitle}</p>
                  </div>

                  <Link href="/contato" className="block pt-2">
                    <Button className="w-full bg-[#0A0A0A] text-white hover:bg-[#F7941D] hover:text-black font-body text-xs font-bold uppercase tracking-wide py-5 rounded-lg transition-colors flex items-center justify-center gap-2">
                      Solicitar Lote <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOVA SEÇÃO: MATRIZ DE CUSTO-BENEFÍCIO (PROVA DE QUALIDADE E PREÇO) ── */}
      <section id="custo-beneficio" className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-body text-xs font-bold tracking-widest text-[#39E639] uppercase">Transparência Total</span>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase">
              Por que nosso custo por ano útil é o menor?
            </h2>
            <p className="font-body text-gray-400 text-sm leading-relaxed">
              Madeira barata sem tratamento apodrece em 2 anos. O eucalipto tratado de baixa qualidade racha na primeira seca. Nós equilibramos rigor técnico de seleção na origem com preço justo de atacado.
            </p>
          </div>

          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-white/10 p-4 font-body text-xs font-bold uppercase tracking-wider text-gray-300">
              <div>Fator de Análise</div>
              <div className="text-[#39E639]">Fernandes Madeira</div>
              <div className="text-gray-500">Madeiras Comuns</div>
            </div>
            <div className="divide-y divide-white/5 font-body text-sm">
              {[
                { f: "Origem do Lote", a: "Itamarandiba (Alto Padrão)", b: "Fontes mistas sem critério" },
                { f: "Penetração do CCB", a: "100% do Alburno Tratado", b: "Tratamento superficial apenas" },
                { f: "Rachaduras Secas", a: "Mínima (Secagem Controlada)", b: "Alta incidência de perda" },
                { f: "Custo por Intermediário", a: "Zero (Direto da Produção)", b: "Revendedores acumulando taxas" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="text-gray-300 font-medium text-xs sm:text-sm">{row.f}</div>
                  <div className="text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#39E639] shrink-0" /> {row.a}
                  </div>
                  <div className="text-gray-500 text-xs sm:text-sm">{row.b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER CONVERSÃO DIRETA ── */}
      <section className="py-24 bg-[#F7941D] text-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute rotate-45 bg-black w-96 h-96 -top-20 -left-20" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-6">
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-black text-black" />)}
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Economize no orçamento final da sua obra hoje
          </h2>
          <p className="font-body font-medium text-black/80 max-w-xl mx-auto text-sm sm:text-base">
            Envie sua lista de medidas. Nossa equipe comercial processa seu orçamento com valores de fábrica direto de Minas Gerais para o seu destino.
          </p>
          <div className="pt-4">
            <Link href="/contato">
              <Button className="bg-black text-white font-body font-bold text-xs uppercase tracking-widest px-8 py-6 rounded-xl hover:bg-black/90 transition-colors shadow-xl">
                Chamar No WhatsApp Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER LIMPO E INSTITUCIONAL ── */}
      <footer id="contato" className="bg-[#050505] border-t border-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Image src="/logoFM.png" alt="Fernandes Madeira" width={90} height={90} className="object-contain" />
            <p className="font-body text-xs text-gray-500 italic">
              "De Itamarandiba para todo o Brasil: produzindo qualidade em madeira tratada de alto rendimento."
            </p>
          </div>
          
          <div>
            <h4 className="font-body font-bold text-xs uppercase tracking-widest text-[#F7941D] mb-4">Logística & Origem</h4>
            <div className="flex items-start gap-2 text-sm text-gray-400 font-body">
              <MapPin size={16} className="text-[#F7941D] shrink-0 mt-0.5" />
              <p>Centro de Distribuição Base:<br />Itamarandiba / MG</p>
            </div>
          </div>

          <div>
            <h4 className="font-body font-bold text-xs uppercase tracking-widest text-[#F7941D] mb-4">Canais de Venda</h4>
            <div className="space-y-2 text-sm text-gray-400 font-body">
              <div className="flex items-center gap-2"><Phone size={14} className="text-[#39E639]" /> <span>(38) 99902-8181</span></div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-[#39E639]" /> <span>(38) 99999-4304</span></div>
              <p className="text-xs text-gray-500 pt-1">Mídias: @fernandes_madeira</p>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <Link href="/contato">
              <Button className="w-full bg-white/5 border border-white/10 text-white font-body text-xs font-bold uppercase rounded-lg py-4 hover:bg-white/10 transition-colors">
                Área do Representante
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-body text-gray-600 text-[11px] uppercase tracking-wider">
            © 2026 Fernandes Madeira · Todos os direitos reservados.
          </p>
          <p className="font-body text-gray-500 text-[11px] uppercase tracking-wider">
            Desenvolvido por{" "}
            <a href="https://wa.me/5538998542340?text=Olá%20Kayk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors underline">
              Kayk Junior
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}