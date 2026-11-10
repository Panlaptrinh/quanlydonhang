ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

PHIÊN BẢN 1.0 \| Ngày 10/11/2026 \| Tài liệu dự thảo để thống nhất và
triển khai

Hệ thống quản lý doanh nghiệp dịch vụ vệ sinh

# Kiểm soát tài liệu

| Thuộc tính \| Nội dung \|

| --- \| --- \|

| Tên hệ thống \| Ứng dụng quản lý doanh nghiệp dịch vụ vệ sinh \|

| Phiên bản \| 1.0 -- Dự thảo yêu cầu nghiệp vụ và kỹ thuật \|

| Nền tảng \| Web Responsive + Progressive Web App (PWA) \|

| Người dùng chính \| Quản lý/Điều phối; Tổ trưởng; Công nhân/Nhân viên
  \|

| Quy mô dự kiến \| Hiện tại 10--30 người; định hướng mở rộng khoảng 50
  người và hơn \|

| Phạm vi hoạt động \| Một công ty, nhiều tổ trưởng, nhiều nhóm công
  nhân, nhiều khu vực trong cùng tỉnh \|

| Trạng thái \| Cần xác nhận các giả định và thông số chưa chốt trước
  khi phát triển production \|

# 1. Mục đích và phạm vi

Tài liệu mô tả yêu cầu chức năng, phi chức năng, quy trình nghiệp vụ, dữ
liệu, phân quyền, tích hợp và tiêu chí nghiệm thu cho hệ thống quản lý
hoạt động của doanh nghiệp dịch vụ vệ sinh.

Mục tiêu là quản lý xuyên suốt vòng đời dịch vụ: khách hàng → yêu
cầu/báo giá → đơn hàng → phân công → lịch làm → chấm công → kiểm soát
chất lượng → nghiệm thu → thu tiền/công nợ → tính lương → báo cáo.

-   Một nguồn dữ liệu tập trung, sử dụng trên máy tính, điện thoại và
    máy tính bảng.

-   Giao diện hiện đại, chuyên nghiệp, tối giản; có Light Mode và Dark
    Mode.

-   Hỗ trợ làm việc trực tuyến và ngoại tuyến có kiểm soát.

-   Công ty sở hữu mã nguồn, dữ liệu và tài khoản dịch vụ theo thỏa
    thuận bàn giao.

# 2. Mục tiêu và nguyên tắc thiết kế

-   Không thiết kế thành ứng dụng chấm công đơn lẻ; đây là hệ thống quản
    trị vận hành doanh nghiệp.

-   Phân quyền theo vai trò kết hợp phạm vi dữ liệu: toàn công ty,
    nhóm/đơn được giao hoặc dữ liệu cá nhân.

-   Mọi nghiệp vụ liên quan đến tiền, công, nghiệm thu và trạng thái đơn
    phải có lịch sử kiểm toán.

-   Không xóa âm thầm giao dịch, bảng lương đã khóa, biên bản nghiệm thu
    hoặc lịch sử đơn hàng.

-   Các tích hợp bên ngoài phải được cấu hình qua biến môi trường/secret
    phía máy chủ, không nhúng khóa bí mật vào frontend.

-   Thiết kế module và schema có thể mở rộng thêm khu vực, nhóm, dịch
    vụ, nhân sự và tích hợp.

# 3. Đối tượng sử dụng và phân quyền

| Vai trò \| Phạm vi quyền dự kiến \|

| --- \| --- \|

| Quản lý/Điều phối \| Quản trị toàn công ty; duyệt tài khoản; quản lý
  nhân sự, khách hàng, dịch vụ, đơn hàng, phân công, lương, thu chi, báo
  cáo, cấu hình; hủy đơn; duyệt chi phí và thanh toán. \|

| Tổ trưởng \| Xem nhóm và đơn được giao; xem lịch; xác nhận/đề xuất
  điều chỉnh lịch; xác nhận chấm công; cập nhật tiến độ, checklist,
  ảnh/video; nhập hoặc đề xuất chi phí và khoản thu thuộc đơn được giao;
  không xem toàn bộ tài chính và lương toàn công ty. \|

