# Illustrator Carton Dieline Generator

این اسکریپت ExtendScript برای Adobe Illustrator یک ژنراتور دایلاین جعبه است که خروجی‌اش به ابزارهای آماده‌ی فروشگاهی نزدیک باشد؛ یعنی با ورودی ابعاد، سریع فایل برش/خط‌تا تحویل می‌دهد.

## فایل

- `tuck-end-box-generator.jsx`

## مدل‌های جعبه

- Straight Tuck End (STE)
- Reverse Tuck End (RTE)
- Tuck Top + Lock Bottom (TTLB / لاک‌باتم)

## پارامترهای قابل تنظیم (mm)

- Front Panel Width
- Side Panel Depth
- Body Height
- Glue Flap Width
- Top Flap Depth
- Bottom Flap/Lock Depth

### پارامترهای فرم

- Dust Ratio
- Tuck Shoulder
- Tuck Tongue
- Lock Notch (برای لاک‌باتم)

## ویژگی‌ها

- تولید لایه‌ی `Dieline - Cut` با خط قرمز
- تولید لایه‌ی `Dieline - Crease` با خط آبی خط‌چین
- گزینه‌ی پاک‌کردن خودکار محتوای لایه‌ها قبل از رسم مجدد
- چیدمان تمیزتر خطوط: خطوط fold دیگر به‌عنوان cut اشتباه رسم نمی‌شوند

## اجرا

1. در Illustrator برو به:
   - `File > Scripts > Other Script...`
2. فایل `tuck-end-box-generator.jsx` را انتخاب کن.
3. استایل جعبه و ابعاد را بده.
4. روی `Draw` بزن.

## نکته فنی

- تبدیل واحد داخلی از mm به pt انجام می‌شود.
- برای خروجی تولید، قبل از چاپ/دایکات حتما یک تست نمونه (mockup یا برش آزمایشی) بگیر تا با متریال واقعی نهایی شود.
