-- Báo cáo giá (Notion 24/09, Phase 1) — dữ liệu lịch sử giá theo tháng.
--
-- Chạy SAU 2026-09-24-01 và 02. Chạy lại nhiều lần vẫn an toàn (IF NOT EXISTS / OR REPLACE).
--
-- Hai tầng dữ liệu:
--   price_observations — mỗi tháng ghi lại giá của TỪNG tin bán đang hiển thị trong tháng đó.
--       Đây là dữ liệu gốc để báo cáo lọc được theo diện tích / khoảng giá / khu vực bất kỳ
--       và tính trung vị chính xác. Không có FK sang properties: tin bị xoá cứng về sau thì
--       lịch sử giá vẫn phải còn.
--   price_snapshots — bản tổng hợp theo (tháng × khu vực × loại BĐS × nguồn), đúng schema
--       khách yêu cầu (area_id, property_type, price_min/max/average/median, price_per_m2,
--       listing_count, recorded_at, data_source). Nền cho Bản đồ giá (Phase 2).
--
-- Nguồn dữ liệu (data_source):
--   'listing'     = Giá rao bán — lấy từ tin đăng trên website. Mọi dữ liệu tự động đều là loại này.
--   'transaction' = Giá giao dịch đã được xác nhận. Chưa có nguồn nào ghi loại này; chỉ ghi khi
--       có dữ liệu giao dịch thực tế được xác nhận.
--
-- Mốc thời gian: cột timestamp của dự án chứa giờ Việt Nam thô (xem src/lib/db-time.ts), nên
-- "bây giờ" trong SQL là now() AT TIME ZONE 'Asia/Ho_Chi_Minh'.

