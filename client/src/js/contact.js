import { toast } from './utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = contactForm.querySelector('.btn-send');
            const originalText = btn.innerText;
            
            // Giả lập đang gửi
            btn.innerText = "Sending...";
            btn.disabled = true;

            setTimeout(() => {
                // Thành công
                toast.success("Message sent successfully! We'll contact you soon.");
                contactForm.reset();
                
                btn.innerText = originalText;
                btn.disabled = false;
            }, 1500);
        });
    }
});