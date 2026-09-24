// Ghi nhận giá tháng hiện tại cho Báo cáo giá — chạy bằng crontab của user site trên VPS:
//   node --env-file=.env scripts/price-snapshot.mjs
//
// Chạy mỗi ngày: số liệu của một tháng là lần chạy cuối cùng trong tháng đó, và tháng nào lỡ
// bị bỏ sót vẫn được dựng lại. Logic nằm trong hàm SQL record_price_snapshot
// (prisma/sql/2026-09-24-03-price-report.sql); tháng đã đóng không bao giờ bị ghi đè.
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  const { rows } = await client.query(
    `SELECT to_char(m, 'YYYY-MM') AS month, record_price_snapshot(m::date) AS count
     FROM (VALUES
       (date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - INTERVAL '1 month'),
       (date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh'))
     ) AS t(m)`,
  );
  console.log(JSON.stringify({ event: 'price_snapshot.recorded', at: new Date().toISOString(), rows }));
} catch (error) {
  console.error(JSON.stringify({ event: 'price_snapshot.failed', message: error.message }));
  process.exitCode = 1;
} finally {
  await client.end();
}
