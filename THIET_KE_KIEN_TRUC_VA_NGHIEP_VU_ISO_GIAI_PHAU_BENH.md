# HỒ SƠ DỰ ÁN: e-ISO PATHOLOGY TRACKER – KHOA GIẢI PHẪU BỆNH
## BẢN MÔ TẢ TOÀN BỘ THIẾT KẾ KIẾN TRÚC VÀ NGHIỆP VỤ

---

## 1. MỤC TIÊU & SẢN PHẨM ĐẦU RA
- **Tên hệ thống:** e-ISO Pathology Tracker – Khoa Giải phẫu bệnh
- **Tên miền hoạt động chính thức:** `https://isogiaiphaubenh.bstrung.vn`
- **Kho lưu trữ GitHub chính thức:** `https://github.com/bsluongdinhtrung-hue/ISOGPB.git` (nhánh `main`)
- **Mục tiêu số 1:** Quản lý **ĐẦU VIỆC** theo tiêu chuẩn **ISO 15189** ở cấp quản lý của Trưởng khoa và cán bộ nhân viên: ai phụ trách, hạn chót, trạng thái, minh chứng thực hiện, cảnh báo chậm trễ, phê duyệt báo cáo.
- **Quy tắc vàng:** Không thay thế hồ sơ ISO chi tiết hay hệ thống LIS/HIS; không nhập chi tiết từng máy móc hay từng ca bệnh phẩm/lam/block. Hệ thống đóng vai trò là **Trung tâm chỉ huy & Điều phối (Hub)**.

---

## 2. QUY TẮC RIÊNG CỦA DỰ ÁN
1. **Sửa đúng chỗ, phạm vi tối thiểu (Surgical Edit):** Không sửa lan man, không viết lại những thành phần đang chạy tốt.
2. **Kiểm tra trước khi đẩy code:** Phải chạy `npm run build` và kiểm thử chức năng tự động để đảm bảo 0 lỗi trước khi commit.
3. **Đồng bộ GitHub:** Chỉ đẩy lên nhánh `main` của repository `ISOGPB`.
4. **Bảo mật xác thực & Dữ liệu:**
   - Mật khẩu được mã hóa an toàn bằng `bcrypt` (cost factor 10), tuyệt đối không lưu hoặc so sánh mật khẩu dạng chữ thường (plaintext).
   - Không chứa bất kỳ mật khẩu cố định nào trong mã nguồn hoặc cửa sau (backdoor) trong cơ chế dự phòng.
   - Khi tạo nhân viên mới hoặc đặt lại mật khẩu: Sinh mật khẩu tạm thời ngẫu nhiên $\ge 10$ ký tự, bắt buộc đổi mật khẩu mới ở lần đăng nhập đầu tiên.
   - Tuyệt đối không đưa số điện thoại cá nhân, mật khẩu, file nguyên liệu thô vào file hồ sơ hay commit lên git.

---

## 3. THIẾT KẾ KIẾN TRÚC VÀ NGHIỆP VỤ

### 3.1. Danh mục nhân sự hạt nhân & Phân quyền
Danh sách cán bộ nhân sự chuẩn theo cơ cấu khoa (không lưu mật khẩu, thông tin riêng tư):

| Mã NV | Họ và tên | Chức danh | Vai trò (Role) | Ghi chú tài khoản |
| :---: | :--- | :--- | :---: | :--- |
| **U001** | **Đào Thị Nguyệt** | Trưởng khoa | **ADMIN** | Quản trị chuyên môn, phê duyệt báo cáo |
| **U002** | **Lê Tuấn Anh** | Bác sĩ | **USER** | Cán bộ thực hiện |
| **U003** | **Nguyễn Thị Ngân** | Bác sĩ | **USER** | Cán bộ thực hiện |
| **U004** | **Lương Thị Thùy Dung** | Kỹ thuật viên | **USER** | Cán bộ thực hiện |
| **U005** | **Nguyễn Thị Thu Hương** | Kỹ thuật viên | **USER** | Cán bộ thực hiện |
| **U006** | **Trần Thị Vân** | Kỹ thuật viên | **USER** | Cán bộ thực hiện |
| **U007** | **Dương Văn Quang** | Kỹ thuật viên | **USER** | Cán bộ thực hiện |
| **U008** | **Lại Hải Hà** | Kỹ thuật viên | **USER** | Cán bộ thực hiện |
| **ADMIN**| **Lương Đình Trung** | Bác sĩ / Quản trị hệ thống | **ADMIN** | Quản trị kỹ thuật và hệ thống |

