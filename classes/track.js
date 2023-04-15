//Point position
//0 = Normal
//1 = Reverse

class Track{
    constructor(Railway,t) {
        this.Railway=Railway
        this.id=t.id
        this.x=t.x
        this.y=t.y
        this.width=t.width||100
        this.overlap=t.overlap||false
        this.berth=t.berth||false
        this.headcode=''
        this.trackType = t.trackType||false
        this.points=t.points||false
        this.pointsPosition=0
        this.pointsDetected=true
        this.status=false
        this.routeSet=false
        this.flankProtect=false
        this.occupied=false
        this.engineeringOverlay=false
        this.pointsServoBoard=t.pointsServoBoard||false
        this.pointsServoAddress=t.pointsServoAddress||false
        this.draw()
    }

    draw(){
        let layer = "track";
        const { Railway, ...rest } = this;
        win.webContents.send('draw',{
            layer,
            detail:rest
        })
    }

    updateTrack(){
        const { Railway, ...rest } = this;
        win.webContents.send('updateTrack',rest)
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
        if(this.occupied){
            updateLog("Unable to swing points "+this.id+" due to being occupied")
            return false
        }
        if(this.pointsServoAddress){
            this.Railway.interface.sendPointPosition(this.pointsServoBoard,this.pointsServoAddress,pointsPosition)
        }else {
            this.fakePointsSwing()//This function adds delay to simulate points being swung
        }
        this.pointsPosition=pointsPosition
        this.updateTrack()


    }

    togglePointPosition(){
        if(this.pointsPosition===0){
            console.log('SET POS',1)
            this.setPointPosition(1)
        }else {
            console.log('SET POS',0)

            this.setPointPosition(0)
        }
    }

    interpose(headcode){
        this.headcode=headcode
        updateLog('Interpose headcode: '+headcode+' at track '+this.id)
        this.updateTrack()
    }

    setTrackOccupancy(occupied){
        if(occupied!=this.occupied){
            updateLog('Occupancy of track '+this.id+' changed to: '+occupied)
            this.occupied=occupied;
            this.updateTrack()
        }
    }

    toggleEngineeringOverlay(){
        if(this.engineeringOverlay){
            this.engineeringOverlay=false
        }else{
            this.engineeringOverlay=true
        }
        this.updateTrack()
    }

    fakePointsSwing(){
        this.pointsDetected=false;
        let delay = Math.floor(Math.random() * (5000 - 1000 + 1) + 3000)
        setTimeout(()=>{
            this.pointsDetected=true
            this.updateTrack();
        },delay)
    }

}



module.exports = Track;