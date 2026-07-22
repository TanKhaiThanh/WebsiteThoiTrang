# Kế Hoạch Phân Quyền Hệ Thống Fashion Website (RBAC) - Mở rộng

Hệ thống hiện tại gồm 11 microservices (không bao gồm hệ thống Service Discovery là Consul). Việc phân quyền sẽ dựa trên **Role-Based Access Control (RBAC)** lấy Role từ Bearer Token mà `auth-service` cấp phát. Dưới đây là bức tranh toàn cảnh về cách 4 roles (`admin`, `staff`, `shipper`, `customer`) sẽ tương tác với hệ thống, bao gồm cả các tính năng Tích điểm, Hoàn trả và Danh mục đa cấp mới được bổ sung.

## Mức Độ Phân Quyền (Access Control Matrix)

### 1. `admin` (Quản trị viên hệ thống)
*Quyền hạn cao nhất, có thể can thiệp vào mọi luồng hoạt động.*
- **Auth Service:** Xem, chặn, xóa tài khoản người dùng, đổi role cho tài khoản.
- **Catalog Service:** Thêm/sửa/xóa Category và Product. Thay đổi trạng thái hiển thị (active/inactive).
- **Inventory Service:** Cập nhật số lượng tồn kho tự do. Nhập hàng (Restock).
- **Order Service:** Xem toàn bộ đơn hàng của mọi người, hủy hoặc đổi trạng thái đơn. **Quản lý, trực tiếp phê duyệt hoặc từ chối các yêu cầu hoàn trả (Return Requests) từ khách hàng.**
- **Payment Service:** Xem và đối soát dòng tiền, lịch sử thanh toán toàn hệ thống. **Thực hiện lệnh hoàn tiền (Refund) cho các yêu cầu hoàn trả hợp lệ.**
- **Promotion/Notification/Media Services:** Tạo mã giảm giá toàn cầu, setup banner, gửi thông báo push cho toàn bộ người dùng. **Cấu hình tỷ lệ tích điểm và quản lý hệ thống điểm đổi thưởng của người dùng.**

### 2. `staff` (Nhân viên cửa hàng / CSKH)
*Quản lý vận hành hàng ngày, tập trung vào hàng hóa và đơn hàng.*
- **Catalog Service:** Thêm/sửa Category và Product (không được xóa nội dung).
- **Inventory Service:** Xem số lượng tồn kho, cảnh báo sắp hết hàng.
- **Order Service:** Xem toàn bộ đơn hàng, phê duyệt đơn hàng (`confirmed`) và bàn giao cho Shipper. **Tiếp nhận xử lý và phản hồi các yêu cầu hoàn trả cơ bản của khách hàng trước khi trình Admin duyệt lệnh hoàn tiền cuối cùng.**
- **Promotion Service:** Chỉ có quyền xem các mã giảm giá đang chạy, không được tạo mới. **Có thể xem điểm tích lũy của khách hàng để hỗ trợ giải đáp thắc mắc.**

### 3. `shipper` (Nhân viên giao nhận)
*Tập trung hoàn toàn vào luồng giao hàng.*
- **Order & Shipping Service:** Chỉ được phép xem danh sách các đơn hàng đã được Staff phân công cho mình (status: `shipping`).
- Được quyền **Cập nhật trạng thái giao hàng**: "Đang giao", "Giao thành công", hoặc "Giao thất bại". *(Lưu ý: Việc đơn hàng "Giao thành công" là điều kiện tiên quyết để hệ thống tự động cộng điểm cho Customer).*
- Hoàn toàn KHÔNG nhìn thấy Inventory, Payment, Promotion hay danh sách người dùng.

