// ============================================
// Initial Data Templates - Pre-populates Firebase
// with the existing content from the site
// ============================================

export const initialData = {

    // ============================================
    // News (Notice Board)
    // ============================================
    news: [
        {
            title: 'לידיעת החברים',
            content: 'בהתאם להקלות בהנחיות פיקוד העורף, אנו נערכים לפתיחה מחודשת של חדר הכושר והבריכה המקורה מיום חמישי 5.3.26 החל מהשעה 12:00. בשלב זה הפעילות תתקיים ללא חוגים ומוגבל מגיל 18+. נבקש מכלל החברים להמשיך ולהישמע להנחיות פיקוד העורף ולהנחיות הצוות במקום. נעדכן בהמשך לגבי חזרה לפעילות מלאה.',
            date: '2026-03-05',
            type: 'urgent',
            order: 1
        },
        {
            title: 'תוצאות בחירות 2025',
            content: 'תוצאות הבחירות לועד העמותה - 5 חברים נבחרו מתוך 7 מועמדים. הקולות נבדקו ונספרו בפיקוחו של עו״ד אייל יפה ואושרו ע״י יו״ר ועדת הבחירות אורן כלפון.',
            date: '2025-09-29',
            type: 'info',
            order: 2
        },
        {
            title: 'פתיחת מתחם הבריכות החיצוניות',
            content: 'מתחם הבריכות החיצוניות סגור עד פתיחת העונה. לפיכך לא תתאפשר כניסה לחיצונים, נכדים, חתן/כלה. צפי פתיחת העונה - אמצע מאי.',
            date: '2026-05-01',
            type: 'event',
            order: 3
        }
    ],

    // ============================================
    // Hours (Summer 2026)
    // ============================================
    hours: {
        period: {
            start: '29.5.2026',
            end: '18.6.2026',
            label: 'שעות פתיחה - קיץ 2026'
        },
        facilities: {
            office: {
                name: 'משרד',
                icon: 'building',
                order: 1,
                schedule: {
                    0: { open: '14:00', close: '18:45' },
                    1: { open: '08:00', close: '18:45' },
                    2: { open: '08:00', close: '18:45' },
                    3: { open: '08:00', close: '18:45' },
                    4: { open: '08:00', close: '18:45' },
                    5: { open: '09:00', close: '13:00' },
                    6: { open: '09:00', close: '14:00' }
                }
            },
            amorphic: {
                name: 'בריכה אמורפית',
                icon: 'swimming-pool',
                order: 2,
                schedule: {
                    0: { open: '14:00', close: '19:00' },
                    1: { open: '12:00', close: '19:00' },
                    2: { open: '12:00', close: '19:00' },
                    3: { open: '12:00', close: '19:00' },
                    4: { open: '12:00', close: '19:00' },
                    5: { open: '10:00', close: '17:45' },
                    6: { open: '09:00', close: '17:45' }
                }
            },
            toddler: {
                name: 'בריכת פעוטות',
                icon: 'baby',
                order: 3,
                schedule: {
                    0: { open: '14:00', close: '19:00' },
                    1: { open: '12:00', close: '19:00' },
                    2: { open: '12:00', close: '19:00' },
                    3: { open: '12:00', close: '19:00' },
                    4: { open: '12:00', close: '19:00' },
                    5: { open: '10:00', close: '17:45' },
                    6: { open: '09:00', close: '17:45' }
                }
            },
            slides: {
                name: 'מגלשות מים',
                icon: 'water',
                order: 4,
                schedule: {
                    5: { open: '12:00', close: '16:45' },
                    6: { open: '10:00', close: '16:45' }
                }
            },
            indoor: {
                name: 'בריכה מקורה',
                icon: 'swimming-pool',
                order: 5,
                yearRound: true,
                schedule: {
                    0: { open: '05:30', close: '09:00', open2: '14:00', close2: '22:30' },
                    1: { open: '05:30', close: '22:30' },
                    2: { open: '05:30', close: '22:30' },
                    3: { open: '05:30', close: '22:30' },
                    4: { open: '05:30', close: '22:30' },
                    5: { open: '05:30', close: '19:00' },
                    6: { open: '07:30', close: '19:00' }
                }
            },
            gym: {
                name: 'חדר כושר',
                icon: 'dumbbell',
                order: 6,
                yearRound: true,
                schedule: {
                    0: { open: '05:30', close: '09:00', open2: '14:00', close2: '22:30' },
                    1: { open: '05:30', close: '22:30' },
                    2: { open: '05:30', close: '22:30' },
                    3: { open: '05:30', close: '22:30' },
                    4: { open: '05:30', close: '22:30' },
                    5: { open: '05:30', close: '19:00' },
                    6: { open: '07:30', close: '19:00' }
                }
            }
        }
    },

    // ============================================
    // Contact Info
    // ============================================
    contact: {
        phone: '08-9431524',
        phone2: '08-9431525',
        fax: '08-9334290',
        address: 'שדרות דואני, יבנה',
        addressFull: 'שדרות דואני, יבנה. ת.ד 2000, יבנה 81550',
        email1: 'mazkirot@parkhamaim.co.il',
        email2: 'hanhala@parkhamaim.co.il',
        social: {
            facebook: '',
            instagram: '',
            youtube: '',
            whatsapp: 'https://wa.me/972089431524'
        }
    },

    // ============================================
    // Management (CEO/professional leadership)
    // ============================================
    management: {
        ceoName: 'לימור קרסנובסקי',
        ceoTitle: 'מנכ״לית הפארק',
        ceoDescription: 'ניהול שוטף של כל פעילות הפארק - מתקנים, חוגים, עובדים, אירועים וקשר עם החברים'
    },

    // ============================================
    // Board Members (11 members as of 1.10.2025)
    // ============================================
    board: {
        date: '01.10.2025',
        members: [
            { name: 'דוד אנגל', role: 'יו״ר הוועד', isChairman: true, order: 1 },
            { name: 'יוסי אטיאס', role: 'חבר ועד', order: 2 },
            { name: 'חלמיש רונן', role: 'חבר ועד', order: 3 },
            { name: 'שאול דוד', role: 'חבר ועד', order: 4 },
            { name: 'עוזר גלית', role: 'חברת ועד', order: 5 },
            { name: 'יוסי כהן', role: 'חבר ועד', order: 6 },
            { name: 'אורן כלפון', role: 'חבר ועד', order: 7 },
            { name: 'מוטי פיבלוביץ', role: 'חבר ועד', order: 8 },
            { name: 'דני טאובה', role: 'חבר ועד', order: 9 },
            { name: 'שמשון יחיעם', role: 'חבר ועד', order: 10 },
            { name: 'איתמר שיינמן', role: 'חבר ועד', order: 11 }
        ]
    },

    // ============================================
    // Committees
    // ============================================
    committees: [
        {
            name: 'ועדת כספים',
            icon: 'coins',
            chair: 'אורן כלפון',
            members: ['שאול דוד', 'דוד אנגל'],
            order: 1
        },
        {
            name: 'ועדת תפעול',
            icon: 'cogs',
            chair: 'איתמר שיינמן',
            members: ['שמשון יחיעם', 'יוסי אטיאס'],
            order: 2
        },
        {
            name: 'ועדת תן-קמח',
            subtitle: 'תקנון, קבלה, משמעת, חריגים',
            icon: 'balance-scale',
            chair: 'דני טאובה',
            members: ['אורן כלפון', 'מוטי פיבלוביץ'],
            order: 3
        },
        {
            name: 'ועדת תרבות וחוגים',
            icon: 'theater-masks',
            chair: 'איתמר שיינמן',
            members: ['שאול דוד', 'שמשון יחיעם', 'יוסי כהן'],
            order: 4
        },
        {
            name: 'ועדת ביקורת',
            icon: 'clipboard-check',
            chair: 'יואב בראל',
            members: ['איתן רז', 'משה שפירא'],
            order: 5
        },
        {
            name: 'ועדת בוררות',
            icon: 'gavel',
            chair: 'שמואל פז',
            members: ['אלי קידר', 'איתן דוידוב', 'גידי אלון', 'יורם הקר'],
            order: 6
        }
    ],

    // ============================================
    // Classes (55 total across the week)
    // day: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // ============================================
    classes: [
        // Sunday
        { day: 0, time: { start: '07:45', end: '08:30' }, name: 'יציבה ומתיחות', instructor: 'חיה', category: 'yoga', icon: 'child-reaching', price: 'לחברי עמותה בלבד' },
        { day: 0, time: { start: '18:00', end: '19:00' }, name: 'זומבה', instructor: 'ליאורה', category: 'dance', icon: 'music', price: '220 ₪' },
        { day: 0, time: { start: '18:00', end: '19:00' }, name: 'דיאט דאנס', instructor: 'רחל', category: 'dance', icon: 'record-vinyl', price: '220 ₪' },
        { day: 0, time: { start: '19:00', end: '19:45' }, name: 'התעמלות מים', instructor: 'רחל', category: 'water', icon: 'water', price: '200/300/400 ₪' },
        { day: 0, time: { start: '19:00', end: '20:00' }, name: 'אירובי ועיצוב', instructor: 'שרי', category: 'fitness', icon: 'person-running', price: '220 ₪' },
        { day: 0, time: { start: '19:00', end: '23:00' }, name: 'ריקודי עם', instructor: 'איציק בן דהן', category: 'folk', icon: 'guitar', price: '25/35 ₪' },
        { day: 0, time: { start: '20:00', end: '21:00' }, name: 'פילאטיס', instructor: 'דליה', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 0, time: { start: '21:00', end: '21:45' }, name: 'פונקציונלי', instructor: 'אבי נחמן', category: 'fitness', icon: 'dumbbell', price: '180 ₪' },

        // Monday
        { day: 1, time: { start: '07:00', end: '08:20' }, name: 'יוגה', instructor: 'מילנה', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 1, time: { start: '07:45', end: '08:30' }, name: 'התעמלות מים', instructor: 'ריטה', category: 'water', icon: 'water', price: '200/300/400 ₪' },
        { day: 1, time: { start: '08:30', end: '09:15' }, name: 'התעמלות מים', instructor: 'ריטה', category: 'water', icon: 'water', price: '200/300/400 ₪' },
        { day: 1, time: { start: '08:30', end: '09:30' }, name: 'התעמלות בונה עצם', instructor: 'שרי', category: 'fitness', icon: 'bone', price: '220 ₪' },
        { day: 1, time: { start: '08:45', end: '09:45' }, name: 'פלדנקרייז', instructor: 'גילה', category: 'yoga', icon: 'yin-yang', price: '160/205 ₪' },
        { day: 1, time: { start: '09:30', end: '10:30' }, name: 'התעמלות בונה עצם', instructor: 'יפית', category: 'fitness', icon: 'bone', price: '220 ₪' },
        { day: 1, time: { start: '10:30', end: '11:30' }, name: 'פילאטיס', instructor: 'דליה', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 1, time: { start: '18:00', end: '19:00' }, name: 'פילאטיס', instructor: 'רינת שדה', category: 'yoga', icon: 'spa', price: 'לחברי עמותה בלבד' },
        { day: 1, time: { start: '18:45', end: '19:45' }, name: 'פלדנקרייז', instructor: 'רינה', category: 'yoga', icon: 'yin-yang', price: '250 ₪' },
        { day: 1, time: { start: '19:00', end: '20:00' }, name: 'התעמלות בריאותית', instructor: 'מיכל רימון', category: 'fitness', icon: 'heart-pulse', price: '220 ₪' },
        { day: 1, time: { start: '19:00', end: '20:00' }, name: 'פילאטיס', instructor: 'יפית', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 1, time: { start: '20:00', end: '21:00' }, name: 'התעמלות גברים', instructor: '—', category: 'fitness', icon: 'dumbbell', price: '220 ₪' },

        // Tuesday
        { day: 2, time: { start: '07:00', end: '08:30' }, name: 'יוגה', instructor: 'חני', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 2, time: { start: '07:30', end: '08:30' }, name: 'אימון מחזורי בחדר כושר', instructor: '—', category: 'fitness', icon: 'dumbbell', price: 'לחברי עמותה בלבד' },
        { day: 2, time: { start: '07:45', end: '08:30' }, name: 'התעמלות מים', instructor: 'ריימה', category: 'water', icon: 'water', price: '200/300/400 ₪' },
        { day: 2, time: { start: '08:00', end: '09:00' }, name: 'פלדנקרייז', instructor: 'גילה', category: 'yoga', icon: 'yin-yang', price: '160/250 ₪' },
        { day: 2, time: { start: '08:30', end: '09:30' }, name: 'פילאטיס', instructor: 'יפית', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 2, time: { start: '08:30', end: '09:30' }, name: 'צ\'י קונג', instructor: 'יואב', category: 'yoga', icon: 'yin-yang', price: '160 ₪' },
        { day: 2, time: { start: '08:35', end: '09:30' }, name: 'התעמלות מים', instructor: 'רימה', category: 'water', icon: 'water', price: '200/300/400 ₪' },
        { day: 2, time: { start: '09:30', end: '10:30' }, name: 'פילאטיס', instructor: 'יפית', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 2, time: { start: '18:00', end: '19:00' }, name: 'עיצוב ויציבה', instructor: 'קרן', category: 'yoga', icon: 'child-reaching', price: 'לחברי עמותה בלבד' },
        { day: 2, time: { start: '19:00', end: '23:00' }, name: 'ריקודי עם', instructor: '—', category: 'folk', icon: 'guitar', price: '25/35 ₪' },

        // Wednesday
        { day: 3, time: { start: '08:15', end: '09:15' }, name: 'התעמלות בונה עצם', instructor: 'שרי', category: 'fitness', icon: 'bone', price: '220 ₪' },
        { day: 3, time: { start: '09:30', end: '10:30' }, name: 'התעמלות בונה עצם', instructor: 'יפית', category: 'fitness', icon: 'bone', price: '220 ₪' },
        { day: 3, time: { start: '10:30', end: '11:30' }, name: 'פילאטיס', instructor: 'דליה', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 3, time: { start: '18:00', end: '19:00' }, name: 'זומבה', instructor: 'ליאורה', category: 'dance', icon: 'music', price: '220 ₪' },
        { day: 3, time: { start: '19:00', end: '20:00' }, name: 'פילאטיס', instructor: 'יפית', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 3, time: { start: '19:00', end: '20:00' }, name: 'אירובי ועיצוב', instructor: 'שרי', category: 'fitness', icon: 'person-running', price: '220 ₪' },
        { day: 3, time: { start: '19:15', end: '20:45' }, name: 'יוגה', instructor: 'לאה', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 3, time: { start: '20:00', end: '21:00' }, name: 'פילאטיס', instructor: 'דליה', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 3, time: { start: '20:00', end: '21:00' }, name: 'התעמלות גברים', instructor: 'אבי נחמן', category: 'fitness', icon: 'dumbbell', price: '220 ₪' },

        // Thursday
        { day: 4, time: { start: '07:00', end: '08:30' }, name: 'יוגה', instructor: 'חני / רוני', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 4, time: { start: '07:45', end: '08:30' }, name: 'התעמלות מים', instructor: 'ריטה', category: 'water', icon: 'water', price: '200/300/400 ₪' },
        { day: 4, time: { start: '08:00', end: '09:00' }, name: 'פלדנקרייז', instructor: 'גילה', category: 'yoga', icon: 'yin-yang', price: '160/250 ₪' },
        { day: 4, time: { start: '08:30', end: '09:15' }, name: 'התעמלות מים', instructor: 'ריטה', category: 'water', icon: 'water', price: '200/300/400 ₪' },
        { day: 4, time: { start: '08:30', end: '09:30' }, name: 'פילאטיס', instructor: 'יפית', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 4, time: { start: '09:30', end: '10:30' }, name: 'פילאטיס', instructor: 'יפית', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 4, time: { start: '18:00', end: '19:00' }, name: 'דיאט דאנס', instructor: 'רחל', category: 'dance', icon: 'record-vinyl', price: '220 ₪' },
        { day: 4, time: { start: '19:00', end: '20:00' }, name: 'התעמלות בריאותית', instructor: 'מיכל רימון / רינת שדה', category: 'fitness', icon: 'heart-pulse', price: '220 ₪' },

        // Friday
        { day: 5, time: { start: '07:30', end: '09:00' }, name: 'יוגה', instructor: 'יעל', category: 'yoga', icon: 'spa', price: '220 ₪' },
        { day: 5, time: { start: '08:00', end: '09:00' }, name: 'פילאטיס גברים', instructor: 'חיה', category: 'yoga', icon: 'spa', price: '150 ₪' },
        { day: 5, time: { start: '11:00', end: '12:00' }, name: 'טאי צ\'י', instructor: 'תמר', category: 'yoga', icon: 'yin-yang', price: 'לחברי עמותה בלבד' },
        { day: 5, time: { start: '12:00', end: '13:00' }, name: 'תנועה ויציבה', instructor: '—', category: 'yoga', icon: 'child-reaching', price: 'לחברי עמותה בלבד' },
        { day: 5, time: { start: '13:00', end: '14:00' }, name: 'מתיחות', instructor: '—', category: 'yoga', icon: 'child-reaching', price: 'לחברי עמותה בלבד' },

        // Saturday
        { day: 6, time: { start: '09:30', end: '10:30' }, name: 'אירובי', instructor: 'סבב מדריכים', category: 'fitness', icon: 'person-running', price: 'לחברי עמותה בלבד' },
        { day: 6, time: { start: '10:30', end: '11:30' }, name: 'מתיחות', instructor: 'סבב מדריכים', category: 'yoga', icon: 'child-reaching', price: 'לחברי עמותה בלבד' },
        { day: 6, time: { start: '11:30', end: '12:30' }, name: 'זומבה', instructor: 'סבב מדריכים', category: 'dance', icon: 'music', price: 'לחברי עמותה בלבד' }
    ],

    // ============================================
    // Elections (4 years: 2022-2025)
    // ============================================
    elections: [
        {
            year: 2025,
            date: '29.09',
            title: 'בחירות לוועד העמותה - ספטמבר 2025',
            note: 'הקולות נבדקו ונספרו בפיקוחו של עו״ד אייל יפה ואושרו ע״י יו״ר ועדת הבחירות אורן כלפון',
            badge: 'חמשת הראשונים נבחרו',
            candidates: [
                { name: 'אטיאס יוסי', votes: 176, elected: true },
                { name: 'חלמיש רונן', votes: 176, elected: true },
                { name: 'עוזר גלית', votes: 168, elected: true },
                { name: 'טאובה דני', votes: 164, elected: true },
                { name: 'פיבלוביץ מוטי', votes: 156, elected: true },
                { name: 'טובול דוד', votes: 60, elected: false },
                { name: 'טל ניר', votes: 49, elected: false }
            ]
        },
        {
            year: 2024,
            date: '17.11',
            title: 'בחירות לוועד העמותה - אסיפה כללית מיום 17.11.24',
            note: 'הקולות נבדקו ונספרו בפיקוחו של עו״ד אייל יפה ואושרו ע״י יו״ר ועדת הבחירות יואב בראל',
            badge: 'חמשת הראשונים נבחרו',
            candidates: [
                { name: 'אנגל דוד', votes: 368, elected: true },
                { name: 'כהן יוסי', votes: 328, elected: true },
                { name: 'שיינמן איתמר', votes: 324, elected: true },
                { name: 'כלפון אורן', votes: 320, elected: true },
                { name: 'יחיעם שמשון', votes: 309, elected: true },
                { name: 'טובול דוד', votes: 161, elected: false },
                { name: 'הרוש רוני', votes: 146, elected: false },
                { name: 'גוהרי מורן', votes: 142, elected: false },
                { name: 'טל ניר', votes: 136, elected: false },
                { name: 'רוקיטה תומר', votes: 135, elected: false },
                { name: 'כהן אנדרה', votes: 6, elected: false }
            ]
        },
        {
            year: 2023,
            date: 'ארכיון',
            title: 'בחירות לוועד העמותה - 2023',
            note: 'הקולות נבדקו ונספרו בפיקוחו של עו״ד אייל יפה ואושרו ע״י יו״ר ועדת הבחירות אורן כלפון',
            candidates: [
                { name: 'אטיאס יוסף', votes: 160, elected: true },
                { name: 'בר-און דוד', votes: 155, elected: true },
                { name: 'כהן קורבלניק רות', votes: 155, elected: true },
                { name: 'טאובה דני', votes: 152, elected: true },
                { name: 'פיבלוביץ מוטי', votes: 129, elected: true },
                { name: 'מיארה תמר', votes: 0, elected: false }
            ]
        },
        {
            year: 2022,
            date: 'ארכיון',
            title: 'בחירות לוועד העמותה - 2022',
            note: '103 חברים הצביעו. יו״ר ועדת הבחירות: מוטי פיבלוביץ',
            candidates: [
                { name: 'איתמר שני-שינמן', votes: 92, elected: true },
                { name: 'יוסי כהן', votes: 91, elected: true },
                { name: 'אבן-צור דן', votes: 84, elected: true },
                { name: 'ירון מירון', votes: 82, elected: true }
            ]
        }
    ],

    // ============================================
    // Gallery (38 existing images from gallery.html)
    // Categories: aerial, slides, pools, kids, gym, spa, facilities
    // ============================================
    gallery: [
        { category: 'aerial', url: 'images/new/aerial-park-wide.jpg', caption: 'מבט אווירי פנורמי', subtitle: '30 דונם של פארק', order: 1, isLocal: true },
        { category: 'aerial', url: 'images/new/aerial-park-yavne-city.jpg', caption: 'הפארק והעיר יבנה', subtitle: 'לב יבנה הירוק', order: 2, isLocal: true },
        { category: 'aerial', url: 'images/new/aerial-park-attractions.jpg', caption: 'כל האטרקציות מהאוויר', subtitle: 'בריכות, מגלשות, מתקנים', order: 3, isLocal: true },
        { category: 'aerial', url: 'images/new/aerial-park-buildings.jpg', caption: 'המבנים והבריכה', subtitle: 'מבנה הכושר ובריכת השחייה', order: 4, isLocal: true },
        { category: 'aerial', url: 'images/new/aerial-park-city.jpg', caption: 'הפארק בלב העיר', subtitle: 'מבט פנורמי רחב', order: 5, isLocal: true },
        { category: 'aerial', url: 'images/new/aerial-park-main.jpg', caption: 'בריכה ומדשאות', subtitle: '30 דונם של ירוק', order: 6, isLocal: true },
        { category: 'aerial', url: 'images/new/aerial-pool-grass.jpg', caption: 'בריכה ודשא ירוק', subtitle: 'הטבע פוגש את המים', order: 7, isLocal: true },
        { category: 'aerial', url: 'images/new/aerial-umbrellas-grass.jpg', caption: 'ים של שמשיות', subtitle: 'מאות שמשיות מהאוויר', order: 8, isLocal: true },
        { category: 'slides', url: 'images/new/water-slides-colorful.jpg', caption: '4 מגלשות צבעוניות', subtitle: 'גובה 15 מטר', order: 9, isLocal: true },
        { category: 'slides', url: 'images/new/water-slides-colorful-2.jpg', caption: 'קשת המגלשות', subtitle: 'חוויית אדרנלין', order: 10, isLocal: true },
        { category: 'slides', url: 'images/new/aerial-slides-spiral.jpg', caption: 'מגלשות ספירליות', subtitle: 'מבט אווירי', order: 11, isLocal: true },
        { category: 'slides', url: 'images/new/aerial-slides-top.jpg', caption: 'מבט עליון על המגלשות', subtitle: 'זווית עליונה', order: 12, isLocal: true },
        { category: 'slides', url: 'images/new/aerial-slides-view.jpg', caption: 'מתחם המגלשות', subtitle: 'פנים מבט מלמעלה', order: 13, isLocal: true },
        { category: 'slides', url: 'images/new/aerial-slides-park.jpg', caption: 'המגלשות והפארק', subtitle: 'מבט פנורמי', order: 14, isLocal: true },
        { category: 'pools', url: 'images/new/indoor-pool-olympic.jpg', caption: 'בריכה מקורה אולימפית', subtitle: '450 מ״ר • מחוממת', order: 15, isLocal: true },
        { category: 'pools', url: 'images/new/indoor-pool-side.jpg', caption: 'בריכה אולימפית מבט צד', subtitle: '6 מסלולים מסומנים', order: 16, isLocal: true },
        { category: 'pools', url: 'images/new/pool-outdoor-large.jpg', caption: 'בריכה אמורפית חיצונית', subtitle: '750 מ״ר • חופות לבנות', order: 17, isLocal: true },
        { category: 'pools', url: 'images/new/pool-waterfall.jpg', caption: 'בריכת מפלים', subtitle: 'מפל מים אמיתי', order: 18, isLocal: true },
        { category: 'pools', url: 'images/new/pool-top-view.jpg', caption: 'בריכה - מבט עליון', subtitle: 'צורה אמורפית מהאוויר', order: 19, isLocal: true },
        { category: 'pools', url: 'images/new/pool-top-view-2.jpg', caption: 'בריכה - זווית נוספת', subtitle: 'מבט עליון נוסף', order: 20, isLocal: true },
        { category: 'kids', url: 'images/new/pool-kids-flamingo.jpg', caption: 'בריכת ילדים פנימית', subtitle: 'עם פסל פלמינגו', order: 21, isLocal: true },
        { category: 'kids', url: 'images/new/pool-kids-animals.jpg', caption: 'בריכת פעוטות', subtitle: 'פלמינגו, פיל והיפו', order: 22, isLocal: true },
        { category: 'kids', url: 'images/new/pool-kids-playground.jpg', caption: 'בריכה עם מגרש משחקים', subtitle: 'פעילות משולבת', order: 23, isLocal: true },
        { category: 'kids', url: 'images/new/water-playground-closeup.jpg', caption: 'מתחם משחקי מים', subtitle: 'מגלשות וזרנוקים צבעוניים', order: 24, isLocal: true },
        { category: 'kids', url: 'images/new/kids-slide-tower.jpg', caption: 'מגדל מגלשות לילדים', subtitle: 'מגלשות מהירות ובטיחותיות', order: 25, isLocal: true },
        { category: 'kids', url: 'images/new/kids-slide-tower-2.jpg', caption: 'מתקן משחקים גדול', subtitle: 'מגלשות, סולמות, זרנוקים', order: 26, isLocal: true },
        { category: 'kids', url: 'images/new/pool-kids-wide.jpg', caption: 'בריכת פעוטות חיצונית', subtitle: 'מבט רחב על המתחם', order: 27, isLocal: true },
        { category: 'gym', url: 'images/new/gym-modern.png', caption: 'חדר כושר חדש - אזור קרדיו', subtitle: 'הליכונים מתקדמים', order: 28, isLocal: true },
        { category: 'gym', url: 'images/new/gym-strength.png', caption: 'אזור משקלות חופשיים', subtitle: 'ציוד Precor מתקדם', order: 29, isLocal: true },
        { category: 'spa', url: 'images/new/spa-jacuzzi-double.jpg', caption: 'שני ג\'קוזים מפוארים', subtitle: 'מתחם הספא', order: 30, isLocal: true },
        { category: 'spa', url: 'images/new/spa-jacuzzi-closeup.jpg', caption: 'ג\'קוזי בועות', subtitle: 'חוויית פינוק', order: 31, isLocal: true },
        { category: 'spa', url: 'images/new/spa-jacuzzi-with-pool.jpg', caption: 'ג\'קוזי ליד הבריכה', subtitle: 'עם נוף לבריכה האולימפית', order: 32, isLocal: true },
        { category: 'spa', url: 'images/new/jacuzzi-with-indoor-pool.jpg', caption: 'ג\'קוזי במתחם המקורה', subtitle: 'פינוק לאחר השחייה', order: 33, isLocal: true },
        { category: 'spa', url: 'images/new/lounge-area.jpg', caption: 'אזור מנוחה יוקרתי', subtitle: 'כריות שעועית תחת חופה', order: 34, isLocal: true },
        { category: 'facilities', url: 'images/new/cafe-icecream.png', caption: 'קפיטריה', subtitle: 'גלידות, ממתקים ומשקאות', order: 35, isLocal: true },
        { category: 'facilities', url: 'images/new/cafe-seating.jpg', caption: 'אזור ישיבה בקפיטריה', subtitle: 'עם נוף לבריכה', order: 36, isLocal: true },
        { category: 'facilities', url: 'images/new/sports-court.png', caption: 'מגרש כדורסל וקט-רגל', subtitle: 'מגרש משולב לפעילות חופשית', order: 37, isLocal: true },
        { category: 'facilities', url: 'images/new/padel-courts.jpg', caption: 'מתחם פאדל', subtitle: '4 מגרשי פאדל מקצועיים', order: 38, isLocal: true }
    ],

    // ============================================
    // Settings
    // ============================================
    settings: {
        siteTitle: 'פארק המים יבנה',
        siteTitleEn: 'Yavne Water Park',
        siteSubtitle: '30 דונם ירוקים של חוויה משפחתית',
        established: 1985,
        memberFamilies: 1300
    }
};