| Công nhân/Nhân viên \| Xem hồ sơ cá nhân, lịch được phân công, đơn
  được giao ở mức cần thiết; tự chấm công; gửi xin nghỉ; xem công và
  phiếu lương cá nhân; đổi mật khẩu. \|

Lưu ý: không tạo thêm vai trò nghiệp vụ ngoài ba nhóm trên. Có thể dùng
quyền chi tiết (permission) để cấu hình ai được xem/thêm/sửa/duyệt trong
phạm vi vai trò.

## 3.1. Tài khoản và đăng nhập

-   Đăng nhập bằng số điện thoại + mật khẩu hoặc email + mật khẩu.

-   Nhân viên tự đăng ký; tài khoản ở trạng thái chờ duyệt cho đến khi
    Quản lý kích hoạt.

-   Quản lý có thể chủ động tạo tài khoản và cấp thông tin đăng nhập.

-   Nhân viên được tự đổi mật khẩu; khôi phục mật khẩu bằng OTP điện
    thoại.

-   Bắt buộc xác thực hai lớp cho tài khoản Quản lý.

-   Tự động đăng xuất sau thời gian không hoạt động; thời lượng cụ thể
    cần cấu hình.

-   Lưu lịch sử đăng nhập, thời gian, thiết bị và thông tin kỹ thuật phù
    hợp.

-   Có phân quyền xem/thêm/sửa/xóa/duyệt theo vai trò và phạm vi dữ
    liệu.

# 4. Cơ cấu tổ chức và phạm vi địa lý

Cấu trúc: Một công ty → nhiều khu vực → nhiều tổ trưởng/nhóm công nhân.
Mỗi nhóm có tổ trưởng phụ trách; công nhân có thể được điều chuyển giữa
nhóm. Một đơn hàng có thể giao cho một hoặc nhiều nhóm.

-   Danh mục khu vực do Quản lý tạo/sửa/ngừng sử dụng.

-   Mỗi đơn hàng, địa chỉ công trình và nhóm phân công có thể gắn khu
    vực.

-   Lưu lịch sử thay đổi nhóm/tổ trưởng để đối chiếu lịch, công và
    lương.

-   Phạm vi hiện tại là nhiều khu vực trong cùng một tỉnh; không giả
    định nhiều chi nhánh pháp lý.

# 5. Yêu cầu chức năng

## FR-01 -- Dashboard

-   Hiển thị: tổng nhân viên hoạt động; công nhân đang làm hôm nay;
    nghỉ/vắng; tổng đơn hôm nay; đơn đang thực hiện; chờ nghiệm thu;
    hoàn thành; doanh thu ngày/tháng; chi phí và lợi nhuận; tổng lương
    phải trả; công nợ; biểu đồ hiệu suất nhân viên/tổ trưởng.

-   Dashboard Quản lý hiển thị toàn công ty; Tổ trưởng chỉ hiển thị
    nhóm/đơn được giao; Công nhân chỉ hiển thị dữ liệu cá nhân.

-   Cho phép lọc thời gian và khu vực phù hợp quyền; chỉ hiển thị dữ
    liệu có quyền truy cập.

## FR-02 -- Hồ sơ nhân sự

-   Lưu mã nhân viên tự động, họ tên, ảnh đại diện, điện thoại, email,
    ngày sinh, giới tính, địa chỉ thường trú, khu vực sinh sống, ngày
    bắt đầu, vai trò, nhóm/tổ trưởng, hình thức lương, mức lương/phụ
    cấp, tài khoản ngân hàng, trạng thái, hợp đồng/tài liệu và ghi chú.

-   Trạng thái: thử việc, chính thức, tạm nghỉ, nghỉ việc.

-   Khi nghỉ việc, Quản lý lựa chọn khóa tài khoản/lưu trữ/ẩn/xử lý hồ
    sơ theo chính sách lưu trữ và pháp luật; không xóa dữ liệu tài chính
    hoặc lịch sử cần đối chiếu một cách tùy tiện.

-   Thông tin lương, ngân hàng, giấy tờ và hồ sơ cá nhân phải được giới
    hạn truy cập.

