let currentCategoryId = null;
let currentComponentId = null;
let categories = [];
let components = [];



// Функции для показа уведомлений
function showError(message) {
    showNotification(message, 'danger');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showWarning(message) {
    showNotification(message, 'warning');
}

function showInfo(message) {
    showNotification(message, 'info');
}



async function convertImageToBase64(file) {
    console.log('Конвертация файла:', file.name, file.type, file.size);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            console.log('Файл успешно прочитан, длина:', reader.result.length);
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadComponentsTree();
    // addRefreshButton();
    // addTestButton();
    //addContextMenuHandlers();

    addContextMenuHandlers(); // ← ЭТА СТРОКА ДОЛЖНА БЫТЬ
    console.log('Контекстное меню инициализировано');


    // Обработчик для ссылок datasheet
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('datasheet-link')) {
            event.preventDefault();
            const url = event.target.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        }
    });
});




function addContextMenuHandlers() {
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();

        console.log('=== ДЕБАГ КОНТЕКСТНОГО МЕНЮ ===');
        console.log('Цель клика:', e.target);
        console.log('Классы цели:', e.target.className);
        console.log('Родительские элементы:', e.target.closest('div'));

        const categoryItem = e.target.closest('.category-item');
        const componentItem = e.target.closest('.component-item');

        console.log('Найден category-item:', categoryItem);
        console.log('Найден component-item:', componentItem);

        if (categoryItem) {
            console.log('Category ID данных:', categoryItem.dataset.id);
            showCategoryContextMenu(e, categoryItem);
        } else if (componentItem) {
            console.log('Component ID данных:', componentItem.dataset.id);
            showComponentContextMenu(e, componentItem);
        } else {
            console.log('Не найдены элементы для контекстного меню');
        }
    });

    document.addEventListener('click', function () {
        hideContextMenus();
    });
}


// Показываем контекстное меню для категории
function showCategoryContextMenu(event, categoryItem) {
    hideContextMenus();

    const categoryId = categoryItem.dataset.id;
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="list-group">
            <button class="list-group-item list-group-item-action" onclick="editCategory(${categoryId})">
                <i class="fas fa-edit me-2"></i>Редактировать
            </button>
            <button class="list-group-item list-group-item-action text-danger" onclick="deleteCategoryConfirm(${categoryId})">
                <i class="fas fa-trash me-2"></i>Удалить
            </button>
        </div>
    `;

    menu.style.position = 'absolute';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.style.zIndex = '1000';

    document.body.appendChild(menu);
}

// Показываем контекстное меню для компонента
function showComponentContextMenu(event, componentItem) {
    hideContextMenus();

    const componentId = componentItem.dataset.id;
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="list-group">
            <button class="list-group-item list-group-item-action" onclick="editComponent(${componentId})">
                <i class="fas fa-edit me-2"></i>Редактировать
            </button>
            <button class="list-group-item list-group-item-action text-danger" onclick="deleteComponentConfirm(${componentId})">
                <i class="fas fa-trash me-2"></i>Удалить
            </button>
        </div>
    `;

    menu.style.position = 'absolute';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.style.zIndex = '1000';

    document.body.appendChild(menu);
}

// Скрываем все контекстные меню
function hideContextMenus() {
    document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
}

// Загрузка категорий
async function loadCategories() {
    try {
        categories = await window.electronAPI.getCategories();
        populateCategoryDropdown();
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        showNotification('Ошибка загрузки категорий', 'danger');
    }
}

// Заполнить выпадающий список категорий
function populateCategoryDropdown(selectedId = null) {
    const select = document.getElementById('componentCategory');
    if (!select) {
        console.error('Элемент componentCategory не найден');
        return;
    }

    select.innerHTML = '';

    if (categories.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Нет категорий';
        select.appendChild(option);
        return;
    }

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        if (selectedId === category.id) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    if (!selectedId && categories.length > 0) {
        select.value = categories[0].id;
    }
}

// Загрузка дерева компонентов
async function loadComponentsTree() {
    const treeContainer = document.getElementById('tree-container');
    if (!treeContainer) {
        console.error('Элемент tree-container не найден');
        return;
    }

    treeContainer.innerHTML = '';

    if (categories.length === 0) {
        treeContainer.innerHTML = '<div class="text-muted">Нет категорий</div>';
        return;
    }

    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.innerHTML = `
            <div class="tree-item category-item" data-id="${category.id}" onclick="toggleCategory(${category.id})">
                <i class="fas fa-folder tree-icon"></i>
                <span>${category.name}</span>
                <div class="float-end">
                    <i class="fas fa-caret-down"></i>
                </div>
            </div>
            <div id="category-${category.id}" class="ms-3" style="display: none;">
                <div class="text-muted small">Загрузка...</div>
            </div>
        `;
        treeContainer.appendChild(categoryDiv);
    });
}

