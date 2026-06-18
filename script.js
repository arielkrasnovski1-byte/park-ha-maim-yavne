// ============================================
// פארק המים יבנה - JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function () {

    // --- Mobile Navigation Toggle ---
    const mobileToggle = document.getElementById('mobileToggle');
    const nav = document.getElementById('nav');

    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
    }

    // --- Header Scroll Effect ---
    const header = document.getElementById('header');

    if (header) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 30) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId.length < 2) return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerHeight = header ? header.offsetHeight : 80;
                const targetPosition = target.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Scroll to Top Button ---
    const scrollTopBtn = document.getElementById('scrollTop');

    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- Hero Slider ---
    const heroSlides = document.querySelectorAll('.hero-slide');
    let currentSlide = 0;

    if (heroSlides.length > 1) {
        setInterval(() => {
            heroSlides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % heroSlides.length;
            heroSlides[currentSlide].classList.add('active');
        }, 6000);
    }

    // --- Animated Counter ---
    const counters = document.querySelectorAll('.stat-number');
    let countersAnimated = false;

    function animateCounters() {
        if (countersAnimated || counters.length === 0) return;

        const statsSection = counters[0].closest('.stats-bar') || counters[0].closest('.stats-grid');
        if (!statsSection) return;

        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            countersAnimated = true;

            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const duration = 2000;
                const start = performance.now();
                const isPercent = counter.parentElement.querySelector('.stat-label')?.textContent.includes('%');

                function updateCounter(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    const current = Math.floor(target * easeOut);

                    counter.textContent = current.toLocaleString();

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target.toLocaleString();
                    }
                }

                requestAnimationFrame(updateCounter);
            });
        }
    }

    window.addEventListener('scroll', animateCounters);
    animateCounters();

    // --- Intersection Observer for Scroll Animations ---
    const observerOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(
        '.attraction-modern, .testimonial-card, .contact-block, .strip-item, .feature-row, .hours-day, .price-row, .info-card, .faq-item'
    );

    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = `opacity 0.6s var(--ease) ${index * 0.05}s, transform 0.6s var(--ease) ${index * 0.05}s`;
        observer.observe(el);
    });

    // --- Language Switcher ---
    const langButtons = document.querySelectorAll('.lang-btn');
    const body = document.body;
    const html = document.documentElement;

    // Load saved language
    const savedLang = localStorage.getItem('parkLang') || 'he';
    setLanguage(savedLang);

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
            localStorage.setItem('parkLang', lang);
        });
    });

    function setLanguage(lang) {
        langButtons.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-lang') === lang);
        });

        // Update all elements with data-he / data-en
        // Use innerHTML so embedded tags (e.g. <br>) render correctly. Data is hardcoded by us so XSS-safe.
        document.querySelectorAll('[data-he][data-en]').forEach(el => {
            const text = el.getAttribute('data-' + lang);
            if (text !== null) {
                if (text.includes('<br>') || text.includes('<strong>') || text.includes('<i ')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            }
        });

        // Set direction
        if (lang === 'en') {
            html.setAttribute('lang', 'en');
            html.setAttribute('dir', 'ltr');
            body.classList.add('lang-en');
        } else {
            html.setAttribute('lang', 'he');
            html.setAttribute('dir', 'rtl');
            body.classList.remove('lang-en');
        }

        // Update form placeholders
        document.querySelectorAll('input[data-placeholder-he], textarea[data-placeholder-he], select[data-placeholder-he]').forEach(input => {
            const placeholder = input.getAttribute('data-placeholder-' + lang);
            if (placeholder) input.setAttribute('placeholder', placeholder);
        });

        // Update select options
        document.querySelectorAll('option[data-he][data-en]').forEach(opt => {
            const text = opt.getAttribute('data-' + lang);
            if (text !== null) opt.textContent = text;
        });
    }

    // --- Contact Form ---
    // The contact form is fully handled by initContactForm() in public-data.js
    // (real validation + write to Firestore). Do NOT add a handler here — a
    // second submit listener would fire alongside it and show a fake "sent"
    // message even when validation fails or the write never happens.

    // --- FAQ Accordion ---
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            });
        }
    });

    // --- Gallery Lightbox (basic) ---
    document.querySelectorAll('.gallery-pro-item').forEach(item => {
        item.addEventListener('click', function () {
            const img = this.querySelector('img');
            if (img) openLightbox(img.src, img.alt);
        });
    });

    function openLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <button class="lightbox-close">&times;</button>
            <img src="${src}" alt="${alt}">
        `;
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => lightbox.classList.add('active'));

        const close = () => {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightbox.remove();
                document.body.style.overflow = '';
            }, 300);
        };

        lightbox.querySelector('.lightbox-close').addEventListener('click', close);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) close();
        });
        document.addEventListener('keydown', function escClose(e) {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escClose);
            }
        });
    }

    // --- Notification System ---
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const icon = type === 'success' ? 'check-circle' : 'info-circle';

        const notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" aria-label="Close"><i class="fas fa-times"></i></button>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // --- Add Dynamic Styles ---
    const dynamicStyles = document.createElement('style');
    dynamicStyles.textContent = `
        .notification {
            position: fixed;
            top: 30px;
            left: 30px;
            background: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 420px;
            transform: translateX(-130%);
            transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            z-index: 10000;
            border-right: 4px solid #0284c7;
        }
        .notification.show { transform: translateX(0); }
        .notification-success { border-right-color: #16a34a; }
        .notification i:first-child { font-size: 22px; color: #0284c7; flex-shrink: 0; }
        .notification-success i:first-child { color: #16a34a; }
        .notification span { flex: 1; color: #0f172a; font-weight: 500; font-size: 15px; }
        .notification-close { color: #64748b; padding: 4px; transition: color 0.2s; }
        .notification-close:hover { color: #0f172a; }

        .lang-en .notification {
            left: auto;
            right: 30px;
            border-right: none;
            border-left: 4px solid #0284c7;
            transform: translateX(130%);
        }
        .lang-en .notification.show { transform: translateX(0); }
        .lang-en .notification-success { border-left-color: #16a34a; }

        .lightbox {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            padding: 40px;
        }
        .lightbox.active { opacity: 1; }
        .lightbox img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        }
        .lightbox-close {
            position: absolute;
            top: 24px;
            right: 24px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 28px;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        }
        .lightbox-close:hover {
            background: rgba(255,255,255,0.2);
            transform: rotate(90deg);
        }

        @media (max-width: 480px) {
            .notification {
                left: 16px;
                right: 16px;
                max-width: none;
            }
            .lang-en .notification {
                left: 16px;
                right: 16px;
            }
        }
    `;
    document.head.appendChild(dynamicStyles);


    // ============================================
    // Accessibility Widget (Israeli Standard 5568)
    // ============================================
    initAccessibility();

    // ============================================
    // Live Facility Status (Summer 2026)
    // ============================================
    initFacilityStatus();
});

function initFacilityStatus() {
    const facilitiesContainer = document.getElementById('facilitiesStatus');
    if (!facilitiesContainer) return;

    // Schedule: order matches summer hours table — seasonal first, year-round last
    // Day index: 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
    // Split-day support: a day can have open2/close2 for a second segment (morning + evening)
    const facilities = [
        {
            name: 'משרד',
            icon: 'fas fa-building',
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
        {
            name: 'בריכה אמורפית',
            icon: 'fas fa-swimming-pool',
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
        {
            name: 'בריכת פעוטות',
            icon: 'fas fa-baby',
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
        {
            name: 'מגלשות מים',
            icon: 'fas fa-water',
            schedule: {
                5: { open: '12:00', close: '16:45' },
                6: { open: '10:00', close: '16:45' }
            }
        },
        {
            name: 'בריכה מקורה', membersOnly: true, maintenanceFirstSunday: true,
            icon: 'fas fa-swimming-pool',
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
        {
            name: 'חדר כושר', membersOnly: true,
            icon: 'fas fa-dumbbell',
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
    ];

    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayShort = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'שבת'];

    function timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    function formatTimeRemaining(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0 && m > 0) return `${h} שעות ו-${m} דקות`;
        if (h > 0) return `${h} שעות`;
        return `${m} דקות`;
    }

    function getNextOpenDay(schedule, currentDay) {
        for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            if (schedule[checkDay]) return checkDay;
        }
        return null;
    }

    function updateStatus() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        // First Sunday of the month = a Sunday falling on dates 1–7
        const isFirstSunday = currentDay === 0 && now.getDate() <= 7;

        // Update header
        const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
        const timeHeader = document.getElementById('currentDayTime');
        if (timeHeader) {
            timeHeader.textContent = `יום ${dayNames[currentDay]} • ${dateStr} • ${timeStr}`;
        }

        // Build facilities
        facilitiesContainer.innerHTML = '';

        facilities.forEach(facility => {
            const todayHours = facility.schedule[currentDay];
            const item = document.createElement('div');
            item.className = 'facility-item';

            let statusBadge, hoursText, progressBar, remainingText;

            if (facility.maintenanceFirstSunday && isFirstSunday) {
                // Closed on the first Sunday of the month for thorough maintenance
                item.classList.add('facility-closed');
                statusBadge = `<span class="facility-badge closed"><i class="fas fa-tools"></i> סגור לטיפול</span>`;
                hoursText = 'טיפול יסודי חודשי';
                progressBar = '';
                remainingText = `<i class="fas fa-tools"></i> סגור היום לטיפול יסודי`;
            } else if (todayHours) {
                // Build list of active segments today (1 or 2 segments)
                const segments = [{ open: todayHours.open, close: todayHours.close }];
                if (todayHours.open2 && todayHours.close2) {
                    segments.push({ open: todayHours.open2, close: todayHours.close2 });
                }

                // Determine which segment we're in (or before/after all)
                let activeSegment = null;
                let nextSegment = null;
                for (const seg of segments) {
                    const openMin = timeToMinutes(seg.open);
                    const closeMin = timeToMinutes(seg.close);
                    if (currentMinutes >= openMin && currentMinutes < closeMin) {
                        activeSegment = seg;
                        break;
                    }
                    if (currentMinutes < openMin && !nextSegment) {
                        nextSegment = seg;
                    }
                }

                const allHoursText = segments.map(s => `${s.open} - ${s.close}`).join(' • ');

                if (activeSegment) {
                    // Currently open in this segment
                    const openMin = timeToMinutes(activeSegment.open);
                    const closeMin = timeToMinutes(activeSegment.close);
                    const minutesUntilClose = closeMin - currentMinutes;
                    const totalMinutes = closeMin - openMin;
                    const elapsedMinutes = currentMinutes - openMin;
                    const progressPercent = Math.round((elapsedMinutes / totalMinutes) * 100);

                    const closingSoon = minutesUntilClose <= 60;
                    if (closingSoon) {
                        item.classList.add('facility-closing-soon');
                        statusBadge = `<span class="facility-badge closing-soon"><i class="fas fa-hourglass-half"></i> סוגר בקרוב</span>`;
                    } else {
                        statusBadge = `<span class="facility-badge open"><i class="fas fa-check"></i> פתוח</span>`;
                    }

                    hoursText = allHoursText;
                    progressBar = `<div class="facility-progress-track"><div class="facility-progress-bar" style="width: ${progressPercent}%"></div></div>`;
                    remainingText = `<i class="fas fa-hourglass-half"></i> סוגר בעוד ${formatTimeRemaining(minutesUntilClose)}`;
                } else if (nextSegment) {
                    // Closed now but will open again today
                    const openMin = timeToMinutes(nextSegment.open);
                    const minutesUntilOpen = openMin - currentMinutes;
                    item.classList.add('facility-closed');
                    statusBadge = `<span class="facility-badge closed"><i class="fas fa-lock"></i> סגור</span>`;
                    hoursText = allHoursText;
                    progressBar = `<div class="facility-progress-track"><div class="facility-progress-bar" style="width: 0%"></div></div>`;
                    remainingText = `<i class="fas fa-clock"></i> פותח בעוד ${formatTimeRemaining(minutesUntilOpen)}`;
                } else {
                    // Closed for the rest of the day
                    const nextOpen = getNextOpenDay(facility.schedule, currentDay);
                    item.classList.add('facility-closed');
                    statusBadge = `<span class="facility-badge closed"><i class="fas fa-lock"></i> סגור</span>`;
                    hoursText = allHoursText;
                    progressBar = `<div class="facility-progress-track"><div class="facility-progress-bar" style="width: 100%; background: rgba(239, 68, 68, 0.5);"></div></div>`;
                    if (nextOpen !== null) {
                        const nextHours = facility.schedule[nextOpen];
                        remainingText = `<i class="fas fa-calendar-alt"></i> פותח ${dayShort[nextOpen]} ${nextHours.open}`;
                    } else {
                        remainingText = `<i class="fas fa-times"></i> סגור היום`;
                    }
                }
            } else {
                // Not open today at all
                const nextOpen = getNextOpenDay(facility.schedule, currentDay);
                item.classList.add('facility-closed');
                statusBadge = `<span class="facility-badge closed"><i class="fas fa-lock"></i> סגור</span>`;
                if (nextOpen !== null) {
                    const nextHours = facility.schedule[nextOpen];
                    hoursText = `פתוח ${dayShort[nextOpen]}-שבת`;
                    progressBar = '';
                    remainingText = `<i class="fas fa-calendar-alt"></i> פותח ${dayShort[nextOpen]} ${nextHours.open}`;
                } else {
                    hoursText = 'סגור';
                    progressBar = '';
                    remainingText = '';
                }
            }

            item.innerHTML = `
                <div class="facility-top">
                    <span class="facility-name">
                        <i class="${facility.icon}"></i>
                        ${facility.name}${facility.membersOnly ? '<span class="facility-star">*</span>' : ''}${facility.maintenanceFirstSunday ? '<span class="facility-star">**</span>' : ''}
                    </span>
                    ${statusBadge}
                </div>
                <div class="facility-hours">
                    <i class="far fa-clock"></i>
                    <span>${hoursText}</span>
                </div>
                ${progressBar}
                <div class="facility-remaining">${remainingText}</div>
            `;

            facilitiesContainer.appendChild(item);
        });
    }

    updateStatus();
    // Update every minute
    setInterval(updateStatus, 60000);
}

function initAccessibility() {
    // Skip to Content link
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-to-content';
    skipLink.href = '#main-content';
    skipLink.textContent = 'דילוג לתוכן הראשי';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Main content anchor
    const main = document.querySelector('main, .hero, section');
    if (main && !main.id) main.id = 'main-content';

    // Create accessibility button
    const a11yBtn = document.createElement('button');
    a11yBtn.className = 'a11y-button';
    a11yBtn.setAttribute('aria-label', 'פתיחת תפריט נגישות');
    a11yBtn.setAttribute('title', 'תפריט נגישות');
    a11yBtn.innerHTML = '<i class="fas fa-universal-access"></i>';
    document.body.appendChild(a11yBtn);

    // Create accessibility panel
    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'תפריט אפשרויות נגישות');
    panel.innerHTML = `
        <div class="a11y-header">
            <h3><i class="fas fa-universal-access"></i> תפריט נגישות</h3>
            <button class="a11y-close" aria-label="סגירת תפריט נגישות"><i class="fas fa-times"></i></button>
        </div>
        <div class="a11y-content">

            <div class="a11y-group">
                <div class="a11y-group-title">גודל גופן</div>
                <div class="a11y-options">
                    <button class="a11y-option" data-action="big-font" aria-label="הגדלת גופן">
                        <i class="fas fa-text-height"></i>גופן גדול
                    </button>
                    <button class="a11y-option" data-action="bigger-font" aria-label="הגדלת גופן משמעותית">
                        <i class="fas fa-font"></i>גופן ענק
                    </button>
                </div>
            </div>

            <div class="a11y-group">
                <div class="a11y-group-title">ניגודיות ותצוגה</div>
                <div class="a11y-options">
                    <button class="a11y-option" data-action="high-contrast" aria-label="ניגודיות גבוהה - שחור צהוב">
                        <i class="fas fa-adjust"></i>ניגודיות גבוהה
                    </button>
                    <button class="a11y-option" data-action="inverted" aria-label="היפוך צבעים">
                        <i class="fas fa-circle-half-stroke"></i>היפוך צבעים
                    </button>
                    <button class="a11y-option" data-action="bw" aria-label="גוונים אפורים">
                        <i class="fas fa-tint-slash"></i>שחור-לבן
                    </button>
                    <button class="a11y-option" data-action="readable-font" aria-label="פונט קריא">
                        <i class="fas fa-book-open"></i>פונט קריא
                    </button>
                </div>
            </div>

            <div class="a11y-group">
                <div class="a11y-group-title">ניווט ואינטראקציה</div>
                <div class="a11y-options">
                    <button class="a11y-option" data-action="highlight-links" aria-label="הדגשת קישורים">
                        <i class="fas fa-link"></i>הדגשת קישורים
                    </button>
                    <button class="a11y-option" data-action="big-cursor" aria-label="סמן גדול">
                        <i class="fas fa-mouse-pointer"></i>סמן גדול
                    </button>
                    <button class="a11y-option" data-action="no-animations" aria-label="עצירת אנימציות">
                        <i class="fas fa-pause-circle"></i>עצירת אנימציות
                    </button>
                    <button class="a11y-option" data-action="keyboard-focus" aria-label="הדגשת מיקוד מקלדת">
                        <i class="fas fa-keyboard"></i>מיקוד מקלדת
                    </button>
                </div>
            </div>

            <button class="a11y-reset" aria-label="איפוס כל הגדרות הנגישות">
                <i class="fas fa-undo"></i>איפוס הגדרות
            </button>
        </div>

        <div class="a11y-statement">
            <a href="accessibility.html" id="a11y-statement-link" aria-label="פתיחת הצהרת נגישות">📋 הצהרת נגישות מלאה</a>
        </div>
    `;
    document.body.appendChild(panel);

    // Toggle panel
    a11yBtn.addEventListener('click', () => {
        panel.classList.toggle('active');
        a11yBtn.setAttribute('aria-expanded', panel.classList.contains('active'));
    });

    panel.querySelector('.a11y-close').addEventListener('click', () => {
        panel.classList.remove('active');
        a11yBtn.setAttribute('aria-expanded', 'false');
        a11yBtn.focus();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (panel.classList.contains('active') &&
            !panel.contains(e.target) &&
            !a11yBtn.contains(e.target)) {
            panel.classList.remove('active');
        }
    });

    // Apply saved preferences
    const savedPrefs = JSON.parse(localStorage.getItem('a11yPrefs') || '[]');
    savedPrefs.forEach(action => {
        document.body.classList.add('a11y-' + action);
        const btn = panel.querySelector(`[data-action="${action}"]`);
        if (btn) btn.classList.add('active');
    });

    // Mutually exclusive groups
    const fontSizeGroup = ['big-font', 'bigger-font'];
    const contrastGroup = ['high-contrast', 'inverted', 'bw'];

    // Option handlers
    panel.querySelectorAll('.a11y-option').forEach(option => {
        option.addEventListener('click', () => {
            const action = option.getAttribute('data-action');
            const isActive = option.classList.contains('active');

            // Handle mutually exclusive groups
            let group = null;
            if (fontSizeGroup.includes(action)) group = fontSizeGroup;
            else if (contrastGroup.includes(action)) group = contrastGroup;

            if (group && !isActive) {
                group.forEach(a => {
                    document.body.classList.remove('a11y-' + a);
                    const b = panel.querySelector(`[data-action="${a}"]`);
                    if (b) b.classList.remove('active');
                });
            }

            // Toggle
            if (isActive) {
                document.body.classList.remove('a11y-' + action);
                option.classList.remove('active');
            } else {
                document.body.classList.add('a11y-' + action);
                option.classList.add('active');
            }

            // Save preferences
            const activePrefs = Array.from(panel.querySelectorAll('.a11y-option.active'))
                .map(b => b.getAttribute('data-action'));
            localStorage.setItem('a11yPrefs', JSON.stringify(activePrefs));
        });
    });

    // Reset button
    panel.querySelector('.a11y-reset').addEventListener('click', () => {
        panel.querySelectorAll('.a11y-option').forEach(opt => {
            const action = opt.getAttribute('data-action');
            document.body.classList.remove('a11y-' + action);
            opt.classList.remove('active');
        });
        localStorage.removeItem('a11yPrefs');
    });

    // Statement link now navigates to the full accessibility.html page (no need for inline modal)
    // (Kept showAccessibilityStatement() function intact in case it's called elsewhere)
}

function showAccessibilityStatement() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.7);
        z-index: 99999; display: flex; align-items: center; justify-content: center;
        padding: 20px;
    `;
    modal.innerHTML = `
        <div style="background: white; max-width: 700px; max-height: 85vh; overflow-y: auto;
                    border-radius: 16px; padding: 32px; position: relative;">
            <button style="position: absolute; top: 16px; left: 16px; background: #ef4444;
                          color: white; border: none; width: 36px; height: 36px;
                          border-radius: 50%; cursor: pointer; font-size: 18px;"
                    onclick="this.parentElement.parentElement.remove()" aria-label="סגירה">×</button>
            <h2 style="color: #0066cc; margin-bottom: 16px; font-size: 24px;">📋 הצהרת נגישות</h2>
            <p style="margin-bottom: 12px; line-height: 1.7;"><strong>פארק המים יבנה</strong> מחויב להנגיש את אתר האינטרנט שלו לכל המשתמשים, כולל אנשים עם מוגבלויות.</p>

            <h3 style="color: #0066cc; margin: 20px 0 8px; font-size: 18px;">תאימות לתקן</h3>
            <p style="line-height: 1.7;">האתר נבנה בהתאמה לתקן הישראלי <strong>ת"י 5568</strong> וברמה <strong>AA</strong> של הנחיות WCAG 2.1.</p>

            <h3 style="color: #0066cc; margin: 20px 0 8px; font-size: 18px;">תכונות הנגישות באתר</h3>
            <ul style="line-height: 1.8; padding-right: 20px;">
                <li>תפריט נגישות צף עם 10 אפשרויות התאמה</li>
                <li>הגדלת גופן (2 רמות)</li>
                <li>ניגודיות גבוהה (שחור-צהוב)</li>
                <li>היפוך צבעים</li>
                <li>מצב שחור-לבן</li>
                <li>פונט קריא</li>
                <li>הדגשת קישורים</li>
                <li>סמן גדול</li>
                <li>עצירת אנימציות</li>
                <li>הדגשת מיקוד מקלדת</li>
                <li>תמיכה מלאה בקוראי מסך</li>
                <li>ניווט מלא עם מקלדת</li>
                <li>טקסטים חלופיים לכל התמונות (alt text)</li>
                <li>היררכיית כותרות תקינה</li>
                <li>שמירת העדפות בין ביקורים</li>
            </ul>

            <h3 style="color: #0066cc; margin: 20px 0 8px; font-size: 18px;">פנייה בנושא נגישות</h3>
            <p style="line-height: 1.7;">נתקלתם בבעיית נגישות? נשמח לעזור!<br>
            📧 דוא"ל: mazkirot@parkhamaim.co.il<br>
            📞 טלפון: 08-9431524/5<br>
            🏢 רכז נגישות: מזכירות הפארק</p>

            <h3 style="color: #0066cc; margin: 20px 0 8px; font-size: 18px;">תאריך עדכון אחרון</h3>
            <p style="line-height: 1.7;">הצהרת הנגישות עודכנה לאחרונה ב-${new Date().toLocaleDateString('he-IL')}.</p>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}