## FR-03 -- Khách hàng

-   Lưu mã khách hàng tự động, tên cá nhân/doanh nghiệp, điện thoại,
    email, địa chỉ, khu vực, loại khách, người liên hệ, ghi chú, lịch sử
    đơn, tổng doanh thu, công nợ, đánh giá/phản hồi.

-   Cảnh báo trùng số điện thoại; không tự động gộp. Quản lý kiểm tra và
    xử lý thủ công nếu cần.

-   Một khách hàng có thể có nhiều địa chỉ công trình và nhiều đơn hàng.

## FR-04 -- Dịch vụ và bảng giá

-   Danh mục: vệ sinh nhà ở/căn hộ/chung cư; sau xây dựng; sau sửa chữa;
    tổng vệ sinh công trình; văn phòng/công ty; tạp vụ định kỳ; giặt
    sofa; giặt nệm; giặt rèm; giặt thảm; vệ sinh kính; vệ sinh nhà
    xưởng/công nghiệp; dịch vụ khác do Quản lý tự thêm.

-   Kết hợp bảng giá mẫu và giá điều chỉnh từng đơn.

-   Giá mẫu được lưu phiên bản/hiệu lực; khi tạo đơn, hệ thống đề xuất
    giá. Quản lý có thể điều chỉnh, bắt buộc lưu giá trước/sau, người
    sửa, thời gian và lý do.

-   Đơn hàng đã chốt phải lưu snapshot đơn giá để thay đổi bảng giá về
    sau không làm sai dữ liệu lịch sử.

## FR-05 -- Đơn hàng và điều phối

-   Tạo đơn với khách hàng, địa chỉ công trình, khu vực, dịch vụ, hạng
    mục, thời gian, giá trị, ghi chú, yêu cầu đặc biệt và trạng thái
    thanh toán.

-   Phân công một hoặc nhiều tổ/nhóm/công nhân vào đơn; ghi vai trò,
    thời gian dự kiến và phạm vi công việc.

-   Một công nhân có thể được phân công nhiều đơn trong ngày; hệ thống
    cảnh báo trùng giờ, xung đột lịch hoặc vượt khả năng.

-   Quản lý có quyền hủy đơn và bắt buộc ghi lý do. Lưu toàn bộ lịch sử
    thay đổi.

-   Trạng thái: Mới tiếp nhận; Đã xác nhận thông tin và báo giá; Đã phân
    công nhân sự; Đang thực hiện; Chờ tổ trưởng kiểm tra; Chờ khách hàng
    nghiệm thu; Khách yêu cầu khắc phục; Đang thực hiện khắc phục; Đã
    nghiệm thu/Hoàn thành; Đã hủy.

## FR-06 -- Lịch làm việc và nghỉ phép

-   Tạo lịch ngày; xem lịch tuần/tháng; lịch linh hoạt theo đơn và ca cố
    định sáng/chiều/tối.

-   Thiết lập giờ bắt đầu/kết thúc dự kiến; ghi nhận giờ thực tế và tăng
    ca.

-   Phân công một nhân viên nhiều đơn/ngày và nhiều nhóm cho một đơn;
    cảnh báo trùng lịch.

-   Nhân viên gửi xin nghỉ trên app; Tổ trưởng xác nhận/đề xuất thay
    đổi; Quản lý phê duyệt theo quy trình cấu hình.

-   Quản lý điều chuyển công nhân giữa nhóm và lưu lịch sử.

## FR-07 -- Chấm công

-   Hỗ trợ tổ trưởng xác nhận có mặt; nhân viên tự chấm trên điện thoại;
    QR tại công trình; GPS tại thời điểm chấm; Quản lý nhập thủ công.

-   Lưu giờ vào/ra, đơn/công trình, phương thức chấm, vị trí khi có
    quyền và điều kiện, thiết bị phù hợp.

-   Điều chỉnh công phải ghi người sửa, thời gian, lý do và dữ liệu
    trước/sau.

-   Phát hiện chấm công trùng, ngoài lịch hoặc bất thường; có quy trình
    xử lý ngoại lệ.

