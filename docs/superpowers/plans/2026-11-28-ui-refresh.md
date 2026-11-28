# UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm mới toàn bộ giao diện HILL-RENT theo hướng “làm mới có chừng mực”: sống động hơn, trực quan hơn, giữ nguyên logic và khả năng offline.

**Architecture:** Chỉ chỉnh CSS và các hàm render HTML trong `index.html`; không đụng `Code.gs`, không đổi `id`, `onclick`, tên hàm hay luồng đồng bộ. Hero trở thành thẻ nợ, danh sách/trực nhật/nhắc hẹn/cài đặt có hierarchy riêng, motion chỉ phản hồi thao tác. Cuối cùng tăng phiên bản và push.

**Tech Stack:** HTML/CSS/JS thuần, một file `index.html`; PWA qua `sw.js`; GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-28-ui-refresh-design.md`

## Global Constraints

- Giữ nguyên mọi `id`, `onclick="..."`, tên hàm JS hiện có trong `index.html`.
- Không thêm thư viện/font/CDN ngoài; không đổi localStorage keys (`ttt`, `tttq`, `tttcfg`, `tttdev`, `tttpush`, `tttsynced`).
- Không đổi `share()`, `calc()`, `sync()`, `flush()`, `pull()`, `call()`, `Code.gs`.
- Sau khi sửa: `sw.js` → `const V='ttt-v33'`; `index.html` → `APP_V='ttt-v33'`, `APP_DATE='28/11/2026'`.
- Repo phải sạch `## main...origin/main` sau khi push; commit message tiếng Việt.
- Tôn trọng `prefers-reduced-motion`; focus ring rõ; chữ thường contrast ≥ 4.5:1.

## Review Focus

| Input / điều kiện | Hành vi kỳ vọng | Task kiểm tra |
|---|---|---|
| `S.hist`, `S.chores`, `S.rem` thiếu hoặc không phải mảng | vẫn render, không throw | Task 2, 4 |
| `S.names` có `<`, `&`, dấu nháy | escaped qua `esc()`/`E`, không chèn HTML | Task 2, 3 |
| `net > 0`, `net < 0`, `net = 0`, `pay` vượt nợ | chiều chuyển đúng; confetti chỉ khi về hoà vốn | Task 2 |
| `tttq` có job chờ gửi | badge `#qb` vẫn hiện, không bị nav/layout mới che | Task 3, 6 |
| Dark mode + `prefers-reduced-motion: reduce` | màu đủ tương phản, motion tắt hoàn toàn | Task 1, 6 |
| Mobile có bàn phím ảo (`visualViewport`) | sheet vẫn hiển thị input, không bị che | Task 1, 5 |

---

### Task 1: Nền tảng thị giác (tokens, type, base, nav, sheet)

**Files:**
- Modify: `index.html` — khối `<style>` từ `:root` đến `@media(prefers-reduced-motion...)`

**Interfaces:**
- Consumes: cấu trúc HTML hiện có, các class `.card`, `.top`, `.w`, `#nav`, `#sheet`, `#msheet`, `#gate`, `#toast`, `#fab`.
- Produces: bộ CSS variables mới (`--ink`, `--violet`, `--mint`, `--amber`, `--paper`), type scale, dark mode, nav/sheet/toast đã làm mới; **không đổi selector ID nào**.

- [ ] **Step 1: Thay palette và type scale trong `:root` / dark mode**
  Giữ `--a`/`--btn1` làm alias để code cũ không gãy; thêm `--ink`, `--mint`, `--amber`, `--paper`. Dùng `tabular-nums` cho số tiền.

- [ ] **Step 2: Làm mới base + card + nút**
  Bo góc phân cấp (hero 24px, card 18px, control 12px), bỏ shadow đồng loạt, dùng border mảnh + shadow rất nhẹ. Nút primary là gradient tím có chủ đích; nút `.g` là nền paper.

- [ ] **Step 3: Làm mới nav, sheet, toast, gate**
  Mobile: nav dưới, active pill trượt; Desktop `≥900px`: sidebar dọc, sheet thành modal giữa. Toast có `role` bằng markup/JS ở Task 6; đảm badge `#qb` nằm trên cùng.

- [ ] **Step 4: Kiểm tra trực quan**
  Mở file trong browser ở 390px và 1280px, sáng/tối; xác nhận không có control nào bị che, focus ring nhìn rõ.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: lam moi nen tang thi giac va responsive"
