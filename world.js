export const REALMS = ['Luyện Khí', 'Trúc Cơ', 'Kim Đan', 'Nguyên Anh', 'Hóa Thần', 'Độ Kiếp', 'Phi Thăng'];

export const REGIONS = [
  {
    name: 'Thanh Trúc Lâm', image: 'thanh-truc', accent: 'jade',
    line: 'Rừng trúc tĩnh mịch dưới chân núi.',
    story: 'Linh khí len qua từng thân trúc. Những dấu móng vuốt mới in trên lối mòn dẫn vào rừng.',
    foes: [
      { name: 'Trúc Linh Thỏ', icon: 'rabbit', hp: 43, attack: 10, armor: 0 },
      { name: 'Thanh Nha Lang', icon: 'wolf', hp: 61, attack: 13, armor: 1 },
      { name: 'Trúc Lâm Yêu Vương', icon: 'antlers', hp: 119, attack: 19, armor: 2 },
    ],
  },
  {
    name: 'U Minh Cốc', image: 'u-minh', accent: 'violet',
    line: 'Sương tím che giấu yêu ảnh.',
    story: 'Sương không tan ngay cả giữa trưa. Qua cổng đá cũ, tiếng bước chân vọng lại từ mọi phía.',
    foes: [
      { name: 'U Ảnh Bức', icon: 'bat', hp: 86, attack: 18, armor: 2 },
      { name: 'Tử Vụ Xà', icon: 'snake', hp: 106, attack: 21, armor: 3 },
      { name: 'U Minh Quỷ Tướng', icon: 'mask', hp: 174, attack: 28, armor: 4 },
    ],
  },
  {
    name: 'Thiên Vân Sơn', image: 'thien-van', accent: 'amber',
    line: 'Cổ điện ẩn giữa tầng mây.',
    story: 'Hàng nghìn bậc đá dẫn đến một cổ điện. Trên vách núi, phù văn vẫn phát sáng khi mây tràn qua.',
    foes: [
      { name: 'Vân Dực Ưng', icon: 'bat', hp: 128, attack: 26, armor: 4 },
      { name: 'Thạch Giáp Thú', icon: 'shield', hp: 148, attack: 29, armor: 5 },
      { name: 'Thủ Điện Kim Lân', icon: 'dragon', hp: 226, attack: 37, armor: 6 },
    ],
  },
  {
    name: 'Hàn Băng Uyên', image: 'han-bang', accent: 'ice',
    line: 'Khe băng quanh năm gió rít.',
    story: 'Mỗi hơi thở kết thành sương trắng. Sâu dưới lớp băng, một dòng linh mạch vẫn âm thầm chảy.',
    foes: [
      { name: 'Bạch Tuyết Hồ', icon: 'wolf', hp: 170, attack: 34, armor: 6 },
      { name: 'Hàn Băng Mãng', icon: 'snake', hp: 190, attack: 37, armor: 7 },
      { name: 'Huyền Băng Giao', icon: 'dragon', hp: 278, attack: 46, armor: 8 },
    ],
  },
  {
    name: 'Xích Hỏa Vực', image: 'xich-hoa', accent: 'ember',
    line: 'Địa hỏa chảy qua khe đá.',
    story: 'Hơi nóng làm đá đỏ rực. Sau những cột lửa là một cửa ải canh giữ địa mạch cổ.',
    foes: [
      { name: 'Xích Viêm Nha', icon: 'bat', hp: 212, attack: 42, armor: 8 },
      { name: 'Địa Hỏa Hống', icon: 'wolf', hp: 232, attack: 45, armor: 9 },
      { name: 'Xích Hỏa Kỳ Lân', icon: 'antlers', hp: 330, attack: 55, armor: 10 },
    ],
  },
  {
    name: 'Linh Tiêu Cảnh', image: 'linh-tieu', accent: 'sky',
    line: 'Cửa trời nằm trên biển mây.',
    story: 'Những hòn đảo trôi phía trên biển mây. Ở cuối hành lang ngọc, thiên lôi đã bắt đầu tụ lại.',
    foes: [
      { name: 'Linh Tiêu Hạc', icon: 'bat', hp: 254, attack: 50, armor: 10 },
      { name: 'Lôi Vân Thú', icon: 'antlers', hp: 274, attack: 53, armor: 11 },
      { name: 'Thiên Lôi Long Quân', icon: 'dragon', hp: 382, attack: 64, armor: 12 },
    ],
  },
];

export const ITEMS = {
  herb: { name: 'Linh Thảo', icon: 'leaf', color: 'jade', detail: 'Dược liệu hái ở linh mạch, dùng để luyện đan.' },
  ore: { name: 'Tinh Thiết', icon: 'gem', color: 'ice', detail: 'Khoáng thạch dùng để cường hóa kiếm và hộ bào.' },
  essence: { name: 'Yêu Đan', icon: 'orb', color: 'violet', detail: 'Linh lực kết tinh từ yêu thú, dùng để luyện Phá Cảnh Đan.' },
  qiPill: { name: 'Tụ Khí Đan', icon: 'pill', color: 'amber', detail: 'Dùng để nhận ngay 45 tu vi.' },
  healPill: { name: 'Hồi Xuân Đan', icon: 'pill', color: 'jade', detail: 'Hồi 55% sinh lực tối đa. Có thể dùng trong trận đấu.' },
  seal: { name: 'Phá Cảnh Đan', icon: 'pill', color: 'violet', detail: 'Cần một viên mỗi khi đột phá sang đại cảnh giới mới.' },
};

export const RECIPES = [
  { item: 'qiPill', costs: { herb: 3, stones: 12 } },
  { item: 'healPill', costs: { herb: 2, stones: 10 } },
  { item: 'seal', costs: { herb: 4, essence: 2, stones: 25 } },
];

export const GEAR = {
  sword: { icon: 'sword', base: 'Mộc Kiếm', name: 'Thanh Phong Kiếm', color: 'ice', effect: '+8 công kích mỗi cấp' },
  robe: { icon: 'shield', base: 'Áo Vải', name: 'Hộ Thân Bào', color: 'violet', effect: '+14 sinh lực, +2 phòng ngự mỗi cấp' },
};

export const QUESTS = [
  { id: 'practice', title: 'Dẫn khí nhập thể', desc: 'Luyện công 3 lần', goal: 3, reward: { xp: 26, stones: 20 } },
  { id: 'herbs', title: 'Hương thảo mộc', desc: 'Thu thập 5 Linh Thảo', goal: 5, reward: { qiPill: 1, stones: 24 } },
  { id: 'wins', title: 'Lần đầu trừ yêu', desc: 'Thắng 1 trận với yêu thú', goal: 1, reward: { ore: 2, stones: 35 } },
  { id: 'forge', title: 'Pháp bảo đầu tay', desc: 'Cường hóa trang bị 1 lần', goal: 1, reward: { healPill: 1, stones: 35 } },
  { id: 'pills', title: 'Lửa trong đan lô', desc: 'Luyện thành 2 viên đan', goal: 2, reward: { seal: 1, stones: 35 } },
  { id: 'bosses', title: 'Danh chấn sơn lâm', desc: 'Hạ 1 thủ lĩnh', goal: 1, reward: { xp: 45, stones: 65 } },
];
