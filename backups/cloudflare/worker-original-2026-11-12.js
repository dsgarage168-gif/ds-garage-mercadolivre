// ============================================================
// DS Garage — Mercado Livre / Cloudflare Worker
// Consulta somente highlights PRODUCT.
// ============================================================

const ML_API_URL = "https://api.mercadolibre.com";
const ML_SITE_ID = "MLB";
const AFFILIATE_URL = "https://ds-garage-scraper.onrender.com/teste-afiliado";
const WAPI_URL = "https://api.w-api.app/v1/message/send-image";

const CONTROL_KEY = "controle:mercadolivre:v3";
const TOKEN_KEY = "mercadolivre";

const HISTORY_LIMIT = 500;
const CATEGORY_COUNT = 10;
const PRODUCTS_PER_CATEGORY = 12;
const ITEMS_PER_PRODUCT = 5;

const COOLDOWN_MS = 4 * 60 * 60 * 1000;
const HISTORICO_PRODUTO_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_DISCOUNT = 3;
const MAX_PRICE_WITHOUT_DISCOUNT = 500;

const COOLDOWN_TIPOS = {
  carregador_bateria: 6 * 60 * 60 * 1000,
  compressor_ar: 6 * 60 * 60 * 1000,
  kit_polidor: 6 * 60 * 60 * 1000,
  pneu: 6 * 60 * 60 * 1000,
  modulo: 6 * 60 * 60 * 1000,
  câmera_de_re: 6 * 60 * 60 * 1000,
};

function obterTipoProduto(nome) {
  const t = normalizar(nome);

  if (
    /\bcarregador\b.{0,50}\bbateria\b/.test(t) ||
    /\bbateria\b.{0,20}\bcarregador\b/.test(t)
  ) {
    return "carregador_bateria";
  }

  if (
    /\bcompressor\b.{0,30}\bar\b/.test(t) ||
    /\bcompressor de ar\b/.test(t)
  ) {
    return "compressor_ar";
  }

  if (
    /\bkit\b.{0,30}\bpolidor\b/.test(t) ||
    /\bpolidor\b.{0,30}\bkit\b/.test(t)
  ) {
    return "kit_polidor";
  }

  if (/\bpneu\b/.test(t)) {
    return "pneu";
  }

  if (/\bmodulo\b/.test(t)) {
    return "modulo";
  }

  return null;
}

// ============================================================
// CATEGORIAS
// ============================================================

const CATEGORIES = [
  ["MLB1747", "Acessórios de Carros e Caminhonetes"],
  ["MLB2227", "Ferramentas para Veículos"],
  ["MLB188063", "Limpeza Automotiva"],
  ["MLB456111", "Lubrificantes e Fluidos"],
  ["MLB260634", "Performance"],
  ["MLB2238", "Pneus e Acessórios"],
  ["MLB255788", "Rodas"],
  ["MLB2239", "Segurança Veicular"],
  ["MLB3381", "Som Automotivo"],
  ["MLB1776", "Tuning"],
].map(([id, nome]) => ({
  id,
  nome,
}));

// ============================================================
// MARCAS PREFERIDAS
// ============================================================

const MARCAS_PREFERIDAS = {

  som_automotivo: [
    "jbl",
    "pioneer",
    "taramps",
    "bravox",
    "bomber",
    "hinor",
    "hurricane",
    "roadstar",
    "stetsom",
    "selenium",
    "corzus",
    "alpine",
    "kenwood",
    "sony",
  ],

  polimento: [
    "vonixx",
    "meguiars",
    "mothers",
    "3m",
    "wurth",
    "protelim",
    "easytech",
    "nobrecar",
    "finisher",
    "soft99",
    "sonax",
    "autoshine",
    "turtle wax",
    "chemical guys",
    "menzerna",
    "koch chemie",
    "carpro",
    "gyeon",
  ],

  pneus_rodas: [
    "michelin",
    "bridgestone",
    "firestone",
    "goodyear",
    "pirelli",
    "continental",
    "dunlop",
    "yokohama",
    "hankook",
    "kumho",
    "falken",
    "bf goodrich",
    "toyo",
    "sumitomo",
  ],

  ferramentas: [
    "bosch",
    "makita",
    "dewalt",
    "milwaukee",
    "stanley",
    "vonder",
    "tramontina",
    "gedore",
    "gedore red",
    "belzer",
    "sata",
    "king tony",
    "ingco",
    "worker",
    "fortg",
    "motomil",
    "schulz",
    "black+decker",
    "skil",
    "wera",
    "irwin",
  ],

  iluminacao: [
    "philips",
    "osram",
    "bosch",
    "hella",
    "arteb",
    "tyc",
    "depo",
    "magneti marelli",
    "marelli",
    "autopoli",
    "techone",
  ],

  lubrificantes: [
    "motul",
    "mobil",
    "shell",
    "castrol",
    "lubrax",
    "ipiranga",
    "petronas",
    "elf",
    "total",
    "valvoline",
    "bardahl",
  ],

  performance: [
    "fueltech",
    "pandoo",
    "spa turbo",
    "master power",
    "garrett",
    "borgwarner",
    "holset",
    "k&n",
    "injen",
    "aem",
    "hks",
    "greddy",
    "blitz",
    "apexi",
    "forge",
    "ngk",
    "bosch",
    "denso",
  ],

  automotivo_geral: [
    "bosch",
    "3m",
    "wurth",
    "magneti marelli",
    "marelli",
    "ngk",
    "denso",
    "valeo",
    "nakata",
    "cofap",
    "monroe",
    "trw",
    "moura",
    "heliar",
    "positron",
    "taramps",
    "vonixx",
    "jbl",
    "pioneer",
    "goodyear",
    "michelin",
    "pirelli",
    "continental",
  ],

};

// ============================================================
// TERMOS AUTOMOTIVOS
// ============================================================

