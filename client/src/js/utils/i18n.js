// client/src/js/utils/i18n.js
import { resources } from './locales.js';

let currentLang = localStorage.getItem('language') || 'vi';

export function setLanguage(lang) {
    if (!resources[lang]) return;
    currentLang = lang;
    localStorage.setItem('language', lang); // Lưu vào localStorage để nhớ lần sau
    
    // Lưu ý: Cập nhật class cho body (nếu muốn style riêng theo ngôn ngữ)
    document.documentElement.setAttribute('lang', lang);
    
    applyTranslation();
}

export function getLanguage() {
    return currentLang;
}

export function t(key) {
    // Hàm dịch đơn lẻ dùng trong code JS (ví dụ Toast)
    return resources[currentLang][key] || key;
}

export function applyTranslation() {
    // 1. Dịch nội dung text (innerHTML / textContent)
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (resources[currentLang][key]) {
            // Nếu thẻ có input/textarea, ta có thể muốn dịch placeholder
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = resources[currentLang][key];
            } else {
                el.textContent = resources[currentLang][key];
            }
        }
    });

    // 2. Dịch placeholder riêng (nếu dùng data-i18n-placeholder)
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (resources[currentLang][key]) {
            el.placeholder = resources[currentLang][key];
        }
    });
}

// Tự động chạy khi import lần đầu để áp dụng ngôn ngữ đã lưu
document.addEventListener('DOMContentLoaded', () => {
    applyTranslation();
});