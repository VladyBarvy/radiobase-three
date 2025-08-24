const fs = require('fs');
const path = require('path');

class DatabaseWrapper {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.cwd(), 'database', 'components.db');
  }

  async init() {
    try {
      // Динамический импорт sql.js
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();

      const dbDir = path.dirname(this.dbPath);

      // Создаем папку если не существует
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('Папка database создана:', dbDir);
      }

      // Загружаем или создаем базу данных
      if (fs.existsSync(this.dbPath)) {
        console.log('Загружаем существующую базу данных');
        const fileBuffer = fs.readFileSync(this.dbPath);
        const databaseData = new Uint8Array(fileBuffer);
        this.db = new SQL.Database(databaseData);

        // Миграция для существующей базы
        await this.migrateDatabase();
      } else {
        console.log('Создаем новую базу данных');
        this.db = new SQL.Database();
        this.createTables();
        this.save();
      }

      console.log('База данных успешно инициализирована');
      return this;
    } catch (error) {
      console.error('Ошибка инициализации БД:', error);
      throw new Error(`Ошибка инициализации БД: ${error.message}`);
    }
  }

  createTables() {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        storage_cell TEXT,          -- Ячейка хранения
        datasheet_url TEXT,         -- Ссылка на datasheet
        quantity INTEGER,
        updated_at TEXT,
        parameters TEXT
      )
    `);

    // Вставляем начальные данные
    try {
      this.db.exec("INSERT OR IGNORE INTO categories (name) VALUES ('Транзисторы')");
      this.db.exec("INSERT OR IGNORE INTO categories (name) VALUES ('Резисторы')");
      this.db.exec("INSERT OR IGNORE INTO categories (name) VALUES ('Конденсаторы')");
      this.db.exec("INSERT OR IGNORE INTO categories (name) VALUES ('Микросхемы')");
      this.db.exec("INSERT OR IGNORE INTO categories (name) VALUES ('Диоды')");
      this.save();
    } catch (error) {
      console.log('Начальные данные уже существуют или ошибка:', error.message);
    }
  }

  async migrateDatabase() {
    try {
      console.log('Проверка миграции базы данных...');

      const columns = this.all("PRAGMA table_info(components)");
      const columnNames = columns.map(col => col.name);
      console.log('Существующие колонки:', columnNames);

      let needsMigration = false;

      if (!columnNames.includes('storage_cell')) {
        console.log('Добавляем колонку storage_cell...');
        this.run('ALTER TABLE components ADD COLUMN storage_cell TEXT');
        console.log('Колонка storage_cell добавлена');
        needsMigration = true;
      }

      if (!columnNames.includes('datasheet_url')) {
        console.log('Добавляем колонку datasheet_url...');
        this.run('ALTER TABLE components ADD COLUMN datasheet_url TEXT');
        console.log('Колонка datasheet_url добавлена');
        needsMigration = true;
      }

      if (!columnNames.includes('quantity')) {
        console.log('Добавляем колонку quantity...');
        this.run('ALTER TABLE components ADD COLUMN quantity TEXT');
        console.log('Колонка quantity добавлена');
        needsMigration = true;
      }

      // Проверяем наличие updatedAtInfo (а не updated_at)
      if (!columnNames.includes('updated_at')) {
        console.log('Добавляем колонку updated_at...');
        this.run('ALTER TABLE components ADD COLUMN updated_at TEXT');
        console.log('Колонка updated_at добавлена');
        needsMigration = true;
      }

      // Проверяем и добавляем колонку для изображения
      if (!columnNames.includes('image_data')) {
        console.log('Добавляем колонку image_data...');
        this.db.exec('ALTER TABLE components ADD COLUMN image_data TEXT')
        console.log('Колонка image_data добавлена');
        needsMigration = true;
      }

      // Сохраняем только если были изменения
      if (needsMigration) {
        this.save();
        console.log('Миграция завершена, база данных сохранена');
      } else {
        console.log('Миграция не требуется');
      }

      // Проверим итоговую структуру
      const finalColumns = this.all("PRAGMA table_info(components)");
      console.log('Финальная структура таблицы:', finalColumns.map(col => col.name));

    } catch (error) {
      console.error('Ошибка миграции базы данных:', error);
    }
  }



  checkTableStructure() {
    try {
      const tableInfo = this.all("PRAGMA table_info(components)");
      console.log('Структура таблицы components:', tableInfo);

      const requiredColumns = ['id', 'category_id', 'name', 'storage_cell', 'datasheet_url', 'quantity', 'updated_at', 'parameters'];
      const existingColumns = tableInfo.map(col => col.name);

      console.log('Необходимые колонки:', requiredColumns);
      console.log('Существующие колонки:', existingColumns);

      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      if (missingColumns.length > 0) {
        console.error('Отсутствующие колонки:', missingColumns);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Ошибка проверки структуры таблицы:', error);
      return false;
    }
  }

  save() {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
      console.log('База данных сохранена');
    } catch (error) {
      console.error('Ошибка сохранения базы данных:', error);
    }
  }

  close() {
    this.save();
    if (this.db) {
      this.db.close();
    }
  }

  // Методы для работы с данными
  // all(sql, params = []) {
  //   if (!this.db) return [];

  //   try {
  //     let finalSql = this.prepareSql(sql, params);
  //     const result = this.db.exec(finalSql);

  //     if (result.length === 0) return [];

  //     // Конвертируем результат в массив объектов
  //     const columns = result[0].columns;
  //     return result[0].values.map(row => {
  //       const obj = {};
  //       columns.forEach((col, i) => {
  //         obj[col] = row[i];
  //       });
  //       return obj;
  //     });
  //   } catch (error) {
  //     console.error('Ошибка выполнения запроса:', error, sql, params);
  //     return [];
  //   }
  // }

  // get(sql, params = []) {
  //   const results = this.all(sql, params);
  //   return results.length > 0 ? results[0] : null;
  // }

  // run(sql, params = []) {
  //   if (!this.db) return { changes: 0, lastInsertRowid: 0 };

  //   try {
  //     let finalSql = this.prepareSql(sql, params);
  //     this.db.exec(finalSql);

  //     const changes = this.db.getRowsModified();

  //     // Получаем ID последней вставленной записи
  //     const lastIdResult = this.db.exec("SELECT last_insert_rowid() as id");
  //     const lastInsertRowid = lastIdResult.length > 0 && lastIdResult[0].values.length > 0
  //       ? lastIdResult[0].values[0][0]
  //       : 0;

  //     console.log('SQL выполнен:', finalSql, 'Изменений:', changes, 'Последний ID:', lastInsertRowid);

  //     // НЕ сохраняем здесь базу данных после каждого запроса!
  //     // Сохранение будет вызываться вручную или при закрытии
  //     // this.save(); // УБЕРИТЕ ЭТУ СТРОКУ

  //     return { changes, lastInsertRowid };
  //   } catch (error) {
  //     console.error('Ошибка выполнения запроса:', error, sql, params);
  //     return { changes: 0, lastInsertRowid: 0 };
  //   }
  // }



  all(sql, params = []) {
    if (!this.db) return [];

    try {
        const stmt = this.db.prepare(sql);
        if (params && params.length > 0) {
            stmt.bind(params);
        }
        
        const result = [];
        while (stmt.step()) {
            result.push(stmt.getAsObject());
        }
        stmt.free();
        
        return result;
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error, sql, params);
        return [];
    }
}

get(sql, params = []) {
    const results = this.all(sql, params);
    return results.length > 0 ? results[0] : null;
}

run(sql, params = []) {
    if (!this.db) return { changes: 0, lastInsertRowid: 0 };

    try {
        const stmt = this.db.prepare(sql);
        if (params && params.length > 0) {
            stmt.bind(params);
        }
        
        stmt.step();
        const changes = this.db.getRowsModified();
        stmt.free();

        // Получаем ID последней вставленной записи
        const lastIdResult = this.db.exec("SELECT last_insert_rowid() as id");
        const lastInsertRowid = lastIdResult.length > 0 && lastIdResult[0].values.length > 0
            ? lastIdResult[0].values[0][0]
            : 0;

        console.log('SQL выполнен:', sql, 'Изменений:', changes, 'Последний ID:', lastInsertRowid);

        return { changes, lastInsertRowid };
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error, sql, params);
        return { changes: 0, lastInsertRowid: 0 };
    }
}





// --- МЕТОДЫ ДЛЯ РАБОТЫ С КОМПОНЕНТАМИ ---

async addComponent(data) {
  const {
      name,
      category_id,
      storage_cell,
      datasheet_url,
      quantity,
      parameters,
      image_data
  } = data;

  const sql = `
      INSERT INTO components (
          name,
          category_id,
          storage_cell,
          datasheet_url,
          quantity,
          updated_at,
          parameters,
          image_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = this.run(sql, [
      name,
      category_id,
      storage_cell || null,
      datasheet_url || null,
      quantity || 0,
      new Date().toISOString(),
      parameters || '{}',
      image_data || null
  ]);

  return {
      success: result.changes > 0,
      id: result.lastInsertRowid
  };
}