const AUTOMOTIVE_TERMS = [
  // Veículos
  "automot",
  "carro",
  "carros",
  "veiculo",
  "veiculos",
  "caminhonete",
  "pickup",
  "pick up",
  "suv",
  "sedan",
  "hatch",
  "van",
  "utilitario",
  "quadriciclo",
  "utv",
  "atv",

  // Marcas automotivas
  "volkswagen",
  "vw",
  "chevrolet",
  "gm",
  "fiat",
  "ford",
  "toyota",
  "lexus",
  "honda",
  "acura",
  "nissan",
  "infiniti",
  "hyundai",
  "genesis",
  "kia",
  "renault",
  "dacia",
  "peugeot",
  "citroen",
  "mitsubishi",
  "suzuki",
  "subaru",
  "mazda",
  "jeep",
  "ram",
  "dodge",
  "chrysler",
  "bmw",
  "mini",
  "mercedes",
  "mercedes benz",
  "mercedes-benz",
  "audi",
  "porsche",
  "volvo",
  "land rover",
  "range rover",
  "jaguar",
  "alfa romeo",
  "ferrari",
  "lamborghini",
  "maserati",
  "aston martin",
  "bentley",
  "rolls royce",
  "rolls-royce",
  "tesla",
  "byd",
  "gwm",
  "haval",
  "ora",
  "chery",
  "caoa chery",
  "jac",
  "jac motors",
  "lifan",
  "geely",
  "changan",
  "great wall",
  "troller",
  "agrale",
  "iveco",
  "man",
  "scania",
  "volvo trucks",
  "daf",
  "mercedes-benz trucks",

  // Acessórios externos
  "acessorio automotivo",
  "acessorios automotivos",
  "acessorio carro",
  "acessorios carro",
  "friso",
  "moldura",
  "emblema",
  "protetor",
  "capa banco",
  "capa volante",
  "tapete",
  "tapetes",
  "porta objetos",
  "organizador carro",
  "bagageiro",
  "rack",
  "engate",
  "reboque",

  // Interior
  "volante",
  "banco",
  "encosto",
  "console",
  "painel",
  "manopla",
  "coifa",
  "pedaleira",
  "tapete automotivo",
  "forro",
  "carpete automotivo",

  // Iluminação
  "lampada",
  "farol",
  "lanterna",
  "led",
  "xenon",
  "milha",
  "luz diurna",
  "drl",
  "barra led",
  "strobo automotivo",

  // Elétrica / eletrônica
  "bateria",
  "alternador",
  "motor de partida",
  "motor partida",
  "fusivel",
  "rele",
  "chicote",
  "conector automotivo",
  "sensor",
  "modulo",
  "central",
  "ecu",
  "injecao",
  "ignicao",
  "bobina",
  "vela",
  "scanner",
  "obd",
  "rastreador",

  // Som / multimídia
  "multimidia",
  "radio automotivo",
  "som automotivo",
  "alto falante",
  "alto-falante",
  "subwoofer",
  "amplificador",
  "woofer",
  "tweeter",
  "central multimidia",

  // Mecânica
  "freio",
  "pastilha",
  "disco de freio",
  "tambor",
  "amortecedor",
  "suspensao",
  "mola",
  "embreagem",
  "cambio",
  "diferencial",
  "homocinetica",
  "semi eixo",
  "semieixo",
  "rolamento",
  "bucha",
  "coxim",
  "terminal",
  "pivo",
  "correia",
  "tensor",
  "radiador",
  "ventoinha",
  "bomba d agua",
  "bomba dagua",
  "bomba hidráulica",
  "valvula",

  // Motor
  "motor",
  "motor automotivo",
  "filtro",
  "filtro de ar",
  "filtro oleo",
  "filtro combustivel",
  "oleo",
  "lubrificante",
  "aditivo",
  "fluido",
  "fluido de freio",
  "arrefecimento",
  "vela ignicao",
  "injecao eletronica",

  // Performance / preparação
  "turbo",
  "turbina",
  "intercooler",
  "downpipe",
  "intake",
  "admissao",
  "escapamento",
  "escape",
  "coletor",
  "remap",
  "chip tuning",
  "performance",
  "preparacao",
  "wastegate",
  "blow off",

  // Pneus e rodas
  "pneu",
  "pneus",
  "roda",
  "rodas",
  "calota",
  "valvula pneu",
  "macaco",
  "chave roda",
  "estepe",

  // Ferramentas / oficina
  "ferramenta",
  "ferramentas",
  "oficina",
  "torno",
  "furadeira",
  "parafusadeira",
  "chave",
  "alicate",
  "soquete",
  "catraca",
  "extrator",
  "compressor",
  "elevador automotivo",
  "scanner automotivo",
  "maleta ferramentas",
  "kit ferramentas",

  // Estética / detailing
  "detailing",
  "polimento",
  "politriz",
  "cera",
  "coating",
  "selante",
  "desengraxante",
  "lavagem",
  "limpeza automotiva",
  "shampoo automotivo",
  "higienizador",
  "limpa pneu",
  "pretinho",
  "restaurador",
  "microfibra",
  "boina",
  "massa polir",
  "panos de microfibra",

  // Segurança
  "camera",
  "camera de re",
  "sensor estacionamento",
  "sensor de estacionamento",
  "alarme automotivo",
  "trava eletrica",
  "fechadura automotiva",
  "airbag",
  "cinto seguranca",

  // Peças / componentes automotivos
  "peca carro",
  "pecas carro",
  "peca veiculo",
  "pecas veiculo",
  "autopeca",
  "autopecas",
  "reposicao automotiva",
  "reposicao veicular",
  "bomba combustivel",
  "bomba de combustivel",
  "bomba de agua",
  "bomba oleo",
  "valvula termostatica",
  "termostatica",
  "carcaca valvula",
  "junta",
  "junta motor",
  "junta cabecote",
  "jogo juntas",
  "jogo de juntas",
  "retentor",
  "retentor motor",
  "retentor virabrequim",
  "correia dentada",
  "correia auxiliar",
  "correia alternador",
  "correia poly v",
  "tensor correia",
  "kit correia dentada",
  "kit correia",
  "vela automotiva",
  "vela de ignicao",
  "bobina ignicao",
  "cabo de vela",
  "cabos de vela",
  "tampa distribuidor",
  "rotor distribuidor",
  "distribuidor ignicao",
  "embreagem automotiva",
  "kit embreagem",
  "plato embreagem",
  "disco embreagem",
  "rolamento embreagem",
  "cilindro mestre",
  "cilindro roda",
  "servo freio",
  "servo-freio",
  "pinca freio",
  "reparo pinca",
  "reparo freio",
  "flexivel freio",
  "amortecedor automotivo",
  "kit amortecedor",
  "batente amortecedor",
  "coifa amortecedor",
  "mola automotiva",
  "mola suspensao",
  "bandeja suspensao",
  "pivo suspensao",
  "terminal direcao",
  "barra direcao",
  "bieleta",
  "bucha suspensao",
  "coxim motor",
  "coxim cambio",
  "junta homocinetica",
  "trizeta",
  "tulipa homocinetica",
  "eixo homocinetico",
  "rolamento roda",
  "rolamento de roda",
  "cubo roda",
  "cubo de roda",
  "cubo de roda automotivo",

  // Ferramentas / oficina
  "chave de boca",
  "chave combinada",
  "chave estrela",
  "chave fixa",
  "chave allen",
  "chave torx",
  "chave philips",
  "chave fenda",
  "chave soquete",
  "jogo de soquetes",
  "jogo soquete",
  "jogo de chaves",
  "kit chaves",
  "kit de chaves",
  "catraca manual",
  "catraca profissional",
  "catraca soquete",
  "extensao soquete",
  "adaptador soquete",
  "junta universal soquete",
  "alicate universal",
  "alicate pressao",
  "alicate de pressao",
  "alicate corte",
  "alicate bico",
  "alicate bico fino",
  "alicate amperimetro",
  "torquimetro",
  "chave torque",
  "chave de torque",
  "extrator rolamento",
  "extrator polia",
  "extrator engrenagem",
  "extrator terminal",
  "extrator saca polia",
  "saca polia",
  "saca terminal",
  "saca rolamento",
  "prensa hidraulica",
  "macaco hidraulico",
  "macaco jacare",
  "cavalete mecanico",
  "cavalete para carro",
  "rampa automotiva",
  "compressor de ar",
  "compressor ar",
  "pistola pneumatica",
  "chave de impacto",
  "parafusadeira impacto",
  "furadeira impacto",
  "esmerilhadeira",
  "retifica",
  "serra eletrica",
  "morsa",
  "morsa bancada",
  "morsa de bancada",
  "bancada oficina",
  "carrinho ferramentas",
  "carrinho de ferramentas",
  "armario ferramentas",
  "painel ferramentas",
  "organizador ferramentas",
  "maleta ferramentas",
  "maleta de ferramentas",
  "jogo ferramentas",
  "jogo de ferramentas",
  "kit ferramentas automotivas",
  "kit ferramentas automotivo",
  "ferramentas automotivas",
  "ferramentas automotivas profissional",

  // Diagnóstico / elétrica automotiva
  "scanner obd",
  "scanner obd2",
  "scanner obd2 automotivo",
  "scanner automotivo profissional",
  "diagnostico automotivo",
  "leitor obd",
  "leitor obd2",
  "interface obd",
  "interface obd2",
  "programador ecu",
  "programador automotivo",
  "testador bateria",
  "testador de bateria",
  "carregador bateria automotiva",
  "carregador de bateria automotiva",
  "auxiliar partida",
  "auxiliar de partida",
  "chupeta bateria",
  "multimetro automotivo",
  "caneta teste automotiva",
  "teste circuito automotivo",
  "fusivel automotivo",
  "caixa fusivel",
  "rele automotivo",
  "porta fusivel",
  "chicote eletrico automotivo",
  "conector automotivo",

  // Acessórios automotivos
  "suporte celular carro",
  "suporte celular automotivo",
  "suporte veicular",
  "suporte para carro",
  "suporte painel carro",
  "suporte retrovisor carro",
  "organizador automotivo",
  "organizador para carro",
  "organizador porta malas",
  "organizador porta-malas",
  "organizador banco carro",
  "protetor porta malas",
  "protetor porta-malas",
  "protetor banco automotivo",
  "protetor banco carro",
  "protetor soleira",
  "protetor parachoque",
  "protetor para-choque",
  "protetor porta carro",
  "capa automotiva",
  "capa para carro",
  "capa banco automotivo",
  "capa volante automotivo",
  "capa volante carro",
  "pelicula automotiva",
  "pelicula vidro carro",
  "insulfilm",
  "friso automotivo",
  "moldura automotiva",
  "emblema automotivo",
  "emblema carro",
  "logo automotivo",
  "logo carro",
  "antena automotiva",
  "antena carro",
  "engate reboque",
  "engate de reboque",
  "bola engate",
  "tomada engate",

  // Iluminação automotiva
  "farol led",
  "farol auxiliar",
  "farol de milha",
  "farol neblina",
  "kit farol",
  "kit iluminacao automotiva",
  "lanterna led",
  "lanterna traseira",
  "lanterna dianteira",
  "lanterna automotiva",
  "luz placa",
  "luz interna carro",
  "luz teto carro",
  "luz porta carro",
  "lampada automotiva",
  "lampada carro",
  "lampada farol",
  "led automotivo",
  "led automotivo carro",
  "barra led automotiva",

  // Detailing / estética
  "kit limpeza automotiva",
  "kit limpeza carro",
  "kit lavagem automotiva",
  "kit lavagem carro",
  "kit detalhamento automotivo",
  "limpa painel automotivo",
  "limpa vidros automotivo",
  "limpa vidro automotivo",
  "limpa estofado automotivo",
  "limpa banco automotivo",
  "limpa couro automotivo",
  "hidratante couro automotivo",
  "renovador plastico automotivo",
  "restaurador plastico automotivo",
  "pretinho automotivo",
  "limpa pneu automotivo",
  "espuma limpeza automotiva",
  "espuma snow foam",
  "snow foam automotivo",
  "canhao espuma",
  "pulverizador automotivo",
  "pulverizador pressao",
  "extratora automotiva",
  "aspirador automotivo",
  "aspirador carro",

  // Performance / preparação
  "kit turbo",
  "turbo automotivo",
  "turbocompressor",
  "turbo compressor",
  "valvula blow off",
  "valvula wastegate",
  "intercooler automotivo",
  "filtro esportivo",
  "filtro esportivo automotivo",
  "filtro inbox",
  "filtro inbox automotivo",
  "filtro alto fluxo",
  "filtro alto fluxo automotivo",
  "escape esportivo",
  "escapamento esportivo",
  "escapamento automotivo",
  "coletor escape",
  "coletor admissao",
  "downpipe automotivo",
  "intake automotivo",
  "kit admissao",
  "remap automotivo",
  "chip performance",
  "chip de potencia",

  // Eletrônicos automotivos
  "multimidia automotiva",
  "central multimidia automotiva",
  "radio automotivo",
  "radio bluetooth automotivo",
  "camera re",
  "camera traseira carro",
  "camera estacionamento",
  "sensor re",
  "sensor de re",
  "sensor estacionamento automotivo",
  "alarme carro",
  "alarme automotivo",
  "trava eletrica carro",
  "modulo vidro eletrico",
  "vidro eletrico",
  "gps automotivo",
  "rastreador veicular",
  "rastreador automotivo",

  // Outros
  "peca automotiva",
  "pecas automotivas",
  "autopeca",
  "autopecas",
  "reposicao",
  "original",
  "oem",
  "automotivo",
];

// ============================================================
// TERMOS BLOQUEADOS
// ============================================================

const BLOCKED_TERMS = [

  // ROUPAS E MODA
  "camiseta",
  "camisa",
  "blusa",
  "blusao",
  "regata",
  "top",
  "cropped",
  "vestido",
  "saia",
  "short",
  "shorts",
  "bermuda",
  "calca",
  "jeans",
  "legging",
  "moletom",
  "casaco",
  "jaqueta",
  "sobretudo",
  "roupao",
  "pijama",
  "cueca",
  "calcinha",
  "sutia",
  "lingerie",
  "meia",
  "biquini",
  "maio",
  "uniforme escolar",
  "fantasia",
  "gravata",
  "terno",
  "paleto",

  // CALÇADOS
  "tenis",
  "sapato",
  "sandalia",
  "chinelo",
  "bota",
  "botina",
  "sapatilha",
  "tamanco",
  "rasteirinha",
  "chuteira",

  // ACESSÓRIOS DE MODA
  "bolsa",
  "bolsinha",
  "mochila",
  "carteira",
  "necessaire",
  "pochete",
  "maleta de maquiagem",
  "oculos de sol",
  "oculos feminino",
  "oculos masculino",

  // BELEZA E COSMÉTICOS
  "maquiagem",
  "batom",
  "base facial",
  "corretivo facial",
  "blush",
  "rimel",
  "delineador",
  "sombra",
  "esmalte",
  "perfume",
  "perfume feminino",
  "perfume masculino",
  "colonia",
  "desodorante",
  "shampoo",
  "xampu",
  "condicionador",
  "hidratante corporal",
  "creme facial",
  "protetor solar",
  "skincare",
  "cosmetico",
  "depilador",
  "depilacao",
  "secador de cabelo",
  "chapinha",
  "modelador de cabelo",
  "babyliss",
  "barbeador",

  // CASA E MÓVEIS
  "sofa",
  "poltrona",
  "cama",
  "colchao",
  "berco",
  "guarda roupa",
  "guarda-roupa",
  "armario",
  "comoda",
  "criado mudo",
  "mesa de jantar",
  "mesa de escritorio",
  "cadeira gamer",
  "cadeira de escritorio",
  "estante",
  "painel de tv",
  "tv",
  "televisao",
  "cortina",
  "tapete",
  "almofada",
  "travesseiro",
  "lencol",
  "cobertor",
  "edredom",
  "toalha",

  // COZINHA
  "panela",
  "frigideira",
  "assadeira",
  "forma de bolo",
  "liquidificador",
  "batedeira",
  "air fryer",
  "airfryer",
  "cafeteira",
  "chaleira",
  "torradeira",
  "sandwicheira",
  "microondas",
  "micro-ondas",
  "forno eletrico",
  "fogao",
  "cooktop",
  "talher",
  "prato",
  "copo",
  "taca",
  "xicara",
  "pote hermetico",

  // ELETRÔNICOS / INFORMÁTICA
  "notebook",
  "laptop",
  "computador",
  "desktop",
  "monitor gamer",
  "monitor ultrawide",
  "teclado gamer",
  "mouse gamer",
  "mousepad",
  "webcam",
  "impressora",
  "scanner",
  "iphone",
  "ipad",
  "celular",
  "smartphone",
  "tablet",
  "smartwatch",
  "relogio inteligente",
  "console",
  "playstation",
  "xbox",
  "nintendo",
  "videogame",
  "video game",
  "drone",
  "camera fotografica",
  "camera profissional",

  // ÁUDIO NÃO AUTOMOTIVO
  "fone bluetooth",
  "fone de ouvido",
  "headset gamer",
  "caixa de som bluetooth",
  "caixa bluetooth",
  "soundbar",
  "home theater",
  "microfone gamer",
  "microfone condensador",
  "karaoke",

  // BRINQUEDOS / INFANTIL
  "brinquedo",
  "boneca",
  "boneco",
  "lego",
  "quebra cabeca",
  "quebra-cabeca",
  "massinha",
  "carrinho infantil",
  "controle remoto infantil",
  "ursinho",
  "pelucia",
  "fralda",
  "mamadeira",
  "chupeta",
  "berco infantil",
  "cadeira infantil",
  "carrinho de bebe",

  // ESPORTES
  "bicicleta eletrica",
  "bicicleta elétrica",
  "skate",
  "patins",
  "patinete",
  "bola de futebol",
  "bola de basquete",
  "bola de volei",
  "chuteira",
  "raquete",
  "taco de sinuca",
  "prancha de surf",
  "surf",
  "equipamento de academia",
  "halter",
  "halteres",
  "anilha",
  "barra de academia",
  "esteira ergometrica",
  "whey",
  "whey protein",
  "creatina",
  "bcaa",
  "pre treino",
  "suplemento",
  "vitamina",
  "capacete",

  // PET
  "racao",
  "petisco para cachorro",
  "petisco para gato",
  "cachorro",
  "gato",
  "gaiola",
  "aquario",
  "areia para gato",
  "brinquedo para cachorro",
  "brinquedo para gato",
  "coleira para cachorro",
  "coleira para gato",

  // PAPELARIA / LIVROS
  "livro",
  "apostila",
  "caderno",
  "agenda",
  "caneta",
  "lapis",
  "borracha",
  "mochila escolar",
  "estojo",
  "material escolar",
  "papelaria",
  "chaveiro",

  // JOIAS
  "joia",
  "joias",
  "anel",
  "alianca",
  "brinco",
  "colar",
  "pulseira",
  "corrente",
  "pingente",
  "piercing",

  // DECORAÇÃO
  "decoracao",
  "quadro decorativo",
  "vaso decorativo",
  "vela decorativa",
  "porta retrato",
  "porta-retrato",
  "enfeite",
  "ornamento",

  // EPI / SEGURANÇA NÃO AUTOMOTIVA
  "colete",
  "colete refletivo",
  "colete reflexivo",
  "colete de seguranca",
  "blusao refletivo",
  "capacete de obra",
  "capacete de seguranca",
  "capacete de moto cross",
  "luva de seguranca",
  "luva nitrilica",
  "luva descartavel",
  "oculos de protecao",
  "protetor auricular",
  "abafador de ruido",
  "epi",

  // JARDINAGEM / AGRICULTURA
  "vaso de planta",
  "semente",
  "fertilizante",
  "adubo",
  "herbicida",
  "inseticida",
  "fungicida",
  "mangueira de jardim",
  "regador",
  "tesoura de poda",
  "rocadeira",
  "cortador de grama",
  "cortador de relva",

  // CONSTRUÇÃO / CASA
  "cimento",
  "tijolo",
  "telha",
  "argamassa",
  "rejunte",
  "tinta de parede",
  "massa corrida",
  "gesso",
  "torneira",
  "chuveiro",
  "vaso sanitario",
  "pia",
  "tanque",
  "ralo",
  "interruptor residencial",
  "tomada residencial",

  // ALIMENTOS / BEBIDAS
  "chocolate",
  "biscoito",
  "bolacha",
  "cafe",
  "cha",
  "refrigerante",
  "suco",
  "cerveja",
  "vinho",
  "bebida",
  "alimento",
  "comida",
  "pop 100",
  "galinha",

  // OUTROS
  "futebol",
  "loteria",
  "jogo de azar",
  "maquina de costura",
  "instrumento musical",
  "violao",
  "guitarra",
  "teclado musical",
  "piano",
];

