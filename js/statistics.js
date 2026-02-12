// Sistema de Estadísticas
function updateDashboard() {
    const products = getProducts();
    const movements = getMovements();
    const today = new Date().toISOString().split('T')[0];
    
    // Total productos
    document.getElementById('totalProducts').textContent = products.length;
    
    // Entradas hoy
    const entriesToday = movements.filter(m => 
        m.type === 'entrada' && m.date.startsWith(today)
    ).reduce((sum, m) => sum + m.quantity, 0);
    document.getElementById('entriesToday').textContent = entriesToday;
    
    // Salidas hoy
    const exitsToday = movements.filter(m => 
        m.type === 'salida' && m.date.startsWith(today)
    ).reduce((sum, m) => sum + m.quantity, 0);
    document.getElementById('exitsToday').textContent = exitsToday;
    
    // Productos con bajo stock
    const lowStockCount = products.filter(p => p.stock < 10 && p.status === 'activo').length;
    document.getElementById('lowStockCount').textContent = lowStockCount;
}

function generateLowStockChart() {
    const products = getProducts().filter(p => p.stock < 10 && p.status === 'activo');
    
    // Obtener el canvas
    const canvasElement = document.getElementById('lowStockChart');
    if (!canvasElement) {
        console.error('Canvas lowStockChart no encontrado');
        return;
    }
    
    // Si ya existe un gráfico, destruirlo correctamente
    if (window.lowStockChart && typeof window.lowStockChart.destroy === 'function') {
        window.lowStockChart.destroy();
    }
    
    if (products.length === 0) {
        canvasElement.innerHTML = '<p class="text-center text-muted">No hay productos con bajo stock</p>';
        return;
    }
    
    const ctx = canvasElement.getContext('2d');
    
    window.lowStockChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: products.map(p => p.name),
            datasets: [{
                label: 'Stock Actual',
                data: products.map(p => p.stock),
                backgroundColor: 'rgba(220, 20, 60, 0.7)',
                borderColor: 'rgba(220, 20, 60, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Productos con Bajo Stock (< 10 unidades) - El Sex Shopo De Riki'
                }
            }
        }
    });
}

function generateMovementsChart() {
    const movements = getMovements();
    const last7Days = getLast7Days();
    
    // Obtener el canvas
    const canvasElement = document.getElementById('movementsChart');
    if (!canvasElement) {
        console.error('Canvas movementsChart no encontrado');
        return;
    }
    
    // Si ya existe un gráfico, destruirlo correctamente
    if (window.movementsChart && typeof window.movementsChart.destroy === 'function') {
        window.movementsChart.destroy();
    }
    
    const entriesData = last7Days.map(day => {
        return movements.filter(m => 
            m.type === 'entrada' && m.date.startsWith(day)
        ).reduce((sum, m) => sum + m.quantity, 0);
    });
    
    const exitsData = last7Days.map(day => {
        return movements.filter(m => 
            m.type === 'salida' && m.date.startsWith(day)
        ).reduce((sum, m) => sum + m.quantity, 0);
    });
    
    const ctx = canvasElement.getContext('2d');
    
    window.movementsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(d => new Date(d).toLocaleDateString('es-ES', {day: 'numeric', month: 'short'})),
            datasets: [
                {
                    label: 'Entradas',
                    data: entriesData,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Salidas',
                    data: exitsData,
                    borderColor: 'rgba(220, 20, 60, 1)',
                    backgroundColor: 'rgba(220, 20, 60, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Movimientos por Día (Últimos 7 días) - El Sex Shopo De Riki'
                }
            }
        }
    });
}

function generateTopProductsChart() {
    const movements = getMovements();
    const products = getProducts();
    
    // Obtener el canvas
    const canvasElement = document.getElementById('topProductsChart');
    if (!canvasElement) {
        console.error('Canvas topProductsChart no encontrado');
        return;
    }
    
    // Si ya existe un gráfico, destruirlo correctamente
    if (window.topProductsChart && typeof window.topProductsChart.destroy === 'function') {
        window.topProductsChart.destroy();
    }
    
    // Calcular movimientos por producto
    const productMovements = products.map(product => {
        const productMoves = movements.filter(m => m.productId == product.id);
        return {
            id: product.id,
            name: product.name,
            total: productMoves.reduce((sum, m) => sum + m.quantity, 0),
            entries: productMoves.filter(m => m.type === 'entrada').reduce((sum, m) => sum + m.quantity, 0),
            exits: productMoves.filter(m => m.type === 'salida').reduce((sum, m) => sum + m.quantity, 0)
        };
    }).sort((a, b) => b.total - a.total).slice(0, 10); // Top 10
    
    if (productMovements.length === 0) {
        canvasElement.innerHTML = '<p class="text-center text-muted">No hay datos suficientes para mostrar estadísticas</p>';
        return;
    }
    
    const ctx = canvasElement.getContext('2d');
    
    window.topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productMovements.map(p => p.name),
            datasets: [
                {
                    label: 'Entradas',
                    data: productMovements.map(p => p.entries),
                    backgroundColor: 'rgba(40, 167, 69, 0.7)'
                },
                {
                    label: 'Salidas',
                    data: productMovements.map(p => p.exits),
                    backgroundColor: 'rgba(220, 20, 60, 0.7)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Productos'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Top 10 Productos Más Movidos - El Sex Shopo De Riki'
                }
            }
        }
    });
}

function getLast7Days() {
    const dates = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
}

// Actualizar estadísticas al cargar la sección
document.querySelector('[data-section="statistics"]').addEventListener('click', () => {
    setTimeout(() => {
        generateLowStockChart();
        generateMovementsChart();
        generateTopProductsChart();
    }, 100);
});

// Cargar estadísticas iniciales
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});