const API_CONFIG = {
    baseUrl: 'https://fakestoreapi.com/products',
    categoryMap: {
        'all-products': ''
    }
};

async function loadProducts(category) {

    if (category !== 'all-products') return;

    const container = document.querySelector(`.products-container[data-category="${category}"]`);
    if (!container) {
        console.error(`Container not found for category: ${category}`);
        return;
    }

    if (container.dataset.loading === 'true') return;
    container.dataset.loading = 'true';

    showLoadingState(container);
    try {
        const apiCategory = API_CONFIG.categoryMap[category];

        const cached = getCachedProducts(category);
        if (cached) {
            displayProducts(cached, container);
            return;
        }

        const products = await fetchProducts(apiCategory);
        const filteredProducts = filterProducts(products, category);

        cacheProducts(category, filteredProducts);
        displayProducts(filteredProducts, container);
    } catch (error) {
        showErrorState(container, error);
    }
}

async function fetchProducts(apiCategory) {
    console.log(`Fetching products for category: ${apiCategory}`);
    try {
        const url = apiCategory ? `${API_CONFIG.baseUrl}/category/${apiCategory}` : API_CONFIG.baseUrl;

        const response = await fetch(url);

        if (response.status === 404) {
            throw new Error('API endpoint not found. Please check the URL.');
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (!data || !Array.isArray(data)) {
            throw new Error('Invalid data received from API');
        }

        console.log('Received products:', data);
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

function filterProducts(products, category) {
    if (category === 'all-products') return products.slice(0, 8);
    return [];
}

function showLoadingState(container) {
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading products...</p>
        </div>
    `;
}

function showErrorState(container, error) {
    console.error('Error loading products:', error);
    container.innerHTML = `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill"></i>
            Failed to load products. Please try again later.
            <div class="mt-2 small">${error.message}</div>
        </div>
    `;
}

function displayProducts(products, container) {
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle-fill"></i>
                No products found in this category.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="row g-4">
            ${products.map(product => renderProductCard(product)).join('')}
        </div>
    `;
}

function renderProductCard(product) {
    const imageUrl = product.image || 'https://via.placeholder.com/300';
    const rating = product.rating?.rate || 0;
    const discountPrice = product.price * 0.9;

    return `<div class="col-lg-3 col-md-4 col-sm-6">
            <div class="card h-100 shadow-sm">
                <div class="badge bg-danger position-absolute" style="top: 10px; right: 10px">
                    -10%
                </div>
                <img src="${imageUrl}"
                     class="card-img-top p-3"
                     alt="${product.title}"
                     style="height: 200px; object-fit: contain;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.title}</h5>
                    <div class="mb-2">${renderRatingStars(rating)}</div>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="text-decoration-line-through text-muted small">
                                    $${product.price.toFixed(2)}
                                </span>
                                <span class="fs-5 fw-bold ms-2 text-primary">
                                    $${discountPrice.toFixed(2)}
                                </span>
                            </div>
                            <button class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
        ${'<i class="bi bi-star-fill text-warning"></i>'.repeat(fullStars)}
        ${hasHalfStar ? '<i class="bi bi-star-half text-warning"></i>' : ''}
        ${'<i class="bi bi-star text-warning"></i>'.repeat(emptyStars)}
        <span class="small text-muted ms-1">${rating.toFixed(1)}</span>
    `;
}

function cacheProducts(category, products) {
    localStorage.setItem(`products_${category}`, JSON.stringify(products));
}

function getCachedProducts(category) {
    const cached = localStorage.getItem(`products_${category}`);
    return cached ? JSON.parse(cached) : null;
}

function initialize() {
    try {
        setupTabHandlers();
        loadInitialData();
        initMultiLevelMenu();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

function setupTabHandlers() {
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const target = e.target.getAttribute('data-bs-target') ||
                          (e.relatedTarget && e.relatedTarget.getAttribute('data-bs-target'));
            if (!target) return;

            const targetId = target.substring(1);
            const container = document.querySelector(`#${targetId} .products-container`);
            if (container) {
                const category = container.getAttribute('data-category');
                loadProducts(category);
            }
        });
    });
}

function loadInitialData() {
    const activeTabPane = document.querySelector('.tab-pane.fade.show.active');
    if (!activeTabPane) return;

    const container = activeTabPane.querySelector('.products-container');
    if (!container) return;

    const category = container.getAttribute('data-category');
    loadProducts(category);
}

function initMultiLevelMenu() {
    document.querySelectorAll('.dropdown-submenu > a').forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const submenu = this.nextElementSibling;
            if (!submenu) return;

            document.querySelectorAll('.dropdown-submenu .dropdown-menu').forEach(menu => {
                if (menu !== submenu) menu.classList.remove('show');
            });

            submenu.classList.toggle('show');
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-submenu')) {
            document.querySelectorAll('.dropdown-submenu .dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', initialize);