**Ma trận phân quyền:**
- **Admin (Trưởng khoa Đào Thị Nguyệt & BS. Lương Đình Trung):**
  - Xem toàn cảnh Dashboard khoa; duyệt / yêu cầu làm lại các báo cáo của nhân viên kèm minh chứng trực quan.
  - Điều chỉnh phân công người phụ trách, chu kỳ, hạn chót, số ngày nhắc trước tại Bảng phân công (`/assignment`).
  - Quản lý danh sách nhân sự tại `/admin/users`: Thêm, sửa, vô hiệu hóa, xóa, cấp lại mật khẩu tạm thời ngẫu nhiên.
  - Xem lịch sử nhật ký kiểm toán (Audit Log) toàn khoa.
- **User (Bác sĩ, Kỹ thuật viên):**
  - Xem toàn cảnh Dashboard để nắm tiến độ chung của toàn khoa.
  - Xem danh sách công việc được giao của chính mình tại trang "Đầu việc của tôi" (`/my-tasks`).
  - Nộp báo cáo hoàn thành, ghi chú và đính kèm minh chứng cho công việc của mình. Nút nộp báo cáo cho việc của người khác bị khóa mờ (chống nộp thay).
  - Tự đổi mật khẩu cá nhân tại `/change-password`.

---

### 3.2. Danh mục 30 đầu việc quản lý ISO 15189

