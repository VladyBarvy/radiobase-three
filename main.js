const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const DatabaseWrapper = require('./database'); // Импортируем DatabaseWrapper

let mainWindow;
let dbWrapper = null;
let isIpcRegistered = false;

const isDev = process.argv.includes('--dev') || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      // mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
    dialog.showErrorBox('Ошибка', `Не удалось загрузить приложение: ${errorDescription}`);
  });
}




async function initDatabase() {
  try {
    console.log('Инициализация базы данных...');
    dbWrapper = new DatabaseWrapper();
    await dbWrapper.init();
    console.log('База данных успешно инициализирована');

    // Проверяем и обновляем структуру таблицы
    await checkTableStructure(); // Используйте await, если checkTableStructure возвращает промис

    return dbWrapper;
  } catch (error) {
    console.error('Критическая ошибка инициализации БД:', error);
    dialog.showErrorBox('Ошибка базы данных', `Не удалось инициализировать базу данных: ${error.message}`);
    throw error;
  }
}

// Функция для регистрации IPC обработчиков
function registerIpcHandlers() {
  if (isIpcRegistered) {
    console.log('IPC обработчики уже зарегистрированы');
    return;
  }

  // Удаляем существующие обработчики
  removeIpcHandlers();

  // IPC обработчики для работы с базой данных
  ipcMain.handle('get-categories', () => {
    try {
      const result = dbWrapper.all('SELECT * FROM categories ORDER BY name');
      console.log('Получены категории:', result.length);
      return result;
    } catch (error) {
      console.error('Ошибка получения категорий:', error);
      return [];
    }
  });




  ipcMain.handle('get-components', (event, categoryId) => {
    try {
      const components = dbWrapper.all('SELECT * FROM components WHERE category_id = ? ORDER BY name', [categoryId]);
      console.log('Получены компоненты для категории', categoryId, ':', components.length);

      // Преобразуем параметры из JSON строки в объект для каждого компонента
      components.forEach(component => {
        try {
          component.parameters = component.parameters ? JSON.parse(component.parameters) : {};
        } catch (error) {
          console.error('Ошибка парсинга параметров для компонента', component.id, ':', error);
          component.parameters = {};
        }
      });

      return components;
    } catch (error) {
      console.error('Ошибка получения компонентов:', error);
      return [];
    }
  });



  ipcMain.handle('get-component', (event, componentId) => {
    try {
      const component = dbWrapper.get('SELECT * FROM components WHERE id = ?', [componentId]);

      if (component) {
        console.log('Компонент найден:', componentId);

        // Преобразуем параметры из JSON строки в объект
        try {
          component.parameters = component.parameters ? JSON.parse(component.parameters) : {};
        } catch (error) {
          console.error('Ошибка парсинга параметров:', error);
          component.parameters = {};
        }

        return component;
      } else {
        console.log('Компонент не найден:', componentId);
        return null;
      }
    } catch (error) {
      console.error('Ошибка получения компонента:', error);
      return null;
    }
  });








  ipcMain.handle('delete-category', (event, id) => {
    try {
      console.log('Удаление категории:', id);
      // Удаляем компоненты этой категории сначала
      dbWrapper.run('DELETE FROM components WHERE category_id = ?', [id]);

      // Удаляем категорию
      dbWrapper.run('DELETE FROM categories WHERE id = ?', [id]);

      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления категории:', error);
      return { success: false, error: error.message };
    }
  });



  ipcMain.handle('add-component', (event, component) => {
    try {
      console.log('Добавление компонента:', component);
  
      // Проверяем обязательные данные
      if (!component.category_id || !component.name) {
        console.error('Невалидные данные компонента');
        return { success: false, error: 'Невалидные данные компонента' };
      }
  
      const result = dbWrapper.run(
        'INSERT INTO components (category_id, name, storage_cell, datasheet_url, quantity, updated_at, parameters, image_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          component.category_id,
          component.name,
          component.storage_cell,
          component.datasheet_url,
          component.quantity,
          component.updated_at,
          JSON.stringify(component.parameters || {}), // ← Сначала parameters
          component.image_data || null              // ← Потом image_data
        ]
      );
  
      console.log('Компонент добавлен, ID:', result.lastInsertRowid);
  
      // Явно сохраняем базу данных
      dbWrapper.save();
  
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      console.error('Ошибка добавления компонента:', error);
      return { success: false, error: error.message };
    }
  });
  


  ipcMain.handle('delete-component', (event, id) => {
    try {
      console.log('Удаление компонента:', id);
      const result = dbWrapper.run('DELETE FROM components WHERE id = ?', [id]);

      console.log('Компонент удален, изменений:', result.changes);

      // Явно сохраняем базу данных после изменения
      dbWrapper.save();

      return { success: true, changes: result.changes };
    } catch (error) {
      console.error('Ошибка удаления компонента:', error);
      return { success: false, error: error.message };
    }
  });


  // ipcMain.handle('update-component', (event, component) => {
  //   try {
  //     console.log('Обновление компонента:', component);

  //     const result = dbWrapper.run(
  //       'UPDATE components SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, quantity = ?, updated_at = ?, parameters = ? WHERE id = ?',
  //       [
  //         component.category_id,
  //         component.name,
  //         component.storage_cell || null,
  //         component.datasheet_url || null,
  //         component.quantity,
  //         component.updated_at, // Используем updated_at
  //         JSON.stringify(component.parameters || {}),
  //         component.id
  //       ]
  //     );

  //     console.log('Компонент обновлен, изменений:', result.changes);

  //     // Явно сохраняем базу данных после изменения
  //     dbWrapper.save();

  //     return { success: true, changes: result.changes };
  //   } catch (error) {
  //     console.error('Ошибка обновления компонента:', error);
  //     return { success: false, error: error.message };
  //   }
  // });



