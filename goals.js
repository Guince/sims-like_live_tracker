document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.life-area-slider');

    // --- Data Storage ---
    const STORAGE_KEY = 'lifeTrackerGoals';
    const SLIDERS_STORAGE_KEY = 'lifeTrackerSliders';
    const AREA_NAMES_STORAGE_KEY = 'lifeTrackerAreaNames';

    // --- Sims 4 Color Palette ---
    const SIMS4_COLORS = [
        '#6fd47e', // Здоровье, энергия
        '#4a90e2', // Работа, бизнес
        '#3cb371', // Финансы
        '#ff6666', // Личные отношения, семья
        '#ffb347', // Творчество
        '#ffd700', // Личностный рост
        '#87ceeb', // Отдых, развлечения
        '#ff69b4'  // Друзья, окружение
    ];

    const MAX_AREAS = 20;

    function saveGoals() {
        const goalsData = {};
        const lifeAreas = document.querySelectorAll('.life-area');
        
        lifeAreas.forEach((area, index) => {
            const areaName = area.querySelector('h3').textContent;
            const goals = [];
            const goalItems = area.querySelectorAll('.goal-item');
            
            goalItems.forEach(item => {
                const checkbox = item.querySelector('.goal-checkbox');
                const text = item.querySelector('.goal-text').textContent;
                goals.push({
                    id: checkbox.id,
                    text: text,
                    completed: checkbox.checked
                });
            });
            
            goalsData[index] = {
                name: areaName,
                goals: goals
            };
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goalsData));
    }

    function loadGoals() {
        const savedGoals = localStorage.getItem(STORAGE_KEY);
        if (!savedGoals) return;
        
        try {
            const goalsData = JSON.parse(savedGoals);
            const lifeAreas = document.querySelectorAll('.life-area');
            
            lifeAreas.forEach((area, index) => {
                const areaData = goalsData[index];
                if (!areaData) return;
                
                const goals = areaData.goals || [];
                const goalItemsList = area.querySelector('.goal-items');
                
                // Clear existing goals
                goalItemsList.innerHTML = '';
                
                // Load saved goals
                goals.forEach(goal => {
                    const newGoalLi = document.createElement('li');
                    newGoalLi.className = 'goal-item';
                    if (goal.completed) {
                        newGoalLi.classList.add('completed');
                    }
                    
                    const sanitizedText = goal.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    
                    newGoalLi.innerHTML = `
                        <input type="checkbox" class="goal-checkbox" id="${goal.id}" ${goal.completed ? 'checked' : ''}>
                        <label for="${goal.id}" class="goal-text">${sanitizedText}</label>
                        <div class="goal-actions">
                            <button class="goal-action-btn edit-btn" title="Редактировать">✏️</button>
                            <button class="goal-action-btn delete-btn" title="Удалить">🗑️</button>
                        </div>
                    `;
                    
                    goalItemsList.appendChild(newGoalLi);
                });
            });
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    }

    function saveSliders() {
        const slidersData = {};
        const sliders = document.querySelectorAll('.life-area-slider');
        sliders.forEach((slider, index) => {
            slidersData[index] = slider.value;
        });
        localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(slidersData));
    }

    function loadSliders() {
        const savedSliders = localStorage.getItem(SLIDERS_STORAGE_KEY);
        if (!savedSliders) return;
        
        try {
            const slidersData = JSON.parse(savedSliders);
            const sliders = document.querySelectorAll('.life-area-slider');
            sliders.forEach((slider, index) => {
                if (slidersData[index] !== undefined) {
                    slider.value = slidersData[index];
                    const valueSpan = slider.nextElementSibling;
                    valueSpan.textContent = slidersData[index];
                    updateWheelSector(index, slidersData[index]);
                }
            });
        } catch (error) {
            console.error('Error loading sliders:', error);
        }
    }

    // --- Wheel Update Logic ---

    const wheelConfig = {
        centerX: 150,
        centerY: 150,
        outerRadius: 130,
        sectorAngle: 45, // 360 / 8
        valueRadius: 91, // Радиус для размещения цифр (изменено с 65 на 91)
    };

    function polarToCartesian(radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: wheelConfig.centerX + (radius * Math.cos(angleInRadians)),
            y: wheelConfig.centerY + (radius * Math.sin(angleInRadians)),
        };
    }

    function getValuePosition(sectorIndex) {
        // Угол в центре сектора (между радиусами)
        const centerAngle = sectorIndex * wheelConfig.sectorAngle + wheelConfig.sectorAngle / 2;
        const position = polarToCartesian(wheelConfig.valueRadius, centerAngle);
        
        // Добавляем информацию о повороте для горизонтального расположения
        return {
            x: position.x,
            y: position.y,
            angle: centerAngle
        };
    }

    function updateValuePosition(sectorIndex) {
        const sectorGroup = document.querySelector(`[data-sector-id="${sectorIndex}"]`);
        if (!sectorGroup) return;

        const valueText = sectorGroup.querySelector('.sector-value');
        if (!valueText) return;

        const position = getValuePosition(sectorIndex);
        valueText.setAttribute('x', position.x);
        valueText.setAttribute('y', position.y);
        
        // Компенсируем поворот секторов для горизонтального расположения цифр
        // Весь блок секторов повернут на -22.5°, поэтому компенсируем это
        const compensationAngle = 22.5;
        valueText.setAttribute('transform', `rotate(${compensationAngle} ${position.x} ${position.y})`);
    }

    function updateAllValuePositions() {
        const sectors = document.querySelectorAll('.life-sphere');
        sectors.forEach((sector, index) => {
            updateValuePosition(index);
        });
    }

    function describeSector(sectorIndex, value) {
        const valueRadius = (value / 10) * wheelConfig.outerRadius;
        const startAngle = sectorIndex * wheelConfig.sectorAngle;
        const endAngle = startAngle + wheelConfig.sectorAngle;

        const p1_inner = polarToCartesian(valueRadius, startAngle);
        const p2_inner = polarToCartesian(valueRadius, endAngle);
        const p1_outer = polarToCartesian(wheelConfig.outerRadius, startAngle);
        const p2_outer = polarToCartesian(wheelConfig.outerRadius, endAngle);

        const largeArcFlag = wheelConfig.sectorAngle <= 180 ? "0" : "1";

        const brightD = (value > 0) ? [
            "M", wheelConfig.centerX, wheelConfig.centerY,
            "L", p1_inner.x, p1_inner.y,
            "A", valueRadius, valueRadius, 0, largeArcFlag, 1, p2_inner.x, p2_inner.y,
            "Z"
        ].join(" ") : "";

        const paleD = (value < 10) ? [
            "M", p1_inner.x, p1_inner.y,
            "L", p1_outer.x, p1_outer.y,
            "A", wheelConfig.outerRadius, wheelConfig.outerRadius, 0, largeArcFlag, 1, p2_outer.x, p2_outer.y,
            "L", p2_inner.x, p2_inner.y,
            "A", valueRadius, valueRadius, 0, largeArcFlag, 0, p1_inner.x, p1_inner.y,
            "Z"
        ].join(" ") : "";

        return { brightD, paleD };
    }

    function updateWheelSector(index, value) {
        const sectorGroup = document.querySelector(`[data-sector-id="${index}"]`);
        if (!sectorGroup) return;

        const brightPath = sectorGroup.querySelector('.sector-bright');
        const palePath = sectorGroup.querySelector('.sector-pale');
        const valueText = sectorGroup.querySelector('.sector-value');

        const paths = describeSector(index, value);
        
        brightPath.setAttribute('d', paths.brightD);
        palePath.setAttribute('d', paths.paleD);
        
        if (valueText) {
            valueText.textContent = value;
            updateValuePosition(index);
        }
    }

    // --- Event Listeners ---
    sliders.forEach((slider, index) => {
        const valueSpan = slider.nextElementSibling;

        // Initial update on page load
        updateWheelSector(index, slider.value);

        slider.addEventListener('input', (event) => {
            const value = event.target.value;
            valueSpan.textContent = value;
            updateWheelSector(index, value);
            saveSliders(); // Save slider values
        });
    });

    // --- Area Names Click Handler ---
    document.addEventListener('click', (event) => {
        if (event.target.tagName === 'H3' && event.target.closest('.life-area-header')) {
            makeAreaNameEditable(event.target);
        }
        
        // Handle delete area button
        if (event.target.classList.contains('delete-area-btn')) {
            const lifeArea = event.target.closest('.life-area');
            const lifeAreas = document.querySelectorAll('.life-area');
            const areaIndex = Array.from(lifeAreas).indexOf(lifeArea);
            
            if (confirm('Удалить эту сферу жизни? Это действие нельзя отменить.')) {
                deleteLifeArea(areaIndex);
            }
        }
    });

    // --- Goals Logic ---
    const lifeAreasContainer = document.querySelector('.life-areas');

    function addGoal(areaElement, text) {
        const goalItemsList = areaElement.querySelector('.goal-items');
        const goalId = 'goal-' + Date.now() + Math.random().toString(36).substr(2, 9);
        const newGoalLi = document.createElement('li');
        newGoalLi.className = 'goal-item';
        
        const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        newGoalLi.innerHTML = `
            <input type="checkbox" class="goal-checkbox" id="${goalId}">
            <label for="${goalId}" class="goal-text">${sanitizedText}</label>
            <div class="goal-actions">
                <button class="goal-action-btn edit-btn" title="Редактировать">✏️</button>
                <button class="goal-action-btn delete-btn" title="Удалить">🗑️</button>
            </div>
        `;
        
        goalItemsList.appendChild(newGoalLi);
        saveGoals(); // Save goals after adding
    }
    
    lifeAreasContainer.addEventListener('click', (event) => {
        const target = event.target;

        // Handle adding a goal
        if (target.classList.contains('add-goal-btn')) {
            const addGoalForm = target.closest('.add-goal-form');
            const goalInput = addGoalForm.querySelector('.goal-input');
            const goalText = goalInput.value.trim();
            
            if (goalText) {
                const lifeArea = target.closest('.life-area');
                addGoal(lifeArea, goalText);
                goalInput.value = '';
                goalInput.focus();
            }
        }
        
        // Handle toggling goal completion
        if (target.classList.contains('goal-checkbox') && !target.disabled) {
            const goalItem = target.closest('.goal-item');
            goalItem.classList.toggle('completed', target.checked);
            saveGoals(); // Save goals after toggling
        }

        // Handle deleting a goal
        if (target.classList.contains('delete-btn')) {
            const goalItem = target.closest('.goal-item');
            if (confirm('Удалить эту цель?')) {
                goalItem.remove();
                saveGoals(); // Save goals after deleting
            }
        }

        // Handle editing a goal
        if (target.classList.contains('edit-btn')) {
            const goalItem = target.closest('.goal-item');
            const goalLabel = goalItem.querySelector('.goal-text');

            goalLabel.contentEditable = true;
            goalLabel.focus();
            document.execCommand('selectAll', false, null); // Select all text

            // Temporarily hide actions
            goalItem.querySelector('.goal-actions').style.opacity = '0';

            const saveOnEnter = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    goalLabel.blur();
                }
            };
            const saveOnBlur = () => {
                goalLabel.contentEditable = false;
                goalItem.querySelector('.goal-actions').style.opacity = ''; // Restore opacity behavior
                goalLabel.removeEventListener('blur', saveOnBlur);
                goalLabel.removeEventListener('keydown', saveOnEnter);
                saveGoals(); // Save goals after editing
            };

            goalLabel.addEventListener('keydown', saveOnEnter);
            goalLabel.addEventListener('blur', saveOnBlur);
        }
    });

    // Also handle Enter key press for adding goals
    lifeAreasContainer.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && event.target.classList.contains('goal-input')) {
            event.preventDefault();
            const addGoalForm = event.target.closest('.add-goal-form');
            const addButton = addGoalForm.querySelector('.add-goal-btn');
            addButton.click();
        }
    });

    // --- Area Names Management ---
    function saveAreaNames() {
        const areaNamesData = {};
        const lifeAreas = document.querySelectorAll('.life-area');
        
        lifeAreas.forEach((area, index) => {
            const areaName = area.querySelector('h3').textContent;
            areaNamesData[index] = areaName;
        });
        
        localStorage.setItem(AREA_NAMES_STORAGE_KEY, JSON.stringify(areaNamesData));
    }

    function loadAreaNames() {
        const savedAreaNames = localStorage.getItem(AREA_NAMES_STORAGE_KEY);
        if (!savedAreaNames) return;
        
        try {
            const areaNamesData = JSON.parse(savedAreaNames);
            const lifeAreas = document.querySelectorAll('.life-area');
            
            lifeAreas.forEach((area, index) => {
                const savedName = areaNamesData[index];
                if (savedName) {
                    const areaTitle = area.querySelector('h3');
                    areaTitle.textContent = savedName;
                    updateWheelLabel(index, savedName);
                }
            });
        } catch (error) {
            console.error('Error loading area names:', error);
        }
    }

    // --- Wheel Labels Update ---
    // Функция для разбиения длинного текста на строки
    function splitTextIntoLines(text, maxLength = 20) {
        if (text.length <= maxLength) {
            return [text];
        }
        
        // Разбиваем по запятым и пробелам
        const words = text.split(/[,\s]+/);
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if (currentLine.length + word.length <= maxLength) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    // Функция для создания многострочного текста в SVG
    function createMultilineText(text, color, textAnchor) {
        const lines = splitTextIntoLines(text);
        const lineHeight = 16; // Высота строки
        
        let tspanElements = '';
        lines.forEach((line, index) => {
            const y = index * lineHeight;
            tspanElements += `<tspan x="0" y="${y}" fill="${color}">${line}</tspan>`;
        });
        
        return tspanElements;
    }

    function updateWheelLabel(sectorIndex, newName) {
        const labelElement = document.querySelector(`[data-label-id="${sectorIndex}"]`);
        if (labelElement) {
            // Получаем цвет из существующего tspan
            const existingTspan = labelElement.querySelector('tspan');
            const color = existingTspan ? existingTspan.getAttribute('fill') : '#222';
            
            // Определяем text-anchor
            const sectorCenterAngle = sectorIndex * wheelConfig.sectorAngle + wheelConfig.sectorAngle / 2;
            const adjustedAngle = sectorCenterAngle - 22.5;
            
            let textAnchor = 'middle';
            if (adjustedAngle > 45 && adjustedAngle < 135) {
                textAnchor = 'start';
            } else if (adjustedAngle > 225 && adjustedAngle < 315) {
                textAnchor = 'end';
            }
            
            // Создаем многострочный текст
            const multilineContent = createMultilineText(newName, color, textAnchor);
            labelElement.innerHTML = multilineContent;
            
            // Пересчитываем позицию надписи
            const position = getLabelPosition(sectorIndex, textAnchor, newName);
            
            labelElement.setAttribute('transform', `translate(${position.x}, ${position.y})`);
            labelElement.setAttribute('text-anchor', textAnchor);
        }
    }

    // --- Area Names Editing ---
    function makeAreaNameEditable(areaTitle) {
        const originalText = areaTitle.textContent;
        const lifeArea = areaTitle.closest('.life-area');
        const lifeAreas = document.querySelectorAll('.life-area');
        const areaIndex = Array.from(lifeAreas).indexOf(lifeArea);
        
        areaTitle.contentEditable = true;
        areaTitle.focus();
        document.execCommand('selectAll', false, null);
        
        // Add visual feedback
        areaTitle.style.backgroundColor = '#f0f8ff';
        areaTitle.style.borderRadius = '4px';
        areaTitle.style.padding = '2px 4px';
        areaTitle.style.outline = '2px solid #299ed9';
        
        const saveOnEnter = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                areaTitle.blur();
            }
        };
        
        const saveOnBlur = () => {
            const newText = areaTitle.textContent.trim();
            if (newText && newText !== originalText) {
                areaTitle.textContent = newText;
                updateWheelLabel(areaIndex, newText);
                saveAreaNames();
            } else {
                areaTitle.textContent = originalText;
            }
            
            // Remove visual feedback
            areaTitle.style.backgroundColor = '';
            areaTitle.style.borderRadius = '';
            areaTitle.style.padding = '';
            areaTitle.style.outline = '';
            
            areaTitle.contentEditable = false;
            areaTitle.removeEventListener('blur', saveOnBlur);
            areaTitle.removeEventListener('keydown', saveOnEnter);
        };
        
        areaTitle.addEventListener('keydown', saveOnEnter);
        areaTitle.addEventListener('blur', saveOnBlur);
    }

    // --- Life Area Management ---
    function deleteLifeArea(areaIndex) {
        // Удаляем блок из HTML
        const lifeAreas = document.querySelectorAll('.life-area');
        const areaToDelete = lifeAreas[areaIndex];
        if (areaToDelete) {
            areaToDelete.remove();
        }
        
        // Удаляем сектор из колеса баланса
        const sectorToDelete = document.querySelector(`[data-sector-id="${areaIndex}"]`);
        if (sectorToDelete) {
            sectorToDelete.remove();
        }
        
        // Удаляем подпись из колеса баланса
        const labelToDelete = document.querySelector(`[data-label-id="${areaIndex}"]`);
        if (labelToDelete) {
            labelToDelete.remove();
        }
        
        // Пересчитываем оставшиеся секторы
        recalculateWheel();
        
        // Обновляем данные в LocalStorage
        updateStorageAfterDeletion(areaIndex);
        
        // Переиндексируем оставшиеся сферы
        reindexRemainingAreas();
    }

    function reindexRemainingAreas() {
        const lifeAreas = document.querySelectorAll('.life-area');
        lifeAreas.forEach((area, newIndex) => {
            // Обновляем обработчики событий для слайдера
            const slider = area.querySelector('.life-area-slider');
            const valueSpan = area.querySelector('.slider-value');
            
            // Удаляем старые обработчики
            const newSlider = slider.cloneNode(true);
            slider.parentNode.replaceChild(newSlider, slider);
            
            // Добавляем новые обработчики
            newSlider.addEventListener('input', function() {
                valueSpan.textContent = this.value;
                updateWheelSector(newIndex, this.value);
                saveSliders();
            });

            // Обновляем обработчики для кнопки удаления
            const deleteBtn = area.querySelector('.delete-area-btn');
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            
            newDeleteBtn.addEventListener('click', () => {
                deleteLifeArea(newIndex);
            });

            // Обновляем обработчики для целей
            const addGoalBtn = area.querySelector('.add-goal-btn');
            const goalInput = area.querySelector('.goal-input');
            
            const newAddGoalBtn = addGoalBtn.cloneNode(true);
            addGoalBtn.parentNode.replaceChild(newAddGoalBtn, addGoalBtn);
            
            newAddGoalBtn.addEventListener('click', () => {
                const text = goalInput.value.trim();
                if (text) {
                    addGoal(area, text);
                    goalInput.value = '';
                }
            });

            const newGoalInput = goalInput.cloneNode(true);
            goalInput.parentNode.replaceChild(newGoalInput, goalInput);
            
            newGoalInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const text = newGoalInput.value.trim();
                    if (text) {
                        addGoal(area, text);
                        newGoalInput.value = '';
                    }
                }
            });
        });
    }

    function recalculateWheel() {
        const remainingSectors = document.querySelectorAll('.life-sphere');
        const totalSectors = remainingSectors.length;
        
        if (totalSectors === 0) return;
        
        // Обновляем конфигурацию колеса
        wheelConfig.sectorAngle = 360 / totalSectors;
        
        // Пересчитываем каждый сектор
        remainingSectors.forEach((sector, newIndex) => {
            // Обновляем data-sector-id
            sector.setAttribute('data-sector-id', newIndex);
            
            // Обновляем сектор с новыми углами
            const slider = document.querySelectorAll('.life-area-slider')[newIndex];
            const value = slider ? slider.value : 5;
            updateWheelSector(newIndex, value);
            
            // Обновляем позицию цифры
            updateValuePosition(newIndex);
        });
        
        // Обновляем подписи
        updateLabelsAfterDeletion();
    }

    function getLabelPosition(sectorIndex, textAnchor, text = '') {
        const sectorCenterAngle = sectorIndex * wheelConfig.sectorAngle + wheelConfig.sectorAngle / 2;
        const adjustedAngle = sectorCenterAngle - 22.5;
        
        // Базовый радиус для размещения надписей
        const baseRadius = wheelConfig.outerRadius + 50;
        
        // Рассчитываем базовую позицию
        const basePosition = polarToCartesian(baseRadius, adjustedAngle);
        
        // Корректируем позицию в зависимости от text-anchor и направления
        // Цель: ближайшая буква к колесу должна быть на расстоянии baseRadius
        let offsetX = 0;
        let offsetY = 0;
        
        if (textAnchor === 'start') {
            // Для правой стороны - текст начинается справа от позиции
            // Нужно сдвинуть позицию влево, чтобы ближайшая буква была на нужном расстоянии
            offsetX = -15;
        } else if (textAnchor === 'end') {
            // Для левой стороны - текст заканчивается слева от позиции
            // Нужно сдвинуть позицию вправо, чтобы ближайшая буква была на нужном расстоянии
            offsetX = 15;
        }
        // Для 'middle' - центр текста, смещение не нужно
        
        // Корректируем позицию по Y для многострочного текста
        if (text) {
            const lines = splitTextIntoLines(text);
            if (lines.length > 1) {
                // Центрируем многострочный текст по вертикали
                const totalHeight = (lines.length - 1) * 16; // 16px - высота строки
                offsetY = -totalHeight / 2;
            }
        }
        
        return {
            x: basePosition.x + offsetX,
            y: basePosition.y + offsetY,
            angle: adjustedAngle
        };
    }

    function updateLabelsAfterDeletion() {
        const remainingLabels = document.querySelectorAll('[data-label-id]');
        const totalLabels = remainingLabels.length;
        
        if (totalLabels === 0) return;
        
        remainingLabels.forEach((label, newIndex) => {
            // Обновляем data-label-id
            label.setAttribute('data-label-id', newIndex);
            
            // Определяем text-anchor в зависимости от угла
            const sectorCenterAngle = newIndex * wheelConfig.sectorAngle + wheelConfig.sectorAngle / 2;
            const adjustedAngle = sectorCenterAngle - 22.5;
            
            let textAnchor = 'middle';
            if (adjustedAngle > 45 && adjustedAngle < 135) {
                textAnchor = 'start'; // Правая сторона
            } else if (adjustedAngle > 225 && adjustedAngle < 315) {
                textAnchor = 'end'; // Левая сторона
            }
            
            // Получаем текст и цвет из существующего tspan
            const existingTspan = label.querySelector('tspan');
            const text = existingTspan ? existingTspan.textContent : '';
            const color = existingTspan ? existingTspan.getAttribute('fill') : '#222';
            
            // Создаем многострочный текст
            const multilineContent = createMultilineText(text, color, textAnchor);
            label.innerHTML = multilineContent;
            
            // Рассчитываем позицию надписи с учетом text-anchor и многострочности
            const position = getLabelPosition(newIndex, textAnchor, text);
            
            // Применяем трансформацию
            label.setAttribute('transform', `translate(${position.x}, ${position.y})`);
            label.setAttribute('text-anchor', textAnchor);
        });
    }

    function updateStorageAfterDeletion(deletedIndex) {
        // Обновляем сохраненные названия сфер
        const savedAreaNames = localStorage.getItem(AREA_NAMES_STORAGE_KEY);
        if (savedAreaNames) {
            try {
                const areaNamesData = JSON.parse(savedAreaNames);
                const newAreaNamesData = {};
                
                Object.keys(areaNamesData).forEach(oldIndex => {
                    const oldIndexNum = parseInt(oldIndex);
                    if (oldIndexNum < deletedIndex) {
                        newAreaNamesData[oldIndexNum] = areaNamesData[oldIndexNum];
                    } else if (oldIndexNum > deletedIndex) {
                        newAreaNamesData[oldIndexNum - 1] = areaNamesData[oldIndexNum];
                    }
                });
                
                localStorage.setItem(AREA_NAMES_STORAGE_KEY, JSON.stringify(newAreaNamesData));
            } catch (error) {
                console.error('Error updating area names storage:', error);
            }
        }
        
        // Обновляем сохраненные значения слайдеров
        const savedSliders = localStorage.getItem(SLIDERS_STORAGE_KEY);
        if (savedSliders) {
            try {
                const slidersData = JSON.parse(savedSliders);
                const newSlidersData = {};
                
                Object.keys(slidersData).forEach(oldIndex => {
                    const oldIndexNum = parseInt(oldIndex);
                    if (oldIndexNum < deletedIndex) {
                        newSlidersData[oldIndexNum] = slidersData[oldIndexNum];
                    } else if (oldIndexNum > deletedIndex) {
                        newSlidersData[oldIndexNum - 1] = slidersData[oldIndexNum];
                    }
                });
                
                localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(newSlidersData));
            } catch (error) {
                console.error('Error updating sliders storage:', error);
            }
        }
        
        // Обновляем сохраненные цели
        const savedGoals = localStorage.getItem(STORAGE_KEY);
        if (savedGoals) {
            try {
                const goalsData = JSON.parse(savedGoals);
                const newGoalsData = {};
                
                Object.keys(goalsData).forEach(oldIndex => {
                    const oldIndexNum = parseInt(oldIndex);
                    if (oldIndexNum < deletedIndex) {
                        newGoalsData[oldIndexNum] = goalsData[oldIndexNum];
                    } else if (oldIndexNum > deletedIndex) {
                        newGoalsData[oldIndexNum - 1] = goalsData[oldIndexNum];
                    }
                });
                
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoalsData));
            } catch (error) {
                console.error('Error updating goals storage:', error);
            }
        }
    }

    // Функция для инициализации позиций надписей
    function initializeLabelPositions() {
        const labels = document.querySelectorAll('[data-label-id]');
        const totalLabels = labels.length;
        
        if (totalLabels === 0) return;
        
        // Обновляем конфигурацию колеса для правильного расчета
        wheelConfig.sectorAngle = 360 / totalLabels;
        
        labels.forEach((label, index) => {
            const sectorCenterAngle = index * wheelConfig.sectorAngle + wheelConfig.sectorAngle / 2;
            const adjustedAngle = sectorCenterAngle - 22.5;
            
            let textAnchor = 'middle';
            if (adjustedAngle > 45 && adjustedAngle < 135) {
                textAnchor = 'start';
            } else if (adjustedAngle > 225 && adjustedAngle < 315) {
                textAnchor = 'end';
            }
            
            // Получаем текст и цвет из существующего tspan
            const existingTspan = label.querySelector('tspan');
            const text = existingTspan ? existingTspan.textContent : '';
            const color = existingTspan ? existingTspan.getAttribute('fill') : '#222';
            
            // Создаем многострочный текст
            const multilineContent = createMultilineText(text, color, textAnchor);
            label.innerHTML = multilineContent;
            
            const position = getLabelPosition(index, textAnchor, text);
            
            label.setAttribute('transform', `translate(${position.x}, ${position.y})`);
            label.setAttribute('text-anchor', textAnchor);
        });
    }

    // --- Initialize data on page load ---
    loadSliders();
    loadGoals();
    loadAreaNames();
    
    // Initialize wheel labels with current area names
    const lifeAreas = document.querySelectorAll('.life-area');
    lifeAreas.forEach((area, index) => {
        const areaName = area.querySelector('h3').textContent;
        updateWheelLabel(index, areaName);
    });
    
    // Initialize label positions
    initializeLabelPositions();
    
    // Initialize value positions
    updateAllValuePositions();

    // Initialize existing areas
    initializeExistingAreas();

    // --- Add Area Functionality ---
    function addNewLifeArea() {
        const lifeAreas = document.querySelectorAll('.life-area');
        
        if (lifeAreas.length >= MAX_AREAS) {
            alert(`Максимальное количество сфер жизни: ${MAX_AREAS}`);
            return;
        }

        const newAreaIndex = lifeAreas.length;
        const color = SIMS4_COLORS[newAreaIndex % SIMS4_COLORS.length];
        
        const newAreaHTML = `
            <div class="life-area" style="border-color: ${color}">
                <div class="life-area-header">
                    <h3>Новая сфера</h3>
                    <div class="slider-container">
                        <input type="range" min="1" max="10" value="5" class="life-area-slider">
                        <span class="slider-value">5</span>
                    </div>
                    <button class="delete-area-btn" title="Удалить сферу жизни">🗑️</button>
                </div>
                <div class="goals-list">
                    <ul class="goal-items">
                        <!-- Здесь будут цели для этой сферы -->
                    </ul>
                    <div class="add-goal-form">
                        <input type="checkbox" class="goal-checkbox" disabled>
                        <input type="text" class="goal-input" placeholder="Новая цель...">
                        <button class="add-goal-btn">+</button>
                    </div>
                </div>
            </div>
        `;

        const lifeAreasContainer = document.querySelector('.life-areas');
        lifeAreasContainer.insertAdjacentHTML('beforeend', newAreaHTML);

        // Add new sector to wheel
        addWheelSector(newAreaIndex, color);

        // Initialize the new area
        const newArea = lifeAreasContainer.lastElementChild;
        initializeNewArea(newArea, newAreaIndex);
        
        // Save data
        saveGoals();
        saveSliders();
        saveAreaNames();
    }

    function addWheelSector(sectorIndex, color) {
        const wheelGroup = document.querySelector('#balanceWheel g[transform*="rotate(-22.5"]');
        if (!wheelGroup) return;

        // Update wheel configuration
        const totalSectors = sectorIndex + 1;
        wheelConfig.sectorAngle = 360 / totalSectors;

        // Create new sector
        const sectorHTML = `
            <g data-sector-id="${sectorIndex}" class="life-sphere">
                <path class="sector-pale" fill="${color}" fill-opacity="0.3" d=""></path>
                <path class="sector-bright" fill="${color}" d=""></path>
                <text class="sector-value" text-anchor="middle" font-size="18" font-family="Segoe UI, Arial" fill="#222" font-weight="bold">5</text>
            </g>
        `;

        wheelGroup.insertAdjacentHTML('beforeend', sectorHTML);

        // Create new label
        const labelHTML = `
            <text font-size="14" font-family="Segoe UI, Arial" fill="#222" data-label-id="${sectorIndex}">
                <tspan x="0" y="5" fill="${color}">Новая сфера</tspan>
            </text>
        `;

        const labelsGroup = document.querySelector('#balanceWheel g[font-size="14"]');
        if (labelsGroup) {
            labelsGroup.insertAdjacentHTML('beforeend', labelHTML);
        }

        // Update all sectors
        recalculateWheel();
        updateAllValuePositions();
        initializeLabelPositions();
    }

    function initializeNewArea(areaElement, areaIndex) {
        // Make area name editable on click (not automatically)
        const areaTitle = areaElement.querySelector('h3');
        areaTitle.addEventListener('click', () => {
            makeAreaNameEditable(areaTitle);
        });

        // Automatically activate edit mode for new area
        setTimeout(() => {
            makeAreaNameEditable(areaTitle);
        }, 100);

        // Initialize slider
        const slider = areaElement.querySelector('.life-area-slider');
        const valueSpan = areaElement.querySelector('.slider-value');
        
        slider.addEventListener('input', function() {
            valueSpan.textContent = this.value;
            updateWheelSector(areaIndex, this.value);
            saveSliders();
        });

        // Initialize goal functionality
        const addGoalBtn = areaElement.querySelector('.add-goal-btn');
        const goalInput = areaElement.querySelector('.goal-input');
        
        addGoalBtn.addEventListener('click', () => {
            const text = goalInput.value.trim();
            if (text) {
                addGoal(areaElement, text);
                goalInput.value = '';
            }
        });

        goalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = goalInput.value.trim();
                if (text) {
                    addGoal(areaElement, text);
                    goalInput.value = '';
                }
            }
        });

        // Initialize delete button
        const deleteBtn = areaElement.querySelector('.delete-area-btn');
        deleteBtn.addEventListener('click', () => {
            deleteLifeArea(areaIndex);
        });
    }

    // Initialize add area button
    const addAreaBtn = document.getElementById('addAreaBtn');
    if (addAreaBtn) {
        addAreaBtn.addEventListener('click', addNewLifeArea);
    }

    // Initialize existing life areas
    function initializeExistingAreas() {
        const lifeAreas = document.querySelectorAll('.life-area');
        lifeAreas.forEach((area, index) => {
            // Make area name editable on click (not automatically)
            const areaTitle = area.querySelector('h3');
            areaTitle.addEventListener('click', () => {
                makeAreaNameEditable(areaTitle);
            });

            // Initialize slider
            const slider = area.querySelector('.life-area-slider');
            const valueSpan = area.querySelector('.slider-value');
            
            slider.addEventListener('input', function() {
                valueSpan.textContent = this.value;
                updateWheelSector(index, this.value);
                saveSliders();
            });

            // Initialize goal functionality
            const addGoalBtn = area.querySelector('.add-goal-btn');
            const goalInput = area.querySelector('.goal-input');
            
            addGoalBtn.addEventListener('click', () => {
                const text = goalInput.value.trim();
                if (text) {
                    addGoal(area, text);
                    goalInput.value = '';
                }
            });

            goalInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const text = goalInput.value.trim();
                    if (text) {
                        addGoal(area, text);
                        goalInput.value = '';
                    }
                }
            });

            // Initialize delete button
            const deleteBtn = area.querySelector('.delete-area-btn');
            deleteBtn.addEventListener('click', () => {
                deleteLifeArea(index);
            });
        });
    }
}); 