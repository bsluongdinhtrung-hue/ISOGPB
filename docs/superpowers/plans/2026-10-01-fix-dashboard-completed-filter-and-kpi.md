# Đồng Bộ Hiển Thị KPI Hoàn Thành & Lọc Lịch Sử 30 Đầu Việc ISO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuẩn hóa cách tính và hiển thị KPI "Đã hoàn thành" khớp với chuẩn 30 đầu việc ISO của khoa, đồng thời sửa logic lọc để khi Trưởng khoa bấm lọc "Đã xong" sẽ hiển thị đầy đủ các đầu việc đã nộp (như XN.QL.10 của CN. Trần Thị Vân) kèm modal xem lịch sử các ngày nộp và minh chứng.

**Architecture:** 
1. Mở rộng `DashboardStats` để gắn chặt mẫu số với 30 đầu việc quản lý chất lượng ISO của khoa thay vì mẫu số động gây hiểu nhầm (26).
2. Nâng cấp `groupedWorkItems` trong `ExecutiveDashboard.tsx` để gom nhóm toàn bộ các lượt ghi nhận nhật ký (task instances) theo từng đầu việc, theo dõi số ngày đã nộp (`completedInstancesCount`) và danh sách các ngày (`historyTasks`).
3. Cập nhật bộ lọc "Đã xong" (`COMPLETED`) và bộ đếm tab để bao gồm các đầu việc có lượt hoàn thành trong kỳ.
4. Thêm modal xem lịch sử nộp báo cáo theo từng ngày cho Trưởng khoa kiểm tra minh chứng chi tiết.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Supabase PostgreSQL.

**Spec:** `THIET_KE_KIEN_TRUC_VA_NGHIEP_VU_ISO_GIAI_PHAU_BENH.md` & yêu cầu trao đổi trực tiếp với BSCKI. Lương Đình Trung.

## Global Constraints
- Tuân thủ quy định: không thay đổi tên các trường dữ liệu cũ trong Supabase / Firebase.
- Thiết kế UI chuẩn y tế hiện đại (Medical Precision 2026), trang nhã, không dùng từ ngữ công nghệ khó hiểu cho Trưởng khoa.
- Tối ưu hiệu năng, không gọi thêm request thừa đến cơ sở dữ liệu.

## Review Focus
1. Khi bấm vào thẻ "ĐÃ HOÀN THÀNH", bảng 30 đầu việc phải hiển thị đầu việc `XN.QL.10` (CN. Trần Thị Vân) thay vì ra 0 dòng.
2. Thẻ KPI hiển thị mẫu số chuẩn `30 đầu việc ISO` thay vì `26`.
3. Số lượng trên tab nút lọc "Đã xong" phải khớp với số dòng xuất hiện trên bảng.
4. Trưởng khoa bấm "Xem lịch sử nộp" xem được đủ 7 ngày của CN. Vân kèm ngày đo và link/ảnh minh chứng.
5. Không ảnh hưởng đến các bộ lọc khác: Quá hạn (`OVERDUE`), Sắp đến hạn (`DUE_SOON`), Chờ duyệt (`PENDING_APPROVAL`).

---

### Task 1: Mở rộng `DashboardStats` & Cập nhật `computeDashboardStats`

**Files:**
- Modify: `types/iso.ts:85-93`
- Modify: `lib/task-engine.ts:240-264`

**Interfaces:**
- `DashboardStats`:
  ```typescript
  export interface DashboardStats {
    overdueCount: number;
    dueSoonCount: number;
    completedCount: number;
    pendingApprovalCount: number;
    totalDueCount: number;
    totalWorkItemsCount: number; // Mẫu số chuẩn: 30 đầu việc ISO
    completedWorkItemsCount: number; // Số đầu việc có lượt đã hoàn thành
    completionRate: number;
  }
  ```

- [ ] **Step 1: Cập nhật interface `DashboardStats` trong `types/iso.ts`**
  Thêm `totalWorkItemsCount: number` và `completedWorkItemsCount: number`.

- [ ] **Step 2: Cập nhật hàm `computeDashboardStats` trong `lib/task-engine.ts`**
  - Nhận tham số `totalWorkItems: number = 30`.
  - Tính `completedWorkItemsCount` dựa trên số lượng `itemId` duy nhất có ít nhất 1 task trạng thái `COMPLETED`.
  - Đảm bảo `totalWorkItemsCount = totalWorkItems || 30`.

- [ ] **Step 3: Kiểm tra biên dịch TypeScript**
  Chạy: `npx tsc --noEmit`
  Kỳ vọng: Không có lỗi type.

---

