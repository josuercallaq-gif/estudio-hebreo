// 1. Función auxiliar (oñembosako'i hagħua hebreo teksto)
function H(texto) {
  return `<span lang="he" dir="rtl">${texto}</span>`;
}

// 2. Lista completa de palabras (Vocabulario II, IV ha V)
const PALABRAS = [
  // Vocabulario II - Sustantivos ha Nombres
  { he: "אִשָּׁה / נָשִׁים", tr: "ishá / nashím", es: "Mujer / mujeres" },
  { he: "לֵב / לֵבָב", tr: "lev / levav", es: "Corazón" },
  { he: "יְהוּדָה / יְהוּדִי", tr: "yehudá / yehudí", es: "Judá / Judío" },
  { he: "כֹּהֵן", tr: "kohén", es: "Sacerdote" },
  { he: "משה", tr: "moshé", es: "Moisés" },
  { he: "חֶרֶב", tr: "jérev", es: "Espada" },
  { he: "נֶפֶשׁ", tr: "néfesh", es: "Vida / alma viviente" },
  { he: "עֶבֶד", tr: "éved", es: "Siervo / esclavo" },
  { he: "שָׁנָה", tr: "shaná", es: "Año" },
  { he: "בת", tr: "bat", es: "Hija" },
  { he: "דֶרֶךְ", tr: "dérej", es: "Camino / senda / costumbre" },
  { he: "מֵאָה", tr: "meá", es: "Cien" },
  { he: "הר", tr: "har", es: "Montaña / cordillera" },
  { he: "מִצְרַיִם / מִצְרִי", tr: "mitzráyim / mitzrí", es: "Egipto / egipcio" },
  { he: "יְרוּשָׁלַם", tr: "yerushaláyim", es: "Jerusalén" },
  { he: "אֶלֶף", tr: "élef", es: "Mil / tribu / clan" },
  
  // Vocabulario II - Verbos
  { he: "לָקַח", tr: "lakáj", es: "Tomar (de beber)" },
  { he: "ידע", tr: "yadá", es: "Saber / notar / conocer" },
  { he: "מות", tr: "mut", es: "Morir" },
  { he: "עָלָה", tr: "alá", es: "Ascender" },
  { he: "קָרָא", tr: "kará", es: "Llamar / encontrar / leer en voz alta" },
  { he: "שלח", tr: "shaláj", es: "Enviar / extender (la mano)" },

  // Vocabulario II - Adjetivos, Pronombres ha Partículas
  { he: "אַתָּה / אַתְּ", tr: "atá / at", es: "Usted / tú" },
  { he: "היא", tr: "hi", es: "Ella" },
  { he: "גָּדוֹל", tr: "gadól", es: "Gran / grande / inmenso" },
  { he: "טוב", tr: "tov", es: "Ser bueno / bueno / bondad" },
  { he: "גם", tr: "gam", es: "También / en verdad / en realidad" },
  { he: "מָה / מֶה / מַה", tr: "mah / meh", es: "¿Por qué? / ¿Cómo?" },
  { he: "כי", tr: "ki", es: "Porque / para / que / cuándo / pero" },
  { he: "שָׁם", tr: "sham", es: "Allí / allá" },
  { he: "כֵּן", tr: "ken", es: "Correctamente / correcto" },

  // Vocabulario IV - Sustantivos ha Nombres
  { he: "נָבִיא", tr: "naví", es: "Profeta" },
  { he: "בְּלִי", tr: "kelí", es: "Recipiente / vasija / utensilio" },
  { he: "חיים / חי", tr: "jayím / jai", es: "Vida / Viviente" },
  { he: "לוי", tr: "leví", es: "Árbol / Leví" },
  { he: "מִלְחָמָה", tr: "miljamá", es: "Guerra / batalla" },
  { he: "מָקוֹם", tr: "makóm", es: "Lugar" },
  { he: "איב / אויב", tr: "oyév", es: "Enemigo" },
  { he: "אֹהֶל", tr: "ójel", es: "Tienda / carpa" },
  { he: "אַהֲרוֹן", tr: "aharón", es: "Aarón" },
  { he: "זָהָב", tr: "zaháv", es: "Oro" },
  { he: "כֶּסֶף", tr: "késef", es: "Plata" },
  { he: "יַעֲקֹב", tr: "yaakóv", es: "Jacob" },
  { he: "אַף", tr: "af", es: "Nariz (enojo / rabia)" },
  { he: "בָּבֶל / בַּבְלָי", tr: "bavél / bavlái", es: "Babilonia / Babilonio" },
  { he: "בְּרִית", tr: "brit", es: "Pacto" },
  { he: "בָּשָׂר", tr: "basár", es: "Carne / persona" },
  { he: "חֹדֶשׁ", tr: "jódesh", es: "Luna nueva / mes" },
  { he: "חטאת", tr: "jatát", es: "Pecado / ofrenda por el pecado" },
  { he: "לֶחֶם", tr: "léjem", es: "Pan" },
  { he: "מִדְבָּר", tr: "midbár", es: "Pastos / desierto / estepa" },
  { he: "מִשְׁפָּחָה", tr: "mishpajá", es: "Familia / clan" },

  // Vocabulario IV - Verbos ha Números
  { he: "ירד", tr: "yarád", es: "Descender" },
  { he: "בָּנָה", tr: "baná", es: "Construir" },
  { he: "ברן", tr: "baráj", es: "Bendecir" },
  { he: "ירא", tr: "yaré", es: "Temer / estar temeroso" },
  { he: "חיה", tr: "jayá", es: "Vivir / sobrevivir" },
  { he: "כרת", tr: "karát", es: "Cortar / exterminar / hacer un pacto" },
  { he: "עָשָׂר", tr: "asár", es: "Diez" },
  { he: "שְׁנַיִם / שְׁתַּיִם", tr: "shnáyim / shtáyim", es: "Dos" },
  { he: "עֶשְׂרִים", tr: "esrím", es: "Veinte" },
  { he: "שָׁלשׁ / שְׁלְשָׁה", tr: "shalósh / shloshá", es: "Tres" },
  { he: "שְׁלשִׁים", tr: "shloshím", es: "Treinta" },
  { he: "אַרְבַּע / אַרְבָּעָה", tr: "arbá / arbáa", es: "Cuatro" },
  { he: "אַרְבַּע / אַרְבָּעִים", tr: "arbaim", es: "Cuarenta" },
  { he: "חָמֵשׁ / חֲמִשָּׁה", tr: "jamésh / jamishá", es: "Cinco" },
  { he: "חֲמִשִׁים", tr: "jamishím", es: "Cincuenta" },
  { he: "שֶׁבַע / שִׁבְעָה", tr: "shéva / shiv'á", es: "Siete" },
  { he: "שבעים", tr: "shiv'ím", es: "Setenta" },
  { he: "אַיִן / אֵין", tr: "áyin / ein", es: "No hay / No existe" },
  { he: "תָּוֶךְ / בְּתוֹךְ", tr: "távej / betój", es: "En medio / dentro" },

  // Vocabulario V - Sustantivos, Nombres ha Verbos
  { he: "עֹלָה", tr: "olá", es: "Holocausto" },
  { he: "עֵת", tr: "et", es: "Tiempo" },
  { he: "פְּלִשְׁתִּי / פְּלֶשֶׁת", tr: "plishtí / peléshet", es: "Filisteo / Filistea" },
  { he: "פַּרְעֹה", tr: "par'ó", es: "Faraón" },
  { he: "צאו / צֹנֶה", tr: "tzón / tzone", es: "Rebaño / manada" },
  { he: "שלמה", tr: "shlomó", es: "Salomón" },
  { he: "אֶבֶן", tr: "éven", es: "Piedra" },
  { he: "אֲדָמָה", tr: "adamá", es: "Suelo / tierra" },
  { he: "אל", tr: "el", es: "El Poderoso / Dios" },
  { he: "אַמָּה", tr: "amá", es: "Antebrazo / codo" },
  { he: "גְבוּל", tr: "gvul", es: "Límites / frontera / territorio" },
  { he: "אברהם / אברם", tr: "avrahám / avrám", es: "Abraham / Abram" },
  { he: "זֶרַע", tr: "zéra", es: "Semilla" },
  { he: "חִיל", tr: "jáil", es: "Poder / riquezas / ejército" },
  { he: "חֶסֶד", tr: "jésed", es: "Lealtad / bondad / amor verdadero" },
  { he: "יְהוֹשׁוֹעַ / יֵשׁוֹעַ", tr: "yehoshúa / yeshúa", es: "Josué / Jesús" },
  { he: "סור", tr: "sur", es: "Girar hacia el lado / desviar" },
  { he: "עָבַד", tr: "avad", es: "Servir" },
  { he: "פָּקַד", tr: "pakad", es: "Visitar / enumerar / cuidar" },
  { he: "קָרַב", tr: "karav", es: "Acercarse / acercar" },
  { he: "בְּקַשׁ", tr: "bikésh", es: "Buscar" },
  { he: "זָכַר", tr: "zajár", es: "Recordar" },
  { he: "חָטָא", tr: "jatá", es: "Perder / pecar" },
  { he: "מאד", tr: "meód", es: "Fuerza / muy / en gran manera" },
  { he: "סָבִיב", tr: "savív", es: "Circuito / en derredor" }
];

