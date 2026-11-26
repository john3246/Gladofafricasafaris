// Spanish and Chinese for the templated text of the accommodation pages: short descriptions are put together from the
// kind of place, the region, short facts and a closing line. Lodge names are never translated.
const NAMES = new Set(require('./lodges.names.json'));
const R = {
  Moshi: ['Moshi', '莫希'], Ngorongoro: ['Ngorongoro', '恩戈罗恩戈罗'], 'Lake Eyasi': ['lago Eyasi', '埃亚西湖'], 'Lake Victoria': ['lago Victoria', '维多利亚湖'],
  'Lake Manyara': ['lago Manyara', '马尼亚拉湖'], Tarangire: ['Tarangire', '塔兰吉雷'], Arusha: ['Arusha', '阿鲁沙'], Serengeti: ['Serengeti', '塞伦盖蒂'],
  'Lake Natron': ['lago Natron', '纳特龙湖'], Kilimanjaro: ['Kilimanjaro', '乞力马扎罗'], 'Selous Game Reserve': ['Reserva de Selous', '塞卢斯保护区'],
  'Ruaha National Park': ['Parque Nacional de Ruaha', '鲁阿哈国家公园'], Mkomazi: ['Mkomazi', '姆科马齐'],
};
const KINDS = `Luxury hotel|Hotel de lujo|豪华酒店
Lodge|Lodge|酒店
Colonial-style cottages|Cabañas de estilo colonial|殖民风格小屋
Small exclusive lodge|Pequeño lodge exclusivo|小型尊享酒店
Luxury suites|Suites de lujo|豪华套房
Private campsite|Camping privado|私人营地
Lakeside resort|Resort junto al lago|湖畔度假村
Thatched lodge|Lodge con techo de paja|茅草顶酒店
Luxury lodge|Lodge de lujo|豪华酒店
Wilderness collection property|Alojamiento de la colección Wilderness|荒野系列住宿
Tented camp|Campamento de tiendas|帐篷营地
Luxury highland camp|Campamento de lujo en las tierras altas|高地豪华营地
Exclusive camp|Campamento exclusivo|尊享营地
All-inclusive lodge|Lodge con todo incluido|全包式酒店
Camp|Campamento|营地
Colonial-style lodge|Lodge de estilo colonial|殖民风格酒店
Public campsite|Camping público|公共营地
Exclusive campsite|Camping exclusivo|尊享露营地
Suites|Suites|套房
Treehouse lodge|Lodge de casas en los árboles|树屋酒店
Country house|Casa de campo|乡间别墅
Farm lodge|Lodge en una finca|农场酒店
Family-friendly camp|Campamento familiar|亲子营地
Tented lodge|Lodge de tiendas|帐篷酒店
Wilderness camp|Campamento en plena naturaleza|荒野营地
Safari tent camp|Campamento de tiendas de safari|游猎帐篷营地
Eco-friendly camp|Campamento ecológico|环保营地
Luxury thatched camp|Campamento de lujo con techo de paja|茅草顶豪华营地
Luxury boutique hotel|Hotel boutique de lujo|豪华精品酒店
Village-style lodge|Lodge estilo aldea|村落风格酒店
Villa|Villa|别墅
Safari lodge|Lodge de safari|游猎酒店
Hotel|Hotel|酒店
Guest house|Casa de huéspedes|客栈
Country inn|Posada rural|乡村旅馆
Boutique property|Alojamiento boutique|精品住宿
Camp collection|Colección de campamentos|营地系列
Luxury tented camp|Campamento de lujo de tiendas|豪华帐篷营地
Luxury boutique camp|Campamento boutique de lujo|豪华精品营地
Mobile tented camp|Campamento móvil de tiendas|移动帐篷营地
Mobile camp|Campamento móvil|移动营地
Seasonal luxury camp|Campamento de lujo de temporada|季节性豪华营地
Tented chalets|Chalets de tienda|帐篷小屋
Hilltop lodge|Lodge en la cima de una colina|山顶酒店
Mobile and semi-permanent camps|Campamentos móviles y semipermanentes|移动与半固定营地
Boutique tented camp|Campamento boutique de tiendas|精品帐篷营地
Mobile and central camps|Campamentos móvil y central|移动与中心营地
Eco safari camp|Campamento de safari ecológico|生态游猎营地
Mobile luxury tented camp|Campamento móvil de lujo|移动豪华帐篷营地
Family-run safari camp|Campamento familiar de safari|家庭经营游猎营地
Luxury mobile camp|Campamento móvil de lujo|豪华移动营地
Boutique hotel|Hotel boutique|精品酒店
Eco-lodge|Ecolodge|生态酒店
Kilimanjaro hut or camp|Refugio o campamento del Kilimanjaro|乞力马扎罗营房或营地
Boutique lodge|Lodge boutique|精品酒店
Light-footprint camp|Campamento de bajo impacto|低环境影响营地
Owner-run camp|Campamento regentado por sus dueños|业主经营营地
Luxury tented suites|Suites en tienda de lujo|豪华帐篷套房
Bush camp|Campamento en la sabana|丛林营地
Eco lodge and campsite|Ecolodge y camping|生态酒店与露营地
Ecological camp|Campamento ecológico|生态营地`;
const FACTS = `Air conditioning|Aire acondicionado|空调
balconies|balcones|阳台
Sundowner deck|Terraza para el atardecer|日落观景台
fire pit|hoguera|篝火坑
16 en-suite rooms in double cottages|16 habitaciones con baño en cabañas dobles|双拼小屋内16间带卫浴客房
solar powered|energía solar|太阳能供电
10 rooms|10 habitaciones|10间客房
20 minutes from the crater|A 20 minutos del cráter|距火山口20分钟
About 1.5 hours from Arusha|A hora y media de Arusha|距阿鲁沙约1.5小时
30 rooms: 20 tents and 10 bungalows|30 habitaciones: 20 tiendas y 10 bungalows|30间客房：20顶帐篷和10座平房
Jacuzzis in all suites|Jacuzzi en todas las suites|所有套房配按摩浴缸
45 minutes from Kilimanjaro airport|A 45 minutos del aeropuerto del Kilimanjaro|距乞力马扎罗机场45分钟
12 tents|12 tiendas|12顶帐篷
60 minutes east of Seronera airstrip|A 60 minutos al este de la pista de Seronera|塞罗内拉简易机场以东60分钟
Private balconies|Balcones privados|私人阳台
infinity pool|piscina infinita|无边泳池
Private-pool villas|Villas con piscina privada|私人泳池别墅
5 minutes from Moshi town|A 5 minutos de Moshi|距莫希镇5分钟
30 minutes from Kilimanjaro airport|A 30 minutos del aeropuerto del Kilimanjaro|距乞力马扎罗机场30分钟
Serviced three-bedroom villas|Villas de tres dormitorios con servicios|三居服务式别墅
Bauhaus-inspired design|Diseño inspirado en la Bauhaus|包豪斯风格设计
bar|bar|酒吧
6 tents|6 tiendas|6顶帐篷
moves twice a year|se traslada dos veces al año|每年迁移两次
Kogatende, northern Serengeti|Kogatende, norte del Serengeti|塞伦盖蒂北部科加滕德
30 minutes from the Mara River|A 30 minutos del río Mara|距马拉河30分钟
25 thatched rooms|25 habitaciones con techo de paja|25间茅草顶客房
8 luxury suites|8 suites de lujo|8间豪华套房
About 20 km from Ndabaka gate|A unos 20 km de la puerta de Ndabaka|距 Ndabaka 大门约20公里
15 km from Serengeti National Park|A 15 km del Parque Nacional del Serengeti|距塞伦盖蒂国家公园15公里
Moves between the Mara and Ndutu|Se traslada entre el Mara y Ndutu|在马拉与恩杜图之间迁移
Open June to November|Abierto de junio a noviembre|6月至11月开放
10 double tents plus a family tent|10 tiendas dobles y una familiar|10顶双人帐篷和1顶家庭帐篷
A few metres from the Mara River|A pocos metros del río Mara|距马拉河仅数米
South of Lake Ndutu|Al sur del lago Ndutu|恩杜图湖以南
50 square metre suites|Suites de 50 m²|50平方米套房
private verandahs|terrazas privadas|私人阳台
Garden setting|Entre jardines|花园环境
coffee estates nearby|cafetales cercanos|邻近咖啡庄园
10 tents with en-suite bathrooms|10 tiendas con baño|10顶带卫浴帐篷
tented dining and bar|comedor y bar en tienda|帐篷餐厅与酒吧
Infinity pool|Piscina infinita|无边泳池
Near the Ngare Nanyuki River|Cerca del río Ngare Nanyuki|靠近 Ngare Nanyuki 河
30 minutes from the Lake Manyara park gate|A 30 minutos de la puerta del lago Manyara|距马尼亚拉湖公园大门30分钟
Manicured gardens|Jardines cuidados|精心打理的花园
20 cottages|20 cabañas|20座小屋
spa|spa|水疗
pool|piscina|泳池
Four-bedroom garden house|Casa con jardín de cuatro dormitorios|四居花园别墅
12 tents, including a two-bedroom family tent|12 tiendas, incluida una familiar de dos dormitorios|12顶帐篷，含1顶两居家庭帐篷
On an escarpment|Sobre un escarpe|位于崖壁之上
Inside a 1,500 acre Arabica coffee estate|Dentro de un cafetal arábica de 600 hectáreas|坐落于1,500英亩阿拉比卡咖啡庄园内
Private concession|Concesión privada|私营特许区
Private tent terraces|Terrazas privadas en las tiendas|帐篷私人露台
20 km south of Makuyuni|A 20 km al sur de Makuyuni|Makuyuni 以南20公里
On the Manyara escarpment|En el escarpe de Manyara|位于马尼亚拉崖壁
114 rooms|114 habitaciones|114间客房
A former private residence|Antigua residencia privada|原为私人宅邸
On a kopje hill|En un cerro rocoso|位于岩丘上
Above the crater rim|Sobre el borde del cráter|位于火山口边缘之上
15 luxury suites|15 suites de lujo|15间豪华套房
eastern crater rim|borde oriental del cráter|火山口东缘
Eastern side, near the rim|Lado este, cerca del borde|东侧，靠近火山口边缘
10 luxury tents with en-suite bathrooms|10 tiendas de lujo con baño|10顶带卫浴豪华帐篷
24 colonial cottages|24 cabañas coloniales|24座殖民风格小屋
heated pool|piscina climatizada|恒温泳池
9 garden rooms|9 habitaciones en el jardín|9间花园客房
On the Rift Valley escarpment|En el escarpe del valle del Rift|位于裂谷崖壁
About 15 minutes' drive to the crater floor|A unos 15 minutos en coche del fondo del cráter|距火山口底约15分钟车程
Near Kuro airstrip|Cerca de la pista de Kuro|靠近 Kuro 简易机场
Luxury hotel services|Servicios de hotel de lujo|豪华酒店服务
Seronera|Seronera|塞罗内拉
3 private guest tents|3 tiendas privadas|3顶私人客帐
open year-round|abierto todo el año|全年开放
18 acres|7 hectáreas|占地18英亩
Over 130 bird species recorded|Más de 130 especies de aves registradas|记录到130多种鸟类
On the crater rim|En el borde del cráter|位于火山口边缘
Redesigned in 2009|Rediseñado en 2009|2009年重新设计
12 walk-in tents|12 tiendas amplias|12顶可站立帐篷
8 tented rooms|8 habitaciones en tienda|8间帐篷客房
On the Rufiji River|A orillas del río Rufiji|位于鲁菲吉河畔
On a plateau at about 1,000 m|En una meseta a unos 1,000 m|位于海拔约1,000米高原
24 stone-and-thatch chalets|24 chalets de piedra y paja|24座石墙茅顶小屋
8 suites of 140 square metres each|8 suites de 140 m² cada una|8套各140平方米套房
plunge pools|piscinas privadas|私人小泳池
On a kopje|Sobre un kopje|位于花岗岩丘上
On the outskirts of Arusha|En las afueras de Arusha|位于阿鲁沙郊区
Near Sangaiwe gate|Cerca de la puerta Sangaiwe|靠近 Sangaiwe 大门
16 chalets|16 chalets|16座小木屋
Near the crater access road|Cerca de la carretera de acceso al cráter|靠近火山口进出道路
On the Mbalageti River corridor|En el corredor del río Mbalageti|位于 Mbalageti 河走廊
Near Makoma Hill|Cerca de la colina Makoma|靠近 Makoma 山
Solar and wind power only|Solo energía solar y eólica|仅用太阳能和风能
In Engaresero village|En la aldea de Engaresero|位于 Engaresero 村
8 safari tents|8 tiendas de safari|8顶游猎帐篷
9 acres|3,6 hectáreas|占地9英亩
7 tents|7 tiendas|7顶帐篷
29 rooms and 7 suites|29 habitaciones y 7 suites|29间客房和7间套房
10 acres|4 hectáreas|占地10英亩
30 plantation houses|30 casas de plantación|30座庄园小屋
The central camp is open year-round|El campamento central abre todo el año|中心营地全年开放
Kenya and Tanzania|Kenia y Tanzania|肯尼亚与坦桑尼亚
77 rooms, suites and villas|77 habitaciones, suites y villas|77间客房、套房和别墅
air conditioning|aire acondicionado|空调
20 log cabins with fireplaces|20 cabañas de troncos con chimenea|20座带壁炉原木小屋
By the Olmoti volcano|Junto al volcán Olmoti|邻近奥尔莫蒂火山
10 tents|10 tiendas|10顶帐篷
Two-storey rondavels|Rondavels de dos plantas|双层圆形小屋
Cottages|Cabañas|小屋
Stilted treehouse suites|Suites en los árboles sobre pilotes|高脚树屋套房
Spa|Spa|水疗
Heated pool|Piscina climatizada|恒温泳池
Solar powered|Energía solar|太阳能供电
Fire pit|Hoguera|篝火坑
Eastern crater rim|Borde oriental del cráter|火山口东缘
Ngorongoro Highlands|Tierras altas del Ngorongoro|恩戈罗恩戈罗高地
Balconies|Balcones|阳台
Coffee estates nearby|Cafetales cercanos|邻近咖啡庄园
Open year-round|Abierto todo el año|全年开放
Private verandahs|Terrazas privadas|私人阳台
Tented dining and bar|Comedor y bar en tienda|帐篷餐厅与酒吧
Northern Serengeti|Norte del Serengeti|塞伦盖蒂北部
Moves twice a year|Se traslada dos veces al año|每年迁移两次
Bar|Bar|酒吧
Plunge pools|Piscinas privadas|私人小泳池
See facts and the safaris that stay here|Vea los datos y los safaris que se alojan aquí|查看信息及入住此处的行程
Ask us to include it in your safari|Pídanos incluirlo en su safari|欢迎要求将其纳入您的行程
Expert local guides|Guías locales expertos|资深本地向导
Book now|Reserve ya|立即预订
Clear prices|Precios claros|价格清晰
Free quote from our Arusha team|Presupuesto gratis de nuestro equipo de Arusha|阿鲁沙团队免费报价`;

