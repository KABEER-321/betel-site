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

    // Form Submission Logic (Generic Handler)
    function handleFormSubmit(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const feedback = form.querySelector('.form-feedback');
            const originalText = btn.innerText;

            btn.innerText = 'Processing...';
            btn.disabled = true;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Prepare for WhatsApp redirection
            let whatsappMessage = "";
            const phone = "918432464520";

            if (formId === 'orderForm') {
                const quantity = `${data.quantity_num} ${data.quantity_unit}`;
                whatsappMessage = `Hello Mattesabnavar Exports,%0A%0AI would like to place an order request.%0A%0A*Name:* ${data.name}%0A*Phone:* ${data.phone}%0A*Product:* ${data.product}%0A*Quantity:* ${quantity}%0A*Address:* ${data.address}`;
            } else if (formId === 'inquiryForm') {
                whatsappMessage = `Hello Mattesabnavar Exports,%0A%0AI have a general inquiry.%0A%0A*Name:* ${data.name}%0A*Phone:* ${data.phone}%0A*Message:* ${data.message}`;
            }

            // Send to API first for record keeping
            fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(res => res.json())
                .then(resData => {
                    if (resData.success) {
                        feedback.classList.remove('hidden');
                        form.reset();

                        // WhatsApp Redirection
                        setTimeout(() => {
                            window.open(`https://wa.me/${phone}?text=${whatsappMessage}`, '_blank');
                            feedback.classList.add('hidden');
                        }, 2000);
                    } else {
                        alert('Error: ' + resData.error);
                    }
                })
                .catch(err => {
                    console.error(err);
                    // Still allow WhatsApp redirection even if API fails (better UX for user)
                    window.open(`https://wa.me/${phone}?text=${whatsappMessage}`, '_blank');
                    form.reset();
                })
                .finally(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                });
        });
    }

    // Initialize listeners
    handleFormSubmit('orderForm');
    handleFormSubmit('inquiryForm');

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