// Редактировать категорию
async function editCategory(categoryId) {
    try {
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
            showNotification('Категория не найдена', 'warning');
            return;
        }

        document.getElementById('editCategoryId').value = categoryId;
        document.getElementById('editCategoryName').value = category.name;

        const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
        //addImageUploadField(); // ✅ Добавьте эту строку
        modal.show();

        hideContextMenus();
    } catch (error) {
        console.error('Ошибка редактирования категории:', error);
        showNotification('Ошибка редактирования категории', 'danger');
    }
}

// Обновить категорию
async function updateCategory() {
    const categoryId = document.getElementById('editCategoryId').value;
    const name = document.getElementById('editCategoryName').value.trim();

    if (!name) {
        showNotification('Введите название категории', 'warning');
        return;
    }

    try {
        // Здесь нужно добавить IPC вызов для обновления категории
        // Пока используем временное решение - пересоздаем категорию
        const result = await window.electronAPI.addCategory(name);
        if (result.success) {
            // Удаляем старую категорию
            await window.electronAPI.deleteCategory(categoryId);

            await refreshComponentsTree();
            bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
            showNotification('Категория успешно обновлена', 'success');
        } else {
            showNotification('Ошибка: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Ошибка обновления категории:', error);
        showNotification('Ошибка обновления категории', 'danger');
    }
}

// Подтверждение удаления категории
async function deleteCategoryConfirm(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (confirm(`Вы уверены, что хотите удалить категорию "${category.name}"? Все компоненты в этой категории также будут удалены.`)) {
        await deleteCategory(categoryId);
    }
    hideContextMenus();
}

// Удалить категорию
async function deleteCategory(categoryId) {
    try {
        const result = await window.electronAPI.deleteCategory(categoryId);
        if (result.success) {
            await refreshComponentsTree();
            showNotification('Категория успешно удалена', 'success');
        } else {
            showNotification('Ошибка: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Ошибка удаления категории:', error);
        showNotification('Ошибка удаления категории', 'danger');
    }
}

// Подтверждение удаления компонента
async function deleteComponentConfirm(componentId) {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    if (confirm(`Вы уверены, что хотите удалить компонент "${component.name}"?`)) {
        await deleteComponent(componentId);
    }
    hideContextMenus();
}

// Удалить компонент
async function deleteComponent(componentId) {
    try {
        const result = await window.electronAPI.deleteComponent(componentId);
        if (result.success) {
            await refreshComponentsTree();

            // Если удаляли текущий компонент, очищаем просмотр
            if (componentId == currentComponentId) {
                document.getElementById('component-view').innerHTML = `
                    <div class="text-center text-muted mt-5">
                        <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                        <h4>Компонент удален</h4>
                    </div>
                `;
                currentComponentId = null;
            }

            showNotification('Компонент успешно удален', 'success');
        } else {
            showNotification('Ошибка: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Ошибка удаления компонента:', error);
        showNotification('Ошибка удаления компонента', 'danger');
    }
}

// Переключение отображения категории
async function toggleCategory(categoryId) {
    const categoryContent = document.getElementById(`category-${categoryId}`);
    const categoryElement = document.querySelector(`.category-item[data-id="${categoryId}"]`);

    if (!categoryContent) return;

    if (categoryContent.style.display === 'none') {
        try {
            components = await window.electronAPI.getComponents(categoryId);

            categoryContent.innerHTML = '';
            if (components.length === 0) {
                categoryContent.innerHTML = '<div class="text-muted small">Нет компонентов</div>';
            } else {
                components.forEach(component => {
                    const componentDiv = document.createElement('div');
                    componentDiv.className = 'tree-item component-item';
                    componentDiv.dataset.id = component.id;
                    componentDiv.innerHTML = `
                        <i class="fas fa-microchip tree-icon"></i>
                        ${component.name}
                    `;
                    componentDiv.onclick = (e) => {
                        if (!e.target.closest('.context-menu')) {
                            showComponent(component.id);
                        }
                    };
                    categoryContent.appendChild(componentDiv);
                });
            }

            categoryContent.style.display = 'block';
            currentCategoryId = categoryId;
        } catch (error) {
            console.error('Ошибка загрузки компонентов:', error);
            categoryContent.innerHTML = '<div class="text-danger small">Ошибка загрузки</div>';
        }
    } else {
        categoryContent.style.display = 'none';
        currentCategoryId = null;
    }
}

// Функция для обновления дерева компонентов
async function refreshComponentsTree() {
    console.log('Обновление дерева компонентов...');

    await loadCategories();

    if (currentCategoryId) {
        document.querySelectorAll('[id^="category-"]').forEach(el => {
            el.style.display = 'none';
        });

        await toggleCategory(currentCategoryId);
    }

    showNotification('Дерево компонентов обновлено', 'success');
}
































///////////////////////--------------------------------------

async function showComponent(componentId) {
    try {
        const component = await window.electronAPI.getComponent(componentId);
        if (!component) {
            showNotification('Компонент не найдена', 'warning');
            return;
        }

        console.log('Полученный компонент:', component); // ← ДОБАВЬТЕ ЭТО



        currentComponentId = componentId;
        const params = getParametersObject(component.parameters);
        let paramsHtml = '';

        for (const [key, value] of Object.entries(params)) {
            paramsHtml += `
                <tr>
                    <td><strong>${key}</strong></td>
                    <td>${value}</td>
                </tr>
            `;
        }




        console.log('Отображение компонента с изображением:', component.image_data ? 'exists' : 'null');



        // Замените блок imageHtml на этот отладочный вариант:
        const imageHtml = component.image_data ? `
<div class="col-md-6">
    <h6>Изображение компонента</h6>
    <div class="text-center">
        <img src="${component.image_data}" 
             class="img-fluid rounded" 
             style="max-width: 300px; max-height: 300px;"
             alt="Изображение компонента ${component.name}"
             onerror="console.error('Ошибка загрузки изображения:', this.src.substring(0, 100))">
        <div class="mt-2">
            <small class="text-muted">Длина данных: ${component.image_data.length} символов</small>
            <br>
            <button class="btn btn-outline-primary btn-sm mt-1" onclick="updateComponentImage(${component.id})">
                <i class="fas fa-sync-alt"></i> Обновить изображение
            </button>
        </div>
    </div>
</div>
` : `
<div class="col-md-6">
    <h6>Изображение компонента</h6>
    <div class="text-center text-muted">
        <i class="fas fa-image fa-3x mb-2"></i>
        <p>Изображение отсутствует</p>
        <button class="btn btn-primary btn-sm" onclick="updateComponentImage(${component.id})">
            <i class="fas fa-plus"></i> Добавить изображение
        </button>
    </div>
</div>
`;






        // Форматируем дату для отображения
        const formattedDate = component.updated_at ?
            new Date(component.updated_at).toLocaleString('ru-RU') :
            'Не обновлялся';

        const componentView = document.getElementById('component-view');
        if (componentView) {
            componentView.innerHTML = `
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4>${component.name}</h4>
                        <button class="btn btn-primary" onclick="editComponent(${component.id})">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6>Основная информация</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td width="30%"><strong>ID:</strong></td>
                                        <td>${component.id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Категория:</strong></td>
                                        <td>${categories.find(c => c.id === component.category_id)?.name || 'Неизвестно'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Ячейка хранения:</strong></td>
                                        <td>${component.storage_cell}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Datasheet:</strong></td>
                                        <td>
                                            <a href="#" class="datasheet-link text-decoration-none" data-url="${component.datasheet_url}">
                                                <i class="fas fa-file-pdf me-1"></i>
                                                Открыть datasheet
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Количество:</strong></td>
                                        <td>${component.quantity}</td>                            
                                    </tr>
                                    <tr>
                                        <td><strong>Дата обновления:</strong></td>
                                        <td>${formattedDate}</td>                            
                                    </tr>
                                </table>
                            </div>

                            ${imageHtml}

                        </div>
                        
                        <h6>Параметры</h6>
                        <table class="table table-striped">
                            <tbody>
                                ${paramsHtml || '<tr><td colspan="2">Нет параметров</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки компонента:', error);
        showNotification('Ошибка загрузки компонента', 'danger');
    }
}





















async function addComponent() {
    if (!categories.length) {
        showNotification('Сначала создайте категорию', 'warning');
        return;
    }

    document.getElementById('componentModalTitle').textContent = 'Добавить компонент';
    document.getElementById('componentForm').reset();
    document.getElementById('componentId').value = '';
    document.getElementById('deleteBtn').style.display = 'none';

    populateCategoryDropdown();
    clearParameters();
    addParameter(); // Добавляем пустое поле параметра

    // --- Исправлено: убрана ссылка на несуществующий `component` ---
    // Просто сбрасываем изображение для нового компонента
    addImageUploadField(); // Она сама сбросит preview и input

    const modal = new bootstrap.Modal(document.getElementById('componentModal'));
   
    modal.show();
}




// function addImageUploadField() {
//     const imageContainer = document.getElementById('image-upload-container');



//     const preview = document.getElementById('imagePreview');
//     const removeBtn = document.getElementById('removeImageBtn');
//     const imageInput = document.getElementById('componentImage');

//     // Проверяем, существует ли элемент preview
//     if (preview) {
//         preview.style.display = 'none';
//         preview.src = '';
//     }

//     // Проверяем, существует ли элемент removeBtn
//     if (removeBtn) {
//         removeBtn.style.display = 'none';
//     }

//     // Проверяем, существует ли элемент imageInput
//     if (imageInput) {
//         imageInput.value = '';
//     }




//     if (imageContainer) {
//         imageContainer.innerHTML = `
//             <div class="mb-3">
//                 <label class="form-label">Изображение компонента</label>
//                 <input type="file" id="componentImage" class="form-control" accept="image/*" onchange="previewImage(this)">
//                 <div class="mt-2 text-center">
//                     <img id="imagePreview" src="" style="max-width: 200px; max-height: 200px; display: none;" class="img-thumbnail">
//                     <button type="button" id="removeImageBtn" class="btn btn-danger btn-sm mt-2" style="display: none;" onclick="removeImage()">
//                         <i class="fas fa-times"></i> Удалить изображение
//                     </button>
//                 </div>
//             </div>
//         `;
//     }
// }

function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeImageBtn');

    if (input.files && input.files[0]) {
        if (!validateImage(input.files[0])) {
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            removeBtn.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}




function removeImage() {
    const preview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeImageBtn');
    const imageInput = document.getElementById('componentImage');

    preview.style.display = 'none';
    preview.src = '';
    removeBtn.style.display = 'none';

    if (imageInput) {
        imageInput.value = '';
    }

    // Устанавливаем флаг, что изображение нужно удалить
    document.getElementById('componentForm').dataset.removeImage = 'true';
}






















async function editComponent(componentId) {
    try {
        const component = await window.electronAPI.getComponent(componentId);
        if (!component) {
            showNotification('Компонент не найден', 'warning');
            return;
        }

        // Заполняем форму
        document.getElementById('componentId').value = component.id;
        document.getElementById('componentName').value = component.name;
        document.getElementById('componentCategory').value = component.category_id;
        document.getElementById('storageCell').value = component.storage_cell;
        document.getElementById('datasheetUrl').value = component.datasheet_url;
        document.getElementById('quantity').value = component.quantity;

        // Параметры
        clearParameters();
        const params = getParametersObject(component.parameters);
        if (Object.keys(params).length === 0) {
            addParameter();
        } else {
            for (const name in params) {
                addParameter(name, params[name]);
            }
        }

        // --- Восстанавливаем изображение ---
        const imagePreview = document.getElementById('imagePreview');
        const removeImageBtn = document.getElementById('removeImageBtn');

        if (component.image_data) {
            imagePreview.src = component.image_data;
            imagePreview.style.display = 'block';
            removeImageBtn.style.display = 'block';
            removeImageBtn.dataset.removed = 'false';
        } else {
            imagePreview.style.display = 'none';
            imagePreview.src = '';
            removeImageBtn.style.display = 'none';
            removeImageBtn.dataset.removed = 'false';
        }

        // --- Открываем модальное окно ---
        document.getElementById('componentModalTitle').textContent = 'Редактировать компонент';
        document.getElementById('deleteBtn').style.display = 'block';
        document.getElementById('deleteBtn').onclick = () => deleteComponentConfirm(component.id);

        const modal = new bootstrap.Modal(document.getElementById('componentModal'));


        addImageUploadField(); // ✅ Добавьте эту строку

        // Если есть изображение — покажем
        if (component.image_data) {
            const imagePreview = document.getElementById('imagePreview');
            const removeBtn = document.getElementById('removeImageBtn');
            imagePreview.src = component.image_data;
            imagePreview.style.display = 'block';
            removeBtn.style.display = 'block';
        }

        modal.show();

    } catch (error) {
        console.error('Ошибка редактирования компонента:', error);
        showNotification('Ошибка редактирования', 'danger');
    }
}




















// async function saveComponent() {
//     const modal = document.getElementById('componentModal');
//     const saveButton = modal.querySelector('.btn-primary');

//     saveButton.disabled = true;
//     saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

//     try {
//         // --- 1. Собираем параметры ---

//         const paramRows = document.querySelectorAll('.parameter-row');
//         const parameters = {};
//         paramRows.forEach(row => {
//             const nameInput = row.querySelector('input[name="paramName"]');  // ✅ Исправлено
//             const valueInput = row.querySelector('input[name="paramValue"]'); // ✅ Исправлено
//             const name = nameInput.value.trim();
//             const value = valueInput.value.trim();
//             if (name && value) {
//                 parameters[name] = value;
//             }
//         });


//         const removeBtn = document.getElementById('removeImageBtn');
//         const shouldKeepImage = imagePreview && 
//             imagePreview.src && 
//             imagePreview.style.display !== 'none' && 
//             (!removeBtn || removeBtn.dataset.removed !== 'true');




//         let imageData = null;
//         const imageInput = document.getElementById('componentImage');
//         const imagePreview = document.getElementById('imagePreview');

//         // Если новое изображение загружено
//         if (imageInput && imageInput.files && imageInput.files.length > 0) {
//             imageData = await convertImageToBase64(imageInput.files[0]);
//         }
//         // Если изображение уже было (редактирование), но не удаляли
//         else if (imagePreview && imagePreview.src && imagePreview.style.display !== 'none' && !document.getElementById('removeImageBtn').dataset.removed) {
//             imageData = imagePreview.src; // уже Base64
//         }



//         // Если пользователь нажал "удалить" — imageData остаётся null

//         // --- 3. Собираем данные компонента ---
//         const componentData = {
//             id: document.getElementById('componentId').value || null,
//             name: document.getElementById('componentName').value.trim(),
//             category_id: parseInt(document.getElementById('componentCategory').value),
//             storage_cell: document.getElementById('storageCell').value.trim(),
//             datasheet_url: document.getElementById('datasheetUrl').value.trim(),
//             // quantity: document.getElementById('quantity').value.trim(),
//             quantity: parseInt(document.getElementById('quantity').value) || 0,
//             parameters: parameters,
//             image_data: imageData,
//             updated_at: new Date().toISOString()
//         };

//         // --- 4. Валидация ---
//         if (!componentData.name) {
//             showNotification('Введите название компонента', 'warning');
//             return;
//         }

//         if (!componentData.category_id || isNaN(componentData.category_id)) {
//             showNotification('Выберите категорию', 'warning');
//             return;
//         }

//         // --- 5. Сохранение ---
//         // const result = componentData.id 
//         // ? await window.electronAPI.updateComponent(componentData)
//         // : await window.electronAPI.addComponent(componentData);

//         const result = await window.electronAPI.saveComponent(componentData);

//         if (result.success) {
//             // Закрываем модальное окно
//             bootstrap.Modal.getInstance(modal).hide();

//             // Обновляем дерево
//             await refreshComponentsTree();

//             // Если это текущий компонент — обновляем просмотр
//             if (componentData.id == currentComponentId) {
//                 await showComponent(componentData.id);
//             }

//             showNotification('Компонент успешно сохранён!', 'success');
//         } else {
//             showNotification('Ошибка: ' + result.error, 'danger');
//         }

//     } catch (error) {
//         console.error('Ошибка сохранения компонента:', error);
//         showNotification('Ошибка сохранения: ' + error.message, 'danger');
//     } finally {
//         saveButton.disabled = false;
//         saveButton.innerHTML = 'Сохранить';
//     }
// }





async function saveComponent() {
    const modal = document.getElementById('componentModal');
    const saveButton = modal.querySelector('.btn-primary');

    saveButton.disabled = true;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';

    try {
        // --- 1. Параметры ---
        const paramRows = document.querySelectorAll('.parameter-row');
        const parameters = {};
        paramRows.forEach(row => {
            const nameInput = row.querySelector('input[name="paramName"]');
            const valueInput = row.querySelector('input[name="paramValue"]');
            const name = nameInput.value.trim();
            const value = valueInput.value.trim();
            if (name && value) {
                parameters[name] = value;
            }
        });

        // --- 2. Изображение ---
        const imageInput = document.getElementById('componentImage');
        const imagePreview = document.getElementById('imagePreview');
        const removeBtn = document.getElementById('removeImageBtn');

        let imageData = null;

        // Новое изображение
        if (imageInput && imageInput.files && imageInput.files.length > 0) {
            imageData = await convertImageToBase64(imageInput.files[0]);
        }
        // Старое изображение и не удалено
        else if (imagePreview && imagePreview.src && imagePreview.style.display !== 'none' && (!removeBtn || removeBtn.dataset.removed !== 'true')) {
            imageData = imagePreview.src;
        }
        // Если удалено — imageData остаётся null

        // --- 3. Данные компонента ---
        const componentData = {
            id: document.getElementById('componentId').value || null,
            name: document.getElementById('componentName').value.trim(),
            category_id: parseInt(document.getElementById('componentCategory').value),
            storage_cell: document.getElementById('storageCell').value.trim(),
            datasheet_url: document.getElementById('datasheetUrl').value.trim(),
            quantity: parseInt(document.getElementById('quantity').value) || 0,
            parameters: parameters,
            image_data: imageData,
            updated_at: new Date().toISOString()
        };

        // --- 4. Валидация ---
        if (!componentData.name) {
            showNotification('Введите название компонента', 'warning');
            return;
        }
        if (!componentData.category_id || isNaN(componentData.category_id)) {
            showNotification('Выберите категорию', 'warning');
            return;
        }

        // --- 5. Сохранение ---
        const result = await window.electronAPI.saveComponent(componentData);

        if (result.success) {
            bootstrap.Modal.getInstance(modal).hide();
            await refreshComponentsTree();
            if (componentData.id == currentComponentId) {
                await showComponent(componentData.id);
            }
            showNotification('Компонент успешно сохранён!', 'success');
        } else {
            showNotification('Ошибка: ' + result.error, 'danger');
        }

    } catch (error) {
        console.error('Ошибка сохранения компонента:', error);
        showNotification('Ошибка: ' + error.message, 'danger');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = 'Сохранить';
    }
}









// Удалить текущий компонент
async function deleteCurrentComponent() {
    if (!confirm('Вы уверены, что хотите удалить этот компонент?')) {
        return;
    }

    try {
        const result = await window.electronAPI.deleteComponent(currentComponentId);
        if (result.success) {
            await refreshComponentsTree();
            bootstrap.Modal.getInstance(document.getElementById('componentModal')).hide();
            document.getElementById('component-view').innerHTML = `
                <div class="text-center text-muted mt-5">
                    <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <h4>Компонент удален</h4>
                </div>
            `;
            currentComponentId = null;
            showNotification('Компонент успешно удален', 'success');
        } else {
            showNotification('Ошибка: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Ошибка удаления компонента:', error);
        showNotification('Ошибка удаления компонента', 'danger');
    }
}

// Добавить категорию
function addCategory() {
    document.getElementById('categoryName').value = '';
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
}

// Сохранить категорию
async function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();

    if (!name) {
        showNotification('Введите название категории', 'warning');
        return;
    }

    try {
        const result = await window.electronAPI.addCategory(name);
        if (result.success) {
            await refreshComponentsTree();
            bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
            showNotification('Категория успешно добавлена', 'success');
        } else {
            showNotification('Ошибка: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Ошибка сохранения категории:', error);
        showNotification('Ошибка сохранения категории', 'danger');
    }
}

// Добавить поле параметра
function addParameter(name = '', value = '') {
    const container = document.getElementById('parameters-container');
    if (!container) {
        console.error('Элемент parameters-container не найден');
        return;
    }

    const div = document.createElement('div');
    div.className = 'parameter-row mb-2';
    div.innerHTML = `
        <div class="row">
            <div class="col-5">
                <input type="text" class="form-control" placeholder="Параметр" name="paramName" value="${name}">
            </div>
            <div class="col-5">
                <input type="text" class="form-control" placeholder="Значение" name="paramValue" value="${value}">
            </div>
            <div class="col-2">
                <button type="button" class="btn btn-danger btn-sm" onclick="removeParameter(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    container.appendChild(div);
}

// Удалить поле параметра
function removeParameter(button) {
    button.closest('.parameter-row').remove();
}

// Очистить все поля параметров
function clearParameters() {
    const container = document.getElementById('parameters-container');
    if (container) {
        container.innerHTML = '';
    }
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    document.querySelectorAll('.alert-notification').forEach(el => el.remove());

    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-notification alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Автоматически скрываем через 5 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}






// Функция для отладки - проверяет состояние БД
async function debugCheckDatabase() {
    try {
        console.log('=== ОТЛАДКА БАЗЫ ДАННЫХ ===');

        // Проверяем категории
        const categories = await window.electronAPI.getCategories();
        console.log('Категории:', categories);

        // Проверяем компоненты в каждой категории
        for (const category of categories) {
            const components = await window.electronAPI.getComponents(category.id);
            console.log(`Компоненты в категории "${category.name}":`, components);
        }

        showNotification('Отладочная информация в консоли', 'info');
    } catch (error) {
        console.error('Ошибка отладки:', error);
    }
}

// Функция для тестирования добавления компонента
async function testAddComponent() {
    try {
        const testComponent = {
            category_id: 1,
            name: 'TEST_COMPONENT_' + Date.now(),
            parameters: { test: 'value', voltage: '12V' }
        };

        console.log('Тестирование добавления компонента:', testComponent);
        const result = await window.electronAPI.addComponent(testComponent);
        console.log('Результат теста:', result);

        if (result.success) {
            showNotification('Тест успешен! Компонент добавлен с ID: ' + result.id, 'success');
            // Проверяем, что компонент действительно добавлен
            const components = await window.electronAPI.getComponents(1);
            console.log('Компоненты после добавления:', components);
        } else {
            showNotification('Тест failed: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Ошибка теста:', error);
        showNotification('Ошибка теста: ' + error.message, 'danger');
    }
}




document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('componentModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function () {
            // Очищаем форму после закрытия модального окна
            document.getElementById('componentForm').reset();
            clearParameters();
            document.getElementById('deleteBtn').style.display = 'none';
        });
    }

    addContextMenuHandlers(); // ← ЭТА СТРОКА ДОЛЖНА БЫТЬ
    console.log('Контекстное меню инициализировано');
});

async function checkDatabaseState() {
    try {
        console.log('=== ПРОВЕРКА СОСТОЯНИЯ БАЗЫ ДАННЫХ ===');

        // Проверяем категории
        const categories = await window.electronAPI.getCategories();
        console.log('Категории в БД:', categories);

        // Проверяем компоненты в каждой категории
        for (const category of categories) {
            const components = await window.electronAPI.getComponents(category.id);
            console.log(`Компоненты в категории "${category.name}" (ID: ${category.id}):`, components);
        }

        return true;
    } catch (error) {
        console.error('Ошибка проверки БД:', error);
        return false;
    }
}





// Добавляем стили для контекстного меню
const style = document.createElement('style');
style.textContent = `
    .context-menu {
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        min-width: 150px;
    }
    
    .context-menu .list-group-item {
        border: none;
        padding: 8px 12px;
        cursor: pointer;
    }
    
    .context-menu .list-group-item:hover {
        background-color: #f8f9fa;
    }
    
    .category-item, .component-item {
        position: relative;
    }
    
    .category-item:hover::after,
    .component-item:hover::after {
        content: '⋮';
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        opacity: 0.5;
    }
    
    .category-item:hover::after:hover,
    .component-item:hover::after:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Вспомогательная функция для безопасного получения объекта параметров
function getParametersObject(parameters) {
    if (typeof parameters === 'object' && parameters !== null) {
        return parameters;
    }

    if (typeof parameters === 'string' && parameters.trim() !== '') {
        try {
            return JSON.parse(parameters);
        } catch (error) {
            console.error('Ошибка парсинга параметров:', error);
            return {};
        }
    }

    return {};
}




async function updateComponentImage(componentId) {
    try {
        // Создаем модальное окно для загрузки изображения
        const modalHtml = `
            <div class="modal fade" id="imageModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Обновить изображение</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Выберите изображение</label>
                                <input type="file" id="newComponentImage" class="form-control" accept="image/*" onchange="previewNewImage(this)">
                                <div class="mt-2 text-center">
                                    <img id="newImagePreview" src="" style="max-width: 200px; max-height: 200px; display: none;" class="img-thumbnail">
                                    <button type="button" id="removeNewImageBtn" class="btn btn-danger btn-sm mt-2" style="display: none;" onclick="removeNewImage()">
                                        <i class="fas fa-times"></i> Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                            <button type="button" class="btn btn-primary" onclick="saveComponentImage(${componentId})">Сохранить</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('imageModal'));
        modal.show();

        // Удаляем модальное окно при закрытии
        document.getElementById('imageModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });

    } catch (error) {
        console.error('Ошибка при открытии модального окна:', error);
        showError('Не удалось открыть окно загрузки изображения');
    }
}

function previewNewImage(input) {
    const preview = document.getElementById('newImagePreview');
    const removeBtn = document.getElementById('removeNewImageBtn');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            removeBtn.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function removeNewImage() {
    const input = document.getElementById('newComponentImage');
    const preview = document.getElementById('newImagePreview');
    const removeBtn = document.getElementById('removeNewImageBtn');

    input.value = '';
    preview.style.display = 'none';
    removeBtn.style.display = 'none';
    preview.src = '';
}

async function saveComponentImage(componentId) {
    try {
        const input = document.getElementById('newComponentImage');
        let imageData = null;

        if (input.files && input.files[0]) {
            imageData = await convertImageToBase64(input.files[0]);
        }

        // Обновляем только изображение компонента
        const result = await window.electronAPI.updateComponent({
            id: componentId,
            image_data: imageData
        });

        if (result.success) {
            // Закрываем модальное окно
            bootstrap.Modal.getInstance(document.getElementById('imageModal')).hide();

            // Обновляем отображение компонента
            showComponent(componentId);

            showSuccess('Изображение успешно обновлено!');
        } else {
            showError('Ошибка при обновлении изображения: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка при сохранении изображения:', error);
        showError('Не удалось сохранить изображение');
    }
}

function displayComponents(components) {
    const tableBody = document.getElementById('componentsTableBody');

    tableBody.innerHTML = components.map(component => {
        // Создаем миниатюру изображения
        const imageThumbnail = component.image_data ?
            `<img src="${component.image_data}" 
                  class="img-thumbnail" 
                  style="width: 40px; height: 40px; object-fit: cover;"
                  alt="${component.name}"
                  title="Нажмите для просмотра"
                  onclick="showComponent(${component.id})">` :
            `<div class="text-center text-muted" style="width: 40px; height: 40px; line-height: 40px;">
                <i class="fas fa-image"></i>
            </div>`;

        return `
            <tr onclick="showComponent(${component.id})" style="cursor: pointer;">
                <td>${imageThumbnail}</td>
                <td>${component.name}</td>
                <td>${component.category_name || 'Без категории'}</td>
                <td>${component.storage_cell || 'Не указана'}</td>
                <td>${component.quantity}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); editComponent(${component.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteComponent(${component.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}


function validateImage(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        showError('Пожалуйста, выберите изображение в формате JPEG, PNG, GIF или WebP');
        return false;
    }

    if (file.size > maxSize) {
        showError('Размер изображения не должен превышать 5MB');
        return false;
    }

    return true;
}



function addImageUploadField() {
    const imageInput = document.getElementById('componentImage');
    const imagePreview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeImageBtn');

    if (!imageInput || !imagePreview || !removeBtn) {
        console.error('❌ Элементы загрузки изображения не найдены');
        return;
    }

    // Сброс
    imageInput.value = '';
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    removeBtn.style.display = 'none';

    // Обработчик изменения файла
    imageInput.onchange = async function () {
        if (this.files && this.files.length > 0) {
            try {
                const src = await convertImageToBase64(this.files[0]);
                imagePreview.src = src;
                imagePreview.style.display = 'block';
                removeBtn.style.display = 'block';
            } catch (error) {
                console.error('❌ Ошибка загрузки изображения:', error);
                showNotification('Ошибка загрузки изображения', 'danger');
            }
        }
    };
}


function removeImage() {
    const imageInput = document.getElementById('componentImage');
    const imagePreview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeImageBtn');

    if (imageInput) imageInput.value = '';
    if (imagePreview) {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
    }
    if (removeBtn) removeBtn.style.display = 'none';

    // Можно также добавить метку, что изображение удалено
    removeBtn.dataset.removed = 'true';
}


