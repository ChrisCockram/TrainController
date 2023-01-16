//Point position
//0 = Normal
//1 = Reverse

class Track{
    constructor(t) {
        this.id=t.id
        this.x=t.x
        this.y=t.y
        this.width=t.width||100
        this.overlap=t.overlap||false
        this.berth=t.berth||false
        this.headcode=''
        this.points=t.points||false
        this.pointsPosition = 0
        this.status=false
        this.routeSet=false
        this.flankProtect = false
        this.occupied=false
        this.draw()
    }

    draw(){
        let layer = "track";
        let detail = this
        win.webContents.send('draw',{
            layer,
            detail
        })
    }

    updateTrack(){
        win.webContents.send('updateTrack',this)
    }

    setPointPosition(pointsPosition){

        if(pointsPosition===this.pointsPosition){
            return true
        }

        if(this.routeSet){
            updateLog("Unable to swing points "+this.id+" due to route being locked")
            return false
        }
        if(this.flankProtect){
            updateLog("Unable to swing points "+this.id+" due to being used for flank protection")
            return false
        }
        this.pointsPosition=pointsPosition
        this.updateTrack()
    }

    togglePointPosition(){
        if(this.pointsPosition===0){
            this.setPointPosition(1)
        }else {
            this.setPointPosition(0)
        }
    }

    interpose(headcode){
        this.headcode=headcode
        updateLog('Interpose headcode: '+headcode+' at track '+this.id)
        this.updateTrack()
    }
}



module.exports = Track;