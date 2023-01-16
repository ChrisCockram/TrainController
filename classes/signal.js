//signal status
// 0 = RED
// 1 = YELLOW
// 2 = DOUBLE YELLOW
// 3 = GREEN
// 4 = PERMISSIVE

class Signal{
    constructor(s) {
        this.id=s.id
        this.x=s.x
        this.y=s.y
        this.position = s.position
        this.gpl=s.gpl||false
        this.status = 0
        this.reminder = false
        this.flash = false
        this.routes = s.routes||[]
        this.routeSet = false
        this.overlap = s.overlap||false
        this.berth = s.berth||false
        this.draw();
    }

    draw(){
        let layer = "signal";
        let detail = this
        win.webContents.send('draw',{
            layer,
            detail
        })
    }

    updateSignal(){
        win.webContents.send('updateSignal',this)
    }

    toggleReminder(){
        console.log('Toggle'+this.id)
        this.reminder = this.reminder != true
        console.log(this)
        this.updateSignal()
    }

    setFlash(timeout=false){
        console.log('Flashing: '+this.id)
        if(timeout){
            this.flash=true
            let flashTimeout = setTimeout(()=>{
                this.flash=false
                this.updateSignal()
            },timeout)

        }else{
            this.flash=true
        }
        this.updateSignal();
    }

    clearFlash(){
        this.flash=false
        this.updateSignal()
    }

    returnRouteTo(id){
        return this.routes.find(e=>e.targetSignalId === id);
    }


}

module.exports = Signal;