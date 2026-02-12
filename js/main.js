// Funciones principales y configuración
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales si hay sesión activa
    if (auth.currentUser) {
        loadCategoriesInSelect();
    }
    
    // Manejar navegación
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover clase active de todas las secciones y links
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            // Activar sección seleccionada
            const sectionId = e.target.getAttribute('data-section') || e.target.closest('a').getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
            e.target.closest('a').classList.add('active');
            
            // Scroll al top
            window.scrollTo(0, 0);
        });
    });
    
    // Toggle sidebar
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('collapsed');
    });
    
    // Filtrar inventario
    document.getElementById('searchInventory').addEventListener('input', filterInventory);
    document.getElementById('categoryFilter').addEventListener('change', filterInventory);
    
    function filterInventory() {
        const searchTerm = document.getElementById('searchInventory').value.toLowerCase();
        const categoryId = document.getElementById('categoryFilter').value;
        
        const products = getProducts();
        let filteredProducts = [...products];
        
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description?.toLowerCase().includes(searchTerm)
            );
        }
        
        if (categoryId) {
            filteredProducts = filteredProducts.filter(p => p.categoryId == categoryId);
        }
        
        // Actualizar tabla de inventario
        const inventoryTable = document.getElementById('inventoryTable');
        inventoryTable.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            inventoryTable.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron productos</td></tr>';
            return;
        }
        
        filteredProducts.forEach(product => {
            const stockStatus = product.stock < 10 ? 'low-stock' : '';
            const totalValue = (product.stock * product.price).toFixed(2);
            
            const inventoryRow = document.createElement('tr');
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
            `;
            inventoryTable.appendChild(inventoryRow);
        });
    }
    
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Auto-actualizar dashboard cada 30 segundos
    setInterval(updateDashboard, 30000);
});

// Función para formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Función para formatear fecha
function formatDateDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para mostrar confirmación
function showConfirmation(title, message, onConfirm) {
    if (confirm(`${title}\n\n${message}`)) {
        onConfirm();
    }
}

// Función para exportar datos
function exportData(type) {
    let data = [];
    let filename = '';
    
    switch(type) {
        case 'products':
            data = getProducts();
            filename = 'productos.csv';
            break;
        case 'movements':
            data = getMovements();
            filename = 'movimientos.csv';
            break;
        case 'inventory':
            data = getProducts().map(p => ({
                nombre: p.name,
                categoria: getCategoryName(p.categoryId),
                precio: p.price,
                stock: p.stock,
                valor_total: p.stock * p.price,
                estado: p.status
            }));
            filename = 'inventario.csv';
            break;
    }
    
    if (data.length === 0) {
        auth.showNotification('warning', 'Sin datos', 'No hay datos para exportar');
        return;
    }
    
    // Convertir a CSV
    const csv = convertToCSV(data);
    downloadCSV(csv, filename);
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => {
        const value = obj[header];
        return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"`
            : value;
    }).join(','));
    
    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Función para imprimir reporte
function printReport(type) {
    const printWindow = window.open('', '_blank');
    let content = '';
    
    switch(type) {
        case 'inventory':
            content = generateInventoryReport();
            break;
        case 'movements':
            content = generateMovementsReport();
            break;
    }
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Reporte - El Sex Shopo De Riki</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #000; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #000; color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body onload="window.print()">
                ${content}
                <div class="footer">
                    <p>El Sex Shopo De Riki - Reporte generado el ${new Date().toLocaleDateString()}</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

function generateInventoryReport() {
    const products = getProducts();
    let tableRows = '';
    
    products.forEach(product => {
        tableRows += `
            <tr>
                <td>${product.name}</td>
                <td>${getCategoryName(product.categoryId)}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>$${(product.stock * product.price).toFixed(2)}</td>
                <td>${product.status}</td>
            </tr>
        `;
    });
    
    return `
        <h1>Reporte de Inventario - El Sex Shopo De Riki</h1>
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Valor Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

function generateMovementsReport() {
    const movements = getMovements().sort((a, b) => new Date(b.date) - new Date(a.date));
    let tableRows = '';
    
    movements.forEach(movement => {
        const product = getProductById(movement.productId);
        const user = getUserById(movement.userId);
        
        if (!product) return;
        
        tableRows += `
            <tr>
                <td>${formatDate(movement.date)}</td>
                <td>${movement.type === 'entrada' ? 'Entrada' : 'Salida'}</td>
                <td>${product.name}</td>
                <td>${movement.quantity}</td>
                <td>${user ? user.name : 'Desconocido'}</td>
                <td>${movement.notes || '-'}</td>
            </tr>
        `;
    });
    
    return `
        <h1>Reporte de Movimientos - El Sex Shopo De Riki</h1>
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Usuario</th>
                    <th>Notas</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

// Botones de exportación e impresión
document.addEventListener('DOMContentLoaded', () => {
    // Agregar botones de exportación en las secciones correspondientes
    const exportButtons = `
        <div class="btn-group mb-3" role="group">
            <button class="btn btn-sm btn-yellow" onclick="exportData('products')">
                <i class="fas fa-file-csv"></i> Exportar CSV
            </button>
            <button class="btn btn-sm btn-black" onclick="printReport('inventory')">
                <i class="fas fa-print"></i> Imprimir
            </button>
        </div>
    `;
    
    // Insertar botones en las secciones apropiadas
    const productsSection = document.querySelector('#products .mb-3');
    if (productsSection) {
        productsSection.insertAdjacentHTML('beforebegin', exportButtons.replace('products', 'products'));
    }
    
    const inventorySection = document.querySelector('#inventory .mb-3');
    if (inventorySection) {
        inventorySection.insertAdjacentHTML('beforebegin', exportButtons.replace('products', 'inventory'));
    }
    
    const movementsSection = document.querySelector('#movements .mb-3');
    if (movementsSection) {
        movementsSection.insertAdjacentHTML('beforebegin', exportButtons.replace('products', 'movements'));
    }
});