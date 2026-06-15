# 🏊 פארק המים יבנה — אתר רשמי

אתר רשמי של עמותת פארק המים יבנה — 30 דונם ירוקים של חוויה משפחתית.
פעילים מאז 1985 .

## 🌐 הצגה חיה

לאחר העלאה ל-GitHub Pages: `https://USERNAME.github.io/REPO/`

## 🏗️ מבנה הפרויקט

```
.
├── index.html                       # דף הבית
├── about.html                       # על הפארק, ועד, ועדות, בחירות
├── attractions.html                 # מתקנים
├── events.html                      # חוגים ואירועים
├── gallery.html                     # גלריית תמונות
├── contact.html                     # צור קשר
├── faq.html                         # שאלות נפוצות
├── event-summer-opening-2026.html   # דף אירוע: הפנינג קיץ 2026
├── accessibility.html               # הצהרת נגישות (תקן 5568)
├── privacy.html                     # מדיניות פרטיות
├── terms.html                       # תנאי שימוש
├── admin.html                       # פאנל ניהול (Firebase Auth)
│
├── styles.css                       # סטיילים ציבוריים
├── admin.css                        # סטיילים לפאנל
├── script.js                        # JavaScript ציבורי
├── public-data.js                   # טעינת תוכן דינמי מ-Firestore
├── admin.js                         # לוגיקת פאנל הניהול
├── firebase-config.js               # הגדרות Firebase
├── data-templates.js                # תכני seed ראשוניים
│
└── images/                          # תמונות וגרפיקה
    ├── new/                         # תמונות אתר עיקריות
    └── events/summer-opening-2026/  # תמונות + סרטונים מאירועים
```

## ⚡ הפעלה מקומית

```bash
python3 -m http.server 8765
```
פתח: http://localhost:8765/

## 🛠️ ניהול תוכן

הפאנל ב-`admin.html` מאפשר ניהול מלא דרך Firebase:
- 📰 לוח מודעות
- 🕐 שעות פעילות
- 🏃 חוגים ואירועים
- 👥 חברי ועד וועדות
- 🗳️ תוצאות בחירות
- 🖼️ גלריית תמונות
- 📞 פרטי קשר
- 📥 הודעות נכנסות מטופס "צור קשר"
- ⚡ תשובות מהירות
- ⚙️ הגדרות (כולל מנכ"ל/ית)

## ♿ נגישות

האתר נבנה בהתאם ל**תקן ישראלי ת"י 5568** ולקווי המנחה של **WCAG 2.1 ברמת AA**.

## 📜 משפטי

- [הצהרת נגישות](./accessibility.html)
- [מדיניות פרטיות](./privacy.html)
- [תנאי שימוש](./terms.html)
