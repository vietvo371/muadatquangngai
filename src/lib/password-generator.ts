const LOWER = 'abcdefghijkmnpqrstuvwxyz'; // bỏ l, o dễ nhầm với 1, 0
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // bỏ I, O dễ nhầm với 1, 0
const DIGITS = '23456789'; // bỏ 0, 1 dễ nhầm với O, l
const SPECIAL = '!@#$%^&*-_=+';
const ALL = LOWER + UPPER + DIGITS + SPECIAL;
const LENGTH = 14;

function randomChar(chars: string): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return chars[bytes[0] % chars.length];
}

function shuffle(chars: string[]): string[] {
  for (let i = chars.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const j = bytes[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

/** Sinh mật khẩu mạnh ngẫu nhiên — luôn có đủ chữ hoa/thường/số/ký tự đặc biệt. */
export function generateStrongPassword(): string {
  const required = [randomChar(LOWER), randomChar(UPPER), randomChar(DIGITS), randomChar(SPECIAL)];
  const rest = Array.from({ length: LENGTH - required.length }, () => randomChar(ALL));
  return shuffle([...required, ...rest]).join('');
}
