import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CertificadoEntity } from './entity/certificado.entity';
import { UploadCertificadoDto } from './dto/upload-certificado.dto';
import * as crypto from 'crypto';

@Injectable()
export class CertificadoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_KEY || 'defaultsecretkeyemissornfe123456')
    .digest();

  constructor(
    @InjectRepository(CertificadoEntity)
    private readonly certificadoRepository: Repository<CertificadoEntity>,
  ) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(hash: string): string {
    const [ivHex, encryptedText] = hash.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async upload(dto: UploadCertificadoDto): Promise<Omit<CertificadoEntity, 'senhaCriptografada' | 'arquivoPfxBase64'>> {
    let pfxBuffer: Buffer;
    try {
      pfxBuffer = Buffer.from(dto.arquivoPfxBase64, 'base64');
    } catch {
      throw new BadRequestException('Arquivo PFX em formato Base64 inválido');
    }

    // 1. Validação Imediata da Senha e Conteúdo do Certificado com node-forge
    const forge = require('node-forge');
    let validadeInicio: Date | null = null;
    let validadeFim: Date | null = null;
    let serialNumber: string | null = null;

    try {
      const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
      const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, dto.senha);

      for (const safeContent of pfx.safeContents) {
        for (const safeBag of safeContent.safeBags) {
          if (safeBag.cert) {
            validadeInicio = new Date(safeBag.cert.validity.notBefore);
            validadeFim = new Date(safeBag.cert.validity.notAfter);
            serialNumber = safeBag.cert.serialNumber;
            break;
          }
        }
      }
    } catch (err) {
      throw new BadRequestException(
        'Senha do certificado digital A1 incorreta ou arquivo PFX inválido. Verifique a senha e tente novamente.',
      );
    }

    let certificado = await this.certificadoRepository.findOne({
      where: { emitenteId: dto.emitenteId },
    });

    const senhaCriptografada = this.encrypt(dto.senha);

    if (certificado) {
      certificado.arquivoPfxBase64 = dto.arquivoPfxBase64;
      certificado.senhaCriptografada = senhaCriptografada;
      certificado.validadeInicio = validadeInicio;
      certificado.validadeFim = validadeFim;
      certificado.serialNumber = serialNumber;
      certificado.ativo = true;
    } else {
      certificado = this.certificadoRepository.create({
        emitenteId: dto.emitenteId,
        arquivoPfxBase64: dto.arquivoPfxBase64,
        senhaCriptografada,
        validadeInicio,
        validadeFim,
        serialNumber,
        ativo: true,
      });
    }

    const saved = await this.certificadoRepository.save(certificado);
    const { senhaCriptografada: _, arquivoPfxBase64: __, ...safeResult } = saved;
    return safeResult as any;
  }

  async getCertificadoDecrypted(emitenteId: string) {
    const cert = await this.certificadoRepository.findOne({
      where: { emitenteId, ativo: true },
    });

    if (!cert) {
      throw new NotFoundException('Certificado digital ativo não encontrado para este emitente');
    }

    return {
      pfxBuffer: Buffer.from(cert.arquivoPfxBase64, 'base64'),
      senha: this.decrypt(cert.senhaCriptografada),
    };
  }

  async getCertificadoPem(emitenteId: string) {
    const cert = await this.certificadoRepository.findOne({
      where: { emitenteId, ativo: true },
    });

    if (!cert) {
      throw new NotFoundException('Certificado digital ativo não encontrado para este emitente');
    }

    const senha = this.decrypt(cert.senhaCriptografada);
    const pfxBuffer = Buffer.from(cert.arquivoPfxBase64, 'base64');
    const forge = require('node-forge');

    try {
      const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
      const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, senha);

      let keyPem = '';
      let certPem = '';

      for (const safeContent of pfx.safeContents) {
        for (const safeBag of safeContent.safeBags) {
          if (safeBag.key && !keyPem) {
            keyPem = forge.pki.privateKeyToPem(safeBag.key);
          }
          if (safeBag.cert && !certPem) {
            certPem = forge.pki.certificateToPem(safeBag.cert);
          }
        }
      }

      return {
        certPem,
        keyPem,
        pfxBuffer,
        senha,
      };
    } catch (err) {
      throw new BadRequestException(
        'Falha ao decodificar certificado A1: Senha inválida ou arquivo corrompido.',
      );
    }
  }

  async findByEmitente(emitenteId: string) {
    const cert = await this.certificadoRepository.findOne({
      where: { emitenteId },
    });

    if (!cert) {
      throw new NotFoundException('Certificado não encontrado');
    }

    const { senhaCriptografada: _, arquivoPfxBase64: __, ...safeResult } = cert;
    return safeResult;
  }
}