| Mã | Mã ISO | Tên đầu việc quản lý | Người phụ trách | Tần suất | Quy tắc hạn hoàn thành | Trưởng khoa duyệt? | Nhắc trước | Link ngoài mặc định |
| :---: | :---: | :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| **W001** | `XN.QL.01` | Quản lý trang thiết bị | **Dương Văn Quang** | Hàng tháng | Chốt rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | 👉 `https://quanlithietbi.bstrung.vn` |
| **W002** | `XN.QL.02` | Kiểm soát sự không phù hợp (NC) | **Nguyễn Thị Thu Hương** | Phát sinh | Cập nhật xử lý trong 24 giờ đầu | **Có** | 0 ngày | |
| **W003** | `XN.QL.03` | Hành động khắc phục (CAPA) | **Nguyễn Thị Thu Hương** | Phát sinh | Mặc định 14 ngày sau khi mở CAPA | **Có** | 3 ngày | |
| **W004** | `XN.QL.04` | Xem xét của lãnh đạo | **Đào Thị Nguyệt** | Hàng năm | Hoàn thành trước ngày 30/11 hàng năm | **Có** | 14 ngày | |
| **W005** | `XN.QL.05` | Đào tạo nhân viên | **Lương Thị Thùy Dung** | Hàng quý | Trước ngày 05 của tháng đầu quý sau | Không | 5 ngày | |
| **W006** | `XN.QL.06` | Đánh giá tay nghề / năng lực | **Lương Thị Thùy Dung** | Hàng năm | Hoàn thành trước ngày 15/12 hàng năm | Không | 14 ngày | |
| **W007** | `XN.QL.07` | Xem xét, thỏa thuận dịch vụ | **Lại Hải Hà** | Hàng năm / Đổi | Rà soát định kỳ trước 30/11 | Không | 7 ngày | |
| **W008** | `XN.QL.08` | Lựa chọn và đánh giá nhà cung cấp | **Dương Văn Quang** | Hàng năm | Hoàn thành trước ngày 30/11 hàng năm | Không | 14 ngày | |
| **W009** | `XN.QL.09` | Giải quyết khiếu nại khách hàng | **Trần Thị Vân** | Phát sinh | Tiếp nhận trong ngày; Trưởng khoa đặt hạn | **Có** | 0 ngày | |
| **W010** | `XN.QL.10` | Kiểm soát môi trường xét nghiệm | **Trần Thị Vân** | Hàng ngày | Hoàn thành trước 09:00 ngày làm việc | Không | 0 ngày | |
| **W011** | `XN.QL.12` | Quản lý thông tin phòng xét nghiệm | **Nguyễn Thị Thu Hương** | Hàng quý | Rà soát trước ngày 05 tháng đầu quý sau | Không | 5 ngày | |
| **W012** | `XN.QL.18` | Ngoại kiểm | **Lê Tuấn Anh** | Theo đợt | Hạn theo đợt chương trình ngoại kiểm | Không | 5 ngày | |
| **W013** | `XN.QL.19` | Quản lý sinh phẩm, vật tư, hóa chất | **Dương Văn Quang** | Hàng tháng | Chốt rà soát trước ngày 03 tháng kế tiếp | Không | 3 ngày | |
| **W014** | `XN.QL.20` | Đảm bảo tính khách quan | **Lê Tuấn Anh** | Hàng năm / Đổi | Rà soát trước 30/11; cập nhật khi có sự việc | **Có** | 14 ngày | |
| **W015** | `XN.QL.22` | Bảo mật thông tin | **Lê Tuấn Anh** | Hàng năm / Đổi | Rà soát trước 30/11; sự cố tạo ngay trong ngày| **Có** | 14 ngày | |
| **W016** | `XN.QL.24` | Quản lý rủi ro | **Trần Thị Vân** | Hàng quý | Rà soát trước ngày 05 tháng đầu quý sau | **Có** | 7 ngày | |
| **W017** | `XN.QL.25` | Cải tiến liên tục | **Lại Hải Hà** | Hàng quý | Chốt tiến độ trước ngày 10 tháng đầu quý sau | **Có** | 7 ngày | |
| **W018** | `XN.QL.26` | Khảo sát sự hài lòng khách hàng | **Lê Tuấn Anh** | Hàng quý | Tổng hợp trước ngày 10 tháng đầu quý sau | Không | 7 ngày | |
| **W019** | `XN.QL.27` | Quản lý hồ sơ | **Lại Hải Hà** | Hàng tháng | Rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W020** | `XN.QL.28` | Đánh giá nội bộ | **Nguyễn Thị Ngân** | Hàng năm | Hoàn thành trước ngày 31/10 hàng năm | **Có** | 14 ngày | |
| **W021** | `XN.QL.29` | Theo dõi & đánh giá bộ chỉ số CL | **Lại Hải Hà** | Hàng tháng | Chốt số liệu trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W022** | `XN.QL.30` | Quản lý nhân sự | **Lương Thị Thùy Dung** | Hàng tháng / Đổi | Rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W023** | `XN.QL.31` | Lựa chọn & chuyển gửi mẫu ngoại viện | **Đào Thị Nguyệt** | Phát sinh / Quý | Rà soát trước ngày 05 tháng đầu quý sau | **Có** | 3 ngày | |
| **W024** | `HT.QL.01` | Kiểm soát tài liệu hệ thống QLCL | **Lại Hải Hà** | Hàng tháng / Đổi | Rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W025** | `GB.QL.02` | Tiếp nhận mẫu Giải phẫu bệnh | **Lương Thị Thùy Dung** | Hàng ngày | Hoàn thành trước 16:30 ngày làm việc | Không | 0 ngày | |
| **W026** | `GB.QL.04` | Báo cáo kết quả Giải phẫu bệnh | **Lương Thị Thùy Dung** | Hàng tháng | Rà soát TAT trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W027** | `GB.QL.05` | Lưu mẫu & xử lý mẫu hết hạn lưu | **Lương Thị Thùy Dung** | Hàng tháng | Rà soát trước ngày 10 tháng kế tiếp | Không | 5 ngày | |
| **W028** | `GB.QL.06-07`| Lưu lam/block và mượn trả | **Lương Thị Thùy Dung** | Hàng tháng | Rà soát trước ngày 05 tháng kế tiếp | Không | 3 ngày | |
| **W029** | `GB.QL.08` | Nội kiểm | **Lê Tuấn Anh** | Hàng tháng | Chốt tổng hợp trước ngày 05 tháng kế tiếp | Không | 3 ngày | *(Linh hoạt gắn link ngoài)* |
| **W030** | `GB.QL.09` | Xác nhận giá trị SD / duyệt phương pháp | **Nguyễn Thị Ngân** | Phát sinh | Hạn do Trưởng khoa đặt theo kế hoạch | **Có** | 7 ngày | *(Linh hoạt gắn link ngoài)* |

