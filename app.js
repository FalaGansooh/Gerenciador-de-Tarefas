document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskDate = document.getElementById('task-date');
    const taskPriority = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const totalTasksSpan = document.getElementById('total-tasks');
    const completedTasksSpan = document.getElementById('completed-tasks');
    const pendingTasksSpan = document.getElementById('pending-tasks');
    const themeToggle = document.getElementById('theme-toggle');
    const modal = document.getElementById('modal');
    const closeModal = document.querySelector('.close-modal');
    const editForm = document.getElementById('edit-form');
    const editTaskInput = document.getElementById('edit-task-input');
    const editTaskDate = document.getElementById('edit-task-date');
    const editTaskPriority = document.getElementById('edit-task-priority');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentEditIndex = null;

    initTheme();
    renderTasks();
    updateStats();
    setCurrentYear();

    taskForm.addEventListener('submit', addTask);
    filterButtons.forEach(btn => btn.addEventListener('click', applyFilter));
    themeToggle.addEventListener('click', toggleTheme);
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    editForm.addEventListener('submit', saveEditedTask);

    function addTask(e) {
        e.preventDefault();
        
        if (!taskInput.value.trim()) {
            showAlert('Por favor, digite uma descrição para a tarefa', 'error');
            return;
        }
        
        const newTask = {
            id: Date.now(),
            title: taskInput.value.trim(),
            date: taskDate.value,
            priority: taskPriority.value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        taskForm.reset();
        showAlert('Tarefa adicionada com sucesso!', 'success');
    }

    function renderTasks() {
        taskList.innerHTML = '';
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'pending') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<li class="empty-state">Nenhuma tarefa encontrada</li>';
            return;
        }
        
        filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority] || 
                   new Date(a.createdAt) - new Date(b.createdAt);
        }).forEach((task) => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            const formattedDate = task.date ? formatDate(task.date) : 'Sem data';
            const priorityClass = `priority-${task.priority}`;
            const priorityLabel = getPriorityLabel(task.priority);
            
            taskItem.innerHTML = `
                <div class="task-info">
                    <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                    <div class="task-meta">
                        <span><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                        <span class="task-priority ${priorityClass}">
                            ${priorityLabel}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="complete-btn" data-id="${task.id}" aria-label="${task.completed ? 'Desfazer conclusão' : 'Marcar como concluída'}">
                        <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="edit-btn" data-id="${task.id}" aria-label="Editar tarefa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${task.id}" aria-label="Excluir tarefa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            taskList.appendChild(taskItem);
        });
    
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', toggleTaskComplete);
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', openEditModal);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteTask);
        });
    }

    function toggleTaskComplete(e) {
        const taskId = parseInt(e.currentTarget.getAttribute('data-id'));
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
            updateStats();
            const action = tasks[taskIndex].completed ? 'concluída' : 'pendente';
            showAlert(`Tarefa marcada como ${action}`, 'success');
        }
    }

    function openEditModal(e) {
        const taskId = parseInt(e.currentTarget.getAttribute('data-id'));
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            currentEditIndex = taskIndex;
            const task = tasks[taskIndex];
            
            editTaskInput.value = task.title;
            editTaskDate.value = task.date;
            editTaskPriority.value = task.priority;
            
            modal.style.display = 'block';
            editTaskInput.focus();
        }
    }

    function saveEditedTask(e) {
        e.preventDefault();
        
        if (currentEditIndex !== null && editTaskInput.value.trim()) {
            tasks[currentEditIndex].title = editTaskInput.value.trim();
            tasks[currentEditIndex].date = editTaskDate.value;
            tasks[currentEditIndex].priority = editTaskPriority.value;
            
            saveTasks();
            renderTasks();
            modal.style.display = 'none';
            showAlert('Tarefa atualizada com sucesso!', 'success');
        }
    }

    function deleteTask(e) {
        const taskId = parseInt(e.currentTarget.getAttribute('data-id'));
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            const taskTitle = tasks[taskIndex].title;
            
            if (confirm(`Tem certeza que deseja excluir a tarefa "${taskTitle}"?`)) {
                tasks.splice(taskIndex, 1);
                saveTasks();
                renderTasks();
                updateStats();
                showAlert('Tarefa excluída com sucesso!', 'success');
            }
        }
    }

    function applyFilter(e) {
        currentFilter = e.currentTarget.getAttribute('data-filter');
        
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
        });
        
        renderTasks();
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        totalTasksSpan.textContent = `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`;
        completedTasksSpan.textContent = `${completed} ${completed === 1 ? 'concluída' : 'concluídas'}`;
        pendingTasksSpan.textContent = `${pending} ${pending === 1 ? 'pendente' : 'pendentes'}`;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    function setCurrentYear() {
        document.getElementById('current-year').textContent = new Date().getFullYear();
    }

    function getPriorityLabel(priority) {
        const labels = {
            low: 'Baixa',
            medium: 'Média',
            high: 'Alta'
        };
        return labels[priority] || priority;
    }

    function formatDate(dateString) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    }

    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }
});

// Adiciona estilos dinâmicos para alertas
const alertStyles = document.createElement('style');
alertStyles.textContent = `
.alert {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: var(--border-radius);
    color: white;
    font-weight: 500;
    box-shadow: var(--shadow-md);
    z-index: 1000;
    opacity: 1;
    transition: opacity 0.3s ease;
}

.alert-success {
    background-color: var(--success-color);
}

.alert-error {
    background-color: var(--danger-color);
}

.fade-out {
    opacity: 0;
}
`;
document.head.appendChild(alertStyles);