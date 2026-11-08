(() => {
  "use strict";

  const products = [
    { id: 1, name: "Minimalist Watch", category: "Accessories", price: 189, image: "photo-1523275335684-37898b6baf30", alt: "Minimalist watch with a soft leather strap", tag: "Bestseller" },
    { id: 2, name: "Leather Notebook", category: "Stationery", price: 38.5, image: "photo-1544816155-12df9643f363", alt: "Open notebook with a warm neutral cover", tag: "Everyday essential" },
    { id: 3, name: "Ceramic Mug", category: "Home", price: 24, image: "photo-1514228742587-6b1558fcca3d", alt: "Handmade ceramic mug on a wooden surface", tag: "" },
    { id: 4, name: "Wireless Earbuds", category: "Tech", price: 129, image: "photo-1606220945770-b5b6c2c55bf1", alt: "Compact wireless earbuds and charging case", tag: "New" },
    { id: 5, name: "Linen Throw", category: "Home", price: 79.9, image: "photo-1600210492486-724fe5c67fb0", alt: "Softly layered linen textiles in a calm living room", tag: "" },
    { id: 6, name: "Smart Backpack", category: "Bags", price: 112, image: "photo-1553062407-98eeb64c6a62", alt: "Everyday backpack with considered utility", tag: "Bestseller" },
    { id: 7, name: "Scented Candle", category: "Home", price: 32, image: "photo-1603006905003-be475563bc59", alt: "A softly glowing candle in a glass vessel", tag: "" },
    { id: 8, name: "Running Sneakers", category: "Footwear", price: 145, image: "photo-1542291026-7eec264c27ff", alt: "Comfortable running sneaker in a vivid red colorway", tag: "New" },
    { id: 9, name: "Sunglasses", category: "Accessories", price: 68, image: "photo-1511499767150-a48a237f0083", alt: "Classic sunglasses styled for a sunny day", tag: "" },
    { id: 10, name: "Yoga Mat", category: "Fitness", price: 54, image: "photo-1506629905607-d9c297d8f6e5", alt: "Yoga mat ready for a quiet morning practice", tag: "" },
    { id: 11, name: "Mechanical Keyboard", category: "Tech", price: 159, image: "photo-1587829741301-dc798b83add3", alt: "Mechanical keyboard with tactile keys", tag: "Staff pick" },
    { id: 12, name: "Stainless Bottle", category: "Home", price: 42, image: "photo-1602143407151-7111542de6e8", alt: "Reusable stainless steel water bottle", tag: "" }
  ];

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const cartStorageKey = "luxe_cart";
  const productGrid = document.getElementById("productGrid");
  const categoryFilters = document.getElementById("categoryFilters");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const resultsCount = document.getElementById("resultsCount");
  const emptyResults = document.getElementById("emptyResults");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartItems = document.getElementById("cartItems");
  const toast = document.getElementById("toastMessage");
  const openCartButton = document.getElementById("openCartButton");
  const closeCartButton = document.getElementById("closeCartButton");
  const continueShoppingButton = document.getElementById("continueShoppingButton");
  const cartCount = document.getElementById("cartCount");
  const cartTitleCount = document.getElementById("cartTitleCount");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const shippingMessage = document.getElementById("shippingMessage");

  let selectedCategory = "All";
  let cart = readCart();
  let toastTimer;
  let drawerCloseTimer;
  let lastFocusedElement;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function imageUrl(image, width = 720) {
    return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=82`;
  }

  function getProduct(productId) {
    return products.find((product) => product.id === Number(productId));
  }

  function readCart() {
    try {
      const saved = localStorage.getItem(cartStorageKey);
      if (!saved) return [];

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        console.warn("Saved LUXE bag was not a list; starting with an empty bag.");
        return [];
      }

      return parsed.reduce((items, item) => {
        const product = item && getProduct(item.id);
        const quantity = Number(item && item.quantity);
        if (product && Number.isInteger(quantity) && quantity > 0) {
          const existing = items.find((entry) => entry.id === product.id);
          if (existing) existing.quantity += quantity;
          else items.push({ id: product.id, quantity });
        }
        return items;
      }, []);
    } catch (error) {
      console.warn("Could not read the saved LUXE bag; starting with an empty bag.", error);
      return [];
    }
  }

  function persistCart() {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (error) {
      console.warn("Could not save the LUXE bag in this browser.", error);
      showToast("Your bag is available for this visit, but couldn't be saved.");
    }
  }

  function renderCategories() {
    const categories = [...new Set(products.map((product) => product.category))];
    categoryFilters.insertAdjacentHTML("beforeend", categories.map((category) => `
      <button class="filter-chip" type="button" data-category="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>
    `).join(""));
  }

  function filteredProducts() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const visibleProducts = products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesQuery = !query || `${product.name} ${product.category}`.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });

    switch (sortSelect.value) {
      case "price-low":
        visibleProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        visibleProducts.sort((a, b) => b.price - a.price);
        break;
      case "name":
        visibleProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return visibleProducts;
  }

  function renderProducts() {
    const visibleProducts = filteredProducts();
    productGrid.innerHTML = visibleProducts.map((product) => `
      <article class="product-card">
        <div class="product-image">
          <img src="${imageUrl(product.image)}" alt="${escapeHtml(product.alt)}" loading="lazy">
          ${product.tag ? `<span class="product-tag">${escapeHtml(product.tag)}</span>` : ""}
          <button class="add-button" type="button" data-add-product="${product.id}" aria-label="Add ${escapeHtml(product.name)} to bag">+</button>
        </div>
        <div class="product-info">
          <div>
            <p class="product-category">${escapeHtml(product.category)}</p>
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
          </div>
          <p class="product-price">${currency.format(product.price)}</p>
        </div>
      </article>
    `).join("");

    resultsCount.textContent = `Showing ${visibleProducts.length} of ${products.length} considered finds`;
    emptyResults.hidden = visibleProducts.length > 0;
    productGrid.hidden = visibleProducts.length === 0;
    productGrid.querySelectorAll("img").forEach(hideImageOnError);
  }

  function hideImageOnError(image) {
    image.addEventListener("error", () => {
      image.hidden = true;
    }, { once: true });
  }

  function addToCart(productId) {
    const product = getProduct(productId);
    if (!product) return;

    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, quantity: 1 });

    persistCart();
    renderCart();
    showToast(`${product.name} added to your bag`);
  }

  function renderCart() {
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cart.reduce((total, item) => {
      const product = getProduct(item.id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);

    cartCount.textContent = totalQuantity > 99 ? "99+" : String(totalQuantity);
    openCartButton.setAttribute("aria-label", `Open shopping bag, ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`);
    cartTitleCount.textContent = `(${totalQuantity})`;
    cartSubtotal.textContent = currency.format(subtotal);
    shippingMessage.textContent = subtotal >= 100
      ? "Lovely news — your order ships for free."
      : `Add ${currency.format(100 - subtotal)} more for complimentary shipping.`;

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <span aria-hidden="true">✳</span>
          <h3>Your bag is taking a breather</h3>
          <p>Find something lovely to bring home.</p>
        </div>
      `;
      return;
    }

    cartItems.innerHTML = cart.map((item) => {
      const product = getProduct(item.id);
      if (!product) return "";
      return `
        <article class="cart-item">
          <div class="cart-item-image"><img src="${imageUrl(product.image, 180)}" alt="" loading="lazy"></div>
          <div class="cart-item-details">
            <h3>${escapeHtml(product.name)}</h3>
            <p>${currency.format(product.price)}</p>
            <div class="quantity-control" aria-label="Quantity for ${escapeHtml(product.name)}">
              <button type="button" data-quantity-change="-1" data-product-id="${product.id}" aria-label="Decrease ${escapeHtml(product.name)} quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-quantity-change="1" data-product-id="${product.id}" aria-label="Increase ${escapeHtml(product.name)} quantity">+</button>
            </div>
          </div>
          <div class="cart-item-side">
            <strong>${currency.format(product.price * item.quantity)}</strong>
            <button class="remove-item" type="button" data-remove-product="${product.id}" aria-label="Remove ${escapeHtml(product.name)} from bag">Remove</button>
          </div>
        </article>
      `;
    }).join("");

    cartItems.querySelectorAll(".cart-item-image img").forEach(hideImageOnError);
  }

  function changeQuantity(productId, amount) {
    const item = cart.find((entry) => entry.id === Number(productId));
    if (!item) return;

    item.quantity += amount;
    if (item.quantity <= 0) cart = cart.filter((entry) => entry.id !== item.id);
    persistCart();
    renderCart();
  }

  function removeFromCart(productId) {
    const product = getProduct(productId);
    cart = cart.filter((item) => item.id !== Number(productId));
    persistCart();
    renderCart();
    if (product) showToast(`${product.name} removed from your bag`);
  }

  function openCart() {
    if (!cartDrawer.hidden) return;
    lastFocusedElement = document.activeElement;
    window.clearTimeout(drawerCloseTimer);
    cartDrawer.hidden = false;
    cartBackdrop.hidden = false;
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    requestAnimationFrame(() => {
      cartDrawer.classList.add("is-open");
      cartBackdrop.classList.add("is-visible");
      closeCartButton.focus();
    });
  }

  function closeCart() {
    if (cartDrawer.hidden) return;
    cartDrawer.classList.remove("is-open");
    cartBackdrop.classList.remove("is-visible");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    window.clearTimeout(drawerCloseTimer);
    drawerCloseTimer = window.setTimeout(() => {
      cartDrawer.hidden = true;
      cartBackdrop.hidden = true;
    }, 280);
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function selectCategory(category) {
    selectedCategory = category;
    categoryFilters.querySelectorAll("[data-category]").forEach((button) => {
      const isActive = button.dataset.category === category;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    renderProducts();
  }

  categoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (button) selectCategory(button.dataset.category);
  });

  productGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-product]");
    if (button) addToCart(button.dataset.addProduct);
  });

  cartItems.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity-change]");
    if (quantityButton) {
      changeQuantity(quantityButton.dataset.productId, Number(quantityButton.dataset.quantityChange));
      return;
    }
    const removeButton = event.target.closest("[data-remove-product]");
    if (removeButton) removeFromCart(removeButton.dataset.removeProduct);
  });

  document.querySelectorAll("[data-nav-category]").forEach((link) => {
    link.addEventListener("click", () => selectCategory(link.dataset.navCategory));
  });

  searchInput.addEventListener("input", renderProducts);
  sortSelect.addEventListener("change", renderProducts);
  openCartButton.addEventListener("click", openCart);
  closeCartButton.addEventListener("click", closeCart);
  continueShoppingButton.addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);

  document.addEventListener("keydown", (event) => {
    if (cartDrawer.hidden) return;
    if (event.key === "Escape") {
      closeCart();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = [...cartDrawer.querySelectorAll("button:not(:disabled), a[href], input, select, [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.hidden);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.getElementById("resetFiltersButton").addEventListener("click", () => {
    searchInput.value = "";
    sortSelect.value = "featured";
    selectCategory("All");
  });

  document.getElementById("checkoutButton").addEventListener("click", () => {
    showToast(cart.length ? "Checkout is not connected in this demo yet." : "Your bag is empty — find something lovely first.");
  });

  document.getElementById("newsletterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    document.getElementById("newsletterMessage").textContent = "Thanks for your interest — signup is not connected just yet.";
    event.currentTarget.reset();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== cartStorageKey) return;
    cart = readCart();
    renderCart();
  });

  document.getElementById("currentYear").textContent = String(new Date().getFullYear());
  renderCategories();
  renderProducts();
  renderCart();
})();