//   ipcMain.handle('update-component', (event, component) => {
//     try {
//         console.log('Обновление компонента:', component);

//         const result = dbWrapper.run(
//             'UPDATE components SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, quantity = ?, updated_at = ?, parameters = ?, image_data = ? WHERE id = ?',
//             [
//                 component.category_id,
//                 component.name,
//                 component.storage_cell || null,
//                 component.datasheet_url || null,
//                 component.quantity,
//                 component.updated_at,
//                 JSON.stringify(component.parameters || {}),
//                 component.image_data || null, // Добавляем изображение
//                 component.id
//             ]
//         );

//         console.log('Компонент обновлен, изменений:', result.changes);
//         dbWrapper.save();
//         return { success: true, changes: result.changes };
//     } catch (error) {
//         console.error('Ошибка обновления компонента:', error);
//         return { success: false, error: error.message };
//     }
// });






ipcMain.handle('update-component', (event, component) => {
  try {
    console.log('Обновление компонента:', component);

    // 🔍 Логируем image_data
    console.log('image_data длина:', component.image_data ? component.image_data.length : 'null');

    const result = dbWrapper.run(
      'UPDATE components SET category_id = ?, name = ?, storage_cell = ?, datasheet_url = ?, quantity = ?, updated_at = ?, parameters = ?, image_data = ? WHERE id = ?',
      [
        component.category_id,
        component.name,
        component.storage_cell || null,
        component.datasheet_url || null,
        component.quantity,
        component.updated_at,
        JSON.stringify(component.parameters || {}),
        component.image_data || null,
        component.id
      ]
    );

    console.log('Компонент обновлен, изменений:', result.changes);
    dbWrapper.save();
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Ошибка обновления компонента:', error);
    return { success: false, error: error.message };
  }
});





  isIpcRegistered = true;
  console.log('IPC обработчики зарегистрированы');
}

ipcMain.handle('update-category', async (event, category) => {
  try {
    console.log('Обновление категории:', category);
    const result = dbWrapper.run(
      'UPDATE categories SET name = ? WHERE id = ?',
      [category.name, category.id]
    );
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    return { success: false, error: error.message };
  }
});




ipcMain.handle('add-category', (event, name) => {
  try {
    console.log('Добавление категории:', name);
    const result = dbWrapper.run('INSERT INTO categories (name) VALUES (?)', [name]);

    // Явно сохраняем базу данных после изменения
    dbWrapper.save();

    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error('Ошибка добавления категории:', error);
    return { success: false, error: error.message };
  }
});



ipcMain.handle('delete-category', async (event, id) => {
  try {
    console.log('Удаление категории:', id);
    // Удаляем компоненты этой категории сначала
    dbWrapper.run('DELETE FROM components WHERE category_id = ?', [id]);

    // Удаляем категорию
    const result = dbWrapper.run('DELETE FROM categories WHERE id = ?', [id]);

    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    return { success: false, error: error.message };
  }
});



function removeIpcHandlers() {
  const handlers = [
    'get-categories', 'get-components', 'get-component', // ← добавили get-component
    'add-category', 'delete-category', 'add-component',
    'update-component', 'delete-component', 'update-category' // ← и update-category тоже
  ];

  handlers.forEach(handler => {
    ipcMain.removeHandler(handler);
  });

  isIpcRegistered = false;
  console.log('IPC обработчики удалены');
}


