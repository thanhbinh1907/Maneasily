document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggle-switch');
    const labelMonthly = document.getElementById('label-monthly');
    const labelYearly = document.getElementById('label-yearly');
    const amounts = document.querySelectorAll('.amount');

    // Mặc định là Monthly
    let isYearly = false;

    toggleSwitch.addEventListener('change', (e) => {
        isYearly = e.target.checked;
        updatePricing();
    });

    function updatePricing() {
        if (isYearly) {
            labelMonthly.classList.remove('active');
            labelYearly.classList.add('active');
        } else {
            labelMonthly.classList.add('active');
            labelYearly.classList.remove('active');
        }

        amounts.forEach(el => {
            // Lấy giá trị từ data attribute
            const monthlyPrice = el.getAttribute('data-monthly');
            const yearlyPrice = el.getAttribute('data-yearly');

            // Nếu không có data attribute (ví dụ gói Free), bỏ qua
            if (!monthlyPrice || !yearlyPrice) return;

            // Hiệu ứng fade nhẹ
            el.style.opacity = 0;
            setTimeout(() => {
                el.textContent = isYearly ? yearlyPrice : monthlyPrice;
                el.style.opacity = 1;
            }, 200);
        });
    }
});