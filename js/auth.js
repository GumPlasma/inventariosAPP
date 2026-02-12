// Sistema de Autenticación
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.loginModal = null;
        this.init();
    }

    init() {
        this.loadUsers();
        this.setupEventListeners();
    }

    loadUsers() {
        // Cargar usuarios por defecto si no existen
        if (!localStorage.getItem('users')) {
            const defaultUsers = [
                { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador', status: 'activo', createdAt: new Date().toISOString() },
                { id: 2, username: 'empleado', password: 'empleado123', role: 'empleado', name: 'Empleado', status: 'activo', createdAt: new Date().toISOString() }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.username === username && u.password === password && u.status === 'activo');

        if (user) {
            this.currentUser = user;
            this.saveSession(user);
            this.showApp();
            this.showNotification('success', '¡Bienvenido!', `Hola ${user.name}`);
            
            // Limpiar y cerrar modal
            document.getElementById('loginForm').reset();
            if (this.loginModal) {
                this.loginModal.hide();
            }
        } else {
            this.showNotification('error', 'Error', 'Usuario o contraseña incorrectos, o usuario inactivo');
        }
    }

    logout() {
        // Limpiar sesión
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Ocultar aplicación
        document.getElementById('appContainer').classList.add('d-none');
        
        // Limpiar el body de clases que Bootstrap agrega
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Remover backdrop si existe
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Mostrar modal de login
        if (!this.loginModal) {
            this.loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
                backdrop: 'static',
                keyboard: false
            });
        }
        this.loginModal.show();
        
        this.showNotification('info', 'Sesión cerrada', 'Has cerrado sesión correctamente');
    }

    saveSession(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    loadSession() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            return true;
        }
        return false;
    }

    showApp() {
        // Ocultar modal de login si está visible
        if (this.loginModal && this.loginModal._isShown) {
            this.loginModal.hide();
        }
        
        // Mostrar aplicación
        document.getElementById('appContainer').classList.remove('d-none');
        
        // Mostrar información del usuario
        document.getElementById('userNameDisplay').textContent = this.currentUser.name;
        document.getElementById('userRoleBadge').textContent = 
            this.currentUser.role === 'admin' ? 'Administrador' : 'Empleado';
        
        // Mostrar/ocultar elementos según el rol
        this.updateUIByRole();
        
        // Cargar datos iniciales
        this.loadInitialData();
    }

    updateUIByRole() {
        const isAdmin = this.currentUser.role === 'admin';
        
        // Mostrar/Ocultar elementos admin-only
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
        
        // Actualizar menú de navegación
        if (!isAdmin) {
            // Remover enlaces de admin del menú
            const navLinks = document.querySelectorAll('.sidebar .nav-link');
            navLinks.forEach(link => {
                if (link.classList.contains('admin-only')) {
                    link.parentElement.style.display = 'none';
                }
            });
        }
    }

    loadInitialData() {
        // Cargar productos, movimientos, etc.
        loadProducts();
        loadCategories();
        loadMovements();
        updateDashboard();
        
        // Cargar categorías en selects
        loadCategoriesInSelect();
        
        // Cargar empleados si es admin
        if (this.currentUser.role === 'admin') {
            loadEmployees();
        }
    }

    showNotification(type, title, message) {
        // Crear toast notification
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast show mb-2`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        const delay = type === 'success' ? 3000 : 5000;
        toast.style.animation = `fadeOut 0.5s ${delay}ms forwards`;
        
        let icon = '';
        let bgColor = '';
        
        switch(type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                bgColor = 'bg-success';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                bgColor = 'bg-danger';
                break;
            case 'info':
                icon = '<i class="fas fa-info-circle"></i>';
                bgColor = 'bg-info';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                bgColor = 'bg-warning';
                break;
        }
        
        toast.innerHTML = `
            <div class="toast-header ${bgColor}">
                ${icon}
                <strong class="me-auto ms-2">${title}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-remover después del delay
        setTimeout(() => {
            toast.remove();
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, delay + 500);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }
}

// Inicializar sistema de autenticación
const auth = new AuthSystem();

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (!auth.loadSession()) {
        // Mostrar modal de login
        auth.loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
            backdrop: 'static',
            keyboard: false
        });
        auth.loginModal.show();
    } else {
        auth.showApp();
    }
});