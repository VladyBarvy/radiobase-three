// let currentCategoryId = null;
// let currentComponentId = null;
// let categories = [];
// let components = [];

// // Инициализация при загрузке
// document.addEventListener('DOMContentLoaded', async () => {
//     await loadCategories();
//     await loadComponentsTree();
//     addRefreshButton();
//     addDebugButton();
// });

// // Загрузка категорий
// async function loadCategories() {
//     try {
//         categories = await window.electronAPI.getCategories();
//         populateCategoryDropdown();
//     } catch (error) {
//         console.error('Ошибка загрузки категорий:', error);
//         showNotification('Ошибка загрузки категорий', 'danger');
//     }
// }

// // Заполнить выпадающий список категорий
// function populateCategoryDropdown(selectedId = null) {
//     const select = document.getElementById('componentCategory');
//     if (!select) {
//         console.error('Элемент componentCategory не найден');
//         return;
//     }
    
//     select.innerHTML = '';
    
//     if (categories.length === 0) {
//         const option = document.createElement('option');
//         option.value = '';
//         option.textContent = 'Нет категорий';
//         select.appendChild(option);
//         return;
//     }
    
//     categories.forEach(category => {
//         const option = document.createElement('option');
//         option.value = category.id;
//         option.textContent = category.name;
//         if (selectedId === category.id) {
//             option.selected = true;
//         }
//         select.appendChild(option);
//     });
    
//     // Если не выбрана категория и есть категории, выбираем первую
//     if (!selectedId && categories.length > 0) {
//         select.value = categories[0].id;
//     }
// }

// // Загрузка дерева компонентов
// async function loadComponentsTree() {
//     const treeContainer = document.getElementById('tree-container');
//     if (!treeContainer) {
//         console.error('Элемент tree-container не найден');
//         return;
//     }
    
//     treeContainer.innerHTML = '';

//     if (categories.length === 0) {
//         treeContainer.innerHTML = '<div class="text-muted">Нет категорий</div>';
//         return;
//     }

//     categories.forEach(category => {
//         const categoryDiv = document.createElement('div');
//         categoryDiv.innerHTML = `
//             <div class="tree-item" onclick="toggleCategory(${category.id})">
//                 <i class="fas fa-folder tree-icon"></i>
//                 <span>${category.name}</span>
//                 <i class="fas fa-caret-down float-end"></i>
//             </div>
//             <div id="category-${category.id}" class="ms-3" style="display: none;">
//                 <div class="text-muted small">Загрузка...</div>
//             </div>
//         `;
//         treeContainer.appendChild(categoryDiv);
//     });
// }

// // Переключение отображения категории
// async function toggleCategory(categoryId) {
//     const categoryContent = document.getElementById(`category-${categoryId}`);
//     const categoryElement = document.querySelector(`[onclick="toggleCategory(${categoryId})"]`);
    
//     if (!categoryContent) return;
    
//     if (categoryContent.style.display === 'none') {
//         // Загружаем компоненты категории
//         try {
//             components = await window.electronAPI.getComponents(categoryId);
            
//             categoryContent.innerHTML = '';
//             if (components.length === 0) {
//                 categoryContent.innerHTML = '<div class="text-muted small">Нет компонентов</div>';
//             } else {
//                 components.forEach(component => {
//                     const componentDiv = document.createElement('div');
//                     componentDiv.className = 'tree-item component-item';
//                     componentDiv.dataset.id = component.id;
//                     componentDiv.innerHTML = `
//                         <i class="fas fa-microchip tree-icon"></i>
//                         ${component.name}
//                     `;
//                     componentDiv.onclick = () => showComponent(component.id);
//                     categoryContent.appendChild(componentDiv);
//                 });
//             }
            
//             categoryContent.style.display = 'block';
//             currentCategoryId = categoryId;
//         } catch (error) {
//             console.error('Ошибка загрузки компонентов:', error);
//             categoryContent.innerHTML = '<div class="text-danger small">Ошибка загрузки</div>';
//         }
//     } else {
//         categoryContent.style.display = 'none';
//         currentCategoryId = null;
//     }
// }

