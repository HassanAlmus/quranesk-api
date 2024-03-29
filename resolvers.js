const surahlist = require("./data/surahinfo.json")
const quran = require("./data/quran.ts")
const text = require('./data/text.json')
const namoonaur = require('./data/tafsirs/namoonaur.ts')
const {embellish, returnRange} = require("./helperFunctions.js")
const maps = require('./data/maps')

const surahs = () => {
    return quran.map((surah, index) => {
        return {
            ... surahlist[index],
            verses: surah.map((verse) => embellish(verse)),
            id: index
        };
    });
};

const surah = ({s, f, t}) => {
    return {
        ... surahlist[s],
        id: s,
        verses: quran[s].filter(
            (v, i, arr) => i >= (f > -1 ? f : 0) && i < (t > -1 ? t + 1 : arr.length)
        ).map((verse) => embellish(verse))
    };
};

const verse = ({s, v, f, t}) => {
    const _s=v===surahlist[s].count?s+1:s;
    const _v=v===surahlist[s].count?0:v;
    return {
        ...embellish(quran[_s][_v]),
        words: quran[_s][_v].words.filter(
            (w, i, arr) => i >= (f > -1 ? f : 0) && i < (t > -1 ? t + 1 : arr.length)
        )
    };
};

const word = ({s, v, w}) => {
    return {
        ... quran[s][v].words[w],
        surah: s + 1,
        verse: v + 1
    };
};

const page = ({p, s}) => {
    if (p === -1 && s !== -1) {
        return quran.flat(1).map((verse) => embellish(verse)).filter(verse => verse.meta.surah === s+1 && verse.meta.page === surahlist[s].startPage)
    } else if (s === -1 && p !== -1) {
        return quran.flat(1).map((verse) => embellish(verse)).filter(verse => verse.meta.page === p)
    } else {
        return quran.flat(1).map((verse) => embellish(verse)).filter(verse => verse.meta.page === p && verse.meta.surah === s+1)
    }
};

const namoonaTopic = ({link}) => {
        const foundTopic = namoonaur.flat(1).find(topic => topic[2] === link)
        return {range: returnRange(foundTopic), title: foundTopic[0], link: foundTopic[2], text: foundTopic[3]}
};

const resolvers = {
    Query: {
        surahs(_parent, _args, _context, _info) {
            return surahs();
        },
        surah(_parent, _args, _context, _info) {
            return surah(_args);
        },
        verse(_parent, _args, _context, _info) {
            return verse(_args);
        },
        word(_parent, _args, _context, _info) {
            return word(_args);
        },
        page(_parent, _args, _context, _info) {
            return page(_args);
        },
        text(_parent, {
            topic
        }, _context, _info) {
            return text[topic];
        },
        maps(_parent, _args, _context, _info) {
            return maps
        },
        namoonaTopic(_parent, _args, _context, _info) {
            return namoonaTopic(_args)
        }
    }
};

module.exports = resolvers