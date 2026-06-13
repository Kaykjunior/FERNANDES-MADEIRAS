--
-- PostgreSQL database dump
--

\restrict wsJCSOduDSEmJY5uZbWgLoIkqd57PYxDS9snmXXprIlOa2OfnGIXLMn5n8LapZF

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: comissoes_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.comissoes_status_enum AS ENUM (
    'PREVISTA',
    'LIBERADA',
    'PAGA',
    'CANCELADA'
);


ALTER TYPE public.comissoes_status_enum OWNER TO postgres;

--
-- Name: configuracoes_fiscais_cfop_aplicacao_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.configuracoes_fiscais_cfop_aplicacao_enum AS ENUM (
    'DENTRO_ESTADO',
    'FORA_ESTADO',
    'EXPORTACAO'
);


ALTER TYPE public.configuracoes_fiscais_cfop_aplicacao_enum OWNER TO postgres;

--
-- Name: contas_receber_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contas_receber_status_enum AS ENUM (
    'PENDENTE',
    'PAGO',
    'ATRASADO',
    'CANCELADO'
);


ALTER TYPE public.contas_receber_status_enum OWNER TO postgres;

--
-- Name: enderecos_tipo_endereco_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enderecos_tipo_endereco_enum AS ENUM (
    'PRINCIPAL',
    'COBRANCA',
    'ENTREGA',
    'COMERCIAL',
    'RESIDENCIAL',
    'OUTROS'
);


ALTER TYPE public.enderecos_tipo_endereco_enum OWNER TO postgres;

--
-- Name: entidades_tipo_entidade_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.entidades_tipo_entidade_enum AS ENUM (
    'CLIENTE',
    'FORNECEDOR',
    'TRANSPORTADORA',
    'AMBOS'
);


ALTER TYPE public.entidades_tipo_entidade_enum OWNER TO postgres;

--
-- Name: entidades_tipo_pessoa_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.entidades_tipo_pessoa_enum AS ENUM (
    'F',
    'J'
);


ALTER TYPE public.entidades_tipo_pessoa_enum OWNER TO postgres;

--
-- Name: movimentacoes_estoque_tipo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.movimentacoes_estoque_tipo_enum AS ENUM (
    'ENTRADA',
    'SAIDA',
    'AJUSTE',
    'TRANSFERENCIA'
);


ALTER TYPE public.movimentacoes_estoque_tipo_enum OWNER TO postgres;

--
-- Name: romaneios_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.romaneios_status_enum AS ENUM (
    'EM_ABERTO',
    'ENVIADO',
    'ENTREGUE',
    'CANCELADO'
);


ALTER TYPE public.romaneios_status_enum OWNER TO postgres;

--
-- Name: usuarios_cargo_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.usuarios_cargo_enum AS ENUM (
    'ADMIN',
    'GERENTE',
    'VENDEDOR',
    'ESTOQUISTA',
    'FINANCEIRO'
);


ALTER TYPE public.usuarios_cargo_enum OWNER TO postgres;

--
-- Name: vendas_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vendas_status_enum AS ENUM (
    'PAGO',
    'AGUARDANDO',
    'CANCELADO',
    'FATURADO'
);


ALTER TYPE public.vendas_status_enum OWNER TO postgres;

--
-- Name: vendas_status_sefaz_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vendas_status_sefaz_enum AS ENUM (
    'NAO_EMITIDA',
    'AUTORIZADA',
    'REJEITADA',
    'CANCELADA',
    'DENEGADA'
);


ALTER TYPE public.vendas_status_sefaz_enum OWNER TO postgres;

--
-- Name: vendas_status_venda_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vendas_status_venda_enum AS ENUM (
    'ORCAMENTO',
    'APROVADO',
    'EM_SEPARACAO',
    'ENVIADO',
    'ENTREGUE',
    'CANCELADO'
);


