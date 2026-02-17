# Illustrator Tuck-End Box Generator

این ریپو یک اسکریپت ExtendScript برای Adobe Illustrator دارد که با آن می‌توانید دایلاین جعبه‌های Tuck-End بسازید.

## فایل اصلی

- `tuck-end-box-generator.jsx`

## قابلیت‌ها

- ساخت دو نوع جعبه:
  - Straight Tuck End (STE)
  - Reverse Tuck End (RTE)
- ورودی کامل ابعاد (میلی‌متر):
  - عرض پنل
  - عمق پنل
  - ارتفاع جعبه
  - عرض زبانه چسب
  - عمق فلاپ بالا و پایین
- تنظیم نسبت فلاپ گرد و خاک‌گیر و فرم زبانه تاک
- ساخت خودکار لایه‌های:
  - `Dieline - Cut`
  - `Dieline - Crease`

## روش استفاده در Illustrator

1. فایل `tuck-end-box-generator.jsx` را در Illustrator اجرا کنید:
   - `File > Scripts > Other Script...`
2. در پنجره بازشده، نوع جعبه و ابعاد را وارد کنید.
3. روی `Draw` بزنید.
4. دایلاین روی آرت‌بورد رسم می‌شود.

## نکته

- همه‌ی ورودی‌ها بر حسب میلی‌متر هستند.
- خطوط `Cut` با رنگ قرمز و `Crease` با رنگ آبی و خط‌چین رسم می‌شوند.
