// ============================================
// Public Site - Loads dynamic content from Firebase
// ============================================
// This file makes the public-facing pages (index, attractions, etc.)
// show dynamic content edited from the admin panel
// ============================================

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Initialize Firebase (read-only)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// Helpers
// ============================================
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function setAll(selector, value) {
    document.querySelectorAll(selector).forEach(el => {
        el.textContent = value;
    });
}

// ============================================
// Load News (Notice Board)
// ============================================
async function loadPublicNews() {
    const container = document.getElementById('newsGrid');
    if (!container) return;

    try {
        const q = query(
            collection(db, 'news'),
            orderBy('createdAt', 'desc'),
            limit(6)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            return;
        }

        const newsHTML = snap.docs.map((docSnap, index) => {
            const item = docSnap.data();
            const isFeatured = item.type === 'urgent' || index === 0;
            const typeLabel = {
                'urgent': 'חשוב',
                'important': 'חשוב',
                'info': 'מידע',
                'event': 'אירוע'
            }[item.type] || 'מידע';
            const typeIcon = {
                'urgent': 'bullhorn',
                'important': 'exclamation-circle',
                'info': 'info-circle',
                'event': 'calendar-alt'
            }[item.type] || 'info-circle';
            const badgeClass = item.type === 'urgent' ? 'urgent' : (item.type === 'event' ? 'new' : '');

            // Only show CTA button if both ctaText AND ctaUrl exist
            const ctaHtml = (item.ctaUrl && item.ctaText) ? `
                <a href="${escapeHtml(item.ctaUrl)}" class="news-link">
                    <span>${escapeHtml(item.ctaText)}</span>
                    <i class="fas fa-arrow-left"></i>
                </a>
            ` : '';

            return `
                <article class="news-card ${isFeatured ? 'featured' : ''}">
                    <div class="news-badge ${badgeClass}">
                        <i class="fas fa-${typeIcon}"></i>
                        <span>${escapeHtml(typeLabel)}</span>
                    </div>
                    <div class="news-date">
                        <i class="far fa-calendar-alt"></i>
                        <span>${formatDate(item.date)}</span>
                    </div>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.content)}</p>
                    ${ctaHtml}
                </article>
            `;
        }).join('');

        // Preserve any "pinned" news cards (with data-pinned="true") - they stay at the top regardless of Firebase content
        const pinnedHTML = Array.from(container.querySelectorAll('[data-pinned="true"]'))
            .map(el => el.outerHTML)
            .join('');

        container.innerHTML = pinnedHTML + newsHTML;
    } catch (e) {
        console.error('Failed to load news from Firebase:', e);
    }
}

