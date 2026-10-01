## Prerequisites

- Node.js >=22 (Recommended)

## Installation

**Using Yarn (Recommended)**

```sh
yarn install
yarn dev
```

**Using Npm**

```sh
npm i
npm run dev
```

## Build

```sh
yarn build
# or
npm run build
```

## Cấu hình local hiện tại

Các biến dưới đây chỉ dùng cho môi trường local và nên đặt trong `.env.local`:

- `VITE_AUTH_SKIP=true`: tạm bỏ qua màn hình đăng nhập để dựng giao diện.

## Quy ước list Admin

Các màn list cơ bản mặc định dùng bố cục theo mẫu [Minimal UI Invoice](https://minimals.cc/dashboard/invoice):

- `Card` chứa list, bộ lọc theo ngữ cảnh, ô tìm kiếm, `Table` của MUI và `TablePagination`.
- List mặc định có action `Xuất` gồm CSV và In; CSV phản ánh bộ lọc/tìm kiếm hiện tại. In hiện dùng hộp thoại in trang của trình duyệt, chưa có layout in riêng.
- Giữ component, layout, spacing và theme có sẵn của Minimal; không tự tạo một kiểu list khác nếu chưa có yêu cầu riêng.
- Dải thống kê phía trên và checkbox đầu bảng không bật mặc định ở trạng thái hiện tại; màn đặc biệt chỉ thay đổi khi đã chốt riêng về dữ liệu hoặc hành vi.
- Nội dung một dòng/hai dòng phải căn giữa theo chiều dọc và không làm mất các trường dữ liệu đã chốt.

Merchant detail dùng layout read-only gồm header, thông tin tổng quan và các tab theo module:

- `Tổng quan` dùng card thông tin label/value; mã Merchant có copy, trạng thái dùng `Label`.
- `MerchantClient` dùng form list/table với toolbar, filter, search, export và pagination.
- Tab `Payment` có thể truy cập và hiển thị nội dung `Đang phát triển`, chưa hiển thị dữ liệu giả.
- Trạng thái Merchant chỉ hiển thị trong thông tin tổng quan; version được giữ trong dữ liệu và ẩn trên giao diện tra cứu.
- MerchantClient chia hai card: Thông tin và cấu hình / Bảo mật. Card trên sửa tại chỗ chỉ Tên, IP được phép và URL webhook; card dưới chỉ xem/copy và nhắc tạo client mới để thay đổi bộ bảo mật. Merchant sửa được tên ở card tổng quan.
- Các form tạo và chỉnh sửa gọi Admin API thật. Mutation dùng version hiện tại theo CAS, không tự retry khi conflict hoặc commit unknown; lỗi hiển thị kèm Request-Id. Hủy/rời màn có thay đổi cần xác nhận. Client ACTIVE không được bỏ danh sách IP hoặc webhook; URL đã có không được xóa qua PATCH.
- Tabs module dùng underline có sẵn của Minimal, nằm ở đầu card nội dung.
- List MerchantClient chỉ hiển thị tên, mã có copy, trạng thái và cập nhật lần cuối; không có cột Hiệu lực, profile hay Hành động. Bấm tên vào trang chi tiết riêng dưới Merchant; không dùng popup và không có mục MerchantClient ở sidebar.
- Chi tiết dùng khung card theo Invoice Detail, chia Thông tin cơ bản / Cấu hình kết nối / Bảo mật bằng divider; không lặp lại Merchant sở hữu và không hiển thị version. Breadcrumb vẫn giữ ngữ cảnh Merchant.
- Cảnh báo thời hạn gộp vào giá trị Kết thúc hiệu lực: bình thường màu mặc định, còn tối đa 7 ngày vàng, hết hạn đỏ (tại `now >= valid_until`); tooltip giải thích trạng thái thời hạn. Không có khối/badge Thời hạn riêng, không đưa cột Hiệu lực trở lại list và không suy ra trạng thái hoạt động từ thời hạn.
- Mock chi tiết dùng public key, IP dành cho tài liệu và endpoint `.invalid` minh họa; không dùng credential/API thật. Kiểm tra mốc thời hạn: `node --test tests/merchant-client-validity.test.ts`.
- Nút thêm Merchant/MerchantClient mở form bằng component MUI hiện có, có validation tại client và gọi API thật; tạo xong điều hướng vào detail resource vừa sinh.
- Instant của MerchantClient phải gửi UTC theo profile millisecond (`...000Z`); form chuyển đổi từ giờ local của trình duyệt sang profile này trước khi gọi API.

## Mock server

By default we provide demo data from : `https://api-dev-minimal-[version].vercel.app`

To set up your local server:

- **Guide:** [https://docs.minimals.cc/mock-server](https://docs.minimals.cc/mock-server).

- **Resource:** [Download](https://www.dropbox.com/scl/fo/bopqsyaatc8fbquswxwww/AKgu6V6ZGmxtu22MuzsL5L4?rlkey=8s55vnilwz2d8nsrcmdo2a6ci&dl=0).

## Full version

- Create React App ([migrate to CRA](https://docs.minimals.cc/migrate-to-cra/)).
- Next.js
- Vite.js

## Starter version

- To remove unnecessary components. This is a simplified version ([https://starter.minimals.cc/](https://starter.minimals.cc/))
- Good to start a new project. You can copy components from the full version.
- Make sure to install the dependencies exactly as compared to the full version.

---

**NOTE:**
_When copying folders remember to also copy hidden files like .env. This is important because .env files often contain environment variables that are crucial for the application to run correctly._
