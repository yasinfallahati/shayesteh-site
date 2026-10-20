// Vercel serverless function: forwards Postino lead requests to Telegram.
// Env vars: POSTINO_TELEGRAM_BOT_TOKEN, POSTINO_TELEGRAM_CHAT_ID
const fa = s => String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const clip = (s, n) => String(s || '').trim().slice(0, n);
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.status(200).json({ ok: true }); // honeypot
  const d = {
    name: clip(b.name, 80), biz: clip(b.biz, 100), page: clip(b.page, 60),
    phone: fa(clip(b.phone, 20)).replace(/[\s-]/g, ''), time: clip(b.time, 20), note: clip(b.note, 1000)
  };
  if (!d.name || !d.biz || !d.page) return res.status(400).json({ ok: false, error: 'لطفاً فیلدهای الزامی را پر کنید.' });
  if (!/^(\+98|0098|0)?9\d{9}$/.test(d.phone)) return res.status(400).json({ ok: false, error: 'شماره موبایل معتبر نیست.' });
  const token = process.env.POSTINO_TELEGRAM_BOT_TOKEN, chat = process.env.POSTINO_TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(500).json({ ok: false, error: 'سرور تنظیم نشده است.' });
  const when = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
  const text = `📩 <b>درخواست جدید پستینو</b>\n\n👤 نام: ${esc(d.name)}\n🏪 کسب‌وکار: ${esc(d.biz)}\n📷 پیج: ${esc(d.page)}\n📞 موبایل: ${esc(d.phone)}\n⏰ زمان تماس: ${esc(d.time || '-')}\n📝 توضیحات: ${esc(d.note || '-')}\n\n🕒 ${when}`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' })
    });
    if (!r.ok) throw new Error('tg ' + r.status);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'ارسال ناموفق بود؛ لطفاً دوباره تلاش کنید.' });
  }
};
