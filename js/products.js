// Sistema de Gestión de Productos
function loadProducts() {
    const products = getProducts();
    const productsTable = document.getElementById('productsTable');
    const inventoryTable = document.getElementById('inventoryTable');
    
    productsTable.innerHTML = '';
    inventoryTable.innerHTML = '';
    
    if (products.length === 0) {
        productsTable.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos registrados</td></tr>';
        inventoryTable.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos en inventario</td></tr>';
        return;
    }
    
    products.forEach(product => {
        // Tabla de productos (admin)
        const productRow = document.createElement('tr');
        productRow.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${getCategoryName(product.categoryId)}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="badge ${product.status === 'activo' ? 'badge-success' : 'badge-danger'}">
                    ${product.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-yellow me-1 edit-product" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-red delete-product" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        productsTable.appendChild(productRow);
        
        // Tabla de inventario (todos los roles)
        const inventoryRow = document.createElement('tr');
        const stockStatus = product.stock < 10 ? 'low-stock' : '';
        const totalValue = (product.stock * product.price).toFixed(2);
        
        inventoryRow.innerHTML = `
            <td>${product.name}</td>
            <td>${getCategoryName(product.categoryId)}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td class="${stockStatus}">${product.stock}</td>
            <td>$${totalValue}</td>
            <td>
                <span class="badge ${product.status === 'activo' ? 'badge-success' : 'badge-danger'}">
                    ${product.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-success me-1 register-entry" data-id="${product.id}" title="Registrar Entrada">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-sm btn-danger register-exit" data-id="${product.id}" title="Registrar Salida">
                    <i class="fas fa-minus"></i>
                </button>
            </td>
        `;
        inventoryTable.appendChild(inventoryRow);
    });
    
    // Agregar event listeners para admin
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.closest('button').dataset.id;
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.closest('button').dataset.id;
            deleteProduct(productId);
        });
    });
    
    // Agregar event listeners para empleados (movimientos rápidos)
    document.querySelectorAll('.register-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.closest('button').dataset.id;
            registerEntry(productId);
        });
    });
    
    document.querySelectorAll('.register-exit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.closest('button').dataset.id;
            registerExit(productId);
        });
    });
}

function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

function addProduct(product) {
    const products = getProducts();
    product.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    product.createdAt = new Date().toISOString();
    products.push(product);
    saveProducts(products);
    loadProducts();
    auth.showNotification('success', 'Producto creado', `${product.name} ha sido agregado exitosamente`);
}

function updateProduct(id, updatedProduct) {
    const products = getProducts();
    const index = products.findIndex(p => p.id == id);
    if (index !== -1) {
        products[index] = { ...products[index], ...updatedProduct };
        saveProducts(products);
        loadProducts();
        auth.showNotification('success', 'Producto actualizado', `${updatedProduct.name} ha sido actualizado`);
    }
}

function deleteProduct(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        const products = getProducts();
        const productName = products.find(p => p.id == id)?.name;
        const filteredProducts = products.filter(p => p.id != id);
        saveProducts(filteredProducts);
        loadProducts();
        auth.showNotification('success', 'Producto eliminado', `${productName} ha sido eliminado`);
    }
}

function editProduct(id) {
    const products = getProducts();
    const product = products.find(p => p.id == id);
    
    if (product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.categoryId;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productDescription').value = product.description || '';
        
        // Establecer estado
        if (product.status === 'activo') {
            document.getElementById('statusActive').checked = true;
        } else {
            document.getElementById('statusInactive').checked = true;
        }
        
        document.getElementById('productModalTitle').textContent = 'Editar Producto';
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    }
}

