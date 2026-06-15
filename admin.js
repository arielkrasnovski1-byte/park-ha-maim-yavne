// ============================================
// Admin Panel - Park HaMayim Yavne
// ============================================

import { firebaseConfig, DEMO_MODE } from './firebase-config.js';
import { initialData } from './data-templates.js';

// Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Browser image compression library (ESM build)
import imageCompression from "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/+esm";

// ============================================
// Initialize
// ============================================
let app, auth, db, storage;
let isInitialized = false;

try {
    if (!DEMO_MODE) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        isInitialized = true;
    }
} catch (e) {
    console.warn('Firebase init failed:', e);
}

// ============================================
// Demo Mode Data (works without Firebase)
// ============================================
const demoData = {
    news: [
        {
            id: 'demo1',
            title: 'לידיעת החברים',
            content: 'חדר הכושר והבריכה המקורה נפתחו מחדש החל מיום חמישי 5.3.26.',
            date: '2026-03-05',
            type: 'important'
        }
    ],
    hours: {
        period: { start: '29.5.2026', end: '18.6.2026' },
        facilities: []
    },
    contact: {
        phone: '08-9431524',
        phone2: '08-9431525',
        fax: '08-9334290',
        address: 'שדרות דואני, יבנה',
        email1: 'mazkirot@parkhamaim.co.il',
        email2: 'hanhala@parkhamaim.co.il'
    }
};

// ============================================
// DOM Elements
// ============================================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const loginScreen = $('loginScreen');
const adminApp = $('adminApp');
const loginForm = $('loginForm');
const loginError = $('loginError');
const logoutBtn = $('logoutBtn');
const mobileMenuBtn = $('mobileMenuBtn');
const sidebar = $('adminSidebar');

// ============================================
// Toast System
// ============================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    $('toastContainer').appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// Modal System
// ============================================
function showModal(html, onSave) {
    const overlay = $('modalOverlay');
    const modal = $('modal');
    if (!overlay) { console.error('❌ #modalOverlay not found!'); return; }
    if (!modal) { console.error('❌ #modal not found!'); return; }
    modal.innerHTML = html;
    overlay.style.display = 'flex';

    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };

    if (onSave) {
        const saveBtn = modal.querySelector('[data-modal-save]');
        if (saveBtn) saveBtn.onclick = () => onSave(modal);
    }

    // Wire up ALL close buttons (modal may have multiple - X in header + cancel in footer)
    modal.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.onclick = closeModal;
    });
}

function closeModal() {
    $('modalOverlay').style.display = 'none';
}

// ============================================
// Authentication
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    loginError.style.display = 'none';

    const email = $('email').value.trim();
    const password = $('password').value;

    if (DEMO_MODE) {
        // Demo: accept any login
        if (email && password.length >= 4) {
            await sleep(500);
            showAdmin({ email });
            showToast('ברוך הבא! (מצב הדגמה)', 'success');
        } else {
            showLoginError('נא להזין דוא"ל וסיסמה תקפים');
        }
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the rest
    } catch (error) {
        let msg = 'התחברות נכשלה';
        if (error.code === 'auth/user-not-found') msg = 'משתמש לא נמצא';
        else if (error.code === 'auth/wrong-password') msg = 'סיסמה שגויה';
        else if (error.code === 'auth/invalid-email') msg = 'דוא"ל לא תקין';
        else if (error.code === 'auth/too-many-requests') msg = 'יותר מדי ניסיונות, נסה שוב מאוחר יותר';
        showLoginError(msg);
    }
}

function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.style.display = 'block';
}

function showAdmin(user) {
    loginScreen.style.display = 'none';
    adminApp.style.display = 'flex';
    $('userName').textContent = user.email || 'מנהל';
    if (isInitialized) {
        $('firebaseStatus').textContent = 'מחובר ✓';
        $('firebaseStatus').classList.add('connected');
    } else {
        $('firebaseStatus').textContent = 'מצב הדגמה (ללא Firebase)';
    }
    loadAllData();
}

async function handleLogout() {
    if (DEMO_MODE) {
        loginScreen.style.display = 'flex';
        adminApp.style.display = 'none';
        loginForm.reset();
        showToast('התנתקת בהצלחה');
        return;
    }
    try {
        await signOut(auth);
    } catch (e) {
        console.error(e);
    }
}

// Listen for auth state
if (isInitialized) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            showAdmin(user);
        } else {
            loginScreen.style.display = 'flex';
            adminApp.style.display = 'none';
        }
    });
}

// ============================================
// Navigation
// ============================================
function navigateTo(section) {
    $$('.nav-item').forEach(item => item.classList.remove('active'));
    $$('.content-section').forEach(s => s.classList.remove('active'));

    const navBtn = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (navBtn) navBtn.classList.add('active');

    const sectionEl = $(`section-${section}`);
    if (sectionEl) sectionEl.classList.add('active');

    // Update topbar
    const titles = {
        dashboard: { icon: 'home', text: 'סקירה כללית' },
        messages: { icon: 'envelope', text: 'הודעות נכנסות' },
        news: { icon: 'bullhorn', text: 'לוח מודעות' },
        hours: { icon: 'clock', text: 'שעות פעילות' },
        classes: { icon: 'dumbbell', text: 'חוגים' },
        board: { icon: 'users', text: 'חברי ועד' },
        elections: { icon: 'vote-yea', text: 'תוצאות בחירות' },
        gallery: { icon: 'images', text: 'גלריה' },
        contact: { icon: 'address-card', text: 'פרטי קשר' },
        settings: { icon: 'cog', text: 'הגדרות' }
    };
    const t = titles[section] || titles.dashboard;
    $('topbarTitle').innerHTML = `<i class="fas fa-${t.icon}"></i><h1>${t.text}</h1>`;

    // Close mobile sidebar
    sidebar.classList.remove('open');
}

// ============================================
// Notification Settings (Email alerts on new messages)
// ============================================
async function loadNotificationSettings() {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const snap = await getDoc(doc(db, 'settings', 'notifications'));
        const data = snap.exists() ? snap.data() : {};
        if ($('notificationEmail')) {
            $('notificationEmail').value = data.recipientEmail || 'mazkirot@parkhamaim.co.il';
        }
        if ($('notificationEnabled')) {
            $('notificationEnabled').checked = data.enabled !== false;
        }
    } catch (e) {
        console.error('Notification settings load failed:', e);
    }
}

async function saveNotificationSettings() {
    if (DEMO_MODE || !isInitialized) return;
    const rawEmails = $('notificationEmail')?.value.trim() || '';
    if (!rawEmails) {
        showToast('יש להזין לפחות מייל אחד לקבלת התראות', 'error');
        return;
    }

    // Validate each email (comma-separated)
    const emails = rawEmails.split(',').map(e => e.trim()).filter(Boolean);
    const invalid = emails.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid.length > 0) {
        showToast(`כתובת לא תקינה: ${invalid[0]}`, 'error');
        return;
    }

    const data = {
        recipientEmail: emails.join(', '),
        enabled: $('notificationEnabled')?.checked !== false
    };
    try {
        await setDoc(doc(db, 'settings', 'notifications'), data);
        const countMsg = emails.length > 1 ? ` (${emails.length} נמענים)` : '';
        showToast((data.enabled ? 'הגדרות נשמרו - התראות פעילות' : 'הגדרות נשמרו - התראות כבויות') + countMsg, 'success');
    } catch (e) {
        showToast('שגיאה: ' + e.message, 'error');
    }
}

// ============================================
// Quick Replies (Saved Templates) Management
// ============================================
let quickRepliesItems = [];

async function loadQuickReplies() {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const snap = await getDocs(collection(db, 'quickReplies'));
        quickRepliesItems = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 99) - (b.order || 99));
        renderQuickReplies();
    } catch (e) {
        console.error('Quick replies load failed:', e);
    }
}

