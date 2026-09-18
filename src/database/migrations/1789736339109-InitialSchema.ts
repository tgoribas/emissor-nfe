import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789736339109 implements MigrationInterface {
    name = 'InitialSchema1789736339109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."webhook_logs_evento_enum" AS ENUM('nfe.autorizada', 'nfe.rejeitada', 'nfe.cancelada', 'nfe.evento_registrado')`);
        await queryRunner.query(`CREATE TABLE "webhook_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "nota_fiscal_id" uuid, "url_destino" character varying(500) NOT NULL, "evento" "public"."webhook_logs_evento_enum" NOT NULL, "payload" jsonb NOT NULL, "http_status_code" integer, "resposta_corpo" text, "sucesso" boolean NOT NULL DEFAULT false, "tentativas" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c41f6cdf59cdfe3704807650896" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."certificados_tipo_enum" AS ENUM('A1')`);
        await queryRunner.query(`CREATE TABLE "certificados" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "emitente_id" uuid NOT NULL, "tipo" "public"."certificados_tipo_enum" NOT NULL DEFAULT 'A1', "arquivo_pfx_base64" text NOT NULL, "senha_criptografada" text NOT NULL, "validade_inicio" TIMESTAMP, "validade_fim" TIMESTAMP, "serial_number" character varying(255), "ativo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4068ca4b99a4f02b09ea88e2380" UNIQUE ("emitente_id"), CONSTRAINT "REL_4068ca4b99a4f02b09ea88e238" UNIQUE ("emitente_id"), CONSTRAINT "PK_e9b232ca7a16db08667f021708f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."series_numeracao_tipo_documento_enum" AS ENUM('55', '65')`);
        await queryRunner.query(`CREATE TABLE "series_numeracao" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "emitente_id" uuid NOT NULL, "serie" integer NOT NULL, "tipo_documento" "public"."series_numeracao_tipo_documento_enum" NOT NULL DEFAULT '55', "ultimo_numero" integer NOT NULL DEFAULT '0', "ativo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6810e89e3f51efe32240e054087" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2d5e5c3fe90df03ab2e5b17a35" ON "series_numeracao" ("emitente_id", "serie", "tipo_documento") `);
        await queryRunner.query(`CREATE TYPE "public"."eventos_fiscais_tipo_evento_enum" AS ENUM('110111', '110110', 'INUTILIZACAO', '210200')`);
        await queryRunner.query(`CREATE TABLE "eventos_fiscais" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nota_fiscal_id" uuid NOT NULL, "tipo_evento" "public"."eventos_fiscais_tipo_evento_enum" NOT NULL, "sequencia_evento" integer NOT NULL DEFAULT '1', "descricao" text NOT NULL, "c_stat" character varying(15), "x_motivo" character varying(255), "protocolo_evento" character varying(50), "xml_evento" text, "xml_retorno" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b017c99198e218fe0182d945614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notas_fiscais_status_enum" AS ENUM('RASCUNHO', 'PROCESSANDO', 'AUTORIZADA', 'REJEITADA', 'CANCELADA', 'DENEGADA', 'ERRO_ENVIO')`);
        await queryRunner.query(`CREATE TYPE "public"."notas_fiscais_tipo_emissao_enum" AS ENUM('1', '2', '3', '4', '5', '6', '7', '9')`);
        await queryRunner.query(`CREATE TABLE "notas_fiscais" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "emitente_id" uuid NOT NULL, "referencia_externa" character varying(100), "modelo_documento" character varying(2) NOT NULL DEFAULT '55', "serie" integer NOT NULL, "numero" integer NOT NULL, "chave_acesso" character varying(44), "status" "public"."notas_fiscais_status_enum" NOT NULL DEFAULT 'PROCESSANDO', "tipo_emissao" "public"."notas_fiscais_tipo_emissao_enum" NOT NULL DEFAULT '1', "payload_original" jsonb NOT NULL, "xml_gerado" text, "xml_assinado" text, "xml_protocolado" text, "danfe_pdf_url" character varying(500), "c_stat" character varying(10), "x_motivo" character varying(255), "protocolo_autorizacao" character varying(50), "dh_autorizacao" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7d25291b6c7b0af080fb49e0539" UNIQUE ("chave_acesso"), CONSTRAINT "PK_c7dcf62527c4f388d8494aa5f55" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7d25291b6c7b0af080fb49e053" ON "notas_fiscais" ("chave_acesso") `);
        await queryRunner.query(`CREATE INDEX "IDX_f8570c041fd147e77a2c4f77e9" ON "notas_fiscais" ("tenant_id", "emitente_id") `);
        await queryRunner.query(`CREATE TYPE "public"."emitentes_regime_tributario_enum" AS ENUM('1', '2', '3')`);
        await queryRunner.query(`CREATE TYPE "public"."emitentes_ambiente_sefaz_enum" AS ENUM('1', '2')`);
        await queryRunner.query(`CREATE TABLE "emitentes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "cnpj" character varying(14) NOT NULL, "razao_social" character varying(255) NOT NULL, "nome_fantasia" character varying(255), "inscricao_estadual" character varying(20) NOT NULL, "regime_tributario" "public"."emitentes_regime_tributario_enum" NOT NULL DEFAULT '1', "ambiente_sefaz" "public"."emitentes_ambiente_sefaz_enum" NOT NULL DEFAULT '2', "uf" character varying(2) NOT NULL, "codigo_municipio_ibge" character varying(7) NOT NULL, "logradouro" character varying(255), "numero" character varying(50), "bairro" character varying(100), "cep" character varying(8), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c3d22af5cb05baae74b3daf0d12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d139300b4f53f91a44b810e458" ON "emitentes" ("tenant_id", "cnpj") `);
        await queryRunner.query(`CREATE TYPE "public"."tenants_status_enum" AS ENUM('ATIVO', 'INATIVO', 'BLOQUEADO')`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "email" character varying(150) NOT NULL, "api_key" character varying(255) NOT NULL, "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'ATIVO', "webhook_url" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_155c343439adc83ada6ee3f48be" UNIQUE ("email"), CONSTRAINT "UQ_b72fd6a5bc2b69134a6ae7a558f" UNIQUE ("api_key"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_credencial_enum" AS ENUM('TENANT', 'ADMIN', 'NAO_AUTENTICADA')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid, "credencial" "public"."audit_logs_credencial_enum" NOT NULL DEFAULT 'NAO_AUTENTICADA', "ip" character varying(64) NOT NULL, "metodo" character varying(10) NOT NULL, "rota" character varying(500) NOT NULL, "recurso_tipo" character varying(50), "recurso_id" character varying(100), "documento_hash" character varying(64), "http_status" integer NOT NULL, "sucesso" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7068511bf693cf7c8cf0f5f80a" ON "audit_logs" ("documento_hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_898d14750b88319b89b1ab66cd" ON "audit_logs" ("tenant_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "certificados" ADD CONSTRAINT "FK_4068ca4b99a4f02b09ea88e2380" FOREIGN KEY ("emitente_id") REFERENCES "emitentes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "series_numeracao" ADD CONSTRAINT "FK_8fc970badb05c3d69f25daa0080" FOREIGN KEY ("emitente_id") REFERENCES "emitentes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eventos_fiscais" ADD CONSTRAINT "FK_b7eefa0fca82a15dc6f778fb093" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notas_fiscais" ADD CONSTRAINT "FK_c95bbb5628c93fbf32fb4134b15" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notas_fiscais" ADD CONSTRAINT "FK_8a59682493e21d3a244eac02040" FOREIGN KEY ("emitente_id") REFERENCES "emitentes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "emitentes" ADD CONSTRAINT "FK_2faa3e45f265cc83fa3934b260f" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "emitentes" DROP CONSTRAINT "FK_2faa3e45f265cc83fa3934b260f"`);
        await queryRunner.query(`ALTER TABLE "notas_fiscais" DROP CONSTRAINT "FK_8a59682493e21d3a244eac02040"`);
        await queryRunner.query(`ALTER TABLE "notas_fiscais" DROP CONSTRAINT "FK_c95bbb5628c93fbf32fb4134b15"`);
        await queryRunner.query(`ALTER TABLE "eventos_fiscais" DROP CONSTRAINT "FK_b7eefa0fca82a15dc6f778fb093"`);
        await queryRunner.query(`ALTER TABLE "series_numeracao" DROP CONSTRAINT "FK_8fc970badb05c3d69f25daa0080"`);
        await queryRunner.query(`ALTER TABLE "certificados" DROP CONSTRAINT "FK_4068ca4b99a4f02b09ea88e2380"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_898d14750b88319b89b1ab66cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7068511bf693cf7c8cf0f5f80a"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_credencial_enum"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d139300b4f53f91a44b810e458"`);
        await queryRunner.query(`DROP TABLE "emitentes"`);
        await queryRunner.query(`DROP TYPE "public"."emitentes_ambiente_sefaz_enum"`);
        await queryRunner.query(`DROP TYPE "public"."emitentes_regime_tributario_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f8570c041fd147e77a2c4f77e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d25291b6c7b0af080fb49e053"`);
        await queryRunner.query(`DROP TABLE "notas_fiscais"`);
        await queryRunner.query(`DROP TYPE "public"."notas_fiscais_tipo_emissao_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notas_fiscais_status_enum"`);
        await queryRunner.query(`DROP TABLE "eventos_fiscais"`);
        await queryRunner.query(`DROP TYPE "public"."eventos_fiscais_tipo_evento_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d5e5c3fe90df03ab2e5b17a35"`);
        await queryRunner.query(`DROP TABLE "series_numeracao"`);
        await queryRunner.query(`DROP TYPE "public"."series_numeracao_tipo_documento_enum"`);
        await queryRunner.query(`DROP TABLE "certificados"`);
        await queryRunner.query(`DROP TYPE "public"."certificados_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "webhook_logs"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_logs_evento_enum"`);
    }

}