async updateComponent(data) {
  const {
      id,
      name,
      category_id,
      storage_cell,
      datasheet_url,
      quantity,
      parameters,
      image_data
  } = data;

  const sql = `
      UPDATE components SET
          name = ?,
          category_id = ?,
          storage_cell = ?,
          datasheet_url = ?,
          quantity = ?,
          updated_at = ?,
          parameters = ?,
          image_data = ?
      WHERE id = ?
  `;

  const result = this.run(sql, [
      name,
      category_id,
      storage_cell || null,
      datasheet_url || null,
      quantity || 0,
      new Date().toISOString(),
      parameters || '{}',
      image_data || null,
      id
  ]);

  return {
      success: result.changes > 0
  };
}

// --- ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ---

async getComponent(id) {
  return this.get('SELECT * FROM components WHERE id = ?', [id]);
}

async getComponents(categoryId) {
  if (categoryId) {
      return this.all('SELECT * FROM components WHERE category_id = ?', [categoryId]);
  }
  return this.all('SELECT * FROM components');
}

async getCategories() {
  return this.all('SELECT * FROM categories ORDER BY name');
}

async addCategory(name) {
  try {
      const result = this.run('INSERT INTO categories (name) VALUES (?)', [name]);
      return { success: result.changes > 0, id: result.lastInsertRowid };
  } catch (error) {
      return { success: false, error: error.message };
  }
}