```

---

### Task 2: Hero “thẻ nợ” + thống kê

**Files:**
- Modify: `index.html` — hàm `render()` (template `#hero`), hàm `renderHist()`, hàm `renderStats()`, CSS `.hero`, `.flow`, `.stat`, `.bar`, `.hb`, `#scard`.

**Interfaces:**
- Consumes: `S`, `calc()`, `fmt()`, `esc()/E`, `share()`, `heroAnim()`, `netInfo()`, `openPay()`, `openClose()`.
- Produces: hero markup mới với các `id` bắt buộc `hpay`, `hclose`; stats markup mới trong `#slist`, nhãn `#savg`.

- [ ] **Step 1: Viết lại template `#hero`**
  Dòng 1: `Kỳ … · N khoản` + chip trạng thái (`Đang nợ` / `Đã hoà vốn`). Giữa: chữ “Cần chuyển”, số lớn, flow `avatar → tên → mũi tên → tên → avatar`. Dưới: thanh tỉ lệ có 2 nhãn “phải trả”, 2 nút `hpay` (chỉ khi nợ) và `hclose`.

- [ ] **Step 2: Giữ animation**
  `heroAnim()` vẫn nhận `Math.abs(net)` và `o` như cũ; không đổi `lastAmt`, `lastO`, `lastW`, `celebrate`.

- [ ] **Step 3: Làm mới `#scard` / `renderStats()`**
  Ba thanh so sánh kỳ, chênh lệch %, khoản tốn nhất, trung bình mỗi người. Ẩn card khi `rows.every(r => r.total <= 0)`.

- [ ] **Step 4: Kiểm tra các case nợ**
  Với dữ liệu mẫu: `net > 0`, `net < 0`, `net = 0`, có khoản `pay` vượt nợ. So sánh chiều mũi tên với `netInfo()`, đảm không lệch.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: bien hero than thet no va lam ro thong ke"
```

---

### Task 3: Danh sách chi, recent, sheet thêm/sửa, empty state

**Files:**
- Modify: `index.html` — `render()` phần `#list`, `recent()`, `vis()`, `preview()`, `add()`, `edit()`, `delNow()`, CSS `.it`, `.dot`, `.pill`, `.amt`, `.empty`, `.gh`, `#quick`, `.qchip`.

**Interfaces:**
- Consumes: `S.items`, `S.names`, `norm()`, `dk`, `mt`, `shown`, `delq`, `esc()/E`, `share()`, `fmt()`.
- Produces: danh sách nhóm theo ngày, màu badge theo người chi, nhãn mode rõ, khoản `pay` dùng mint; empty state có lời gọi hành động.

- [ ] **Step 1: Đổi cấu trúc dòng khoản chi**
  Badge chữ cái đầu, tên khoản, dòng `Người chi → Người chịu` (riêng `pay`: `đã chuyển`), pill cách chia, số tiền + phần nợ, nút xoá. Giữ nguyên `data-id`, `onclick="edit(id)"`, `onclick="del(id)"`.

- [ ] **Step 2: Empty state và recent**
  `#list` rỗng → `<div class="empty">…<button onclick="document.getElementById('fab').click()">+ Thêm khoản chi</button></div>`. `#recent` tối đa 4 dòng, cùng ngôn ngữ màu.

- [ ] **Step 3: Quick chips & preview trong sheet**
  Chip định kỳ có trạng thái “đang dùng”, `#prev` hiển thị đúng `fmt(c.total) → … nợ …`.

- [ ] **Step 4: Kiểm tra tương tác**
  Thêm, sửa, xoá + Hoàn tác, tìm kiếm dấu tiếng Việt, mở sheet trên mobile có bàn phím.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: lam ro danh sach chi va trang thai giao dich"
