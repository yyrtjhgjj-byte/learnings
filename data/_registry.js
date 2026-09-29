/*
 * コンテンツの受け皿。
 * 各データファイルは classic script として読み込まれ、ここに登録する。
 * （file:// で開いても動くよう、ES Modules や fetch は使わない）
 */
window.LEARN = {
  subjects: {},
  order: ['politics', 'economics', 'ethics', 'geography', 'history', 'physics', 'chemistry', 'biology', 'earth',
          'manners', 'ceremony', 'living', 'why-physics', 'why-life', 'why-earth', 'why-culture', 'vocab'],
  courses: {
    social:  { name: '社会', brand: 'おとなの社会科', sub: '高校社会の基礎', list: '政治・経済・倫理・地理・世界史' },
    science: { name: '理科', brand: 'おとなの理科',   sub: '高校理科の基礎', list: '物理・化学・生物・地学' },
    common:  { name: '常識', brand: 'おとなの常識',   sub: 'マナーとしきたり', list: 'マナーと敬語・冠婚葬祭・暮らしの常識' },
    trivia:  { name: '雑学', brand: 'おとなの雑学',   sub: '「なぜ？」に答える', list: '身のまわりの「なぜ？」と教養の語彙' }
  },
  meta: {
    politics:  { name: '政治', en: 'Politics',  tag: '政', color: 'pol', desc: '憲法・国会・選挙・国際政治。ニュースの土台になる「国の仕組み」。' },
    economics: { name: '経済', en: 'Economics', tag: '経', color: 'eco', desc: '市場・お金・税・景気。給料や物価がどう決まるかの基本。' },
    ethics:    { name: '倫理', en: 'Ethics',    tag: '倫', color: 'eth', desc: 'ソクラテスからロールズまで。人間と社会についての考え方の歴史。' },
    geography: { name: '地理', en: 'Geography', tag: '地', color: 'geo', desc: '地形・気候・産業・地域。世界がなぜ今の形なのかを知る。' },
    history:   { name: '世界史', en: 'World History', tag: '史', color: 'his', desc: '四大文明から冷戦後まで。今の世界につながる大きな流れ。' },
    physics:   { name: '物理', en: 'Physics',   tag: '物', color: 'phy', course: 'science', desc: '力・エネルギー・波・電気・原子。身のまわりの「なぜ動く？なぜ光る？」の答え。' },
    chemistry: { name: '化学', en: 'Chemistry', tag: '化', color: 'chm', course: 'science', desc: '原子・結合・反応。モノが何でできていて、どう変わるのか。' },
    biology:   { name: '生物', en: 'Biology',   tag: '生', color: 'bio', course: 'science', desc: '細胞・遺伝子・免疫・進化・生態系。生き物と自分の体のしくみ。' },
    earth:     { name: '地学', en: 'Earth Science', tag: '宙', color: 'ear', course: 'science', desc: '地震・火山・天気・地球の歴史・宇宙。足もとから星空まで。' },
    manners:   { name: 'マナーと敬語', en: 'Manners', tag: '礼', color: 'man', course: 'common', desc: '敬語・席次・食事・訪問・ビジネス・手紙。場面ごとの「正解」とその理由。' },
    ceremony:  { name: '冠婚葬祭', en: 'Ceremonies', tag: '祝', color: 'cer', course: 'common', desc: '結婚式・葬儀・法事・贈答・年中行事・暦。しきたりの意味を知る。' },
    living:    { name: '暮らしの常識', en: 'Everyday Life', tag: '暮', color: 'liv', course: 'common', desc: '数え方・単位・服装・書類・給与明細・緊急時・祝日・和の文化。' },
    'why-physics': { name: '物理・化学のなぜ', en: 'Why: Physics & Chemistry', tag: '理', course: 'trivia', kind: 'qa', desc: 'シャボン玉はなぜ虹色？ 電子レンジはなぜ温まる？ 身近な現象の「なぜ」。' },
    'why-life':    { name: '体と生き物のなぜ', en: 'Why: Life', tag: '命', course: 'trivia', kind: 'qa', desc: 'お腹はなぜ鳴る？ 玉ねぎでなぜ泣く？ 体と生き物と食べものの「なぜ」。' },
    'why-earth':   { name: '地球と宇宙のなぜ', en: 'Why: Earth & Space', tag: '空', course: 'trivia', kind: 'qa', desc: '海はなぜしょっぱい？ 流れ星はなぜ光る？ 空と大地と宇宙の「なぜ」。' },
    'why-culture': { name: '言葉と文化の雑学', en: 'Words & Culture', tag: '文', course: 'trivia', kind: 'qa', desc: '「々」は漢字？ 忍者は黒装束？ 言葉・歴史・文化の意外な話。' },
    vocab:         { name: '教養の語彙', en: 'Vocabulary', tag: '語', course: 'trivia', kind: 'qa', desc: 'アポリア、止揚、パラダイム。知っていると読書と会話が深まる言葉。' }
  },
  timeline: [],
  people: [],
  diagrams: {},

  /* 同じ科目を複数ファイルに分けて書ける（読み込み順に連結） */
  subject: function (id, units) {
    this.subjects[id] = (this.subjects[id] || []).concat(units);
  },
  events: function (list) {
    Array.prototype.push.apply(this.timeline, list);
  },
  persons: function (list) {
    Array.prototype.push.apply(this.people, list);
  },
  diagram: function (id, svg) {
    this.diagrams[id] = svg;
  }
};