-   GPS không theo dõi liên tục. Cần thông báo rõ mục đích, giới hạn thu
    thập và cơ sở xử lý dữ liệu.

## FR-08 -- Kiểm soát chất lượng

-   Lưu ảnh trước/sau, video quá trình, checklist từng hạng mục.

-   Tổ trưởng đánh giá chất lượng công nhân; Quản lý kiểm tra/duyệt nội
    bộ.

-   Lưu đánh giá sao, phản hồi, khiếu nại và yêu cầu làm lại của khách.

-   Lưu lịch sử chất lượng theo từng công nhân/nhóm/đơn.

-   Khách hàng là bên xác nhận nghiệm thu cuối cùng theo luồng thông
    thường.

## FR-09 -- Nghiệm thu khách hàng qua link/QR

-   Tạo link và QR riêng cho từng đơn; khách không cần cài app.

-   Khách xác minh số điện thoại bằng OTP và thông tin cơ bản trước khi
    xem nội dung được phép.

-   Khách xem thông tin đơn, danh mục công việc, ảnh trước/sau; đánh dấu
    Đạt/Chưa đạt từng hạng mục; ghi chú; ký/xác nhận.

-   Checklist được lấy từ mẫu theo dịch vụ và cho phép Quản lý tùy chỉnh
    từng đơn trước khi gửi khách.

-   Nếu có hạng mục chưa đạt, chuyển sang Khách yêu cầu khắc phục; không
    tự động hoàn tất.

-   Lưu phiên bản biên bản, nội dung xác nhận, thời gian, người/điện
    thoại đã xác minh, nhật ký truy cập phù hợp, chữ ký điện tử dạng vẽ
    và bản PDF/snapshot.

-   Token link phải khó đoán, có hạn sử dụng, có thể thu hồi, giới hạn
    truy cập và chống truy cập lại trái phép.

-   Chữ ký vẽ trên màn hình không mặc nhiên tương đương chữ ký số chuyên
    dùng; yêu cầu pháp lý cao hơn cần được rà soát riêng.

## FR-10 -- Tiền lương

-   Hỗ trợ lương ngày, lương tháng, lương theo đơn/sản phẩm, phụ cấp,
    thưởng/hoa hồng, tăng ca và khấu trừ; mỗi nhân viên có thể có cấu
    hình kết hợp.

-   Quản lý có thể nhập tổng lương cuối cùng hoặc nhập từng thành phần
    để hệ thống tính tổng.

-   Quản lý kiểm tra, duyệt và khóa bảng lương; mở khóa/điều chỉnh cần
    quyền và lý do.

-   Nhân viên chỉ xem phiếu lương của mình; Tổ trưởng không mặc nhiên
    được xem lương toàn công ty.

-   Lưu kỳ lương, công thức/phiên bản quy tắc, người nhập/sửa/duyệt và
    lịch sử điều chỉnh.

## FR-11 -- Doanh thu, chi phí, thanh toán và công nợ

-   Theo dõi doanh thu từng đơn; chi phí nhân công, hóa chất/vật tư, đi
    lại/vận chuyển, máy móc/thiết bị, ăn uống/phụ cấp công trình và chi
    phí khác.

-   Tổ trưởng được ghi nhận/đề xuất chi phí cho đơn được giao; Quản lý
    duyệt.

-   Ghi nhận tiền đặt cọc, thanh toán một lần/nhiều lần, tiền mặt/chuyển
    khoản, ngày và số tiền, ảnh hóa đơn/biên lai.

-   Tổ trưởng có thể đề xuất/ghi nhận khoản thu của đơn được giao; Quản
    lý xác nhận.

-   Theo dõi đã thu/còn nợ, tự cập nhật trạng thái công nợ, cảnh báo
    chưa thanh toán/quá hạn, lịch sử theo khách hàng.

-   Xuất phiếu thu/biên nhận PDF.

-   Giao dịch đã xác nhận không được xóa âm thầm; sai sót xử lý bằng
    điều chỉnh/hoàn tác có lý do và nhật ký.