function renderQuickReplies() {
    const list = $('quickRepliesList');
    if (!list) return;

    const replyCount = $('replyCount');
    if (replyCount) replyCount.textContent = quickRepliesItems.length;

    if (quickRepliesItems.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bolt"></i>
                <p>אין תשובות שמורות. הוסף תשובה ראשונה כדי להתחיל!</p>
                <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">
                    דוגמאות: "תודה על פנייתך", "מחיר מנוי שנתי", "שעות פעילות"
                </p>
            </div>`;
        return;
    }

    list.innerHTML = quickRepliesItems.map((r, idx) => `
        <div class="list-item quick-reply-item">
            <div class="list-item-content">
                <div class="list-item-title">
                    <span class="reply-emoji">${r.icon || '💬'}</span>
                    ${escapeHtml(r.title)}
                </div>
                <div class="list-item-meta reply-preview">
                    ${escapeHtml((r.content || '').substring(0, 150))}${(r.content || '').length > 150 ? '...' : ''}
                </div>
            </div>
            <div class="list-item-actions">
                <button class="icon-btn" data-reply-up="${r.id}" title="העלה" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                <button class="icon-btn" data-reply-down="${r.id}" title="הורד" ${idx === quickRepliesItems.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                <button class="icon-btn" data-reply-edit="${r.id}" title="ערוך"><i class="fas fa-edit"></i></button>
                <button class="icon-btn danger" data-reply-delete="${r.id}" title="מחק"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('[data-reply-edit]').forEach(btn => {
        btn.onclick = () => editQuickReply(btn.getAttribute('data-reply-edit'));
    });
    list.querySelectorAll('[data-reply-delete]').forEach(btn => {
        btn.onclick = () => deleteQuickReply(btn.getAttribute('data-reply-delete'));
    });
    list.querySelectorAll('[data-reply-up]').forEach(btn => {
        btn.onclick = () => moveQuickReply(btn.getAttribute('data-reply-up'), -1);
    });
    list.querySelectorAll('[data-reply-down]').forEach(btn => {
        btn.onclick = () => moveQuickReply(btn.getAttribute('data-reply-down'), 1);
    });
}

function showQuickReplyForm(existing = null) {
    const icons = ['💬', '🙏', '📅', '🏊', '💪', '👋', '💳', '🎁', '⚠️', '📞', '✉️', 'ℹ️'];

    const html = `
        <div class="modal-header">
            <h3><i class="fas fa-bolt"></i> ${existing ? 'עריכת תשובה מהירה' : 'תשובה מהירה חדשה'}</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <div class="form-group">
            <label>כותרת קצרה (יוצג ככפתור)</label>
            <input type="text" id="replyTitle" value="${escapeHtml(existing?.title || '')}" placeholder="לדוגמה: תודה על פנייתך">
        </div>
        <div class="form-group">
            <label>בחר אייקון</label>
            <div class="emoji-picker" id="emojiPicker">
                ${icons.map(em => `<button type="button" class="emoji-option ${existing?.icon === em ? 'selected' : ''}" data-emoji="${em}">${em}</button>`).join('')}
            </div>
            <input type="hidden" id="replyIcon" value="${existing?.icon || '💬'}">
        </div>
        <div class="form-group">
            <label>תוכן התשובה</label>
            <textarea id="replyContent" rows="6" placeholder="שלום [שם],&#10;תודה רבה על פנייתך. נחזור אליך בהקדם...">${escapeHtml(existing?.content || '')}</textarea>
            <div style="font-size: 12px; color: var(--admin-text-muted); margin-top: 6px;">
                💡 השתמש ב-<code>[שם]</code> כדי להחליף אוטומטית את שם הלקוח, ו-<code>[נושא]</code> לנושא הפנייה
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" data-modal-save><i class="fas fa-save"></i> שמירה</button>
        </div>
    `;

    showModal(html, async (modal) => {
        const data = {
            title: modal.querySelector('#replyTitle').value.trim(),
            icon: modal.querySelector('#replyIcon').value,
            content: modal.querySelector('#replyContent').value.trim()
        };
        if (!data.title || !data.content) {
            showToast('יש למלא כותרת ותוכן', 'error');
            return;
        }
        try {
            if (existing) {
                data.order = existing.order;
                await updateDoc(doc(db, 'quickReplies', existing.id), data);
            } else {
                data.order = quickRepliesItems.length + 1;
                data.createdAt = serverTimestamp();
                await addDoc(collection(db, 'quickReplies'), data);
            }
            closeModal();
            await loadQuickReplies();
            showToast(existing ? 'תשובה עודכנה' : 'תשובה נוספה!');
        } catch (e) {
            showToast('שגיאה: ' + e.message, 'error');
        }
    });

    // Emoji picker
    const picker = document.getElementById('emojiPicker');
    const iconInput = document.getElementById('replyIcon');
    picker.querySelectorAll('[data-emoji]').forEach(btn => {
        btn.onclick = () => {
            picker.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            iconInput.value = btn.getAttribute('data-emoji');
        };
    });
}

function editQuickReply(id) {
    const r = quickRepliesItems.find(it => it.id === id);
    if (r) showQuickReplyForm(r);
}

async function deleteQuickReply(id) {
    if (!confirm('האם למחוק את התשובה השמורה?')) return;
    await deleteDoc(doc(db, 'quickReplies', id));
    await loadQuickReplies();
    showToast('התשובה נמחקה');
}

async function moveQuickReply(id, direction) {
    const idx = quickRepliesItems.findIndex(it => it.id === id);
    const newIdx = idx + direction;
    if (idx === -1 || newIdx < 0 || newIdx >= quickRepliesItems.length) return;
    const a = quickRepliesItems[idx], b = quickRepliesItems[newIdx];
    const tmpOrder = a.order || 99;
    await updateDoc(doc(db, 'quickReplies', a.id), { order: b.order || 99 });
    await updateDoc(doc(db, 'quickReplies', b.id), { order: tmpOrder });
    await loadQuickReplies();
}

// ============================================
// Messages (Inbox) Management
// ============================================
let messagesItems = [];
let messagesFilter = 'all';
let selectedMessageIds = new Set();

const MSG_STATUS = {
    new: { label: 'חדש', color: '#3b82f6', icon: 'circle' },
    in_progress: { label: 'בטיפול', color: '#f59e0b', icon: 'spinner' },
    done: { label: 'טופל', color: '#10b981', icon: 'check-circle' }
};

const SUBJECT_LABELS = {
    reservation: 'הזמנת ביקור',
    membership: 'מנוי שנתי',
    event: 'אירוע פרטי',
    classes: 'חוגים',
    info: 'מידע כללי',
    complaint: 'תלונה / משוב',
    other: 'אחר'
};

function formatRelativeTime(ts) {
    if (!ts) return 'עכשיו';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'לפני רגע';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `לפני ${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `לפני ${days} ימים`;
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatPhoneForWhatsApp(phone) {
    // Strip everything non-digit, remove leading 0, prepend 972
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('972')) return digits;
    if (digits.startsWith('0')) digits = digits.slice(1);
    return '972' + digits;
}

async function loadMessages() {
    if (DEMO_MODE || !isInitialized) return;
    try {
        // First try ordered query
        let snap;
        try {
            snap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc')));
        } catch (orderErr) {
            console.warn('⚠️ orderBy failed, falling back to unordered query:', orderErr.message);
            snap = await getDocs(collection(db, 'messages'));
        }
        messagesItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort manually if createdAt is null/missing
        messagesItems.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });
        renderMessagesFilters();
        renderMessages();
        updateMessagesBadge();
    } catch (e) {
        console.error('❌ Messages load failed:', e);
        console.error('Error code:', e.code, 'Message:', e.message);
    }
}

function updateMessagesBadge() {
    const badge = $('messagesBadge');
    if (!badge) return;
    const unread = messagesItems.filter(m => !m.isRead).length;
    if (unread > 0) {
        badge.textContent = unread > 99 ? '99+' : unread;
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderMessagesFilters() {
    const bar = $('messagesFilterBar');
    if (!bar) return;
    const counts = {
        all: messagesItems.length,
        new: messagesItems.filter(m => m.status === 'new').length,
        in_progress: messagesItems.filter(m => m.status === 'in_progress').length,
        done: messagesItems.filter(m => m.status === 'done').length
    };
    const filters = [
        { value: 'all', label: 'הכל' },
        { value: 'new', label: 'חדש', color: MSG_STATUS.new.color },
        { value: 'in_progress', label: 'בטיפול', color: MSG_STATUS.in_progress.color },
        { value: 'done', label: 'טופל', color: MSG_STATUS.done.color }
    ];
    bar.innerHTML = filters.map(f => `
        <button class="messages-filter-btn ${messagesFilter === f.value ? 'active' : ''}" data-msg-filter="${f.value}" ${f.color ? `style="--dot:${f.color}"` : ''}>
            ${f.color ? '<span class="msg-dot"></span>' : ''}
            ${escapeHtml(f.label)} <span class="filter-count">${counts[f.value] || 0}</span>
        </button>
    `).join('');
    bar.querySelectorAll('[data-msg-filter]').forEach(btn => {
        btn.onclick = () => {
            messagesFilter = btn.getAttribute('data-msg-filter');
            renderMessagesFilters();
            renderMessages();
        };
    });

    // Stats summary in header
    const stats = $('messagesStats');
    if (stats) {
        const unread = messagesItems.filter(m => !m.isRead).length;
        stats.innerHTML = `
            <span class="stat-pill" style="background:#dbeafe; color:#1e40af;">
                <i class="fas fa-envelope"></i> סה״כ: ${messagesItems.length}
            </span>
            ${unread > 0 ? `
                <span class="stat-pill" style="background:#fee2e2; color:#991b1b;">
                    <i class="fas fa-circle"></i> ${unread} לא נקראו
                </span>
            ` : ''}
        `;
    }
}

function renderMessages() {
    const list = $('messagesList');
    if (!list) return;

    const filtered = messagesFilter === 'all'
        ? messagesItems
        : messagesItems.filter(m => m.status === messagesFilter);

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>${messagesItems.length === 0 ? 'אין הודעות עדיין. כשיגיעו דרך טופס "צור קשר" באתר — הן יופיעו כאן.' : 'אין הודעות בקטגוריה זו'}</p>
            </div>`;
        renderBulkActionBar();
        return;
    }

    const allSelected = filtered.every(m => selectedMessageIds.has(m.id));

    list.innerHTML = `
        <div class="messages-select-all">
            <label class="msg-checkbox-label">
                <input type="checkbox" id="selectAllMessages" ${allSelected ? 'checked' : ''}>
                <span>${allSelected ? 'בטל בחירה' : 'בחר הכל'}</span>
            </label>
        </div>
    ` + filtered.map(m => {
        const status = MSG_STATUS[m.status || 'new'];
        const isRead = m.isRead;
        const isSelected = selectedMessageIds.has(m.id);
        return `
            <div class="message-item ${isRead ? '' : 'unread'} ${isSelected ? 'selected' : ''} status-${m.status || 'new'}" data-msg-id="${m.id}">
                <div class="message-status-bar" style="background: ${status.color}"></div>
                <div class="message-checkbox-wrap" data-checkbox-zone="${m.id}" title="סמן הודעה">
                    <input type="checkbox" class="msg-select-checkbox" data-msg-check="${m.id}" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="message-main">
                    <div class="message-row-top">
                        <div class="message-from">
                            ${!isRead ? '<span class="unread-dot"></span>' : ''}
                            <strong>${escapeHtml(m.name || 'אנונימי')}</strong>
                            <span class="message-subject-tag">${escapeHtml(m.subject || SUBJECT_LABELS[m.subjectKey] || 'כללי')}</span>
                        </div>
                        <div class="message-time">${formatRelativeTime(m.createdAt)}</div>
                    </div>
                    <div class="message-preview">${escapeHtml((m.content || '').substring(0, 120))}${(m.content || '').length > 120 ? '...' : ''}</div>
                    <div class="message-meta">
                        <span><i class="fas fa-phone"></i> ${escapeHtml(m.phone || '—')}</span>
                        <span><i class="fas fa-envelope"></i> ${escapeHtml(m.email || '—')}</span>
                        <span class="status-badge" style="background: ${status.color}20; color: ${status.color}">
                            <i class="fas fa-${status.icon}"></i> ${status.label}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Event delegation - single handler on the list itself, works regardless of re-renders
    if (!list._delegatedClick) {
        list._delegatedClick = true;
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.message-item');
            if (!item) {
                return;
            }
            const id = item.getAttribute('data-msg-id');
            if (!id) return;

            // If click was inside the checkbox zone — handle selection only
            const zone = e.target.closest('[data-checkbox-zone]');
            if (zone) {
                e.preventDefault();
                e.stopPropagation();
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                if (checkbox.checked) selectedMessageIds.add(id);
                else selectedMessageIds.delete(id);
                item.classList.toggle('selected', checkbox.checked);
                renderBulkActionBar();
                const filteredNow = messagesFilter === 'all' ? messagesItems : messagesItems.filter(m => m.status === messagesFilter);
                const all = filteredNow.length > 0 && filteredNow.every(m => selectedMessageIds.has(m.id));
                const selAll = $('selectAllMessages');
                if (selAll) selAll.checked = all;
                return;
            }

            openMessage(id);
        });
    }

    const selectAll = $('selectAllMessages');
    if (selectAll) {
        selectAll.onchange = () => {
            if (selectAll.checked) {
                filtered.forEach(m => selectedMessageIds.add(m.id));
            } else {
                filtered.forEach(m => selectedMessageIds.delete(m.id));
            }
            renderMessages();
            renderBulkActionBar();
        };
    }

    renderBulkActionBar();
}

function renderBulkActionBar() {
    let bar = document.getElementById('bulkActionBar');
    if (selectedMessageIds.size === 0) {
        if (bar) bar.remove();
        return;
    }
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'bulkActionBar';
        bar.className = 'bulk-action-bar';
        document.body.appendChild(bar);
    }
    const templateCount = quickRepliesItems.length;
    bar.innerHTML = `
        <div class="bulk-action-content">
            <div class="bulk-action-count">
                <i class="fas fa-check-square"></i>
                <strong>${selectedMessageIds.size}</strong> נבחרו
            </div>
            <div class="bulk-action-buttons">
                <button class="bulk-btn quick-reply" id="bulkQuickReplyBtn" title="שלח תשובה מתבנית שמורה">
                    <i class="fas fa-bolt"></i> תגובה מהירה
                    ${templateCount > 0 ? `<span class="bulk-btn-badge">${templateCount}</span>` : ''}
                </button>
                <button class="bulk-btn whatsapp" id="bulkWhatsappBtn" title="כתוב תגובה ושלח בוואטסאפ לכולם">
                    <i class="fab fa-whatsapp"></i> וואטסאפ
                </button>
                <button class="bulk-btn email" id="bulkEmailBtn" title="כתוב תגובה ושלח במייל לכולם">
                    <i class="fas fa-envelope"></i> מייל
                </button>
                <button class="bulk-btn status" id="bulkStatusBtn" title="שנה סטטוס">
                    <i class="fas fa-flag"></i> סטטוס
                </button>
                <button class="bulk-btn delete" id="bulkDeleteBtn" title="מחק את כל הנבחרים">
                    <i class="fas fa-trash"></i> מחק
                </button>
                <button class="bulk-btn cancel" id="bulkCancelBtn" title="בטל בחירה">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    document.getElementById('bulkCancelBtn').onclick = () => {
        selectedMessageIds.clear();
        renderMessages();
    };

    document.getElementById('bulkQuickReplyBtn').onclick = () => openBulkQuickReplyModal();
    document.getElementById('bulkWhatsappBtn').onclick = () => openBulkReplyModal('whatsapp');
    document.getElementById('bulkEmailBtn').onclick = () => openBulkReplyModal('email');
    document.getElementById('bulkStatusBtn').onclick = () => openBulkStatusModal();
    document.getElementById('bulkDeleteBtn').onclick = () => bulkDelete();
}

function openBulkQuickReplyModal() {
    const ids = [...selectedMessageIds];
    const selectedMessages = messagesItems.filter(m => ids.includes(m.id));

    // No templates yet — guide the user to create them
    if (quickRepliesItems.length === 0) {
        const html = `
            <div class="modal-header">
                <h3><i class="fas fa-bolt"></i> תגובה מהירה</h3>
                <button class="modal-close" data-modal-close>×</button>
            </div>
            <div class="empty-state" style="padding: 40px 20px; text-align: center;">
                <i class="fas fa-bolt" style="font-size: 56px; color: #fbbf24; margin-bottom: 16px;"></i>
                <h4 style="margin-bottom: 10px; font-size: 18px;">אין עדיין תבניות תשובה</h4>
                <p style="color: var(--admin-text-muted); margin-bottom: 24px; max-width: 480px; margin-left: auto; margin-right: auto;">
                    תשובות מהירות חוסכות זמן יקר. צור תבניות נפוצות כמו "תודה על פנייתך", "מחיר מנוי", "שעות פעילות" — ושלח אותן בלחיצה אחת לכל הלקוחות שסימנת.
                </p>
                <button class="btn-primary" id="goCreateTemplatesBtn">
                    <i class="fas fa-plus"></i> צור תבנית ראשונה עכשיו
                </button>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" data-modal-close>סגור</button>
            </div>
        `;
        showModal(html, null);
        document.getElementById('goCreateTemplatesBtn').onclick = () => {
            closeModal();
            // Switch to "תשובות שמורות" sub-tab inside the Inbox
            $$('.inbox-tab').forEach(t => {
                t.classList.toggle('active', t.getAttribute('data-inbox-tab') === 'replies');
            });
            $$('.inbox-tab-content').forEach(c => {
                c.classList.toggle('active', c.id === 'inbox-content-replies');
            });
            setTimeout(() => showQuickReplyForm(), 200);
        };
        return;
    }

    // Templates exist — show them prominently as cards with channel actions
    const html = `
        <div class="modal-header">
            <h3><i class="fas fa-bolt"></i> תגובה מהירה ל-${ids.length} נבחרים</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <p class="section-desc">
            לחץ על "שלח" ליד תבנית כדי לשלוח אותה לכל הלקוחות הנבחרים. <code>[שם]</code> ו-<code>[נושא]</code> יוחלפו אוטומטית.
        </p>
        <div class="bulk-quick-templates">
            ${quickRepliesItems.map(r => `
                <div class="bulk-template-card">
                    <div class="bulk-template-header">
                        <span class="bulk-template-icon">${r.icon || '💬'}</span>
                        <strong>${escapeHtml(r.title)}</strong>
                    </div>
                    <div class="bulk-template-preview">${escapeHtml((r.content || '').substring(0, 160))}${(r.content || '').length > 160 ? '...' : ''}</div>
                    <div class="bulk-template-actions">
                        <button class="reply-btn whatsapp small" data-tmpl-channel="whatsapp" data-tmpl-id="${r.id}">
                            <i class="fab fa-whatsapp"></i> שלח בוואטסאפ
                        </button>
                        <button class="reply-btn email small" data-tmpl-channel="email" data-tmpl-id="${r.id}">
                            <i class="fas fa-envelope"></i> שלח במייל
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>סגור</button>
        </div>
    `;
    showModal(html, null);

    document.querySelectorAll('[data-tmpl-id]').forEach(btn => {
        btn.onclick = () => {
            const tid = btn.getAttribute('data-tmpl-id');
            const channel = btn.getAttribute('data-tmpl-channel');
            const tmpl = quickRepliesItems.find(it => it.id === tid);
            if (!tmpl) return;

            if (channel === 'whatsapp') {
                selectedMessages.forEach(m => {
                    const text = (tmpl.content || '').replace(/\[שם\]/g, m.name || '').replace(/\[נושא\]/g, m.subject || '');
                    const url = `https://wa.me/${formatPhoneForWhatsApp(m.phone)}?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                });
                showToast(`📱 ${selectedMessages.length} צ׳אטים נפתחו בוואטסאפ`);
            } else {
                const emails = selectedMessages.map(m => m.email).filter(Boolean).join(',');
                const text = (tmpl.content || '').replace(/\[שם\]/g, 'לקוח/ה יקר/ה').replace(/\[נושא\]/g, '');
                const url = `mailto:?bcc=${emails}&subject=${encodeURIComponent('פארק המים יבנה')}&body=${encodeURIComponent(text)}`;
                window.location.href = url;
                showToast('✉️ המייל נפתח עם BCC לכל הנבחרים');
            }
            closeModal();
        };
    });
}

async function bulkDelete() {
    if (!confirm(`האם למחוק ${selectedMessageIds.size} הודעות נבחרות?`)) return;
    const ids = [...selectedMessageIds];
    try {
        await Promise.all(ids.map(id => deleteDoc(doc(db, 'messages', id))));
        selectedMessageIds.clear();
        await loadMessages();
        showToast(`${ids.length} הודעות נמחקו`);
    } catch (e) {
        showToast('שגיאה במחיקה: ' + e.message, 'error');
    }
}

