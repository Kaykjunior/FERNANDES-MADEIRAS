"use client";

import { useState, useEffect, useMemo } from "react";
import { API_URL } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import {
    ShoppingCart, X, ChevronDown, ChevronUp,
    Phone, Mail, User, Send, Check, ArrowLeft, Package,
    Trees, Star, ArrowRight, Weight, Leaf, Info
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Produto {
    id: string;
    nome: string;
    comprimento_mt: string;
    diametro_min: number | null;
    diametro_max: number | null;
    peso_unitario_kg: string;
    unidade_comercial: string;
    ativo: boolean;
}

interface CartItem {
    produto: Produto;
    quantidade: number;
}

interface BitolaGroup {
    key: string;
    min: number;
    max: number;
    label: string;
    imageName: string;
    produtos: Produto[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
const fmtPeso = (kg: number) =>
    kg >= 1000 ? `${(kg / 1000).toFixed(2).replace(".", ",")} ton` : `${kg.toFixed(1).replace(".", ",")} kg`;
const fmtComp = (mt: string) => {
    const n = parseFloat(mt);
    return `${n % 1 === 0 ? n.toFixed(0) : mt.replace(".", ",")}M`;
};




const ComprimentoGrid = ({
    produtos,
    getQty,
    setQty
}: {
    produtos: Produto[],
    getQty: (id: string) => number,
    setQty: (p: Produto, q: number) => void
}) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
        {produtos.map((p) => {
            const qty = getQty(p.id);
            const peso = parseFloat(p.peso_unitario_kg);
            return (
                <div
                    key={p.id}
                    className="comp-tile"
                    style={{
                        borderColor: qty > 0 ? "#C9A84C" : "#EDE8DE",
                        background: qty > 0 ? "linear-gradient(160deg,#0F3D1F,#1A5C2E)" : "white"
                    }}
                >
                    <div
                        className="comp-tile-top font-display"
                        style={{ color: qty > 0 ? "#E8C97A" : "#0F3D1F" }}
                    >
                        {fmtComp(p.comprimento_mt)}
                    </div>
                    <div className="comp-tile-meta" style={{ color: qty > 0 ? "rgba(232,201,122,.65)" : "#8A8075" }}>
                        {fmtPeso(peso)}/un
                    </div>
                    <input
                        type="number"
                        min={0}
                        value={qty || ""}
                        placeholder="0"
                        onChange={(e) => setQty(p, Math.max(0, parseInt(e.target.value) || 0))}
                        className="comp-tile-input"
                        style={{
                            background: qty > 0 ? "rgba(255,255,255,.12)" : "#F5F0E8",
                            color: qty > 0 ? "white" : "#1A1A1A",
                            borderColor: qty > 0 ? "rgba(232,201,122,.3)" : "transparent",
                        }}
                    />
                    {qty > 0 && (
                        <div className="comp-tile-sub" style={{ color: "#C9A84C" }}>
                            {fmtPeso(peso * qty)}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);

const ComprimentoRipas = ({
    produtos,
    getQty,
    setQty
}: {
    produtos: Produto[],
    getQty: (id: string) => number,
    setQty: (p: Produto, q: number) => void
}) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
        {produtos.map((p) => {
            const qty = getQty(p.id);
            const peso = parseFloat(p.peso_unitario_kg);
            return (
                <div
                    key={p.id}
                    className="comp-tile"
                    style={{
                        borderColor: qty > 0 ? "#C9A84C" : "#EDE8DE",
                        background: qty > 0 ? "linear-gradient(160deg,#0F3D1F,#1A5C2E)" : "white"
                    }}
                >
                    <div
                        className="comp-tile-top font-display"
                        style={{ color: qty > 0 ? "#E8C97A" : "#0F3D1F" }}
                    >
                       <p className="text-sm"> {fmtComp(p.nome)}</p>
                    </div>
                    <div className="comp-tile-meta" style={{ color: qty > 0 ? "rgba(232,201,122,.65)" : "#8A8075" }}>
                        {fmtPeso(peso)}/un
                    </div>
                    <input
                        type="number"
                        min={0}
                        value={qty || ""}
                        placeholder="0"
                        onChange={(e) => setQty(p, Math.max(0, parseInt(e.target.value) || 0))}
                        className="comp-tile-input"
                        style={{
                            background: qty > 0 ? "rgba(255,255,255,.12)" : "#F5F0E8",
                            color: qty > 0 ? "white" : "#1A1A1A",
                            borderColor: qty > 0 ? "rgba(232,201,122,.3)" : "transparent",
                        }}
                    />
                    {qty > 0 && (
                        <div className="comp-tile-sub" style={{ color: "#C9A84C" }}>
                            {fmtPeso(peso * qty)}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────
export default function OrcamentoPage() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);
    // Multiple accordions can be open at once — much better UX
    const [openBitolas, setOpenBitolas] = useState<Set<string>>(new Set());
    const [cart, setCart] = useState<CartItem[]>([]);
    const [step, setStep] = useState<"catalog" | "contact">("catalog");
    const [form, setForm] = useState({ nome: "", email: "", whatsapp: "" });
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch(`${API_URL}/produtos/medidas/lista`)
            .then((r) => r.json())
            .then((data: Produto[]) => { setProdutos(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const bitolaGroups = useMemo<BitolaGroup[]>(() => {
        const withDia = produtos.filter((p) => p.diametro_min !== null && p.diametro_max !== null);
        const map = new Map<string, BitolaGroup>();
        withDia.forEach((p) => {
            const key = `${pad(p.diametro_min!)} a ${pad(p.diametro_max!)}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    min: p.diametro_min!,
                    max: p.diametro_max!,
                    label: `${pad(p.diametro_min!)} a ${pad(p.diametro_max!)} cm`,
                    imageName: key,
                    produtos: [],
                });
            }
            map.get(key)!.produtos.push(p);
        });
        map.forEach((g) => g.produtos.sort((a, b) => parseFloat(a.comprimento_mt) - parseFloat(b.comprimento_mt)));
        return Array.from(map.values()).sort((a, b) => a.min - b.min);
    }, [produtos]);

    const ripas = useMemo(() => produtos.filter((p) => p.diametro_min === null), [produtos]);

    const getQty = (id: string) => cart.find((c) => c.produto.id === id)?.quantidade ?? 0;
    const setQty = (produto: Produto, qty: number) => {
        setCart((prev) => {
            if (qty <= 0) return prev.filter((c) => c.produto.id !== produto.id);
            const ex = prev.find((c) => c.produto.id === produto.id);
            if (ex) return prev.map((c) => (c.produto.id === produto.id ? { ...c, quantidade: qty } : c));
            return [...prev, { produto, quantidade: qty }];
        });
    };

    const toggleBitola = (key: string) => {
        setOpenBitolas((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const totalPecas = cart.reduce((s, c) => s + c.quantidade, 0);
    const totalPeso = cart.reduce((s, c) => s + parseFloat(c.produto.peso_unitario_kg) * c.quantidade, 0);

    const bitolaCartCount = (key: string) =>
        cart.filter((c) => {
            const min = c.produto.diametro_min;
            const max = c.produto.diametro_max;
            return min !== null && max !== null && `${pad(min)} a ${pad(max)}` === key;
        }).reduce((s, c) => s + c.quantidade, 0);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.nome.trim()) e.nome = "Nome obrigatório";
        if (!form.email.includes("@")) e.email = "E-mail inválido";
        if (form.whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = "WhatsApp inválido";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        // Lógica de saudação baseada no horário
        const hora = new Date().getHours();
        let saudacao = "Olá";
        if (hora >= 5 && hora < 12) saudacao = "Bom dia";
        else if (hora >= 12 && hora < 18) saudacao = "Boa tarde";
        else saudacao = "Boa noite";

        const lines = cart
            .map((c) => {
                const pesoItem = fmtPeso(parseFloat(c.produto.peso_unitario_kg) * c.quantidade);
                return `• ${c.quantidade} ${c.produto.unidade_comercial} de ${c.produto.nome} (${pesoItem})`;
            })
            .join("\n");

        const msg =
            `${saudacao}, gostaria de um orçamento para as seguintes madeiras:\n\n` +
            `*ITENS DO PEDIDO:*\n` +
            `${lines}\n\n` +
            `*RESUMO:* ${totalPecas} peças | Peso total: ${fmtPeso(totalPeso)}\n\n` +
            `--- *MEUS DADOS* ---\n` +
            `*Nome:* ${form.nome}\n` +
            `*E-mail:* ${form.email}\n` +
            `*WhatsApp:* ${form.whatsapp}\n\n` +
            `_Gerado via Catálogo Digital - Rei das Madeiras_`;

        window.open(`https://wa.me/553898491321?text=${encodeURIComponent(msg)}`, "_blank");
        setSubmitted(true);
    };


    return (
        <div className="min-h-screen bg-[#FAF7F0] font-sans overflow-x-hidden">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(100%); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes expandIn {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .anim-fadeup  { animation: fadeUp 0.6s ease forwards; }
        .d1 { animation-delay:.1s; opacity:0; }
        .d2 { animation-delay:.25s; opacity:0; }
        .d3 { animation-delay:.4s; opacity:0; }

        .gold-shimmer {
          background: linear-gradient(90deg,#C9A84C,#E8C97A,#C9A84C,#A07820);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 4s linear infinite;
        }
        .btn-gold {
          background: linear-gradient(135deg,#C9A84C 0%,#E8C97A 50%,#C9A84C 100%);
          background-size:200% auto;
          color:#0F3D1F; font-family:'DM Sans',sans-serif; font-weight:700;
          letter-spacing:.06em; text-transform:uppercase; font-size:11px;
          transition: background-position .4s, box-shadow .3s, transform .2s;
          border:none; cursor:pointer;
        }
        .btn-gold:hover {
          background-position:right center;
          box-shadow:0 8px 30px rgba(201,168,76,.4);
          transform:translateY(-2px);
        }

        /* ── Accordion row ── */
        .bitola-row {
          border: 1.5px solid #EDE8DE;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          transition: border-color .25s, box-shadow .25s;
        }
        .bitola-row.open {
          border-color: #C9A84C;
          box-shadow: 0 0 0 3px rgba(201,168,76,.15);
        }
        .bitola-row-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          cursor: pointer;
          user-select: none;
          transition: background .2s;
        }
        .bitola-row-header:hover { background: #FAFAF6; }
        .bitola-row.open .bitola-row-header {
          background: linear-gradient(135deg,#0F3D1F 0%,#1A5C2E 100%);
        }
        .bitola-row-body {
          animation: expandIn .25s ease;
          border-top: 1px solid #F0EBE0;
          padding: 18px 18px 20px;
          background: #FDFCF8;
        }

        /* ── Comprimento tile ── */
        .comp-tile {
          border: 2px solid;
          border-radius: 14px;
          padding: 10px 8px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: border-color .2s, background .2s, transform .2s;
        }
        .comp-tile:focus-within { transform: scale(1.03); }
        .comp-tile-top {
          font-size: 1.1rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -.01em;
        }
        .comp-tile-meta {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: .03em;
          text-align: center;
        }
        .comp-tile-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 600;
          text-align: center;
        }
        .comp-tile-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          width: 100%;
          border-radius: 8px;
          border: 1px solid;
          padding: 5px 4px;
          outline: none;
          transition: background .2s, border-color .2s;
          -moz-appearance: textfield;
        }
        .comp-tile-input::-webkit-outer-spin-button,
        .comp-tile-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .comp-tile-input:focus { outline: 2px solid rgba(201,168,76,.5); outline-offset: 1px; }

        .section-label {
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
          letter-spacing:.35em; text-transform:uppercase; color:#C9A84C;
        }
        .input-field {
          font-family:'DM Sans',sans-serif;
          background:white; border:1.5px solid #E8E2D8; border-radius:12px;
          padding:12px 16px; font-size:14px; width:100%;
          transition:border-color .2s, box-shadow .2s; outline:none; color:#1A1A1A;
        }
        .input-field:focus { border-color:#2D8C4E; box-shadow:0 0 0 3px rgba(45,140,78,.12); }
        .input-field.error { border-color:#DC2626; }

        .cart-bar { animation: slideUp .4s ease; }
        .step-pill {
          display:flex; align-items:center; gap:8px;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
          letter-spacing:.05em; text-transform:uppercase;
        }
        .step-dot {
          width:28px; height:28px; border-radius:50%; display:flex;
          align-items:center; justify-content:center; font-size:12px; font-weight:700;
          flex-shrink:0;
        }
        .count-badge {
          font-family:'DM Sans',sans-serif; font-size:10px; font-weight:800;
          letter-spacing:.05em;
          background: linear-gradient(135deg,#C9A84C,#E8C97A);
          color:#0F3D1F; padding:2px 9px; border-radius:20px;
          white-space:nowrap;
        }
      `}</style>

            {/* ── NAV ── */}
            <nav
                className="sticky top-0 z-50 border-b"
                style={{ background: "rgba(15,61,31,0.97)", backdropFilter: "blur(16px)", borderColor: "rgba(201,168,76,.2)" }}
            >
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                    <Link href="/">
                        <Image src="/logo2.png" alt="Rei das Madeiras" width={120} height={120} className="h-auto w-auto max-h-[180px] object-contain" priority />
                    </Link>
                    <div className="flex-1 text-center">
                        <p className="font-display text-white font-bold text-lg hidden sm:block">Solicitar Orçamento</p>
                        <p className="font-body text-white/50 text-xs hidden sm:block">Selecione as madeiras e envie seu pedido</p>
                    </div>
                    <Link href="/" className="font-body text-white/70 hover:text-white text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap">
                        <ArrowLeft size={14} /> Voltar
                    </Link>
                </div>
            </nav>

            {/* ── HERO MINI ── */}
            <section className="relative py-10 sm:py-14 px-4 sm:px-6 overflow-hidden" style={{ background: "linear-gradient(135deg,#0F3D1F 0%,#1A5C2E 60%,#0F3D1F 100%)" }}>
                <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: "repeating-linear-gradient(45deg,#C9A84C 0,#C9A84C 1px,transparent 0,transparent 50%)", backgroundSize: "20px 20px" }}
                />
                <div className="relative z-10 max-w-[800px] mx-auto text-center">
                    <p className="section-label mb-3 anim-fadeup d1">Eucalipto Tratado · Itamarandiba</p>
                    <h1 className="font-display font-black text-white leading-tight mb-3 anim-fadeup d2" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
                        Monte seu <span className="gold-shimmer">orçamento</span> agora
                    </h1>
                    <p className="font-body text-white/60 text-sm leading-relaxed anim-fadeup d3">
                        Escolha a bitola, informe as quantidades e envie. Fácil e rápido.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-6 anim-fadeup d3">
                        {[
                            { n: "1", label: "Abra a bitola", active: step === "catalog" },
                            { n: "2", label: "Informe as quantidades", active: step === "catalog" },
                            { n: "3", label: "Envie o pedido", active: step === "contact" },
                        ].map((s, i) => (
                            <div key={i} className="step-pill text-white/70">
                                <div className="step-dot font-body" style={{ background: s.active ? "linear-gradient(135deg,#C9A84C,#E8C97A)" : "rgba(255,255,255,.15)", color: s.active ? "#0F3D1F" : "white" }}>
                                    {s.n}
                                </div>
                                <span style={{ color: s.active ? "#E8C97A" : "rgba(255,255,255,.5)" }}>{s.label}</span>
                                {i < 2 && <span className="text-white/20 hidden sm:block">›</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAIN CONTENT ── */}
            <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12">

                {/* ─── CATALOG STEP ─────────────────────────────────────────────── */}
                {step === "catalog" && (
                    <>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-12 h-12 border-4 border-[#2D8C4E] border-t-transparent rounded-full animate-spin" />
                                <p className="font-body text-[#6B6356] text-sm">Carregando produtos...</p>
                            </div>
                        ) : (
                            <>
                                {/* ── Hint bar ── */}
                                <div className="flex items-center gap-2 mb-5 p-3 sm:p-4 rounded-xl" style={{ background: "rgba(15,61,31,.06)", border: "1px solid rgba(15,61,31,.1)" }}>
                                    <Info size={15} className="text-[#2D8C4E] flex-shrink-0" />
                                    <p className="font-body text-[#3D3028] text-xs sm:text-sm">
                                        <strong>Como funciona:</strong> clique em uma bitola para expandi-la, depois digite a quantidade desejada em cada comprimento. Pode abrir várias bitolas ao mesmo tempo.
                                    </p>
                                </div>

                                {/* ── Section label ── */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div>
                                        <p className="section-label mb-1">Passo 1 e 2</p>
                                        <h2 className="font-display font-bold text-[#0F3D1F] text-2xl">Bitolas disponíveis</h2>
                                    </div>
                                    <div className="flex-1 h-px" style={{ background: "linear-gradient(to right,rgba(15,61,31,.15),transparent)" }} />
                                </div>

                                {/* ── Accordion list ── */}
                                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 mb-10">
                                    {bitolaGroups.map((g) => {
                                        const isOpen = openBitolas.has(g.key);
                                        const count = bitolaCartCount(g.key);
                                        return (
                                            <div key={g.key} className={`bitola-row ${isOpen ? "open" : ""}`}>
                                                {/* Header */}
                                                <div
                                                    className="bitola-row-header flex flex-col"
                                                    onClick={() => toggleBitola(g.key)}
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="relative w-48 h-48 sm:w-48 sm:h-48 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#F0EBE1" }}>
                                                        <Image
                                                            src={`/bitolas/${g.imageName}.png`}
                                                            alt={`Bitola ${g.label}`}
                                                            fill
                                                            className="object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                                        />
                                                    </div>

                                                    {/* Label */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-display font-bold text-base sm:text-lg leading-none" style={{ color: isOpen ? "#E8C97A" : "#0F3D1F" }}>
                                                            Bitola {g.label}
                                                        </p>
                                                        <p className="font-body text-xs mt-1" style={{ color: isOpen ? "rgba(255,255,255,.45)" : "#8A8075" }}>
                                                            {g.produtos.length} comprimentos disponíveis
                                                        </p>
                                                    </div>

                                                    {/* Count badge + chevron */}
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        {count > 0 && (
                                                            <span className="count-badge">{count} un</span>
                                                        )}
                                                        <div style={{ color: isOpen ? "#E8C97A" : "#6B6356" }}>
                                                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Body — comprimentos grid */}
                                                {isOpen && (
                                                    <div className="bitola-row-body">
                                                        <p className="font-body text-xs text-[#8A8075] mb-3">
                                                            Digite a quantidade em cada comprimento desejado:
                                                        </p>
                                                        <ComprimentoGrid
                                                            produtos={g.produtos}
                                                            getQty={getQty}
                                                            setQty={setQty} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── Ripas section ── */}
                                {ripas.length > 0 && (
                                    <div className="mb-10">
                                        {/* ... Header de Ripas ... */}
                                        <div className="bg-white rounded-2xl border border-[#EDE8DE] p-4 sm:p-5">
                                            {/* CHAMADA CORRIGIDA AQUI TAMBÉM */}
                                            <ComprimentoRipas
                                                produtos={ripas}
                                                getQty={getQty}
                                                setQty={setQty}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* ── Proceed block ── */}
                                {cart.length > 0 && (
                                    <div
                                        className="rounded-2xl p-5 sm:p-8 mb-6"
                                        style={{ background: "linear-gradient(135deg,#0F3D1F 0%,#1A5C2E 100%)", border: "1px solid rgba(201,168,76,.25)" }}
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="section-label" style={{ color: "rgba(232,201,122,.7)" }}>Resumo do pedido</p>
                                                <h3 className="font-display font-bold text-white text-xl mt-1">
                                                    {totalPecas} {totalPecas === 1 ? "item" : "itens"} · {fmtPeso(totalPeso)}
                                                </h3>
                                                <p className="font-body text-white/50 text-xs mt-1">
                                                    {cart.length} {cart.length === 1 ? "produto" : "produtos"} diferentes selecionados
                                                </p>
                                            </div>
                                            <button
                                                className="btn-gold px-8 py-4 rounded-full flex items-center gap-2 text-sm shadow-xl whitespace-nowrap"
                                                onClick={() => { setStep("contact"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                            >
                                                Finalizar Pedido <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ─── CONTACT STEP ─────────────────────────────────────────────── */}
                {step === "contact" && (
                    <div className="max-w-[720px] mx-auto">
                        {!submitted ? (
                            <>
                                <button
                                    onClick={() => setStep("catalog")}
                                    className="flex items-center gap-2 font-body text-[#6B6356] text-sm mb-8 hover:text-[#1A5C2E] transition-colors"
                                >
                                    <ArrowLeft size={16} /> Voltar e editar pedido
                                </button>

                                {/* Order Summary */}
                                <div className="rounded-2xl border border-[#EDE8DE] overflow-hidden mb-8">
                                    <div className="px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#0F3D1F,#1A5C2E)" }}>
                                        <div>
                                            <p className="section-label" style={{ color: "rgba(232,201,122,.7)" }}>Seu pedido</p>
                                            <p className="font-display font-bold text-white text-lg mt-0.5">
                                                {totalPecas} {totalPecas === 1 ? "item" : "itens"} · {fmtPeso(totalPeso)}
                                            </p>
                                        </div>
                                        <Package size={32} className="text-[#C9A84C] opacity-60" />
                                    </div>
                                    <div className="bg-white divide-y divide-[#F5F0E8] max-h-56 overflow-y-auto">
                                        {cart.map((c) => (
                                            <div key={c.produto.id} className="px-6 py-3 flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-body text-sm text-[#1A1A1A] truncate font-medium">{c.produto.nome}</p>
                                                    <p className="font-body text-xs text-[#6B6356] mt-0.5">
                                                        {fmtPeso(parseFloat(c.produto.peso_unitario_kg) * c.quantidade)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <span className="font-body font-bold text-sm px-3 py-1 rounded-full" style={{ background: "linear-gradient(135deg,#C9A84C,#E8C97A)", color: "#0F3D1F" }}>
                                                        {c.quantidade}×
                                                    </span>
                                                    <button onClick={() => setQty(c.produto, 0)} className="text-[#6B6356] hover:text-[#DC2626] transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Contact Form */}
                                <div className="bg-white rounded-2xl border border-[#EDE8DE] p-6 sm:p-8">
                                    <div className="mb-6">
                                        <p className="section-label mb-2">Passo 3</p>
                                        <h2 className="font-display font-bold text-[#0F3D1F] text-2xl">Seus dados para contato</h2>
                                        <p className="font-body text-[#6B6356] text-sm mt-1.5">
                                            Nossa equipe entrará em contato com o orçamento personalizado em até 24h.
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="font-body text-xs font-semibold text-[#3D3028] uppercase tracking-wider mb-2 block">Nome completo</label>
                                            <div className="relative">
                                                <input type="text" value={form.nome} onChange={(e) => { setForm({ ...form, nome: e.target.value }); setErrors({ ...errors, nome: "" }); }} placeholder="Seu nome completo" className={`input-field pl-10 ${errors.nome ? "error" : ""}`} />
                                            </div>
                                            {errors.nome && <p className="font-body text-xs text-red-500 mt-1">{errors.nome}</p>}
                                        </div>
                                        <div>
                                            <label className="font-body text-xs font-semibold text-[#3D3028] uppercase tracking-wider mb-2 block">E-mail</label>
                                            <div className="relative">
                                                <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }} placeholder="seu@email.com" className={`input-field pl-10 ${errors.email ? "error" : ""}`} />
                                            </div>
                                            {errors.email && <p className="font-body text-xs text-red-500 mt-1">{errors.email}</p>}
                                        </div>
                                        <div>
                                            <label className="font-body text-xs font-semibold text-[#3D3028] uppercase tracking-wider mb-2 block">WhatsApp</label>
                                            <div className="relative">
                                                <input type="tel" value={form.whatsapp} onChange={(e) => { setForm({ ...form, whatsapp: e.target.value }); setErrors({ ...errors, whatsapp: "" }); }} placeholder="(00) 00000-0000" className={`input-field pl-10 ${errors.whatsapp ? "error" : ""}`} />
                                            </div>
                                            {errors.whatsapp && <p className="font-body text-xs text-red-500 mt-1">{errors.whatsapp}</p>}
                                        </div>
                                        <div className="flex items-start gap-3 p-4 rounded-xl mt-2" style={{ background: "rgba(45,140,78,.06)", border: "1px solid rgba(45,140,78,.15)" }}>
                                            <Check size={16} className="text-[#2D8C4E] flex-shrink-0 mt-0.5" />
                                            <p className="font-body text-xs text-[#3D3028] leading-relaxed">
                                                Ao enviar, seus dados serão usados <strong>apenas para responder seu orçamento</strong>. Você será redirecionado para o WhatsApp para confirmar o pedido.
                                            </p>
                                        </div>
                                        <button className="btn-gold w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg mt-2" onClick={handleSubmit}>
                                            <Send size={16} /> Enviar pedido pelo WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg,#1A5C2E,#2D8C4E)" }}>
                                    <Check size={36} className="text-white" />
                                </div>
                                <h2 className="font-display font-bold text-[#0F3D1F] text-3xl mb-3">Pedido enviado!</h2>
                                <p className="font-body text-[#6B6356] mb-8 max-w-sm mx-auto leading-relaxed text-sm">
                                    Seu pedido foi encaminhado pelo WhatsApp. Nossa equipe entrará em contato em breve com o orçamento personalizado.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center w-full ">
                                    <Link href="/" className="w-full">
                                        <button className="btn-gold px-8 py-3.5 rounded-full text-sm shadow-lg flex items-center gap-2 w-full justify-center">
                                            <Trees size={16} /> Voltar para o site
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => { setCart([]); setStep("catalog"); setSubmitted(false); setForm({ nome: "", email: "", whatsapp: "" }); }}
                                        className="font-body px-8 py-3.5 rounded-full text-sm border-2 border-[#EDE8DE] text-[#6B6356] hover:border-[#1A5C2E] hover:text-[#1A5C2E] transition-colors w-full"
                                    >
                                        Novo orçamento
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ── STICKY CART BAR (mobile, bottom) ── */}
            {cart.length > 0 && step === "catalog" && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 cart-bar sm:hidden">
                    <button
                        className="btn-gold w-full py-4 rounded-2xl flex items-center justify-between px-5 shadow-2xl text-sm"
                        onClick={() => { setStep("contact"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    >
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={18} />
                            <span className="font-body font-bold">{totalPecas} {totalPecas === 1 ? "item" : "itens"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-body">{fmtPeso(totalPeso)}</span>
                            <ArrowRight size={16} />
                        </div>
                    </button>
                </div>
            )}

            {/* ── FOOTER ── */}
            <footer className="py-10 px-6 text-center mt-8" style={{ background: "#0A2914", borderTop: "1px solid rgba(201,168,76,.15)" }}>
                <p className="font-body text-white/25 text-[11px] uppercase tracking-[.25em]">
                    © 2026 Rei das Madeiras · Itamarandiba, MG
                </p>
            </footer>
        </div>
    );
}