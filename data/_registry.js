/*
 * コンテンツの受け皿。
 * 各データファイルは classic script として読み込まれ、ここに登録する。
 * （file:// で開いても動くよう、ES Modules や fetch は使わない）
 */
window.LEARN = {
  subjects: {},
  order: ['politics', 'economics', 'ethics', 'geography', 'history'],
  meta: {
    politics:  { name: '政治', en: 'Politics',  tag: '政', color: 'pol', desc: '憲法・国会・選挙・国際政治。ニュースの土台になる「国の仕組み」。' },
    economics: { name: '経済', en: 'Economics', tag: '経', color: 'eco', desc: '市場・お金・税・景気。給料や物価がどう決まるかの基本。' },
    ethics:    { name: '倫理', en: 'Ethics',    tag: '倫', color: 'eth', desc: 'ソクラテスからロールズまで。人間と社会についての考え方の歴史。' },
    geography: { name: '地理', en: 'Geography', tag: '地', color: 'geo', desc: '地形・気候・産業・地域。世界がなぜ今の形なのかを知る。' },
    history:   { name: '世界史', en: 'World History', tag: '史', color: 'his', desc: '四大文明から冷戦後まで。今の世界につながる大きな流れ。' }
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
