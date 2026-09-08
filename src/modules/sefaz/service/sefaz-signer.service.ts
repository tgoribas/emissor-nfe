import { Injectable, BadRequestException } from '@nestjs/common';
import * as forge from 'node-forge';
import * as crypto from 'crypto';

@Injectable()
export class SefazSignerService {
  /**
   * Assina digitalmente um XML de NF-e ou Evento no padrão XMLDSig / RSA-SHA1 exigido pela SEFAZ
   */
  signXml(xml: string, pfxBuffer: Buffer, passphrase: string): string {
    try {
      // 1. Decodifica o arquivo PKCS#12 (PFX)
      const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
      const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, passphrase);

      // 2. Extrai a Chave Privada e o Certificado X.509
      let privateKeyPem: string | null = null;
      let certBase64: string | null = null;

      for (const safeContent of pfx.safeContents) {
        for (const safeBag of safeContent.safeBags) {
          if (safeBag.key) {
            privateKeyPem = forge.pki.privateKeyToPem(safeBag.key);
          }
          if (safeBag.cert) {
            const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(safeBag.cert)).getBytes();
            certBase64 = Buffer.from(certDer, 'binary').toString('base64');
          }
        }
      }

      if (!privateKeyPem || !certBase64) {
        throw new Error('Não foi possível extrair a chave privada ou o certificado X.509 do PFX.');
      }

      // 3. Localiza a tag que será assinada (<infNFe> ou <infEvento>)
      const tagMatch = xml.match(/<(infNFe|infEvento)\s+Id="([^"]+)"[^>]*>[\s\S]*?<\/\1>/);
      if (!tagMatch) {
        throw new Error('Tag infNFe ou infEvento com atributo Id não encontrada no XML');
      }

      const tagConteudo = tagMatch[0];
      const uriId = tagMatch[2];

      // Canonicalização básica C14N da tag
      const c14nTag = tagConteudo.replace(/\r/g, '');

      // 4. DigestValue (SHA-1 em Base64)
      const hash = crypto.createHash('sha1');
      hash.update(c14nTag, 'utf8');
      const digestValue = hash.digest('base64');

      // 5. Constrói o SignedInfo
      const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#${uriId}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

      // 6. SignatureValue (RSA-SHA1)
      const signer = crypto.createSign('RSA-SHA1');
      signer.update(signedInfo, 'utf8');
      const signatureValue = signer.sign(privateKeyPem, 'base64');

      // 7. Monta o bloco <Signature>
      const signatureXml = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfo}<SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`;

      // 8. Insere a assinatura antes do fechamento da tag pai (</NFe> ou </evento>)
      if (xml.includes('</NFe>')) {
        return xml.replace('</NFe>', `${signatureXml}</NFe>`);
      } else if (xml.includes('</evento>')) {
        return xml.replace('</evento>', `${signatureXml}</evento>`);
      }

      return `${xml}${signatureXml}`;
    } catch (error) {
      throw new BadRequestException(`Erro na assinatura digital do XML: ${error.message}`);
    }
  }
}