-   Lợi nhuận đơn hàng hiển thị là doanh thu trừ chi phí trực tiếp;
    không gọi lợi nhuận ròng nếu chưa phân bổ chi phí chung, thuế và
    khoản khác.

## FR-12 -- Thông báo trong ứng dụng

-   Thông báo đơn mới; lịch mới; nhắc trước giờ làm; chưa chấm công; tổ
    trưởng chưa xác nhận hoàn thành; khách nghiệm thu; khách yêu cầu
    khắc phục; bảng lương/phiếu lương mới; chi phí chờ duyệt; công nợ
    chưa thanh toán/quá hạn.

-   Chỉ dùng thông báo trong ứng dụng ở giai đoạn hiện tại; OTP SMS là
    luồng xác minh riêng.

-   Thông báo có trạng thái đã đọc/chưa đọc, phân theo vai trò và liên
    kết đến đối tượng nghiệp vụ.

## FR-13 -- Báo cáo

-   Báo cáo đơn hàng ngày/tuần/tháng; doanh thu; chi phí/lợi nhuận theo
    đơn; công nợ; thanh toán/dòng tiền thu vào; chấm công; tăng
    ca/nghỉ/vắng; bảng lương/quỹ lương; hiệu suất công nhân; hiệu suất
    tổ trưởng/nhóm; chất lượng/khắc phục; doanh thu theo khu vực; doanh
    thu theo dịch vụ; khách mới/quay lại.

-   Hỗ trợ lọc theo thời gian, khu vực, dịch vụ, nhóm, nhân viên, trạng
    thái và khách hàng trong phạm vi quyền.

-   Xuất Excel và PDF; dữ liệu xuất phải áp dụng cùng quy tắc phân
    quyền.

## FR-14 -- Cấu hình và nhật ký

-   Quản lý tài khoản, vai trò, quyền chi tiết, khu vực, nhóm, ca làm,
    dịch vụ, checklist, mẫu giá, thời gian tự đăng xuất và cấu hình tích
    hợp.

-   Lưu nhật ký tạo/sửa/xóa mềm/duyệt/hủy/điều chỉnh/đăng nhập/xuất dữ
    liệu và các hành động nhạy cảm.

-   Hỗ trợ sao lưu định kỳ, theo dõi kết quả sao lưu và quy trình khôi
    phục.

# 6. Quy tắc nghiệp vụ trọng yếu

| Mã \| Quy tắc \|

| --- \| --- \|

| BR-01 \| Một đơn hàng có thể có nhiều nhóm và nhiều nhân viên; mỗi
  phân công phải có thời gian và phạm vi công việc. \|

| BR-02 \| Cảnh báo xung đột lịch không nhất thiết chặn tuyệt đối; ngoại
  lệ phải được người có quyền xác nhận và lưu lý do. \|

| BR-03 \| Thời gian dự kiến không tự động tạo chấm công hoặc xác nhận
  hoàn thành. \|

| BR-04 \| Chỉ Quản lý có quyền hủy đơn; bắt buộc lý do và lưu nhật ký.
  \|

| BR-05 \| Khách đánh dấu chưa đạt thì đơn chuyển sang khắc phục; không
  đóng đơn tự động. \|

| BR-06 \| Nghiệm thu khách hàng phải lưu snapshot bằng chứng và phiên
  bản checklist/biên bản. \|

| BR-07 \| Bảng giá thay đổi không ảnh hưởng giá đã chốt của đơn cũ. \|

| BR-08 \| Giao dịch tài chính, bảng lương đã khóa và dữ liệu nghiệm thu
  không bị xóa vật lý tùy tiện. \|

| BR-09 \| Mọi điều chỉnh công, lương, chi phí, khoản thu, giá đơn phải
  có người thực hiện, thời gian, lý do và dữ liệu trước/sau. \|

| BR-10 \| Quyền xem dữ liệu nhạy cảm phải giới hạn theo vai trò và phạm
  vi; kiểm tra quyền ở backend/API. \|

| BR-11 \| Dashboard và báo cáo phải tính trên dữ liệu được phép xem;
  không rò rỉ số liệu toàn công ty cho tài khoản nhóm/cá nhân. \|