const table = (text) => new Map(text.split('\n').map((l) => l.split('|')).map(([en, es, zh]) => [en, [es, zh]]));
const kinds = table(KINDS);
const facts = table(FACTS);
const I = { es: 0, zh: 1 };

/** One sentence without its full stop, or null. */
function sentence(s, lang) {
  const i = I[lang];
  let m;
  if (facts.has(s)) return facts.get(s)[i];
  if ((m = s.match(/^(.+?) (?:in the (.+) area|at (.+))$/)) && kinds.has(m[1]) && R[m[2] || m[3]]) {
    const k = kinds.get(m[1])[i];
    const r = R[m[2] || m[3]][i];
    return lang === 'es' ? `${k} en la zona de ${r}` : `位于${r}地区的${k}`;
  }
  if ((m = s.match(/^Safari accommodation in (.+), Tanzania$/)) && R[m[1]]) return lang === 'es' ? `Alojamiento de safari en ${R[m[1]][i]}, Tanzania` : `坦桑尼亚${R[m[1]][i]}游猎住宿`;
  if ((m = s.match(/^Ask us about (.+) and we will match it to your safari$/))) return lang === 'es' ? `Pregúntenos por ${m[1]} y lo ajustaremos a su safari` : `欢迎咨询 ${m[1]}，我们会将其安排进您的行程`;
  return null;
}

