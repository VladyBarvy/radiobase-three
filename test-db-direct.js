const DatabaseWrapper = require('./database');

async function testDatabase() {
    try {
        console.log('=== ТЕСТ БАЗЫ ДАННЫХ ===');
        
        const db = new DatabaseWrapper();
        await db.init();
        
        // Сначала проверим существующие категории
        const categories = db.all('SELECT * FROM categories');
        console.log('Существующие категории:', categories);
        
        // Тест добавления компонента
        const testData = {
            category_id: 1,
            name: 'TEST_COMPONENT_' + Date.now(),
            parameters: { test: 'value', voltage: '5V' }
        };
        
        console.log('Добавляем тестовый компонент:', testData);
        const result = db.run(
            'INSERT INTO components (category_id, name, parameters) VALUES (?, ?, ?)',
            [testData.category_id, testData.name, testData.parameters]
        );
        
        console.log('Результат добавления:', result);
        
        // Проверяем, что компонент добавлен
        const components = db.all('SELECT * FROM components WHERE category_id = ?', [1]);
        console.log('Компоненты в категории 1:', components);
        
        db.close();
        console.log('=== ТЕСТ ЗАВЕРШЕН ===');
        return true;
    } catch (error) {
        console.error('Ошибка теста:', error);
        return false;
    }
}

testDatabase();