CREATE TABLE IF NOT EXISTS price_observations (
  id            BIGSERIAL PRIMARY KEY,
  period_month  DATE          NOT NULL,              -- ngày 1 của tháng ghi nhận
  property_id   BIGINT        NOT NULL,
  province_id   BIGINT        NOT NULL,
  area_id       BIGINT        NOT NULL,              -- = properties.district_id (phường/xã sau sáp nhập)
  category_id   BIGINT        NOT NULL,
  property_type VARCHAR(10)   NOT NULL DEFAULT 'sell',
  price         NUMERIC(20,0) NOT NULL,
  area_m2       NUMERIC(10,2) NOT NULL,
  price_per_m2  NUMERIC(20,2) NOT NULL,
  data_source   VARCHAR(20)   NOT NULL DEFAULT 'listing',
  recorded_at   TIMESTAMP(0)  NOT NULL,
  CONSTRAINT price_observations_source_check CHECK (data_source IN ('listing', 'transaction'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_price_observations_month_property_source
  ON price_observations (period_month, property_id, data_source);
CREATE INDEX IF NOT EXISTS idx_price_observations_source_month
  ON price_observations (data_source, period_month);
CREATE INDEX IF NOT EXISTS idx_price_observations_area_month
  ON price_observations (area_id, period_month);

CREATE TABLE IF NOT EXISTS price_snapshots (
  id                   BIGSERIAL PRIMARY KEY,
  period_month         DATE          NOT NULL,
  province_id          BIGINT,                        -- NULL = mọi tỉnh
  area_id              BIGINT,                        -- NULL = toàn bộ khu vực
  category_id          BIGINT,                        -- NULL = mọi loại BĐS
  property_type        VARCHAR(10)   NOT NULL DEFAULT 'sell',
  price_min            NUMERIC(20,0),
  price_max            NUMERIC(20,0),
  price_average        NUMERIC(20,0),
  price_median         NUMERIC(20,0),
  price_per_m2         NUMERIC(20,2),                 -- giá trung vị / m² (chỉ số đại diện)
  price_per_m2_min     NUMERIC(20,2),
  price_per_m2_max     NUMERIC(20,2),
  price_per_m2_average NUMERIC(20,2),
  listing_count        INTEGER       NOT NULL,
  outlier_count        INTEGER       NOT NULL DEFAULT 0,
  data_source          VARCHAR(20)   NOT NULL DEFAULT 'listing',
  recorded_at          TIMESTAMP(0)  NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_price_snapshots_month_area_category_source
  ON price_snapshots (period_month, COALESCE(province_id, 0), COALESCE(area_id, 0), COALESCE(category_id, 0), data_source);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_area_month
  ON price_snapshots (area_id, period_month);

-- Ghi nhận giá của một tháng (nguồn 'listing').
--
--   * Tháng đã đóng (trước tháng hiện tại) mà đã có số liệu → KHÔNG ghi đè, trả về 0.
--     Đây là yêu cầu "mỗi snapshot là một bản ghi lịch sử mới, không ghi đè tháng trước".
--   * Tháng hiện tại → ghi lại mỗi lần gọi (số liệu tháng đang chạy được cập nhật tới khi đóng).
--   * Tháng đã đóng mà chưa có số liệu (lần đầu cài đặt) → dựng lại từ tin đăng: tin được tính
--     là "đang hiển thị trong tháng" nếu đã đăng trước cuối tháng và chưa hết hạn trước đầu
--     tháng; giá lấy theo price_histories tại cuối tháng nếu có, không thì giá hiện tại.
--
-- Chỉ tin BÁN (type='sell', giá tổng hoặc giá/m²) — tin thuê tính giá theo tháng, không so được với giá/m².
-- Bỏ các giá trị rõ ràng sai (giá/m² < 100.000đ hoặc > 2 tỷ đ) ngay từ khi ghi nhận.
CREATE OR REPLACE FUNCTION record_price_snapshot(p_month DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_month       DATE := date_trunc('month', p_month)::date;
  v_month_end   TIMESTAMP := (date_trunc('month', p_month) + INTERVAL '1 month' - INTERVAL '1 second');
  v_now         TIMESTAMP := date_trunc('second', now() AT TIME ZONE 'Asia/Ho_Chi_Minh');
  v_current     DATE := date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_count       INTEGER;
BEGIN
  IF v_month > v_current THEN
    RAISE EXCEPTION 'Không ghi nhận được tháng trong tương lai: %', v_month;
  END IF;

  IF v_month < v_current AND EXISTS (
    SELECT 1 FROM price_observations WHERE period_month = v_month AND data_source = 'listing'
  ) THEN
    RETURN 0;
  END IF;

  DELETE FROM price_snapshots WHERE period_month = v_month AND data_source = 'listing';
  DELETE FROM price_observations WHERE period_month = v_month AND data_source = 'listing';

  INSERT INTO price_observations
    (period_month, property_id, province_id, area_id, category_id, property_type,
     price, area_m2, price_per_m2, data_source, recorded_at)
  SELECT v_month, p.id, p.province_id, p.district_id, p.category_id, 'sell',
         conv.total_price, p.area, conv.price_per_m2, 'listing', v_now
  FROM properties p
  CROSS JOIN LATERAL (
    SELECT COALESCE(
      (SELECT h.price FROM price_histories h
        WHERE h.property_id = p.id AND h.changed_at <= v_month_end
        ORDER BY h.changed_at DESC LIMIT 1),
      p.price
    ) AS price
  ) obs
  -- price_unit='per_m2' nghĩa là cột price đã là giá/m² (xem derivePrices trong src/lib/formatters.ts).
  CROSS JOIN LATERAL (
    SELECT CASE WHEN p.price_unit = 'per_m2' THEN round(obs.price * p.area) ELSE obs.price END AS total_price,
           CASE WHEN p.price_unit = 'per_m2' THEN obs.price ELSE round(obs.price / p.area, 2) END AS price_per_m2
  ) conv
  WHERE p.type = 'sell'
    AND p.price_unit IN ('total', 'per_m2')
    AND p.deleted_at IS NULL
    AND p.status IN ('active', 'expired')
    AND p.published_at IS NOT NULL
    AND p.published_at <= v_month_end
    AND (p.expired_at IS NULL OR p.expired_at >= v_month::timestamp)
    AND p.area > 0
    AND obs.price > 0
    AND conv.price_per_m2 BETWEEN 100000 AND 2000000000;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Tổng hợp 4 cấp: khu vực × loại, khu vực × mọi loại, toàn bộ × loại, toàn bộ × mọi loại.
  -- Min/max/average bỏ giá trị bất thường theo hàng rào 1,5×IQR trên giá/m² (khi nhóm có
  -- từ 4 tin trở lên); trung vị tính trên toàn bộ vì vốn không bị vài giá trị lệch kéo đi.
  INSERT INTO price_snapshots
    (period_month, province_id, area_id, category_id, property_type,
     price_min, price_max, price_average, price_median,
     price_per_m2, price_per_m2_min, price_per_m2_max, price_per_m2_average,
     listing_count, outlier_count, data_source, recorded_at)
  WITH obs AS (
    SELECT * FROM price_observations WHERE period_month = v_month AND data_source = 'listing'
  ),
  keyed AS (
    SELECT o.*, g.*
    FROM obs o
    CROSS JOIN LATERAL (VALUES (TRUE, TRUE), (TRUE, FALSE), (FALSE, TRUE), (FALSE, FALSE)) AS lv(by_area, by_category)
    CROSS JOIN LATERAL (
      SELECT CASE WHEN lv.by_area THEN o.province_id END AS g_province,
             CASE WHEN lv.by_area THEN o.area_id END AS g_area,
             CASE WHEN lv.by_category THEN o.category_id END AS g_category
    ) g
  ),
  fences AS (
    SELECT g_province, g_area, g_category,
           percentile_cont(0.25) WITHIN GROUP (ORDER BY price_per_m2) AS q1,
           percentile_cont(0.75) WITHIN GROUP (ORDER BY price_per_m2) AS q3,
           count(*) AS n
    FROM keyed
    GROUP BY g_province, g_area, g_category
  ),
  flagged AS (
    SELECT k.*,
           (f.n >= 4 AND (k.price_per_m2 < f.q1 - 1.5 * (f.q3 - f.q1)
                          OR k.price_per_m2 > f.q3 + 1.5 * (f.q3 - f.q1))) AS is_outlier
    FROM keyed k
    JOIN fences f
      ON f.g_province IS NOT DISTINCT FROM k.g_province
     AND f.g_area IS NOT DISTINCT FROM k.g_area
     AND f.g_category IS NOT DISTINCT FROM k.g_category
  )
  SELECT v_month, g_province, g_area, g_category, 'sell',
         min(price) FILTER (WHERE NOT is_outlier),
         max(price) FILTER (WHERE NOT is_outlier),
         round(avg(price) FILTER (WHERE NOT is_outlier)),
         round(percentile_cont(0.5) WITHIN GROUP (ORDER BY price)::numeric),
         round(percentile_cont(0.5) WITHIN GROUP (ORDER BY price_per_m2)::numeric, 2),
         min(price_per_m2) FILTER (WHERE NOT is_outlier),
         max(price_per_m2) FILTER (WHERE NOT is_outlier),
         round(avg(price_per_m2) FILTER (WHERE NOT is_outlier), 2),
         count(*),
         count(*) FILTER (WHERE is_outlier),
         'listing', v_now
  FROM flagged
  GROUP BY g_province, g_area, g_category;

  RETURN v_count;
END;
$$;

-- Lần đầu cài đặt: dựng lại lịch sử từ tháng có tin đăng sớm nhất tới tháng hiện tại.
DO $$
DECLARE
  v_first DATE;
  v_month DATE;
BEGIN
  SELECT date_trunc('month', min(published_at))::date INTO v_first
  FROM properties WHERE type = 'sell' AND deleted_at IS NULL AND published_at IS NOT NULL;
  IF v_first IS NULL THEN RETURN; END IF;
  v_month := v_first;
  WHILE v_month <= date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date LOOP
    PERFORM record_price_snapshot(v_month);
    v_month := (v_month + INTERVAL '1 month')::date;
  END LOOP;
END;
$$;