### 4. `customer` (Khách hàng thông thường - Đã đăng nhập)
*Trải nghiệm mua sắm tiêu chuẩn dành cho thành viên.*
- **Auth Service:** Xem/chỉnh sửa thông tin profile cá nhân, chủ động đăng xuất.
- **Catalog Service:** Được phép xem danh mục, xem chi tiết sản phẩm. Có thể được gửi đánh giá/review.
- **Cart Service:** Thêm/Sửa/Xóa sản phẩm trong giỏ hàng.
- **Order Service:** Tạo hóa đơn đặt hàng, xem toàn bộ lịch sử đơn hàng của chính mình. **Được quyền gửi yêu cầu hoàn trả (Return Request) kèm lý do/bằng chứng nếu đơn hàng đã nhận có sự cố.**
- **Payment Service:** Thực hiện thanh toán cho đơn hàng của mình.
- **Inventory Service:** Chỉ xem tự do trạng thái còn/hết hàng.
- **Promotion Service:** Lưu và áp dụng các Voucher/Mã giảm giá cá nhân. **Được cộng điểm tích lũy tự động khi đơn hàng hoàn thành (Delivered). Được quyền xem điểm hiện tại và sử dụng điểm tích lũy để quy đổi ra mức giảm giá khi thanh toán đơn hàng mới.**

### 5. `guest` (Khách vãng lai - Chưa đăng nhập)
*Khách hàng truy cập vào website nhưng hệ thống không ghi nhận danh tính.*
- **Khách vãng lai không có quyền tích điểm hay yêu cầu hoàn trả.** Phải đăng nhập để sử dụng các tính năng này.
- **Auth/Catalog/Cart Service:** Tương tự phiên bản cũ (Chỉ read-only, thao tác giỏ hàng tạm).
- **Order / Payment Service:** BỊ CHẶN (`401 Unauthorized`).

---

## Technical Design (Phương Án Kỹ Thuật) cho Tính Năng Mới

### 1. Luồng Tích Điểm (Reward Points)
- **Cơ sở dữ liệu:** Thêm trường quản lý `points` vào User (ở Auth Service) HOẶC tạo hẳn một bảng `user_points` ở **Promotion Service**. Đề xuất đưa vào **Promotion Service** để tối ưu tính tách biệt.
- **Luồng xử lý (Data Flow):** 
  - Khi đơn hàng được Shipper hoặc hệ thống cập nhật thành `Delivered` từ `order-service` -> Bắn thông điệp (Event/RabbitMQ) sang `Promotion Service` để kiểm tra tỷ lệ tiền quy ra điểm và **Cộng điểm** tương ứng.
  - Khi Customer Checkout, giao diện gọi API giảm giá từ điểm, hệ thống tính toán trừ vào tổng tiền -> Khi tạo Order thành công sẽ tự **Trừ điểm** tương ứng.

### 2. Luồng Yêu Cầu Hoàn Trả (Return Request)
- **Cơ sở dữ liệu lưu trữ:** Cần bổ sung thêm thực thể `ReturnRequest` (hoặc 1 bảng `return_requests`) thuộc **Order Service**. Các trường dữ liệu: `order_id`, `user_id`, `reason_text`, `proof_images/videos`, `status` (Pending/Reviewing/Approved/Rejected).
- **Trạng thái vòng đời (Lifecycle):** 
  1. Customer tạo request thông báo lỗi -> Trạng thái: `Pending`
  2. Staff xác nhận lỗi -> Trạng thái: `Approved by Staff` (Chờ hoàn tiền)
  3. Admin dùng Payment Service tiến hành hoàn trả -> Order Service cập nhật trạng thái `Refunded` hoặc `Completed Return`.

### 3. Cấu Trúc Danh Mục Đa Cấp (Multi-level Categories)
- **Cấu trúc dữ liệu:** Bổ sung trường định danh cấp cha (ví dụ `parent_id`, mặc định là `null`) vào bảng `categories` do **Catalog Service** quản lý để thiết lập lưới quan hệ phân cấp (Tree structure).
- **Luồng xử lý (Data Flow):** 
  - **Quản lý (Admin/Staff):** Khi thêm/sửa danh mục, cho phép tùy chọn thiết lập một danh mục cha. API lấy toàn bộ danh mục cần hỗ trợ xuất ra cấu trúc cây phân cấp hoặc danh sách dạng phẳng (flat list) đi kèm tham chiếu `parent_id`.
  - **Duyệt sản phẩm (Customer/Guest):** Khi truy vấn hoặc lọc sản phẩm dựa trên một danh mục cha, API catalog-service nên hỗ trợ chức năng trả về toàn bộ sản phẩm thuộc cả các nhánh danh mục con.