// 3. Estructuras vacías o básicas para evitar errores en app.js
const VERSICULOS = [
  { id: 1, he: "בְּרֵאשִׁית בָּרָא אֱלֹהִים", tr: "Bereshit bará Elohim", es: "En el principio creó Dios", ref: "Génesis 1:1" }
];

const LETRAS = [
  ["א", "Álef"], ["ב", "Bet"], ["ג", "Gímel"], ["ד", "Dálet"], ["ה", "He"],
  ["ו", "Vav"], ["ז", "Záyin"], ["ח", "Jet"], ["ט", "Tet"], ["י", "Yod"],
  ["כ", "Kaf"], ["ל", "Lámed"], ["מ", "Mem"], ["נ", "Nun"], ["ס", "Sámej"],
  ["ע", "Áyin"], ["פ", "Pe"], ["צ", "Tzadi"], ["ק", "Kof"], ["ר", "Resh"],
  ["ש", "Shin"], ["ת", "Tav"]
];

const FINALES = [["ך", "Kaf final"], ["ם", "Mem final"], ["ן", "Nun final"], ["ף", "Pe final"], ["ץ", "Tzadi final"]];
const PARECIDAS = { "ב": ["כ"], "ג": ["נ"], "ד": ["ר"], "ה": ["ח", "ת"] };

