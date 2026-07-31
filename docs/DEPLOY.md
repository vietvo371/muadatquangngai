# Deploy lên VPS (CyberPanel) — muadatquangngai.com

Domain: https://muadatquangngai.com
Server: VPS chung với site suckhoetaman.com (chanan-clone), quản lý qua
  **CyberPanel** (OpenLiteSpeed). SSH host `139.180.138.113`.
Site trên CyberPanel: user SSH jailed (CageFS) **`muada4728`**, home
  `/home/muadatquangngai.com`, docRoot `~/public_html`, cổng Node **3002**
  (3001 đã bị suckhoetaman dùng).

Dự án này **không còn Laravel backend riêng ở production** — `frontend/` là
Next.js App Router tự chứa cả API (`/api/v2/*` dùng Prisma → Supabase
Postgres). Không cần cài Postgres/Redis trên VPS, DB là Supabase managed.

Repo: `https://github.com/vietvo371/muadatquangngai.git` (public, clone
thẳng không cần token).


## 0. Việc đã làm 1 lần khi setup ban đầu (22/07/2026)

1. **CyberPanel → site `muadatquangngai.com` → SET UP SSH/SFTP ACCESS**:
   đặt password cho SSH user của site (`muada4728`) một lần để kích hoạt tài
   khoản hệ thống — bắt buộc, nếu chưa đặt password thì API "Add Key" của
   CyberPanel âm thầm KHÔNG ghi được gì vào `~/.ssh/authorized_keys` (tạo
   file rỗng 0 byte, không báo lỗi). Sau khi có password, thêm SSH public
   key qua cùng trang (khung "Paste your public key here...") → không cần
   dùng password nữa cho các lần sau.
2. `public_html` lúc đầu có sẵn một site WordPress cũ (không dùng nữa) —
   backup bằng `mv public_html wordpress_backup_<ngày>` rồi tạo `public_html`
   mới, clone repo Next.js vào đó.
3. Cài **NVM + Node 22** (không phải 20 — `@mapbox/jsonlint-lines-primitives`,
   dependency của `maplibre-gl`, yêu cầu `engine node >= 22`, yarn install
   abort thẳng nếu dùng Node 20). Cài `yarn` qua `corepack enable` (project
   dùng yarn, không dùng npm) và `pm2` qua `npm install -g pm2` — **nhớ cài
   lại `pm2`/global packages SAU KHI đã `nvm alias default 22`**, vì global
   packages nằm trong thư mục riêng theo từng version Node, đổi default
   version là mất luôn `pm2` khỏi PATH.
4. **Trỏ domain vào cổng Node — làm qua CyberPanel web UI, KHÔNG cần root
   SSH, KHÔNG cần đăng nhập OpenLiteSpeed WebAdmin (7080)**:
   - Site `muadatquangngai.com` → mục **CONFIGURATIONS → vHost Conf** (nút
     "Edit vHost Main Configurations") → mở ra một textarea chứa nguyên
     file vhost conf thật của OpenLiteSpeed cho site này.
   - Thêm vào cuối file 2 block:
     ```
     extprocessor muadatquangngai_node {
       type                    proxy
       address                 127.0.0.1:3002
       maxConns                1000
       initTimeout             60
       retryTimeout            0
       respBuffer              0
     }

     context / {
       type                    proxy
       handler                 muadatquangngai_node
       addDefaultCharset       off
     }
     ```
   - Bấm **Save** — CyberPanel tự áp dụng (không cần restart LSWS thủ công).
   - **Đã thử và KHÔNG hoạt động**: đặt `.htaccess` với rewrite rule
     `RewriteRule ^(.*)$ http://127.0.0.1:3002/$1 [P,L]` — vẫn ra 404 gốc
     của LiteSpeed dù vhost có `rewrite { enable 1; autoLoadHtaccess 1 }`.
     Không rõ lý do chính xác (có thể OLS cần context kiểu `proxy` thật sự,
     không chỉ rewrite flag `[P]` trỏ URL ngoài) — dùng thẳng
     extprocessor+context ở trên, đáng tin cậy hơn nhiều.
   - Trang quản lý site còn có mục **Rewrite Rules** riêng (chưa thử) và
     **Apache Manager** — chưa cần dùng tới vì vHost Conf đã đủ.
5. **Mở outbound firewall cho Supabase (BẮT BUỘC, xem mục 8) — cần root SSH**,
   không làm được qua user jailed `muada4728`. Lấy root SSH bằng cách thêm
   SSH public key qua CyberPanel: **Security → Secure SSH → tab "SSH Keys"**
   (`/firewall/secureSSH`, khác hẳn trang "SET UP SSH/SFTP ACCESS" theo site
   ở bước 0.1 — trang này áp dụng cho **root toàn server**) → "Add Key" →
   dán public key. Không cần biết/reset mật khẩu root.