### 4. Chiến Lược Quản Lý Tồn Kho An Toàn (Inventory Reservation)
- **Cấu trúc dữ liệu:** Bổ sung việc kiểm soát 2 mức trạng thái lượng hàng trong cơ sở dữ liệu của **Inventory Service**:
  - `available_qty`: Sẵn sàng cho phép đặt mua.
  - `reserved_qty`: Số lượng tạm giữ chờ thanh toán thành công.
- **Xử lý Race Condition:** Cập nhật dạng Atomic (tại bước giữ chỗ qua truy vấn `WHERE available_qty >= Số_lượng`) kết hợp với Database Lock (`FOR UPDATE`) để triệt tiêu việc bán vượt số tồn khi nhiều lượng lớn Request đến cùng phần nghìn giây.
- **Luồng xử lý (Lifecycle Flow):** 
  - **Create Order (Pending):** Trừ lượng hàng sẽ mua vào `available_qty` và cộng phần đó vào `reserved_qty` (Lock hàng giữ chỗ riêng).
  - **Order Success (Paid/Confirmed):** Trừ dứt điểm lượng hàng đã mua khỏi `reserved_qty` (Xuất kho thực tế).
  - **Order Canceled:** Hoàn trả lượng đã khóa từ `reserved_qty` cộng lại vào `available_qty` để nhả hàng cho người khác.

### 5. Thiết Kế Mở Rộng Luồng Khuyến Mãi (Promotion Business Logic)
- **Nguyên tắc Stacking (Chồng ưu đãi giỏ hàng):** Thiết kế cho phép phép chồng chéo đa ưu đãi nhưng giới hạn theo cấp loại, công thức Check-out: `(1 Mã sản phẩm/đơn hàng) + (1 Mã vận chuyển) + (Điểm tích luỹ)`. Tuyệt đối không cho phép dùng chung nhiều mã cùng nhóm. Quản lý tách các thông số `subtotal`, `voucher_discount`, `freeship_discount`, `points_discount` rành mạch tại **Order Service** lúc đặt đơn.
- **Nguyên tắc Hàng Khuyến mãi Sale (`exclude_sale_items`):** 
  - **Database:** Bổ sung trường Cờ tùy chọn cấu hình (`exclude_sale_items`: Boolean) trên bảng quản lý mã ưu đãi. Cấp quyền tự do điều hướng thiết lập On/Off trên thiết kế Dashboard Marketing.
  - **Xử lý Validation:** Khi khách áp mã, API tiến hành kiểm tra lọc qua từng phần tử (Item) rổ hàng. Nếu bật cờ chặn, sản phẩm đã có giá ưu đãi theo sale sẽ bị cô lập - không cộng gộp doanh thu làm đối tượng chiết khấu đối với Mã giảm giá nữa. Hạn chế thảm hoạ thất thoát "khuyến mãi kép - double discounting".

## User Review Required
> [!IMPORTANT]
> **Vui lòng xác nhận các điểm sau:**
> 1. Thiết kế phân quyền mới cho tính năng **Hoàn trả** (Staff tiếp nhận, Admin duyệt hoàn tiền) và **Tích điểm** đã khớp với ý tưởng của bạn chưa?
> 2. Về mặt dữ liệu, bạn muốn quản lý điểm (`points`) tại **Authentication Service** (cùng với user profile) hay tách ra tại **Promotion Service**?
> 3. Cấu trúc **Danh mục đa cấp** dùng `parent_id` có phù hợp với kiến trúc CSDL hiện tại của Catalog Service bên bạn không?
