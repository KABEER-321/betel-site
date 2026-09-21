document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Drawer Toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            const isExpanded = navLinks.classList.toggle('active');
            menuBtn.setAttribute('aria-expanded', isExpanded);
            const icon = menuBtn.querySelector('i');
            if (icon) {
                icon.className = isExpanded ? 'ri-close-line' : 'ri-menu-line';
            }
        });

        // Close mobile drawer on link click
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuBtn.setAttribute('aria-expanded', 'false');
                    const icon = menuBtn.querySelector('i');
                    if (icon) icon.className = 'ri-menu-line';
                }
            });
        });
    }

    // 2. Navbar Scroll Transition & Scroll Spy Active Link Highlight
    const sections = document.querySelectorAll('header[id], section[id]');
    const navItems = document.querySelectorAll('.nav-links a');

    const handleScroll = () => {
        if (window.scrollY > 40) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }

        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSectionId}`) {
                item.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 3. Smooth Product Selection from Product Cards
    window.selectProductForQuote = (productName) => {
        const productSelect = document.querySelector('select[name="product"]');
        const contactSection = document.getElementById('contact') || document.getElementById('quote-section');

        if (productSelect && productName) {
            for (let option of productSelect.options) {
                if (option.value.toLowerCase().includes(productName.toLowerCase()) || productName.toLowerCase().includes(option.value.toLowerCase())) {
                    productSelect.value = option.value;
                    break;
                }
            }
        }

        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // 4. Form Submission Handler (API & WhatsApp Integration)
    function handleFormSubmit(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const feedback = form.querySelector('.form-feedback');
            const originalBtnText = btn ? btn.innerHTML : 'Submit';

            if (btn) {
                btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Processing...';
                btn.disabled = true;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            if (data.quantity_num || data.quantity_unit) {
                data.quantity = `${data.quantity_num || ''} ${data.quantity_unit || ''}`.trim();
            }

            const whatsappNumber = "918432464520";
            let whatsappMessage = "";

            if (formId === 'orderForm') {
                const qtyText = data.quantity || `${data.quantity_num || ''} ${data.quantity_unit || ''}`.trim();
                const companyStr = data.company ? `%0A*Company:* ${encodeURIComponent(data.company)}` : '';
                const emailStr = data.email ? `%0A*Email:* ${encodeURIComponent(data.email)}` : '';
                const locationStr = data.location ? `%0A*City/Country:* ${encodeURIComponent(data.location)}` : '';
                const packingStr = data.packing ? `%0A*Packing:* ${encodeURIComponent(data.packing)}` : '';
                const addressStr = data.address ? `%0A*Destination:* ${encodeURIComponent(data.address)}` : '';
                const msgStr = data.message ? `%0A*Message:* ${encodeURIComponent(data.message)}` : '';

                whatsappMessage = `Hello Mattesabnavar Exports,%0A%0AI would like to place a quote request.%0A%0A*Name:* ${encodeURIComponent(data.name || '')}${companyStr}%0A*Phone:* ${encodeURIComponent(data.phone || '')}${emailStr}%0A*Product:* ${encodeURIComponent(data.product || '')}%0A*Quantity:* ${encodeURIComponent(qtyText)}${locationStr}${packingStr}${addressStr}${msgStr}`;
            } else if (formId === 'inquiryForm') {
                whatsappMessage = `Hello Mattesabnavar Exports,%0A%0AI have a general inquiry.%0A%0A*Name:* ${encodeURIComponent(data.name || '')}%0A*Phone:* ${encodeURIComponent(data.phone || '')}%0A*Message:* ${encodeURIComponent(data.message || '')}`;
            }

            fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(res => res.json())
                .then(resData => {
                    if (resData.success) {
                        if (feedback) {
                            feedback.classList.remove('hidden');
                            feedback.style.display = 'block';
                        }
                        form.reset();

                        setTimeout(() => {
                            if (whatsappMessage) {
                                window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank');
                            }
                            if (feedback) {
                                feedback.classList.add('hidden');
                                feedback.style.display = 'none';
                            }
                        }, 1500);
                    } else {
                        alert('Error submitting request: ' + (resData.error || 'Please try again.'));
                    }
                })
                .catch(err => {
                    console.error('API submission fallback:', err);
                    if (whatsappMessage) {
                        window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank');
                    }
                    form.reset();
                })
                .finally(() => {
                    if (btn) {
                        btn.innerHTML = originalBtnText;
                        btn.disabled = false;
                    }
                });
        });
    }

    handleFormSubmit('orderForm');
    handleFormSubmit('inquiryForm');

    // 5. Scroll Reveal Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));
});
