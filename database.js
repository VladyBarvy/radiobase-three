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
  all(sql, params = []) {
    if (!this.db) return [];
    
    try {
      let finalSql = this.prepareSql(sql, params);
      const result = this.db.exec(finalSql);
      
      if (result.length === 0) return [];
      
      // Конвертируем результат в массив объектов
      const columns = result[0].columns;
      return result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
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
      let finalSql = this.prepareSql(sql, params);
      this.db.exec(finalSql);
      
      const changes = this.db.getRowsModified();
      
      // Получаем ID последней вставленной записи
      const lastIdResult = this.db.exec("SELECT last_insert_rowid() as id");
      const lastInsertRowid = lastIdResult.length > 0 && lastIdResult[0].values.length > 0 
        ? lastIdResult[0].values[0][0] 
        : 0;
      
      console.log('SQL выполнен:', finalSql, 'Изменений:', changes, 'Последний ID:', lastInsertRowid);
      
      // Сохраняем изменения
      this.save();
      
      return { changes, lastInsertRowid };
    } catch (error) {
      console.error('Ошибка выполнения запроса:', error, sql, params);
      return { changes: 0, lastInsertRowid: 0 };
    }
  }

  // Вспомогательный метод для подготовки SQL с параметрами
  prepareSql(sql, params = []) {
    let finalSql = sql;
    
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        if (param === null || param === undefined) {
          finalSql = finalSql.replace('?', 'NULL');
        } else if (typeof param === 'number') {
          finalSql = finalSql.replace('?', param.toString());
        } else if (typeof param === 'string') {
          // Экранируем кавычки в строках
          const escapedParam = param.replace(/'/g, "''");
          finalSql = finalSql.replace('?', `'${escapedParam}'`);
        } else if (typeof param === 'object') {
          // Для объектов (JSON) преобразуем в строку и экранируем
          const jsonString = JSON.stringify(param).replace(/'/g, "''");
          finalSql = finalSql.replace('?', `'${jsonString}'`);
        } else {
          finalSql = finalSql.replace('?', `'${param}'`);
        }
      });
    }
    
    return finalSql;
  }
}

module.exports = DatabaseWrapper;
