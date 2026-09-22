/**
 * Diagnóstico de certificado A1 contra a SEFAZ (NFeStatusServico4).
 *
 * Uso: SENHA='senha-do-pfx' node scripts/test-sefaz-cert.js [caminho/cert.pfx]
 *
 * Testa três modos de mTLS contra a homologação da SEFAZ-SP:
 *   1. Somente certificado folha (comportamento antigo — reproduzia o 403)
 *   2. Cadeia completa folha + intermediários (comportamento corrigido)
 *   3. PFX direto (referência)
 */
const fs = require('fs');
const https = require('https');
const forge = require('node-forge');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const pfxPath = process.argv[2] || '/Volumes/nvme-macos/Documents/Empresas/Polutec/certificado/cert.pfx';
const senha = process.env.SENHA;

if (!senha) {
  console.error("Defina a senha: SENHA='...' node scripts/test-sefaz-cert.js");
  process.exit(1);
}

const URL_STATUS = 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx';
const XML_CONS = '<consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>2</tpAmb><cUF>35</cUF><xServ>STATUS</xServ></consStatServ>';
const ENVELOPE = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4">${XML_CONS}</nfeDadosMsg></soap12:Body></soap12:Envelope>`;

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });

function extrair(pfxBuffer, senha) {
  const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
  const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, senha);

  let privateKey = null;
  const certificados = [];
  for (const sc of pfx.safeContents) {
    for (const sb of sc.safeBags) {
      if (sb.key && !privateKey) privateKey = sb.key;
      if (sb.cert) certificados.push(sb.cert);
    }
  }
  const folha =
    certificados.find(
      (c) => c.publicKey?.n && privateKey.n && c.publicKey.n.compareTo(privateKey.n) === 0,
    ) || certificados[0];

  return { privateKey, certificados, folha };
}

async function testar(nome, agentOptions) {
  const httpsAgent = new https.Agent({ rejectUnauthorized: false, minVersion: 'TLSv1.2', ...agentOptions });
  try {
    const res = await axios.post(URL_STATUS, ENVELOPE, {
      httpsAgent,
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8; action="http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4"',
      },
      timeout: 30000,
      validateStatus: () => true,
    });
    if (res.status === 200) {
      const data = parser.parse(res.data);
      const ret = data?.Envelope?.Body?.nfeResultMsg?.retConsStatServ
        || data?.Envelope?.Body?.retConsStatServ;
      console.log(`  [${nome}] HTTP 200 — cStat=${ret?.cStat} xMotivo="${ret?.xMotivo}"`);
    } else {
      const corpo = String(res.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120);
      console.log(`  [${nome}] HTTP ${res.status} — ${corpo}`);
    }
  } catch (err) {
    console.log(`  [${nome}] ERRO: ${err.message}`);
  }
}

(async () => {
  const pfxBuffer = fs.readFileSync(pfxPath);
  console.log(`PFX: ${pfxPath} (${pfxBuffer.length} bytes)\n`);

  const { privateKey, certificados, folha } = extrair(pfxBuffer, senha);

  console.log('Certificados no PFX:', certificados.length);
  for (const c of certificados) {
    const cn = c.subject.getField('CN')?.value;
    const marcador = c === folha ? ' <== FOLHA (corresponde à chave privada)' : '';
    console.log(`  - ${cn} | validade até ${c.validity.notAfter.toISOString().slice(0, 10)}${marcador}`);
  }

  const vencido = folha.validity.notAfter < new Date();
  console.log(`\nFolha ${vencido ? 'VENCIDO' : 'dentro da validade'} (expira em ${folha.validity.notAfter.toLocaleDateString('pt-BR')})\n`);

  const keyPem = forge.pki.privateKeyToPem(privateKey);
  const folhaPem = forge.pki.certificateToPem(folha);
  const cadeiaPem = [folha, ...certificados.filter((c) => c !== folha)]
    .map((c) => forge.pki.certificateToPem(c))
    .join('');

  console.log('Testando contra', URL_STATUS, '\n');
  await testar('antigo: só folha   ', { cert: folhaPem, key: keyPem });
  await testar('corrigido: cadeia  ', { cert: cadeiaPem, key: keyPem });
  await testar('referência: pfx    ', { pfx: pfxBuffer, passphrase: senha });
})();
