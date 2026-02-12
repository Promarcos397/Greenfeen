document.addEventListener('DOMContentLoaded', () => {

    // mobile menu setup
    const hamburger = document.querySelector('.hamburger');
    const navMobile = document.querySelector('.nav-mobile');

    function closeMobileNav() {
        if (navMobile) navMobile.classList.remove('active');
        const overlay = document.querySelector('.nav-overlay');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openMobileNav() {
        if (navMobile) navMobile.classList.add('active');
        // Create overlay if it doesn't exist
        let overlay = document.querySelector('.nav-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'nav-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', closeMobileNav);
        }
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            if (navMobile && navMobile.classList.contains('active')) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });
    }

    // Close mobile menu when a link is clicked
    if (navMobile) {
        navMobile.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });
    }

    // cart display items
    updateCartDisplay();

    // add to cart functionality
    const MAX_QTY_PER_ITEM = 10;

    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = button.dataset.id;
            const productName = button.dataset.name;
            const productPrice = parseFloat(button.dataset.price);

            // Check for a quantity input (product detail page)
            const detailsContainer = e.target.closest('.product-details');
            let quantity = 1;
            if (detailsContainer) {
                const qtyInput = detailsContainer.querySelector('input[type="number"]');
                if (qtyInput) {
                    quantity = parseInt(qtyInput.value) || 1;
                    if (quantity < 1) quantity = 1;
                }
            }

            // Check current quantity in cart
            const cart = JSON.parse(localStorage.getItem('greenfeen_cart')) || [];
            const existing = cart.find(item => item.id === productId);
            const currentQty = existing ? existing.quantity : 0;

            if (currentQty + quantity > MAX_QTY_PER_ITEM) {
                showToast(`Maximum ${MAX_QTY_PER_ITEM} per item. You already have ${currentQty} in your cart.`, 'warning');
                return;
            }

            addToCart(productId, productName, productPrice, quantity);

            // Visual Feedback on button
            const originalText = button.innerText;
            const originalBg = button.style.backgroundColor;
            button.innerHTML = '<i class="ph ph-check-circle"></i> Added!';
            button.style.backgroundColor = '#2E5935';
            button.disabled = true;
            setTimeout(() => {
                button.innerText = originalText;
                button.style.backgroundColor = originalBg || '';
                button.disabled = false;
            }, 1200);

            // Show toast
            showToast(`${productName} added to cart!`, 'success');
        });
    });

    // shop page filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card[data-category]');

    if (filterButtons.length > 0 && productCards.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button styles
                filterButtons.forEach(b => {
                    b.classList.remove('filter-active');
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-color)';
                });
                btn.classList.add('filter-active');
                btn.style.background = 'var(--primary-green)';
                btn.style.color = '#fff';

                const category = btn.dataset.filter;

                productCards.forEach(card => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.style.display = '';
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(10px)';
                        setTimeout(() => {
                            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Update product count
                const visibleCount = document.querySelectorAll('.product-card[data-category]:not([style*="display: none"])').length;
                const countEl = document.querySelector('.product-count');
                if (countEl) {
                    countEl.textContent = `Showing ${visibleCount} product${visibleCount !== 1 ? 's' : ''}`;
                }
            });
        });
    }

    // newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input');
            const email = emailInput.value.trim();
            if (email) {
                newsletterForm.innerHTML = `
                    <div style="text-align: center; padding: 1rem;">
                        <i class="ph ph-check-circle" style="font-size: 2.5rem; color: #fff;"></i>
                        <p style="margin-top: 0.5rem; font-size: 1.1rem;">Subscribed with <strong>${email}</strong>!</p>
                    </div>
                `;
            }
        });
    }



    // render cart page
    const cartItemsContainer = document.querySelector('.cart-items');
    if (cartItemsContainer) {
        renderCartPage();
    }

    // checkout page logic
    const checkoutSummary = document.querySelector('.checkout-items');
    if (checkoutSummary) {
        renderCheckoutSummary();
    }

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(checkoutForm);
            const fullName = formData.get('fullName');
            const email = formData.get('email');

            if (!fullName || !email) {
                showToast('Please fill in all required fields.', 'warning');
                return;
            }

            const cart = JSON.parse(localStorage.getItem('greenfeen_cart')) || [];
            if (cart.length === 0) {
                showToast('Your cart is empty!', 'warning');
                return;
            }

            const submitBtn = checkoutForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Processing...';
            submitBtn.disabled = true;

            // Build order data for EmailJS
            const orderData = {
                to_email: email,
                customer_name: fullName,
                customer_email: email,
                address: `${formData.get('address')}, ${formData.get('city')}, ${formData.get('postcode')}`,
                phone: formData.get('phone') || 'Not provided',
                order_items: cart.map(item => `${item.name} x${item.quantity} — £${(item.price * item.quantity).toFixed(2)}`).join('\n'),
                order_total: '£' + cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2),
                order_number: 'GF-' + Date.now().toString(36).toUpperCase()
            };

            // ─── EmailJS Send (if configured) ───
            // To enable: replace YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, YOUR_PUBLIC_KEY
            if (typeof emailjs !== 'undefined' && window.EMAILJS_CONFIGURED) {
                emailjs.send(
                    window.EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
                    window.EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID',
                    orderData
                ).then(() => {
                    completeOrder(orderData, submitBtn);
                }).catch((err) => {
                    console.error('EmailJS error:', err);
                    completeOrder(orderData, submitBtn); // Still complete even if email fails
                });
            } else {
                // Demo mode — just complete the order
                setTimeout(() => {
                    completeOrder(orderData, submitBtn);
                }, 1500);
            }
        });
    }

    // contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = contactForm.querySelector('#name').value.trim();
            const email = contactForm.querySelector('#email').value.trim();
            const subject = contactForm.querySelector('#subject');
            const subjectText = subject.options[subject.selectedIndex].text;
            const message = contactForm.querySelector('#message').value.trim();

            if (!name || !email || !message) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Sending...';
            submitBtn.disabled = true;

            const contactData = {
                from_name: name,
                from_email: email,
                subject: subjectText,
                message: message,
                to_email: email  // auto-reply goes to sender
            };

            if (typeof emailjs !== 'undefined' && window.EMAILJS_CONFIGURED) {
                emailjs.send(
                    window.EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
                    window.EMAILJS_CONTACT_TEMPLATE_ID || 'template_contact',
                    contactData
                ).then(() => {
                    contactForm.innerHTML = `
                        <div style="text-align: center; padding: 2rem 0;">
                            <i class="ph ph-check-circle" style="font-size: 4rem; color: var(--primary-green);"></i>
                            <h2 style="margin: 1rem 0 0.5rem;">Message Sent!</h2>
                            <p style="color: #666;">Thank you, ${name}. We'll get back to you within 24 hours.</p>
                        </div>`;
                }).catch((err) => {
                    console.error('EmailJS contact error:', err);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    showToast('Failed to send message. Please try again.', 'error');
                });
            } else {
                // Demo mode
                setTimeout(() => {
                    contactForm.innerHTML = `
                        <div style="text-align: center; padding: 2rem 0;">
                            <i class="ph ph-check-circle" style="font-size: 4rem; color: var(--primary-green);"></i>
                            <h2 style="margin: 1rem 0 0.5rem;">Message Sent!</h2>
                            <p style="color: #666;">Thank you, ${name}. We'll get back to you within 24 hours.</p>
                        </div>`;
                }, 1500);
            }
        });
    }
});