// ============================================================
// UTILITÁRIOS
// ============================================================

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatarPreco(valor) {
  const numero = Number(valor);

  return Number.isFinite(numero) && numero > 0
    ? numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : "";
}

function erroLimitado(diagnostico, entrada) {
  if (diagnostico.erros.length < 20) {
    diagnostico.erros.push(entrada);
  }
}

// ============================================================
// CONTROLE
// ============================================================

function controlePadrao() {
  return {
    indiceCategoria: 0,
    enviados: [],
    recentes: [],
    contador: 0,
    ultimaExecucao: null,
    ultimaOferta: null,
  };
}

async function obterControle(env) {
  const salvo = await env.ENVIADOS.get(
    CONTROL_KEY,
    "json"
  );

  return {
    ...controlePadrao(),
    ...(salvo || {}),
    enviados: Array.isArray(salvo?.enviados)
      ? salvo.enviados
      : [],
    recentes: Array.isArray(salvo?.recentes)
      ? salvo.recentes
      : [],
  };
}

async function salvarControle(env, controle) {
  await env.ENVIADOS.put(
    CONTROL_KEY,
    JSON.stringify(controle)
  );
}

// ============================================================
// MERCADO LIVRE - TOKEN
// ============================================================

async function obterTokens(env) {
  const tokens =
    await env.DS_GARAGE_TOKENS.get(
      TOKEN_KEY,
      "json"
    );

  if (!tokens?.access_token) {
    throw new Error(
      "Mercado Livre não conectado. Acesse /oauth/start."
    );
  }

  return tokens;
}

async function salvarTokens(env, tokens) {
  await env.DS_GARAGE_TOKENS.put(
    TOKEN_KEY,
    JSON.stringify(tokens)
  );
}

async function renovarToken(env, tokens) {
  if (!tokens?.refresh_token) {
    throw new Error(
      "Refresh token do Mercado Livre não encontrado."
    );
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: env.ML_CLIENT_ID,
    client_secret: env.ML_CLIENT_SECRET,
    refresh_token: tokens.refresh_token,
  });

  const response = await fetch(
    `${ML_API_URL}/oauth/token`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  const texto = await response.text();

  if (!response.ok) {
    throw new Error(
      `Refresh ML HTTP ${response.status}: ${texto}`
    );
  }

  const dados = JSON.parse(texto);

  const atualizado = {
    ...tokens,
    ...dados,
    expires_at:
      Date.now() +
      Number(dados.expires_in || 21600) *
        1000 -
      60000,
  };

  await salvarTokens(env, atualizado);

  return atualizado;
}

async function tokenAtual(env) {
  let tokens = await obterTokens(env);

  if (
    !tokens.expires_at ||
    Date.now() >= Number(tokens.expires_at)
  ) {
    tokens = await renovarToken(
      env,
      tokens
    );
  }

  return tokens.access_token;
}

  // ============================================================
  // MERCADO LIVRE - API
  // ============================================================