### Task 2: Cải tiến logic gom nhóm `groupedWorkItems` và Bộ lọc trong `ExecutiveDashboard.tsx`

**Files:**
- Modify: `components/dashboard/ExecutiveDashboard.tsx:84-167`

**Interfaces:**
- Mở rộng kiểu dữ liệu đại diện trong `groupedWorkItems`:
  ```typescript
  export type GroupedWorkItem = TaskRecord & {
    backlogOverdueCount?: number;
    completedInstancesCount?: number;
    historyTasks?: TaskRecord[];
  };
  ```

- [ ] **Step 1: Cập nhật hàm gom nhóm `groupedWorkItems`**
  - Thu thập tất cả task của từng `itemId` vào `allTasks`.
  - Đếm `completedCount = allTasks.filter(t => t.status === "COMPLETED").length`.
  - Gán `rep.completedInstancesCount = completedCount`.
  - Gán `rep.historyTasks = allTasks.filter(t => t.status === "COMPLETED").sort((a,b) => b.dueDate.localeCompare(a.dueDate))`.

- [ ] **Step 2: Cập nhật bộ đếm `tableCounts` và điều kiện lọc `filteredTasks`**
  - Cho phép bộ lọc `COMPLETED`:
    ```typescript
    activeFilter === "COMPLETED" 
      ? (task.status === "COMPLETED" || (task.completedInstancesCount && task.completedInstancesCount > 0))
    ```
  - Cập nhật `tableCounts.completed` tăng 1 khi một đầu việc thỏa mãn điều kiện trên.

- [ ] **Step 3: Kiểm tra hiển thị dữ liệu**
  Khi `activeFilter === "COMPLETED"`, bảng phải có ít nhất 1 dòng (`XN.QL.10`).

---

### Task 3: Cập nhật Giao diện Thẻ KPI & Bảng 30 đầu việc kèm Modal Lịch sử nộp

**Files:**
- Modify: `components/dashboard/ExecutiveDashboard.tsx:315-355` (Thẻ KPI Hoàn thành)
- Modify: `components/dashboard/ExecutiveDashboard.tsx:770-820` (Cột thông tin đầu việc & thao tác)
- Modify: `components/dashboard/ExecutiveDashboard.tsx` (Thêm History Modal)

- [ ] **Step 1: Cập nhật thẻ KPI "ĐÃ HOÀN THÀNH"**
  - Hiển thị:
    - Số lớn: `{stats.completedCount}` (lượt hoàn thành)
    - Dòng phụ: `/ 30 đầu việc quản lý ISO`
    - Nhãn chú thích: `(Bao gồm {tableCounts.completed} đầu việc có lượt đã chốt)`
  - Thẻ "QUÁ HẠN" và "SẮP ĐẾN HẠN":
    - Thể hiện rõ: `{stats.overdueCount} lượt trễ hạn ({tableCounts.overdue} đầu việc)` để Trưởng khoa phân biệt ngay giữa số lượt phát sinh và số đầu việc.

- [ ] **Step 2: Cập nhật hiển thị dòng công việc trên Bảng**
  - Nếu `t.completedInstancesCount > 0`:
    - Hiển thị huy hiệu màu xanh: `✓ Đã nộp ${t.completedInstancesCount} ngày gần nhất`.
    - Kèm nút bấm: `Xem lịch sử (${t.completedInstancesCount} ngày)`.
  - Nếu có lượt hôm nay chưa nộp và đang sắp đến hạn:
    - Hiển thị thêm: `(Lượt hôm nay: Đang thực hiện)`.

- [ ] **Step 3: Thêm Modal "Lịch sử nộp nhật ký"**
  - Hiển thị danh sách các ngày đã nộp của đầu việc đó.
  - Mỗi dòng có: Ngày nộp, Ngày thực hiện, Ghi chú, Nút mở ảnh/link minh chứng Drive.

---

### Task 4: Kiểm thử toàn diện & Báo cáo kết quả

**Files:**
- Toàn bộ các file liên quan

- [ ] **Step 1: Chạy build Next.js để kiểm tra tính toàn vẹn**
  Chạy: `npm run build`
  Kỳ vọng: Build thành công 100%, không phát sinh lỗi SSR hay TypeScript.

- [ ] **Step 2: Xác minh hành vi thực tế trên UI**
  - Bấm vào thẻ "ĐÃ HOÀN THÀNH" -> Bảng lọc ngay ra `XN.QL.10`.
  - Nhấp vào "Xem lịch sử" -> Hiện popup danh sách 7 ngày tuần trước của CN. Trần Thị Vân với đầy đủ thông tin.
  - Thẻ KPI hiển thị mẫu số chuẩn `/ 30 đầu việc ISO`.
