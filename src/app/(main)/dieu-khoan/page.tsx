import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản sử dụng dịch vụ của Muadatquangngai.com — quyền và nghĩa vụ khi đăng ký, đăng tin và sử dụng website.',
};

export default function TermsOfUsePage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1152px] mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Điều khoản sử dụng</h1>
        <p className="text-sm text-gray-500 mb-8">Cập nhật lần cuối: 27/07/2026</p>

        <div className="space-y-8 text-sm md:text-base text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Giới thiệu</h2>
            <p>
              Muadatquangngai.com (&quot;chúng tôi&quot;) là nền tảng kết nối người mua, người bán, người
              cho thuê và môi giới bất động sản tại khu vực Quảng Ngãi. Khi tạo tài khoản hoặc sử dụng
              bất kỳ tính năng nào của website, bạn đồng ý tuân thủ các điều khoản dưới đây.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Tài khoản người dùng</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Bạn phải cung cấp thông tin chính xác (họ tên, email, số điện thoại) khi đăng ký.</li>
              <li>Bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động diễn ra dưới tài khoản của mình.</li>
              <li>Mỗi cá nhân/tổ chức chỉ nên sở hữu một tài khoản; chúng tôi có quyền tạm khóa các tài khoản trùng lặp phục vụ mục đích gian lận.</li>
              <li>Bạn có thể đăng nhập bằng email/mật khẩu hoặc liên kết tài khoản Google — dữ liệu lấy từ Google (tên, email) chỉ dùng để tạo/xác thực tài khoản.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Đăng tin bất động sản</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Tin đăng phải là thông tin có thật, không sao chép từ nguồn khác, không chứa nội dung sai sự thật về giá, diện tích, pháp lý.</li>
              <li>Mỗi tin đăng đều được kiểm duyệt trước khi hiển thị công khai; chúng tôi có quyền từ chối hoặc gỡ tin vi phạm mà không cần báo trước.</li>
              <li>Nghiêm cấm đăng tin về bất động sản không có quyền sử dụng/sở hữu hợp pháp, hoặc mạo danh chủ sở hữu thật.</li>
              <li>Các gói tin (thường, VIP, VIP+, Kim cương) có thời hạn hiển thị khác nhau theo mô tả tại thời điểm mua gói.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Kiểm duyệt và xử lý vi phạm</h2>
            <p>
              Chúng tôi có quyền tạm ngưng hiển thị, gỡ bỏ tin đăng, hoặc khóa tài khoản nếu phát hiện: tin
              đăng sai sự thật, spam, có nội dung lừa đảo, xâm phạm quyền sở hữu trí tuệ, hoặc vi phạm pháp
              luật Việt Nam. Trường hợp tài khoản bị khóa do vi phạm, các khoản phí đã thanh toán cho tin
              đăng vi phạm sẽ không được hoàn lại.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Bảo mật thông tin</h2>
            <p>
              Việc thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn được quy định chi tiết tại{' '}
              <a href="/chinh-sach" className="text-primary hover:underline">Chính sách bảo mật</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Giới hạn trách nhiệm</h2>
            <p>
              Chúng tôi là nền tảng trung gian kết nối, không phải một bên trong giao dịch mua bán/cho thuê
              bất động sản. Chúng tôi không đảm bảo tính chính xác tuyệt đối của thông tin do người dùng
              đăng tải và khuyến khích người mua/thuê tự xác minh thực tế trước khi giao dịch.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Thay đổi điều khoản</h2>
            <p>
              Điều khoản này có thể được cập nhật theo thời gian. Phiên bản mới nhất luôn được đăng tại
              trang này; việc tiếp tục sử dụng dịch vụ sau khi điều khoản thay đổi đồng nghĩa bạn chấp nhận
              các thay đổi đó.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Liên hệ</h2>
            <p>
              Mọi thắc mắc về điều khoản sử dụng, vui lòng liên hệ{' '}
              <a href="mailto:info.muadatquangngai@gmail.com" className="text-primary hover:underline">info.muadatquangngai@gmail.com</a> hoặc hotline
              0365 285 863.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