async function fetchComRetry(url, options = {}, maxAttempts = 3) {
  let response;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    response = await fetch(url, options);
    const retryable = response.status === 429 || [500, 502, 503, 504].includes(response.status);
    if (!retryable || attempt === maxAttempts) return response;
    const retryAfter = Number(response.headers.get('Retry-After'));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 10000) : 500 * (2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
    console.warn('ML API HTTP ' + response.status + '; retry ' + attempt + '/' + maxAttempts + ' em ' + delay + 'ms');
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return response;
}

  async function mlFetch(env, endpoint) {
    let token = await tokenAtual(env);

    let response = await fetchComRetry(
      `${ML_API_URL}${endpoint}`,
      {
        headers: {
          Accept: "application/json",
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      token = (
        await renovarToken(
          env,
          await obterTokens(env)
        )
      ).access_token;

      response = await fetchComRetry(
        `${ML_API_URL}${endpoint}`,
        {
          headers: {
            Accept: "application/json",
            Authorization:
              `Bearer ${token}`,
          },
        }
      );
    }

    const texto = await response.text();

    if (!response.ok) {
      throw new Error(
        `Mercado Livre HTTP ${response.status} ${endpoint}: ${texto}`
      );
    }

    try {
      return JSON.parse(texto);
    } catch {
      throw new Error(
        `Mercado Livre retornou JSON inválido em ${endpoint}.`
      );
    }
  }

// ============================================================
// FAMÍLIA DO PRODUTO
// ============================================================

function obterFamilia(nome) {
  const t = normalizar(nome);

  if (/pneu|roda/.test(t)) {
    return "pneus_rodas";
  }

  if (
    /politriz|polimento|cera|coating/.test(t)
  ) {
    return "polimento";
  }

  if (
    /lampada|farol|lanterna|led|xenon/.test(t)
  ) {
    return "iluminacao";
  }

  if (
    /multimidia|subwoofer|amplificador|alto.falante/.test(t)
  ) {
    return "som_automotivo";
  }

  if (
    /ferramenta|chave|alicate|soquete/.test(t)
  ) {
    return "ferramentas";
  }

  if (
    /oleo|lubrificante|aditivo|fluido/.test(t)
  ) {
    return "lubrificantes";
  }

  if (
    /turbo|intercooler|downpipe|intake/.test(t)
  ) {
    return "performance";
  }

  return "automotivo_geral";
}

// ============================================================
// RELEVÂNCIA
// ============================================================

function relevante(nome, categoria) {
  const textoNome = normalizar(nome);

  // ============================================================
  // BLOQUEIOS ABSOLUTOS
  // ============================================================

  const bloqueiosAbsolutos = [
    "roupa",
    "vestuario",
    "camiseta",
    "camisa",
    "calca",
    "short",
    "bermuda",
    "vestido",
    "saia",
    "lingerie",
    "biquini",
    "maquiagem",
    "cosmetico",
    "perfume",
    "shampoo de cabelo",
    "condicionador",
    "creme facial",
    "batom",
    "brinco",
    "colar",
    "anel",
    "pulseira",
    "bolsa feminina",
    "sapato feminino",
    "tenis feminino",
    "sandalia",
    "sofa",
    "cama",
    "colchao",
    "mesa de jantar",
    "cadeira de escritorio",
    "geladeira",
    "fogao",
    "microondas",
    "panela",
    "liquidificador",
    "cafeteira",
    "televisao",
    "smart tv",
    "notebook",
    "tablet",
    "celular",
    "iphone",
    "ipad",
    "brinquedo",
    "boneca",
    "ursinho",
    "skate",
    "patins",
    "livro",
    "caderno",
    "material escolar",
    "chaveiro",
    "decoracao",
    "enfeite",
    "vaso decorativo",
    "planta",
    "adubo",
    "semente",
    "torneira",
    "cimento",
    "tijolo",
    "telha",
    "cerveja",
    "vinho",
    "chocolate",
    "racao",
    "comida",
    "alimento",
  ];

  // ============================================================
  // BLOQUEIOS ESPECÍFICOS DE MOTO
  // ============================================================

  const bloqueiosEspecificos = [
    "capacete de moto",
    "capacete para motociclista",
    "capacete motocross",
    "luva para motociclista",
    "jaqueta para motociclista",
    "calca para motociclista",
    "bota para motociclista",

    "pneu de moto",
    "pneu para moto",
    "roda de moto",

    "titan 150",
    "titan 160",
    "cg 150",
    "cg 160",
    "start 160",
    "fan 125",
    "fan 160",
    "pop 100",
    "galinha",

    "roda para moto",
    "peca de moto",
    "peca para moto",
    "acessorio de moto",
    "acessorio para moto",

    "motocicleta",
    "motociclista",
    "motocross",
    "moto cross",
    "moto gp",
    "moto g p",
    "scooter",
    "motociclo",
    "motocicletas",
  ];

  // ============================================================
  // TERMOS AUTOMOTIVOS
  // ============================================================

  const termosAutomotivos = [
    "automot",
    "automovel",
    "carro",
    "carros",
    "veiculo",
    "veiculos",
    "caminhonete",
    "pickup",
    "pick up",
    "suv",
    "sedan",
    "hatch",
    "pneu",
    "pneus",
    "roda",
    "rodas",
    "motor",
    "mecanico",
    "mecanica",
    "peca automotiva",
    "pecas automotivas",
    "autopeca",
    "autopecas",
    "oficina",
    "ferramenta automotiva",
    "ferramentas automotivas",
    "ferramenta para carro",
    "ferramentas para carro",
    "oleo",
    "lubrificante",
    "fluido",
    "filtro",
    "freio",
    "freios",
    "pastilha de freio",
    "disco de freio",
    "suspensao",
    "amortecedor",
    "mola automotiva",
    "embreagem",
    "bateria automotiva",
    "bateria de carro",
    "alternador",
    "motor de partida",
    "farol",
    "lanterna",
    "lampada automotiva",
    "led automotivo",
    "som automotivo",
    "subwoofer",
    "alto falante",
    "alto-falante",
    "amplificador",
    "modulo automotivo",
    "multimidia",
    "central multimidia",
    "radio automotivo",
    "turbo",
    "intercooler",
    "intake",
    "downpipe",
    "escape esportivo",
    "escapamento",
    "coletor",
    "vela de ignicao",
    "bobina de ignicao",
    "injecao eletronica",
    "polimento",
    "politriz",
    "cera automotiva",
    "estetica automotiva",
    "limpeza automotiva",
    "shampoo automotivo",
    "lavagem automotiva",
    "rastreador veicular",
    "rastreador automotivo",
    "alarme automotivo",
    "seguranca veicular",
    "camera veicular",
    "camera automotiva",
    "sensor de estacionamento",
    "sensor automotivo",
    "engate",
    "reboque",
    "guincho automotivo",
    "tuning",
    "performance automotiva",
    "preparacao automotiva",
    "acessorio automotivo",
    "acessorios automotivos",
    "acessorio carro",
    "acessorios carro",
    "adesivo automotivo",
    "adesivo para carro",
    "adesivo para veiculo",
    "emblema automotivo",
    "emblema para carro",
    "friso automotivo",
    "friso para carro",
    "tapete automotivo",
    "tapete para carro",
    "capa de banco automotiva",
    "capa para banco de carro",
    "volante esportivo",
    "manopla de cambio",
    "pedaleira esportiva",
    "aerofolio",
    "spoiler",
    "difusor automotivo",
    "parachoque",
    "grade automotiva",
    "grade para carro",
    "vonixx",
    "v-Mol",
    "prizm",
    "shiny",
    "intense",
    "restaurax",
    "strike",
    "blend",
    "izer",
    "delet",
    "sintra",
    "v-Floc",
    "aditivo",
    "compressor",
    "compressor de ar",
    "compressor ar",
    "calibrador de pneus",
    "macaco",
    "macaco hidraulico",
    "macaco jacare",
    "chave de roda",
    "chave de impacto",
    "parafusadeira",
    "furadeira",
    "politriz",
    "lixadeira",
    "torquimetro",
    "multimetro automotivo",
    "scanner automotivo",
    "teste de bateria",
    "carregador de bateria",
    "carregador bateria automotiva",
    "auxiliar partida",
    "auxiliar de partida",
    "descarbonizante",
    "desengripante",
    "limpa contato",
    "limpa tbi",
    "limpa bico",
    "limpa motor",
    "limpa radiador",
    "selante",
    "silicone automotivo",
    "graxa",
    "graxa automotiva",
    "fluido de freio",
    "fluido de arrefecimento",
    "aditivo para radiador",
    "aditivo para combustivel",
    "chupeta de bateria",
    "cabo de bateria",
    "cabo auxiliar",
    "fusivel automotivo",
    "rele automotivo",
    "rele auxiliar",
    "conector automotivo",
    "terminal de bateria",
    "borne de bateria",
    "tomada 12v",
    "carregador veicular",
    "inversor automotivo",
    "inversor 12v",
    "suporte veicular",
    "suporte para carro",
    "suporte automotivo",
    "organizador automotivo",
    "capa automotiva",
    "capa para carro",
    "protetor automotivo",
    "tapete de carro",
    "aspirador automotivo",
    "aspirador veicular",
    "filtro esportivo",
    "filtro de ar esportivo",
    "filtro inbox",
    "filtro conico",
    "filtro de alto fluxo",
    "short ram",
    "cold air intake",
    "admissao esportiva",
    "kit intake",
    "kit admissao",
    "turbina",
    "turbocompressor",
    "turbo compressor",
    "wastegate",
    "valvula de alivio",
    "blow off",
    "blow-off",
    "coletor de escape",
    "coletor esportivo",
    "velas de alta performance",
    "bobina de alta performance",
    "bomba de combustivel de alta vazao",
    "bico injetor de alta vazao",
    "pressurizacao",
    "mangueira de pressurizacao",
    "kit de soquetes",
    "kit soquetes",
    "jogo de soquetes",
    "jogo de chaves",
    "kit de ferramentas",
    "kit ferramentas",
    "jogo de ferramentas",
    "ferramentas para oficina",
    "ferramenta para oficina",
    "chave catraca",
    "catraca",
    "soquete",
    "soquetes",
    "alicate",
    "alicates",
    "parafusadeira",
    "furadeira",
    "chave de impacto",
    "torquimetro",
    "torquímetro",
    "piggyback",
    "remap",
    "ecu programavel",
    "modulo de injecao",
    "fueltech",
    "pandoo",
    "wideband",
    "sonda lambda",
    "manometro de turbo",
    "manometro de pressao",
    "boost controller",
    "reparo pneu",
    "reparo de pneu",
    "kit reparo pneu",
    "kit reparo de pneu",
    "remendo pneu",
    "remendo de pneu",
    "remendos pneu",
    "maleta reparo pneu",
    "modulo taramps",
    "modulo stetsom",
    "modulo soundigital",
    "modulo banda",
    "modulo corzus",
    "modulo amplificador",
    "amplificador automotivo",
    "amplificador carro",
    "amplificador som",
    "som carro",
    "som para carro",
    "audio automotivo",
    "adesivo para carro",
    "adesivo para veiculo",
    "adesivo automotivo",
    "adesivo carro",
    "protetor macaneta",
    "protetor de macaneta",
    "adesivo macaneta",
    "adesivo de macaneta",
    "maçaneta",
    "macaneta",
    "kit reparo",
    "reparo automotivo",
    "reparo veicular",
    "kit manutencao automotiva",
    "manutencao automotiva",
    "reparo pneu",
    "reparo de pneu",
    "kit reparo pneu",
    "kit reparo de pneu",
    "remendo pneu",
    "remendo de pneu",
    "remendos pneu",
    "maleta reparo pneu",
  ];

  // ============================================================
  // PRIMEIRO: BLOQUEIOS ABSOLUTOS
  // ============================================================

  if (
    bloqueiosAbsolutos.some((termo) =>
      textoNome.includes(normalizar(termo))
    )
  ) {
    return false;
  }

  // ============================================================
  // SEGUNDO: BLOQUEIOS ESPECÍFICOS DE MOTO
  // ============================================================

  if (
    bloqueiosEspecificos.some((termo) =>
      textoNome.includes(normalizar(termo))
    )
  ) {
    return false;
  }

  // ============================================================
  // TERCEIRO: VERIFICAÇÃO AUTOMOTIVA
  // ============================================================

  const nomeAutomotivo =
    termosAutomotivos.some((termo) =>
      textoNome.includes(normalizar(termo))
    );

  // ============================================================
  // O NOME É O QUE DEFINE A RELEVÂNCIA
  //
  // A categoria ajuda na busca, mas não transforma qualquer
  // produto da categoria em produto automotivo.
  // ============================================================

  return nomeAutomotivo;
}

function enviadoNosUltimos7Dias(
  controle,
  itemId
) {
  const agora = Date.now();

  return controle.recentes.some(
    (registro) => {
      const timestamp =
        Number(
          registro.timestamp || 0
        );

      if (!timestamp) {
        return false;
      }

      const tempoDecorrido =
        agora - timestamp;

      if (
        tempoDecorrido < 0 ||
        tempoDecorrido >=
          HISTORICO_PRODUTO_MS
      ) {
        return false;
      }

      return (
        registro.itemId === itemId
      );
    }
  );
}

// ============================================================
// CONTROLE DE REPETIÇÃO
// ============================================================

function recente(controle, itemId, nome, familia) {
  const agora = Date.now();

  const tipoAtual = obterTipoProduto(nome);

  return controle.recentes.some((registro) => {
    const tempoDecorrido =
      agora - Number(registro.timestamp || 0);

    if (tempoDecorrido < 0) {
      return false;
    }

    // ============================================================
    // COOLDOWN NORMAL DO PRODUTO — 4 HORAS
    // ============================================================

    if (tempoDecorrido < COOLDOWN_MS) {
      if (registro.itemId === itemId) {
        return true;
      }

      if (
        normalizar(registro.nome) ===
        normalizar(nome)
      ) {
        return true;
      }
    }

    // ============================================================
    // COOLDOWN POR TIPO
    // ============================================================

    if (tipoAtual) {
      const tipoRegistro =
        obterTipoProduto(registro.nome);

      const cooldownTipo =
        COOLDOWN_TIPOS[tipoAtual] || 0;

      if (
        tipoRegistro === tipoAtual &&
        tempoDecorrido < cooldownTipo
      ) {
        return true;
      }
    }

    return false;
  });
}

// ============================================================
// AVALIAÇÃO
// ============================================================

function avaliar(
  preco,
  original,
  item,
  familia,
  nome
) {
  if (!preco || preco <= 0) {
    return null;
  }

  const desconto =
    original > preco
      ? Math.round(
          ((original - preco) /
            original) *
            100
        )
      : 0;

  let score = 40;

  if (desconto >= 30) {
    score += 45;
  } else if (desconto >= 20) {
    score += 30;
  } else if (desconto >= 10) {
    score += 20;
  } else if (desconto >= MIN_DISCOUNT) {
    score += 10;
  }

  if (item?.shipping?.free_shipping) {
    score += 10;
  }

  if (item?.official_store_id) {
    score += 10;
  }

  if (preco <= 100) {
    score += 10;
  } else if (preco <= 300) {
    score += 5;
  }

  const nomeNormalizado =
    normalizar(nome || "");

  const marcasDaFamilia =
    MARCAS_PREFERIDAS[familia] || [];

  const marcaPreferida =
    marcasDaFamilia.find(
      (marca) =>
        nomeNormalizado.includes(
          normalizar(marca)
        )
    ) || null;

  if (marcaPreferida) {
    score += 15;
  }

  const aprovada = true;

  return {
    aprovada,
    score,
    desconto,
    marcaPreferida,
  };
}

// ============================================================
// IMAGEM
// ============================================================

function extrairImagem(
  produto,
  item
) {
  return (
    item?.thumbnail ||
    produto?.pictures?.[0]?.secure_url ||
    produto?.pictures?.[0]?.url ||
    produto?.thumbnail ||
    null
  );
}

// ============================================================
// BUSCA DE OFERTA
// ============================================================

async function encontrarOferta(env, controle) {
  const CATEGORIAS_POR_EXECUCAO = 8;
  const PRODUTOS_POR_CATEGORIA = 3;

  const inicio =
    Number(
      controle.indiceCategoria || 0
    ) % CATEGORIES.length;

  let candidatoRepetido = null;

  const categorias = Array.from(
    {
      length: Math.min(
        CATEGORIAS_POR_EXECUCAO,
        CATEGORIES.length
      )
    },
    (_, i) =>
      CATEGORIES[
        (inicio + i) %
          CATEGORIES.length
      ]
  );

  const diagnostico = {

    modo: "automotivo",

    somenteProdutosCatalogo: true,

    indiceInicial: inicio,

    categoriasAnalisadas: [],

    produtosAnalisados: 0,

    itensAnalisados: 0,

    precosConsultados: 0,

    rejeicoes: {

      dadosIncompletos: 0,

      produtoNaoRelevante: 0,

      repetido: 0,

      avaliacao: 0,

    },

    erros: [],

  };

  // ============================================================
  // ANALISA AS CATEGORIAS DESTA EXECUÇÃO
  // ============================================================

  for (
    let indice = 0;
    indice < categorias.length;
    indice++
  ) {

    const categoria =
      categorias[indice];

    try {

      // ========================================================
      // HIGHLIGHTS
      // ========================================================

      const highlights =
        await mlFetch(
          env,
          `/highlights/${ML_SITE_ID}/category/${categoria.id}`
        );

      const destaques = (

        Array.isArray(
          highlights?.content
        )
          ? highlights.content
          : []

      )
        .filter(
          (d) =>
            d?.type === "PRODUCT" &&
            d?.id
        )
        .slice(
          0,
          PRODUTOS_POR_CATEGORIA
        );

      console.log(
        "DEBUG HIGHLIGHTS",
        JSON.stringify(
          destaques.slice(0, 3)
        )
      );

      diagnostico.categoriasAnalisadas.push({

        id:
          categoria.id,

        nome:
          categoria.nome,

        produtos:
          destaques.length,

      });

      // ========================================================
      // ANALISA OS PRODUTOS DA CATEGORIA
      // ========================================================

      for (
        const destaque of destaques
      ) {

        diagnostico.produtosAnalisados++;

        // ======================================================
        // HISTÓRICO DO PRODUTO — 7 DIAS
        // ======================================================

const produtoEnviadoNosUltimos7Dias =
  controle.recentes.some(
    (registro) => {
      const timestamp =
        Number(
          registro.timestamp || 0
        );

      if (!timestamp) {
        return false;
      }

      const tempoDecorrido =
        Date.now() -
        timestamp;

      if (
        tempoDecorrido < 0 ||
        tempoDecorrido >=
          HISTORICO_PRODUTO_MS
      ) {
        return false;
      }

      return (
        registro.productId ===
        destaque.id
      );
    }
  );

if (
  produtoEnviadoNosUltimos7Dias
) {
  diagnostico.rejeicoes
    .repetido++;
}

        try {

          // ====================================================
          // CONSULTA DO PRODUTO
          // ====================================================

          const produto =
            await mlFetch(
              env,
              `/products/${encodeURIComponent(
                destaque.id
              )}`
            );

          const nome =
            produto?.name ||
            produto?.title ||
            "";

          // ====================================================
          // FILTRO DE RELEVÂNCIA
          // ====================================================

          const produtoRelevante =
            relevante(
              nome,
              categoria.nome
            );

          if (!produtoRelevante) {

            diagnostico.rejeicoes
              .produtoNaoRelevante++;

            erroLimitado(
              diagnostico,
              {

                categoria:
                  categoria.id,

                productId:
                  destaque.id,

                itemId:
                  null,

                nome:
                  nome || null,

                imagem:
                  "NÃO CONSULTADA",

                relevante:
                  false,

              }
            );

            continue;
          }

          // ====================================================
          // CONSULTA DOS ITENS
          // ====================================================

          const lista =
            await mlFetch(
              env,
              `/products/${encodeURIComponent(
                destaque.id
              )}/items`
            );

          const itens = (

            Array.isArray(
              lista?.results
            )
              ? lista.results
              : []

          ).slice(
            0,
            ITEMS_PER_PRODUCT
          );

          if (!itens.length) {
            continue;
          }

          // ====================================================
          // ANALISA OS ITENS
          // ====================================================

          for (
            const resumo of itens
          ) {

            diagnostico.itensAnalisados++;

            const itemId =
              resumo?.item_id ||
              resumo?.id;

            // ==================================================
            // NOME
            // ==================================================

            const nomeProduto =
              nome;

            // ==================================================
            // IMAGEM
            // ==================================================

            const imagem =
              extrairImagem(
                produto,
                resumo
              );

            // ==================================================
            // PREÇOS
            // ==================================================

            const preco =
              Number(
                resumo?.price || 0
              );

            const original =
              Number(
                resumo?.original_price ||
                  0
              );

            // ==================================================
            // DADOS INCOMPLETOS
            // ==================================================

            if (
              !itemId ||
              !nomeProduto ||
              !imagem
            ) {

              diagnostico.rejeicoes
                .dadosIncompletos++;

              erroLimitado(
                diagnostico,
                {

                  categoria:
                    categoria.id,

                  productId:
                    destaque.id,

                  itemId:
                    itemId || null,

                  nome:
                    nomeProduto || null,

                  imagem:
                    imagem
                      ? "OK"
                      : null,

                  relevante:
                    true,

                }
              );

              continue;
            }

            // ==================================================
            // FAMÍLIA
            // ==================================================

            const familia =
              obterFamilia(
                nomeProduto
              );

            // ==================================================
            // COOLDOWN NORMAL + COOLDOWN POR TIPO
            // ==================================================

            if (
              recente(
                controle,
                itemId,
                nomeProduto,
                familia
              )
            ) {

              diagnostico.rejeicoes
                .repetido++;

              continue;
            }

            // ==================================================
            // HISTÓRICO DO ITEM — 7 DIAS
            // ==================================================

const enviadoSemana =
  produtoEnviadoNosUltimos7Dias ||
  enviadoNosUltimos7Dias(
    controle,
    itemId
  );

            // ==================================================
            // AVALIAÇÃO
            // ==================================================

            diagnostico.precosConsultados++;

            const avaliacao =
              avaliar(
                preco,
                original,
                resumo,
                familia,
                nomeProduto
              );

            if (
              !avaliacao?.aprovada
            ) {

              diagnostico.rejeicoes
                .avaliacao++;

              continue;
            }

            // ==================================================
            // ITEM JÁ ENVIADO NOS ÚLTIMOS 7 DIAS
            // ==================================================
            // Continua sendo apenas candidato de reserva.
            // Isso preserva exatamente a tolerância que já
            // tínhamos configurado.
            // ==================================================

            if (enviadoSemana) {

              diagnostico.rejeicoes
                .repetido++;

              if (!candidatoRepetido) {

                candidatoRepetido = {

                  itemId,

                  productId:
                    destaque.id,

                  nome:
                    nomeProduto,

                  imagem,

                  preco,

                  original,

                  familia,

                  categoria,

                  avaliacao,

originUrl:
  resumo?.permalink ||
  `https://www.mercadolivre.com.br/p/${destaque.id}`,

                };

              }

              continue;
            }

            // ==================================================
            // OFERTA NOVA ENCONTRADA
            // ==================================================
            // Achou uma oferta válida?
            // PARA IMEDIATAMENTE.
            // Não faz mais consultas desnecessárias.
            // ==================================================

            return {

              candidato: {

                itemId,

                productId:
                  destaque.id,

                nome:
                  nomeProduto,

                imagem,

                preco,

                original,

                familia,

                categoria,

                avaliacao,

originUrl:
  resumo?.permalink ||
  `https://www.mercadolivre.com.br/p/${destaque.id}`,

              },

              diagnostico,

              proximoIndice:
                (
                  inicio +
                  indice +
                  1
                ) %
                CATEGORIES.length,

            };

          }

        } catch (erro) {

          erroLimitado(
            diagnostico,
            {

              categoria:
                categoria.id,

              productId:
                destaque.id,

              erro:
                erro.message,

            }
          );

        }

      }

    } catch (erro) {

      erroLimitado(
        diagnostico,
        {

          categoria:
            categoria.id,

          erro:
            erro.message,

        }
      );

    }

  }

  // ============================================================
  // NENHUMA OFERTA NOVA
  // ============================================================

  return {

    candidato:
      candidatoRepetido,

    diagnostico,

    proximoIndice:
      (
        inicio +
        categorias.length
      ) %
      CATEGORIES.length,

  };

}

// ============================================================
// LINK AFILIADO
// ============================================================

async function gerarLinkAfiliado(
  candidato
) {

  const url =
    new URL(AFFILIATE_URL);
  url.searchParams.set(
    "item_id",
    candidato.itemId
  );

  url.searchParams.set(
    "origin_url",
    candidato.originUrl
  );

  let response;
  let texto;
  const MAX_TENTATIVAS_AFILIADO = 4;
  const INTERVALOS_AFILIADO = [30000, 60000, 120000];

  for (
    let tentativa = 1;
    tentativa <= MAX_TENTATIVAS_AFILIADO;
    tentativa++
  ) {
    response = await fetch(url);
    texto = await response.text();

    if (response.ok) break;

    const erroTemporario =
      [429, 502, 503, 504].includes(response.status);

    if (!erroTemporario || tentativa === MAX_TENTATIVAS_AFILIADO) {
      throw new Error(
        `Render afiliado HTTP ${response.status}: ${texto}`
      );
    }

    const retryAfter =
      Number(response.headers.get("Retry-After"));

    const espera =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 120000)
        : INTERVALOS_AFILIADO[tentativa - 1] + Math.floor(Math.random() * 1000);

    console.warn(
      `Render afiliado HTTP ${response.status}; tentativa ${tentativa}/${MAX_TENTATIVAS_AFILIADO}; nova tentativa em ${espera}ms`
    );

    await new Promise(resolve => setTimeout(resolve, espera));
  }

  const dados =
    JSON.parse(texto);

  const shortUrl =
    dados?.resposta?.urls?.[0]
      ?.short_url ||
    dados?.urls?.[0]
      ?.short_url ||
    dados?.short_url;

  if (!shortUrl) {
    throw new Error(
      "Render não retornou link afiliado."
    );
  }

  return shortUrl;

}

// ============================================================
// IMAGEM PARA DATA URI
// ============================================================

async function imagemParaDataUri(
  url
) {

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Imagem HTTP ${response.status}`
    );

  }

  const tipo =
    response.headers.get(
      "content-type"
    ) || "image/jpeg";

  const bytes =
    new Uint8Array(
      await response.arrayBuffer()
    );

  let binario = "";

  for (
    let i = 0;
    i < bytes.length;
    i += 0x8000

  ) {

    binario +=
      String.fromCharCode(
        ...bytes.subarray(
          i,
          i + 0x8000
        )
      );
  }

  return `data:${tipo};base64,${btoa(
    binario
  )}`;

}

// ============================================================
// WHATSAPP
// ============================================================

async function enviarWhatsApp(

  env,

  candidato,

  linkAfiliado

) {

  if (

    !env.WAPI_TOKEN ||

    !env.WAPI_GROUP_ID ||

    !env.WAPI_INSTANCE_ID

  ) {

    throw new Error(

      "Configure WAPI_TOKEN, WAPI_GROUP_ID e WAPI_INSTANCE_ID."

    );

  }

  const desconto =

    candidato.avaliacao.desconto;

  const legenda =

    `🚨 OFERTA MERCADO LIVRE 🚨\n\n` +

    `🔥 ${candidato.nome}\n\n` +

    (

      desconto

        ? `~De: ${formatarPreco(

            candidato.original

          )}~\n`

        : ""

    ) +

    `*Por: ${formatarPreco(

      candidato.preco

    )}*\n\n` +

    (

      desconto

        ? `🔥 ${desconto}% OFF\n\n`

        : ""

    ) +

    `🛒 COMPRE AQUI:\n${linkAfiliado}`;

  const endpoint =
    `${WAPI_URL}?instanceId=${encodeURIComponent(
      env.WAPI_INSTANCE_ID
    )}`;

  let response;
  let texto;
  const MAX_TENTATIVAS_WAPI = 3;
  const INTERVALOS_WAPI = [10000, 20000];

  for (
    let tentativa = 1;
    tentativa <= MAX_TENTATIVAS_WAPI;
    tentativa++
  ) {
    response = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${env.WAPI_TOKEN}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          phone:
            env.WAPI_GROUP_ID,
          image:
            await imagemParaDataUri(
              candidato.imagem
            ),
          caption:
            legenda,
          delayMessage: 2,
        }),
      }
    );

    texto = await response.text();

    if (response.ok) break;

    if (
      response.status !== 429 ||
      tentativa === MAX_TENTATIVAS_WAPI
    ) {
      console.error(
        `W-API FALHA | HTTP ${response.status} | ${texto.slice(0, 500)}`
      );
      throw new Error(
        `W-API HTTP ${response.status}: ${texto.slice(0, 500)}`
      );
    }

    const retryAfter =
      Number(response.headers.get("Retry-After"));

    const espera =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 120000)
        : INTERVALOS_WAPI[tentativa - 1];

    console.warn(
      `W-API HTTP 429; tentativa ${tentativa}/${MAX_TENTATIVAS_WAPI}; nova tentativa em ${espera}ms`
    );

    await new Promise(resolve => setTimeout(resolve, espera));
  }

  console.log("W-API HTTP STATUS", response.status);

  return {
    legenda,
    resposta: texto,
  };

}

// ============================================================
// ALERTA DE ERRO - WHATSAPP PESSOAL
// ============================================================

async function enviarAlertaErro(env, etapa, erro) {
  try {
    if (
      !env.WAPI_TOKEN ||
      !env.WAPI_INSTANCE_ID
    ) {
      console.error(
        "Não foi possível enviar alerta: WAPI_TOKEN ou WAPI_INSTANCE_ID ausente."
      );
      return;
    }

    const numeroAlerta = env.WAPI_ALERT_PHONE;

    const mensagem =
      `🚨 *DS GARAGE — ERRO NA AUTOMAÇÃO* 🚨\n\n` +
      `❌ A automação do Mercado Livre encontrou um erro.\n\n` +
      `📍 *Etapa:* ${etapa}\n` +
      `🕐 *Horário:* ${new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })}\n\n` +
      `⚠️ *Erro:*\n${erro?.message || String(erro)}`;

    const endpoint =
      `${WAPI_URL.replace(
        "/send-image",
        "/send-text"
      )}?instanceId=${encodeURIComponent(
        env.WAPI_INSTANCE_ID
      )}`;

    const response = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${env.WAPI_TOKEN}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          phone: numeroAlerta,
          message: mensagem,
          delayMessage: 2,
        }),
      }
    );

    const texto = await response.text();

    if (!response.ok) {
      console.error(
        "Falha ao enviar alerta de erro:",
        response.status,
        texto
      );
      return;
    }

    console.log(
      "Alerta de erro enviado para o WhatsApp pessoal:",
      texto
    );
  } catch (erroAlerta) {
    console.error(
      "ERRO AO ENVIAR ALERTA DE ERRO:",
      erroAlerta
    );
  }
}

// ============================================================
// ALERTA - NENHUMA OFERTA ENCONTRADA
// ============================================================

async function enviarAlertaSemOferta(env, diagnostico) {
  try {
    if (
      !env.WAPI_TOKEN ||
      !env.WAPI_INSTANCE_ID
    ) {
      console.error(
        "Não foi possível enviar alerta de nenhuma oferta: WAPI_TOKEN ou WAPI_INSTANCE_ID ausente."
      );
      return;
    }

    const numeroAlerta = env.WAPI_ALERT_PHONE;

    const categorias =
      diagnostico?.categoriasAnalisadas?.length || 0;

    const produtos =
      diagnostico?.produtosAnalisados || 0;

    const itens =
      diagnostico?.itensAnalisados || 0;

    const repetidos =
      diagnostico?.rejeicoes?.repetido || 0;

    const naoRelevantes =
      diagnostico?.rejeicoes?.produtoNaoRelevante || 0;

    const dadosIncompletos =
      diagnostico?.rejeicoes?.dadosIncompletos || 0;

    const avaliacao =
      diagnostico?.rejeicoes?.avaliacao || 0;

    const mensagem =
      `🔎 *Mercado Livre — NENHUMA OFERTA ENCONTRADA*\n\n` +
      `A execução do Mercado Livre terminou normalmente, ` +
      `mas nenhuma oferta válida foi encontrada nesta execução.\n\n` +
      `📊 *Diagnóstico:*\n` +
      `• Categorias analisadas: ${categorias}\n` +
      `• Produtos analisados: ${produtos}\n` +
      `• Itens analisados: ${itens}\n\n` +
      `🚫 *Rejeições:*\n` +
      `• Repetidos: ${repetidos}\n` +
      `• Não relevantes: ${naoRelevantes}\n` +
      `• Dados incompletos: ${dadosIncompletos}\n` +
      `• Avaliação: ${avaliacao}\n\n` +
      `🕐 *Horário:* ${new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })}`;

    const endpoint =
      `${WAPI_URL.replace(
        "/send-image",
        "/send-text"
      )}?instanceId=${encodeURIComponent(
        env.WAPI_INSTANCE_ID
      )}`;

    const response = await fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${env.WAPI_TOKEN}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          phone: numeroAlerta,
          message: mensagem,
          delayMessage: 2,
        }),
      }
    );

    const texto =
      await response.text();

    if (!response.ok) {
      console.error(
        "Falha ao enviar alerta de nenhuma oferta:",
        response.status,
        texto
      );
      return;
    }

    console.log(
      "Alerta de nenhuma oferta enviado:",
      texto
    );

  } catch (erro) {
    console.error(
      "ERRO AO ENVIAR ALERTA DE NENHUMA OFERTA:",
      erro
    );
  }
}

// ============================================================

// REGISTRO

// ============================================================

function registrar(

  controle,

  candidato,

  linkAfiliado

) {

  const agora =

    Date.now();

  controle.enviados = [

    ...controle.enviados,

    candidato.itemId,

  ].slice(

    -HISTORY_LIMIT

  );

  controle.recentes = [

    ...controle.recentes,

    {

      itemId:

        candidato.itemId,

      productId:

        candidato.productId,

      nome:

        candidato.nome,

      familia:

        candidato.familia,

      timestamp:

        agora,

    },

  ].slice(

    -HISTORY_LIMIT

  );

  controle.ultimaOferta = {

    itemId:

      candidato.itemId,

    productId:

      candidato.productId,

    nome:

      candidato.nome,

    preco:

      candidato.preco,

    desconto:

      candidato.avaliacao

        .desconto,

    linkAfiliado,

    timestamp:

      new Date(

        agora

      ).toISOString(),

  };

}

// ============================================================

// EXECUÇÃO

// ============================================================

async function executar(env) {

  let etapa = "início";

  try {

    etapa = "obter controle";

    const controle =

      await obterControle(env);

    controle.contador++;

    etapa = "buscar oferta";

    const busca =

      await encontrarOferta(

        env,

        controle

      );

    controle.indiceCategoria =

      busca.proximoIndice;

if (!busca.candidato) {

  const diagnostico =
    busca.diagnostico;

  const rejeitadosUnicos = [];

  for (
    const item of diagnostico.erros || []
  ) {

    const nomeNormalizado =
      normalizar(item.nome || "");

    if (
      !nomeNormalizado ||
      rejeitadosUnicos.some(
        (existente) =>
          normalizar(
            existente.nome
          ) === nomeNormalizado
      )
    ) {
      continue;
    }

    rejeitadosUnicos.push(item);

    if (
      rejeitadosUnicos.length >= 10
    ) {
      break;
    }
  }

  const rejeitados =
    rejeitadosUnicos
      .map(
        (item, indice) =>
          `${indice + 1}. ${item.nome}\n` +
          `→ ${
            item.relevante === false
              ? "Não relevante"
              : "Rejeitado"
          }`
      )
      .join("\n\n");

  const mensagemSemOferta =
    `🟡 *DS GARAGE — SEM OFERTA*\n\n` +
    `O Cron executou normalmente, ` +
    `mas não encontrou uma oferta válida.\n\n` +
    `📊 *DIAGNÓSTICO*\n` +
    `• Produtos analisados: ${
      diagnostico.produtosAnalisados
    }\n` +
    `• Itens analisados: ${
      diagnostico.itensAnalisados
    }\n` +
    `• Não relevantes: ${
      diagnostico.rejeicoes
        ?.produtoNaoRelevante ?? 0
    }\n` +
    `• Repetidos: ${
      diagnostico.rejeicoes
        ?.repetido ?? 0
    }\n` +
    `• Avaliados: ${
      diagnostico.rejeicoes
        ?.avaliacao ?? 0
    }\n\n` +
    (
      rejeitados
        ? `🚫 *PRODUTOS REJEITADOS*\n\n${rejeitados}`
        : `ℹ️ Nenhum produto rejeitado foi registrado no diagnóstico.`
    );

  console.log(
    mensagemSemOferta
  );

  // ============================================================
  // ENVIA ALERTA PARA O WHATSAPP PESSOAL
  // ============================================================

  await enviarAlertaSemOferta(
    env,
    diagnostico
  );

  const resultado = {

    sucesso: false,

    enviado: false,

    motivo:
      "Nenhuma oferta válida encontrada após analisar todas as categorias.",

    diagnostico:
      busca.diagnostico,

  };

  controle.ultimaExecucao = {

    inicio:
      new Date().toISOString(),

    sucesso: false,

    resultado,

  };

  await salvarControle(
    env,
    controle
  );

  return resultado;
}

etapa = "gerar link de afiliado";

    const linkAfiliado =

      await gerarLinkAfiliado(

        busca.candidato

      );

    etapa = "enviar WhatsApp";

    const envio =

      await enviarWhatsApp(

        env,

        busca.candidato,

        linkAfiliado

      );

    etapa = "registrar oferta";

    registrar(

      controle,

      busca.candidato,

      linkAfiliado

    );

    const resultado = {

      sucesso: true,

      enviado: true,

      oferta: {

        itemId:

          busca.candidato.itemId,

        nome:

          busca.candidato.nome,

        preco:

          formatarPreco(

            busca.candidato.preco

          ),

        desconto:

          busca.candidato

            .avaliacao

            .desconto,

        categoria:

          busca.candidato

            .categoria

            .nome,

        link:

          linkAfiliado,

      },

      diagnostico:

        busca.diagnostico,

      envio,

    };

    controle.ultimaExecucao = {

      inicio:

        new Date().toISOString(),

      sucesso: true,

      resultado,

    };

    await salvarControle(

      env,

      controle

    );

    return resultado;

} catch (erro) {
  console.error(
    `ERRO NA EXECUÇÃO ML | etapa=${etapa} | mensagem=${erro?.message || String(erro)}`
  );
  if (erro?.stack) {
    console.error("STACK ML", erro.stack);
  }

  await enviarAlertaErro(
    env,
    etapa,
    erro
  );

  throw erro;
}

}

// ============================================================

// ADMIN

// ============================================================

function exigirAdmin(

  request,

  env

) {

  return (

    !env.ADMIN_TOKEN ||

    request.headers.get(

      "Authorization"

    ) !==

      `Bearer ${env.ADMIN_TOKEN}`

  );

}

// ============================================================

// OAUTH

// ============================================================

async function iniciarOauth(env) {

  if (

    !env.ML_CLIENT_ID ||

    !env.ML_REDIRECT_URI

  ) {

    throw new Error(

      "Configure ML_CLIENT_ID e ML_REDIRECT_URI."

    );

  }

  const oauthUrl =

    new URL(

      "https://auth.mercadolivre.com.br/authorization"

    );

  oauthUrl.searchParams.set(

    "response_type",

    "code"

  );

  oauthUrl.searchParams.set(

    "client_id",

    env.ML_CLIENT_ID

  );

  oauthUrl.searchParams.set(

    "redirect_uri",

    env.ML_REDIRECT_URI

  );

  return Response.redirect(

    oauthUrl.toString(),

    302

  );

}

async function concluirOauth(

  request,

  env

) {


  const url =

    new URL(request.url);

  const code =

    url.searchParams.get(

      "code"

    );

  if (!code) {

    return new Response(

      "Código OAuth não recebido.",

      {

        status: 400,

      }

    );

  }

  const body =

    new URLSearchParams({

      grant_type:

        "authorization_code",

      client_id:

        env.ML_CLIENT_ID,

      client_secret:

        env.ML_CLIENT_SECRET,

      code,

      redirect_uri:

        env.ML_REDIRECT_URI,

    });

  const response =

    await fetch(

      `${ML_API_URL}/oauth/token`,

      {

        method: "POST",

        headers: {

          "Content-Type":

            "application/x-www-form-urlencoded",

        },

        body,

      }

    );

  const texto =

    await response.text();

  if (!response.ok) {

    return new Response(

      `Erro OAuth: ${texto}`,

      {

        status: 500,

      }

    );

  }

  const dados =

    JSON.parse(texto);

  await salvarTokens(

    env,

    {

      ...dados,

      expires_at:

        Date.now() +

        Number(

          dados.expires_in ||

            21600

        ) *

          1000 -

        60000,

    }

  );

  return new Response(

    "Mercado Livre conectado. Você já pode executar o Worker."

  );

}

// ============================================================

// HORÁRIO

// ============================================================

function horarioPermitido() {

  const agora =

    new Date();

  const horarioSaoPaulo =

    new Intl.DateTimeFormat(

      "en-US",

      {

        timeZone:

          "America/Sao_Paulo",

        hour: "2-digit",

        minute: "2-digit",

        hour12: false,

      }

    ).formatToParts(agora);

  const hora =

    Number(

      horarioSaoPaulo.find(

        (parte) =>

          parte.type === "hour"

      )?.value || 0

    );

  return (

    hora >= 6 &&

    hora < 24

  );

}

// ============================================================
// WORKER
// ============================================================

export default {

  async fetch(
    request,
    env
  ) {

    try {

      const {
        pathname,
      } = new URL(
        request.url
      );

      if (pathname === "/") {

        return json({

          sucesso: true,

          sistema:
            "DS Garage — Mercado Livre",

          rotas: [
            "/status",
            "/estado",
            "/oauth/start",
            "/forcar-cron",
            "/teste-cron",
          ],

        });

      }

      if (
        pathname ===
        "/status"
      ) {

        return json({

          sucesso: true,

          mercadoLivre:
            !!(
              await env.DS_GARAGE_TOKENS.get(
                TOKEN_KEY
              )
            ),

          whatsapp:
            !!(
              env.WAPI_TOKEN &&
              env.WAPI_GROUP_ID &&
              env.WAPI_INSTANCE_ID
            ),

          estrategia:
            "Somente PRODUCT; consulta /products/{id}/items",

        });

      }

      if (
        pathname ===
        "/estado"
      ) {

        return json({

          sucesso: true,

          ...(await obterControle(
            env
          )),

        });

      }

      if (
        pathname ===
        "/oauth/start"
      ) {

        return iniciarOauth(
          env
        );

      }

      if (
        pathname ===
        "/oauth/callback"
      ) {

        return concluirOauth(
          request,
          env
        );

      }

      // ============================================================
      // FORÇAR CRON MANUAL
      // ============================================================

      if (
        pathname ===
        "/forcar-cron"
      ) {

        if (
          exigirAdmin(
            request,
            env
          )
        ) {

          return json(
            {
              sucesso: false,
              erro:
                "Não autorizado.",
            },
            401
          );

        }

        return json({

          sucesso: true,

          mensagem:
            "Execução manual concluída.",

          resultado:
            await executar(env),

        });

      }

      // ============================================================
      // PAINEL TESTE CRON
      // ============================================================

      if (
        pathname.startsWith(
          "/teste-cron"
        )
      ) {

        return new Response(`<!DOCTYPE html>