ALTER TYPE public.vendas_status_venda_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: caixa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caixa (
    id character varying(50) NOT NULL,
    saldo_atual numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    ultima_atualizacao timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.caixa OWNER TO postgres;

--
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    ncm_padrao character varying(8),
    ativo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categorias_id_seq OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- Name: comissoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comissoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vendedor_id uuid NOT NULL,
    venda_id uuid NOT NULL,
    conta_receber_id uuid,
    base_calculo numeric(12,2),
    percentual numeric(5,2),
    valor_comissao numeric(12,2) NOT NULL,
    status public.comissoes_status_enum DEFAULT 'PREVISTA'::public.comissoes_status_enum NOT NULL,
    data_liberacao date,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comissoes OWNER TO postgres;

--
-- Name: configuracoes_fiscais_cfop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracoes_fiscais_cfop (
    id integer NOT NULL,
    cfop character varying(4) NOT NULL,
    descricao character varying(255),
    aplicacao public.configuracoes_fiscais_cfop_aplicacao_enum
);


ALTER TABLE public.configuracoes_fiscais_cfop OWNER TO postgres;

--
-- Name: configuracoes_fiscais_cfop_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.configuracoes_fiscais_cfop_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.configuracoes_fiscais_cfop_id_seq OWNER TO postgres;

--
-- Name: configuracoes_fiscais_cfop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.configuracoes_fiscais_cfop_id_seq OWNED BY public.configuracoes_fiscais_cfop.id;


--
-- Name: contas_receber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contas_receber (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    venda_id uuid,
    cliente_id uuid NOT NULL,
    numero_parcela integer DEFAULT 1 NOT NULL,
    total_parcelas integer DEFAULT 1 NOT NULL,
    valor_aberto numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_parcela numeric(12,2) NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    valor_pago numeric(12,2),
    acrescimos numeric(12,2),
    descontos numeric(12,2),
    status public.contas_receber_status_enum DEFAULT 'PENDENTE'::public.contas_receber_status_enum NOT NULL,
    forma_pagamento_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contas_receber OWNER TO postgres;

--
-- Name: enderecos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enderecos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    entidade_id uuid NOT NULL,
    tipo_endereco public.enderecos_tipo_endereco_enum DEFAULT 'PRINCIPAL'::public.enderecos_tipo_endereco_enum NOT NULL,
    logradouro character varying(255) NOT NULL,
    numero character varying(20) NOT NULL,
    complemento character varying(100),
    bairro character varying(100) NOT NULL,
    cidade character varying(100) NOT NULL,
    estado character varying(2) NOT NULL,
    cep character varying(9) NOT NULL,
    pais character varying(100) DEFAULT 'Brasil'::character varying NOT NULL,
    padrao boolean DEFAULT false NOT NULL,
    observacoes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.enderecos OWNER TO postgres;

--
-- Name: entidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entidades (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tipo_entidade public.entidades_tipo_entidade_enum DEFAULT 'CLIENTE'::public.entidades_tipo_entidade_enum NOT NULL,
    tipo_pessoa public.entidades_tipo_pessoa_enum NOT NULL,
    documento character varying(20) NOT NULL,
    rg_ie character varying(20),
    indicador_ie integer DEFAULT 9 NOT NULL,
    nome_razao_social character varying(255) NOT NULL,
    nome_fantasia character varying(255),
    email character varying(100),
    telefone character varying(20),
    celular character varying(20),
    observacoes text,
    regime_tributario integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.entidades OWNER TO postgres;

--
-- Name: estoque; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estoque (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quantidade integer DEFAULT 0 NOT NULL,
    localizacao character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    produto_id uuid,
    quantidade_reservada integer DEFAULT 0 NOT NULL,
    custo_medio numeric(12,2)
);


ALTER TABLE public.estoque OWNER TO postgres;

--
-- Name: formas_pagamento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formas_pagamento (
    id integer NOT NULL,
    nome character varying(50) NOT NULL,
    codigo_sefaz character varying(2),
    taxa_adm numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    dias_recebimento integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.formas_pagamento OWNER TO postgres;

--
-- Name: formas_pagamento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.formas_pagamento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.formas_pagamento_id_seq OWNER TO postgres;

--
-- Name: formas_pagamento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.formas_pagamento_id_seq OWNED BY public.formas_pagamento.id;


--
-- Name: lotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lotes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    codigo character varying(50) NOT NULL,
    produto_id uuid NOT NULL,
    quantidade numeric(12,3) NOT NULL,
    valor_compra numeric(12,2) NOT NULL,
    data_fabricacao date,
    data_validade date,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lotes OWNER TO postgres;

--
-- Name: movimentacoes_estoque; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimentacoes_estoque (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tipo public.movimentacoes_estoque_tipo_enum NOT NULL,
    produto_id uuid NOT NULL,
    lote_id uuid,
    venda_item_id uuid,
    usuario_id uuid NOT NULL,
    quantidade integer NOT NULL,
    motivo character varying(200) NOT NULL,
    observacoes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.movimentacoes_estoque OWNER TO postgres;

--
-- Name: produtos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produtos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying NOT NULL,
    codigo_sku character varying,
    comprimento_mt numeric(10,2) NOT NULL,
    diametro_min integer,
    diametro_max integer,
    peso_unitario_kg numeric(10,3) NOT NULL,
    preco_venda_base numeric(12,2) NOT NULL,
    unidade_comercial character varying(6) DEFAULT 'UN'::character varying NOT NULL,
    ncm character varying(8) NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    categoria_id integer,
    dimensao_ripa character varying(15)
);


ALTER TABLE public.produtos OWNER TO postgres;

--
-- Name: romaneios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.romaneios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    codigo character varying(50),
    status public.romaneios_status_enum DEFAULT 'EM_ABERTO'::public.romaneios_status_enum NOT NULL,
    transportadora_id uuid,
    motorista_id uuid,
    placa_veiculo character varying(100),
    data_envio timestamp without time zone,
    data_entrega timestamp without time zone,
    observacoes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.romaneios OWNER TO postgres;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying NOT NULL,
    email character varying NOT NULL,
    senha_hash character varying NOT NULL,
    cargo public.usuarios_cargo_enum DEFAULT 'VENDEDOR'::public.usuarios_cargo_enum NOT NULL,
    comissao_percentual numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: venda_itens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.venda_itens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    venda_id uuid NOT NULL,
    produto_id uuid NOT NULL,
    lote_id uuid,
    quantidade numeric(12,3) NOT NULL,
    valor_unitario numeric(12,2) NOT NULL,
    valor_desconto numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_frete_item numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_subtotal numeric(12,2) NOT NULL,
    cfop character varying(4) NOT NULL,
    cst_icms character varying(3),
    cst_pis character varying(2),
    cst_cofins character varying(2),
    base_icms numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_icms numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    aliq_icms numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    base_pis numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_pis numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    base_cofins numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_cofins numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_ipi numeric(12,2) DEFAULT '0'::numeric NOT NULL
);


ALTER TABLE public.venda_itens OWNER TO postgres;

--
-- Name: vendas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero_pedido integer,
    cliente_id uuid NOT NULL,
    vendedor_id uuid NOT NULL,
    romaneio_id uuid,
    status_venda public.vendas_status_venda_enum DEFAULT 'ORCAMENTO'::public.vendas_status_venda_enum NOT NULL,
    status public.vendas_status_enum DEFAULT 'AGUARDANDO'::public.vendas_status_enum NOT NULL,
    valor_produtos numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_frete numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_seguro numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_desconto numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_outras_despesas numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    valor_total numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    modelo_nf character varying(2) DEFAULT '55'::character varying NOT NULL,
    serie_nf character varying(3),
    numero_nf integer,
    chave_acesso_nfe character varying(44),
    status_sefaz public.vendas_status_sefaz_enum DEFAULT 'NAO_EMITIDA'::public.vendas_status_sefaz_enum NOT NULL,
    data_emissao_nfe timestamp without time zone,
    xml_autorizado text,
    observacoes_fisco text,
    observacoes_cliente text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    forma_pagamento_id integer
);


ALTER TABLE public.vendas OWNER TO postgres;

--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- Name: configuracoes_fiscais_cfop id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracoes_fiscais_cfop ALTER COLUMN id SET DEFAULT nextval('public.configuracoes_fiscais_cfop_id_seq'::regclass);


--
-- Name: formas_pagamento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formas_pagamento ALTER COLUMN id SET DEFAULT nextval('public.formas_pagamento_id_seq'::regclass);


--
-- Data for Name: caixa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caixa (id, saldo_atual, ultima_atualizacao) FROM stdin;
PRINCIPAL	36185.50	2026-02-09 23:09:05.318
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, nome, ncm_padrao, ativo) FROM stdin;
1	POSTES	44031100	t
2	PEÇAS	44031100	t
3	RIPA	44031100	t
\.


--
-- Data for Name: comissoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comissoes (id, vendedor_id, venda_id, conta_receber_id, base_calculo, percentual, valor_comissao, status, data_liberacao, created_at) FROM stdin;
1e307b2b-4b9d-4159-bcaf-3076adffd3b7	22d5aaf0-a42b-4d63-a7e8-252a9f5fc650	742bee45-b442-4bed-b9cc-6ff717f89cbc	\N	17395.00	5.00	869.75	PREVISTA	\N	2026-02-09 00:05:25.515121
\.


--
-- Data for Name: configuracoes_fiscais_cfop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracoes_fiscais_cfop (id, cfop, descricao, aplicacao) FROM stdin;
\.


--
-- Data for Name: contas_receber; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contas_receber (id, venda_id, cliente_id, numero_parcela, total_parcelas, valor_aberto, valor_parcela, data_vencimento, data_pagamento, valor_pago, acrescimos, descontos, status, forma_pagamento_id, created_at, updated_at) FROM stdin;
3301b29b-8e84-4b75-9f42-259f73bda246	742bee45-b442-4bed-b9cc-6ff717f89cbc	c756697e-482f-4413-8340-8b2ea5583dae	1	1	0.00	17395.00	2026-02-08	2026-02-09	17515.00	0.00	120.00	PAGO	1	2026-02-09 00:05:25.506754	2026-02-10 02:09:05.30633
\.


--
-- Data for Name: enderecos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enderecos (id, entidade_id, tipo_endereco, logradouro, numero, complemento, bairro, cidade, estado, cep, pais, padrao, observacoes, created_at, updated_at, deleted_at) FROM stdin;
7fd91f39-10ff-4f2e-93c6-47b6d1fa6d9e	c756697e-482f-4413-8340-8b2ea5583dae	COBRANCA	Rua Fazendinha	1165	Perto da quadra	Fazendinha	Itamarandiba	MG	39670000	Brasil	t	Biqueira	2026-02-08 23:04:29.87053	2026-02-08 23:04:29.87053	\N
\.


--
-- Data for Name: entidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entidades (id, tipo_entidade, tipo_pessoa, documento, rg_ie, indicador_ie, nome_razao_social, nome_fantasia, email, telefone, celular, observacoes, regime_tributario, created_at, updated_at, deleted_at) FROM stdin;
c756697e-482f-4413-8340-8b2ea5583dae	CLIENTE	F	15882740630	\N	9	Kayk Junior Fernandes de Paulo 2	KJ Porto Seguro	kaykjunior855@gmail.com	38998542340	38998542340	Caloteiro	\N	2026-02-08 23:03:21.925546	2026-02-10 02:03:59.662584	\N
\.


--
-- Data for Name: estoque; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estoque (id, quantidade, localizacao, created_at, updated_at, produto_id, quantidade_reservada, custo_medio) FROM stdin;
49073b2f-f304-4691-bce1-e8d0abbc8aad	1000	\N	2026-02-07 18:46:37.272184	2026-02-07 18:46:37.272184	54554c42-255b-4225-9850-f795d7ac1582	0	0.99
1afbe124-cb28-4e1a-a589-010e2eb9333d	600	\N	2026-02-06 13:04:09.80624	2026-02-09 00:05:25.471955	625a416f-524e-48eb-8f21-8bda47fce6a7	-196	100.00
\.


--
-- Data for Name: formas_pagamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formas_pagamento (id, nome, codigo_sefaz, taxa_adm, dias_recebimento, ativo) FROM stdin;
1	DINHEIRO	01	0.00	0	t
\.


--
-- Data for Name: lotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lotes (id, codigo, produto_id, quantidade, valor_compra, data_fabricacao, data_validade, created_at) FROM stdin;
\.


--
-- Data for Name: movimentacoes_estoque; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimentacoes_estoque (id, tipo, produto_id, lote_id, venda_item_id, usuario_id, quantidade, motivo, observacoes, created_at, updated_at) FROM stdin;
76af431d-35be-4c9d-80ad-881dc1432962	SAIDA	625a416f-524e-48eb-8f21-8bda47fce6a7	\N	ef62ebd8-1639-43ef-9c5b-a5b0de0076d3	22d5aaf0-a42b-4d63-a7e8-252a9f5fc650	100	Venda Direta Aprovada: f62c482a-12d8-4f99-9de7-0659ba0e1828	\N	2026-02-09 00:00:21.828969	2026-02-09 00:00:21.828969
711e0060-edae-498c-b110-8f009854e515	SAIDA	625a416f-524e-48eb-8f21-8bda47fce6a7	\N	df03ad56-bb3e-4e9c-ba3e-c6f15bafa3eb	22d5aaf0-a42b-4d63-a7e8-252a9f5fc650	100	Venda Direta Aprovada: d60ebc5c-f9f4-43b8-8795-564d58370c7a	\N	2026-02-09 00:01:24.62938	2026-02-09 00:01:24.62938
9deb9adf-96a5-43f0-b275-032fc4224e77	SAIDA	625a416f-524e-48eb-8f21-8bda47fce6a7	\N	b38626f5-8c7b-43b3-86f5-a8ad828a2343	22d5aaf0-a42b-4d63-a7e8-252a9f5fc650	100	Venda Direta Aprovada: 742bee45-b442-4bed-b9cc-6ff717f89cbc	\N	2026-02-09 00:05:25.48666	2026-02-09 00:05:25.48666
\.


--
-- Data for Name: produtos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produtos (id, nome, codigo_sku, comprimento_mt, diametro_min, diametro_max, peso_unitario_kg, preco_venda_base, unidade_comercial, ncm, ativo, created_at, updated_at, categoria_id, dimensao_ripa) FROM stdin;
44fc60a9-213d-4431-83d8-2ffa07f2a169	Peça 8M 22-24	\N	8.00	22	24	298.000	471.05	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
da329fd4-f9fa-4b91-b649-bdf95a98fd53	Peça 8M 24-26	\N	8.00	24	26	359.000	549.09	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
251379d7-eed3-4532-b929-89c2304d0e48	Peça 8M 26-28	\N	8.00	26	28	405.000	656.85	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
eeb32349-bb19-45e9-b510-cc11561e376e	Peça 8M 28-30	\N	8.00	28	30	455.000	772.15	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
cd7d7131-2370-4d22-ac29-d0010c7ee549	Peça 9M 12-14	\N	9.00	12	14	107.000	149.45	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
5d3b6408-7841-4b16-962c-e65efb9b96f7	Peça 9M 14-16	\N	9.00	14	16	143.000	188.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
0b662c9b-f689-41ab-8d27-a86e7946911f	Peça 9M 16-18	\N	9.00	16	18	183.000	257.42	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
d295807d-29e0-4edb-b87e-28cbee076a05	Peça 9M 18-20	\N	9.00	18	20	229.000	407.98	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
8ba2c441-8830-40bc-8ac6-a676935114d9	Peça 9M 20-22	\N	9.00	20	22	280.000	483.85	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
79188ac3-0b83-4e90-a1fa-08ad0745c2d8	Peça 10M 28-30	\N	10.00	28	30	425.000	962.45	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
a9ac46df-993f-4549-94e6-a06cd8ca22ad	Peça 11M 14-16	\N	11.00	14	16	174.000	229.93	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
7c3fb5cd-7911-4c7e-b36f-600aba6267db	Peça 11M 16-18	\N	11.00	16	18	225.000	314.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
ecfbb741-e02c-461f-a7f4-56ea6cfb671e	Peça 11M 18-20	\N	11.00	18	20	280.000	498.63	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
1a6406e2-0690-4827-842e-1f8ba8cfdc4c	Peça 11M 20-22	\N	11.00	20	22	342.000	591.37	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
41f6cb9b-e045-4d99-b0b4-ae0231425395	Peça 11M 22-24	\N	11.00	22	24	411.000	646.79	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
a20adc1d-6491-4369-8677-2ba3e2453765	Peça 11M 24-26	\N	11.00	24	26	499.000	756.00	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
a64e14e9-d8bc-4c3e-8b6c-f6c0416ee7d4	Peça 11M 26-28	\N	11.00	26	28	572.000	902.99	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
c6c79a05-58b2-4bf7-87cb-cf240a3c07c7	Peça 11M 28-30	\N	11.00	28	30	614.000	1058.15	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
b45f5957-9edf-4ace-93dc-8b1cda360c1a	Peça 12M 14-16	\N	12.00	14	16	202.000	250.80	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
57158308-216e-4129-b568-ab7f87113b72	Peça 12M 16-18	\N	12.00	16	18	286.000	343.25	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
243661c7-4551-449f-940a-cb094c212e35	Peça 12M 18-20	\N	12.00	18	20	356.000	543.95	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
6a642fd6-6aba-4c8c-9860-f55c9c1b7513	Peça 12M 20-22	\N	12.00	20	22	399.000	643.99	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
06e496d0-68b3-453c-aaba-2c4057863246	Peça 12M 22-24	\N	12.00	22	24	480.000	706.60	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
2d3e9d00-1ab5-47bc-9975-90433b916cb7	Peça 12M 24-26	\N	12.00	24	26	561.000	824.69	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
7f76c3fa-e547-4757-9cdc-b9d311737da5	Peça 12M 26-28	\N	12.00	26	28	603.000	985.90	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
4b3afbae-80b4-41b9-96a3-aec7b2d54360	Peça 12M 28-30	\N	12.00	28	30	690.000	1153.69	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
961a1949-9061-4c1b-800d-f784c1245ac3	RIPA DE EUCALIPTO TRATADO 4X1,5	\N	1.00	\N	\N	0.600	2.00	MT	44071100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	3	4X1,5
9ca556f4-b03e-44a9-9c9b-95f336a89135	RIPA DE EUCALIPTO TRATADO 5X2	\N	1.00	\N	\N	1.000	3.19	MT	44071100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	3	5X2
76784b9b-95f7-40f2-b6e3-fd4853e0380e	REGUA DE EUCALIPTO TRATADO 12X3	\N	1.00	\N	\N	4.600	10.95	MT	44071100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	3	12X3
93ceaab0-28f8-45c5-9ec0-c656f7fddaa1	Peça 3M 10-12	\N	3.00	10	12	27.000	34.10	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
e4b20bb2-9a10-4e1c-8975-e5b197600448	Peça 3M 12-14	\N	3.00	12	14	38.000	44.25	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
7550ca5e-ac49-4b12-bb88-d351f96143df	Peça 3M 14-16	\N	3.00	14	16	50.000	62.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
3d3ca620-6afd-48a9-890a-a5671c3f5457	Peça 3M 16-18	\N	3.00	16	18	65.000	88.53	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
2ccd3db9-29c7-4903-afad-c2287404bac2	Peça 3M 18-20	\N	3.00	18	20	81.000	142.00	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
b3d77b7d-3950-4fde-ab84-b58f241b9697	Peça 3M 20-22	\N	3.00	20	22	99.000	173.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
7625907b-33b6-484d-af37-0a08516e9500	Peça 3M 22-24	\N	3.00	22	24	119.000	184.70	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
74d511ff-c7cb-4b89-8d20-945b01181e92	Peça 3M 24-26	\N	3.00	24	26	139.000	202.60	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
d5129c2b-089b-4469-86f1-8ec32cff204b	Peça 3M 26-28	\N	3.00	26	28	150.000	246.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
d29be75b-bf13-4764-9feb-19b2133b668a	Peça 3M 28-30	\N	3.00	28	30	171.000	300.35	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
9fd21a2d-8581-49d8-a4be-d2ef6a99f2de	Peça 3,5M 4-6	\N	3.50	4	6	9.000	10.60	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
61bab89f-38f1-4f38-9010-3f71a8e5ab32	Peça 3,5M 6-8	\N	3.50	6	8	12.000	20.55	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
980d36f9-bf4e-4a8d-812a-14c5b2506090	Peça 3,5M 8-10	\N	3.50	8	10	21.000	31.00	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
9bb4a33b-5280-445e-b40c-ba3fada1b437	Peça 3,5M 10-12	\N	3.50	10	12	31.000	42.88	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
31ba897b-9bd8-494e-9aa9-866cc1fa61e7	Peça 3,5M 12-14	\N	3.50	12	14	44.000	58.99	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
02fcbfe4-d25e-49b2-a50d-acf1f8e07971	Peça 3,5M 14-16	\N	3.50	14	16	59.000	75.89	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
11063895-c102-4464-94cf-e81005be57bb	Peça 3,5M 16-18	\N	3.50	16	18	76.000	107.50	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
1133a393-4945-4ba0-a024-bdf8f627c1ff	Peça 3,5M 18-20	\N	3.50	18	20	95.000	169.03	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
512ed91a-5b55-40cb-a0e4-40096c50d4fb	Peça 3,5M 20-22	\N	3.50	20	22	116.000	209.00	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
02ca8d80-46d2-4d95-9993-3b22f11cc401	Peça 3,5M 22-24	\N	3.50	22	24	139.000	236.20	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
20551b5a-2e57-4817-968d-3b9c755b72fd	Peça 3,5M 24-26	\N	3.50	24	26	151.000	271.93	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
3e815504-eb16-4da4-8638-406a68531e14	Peça 3,5M 26-28	\N	3.50	26	28	172.000	287.29	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
7389d167-5efb-4014-b287-5ff5cc644ff7	Peça 3,5M 28-30	\N	3.50	28	30	193.000	350.45	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
5ca839cc-1b35-4586-bc3c-d315c08391a7	Peça 4M 4-6	\N	4.00	4	6	11.000	12.10	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
07fa7c6f-cdd0-4952-9074-b1f90a79a188	Peça 4M 6-8	\N	4.00	6	8	14.000	23.50	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
69f403e7-ab11-45bc-8f82-66f0bca6270e	Peça 4M 8-10	\N	4.00	8	10	24.000	35.42	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
442a07f0-8717-461e-bde2-3a6e9f995024	Peça 4M 10-12	\N	4.00	10	12	36.000	50.59	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
f53e2361-055a-4242-a32d-146b5bdf2027	RIPA DE EUCALIPTO TRATADO 4X2	\N	1.00	\N	\N	1.000	2.50	MT	44071100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	3	4X2
1d5659ac-bfb4-4013-be96-7a64b6674073	RIPA DE EUCALIPTO TRATADO 5X3	\N	1.00	\N	\N	1.500	4.28	MT	44071100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	3	5X3
bd75307b-9a12-47aa-a718-a4910965f053	Poste 1,6M 4-6	\N	1.60	4	6	3.000	4.19	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
b07707ef-a2e1-4a7d-bf05-0b5d4b54490e	Poste 1,6M 6-8	\N	1.60	6	8	6.000	5.85	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
61a5d9b7-95e9-4324-ac1f-67289e87336c	Poste 1,6M 8-10	\N	1.60	8	10	9.000	9.37	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
6a543f54-82cd-40fa-8042-ae65e5526500	Poste 2,2M 4-6	\N	2.20	4	6	6.000	5.04	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
a66a58e3-3133-4906-ad17-520dceee68e9	Poste 2,2M 6-8	\N	2.20	6	8	9.000	8.00	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
92d801a7-c7c6-491f-bba5-5d7812598c9a	Poste 2,2M 8-10	\N	2.20	8	10	14.000	13.50	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
b05586de-d318-484a-8b93-4805c94253fe	Poste 2,2M 10-12	\N	2.20	10	12	21.000	19.75	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
a799e00d-2d25-4fa8-9809-4524c14dc0a6	Poste 2,2M 12-14	\N	2.20	12	14	28.000	25.45	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
01e01b8b-b606-44fc-9a15-e634087305e7	Poste 2,5M 4-6	\N	2.50	4	6	7.000	6.07	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
e0b83d25-7bd7-42de-abbd-2613fce77de1	Poste 2,5M 6-8	\N	2.50	6	8	10.000	9.15	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
0d0491e1-6547-47ae-85c0-c9abb414fb4f	Poste 2,5M 8-10	\N	2.50	8	10	15.000	15.70	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
a84dc1dc-1594-480b-b47c-b8372e51d1ef	Poste 2,5M 10-12	\N	2.50	10	12	21.000	22.15	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
01f6e1f0-f6c1-4ee4-819a-30d5bdd2995a	Poste 2,5M 12-14	\N	2.50	12	14	30.000	28.17	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
c8ff5b50-d4a8-416f-96ed-d38dccddcb8e	Poste 2,5M 14-16	\N	2.50	14	16	44.000	32.95	UN	44031100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	1	\N
c76a04e8-84b7-4658-ae9f-53302ee9abf7	Peça 3M 4-6	\N	3.00	4	6	8.000	7.85	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
6d82630f-d24a-4084-930d-52d40da7a4a9	Peça 3M 6-8	\N	3.00	6	8	11.000	16.90	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
c5a03bd4-474a-4dc8-a115-807c836f80cf	Peça 3M 8-10	\N	3.00	8	10	18.000	25.20	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
db1d636a-b466-4b55-a860-2ccef3c9a9a5	REGUA DE EUCALIPTO TRATADO 14X3	\N	1.00	\N	\N	5.000	11.95	MT	44071100	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	3	14X3
b2202fd7-ba6b-41a2-bdee-2173401e5def	Peça 5M 12-14	\N	5.00	12	14	63.000	82.79	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
cffad11e-3c0e-4b38-b705-0689cdda3be9	Peça 5M 14-16	\N	5.00	14	16	84.000	104.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
16e4e56d-7c28-448b-98fc-189db0509159	Peça 5M 16-18	\N	5.00	16	18	108.000	143.00	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	
d7fa8f0a-1cf4-4ab8-a4d2-d2022568286b	Peça 5M 18-20		5.00	18	20	136.000	226.20	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	
05f700a9-7b1e-4476-a744-1e9d1d10bf6e	Peça 5M 20-22	\N	5.00	20	22	166.000	268.80	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
6a0ab169-90df-4aca-baff-a93db7679331	Peça 5M 22-24	\N	5.00	22	24	199.000	294.40	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
48acecb3-d310-4c79-ace7-cfa9be11bfa8	Peça 5M 24-26	\N	5.00	24	26	226.000	343.60	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
a427a4a5-fde7-4daf-af08-e70a0c54d9ac	Peça 5M 26-28	\N	5.00	26	28	252.000	410.50	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
76bb1a73-5d74-4123-a39d-eb353ef157df	Peça 5M 28-30	\N	5.00	28	30	287.000	492.75	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
b0246074-5ab1-4850-a2a0-eddd38ac19e4	Peça 6M 6-8	\N	6.00	6	8	22.000	36.87	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
5e5a01a4-be82-4189-b349-92fc228564be	Peça 6M 8-10	\N	6.00	8	10	36.000	55.25	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
b7d633fd-a1d1-457d-9d06-a5d144df63ca	Peça 6M 10-12	\N	6.00	10	12	54.000	75.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
7ff5abb2-639b-4aba-8765-373dc63ba3d9	Peça 6M 12-14	\N	6.00	12	14	76.000	100.25	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
7a33fe56-14a9-44a4-bc64-0d80fc55acf7	Peça 6M 14-16	\N	6.00	14	16	101.000	124.60	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
76949880-c0d1-46fe-9fd9-20ebeb216150	Peça 6M 16-18	\N	6.00	16	18	130.000	170.53	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
0f1d73a0-a1b8-4c25-9b99-f89b66a0a2a5	Peça 6M 18-20	\N	6.00	18	20	163.000	272.00	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
dd387bd2-3288-4921-be2d-7abd0b1332ed	Peça 6M 20-22	\N	6.00	20	22	199.000	322.55	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
72997522-5bdf-46a7-8ee4-dac8438ab8bb	Peça 6M 22-24	\N	6.00	22	24	239.000	353.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
74d87d6d-2ba7-4d5e-aa14-02dea2ad3db4	Peça 6M 24-26	\N	6.00	24	26	279.000	412.35	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
2a08b0fd-f8f8-4777-b787-7e7f1c4988a6	Peça 4M 12-14	\N	4.00	12	14	50.000	67.40	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
d72cd152-4892-4593-aef2-71a2b5fe586c	Peça 4M 14-16	\N	4.00	14	16	67.000	83.70	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
5c205197-546b-49fa-9a7c-2804d6fa7736	Peça 4M 16-18	\N	4.00	16	18	87.000	118.90	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
1fac0f12-a96b-45c9-8dd3-495a94b26b3a	Peça 4M 18-20	\N	4.00	18	20	108.000	188.25	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
0c824b9c-8f44-4fc3-bd0e-068248fb0aad	Peça 4M 20-22	\N	4.00	20	22	133.000	232.00	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
a899dcd7-0f2e-4297-b830-faca5eeeaa4f	Peça 4M 22-24	\N	4.00	22	24	159.000	267.70	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
2b61876f-a5eb-4741-be53-5c13e3fa7a11	Peça 4M 24-26	\N	4.00	24	26	173.000	310.79	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
56b56c70-e2c1-4438-aaf9-be632cf363b2	Peça 4M 26-28	\N	4.00	26	28	187.000	328.40	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
373d27b0-69a4-49c0-ae2e-7c1ac5c855a9	Peça 4M 28-30	\N	4.00	28	30	201.000	400.49	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
0f98e3c4-c272-4b6b-b01a-8bcc46981524	Peça 5M 6-8	\N	5.00	6	8	18.000	30.74	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
46094cc9-7e4c-47cb-b95d-3e90839878aa	Peça 5M 8-10	\N	5.00	8	10	30.000	46.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
a3c3f705-49d5-4ed9-9215-868521b03a5f	Peça 5M 10-12	\N	5.00	10	12	45.000	63.20	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
f656820e-07e4-4fa5-ae81-4019a82db12d	Peça 9M 22-24	\N	9.00	22	24	316.000	529.95	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
1c47d304-c3f3-4366-b3ad-2e839636453e	Peça 9M 24-26	\N	9.00	24	26	386.000	618.50	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
dd88e458-9b79-4d85-ad15-1580323122a4	Peça 9M 26-28	\N	9.00	26	28	426.000	738.95	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
f5318dda-03a4-4415-9546-af53dc08c5d8	Peça 9M 28-30	\N	9.00	28	30	478.000	865.72	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
8728f883-0b23-4132-9bbe-1cb05007e725	Peça 10M 14-16	\N	10.00	14	16	159.000	208.49	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
625a416f-524e-48eb-8f21-8bda47fce6a7	Peça 10M 12-14	1	10.00	12	14	144.000	166.45	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 02:20:08.768117	2	
d7e15fa5-3bc3-4fd5-bf87-6d7d999954f3	Peça 10M 16-18	\N	10.00	16	18	204.000	286.02	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
54554c42-255b-4225-9850-f795d7ac1582	Peça 10M 18-20	\N	10.00	18	20	255.000	3453.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
51f31e81-e334-4ed2-82d0-6c16884f1a46	Peça 10M 20-22	\N	10.00	20	22	311.000	537.60	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
2311088d-e0f2-411e-88a4-9769c36b7ed9	Peça 10M 22-24	\N	10.00	22	24	373.000	588.85	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
e7f6ec3c-8db0-4ed3-b2e0-276453c015a1	Peça 10M 24-26	\N	10.00	24	26	423.000	687.25	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
0ce0d94e-aedc-4eb8-a4ab-ddb99bac3b07	Peça 10M 26-28	\N	10.00	26	28	485.000	821.05	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
81332459-d186-463b-ab91-54d9d5e0b79c	Peça 6M 26-28	\N	6.00	26	28	302.000	492.60	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
715a7e55-9e39-4bbd-ba84-b153946d7d0a	Peça 6M 28-30	\N	6.00	28	30	345.000	588.47	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
d20e22e7-ebd7-4ade-a05e-f3d947428629	Peça 7M 8-10	\N	7.00	8	10	40.000	64.85	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
f7e0ef59-6de3-4a26-8685-8fea76d5e0c7	Peça 7M 10-12	\N	7.00	10	12	60.000	87.15	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
c57ff077-cd25-4c27-8c06-5978b57ea059	Peça 7M 12-14	\N	7.00	12	14	63.000	115.90	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
b64982c1-ee1b-47bc-ab11-f2d92ff7c4f3	Peça 7M 14-16	\N	7.00	14	16	111.000	146.20	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
29721fdf-003b-483a-9617-a99d080d1599	Peça 7M 16-18	\N	7.00	16	18	143.000	200.22	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
da596592-3d7b-4c40-9c25-974798ba7e13	Peça 7M 18-20	\N	7.00	18	20	178.000	317.30	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
45b9be8f-290b-41f7-b273-097a99574d5c	Peça 7M 20-22	\N	7.00	20	22	217.000	376.32	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
1bb4d96c-700c-4354-ae15-fa9d105ae1e9	Peça 7M 22-24	\N	7.00	22	24	261.000	412.20	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
8d1407a3-0bf0-44ea-bebb-72e093792aec	Peça 7M 24-26	\N	7.00	24	26	303.000	480.85	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
9ad9d97c-31ed-4e4c-b597-3324ed108515	Peça 7M 26-28	\N	7.00	26	28	356.000	574.86	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
9d021f21-4b5c-4b43-9e07-9f2b9ec53209	Peça 7M 28-30	\N	7.00	28	30	402.000	673.25	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
192ba097-0909-4947-9e47-82ef4c2c0ac9	Peça 8M 10-12	\N	8.00	10	12	66.000	101.15	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
a9e95ad0-6957-49d6-b260-b688654b0087	Peça 8M 12-14	\N	8.00	12	14	95.000	133.39	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
e6e9aaf8-b10a-422d-b2e9-553a1f7d2824	Peça 8M 14-16	\N	8.00	14	16	126.000	165.00	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
618c713b-efde-41ea-b98f-6b1269658cee	Peça 8M 16-18	\N	8.00	16	18	163.000	228.82	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
57b9b8ea-9b57-44f9-87e0-7ea7d95b20c8	Peça 8M 18-20	\N	8.00	18	20	204.000	361.09	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
c2e22f2d-d601-44ae-ad4f-688b6ec81974	Peça 8M 20-22	\N	8.00	20	22	249.000	429.80	UN	44039900	t	2026-02-04 19:13:11.313652	2026-02-10 01:50:41.695898	2	\N
\.


--
-- Data for Name: romaneios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.romaneios (id, codigo, status, transportadora_id, motorista_id, placa_veiculo, data_envio, data_entrega, observacoes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nome, email, senha_hash, cargo, comissao_percentual, ativo, created_at, updated_at, deleted_at) FROM stdin;
9f584fe3-59f8-4e59-86b1-e6d5f1cde891	DIM	admin@admin.com	$2b$10$Rzk82t1365AiixpjgDIqt.2BLGXmD1ThR6ut.7pkkS5tZL9niIs92	ADMIN	0.00	t	2026-02-04 11:58:08.896303	2026-02-04 11:58:08.896303	\N
22d5aaf0-a42b-4d63-a7e8-252a9f5fc650	kayk Junior	kaykjunior855@gmail.com	$2b$10$HQxmhbKD0.CuGFUPFNOlyuYaXB8UtYUI6N5cU8ONa1isyZNatK2Xe	ADMIN	3.00	t	2026-02-04 11:58:20.015376	2026-02-04 11:58:20.015376	\N
d6dd1bff-545a-4df3-abe2-809f5c81675c	DIM 2	dim@madeireira.com	$2b$10$NYEjeiY89Zbv1KSUP2tKL.8AfnJrCNaF0lgW/AoN4cuFDzwqTTRiC	GERENTE	0.00	t	2026-02-04 12:12:18.562863	2026-02-10 00:53:00.347177	2026-02-10 00:53:00.347177
fab7efbc-93f0-47ff-b4b7-e05e2450d915	teste	kaykjunior844@gmail.com	$2b$10$vDWvL6bhCPNjt01VL50jRu37vUWYVnancINR5JjpQJ.qDi8P.8bGO	VENDEDOR	2.99	t	2026-02-10 00:53:28.021295	2026-02-10 00:53:32.585504	2026-02-10 00:53:32.585504
\.


--
-- Data for Name: venda_itens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.venda_itens (id, venda_id, produto_id, lote_id, quantidade, valor_unitario, valor_desconto, valor_frete_item, valor_subtotal, cfop, cst_icms, cst_pis, cst_cofins, base_icms, valor_icms, aliq_icms, base_pis, valor_pis, base_cofins, valor_cofins, valor_ipi) FROM stdin;
ef62ebd8-1639-43ef-9c5b-a5b0de0076d3	f62c482a-12d8-4f99-9de7-0659ba0e1828	625a416f-524e-48eb-8f21-8bda47fce6a7	\N	100.000	166.45	125.00	0.00	16520.00	5102	000	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00
df03ad56-bb3e-4e9c-ba3e-c6f15bafa3eb	d60ebc5c-f9f4-43b8-8795-564d58370c7a	625a416f-524e-48eb-8f21-8bda47fce6a7	\N	100.000	166.45	125.00	0.00	16520.00	5102	000	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00
b38626f5-8c7b-43b3-86f5-a8ad828a2343	742bee45-b442-4bed-b9cc-6ff717f89cbc	625a416f-524e-48eb-8f21-8bda47fce6a7	\N	100.000	166.45	125.00	0.00	16520.00	5102	000	\N	\N	0.00	0.00	0.00	0.00	0.00	0.00	0.00	0.00
\.


--
-- Data for Name: vendas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendas (id, numero_pedido, cliente_id, vendedor_id, romaneio_id, status_venda, status, valor_produtos, valor_frete, valor_seguro, valor_desconto, valor_outras_despesas, valor_total, modelo_nf, serie_nf, numero_nf, chave_acesso_nfe, status_sefaz, data_emissao_nfe, xml_autorizado, observacoes_fisco, observacoes_cliente, created_at, updated_at, forma_pagamento_id) FROM stdin;
f62c482a-12d8-4f99-9de7-0659ba0e1828	\N	c756697e-482f-4413-8340-8b2ea5583dae	22d5aaf0-a42b-4d63-a7e8-252a9f5fc650	\N	APROVADO	AGUARDANDO	16520.00	1000.00	0.00	125.00	0.00	17395.00	55	\N	\N	\N	NAO_EMITIDA	\N	\N	\N		2026-02-09 00:00:21.78167	2026-02-09 00:00:21.78167	\N
d60ebc5c-f9f4-43b8-8795-564d58370c7a	\N	c756697e-482f-4413-8340-8b2ea5583dae	22d5aaf0-a42b-4d63-a7e8-252a9f5fc650	\N	APROVADO	AGUARDANDO	16520.00	1000.00	0.00	125.00	0.00	17395.00	55	\N	\N	\N	NAO_EMITIDA	\N	\N	\N		2026-02-09 00:01:24.582365	2026-02-09 00:01:24.582365	\N
742bee45-b442-4bed-b9cc-6ff717f89cbc	\N	c756697e-482f-4413-8340-8b2ea5583dae	22d5aaf0-a42b-4d63-a7e8-252a9f5fc650	\N	APROVADO	AGUARDANDO	16520.00	1000.00	0.00	125.00	0.00	17395.00	55	\N	\N	\N	NAO_EMITIDA	\N	\N	\N		2026-02-09 00:05:25.376522	2026-02-09 00:05:25.376522	\N
\.


--
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 3, true);


