document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('.life-area-slider');

    // --- Data Storage ---
    const STORAGE_KEY = 'lifeTrackerGoals';
    const SLIDERS_STORAGE_KEY = 'lifeTrackerSliders';
    const AREA_NAMES_STORAGE_KEY = 'lifeTrackerAreaNames';

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
            
            goalsData[areaName] = goals;
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goalsData));
    }

    function loadGoals() {
        const savedGoals = localStorage.getItem(STORAGE_KEY);
        if (!savedGoals) return;
        
        try {
            const goalsData = JSON.parse(savedGoals);
            const lifeAreas = document.querySelectorAll('.life-area');
            
            lifeAreas.forEach(area => {
                const areaName = area.querySelector('h3').textContent;
                const goals = goalsData[areaName] || [];
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
    };

    function polarToCartesian(radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: wheelConfig.centerX + (radius * Math.cos(angleInRadians)),
            y: wheelConfig.centerY + (radius * Math.sin(angleInRadians)),
        };
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
        const valueText = document.querySelector(`.wheel-values [data-value-id="${index}"]`);

        const paths = describeSector(index, value);
        
        brightPath.setAttribute('d', paths.brightD);
        palePath.setAttribute('d', paths.paleD);
        
        if (valueText) {
            valueText.textContent = value;
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
                if (areaNamesData[index]) {
                    const areaTitle = area.querySelector('h3');
                    areaTitle.textContent = areaNamesData[index];
                    updateWheelLabel(index, areaNamesData[index]);
                }
            });
        } catch (error) {
            console.error('Error loading area names:', error);
        }
    }

    // --- Wheel Labels Update ---
    function updateWheelLabel(sectorIndex, newName) {
        // Массив селекторов для подписей колеса баланса (в порядке секторов)
        const wheelLabelSelectors = [
            'text[transform="translate(150,0)"] tspan', // Здоровье, энергия (0°)
            'text[transform="translate(280,50)"] tspan', // Работа, бизнес (45°)
            'text[transform="translate(300,150)"] tspan', // Финансы (90°)
            'text[transform="translate(280,250)"] tspan', // Личные отношения (135°)
            'text[transform="translate(150,300)"] tspan', // Творчество (180°)
            'text[transform="translate(20,250)"] tspan', // Личностный рост (225°)
            'text[transform="translate(0,150)"] tspan', // Отдых (270°)
            'text[transform="translate(20,50)"] tspan' // Друзья (315°)
        ];

        const labelElement = document.querySelector(wheelLabelSelectors[sectorIndex]);
        if (labelElement) {
            labelElement.textContent = newName;
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
}); 