<html lang="pt-BR">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>DS Garage • Mercado Livre</title>

  <style>

    * {
      box-sizing: border-box;
    }

    :root {

      --bg: #05070a;
      --card: #0c1016;
      --card-2: #10161f;
      --border: #1c2735;

      --blue: #1683ff;
      --blue-dark: #0865d1;
      --blue-light: #4aa3ff;

      --text: #f5f7fa;
      --muted: #8b98a8;

      --green: #21d483;
      --red: #ff4d5f;
      --yellow: #ffc857;

    }

    body {

      margin: 0;
      min-height: 100vh;

      background:
        radial-gradient(
          circle at top right,
          rgba(22, 131, 255, 0.12),
          transparent 30%
        ),

        radial-gradient(
          circle at top left,
          rgba(22, 131, 255, 0.06),
          transparent 25%
        ),

        var(--bg);

      color: var(--text);

      font-family:
        Inter,
        Arial,
        Helvetica,
        sans-serif;

    }

    .container {

      width:
        min(
          1180px,
          calc(100% - 32px)
        );

      margin: 0 auto;

      padding:
        35px
        0
        50px;

    }

    /* HEADER */

    .header {

      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 20px;

      margin-bottom: 30px;

    }

    .brand {

      display: flex;

      align-items: center;

      gap: 14px;

    }