--
-- Name: configuracoes_fiscais_cfop_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.configuracoes_fiscais_cfop_id_seq', 1, false);


--
-- Name: formas_pagamento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formas_pagamento_id_seq', 1, true);


--
-- Name: enderecos PK_208b05002dcdf7bfbad378dcac1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT "PK_208b05002dcdf7bfbad378dcac1" PRIMARY KEY (id);


--
-- Name: estoque PK_261e2d9d708b7e0ca5dd8340bc2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT "PK_261e2d9d708b7e0ca5dd8340bc2" PRIMARY KEY (id);


--
-- Name: configuracoes_fiscais_cfop PK_315c1f4ffae1cb775216961c10f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracoes_fiscais_cfop
    ADD CONSTRAINT "PK_315c1f4ffae1cb775216961c10f" PRIMARY KEY (id);


--
-- Name: vendas PK_371c42d415efbac7097bd08b744; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT "PK_371c42d415efbac7097bd08b744" PRIMARY KEY (id);


--
-- Name: categorias PK_3886a26251605c571c6b4f861fe; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY (id);


--
-- Name: entidades PK_4ceb23ee98193c241ee43c95111; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT "PK_4ceb23ee98193c241ee43c95111" PRIMARY KEY (id);


--
-- Name: contas_receber PK_5837d45d5a8b6904175f1e0f56f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT "PK_5837d45d5a8b6904175f1e0f56f" PRIMARY KEY (id);