// Cargar categorías en el select
function loadCategoriesInSelect() {
    const categories = getCategories();
    const categorySelect = document.getElementById('productCategory');
    const movementCategorySelect = document.getElementById('movementProduct');
    
    categorySelect.innerHTML = '<option value="">Seleccione una categoría</option>';
    movementCategorySelect.innerHTML = '<option value="">Seleccione un producto</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
    
    // Cargar productos en el select de movimientos (solo activos)
    const products = getProducts().filter(p => p.status === 'activo');
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - Stock: ${product.stock}`;
        movementCategorySelect.appendChild(option);
    });
}

// Manejar formulario de productos
document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const product = {
        name: document.getElementById('productName').value,
        categoryId: parseInt(document.getElementById('productCategory').value),
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value,
        status: document.querySelector('input[name="productStatus"]:checked').value
    };
    
    if (productId) {
        updateProduct(productId, product);
    } else {
        addProduct(product);
    }
    
    // Reset form
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal.hide();
});

// Sistema de Categorías
function getCategories() {
    return JSON.parse(localStorage.getItem('categories')) || [];
}

function saveCategories(categories) {
    localStorage.setItem('categories', JSON.stringify(categories));
}

function loadCategories() {
    const categories = getCategories();
    const categoriesTable = document.getElementById('categoriesTable');
    const categoryFilter = document.getElementById('categoryFilter');
    
    categoriesTable.innerHTML = '';
    categoryFilter.innerHTML = '<option value="">Todas las Categorías</option>';
    
    if (categories.length === 0) {
        categoriesTable.innerHTML = '<tr><td colspan="4" class="text-center">No hay categorías registradas</td></tr>';
        return;
    }
    
    categories.forEach(category => {
        // Tabla de categorías
        const categoryRow = document.createElement('tr');
        categoryRow.innerHTML = `
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td>${category.description || '-'}</td>
            <td>
                <button class="btn btn-sm btn-yellow me-1 edit-category" data-id="${category.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-red delete-category" data-id="${category.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        categoriesTable.appendChild(categoryRow);
        
        // Filtro de categorías
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = e.target.closest('button').dataset.id;
            editCategory(categoryId);
        });
    });
    
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = e.target.closest('button').dataset.id;
            deleteCategory(categoryId);
        });
    });
}

function addCategory(category) {
    const categories = getCategories();
    category.id = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    categories.push(category);
    saveCategories(categories);
    loadCategories();
    loadCategoriesInSelect();
    auth.showNotification('success', 'Categoría creada', `${category.name} ha sido agregada`);
}

function updateCategory(id, updatedCategory) {
    const categories = getCategories();
    const index = categories.findIndex(c => c.id == id);
    if (index !== -1) {
        categories[index] = { ...categories[index], ...updatedCategory };
        saveCategories(categories);
        loadCategories();
        loadCategoriesInSelect();
        auth.showNotification('success', 'Categoría actualizada', `${updatedCategory.name} ha sido actualizada`);
    }
}

function deleteCategory(id) {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
        const categories = getCategories();
        const categoryName = categories.find(c => c.id == id)?.name;
        const filteredCategories = categories.filter(c => c.id != id);
        saveCategories(filteredCategories);
        loadCategories();
        loadCategoriesInSelect();
        auth.showNotification('success', 'Categoría eliminada', `${categoryName} ha sido eliminada`);
    }
}

function editCategory(id) {
    const categories = getCategories();
    const category = categories.find(c => c.id == id);
    
    if (category) {
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        
        document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
        const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
    }
}

// Manejar formulario de categorías
document.getElementById('categoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const categoryId = document.getElementById('categoryId').value;
    const category = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value
    };
    
    if (categoryId) {
        updateCategory(categoryId, category);
    } else {
        addCategory(category);
    }
    
    // Reset form
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
    modal.hide();
});

// Helper function para obtener nombre de categoría
function getCategoryName(categoryId) {
    const categories = getCategories();
    const category = categories.find(c => c.id == categoryId);
    return category ? category.name : 'Sin categoría';
}

// Inicializar categorías por defecto si no existen
if (!localStorage.getItem('categories')) {
    const defaultCategories = [
        { id: 1, name: 'Juguetes', description: 'Juguetes para adultos' },
        { id: 2, name: 'Lencería', description: 'Ropa íntima y lencería' },
        { id: 3, name: 'Lubricantes', description: 'Lubricantes y geles' },
        { id: 4, name: 'Condones', description: 'Preservativos y protección' },
        { id: 5, name: 'Accesorios', description: 'Accesorios varios' }
    ];
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
}

// Inicializar productos por defecto si no existen
if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify([]));
}

// Cargar productos y categorías al inicio
document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser) {
        loadProducts();
        loadCategories();
    }
});