function openBulkStatusModal() {
    const ids = [...selectedMessageIds];
    const html = `
        <div class="modal-header">
            <h3><i class="fas fa-flag"></i> שנה סטטוס ל-${ids.length} הודעות</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <p class="section-desc">בחר את הסטטוס שיוגדר לכל ההודעות הנבחרות:</p>
        <div class="msg-status-buttons" style="justify-content: center; margin: 20px 0;">
            ${Object.keys(MSG_STATUS).map(key => {
                const s = MSG_STATUS[key];
                return `
                    <button class="status-change-btn" data-bulk-status="${key}" style="--status-color: ${s.color}">
                        <i class="fas fa-${s.icon}"></i> ${s.label}
                    </button>
                `;
            }).join('')}
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
        </div>
    `;
    showModal(html, null);
    document.querySelectorAll('[data-bulk-status]').forEach(btn => {
        btn.onclick = async () => {
            const newStatus = btn.getAttribute('data-bulk-status');
            try {
                await Promise.all(ids.map(id => updateDoc(doc(db, 'messages', id), { status: newStatus })));
                selectedMessageIds.clear();
                closeModal();
                await loadMessages();
                showToast(`${ids.length} הודעות עודכנו ל"${MSG_STATUS[newStatus].label}"`);
            } catch (e) {
                showToast('שגיאה: ' + e.message, 'error');
            }
        };
    });
}

