import executeQuery from '../config/database';
import officegen from 'officegen';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getFormattedDate } from './HelperService';

interface GrantingCompany {
    name: string;
    cnpj: string;
    street: string;
    number: string;
    neighborhood: string;
    zipcode: string;
    city: string;
    state: string;
}

interface GrantingCompanyFromDatabase {
    razaosocial: string;
    cgc: string;
    endereco: string;
    numero: string;
    bairro: string;
    cep: string;
    cidade: string;
    uf: string;
    datacancelamento: Date;
    tipo: string;
}

class GenerateDocxService {
    public async execute(): Promise<string | GrantingCompany[]> {
        const getCompanies = await this.GetCompanies();

        const generateDocsFunction = async () => {
            try {
                for (const company of getCompanies) {
                    await this.CreateDocx(company);
                }
                return 'Finish generating all documents.';
            } catch (error: any) {
                return error.message || 'An error occurred during document generation.';
            }
        };

        return generateDocsFunction();
    }

    private async GetCompanies(): Promise<GrantingCompany[]> {
        const ssql = 'SELECT razaosocial, cgc, endereco, numero, bairro, cidade, uf, cep, datacancelamento, tipo FROM empresas ';
        const filtro = [''];

        return new Promise((resolve, reject) => {
            executeQuery(ssql, filtro, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    const companies: GrantingCompany[] = result.map((e: GrantingCompanyFromDatabase): GrantingCompany | undefined => {
                        if (!e.datacancelamento && (e.tipo?.toLowerCase() === 'cliente' || e.tipo?.toLowerCase() === 'clipy')) {
                            return {
                                name: e.razaosocial ? e.razaosocial : "****",
                                cnpj: e.cgc ? e.cgc : "****",
                                street: e.endereco ? e.endereco : "****",
                                number: e.numero ? e.numero : "****",
                                neighborhood: e.bairro ? e.bairro : "****",
                                zipcode: e.cep ? e.cep : "****",
                                city: e.cidade ? e.cidade : "****",
                                state: e.uf ? e.uf : "****",
                            };
                        } else {
                            return undefined; // Return undefined if the condition is not met
                        }
                    });

                    // Filter out undefined values before resolving
                    resolve(companies.filter(company => company !== undefined) as GrantingCompany[]);
                }
            });
        });
    }


    private async CreateDocx(grantingCompany: GrantingCompany): Promise<any> {

        const beneficiaryCompany = {
            name: process.env.BENEFICIARY_COMPANY,
            shortName: process.env.SHORT_NAME_OF_THE_BENEFICIARY_COMPANY,
            cnpj: process.env.CNPJ_BENEFICIARY_COMPANY,
            city: process.env.BENEFICIARY_COMPANY_CITY,
            state: process.env.BENEFICIARY_COMPANY_STATE,
            address: process.env.BENEFICIARY_COMPANY_ADDRESS,
            number: process.env.BENEFICIARY_COMPANY_NUMBER,
            neighborhood: process.env.BENEFICIARY_COMPANY_NEIGHBORHOOD,
        };

        // Create an empty Word object:
        let docx = officegen({
            type: 'docx',
            orientation: 'portrait',
            pageMargins: { top: 650, left: 650, bottom: 650, right: 650 },
        })

        // Officegen calling this function after finishing to generate the docx document:
        docx.on('finalize', function () { })

        // Officegen calling this function to report errors:
        docx.on('error', function (err: any) { console.log(grantingCompany.name, ' falhou!', err) })

        // Create a new paragraph:
        let pObj = docx.createP({ align: 'center' })
        // We can even add images:

        pObj.addImage(path.join(__dirname, '../assets/logo.png'));

        pObj = docx.createP({ align: 'center' })

        pObj.addText('AUTORIZAÇÃO PARA USO DE DADOS E MARCA',
            { font_face: 'Arial', font_size: 14, align: 'center', bold: true })

        pObj = docx.createP({ align: 'justify' })
        pObj.addText(`A presente Autorização para Uso de Dados e Marca (doravante denominado “AUTORIZAÇÃO”) é celebrado, em ${getFormattedDate()} (a “Data de Assinatura”).`,
            { font_size: 12 })

        pObj = docx.createP({ align: 'justify' })

        pObj.addText(`${grantingCompany.name}, pessoa jurídica de direito privado, com sede na cidade de ${grantingCompany.city}, Estado de ${grantingCompany.state}, com sede em ${grantingCompany.street}, ${grantingCompany.number}, ${grantingCompany.neighborhood}, ${grantingCompany.zipcode}, inscrita no CNPJ/ME sob o nº ${grantingCompany.cnpj}, neste ato representada por seu representante legal abaixo assinado (doravante denominada “CONCEDENTE”), concede neste ato, à ${beneficiaryCompany.name}, sociedade empresária limitada inscrita no CNPJ/ME sob nº ${beneficiaryCompany.cnpj}, situada no Município de ${beneficiaryCompany.city}, Estado do ${beneficiaryCompany.state}, na Av. República Argentina, 3370, 2º Andar, Sala 09, Jardim Panorama (“Megabit) uma autorização de uso e reprodução de seus dados, tais como denominação, nome fantasia, endereço, telefone, e-mail para contato, e logomarca protegidos pelas normas de Propriedade Intelectual e Proteção de Dados vigentes no Brasil para fins exclusivos de divulgação no web site da ${beneficiaryCompany.shortName}`,
            { font_size: 12 })
        pObj = docx.createP({ align: 'justify' })

        pObj.addText(`A CONCEDENTE ressalva que a ${beneficiaryCompany.shortName} somente poderá ceder, transferir ou sublicenciar a terceiros a autorização de uso de dados de logomarca da titularidade da CONCEDENTE, com a expressa anuência da CONCEDENTE.`,
            { font_size: 12 })
        pObj = docx.createP({ align: 'justify' })

        pObj.addText(`A presente Autorização é celebrada a título gratuito, não incidindo à CONCEDENTE ou a ${beneficiaryCompany.shortName} quaisquer ônus, custos, repasses orçamentários ou dispêndio pecuniário, a qualquer título, bem como não implica a cessão ou transferência de quaisquer direitos de propriedade intelectual da CONCEDENTE à ${beneficiaryCompany.shortName}.`,
            { font_size: 12 })
        pObj = docx.createP({ align: 'justify' })

        pObj.addText(`A ${beneficiaryCompany.shortName} não detém participação societária na CONCEDENTE e, da mesma forma, a CONCEDENTE não detém participação societária na ${beneficiaryCompany.shortName}, de forma que esta Autorização não institui sociedade empresária ou qualquer vínculo societário similar entre CONCEDENTE e ${beneficiaryCompany.shortName}. A CONCEDENTE não é representante legal ou agente da ${beneficiaryCompany.shortName} e, da mesma forma, a ${beneficiaryCompany.shortName} também não é representante legal ou agente da CONCEDENTE e, portanto, estas não poderão assumir ou criar qualquer espécie adicional de obrigação, representação, garantia ou fiança, expressa ou implícita, em nome da outra.`,
            { font_size: 12 })
        pObj = docx.createP({ align: 'justify' })

        pObj.addText(`A presente Autorização entra em vigor a partir da sua Data de Assinatura e vigorará por prazo indeterminado. A CONCEDENTE poderá revogar esta Autorização, a qualquer momento, e de pleno direito independentemente de interpelação judicial ou extrajudicial, mediante aviso prévio por escrito de 30 (trinta) dias de antecedência à ${beneficiaryCompany.shortName}, independentemente do motivo.`,
            { font_size: 12 })
        pObj = docx.createP({ align: 'justify' })

        pObj.addText(`Dados autorizados pela CONCEDENTE para divulgação: `)
        pObj.addText(`Logo Marca (a ser disponibilizada em formato adequado)`)
        pObj.addText(`Nome Comercial ou Fantasia da CONCEDENTE: (Indicar o nome da forma que a CONCEDEDENTE deseja sua divulgação)`)
        pObj.addText(`Endereço completo: (Logradouro, número, bairro, cidade e estado)`)
        pObj.addText(`Telefone de contato: (DDD + número)`)
        pObj.addText(`e-mail de contato: (e-mail)`)

        pObj = docx.createP({ align: 'justify' })
        pObj.addText(`Esta Autorização é celebrada, regida e interpretada de acordo com as leis da República Federativa do Brasil.`)
        pObj.addText(``)
        pObj.addText(``)

        pObj = docx.createP({ align: 'center' })
        pObj.addText(`___________________________________________________________`)
        pObj.addLineBreak()
        pObj.addText(`${grantingCompany.name}`)
        pObj = docx.createP({ align: 'center' })
        pObj.addText(`Nome:_________________________________________`, { font_size: 8 })
        pObj = docx.createP({ align: 'center' })
        pObj.addText(`Cargo:_________________________________________`, { font_size: 8 })


        // Let's generate the Word document into a file:
        const safeCompanyName = grantingCompany.name.replace(/[\\/:"*?<>|]/g, '-'); // Substituir caracteres inválidos por hífen
        const outputFileName = path.join(__dirname, `../../output/${safeCompanyName}.docx`);
        let out = fs.createWriteStream(outputFileName);

        out.on('error', function (err) {
            console.log('OUT ', grantingCompany.name, err)
        })

        // Async call to generate the output file:
        return docx.generate(out)
    }
}

export default GenerateDocxService;
