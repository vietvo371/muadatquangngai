/**
 * Âm thanh thông báo ngắn (Notion 29/09 "Audio Notification", "Browser Autoplay Policy").
 *
 * Tự sinh bằng Web Audio, không tải file mp3 — nhẹ và không thêm tài nguyên phải lưu trữ.
 *
 * Trình duyệt chặn phát âm thanh cho tới khi người dùng có tương tác đầu tiên (click, gõ bàn
 * phím...). Hàm này luôn bọc try/catch và im lặng bỏ qua khi bị chặn: tuyệt đối không được để
 * lỗi âm thanh làm hỏng luồng thông báo.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext ??= new Ctor();
    return audioContext;
  } catch {
    return null;
  }
}

/** Hai nốt "ping" nhẹ, tổng khoảng 0,25 giây. */
export function playNotificationSound(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    // Chưa có tương tác của người dùng → trình duyệt để context ở trạng thái 'suspended'.
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
      if (ctx.state === 'suspended') return;
    }

    const now = ctx.currentTime;
    [
      { frequency: 880, at: 0 },
      { frequency: 1174, at: 0.12 },
    ].forEach(({ frequency, at }) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + at);
      gain.gain.linearRampToValueAtTime(0.09, now + at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.12);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(now + at);
      oscillator.stop(now + at + 0.13);
    });
  } catch {
    // Bị chặn hoặc không hỗ trợ — bỏ qua.
  }
}
