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
      const result = dbWrapper.all('SELECT * FROM components WHERE category_id = ? ORDER BY name', [categoryId]);
      console.log('Получены компоненты для категории', categoryId, ':', result.length);
      return result;
    } catch (error) {
      console.error('Ошибка получения компонентов:', error);
      return [];
    }
  });

  ipcMain.handle('get-component', (event, componentId) => {
    try {
      const result = dbWrapper.get('SELECT * FROM components WHERE id = ?', [componentId]);
      console.log('Получен компонент', componentId, ':', result ? 'найден' : 'не найден');
      return result;
    } catch (error) {
      console.error('Ошибка получения компонента:', error);
      return null;
    }
  });

  ipcMain.handle('add-category', (event, name) => {
    try {
      console.log('Добавление категории:', name);
      const result = dbWrapper.run('INSERT INTO categories (name) VALUES (?)', [name]);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      console.error('Ошибка добавления категории:', error);
      return { success: false, error: error.message };
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
      
      // Проверяем данные
      if (!component.category_id || !component.name) {
        console.error('Невалидные данные компонента');
        return { success: false, error: 'Невалидные данные компонента' };
      }
      
      const result = dbWrapper.run(
        'INSERT INTO components (category_id, name, parameters) VALUES (?, ?, ?)',
        [component.category_id, component.name, JSON.stringify(component.parameters || {})]
      );
      
      console.log('Компонент добавлен, ID:', result.lastInsertRowid, 'Изменений:', result.changes);
      
      // Проверяем, что компонент действительно добавлен
      const checkComponent = dbWrapper.get('SELECT * FROM components WHERE id = ?', [result.lastInsertRowid]);
      console.log('Проверка добавленного компонента:', checkComponent);
      
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      console.error('Ошибка добавления компонента:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-component', (event, component) => {
    try {
      console.log('Обновление компонента:', component);
      dbWrapper.run(
        'UPDATE components SET category_id = ?, name = ?, parameters = ? WHERE id = ?',
        [component.category_id, component.name, JSON.stringify(component.parameters || {}), component.id]
      );
      return { success: true };
    } catch (error) {
      console.error('Ошибка обновления компонента:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-component', (event, id) => {
    try {
      console.log('Удаление компонента:', id);
      dbWrapper.run('DELETE FROM components WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления компонента:', error);
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

// Функция для удаления IPC обработчиков
function removeIpcHandlers() {
  const handlers = [
    'get-categories', 'get-components', 'get-component',
    'add-category', 'delete-category', 'add-component',
    'update-component', 'delete-component'
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