--
-- Name: formas_pagamento PK_5b5d877a6f1151d30f25084b386; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formas_pagamento
    ADD CONSTRAINT "PK_5b5d877a6f1151d30f25084b386" PRIMARY KEY (id);


--
-- Name: movimentacoes_estoque PK_6051e7ea0b5fe0e0b22f1a56d33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT "PK_6051e7ea0b5fe0e0b22f1a56d33" PRIMARY KEY (id);


--
-- Name: lotes PK_6eda564423c09706b95cbf8ae1c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT "PK_6eda564423c09706b95cbf8ae1c" PRIMARY KEY (id);


--
-- Name: caixa PK_7bda1bc828f2ac8014f060e9719; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caixa
    ADD CONSTRAINT "PK_7bda1bc828f2ac8014f060e9719" PRIMARY KEY (id);


--
-- Name: comissoes PK_84e366b43e8a1cb12958fe8ce0b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes
    ADD CONSTRAINT "PK_84e366b43e8a1cb12958fe8ce0b" PRIMARY KEY (id);


--
-- Name: romaneios PK_8aa06d15f6d8be7c689f1576dac; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.romaneios
    ADD CONSTRAINT "PK_8aa06d15f6d8be7c689f1576dac" PRIMARY KEY (id);


--
-- Name: venda_itens PK_9a2a52944d45db3c3b7a967272a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venda_itens
    ADD CONSTRAINT "PK_9a2a52944d45db3c3b7a967272a" PRIMARY KEY (id);