const VOCALES = [
  { nombre: "Kamatz", sonido: "a", marca: "ָ" },
  { nombre: "Patach", sonido: "a", marca: "ַ" },
  { nombre: "Tzere", sonido: "e", marca: "ֵ" },
  { nombre: "Segol", sonido: "e", marca: "ֶ" },
  { nombre: "Jirik", sonido: "i", marca: "ִ" },
  { nombre: "Jolam", sonido: "o", marca: "ֹ" },
  { nombre: "Kubutz", sonido: "u", marca: "ֻ" }
];

const PRONOMBRES = [
  ["אֲנִי", "aní", "Yo"],
  ["אַתָּה", "atá", "Tú (masculino)"],
  ["אַתְּ", "at", "Tú (femenino)"],
  ["הוּא", "hu", "Él"],
  ["הִיא", "hi", "Ella"]
];

const VERBOS = [
  {
    inf: "לִלְמֹד", infTr: "lilmod", es: "Aprender", raiz: "למד",
    presente: [["לוֹמֵד", "loméd", "Aprende (m.s)"], ["לוֹמֶדֶת", "lomédet", "Aprende (f.s)"]],
    pasado: [["לָמַדְתִּי", "lamádti", "Yo aprendí"], ["לָמַדְתָּ", "lamádta", "Tú aprendiste"]],
    futuro: [["אֶלְמַד", "elmad", "Yo aprenderé"], ["תִּלְמַד", "tilmad", "Tú aprenderás"]]
  }
];

const RAICES = [
  {
    raiz: "כתב", idea: "Escribir",
    familia: [["כָּתַב", "katáv", "Escribió"], ["מִכְתָּב", "michtáv", "Carta"]]
  }
];

const EJ_GRAMATICA = {
  pronombres: [
    { instruccion: "¿Qué significa אֲנִי?", opciones: ["Yo", "Tú", "Él"], correcta: 0 }
  ],
  verbos: [
    { instruccion: "¿Cómo se dice 'Aprender'?", opciones: ["לִלְמֹד", "לִכְתֹּב"], correcta: 0, opcionesHe: true }
  ],
  raices: [
    { instruccion: "¿Qué idea expresa כתב?", opciones: ["Escribir", "Leer"], correcta: 0 }
  ]
};