| BR-12 \| Offline chỉ cho phép các thao tác đã thiết kế hỗ trợ; thao
  tác chờ đồng bộ phải hiển thị trạng thái và xử lý xung đột. \|

# 7. Tích hợp bên ngoài

| Dịch vụ \| Mục đích \| Lưu ý \|

| --- \| --- \| --- \|

| Google Maps \| Địa chỉ và vị trí công trình \| Cần API key, giới hạn
  quota và kiểm soát chi phí. \|

| GPS \| Ghi nhận vị trí lúc chấm công \| Chỉ lấy tại thời điểm chấm;
  xin quyền và thông báo minh bạch. \|

| SMS OTP \| Xác minh khách nghiệm thu và nhân viên \| Chọn nhà cung
  cấp, giá SMS, giới hạn gửi và chống lạm dụng. \|

| Google Drive \| Lưu ảnh, video, tài liệu \| OAuth/service account phù
  hợp; phân quyền thư mục; không để link công khai mặc định. \|

| Google Sheets \| Xuất hoặc đồng bộ dữ liệu \| Chỉ là kênh trao đổi;
  database chính vẫn là PostgreSQL. \|

# 8. Yêu cầu phi chức năng

| Mã \| Yêu cầu \|

| --- \| --- \|

| NFR-01 -- Responsive \| Giao diện hoạt động trên iPhone, Android,
  desktop và tablet; thao tác cảm ứng thuận tiện. \|

| NFR-02 -- PWA \| Có manifest, service worker, cài đặt được; mô tả rõ
  giới hạn PWA trên từng hệ điều hành. \|

| NFR-03 -- Offline \| Cache có chọn lọc; hàng đợi thao tác cục bộ; đồng
  bộ khi có mạng; xử lý xung đột và hiển thị trạng thái. \|

| NFR-04 -- Bảo mật \| HTTPS; mật khẩu băm bằng thuật toán phù hợp; OTP
  có hạn và giới hạn thử; 2FA Quản lý; chống brute force; session
  expiry; secrets ở server. \|

| NFR-05 -- Riêng tư \| Thu thập dữ liệu tối thiểu; giới hạn quyền; có
  chính sách lưu trữ/xóa; thông báo mục đích GPS và dữ liệu cá nhân. \|

| NFR-06 -- Audit \| Nhật ký bất biến ở mức ứng dụng đối với giao dịch
  và thao tác nhạy cảm; không cho người dùng thường tự xóa log. \|

| NFR-07 -- Sao lưu \| Sao lưu database và tệp; có lịch; mã hóa; kiểm
  tra khôi phục định kỳ; định nghĩa RPO/RTO trước production. \|

| NFR-08 -- Hiệu năng \| Mục tiêu ban đầu: các trang danh sách phổ biến
  phản hồi trong khoảng 2--3 giây ở điều kiện mạng phù hợp; cần
  benchmark với dữ liệu thực tế. \|

| NFR-09 -- Mở rộng \| Thiết kế hỗ trợ tối thiểu quy mô dự kiến 50 nhân
  sự và tăng trưởng sau này; không hard-code số nhóm/khu vực. \|

| NFR-10 -- Khả dụng \| Có giám sát lỗi, log hệ thống, cảnh báo tích hợp
  thất bại và quy trình phục hồi. \|

| NFR-11 -- Khả năng bảo trì \| Code chia module, có type checking,
  migration, tài liệu API và test tự động. \|

| NFR-12 -- Ngôn ngữ \| Giao diện tiếng Việt; định dạng ngày giờ và tiền
  tệ phù hợp Việt Nam; timezone Asia/Ho_Chi_Minh. \|

# 9. Mô hình dữ liệu đề xuất

Danh sách bảng dưới đây là baseline; nhà phát triển phải hoàn thiện ERD,
khóa ngoại, unique constraints, index, soft delete, retention và
migration trước khi lập trình nghiệp vụ.

| Nhóm \| Bảng dự kiến \|

| --- \| --- \|