--
-- Name: produtos PK_a5d976312809192261ed96174f3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "PK_a5d976312809192261ed96174f3" PRIMARY KEY (id);


--
-- Name: usuarios PK_d7281c63c176e152e4c531594a8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY (id);


--
-- Name: produtos UQ_09e0058c56f4309b424c9c59446; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "UQ_09e0058c56f4309b424c9c59446" UNIQUE (codigo_sku);


--
-- Name: usuarios UQ_446adfc18b35418aac32ae0b7b5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE (email);


--
-- Name: produtos UQ_750b0e1ec48b90640360b3df8f7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "UQ_750b0e1ec48b90640360b3df8f7" UNIQUE (nome);


--
-- Name: vendas UQ_7a5866b85f18018c6186e9113b4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT "UQ_7a5866b85f18018c6186e9113b4" UNIQUE (numero_pedido);


--
-- Name: entidades UQ_ac576f8f7350f3b9461feb08aa4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entidades
    ADD CONSTRAINT "UQ_ac576f8f7350f3b9461feb08aa4" UNIQUE (documento);


--
-- Name: idx_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doc ON public.entidades USING btree (documento);


--
-- Name: idx_endereco_entidade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_endereco_entidade ON public.enderecos USING btree (entidade_id);


--
-- Name: idx_nome; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nome ON public.entidades USING btree (nome_razao_social);


