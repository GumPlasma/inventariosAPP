// Sistema de Gestión de Movimientos
function loadMovements() {
    const movements = getMovements();
    const movementsTable = document.getElementById('movementsTable');
    const recentMovementsTable = document.getElementById('recentMovementsTable');
    
    movementsTable.innerHTML = '';
    recentMovementsTable.innerHTML = '';
    
    if (movements.length === 0) {
        movementsTable.innerHTML = '<tr><td colspan="6" class="text-center">No hay movimientos registrados</td></tr>';
        recentMovementsTable.innerHTML = '<tr><td colspan="5" class="text-center">No hay movimientos recientes</td></tr>';
        return;
    }
    
    // Ordenar movimientos por fecha descendente
    const sortedMovements = [...movements].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedMovements.forEach(movement => {
        const product = getProductById(movement.productId);
        const user = getUserById(movement.userId);
        
        if (!product) return; // Si el producto fue eliminado, no mostrar
        
        const movementRow = document.createElement('tr');
        movementRow.innerHTML = `
            <td>${formatDate(movement.date)}</td>
            <td>
                <span class="badge ${movement.type === 'entrada' ? 'badge-success' : 'badge-danger'}">
                    ${movement.type === 'entrada' ? 'Entrada' : 'Salida'}
                </span>
            </td>
            <td>${product.name}</td>
            <td>${movement.quantity}</td>
            <td>${user ? user.name : 'Desconocido'}</td>
            <td>${movement.notes || '-'}</td>
        `;
        movementsTable.appendChild(movementRow);
    });
    
    // Mostrar últimos 5 movimientos en dashboard
    sortedMovements.slice(0, 5).forEach(movement => {
        const product = getProductById(movement.productId);
        const user = getUserById(movement.userId);
        
        if (!product) return;
        
        const recentRow = document.createElement('tr');
        recentRow.innerHTML = `
            <td>${formatDate(movement.date)}</td>
            <td>
                <span class="badge ${movement.type === 'entrada' ? 'badge-success' : 'badge-danger'}">
                    ${movement.type === 'entrada' ? 'Entrada' : 'Salida'}
                </span>
            </td>
            <td>${product.name}</td>
            <td>${movement.quantity}</td>
            <td>${user ? user.name : 'Desconocido'}</td>
        `;
        recentMovementsTable.appendChild(recentRow);
    });
}

function getMovements() {
    return JSON.parse(localStorage.getItem('movements')) || [];
}

function saveMovements(movements) {
    localStorage.setItem('movements', JSON.stringify(movements));
}

function addMovement(movement) {
    const movements = getMovements();
    movement.id = movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1;
    movement.date = new Date().toISOString();
    movement.userId = auth.currentUser.id;
    movements.push(movement);
    saveMovements(movements);
    
    // Actualizar stock del producto
    updateProductStock(movement.productId, movement.type, movement.quantity);
    
    loadMovements();
    loadProducts();
    updateDashboard();
    
    auth.showNotification('success', 'Movimiento registrado', 
        `${movement.type === 'entrada' ? 'Entrada' : 'Salida'} de ${movement.quantity} unidades registrada`);
}

function updateProductStock(productId, type, quantity) {
    const products = getProducts();
    const index = products.findIndex(p => p.id == productId);
    
    if (index !== -1) {
        if (type === 'entrada') {
            products[index].stock += quantity;
        } else if (type === 'salida') {
            products[index].stock -= quantity;
            if (products[index].stock < 0) {
                products[index].stock = 0;
            }
        }
        saveProducts(products);
    }
}

function getProductById(id) {
    const products = getProducts();
    return products.find(p => p.id == id);
}

function getUserById(id) {
    const users = JSON.parse(localStorage.getItem('users'));
    return users.find(u => u.id == id);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Manejar formulario de movimientos
document.getElementById('movementForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const movement = {
        type: document.getElementById('movementType').value,
        productId: parseInt(document.getElementById('movementProduct').value),
        quantity: parseInt(document.getElementById('movementQuantity').value),
        notes: document.getElementById('movementNotes').value
    };
    
    // Validar stock para salidas
    if (movement.type === 'salida') {
        const product = getProductById(movement.productId);
        if (product.stock < movement.quantity) {
            auth.showNotification('error', 'Error', 'Stock insuficiente para esta salida');
            return;
        }
    }
    
    addMovement(movement);
    
    // Reset form
    document.getElementById('movementForm').reset();
    document.getElementById('movementProductId').value = '';
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('movementModal'));
    modal.hide();
});

// Filtrar movimientos
document.getElementById('filterMovementsBtn').addEventListener('click', () => {
    const typeFilter = document.getElementById('movementTypeFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    const movements = getMovements();
    let filteredMovements = [...movements];
    
    if (typeFilter) {
        filteredMovements = filteredMovements.filter(m => m.type === typeFilter);
    }
    
    if (dateFilter) {
        filteredMovements = filteredMovements.filter(m => {
            const movementDate = new Date(m.date).toISOString().split('T')[0];
            return movementDate === dateFilter;
        });
    }
    
    // Actualizar tabla con movimientos filtrados
    const movementsTable = document.getElementById('movementsTable');
    movementsTable.innerHTML = '';
    
    if (filteredMovements.length === 0) {
        movementsTable.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron movimientos con los filtros aplicados</td></tr>';
        return;
    }
    
    filteredMovements.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(movement => {
        const product = getProductById(movement.productId);
        const user = getUserById(movement.userId);
        
        if (!product) return;
        
        const movementRow = document.createElement('tr');
        movementRow.innerHTML = `
            <td>${formatDate(movement.date)}</td>
            <td>
                <span class="badge ${movement.type === 'entrada' ? 'badge-success' : 'badge-danger'}">
                    ${movement.type === 'entrada' ? 'Entrada' : 'Salida'}
                </span>
            </td>
            <td>${product.name}</td>
            <td>${movement.quantity}</td>
            <td>${user ? user.name : 'Desconocido'}</td>
            <td>${movement.notes || '-'}</td>
        `;
        movementsTable.appendChild(movementRow);
    });
});

// Función para registrar entrada rápida desde inventario
function registerEntry(productId) {
    document.getElementById('movementType').value = 'entrada';
    document.getElementById('movementProduct').value = productId;
    document.getElementById('movementModalTitle').textContent = 'Registrar Entrada';
    const modal = new bootstrap.Modal(document.getElementById('movementModal'));
    modal.show();
}

// Función para registrar salida rápida desde inventario
function registerExit(productId) {
    document.getElementById('movementType').value = 'salida';
    document.getElementById('movementProduct').value = productId;
    document.getElementById('movementModalTitle').textContent = 'Registrar Salida';
    const modal = new bootstrap.Modal(document.getElementById('movementModal'));
    modal.show();
}

// Cargar movimientos al inicio
document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser) {
        loadMovements();
    }
});