app.whenReady().then(async () => {
  try {
    console.log('Инициализация приложения...');
    await initDatabase();

    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Не удалось запустить приложение:', error);
    dialog.showErrorBox('Ошибка запуска', 'Не удалось запустить приложение. Проверьте консоль для подробностей.');
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (dbWrapper) {
    try {
      dbWrapper.close();
      console.log('База данных закрыта');
    } catch (error) {
      console.error('Ошибка закрытия базы данных:', error);
    }
  }

  removeIpcHandlers();

  if (process.platform !== 'darwin') app.quit();
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  dialog.showErrorBox('Критическая ошибка', `Произошла критическая ошибка: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанный промис:', promise, 'причина:', reason);
});




// function checkTableStructure() {
//   try {
//       const tableInfo = dbWrapper.all("PRAGMA table_info(components)");
//       console.log('Структура таблицы components:', tableInfo);

//       // Обновите список необходимых колонок
//       const requiredColumns = ['id', 'category_id', 'name', 'storage_cell', 'datasheet_url', 'quantity', 'updated_at', 'parameters'];
//       const existingColumns = tableInfo.map(col => col.name);

//       console.log('Необходимые колонки:', requiredColumns);
//       console.log('Существующие колонки:', existingColumns);

//       const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
//       if (missingColumns.length > 0) {
//           console.error('Отсутствующие колонки:', missingColumns);
//           // Здесь можно добавить автоматическое создание отсутствующих колонок
//           missingColumns.forEach(col => {
//               if (col === 'updated_at') {
//                   dbWrapper.run('ALTER TABLE components ADD COLUMN updated_at TEXT');
//                   console.log('Добавлена колонка updated_at');
//               }
//           });
//       }
//   } catch (error) {
//       console.error('Ошибка проверки структуры таблицы:', error);
//   }
// }


// function checkTableStructure() {
//   try {
//     const tableInfo = dbWrapper.all("PRAGMA table_info(components)");
//     console.log('Структура таблицы components:', tableInfo);

//     // Добавили image_data в список необходимых колонок
//     const requiredColumns = [
//       'id', 'category_id', 'name', 'storage_cell', 'datasheet_url',
//       'quantity', 'updated_at', 'parameters', 'image_data'  // ← ДОБАВЛЕНО!
//     ];
//     const existingColumns = tableInfo.map(col => col.name);

//     console.log('Существующие колонки:', existingColumns);

//     const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
//     if (missingColumns.length > 0) {
//       console.log('Добавляем отсутствующие колонки:', missingColumns);

//       missingColumns.forEach(col => {
//         if (col === 'updated_at') {
//           dbWrapper.run('ALTER TABLE components ADD COLUMN updated_at TEXT');
//           console.log('Добавлена колонка updated_at');
//         }
//         if (col === 'image_data') {
//           dbWrapper.run('ALTER TABLE components ADD COLUMN image_data TEXT'); // или BLOB
//           console.log('Добавлена колонка image_data');
//         }
//       });
//     }
//   } catch (error) {
//     console.error('Ошибка проверки структуры таблицы:', error);
//   }
// }




function checkTableStructure() {
  try {
  const tableInfo = dbWrapper.all("PRAGMA table_info(components)");
  console.log('🔍 Структура таблицы components:', tableInfo); // ← ВАЖНО
 
  const requiredColumns = [
  'id', 'category_id', 'name', 'storage_cell', 'datasheet_url',
  'quantity', 'updated_at', 'parameters', 'image_data'
  ];
 
  const existingColumns = tableInfo.map(col => col.name);
  console.log('📌 Существующие колонки:', existingColumns);
 
  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
  if (missingColumns.length > 0) {
  console.log('🔧 Добавляем колонки:', missingColumns);
  missingColumns.forEach(col => {
  if (col === 'updated_at') {
  dbWrapper.run('ALTER TABLE components ADD COLUMN updated_at TEXT');
  console.log('✅ Добавлена колонка updated_at');
  }
  if (col === 'image_data') {
  dbWrapper.run('ALTER TABLE components ADD COLUMN image_data TEXT');
  console.log('✅ Добавлена колонка image_data');
  }
  });
  } else {
  console.log('✅ Все колонки на месте, включая image_data');
  }
 
  } catch (error) {
  console.error('❌ Ошибка проверки структуры таблицы:', error);
  }
 }

 