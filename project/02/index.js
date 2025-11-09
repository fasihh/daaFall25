const { app, BrowserWindow } = require('electron/main');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
      ,
      preload: path.join(__dirname, 'src', 'preload.js')
    }
  });

  win.setMenu(null);

  const viewFile = "home.html";
  const filePath = path.join(__dirname, 'src', 'views', viewFile);
  win.loadFile(filePath);

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
