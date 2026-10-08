#!/bin/sh
# Bộ tự cứu web trên VPS — cron chạy mỗi 5 phút (crontab của tài khoản web, không cần root).
#
# Gọi thử web ngay trên máy chủ (không qua Internet). Không trả lời 2 lần liên tiếp thì tự bật
# lại: tiến trình còn trong PM2 thì restart, mất hẳn (PM2 chết, máy vừa khởi động lại...) thì
# resurrect từ danh sách đã `pm2 save`. Mọi lần can thiệp đều ghi vào ~/watchdog.log.
#
# Bỏ qua khi đang deploy (`next build` đang chạy): lúc đó web cũ vẫn phục vụ nhưng có thể trả
# lỗi tạm thời, restart giữa chừng sẽ làm hỏng chính lần deploy.

APP_NAME="muadatquangngai"
HEALTH_URL="http://127.0.0.1:3002/api/v2/build-id"
NODE_BIN="/home/muadatquangngai.com/.nvm/versions/node/v22.23.1/bin"
LOG="$HOME/watchdog.log"
LOCK="/tmp/${APP_NAME}-watchdog.lock"

export PATH="$NODE_BIN:/usr/local/bin:/usr/bin:/bin"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG"; }

# Không chạy chồng lên lượt trước (lượt trước có thể đang chờ web khởi động).
exec 9>"$LOCK"
flock -n 9 || exit 0

if pgrep -u "$(id -u)" -f "next build" > /dev/null 2>&1; then
  exit 0
fi

healthy() {
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$HEALTH_URL")
  [ "$code" = "200" ]
}

healthy && exit 0

# Một lần không trả lời có thể chỉ là chậm nhất thời — chờ rồi thử lại trước khi can thiệp.
sleep 20
healthy && exit 0

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  log "Web không trả lời 2 lần liền — pm2 restart $APP_NAME"
  pm2 restart "$APP_NAME" >> "$LOG" 2>&1
else
  log "Không thấy tiến trình $APP_NAME trong PM2 — pm2 resurrect"
  pm2 resurrect >> "$LOG" 2>&1
fi

sleep 30
if healthy; then
  log "Đã bật lại thành công."
else
  log "VẪN KHÔNG trả lời sau khi bật lại — cần người kiểm tra (xem: pm2 logs $APP_NAME)."
fi

# Giữ file log gọn: chỉ 500 dòng gần nhất.
tail -n 500 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG"
