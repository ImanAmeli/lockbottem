# Illustrator Box Dieline Generator

این ریپو یک اسکریپت ExtendScript برای Adobe Illustrator دارد که با آن می‌توانید دایلاین چند نوع جعبه بسازید.

## فایل اصلی

- `tuck-end-box-generator.jsx`

## قابلیت‌ها

- ساخت سه نوع جعبه:
  - Straight Tuck End (STE)
  - Reverse Tuck End (RTE)
  - Tuck Top + Lock Bottom (TTLB / لاک‌باتم)
- ورودی کامل ابعاد (میلی‌متر):
  - عرض پنل
  - عمق پنل
  - ارتفاع جعبه
  - عرض زبانه چسب
  - عمق فلاپ بالا
  - عمق فلاپ پایین / لاک‌باتم
- تنظیم نسبت‌های هندسی:
  - Dust Flap Ratio
  - Tuck Shoulder Ratio
  - Tuck Tongue Ratio
  - Lock Notch Ratio
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