## 1. Trên máy local

```bash
cd frontend
git add .
git commit -m "your message"
git push origin main
```

Repo `frontend/` là submodule riêng (xem `git status` ở repo cha) — nhớ bump
submodule pointer ở repo `batdongsan` gốc sau khi push nếu cần.


## 2. Trên VPS — SSH + biến môi trường

```bash
ssh -i ~/.ssh/muadatquangngai_deploy muada4728@139.180.138.113
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd ~/public_html
```

`.env` production (KHÔNG commit, đã có sẵn trên VPS — chỉ liệt kê lại để
biết đủ field khi cần sửa):

```bash
# Supabase — chuỗi POOLER (Supavisor, 6543, pgbouncer=true) cho runtime
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Supabase — chuỗi TRỰC TIẾP (5432), chỉ cần nếu chạy prisma migrate/introspect trên VPS
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dltbjoii4"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="muadat_unsigned"

# ĐỂ TRỐNG — FE gọi thẳng /api/v2/* của chính Next.js này (same-origin), không có backend ngoài
NEXT_PUBLIC_API_URL=""

NEXT_PUBLIC_GOONG_API_KEY="<goong_api_key>"
NEXT_PUBLIC_CLIENT_URL="https://muadatquangngai.com"
NEXT_PUBLIC_SITE_URL="https://muadatquangngai.com"

# Server-only, không có NEXT_PUBLIC_ — dùng cho tính năng AI tạo tiêu đề/mô tả
GROQ_API_KEY="<groq_api_key>"
```

> Giá trị thật của các key trên đã có sẵn trong `.env` trên VPS — không ghi
> lại ở đây để tránh lộ secret khi commit (GitHub push protection sẽ chặn
> nếu để giá trị thật). Lấy giá trị thật từ `.env.local` cục bộ hoặc hỏi
> chủ dự án.

> `DATABASE_URL`/`DIRECT_URL` bị đánh dấu **Sensitive** trên Vercel nên
> `vercel env pull` luôn trả về chuỗi rỗng — không lấy lại được qua CLI hay
> dashboard. Xem [[production-db-access-vercel-supabase]] (memory) để biết
> quy trình reset password Supabase khi cần lấy lại giá trị này.


## 3. Deploy (lần đầu và các lần sau)

Chạy **nền** bằng cách ghi log vào **thư mục home của mình** (`~/build.log`,
`~/yarn_install.log`...), **TUYỆT ĐỐI KHÔNG dùng `/tmp/*.log`** — xem mục 6.

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd ~/public_html

