# HILL-RENT — Tính tiền trọ (PWA)

- Repo: https://github.com/trannhutquy/HILL-RENT (nhánh `main`)
- Bản chạy: https://trannhutquy.github.io/HILL-RENT/ (GitHub Pages, deploy từ `main`)
- Backend: Google Apps Script + Google Sheet (dán `Code.gs` vào Sheet > Tiện ích mở rộng > Apps Script)

## Quy tắc: tự động commit & push

Khi có bất kỳ thay đổi nào trong thư mục này, **luôn commit và push lên GitHub** (không để thay đổi nằm lại trên máy):

```powershell
cd D:\TONG_HOP\BACKUP_HILL\TIEN_TRO
git add -A
git commit -m "<mô tả ngắn, tiếng Việt>"
git push origin main
```

- Chỉ commit khi thay đổi đã chạy được; không commit file rác, bản sao tạm (`App_Scrift/`, `*.bak`, `*.tmp` đã nằm trong `.gitignore`).
- Nếu push bị từ chối do remote có commit mới: `git pull --rebase origin main` rồi push lại.
- Kiểm tra sau khi push: `git status -sb` phải hiện `## main...origin/main` (không còn `ahead`).

## Sau khi sửa app (index.html, CSS/JS)

1. Tăng phiên bản cache trong `sw.js`: `const V='ttt-vNN'` → `ttt-vNN+1`. SW dùng network-first nên bản mới vẫn tới máy khi có mạng; tăng `V` để bản dùng offline cũng là bản mới.
2. Sửa **cùng số** trong `index.html`: `const APP_V='ttt-vNN'` và `APP_DATE='dd/mm/yyyy'` (mục Cài đặt > Phiên bản hiển thị hai giá trị này; nút "Kiểm tra cập nhật" so sánh với `sw.js` trên mạng nên hai chỗ lệch nhau sẽ báo sai).
3. Push xong đợi ~1 phút, mở https://trannhutquy.github.io/HILL-RENT/sw.js kiểm tra đã thấy `ttt-vNN` mới.
4. Trên điện thoại: mở app 2 lần (hoặc tải lại) để service worker nhận bản mới.

## Dữ liệu trên máy

- `localStorage.ttt` = dữ liệu hiện tại; `localStorage.tttq` = **hàng đợi thao tác chưa gửi được** (index.html). Không xoá `tttq` khi đang sửa code — đó là các khoản chi chưa lên Sheet.
- `localStorage.tttcfg` = link `/exec` + mã phòng; `tttdev` = id máy (dùng cho thông báo đẩy).

## Sau khi sửa backend (Code.gs)

File `Code.gs` trên repo chỉ là bản lưu. Muốn có hiệu lực phải:
1. Dán toàn bộ `Code.gs` vào Apps Script của Sheet.
2. Triển khai > Quản lý bản triển khai > Chỉnh sửa > Phiên bản mới (giữ nguyên link `/exec`).

## Lưu ý

- `index.html` chứa sẵn link `/exec` mặc định (`DEFAULT.url`) và cấu hình Firebase công khai (apiKey, vapidKey) — bình thường với web FCM, nhưng đừng thêm khoá bí mật nào khác vào frontend.
- Service account Firebase nằm ở Script property `SA` của Apps Script, **không** đưa vào repo.
