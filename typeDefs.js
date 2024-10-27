const {gql} = require("apollo-server")

const typeDefs = gql`
type Surah {
  id: Int!
  title: String!
  place: String!
  count: Int!
  titleAr: String!
  index: Int!
  startPage: Int!
  endPage: Int!
  juz: [Juz]!
  reciters: RecitersList!
  verses: [Verse!]!
}

type Juz {
  index: String!
  verse: StartEnd!
}

type StartEnd {
  start: String!
  end: String!
}

type NamoonaTopic {
  text: String!
  range: [Int!]!
  link: String!
  title: String!
}

type Verse {
  id: String!
  meta: Meta!
  words: [Word]!
  arabic: String!
  uthmani: String!
  indopak: String!
  puyaen: [String]!
  chinoyen: [String]!
  namoonaur: [NamoonaTopic]!
  enahmedali: String!
  enqarai: String!
  ensarwar: String!
  enchinoy: String!
  enyusufali: String!
  trgolpinarli: String!
  urahmedali: String!
  urnajafi: String!
  urjawadi: String!
  azmammadaliyev: String!
  deaburida: String!
  tjayati: String!
  frfakhri: String!
  hijawadi: String!
  faansarian: String!
  famakarem: String!
  fagharaati: String!
  faghomshei: String!
  fafoolavand: String!
  azmehdiyev: String!
  ruzeynalov: String!
  ursafdar: String!
  famoezzi: String!
  fasadeqi: String!
  famojtabavi: String!
  fabahrampour: String!
  faayati: String!
  fakhorramshahi: String!
  escortes: String!
}

type Meta {
  ayah: Int!
  page: Int!
  surah: Int!
  words: Int!
  tse: [String!]!
}

type Word {
  arabic: String!
  indopak: String!
  uthmani: String!
  niq: Int!
  nis: Int!
  root: String!
  transliteration: String!
  english: String!
  bangla: String!
  hindi: String!
  indonesian: String!
  urdu: String!
  russian: String!
  ingush: String!
  german: String!
  turkish: String!
  ayah: Int!
  surah: Int!
}

type RecitersList {
  AmerAlKadhimi: String!
  MaythamAlTammar: String!
  AhmedAlDabagh: String!
  ShahriarParhizgar: String!
  QassemRedheii: String!
  JawadBanohiTusi: String!
  MahdiSiafZadeh: String!
  MustafaAlSarraf: String!
  MuhammadAliAlDehdeshti: String!
  MuhammadHosseinSaidian: String!
  AbdulKabeerHaidari: String!
  KarimMansouri: String!
}

type Maps {
  translationLanguages: [TranslationLanguage!]!
  audio: [Audio!]!
  tafseers: [Tafseer!]!
}

type TranslationLanguage {
  name: String!
  name2: String!
  img: String!
  translations: [Translation!]!
}

type Translation {
  name: String!
  key: String!
}

type Audio {
  name: String!
  url: String!
  key: String!
  type: String!
}

type Tafseer {
  language: String!
  name: String!
  key: String!
}

type Query {
  surahs: [Surah!]!
  surah(s: Int!, f: Int = -1, t: Int = -1): Surah!
  verse(s: Int!, v: Int!, f: Int = -1, t: Int = -1): Verse!
  word(s: Int!, v: Int!, w: Int!): Word!
  page(p: Int = -1, s: Int = -1): [Verse]!
  text(topic: String!): String!
  maps: Maps!
  namoonaTopic(s: Int, link: String!): NamoonaTopic!
}
`

module.exports = typeDefs