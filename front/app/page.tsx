"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Phone, MapPin,
  ArrowRight, Menu, X, Star, CheckCircle2, Leaf, Shield, Check, Layers, Zap
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPageFernandesMadeira() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'in-natura' | 'tratado'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const products = [
    // --- LINHA IN NATURA (ENFATIZADA) ---
    {
      title: "Eucalipto In Natura (Toras Brutas)",
      category: "in-natura",
      subtitle: "Nosso grande carro-chefe. Toras maciças selecionadas na floresta com corte sob medida. Ideal para uso rural, escoramentos pesados, estacas e indústrias.",
      dims: "Diâmetros de 8 a 40cm · Comprimentos personalizados",
      badge: "Carro-Chefe",
      img: "https://i.imgur.com/db8lHZV.jpeg",
      highlight: true
    },
    {
      title: "Peças Selecionadas In Natura",
      category: "in-natura",
      subtitle: "Alinhamento e flexibilidade ideais para a agricultura, tutoramento de lavouras, escoramentos civis e projetos de paisagismo sustentável.",
      dims: "Ø 4 a 8cm · 2m a 6m",
      badge: "Linha in-natura",
      img: "https://i.imgur.com/WKjSEHh.jpeg",
      highlight: false
    },
    {
      title: "Postes e Mourões In Natura",
      category: "in-natura",
      subtitle: "Madeira bruta de altíssima densidade natural, colhida no ponto perfeito de maturação para fundações, galpões e cercas rurais de alta firmeza.",
      dims: "Ø 10 a 25cm · Até 12 metros",
      badge: "Linha in-natura",
      img: "https://i.imgur.com/uokZgEQ.jpeg",
      highlight: false
    },
    // --- LINHA TRATADA ---
    {
      title: "Eucalipto Tratado em Autoclave",
      category: "tratado",
      subtitle: "Passa por processo industrial de vácuo-pressão com CCA. Imunizado contra cupins, brocas e umidade constante do solo.",
      dims: "Máxima durabilidade para obras definitivas",
      badge: "Linha Imunizada",
      img: "https://images.tcdn.com.br/img/img_prod/985953/kit_2_eucaliptos_tratados_14_a_16_4m_central_norte_madeiras_1031_1_263015268687bf52a08746cf994a1be7.jpg",
      highlight: false
    },
    {
      title: "Mourões Tratados Premium",
      category: "tratado",
      subtitle: "Usinados e tratados para suportar contato direto com a terra úmida por décadas sem perder a integridade estrutural.",
      dims: "04 até 30cm · até 12mt",
      badge: "Linha Imunizada",
      img: "https://i.imgur.com/cSOQmWT.jpeg",
      highlight: false
    },
    {
      title: "Vigas e Caibros Estruturais",
      category: "tratado",
      subtitle: "Corte e alinhamento milimétrico com o bônus da proteção em autoclave. Perfeito para telhados, pergolados, decks e estruturas expostas ao tempo.",
      dims: "Seções variadas · Sob medida",
      badge: "Linha Imunizada",
      img: "https://api.aecweb.com.br/cls/anuncios/pes_114925/eucalipto-tratado-em-autoclave-mwm-madeiras.webp",
      highlight: false
    },
  ];

  // Filtro inteligente para separar os mapeamentos na vitrine
  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

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
            <Image src="/logoFM.png" alt="Fernandes Madeira" width={50} height={50} className="h-auto w-auto max-h-[45px] object-contain" priority />
            <div className="hidden sm:block">
              <h1 className="font-display font-bold text-xl text-[#064E3B] leading-none tracking-tight">FERNANDES</h1>
              <span className="font-body font-medium text-xs text-slate-500 tracking-widest uppercase">Madeiras</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {["Diferenciais", "Produtos", "Qualidade", "Contato"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="font-body text-sm font-medium text-slate-600 hover:text-[#047857] transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-4">
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
            {["Diferenciais", "Produtos", "Qualidade", "Contato"].map((item) => (
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

      {/* ── HERO SECTION: ENFATIZANDO O EUCALIPTO IN NATURA ── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <img src="https://portalcelulose.com.br/wp-content/uploads/2023/10/Florestas-de-eucalipto-da-Suzano-devem-ocupar-17-milhao-de-hectares-ate-2024.jpg" alt="Floresta de Eucalipto" className="w-full h-full object-cover opacity-[0.07]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-[#F8FAFC]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-2 rounded-full shadow-sm">
              <ShieldCheck size={16} className="text-[#059669]" />
              <span className="font-body text-xs font-semibold text-[#064E3B] uppercase tracking-wide">Direto do Produtor • Itamarandiba/MG</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-6xl lg:text-[3.8rem] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Líder em Eucalipto In Natura <br />
              <span className="text-gradient-green">e Soluções em Tratado.</span>
            </h1>
            
            <p className="font-body text-slate-600 text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Especialistas no fornecimento de <strong>Eucalipto In Natura</strong> e  <strong>Tratado</strong>, selecionado na origem e com corte sob medida para o setor rural, paisagístico e industrial com o melhor custo-benefício.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link href="https://wa.me/5538999028181" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#064E3B] hover:bg-[#047857] text-white font-body font-semibold px-8 py-7 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Falar com Consultor
                </Button>
              </Link>
              <a href="#produtos" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-body font-semibold px-8 py-7 rounded-xl text-sm transition-colors">
                  Ver Linhas de Madeira
                </Button>
              </a>
            </div>
          </div>

          {/* CARD DE BENEFÍCIOS REORGANIZADO */}
          <div className="lg:col-span-5 relative" id="diferenciais">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#059669]/10 to-transparent rounded-3xl blur-2xl transform -rotate-6"></div>
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-soft relative z-10">
              <h3 className="font-display text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Shield className="text-[#059669]" size={24} /> Por que nos escolher?
              </h3>
              <div className="space-y-5">
                {[
                  { t: "Especialistas em In Natura", d: "Toras brutas e varas selecionadas a dedo direto na Capital do Eucalipto." },
                  { t: "Linha de Tratados em Autoclave", d: "Processo tecnológico que garante proteção total contra pragas e apodrecimento." },
                  { t: "Logística Própria e Ágil", d: "Frota preparada para entregas volumosas, seguras e pontuais para todo o país." },
                  { t: "Corte e Seleção Customizados", d: "Buscamos o diâmetro e comprimento exato que o seu projeto ou empresa exige." },
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

      {/* ── SEÇÃO VITRINE: MAP COM SEPARAÇÃO DE CATEGORIAS (IN NATURA E TRATADO) ── */}
      <section id="produtos" className="py-24 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-body text-sm font-bold tracking-widest text-[#059669] uppercase flex justify-center items-center gap-2">
              <Leaf size={16} /> Portfólio Estruturado
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 mt-4">
              Catálogo Especializado
            </h2>
            <p className="font-body text-slate-600 mt-4 text-lg">
              Escolha a categoria ideal para sua necessidade. Separamos nossa produção bruta nativa (In Natura) das opções com tratamento protetivo.
            </p>
          </div>

          {/* CONTROLADOR DE ABAS (FILTRO DOS MAPS) */}
          <div className="flex justify-center mb-16">
            <div className="bg-slate-200/70 p-1.5 rounded-2xl inline-flex gap-2 border border-slate-300/50">
              <button 
                onClick={() => setActiveCategory("all")} 
                className={`px-6 py-3 rounded-xl font-body font-semibold text-sm transition-all ${activeCategory === "all" ? "bg-[#064E3B] text-white shadow-md" : "text-slate-600 hover:text-slate-900"}`}
              >
                Todos os Produtos
              </button>
              <button 
                onClick={() => setActiveCategory("in-natura")} 
                className={`px-6 py-3 rounded-xl font-body font-semibold text-sm transition-all flex items-center gap-2 ${activeCategory === "in-natura" ? "bg-[#064E3B] text-white shadow-md" : "text-slate-600 hover:text-slate-900"}`}
              >
                <Leaf size={14} /> Eucalipto In Natura
              </button>
              <button 
                onClick={() => setActiveCategory("tratado")} 
                className={`px-6 py-3 rounded-xl font-body font-semibold text-sm transition-all flex items-center gap-2 ${activeCategory === "tratado" ? "bg-[#064E3B] text-white shadow-md" : "text-slate-600 hover:text-slate-900"}`}
              >
                <ShieldCheck size={14} /> Tratado em Autoclave
              </button>
            </div>
          </div>

          {/* GRID IMPRIMINDO O MAP FILTRADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, idx) => (
              <div key={idx} className={`bg-white rounded-2xl overflow-hidden border ${product.highlight ? 'border-[#059669] shadow-lg relative transform lg:-translate-y-2' : 'border-slate-200 shadow-sm'} flex flex-col justify-between transition-all hover:shadow-xl group`}>
                {product.highlight && (
                  <div className="bg-[#059669] text-white text-center text-xs font-bold uppercase py-1.5 font-body tracking-wider">
                    Destaque da Madereira
                  </div>
                )}
                <div className="relative h-60 bg-slate-100 overflow-hidden">
                  <img src={product.img} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-4 left-4 bg-white/95 backdrop-blur text-slate-800 font-body text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                    {product.category === "in-natura" ? <Leaf size={12} className="text-emerald-600" /> : <Shield size={12} className="text-blue-600" />}
                    {product.badge}
                  </span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${product.category === 'in-natura' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {product.category === 'in-natura' ? 'Madeira In Natura' : 'Madeira Tratada'}
                    </span>
                    <h3 className="font-display text-xl font-bold text-slate-900">{product.title}</h3>
                    <p className="font-body text-sm font-medium text-[#059669] bg-emerald-50 inline-block px-2.5 py-1 rounded-md">{product.dims}</p>
                    <p className="font-body text-sm text-slate-600 leading-relaxed pt-2">{product.subtitle}</p>
                  </div>

                  <Link href="https://wa.me/5538999028181" className="block pt-6">
                    <Button className={`w-full font-body text-sm font-semibold py-6 rounded-xl transition-all flex items-center justify-center gap-2 ${product.highlight ? 'bg-[#064E3B] text-white hover:bg-[#047857]' : 'bg-slate-50 text-slate-700 hover:bg-[#064E3B] hover:text-white'}`}>
                      Solicitar Preço <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO QUALIDADE: COMPARATIVO CLARO E EQUILIBRADO ── */}
      <section id="qualidade" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="font-body text-sm font-bold tracking-widest text-[#059669] uppercase">Transparência e Procedência</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Uma estrutura pronta para suprir do rústico ao tecnológico.
            </h2>
            <p className="font-body text-slate-600 text-lg leading-relaxed">
              Nos orgulhamos de controlar desde a colheita do <strong>Eucalipto In Natura</strong> bruto nas melhores condições florestais até o monitoramento do tratamento químico na autoclave. Segurança total para o seu projeto.
            </p>
          </div>

          <div className="lg:col-span-7 bg-white shadow-soft border border-slate-200 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 p-5 font-body text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <div>Critério Técnico</div>
              <div className="text-[#064E3B]">Nossa Linha In Natura</div>
              <div className="text-blue-900">Nossa Linha Tratada</div>
            </div>
            <div className="divide-y divide-slate-100 font-body text-sm">
              {[
                { f: "Aplicação Ideal", a: "Uso rural imediato, cercas, escoramentos e indústrias", b: "Estruturas permanentes, decks e pilares expostos" },
                { f: "Custo-Benefício", a: "Máxima economia, direto da floresta", b: "Investimento de longo prazo com garantia" },
                { f: "Origem da Madeira", a: "Itamarandiba/MG (Alto padrão biológico)", b: "Itamarandiba/MG + Autoclave controlada" },
                { f: "Resistência a Pragas", a: "Alta resistência mecânica natural", b: "Imunização química contra fungos/cupins" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="text-slate-700 font-semibold">{row.f}</div>
                  <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600" /> {row.a}
                  </div>
                  <div className="text-slate-700 font-medium flex items-center gap-1.5">
                    <ShieldCheck size={15} className="shrink-0 text-blue-600" /> {row.b}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER CORPORATIVO ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#064E3B]">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-8">
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} size={20} className="fill-[#F59E0B] text-[#F59E0B]" />)}
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Garanta a melhor madeira para a sua obra ou negócio
          </h2>
          <p className="font-body font-medium text-[#D1FAE5] max-w-2xl mx-auto text-lg">
            Peça um orçamento sob medida. Seja para grandes cargas de eucalipto <strong>In Natura</strong> ou projetos estruturais com madeira <strong>Tratada</strong>, oferecemos condições imbatíveis de mercado.
          </p>
          <div className="pt-4 flex justify-center">
            <Link href="https://wa.me/5538999028181">
              <Button className="bg-white text-[#064E3B] hover:bg-slate-100 font-body font-bold text-sm uppercase tracking-wide px-10 py-7 rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center gap-2">
                Negociar com Especialista Agora <ArrowRight size={18} />
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
              Eucalipto de procedência premium direto de Itamarandiba/MG. Atendimento especializado em demandas de madeira bruta in natura e tratamentos estruturais de alta performance.
            </p>
            <div className="font-body text-sm font-semibold text-white bg-white/5 inline-block px-4 py-2 rounded-lg border border-white/10">
              CNPJ: 50.775.091/0001-05
            </div>
          </div>
          
          <div className="md:col-span-3 space-y-6">
            <h4 className="font-body font-bold text-sm uppercase tracking-widest text-[#10B981]">Origem e Distribuição</h4>
            <div className="flex items-start gap-3 text-sm text-slate-400 font-body">
              <MapPin size={18} className="text-[#10B981] shrink-0 mt-1" />
              <p className="leading-relaxed">Centro de Produção de Ativos<br />Itamarandiba, Minas Gerais<br />Capital Nacional do Eucalipto</p>
            </div>
          </div>

          <div className="md:col-span-3 space-y-6">
            <h4 className="font-body font-bold text-sm uppercase tracking-widest text-[#10B981]">Canais de Venda</h4>
            <div className="space-y-4 text-sm text-slate-400 font-body">
              <a href="https://wa.me/5538999028181" className="flex items-center gap-3 hover:text-white transition-colors group">
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-[#10B981] transition-colors"><Phone size={16} className="text-white" /></div> 
                <span className="font-semibold text-white">(38) 99902-8181</span>
              </a>
              <a href="https://wa.me/5538999994304" className="flex items-center gap-3 hover:text-white transition-colors group">
                <div className="bg-white/10 p-2 rounded-full group-hover:bg-[#10B981] transition-colors"><Phone size={16} className="text-white" /></div> 
                <span className="font-semibold text-white">(38) 99999-4304</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col justify-end pb-2">
            <Link href="https://wa.me/5538999028181">
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
              Kayk Junior - Agilcode
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}