| Tài khoản & quyền \| users, roles, permissions, role_permissions,
  user_sessions, otp_requests, login_audit \|

| Tổ chức & nhân sự \| company_settings, service_areas, teams,
  employees, team_memberships, employee_documents, employee_pay_profiles
  \|

| Khách hàng \| customers, customer_addresses, customer_contacts,
  customer_feedback \|

| Dịch vụ & giá \| services, service_price_versions,
  service_checklist_templates, service_checklist_items \|

| Đơn hàng \| orders, order_items, order_status_history,
  order_assignments, order_assignment_members \|

| Lịch & chấm công \| work_shifts, work_schedules, leave_requests,
  attendance_records, attendance_adjustments \|

| Chất lượng & nghiệm thu \| quality_inspections, quality_check_items,
  media_assets, customer_acceptances, acceptance_items,
  acceptance_events \|

| Lương \| payroll_periods, payrolls, payroll_items,
  payroll_adjustments, payroll_approvals \|

| Tài chính \| expenses, expense_approvals, payments,
  payment_allocations, receivables, receipts \|

| Thông báo & báo cáo \| notifications, notification_recipients,
  report_exports \|

| Hệ thống \| audit_logs, integration_configs, sync_queue,
  sync_conflicts, backup_logs, app_settings \|

# 10. Kiến trúc và công nghệ khuyến nghị

Kiến trúc khuyến nghị cho dự án: frontend React + TypeScript dạng
responsive/PWA; backend API có xác thực và kiểm soát quyền; PostgreSQL
làm cơ sở dữ liệu chính; object storage/Google Drive cho tệp; tác vụ nền
cho OTP, đồng bộ, xuất PDF/Excel và thông báo.

-   Có thể cân nhắc Supabase (PostgreSQL, Auth, Storage, Edge Functions)
    hoặc backend riêng như NestJS/Node.js kết hợp PostgreSQL. Chốt nền
    tảng sau khi đánh giá chi phí, quyền sở hữu và khả năng vận hành.

-   Không để AI builder tự tạo dữ liệu giả làm tính năng thật; mọi
    module phải kết nối database/API thực.

-   Dùng migration có version; không chỉnh schema production thủ công
    không kiểm soát.

-   Secrets/API keys chỉ lưu ở backend hoặc secret manager.

-   Tạo môi trường development, staging/UAT và production riêng.

# 11. Tiêu chí nghiệm thu tổng thể

1.  Đăng ký nhân viên tạo trạng thái chờ duyệt; Quản lý duyệt mới được
    sử dụng.

2.  Quản lý/Tổ trưởng/Công nhân chỉ truy cập đúng chức năng và dữ liệu
    được cấp quyền; kiểm thử API trực tiếp không vượt quyền.

3.  Tạo khách hàng, cảnh báo trùng số điện thoại và tạo nhiều địa chỉ.

4.  Tạo đơn, lấy giá mẫu, điều chỉnh giá có lý do và giữ nguyên giá lịch
    sử.

5.  Phân công nhiều nhóm/nhân viên; phát hiện trùng lịch và lưu ngoại
    lệ.

6.  Chấm công được bằng các phương thức đã chọn; điều chỉnh có audit
    log.

7.  Ảnh/video/checklist gắn đúng đơn và phân quyền truy cập.

8.  Khách xác minh OTP, xem checklist, đánh dấu đạt/chưa đạt và xác
    nhận; luồng chưa đạt chuyển khắc phục.

9.  Thanh toán nhiều lần, đặt cọc, công nợ và biên nhận đối chiếu đúng.

10. Tính lương theo cấu hình và nhập thủ công cả tổng lương hoặc thành
    phần; khóa/mở khóa có kiểm soát.

11. Báo cáo 14 nhóm có bộ lọc và xuất Excel/PDF theo đúng quyền.

12. Offline queue đồng bộ được; có test xung đột và không nhân đôi giao
    dịch.

13. Khôi phục được database và tệp từ bản backup thử nghiệm.

14. Kiểm thử trên iPhone, Android, desktop và tablet; có biên bản lỗi và
    kết quả sửa.

# 12. Kế hoạch kiểm thử