// helper functions

function completeOrder(orderData, submitBtn) {
    localStorage.removeItem('greenfeen_cart');
    updateCartDisplay();

    const main = document.querySelector('.checkout-container');
    if (main) {
        main.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <i class="ph ph-check-circle" style="font-size: 4rem; color: var(--primary-green);"></i>
                <h1 style="margin-top: 1rem;">Order Confirmed!</h1>
                <p style="font-size: 1.2rem; color: #666; margin: 1rem 0;">Order <strong>${orderData.order_number}</strong></p>
                <p>Thank you, <strong>${orderData.customer_name}</strong>. A confirmation has been sent to <strong>${orderData.customer_email}</strong>.</p>
                <div style="margin-top: 2rem;">
                    <a href="shop.html" class="btn">Continue Shopping</a>
                </div>
            </div>
        `;
    }
}

function renderCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('greenfeen_cart')) || [];
    const container = document.querySelector('.checkout-items');
    const totalEl = document.querySelector('.checkout-total');

    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty. <a href="shop.html">Go shopping</a></p>';
        if (totalEl) totalEl.textContent = '£0.00';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>${item.name} <span style="color:#999;">×${item.quantity}</span></span>
                <span style="font-weight: 600;">£${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    if (totalEl) {
        totalEl.textContent = '£' + total.toFixed(2);
    }
}

function showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; z-index: 9999;
        padding: 14px 24px; border-radius: 8px; font-size: 0.95rem;
        font-weight: 500; color: #fff; max-width: 350px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        transform: translateY(20px); opacity: 0;
        transition: all 0.3s ease; display: flex; align-items: center; gap: 10px;
    `;

    const icons = {
        success: 'ph-check-circle',
        warning: 'ph-warning',
        error: 'ph-x-circle',
        info: 'ph-info'
    };
    const colors = {
        success: '#2E7D32',
        warning: '#E65100',
        error: '#C62828',
        info: '#1565C0'
    };

    toast.style.background = colors[type] || colors.info;
    toast.innerHTML = `<i class="ph ${icons[type] || icons.info}" style="font-size: 1.3rem;"></i> ${message}`;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    // Auto-remove
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showFormMessage(form, msg, type) {
    const existing = form.parentElement.querySelector('.form-message');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'form-message';
    div.style.padding = '12px 16px';
    div.style.borderRadius = '6px';
    div.style.marginTop = '1rem';
    div.style.fontWeight = '500';

    if (type === 'success') {
        div.style.background = '#e8f5e9';
        div.style.color = '#2e7d32';
        div.style.border = '1px solid #a5d6a7';
    } else {
        div.style.background = '#ffebee';
        div.style.color = '#c62828';
        div.style.border = '1px solid #ef9a9a';
    }
    div.textContent = msg;
    form.parentElement.appendChild(div);

    setTimeout(() => {
        if (div.parentElement) {
            div.style.transition = 'opacity 0.3s';
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
        }
    }, 5000);
}

function addToCart(id, name, price, quantity = 1) {
    let cart = JSON.parse(localStorage.getItem('greenfeen_cart')) || [];

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id, name, price, quantity });
    }

    localStorage.setItem('greenfeen_cart', JSON.stringify(cart));
    updateCartDisplay();
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('greenfeen_cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(el => {
        el.innerText = totalItems;
        if (totalItems > 0) {
            el.style.transition = 'transform 0.2s';
            el.style.transform = 'scale(1.3)';
            setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
        }
    });
}

