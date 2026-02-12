// Sistema de Gestión de Empleados
function loadEmployees() {
    const employees = getEmployees();
    const employeesTable = document.getElementById('employeesTable');
    
    employeesTable.innerHTML = '';
    
    if (employees.length === 0) {
        employeesTable.innerHTML = '<tr><td colspan="7" class="text-center">No hay empleados registrados</td></tr>';
        return;
    }
    
    employees.forEach(employee => {
        // No mostrar el usuario actual en la lista
        if (employee.id === auth.currentUser.id) return;
        
        const employeeRow = document.createElement('tr');
        const createdAt = new Date(employee.createdAt).toLocaleDateString('es-ES');
        
        employeeRow.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${employee.username}</td>
            <td>
                <span class="badge ${employee.role === 'admin' ? 'badge-danger' : 'badge-success'}">
                    ${employee.role === 'admin' ? 'Administrador' : 'Empleado'}
                </span>
            </td>
            <td>${createdAt}</td>
            <td>
                <span class="badge ${employee.status === 'activo' ? 'badge-success' : 'badge-danger'}">
                    ${employee.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-yellow me-1 edit-employee" data-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-red delete-employee" data-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        employeesTable.appendChild(employeeRow);
    });
    
    // Agregar event listeners
    document.querySelectorAll('.edit-employee').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const employeeId = e.target.closest('button').dataset.id;
            editEmployee(employeeId);
        });
    });
    
    document.querySelectorAll('.delete-employee').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const employeeId = e.target.closest('button').dataset.id;
            deleteEmployee(employeeId);
        });
    });
}

function getEmployees() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

function saveEmployees(employees) {
    localStorage.setItem('users', JSON.stringify(employees));
}

function addEmployee(employee) {
    const employees = getEmployees();
    
    // Validar que el username no exista
    if (employees.some(e => e.username === employee.username)) {
        auth.showNotification('error', 'Error', 'El nombre de usuario ya existe');
        return false;
    }
    
    employee.id = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    employee.createdAt = new Date().toISOString();
    employees.push(employee);
    saveEmployees(employees);
    loadEmployees();
    auth.showNotification('success', 'Empleado creado', `${employee.name} ha sido agregado exitosamente`);
    return true;
}

function updateEmployee(id, updatedEmployee) {
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id == id);
    
    if (index !== -1) {
        // Validar username si cambia
        if (updatedEmployee.username !== employees[index].username) {
            if (employees.some(e => e.username === updatedEmployee.username && e.id != id)) {
                auth.showNotification('error', 'Error', 'El nombre de usuario ya existe');
                return false;
            }
        }
        
        employees[index] = { ...employees[index], ...updatedEmployee };
        saveEmployees(employees);
        loadEmployees();
        auth.showNotification('success', 'Empleado actualizado', `${updatedEmployee.name} ha sido actualizado`);
        return true;
    }
    return false;
}

function deleteEmployee(id) {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
        const employees = getEmployees();
        const employeeName = employees.find(e => e.id == id)?.name;
        
        // No permitir eliminar al usuario actual
        if (id == auth.currentUser.id) {
            auth.showNotification('error', 'Error', 'No puedes eliminarte a ti mismo');
            return;
        }
        
        const filteredEmployees = employees.filter(e => e.id != id);
        saveEmployees(filteredEmployees);
        loadEmployees();
        auth.showNotification('success', 'Empleado eliminado', `${employeeName} ha sido eliminado`);
    }
}

function editEmployee(id) {
    const employees = getEmployees();
    const employee = employees.find(e => e.id == id);
    
    if (employee) {
        document.getElementById('employeeId').value = employee.id;
        document.getElementById('employeeName').value = employee.name;
        document.getElementById('employeeUsername').value = employee.username;
        document.getElementById('employeePassword').value = ''; // No mostrar contraseña actual
        document.getElementById('employeeRole').value = employee.role;
        
        // Establecer estado
        if (employee.status === 'activo') {
            document.getElementById('empStatusActive').checked = true;
        } else {
            document.getElementById('empStatusInactive').checked = true;
        }
        
        document.getElementById('employeeModalTitle').textContent = 'Editar Empleado';
        const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
        modal.show();
    }
}

// Manejar formulario de empleados
document.getElementById('employeeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const employeeId = document.getElementById('employeeId').value;
    const employee = {
        name: document.getElementById('employeeName').value,
        username: document.getElementById('employeeUsername').value,
        password: document.getElementById('employeePassword').value,
        role: document.getElementById('employeeRole').value,
        status: document.querySelector('input[name="employeeStatus"]:checked').value
    };
    
    // Validar contraseña para nuevos empleados
    if (!employeeId && !employee.password) {
        auth.showNotification('error', 'Error', 'La contraseña es requerida para nuevos empleados');
        return;
    }
    
    if (employeeId) {
        // Si no se cambia la contraseña, mantener la actual
        if (!employee.password) {
            delete employee.password;
        }
        updateEmployee(employeeId, employee);
    } else {
        addEmployee(employee);
    }
    
    // Reset form
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeModalTitle').textContent = 'Nuevo Empleado';
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
    modal.hide();
});

// Cargar empleados al inicio
document.addEventListener('DOMContentLoaded', () => {
    if (auth.currentUser && auth.currentUser.role === 'admin') {
        loadEmployees();
    }
});