// ============================================
// Load Hours - Updates time table cells & period
// ============================================
async function loadPublicHours() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'hours'));
        if (!snap.exists()) return;
        const data = snap.data();
        const facilities = data.facilities || {};
        const period = data.period || {};
        const h = data.headers || {};

        // --- Summer block headers ---
        const sChip = document.getElementById('hoursSummerChip');
        if (sChip && h.summerChip) sChip.textContent = h.summerChip;
        const sTitle = document.getElementById('hoursTitle');
        if (sTitle && h.summerTitle) sTitle.textContent = h.summerTitle;
        if (period.start && period.end) {
            const desc = document.getElementById('hoursPeriodDesc');
            if (desc) {
                const facs = h.summerFacilities || 'בריכה אמורפית, בריכת פעוטות, מגלשות ומשרד';
                desc.textContent = `החל מ-${period.start} ועד ${period.end} • ${facs}`;
            }
        }

        // --- Year-round block headers ---
        const yChip = document.getElementById('hoursYrChip');
        if (yChip && h.yrChip) yChip.textContent = h.yrChip;
        const yTitle = document.getElementById('hoursYrTitle');
        if (yTitle && h.yrTitle) yTitle.textContent = h.yrTitle;
        const yDesc = document.getElementById('hoursYrDesc');
        if (yDesc && h.yrSubtitle) yDesc.textContent = h.yrSubtitle;

        // --- Block order (which hours block appears first) ---
        if (data.summerFirst === false) {
            const summerBlock = document.getElementById('hoursSummerBlock');
            const yrBlock = document.getElementById('hoursYrBlock');
            if (summerBlock && yrBlock && yrBlock.parentNode) {
                yrBlock.parentNode.insertBefore(yrBlock, summerBlock);
            }
        }

        // --- Sync the "פעילים עכשיו" status card with these hours (single source) ---
        if (typeof window.setFacilitiesData === 'function') {
            const cardData = Object.keys(facilities)
                .filter(k => facilities[k].enabled !== false)
                .sort((a, b) => (facilities[a].order || 99) - (facilities[b].order || 99))
                .map(k => ({
                    name: facilities[k].name,
                    icon: 'fas fa-' + (facilities[k].icon || 'clock'),
                    schedule: facilities[k].schedule || {},
                    membersOnly: (k === 'indoor' || k === 'gym'),
                    maintenanceFirstSunday: (k === 'indoor'),
                    yearRound: !!facilities[k].yearRound
                }));
            window.setFacilitiesData(cardData);
        }

        // Add per-facility period badges under table headers (idempotent)
        const tableHead = document.querySelector('.full-hours-table thead tr');
        if (tableHead) {
            // Try to map column index → facility id: column 1 = amorphic, column 2 = slides, column 3 = office
            const facilityByCol = { 1: 'amorphic', 2: 'slides', 3: 'office' };
            tableHead.querySelectorAll('th').forEach((th, colIdx) => {
                const fid = facilityByCol[colIdx];
                // remove old badge first
                th.querySelector('.facility-period-badge')?.remove();
                if (!fid) return;
                const f = facilities[fid];
                if (!f) return;
                if (f.period && (f.period.start || f.period.end)) {
                    const badge = document.createElement('div');
                    badge.className = 'facility-period-badge';
                    badge.innerHTML = `<i class="fas fa-calendar-alt"></i> ${escapeHtml(f.period.start || '')} - ${escapeHtml(f.period.end || '')}`;
                    th.appendChild(badge);
                }
                if (f.enabled === false) {
                    const badge = document.createElement('div');
                    badge.className = 'facility-closed-badge';
                    badge.innerHTML = `<i class="fas fa-times-circle"></i> סגור עונתית`;
                    th.appendChild(badge);
                }
            });
        }

        // Update each time-cell by data-hours="<facility>-<day>"
        document.querySelectorAll('[data-hours]').forEach(cell => {
            const [fid, dayStr] = cell.getAttribute('data-hours').split('-');
            const day = parseInt(dayStr);
            const f = facilities[fid];
            if (!f || !f.schedule || f.enabled === false) {
                cell.innerHTML = `<span class="closed-cell">סגור</span>`;
                return;
            }
            const dayData = f.schedule[day];
            if (dayData && dayData.open && dayData.close) {
                let html = `${dayData.open}-${dayData.close}`;
                // Support split day (up to three segments): e.g. 5:30-9:00, 14:00-19:00, 20:00-22:30
                if (dayData.open2 && dayData.close2) {
                    html += `, ${dayData.open2}-${dayData.close2}`;
                }
                if (dayData.open3 && dayData.close3) {
                    html += `, ${dayData.open3}-${dayData.close3}`;
                }
                cell.innerHTML = html;
            } else {
                cell.innerHTML = `<span class="closed-cell">סגור</span>`;
            }
        });

    } catch (e) {
        console.error('Failed to load hours:', e);
    }
}

// ============================================
// Load Contact Info - Updates phone, email, address
// ============================================
async function loadPublicContact() {
    try {
        const snap = await getDoc(doc(db, 'settings', 'contact'));
        if (!snap.exists()) return;
        const data = snap.data();

        // Update simple text fields
        ['phone', 'phone2', 'fax', 'address', 'email1', 'email2'].forEach(key => {
            if (data[key]) setAll(`[data-contact="${key}"]`, data[key]);
        });

        // Combined phones (some places show both joined)
        const phones = [data.phone, data.phone2].filter(Boolean).join(' / ');
        if (phones) setAll(`[data-contact="phones"]`, phones);

        // Social links
        const social = data.social || {};
        document.querySelectorAll('[data-social]').forEach(el => {
            const key = el.getAttribute('data-social');
            if (social[key]) el.href = social[key];
        });

    } catch (e) {
        console.error('Failed to load contact:', e);
    }
}