function openBulkReplyModal(channel) {
    const ids = [...selectedMessageIds];
    const selectedMessages = messagesItems.filter(m => ids.includes(m.id));

    const html = `
        <div class="modal-header">
            <h3><i class="fa${channel === 'whatsapp' ? 'b fa-whatsapp' : 's fa-envelope'}"></i>
                ${channel === 'whatsapp' ? 'וואטסאפ' : 'מייל'} ל-${ids.length} נבחרים
            </h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>

        ${quickRepliesItems.length > 0 ? `
            <div class="form-group">
                <label><i class="fas fa-bolt"></i> תשובה מהירה (לחץ להכניס)</label>
                <div class="quick-reply-chips">
                    ${quickRepliesItems.map(r => `
                        <button type="button" class="quick-reply-chip" data-bulk-template="${r.id}">
                            <span>${r.icon || '💬'}</span> ${escapeHtml(r.title)}
                        </button>
                    `).join('')}
                </div>
            </div>
        ` : `
            <div class="info-box" style="margin-bottom: 16px;">
                <i class="fas fa-lightbulb"></i>
                <div>💡 צור תשובות מהירות בטאב "תשובות מהירות" כדי להכניס תוכן בלחיצה</div>
            </div>
        `}

        <div class="form-group">
            <label>תוכן ההודעה (זהה לכולם — <code>[שם]</code> יוחלף אוטומטית)</label>
            <textarea id="bulkReplyText" rows="7" placeholder="שלום [שם], בהמשך לפנייתך לפארק המים יבנה...">שלום [שם],&#10;בהמשך לפנייתך לפארק המים יבנה,&#10;</textarea>
        </div>

        <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <div>
                ${channel === 'whatsapp'
                    ? `<strong>שים לב:</strong> כל לקוח ייפתח ב-tab נפרד של WhatsApp Web. תצטרך ללחוץ "שלח" בכל אחד.`
                    : `<strong>שים לב:</strong> אם דפדפן יחסום פתיחת חלונות מרובים — צריך לאשר אותה פעם ראשונה.`}
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" id="sendBulkBtn">
                <i class="fas fa-paper-plane"></i> שלח ל-${ids.length} נבחרים
            </button>
        </div>
    `;

    showModal(html, null);

    // Wire quick reply chips
    document.querySelectorAll('[data-bulk-template]').forEach(chip => {
        chip.onclick = () => {
            const id = chip.getAttribute('data-bulk-template');
            const tmpl = quickRepliesItems.find(it => it.id === id);
            if (tmpl) {
                document.getElementById('bulkReplyText').value = tmpl.content;
                document.querySelectorAll('[data-bulk-template]').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            }
        };
    });

    document.getElementById('sendBulkBtn').onclick = () => {
        const template = document.getElementById('bulkReplyText').value;
        if (!template.trim()) {
            showToast('יש להזין תוכן הודעה', 'error');
            return;
        }

        if (channel === 'whatsapp') {
            selectedMessages.forEach(m => {
                const text = template
                    .replace(/\[שם\]/g, m.name || '')
                    .replace(/\[נושא\]/g, m.subject || '');
                const url = `https://wa.me/${formatPhoneForWhatsApp(m.phone)}?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            });
            showToast(`${selectedMessages.length} צ׳אטים נפתחו בוואטסאפ`);
        } else {
            // Single email with multiple recipients
            const emails = selectedMessages.map(m => m.email).filter(Boolean).join(',');
            const text = template.replace(/\[שם\]/g, 'לקוח/ה יקר/ה');
            const url = `mailto:?bcc=${emails}&subject=${encodeURIComponent('פארק המים יבנה - מענה לפנייתך')}&body=${encodeURIComponent(text)}`;
            window.location.href = url;
            showToast('המייל נפתח עם BCC לכל הנבחרים');
        }
        closeModal();
    };
}

async function openMessage(id) {
    const m = messagesItems.find(it => it.id === id);
    if (!m) {
        console.error('❌ Message not found in messagesItems!', id);
        return;
    }

    // Mark as read (optimistic, but defer renderMessages until AFTER modal opens)
    const wasUnread = !m.isRead;
    const wasNew = m.status === 'new';
    if (wasUnread) {
        m.isRead = true;
        if (wasNew) m.status = 'in_progress';
        updateMessagesBadge();
        // Don't re-render yet — that destroys the clicked element. Update Firestore in background.
        updateDoc(doc(db, 'messages', id), {
            isRead: true,
            status: wasNew ? 'in_progress' : m.status
        }).catch(e => console.error('Failed to mark as read in Firestore:', e));
    }

    const status = MSG_STATUS[m.status || 'new'];
    const waPhone = formatPhoneForWhatsApp(m.phone);
    const defaultText = `שלום ${m.name}, בהמשך לפנייתך לפארק המים יבנה - `;
    const emailSubj = `מענה לפנייתך: ${m.subject || 'פארק המים יבנה'}`;
    const emailDefaultBody = `שלום ${m.name},\n\nבהמשך לפנייתך:\n"${m.content}"\n\n`;
    const emailUrl = `mailto:${m.email}?subject=${encodeURIComponent(emailSubj)}&body=${encodeURIComponent(emailDefaultBody)}`;
    const telUrl = `tel:${m.phone}`;
    const fullDate = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString('he-IL') : '—';

    // Helper: process template placeholders
    const fillTemplate = (txt) => (txt || '').replace(/\[שם\]/g, m.name || '').replace(/\[נושא\]/g, m.subject || '');

    const html = `
        <div class="modal-header">
            <h3><i class="fas fa-envelope-open"></i> הודעה מ${escapeHtml(m.name)}</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>

        <div class="msg-detail-card">
            <div class="msg-detail-row">
                <span class="msg-label"><i class="fas fa-user"></i> שם</span>
                <span class="msg-value">${escapeHtml(m.name || '—')}</span>
            </div>
            <div class="msg-detail-row">
                <span class="msg-label"><i class="fas fa-phone"></i> טלפון</span>
                <span class="msg-value"><a href="${telUrl}">${escapeHtml(m.phone || '—')}</a></span>
            </div>
            <div class="msg-detail-row">
                <span class="msg-label"><i class="fas fa-envelope"></i> דוא״ל</span>
                <span class="msg-value"><a href="${emailUrl}">${escapeHtml(m.email || '—')}</a></span>
            </div>
            <div class="msg-detail-row">
                <span class="msg-label"><i class="fas fa-tag"></i> נושא</span>
                <span class="msg-value">${escapeHtml(m.subject || '—')}</span>
            </div>
            <div class="msg-detail-row">
                <span class="msg-label"><i class="fas fa-clock"></i> נשלח</span>
                <span class="msg-value">${escapeHtml(fullDate)}</span>
            </div>
        </div>

        <div class="msg-content-box">
            <div class="msg-content-label">תוכן ההודעה:</div>
            <div class="msg-content-text">${escapeHtml(m.content || '')}</div>
        </div>

        ${quickRepliesItems.length > 0 ? `
            <div class="msg-quick-replies">
                <h4><i class="fas fa-bolt"></i> תשובה מהירה (לחץ להכניס לטקסט)</h4>
                <div class="quick-reply-chips">
                    ${quickRepliesItems.map(r => `
                        <button type="button" class="quick-reply-chip" data-msg-template="${r.id}">
                            <span>${r.icon || '💬'}</span> ${escapeHtml(r.title)}
                        </button>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div class="msg-reply-section">
            <h4><i class="fas fa-reply"></i> מענה ללקוח</h4>
            <div class="form-group" style="margin-bottom: 14px;">
                <label>תוכן המענה (אפשר לערוך לפני שליחה)</label>
                <textarea id="msgReplyText" rows="5" placeholder="כתוב כאן את התשובה...">${escapeHtml(defaultText)}</textarea>
            </div>
            <div class="msg-reply-buttons">
                <button type="button" class="reply-btn whatsapp" id="replyWhatsapp">
                    <i class="fab fa-whatsapp"></i>
                    <div>
                        <strong>וואטסאפ</strong>
                        <span>תגובה מהירה</span>
                    </div>
                </button>
                <button type="button" class="reply-btn email" id="replyEmail">
                    <i class="fas fa-envelope"></i>
                    <div>
                        <strong>מייל</strong>
                        <span>תגובה רשמית</span>
                    </div>
                </button>
                <a href="${telUrl}" class="reply-btn phone">
                    <i class="fas fa-phone"></i>
                    <div>
                        <strong>חיוג</strong>
                        <span>שיחה ישירה</span>
                    </div>
                </a>
            </div>
        </div>

        <div class="msg-status-section">
            <h4><i class="fas fa-flag"></i> שנה סטטוס</h4>
            <div class="msg-status-buttons">
                ${Object.keys(MSG_STATUS).map(key => {
                    const s = MSG_STATUS[key];
                    const isActive = (m.status || 'new') === key;
                    return `
                        <button class="status-change-btn ${isActive ? 'active' : ''}" data-set-status="${key}"
                                style="--status-color: ${s.color}">
                            <i class="fas fa-${s.icon}"></i> ${s.label}
                        </button>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-danger" id="deleteMsgBtn"><i class="fas fa-trash"></i> מחק הודעה</button>
            <button class="btn-secondary" data-modal-close>סגור</button>
        </div>
    `;

    showModal(html, null);

    const modal = $('modal');
    const replyTextarea = modal.querySelector('#msgReplyText');

    // Wire quick reply template chips
    modal.querySelectorAll('[data-msg-template]').forEach(chip => {
        chip.onclick = () => {
            const tid = chip.getAttribute('data-msg-template');
            const tmpl = quickRepliesItems.find(it => it.id === tid);
            if (tmpl && replyTextarea) {
                replyTextarea.value = fillTemplate(tmpl.content);
                modal.querySelectorAll('[data-msg-template]').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            }
        };
    });

    // Wire dynamic WhatsApp / Email buttons (use current textarea value)
    modal.querySelector('#replyWhatsapp').onclick = () => {
        const text = replyTextarea.value;
        const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };
    modal.querySelector('#replyEmail').onclick = () => {
        const text = replyTextarea.value;
        const url = `mailto:${m.email}?subject=${encodeURIComponent(emailSubj)}&body=${encodeURIComponent(text || emailDefaultBody)}`;
        window.location.href = url;
    };

    modal.querySelectorAll('[data-set-status]').forEach(btn => {
        btn.onclick = async () => {
            const newStatus = btn.getAttribute('data-set-status');
            try {
                await updateDoc(doc(db, 'messages', id), { status: newStatus });
                m.status = newStatus;
                modal.querySelectorAll('[data-set-status]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderMessagesFilters();
                renderMessages();
                showToast(`סטטוס שונה ל"${MSG_STATUS[newStatus].label}"`);
            } catch (e) {
                showToast('שגיאה: ' + e.message, 'error');
            }
        };
    });

    modal.querySelector('#deleteMsgBtn').onclick = async () => {
        if (!confirm('האם למחוק את ההודעה לצמיתות?')) return;
        try {
            await deleteDoc(doc(db, 'messages', id));
            closeModal();
            await loadMessages();
            showToast('ההודעה נמחקה');
        } catch (e) {
            showToast('שגיאה: ' + e.message, 'error');
        }
    };

    // Re-render messages list AFTER modal is shown (so read-state is reflected)
    renderMessagesFilters();
    renderMessages();
}

// ============================================
// News Management
// ============================================
async function loadNews() {
    const list = $('newsList');

    let newsItems = [];
    if (DEMO_MODE) {
        newsItems = demoData.news;
    } else if (isInitialized) {
        try {
            const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            newsItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error(e);
        }
    }

    if (newsItems.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <p>אין הודעות עדיין. לחץ "הוספת הודעה" כדי להתחיל!</p>
            </div>`;
        $('statNews').textContent = '0';
        return;
    }

    $('statNews').textContent = newsItems.length;
    list.innerHTML = newsItems.map((item, idx) => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(item.title)}</div>
                <div class="list-item-meta">${item.date || ''} • ${escapeHtml((item.content || '').substring(0, 100))}...</div>
            </div>
            <div class="list-item-actions">
                <button class="icon-btn" data-news-up="${item.id}" title="העלה" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                <button class="icon-btn" data-news-down="${item.id}" title="הורד" ${idx === newsItems.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                <button class="icon-btn" data-edit-news="${item.id}" title="ערוך"><i class="fas fa-edit"></i></button>
                <button class="icon-btn danger" data-delete-news="${item.id}" title="מחק"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    // Bind buttons
    list.querySelectorAll('[data-edit-news]').forEach(btn => {
        btn.onclick = () => editNews(btn.getAttribute('data-edit-news'));
    });
    list.querySelectorAll('[data-delete-news]').forEach(btn => {
        btn.onclick = () => deleteNews(btn.getAttribute('data-delete-news'));
    });
    list.querySelectorAll('[data-news-up]').forEach(btn => {
        btn.onclick = () => moveNewsByDate(btn.getAttribute('data-news-up'), -1);
    });
    list.querySelectorAll('[data-news-down]').forEach(btn => {
        btn.onclick = () => moveNewsByDate(btn.getAttribute('data-news-down'), 1);
    });
}

// Swap createdAt timestamps with neighbor to reorder
async function moveNewsByDate(id, direction) {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const idx = items.findIndex(it => it.id === id);
        const newIdx = idx + direction;
        if (idx === -1 || newIdx < 0 || newIdx >= items.length) return;

        const a = items[idx], b = items[newIdx];
        await updateDoc(doc(db, 'news', a.id), { createdAt: b.createdAt });
        await updateDoc(doc(db, 'news', b.id), { createdAt: a.createdAt });
        await loadNews();
    } catch (e) {
        console.error('Reorder failed:', e);
    }
}

// Preset CTA button texts (user can also enter custom)
const NEWS_CTA_PRESETS = [
    'קרא עוד',
    'צפו בסרטון',
    'צפו בתמונות',
    'לפרטים מלאים',
    'להרשמה',
    'לתוצאות המלאות',
    'הזמן ביקור',
    'צור קשר'
];

function showNewsForm(existing = null) {
    const ctaText = existing?.ctaText || '';
    const ctaUrl = existing?.ctaUrl || '';
    const hasCta = !!(ctaText && ctaUrl);

    const html = `
        <div class="modal-header">
            <h3>${existing ? 'עריכת הודעה' : 'הודעה חדשה'}</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <div class="form-group">
            <label>כותרת</label>
            <input type="text" id="newsTitle" value="${escapeHtml(existing?.title || '')}" placeholder="לדוגמה: שעות פעילות מיוחדות">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>תאריך</label>
                <input type="date" id="newsDate" value="${existing?.date || new Date().toISOString().slice(0,10)}">
            </div>
            <div class="form-group">
                <label>סוג</label>
                <select id="newsType">
                    <option value="info" ${existing?.type === 'info' ? 'selected' : ''}>📘 מידע רגיל</option>
                    <option value="important" ${existing?.type === 'important' ? 'selected' : ''}>⭐ חשוב</option>
                    <option value="urgent" ${existing?.type === 'urgent' ? 'selected' : ''}>🚨 דחוף</option>
                    <option value="event" ${existing?.type === 'event' ? 'selected' : ''}>🎉 אירוע</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>תוכן ההודעה</label>
            <textarea id="newsContent" rows="6" placeholder="כתוב כאן את תוכן ההודעה...">${escapeHtml(existing?.content || '')}</textarea>
        </div>

        <div class="form-group" style="background: #f1f5f9; padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 700; margin-bottom: 10px;">
                <input type="checkbox" id="newsHasCta" ${hasCta ? 'checked' : ''}>
                <span>🔗 הוסף כפתור פעולה (CTA) להודעה</span>
            </label>
            <div id="newsCtaFields" style="${hasCta ? '' : 'display: none;'}">
                <div class="form-row">
                    <div class="form-group">
                        <label>טקסט הכפתור</label>
                        <select id="newsCtaPreset" style="margin-bottom: 8px;">
                            <option value="">-- בחר טקסט מוכן או הקלד למטה --</option>
                            ${NEWS_CTA_PRESETS.map(p => `<option value="${escapeHtml(p)}" ${ctaText === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
                            <option value="__custom__" ${ctaText && !NEWS_CTA_PRESETS.includes(ctaText) ? 'selected' : ''}>✏️ טקסט מותאם...</option>
                        </select>
                        <input type="text" id="newsCtaText" value="${escapeHtml(ctaText)}" placeholder="קרא עוד">
                    </div>
                    <div class="form-group">
                        <label>קישור (URL)</label>
                        <input type="text" id="newsCtaUrl" value="${escapeHtml(ctaUrl)}" placeholder="event-summer-opening-2026.html או https://...">
                    </div>
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                    💡 דוגמאות: <code>event-summer-opening-2026.html</code> (דף באתר) או <code>https://...</code> (קישור חיצוני)
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" data-modal-save><i class="fas fa-save"></i> שמירה</button>
        </div>
    `;

    showModal(html, async (modal) => {
        const hasCta = modal.querySelector('#newsHasCta').checked;
        const data = {
            title: modal.querySelector('#newsTitle').value.trim(),
            date: modal.querySelector('#newsDate').value,
            type: modal.querySelector('#newsType').value,
            content: modal.querySelector('#newsContent').value.trim(),
            ctaText: hasCta ? modal.querySelector('#newsCtaText').value.trim() : '',
            ctaUrl: hasCta ? modal.querySelector('#newsCtaUrl').value.trim() : ''
        };

        if (!data.title || !data.content) {
            showToast('יש למלא כותרת ותוכן', 'error');
            return;
        }
        if (hasCta && (!data.ctaText || !data.ctaUrl)) {
            showToast('סימנת "הוסף כפתור" — יש למלא טקסט וקישור', 'error');
            return;
        }

        try {
            if (DEMO_MODE) {
                if (existing) {
                    Object.assign(existing, data);
                } else {
                    demoData.news.unshift({ id: 'demo' + Date.now(), ...data });
                }
            } else if (isInitialized) {
                if (existing) {
                    await updateDoc(doc(db, 'news', existing.id), data);
                } else {
                    await addDoc(collection(db, 'news'), { ...data, createdAt: serverTimestamp() });
                }
            }
            closeModal();
            await loadNews();
            showToast(existing ? 'ההודעה עודכנה' : 'הודעה חדשה נוספה!');
        } catch (e) {
            showToast('שגיאה בשמירה', 'error');
            console.error(e);
        }
    });

    // Wire CTA section visibility
    setTimeout(() => {
        const cb = document.getElementById('newsHasCta');
        const fields = document.getElementById('newsCtaFields');
        const presetSelect = document.getElementById('newsCtaPreset');
        const textInput = document.getElementById('newsCtaText');

        cb?.addEventListener('change', () => {
            fields.style.display = cb.checked ? 'block' : 'none';
        });

        // When preset is selected, fill the text input
        presetSelect?.addEventListener('change', () => {
            const val = presetSelect.value;
            if (val && val !== '__custom__') {
                textInput.value = val;
            } else if (val === '__custom__') {
                textInput.focus();
            }
        });
    }, 50);
}

async function editNews(id) {
    let item;
    if (DEMO_MODE) {
        item = demoData.news.find(n => n.id === id);
    } else if (isInitialized) {
        const snap = await getDoc(doc(db, 'news', id));
        if (snap.exists()) item = { id, ...snap.data() };
    }
    if (item) showNewsForm(item);
}

async function deleteNews(id) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההודעה?')) return;
    try {
        if (DEMO_MODE) {
            demoData.news = demoData.news.filter(n => n.id !== id);
        } else if (isInitialized) {
            await deleteDoc(doc(db, 'news', id));
        }
        await loadNews();
        showToast('ההודעה נמחקה');
    } catch (e) {
        showToast('שגיאה במחיקה', 'error');
    }
}

// ============================================
// Hours Management - Full editor with Firebase sync
// ============================================
let hoursData = null;

async function loadHours() {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const snap = await getDoc(doc(db, 'settings', 'hours'));
        if (snap.exists()) {
            hoursData = snap.data();
            const period = hoursData.period || {};
            if ($('hoursStartDate')) $('hoursStartDate').value = period.start || '';
            if ($('hoursEndDate')) $('hoursEndDate').value = period.end || '';
        }
    } catch (e) {
        console.error('Failed to load hours:', e);
    }
    buildHoursEditor();
}

function buildHoursEditor() {
    const editor = $('hoursEditor');
    if (!editor) return;

    const facilities = (hoursData && hoursData.facilities) || {
        office: { name: 'משרד', icon: 'building', order: 1, schedule: {} },
        amorphic: { name: 'בריכה אמורפית', icon: 'swimming-pool', order: 2, schedule: {} },
        toddler: { name: 'בריכת פעוטות', icon: 'baby', order: 3, schedule: {} },
        slides: { name: 'מגלשות מים', icon: 'water', order: 4, schedule: {} },
        indoor: { name: 'בריכה מקורה', icon: 'swimming-pool', order: 5, yearRound: true, schedule: {} },
        gym: { name: 'חדר כושר', icon: 'dumbbell', order: 6, yearRound: true, schedule: {} }
    };
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    const sortedKeys = Object.keys(facilities).sort((a, b) =>
        (facilities[a].order || 99) - (facilities[b].order || 99));

    editor.innerHTML = sortedKeys.map(fid => {
        const f = facilities[fid];
        const period = f.period || {};
        const enabled = f.enabled !== false; // default true
        return `
        <div class="facility-editor ${enabled ? '' : 'disabled'}" data-facility-card="${fid}">
            <div class="facility-header">
                <div class="facility-title">
                    <i class="fas fa-${f.icon || 'clock'}"></i>
                    <h4>${escapeHtml(f.name)}</h4>
                    <label class="status-toggle">
                        <input type="checkbox" data-facility-enabled="${fid}" ${enabled ? 'checked' : ''}>
                        <span class="toggle-track"><span class="toggle-knob"></span></span>
                        <span class="toggle-label">${enabled ? 'פעיל' : 'סגור עונתית'}</span>
                    </label>
                </div>
                <div class="facility-quick-actions">
                    <button class="quick-btn" data-quick-action="weekdays" data-facility-action="${fid}" title="העתק יום שני לכל ימי החול">
                        <i class="fas fa-copy"></i> העתק לימי חול
                    </button>
                    <button class="quick-btn" data-quick-action="closeall" data-facility-action="${fid}" title="סגור את כל הימים">
                        <i class="fas fa-times-circle"></i> סגור הכל
                    </button>
                </div>
            </div>

            <div class="facility-period">
                <div class="facility-period-label">
                    <i class="fas fa-calendar-alt"></i>
                    תקופת פעילות (אופציונלי - השאר ריק = פעיל לפי התקופה הראשית)
                </div>
                <div class="facility-period-inputs">
                    <input type="text" data-facility-period="${fid}" data-period-field="start"
                           value="${escapeHtml(period.start || '')}" placeholder="פתיחה (29.5.2026)">
                    <span class="period-sep">עד</span>
                    <input type="text" data-facility-period="${fid}" data-period-field="end"
                           value="${escapeHtml(period.end || '')}" placeholder="סגירה (31.8.2026)">
                </div>
            </div>

            <div class="facility-schedule">
                ${days.map((day, i) => {
                    const dayData = (f.schedule && f.schedule[i]) || {};
                    const isClosed = !dayData.open || !dayData.close;
                    const hasSegment2 = !!(dayData.open2 || dayData.close2);
                    return `
                    <div class="day-hours-row ${isClosed ? 'is-closed' : ''}">
                        <label>${day}</label>
                        <div class="day-segments">
                            <div class="day-segment">
                                <input type="time" data-facility="${fid}" data-day="${i}" data-field="open" value="${dayData.open || ''}" placeholder="פתיחה">
                                <input type="time" data-facility="${fid}" data-day="${i}" data-field="close" value="${dayData.close || ''}" placeholder="סגירה">
                            </div>
                            <div class="day-segment day-segment-2" style="${hasSegment2 ? '' : 'display:none;'}">
                                <span class="segment-sep">+</span>
                                <input type="time" data-facility="${fid}" data-day="${i}" data-field="open2" value="${dayData.open2 || ''}" placeholder="פתיחה 2">
                                <input type="time" data-facility="${fid}" data-day="${i}" data-field="close2" value="${dayData.close2 || ''}" placeholder="סגירה 2">
                            </div>
                            <button type="button" class="add-segment-btn" data-add-segment="${fid}|${i}" title="הוסף קטע נוסף ביום (למשל בוקר + ערב)" style="${hasSegment2 ? 'display:none;' : ''}">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button type="button" class="add-segment-btn remove" data-remove-segment="${fid}|${i}" title="הסר קטע 2" style="${hasSegment2 ? '' : 'display:none;'}">
                                <i class="fas fa-minus"></i>
                            </button>
                        </div>
                        <button class="icon-btn" data-clear="${fid}|${i}" title="סגור ביום זה"><i class="fas fa-times"></i></button>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    }).join('');

    // Per-day clear
    editor.querySelectorAll('[data-clear]').forEach(btn => {
        btn.onclick = () => {
            const [fid, day] = btn.getAttribute('data-clear').split('|');
            editor.querySelectorAll(`[data-facility="${fid}"][data-day="${day}"]`).forEach(inp => inp.value = '');
            btn.closest('.day-hours-row').classList.add('is-closed');
        };
    });

    // Add second segment for a day (split day: morning + evening)
    editor.querySelectorAll('[data-add-segment]').forEach(btn => {
        btn.onclick = () => {
            const row = btn.closest('.day-hours-row');
            row.querySelector('.day-segment-2').style.display = 'flex';
            btn.style.display = 'none';
            row.querySelector('[data-remove-segment]').style.display = '';
        };
    });
    editor.querySelectorAll('[data-remove-segment]').forEach(btn => {
        btn.onclick = () => {
            const row = btn.closest('.day-hours-row');
            const seg2 = row.querySelector('.day-segment-2');
            seg2.querySelectorAll('input').forEach(i => i.value = '');
            seg2.style.display = 'none';
            btn.style.display = 'none';
            row.querySelector('[data-add-segment]').style.display = '';
        };
    });

    // Re-check is-closed state when inputs change
    editor.querySelectorAll('input[type="time"]').forEach(inp => {
        inp.addEventListener('input', () => {
            const row = inp.closest('.day-hours-row');
            const open = row.querySelector('[data-field="open"]').value;
            const close = row.querySelector('[data-field="close"]').value;
            row.classList.toggle('is-closed', !open || !close);
        });
    });

    // Enable/disable facility toggle
    editor.querySelectorAll('[data-facility-enabled]').forEach(cb => {
        cb.addEventListener('change', () => {
            const card = cb.closest('[data-facility-card]');
            card.classList.toggle('disabled', !cb.checked);
            cb.parentElement.querySelector('.toggle-label').textContent = cb.checked ? 'פעיל' : 'סגור עונתית';
        });
    });

    // Quick actions: copy Monday to all weekdays / close all days
    editor.querySelectorAll('[data-quick-action]').forEach(btn => {
        btn.onclick = () => {
            const action = btn.getAttribute('data-quick-action');
            const fid = btn.getAttribute('data-facility-action');

            if (action === 'closeall') {
                if (!confirm('האם לסגור את כל הימים במתקן זה?')) return;
                editor.querySelectorAll(`[data-facility="${fid}"]`).forEach(inp => {
                    if (inp.type === 'time') inp.value = '';
                });
                editor.querySelectorAll(`[data-facility-card="${fid}"] .day-hours-row`).forEach(r => r.classList.add('is-closed'));
            } else if (action === 'weekdays') {
                const mondayOpen = editor.querySelector(`[data-facility="${fid}"][data-day="1"][data-field="open"]`)?.value;
                const mondayClose = editor.querySelector(`[data-facility="${fid}"][data-day="1"][data-field="close"]`)?.value;
                if (!mondayOpen || !mondayClose) {
                    showToast('מלא קודם את שעות יום שני', 'error');
                    return;
                }
                // Copy to Sun(0), Tue(2), Wed(3), Thu(4)
                [0, 2, 3, 4].forEach(d => {
                    const openInp = editor.querySelector(`[data-facility="${fid}"][data-day="${d}"][data-field="open"]`);
                    const closeInp = editor.querySelector(`[data-facility="${fid}"][data-day="${d}"][data-field="close"]`);
                    if (openInp) openInp.value = mondayOpen;
                    if (closeInp) closeInp.value = mondayClose;
                    openInp?.closest('.day-hours-row')?.classList.remove('is-closed');
                });
                showToast('הועתק לכל ימי החול ✓', 'success');
            }
        };
    });
}

async function saveHours() {
    if (DEMO_MODE || !isInitialized) {
        showToast('שמירה במצב הדגמה (לא נשמר אמיתי)', 'info');
        return;
    }

    const editor = $('hoursEditor');
    if (!editor) return;

    const facilities = (hoursData && hoursData.facilities) || {
        office: { name: 'משרד', icon: 'building', order: 1 },
        amorphic: { name: 'בריכה אמורפית', icon: 'swimming-pool', order: 2 },
        toddler: { name: 'בריכת פעוטות', icon: 'baby', order: 3 },
        slides: { name: 'מגלשות מים', icon: 'water', order: 4 },
        indoor: { name: 'בריכה מקורה', icon: 'swimming-pool', order: 5, yearRound: true },
        gym: { name: 'חדר כושר', icon: 'dumbbell', order: 6, yearRound: true }
    };

    // Read all input values
    Object.keys(facilities).forEach(fid => {
        if (!facilities[fid].schedule) facilities[fid].schedule = {};
        for (let i = 0; i < 7; i++) {
            const openInput = editor.querySelector(`[data-facility="${fid}"][data-day="${i}"][data-field="open"]`);
            const closeInput = editor.querySelector(`[data-facility="${fid}"][data-day="${i}"][data-field="close"]`);
            const open2Input = editor.querySelector(`[data-facility="${fid}"][data-day="${i}"][data-field="open2"]`);
            const close2Input = editor.querySelector(`[data-facility="${fid}"][data-day="${i}"][data-field="close2"]`);
            if (openInput && closeInput && openInput.value && closeInput.value) {
                const dayEntry = { open: openInput.value, close: closeInput.value };
                if (open2Input?.value && close2Input?.value) {
                    dayEntry.open2 = open2Input.value;
                    dayEntry.close2 = close2Input.value;
                }
                facilities[fid].schedule[i] = dayEntry;
            } else {
                delete facilities[fid].schedule[i];
            }
        }
        // Per-facility period
        const periodStart = editor.querySelector(`[data-facility-period="${fid}"][data-period-field="start"]`)?.value.trim() || '';
        const periodEnd = editor.querySelector(`[data-facility-period="${fid}"][data-period-field="end"]`)?.value.trim() || '';
        if (periodStart || periodEnd) {
            facilities[fid].period = { start: periodStart, end: periodEnd };
        } else {
            delete facilities[fid].period;
        }
        // Enabled toggle
        const enabledCheckbox = editor.querySelector(`[data-facility-enabled="${fid}"]`);
        facilities[fid].enabled = enabledCheckbox ? enabledCheckbox.checked : true;
    });

    const data = {
        period: {
            start: $('hoursStartDate')?.value || '',
            end: $('hoursEndDate')?.value || '',
            label: 'שעות פתיחה'
        },
        facilities: facilities
    };

    try {
        await setDoc(doc(db, 'settings', 'hours'), data);
        hoursData = data;
        showToast('שעות נשמרו בהצלחה!', 'success');
    } catch (e) {
        console.error(e);
        showToast('שגיאה בשמירה: ' + e.message, 'error');
    }
}

// ============================================
// Contact Management
// ============================================
async function loadContact() {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const snap = await getDoc(doc(db, 'settings', 'contact'));
        if (snap.exists()) {
            const data = snap.data();
            if ($('contactPhone')) $('contactPhone').value = data.phone || '';
            if ($('contactPhone2')) $('contactPhone2').value = data.phone2 || '';
            if ($('contactFax')) $('contactFax').value = data.fax || '';
            if ($('contactAddress')) $('contactAddress').value = data.address || '';
            if ($('contactEmail1')) $('contactEmail1').value = data.email1 || '';
            if ($('contactEmail2')) $('contactEmail2').value = data.email2 || '';
            const social = data.social || {};
            if ($('socialFacebook')) $('socialFacebook').value = social.facebook || '';
            if ($('socialInstagram')) $('socialInstagram').value = social.instagram || '';
            if ($('socialYoutube')) $('socialYoutube').value = social.youtube || '';
        }
    } catch (e) {
        console.error('Failed to load contact:', e);
    }
}

async function saveContact() {
    if (DEMO_MODE || !isInitialized) return;
    const data = {
        phone: $('contactPhone')?.value || '',
        phone2: $('contactPhone2')?.value || '',
        fax: $('contactFax')?.value || '',
        address: $('contactAddress')?.value || '',
        email1: $('contactEmail1')?.value || '',
        email2: $('contactEmail2')?.value || '',
        social: {
            facebook: $('socialFacebook')?.value || '',
            instagram: $('socialInstagram')?.value || '',
            youtube: $('socialYoutube')?.value || ''
        }
    };

    try {
        await setDoc(doc(db, 'settings', 'contact'), data);
        showToast('פרטי קשר נשמרו!', 'success');
    } catch (e) {
        showToast('שגיאה בשמירה: ' + e.message, 'error');
    }
}

// ============================================
// CEO / Management - Display + Modal Edit
// ============================================
let ceoData = {
    ceoName: 'לימור קרסנובסקי',
    ceoTitle: 'מנכ״לית הפארק',
    ceoDescription: 'ניהול שוטף של כל פעילות הפארק - מתקנים, חוגים, עובדים, אירועים וקשר עם החברים'
};

function ceoInitials(name) {
    if (!name) return '—';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return parts[0][0] + parts[1][0];
}

function renderCEODisplay() {
    if ($('ceoDisplayName')) $('ceoDisplayName').textContent = ceoData.ceoName || '—';
    if ($('ceoDisplayTitle')) $('ceoDisplayTitle').textContent = ceoData.ceoTitle || 'מנכ״ל/ית';
    if ($('ceoDisplayDescription')) $('ceoDisplayDescription').textContent = ceoData.ceoDescription || '';
    if ($('ceoDisplayAvatar')) $('ceoDisplayAvatar').textContent = ceoInitials(ceoData.ceoName);
}

async function loadCEO() {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const snap = await getDoc(doc(db, 'settings', 'management'));
        if (snap.exists()) {
            const data = snap.data();
            ceoData = {
                ceoName: data.ceoName || ceoData.ceoName,
                ceoTitle: data.ceoTitle || ceoData.ceoTitle,
                ceoDescription: data.ceoDescription || ceoData.ceoDescription
            };
        }
    } catch (e) {
        console.error('CEO load failed:', e);
    }
    renderCEODisplay();
}

function showCEOForm() {
    const html = `
        <div class="modal-header">
            <h3><i class="fas fa-user-tie"></i> עריכת פרטי מנכ״לית</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <div class="form-group">
            <label><i class="fas fa-user"></i> שם מלא</label>
            <input type="text" id="modalCeoName" value="${escapeHtml(ceoData.ceoName || '')}" placeholder="שם המנכ״ל/ית">
        </div>
        <div class="form-group">
            <label><i class="fas fa-briefcase"></i> תפקיד</label>
            <input type="text" id="modalCeoTitle" value="${escapeHtml(ceoData.ceoTitle || '')}" placeholder="מנכ״לית / מנכ״ל / מנהלת">
        </div>
        <div class="form-group">
            <label><i class="fas fa-align-right"></i> תיאור התפקיד</label>
            <textarea id="modalCeoDescription" rows="3" placeholder="יוצג מתחת לשם באתר">${escapeHtml(ceoData.ceoDescription || '')}</textarea>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" data-modal-save><i class="fas fa-save"></i> שמירה</button>
        </div>
    `;

    showModal(html, async (modal) => {
        const data = {
            ceoName: modal.querySelector('#modalCeoName').value.trim(),
            ceoTitle: modal.querySelector('#modalCeoTitle').value.trim() || 'מנכ״ל/ית',
            ceoDescription: modal.querySelector('#modalCeoDescription').value.trim()
        };
        if (!data.ceoName) {
            showToast('שם המנכ״ל/ית חובה', 'error');
            return;
        }
        try {
            await setDoc(doc(db, 'settings', 'management'), data);
            ceoData = data;
            renderCEODisplay();
            closeModal();
            showToast('פרטי המנכ״לית נשמרו!', 'success');
        } catch (e) {
            showToast('שגיאה: ' + e.message, 'error');
        }
    });
}

// ============================================
// Board Members Management
// ============================================
let boardData = null;

async function loadBoard() {
    if (DEMO_MODE || !isInitialized) return;
    const list = $('boardList');
    if (!list) return;

    try {
        const snap = await getDoc(doc(db, 'settings', 'board'));
        if (!snap.exists()) {
            list.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>אין חברי ועד עדיין</p></div>`;
            return;
        }

        boardData = snap.data();
        if ($('boardDate') && boardData.date) $('boardDate').value = boardData.date;

        const members = (boardData.members || []).sort((a, b) => (a.order || 99) - (b.order || 99));
        list.innerHTML = members.map((m, idx) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${m.isChairman ? '<span class="chair-tag">יו״ר</span> ' : ''}${escapeHtml(m.name)}</div>
                    <div class="list-item-meta">${escapeHtml(m.role || '')}</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn" data-board-up="${idx}" title="העלה" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                    <button class="icon-btn" data-board-down="${idx}" title="הורד" ${idx === members.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                    <button class="icon-btn" data-board-edit="${idx}" title="ערוך"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn danger" data-board-delete="${idx}" title="מחק"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-board-up]').forEach(btn => {
            btn.onclick = () => moveBoardMember(parseInt(btn.getAttribute('data-board-up')), -1);
        });
        list.querySelectorAll('[data-board-down]').forEach(btn => {
            btn.onclick = () => moveBoardMember(parseInt(btn.getAttribute('data-board-down')), 1);
        });
        list.querySelectorAll('[data-board-edit]').forEach(btn => {
            btn.onclick = () => editBoardMember(parseInt(btn.getAttribute('data-board-edit')));
        });
        list.querySelectorAll('[data-board-delete]').forEach(btn => {
            btn.onclick = () => deleteBoardMember(parseInt(btn.getAttribute('data-board-delete')));
        });
    } catch (e) {
        console.error('Failed to load board:', e);
    }
}

async function moveBoardMember(idx, direction) {
    if (!boardData || !boardData.members) return;
    const members = [...boardData.members].sort((a, b) => (a.order || 99) - (b.order || 99));
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= members.length) return;

    [members[idx], members[newIdx]] = [members[newIdx], members[idx]];
    members.forEach((m, i) => m.order = i + 1);

    boardData.members = members;
    await setDoc(doc(db, 'settings', 'board'), boardData);
    await loadBoard();
}

function showBoardForm(existing = null, idx = -1) {
    const html = `
        <div class="modal-header">
            <h3>${existing ? 'עריכת חבר ועד' : 'הוספת חבר ועד'}</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <div class="form-group">
            <label>שם מלא</label>
            <input type="text" id="boardName" value="${escapeHtml(existing?.name || '')}" placeholder="לדוגמה: דוד אנגל">
        </div>
        <div class="form-group">
            <label>תפקיד</label>
            <input type="text" id="boardRole" value="${escapeHtml(existing?.role || 'חבר ועד')}" placeholder="חבר ועד / יו״ר הוועד">
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="boardIsChair" ${existing?.isChairman ? 'checked' : ''}>
                <span style="margin-right: 8px;">⭐ יו״ר הוועד</span>
            </label>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" data-modal-save><i class="fas fa-save"></i> שמירה</button>
        </div>
    `;

    showModal(html, async (modal) => {
        const data = {
            name: modal.querySelector('#boardName').value.trim(),
            role: modal.querySelector('#boardRole').value.trim() || 'חבר ועד',
            isChairman: modal.querySelector('#boardIsChair').checked
        };

        if (!data.name) {
            showToast('שם מלא הוא שדה חובה', 'error');
            return;
        }

        if (!boardData) boardData = { date: '01.10.2025', members: [] };
        if (!boardData.members) boardData.members = [];

        if (idx >= 0) {
            data.order = boardData.members[idx].order;
            boardData.members[idx] = data;
        } else {
            data.order = boardData.members.length + 1;
            boardData.members.push(data);
        }

        await setDoc(doc(db, 'settings', 'board'), boardData);
        closeModal();
        await loadBoard();
        showToast(existing ? 'חבר ועד עודכן' : 'חבר ועד נוסף!');
    });
}

function editBoardMember(idx) {
    if (!boardData?.members?.[idx]) return;
    showBoardForm(boardData.members[idx], idx);
}

async function deleteBoardMember(idx) {
    if (!confirm('האם למחוק חבר ועד זה?')) return;
    if (!boardData?.members) return;
    boardData.members.splice(idx, 1);
    boardData.members.forEach((m, i) => m.order = i + 1);
    await setDoc(doc(db, 'settings', 'board'), boardData);
    await loadBoard();
    showToast('חבר ועד נמחק');
}

// ============================================
// Committees Management
// ============================================
let committeesItems = [];

async function loadCommittees() {
    if (DEMO_MODE || !isInitialized) return;
    const list = $('committeesList');
    if (!list) return;

    try {
        const snap = await getDocs(collection(db, 'committees'));
        committeesItems = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 99) - (b.order || 99));

        if (committeesItems.length === 0) {
            list.innerHTML = `<div class="empty-state"><i class="fas fa-balance-scale"></i><p>אין ועדות. לחץ "הוסף ועדה" להתחלה.</p></div>`;
            return;
        }

        list.innerHTML = committeesItems.map((c, idx) => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title"><i class="fas fa-${escapeHtml(c.icon || 'users')}"></i> ${escapeHtml(c.name)}</div>
                    <div class="list-item-meta">
                        <i class="fas fa-star"></i> ${escapeHtml(c.chair || 'ללא יו״ר')}
                        &nbsp;•&nbsp;
                        ${(c.members || []).length} חברים
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn" data-comm-up="${c.id}" title="העלה" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                    <button class="icon-btn" data-comm-down="${c.id}" title="הורד" ${idx === committeesItems.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                    <button class="icon-btn" data-comm-edit="${c.id}" title="ערוך"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn danger" data-comm-delete="${c.id}" title="מחק"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-comm-edit]').forEach(btn => {
            btn.onclick = () => editCommittee(btn.getAttribute('data-comm-edit'));
        });
        list.querySelectorAll('[data-comm-delete]').forEach(btn => {
            btn.onclick = () => deleteCommittee(btn.getAttribute('data-comm-delete'));
        });
        list.querySelectorAll('[data-comm-up]').forEach(btn => {
            btn.onclick = () => moveCommittee(btn.getAttribute('data-comm-up'), -1);
        });
        list.querySelectorAll('[data-comm-down]').forEach(btn => {
            btn.onclick = () => moveCommittee(btn.getAttribute('data-comm-down'), 1);
        });
    } catch (e) {
        console.error('Committees load failed:', e);
    }
}

function showCommitteeForm(existing = null) {
    const icons = [
        { value: 'coins', label: '💰 כספים' },
        { value: 'cogs', label: '⚙️ תפעול' },
        { value: 'balance-scale', label: '⚖️ משפטי' },
        { value: 'theater-masks', label: '🎭 תרבות' },
        { value: 'clipboard-check', label: '📋 ביקורת' },
        { value: 'gavel', label: '⚒️ בוררות' },
        { value: 'users', label: '👥 כללי' }
    ];

    const memberList = (existing?.members || ['']).map((m, i) => `
        <div class="form-row election-candidate-row" data-cm-row="${i}">
            <input type="text" placeholder="שם חבר ועדה" data-cm-name value="${escapeHtml(m || '')}">
            <button type="button" class="icon-btn danger" data-cm-remove><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    const html = `
        <div class="modal-header">
            <h3>${existing ? 'עריכת ועדה' : 'ועדה חדשה'}</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <div class="form-group">
            <label>שם הוועדה</label>
            <input type="text" id="commName" value="${escapeHtml(existing?.name || '')}" placeholder="לדוגמה: ועדת כספים">
        </div>
        <div class="form-group">
            <label>תיאור משני (אופציונלי)</label>
            <input type="text" id="commSubtitle" value="${escapeHtml(existing?.subtitle || '')}" placeholder="לדוגמה: תקנון, קבלה, משמעת">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>אייקון</label>
                <select id="commIcon">
                    ${icons.map(i => `<option value="${i.value}" ${existing?.icon === i.value ? 'selected' : ''}>${i.label}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>יו״ר הוועדה</label>
                <input type="text" id="commChair" value="${escapeHtml(existing?.chair || '')}" placeholder="שם היו״ר">
            </div>
        </div>
        <div class="form-group">
            <label>חברי ועדה</label>
            <div id="commMembersContainer">${memberList}</div>
            <button type="button" class="btn-secondary" id="addCommMemberBtn" style="margin-top: 10px;">
                <i class="fas fa-plus"></i> הוסף חבר
            </button>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" data-modal-save><i class="fas fa-save"></i> שמירה</button>
        </div>
    `;

    showModal(html, async (modal) => {
        const members = [];
        modal.querySelectorAll('[data-cm-row]').forEach(row => {
            const name = row.querySelector('[data-cm-name]').value.trim();
            if (name) members.push(name);
        });

        const data = {
            name: modal.querySelector('#commName').value.trim(),
            subtitle: modal.querySelector('#commSubtitle').value.trim(),
            icon: modal.querySelector('#commIcon').value,
            chair: modal.querySelector('#commChair').value.trim(),
            members
        };

        if (!data.name) {
            showToast('שם הוועדה חובה', 'error');
            return;
        }

        try {
            if (existing) {
                data.order = existing.order;
                await updateDoc(doc(db, 'committees', existing.id), data);
            } else {
                data.order = committeesItems.length + 1;
                await addDoc(collection(db, 'committees'), data);
            }
            closeModal();
            await loadCommittees();
            showToast(existing ? 'ועדה עודכנה' : 'ועדה נוספה');
        } catch (e) {
            showToast('שגיאה: ' + e.message, 'error');
        }
    });

    const container = document.getElementById('commMembersContainer');
    document.getElementById('addCommMemberBtn').onclick = () => {
        const idx = container.children.length;
        const div = document.createElement('div');
        div.className = 'form-row election-candidate-row';
        div.setAttribute('data-cm-row', idx);
        div.innerHTML = `
            <input type="text" placeholder="שם חבר ועדה" data-cm-name>
            <button type="button" class="icon-btn danger" data-cm-remove><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
        div.querySelector('[data-cm-remove]').onclick = () => div.remove();
    };
    container.querySelectorAll('[data-cm-remove]').forEach(btn => {
        btn.onclick = () => btn.closest('[data-cm-row]').remove();
    });
}

function editCommittee(id) {
    const c = committeesItems.find(it => it.id === id);
    if (c) showCommitteeForm(c);
}

async function deleteCommittee(id) {
    if (!confirm('האם למחוק את הוועדה?')) return;
    await deleteDoc(doc(db, 'committees', id));
    await loadCommittees();
    showToast('הוועדה נמחקה');
}

async function moveCommittee(id, direction) {
    const idx = committeesItems.findIndex(it => it.id === id);
    const newIdx = idx + direction;
    if (idx === -1 || newIdx < 0 || newIdx >= committeesItems.length) return;

    const a = committeesItems[idx], b = committeesItems[newIdx];
    const tmpOrder = a.order || 99;
    await updateDoc(doc(db, 'committees', a.id), { order: b.order || 99 });
    await updateDoc(doc(db, 'committees', b.id), { order: tmpOrder });
    await loadCommittees();
}

// ============================================
// Classes Management (Day-based CRUD)
// ============================================
let classesCurrentDay = 0; // 0=Sun..6=Sat
const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

async function loadClasses() {
    if (DEMO_MODE || !isInitialized) return;
    const list = $('classesList');
    if (!list) return;

    try {
        const snap = await getDocs(collection(db, 'classes'));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const dayClasses = all
            .filter(c => Number(c.day) === Number(classesCurrentDay))
            .sort((a, b) => (a.time?.start || '').localeCompare(b.time?.start || ''));

        $('statClasses').textContent = all.length;

        if (dayClasses.length === 0) {
            list.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-day"></i><p>אין חוגים ביום ${DAY_NAMES_HE[classesCurrentDay]}. לחץ "הוסף חוג" להתחלה!</p></div>`;
            return;
        }

        list.innerHTML = dayClasses.map(c => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(c.name)} <span style="color: var(--admin-text-muted); font-weight: 400;">— ${escapeHtml(c.instructor || '')}</span></div>
                    <div class="list-item-meta">
                        <i class="fas fa-clock"></i> ${escapeHtml(c.time?.start || '')}-${escapeHtml(c.time?.end || '')}
                        &nbsp;•&nbsp;
                        <i class="fas fa-tag"></i> ${escapeHtml(c.price || '')}
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn" data-class-edit="${c.id}" title="ערוך"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn danger" data-class-delete="${c.id}" title="מחק"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-class-edit]').forEach(btn => {
            btn.onclick = () => editClass(btn.getAttribute('data-class-edit'));
        });
        list.querySelectorAll('[data-class-delete]').forEach(btn => {
            btn.onclick = () => deleteClass(btn.getAttribute('data-class-delete'));
        });
    } catch (e) {
        console.error('Failed to load classes:', e);
    }
}

function showClassForm(existing = null) {
    const categories = [
        { value: 'yoga', label: 'יוגה / פילאטיס', icon: 'spa' },
        { value: 'dance', label: 'ריקוד', icon: 'music' },
        { value: 'fitness', label: 'כושר', icon: 'dumbbell' },
        { value: 'water', label: 'מים', icon: 'water' },
        { value: 'folk', label: 'ריקודי עם', icon: 'guitar' },
        { value: 'sport', label: 'ספורט', icon: 'futbol' },
        { value: 'kids', label: 'ילדים', icon: 'child' }
    ];

    const html = `
        <div class="modal-header">
            <h3>${existing ? 'עריכת חוג' : 'חוג חדש'}</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <div class="form-group">
            <label>שם החוג</label>
            <input type="text" id="className" value="${escapeHtml(existing?.name || '')}" placeholder="לדוגמה: יוגה">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>יום</label>
                <select id="classDay">
                    ${DAY_NAMES_HE.map((d, i) => `<option value="${i}" ${(existing?.day ?? classesCurrentDay) == i ? 'selected' : ''}>${d}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>שעת התחלה</label>
                <input type="time" id="classStart" value="${existing?.time?.start || ''}">
            </div>
            <div class="form-group">
                <label>שעת סיום</label>
                <input type="time" id="classEnd" value="${existing?.time?.end || ''}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>מדריך/ה</label>
                <input type="text" id="classInstructor" value="${escapeHtml(existing?.instructor || '')}" placeholder="שם המדריך/ה">
            </div>
            <div class="form-group">
                <label>קטגוריה</label>
                <select id="classCategory">
                    ${categories.map(c => `<option value="${c.value}" data-icon="${c.icon}" ${existing?.category === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>מחיר (לדוגמה: "220 ₪" / "למנויים בלבד" / "200/300/400 ₪")</label>
            <input type="text" id="classPrice" value="${escapeHtml(existing?.price || '')}" placeholder="220 ₪">
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" data-modal-save><i class="fas fa-save"></i> שמירה</button>
        </div>
    `;

    showModal(html, async (modal) => {
        const catSelect = modal.querySelector('#classCategory');
        const data = {
            name: modal.querySelector('#className').value.trim(),
            day: parseInt(modal.querySelector('#classDay').value),
            time: {
                start: modal.querySelector('#classStart').value,
                end: modal.querySelector('#classEnd').value
            },
            instructor: modal.querySelector('#classInstructor').value.trim(),
            category: catSelect.value,
            icon: catSelect.selectedOptions[0]?.getAttribute('data-icon') || 'star',
            price: modal.querySelector('#classPrice').value.trim()
        };

        if (!data.name || !data.time.start || !data.time.end) {
            showToast('שם, שעת התחלה ושעת סיום חובה', 'error');
            return;
        }

        try {
            if (existing) {
                await updateDoc(doc(db, 'classes', existing.id), data);
            } else {
                await addDoc(collection(db, 'classes'), { ...data, createdAt: serverTimestamp() });
            }
            closeModal();
            classesCurrentDay = data.day;
            switchClassDay(data.day);
            showToast(existing ? 'חוג עודכן' : 'חוג נוסף!');
        } catch (e) {
            showToast('שגיאה בשמירה: ' + e.message, 'error');
        }
    });
}

async function editClass(id) {
    const snap = await getDoc(doc(db, 'classes', id));
    if (snap.exists()) showClassForm({ id, ...snap.data() });
}

async function deleteClass(id) {
    if (!confirm('האם למחוק את החוג?')) return;
    await deleteDoc(doc(db, 'classes', id));
    await loadClasses();
    showToast('החוג נמחק');
}

function switchClassDay(day) {
    classesCurrentDay = day;
    $$('.day-tab').forEach(t => t.classList.toggle('active', parseInt(t.getAttribute('data-day')) === day));
    loadClasses();
}

// ============================================
// Gallery Management (Firebase Storage + Firestore)
// ============================================
let galleryItems = [];
let galleryFilter = 'all';

const GALLERY_CATEGORIES = [
    { value: 'aerial', label: 'מבט אווירי' },
    { value: 'pools', label: 'בריכות' },
    { value: 'slides', label: 'מגלשות' },
    { value: 'kids', label: 'ילדים' },
    { value: 'gym', label: 'חדר כושר' },
    { value: 'spa', label: 'ספא' },
    { value: 'facilities', label: 'מתקנים' },
    { value: 'user', label: 'אחר' }
];

async function loadGallery() {
    if (DEMO_MODE || !isInitialized) return;
    const grid = $('galleryAdminGrid');
    if (!grid) return;

    try {
        const snap = await getDocs(collection(db, 'gallery'));
        galleryItems = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.order || 9999) - (b.order || 9999));
        $('statImages').textContent = galleryItems.length;

        renderGalleryFilters();
        renderGalleryGrid();
    } catch (e) {
        console.error('Gallery load failed:', e);
    }
}

function renderGalleryFilters() {
    const bar = $('galleryFilterBar');
    if (!bar) return;
    const counts = { all: galleryItems.length };
    galleryItems.forEach(it => {
        counts[it.category] = (counts[it.category] || 0) + 1;
    });
    bar.innerHTML = [{ value: 'all', label: 'הכל' }, ...GALLERY_CATEGORIES].map(c => `
        <button class="gallery-filter-btn ${galleryFilter === c.value ? 'active' : ''}" data-gfilter="${c.value}">
            ${escapeHtml(c.label)} <span class="filter-count">${counts[c.value] || 0}</span>
        </button>
    `).join('');
    bar.querySelectorAll('[data-gfilter]').forEach(btn => {
        btn.onclick = () => {
            galleryFilter = btn.getAttribute('data-gfilter');
            renderGalleryFilters();
            renderGalleryGrid();
        };
    });
}

function renderGalleryGrid() {
    const grid = $('galleryAdminGrid');
    if (!grid) return;

    const filtered = galleryFilter === 'all'
        ? galleryItems
        : galleryItems.filter(it => it.category === galleryFilter);

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-images"></i><p>אין תמונות בקטגוריה זו</p></div>`;
        return;
    }

    grid.innerHTML = filtered.map((img, idx) => `
        <div class="gallery-admin-item">
            <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption || '')}" loading="lazy">
            <div class="gallery-admin-caption">${escapeHtml(img.caption || 'ללא כותרת')}</div>
            <div class="gallery-admin-cat-badge">${escapeHtml(GALLERY_CATEGORIES.find(c => c.value === img.category)?.label || '—')}</div>
            <div class="gallery-admin-overlay">
                <button class="icon-btn" data-gallery-up="${img.id}" title="העלה ימינה" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-arrow-right"></i></button>
                <button class="icon-btn" data-gallery-down="${img.id}" title="הזז שמאלה" ${idx === filtered.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-left"></i></button>
                <button class="icon-btn" data-gallery-edit="${img.id}" title="ערוך"><i class="fas fa-edit"></i></button>
                <button class="icon-btn danger" data-gallery-delete="${img.id}" data-path="${escapeHtml(img.path || '')}" title="מחק"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('[data-gallery-delete]').forEach(btn => {
        btn.onclick = () => deleteGalleryImage(btn.getAttribute('data-gallery-delete'), btn.getAttribute('data-path'));
    });
    grid.querySelectorAll('[data-gallery-edit]').forEach(btn => {
        btn.onclick = () => showGalleryEditForm(btn.getAttribute('data-gallery-edit'));
    });
    grid.querySelectorAll('[data-gallery-up]').forEach(btn => {
        btn.onclick = () => moveGalleryImage(btn.getAttribute('data-gallery-up'), -1);
    });
    grid.querySelectorAll('[data-gallery-down]').forEach(btn => {
        btn.onclick = () => moveGalleryImage(btn.getAttribute('data-gallery-down'), 1);
    });
}

function showGalleryEditForm(id) {
    const img = galleryItems.find(it => it.id === id);
    if (!img) return;

    const html = `
        <div class="modal-header">
            <h3>עריכת תמונה</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <div style="text-align: center; margin-bottom: 16px;">
            <img src="${escapeHtml(img.url)}" style="max-width: 100%; max-height: 250px; border-radius: 10px; object-fit: cover;">
        </div>
        <div class="form-group">
            <label>כותרת</label>
            <input type="text" id="galCaption" value="${escapeHtml(img.caption || '')}" placeholder="לדוגמה: מבט אווירי פנורמי">
        </div>
        <div class="form-group">
            <label>תיאור משני</label>
            <input type="text" id="galSubtitle" value="${escapeHtml(img.subtitle || '')}" placeholder="לדוגמה: 30 דונם של פארק">
        </div>
        <div class="form-group">
            <label>קטגוריה</label>
            <select id="galCategory">
                ${GALLERY_CATEGORIES.map(c => `<option value="${c.value}" ${img.category === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}
            </select>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" data-modal-save><i class="fas fa-save"></i> שמירה</button>
        </div>
    `;

    showModal(html, async (modal) => {
        const data = {
            caption: modal.querySelector('#galCaption').value.trim(),
            subtitle: modal.querySelector('#galSubtitle').value.trim(),
            category: modal.querySelector('#galCategory').value
        };
        try {
            await updateDoc(doc(db, 'gallery', id), data);
            closeModal();
            await loadGallery();
            showToast('תמונה עודכנה');
        } catch (e) {
            showToast('שגיאה: ' + e.message, 'error');
        }
    });
}

async function moveGalleryImage(id, direction) {
    const filtered = galleryFilter === 'all'
        ? galleryItems
        : galleryItems.filter(it => it.category === galleryFilter);
    const idx = filtered.findIndex(it => it.id === id);
    const newIdx = idx + direction;
    if (idx === -1 || newIdx < 0 || newIdx >= filtered.length) return;

    // Swap orders of the two adjacent items in the FILTERED view
    const a = filtered[idx], b = filtered[newIdx];
    const tmpOrder = a.order || 9999;
    try {
        await updateDoc(doc(db, 'gallery', a.id), { order: b.order || 9999 });
        await updateDoc(doc(db, 'gallery', b.id), { order: tmpOrder });
        await loadGallery();
    } catch (e) {
        console.error(e);
    }
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function uploadGalleryFiles(files) {
    if (DEMO_MODE || !isInitialized) {
        showToast('העלאה דורשת Firebase', 'error');
        return;
    }
    if (!files || files.length === 0) return;

    showToast(`דוחס ומעלה ${files.length} תמונות...`);
    let uploaded = 0, failed = 0;
    let totalOriginal = 0, totalCompressed = 0;

    const maxOrder = Math.max(0, ...galleryItems.map(it => it.order || 0));

    const compressOptions = {
        maxSizeMB: 0.4,            // Target ~400KB max per image
        maxWidthOrHeight: 1920,    // Cap at 1920px - plenty for web gallery
        useWebWorker: true,        // Background processing
        fileType: 'image/jpeg',
        initialQuality: 0.85
    };

    for (const file of files) {
        try {
            // Only compress actual image files; SVG and tiny files pass through
            let toUpload = file;
            if (file.type.startsWith('image/') && file.type !== 'image/svg+xml' && file.size > 100 * 1024) {
                try {
                    toUpload = await imageCompression(file, compressOptions);
                    totalOriginal += file.size;
                    totalCompressed += toUpload.size;
                } catch (compErr) {
                    console.warn(`Compression failed for ${file.name}, uploading original:`, compErr);
                    totalOriginal += file.size;
                    totalCompressed += file.size;
                }
            } else {
                totalOriginal += file.size;
                totalCompressed += file.size;
            }

            const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const path = `gallery/${Date.now()}_${safeName}`;
            const ref = storageRef(storage, path);
            await uploadBytes(ref, toUpload);
            const url = await getDownloadURL(ref);
            await addDoc(collection(db, 'gallery'), {
                url,
                path,
                category: 'user',
                caption: '',
                subtitle: '',
                order: maxOrder + 1 + uploaded,
                isLocal: false,
                originalSize: file.size,
                uploadedSize: toUpload.size,
                createdAt: serverTimestamp()
            });
            uploaded++;
        } catch (e) {
            console.error(`Upload failed for ${file.name}:`, e);
            failed++;
        }
    }

    if (uploaded > 0) {
        const savedPct = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;
        const savedMB = (totalOriginal - totalCompressed) / (1024 * 1024);
        if (savedPct > 5) {
            showToast(`✓ ${uploaded} תמונות הועלו | חיסכון: ${savedPct}% (${savedMB.toFixed(1)}MB)`, 'success');
        } else {
            showToast(`✓ ${uploaded} תמונות הועלו בהצלחה!`, 'success');
        }
    }
    if (failed > 0) showToast(`${failed} תמונות נכשלו`, 'error');
    await loadGallery();
}

async function deleteGalleryImage(id, path) {
    const img = galleryItems.find(it => it.id === id);
    const isLocal = img?.isLocal;
    const warning = isLocal
        ? 'תמונה זו נטענה ממאגר האתר. המחיקה תסיר אותה רק מהגלריה (הקובץ עצמו נשמר).\n\nלהמשיך?'
        : 'האם למחוק את התמונה? (כולל מהאחסון)';
    if (!confirm(warning)) return;

    try {
        // Only delete from Storage if it's a user-uploaded file (not a local image)
        if (path && !isLocal) {
            try {
                await deleteObject(storageRef(storage, path));
            } catch (e) { /* may already be deleted */ }
        }
        await deleteDoc(doc(db, 'gallery', id));
        await loadGallery();
        showToast('התמונה נמחקה');
    } catch (e) {
        showToast('שגיאה במחיקה', 'error');
    }
}

// ============================================
// Elections Management
// ============================================
async function loadElections() {
    if (DEMO_MODE || !isInitialized) return;
    const list = $('electionsList');
    if (!list) return;

    try {
        const snap = await getDocs(collection(db, 'elections'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.year || 0) - (a.year || 0));

        if (items.length === 0) {
            list.innerHTML = `<div class="empty-state"><i class="fas fa-vote-yea"></i><p>אין תוצאות בחירות. לחץ "בחירות חדשות" להוספה.</p></div>`;
            return;
        }

        list.innerHTML = items.map(item => `
            <div class="list-item">
                <div class="list-item-content">
                    <div class="list-item-title">בחירות ${escapeHtml(String(item.year || ''))} ${item.date ? '— ' + escapeHtml(item.date) : ''}</div>
                    <div class="list-item-meta">${(item.candidates || []).length} מועמדים • ${(item.candidates || []).filter(c => c.elected).length} נבחרו</div>
                </div>
                <div class="list-item-actions">
                    <button class="icon-btn" data-election-edit="${item.id}" title="ערוך"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn danger" data-election-delete="${item.id}" title="מחק"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('[data-election-edit]').forEach(btn => {
            btn.onclick = () => editElection(btn.getAttribute('data-election-edit'));
        });
        list.querySelectorAll('[data-election-delete]').forEach(btn => {
            btn.onclick = () => deleteElection(btn.getAttribute('data-election-delete'));
        });
    } catch (e) {
        console.error('Elections load failed:', e);
    }
}

function showElectionForm(existing = null) {
    const candidatesHtml = (existing?.candidates || [{ name: '', votes: 0, elected: false }]).map((c, i) => `
        <div class="form-row election-candidate-row" data-cand-row="${i}">
            <input type="text" placeholder="שם המועמד" data-cand-name value="${escapeHtml(c.name || '')}">
            <input type="number" placeholder="קולות" data-cand-votes value="${c.votes || 0}" style="max-width: 100px;">
            <label style="display: flex; align-items: center; gap: 5px;">
                <input type="checkbox" data-cand-elected ${c.elected ? 'checked' : ''}> נבחר
            </label>
            <button type="button" class="icon-btn danger" data-cand-remove><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    const html = `
        <div class="modal-header">
            <h3>${existing ? 'עריכת בחירות' : 'בחירות חדשות'}</h3>
            <button class="modal-close" data-modal-close>×</button>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>שנה</label>
                <input type="number" id="electionYear" value="${existing?.year || new Date().getFullYear()}">
            </div>
            <div class="form-group">
                <label>תאריך (לדוגמה: 29.09)</label>
                <input type="text" id="electionDate" value="${escapeHtml(existing?.date || '')}">
            </div>
        </div>
        <div class="form-group">
            <label>כותרת/תיאור</label>
            <input type="text" id="electionTitle" value="${escapeHtml(existing?.title || '')}" placeholder="לדוגמה: בחירות לוועד">
        </div>
        <div class="form-group">
            <label>הערה (פיקוח, אישור וכו')</label>
            <textarea id="electionNote" rows="2">${escapeHtml(existing?.note || '')}</textarea>
        </div>
        <div class="form-group">
            <label>מועמדים</label>
            <div id="candidatesContainer">${candidatesHtml}</div>
            <button type="button" class="btn-secondary" id="addCandidateBtn" style="margin-top: 10px;">
                <i class="fas fa-plus"></i> הוסף מועמד
            </button>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-modal-close>ביטול</button>
            <button class="btn-primary" data-modal-save><i class="fas fa-save"></i> שמירה</button>
        </div>
    `;

    showModal(html, async (modal) => {
        const candidates = [];
        modal.querySelectorAll('[data-cand-row]').forEach(row => {
            const name = row.querySelector('[data-cand-name]').value.trim();
            if (!name) return;
            candidates.push({
                name,
                votes: parseInt(row.querySelector('[data-cand-votes]').value) || 0,
                elected: row.querySelector('[data-cand-elected]').checked
            });
        });

        const data = {
            year: parseInt(modal.querySelector('#electionYear').value),
            date: modal.querySelector('#electionDate').value.trim(),
            title: modal.querySelector('#electionTitle').value.trim(),
            note: modal.querySelector('#electionNote').value.trim(),
            candidates: candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0))
        };

        if (!data.year) {
            showToast('יש למלא שנה', 'error');
            return;
        }

        try {
            if (existing) {
                await updateDoc(doc(db, 'elections', existing.id), data);
            } else {
                await addDoc(collection(db, 'elections'), { ...data, createdAt: serverTimestamp() });
            }
            closeModal();
            await loadElections();
            showToast(existing ? 'בחירות עודכנו' : 'בחירות נוספו!');
        } catch (e) {
            showToast('שגיאה: ' + e.message, 'error');
        }
    });

    // Wire add/remove candidate buttons
    const container = document.getElementById('candidatesContainer');
    document.getElementById('addCandidateBtn').onclick = () => {
        const idx = container.children.length;
        const div = document.createElement('div');
        div.className = 'form-row election-candidate-row';
        div.setAttribute('data-cand-row', idx);
        div.innerHTML = `
            <input type="text" placeholder="שם המועמד" data-cand-name>
            <input type="number" placeholder="קולות" data-cand-votes value="0" style="max-width: 100px;">
            <label style="display: flex; align-items: center; gap: 5px;">
                <input type="checkbox" data-cand-elected> נבחר
            </label>
            <button type="button" class="icon-btn danger" data-cand-remove><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
        div.querySelector('[data-cand-remove]').onclick = () => div.remove();
    };
    container.querySelectorAll('[data-cand-remove]').forEach(btn => {
        btn.onclick = () => btn.closest('[data-cand-row]').remove();
    });
}

async function editElection(id) {
    const snap = await getDoc(doc(db, 'elections', id));
    if (snap.exists()) showElectionForm({ id, ...snap.data() });
}

async function deleteElection(id) {
    if (!confirm('האם למחוק את הבחירות?')) return;
    await deleteDoc(doc(db, 'elections', id));
    await loadElections();
    showToast('הבחירות נמחקו');
}

// ============================================
// Move News (reorder)
// ============================================
async function moveNews(id, direction) {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const snap = await getDocs(query(collection(db, 'news'), orderBy('order', 'asc')));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const idx = items.findIndex(it => it.id === id);
        if (idx === -1) return;
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= items.length) return;

        const tmpOrder = items[idx].order;
        await updateDoc(doc(db, 'news', items[idx].id), { order: items[newIdx].order });
        await updateDoc(doc(db, 'news', items[newIdx].id), { order: tmpOrder });
        await loadNews();
    } catch (e) {
        console.error(e);
    }
}

// ============================================
// Quick Actions
// ============================================
function bindQuickActions() {
    $$('.quick-action').forEach(btn => {
        btn.onclick = () => {
            const action = btn.getAttribute('data-action');
            if (action === 'news') {
                navigateTo('news');
                setTimeout(() => showNewsForm(), 100);
            } else {
                navigateTo(action);
            }
        };
    });
}

// ============================================
// Helpers
// ============================================
function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ============================================
// Initial Setup - Migrate existing content to Firebase
// ============================================
async function checkInitialSetup() {
    if (DEMO_MODE || !isInitialized) return;

    try {
        // Banner appears if ANY major collection is still empty
        const [newsSnap, classesSnap, gallerySnap, electionsSnap] = await Promise.all([
            getDocs(collection(db, 'news')),
            getDocs(collection(db, 'classes')),
            getDocs(collection(db, 'gallery')),
            getDocs(collection(db, 'elections'))
        ]);
        const missing = [];
        if (newsSnap.empty) missing.push('הודעות');
        if (classesSnap.empty) missing.push('חוגים');
        if (gallerySnap.empty) missing.push('גלריה');
        if (electionsSnap.empty) missing.push('בחירות');

        const dashboard = $('section-dashboard');
        if (!dashboard) return;

        // Check if banner already exists
        if (document.getElementById('setupBanner')) return;

        if (missing.length > 0) {
            const banner = document.createElement('div');
            banner.id = 'setupBanner';
            banner.className = 'setup-banner';
            banner.innerHTML = `
                <div class="setup-banner-content">
                    <div class="setup-icon">
                        <i class="fas fa-magic"></i>
                    </div>
                    <div class="setup-text">
                        <h3>🎯 טעינת תוכן לפאנל</h3>
                        <p>חסר תוכן ב-Firebase: <strong>${missing.join(', ')}</strong>. לחץ כאן כדי לטעון את כל התוכן הקיים באתר (כולל 55 חוגים ו-38 תמונות) ולקבל שליטה מלאה עליו מהפאנל.</p>
                    </div>
                    <button class="btn-primary btn-large" id="runMigrationBtn">
                        <i class="fas fa-rocket"></i>
                        טען תוכן קיים
                    </button>
                </div>
            `;
            dashboard.insertBefore(banner, dashboard.firstChild);

            document.getElementById('runMigrationBtn').addEventListener('click', runMigration);
        }
    } catch (e) {
        console.error('Setup check failed:', e);
    }
}

async function runMigration() {
    const btn = document.getElementById('runMigrationBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> טוען...';

    try {
        let total = 0;

        // Check what's already populated (skip migration of populated collections)
        const [newsSnapNow, classesSnapNow, commSnapNow, gallerySnapNow, electionsSnapNow] = await Promise.all([
            getDocs(collection(db, 'news')),
            getDocs(collection(db, 'classes')),
            getDocs(collection(db, 'committees')),
            getDocs(collection(db, 'gallery')),
            getDocs(collection(db, 'elections'))
        ]);

        // Migrate news (only if empty)
        if (newsSnapNow.empty) {
            for (const item of initialData.news) {
                await addDoc(collection(db, 'news'), {
                    ...item,
                    createdAt: serverTimestamp()
                });
                total++;
            }
        }

        // Migrate classes (only if empty)
        if (classesSnapNow.empty && initialData.classes) {
            for (const cls of initialData.classes) {
                await addDoc(collection(db, 'classes'), {
                    ...cls,
                    createdAt: serverTimestamp()
                });
                total++;
            }
        }

        // Migrate hours (single document - always overwrite)
        await setDoc(doc(db, 'settings', 'hours'), initialData.hours);
        total++;

        // Migrate contact
        await setDoc(doc(db, 'settings', 'contact'), initialData.contact);
        total++;

        // Migrate board
        await setDoc(doc(db, 'settings', 'board'), initialData.board);
        total++;

        // Migrate management (CEO)
        if (initialData.management) {
            await setDoc(doc(db, 'settings', 'management'), initialData.management);
            total++;
        }

        // Migrate committees (only if empty)
        if (commSnapNow.empty) {
            for (const committee of initialData.committees) {
                await addDoc(collection(db, 'committees'), committee);
                total++;
            }
        }

        // Migrate gallery (only if empty)
        if (gallerySnapNow.empty && initialData.gallery) {
            for (const img of initialData.gallery) {
                await addDoc(collection(db, 'gallery'), {
                    ...img,
                    createdAt: serverTimestamp()
                });
                total++;
            }
        }

        // Migrate elections (only if empty)
        if (electionsSnapNow.empty && initialData.elections) {
            for (const election of initialData.elections) {
                await addDoc(collection(db, 'elections'), {
                    ...election,
                    createdAt: serverTimestamp()
                });
                total++;
            }
        }

        // Migrate settings
        await setDoc(doc(db, 'settings', 'general'), initialData.settings);
        total++;

        showToast(`✨ נטענו ${total} פריטים בהצלחה!`, 'success');

        // Remove banner
        const banner = document.getElementById('setupBanner');
        if (banner) banner.remove();

        // Reload data
        await loadAllData();
    } catch (e) {
        console.error('Migration failed:', e);
        showToast('שגיאה בטעינת התוכן: ' + e.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-redo"></i> נסה שוב';
    }
}

// ============================================
// Auto-add Year-Round Facilities (indoor + gym) - one-time
// ============================================
async function autoAddYearRoundFacilities() {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const hoursSnap = await getDoc(doc(db, 'settings', 'hours'));
        if (!hoursSnap.exists()) return;
        const data = hoursSnap.data();
        const facilities = data.facilities || {};

        let needsUpdate = false;
        const yearRoundSchedule = {
            0: { open: '05:30', close: '09:00', open2: '14:00', close2: '22:30' },
            1: { open: '05:30', close: '22:30' },
            2: { open: '05:30', close: '22:30' },
            3: { open: '05:30', close: '22:30' },
            4: { open: '05:30', close: '22:30' },
            5: { open: '05:30', close: '19:00' },
            6: { open: '07:30', close: '19:00' }
        };

        if (!facilities.indoor) {
            facilities.indoor = {
                name: 'בריכה מקורה',
                icon: 'swimming-pool',
                order: 5,
                yearRound: true,
                schedule: yearRoundSchedule
            };
            needsUpdate = true;
        }
        if (!facilities.gym) {
            facilities.gym = {
                name: 'חדר כושר',
                icon: 'dumbbell',
                order: 6,
                yearRound: true,
                schedule: yearRoundSchedule
            };
            needsUpdate = true;
        }

        if (needsUpdate) {
            await setDoc(doc(db, 'settings', 'hours'), { ...data, facilities });
            console.log('✅ נוספו אוטומטית: בריכה מקורה + חדר כושר ל-Firestore');
        }
    } catch (e) {
        console.warn('Auto-add year-round facilities failed:', e);
    }
}

// ============================================
// Auto-add Summer Opening Event News (one-time)
// ============================================
async function autoAddSummerOpeningNews() {
    if (DEMO_MODE || !isInitialized) return;
    try {
        const snap = await getDocs(collection(db, 'news'));
        const exists = snap.docs.some(d => d.data().title?.includes('הפנינג פתיחת עונת הקיץ 2026'));
        if (exists) return; // Already there - don't duplicate

        await addDoc(collection(db, 'news'), {
            title: 'הפנינג פתיחת עונת הקיץ 2026',
            date: '2026-06-01',
            type: 'event',
            content: 'חוגגים יחד את פתיחת עונת הקיץ — מאות חברי עמותה הצטרפו לחגיגה הגדולה. צפו בסרטון המלא מהאירוע!',
            ctaText: 'צפו בסרטון',
            ctaUrl: 'event-summer-opening-2026.html',
            createdAt: serverTimestamp()
        });
        console.log('✅ הודעת ההפנינג נוספה אוטומטית ל-Firestore');
    } catch (e) {
        console.warn('Auto-add summer event news failed:', e);
    }
}

// ============================================
// Load All Data
// ============================================
async function loadAllData() {
    await checkInitialSetup();
    await autoAddSummerOpeningNews();
    await autoAddYearRoundFacilities();
    await Promise.all([
        loadNews(),
        loadHours(),
        loadContact(),
        loadCEO(),
        loadBoard(),
        loadCommittees(),
        loadClasses(),
        loadGallery(),
        loadElections(),
        loadMessages(),
        loadQuickReplies(),
        loadNotificationSettings()
    ]);
    $('lastSync').textContent = new Date().toLocaleString('he-IL');

    if (boardData?.members) {
        const boardStatEl = document.querySelector('[data-color="purple"] .stat-value');
        if (boardStatEl) boardStatEl.textContent = boardData.members.length;
    }
}

// ============================================
// Event Bindings
// ============================================
function init() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

    // Nav items
    $$('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            navigateTo(section);
        });
    });

    // Add news button
    $('addNewsBtn').addEventListener('click', () => showNewsForm());

    // Save hours button
    const saveHoursBtn = $('saveHoursBtn');
    if (saveHoursBtn) saveHoursBtn.addEventListener('click', saveHours);

    // Save contact button
    const saveContactBtn = $('saveContactBtn');
    if (saveContactBtn) saveContactBtn.addEventListener('click', saveContact);

    // Edit CEO button (opens modal)
    const editCeoBtn = $('editCeoBtn');
    if (editCeoBtn) editCeoBtn.addEventListener('click', showCEOForm);

    // Add board member button
    const addBoardBtn = $('addBoardBtn');
    if (addBoardBtn) addBoardBtn.addEventListener('click', () => showBoardForm());

    // Add committee button
    const addCommitteeBtn = $('addCommitteeBtn');
    if (addCommitteeBtn) addCommitteeBtn.addEventListener('click', () => showCommitteeForm());

    // Add quick reply button
    const addReplyBtn = $('addReplyBtn');
    if (addReplyBtn) addReplyBtn.addEventListener('click', () => showQuickReplyForm());

    // Save notification settings
    const saveNotifBtn = $('saveNotifBtn');
    if (saveNotifBtn) saveNotifBtn.addEventListener('click', saveNotificationSettings);

    // Inbox sub-tabs (Messages / Quick Replies)
    $$('.inbox-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabKey = tab.getAttribute('data-inbox-tab');
            $$('.inbox-tab').forEach(t => t.classList.toggle('active', t === tab));
            $$('.inbox-tab-content').forEach(c => {
                c.classList.toggle('active', c.id === `inbox-content-${tabKey}`);
            });
        });
    });

    // Classes section
    const addClassBtn = $('addClassBtn');
    if (addClassBtn) addClassBtn.addEventListener('click', () => showClassForm());
    $$('.day-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const day = parseInt(tab.getAttribute('data-day'));
            switchClassDay(day);
        });
    });

    // Gallery upload
    const uploadInput = $('uploadInput');
    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            uploadGalleryFiles(Array.from(e.target.files));
            uploadInput.value = '';
        });
    }
    const uploadZone = $('uploadZone');
    if (uploadZone) {
        uploadZone.addEventListener('click', () => uploadInput?.click());
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            uploadGalleryFiles(Array.from(e.dataTransfer.files));
        });
    }

    // Elections
    const addElectionBtn = $('addElectionBtn');
    if (addElectionBtn) addElectionBtn.addEventListener('click', () => showElectionForm());

    // Change password
    const changePassBtn = $('changePassBtn');
    if (changePassBtn) {
        changePassBtn.addEventListener('click', async () => {
            const newPass = $('newPass').value;
            if (!newPass || newPass.length < 6) {
                showToast('סיסמה חייבת להכיל לפחות 6 תווים', 'error');
                return;
            }
            try {
                await updatePassword(auth.currentUser, newPass);
                showToast('סיסמה הוחלפה בהצלחה!');
                $('currentPass').value = '';
                $('newPass').value = '';
            } catch (e) {
                showToast('שגיאה: ' + (e.code === 'auth/requires-recent-login' ? 'יש להתחבר מחדש' : e.message), 'error');
            }
        });
    }

    // Export data
    const exportDataBtn = $('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', async () => {
            try {
                const data = {};
                for (const colName of ['news', 'classes', 'committees', 'gallery', 'elections']) {
                    const snap = await getDocs(collection(db, colName));
                    data[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                }
                for (const docName of ['hours', 'contact', 'board', 'general']) {
                    const snap = await getDoc(doc(db, 'settings', docName));
                    if (snap.exists()) data[docName] = snap.data();
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `park-hamayim-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('גיבוי הורד בהצלחה');
            } catch (e) {
                showToast('שגיאה בייצוא: ' + e.message, 'error');
            }
        });
    }

    // Save board date when changed
    const boardDateInput = $('boardDate');
    if (boardDateInput) {
        boardDateInput.addEventListener('change', async () => {
            if (!isInitialized || DEMO_MODE) return;
            if (!boardData) boardData = { date: boardDateInput.value, members: [] };
            boardData.date = boardDateInput.value;
            try {
                await setDoc(doc(db, 'settings', 'board'), boardData);
                showToast('תאריך עודכן');
            } catch (e) {
                console.error(e);
            }
        });
    }

    bindQuickActions();

    // Settings buttons
    const forceMigrationBtn = document.getElementById('forceMigrationBtn');
    if (forceMigrationBtn) {
        forceMigrationBtn.addEventListener('click', async () => {
            if (!confirm('האם לטעון את התוכן הקבוע מהאתר? זה יוסיף את התוכן הקיים (לא יוחק תוכן קיים)')) return;
            // Create temporary button reference
            const banner = document.createElement('div');
            banner.id = 'setupBanner';
            banner.style.display = 'none';
            banner.innerHTML = '<button id="runMigrationBtn"></button>';
            document.body.appendChild(banner);
            forceMigrationBtn.disabled = true;
            forceMigrationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> טוען...';
            await runMigration();
            forceMigrationBtn.disabled = false;
            forceMigrationBtn.innerHTML = '<i class="fas fa-rocket"></i> טען / החזר תוכן ראשוני';
        });
    }

    const resetAllBtn = document.getElementById('resetAllBtn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', async () => {
            if (!confirm('⚠️ אזהרה: פעולה זו תמחק את כל התוכן ב-Firebase!\n\nהאם להמשיך?')) return;
            if (!confirm('אישור אחרון: באמת למחוק הכל?')) return;

            resetAllBtn.disabled = true;
            resetAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> מוחק...';

            try {
                // Delete all news
                const newsSnap = await getDocs(collection(db, 'news'));
                for (const docSnap of newsSnap.docs) {
                    await deleteDoc(doc(db, 'news', docSnap.id));
                }
                // Delete all committees
                const commSnap = await getDocs(collection(db, 'committees'));
                for (const docSnap of commSnap.docs) {
                    await deleteDoc(doc(db, 'committees', docSnap.id));
                }
                // Delete settings docs
                for (const settingDoc of ['hours', 'contact', 'board', 'general']) {
                    try {
                        await deleteDoc(doc(db, 'settings', settingDoc));
                    } catch (e) { /* ignore */ }
                }
                showToast('כל התוכן נמחק. רענן את הדף.', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (e) {
                showToast('שגיאה במחיקה: ' + e.message, 'error');
                resetAllBtn.disabled = false;
                resetAllBtn.innerHTML = '<i class="fas fa-trash"></i> מחק את כל התוכן (התחל מחדש)';
            }
        });
    }

    // Mode message
    if (DEMO_MODE) {
        setTimeout(() => {
            showToast('מצב הדגמה - כל סיסמה תעבוד. הקם Firebase לעבודה אמיתית', 'info');
        }, 800);
    }
}

init();