| Nhóm test \| Nội dung tối thiểu \|

| --- \| --- \|

| Unit test \| Tính giá, tính công, tính lương, tính công nợ, chuyển
  trạng thái. \|

| Integration test \| API, database, phân quyền, OTP, Drive, Maps,
  Sheets. \|

| E2E test \| Đăng ký → duyệt → tạo đơn → phân công → chấm công → nghiệm
  thu → thanh toán → báo cáo. \|

| Security test \| IDOR, privilege escalation, brute force OTP, session,
  file access, export data. \|

| Offline test \| Mất mạng, thao tác chờ, đồng bộ lại, xung đột, gửi
  lặp. \|

| Device test \| Safari iOS, Chrome Android, Chrome/Edge desktop,
  tablet. \|

| Backup/restore test \| Khôi phục database và file; xác minh tính toàn
  vẹn. \|

# 13. Bàn giao và quyền sở hữu

-   Bàn giao toàn bộ mã nguồn ứng dụng và lịch sử repository.

-   Bàn giao database schema, migration, dữ liệu mẫu và hướng dẫn
    backup/restore.

-   Bàn giao tài khoản quản trị cấp cao nhất.

-   Bàn giao hướng dẫn cài đặt, triển khai, vận hành và sử dụng cho ba
    nhóm vai trò.

-   Bàn giao tài liệu API và cấu hình tích hợp.

-   Có môi trường thử nghiệm trước production.

-   Có báo cáo kiểm thử bảo mật, phân quyền và tương thích thiết bị.

-   Công ty sở hữu mã nguồn, dữ liệu và tài khoản dịch vụ; tên miền,
    hosting, cloud, Google, SMS nên đăng ký dưới quyền kiểm soát của
    công ty.

# 14. Các quyết định cần chốt trước production

-   Thông tin pháp lý/tên công ty, logo, tên ứng dụng và bộ màu thương
    hiệu.

-   Nhà cung cấp hosting/cloud, domain, môi trường production và người
    chịu trách nhiệm vận hành.

-   Nhà cung cấp SMS OTP, giá, hạn mức, thời gian hiệu lực OTP và quy
    trình dự phòng.

-   Google Maps API key, Google Drive account/folder ownership, Google
    Sheets account và quota.

-   Quy tắc lương chi tiết: công chuẩn, cách quy đổi ca, tăng ca, nghỉ,
    phụ cấp, thưởng/hoa hồng, khấu trừ, làm tròn và kỳ lương.

-   Quy tắc tài chính: thời hạn công nợ, ngày đến hạn, phân bổ thanh
    toán vào đơn, hoàn tiền và điều chỉnh.

-   Thời gian tự đăng xuất, chính sách mật khẩu, thời hạn lưu hồ sơ và
    log.

-   Quy tắc ngoại lệ khi khách không thể OTP/nghiệm thu; người phê duyệt
    và bằng chứng thay thế.

-   Chính sách chữ ký điện tử và giá trị pháp lý mong muốn của biên bản.

-   Giới hạn offline: những thao tác nào được phép tạo/sửa khi mất mạng
    và cách xử lý khi xung đột.

# 15. Giả định và ngoài phạm vi mặc định

-   Không xây dựng kế toán tổng hợp, hóa đơn điện tử, chấm công bằng
    nhận diện khuôn mặt hoặc GPS tracking liên tục nếu chưa được yêu cầu
    riêng.

-   Không mặc định tích hợp Zalo, email hay push notification; kênh
    thông báo nội bộ là in-app.

-   Google Sheets không phải nơi lưu dữ liệu chính thức.

-   Ứng dụng PWA không được mặc định có toàn bộ khả năng native; cần
    kiểm thử giới hạn nền tảng, đặc biệt thông báo nền, GPS và lưu trữ
    offline.

-   Chi phí cloud, SMS, bản đồ và lưu trữ bên thứ ba chưa được xác định;
    cần lập dự toán sau khi chọn nhà cung cấp.

KẾT THÚC TÀI LIỆU SRS -- PHIÊN BẢN DỰ THẢO 1.0
