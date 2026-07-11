#!/usr/bin/env bash
# Đẩy toàn bộ schema + data từ Postgres LOCAL lên Supabase (1 lần, cho deploy đầu tiên).
#
# CÁCH DÙNG:
#   SUPABASE_DB_URL="postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
#   LOCAL_DB_URL="postgresql://postgres:secret@127.0.0.1:5432/bds_db" \
#   bash scripts/push-to-supabase.sh
#
# LƯU Ý:
#   - Dùng chuỗi TRỰC TIẾP port 5432 (KHÔNG phải pooler 6543) cho SUPABASE_DB_URL.
#   - PostGIS phải đã bật trên Supabase (create extension postgis) — đã làm ở bước setup.
#   - Bỏ qua spatial_ref_sys (bảng hệ thống PostGIS, extension tự tạo/nạp sẵn).
#   - Chạy được nhiều lần: --clean sẽ drop rồi tạo lại các bảng public trước khi nạp.
set -euo pipefail

: "${SUPABASE_DB_URL:?Thiếu SUPABASE_DB_URL (chuỗi trực tiếp port 5432)}"
: "${LOCAL_DB_URL:=postgresql://postgres:secret@127.0.0.1:5432/bds_db}"

DUMP_FILE="$(mktemp -t bds_dump.XXXXXX.sql)"
trap 'rm -f "$DUMP_FILE" "$DUMP_FILE.raw"' EXIT

echo "==> Dump schema + data từ local (bỏ owner/privilege/spatial_ref_sys)..."
# KHÔNG dùng --clean: nó sinh DROP SCHEMA public xung đột với extension postgis đã có
# sẵn trên Supabase. Target (public trên Supabase) đang trống (chỉ có postgis) nên CREATE
# TABLE chạy thẳng được. Lọc bỏ dòng CREATE EXTENSION/COMMENT ON EXTENSION để tránh xung
# đột quyền (postgis đã cài sẵn, và role Supabase không tạo lại được trong public).
pg_dump "$LOCAL_DB_URL" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --exclude-table=spatial_ref_sys \
  --exclude-table-data=spatial_ref_sys \
  --file="$DUMP_FILE.raw"
grep -vE '^(CREATE EXTENSION|COMMENT ON EXTENSION|CREATE SCHEMA public|COMMENT ON SCHEMA public)' "$DUMP_FILE.raw" > "$DUMP_FILE"
rm -f "$DUMP_FILE.raw"

echo "==> Kích thước dump: $(du -h "$DUMP_FILE" | cut -f1)"

echo "==> Nạp lên Supabase..."
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction --file="$DUMP_FILE"

echo "==> Xong. Kiểm tra số dòng trên Supabase:"
psql "$SUPABASE_DB_URL" -tAc \
  "select 'properties='||count(*) from properties" 2>/dev/null || true
psql "$SUPABASE_DB_URL" -tAc \
  "select 'projects='||(select count(*) from projects)||', users='||(select count(*) from users)" 2>/dev/null || true
