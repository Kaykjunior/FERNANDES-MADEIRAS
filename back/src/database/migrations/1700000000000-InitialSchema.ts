import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Habilitar UUID
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // 2. Criar ENUMS (Postgres usa tipos fortes)
        await queryRunner.query(`
            CREATE TYPE cargo_enum AS ENUM ('ADMIN', 'GERENTE', 'VENDEDOR', 'ESTOQUISTA', 'FINANCEIRO');
            CREATE TYPE acao_log_enum AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'LOGIN');
            CREATE TYPE tipo_entidade_enum AS ENUM ('CLIENTE', 'FORNECEDOR', 'TRANSPORTADORA', 'AMBOS');
            CREATE TYPE tipo_pessoa_enum AS ENUM ('F', 'J');
            CREATE TYPE status_log_enum AS ENUM ('MONTAGEM', 'EM_CONFERENCIA', 'LIBERADO_FATURAMENTO', 'EM_TRANSITO', 'ENTREGUE');
            CREATE TYPE tipo_mov_enum AS ENUM ('COMPRA', 'VENDA', 'AJUSTE_INVENTARIO', 'PERDA', 'PRODUCAO_ENTRADA', 'PRODUCAO_SAIDA');
            CREATE TYPE status_venda_enum AS ENUM ('ORCAMENTO', 'APROVADO', 'EM_SEPARACAO', 'ENVIADO', 'ENTREGUE', 'CANCELADO');
            CREATE TYPE status_pag_enum AS ENUM ('PAGO', 'AGUARDANDO', 'CANCELADO', 'FATURADO');
        `);

        // 3. Tabelas Principais (Adaptadas para PG)
        
        // Usuarios
        await queryRunner.query(`
            CREATE TABLE usuarios (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                cargo cargo_enum NOT NULL,
                comissao_percentual NUMERIC(5,2) DEFAULT 0.00,
                ativo BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMPTZ NULL
            )
        `);

        // Auditoria (JSONB é melhor que JSON)
        await queryRunner.query(`
            CREATE TABLE auditoria_logs (
                id BIGSERIAL PRIMARY KEY,
                tabela_nome VARCHAR(50) NOT NULL,
                registro_id UUID NOT NULL,
                usuario_id UUID REFERENCES usuarios(id),
                acao acao_log_enum NOT NULL,
                dados_antigos JSONB,
                dados_novos JSONB,
                ip_origem VARCHAR(45),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Entidades & Endereços
        await queryRunner.query(`
            CREATE TABLE entidades (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                tipo_entidade tipo_entidade_enum NOT NULL,
                tipo_pessoa tipo_pessoa_enum NOT NULL,
                documento VARCHAR(20) UNIQUE NOT NULL,
                rg_ie VARCHAR(20),
                nome_razao_social VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE enderecos (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                entidade_id UUID NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
                logradouro VARCHAR(255) NOT NULL,
                cidade VARCHAR(100) NOT NULL,
                uf CHAR(2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Produtos
        await queryRunner.query(`
            CREATE TABLE categorias (id SERIAL PRIMARY KEY, nome VARCHAR(100) NOT NULL);
            
            CREATE TABLE produtos (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                categoria_id INT REFERENCES categorias(id),
                nome VARCHAR(255) NOT NULL,
                unidade_comercial VARCHAR(6) NOT NULL,
                m3_unitario NUMERIC(10,4),
                peso_unitario_kg NUMERIC(10,3),
                preco_venda_base NUMERIC(12,2),
                preco_custo_medio NUMERIC(12,2),
                estoque_minimo NUMERIC(12,3) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Estoque & Lotes
        await queryRunner.query(`
            CREATE TABLE lotes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                produto_id UUID NOT NULL REFERENCES produtos(id),
                numero_lote_interno VARCHAR(50),
                quantidade_inicial NUMERIC(12,3) NOT NULL,
                quantidade_atual NUMERIC(12,3) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE movimentacoes_estoque (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                lote_id UUID NOT NULL REFERENCES lotes(id),
                tipo_movimentacao tipo_mov_enum NOT NULL,
                quantidade NUMERIC(12,3) NOT NULL,
                motivo_observacao TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Vendas
        await queryRunner.query(`
            CREATE TABLE romaneios (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                motorista_nome VARCHAR(100),
                status_logistico status_log_enum DEFAULT 'MONTAGEM',
                peso_total_estimado NUMERIC(12,3) DEFAULT 0,
                m3_total_estimado NUMERIC(12,3) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE vendas (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                numero_pedido SERIAL,
                cliente_id UUID NOT NULL REFERENCES entidades(id),
                vendedor_id UUID NOT NULL REFERENCES usuarios(id),
                romaneio_id UUID REFERENCES romaneios(id),
                status_venda status_venda_enum DEFAULT 'ORCAMENTO',
                status status_pag_enum DEFAULT 'AGUARDANDO',
                valor_total NUMERIC(12,2) DEFAULT 0.00,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE venda_itens (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
                produto_id UUID NOT NULL REFERENCES produtos(id),
                lote_id UUID REFERENCES lotes(id),
                quantidade NUMERIC(12,3) NOT NULL,
                valor_unitario NUMERIC(12,2) NOT NULL,
                valor_subtotal NUMERIC(12,2) NOT NULL
            );
        `);

        // 4. VIEWS (Dashboard)
        await queryRunner.query(`
            CREATE OR REPLACE VIEW vw_estoque_consolidado AS
            SELECT 
                p.id AS produto_id,
                p.nome AS produto_nome,
                COALESCE(SUM(l.quantidade_atual), 0) AS total_unidades,
                COALESCE(SUM(l.quantidade_atual * p.m3_unitario), 0) AS total_m3
            FROM produtos p
            LEFT JOIN lotes l ON p.id = l.produto_id
            GROUP BY p.id;
        `);

        // 5. FUNCTIONS & TRIGGERS (A mágica do Postgres)
        
        // Trigger de Baixa de Estoque e Kardex
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION fn_venda_item_insert()
            RETURNS TRIGGER AS $$
            BEGIN
                -- 1. Abate estoque
                UPDATE lotes 
                SET quantidade_atual = quantidade_atual - NEW.quantidade
                WHERE id = NEW.lote_id;

                -- 2. Registra Kardex
                INSERT INTO movimentacoes_estoque (lote_id, tipo_movimentacao, quantidade, motivo_observacao)
                VALUES (NEW.lote_id, 'VENDA', NEW.quantidade, CONCAT('Venda ID: ', NEW.venda_id));
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trg_venda_item_insert
            AFTER INSERT ON venda_itens
            FOR EACH ROW
            EXECUTE FUNCTION fn_venda_item_insert();
        `);

        // Trigger de Romaneio (Atualiza pesos)
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION fn_atualiza_peso_romaneio()
            RETURNS TRIGGER AS $$
            DECLARE 
                v_romaneio_id UUID;
                v_peso NUMERIC;
                v_m3 NUMERIC;
            BEGIN
                SELECT romaneio_id INTO v_romaneio_id FROM vendas WHERE id = NEW.venda_id;
                
                IF v_romaneio_id IS NOT NULL THEN
                    SELECT peso_unitario_kg, m3_unitario INTO v_peso, v_m3 
                    FROM produtos WHERE id = NEW.produto_id;
                    
                    UPDATE romaneios 
                    SET peso_total_estimado = COALESCE(peso_total_estimado, 0) + (v_peso * NEW.quantidade),
                        m3_total_estimado = COALESCE(m3_total_estimado, 0) + (v_m3 * NEW.quantidade)
                    WHERE id = v_romaneio_id;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER tg_atualiza_peso_romaneio
            AFTER INSERT ON venda_itens
            FOR EACH ROW
            EXECUTE FUNCTION fn_atualiza_peso_romaneio();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables logic here...
        await queryRunner.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    }
}