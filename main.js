const { app, BrowserWindow } = require('electron');
const electron = require('electron')
const Menu = electron.Menu
const MenuItem = electron.MenuItem

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
    });

    win.loadFile('html/index.html');

    const signalMenu = new Menu()
    signalMenu.append(
        new MenuItem({
            label:'Hello'
        })
    )

    win.webContents.on('context-menu', function (e,params){
        signalMenu.popup(win,params.x,params.y)
    })

};

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