# Thiên Đạo · Tu Tiên Ký

Game tu tiên chơi đơn bằng tiếng Việt. Luyện công, bế quan, luyện đan, cường hóa trang bị và khiêu chiến yêu thú ở sáu vùng đất.

Bắt đầu tại Tiểu viện Thanh Vân. Dùng WASD, phím mũi tên hoặc chạm vào mặt đất để di chuyển. Nhấn E khi đến gần một địa điểm để tương tác. Trong nhà, đến bồ đoàn để luyện công, bế quan và đột phá cảnh giới.

Bấm Luyện công một lần để tự nhận tu vi mỗi giây. Tốc độ tăng theo từng tầng và theo điểm thiền. Bồ đoàn có hệ số ×1, bệ sen ×2 từ Luyện Khí Tầng 2, linh đài rừng trúc ×3 từ Trúc Cơ Tầng 1. Buổi thiền dừng khi đủ tu vi, khi bấm Dừng luyện hoặc khi đóng màn thiền.

## Chạy trên máy

Tại thư mục repo, chạy `python -m http.server 8000` rồi mở [http://localhost:8000](http://localhost:8000) trong trình duyệt. Tiến độ tự lưu theo địa chỉ trang trên trình duyệt đang chơi.

GitHub Pages phục vụ trực tiếp các tệp trong thư mục gốc của nhánh `master`.

## Thanh Vân Thành
Đi theo đường phía đông sân vườn hoặc chọn Đến Thanh Vân Thành / Bản đồ → Vào thành phố. Đi bộ tới các điểm để luyện đan, rèn đồ, xem nhiệm vụ, nghỉ ngơi và mua Linh Thảo (8 Linh thạch). Góc thiền nhìn từ phía sau và hơi cao, thu rộng khung cảnh; giữ nguyên tiến độ lưu.

## Màn hình chơi liền mạch
- Sân vườn có lò luyện đan, đe rèn, bảng nhiệm vụ, luống thuốc, ghế nghỉ và bệ sen. Bấm công trình để đi tới rồi tương tác, hoặc dùng WASD/mũi tên và E.
- Cổng phía đông có đường mở sang Thanh Vân Thành; cổng phía nam dẫn ra rừng trúc. Nhân vật đi xuyên cổng để chuyển khu vực.
- Chỉ dẫn tìm đường qua các cửa nối cảnh. Túi đồ, bản đồ, nhiệm vụ và nhật ký mở ngay trên màn hình chơi.
- Bế quan/xuất quan dùng tại bồ đoàn trong nhà. Trạng thái bế quan hiện trên màn hình để quay lại nhận tu vi.
- Giữ các khóa lưu phiên bản 1. Tự phục hồi tiến độ nhiệm vụ rèn từ cấp trang bị cho các bản lưu cũ.

Kiểm tra: `node tests/world.mjs` và `node tests/gameplay.mjs`.