.logo {
  width: 52px;
  height: 52px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(
    0 0 15px
    rgba(22, 131, 255, 0.25)
  );
}

      color: white;

      font-weight: 900;

      font-size: 22px;

      letter-spacing: -2px;

      box-shadow:
        0 0 25px
        rgba(
          22,
          131,
          255,
          0.25
        );

    }

    .brand-name {

      font-size: 24px;

      font-weight: 900;

      letter-spacing: 1px;

    }

    .brand-subtitle {

      color: var(--muted);

      font-size: 13px;

      margin-top: 3px;

    }

    .platform {

      display: flex;

      align-items: center;

      gap: 9px;

      padding:
        9px
        13px;

      border:
        1px solid
        var(--border);

      border-radius: 999px;

      background:
        rgba(
          255,
          255,
          255,
          0.025
        );

      color: var(--muted);

      font-size: 13px;

    }

    .platform-dot {

      width: 8px;
      height: 8px;

      background: #ffd600;

      border-radius: 50%;

      box-shadow:
        0 0 10px
        rgba(
          255,
          214,
          0,
          .6
        );

    }

    /* MAIN CARD */

    .control-card {

      background:
        linear-gradient(
          145deg,
          rgba(
            16,
            22,
            31,
            .96
          ),
          rgba(
            8,
            11,
            16,
            .96
          )
        );

      border:
        1px solid
        var(--border);

      border-radius: 20px;

      padding: 26px;

      box-shadow:
        0 20px 60px
        rgba(
          0,
          0,
          0,
          .35
        );

      margin-bottom: 20px;

    }

    .control-title {

      font-size: 18px;

      font-weight: 800;

      margin-bottom: 7px;

    }

    .control-description {

      color: var(--muted);

      font-size: 14px;

      margin-bottom: 22px;

    }

    .form-row {

      display: flex;

      gap: 12px;

    }

    .input {

      flex: 1;

      min-width: 0;

      height: 52px;

      background: #070a0f;

      border:
        1px solid
        var(--border);

      color: white;

      border-radius: 12px;

      padding:
        0
        16px;

      outline: none;

      font-size: 14px;

      transition: .2s;

    }

    .input:focus {

      border-color:
        var(--blue);

      box-shadow:
        0 0 0 3px
        rgba(
          22,
          131,
          255,
          .12
        );

    }

    .button {

      height: 52px;

      border: 0;

      border-radius: 12px;

      padding:
        0
        24px;

      background:
        linear-gradient(
          135deg,
          var(--blue),
          var(--blue-dark)
        );

      color: white;

      font-size: 14px;

      font-weight: 800;

      cursor: pointer;

      transition: .2s;

      white-space: nowrap;

      box-shadow:
        0 8px 25px
        rgba(
          22,
          131,
          255,
          .2
        );

    }

    .button:hover {

      transform:
        translateY(-1px);

      box-shadow:
        0 12px 30px
        rgba(
          22,
          131,
          255,
          .3
        );

    }

    .button:active {

      transform:
        translateY(0);

    }

    .button:disabled {

      opacity: .55;

      cursor:
        not-allowed;

      transform:
        none;

    }

    /* STATUS */

    .status {

      margin-top: 18px;

      display: flex;

      align-items: center;

      gap: 10px;

      padding:
        12px
        14px;

      border-radius: 11px;

      background:
        rgba(
          255,
          255,
          255,
          .025
        );

      border:
        1px solid
        var(--border);

      color: var(--muted);

      font-size: 13px;

    }

    .status-dot {

      width: 9px;
      height: 9px;

      border-radius: 50%;

      background:
        #697586;

    }

    .status.running .status-dot {

      background:
        var(--yellow);

      box-shadow:
        0 0 12px
        rgba(
          255,
          200,
          87,
          .7
        );

      animation:
        pulse 1s infinite;

    }

    .status.success .status-dot {

      background:
        var(--green);

      box-shadow:
        0 0 12px
        rgba(
          33,
          212,
          131,
          .6
        );

    }

    .status.error .status-dot {

      background:
        var(--red);

      box-shadow:
        0 0 12px
        rgba(
          255,
          77,
          95,
          .6
        );

    }

    @keyframes pulse {

      50% {
        opacity: .35;
      }

    }

    /* DASHBOARD */

    #dashboard {

      display: none;

    }

    .dashboard-grid {

      display: grid;

      grid-template-columns:
        repeat(
          4,
          1fr
        );

      gap: 14px;

      margin-bottom: 20px;

    }

    .metric {

      background:
        var(--card);

      border:
        1px solid
        var(--border);

      border-radius: 16px;

      padding: 18px;

    }

    .metric-label {

      color:
        var(--muted);

      font-size: 12px;

      text-transform:
        uppercase;

      letter-spacing:
        .6px;

      margin-bottom: 9px;

    }

    .metric-value {

      font-size: 28px;

      font-weight: 900;

    }

    .metric.blue
    .metric-value {

      color:
        var(--blue-light);

    }

    .metric.green
    .metric-value {

      color:
        var(--green);

    }

    .metric.red
    .metric-value {

      color:
        var(--red);

    }

    /* SECTIONS */

    .section {

      background:
        var(--card);

      border:
        1px solid
        var(--border);

      border-radius: 18px;

      padding: 22px;

      margin-bottom: 18px;

    }

    .section-header {

      display: flex;

      justify-content:
        space-between;

      align-items:
        center;

      gap: 15px;

      margin-bottom: 17px;

    }

    .section-title {

      font-size: 16px;

      font-weight: 800;

    }

    .section-badge {

      padding:
        5px
        9px;

      border-radius:
        999px;

      font-size: 11px;

      background:
        rgba(
          22,
          131,
          255,
          .1
        );

      color:
        var(--blue-light);

      border:
        1px solid
        rgba(
          22,
          131,
          255,
          .2
        );

    }

    /* OFFER */

    .offer {

      display: grid;

      grid-template-columns:
        120px
        1fr
        auto;

      align-items:
        center;

      gap: 18px;

      padding: 15px;

      background:
        var(--card-2);

      border:
        1px solid
        var(--border);

      border-radius: 14px;

    }

    .offer-image {

      width: 120px;
      height: 100px;

      border-radius: 10px;

      background:
        #070a0f;

      display: flex;

      align-items:
        center;

      justify-content:
        center;

      overflow:
        hidden;

    }

    .offer-image img {

      width: 100%;
      height: 100%;

      object-fit:
        contain;

    }

    .offer-name {

      font-size: 16px;

      font-weight: 750;

      line-height: 1.4;

      margin-bottom: 9px;

    }

    .offer-info {

      display: flex;

      flex-wrap: wrap;

      gap: 8px;

    }

    .tag {

      padding:
        5px
        8px;

      background:
        rgba(
          255,
          255,
          255,
          .04
        );

      border:
        1px solid
        var(--border);

      border-radius: 7px;

      color:
        var(--muted);

      font-size: 11px;

    }

    .price {

      font-size: 22px;

      font-weight: 900;

      white-space:
        nowrap;

      margin-bottom: 9px;

    }

    .discount {

      color:
        var(--green);

      font-size: 12px;

      text-align:
        right;

      margin-bottom: 10px;

    }

    .offer-link {

      display: inline-flex;

      justify-content:
        center;

      align-items:
        center;

      padding:
        9px
        13px;

      border-radius: 9px;

      background:
        var(--blue);

      color: white;

      text-decoration:
        none;

      font-size: 12px;

      font-weight: 800;

      white-space:
        nowrap;

    }

    /* REJECTIONS */

    .rejection {

      padding:
        12px
        14px;

      border-radius: 10px;

      background:
        var(--card-2);

      border:
        1px solid
        var(--border);

      margin-bottom: 8px;

    }

    .rejection:last-child {

      margin-bottom: 0;

    }

    .rejection-name {

      font-size: 13px;

      font-weight: 700;

      line-height: 1.4;

    }

    .rejection-reason {

      margin-top: 5px;

      color:
        var(--muted);

      font-size: 11px;

    }

    .empty {

      padding: 20px;

      text-align:
        center;

      color:
        var(--muted);

      font-size: 13px;

      border:
        1px dashed
        var(--border);

      border-radius: 10px;

    }

    /* TECHNICAL */

    details {

      background:
        var(--card);

      border:
        1px solid
        var(--border);

      border-radius: 14px;

      overflow:
        hidden;

      margin-top: 18px;

    }

    summary {

      cursor:
        pointer;

      padding:
        15px
        17px;

      color:
        var(--muted);

      font-size: 13px;

      font-weight: 700;

      user-select:
        none;

    }

    summary:hover {

      color: white;

    }

    pre {

      margin: 0;

      padding: 17px;

      max-height: 500px;

      overflow:
        auto;

      background:
        #030508;

      color:
        #a9c7e8;

      font-size: 11px;

      line-height: 1.6;

      white-space:
        pre-wrap;

      word-break:
        break-word;

      border-top:
        1px solid
        var(--border);

    }

    /* RESPONSIVE */

    @media (max-width: 800px) {

      .dashboard-grid {

        grid-template-columns:
          repeat(
            2,
            1fr
          );

      }

      .form-row {

        flex-direction:
          column;

      }

      .button {

        width: 100%;

      }

      .offer {

        grid-template-columns:
          90px
          1fr;

      }

      .offer-image {

        width: 90px;
        height: 90px;

      }

      .offer-action {

        grid-column:
          1 / -1;

      }

      .offer-link {

        width: 100%;

      }

      .price,
      .discount {

        text-align:
          left;

      }

    }

    @media (max-width: 500px) {

      .container {

        width:
          min(
            calc(100% - 20px),
            1180px
          );

        padding-top: 20px;

      }

      .header {

        align-items:
          flex-start;

      }

      .platform {

        display:
          none;

      }

      .brand-name {

        font-size: 20px;

      }

      .dashboard-grid {

        grid-template-columns:
          1fr 1fr;

      }

      .metric-value {

        font-size: 23px;

      }

      .control-card,
      .section {

        padding: 17px;

      }

    }

  </style>

