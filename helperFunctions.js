const enahmedali = require("./data/translations/en.ahmedali.json");
const enqarai = require("./data/translations/en.qarai.json");
const ensarwar = require("./data/translations/en.sarwar.json");
const enyusufali = require("./data/translations/en.yusufali.json");
const enchinoy = require("./data/translations/en.chinoy.json");
const trgolpinarli = require("./data/translations/tr.golpinarli.json");
const urahmedali = require("./data/translations/ur.ahmedali.json");
const urjawadi = require("./data/translations/ur.jawadi.json");
const urnajafi = require("./data/translations/ur.najafi.json");
const ursafdar = require('./data/translations/ur.safdar.json');
const azmammadaliyev = require("./data/translations/az.mammadaliyev.json");
const azmehdiyev = require("./data/translations/az.mehdiyev.json");
const deaburida = require("./data/translations/de.aburida.json");
const ruzeynalov = require("./data/translations/ru.zeynalov.json");
const tjayati = require("./data/translations/tj.ayati.json");
const fagharaati = require("./data/translations/fa.gharaati.json");
const faansarian = require("./data/translations/fa.ansarian.json");
const famakarem = require("./data/translations/fa.makarem.json");
const faghomshei = require("./data/translations/fa.ghomshei.json");
const fafoolavand = require("./data/translations/fa.foolavand.json");
const frfakhri = require("./data/translations/fr.fakhri.json");
const hijawadi = require("./data/translations/hi.jawadi.json");
const puya = require("./data/tafsirs/puya.json");
const chinoy = require("./data/tafsirs/chinoy.json");
const namoonaur = require('./data/tafsirs/namoonaur.json');
const faayati = require('./data/translations/fa.ayati.json');
const fakhorramdel = require('./data/translations/fa.khorramdel.json');
const fakhorramshahi = require('./data/translations/fa.khorramshahi.json');
const fabahrampour = require('./data/translations/fa.bahrampour.json');
const famoezzi = require('./data/translations/fa.moezzi.json');
const fasadeqi = require('./data/translations/fa.sadeqi.json');
const famojtabavi = require('./data/translations/fa.mojtabavi.json');
const khorramdelfa = require('./data/tafsirs/khorramdel.json');

const translations = [
    [
        enahmedali, "enahmedali"
    ],
    [
        enqarai, "enqarai"
    ],
    [
        ensarwar, "ensarwar"
    ],
    [
        enyusufali, "enyusufali"
    ],
    [
        enchinoy, "enchinoy"
    ],
    [
        trgolpinarli, "trgolpinarli"
    ],
    [
        urahmedali, "urahmedali"
    ],
    [
        urjawadi, "urjawadi"
    ],
    [
        urnajafi, "urnajafi"
    ],
    [
        azmammadaliyev, "azmammadaliyev"
    ],
    [
        deaburida, "deaburida"
    ],
    [
        tjayati, "tjayati"
    ],
    [
        fagharaati, "fagharaati"
    ],
    [
        famakarem, "famakarem"
    ],
    [
        faghomshei, "faghomshei"
    ],
    [
        faansarian, "faansarian"
    ],
    [
        frfakhri, "frfakhri"
    ],
    [
        fafoolavand, "fafoolavand"
    ],
    [
        azmehdiyev, "azmehdiyev"
    ],
    [
        hijawadi, "hijawadi"
    ],
    [
        ursafdar, "ursafdar"
    ],
    [
        famoezzi, "famoezzi"
    ],
    [
        faayati, "faayati"
    ],
    [
        fakhorramdel, "fakhorramdel"
    ],
    [
        fakhorramshahi, "fakhorramshahi"
    ],
    [
        fasadeqi, "fasadeqi"
    ],
    [
        fabahrampour, "fabahrampour"
    ],
    [
        famojtabavi, "famojtabavi"
    ],
    [
        ruzeynalov, "ruzeynalov"
    ]
];

const retrunIsMinusOneList = l => l[0] === -1 && l[1] === -1;

const returnRange = topic => topic[1] === '-' ? [-1, -1] : topic[1].split('-').map(n => Number(n) - 1)

const findNamoona = (s, v) => namoonaur[s].filter(topic => v === 0 ? (retrunIsMinusOneList(returnRange(topic)) || (returnRange(topic) !== [-1, -1] && (returnRange(topic)[1] >= v && returnRange(topic)[0] <= v))) : (returnRange(topic) !== [-1, -1] && (returnRange(topic)[1] >= v && returnRange(topic)[0] <= v)))

const embellish = (obj) => {
    const si = obj.meta.surah - 1;
    const vi = obj.meta.ayah - 1;
    const chinoykey = Object.keys(chinoy).find((key) => {
        return(Number(key.split("-")[0]) === si && Number(key.split("-")[1]) <= vi && Number(key.split("-")[2]) >= vi);
    });
    for (const trans of translations) {
        obj[trans[1]] = trans[0][si][vi];
    }
    obj.puyaen = [
        `${si}-${vi}-${vi}`, puya[si][vi].text
    ];
    obj.chinoyen = [
        chinoykey, chinoy[chinoykey]
    ];
    obj.namoonaur = findNamoona(si, vi).map(topic => {
        return {range: returnRange(topic), title: topic[0], link: topic[2], text: topic[3]}
    })
    obj.khorramdelfa = khorramdelfa[si][vi]
    obj.uthmani = obj.words.map((w) => w.uthmani).join(" ");
    obj.indopak = obj.words.map((w) => w.indopak).join(" ");
    obj.arabic = obj.words.map((w) => w.arabic).join(" ");
    obj.id = `${si}-${vi}`
    return obj;
};

module.exports = {embellish, returnRange}