--
-- Name: idx_status_venda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_status_venda ON public.vendas USING btree (status_sefaz);


--
-- Name: contas_receber FK_0c9448c1bb6b0cf0b5829715405; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT "FK_0c9448c1bb6b0cf0b5829715405" FOREIGN KEY (cliente_id) REFERENCES public.entidades(id);


--
-- Name: contas_receber FK_164a8d22f7da34ee0649dd1a44d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT "FK_164a8d22f7da34ee0649dd1a44d" FOREIGN KEY (forma_pagamento_id) REFERENCES public.formas_pagamento(id);


--
-- Name: produtos FK_330ac6c492cb0bbcce953f3d9eb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produtos
    ADD CONSTRAINT "FK_330ac6c492cb0bbcce953f3d9eb" FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;


--
-- Name: vendas FK_39226ceb0f962a9cd75d68a76af; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT "FK_39226ceb0f962a9cd75d68a76af" FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- Name: comissoes FK_3dd456b847b10f6564373ffaa10; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes
    ADD CONSTRAINT "FK_3dd456b847b10f6564373ffaa10" FOREIGN KEY (venda_id) REFERENCES public.vendas(id);


--
-- Name: vendas FK_48b446b478c4b5447d82ae34e36; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT "FK_48b446b478c4b5447d82ae34e36" FOREIGN KEY (cliente_id) REFERENCES public.entidades(id);