async deleteCategory(categoryId) {
  try {
      // Удаляем сначала компоненты категории
      this.run('DELETE FROM components WHERE category_id = ?', [categoryId]);
      // Затем саму категорию
      const result = this.run('DELETE FROM categories WHERE id = ?', [categoryId]);
      this.save(); // Сохраняем изменения
      return { success: result.changes > 0 };
  } catch (error) {
      return { success: false, error: error.message };
  }
}

async deleteComponent(componentId) {
  try {
      const result = this.run('DELETE FROM components WHERE id = ?', [componentId]);
      this.save(); // Сохраняем изменения
      return { success: result.changes > 0 };
  } catch (error) {
      return { success: false, error: error.message };
  }
}




  // Вспомогательный метод для подготовки SQL с параметрами
  // prepareSql(sql, params = []) {
  //   let finalSql = sql;

  //   if (params && params.length > 0) {
  //     params.forEach((param, index) => {
  //       if (param === null || param === undefined) {
  //         finalSql = finalSql.replace('?', 'NULL');
  //       } else if (typeof param === 'number') {
  //         finalSql = finalSql.replace('?', param.toString());
  //       } else if (typeof param === 'string') {
  //         // Экранируем кавычки в строках
  //         const escapedParam = param.replace(/'/g, "''");
  //         finalSql = finalSql.replace('?', `'${escapedParam}'`);
  //       } else if (typeof param === 'object') {
  //         // Для объектов (JSON) преобразуем в строку и экранируем
  //         const jsonString = JSON.stringify(param).replace(/'/g, "''");
  //         finalSql = finalSql.replace('?', `'${jsonString}'`);
  //       } else {
  //         finalSql = finalSql.replace('?', `'${param}'`);
  //       }
  //     });
  //   }

  //   return finalSql;
  // }
}

module.exports = DatabaseWrapper;
