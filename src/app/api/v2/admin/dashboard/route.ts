import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/** GET /api/v2/admin/dashboard — port của AdminDashboardController@dashboard. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (guard instanceof NextResponse) return guard;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalUsers,
    totalProperties,
    activeProperties,
    pendingProperties,
    revenueAgg,
    newUsersToday,
    newListingsToday,
    pendingReports,
  ] = await Promise.all([
    db.users.count(),
    db.properties.count(),
    db.properties.count({ where: { status: 'active' } }),
    db.properties.count({ where: { status: 'pending' } }),
    db.transactions.aggregate({ where: { status: 'success' }, _sum: { amount: true } }),
    db.users.count({ where: { created_at: { gte: today, lt: tomorrow } } }),
    db.properties.count({ where: { created_at: { gte: today, lt: tomorrow } } }),
    db.reports.count({ where: { status: 'pending' } }),
  ]);

  const data = {
    total_users: totalUsers,
    total_properties: totalProperties,
    active_properties: activeProperties,
    pending_properties: pendingProperties,
    total_revenue: revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0,
    new_users_today: newUsersToday,
    new_listings_today: newListingsToday,
    pending_reports: pendingReports,
  };

  // Laravel: response()->json(['success'=>true,'data'=>$stats]) — KHÔNG có key "message"
  // (khác ApiController::success() luôn có message:null) — giữ nguyên đúng shape.
  return NextResponse.json({ success: true, data });
}