// ============================================
// Load Board Members - Updates board section if present
// ============================================
function getInitials(fullName) {
    if (!fullName) return '';
    const parts = String(fullName).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return parts[0][0] + parts[1][0];
}

async function loadPublicCEO() {
    const nameEl = document.getElementById('ceoName');
    if (!nameEl) return;
    try {
        const snap = await getDoc(doc(db, 'settings', 'management'));
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.ceoName) nameEl.textContent = data.ceoName;
        const descEl = document.getElementById('ceoDescription');
        if (descEl && data.ceoDescription) descEl.textContent = data.ceoDescription;
        const avatarEl = document.querySelector('.ceo-avatar');
        if (avatarEl && data.ceoName) {
            const parts = data.ceoName.trim().split(/\s+/);
            avatarEl.textContent = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0,2);
        }
    } catch (e) {
        console.error('CEO load failed:', e);
    }
}

async function loadPublicBoard() {
    const container = document.getElementById('boardGrid');
    if (!container) return; // Only present on about.html

    try {
        const snap = await getDoc(doc(db, 'settings', 'board'));
        if (!snap.exists()) return;
        const data = snap.data();
        const members = (data.members || []).sort((a, b) => (a.order || 99) - (b.order || 99));

        if (members.length === 0) return;

        const dateEl = document.getElementById('boardAsOfDate');
        if (dateEl && data.date) dateEl.textContent = data.date;

        container.innerHTML = members.map(m => `
            <div class="board-member${m.isChairman ? ' chairman' : ''}">
                ${m.isChairman ? '<div class="chair-badge">יו״ר</div>' : ''}
                <div class="board-avatar">${escapeHtml(getInitials(m.name))}</div>
                <h4>${escapeHtml(m.name)}</h4>
                <div class="role">${escapeHtml(m.role || 'חבר ועד')}</div>
            </div>
        `).join('');

    } catch (e) {
        console.error('Failed to load board:', e);
    }
}

// ============================================
// Load Gallery - Replaces static gallery with Firestore data when available
// ============================================
async function loadPublicGallery() {
    const grid = document.getElementById('galleryProGrid');
    if (!grid) return;

    try {
        const snap = await getDocs(collection(db, 'gallery'));
        if (snap.empty) return; // Keep static markup as fallback

        const items = snap.docs.map(d => d.data())
            .sort((a, b) => (a.order || 9999) - (b.order || 9999));

        // Replace entire gallery with Firestore data
        grid.innerHTML = items.map(img => `
            <div class="gallery-pro-item" data-category="${escapeHtml(img.category || 'user')}">
                <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || 'תמונה מהפארק')}" loading="lazy">
                <div class="gallery-zoom-icon"><i class="fas fa-search-plus"></i></div>
                <div class="gallery-pro-overlay">
                    <h4>${escapeHtml(img.caption || '')}</h4>
                    ${img.subtitle ? `<span>${escapeHtml(img.subtitle)}</span>` : ''}
                </div>
            </div>
        `).join('');


        // Trigger re-binding of lightbox/filter handlers if the page exposes them
        if (typeof window.rebindGalleryHandlers === 'function') {
            window.rebindGalleryHandlers();
        }
    } catch (e) {
        console.error('Gallery load failed:', e);
    }
}

