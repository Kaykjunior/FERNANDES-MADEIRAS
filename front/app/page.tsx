"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import {
  Trees, ShieldCheck, Truck, Phone, MapPin, Award,
  ArrowRight, Menu, X, Star, ChevronDown, Leaf, Zap
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Paleta refinada baseada na logo:
// Verde floresta profundo: #0F3D1F
// Verde médio: #1A5C2E
// Verde vibrante (accent): #2D8C4E
// Dourado real: #C9A84C
// Dourado claro: #E8C97A
// Creme: #FAF7F0
// Marrom quente: #3D1F0A

export default function LandingPageReiDasMadeiras() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeProduct, setActiveProduct] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const products = [
    {
      title: "Mourões",
      subtitle: "Para cercas que duram gerações",
      tag: "Mais Vendido",
      dims: "Ø 8–25cm · 1,5–3m",
      img: "https://www.madesch.com.br/wp-content/uploads/2023/05/madesch-empresa-referencia-em-tratamento-de-madeira-em-santa-catarina-1024x576.png",
      color: "#1A5C2E",
    },
    {
      title: "Postes",
      subtitle: "Estrutura real para toda a propriedade",
      tag: "Estrutural",
      dims: "Ø 10–20cm · 6–12m",
      img: "https://images.tcdn.com.br/img/img_prod/985953/kit_2_eucaliptos_tratados_18_a_20_6m_central_norte_madeiras_1043_1_224478cd7fe9361ddb6854c50bf85828.jpg",
      color: "#0F3D1F",
    },
    {
      title: "Vigas",
      subtitle: "Resistência premium para construção",
      tag: "Premium",
      dims: "Seções variadas · sob medida",
      img: "https://brisamadeiras.com.br/product_images/r/eucalipto_tratado_grosso__81343_zoom__34475_zoom.jpg",
      color: "#2D8C4E",
    },
    {
      title: "Ripas & Decks",
      subtitle: "Acabamento nobre, durabilidade real",
      tag: "Acabamento",
      dims: "Espessura 2–5cm",
      img: "https://i0.wp.com/macoe.com.br/wp-content/uploads/2020/07/Deck-de-Madeira-Macoe-Portas-e-Janelas-4-min.jpg?fit=1000%2C1000&ssl=1",
      color: "#3D1F0A",
    },
  ];

  const stats = [
    { value: "10+", label: "Anos de experiência" },
    { value: "500k+", label: "Peças por ano" },
    { value: "18", label: "Estados atendidos" },
    { value: "98%", label: "Satisfação" },
  ];

  return (
    <div className="font-sans bg-[#FAF7F0] text-[#1A1A1A] overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .anim-fadeup   { animation: fadeUp 0.8s ease forwards; }
        .anim-fadein   { animation: fadeIn 1s ease forwards; }
        .anim-scalein  { animation: scaleIn 0.7s ease forwards; }

        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.25s; opacity: 0; }
        .delay-3 { animation-delay: 0.45s; opacity: 0; }
        .delay-4 { animation-delay: 0.65s; opacity: 0; }
        .delay-5 { animation-delay: 0.85s; opacity: 0; }

        .gold-shimmer {
          background: linear-gradient(90deg, #C9A84C 0%, #E8C97A 40%, #C9A84C 60%, #A07820 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }

        .product-card {
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      box-shadow 0.5s ease;
        }
        .product-card:hover { transform: translateY(-8px); }

        .nav-link {
          position: relative;
          padding-bottom: 4px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 1.5px;
          background: #C9A84C;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }

        .btn-primary {
          background: linear-gradient(135deg, #C9A84C 0%, #E8C97A 50%, #C9A84C 100%);
          background-size: 200% auto;
          color: #0F3D1F;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-size: 11px;
          transition: background-position 0.4s ease, box-shadow 0.3s ease, transform 0.2s ease;
        }
        .btn-primary:hover {
          background-position: right center;
          box-shadow: 0 8px 30px rgba(201,168,76,0.4);
          transform: translateY(-2px);
        }

        .section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #C9A84C;
        }

        .divider-gold {
          width: 48px; height: 2px;
          background: linear-gradient(90deg, #C9A84C, #E8C97A);
          border-radius: 2px;
        }

        .floating { animation: float 6s ease-in-out infinite; }

        .pulse-dot::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: #2D8C4E;
          animation: pulse-ring 2s ease-out infinite;
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-500"
        style={{
          background: scrolled
            ? "rgba(15,61,31,0.97)"
            : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(201,168,76,0.2)" : "none",
          padding: scrolled ? "14px 0" : "20px 0",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
          <Image
            src="/logo2.png"
            alt="Rei das Madeiras"
            width={100}
            height={100}
            className="h-auto w-auto max-h-[60px] object-contain"
            priority
          />

          <div className="hidden lg:flex items-center gap-10">
            {["Produtos", "Sustentabilidade", "Logística", "Contato"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="nav-link font-body text-white/90 hover:text-white text-[13px] font-medium tracking-wide"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/contato">
              <button className="btn-primary hidden sm:block px-7 py-3 rounded-full shadow-lg">
                Falar com Vendedor
              </button>

            </Link>

            <Link href="/orcamento">
              <button className="btn-primary hidden sm:block px-7 py-3 rounded-full shadow-lg">
                Solicitar Orçamento Online
              </button>

            </Link>


            <button
              className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#0F3D1F] border-t border-[#C9A84C]/20 px-6 py-8 flex flex-col gap-6">
            {["Produtos", "Sustentabilidade", "Logística", "Contato"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
                className="font-body text-white/90 text-base font-medium tracking-wide border-b border-white/10 pb-4"
              >
                {item}
              </a>
            ))}
            <Link href="/contato">
              <button className="btn-primary w-full py-4 rounded-full mt-2">
                Falar com vendedor
              </button>
            </Link>
            <Link href="/orcamento">
              <button className="btn-primary w-full py-4 rounded-full mt-2">
                Solicitar Orçamento Online
              </button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden grain"
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://portalcelulose.com.br/wp-content/uploads/2023/10/Florestas-de-eucalipto-da-Suzano-devem-ocupar-17-milhao-de-hectares-ate-2024.jpg"
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.35) saturate(0.8)" }}
          />
          {/* Green gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,61,31,0.9) 0%, rgba(15,61,31,0.5) 50%, rgba(45,140,78,0.2) 100%)",
            }}
          />
          {/* Bottom fade to cream */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48"
            style={{
              background: "linear-gradient(to bottom, transparent, #FAF7F0)",
            }}
          />
        </div>

        {/* Decorative vertical line */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px hidden xl:block anim-fadein delay-1"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.3), transparent)" }}
        />

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 pt-4 md:pt-32 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <div className="flex items-center gap-3 mb-8 anim-fadeup delay-1 justify-center">
              <div className="gap-1 hidden md:flex">
                {[...Array(3)].map((_, i) => (
                  <Star key={i} size={14} className="hidden md:flex text-center fill-[#C9A84C] text-[#C9A84C]" />
                ))}
              </div>
              <span className="section-label text-white/60">Itamarandiba · Minas Gerais</span>
              <div className="gap-1 hidden md:flex">
                {[...Array(3)].map((_, i) => (
                  <Star key={i} size={14} className="hidden md:flex text-center fill-[#C9A84C] text-[#C9A84C]" />
                ))}
              </div>
            </div>

            <h1
              className="font-display font-black leading-[1.05] mb-8 anim-fadeup delay-2 text-center"
              style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
            >
              <span className="text-white block">A Nobreza do</span>
              <span className="gold-shimmer block">Eucalipto Tratado</span>
              <span className="text-white block">para Todas as Estruturas</span>
            </h1>

            <p
              className="font-body text-white/70 leading-relaxed mb-10 max-w-xl anim-fadeup delay-3 text-center"
              style={{ fontSize: "clamp(1rem, 1.5vw, 1.15rem)" }}
            >
              Eucalipto tratado em autoclave direto das florestas de Itamarandiba.
              Resistência comprovada, entrega para todo o Brasil, e um padrão que só o Rei das Madeiras oferece.
            </p>

            <div className="flex flex-wrap gap-4 anim-fadeup delay-4 justify-center">
              <Link href="/contato">
                <button className="btn-primary px-8 py-4 rounded-full shadow-xl flex items-center gap-2 text-sm">
                  Falar com Vendedor
                  <ArrowRight size={16} />
                </button>
              </Link>

              <Link href="/orcamento">
                <button className="btn-primary px-8 py-4 rounded-full shadow-xl flex items-center gap-2 text-sm">
                  Solicitar Orçamento Online
                  <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>

          {/* Right: floating stats card */}
          <div className="hidden lg:flex justify-center anim-scalein delay-3">
            <div
              className="floating relative rounded-3xl p-8 w-full max-w-sm"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(201,168,76,0.25)",
                boxShadow: "0 32px 64px rgba(0,0,0,0.3)",
              }}
            >
              {/* Top badge */}
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #E8C97A)" }}
                >
                  <Award size={18} className="text-[#0F3D1F]" />
                </div>
                <div>
                  <p className="font-body text-white font-semibold text-sm">Qualidade Certificada</p>
                  <p className="font-body text-white/50 text-xs mt-0.5">ABNT · Autoclave · Origem Própria</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6">
                {stats.map((s, i) => (
                  <div key={i}>
                    <p
                      className="font-display font-bold leading-none mb-1"
                      style={{
                        fontSize: "clamp(1.6rem, 2.5vw, 2rem)",
                        background: "linear-gradient(135deg, #C9A84C, #E8C97A)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {s.value}
                    </p>
                    <p className="font-body text-white/55 text-xs leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Bottom pulse indicator */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
                <div className="relative w-3 h-3 flex-shrink-0">
                  <div className="pulse-dot absolute inset-0 rounded-full bg-[#2D8C4E]" />
                  <div className="relative z-10 w-3 h-3 rounded-full bg-[#2D8C4E]" />
                </div>
                <p className="font-body text-white/60 text-xs">Estoque disponível · Entrega imediata</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 anim-fadein delay-5">
          <div className="flex flex-col items-center gap-2 text-white/40">
            <span className="font-body text-[10px] tracking-[0.3em] uppercase">Explorar</span>
            <ChevronDown size={18} className="animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAIS ── */}
      <section className="py-24 px-6 bg-[#FAF7F0]">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Por que nos escolher</p>
            <div className="divider-gold mx-auto mb-6" />
            <h2
              className="font-display font-bold text-[#0F3D1F] leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              O padrão real da madeira tratada
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Trees size={28} />,
                title: "Reserva Própria",
                desc: "Manejo sustentável direto das melhores florestas de Minas Gerais, garantindo rastreabilidade total da origem.",
                accent: "#1A5C2E",
              },
              {
                icon: <ShieldCheck size={28} />,
                title: "Tratamento Real",
                desc: "Autoclave de última geração com pressão e temperatura controladas. Durabilidade comprovada por décadas.",
                accent: "#C9A84C",
              },
              {
                icon: <Truck size={28} />,
                title: "Logística Ágil",
                desc: "Frota própria e parcerias estratégicas garantindo entrega rápida e segura em todo território nacional.",
                accent: "#2D8C4E",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl"
                style={{ border: "1px solid #EDE8DE" }}
              >
                {/* Accent bar */}
                <div
                  className="absolute top-0 left-8 right-8 h-0.5 rounded-b-full transition-all duration-500 group-hover:left-0 group-hover:right-0 group-hover:rounded-none group-hover:rounded-t-2xl"
                  style={{ background: item.accent }}
                />

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${item.accent}15`, color: item.accent }}
                >
                  {item.icon}
                </div>

                <h3
                  className="font-display font-bold text-xl text-[#0F3D1F] mb-3"
                >
                  {item.title}
                </h3>
                <p className="font-body text-[#6B6356] leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUTOS ── */}
      <section id="produtos" className="py-24 px-6" style={{ background: "#0F3D1F" }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="section-label mb-4" style={{ color: "#C9A84C" }}>A seleção do rei</p>
              <div className="divider-gold mb-6" />
              <h2
                className="font-display font-bold text-white leading-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
              >
                Nossa Produção
              </h2>
            </div>
            <p className="font-body text-white/50 max-w-xs text-sm leading-relaxed">
              Cada peça selecionada com rigor, tratada e entregue com o padrão que seu projeto merece.
            </p>
          </div>

          {/* Product tabs */}
          <div className="flex gap-3 mb-10 flex-wrap">
            {products.map((p, i) => (
              <button
                key={i}
                onClick={() => setActiveProduct(i)}
                className="font-body text-[12px] font-semibold tracking-wide uppercase px-5 py-2.5 rounded-full transition-all duration-300"
                style={{
                  background: activeProduct === i ? "linear-gradient(135deg, #C9A84C, #E8C97A)" : "rgba(255,255,255,0.07)",
                  color: activeProduct === i ? "#0F3D1F" : "rgba(255,255,255,0.55)",
                  border: activeProduct === i ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Featured product */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main featured */}
            <div
              className="lg:col-span-3 relative overflow-hidden rounded-3xl"
              style={{ height: "480px", background: products[activeProduct].color }}
            >
              <img
                key={activeProduct}
                src={products[activeProduct].img}
                alt={products[activeProduct].title}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                style={{ transition: "opacity 0.4s ease" }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
              <div className="absolute bottom-8 left-8 right-8">
                <span
                  className="font-body text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 inline-block"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #E8C97A)", color: "#0F3D1F" }}
                >
                  {products[activeProduct].tag}
                </span>
                <h3 className="font-display font-bold text-white text-4xl mb-2">
                  {products[activeProduct].title}
                </h3>
                <p className="font-body text-white/70 text-sm mb-4">
                  {products[activeProduct].subtitle}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-body text-white/50 text-xs font-medium">
                    {products[activeProduct].dims}
                  </span>
                  <Link href="/contato">
                    <button
                      className="font-body text-xs font-semibold flex items-center gap-2 px-5 py-2.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      Solicitar <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Side products */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {products.filter((_, i) => i !== activeProduct).map((p, i) => (
                <div
                  key={i}
                  className="product-card relative overflow-hidden rounded-2xl cursor-pointer flex-1"
                  style={{
                    background: p.color,
                    minHeight: "140px",
                    border: "1px solid rgba(201,168,76,0.15)",
                  }}
                  onClick={() => setActiveProduct(products.indexOf(p))}
                >
                  <img
                    src={p.img}
                    alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 70%)" }} />
                  <div className="absolute inset-0 flex items-center px-6">
                    <div>
                      <p className="font-body text-[10px] text-[#E8C97A] font-semibold uppercase tracking-widest mb-1">{p.tag}</p>
                      <h4 className="font-display font-bold text-white text-xl">{p.title}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SUSTENTABILIDADE ── */}
      <section id="sustentabilidade" className="py-24 px-6 bg-white relative overflow-hidden">
        {/* Decorative circle */}
        <div
          className="absolute -right-32 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 pointer-events-none"
          style={{ background: "#1A5C2E" }}
        />

        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image stack */}
          <div className="relative h-[480px] hidden lg:block">
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden"
              style={{ transform: "rotate(-2deg)", background: "#EDE8DE" }}
            >
              <img
                src="https://portalcelulose.com.br/wp-content/uploads/2023/10/Florestas-de-eucalipto-da-Suzano-devem-ocupar-17-milhao-de-hectares-ate-2024.jpg"
                alt=""
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            <div
              className="absolute bottom-8 -right-6 w-56 rounded-2xl p-5 shadow-2xl"
              style={{ background: "#0F3D1F", border: "2px solid rgba(201,168,76,0.3)" }}
            >
              <Leaf size={24} className="text-[#C9A84C] mb-3" />
              <p className="font-body text-white font-semibold text-sm">Reflorestamento Ativo</p>
              <p className="font-body text-white/50 text-xs mt-1">Para cada árvore retirada, duas são plantadas.</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="section-label mb-4">Compromisso com o futuro</p>
            <div className="divider-gold mb-6" />
            <h2
              className="font-display font-bold text-[#0F3D1F] leading-tight mb-6"
              style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}
            >
              Sustentabilidade que<br />vai além do discurso
            </h2>
            <p className="font-body text-[#6B6356] leading-relaxed mb-8 text-sm">
              Nossas florestas em Itamarandiba são manejadas com responsabilidade socioambiental. Cada peça que sai daqui carrega o compromisso com as próximas gerações — sem desmatamento ilegal, com rastreabilidade e com o cuidado de quem vive no campo.
            </p>

            <div className="space-y-4">
              {[
                { icon: <Leaf size={16} />, text: "Manejo florestal certificado e rastreável" },
                { icon: <ShieldCheck size={16} />, text: "Tratamento livre de compostos nocivos ao meio ambiente" },
                { icon: <Zap size={16} />, text: "Eficiência hídrica no processo de autoclave" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#0F3D1F10", color: "#1A5C2E" }}
                  >
                    {item.icon}
                  </div>
                  <p className="font-body text-[#3D3028] text-sm leading-relaxed pt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        className="py-24 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F3D1F 0%, #1A5C2E 50%, #0F3D1F 100%)" }}
      >
        {/* Texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #C9A84C 0, #C9A84C 1px, transparent 0, transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-[800px] mx-auto text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-[#C9A84C] text-[#C9A84C]" />
            ))}
          </div>
          <h2
            className="font-display font-bold text-white leading-tight mb-6"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Pronto para elevar o<br />
            <span className="gold-shimmer">padrão do seu projeto?</span>
          </h2>
          <p className="font-body text-white/60 mb-10 text-base leading-relaxed max-w-lg mx-auto">
            Fale com nossos especialistas e receba uma proposta personalizada com os melhores preços do mercado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contato">
              <button className="btn-primary px-10 py-4 rounded-full shadow-2xl flex items-center gap-2 text-sm mx-auto sm:mx-0">
                Falar com Vendedor <ArrowRight size={16} />
              </button>
            </Link>

            <Link href="/orcamento">
              <button className="btn-primary px-10 py-4 rounded-full shadow-2xl flex items-center gap-2 text-sm mx-auto sm:mx-0">
                Solicitar Orçamento Online<ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        id="contato"
        className="py-20 px-6"
        style={{ background: "#0A2914", borderTop: "1px solid rgba(201,168,76,0.15)" }}
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <Image
                src="/logo2.png"
                alt="Rei das Madeiras"
                width={110}
                height={110}
                className="mb-6 object-contain"
              />
              <p className="font-body text-white/45 text-sm leading-relaxed max-w-xs italic">
                "De Itamarandiba para todo o Brasil: o padrão real da madeira tratada."
              </p>
            </div>

            <div>
              <h5
                className="font-body font-semibold text-[11px] uppercase tracking-[0.25em] mb-6"
                style={{ color: "#C9A84C" }}
              >
                Localização
              </h5>
              <div className="flex items-start gap-3 text-white/50 text-sm font-body">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#C9A84C" }} />
                <p>Fazenda Embauba,<br />Itamarandiba / MG</p>
              </div>
            </div>

            <div>
              <h5
                className="font-body font-semibold text-[11px] uppercase tracking-[0.25em] mb-6"
                style={{ color: "#C9A84C" }}
              >
                Contato
              </h5>
              <div className="flex items-center gap-3 text-white/50 text-sm font-body mb-4">
                <Phone size={16} style={{ color: "#C9A84C" }} />
                <span>(33) 99988-7766</span>
              </div>
              <Link href="/contato">
                <button className="btn-primary px-6 py-3 rounded-full text-xs mt-2">
                  Falar Agora
                </button>
              </Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <p className="font-body text-white/25 text-[11px] uppercase tracking-[0.25em] text-center">
              © 2026 Rei das Madeiras · Todos os direitos reservados
            </p>
            <div className="flex items-center gap-2 w-full justify-center">
              <Award size={14} style={{ color: "#C9A84C" }} />

              <span className="font-body text-white/30 text-[11px] uppercase tracking-wider">
                Desenvolvido por{" "}

                <a
                  href="https://wa.me/5538998542340?text=Olá%20Kayk%2C%20vim%20pelo%20seu%20site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white transition-colors underline"
                >
                  Kayk Junior
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}