</head>

<body>

<div class="container">

  <header class="header">

    <div class="brand">

<img
  class="logo"
  src="https://i.ibb.co/GQp6t12r/logo.png"
  alt="DS Garage"
/>

      <div>

        <div class="brand-name">
          DS GARAGE
        </div>

        <div class="brand-subtitle">
          Painel de automação • Mercado Livre
        </div>

      </div>

    </div>

    <div class="platform">

      <span class="platform-dot"></span>

      Mercado Livre

    </div>

  </header>

  <section class="control-card">

    <div class="control-title">
      Execução manual
    </div>

    <div class="control-description">

      Execute uma rodada da automação do Mercado Livre e acompanhe o resultado abaixo.

    </div>

    <div class="form-row">

      <input
        id="admin"
        class="input"
        type="password"
        placeholder="Chave administrativa"
        autocomplete="off"
      >

      <button
        id="run"
        class="button"
        onclick="executar()"
      >
        EXECUTAR CRON ML
      </button>

    </div>

    <div
      id="status"
      class="status"
    >

      <span class="status-dot"></span>

      <span id="statusText">
        Pronto para executar
      </span>

    </div>

  </section>

  <main id="dashboard">

    <div class="dashboard-grid">

      <div class="metric blue">

        <div class="metric-label">
          Encontrados
        </div>

        <div
          id="encontrados"
          class="metric-value"
        >
          0
        </div>

      </div>

      <div class="metric">

        <div class="metric-label">
          Analisados
        </div>

        <div
          id="analisados"
          class="metric-value"
        >
          0
        </div>

      </div>

      <div class="metric red">

        <div class="metric-label">
          Rejeitados
        </div>

        <div
          id="rejeitados"
          class="metric-value"
        >
          0
        </div>

      </div>

      <div class="metric green">

        <div class="metric-label">
          Enviados
        </div>

        <div
          id="enviados"
          class="metric-value"
        >
          0
        </div>

      </div>

    </div>

    <section class="section">

      <div class="section-header">

        <div class="section-title">
          Oferta da execução
        </div>

        <div
          id="resultadoBadge"
          class="section-badge"
        >
          Resultado
        </div>

      </div>

      <div id="ofertaContainer"></div>

    </section>

    <section class="section">

      <div class="section-header">

        <div class="section-title">
          Produtos rejeitados
        </div>

        <div
          id="rejeitadosBadge"
          class="section-badge"
        >
          0
        </div>

      </div>

      <div id="rejeicoesContainer"></div>

    </section>

    <details>

      <summary>
        VER DETALHES TÉCNICOS
      </summary>

      <pre id="json"></pre>

    </details>

  </main>

