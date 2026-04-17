'use client';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Tổng quan hệ thống</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tin đăng', value: '1,234', change: '+12%', color: 'blue' },
          { label: 'Người dùng', value: '5,678', change: '+8%', color: 'green' },
          { label: 'Tin chờ duyệt', value: '89', change: '-5%', color: 'yellow' },
          { label: 'Báo cáo', value: '12', change: '-20%', color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change} so với tháng trước
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Tin đăng gần đây</h2>
          <div className="space-y-4">
            {[
              { title: 'Căn hộ cao cấp 2PN view biển', status: 'pending', time: '5 phút trước' },
              { title: 'Nhà mặt phố 4 tầng Quang Trung', status: 'active', time: '10 phút trước' },
              { title: 'Đất nền dự án ven biển 500m2', status: 'active', time: '30 phút trước' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.status === 'active' ? 'Đã duyệt' : 'Chờ duyệt'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Báo cáo mới</h2>
          <div className="space-y-4">
            {[
              { title: 'Tin đăng spam', count: 5, time: '1 giờ trước' },
              { title: 'Thông tin sai sự thật', count: 3, time: '2 giờ trước' },
              { title: 'Liên hệ không hợp lệ', count: 2, time: '3 giờ trước' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                  {item.count} mới
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
