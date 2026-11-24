// Simplified Chinese for the words around every page (menus, footer, common buttons): [English, Chinese].
// Everything else is translated by the CMS translator (CMS > Translations) once an API key is added.
const ROWS = [
  ['Home', '首页'], ['Tours', '行程'], ['Offers', '特惠'], ['Reviews', '客户评价'], ['Accommodations', '住宿'], ['Blog', '博客'], ['About Us', '关于我们'], ['FAQs', '常见问题'],
  ['Safari styles', '野生动物旅行风格'], ['Browse all safaris →', '浏览所有行程 →'], ['Best-selling Safaris', '热销行程'], ['Exclusive Fly-In Safaris', '高端飞行野生动物之旅'],
  ['Joining Group Safaris', '拼团野生动物之旅'], ['Migration Safaris', '动物大迁徙之旅'], ['Midrange Lodge Safaris', '中档酒店野生动物之旅'], ['Budget Safaris', '经济型野生动物之旅'],
  ['Hiking & Trekking', '徒步与登山'], ['Day Excursions', '一日游体验'], ['Signature journeys', '精选行程'], ['Featured journey', '推荐行程'],
  ['Destinations', '目的地'], ['Northern Circuit', '北部环线'], ['Southern Circuit', '南部环线'], ['Browse all destinations →', '浏览所有目的地 →'],
  ['Group Safaris', '拼团野生动物之旅'], ['Experiences', '特色体验'], ['Great Migration', '动物大迁徙'], ['Calving season (Ndutu)', '产仔季（恩杜图）'], ['Big Five', '非洲五霸'],
  ['Big cats & photography', '大型猫科动物与摄影'], ['Cultural & Maasai visits', '文化与马赛人探访'], ['Kilimanjaro climb', '攀登乞力马扎罗'], ['Mount Meru trek', '梅鲁山徒步'],
  ['Zanzibar beach extension', '桑给巴尔海滩延伸行程'], ['Safari + beach combination', '野生动物之旅加海滩度假'], ['All experiences →', '所有特色体验 →'],
  ['Get a Quote', '获取报价'], ['Contact', '联系我们'], ['Start Planning', '开始规划'], ['Book this safari', '预订此行程'], ['Plan your safari', '规划您的行程'],
  ['Safari tips & offers in your inbox', '将野生动物之旅攻略和优惠发送到您的邮箱'], ['Subscribe', '订阅'], ['We accept', '支持付款方式'],
  ['Important Links', '重要链接'], ['Terms And Conditions', '条款与条件'], ['Privacy & Policy', '隐私政策'], ['Travel Insurance', '旅行保险'], ['Contact Channels', '联系渠道'],
  ['Travel Blog & Tips', '旅行博客与攻略'], ['Contact Info', '联系信息'], ['WhatsApp us', '通过 WhatsApp 联系我们'],
  ['© 2026 Glad Of Africa. All Rights Reserved.', '© 2026 Glad Of Africa。保留所有权利。'],
  ['We offer Kilimanjaro treks, wildlife safaris, and Zanzibar beach holidays in Tanzania with a dedicated team committed to quality service and safety.',
    '我们在坦桑尼亚提供乞力马扎罗登山、野生动物之旅和桑给巴尔海滩度假，由专业团队以优质服务和安全为首要承诺。'],
  ['Kilimanjaro', '乞力马扎罗'], ['Mount Meru', '梅鲁山'], ['Serengeti', '塞伦盖蒂'], ['Ngorongoro', '恩戈罗恩戈罗'], ['Tarangire', '塔兰吉雷'], ['Lake Manyara', '马尼亚拉湖'],
  ['Serengeti National Park', '塞伦盖蒂国家公园'], ['Ngorongoro Crater', '恩戈罗恩戈罗火山口'], ['Tarangire National Park', '塔兰吉雷国家公园'], ['Lake Manyara National Park', '马尼亚拉湖国家公园'],
  ['Arusha National Park', '阿鲁沙国家公园'], ['Kilimanjaro National Park', '乞力马扎罗国家公园'], ['Mount Kilimanjaro', '乞力马扎罗山'], ['Zanzibar Beaches', '桑给巴尔海滩'], ['Stone Town', '石头城'],
  ['Required', '必填'], ['Travellers', '旅客人数'], ['Dates', '日期'], ['Days', '天数'], ['Duration', '行程天数'], ['Included', '包含内容'], ['Best months', '最佳月份'],
  ['Safari prices at a glance', '野生动物之旅价格一览'], ['Starting price (USD)', '起步价（美元）'], ['Safari category', '行程类别'],
];
module.exports = { ROWS };