git pull origin main
yarn install --frozen-lockfile --network-timeout 600000   # postinstall tự chạy `prisma generate`
# QUAN TRỌNG: nối build và restart bằng `&&`, KHÔNG bằng `;` — xem cảnh báo dưới.
NODE_OPTIONS=--max-old-space-size=1536 yarn build && pm2 restart muadatquangngai
```

> **BẮT BUỘC dùng `&&` giữa `yarn build` và `pm2 restart`, KHÔNG dùng `;`.**
> Build VPS hay bị OOM-killer giết (exit 137, xem mục 8) và để lại `.next` DỞ DANG
> (thiếu `~/public_html/.next/BUILD_ID`). Nếu nối bằng `;`, `pm2 restart` vẫn chạy sau
> khi build fail → nạp bản `.next` hỏng → **site 503 cho khách thật** (đã xảy ra
> 31/07/2026). Với `&&`, build fail thì restart KHÔNG chạy, app cũ tiếp tục phục vụ.
> `NODE_OPTIONS=--max-old-space-size=1536` giới hạn heap để giảm nguy cơ OOM.
>
> **Nếu lỡ đã 503 vì nạp `.next` hỏng**: `pm2 stop muadatquangngai` (giải phóng RAM,
> app đang 503 đằng nào cũng vô dụng) → rebuild với `&& pm2 restart` như trên → verify
> `.next/BUILD_ID` tồn tại + `curl / ` trả 200. Dừng app trước khi build giúp build
> không OOM (site khác trên VPS chiếm RAM song song). Xác nhận build XONG bằng
> `pgrep -f "[y]arn build"` rỗng, KHÔNG chỉ đọc log.

Next.js 16 build mất **~16-19 phút** trên VPS này (RAM 1.9GB, chạy chung site khác) —
nếu chạy qua SSH có thể rớt kết nối giữa chừng, nên bọc bằng `nohup ... &` và theo dõi
bằng `until ! pgrep -f "[y]arn build"; do sleep 20; done` để được báo khi xong.

**Chỉ chạy `yarn install`** (bỏ qua) nếu `package.json`/`yarn.lock` không
đổi — build nhanh hơn. Prisma `postinstall` sẽ tự re-generate client nếu
`prisma/schema.prisma` đổi (schema đổi thì BẮT BUỘC install lại để hook
postinstall chạy).


## 4. Kiểm tra sau deploy

```bash
sleep 5
curl -s -o /dev/null -w "trang chu: %{http_code}\n" https://muadatquangngai.com/
curl -s -o /dev/null -w "api mau : %{http_code}\n" https://muadatquangngai.com/api/v2/properties
curl -s -o /dev/null -w "dang tin: %{http_code}\n" https://muadatquangngai.com/dashboard/dang-tin
```

Trang chủ/dashboard 200 nhưng `/api/v2/*` trả 500 với log
`PrismaClientKnownRequestError ... ECONNREFUSED` → `DATABASE_URL` chưa
đúng/chưa điền, không phải lỗi code hay lỗi proxy.


## 5. Trường hợp đặc biệt

**Đổi `next.config.ts`**: bắt buộc build lại, `pm2 restart` không đủ — Next
đóng băng config vào `.next/required-server-files.json` lúc build.

**Đổi `prisma/schema.prisma`**: chạy lại `yarn install` (trigger postinstall
→ `prisma generate`) RỒI build lại. Không cần `prisma migrate` trên VPS —
migration chạy nhắm vào Supabase từ máy local là đủ, VPS chỉ cần Prisma
Client khớp schema mới.

**Đổi cổng Node hoặc thêm site Node khác trên cùng VPS**: sửa lại block
`extprocessor`/`context` trong CONFIGURATIONS → vHost Conf của đúng site đó
(mục 0.4) — mỗi site có vHost Conf riêng, không đụng tới site khác.

**KHÔNG `rm -rf .next`** trong lúc site đang chạy — có thể gây 500 kéo dài
suốt lúc build (Node cache lần tìm module thất bại nên không tự khỏi). Chỉ
build sạch lúc thật cần và ít khách:

```bash
rm -rf .next node_modules/.cache
yarn install --frozen-lockfile && yarn build && pm2 restart muadatquangngai
```


## 6. Xử lý sự cố

**`pm2: command not found`** — chưa nạp NVM, hoặc vừa đổi `nvm alias
default` sang version Node khác với version lúc cài `pm2`/`yarn` global:
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install -g pm2   # cài lại nếu vẫn thiếu sau khi nạp NVM
```

**TUYỆT ĐỐI KHÔNG ghi log build vào `/tmp/*`** — VPS này `/tmp` là thư mục
HỆ THỐNG DÙNG CHUNG giữa mọi site (không phải CageFS jail thật cho /tmp),
site khác (`suckhoetaman`/chanan-clone) có thể đã có sẵn file cùng tên
(`/tmp/build.log` chẳng hạn) sở hữu bởi user khác → lệnh `> /tmp/build.log`
của mình sẽ bị **Permission denied ÂM THẦM** (redirect fail nhưng phần sau
lệnh vẫn chạy nếu nối bằng `;`), rồi lỡ `tail` lại đúng file cũ đó tưởng
nhầm là log của mình. Luôn ghi vào `~/*.log` (home riêng của site).

**Site trả 503 toàn bộ** — app không chạy:
```bash
pm2 status
pm2 logs muadatquangngai --lines 50 --nostream
pm2 resurrect
```

**Trang lẻ trả 500** — xem lỗi thật:
```bash
pm2 logs muadatquangngai --err --lines 80 --nostream
```

**Ảnh Cloudinary không hiện / `/_next/image` trả 400** — kiểm tra domain
Cloudinary có trong `images.remotePatterns` của `next.config.ts` **bản đang
chạy** chưa (đổi config phải build lại, xem mục 5).

**404 trang gốc của LiteSpeed (`x-turbo-charged-by: LiteSpeed`) dù
`pm2 status` báo online** — proxy context trong vHost Conf (mục 0.4) chưa
đúng hoặc chưa lưu — vào lại CONFIGURATIONS → vHost Conf kiểm tra block
`extprocessor`/`context /` còn nguyên không.

**Không có sudo, không đọc được `/usr/local/lsws/conf/vhosts/`** — tài
khoản SSH jailed (`muada4728`) không có quyền root, không sửa được config
qua dòng lệnh. Mọi thay đổi vhost phải làm qua CyberPanel web UI (vHost
Conf), không cần root SSH cho site này.

**Build báo `Killed` / `error Command failed with exit code 137`** — bị
kernel OOM-killer giết (VPS này chỉ có 1.9GB RAM, dùng chung nhiều site).
Xác nhận bằng `dmesg | grep -i oom` (root) thấy dòng
`Out of memory: Killed process ... (node)`. Cách khắc phục: thêm swap
(kiểm tra `free -h` trước, disk còn trống thì thêm 2GB):
```bash
fallocate -l 2G /swapfile2 && chmod 600 /swapfile2 && mkswap /swapfile2 && swapon /swapfile2
echo "/swapfile2 none swap sw 0 0" >> /etc/fstab   # để swap tự bật lại sau khi VPS reboot
```
Cần root SSH cho việc này (xem mục 0.5). Sau khi thêm swap, chạy lại
`yarn build` bình thường — không cần giới hạn `NODE_OPTIONS` gì thêm.


## 7. Ghi chú build.log false-positive (bài học 26/07/2026)

`yarn build > /tmp/build.log 2>&1; echo EXIT_CODE=$?` từng in ra
`EXIT_CODE=1` kèm dòng `bash: /tmp/build.log: Permission denied` — nhưng vì
lệnh tiếp theo `tail -80 /tmp/build.log` vẫn chạy (không dừng theo exit code
của lệnh trước khi nối bằng `;`), nó đọc được nội dung CŨ của file (thuộc
site khác), trông y như log build thật (có route, có PM2 restart) khiến dễ
tưởng nhầm là build của mình đã chạy xong thành công. Luôn kiểm tra
`EXIT_CODE=` ở ĐẦU output, và luôn ghi log vào `~/` thay vì `/tmp/`.


## 8. Outbound firewall chặn kết nối tới Supabase (bài học lớn 26/07/2026)

Sau khi deploy xong hạ tầng (Node/PM2/proxy chạy ổn), API vẫn 500 với log
`PrismaClientKnownRequestError ... ECONNREFUSED` dù `.env` đã điền đúng
`DATABASE_URL`/`DIRECT_URL`. **Nguyên nhân: CSF (ConfigServer Security &
Firewall) trên VPS này chặn TCP_OUT theo whitelist cổng** — mặc định chỉ mở
`20,21,22,25,43,53,80,110,113,443,587,993,995,8090,40110:40210,8088,5678`,
không có cổng Postgres (`5432` trực tiếp, `6543` pooler của Supabase). Xác
nhận bằng:
```bash
timeout 5 bash -c "echo > /dev/tcp/aws-0-ap-southeast-1.pooler.supabase.com/6543" \
  && echo OK || echo FAIL   # "Connection refused" ở tầng TCP dù gọi thẳng IP
```

**Sửa bằng CyberPanel UI (KHÔNG cần root) không đáng tin cậy**: trang
Security → CSF → Firewall Configuration trả về HTTP 200 "thành công" mỗi
lần bấm "Change", nhưng giá trị `TCP_OUT` **âm thầm không được lưu** — kể cả
khi thao tác thật bằng chuột người dùng (không phải do tự động hoá). Kiểm
tra lại config sau khi "Change" luôn thấy revert về giá trị cũ. Không rõ
nguyên nhân chính xác (nghi ngờ bug của lớp iframe CyberPanel bọc quanh
cf9.pl), đã thử tất cả các cách không cần root: Root File Manager (chỉ có ở
bản trả phí), OpenLiteSpeed WebAdmin (7080, cần mật khẩu riêng không có),
tile "Firewall" trong Security (chỉ là alias của CSF) — none work.

**Cách chắc chắn ăn — cần root SSH**, lấy qua CyberPanel Security → Secure
SSH → SSH Keys (add public key cho root, xem mục 0.5), rồi:
```bash
ssh root@<vps-ip> '
cp /etc/csf/csf.conf /etc/csf/csf.conf.bak.$(date +%Y%m%d_%H%M%S)
sed -i "/^TCP_OUT = /s/\"\$/,5432,6543\"/" /etc/csf/csf.conf
csf -r
'
```

**Bẫy**: nếu trước đó đã từng bấm "Change"/"Firewall Restart" nhiều lần qua
web UI (kể cả không thành công), CSF có thể để lại **lock file rác**
`/var/lib/csf/csf.lock` khiến `csf -r` báo lỗi `Resource temporarily
unavailable at /usr/sbin/csf line 185`. Kiểm tra không có process `csf`/`lfd`
nào thật đang restart (`ps aux | grep csf`) rồi xoá lock:
```bash
rm -f /var/lib/csf/csf.lock
```
rồi chạy lại `csf -r` (qua SSH hoặc nút "Firewall Restart" trên web UI đều
được — restart đơn thuần, không sửa field, có vẻ luôn hoạt động đúng).

Sau khi áp dụng, test lại kết nối TCP ở trên phải ra `OK`, và
`curl https://<domain>/api/v2/properties` phải trả dữ liệu thật thay vì 500.
