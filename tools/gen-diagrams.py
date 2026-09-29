# 図解 SVG を生成して data/diagrams.js に書き出す（python3 tools/gen-diagrams.py）
# 図解 SVG を生成して data/diagrams.js に書き出す
import math

def marker(mid, cls='fg-ink2'):
    return (f'<defs><marker id="{mid}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="{cls}"/></marker></defs>')

def t(x, y, s, size=13, anchor='middle', cls='fg-ink', weight=None, halo=False):
    w = f' font-weight="{weight}"' if weight else ''
    c = cls + (' halo' if halo else '')
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="{anchor}" class="{c}"{w}>{s}</text>'

def line(x1, y1, x2, y2, cls='st-ink2', w=1.6, dash=None, start=None, end=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    ms = f' marker-start="url(#{start})"' if start else ''
    me = f' marker-end="url(#{end})"' if end else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="{cls}" stroke-width="{w}"{d}{ms}{me}/>'

def rect(x, y, w, h, cls='fg-soft', stroke='st-s', rx=8):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" class="{cls}"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" class="{stroke}" stroke-width="1.6"/>'

def small_marker(mid):
    return (f'<defs><marker id="{mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" '
            f'orient="auto"><path d="M0,0L10,5L0,10z" class="fg-ink"/></marker></defs>')

def atext(x, y, s, vec, mid, size=12, anchor='start'):
    import math as _m
    w = len(s) * size
    left = x - w if anchor == 'end' else x + 18
    vx, vy = vec
    n = _m.hypot(vx, vy); vx, vy = vx / n * 6, vy / n * 6
    cx, cy = left - 10, y - size * 0.36
    return (line(cx - vx, cy - vy, cx + vx, cy + vy, cls='st-ink', w=1.5, end=mid) +
            t(left, y, s, size, anchor='start'))

def svg(w, h, label, body):
    return f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{label}">' + ''.join(body) + '</svg>'

D = {}

# ---------- 三権分立 ----------
b = [marker('ah-sk')]
# 辺（両向き矢印）
b.append(line(163, 62, 88, 312, w=1.8, start='ah-sk', end='ah-sk'))
b.append(line(277, 62, 352, 312, w=1.8, start='ah-sk', end='ah-sk'))
b.append(line(136, 341, 304, 341, w=1.8, start='ah-sk', end='ah-sk'))
# 国民からの矢印
b.append(line(220, 214, 220, 64, dash='4 4', end='ah-sk'))
b.append(line(196, 274, 122, 314, dash='4 4', end='ah-sk'))
b.append(line(244, 274, 318, 314, dash='4 4', end='ah-sk'))
# 箱
b.append(rect(150, 12, 140, 48)); b.append(t(220, 36, '国会', 16, weight=700)); b.append(t(220, 53, '立法権', 11, cls='fg-ink2'))
b.append(rect(12, 318, 124, 48)); b.append(t(74, 342, '内閣', 16, weight=700)); b.append(t(74, 359, '行政権', 11, cls='fg-ink2'))
b.append(rect(304, 318, 124, 48)); b.append(t(366, 342, '裁判所', 16, weight=700)); b.append(t(366, 359, '司法権', 11, cls='fg-ink2'))
b.append('<circle cx="220" cy="246" r="32" class="fg-s"/>'); b.append(t(220, 251, '国民', 15, cls='fg-card', weight=700))
# 左辺の説明（外側）
b.append(small_marker('as-sk'))
for i, (txt, v) in enumerate([('首相の指名', (-75, 250)), ('内閣不信任の決議', (-75, 250)), ('衆議院の解散', (75, -250)), ('国会の召集', (75, -250))]):
    y = 150 + i * 19
    x = 163 - (y - 62) * (75 / 250) - 10
    b.append(atext(x, y, txt, v, 'as-sk', 12, anchor='end'))
for i, (txt, v) in enumerate([('弾劾裁判', (75, 250)), ('違憲立法審査', (-75, -250))]):
    y = 160 + i * 19
    x = 277 + (y - 62) * (75 / 250) + 6
    b.append(atext(x, y, txt, v, 'as-sk', 12, anchor='start'))
b.append(t(220, 388, '→ 最高裁長官の指名・裁判官の任命', 12))
b.append(t(220, 406, '← 命令・規則・処分の違憲審査', 12))
b.append(t(228, 140, '選挙', 12, anchor='start', cls='fg-ink2', halo=True))
b.append(t(152, 284, '世論', 12, anchor='end', cls='fg-ink2', halo=True))
b.append(t(288, 284, '国民審査', 12, anchor='start', cls='fg-ink2', halo=True))
D['sanken'] = svg(440, 416, '三権分立の図。国会・内閣・裁判所が互いに抑制し合い、国民が選挙・世論・国民審査で関わる', b)

# ---------- 需要と供給 ----------
b = [marker('ah-sd')]
ox, oy = 56, 290
b.append(line(ox, oy, 426, oy, cls='st-ink', w=1.4, end='ah-sd'))
b.append(line(ox, oy, ox, 20, cls='st-ink', w=1.4, end='ah-sd'))
b.append(t(ox, 14, '価格', 12, cls='fg-ink2'))
b.append(t(426, 310, '数量', 12, anchor='end', cls='fg-ink2'))
m = 210 / 290
Dx = lambda y: 80 + (y - 50) / m
Sx = lambda y: 80 + (260 - y) / m
ex, ey = 225, 155
b.append(line(ex, ey, ox, ey, dash='4 4', w=1.2))
b.append(line(ex, ey, ex, oy, dash='4 4', w=1.2))
b.append(line(Dx(95), 95, Sx(95), 95, cls='st-pen', w=1.4, dash='2 3'))
b.append(line(Sx(215), 215, Dx(215), 215, cls='st-pen', w=1.4, dash='2 3'))
b.append(line(80, 50, 370, 260, cls='st-s', w=3))
b.append(line(80, 260, 370, 50, cls='st-pen', w=3))
b.append(f'<circle cx="{ex}" cy="{ey}" r="5" class="fg-ink"/>')
b.append(t(376, 266, '需要曲線', 12, anchor='start', cls='fg-s', weight=700))
b.append(t(376, 54, '供給曲線', 12, anchor='start', cls='fg-pen', weight=700))
b.append(t(52, 159, '均衡価格', 12, anchor='end'))
b.append(t(ex, 308, '均衡数量', 12))
b.append(t(ex + 10, ey + 4, '均衡点', 12, anchor='start', halo=True))
b.append(t(225, 86, '超過供給（売れ残り）→ 値下がり', 12, cls='fg-ink', halo=True))
b.append(t(225, 234, '超過需要（品不足）→ 値上がり', 12, cls='fg-ink', halo=True))
D['supply-demand'] = svg(440, 318, '需要曲線と供給曲線が交わる点で均衡価格が決まる図', b)

# ---------- 景気循環 ----------
b = []
x0, L = 40, 250
def wy(x):
    return 150 - 0.1 * (x - x0) + 52 * math.cos(2 * math.pi * (x - x0) / L)
phases = ['回復', '好況', '後退', '不況', '回復', '好況']
edges = [x0 + L / 4 * i for i in range(7)]
for i, name in enumerate(phases):
    a, c = edges[i], edges[i + 1]
    cls = 'fg-soft' if name == '好況' else ('fg-paper' if name == '不況' else None)
    if cls:
        b.append(f'<rect x="{a:.1f}" y="34" width="{c - a:.1f}" height="186" class="{cls}"/>')
    b.append(t((a + c) / 2, 26, name, 13, weight=700, cls='fg-s' if name in ('好況', '回復') else 'fg-ink2'))
for x in edges[1:-1]:
    b.append(line(x, 34, x, 220, cls='st-rule', w=1))
pts = ' '.join(f'{x:.1f},{wy(x):.1f}' for x in [x0 + i * 2.5 for i in range(int((edges[-1] - x0) / 2.5) + 1)])
b.append(f'<line x1="{x0}" y1="150" x2="{edges[-1]}" y2="{150 - 0.1 * (edges[-1] - x0):.1f}" class="st-ink2" stroke-width="1.2" stroke-dasharray="5 4"/>')
b.append(f'<polyline points="{pts}" class="st-s" stroke-width="3" stroke-linejoin="round"/>')
for xp, lab, dy in [(x0 + L / 2, '山', -12), (x0 + L * 1.5, '山', -12), (x0 + L, '谷', 24), (x0, '谷', 24)]:
    b.append(f'<circle cx="{xp:.1f}" cy="{wy(xp):.1f}" r="4" class="fg-ink"/>')
    b.append(t(xp + (8 if xp == x0 else 0), wy(xp) + dy, lab, 13, weight=700, halo=True))
b.append(line(30, 220, 432, 220, cls='st-ink', w=1.2))
b.append(t(432, 238, '時間 →', 12, anchor='end', cls='fg-ink2'))
b.append(t(edges[-1] - 4, 150 - 0.1 * (edges[-1] - x0) + 18, '長期的な成長の傾向', 11, anchor='end', cls='fg-ink2', halo=True))
D['business-cycle'] = svg(440, 244, '景気循環の図。回復・好況・後退・不況をくり返しながら長期的には成長する', b)

# ---------- 経済循環 ----------
b = [marker('ah-cf')]
b.append(line(136, 296, 304, 296, cls='st-ink', w=1.8, end='ah-cf'))
b.append(line(304, 320, 136, 320, cls='st-ink', w=1.8, end='ah-cf'))
b.append(line(66, 278, 162, 62, w=1.8, end='ah-cf'))
b.append(line(174, 64, 82, 282, w=1.8, end='ah-cf'))
b.append(line(374, 278, 278, 62, w=1.8, end='ah-cf'))
b.append(line(266, 64, 358, 282, w=1.8, end='ah-cf'))
b.append(line(128, 282, 176, 196, dash='4 4', w=1.4, end='ah-cf'))
b.append(line(264, 196, 312, 282, dash='4 4', w=1.4, end='ah-cf'))
b.append(rect(160, 12, 120, 48)); b.append(t(220, 42, '政府', 16, weight=700))
b.append(rect(12, 284, 124, 50)); b.append(t(74, 315, '家計', 16, weight=700))
b.append(rect(304, 284, 124, 50)); b.append(t(366, 315, '企業', 16, weight=700))
b.append(rect(172, 156, 96, 38, cls='fg-card', stroke='st-ink2')); b.append(t(220, 180, '金融機関', 13, weight=700))
b.append(t(220, 287, '労働力・消費の代金', 12))
b.append(t(220, 340, '賃金・財やサービス', 12))
b.append(small_marker('as-cf'))
b.append(atext(118, 128, '税金', (96, -216), 'as-cf', 12, anchor='end'))
b.append(atext(96, 170, '公共サービス', (-92, 218), 'as-cf', 12, anchor='end'))
b.append(t(96, 186, '社会保障', 12, anchor='end'))
b.append(atext(318, 128, '税金', (-96, -216), 'as-cf', 12, anchor='start'))
b.append(atext(340, 170, '公共サービス', (92, 218), 'as-cf', 12, anchor='start'))
b.append(t(358, 186, '補助金', 12, anchor='start'))
b.append(t(146, 244, '預金', 12, anchor='end', cls='fg-ink2', halo=True))
b.append(t(294, 244, '融資', 12, anchor='start', cls='fg-ink2', halo=True))
D['circular-flow'] = svg(440, 350, '家計・企業・政府のあいだでお金と財・サービスが循環する図', b)

# ---------- マズロー ----------
b = []
ax, ay, bw, bh = 170, 14, 160, 272
hw = lambda y: bw * (y - ay) / bh
names = [('自己実現', ''), ('承認の欲求', '認められたい'), ('所属と愛の欲求', '仲間がほしい'), ('安全の欲求', '安心して暮らしたい'), ('生理的欲求', '食べる・眠る')]
step = bh / 5
for i, (n, sub) in enumerate(names):
    y1, y2 = ay + step * i, ay + step * (i + 1)
    if i == 0:
        pts = f'{ax},{y1:.1f} {ax + hw(y2):.1f},{y2:.1f} {ax - hw(y2):.1f},{y2:.1f}'
    else:
        pts = f'{ax - hw(y1):.1f},{y1:.1f} {ax + hw(y1):.1f},{y1:.1f} {ax + hw(y2):.1f},{y2:.1f} {ax - hw(y2):.1f},{y2:.1f}'
    fill = 'fg-s' if i == 0 else 'fg-soft'
    b.append(f'<polygon points="{pts}" class="{fill}"/><polygon points="{pts}" class="st-s" stroke-width="1.5"/>')
    if i == 0:
        b.append(t(ax, y2 - 10, n, 11, cls='fg-card', weight=700))
    else:
        b.append(t(ax, (y1 + y2) / 2 + (0 if sub else 5), n, 13, weight=700))
        if sub:
            b.append(t(ax, (y1 + y2) / 2 + 16, sub, 10.5, cls='fg-ink2'))
def bracket(x, y1, y2, label, sub):
    return [f'<path d="M{x},{y1 + 2} h8 V{y2 - 2} h-8" class="st-ink2" stroke-width="1.4"/>',
            t(x + 16, (y1 + y2) / 2 - 2, label, 13, anchor='start', weight=700),
            t(x + 16, (y1 + y2) / 2 + 14, sub, 10.5, anchor='start', cls='fg-ink2')]
b += bracket(348, ay, ay + step, '成長欲求', '上をめざす')
b += bracket(348, ay + step, ay + bh, '欠乏欲求', '足りないと不満')
b.append(line(20, 270, 20, 40, dash='3 4', w=1.2))
b.append(f'<path d="M14,48 L20,36 L26,48" class="st-ink2" stroke-width="1.4"/>')
D['maslow'] = svg(440, 296, 'マズローの欲求階層。下から生理的欲求・安全・所属と愛・承認・自己実現', b)

# ---------- 弁証法 ----------
b = [marker('ah-dl')]
b.append(line(96, 206, 178, 150, w=1.8, end='ah-dl'))
b.append(line(344, 206, 262, 150, w=1.8, end='ah-dl'))
b.append(line(172, 244, 268, 244, cls='st-pen', w=1.8, start='ah-dl', end='ah-dl'))
b.append(line(220, 86, 220, 30, dash='4 4', w=1.6, end='ah-dl'))
b.append(rect(20, 210, 152, 66)); b.append(t(96, 236, '正（テーゼ）', 14, weight=700)); b.append(t(96, 258, '例：つぼみ', 12, cls='fg-ink2'))
b.append(rect(268, 210, 152, 66)); b.append(t(344, 236, '反（アンチテーゼ）', 14, weight=700)); b.append(t(344, 258, '例：花（つぼみを否定）', 12, cls='fg-ink2'))
b.append(rect(140, 88, 160, 62, cls='fg-s', stroke='st-s')); b.append(t(220, 114, '合（ジンテーゼ）', 14, cls='fg-card', weight=700)); b.append(t(220, 136, '例：実（両方を生かす）', 12, cls='fg-card'))
b.append(t(220, 268, '対立・矛盾', 12, cls='fg-pen', weight=700))
b.append(t(220, 190, '止揚（アウフヘーベン）', 12, weight=700, halo=True))
b.append(t(230, 22, '合が新たな「正」となり、さらに発展', 12, anchor='start', cls='fg-ink2'))
D['dialectic'] = svg(440, 290, 'ヘーゲルの弁証法。正と反の対立を止揚して合に至り、それが新たな正になる', b)

# ---------- 人口ピラミッド ----------
b = []
types = [
    ('富士山型', '多産多死・途上国', [1.0, .9, .8, .7, .6, .5, .4, .3, .2, .1]),
    ('釣鐘型', '少産少死・先進国', [.78, .8, .8, .8, .78, .75, .7, .6, .45, .25]),
    ('つぼ型', '少子化が進む国（日本など）', [.44, .5, .56, .64, .76, .86, .9, .82, .62, .35]),
]
for k, (name, sub, ws) in enumerate(types):
    cx = 92 + 134 * k
    for i, f in enumerate(ws):
        y = 196 - i * 16
        w = 54 * f
        b.append(f'<rect x="{cx - w - 1:.1f}" y="{y}" width="{w:.1f}" height="13" rx="2" class="fg-s"/>')
        b.append(f'<rect x="{cx + 1}" y="{y}" width="{w:.1f}" height="13" rx="2" class="fg-soft2"/><rect x="{cx + 1}" y="{y}" width="{w:.1f}" height="13" rx="2" class="st-pen" stroke-width="1"/>')
    b.append(t(cx, 232, name, 14, weight=700))
    b.append(t(cx, 250, sub, 10.5, cls='fg-ink2'))
b.append(t(4, 60, '高齢', 10.5, anchor='start', cls='fg-ink2'))
b.append(t(4, 206, '年少', 10.5, anchor='start', cls='fg-ink2'))
b.append(line(14, 190, 14, 70, w=1.2, dash='3 3'))
b.append(t(80, 38, '男', 11, cls='fg-ink2')); b.append(t(104, 38, '女', 11, cls='fg-ink2'))
D['pop-pyramid'] = svg(440, 258, '人口ピラミッドの3つの型。富士山型・釣鐘型・つぼ型', b)

# ---------- 河川の地形 ----------
b = []
prof = [(0, 22), (18, 46), (40, 92), (70, 146), (100, 170), (130, 186), (160, 196), (190, 203), (260, 212), (330, 221), (372, 227), (402, 234), (422, 246), (440, 254)]
b.append('<rect x="398" y="233" width="42" height="67" class="fg-sea"/>')
poly = ' '.join(f'{x},{y}' for x, y in prof) + ' 440,300 0,300'
b.append(f'<polygon points="{poly}" class="fg-soft"/>')
b.append('<polyline points="' + ' '.join(f'{x},{y}' for x, y in prof) + '" class="st-s" stroke-width="2.4" stroke-linejoin="round"/>')
b.append(line(398, 233, 440, 233, cls='st-ink2', w=1.2, dash='3 3'))
for x in (70, 190, 330, 400):
    b.append(line(x, 40, x, 300, cls='st-rule', w=1, dash='3 4'))
for x, name in [(40, 'V字谷'), (130, '扇状地'), (260, '氾濫原'), (365, '三角州'), (420, '海')]:
    b.append(t(x, 30, name, 13, weight=700, cls='fg-s' if name != '海' else 'fg-ink2'))
b.append(t(130, 50, '山地から平地へ', 10.5, cls='fg-ink2'))
b.append(t(260, 50, '川がくり返しあふれる', 10.5, cls='fg-ink2'))
b.append(t(365, 50, '河口', 10.5, cls='fg-ink2'))
notes = [
    (40, 150, ['川が山地を', '深く削る']),
    (130, 222, ['扇央：水が地下へ', '→畑・果樹園', '扇端：湧水→集落']),
    (260, 236, ['自然堤防', '→集落・畑', '後背湿地→水田']),
    (365, 250, ['低く平ら', '→水田・都市']),
]
for x, y, ls in notes:
    for i, s in enumerate(ls):
        b.append(t(x, y + i * 16, s, 11))
b.append(t(420, 272, '海', 11, cls='fg-ink2'))
b.append(t(8, 290, '上流', 10.5, anchor='start', cls='fg-ink2'))
b.append(t(392, 290, '下流', 10.5, anchor='end', cls='fg-ink2'))
D['river-landforms'] = svg(440, 300, '川が上流から下流へつくる地形。V字谷・扇状地・氾濫原・三角州', b)

# ---------- 大気大循環 ----------
b = [marker('ah-pb')]
Y = {90: 22, 60: 82, 30: 142, 0: 202, -30: 262, -60: 322, -90: 382}
bands = [(90, '高', '極高圧帯', '寒冷で乾燥'), (60, '低', '亜寒帯低圧帯', '上昇気流→雨が多い'), (30, '高', '亜熱帯高圧帯', '下降気流→乾燥・砂漠'),
         (0, '低', '赤道低圧帯', '上昇気流→多雨・熱帯雨林'), (-30, '高', '亜熱帯高圧帯', '下降気流→乾燥・砂漠'), (-60, '低', '亜寒帯低圧帯', '上昇気流→雨が多い'), (-90, '高', '極高圧帯', '寒冷で乾燥')]
for lat, hl, name, eff in bands:
    y = Y[lat]
    cls = 'fg-soft' if hl == '高' else 'fg-soft2'
    b.append(f'<rect x="62" y="{y - 9}" width="186" height="18" rx="4" class="{cls}"/>')
    b.append(t(155, y + 5, hl, 12, weight=700, cls='fg-s' if hl == '高' else 'fg-pen'))
    lab = '赤道' if lat == 0 else (f'北緯{lat}°' if lat > 0 else f'南緯{-lat}°')
    b.append(t(56, y + 4, lab, 11, anchor='end', cls='fg-ink2'))
    b.append(t(260, y + 0, name, 12.5, anchor='start', weight=700))
    b.append(t(260, y + 15, eff, 10.5, anchor='start', cls='fg-ink2'))
winds = [
    (52, '極偏東風', 'ld'), (112, '偏西風', 'ru'), (172, '北東貿易風', 'ld'),
    (232, '南東貿易風', 'lu'), (292, '偏西風', 'rd'), (352, '極偏東風', 'lu'),
]
for y, name, d in winds:
    for x in (92, 222):
        dx = 26 if d[0] == 'r' else -26
        dy = -14 if d[1] == 'u' else 14
        b.append(line(x - dx / 2, y - dy / 2, x + dx / 2, y + dy / 2, cls='st-ink', w=1.8, end='ah-pb'))
    b.append(t(157, y + 4, name, 12, weight=700, halo=True))
D['pressure-belts'] = svg(440, 400, '地球の気圧帯と恒常風。赤道低圧帯・亜熱帯高圧帯・亜寒帯低圧帯・極高圧帯と、貿易風・偏西風・極偏東風', b)


# ================= 理科 =================
# ---------- 原子の構造（炭素） ----------
b = []
cx, cy = 150, 150
for r in (58, 108):
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" class="st-ink2" stroke-width="1.2" stroke-dasharray="4 4"/>')
nuc = [(-7,-7,'p'),(7,-7,'n'),(-7,7,'n'),(7,7,'p'),(0,-14,'p'),(0,14,'n'),(-14,0,'p'),(14,0,'n'),(-12,-12,'n'),(12,12,'p'),(12,-12,'p'),(-12,12,'n')]
for dx, dy, k in nuc:
    cls = 'fg-s' if k == 'p' else 'fg-soft'
    b.append(f'<circle cx="{cx+dx}" cy="{cy+dy}" r="7" class="{cls}"/><circle cx="{cx+dx}" cy="{cy+dy}" r="7" class="st-s" stroke-width="1"/>')
import math as _m
for r, n, off in ((58, 2, 90), (108, 4, 45)):
    for i in range(n):
        a = _m.radians(off + 360 / n * i)
        ex, ey = cx + r * _m.cos(a), cy + r * _m.sin(a)
        b.append(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="6" class="fg-pen"/>')
b.append(t(cx, cy + 74, 'K殻', 11, cls='fg-ink2', halo=True))
b.append(t(cx, cy + 124, 'L殻', 11, cls='fg-ink2', halo=True))
lx = 292
b.append(f'<circle cx="{lx}" cy="40" r="7" class="fg-s"/>'); b.append(t(lx + 14, 45, '陽子（＋）× 6', 12.5, anchor='start'))
b.append(f'<circle cx="{lx}" cy="66" r="7" class="fg-soft"/><circle cx="{lx}" cy="66" r="7" class="st-s" stroke-width="1"/>'); b.append(t(lx + 14, 71, '中性子 × 6', 12.5, anchor='start'))
b.append(f'<circle cx="{lx}" cy="92" r="6" class="fg-pen"/>'); b.append(t(lx + 14, 97, '電子（−）× 6', 12.5, anchor='start'))
b.append(t(lx - 8, 136, '炭素原子 ¹²C', 13, anchor='start', weight=700))
b.append(t(lx - 8, 156, '原子番号 6＝陽子の数', 11, anchor='start', cls='fg-ink2'))
b.append(t(lx - 8, 172, '質量数 12＝陽子＋中性子', 11, anchor='start', cls='fg-ink2'))
b.append(t(lx - 8, 212, '※実際の原子核は', 10.5, anchor='start', cls='fg-ink2'))
b.append(t(lx - 8, 227, '原子の約10万分の1の', 10.5, anchor='start', cls='fg-ink2'))
b.append(t(lx - 8, 242, '大きさしかない', 10.5, anchor='start', cls='fg-ink2'))
b.append(line(cx + 20, cy - 16, 268, 118, cls='st-ink2', w=1))
b.append(t(270, 116, '原子核', 11, anchor='end', cls='fg-ink2', halo=True))
D['atom'] = svg(440, 280, '炭素原子の構造。中心の原子核に陽子6個と中性子6個、まわりの電子殻に電子6個', b)

# ---------- 三態変化 ----------
b = [marker('ah-st'), small_marker('as-st')]
def particles(x0, y0, kind):
    out = []
    if kind == 'solid':
        for i in range(4):
            for j in range(3):
                out.append(f'<circle cx="{x0 + 14 + i * 16}" cy="{y0 + 14 + j * 14}" r="5.5" class="fg-s"/>')
    elif kind == 'liquid':
        pts = [(12,16),(28,12),(46,18),(62,12),(18,32),(36,30),(54,34),(70,28),(26,46),(44,46),(60,48)]
        for px, py in pts: out.append(f'<circle cx="{x0 + px}" cy="{y0 + py}" r="5.5" class="fg-s"/>')
    else:
        pts = [(10,12),(52,8),(30,34),(70,40),(14,50)]
        for px, py in pts: out.append(f'<circle cx="{x0 + px}" cy="{y0 + py}" r="5.5" class="fg-s"/>')
    return out
boxes = {'gas': (170, 14), 'solid': (20, 222), 'liquid': (320, 222)}
names = {'gas': '気体', 'solid': '固体', 'liquid': '液体'}
for k, (x, y) in boxes.items():
    b.append(rect(x, y, 100, 76, cls='fg-card', stroke='st-s'))
    b += particles(x + 10, y + 6, k)
    b.append(t(x + 50, y + 94, names[k], 14, weight=700))
# 固体⇄液体
b.append(line(124, 250, 316, 250, cls='st-ink', w=1.8, end='ah-st'))
b.append(line(316, 272, 124, 272, cls='st-ink', w=1.8, end='ah-st'))
b.append(t(220, 238, '融解（とける）', 12))
b.append(t(220, 290, '凝固（かたまる）', 12))
# 液体⇄気体
b.append(line(352, 218, 262, 94, cls='st-ink', w=1.8, end='ah-st'))
b.append(line(274, 88, 366, 216, cls='st-ink', w=1.8, end='ah-st'))
b.append(atext(318, 142, '蒸発・沸騰', (-90, -124), 'as-st', 12, anchor='start'))
b.append(atext(340, 164, '凝縮', (92, 128), 'as-st', 12, anchor='start'))
# 固体⇄気体
b.append(line(74, 218, 166, 92, cls='st-ink', w=1.8, end='ah-st'))
b.append(line(178, 96, 88, 220, cls='st-ink', w=1.8, end='ah-st'))
b.append(atext(104, 142, '昇華', (92, -126), 'as-st', 12, anchor='end'))
b.append(atext(94, 164, '凝華', (-90, 124), 'as-st', 12, anchor='end'))
b.append(t(220, 150, '融解・蒸発・昇華は', 11, cls='fg-pen', weight=700))
b.append(t(220, 166, '熱を吸収する', 11, cls='fg-pen', weight=700))
D['states'] = svg(440, 320, '物質の三態と状態変化。固体・液体・気体のあいだの融解・凝固・蒸発・凝縮・昇華・凝華', b)

# ---------- 波の要素 ----------
b = [marker('ah-wv')]
x0, x1, y0, A, lam = 30, 420, 86, 40, 160
pts = ' '.join(f'{x:.1f},{y0 - A * _m.sin(2 * _m.pi * (x - x0) / lam):.1f}' for x in [x0 + i * 2 for i in range(int((x1 - x0) / 2) + 1)])
b.append(line(x0, y0, x1, y0, cls='st-rule', w=1.2))
b.append(f'<polyline points="{pts}" class="st-s" stroke-width="3" stroke-linejoin="round"/>')
pk1, pk2 = x0 + lam / 4, x0 + lam * 5 / 4
b.append(line(pk1, 24, pk2, 24, cls='st-ink', w=1.4, start='ah-wv', end='ah-wv'))
b.append(line(pk1, 28, pk1, y0 - A, cls='st-ink2', w=1, dash='2 3'))
b.append(line(pk2, 28, pk2, y0 - A, cls='st-ink2', w=1, dash='2 3'))
b.append(t((pk1 + pk2) / 2, 18, '波長 λ（山から山まで）', 12, halo=True))
b.append(t(pk1, y0 - A - 8, '山', 12, weight=700, halo=True))
b.append(t(x0 + lam * 3 / 4, y0 + A + 17, '谷', 12, weight=700))
ax = x0 + lam * 9 / 4
b.append(line(ax + 16, y0, ax + 16, y0 - A, cls='st-pen', w=1.6, start='ah-wv', end='ah-wv'))
b.append(t(ax + 22, y0 - 16, '振幅', 12, anchor='start', cls='fg-pen', weight=700, halo=True))
b.append(t(x0, 168, '横波：振動の向き ⊥ 進む向き（例：弦の振動、光などの電磁波）', 11.5, anchor='start', cls='fg-ink2'))
# 縦波
xs = []
x = 34
while x < 416:
    d = 1 + 0.6 * _m.cos(2 * _m.pi * (x - 34) / 120)
    xs.append(x); x += 5 + 6 * (1 - d / 1.6) * 1.6
for xv in xs:
    b.append(line(xv, 190, xv, 234, cls='st-s', w=1.6))
b.append(t(34 + 0, 252, '密', 12, weight=700))
b.append(t(34 + 60, 252, '疎', 12, weight=700))
b.append(t(34 + 120, 252, '密', 12, weight=700))
b.append(t(x0, 280, '縦波（疎密波）：振動の向き ∥ 進む向き（例：音）', 11.5, anchor='start', cls='fg-ink2'))
b.append(line(330, 256, 410, 256, cls='st-ink', w=1.6, end='ah-wv'))
b.append(t(370, 250, '進む向き', 11, cls='fg-ink2'))
D['wave'] = svg(440, 290, '波の要素。横波の山と谷・波長・振幅と、縦波の疎と密', b)

# ---------- 細胞 ----------
b = []
# 動物細胞
b.append('<ellipse cx="105" cy="118" rx="88" ry="72" class="fg-soft"/><ellipse cx="105" cy="118" rx="88" ry="72" class="st-s" stroke-width="2"/>')
b.append('<circle cx="100" cy="112" r="24" class="fg-s"/>')
for mx, my, rot in ((62, 150, 20), (150, 92, -30), (140, 158, 10)):
    b.append(f'<ellipse cx="{mx}" cy="{my}" rx="12" ry="6" transform="rotate({rot} {mx} {my})" class="fg-soft2"/><ellipse cx="{mx}" cy="{my}" rx="12" ry="6" transform="rotate({rot} {mx} {my})" class="st-pen" stroke-width="1.2"/>')
b.append(t(105, 212, '動物細胞', 14, weight=700))
# 植物細胞
b.append('<rect x="232" y="36" width="196" height="160" rx="8" class="fg-card"/><rect x="232" y="36" width="196" height="160" rx="8" class="st-s" stroke-width="4"/>')
b.append('<rect x="240" y="44" width="180" height="144" rx="5" class="fg-soft"/><rect x="240" y="44" width="180" height="144" rx="5" class="st-s" stroke-width="1.2"/>')
b.append('<rect x="300" y="70" width="104" height="96" rx="20" class="fg-card"/><rect x="300" y="70" width="104" height="96" rx="20" class="st-ink2" stroke-width="1.2" stroke-dasharray="3 3"/>')
b.append('<circle cx="268" cy="80" r="18" class="fg-s"/>')
for gx, gy in ((262, 150), (282, 172), (256, 124)):
    b.append(f'<ellipse cx="{gx}" cy="{gy}" rx="10" ry="6" class="fg-ink2"/>')
b.append(f'<ellipse cx="286" cy="120" rx="9" ry="5" transform="rotate(30 286 120)" class="fg-soft2"/><ellipse cx="286" cy="120" rx="9" ry="5" transform="rotate(30 286 120)" class="st-pen" stroke-width="1.2"/>')
b.append(t(352, 122, '液胞', 12, weight=700, cls='fg-ink2'))
b.append(t(330, 212, '植物細胞', 14, weight=700))
# ラベル
b.append(t(100, 116, '核', 12, cls='fg-card', weight=700))
b.append(t(268, 84, '核', 12, cls='fg-card', weight=700))
lab = [
    (62, 150, 20, 244, 'ミトコンドリア', 'end'), (193, 118, 200, 30, '細胞膜', 'middle'),
    (256, 124, 214, 262, '葉緑体（植物だけ）', 'start'), (430, 50, 430, 24, '細胞壁（植物だけ）', 'end'),
]
b.append(line(58, 156, 40, 232, cls='st-ink2', w=1))
b.append(t(30, 246, 'ミトコンドリア', 11.5, anchor='start'))
b.append(line(186, 90, 196, 26, cls='st-ink2', w=1))
b.append(t(196, 20, '細胞膜', 11.5))
b.append(line(256, 156, 246, 232, cls='st-ink2', w=1))
b.append(t(236, 246, '葉緑体（植物だけ）', 11.5, anchor='start'))
b.append(line(426, 40, 420, 20, cls='st-ink2', w=1))
b.append(t(432, 16, '細胞壁（植物だけ）', 11.5, anchor='end'))
D['cell'] = svg(440, 256, '動物細胞と植物細胞の構造。核・ミトコンドリア・細胞膜は共通、細胞壁・葉緑体・大きな液胞は植物細胞だけ', b)

# ---------- 地球の内部構造 ----------
b = []
ox, oy, R = 128, 250, 118
def arc(r, cls):
    return f'<path d="M{ox - r},{oy} A{r},{r} 0 0 1 {ox + r},{oy} Z" class="{cls}"/>'
b.append(arc(R, 'fg-soft'))
b.append(f'<path d="M{ox - R},{oy} A{R},{R} 0 0 1 {ox + R},{oy}" class="st-s" stroke-width="5"/>')
b.append(arc(R * 3480 / 6371, 'fg-soft2'))
b.append(arc(R * 1220 / 6371, 'fg-pen'))
b.append(line(ox - R - 6, oy, ox + R + 6, oy, cls='st-ink', w=1.2))
items = [
    (R - 1, '地殻', ['約5〜70 km', '海は薄く陸は厚い']),
    (R * 0.78, 'マントル', ['〜約2,900 km', '固体の岩石']),
    (R * 2300 / 6371, '外核', ['〜約5,100 km', '液体の鉄・ニッケル']),
    (R * 600 / 6371, '内核', ['〜約6,400 km', '固体の鉄・ニッケル']),
]
ys = [30, 90, 150, 210]
for (r, name, desc), ly in zip(items, ys):
    a = _m.radians(55)
    px, py = ox + r * _m.cos(a), oy - r * _m.sin(a)
    if name == '内核':
        px, py = ox + 8, oy - 10
    b.append(line(px, py, 262, ly - 4, cls='st-ink2', w=1))
    b.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="2.5" class="fg-ink"/>')
    b.append(t(266, ly, name, 13, anchor='start', weight=700))
    for k, d in enumerate(desc):
        b.append(t(266, ly + 15 + k * 14, d, 10.5, anchor='start', cls='fg-ink2'))
D['earth-interior'] = svg(440, 262, '地球の内部構造。外側から地殻・マントル・外核・内核', b)

# ---------- 生態ピラミッド ----------
b = []
layers = [('生産者', '植物・植物プランクトン', 380), ('一次消費者', '草食動物（バッタ・動物プランクトン）', 306), ('二次消費者', '小型の肉食動物（カエル・小魚）', 236), ('三次消費者', '大型の肉食動物（ヘビ・タカ）', 168)]
cxp = 200
for i, (name, ex, w) in enumerate(layers):
    y = 200 - i * 48
    cls = 'fg-s' if i == 0 else 'fg-soft'
    b.append(f'<rect x="{cxp - w / 2}" y="{y}" width="{w}" height="42" rx="4" class="{cls}"/><rect x="{cxp - w / 2}" y="{y}" width="{w}" height="42" rx="4" class="st-s" stroke-width="1.4"/>')
    b.append(t(cxp, y + 18, name, 13, weight=700, cls='fg-card' if i == 0 else 'fg-ink'))
    b.append(t(cxp, y + 34, ex, 10.5, cls='fg-card' if i == 0 else 'fg-ink2'))
b.append(line(414, 236, 414, 64, cls='st-pen', w=1.8, end='ah-ep'))
b.insert(0, marker('ah-ep', 'fg-pen'))
b.append(t(404, 96, '上ほど', 11, anchor='end', cls='fg-pen', weight=700))
b.append(t(404, 112, '少ない', 11, anchor='end', cls='fg-pen', weight=700))
b.append(t(cxp, 262, '食べる・食べられるの関係で、エネルギーは上へ行くほど大きく減る', 11, cls='fg-ink2'))
D['eco-pyramid'] = svg(440, 272, '生態ピラミッド。生産者の上に一次・二次・三次消費者が重なり、上ほど個体数や量が少ない', b)

out = ['/* 図解（SVG）。色は CSS のトークン（.figure 内のクラス）で塗る。生成元: 手書きの座標計算 */']
for k, v in D.items():
    out.append(f"LEARN.diagram('{k}', `{v}`);")
open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), '..', 'data', 'diagrams.js'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('ok', list(D.keys()))