/** The translation of an accommodation label or templated description, or null. `base` translates other known text. */
function lodge(core, lang, base) {
  if (!(lang in I)) return null;
  const i = I[lang];
  const zh = lang === 'zh';
  let m;
  if (core === 'Where You Stay: Safari Lodges, Camps & Hotels in Tanzania') return zh ? '住在哪里：坦桑尼亚游猎酒店、营地与宾馆' : 'Dónde alojarse: lodges, campamentos y hoteles de safari en Tanzania';
  if (core === '<a1>Ask about this place</a1><a2>All places to stay</a2>') return zh ? '<a1>咨询此住宿</a1><a2>全部住宿</a2>' : '<a1>Preguntar por este alojamiento</a1><a2>Todos los alojamientos</a2>';
  if (NAMES.has(core)) return core;
  if ((m = core.match(/^<a1>([^<]+)<\/a1>$/)) && NAMES.has(m[1])) return core;
  if ((m = core.match(/^<span1>•<\/span1><span2>([^<]+)<\/span2>$/))) return facts.has(m[1]) ? `<span1>•</span1><span2>${facts.get(m[1])[i]}</span2>` : null;
  if ((m = core.match(/^(.+?): Safari Accommodation( \| Glad Of Africa)?$/))) {
    const at = m[1].match(/^(.+), ([^,]+)$/);
    const name = at && R[at[2]] ? `${at[1]}${zh ? '，' : ', '}${R[at[2]][i]}` : m[1];
    return `${name}${zh ? '：游猎住宿' : ': alojamiento de safari'}${m[2] || ''}`;
  }
  if ((m = core.match(/^(.+), ([^,]+)$/)) && NAMES.has(m[1]) && R[m[2]]) return `${m[1]}${zh ? '，' : ', '}${R[m[2]][i]}`;
  if ((m = core.match(/^Photo of the (.+) area$/)) && R[m[1]]) return zh ? `${R[m[1]][i]}地区照片` : `Foto de la zona de ${R[m[1]][i]}`;
  if ((m = core.match(/^More in (.+)$/)) && R[m[1]]) return zh ? `${R[m[1]][i]}更多住宿` : `Más en ${R[m[1]][i]}`;
  if (kinds.has(core)) return kinds.get(core)[i];
  if (R[core]) return R[core][i];
  if ((m = core.match(/^(?:<a1>Read about (.+) →<\/a1> )?<(span\d)>On (\d+) safaris?<\/span\d>$/))) {
    const link = m[1] ? (zh ? `<a1>了解 ${m[1]} →</a1> ` : `<a1>Ver ${m[1]} →</a1> `) : '';
    return `${link}<${m[2]}>${zh ? `出现在${m[3]}条行程中` : `En ${m[3]} safari${m[3] === '1' ? '' : 's'}`}</${m[2]}>`;
  }
  if ((m = core.match(/^<a1><span2>([^<]+)<\/span2><span3>(\d+) days?<\/span3><\/a1>$/))) {
    const t = base(m[1]);
    return t ? `<a1><span2>${t}</span2><span3>${zh ? `${m[2]}天` : `${m[2]} día${m[2] === '1' ? '' : 's'}`}</span3></a1>` : null;
  }
  if (/\.$/.test(core) && !core.includes('<')) {
    const parts = core.slice(0, -1).split(/\.\s+/).map((p) => sentence(p, lang));
    if (parts.every(Boolean)) return zh ? `${parts.join('。')}。` : `${parts.join('. ')}.`;
  }
  return null;
}

module.exports = { lodge };