</div>

<script>

  function escapeHtml(value) {

    return String(value ?? "")

      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

  function setStatus(
    tipo,
    texto
  ) {

    const status =
      document.getElementById(
        "status"
      );

    const statusText =
      document.getElementById(
        "statusText"
      );

    status.className =
      "status";

    if (tipo) {

      status.classList.add(
        tipo
      );

    }

    statusText.textContent =
      texto;

  }

  function numero(
    obj,
    caminho,
    padrao = 0
  ) {

    try {

      const partes =
        caminho.split(".");

      let atual = obj;

      for (
        const parte
        of partes
      ) {

        if (
          atual == null
        ) {

          return padrao;

        }

        atual =
          atual[parte];

      }

      return typeof atual === "number"
        ? atual
        : padrao;

    } catch {

      return padrao;

    }

  }

  function obterRejeicoes(
    data
  ) {

    const diagnostico =
      data?.resultado?.diagnostico ||
      data?.diagnostico ||
      {};

    return Array.isArray(
      diagnostico.erros
    )
      ? diagnostico.erros
      : [];

  }

  function renderizar(
    data
  ) {

    document.getElementById(
      "dashboard"
    ).style.display =
      "block";

    const resultado =
      data?.resultado ||
      data ||
      {};

    const diagnostico =
      resultado?.diagnostico ||
      data?.diagnostico ||
      {};

    const rejeicoes =
      obterRejeicoes(
        data
      );

    /* MÉTRICAS */

    document.getElementById(
      "encontrados"
    ).textContent =

      numero(
        diagnostico,
        "produtosAnalisados",

        numero(
          diagnostico,
          "encontrados",
          0
        )
      );

    document.getElementById(
      "analisados"
    ).textContent =

      numero(
        diagnostico,
        "itensAnalisados",
        0
      );

    const totalRejeicoes =

      numero(
        diagnostico,
        "rejeicoes.repetido",
        0
      )

      +

      numero(
        diagnostico,
        "rejeicoes.produtoNaoRelevante",
        0
      )

      +

      numero(
        diagnostico,
        "rejeicoes.dadosIncompletos",
        0
      )

      +

      numero(
        diagnostico,
        "rejeicoes.avaliacao",
        0
      );

    document.getElementById(
      "rejeitados"
    ).textContent =
      totalRejeicoes;

    document.getElementById(
      "enviados"
    ).textContent =

      numero(
        data,
        "enviados",

        resultado?.envio?.sucesso
          ? 1
          : 0
      );

    /* OFERTA */

    const oferta =
      resultado?.oferta ||
      data?.oferta ||
      null;

    const ofertaContainer =
      document.getElementById(
        "ofertaContainer"
      );

    if (oferta) {

      const imagem =
        oferta.imagem ||
        oferta.thumbnail ||
        oferta.foto ||
        "";

      const nome =
        oferta.nome ||
        oferta.title ||
        "Produto enviado";

      const preco =
        oferta.preco ||
        oferta.price ||
        "";

      const desconto =
        oferta.desconto != null
          ? oferta.desconto
          : "";

      const categoria =
        oferta.categoria ||
        "";

      const link =
        oferta.link ||
        oferta.url ||
        "";

ofertaContainer.innerHTML =
  '<div class="offer">' +

    '<div class="offer-image">' +

      (
        imagem
          ? '<img src="' +
            escapeHtml(imagem) +
            '" alt="Produto">'
          : '<span style="color:#596574;font-size:12px">' +
            'SEM IMAGEM' +
            '</span>'
      ) +

    '</div>' +

    '<div>' +

      '<div class="offer-name">' +
        escapeHtml(nome) +
      '</div>' +

      '<div class="offer-info">' +

        (
          categoria
            ? '<span class="tag">' +
              escapeHtml(categoria) +
              '</span>'
            : ''
        ) +

        (
          oferta.familia
            ? '<span class="tag">' +
              escapeHtml(oferta.familia) +
              '</span>'
            : ''
        ) +

        (
          oferta.itemId
            ? '<span class="tag">ID: ' +
              escapeHtml(oferta.itemId) +
              '</span>'
            : ''
        ) +

      '</div>' +

    '</div>' +

    '<div class="offer-action">' +

      '<div class="price">' +
        escapeHtml(preco) +
      '</div>' +

      (
        desconto !== ""
          ? '<div class="discount">' +
            escapeHtml(desconto) +
            '% OFF</div>'
          : ''
      ) +

      (
        link
          ? '<a class="offer-link" ' +
            'href="' +
            escapeHtml(link) +
            '" target="_blank" ' +
            'rel="noopener noreferrer">' +
            'ABRIR OFERTA' +
            '</a>'
          : ''
      ) +

    '</div>' +

  '\</div>';

      }

      const container =
        document.getElementById(
          "rejeicoesContainer"
        );

      const badge =
        document.getElementById(
          "rejeitadosBadge"
        );

      badge.textContent =
        rejeicoes.length;

      if (!rejeicoes.length) {

        container.innerHTML =
          '<div class="empty">' +
          'Nenhum produto rejeitado registrado nesta execução.' +
          '</div>';

      } else {

        container.innerHTML =
          rejeicoes
            .map(
              function (r) {

                const nome =
                  r.nome ||
                  r.productId ||
                  r.itemId ||
                  "Produto não identificado";

                const motivo =
                  r.motivo ||
                  "Produto rejeitado pela análise";

                return (
                  '<div class="rejection">' +

                    '<div class="rejection-name">' +
                      escapeHtml(nome) +
                    '</div>' +

                    '<div class="rejection-reason">' +
                      escapeHtml(motivo) +
                    '</div>' +

                  '</div>'
                );

              }
            )
            .join("");

      }

      document.getElementById(
        "resultadoBadge"
      ).textContent =
        resultado?.sucesso === false
          ? "Falha"
          : data?.enviado
            ? "Enviado"
            : "Executado";

      document.getElementById(
        "json"
      ).textContent =
        JSON.stringify(
          data,
          null,
          2
        );

    }

    async function executar() {

      const admin =
        document.getElementById(
          "admin"
        ).value.trim();

      const button =
        document.getElementById(
          "run"
        );

      if (!admin) {

        setStatus(
          "error",
          "Informe a chave administrativa."
        );

        return;

      }

      button.disabled = true;

      setStatus(
        "running",
        "Executando cron do Mercado Livre..."
      );

      try {

        const response =
          await fetch(
            "/forcar-cron",
            {
              method: "GET",
              headers: {
                Authorization:
                  "Bearer " +
                  admin
              }
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          setStatus(
            "error",
            data?.erro ||
            "Não foi possível executar o cron."
          );

        } else {

          setStatus(
            data?.enviado
              ? "success"
              : "success",
            data?.enviado
              ? "Cron executado e oferta enviada."
              : "Cron executado."
          );

        }

        renderizar(data);

      } catch (erro) {

        setStatus(
          "error",
          erro?.message ||
          "Erro ao executar o cron."
        );

        document.getElementById(
          "dashboard"
        ).style.display =
          "block";

        document.getElementById(
          "json"
        ).textContent =
          String(erro);

      } finally {

        button.disabled = false;

      }

    }

\</script>

\</body>

\</html>`, {

          headers: {
            "Content-Type":
              "text/html; charset=UTF-8"
          }

        });

      }

      // ============================================================
      // TESTE DO ALERTA DE ERRO
      // ============================================================

      if (
        pathname ===
        "/teste-alerta"
      ) {

        if (
          exigirAdmin(
            request,
            env
          )
        ) {

          return json(
            {
              sucesso: false,
              erro:
                "Não autorizado.",
            },
            401
          );

        }

        await enviarAlertaErro(
          env,
          "TESTE MANUAL DO ALERTA",
          new Error(
            "Teste de alerta do DS Garage"
          )
        );

        return json({

          sucesso: true,

          mensagem:
            "Alerta de teste enviado.",

        });

      }

      if (
        pathname ===
        "/teste-sem-oferta"
      ) {

        if (
          exigirAdmin(
            request,
            env
          )
        ) {

          return json(
            {
              sucesso: false,
              erro:
                "Não autorizado.",
            },
            401
          );

        }

        await enviarAlertaSemOferta(
          env,
          {

            categoriasAnalisadas: [

              {
                nome:
                  "Teste",
                produtos:
                  3,
              },

              {
                nome:
                  "Teste 2",
                produtos:
                  3,
              },

            ],

            produtosAnalisados:
              6,

            itensAnalisados:
              5,

            rejeicoes: {

              repetido:
                4,

              produtoNaoRelevante:
                2,

              dadosIncompletos:
                0,

              avaliacao:
                0,

            },

          }
        );

        return json({

          sucesso: true,

          mensagem:
            "Alerta de nenhuma oferta enviado.",

        });

      }

      if (
        pathname ===
        "/teste-wapi"
      ) {

        const erro =
          exigirAdmin(
            request,
            env
          );

        if (erro)
          return erro;

        if (
          !env.WAPI_TOKEN ||
          !env.WAPI_GROUP_ID ||
          !env.WAPI_INSTANCE_ID
        ) {

          return json({

            sucesso: false,

            erro:
              "Configure WAPI_TOKEN, WAPI_GROUP_ID e WAPI_INSTANCE_ID."

          }, 500);

        }

const endpoint =
  WAPI_URL +
  "?instanceId=" +
  encodeURIComponent(
    env.WAPI_INSTANCE_ID
  );

        // Imagem PNG minúscula em Base64.
        // Não depende do Mercado Livre nem de nenhum site externo.

        const imagemTeste =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const legenda =
  "🧪 TESTE DS GARAGE - W-API\n\n" +
  "Se você recebeu esta mensagem, o envio pela W-API está funcionando normalmente.\n\n" +
  "Horário do teste: " +
  new Date().toISOString();

        try {

          const response =
            await fetch(
              endpoint,
              {

                method:
                  "POST",

                headers: {

Authorization:
  "Bearer " +
  env.WAPI_TOKEN,

                  "Content-Type":
                    "application/json",

                },

                body:
                  JSON.stringify({

                    phone:
                      env.WAPI_GROUP_ID,

                    image:
                      imagemTeste,

                    caption:
                      legenda,

                    delayMessage:
                      2,

                  }),

              }
            );

          const texto =
            await response.text();

          return json({

            sucesso:
              response.ok,

            httpStatus:
              response.status,

            endpoint,

            grupo:
              env.WAPI_GROUP_ID,

            respostaWapi:
              texto,

          },
            response.ok
              ? 200
              : 500
          );

        } catch (erro) {

          return json({

            sucesso:
              false,

            erro:
              erro?.message ||
              String(erro),

          }, 500);

        }

      }

      if (
        pathname ===
        "/limpar-historico"
      ) {

        if (
          exigirAdmin(
            request,
            env
          )
        ) {

          return json(
            {
              sucesso: false,
              erro:
                "Não autorizado.",
            },
            401
          );

        }

        const controle =
          await obterControle(
            env
          );

        controle.enviados =
          [];

        controle.recentes =
          [];

        controle.ultimaOferta =
          null;

        await salvarControle(
          env,
          controle
        );

        return json({

          sucesso: true,

          mensagem:
            "Histórico limpo.",

        });

      }

      return json(
        {

          sucesso: false,

          erro:
            "Rota não encontrada.",

        },
        404
      );

    } catch (erro) {

      console.error(
        erro
      );

      return json(
        {

          sucesso: false,

          erro:
            erro.message ||
            "Erro interno.",

        },
        500
      );

    }

  },

  async scheduled(
    event,
    env,
    ctx
  ) {

    if (

      new Date(
        event.scheduledTime
      ).getUTCMinutes() %
        20 !==
      0

    ) {

      return;

    }

    if (
      !horarioPermitido()
    ) {

      console.log(
        "Mercado Livre ignorado: fora do horário permitido de São Paulo."
      );

      return;

    }

    console.log(

      "CRON ML EXECUTANDO",

      new Date(
        event.scheduledTime
      ).toISOString()

    );

    ctx.waitUntil(

      executar(env).catch(

        (erro) =>
          console.error(
            "ERRO CRON ML",
            erro
          )

      )

    );

  },

};
