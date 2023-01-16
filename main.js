const electron = require('electron')
const { app, BrowserWindow, ipcMain, Menu} = electron
//const Menu = electron.Menu
const MenuItem = electron.MenuItem
const rw = require('./classes/railway.js')
let Railway = new rw()
global.win = null

global.updateLog = (message,type='default')=>{
    message = new Date().toLocaleString() + " - " + message
    win.webContents.send('updateLog', {message,type})
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    win.loadFile('html/index.html')
    win.webContents.openDevTools()

    return win
}

app.whenReady().then(() => {
    win = createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    });

    win.webContents.on('dom-ready', () => {
        updateLog('Load Route')

        Railway.loadFile('routes/test-route.json')
    })

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('msg',(event,message)=>{
    console.log(message)
})

ipcMain.on('loadSignalContextMenu',(event,id)=>{
    let sig = Railway.returnSignalById(id)
    const signalMenu = new Menu()

    signalMenu.append(
        new MenuItem({
            label:sig.id,
            enabled:false
        })
    )
    signalMenu.append(
        new MenuItem({
            type:"separator",
        })
    )

    if(sig.routeSet){
        signalMenu.append(
            new MenuItem({
                label:'Cancel Route',
                click: (menuItem, window, e) => {
                    Railway.cancelRoute(sig.id);
                }
            })
        )
    }

    signalMenu.append(
        new MenuItem({
            label:'Reminder',
            type:'checkbox',
            checked:sig.reminder,
            click: (menuItem, window, e) => {
                sig.toggleReminder();
            }
        })
    )

    const routeMenu = new Menu()
    sig.routes.forEach((route)=>{
        routeMenu.append(
            new MenuItem({
                label:route.targetSignalId,
                click: (menuItem, window, e) => {
                    Railway.setRoute(sig.id,route);
                }
            })
        )
    })

    signalMenu.append(
        new MenuItem({
            type:"submenu",
            label:"Set Route",
            submenu:routeMenu
        })
    )

    signalMenu.append(
        new MenuItem({
            label:'Interpose Headcode',
            click: (menuItem, window, e) => {
                let berth=Railway.returnTrackById(sig.berth)
                win.webContents.send('interposePopup',{'x':(berth.x+(berth.width/2)),'y':berth.y,'trackId':sig.berth})
            }
        })
    )


    signalMenu.popup(win)
})

ipcMain.on('loadTrackContextMenu',(event,id)=>{
    let track= Railway.returnTrackById(id)
    const trackMenu = new Menu()

    trackMenu.append(
        new MenuItem({
            label:track.id,
            enabled:false
        })
    )
    trackMenu.append(
        new MenuItem({
            type:"separator",
        })
    )

    if(track.points){

        let enabledOption = true
        let pointPositionLabel = "Reverse Points"
        if(track.pointsPosition === 1){
            pointPositionLabel = "Normalise Points"
        }
        if(track.flankProtect){
            enabledOption=false
            pointPositionLabel +=" (Flank Protection Locked)"
        }
        if(track.routeSet){
            enabledOption=false
            pointPositionLabel +=" (Route Locked)"
        }
        trackMenu.append(
            new MenuItem({
                label:pointPositionLabel,
                click: (menuItem, window, e) => {
                    track.togglePointPosition()
                },
                enabled:enabledOption
            })
        )
    }

    trackMenu.append(
        new MenuItem({
            label:'Engineering Overlay'
        })
    )

    trackMenu.popup(win)
})

let routeSetActive=false
let routeSetActiveTimeout=false
ipcMain.on('clickSignal',(event,id)=>{
    let sig = Railway.returnSignalById(id)
    if(routeSetActive){
        clearTimeout(routeSetActiveTimeout);
        routeSetActive.routes.forEach((route)=>{
            Railway.clearFlashSignal(route.targetSignalId)
        })

        //Is the route valid?
        let routeToSet = routeSetActive.returnRouteTo(sig.id);
        if(routeToSet!==undefined){
            Railway.setRoute(routeSetActive.id,routeToSet)
        }else{
            console.log("No valid route between "+routeSetActive.id+" & "+sig.id)
        }

        routeSetActive = false

    }else{
        routeSetActive=sig;
        sig.routes.forEach((route)=>{
            Railway.flashSignal(route.targetSignalId)
        })
        routeSetActiveTimeout = setTimeout(()=>{
            sig.routes.forEach((route)=>{
                Railway.clearFlashSignal(route.targetSignalId)
            })
            routeSetActive=false
        },10000)
    }
})