// ============================================
// Load Classes - Replaces events.html schedule if available
// ============================================
async function loadPublicClasses() {
    const sections = document.querySelectorAll('.day-section-classes');
    if (!sections.length) return;

    try {
        const snap = await getDocs(collection(db, 'classes'));
        if (snap.empty) return; // Keep static markup

        const all = snap.docs.map(d => d.data());
        const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        sections.forEach(section => {
            const dayKey = section.getAttribute('data-day');
            const dayIdx = dayKeys.indexOf(dayKey);
            if (dayIdx === -1) return;

            const dayClasses = all
                .filter(c => Number(c.day) === dayIdx)
                .sort((a, b) => (a.time?.start || '').localeCompare(b.time?.start || ''));

            if (dayClasses.length === 0) {
                section.innerHTML = `<div class="empty-day"><p>אין חוגים ביום זה</p></div>`;
                return;
            }

            section.innerHTML = `
                <div class="timeline-grid">
                    ${dayClasses.map(c => `
                        <div class="tl-card">
                            <div class="tl-card-time">
                                <div class="tl-start">${escapeHtml(c.time?.start || '')}</div>
                                <div class="tl-sep">עד</div>
                                <div class="tl-end">${escapeHtml(c.time?.end || '')}</div>
                            </div>
                            <div class="tl-card-body">
                                <div class="tl-card-name"><span class="tl-emoji ${escapeHtml(c.category || '')}"><i class="fas fa-${escapeHtml(c.icon || 'star')}"></i></span>${escapeHtml(c.name)}</div>
                                ${c.instructor ? `<div class="tl-card-inst"><i class="fas fa-user"></i>${escapeHtml(c.instructor)}</div>` : ''}
                                <div class="tl-card-price ${/מנוי|עמות/.test(c.price || '') ? 'members' : ''}">
                                    <i class="fas fa-${/מנוי|עמות/.test(c.price || '') ? 'star' : 'tag'}"></i> ${escapeHtml(c.price || '')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });
    } catch (e) {
        console.error('Classes load failed:', e);
    }
}

// ============================================
// Load Elections - Replaces about.html elections section
// ============================================
async function loadPublicElections() {
    const tabsContainer = document.getElementById('electionsTabs');
    const contentsContainer = document.getElementById('electionsContents');
    if (!tabsContainer || !contentsContainer) return;

    try {
        const snap = await getDocs(collection(db, 'elections'));
        if (snap.empty) return;

        const elections = snap.docs
            .map(d => d.data())
            .sort((a, b) => (b.year || 0) - (a.year || 0));

        // Render tabs
        tabsContainer.innerHTML = elections.map((e, idx) => `
            <button class="election-tab ${idx === 0 ? 'active' : ''}" data-year="${e.year}">
                <span class="tab-year">${escapeHtml(String(e.year))}</span>
                <span class="tab-date">${escapeHtml(e.date || '')}</span>
            </button>
        `).join('');

        // Render content for each year
        const maxVotes = Math.max(1, ...elections.flatMap(e => (e.candidates || []).map(c => c.votes || 0)));
        contentsContainer.innerHTML = elections.map((e, idx) => {
            const sorted = [...(e.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
            const electionMax = Math.max(1, ...sorted.map(c => c.votes || 0));
            return `
                <div class="election-content ${idx === 0 ? 'active' : ''}" data-year="${e.year}">
                    <div class="election-header">
                        <div>
                            <h3>${escapeHtml(e.title || `בחירות ${e.year}`)}</h3>
                            ${e.note ? `<p>${escapeHtml(e.note)}</p>` : ''}
                        </div>
                        ${e.badge ? `<div class="election-badge"><i class="fas fa-check-circle"></i> <span>${escapeHtml(e.badge)}</span></div>` : ''}
                    </div>
                    <div class="election-results">
                        ${sorted.map((c, i) => {
                            const widthPct = c.votes ? ((c.votes / electionMax) * 100).toFixed(1) : 0;
                            const electedClass = c.elected ? 'elected' : 'not-elected';
                            const statusClass = c.elected ? 'elected-status' : 'not-elected-status';
                            const statusIcon = c.elected ? 'check' : 'times';
                            const statusText = c.elected ? 'נבחר' : 'לא נבחר';
                            return `
                                <div class="result-row ${electedClass}">
                                    <div class="result-position">${i + 1}</div>
                                    <div class="result-name">${escapeHtml(c.name)}</div>
                                    <div class="result-bar"><div class="bar-fill" style="width: ${widthPct}%;"></div></div>
                                    <div class="result-votes">${c.votes || '—'}</div>
                                    <div class="result-status ${statusClass}"><i class="fas fa-${statusIcon}"></i> <span>${statusText}</span></div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Re-bind tab clicks
        tabsContainer.querySelectorAll('.election-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const year = tab.getAttribute('data-year');
                tabsContainer.querySelectorAll('.election-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                contentsContainer.querySelectorAll('.election-content').forEach(c => {
                    c.classList.toggle('active', c.getAttribute('data-year') === year);
                });
            });
        });

    } catch (e) {
        console.error('Elections load failed:', e);
    }
}

// ============================================
// Load Committees - Replaces about.html committees grid
// ============================================
async function loadPublicCommittees() {
    const grid = document.getElementById('committeesGrid');
    if (!grid) return;

    try {
        const snap = await getDocs(collection(db, 'committees'));
        if (snap.empty) return;

        const committees = snap.docs
            .map(d => d.data())
            .sort((a, b) => (a.order || 99) - (b.order || 99));

        grid.innerHTML = committees.map(c => `
            <div class="committee-card">
                <h4><i class="fas fa-${escapeHtml(c.icon || 'users')}"></i> <span>${escapeHtml(c.name)}</span></h4>
                ${c.subtitle ? `<p class="committee-subtitle">${escapeHtml(c.subtitle)}</p>` : ''}
                <ul class="committee-list">
                    ${c.chair ? `<li><i class="fas fa-star"></i> <strong>${escapeHtml(c.chair)}</strong> <span class="role-tag">יו״ר</span></li>` : ''}
                    ${(c.members || []).map(m => `<li><i class="fas fa-user"></i> ${escapeHtml(m)}</li>`).join('')}
                </ul>
            </div>
        `).join('');

    } catch (e) {
        console.error('Committees load failed:', e);
    }
}

// ============================================
// Contact Form Handler - Bilingual validation + Israeli phone
// ============================================
const FORM_MESSAGES = {
    he: {
        required: 'שדה חובה',
        nameShort: 'השם קצר מדי (לפחות 2 תווים)',
        phoneInvalid: 'מספר טלפון לא תקין. דוגמה: 050-1234567 או 08-9431524',
        emailInvalid: 'כתובת דוא״ל לא תקינה. דוגמה: name@example.com',
        subjectRequired: 'יש לבחור נושא מהרשימה',
        messageShort: 'ההודעה קצרה מדי (לפחות 10 תווים)',
        fixFields: 'יש לתקן את השדות המסומנים',
        sending: 'שולח...',
        success: '✓ הודעתך נשלחה בהצלחה! נחזור אליך בהקדם.',
        permissionError: 'שגיאה: חוקי האבטחה ב-Firestore חוסמים את השליחה.',
        genericError: 'שגיאה בשליחה. נסה שוב או התקשר ישירות: 08-9431524'
    },
    en: {
        required: 'Required field',
        nameShort: 'Name too short (at least 2 characters)',
        phoneInvalid: 'Invalid phone number. Example: 050-1234567 or 08-9431524',
        emailInvalid: 'Invalid email address. Example: name@example.com',
        subjectRequired: 'Please select a subject',
        messageShort: 'Message too short (at least 10 characters)',
        fixFields: 'Please fix the highlighted fields',
        sending: 'Sending...',
        success: '✓ Your message was sent successfully! We will get back to you soon.',
        permissionError: 'Error: Firestore security rules are blocking submission.',
        genericError: 'Error sending. Try again or call directly: 08-9431524'
    }
};

function getCurrentLang() {
    return localStorage.getItem('parkLang') === 'en' ? 'en' : 'he';
}

function t(key) {
    return FORM_MESSAGES[getCurrentLang()][key] || key;
}

// Israeli phone validation (mobile + landline, with/without +972)
function validateIsraeliPhone(phone) {
    const cleaned = String(phone || '').replace(/[\s\-().]/g, '');
    // Mobile: 050-059 (10 digits) | Landline: 02,03,04,07,08,09 + 7 digits | with +972 prefix
    return /^(\+972|972|0)(5[0-9]\d{7}|[234789]\d{7})$/.test(cleaned);
}

// Format phone consistently before saving (e.g., "050-1234567")
function formatPhone(phone) {
    let digits = String(phone || '').replace(/[\s\-().+]/g, '');
    if (digits.startsWith('972')) digits = '0' + digits.slice(3);
    if (digits.length === 10) return digits.slice(0, 3) + '-' + digits.slice(3);
    if (digits.length === 9) return digits.slice(0, 2) + '-' + digits.slice(2);
    return phone;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function setFieldError(field, message) {
    field.classList.add('field-error');
    let errEl = field.parentElement.querySelector('.field-error-msg');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'field-error-msg';
        field.parentElement.appendChild(errEl);
    }
    errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
}

function clearFieldError(field) {
    field.classList.remove('field-error');
    const errEl = field.parentElement.querySelector('.field-error-msg');
    if (errEl) errEl.remove();
}

function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;


    // Disable browser native validation - we handle it in the correct language
    form.setAttribute('novalidate', 'true');

    const subjectLabels = {
        reservation: 'הזמנת ביקור',
        membership: 'חברות בעמותה',
        event: 'אירוע פרטי',
        classes: 'חוגים',
        info: 'מידע כללי',
        complaint: 'תלונה / משוב',
        other: 'אחר'
    };

    // Clear error when user starts editing
    ['name', 'phone', 'email', 'subject', 'message'].forEach(id => {
        const field = form.querySelector('#' + id);
        if (field) {
            field.addEventListener('input', () => clearFieldError(field));
            field.addEventListener('change', () => clearFieldError(field));
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameField = form.querySelector('#name');
        const phoneField = form.querySelector('#phone');
        const emailField = form.querySelector('#email');
        const subjectField = form.querySelector('#subject');
        const messageField = form.querySelector('#message');

        const name = nameField.value.trim();
        const phoneRaw = phoneField.value.trim();
        const email = emailField.value.trim();
        const subjectKey = subjectField.value;
        const message = messageField.value.trim();

        // Reset all errors before validating
        [nameField, phoneField, emailField, subjectField, messageField].forEach(clearFieldError);

        let hasError = false;

        if (!name) {
            setFieldError(nameField, t('required'));
            hasError = true;
        } else if (name.length < 2) {
            setFieldError(nameField, t('nameShort'));
            hasError = true;
        }

        if (!phoneRaw) {
            setFieldError(phoneField, t('required'));
            hasError = true;
        } else if (!validateIsraeliPhone(phoneRaw)) {
            setFieldError(phoneField, t('phoneInvalid'));
            hasError = true;
        }

        if (!email) {
            setFieldError(emailField, t('required'));
            hasError = true;
        } else if (!validateEmail(email)) {
            setFieldError(emailField, t('emailInvalid'));
            hasError = true;
        }

        if (!subjectKey) {
            setFieldError(subjectField, t('subjectRequired'));
            hasError = true;
        }

        if (!message) {
            setFieldError(messageField, t('required'));
            hasError = true;
        }

        if (hasError) {
            showFormFeedback(t('fixFields'), 'error');
            const firstError = form.querySelector('.field-error');
            if (firstError) firstError.focus();
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${t('sending')}`;

        try {
            const formattedPhone = formatPhone(phoneRaw);
            const subjectLabel = subjectLabels[subjectKey] || subjectKey;
            const docRef = await addDoc(collection(db, 'messages'), {
                name,
                phone: formattedPhone,
                phoneRaw,
                email,
                subjectKey,
                subject: subjectLabel,
                content: message,
                status: 'new',
                isRead: false,
                lang: getCurrentLang(),
                createdAt: serverTimestamp()
            });


            // Also trigger email notification (handled by Firebase "Trigger Email" extension)
            try {
                const notificationsSnap = await getDoc(doc(db, 'settings', 'notifications'));
                const notifSettings = notificationsSnap.exists() ? notificationsSnap.data() : {};
                const rawRecipients = notifSettings.recipientEmail || 'mazkirot@parkhamaim.co.il';
                // Support multiple recipients separated by commas
                const recipients = rawRecipients.split(',').map(e => e.trim()).filter(Boolean);
                const adminUrl = 'https://park-hamayim-yavne.web.app/admin.html';

                if (notifSettings.enabled !== false && recipients.length > 0) {
                    await addDoc(collection(db, 'mail'), {
                        to: recipients,
                        message: {
                            subject: `📨 פנייה חדשה: ${subjectLabel} - ${name}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <div style="background: linear-gradient(135deg, #0066cc, #003d99); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
                                        <h2 style="margin: 0;">📨 פנייה חדשה לפארק המים יבנה</h2>
                                        <p style="margin: 8px 0 0 0; opacity: 0.9;">${subjectLabel}</p>
                                    </div>
                                    <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                                        <div style="margin-bottom: 16px;">
                                            <strong>שם:</strong> ${name}<br>
                                            <strong>טלפון:</strong> <a href="tel:${formattedPhone}">${formattedPhone}</a><br>
                                            <strong>דוא״ל:</strong> <a href="mailto:${email}">${email}</a><br>
                                            <strong>נושא:</strong> ${subjectLabel}
                                        </div>
                                        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
                                            <strong>תוכן ההודעה:</strong><br>
                                            <p style="margin: 8px 0 0 0; white-space: pre-wrap;">${message.replace(/</g, '&lt;')}</p>
                                        </div>
                                        <a href="${adminUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 16px;">
                                            ↗ פתח בפאנל הניהול
                                        </a>
                                        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                                            מייל אוטומטי מהמערכת. אל תשיב למייל זה — השב דרך פאנל הניהול.
                                        </p>
                                    </div>
                                </div>
                            `,
                            text: `פנייה חדשה לפארק המים יבנה\n\nשם: ${name}\nטלפון: ${formattedPhone}\nדוא״ל: ${email}\nנושא: ${subjectLabel}\n\nתוכן:\n${message}\n\nפתח בפאנל: ${adminUrl}`
                        }
                    });
                }
            } catch (mailErr) {
                console.warn('Mail notification failed (non-blocking):', mailErr);
            }

            showFormFeedback(t('success'), 'success');
            form.reset();
        } catch (err) {
            console.error('❌ Send failed:', err);
            console.error('Error code:', err.code, 'Message:', err.message);
            const detailedMsg = err.code === 'permission-denied' ? t('permissionError') : t('genericError');
            showFormFeedback(detailedMsg, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    });
}

function showFormFeedback(msg, type) {
    let feedback = document.getElementById('contactFormFeedback');
    const form = document.getElementById('contactForm');
    if (!form) return;
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'contactFormFeedback';
        feedback.className = 'contact-form-feedback';
        form.appendChild(feedback);
    }
    feedback.className = `contact-form-feedback ${type}`;
    feedback.textContent = msg;
    feedback.style.display = 'block';
    if (type === 'success') {
        setTimeout(() => { feedback.style.display = 'none'; }, 6000);
    }
}

// ============================================
// Auto-init when DOM is ready
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPublicData);
} else {
    initPublicData();
}

function initPublicData() {
    initContactForm();
    Promise.all([
        loadPublicNews(),
        loadPublicHours(),
        loadPublicContact(),
        loadPublicCEO(),
        loadPublicBoard(),
        loadPublicGallery(),
        loadPublicClasses(),
        loadPublicElections(),
        loadPublicCommittees(),
        loadPublicFaq()
    ]).then(() => {
    });
}

// ============================================
// Load FAQ - replaces faq.html accordion if data exists
// ============================================
async function loadPublicFaq() {
    const wrapper = document.querySelector('.faq-wrapper');
    if (!wrapper) return; // not the FAQ page
    try {
        const snap = await getDocs(collection(db, 'faq'));
        if (snap.empty) return; // keep static markup as fallback
        const items = snap.docs.map(d => d.data())
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        wrapper.innerHTML = items.map(f => `
            <div class="faq-item">
                <button class="faq-question">
                    <span>${escapeHtml(f.question || '')}</span>
                    <span class="faq-icon"><i class="fas fa-plus"></i></span>
                </button>
                <div class="faq-answer">
                    <div class="faq-answer-content">${escapeHtml(f.answer || '').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('FAQ load failed:', e);
    }
}