--
-- Name: lotes FK_552153c50bbdfe6dec36b3ef3c2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT "FK_552153c50bbdfe6dec36b3ef3c2" FOREIGN KEY (produto_id) REFERENCES public.produtos(id);


--
-- Name: estoque FK_57c7d2d00f3c242ed208af94d0c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estoque
    ADD CONSTRAINT "FK_57c7d2d00f3c242ed208af94d0c" FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;


--
-- Name: venda_itens FK_5a870e3886f6deebc14b56bd59a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venda_itens
    ADD CONSTRAINT "FK_5a870e3886f6deebc14b56bd59a" FOREIGN KEY (lote_id) REFERENCES public.lotes(id);


--
-- Name: movimentacoes_estoque FK_62b838983430a7e7ed43896de89; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT "FK_62b838983430a7e7ed43896de89" FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: comissoes FK_6311d03a05257b3a20db3e11b3f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes
    ADD CONSTRAINT "FK_6311d03a05257b3a20db3e11b3f" FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- Name: vendas FK_697803f045daba7b116bf1a4d26; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT "FK_697803f045daba7b116bf1a4d26" FOREIGN KEY (forma_pagamento_id) REFERENCES public.formas_pagamento(id);


--
-- Name: vendas FK_6d56228492c6a9e92d0354d3d34; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT "FK_6d56228492c6a9e92d0354d3d34" FOREIGN KEY (romaneio_id) REFERENCES public.romaneios(id);


