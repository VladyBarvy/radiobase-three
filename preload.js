const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Категории
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (name) => ipcRenderer.invoke('add-category', name),
  updateCategory: (category) => ipcRenderer.invoke('update-category', category),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),
  
  // Компоненты
  getComponents: (categoryId) => ipcRenderer.invoke('get-components', categoryId),
  getComponent: (componentId) => ipcRenderer.invoke('get-component', componentId),
  addComponent: (component) => ipcRenderer.invoke('add-component', component),
  updateComponent: (component) => ipcRenderer.invoke('update-component', component),
  deleteComponent: (id) => ipcRenderer.invoke('delete-component', id)
});