function renderCartPage() {
    const cart = JSON.parse(localStorage.getItem('greenfeen_cart')) || [];
    const container = document.querySelector('.cart-items');
    const totalElement = document.querySelector('.cart-total-price');

    if (!container) return;

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem;">
                <i class="ph ph-shopping-cart" style="font-size: 3rem; color: #ccc;"></i>
                <p style="margin-top: 1rem; color: #999; font-size: 1.1rem;">Your cart is empty.</p>
                <a href="shop.html" class="btn" style="margin-top: 1.5rem; display: inline-block;">Start Shopping</a>
            </div>
        `;
        if (totalElement) totalElement.innerText = '£0.00';
        return;
    }

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #eee;';

        cartItem.innerHTML = `
            <div>
                <h4 style="margin-bottom: 0.25rem;">${item.name}</h4>
                <p style="color: #777; font-size: 0.9rem;">£${item.price.toFixed(2)} × ${item.quantity}</p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="display: flex; align-items: center; gap: 5px; border: 1px solid #ddd; border-radius: 4px; padding: 2px;">
                    <button onclick="updateQuantity(${index}, -1)" style="border: none; background: none; cursor: pointer; padding: 4px 8px; font-size: 1rem;">−</button>
                    <span style="min-width: 24px; text-align: center; font-weight: 600;">${item.quantity}</span>
                    <button onclick="updateQuantity(${index}, 1)" style="border: none; background: none; cursor: pointer; padding: 4px 8px; font-size: 1rem;">+</button>
                </div>
                <span style="font-weight: bold; min-width: 60px; text-align: right;">£${itemTotal.toFixed(2)}</span>
                <button class="btn btn-secondary" onclick="removeFromCart(${index})" style="padding: 5px 10px; font-size: 0.8rem;">Remove</button>
            </div>
        `;
        container.appendChild(cartItem);
    });

    if (totalElement) {
        totalElement.innerText = '£' + total.toFixed(2);
    }
}

function updateQuantity(index, delta) {
    let cart = JSON.parse(localStorage.getItem('greenfeen_cart')) || [];
    if (cart[index]) {
        const newQty = cart[index].quantity + delta;
        if (newQty > 10) {
            showToast('Maximum 10 per item.', 'warning');
            return;
        }
        if (newQty < 1) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = newQty;
        }
        localStorage.setItem('greenfeen_cart', JSON.stringify(cart));
        updateCartDisplay();
        renderCartPage();
    }
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('greenfeen_cart')) || [];
    const removed = cart[index];
    cart.splice(index, 1);
    localStorage.setItem('greenfeen_cart', JSON.stringify(cart));
    updateCartDisplay();
    renderCartPage();
    if (removed) showToast(`${removed.name} removed from cart.`, 'info');
}