--
-- Name: contas_receber FK_812f9b7aba0235f943b262c3702; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT "FK_812f9b7aba0235f943b262c3702" FOREIGN KEY (venda_id) REFERENCES public.vendas(id);


--
-- Name: enderecos FK_8a26266557cff0a45edb6d29ddd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enderecos
    ADD CONSTRAINT "FK_8a26266557cff0a45edb6d29ddd" FOREIGN KEY (entidade_id) REFERENCES public.entidades(id) ON DELETE CASCADE;


--
-- Name: movimentacoes_estoque FK_9b1726c212d91a71738460a0114; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT "FK_9b1726c212d91a71738460a0114" FOREIGN KEY (lote_id) REFERENCES public.lotes(id);


--
-- Name: movimentacoes_estoque FK_b6b311c98669b1b18ed71a19a01; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT "FK_b6b311c98669b1b18ed71a19a01" FOREIGN KEY (venda_item_id) REFERENCES public.venda_itens(id);


--
-- Name: movimentacoes_estoque FK_cbf0295808218b67acd6350f6ee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimentacoes_estoque
    ADD CONSTRAINT "FK_cbf0295808218b67acd6350f6ee" FOREIGN KEY (produto_id) REFERENCES public.produtos(id);


--
-- Name: venda_itens FK_d7bdc4efbccace3f18d02a2a912; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venda_itens
    ADD CONSTRAINT "FK_d7bdc4efbccace3f18d02a2a912" FOREIGN KEY (produto_id) REFERENCES public.produtos(id);


--
-- Name: comissoes FK_eb82bbe8eb1d69e4578f3d81c37; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comissoes
    ADD CONSTRAINT "FK_eb82bbe8eb1d69e4578f3d81c37" FOREIGN KEY (conta_receber_id) REFERENCES public.contas_receber(id);


--
-- Name: venda_itens FK_ec0c7b724c51b5265622506de75; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venda_itens
    ADD CONSTRAINT "FK_ec0c7b724c51b5265622506de75" FOREIGN KEY (venda_id) REFERENCES public.vendas(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict wsJCSOduDSEmJY5uZbWgLoIkqd57PYxDS9snmXXprIlOa2OfnGIXLMn5n8LapZF

