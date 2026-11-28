# Thiết kế làm mới UI HILL-RENT (2026-11-28)

## Intent
Làm cho giao diện **sống động hơn** (chuyển động có chủ đích, phản hồi rõ ràng sau thao tác) và **trực quan hơn** (nhìn 2 giây là biết ai nợ ai, bao nhiêu, việc tiếp theo là gì), mà không đụng đến logic tính tiền, đồng bộ Sheet, hàng đợi offline hay thông báo.

## Goals
- Hero trở thành “bản đồ nợ”: số cần chuyển, chiều chuyển tiền, tỉ lệ đã trả, trạng thái kỳ.
- Phân biệt rõ bằng màu/biểu tượng: khoản chi, khoản đã thanh toán, nợ kỳ trước, nhắc hẹn, trực nhật.
- Empty state và thông báo lỗi nói được việc cần làm tiếp theo.
- Giữ được sự thân thiện vốn có của app phòng trọ; không biến thành dashboard lạnh.

## Non-goals / Anti-goals
- Không đổi công thức `share()`, `calc()`, luồng `sync()`/`flush()`/`pull()`, `Code.gs`.
- Không thêm thư viện CSS/JS/font bên ngoài (app chạy offline qua service worker).
- Không đổi mô hình dữ liệu, không đăng khoá bí mật lên frontend.
- Không “AI-slop”: tránh card giống hệt nhau, gradient trang trí vô nghĩa, eyebrow ALL-CAPS, motion rải khắp nơi.

## Constraints quan trọng
- Mọi `id`, hàm inline `onclick="..."`, và tên hàm JS hiện có **phải giữ nguyên** để không gãy logic. Chỉ đổi cấu trúc/CSS bên trong, thêm `id` mới khi thật cần và phải wire ngay.
- `index.html` là file duy nhất; CSS nhúng trong `<style>`.
- Sau khi sửa: tăng `V` trong `sw.js` → `ttt-v33`; sửa cùng số `APP_V='ttt-v33'` và `APP_DATE` trong `index.html`; commit + push theo `AGENTS.md`.

## Approaches đã cân nhắc
1. **Làm mới có chừng mực** *(được chọn)* — giữ 5 tab và thao tác cũ, tập trung vào hệ màu/typography/hierarchy và micro-interaction. Rủi ro thấp, người dùng vẫn quen.
2. Bảng điều khiển tài chính — nhiều biểu đồ/số liệu hơn, trực quan nhưng lạnh và dễ quá tải trên mobile.
3. Đổi identity hoàn toàn (giấy/tem Phiếu chi) — khác biệt nhất nhưng rủi ro cao, cần duyệt màu riêng.

## Hệ thống thiết kế

### Màu (giữ nhận diện tím, thêm ngữ nghĩa rõ)
- `--ink: #171B36` — chữ chính.
- `--violet: #5B4CE0` — hành động chính, khoản chi do Người 0 trả.
- `--mint: #0FA37F` — đã thanh toán / hoà vốn / trạng thái tốt.
- `--amber: #E6941A` — chờ xử lý / nợ kỳ trước / hàng đợi chưa gửi.
- `--paper: #F5F6FC` — nền; giữ dark mode tương ứng.

### Chữ
- Giữ `system-ui` để không tải font ngoài; tăng kỷ luật type scale: 12 / 13.5 / 15 / 17 / 22 / 38.
- `font-variant-numeric: tabular-nums` cho mọi con tiền; weight 800 cho số lớn, 600 cho nhãn; bỏ ALL-CAPS không cần thiết.

### Layout / thành phần chính
- **Hero**: một “thẻ nợ” duy nhất. Dòng trên: kỳ + số khoản. Giữa: số cần chuyển + avatar chiều đi. Dưới: thanh tỉ lệ có nhãn hai đầu, chip trạng thái (“Đang nợ” / “Đã hoà vốn”), 2 nút hành động rõ ràng.
- **Danh sách chi**: nhóm theo ngày, mỗi dòng có badge màu theo người chi, nhãn cách chia, mũi tên `người chi → người chịu` với khoản `pay` dùng mint. Empty state có nút “+ Thêm khoản chi”.
- **Thống kê**: 3 thanh so sánh kỳ + chênh lệch % + khoản tốn nhất; ẩn khi chưa có dữ liệu.
- **Trực nhật**: card việc hiển thị avatar người đến lượt, chu kỳ, lượt kế, bộ đếm đã làm; nút “Xong / Làm thay / Đổi lượt” tách biệt rõ.
- **Nhắc hẹn**: mỗi lịch có biểu tượng loại lặp, ngày giờ kế tiếp, tag “kèm số nợ”.
- **Cài đặt**: mã phòng có affordance copy rõ; mã mời hiển thị to kèm đếm ngược; chẩn đoạn dùng chấm màu + câu Plain language.

### Motion
- Một lần “reveal” duy nhất cho hero khi tải, không phát tán cho từng card.
- Motion chỉ phản hồi hành động người dùng: thêm/sửa/xoá khoản, mở sheet, bật thông báo, chốt kỳ, gửi thử thông báo.
- 140ms cho hover/focus, 220ms cho thay đổi nội dung, 320ms cho sheet; `prefers-reduced-motion` tắt toàn bộ.

### Khả năng dùng
- Focus ring rõ, contrast tối thiểu 4.5:1 cho chữ thường, toast dùng `role="status"`, nút có `aria-label` khi chỉ dùng biểu tượng.

## Builder
Sau khi duyệt: dùng `writing-plans` để chia nhỏ, rồi sửa trực tiếp trong `index.html` + `sw.js`, kiểm tra bằng browser/screenshot, cuối cùng commit + push và xác nhận `sw.js` trên GitHub Pages đã trả về `ttt-v33`.