// // Функция для обновления дерева компонентов
// async function refreshComponentsTree() {
//     console.log('Обновление дерева компонентов...');
    
//     // Перезагружаем категории
//     await loadCategories();
    
//     // Если была открыта категория, переоткрываем ее
//     if (currentCategoryId) {
//         // Сначала скрываем все открытые категории
//         document.querySelectorAll('[id^="category-"]').forEach(el => {
//             el.style.display = 'none';
//         });
        
//         // Затем открываем текущую категорию заново
//         await toggleCategory(currentCategoryId);
//     }
    
//     showNotification('Дерево компонентов обновлено', 'success');
// }





let currentCategoryId = null;
let currentComponentId = null;
let categories = [];
let components = [];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadComponentsTree();
    addRefreshButton();
    addTestButton();
    addContextMenuHandlers();

    addContextMenuHandlers(); // ← ЭТА СТРОКА ДОЛЖНА БЫТЬ
    console.log('Контекстное меню инициализировано');
});

// Добавляем обработчики контекстного меню
// function addContextMenuHandlers() {
//     document.addEventListener('contextmenu', function(e) {
//         e.preventDefault();
        
//         // Проверяем, кликнули ли на категорию или компонент
//         const categoryItem = e.target.closest('.category-item');
//         const componentItem = e.target.closest('.component-item');
        
//         if (categoryItem) {
//             showCategoryContextMenu(e, categoryItem);
//         } else if (componentItem) {
//             showComponentContextMenu(e, componentItem);
//         }
//     });
    
//     // Скрываем контекстное меню при клике в любое место
//     document.addEventListener('click', function() {
//         hideContextMenus();
//     });
// }