```

---

### Task 4: Trực nhật & nhắc hẹn

**Files:**
- Modify: `index.html` — `renderChores()`, `rrender()`, `rfill()`, `redit()`, `rsnooze()`, `rdel()`, CSS `.cw`, `.ca`, `.cst`, `.codebox` và các input form.

**Interfaces:**
- Consumes: `S.chores`, `S.rem`, `S.names`, `cyc()`, `isoD()`, `dmy()`, `WD`, `openMini()`, `sync()`.
- Produces: card trực nhật có avatar người trực, chip chu kỳ, lượt kế, bộ đếm; lịch nhắc có biểu tượng lặp + ngày kế tiếp + tag kèm số nợ.

- [ ] **Step 1: `renderChores()`**
  Mỗi việc: avatar lớn hơn, `Đến lượt X tuần này · lượt kế dd/mm: Y`, `Đã làm: X n · Y n`, 3 nút `Xong / Y làm thay / Đổi lượt`. Giữ `onclick` cũ.

- [ ] **Step 2: `rrender()`**
  Mỗi lịch: biểu tượng loại lặp (📅 / 🔁 / 1 lần), nội dung, `ngày dd/mm · HH:mm`, tag “kèm số nợ”, 3 nút hoãn/sửa/xoá như cũ.

- [ ] **Step 3: Kiểm tra thiếu mảng**
  Gán `S.chores = undefined`, `S.rem = undefined` rồi gọi `render()` — phải không throw nhờ `|| []` hiện có.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: lam ro lich truc nhat va nhac hen"
```

---

### Task 5: Cài đặt, phòng, chẩn đoán, bản quyền

**Files:**
- Modify: `index.html` — HTML trong `#v-cai`, CSS `#roomOn`, `.codebox`, `#invbox`, `#diag`, `#vercard`, hàm `roomUI()`, `checkVer()`, `$('diagb').onclick`, `$('testb').onclick`.

**Interfaces:**
- Consumes: `cfg`, `DEFAULT`, `call()`, `st()`, `APP_V`, `APP_DATE`, `vNum()`, `vShow()`.
- Produces: mã phòng có affordance copy, mã mời to + đếm ngược, chẩn đoạn bằng chấm màu + câu dễ hiểu, thẻ phiên bản rõ ràng.

- [ ] **Step 1: Làm mới markup Cài đặt**
  Nhóm “Kỳ và tên”, “Phòng”, “Thông báo & nhắc hẹn”, “Phiên bản”, “Xoá hết khoản chi” thành 4 card có tiêu đề phụ ngắn. Giữ nguyên mọi `id`.

- [ ] **Step 2: Trạng thái chẩn đoán**
  `health` thiếu trigger/SA/token → chấm đỏ và câu hướng dẫn đúng; đủ → chấm xanh. Giữ nội dung thông báo hiện tại.

- [ ] **Step 3: Kiểm tra mobile có bàn phím**
  Mở Cài đặt, focus ô link/mã phòng trên viewport nhỏ; sheet/nav không che input.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: lam ro cai dat phong va chan doan"
```

---

### Task 6: Motion có chừng, a11y, tăng phiên bản, push

**Files:**
- Modify: `index.html` — `toast()`, CSS `@keyframes`, `@media(prefers-reduced-motion...)`, `APP_V`, `APP_DATE`; Modify `sw.js` — `V`.

**Interfaces:**
- Consumes: `calm()`, `confetti()`, `heroAnim()`, `render()`.
- Produces: một reveal cho hero lúc tải; motion khác chỉ sau thao tác; toast `role="status"`; `ttt-v33` ở cả hai file.

- [ ] **Step 1: Rà motion**
  Giữ `newRow`, `viewIn`, `sheetIn`, `arFlow`, `confetti`; xoá animation lặp không cần thiết; đảm `@media(prefers-reduced-motion:reduce)` đặt `animation-duration:.01ms!important` như cũ.

- [ ] **Step 2: Toast accessibility**
  Trong `toast()`, thêm `e.setAttribute('role','status')` và `aria-live='polite'`. Không đổi text/act.

- [ ] **Step 3: Tăng phiên bản**
  `sw.js`: `const V='ttt-v33';`. `index.html`: `const APP_V='ttt-v33',APP_DATE='28/11/2026'`.

- [ ] **Step 4: Kiểm tra trước push**
  Chạy browser ở 390px + 1280px, sáng/tối, reduced-motion; xác nhận `#qb` hiện khi `tttq` có job; `git diff --check`; `git status -sb`.

- [ ] **Step 5: Commit + push**

```bash
git add -A
git commit -m "feat: lam moi toan bo UI va tang phien ban v33"
git pull --rebase origin main
git push origin main
```

- [ ] **Step 6: Xác nhận deploy**
  Đợi ~1 phút rồi fetch `https://trannhutquy.github.io/HILL-RENT/sw.js`, xác nhận có `ttt-v33`; `git status -sb` phải là `## main...origin/main`.

---

## Execution method
Native: mình tự làm từng task trong session này, rồi commit+push. Không dùng subagent vì các task cùng sửa một file `index.html` và cần nhất quán tay người dùng cuối.
