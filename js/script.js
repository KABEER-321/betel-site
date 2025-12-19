document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('ri-menu-line');
                icon.classList.add('ri-close-line');
            } else {
                icon.classList.remove('ri-close-line');
                icon.classList.add('ri-menu-line');
            }
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuBtn.querySelector('i').classList.remove('ri-close-line');
                menuBtn.querySelector('i').classList.add('ri-menu-line');
            }
        });
    });

    // Form Submission Logic (Real Persistence)
    const orderForm = document.getElementById('orderForm');
    const formFeedback = document.getElementById('formFeedback');

    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = orderForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';
            btn.disabled = true;

            // Capture Data
            const inputs = orderForm.querySelectorAll('input, select, textarea');
            const formData = {};

            inputs.forEach(input => {
                if (input.tagName === 'SELECT') {
                    formData.type = input.value;
                } else if (input.type === 'text' && input.placeholder.includes('Name')) {
                    formData.name = input.value;
                } else if (input.type === 'tel') {
                    formData.phone = input.value;
                } else if (input.tagName === 'TEXTAREA') {
                    formData.message = input.value;
                }
            });

            // Send to API
            fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        formFeedback.classList.remove('hidden');
                        orderForm.reset();

                        setTimeout(() => {
                            formFeedback.classList.add('hidden');
                        }, 5000);
                    } else {
                        alert('Error submitting order.');
                    }
                })
                .catch(err => console.error(err))
                .finally(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                });
        });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
        } else {
            navbar.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
        }
    });
});