*(Ghi chú: Trưởng khoa Đào Thị Nguyệt trực tiếp phụ trách đúng 2 việc: `W004` và `W023`).*

---

### 3.3. Thiết kế Logic Tính hạn & 5 Trạng thái Chuẩn ISO
Hệ thống sử dụng **5 trạng thái vận hành chuẩn**:
1. **`OVERDUE` (Quá hạn - Thẻ đỏ):** `Hôm nay > Due_Date` VÀ chưa có `Completed_Date`. Hiển thị nhãn trễ `(Trễ X ngày)`.
2. **`DUE_SOON` (Sắp đến hạn - Thẻ vàng):** `Hôm nay >= Due_Date - Reminder_Days` VÀ chưa hoàn thành.
3. **`NOT_DUE` (Chưa đến hạn - Thẻ xám):** `Hôm nay < Due_Date - Reminder_Days`.
4. **`PENDING_APPROVAL` (Chờ duyệt - Thẻ xanh lơ):** Nhân viên đã nộp báo cáo hoàn thành, đang chờ Trưởng khoa xem xét phê duyệt.
5. **`COMPLETED` (Đã hoàn thành - Thẻ xanh lá):** Đã có `Completed_Date` và được Trưởng khoa duyệt (nếu có yêu cầu duyệt).

**Quy tắc sinh hạn & Quét quá hạn tự động lúc 17:05 Chiều:**
- **Hàng ngày (Daily):** Tính các ngày làm việc Thứ 2 – Thứ 6 (tự động bỏ qua Thứ 7, Chủ nhật). Nếu nhân viên không làm ngày hôm trước, task cũ được giữ nguyên và tự động chuyển thành `OVERDUE` khi bước sang ngày mới để kiểm soát nợ việc.
- **Quét Quá hạn Tự động (17:05 Overdue Sweep):** Khi cron tự động kích hoạt vào lúc **17:05 chiều hàng ngày (sau giờ làm việc hành chính 16:30)**, hệ thống quét toàn bộ task chưa hoàn thành trong CSDL. Nếu `Hôm nay > due_date`, hệ thống tự động đổi trạng thái sang `OVERDUE`.
- **Hàng tháng:** Hạn là ngày 03, 05 hoặc 10 của tháng kế tiếp.
- **Hàng quý:** Hạn là ngày 05 hoặc 10 của tháng đầu quý kế tiếp.
- **Hàng năm:** Hạn cố định theo lịch khoa (31/10, 30/11, 15/12).
- **Phát sinh:** Khởi tạo linh hoạt theo kế hoạch khi có sự cố, CAPA, khiếu nại.

---

### 3.4. Thiết kế Các Màn hình Chức năng
1. **Dashboard Tổng quan (`/`):**
   - **4 Thẻ KPI Chuẩn hóa mẫu số 30 việc ISO:** Loại bỏ mẫu số động; Thẻ Hoàn thành thể hiện rõ: `X lượt đã nộp / 30 việc ISO (Y đầu việc đã xong)`. Thẻ Quá hạn và Sắp đến hạn hiển thị rõ số lượt trễ và số đầu việc bị nợ.
   - **Khu vực Phê duyệt Trực quan cho Trưởng khoa:** Hiển thị trực tiếp ảnh thumbnail của sổ ghi chép / tài liệu minh chứng. Tích hợp bộ xem ảnh **Lightbox Modal** phóng to sắc nét đọc từng số liệu. Cảnh báo đỏ nếu nhân viên nộp form trống không minh chứng.
   - **Bảng Điểm nghẽn đúng 7 cột chuẩn:** `STT`, `Mã`, `Đầu việc quản lý`, `Phụ trách`, `Hạn hoàn thành (kèm số ngày trễ)`, `Trạng thái`, `Thao tác` (có nút xem minh chứng trực tiếp).
   - **Bảng 30 Đầu việc Quản lý Chất lượng (ISO 15189):** Gom nhóm duy trì đúng 30 dòng đại diện (W001–W030). Có cột Link ngoài gắn trực tiếp vào Supabase không bị mất khi F5; modal xem lịch sử nộp chi tiết nhiều ngày.
