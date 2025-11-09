const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronPaths', {
  fileUrl: (relativePath) => {
    const p = __dirname + '/' + relativePath;
    const normalized = p.replace(/\\/g, '/');
    return 'file://' + normalized;
  }
});
