import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  description: 'Chính sách bảo mật của Muadatquangngai.com — cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu người dùng.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <div className="max-w-[1152px] mx-auto px-4 py-10 md:py-14">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Chính sách bảo mật</h1>
        <p className="text-sm text-gray-500 mb-8">Cập nhật lần cuối: 27/07/2026</p>

        <div className="space-y-8 text-sm md:text-base text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Dữ liệu chúng tôi thu thập</h2>
            <p className="mb-2">Khi bạn tạo tài khoản, đăng tin hoặc sử dụng website, chúng tôi thu thập:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Thông tin tài khoản:</strong> họ tên, email, số điện thoại, mật khẩu (đã mã hoá), ảnh đại diện, địa chỉ.</li>
              <li><strong>Thông tin đăng nhập mạng xã hội:</strong> khi bạn liên kết đăng nhập Google, chúng tôi nhận tên và email từ Google — không nhận và không lưu mật khẩu Google của bạn.</li>
              <li><strong>Thông tin tin đăng:</strong> hình ảnh, mô tả, giá, vị trí, giấy tờ pháp lý (nếu bạn tải lên) của bất động sản bạn đăng.</li>
              <li><strong>Thông tin hồ sơ môi giới/doanh nghiệp:</strong> tên công ty, lĩnh vực hoạt động, số giấy phép hành nghề (nếu bạn đăng ký làm môi giới/đại lý).</li>
              <li><strong>Tin nhắn:</strong> nội dung trao đổi giữa bạn và người mua/bán khác qua hệ thống nhắn tin nội bộ.</li>
              <li><strong>Dữ liệu sử dụng:</strong> lịch sử xem tin, tìm kiếm, tương tác trên website (phục vụ gợi ý tin phù hợp).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Mục đích sử dụng dữ liệu</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Tạo và xác thực tài khoản, cho phép đăng nhập bằng email/mật khẩu hoặc Google.</li>
              <li>Hiển thị tin đăng của bạn tới người mua/thuê quan tâm.</li>
              <li>Gửi email/OTP xác thực, thông báo về tin đăng, và (nếu bạn yêu cầu) email đặt lại mật khẩu.</li>
              <li>Hỗ trợ liên hệ giữa người mua và người bán/môi giới thông qua thông tin liên hệ bạn cung cấp.</li>
              <li>Ngăn chặn gian lận, spam và các hành vi vi phạm Điều khoản sử dụng.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Chia sẻ dữ liệu</h2>
            <p>
              Chúng tôi <strong>không bán</strong> dữ liệu cá nhân của bạn cho bên thứ ba. Thông tin liên hệ
              trên tin đăng (số điện thoại, tên môi giới) được hiển thị công khai để người mua/thuê có thể
              liên hệ trực tiếp — đây là mục đích chính của một tin đăng bất động sản. Dữ liệu chỉ được chia
              sẻ với bên thứ ba trong các trường hợp: nhà cung cấp dịch vụ gửi email/xác thực (ví dụ Resend)
              cần thiết để vận hành tính năng liên quan, hoặc khi pháp luật yêu cầu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Bảo mật dữ liệu</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Mật khẩu được mã hoá một chiều (bcrypt), chúng tôi không bao giờ lưu hoặc nhìn thấy mật khẩu gốc của bạn.</li>
              <li>Mã xác thực (OTP) và liên kết đặt lại mật khẩu có thời hạn sử dụng ngắn và chỉ dùng được một lần.</li>
              <li>Kết nối tới website được mã hoá qua HTTPS.</li>
              <li>Chúng tôi giới hạn quyền truy cập dữ liệu người dùng chỉ cho nhân sự cần thiết để vận hành hệ thống.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Quyền của bạn</h2>
            <p>
              Bạn có thể xem, cập nhật thông tin cá nhân trong trang quản lý tài khoản, hoặc yêu cầu chúng
              tôi xoá tài khoản và dữ liệu liên quan bằng cách liên hệ{' '}
              <a href="mailto:info.muadatquangngai@gmail.com" className="text-primary hover:underline">
                info.muadatquangngai@gmail.com
              </a>
              . Một số dữ liệu (ví dụ: giao dịch đã hoàn tất) có thể được lưu giữ thêm theo yêu cầu pháp lý.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Thay đổi chính sách</h2>
            <p>
              Chính sách này có thể được cập nhật khi chúng tôi bổ sung tính năng mới. Phiên bản mới nhất
              luôn được đăng tại trang này.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Liên hệ</h2>
            <p>
              Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ{' '}
              <a href="mailto:info.muadatquangngai@gmail.com" className="text-primary hover:underline">
                info.muadatquangngai@gmail.com
              </a>{' '}
              hoặc hotline 0365 285 863.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
