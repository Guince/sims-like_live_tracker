console.log('Добро пожаловать на Vibe Coding!'); 

// --- Модальное окно ---
const habitModal = document.getElementById('habitModal');
const habitForm = document.getElementById('habitForm');
const habitNameInput = document.getElementById('habitName');
const habitIdInput = document.getElementById('habitId');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModal');
const addHabitBtn = document.getElementById('addHabitBtn');
const habitsList = document.getElementById('habitsList');

// --- Данные ---
const STORAGE_KEY = 'habits';
let habits = [];

// --- Вспомогательные функции ---
function saveHabits() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function loadHabits() {
    const data = localStorage.getItem(STORAGE_KEY);
    habits = data ? JSON.parse(data) : [];
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function getToday() {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
}

function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

// --- UI ---
function openModal(edit = false, habit = null) {
    habitModal.classList.remove('hidden');
    if (edit && habit) {
        modalTitle.textContent = 'Редактировать привычку';
        habitNameInput.value = habit.name;
        habitIdInput.value = habit.id;
    } else {
        modalTitle.textContent = 'Добавить привычку';
        habitNameInput.value = '';
        habitIdInput.value = '';
    }
    habitNameInput.focus();
}

function closeModal() {
    habitModal.classList.add('hidden');
}

function renderHabits() {
    habitsList.innerHTML = '';
    if (habits.length === 0) {
        habitsList.innerHTML = '<li style="text-align:center;color:#888;">Нет привычек. Добавьте первую!</li>';
        return;
    }
    habits.forEach(habit => {
        const li = document.createElement('li');
        li.className = 'habit-item';
        // Заголовок и действия
        const header = document.createElement('div');
        header.className = 'habit-header';
        const title = document.createElement('span');
        title.className = 'habit-title';
        title.textContent = habit.name;
        const actions = document.createElement('div');
        actions.className = 'habit-actions';
        // Кнопки редактировать и удалить
        const editBtn = document.createElement('button');
        editBtn.title = 'Редактировать';
        editBtn.innerHTML = '✏️';
        editBtn.onclick = () => openModal(true, habit);
        const delBtn = document.createElement('button');
        delBtn.title = 'Удалить';
        delBtn.innerHTML = '🗑️';
        delBtn.onclick = () => deleteHabit(habit.id);
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        header.appendChild(title);
        header.appendChild(actions);
        li.appendChild(header);
        // Календарь
        const calendar = renderCalendar(habit);
        li.appendChild(calendar);
        habitsList.appendChild(li);
    });
}

function renderCalendar(habit) {
    const calendar = document.createElement('div');
    calendar.className = 'calendar';
    const today = getToday();
    const year = today.getFullYear();
    const month = today.getMonth();
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Пн=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Пустые ячейки до 1-го числа
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day inactive';
        calendar.appendChild(empty);
    }
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (sameDay(date, today)) dayDiv.classList.add('today');
        // Проверяем, выполнена ли привычка в этот день
        const completed = habit.completedDays && habit.completedDays.includes(date.toISOString().slice(0,10));
        if (completed) dayDiv.classList.add('completed');
        dayDiv.textContent = day;
        // Только для текущего месяца и не будущих дней
        if (date > today) {
            dayDiv.classList.add('inactive');
        } else {
            dayDiv.onclick = () => toggleHabitDay(habit.id, date);
        }
        calendar.appendChild(dayDiv);
    }
    return calendar;
}

// --- Логика привычек ---
function addHabit(name) {
    habits.push({
        id: generateId(),
        name,
        completedDays: []
    });
    saveHabits();
    renderHabits();
}

function updateHabit(id, name) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        habit.name = name;
        saveHabits();
        renderHabits();
    }
}

function deleteHabit(id) {
    if (confirm('Удалить привычку?')) {
        habits = habits.filter(h => h.id !== id);
        saveHabits();
        renderHabits();
    }
}

function toggleHabitDay(habitId, date) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const dateStr = date.toISOString().slice(0,10);
    if (!habit.completedDays) habit.completedDays = [];
    const idx = habit.completedDays.indexOf(dateStr);
    if (idx === -1) {
        habit.completedDays.push(dateStr);
    } else {
        habit.completedDays.splice(idx, 1);
    }
    saveHabits();
    renderHabits();
}

// --- События ---
addHabitBtn.onclick = () => openModal();
closeModalBtn.onclick = closeModal;
habitModal.onclick = (e) => { if (e.target === habitModal) closeModal(); };
habitForm.onsubmit = function(e) {
    e.preventDefault();
    const name = habitNameInput.value.trim();
    const id = habitIdInput.value;
    if (!name) return;
    if (id) {
        updateHabit(id, name);
    } else {
        addHabit(name);
    }
    closeModal();
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// --- Инициализация ---
loadHabits();
renderHabits(); 