2. **Trang "Đầu việc của tôi" (`/my-tasks`):**
   - Lọc chính xác công việc của cá nhân đăng nhập.
   - **Khóa mờ nút nộp báo cáo (Đúng người đúng việc):** Nút nộp báo cáo việc người khác tự động bị vô hiệu hóa kèm biểu tượng ổ khóa 🔒. Backend Server Action kiểm tra chéo session đăng nhập ngăn chặn nộp thay.
   - Hỗ trợ tải ảnh Camera, Thư viện ảnh điện thoại và tệp PDF/Word. Tự động nén ảnh client-side từ 5-15MB xuống 200-500KB.
3. **Trang Bảng phân công (`/assignment`):** Dành cho Admin điều chỉnh người phụ trách, chu kỳ, hạn chót, tạo việc phát sinh.
4. **Trang Quản lý Nhân sự (`/admin/users`):** Thêm nhân viên mới, cấp mật khẩu tạm ngẫu nhiên, vô hiệu hóa / kích hoạt tài khoản.

---

### 3.5. Hạ tầng & Kiến trúc Phòng thủ
- **Cơ sở dữ liệu chính:** Supabase PostgreSQL (Project Ref: `fkjmiatwdcgxdkqnwhgn`) lưu trữ toàn bộ người dùng, 30 đầu việc, danh sách task và lịch sử kiểm toán.
- **Hệ thống Góp ý (Feedback):** Firebase Firestore (`app/actions/feedback.ts`).
- **Kiến trúc Giữ thức 2 lớp Vĩnh viễn (Dual Engine Keep-Alive 17:05 VN):**
  - *Lớp 1 (GitHub Actions - `supabase-keep-alive.yml`):* Ping `iso_work_items` và gọi Web Dashboard lúc 10:05 UTC (17:05 VN) bằng API Secret an toàn; tích hợp cơ chế tự động duy trì workflow native.
  - *Lớp 2 (Vercel Cron Job - `vercel.json`):* Chạy độc lập trên hạ tầng Vercel lúc 10:05 UTC gọi `/api/cron/keep-alive`.
- **In-Memory Caching & Fallback Data:** Lưu cache trên server để tối ưu tốc độ và tiết kiệm băng thông; dữ liệu dự phòng `lib/fallback-data.ts` đảm bảo giao diện luôn hiển thị khi mạng gián đoạn.

---

## 4. NHẬT KÝ THAY ĐỔI THEO NGÀY
- **22/09/2026:** Khởi tạo kiến trúc e-ISO Pathology Tracker; chuyển phương thức xác thực từ Google Sign-In sang Đăng nhập nội bộ Cán bộ nhân viên.
- **26/09/2026:** Triển khai Kiến trúc Giữ thức Vĩnh viễn 2 lớp (Dual Engine Keep-Alive) kết hợp tự động quét quá hạn lúc 17:05 chiều giờ Việt Nam.
- **01/10/2026:** Chuẩn hóa KPI mẫu số 30 đầu việc ISO; nâng cấp Bảng Điểm nghẽn lên 7 cột có STT; thiết lập cơ chế khóa mờ nộp thay và bộ xem minh chứng Lightbox Modal cho Trưởng khoa.
- **17/10/2026:** Nâng cấp toàn diện bảo mật: chuyển sang băm mật khẩu `bcrypt` (cost factor 10), xóa bỏ toàn bộ mật khẩu cố định và cửa sau fallback; xóa thông tin nhạy cảm (SĐT, email cá nhân) khỏi hồ sơ; dọn dẹp và chuẩn hóa thư mục dự án theo `rule.md` mục 5.