function addContextMenuHandlers() {
    document.addEventListener('contextmenu', function(e) {
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
    
    document.addEventListener('click', function() {
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








// Показать компонент
async function showComponent(componentId) {
    try {
        const component = await window.electronAPI.getComponent(componentId);
        if (!component) {
            showNotification('Компонент не найден', 'warning');
            return;
        }
        
        currentComponentId = componentId;
        
        const params = JSON.parse(component.parameters || '{}');
        let paramsHtml = '';
        
        for (const [key, value] of Object.entries(params)) {
            paramsHtml += `
                <tr>
                    <td><strong>${key}</strong></td>
                    <td>${value}</td>
                </tr>
            `;
        }
        
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
                                </table>
                            </div>
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

// Добавить компонент
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
    
    const modal = new bootstrap.Modal(document.getElementById('componentModal'));
    modal.show();
}

// Редактировать компонент
async function editComponent(componentId) {
    try {
        const component = await window.electronAPI.getComponent(componentId);
        if (!component) {
            showNotification('Компонент не найден', 'warning');
            return;
        }
        
        document.getElementById('componentModalTitle').textContent = 'Редактировать компонент';
        document.getElementById('componentId').value = component.id;
        document.getElementById('componentName').value = component.name;
        
        populateCategoryDropdown(component.category_id);
        document.getElementById('deleteBtn').style.display = 'block';
        
        // Заполняем параметры
        clearParameters();
        const params = JSON.parse(component.parameters || '{}');
        for (const [key, value] of Object.entries(params)) {
            addParameter(key, value);
        }
        if (Object.keys(params).length === 0) {
            addParameter();
        }
        
        const modal = new bootstrap.Modal(document.getElementById('componentModal'));
        modal.show();
    } catch (error) {
        console.error('Ошибка редактирования компонента:', error);
        showNotification('Ошибка загрузки компонента', 'danger');
    }
}

// Сохранить компонент
async function saveComponent() {
  const modal = document.getElementById('componentModal');
  const saveButton = modal.querySelector('.btn-primary');
  
  // Блокируем кнопку чтобы предотвратить multiple clicks
  saveButton.disabled = true;
  saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
  
  try {
      const formData = {
          id: document.getElementById('componentId').value,
          name: document.getElementById('componentName').value.trim(),
          category_id: parseInt(document.getElementById('componentCategory').value),
          parameters: {}
      };
      
      if (!formData.name) {
          showNotification('Введите название компонента', 'warning');
          saveButton.disabled = false;
          saveButton.innerHTML = 'Сохранить';
          return;
      }
      
      // Собираем параметры
      const paramRows = document.querySelectorAll('.parameter-row');
      paramRows.forEach(row => {
          const nameInput = row.querySelector('input[name="paramName"]');
          const valueInput = row.querySelector('input[name="paramValue"]');
          const name = nameInput.value.trim();
          const value = valueInput.value.trim();
          
          if (name && value) {
              formData.parameters[name] = value;
          }
      });
      
      console.log('Данные для сохранения:', formData);
      
      let result;
      if (formData.id) {
          result = await window.electronAPI.updateComponent(formData);
      } else {
          result = await window.electronAPI.addComponent(formData);
      }
      
      console.log('Результат сохранения:', result);
      
      if (result.success) {
          // Закрываем модальное окно ПЕРЕД обновлением дерева
          const modalInstance = bootstrap.Modal.getInstance(modal);
          modalInstance.hide();
          
          // ОБНОВЛЯЕМ ДЕРЕВО КОМПОНЕНТОВ ПОСЛЕ СОХРАНЕНИЯ
          await refreshComponentsTree();
          
          // Если редактировали текущий компонент, обновляем его отображение
          if (formData.id && formData.id == currentComponentId) {
              await showComponent(formData.id);
          }
          
          showNotification('Компонент успешно сохранен!', 'success');
      } else {
          showNotification('Ошибка: ' + result.error, 'danger');
      }
  } catch (error) {
      console.error('Ошибка сохранения компонента:', error);
      showNotification('Ошибка сохранения компонента: ' + error.message, 'danger');
  } finally {
      // Всегда разблокируем кнопку
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

// Добавьте кнопку обновления в интерфейс
// function addRefreshButton() {
//     const sidebarHeader = document.querySelector('.sidebar .d-flex');
//     if (!sidebarHeader) return;
    
//     // Проверяем, не добавлена ли уже кнопка
//     if (!document.getElementById('refresh-btn')) {
//         const refreshBtn = document.createElement('button');
//         refreshBtn.id = 'refresh-btn';
//         refreshBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
//         refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
//         refreshBtn.title = 'Обновить дерево';
//         refreshBtn.onclick = refreshComponentsTree;
//         sidebarHeader.appendChild(refreshBtn);
//     }
// }




function addRefreshButton() {
    // Измените селектор на что-то уникальное
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (!sidebarHeader) {
        console.log('Не найден sidebar-header');
        return;
    }
    
    // Создайте отдельный контейнер для кнопок
    let buttonContainer = sidebarHeader.querySelector('.button-container');
    if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container d-flex gap-1 mb-2';
        sidebarHeader.appendChild(buttonContainer);
    }
    
    // Добавьте кнопку
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-sm btn-outline-secondary';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    refreshBtn.onclick = refreshComponentsTree;
    buttonContainer.appendChild(refreshBtn);
}



// Добавьте кнопку отладки
// function addDebugButton() {
//     const sidebarHeader = document.querySelector('.sidebar .d-flex');
//     if (!sidebarHeader) return;
    
//     const debugBtn = document.createElement('button');
//     debugBtn.className = 'btn btn-sm btn-warning ms-2';
//     debugBtn.innerHTML = '<i class="fas fa-bug"></i>';
//     debugBtn.title = 'Отладка';
//     debugBtn.onclick = debugCheckDatabase;
//     sidebarHeader.appendChild(debugBtn);
// }

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

// Добавьте кнопку теста в интерфейс
// function addTestButton() {
//   const sidebarHeader = document.querySelector('.sidebar .d-flex');
//   if (!sidebarHeader) return;
  
//   const testBtn = document.createElement('button');
//   testBtn.className = 'btn btn-sm btn-info ms-2';
//   testBtn.innerHTML = '<i class="fas fa-vial"></i>';
//   testBtn.title = 'Тест БД';
//   testBtn.onclick = testAddComponent;
//   sidebarHeader.appendChild(testBtn);
// }



document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('componentModal');
  if (modal) {
      modal.addEventListener('hidden.bs.modal', function() {
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
