const signal = require('./signal.js')
const track = require('./track.js')
const ars = require('./ars.js')
const layoutInterface = require('./interface.js')
const fs = require('fs')
const electron = require("electron");
const {ipcMain} = electron


class Railway{

    constructor(r) {
        this.name = 'testRail'
        this.author = 'testAuthor'
        this.detectionEnable = true
        this.layout = {'tracks':[],'signals':[]}
        this.signalStatusCheck()
        this.ars=new ars(this)
        this.interface = new layoutInterface(this,'COM5',115200)
    }

    loadFile(path){
        let json = JSON.parse(fs.readFileSync(path))
        let i=0;
        json.tracks.forEach((t)=>{
            this.layout.tracks.push(new track(this,t,this.interface))
        })
        json.signals.forEach((s)=>{
            this.layout.signals.push(new signal(this,s))
        })
    }

    returnSignalById(id){
        return this.layout.signals.find(e=>e.id === id);
    }

    returnSignalWithOverlapAndRouteSet(id){
        return this.layout.signals.filter(element => {
            return element.overlap === id && element.routeSet;
        })[0]
    }

    returnSignalWithRequiredTcAndRouteSet(id){
        return this.layout.signals.filter(element => {
            if(typeof element.routeSet.required === 'object'){
                return element.routeSet.required.some(e => e.id === id) && element.routeSet;
            }
        })[0]
    }

    returnTrackById(id){
        return this.layout.tracks.find(e=>e.id === id);
    }

    returnTrackByPointsServoAddress(board,id){
        return this.layout.tracks.filter(element => {
            return element.pointsServoAddress === id.toString() && element.pointsServoBoard === board.toString();
        })[0]
    }

    flashSignal(id,timeout=false){
        this.returnSignalById(id).setFlash(timeout)
    }

    clearFlashSignal(id){
        this.returnSignalById(id).clearFlash()
    }

    clearAllFlashes(){
        this.layout.signals.forEach((sig)=>{
            sig.clearFlash()
        })
    }

    signalStatusCheck(){
        setInterval(()=>{
            this.layout.signals.forEach((sig)=>{
               if(sig.routeSet) {
                   //Check TCs are clear and the route is set
                   let clearSignal=true;
                   sig.routeSet.required.forEach((tc)=>{
                       let track = this.returnTrackById(tc.id)

                       if(track.occupied && !tc.flankProtect){
                           clearSignal=false
                       }
                       if(!track.routeSet && !tc.flankProtect){
                           clearSignal=false
                       }
                       if(track.points){
                           if(track.pointsPosition!=tc.position){
                               clearSignal=false
                           }
                           if(!track.pointsDetected){
                               clearSignal=false
                           }
                       }
                   })

                   if(!clearSignal){
                       sig.setAspect(0);

                   }else{
                       let targetSig = this.returnSignalById(sig.routeSet.targetSignalId)
                       switch(targetSig.status){
                           case 0:
                               if (sig.aspects===2){
                                   sig.setAspect(3)
                               }else{
                                   sig.setAspect(1)
                               }
                               break
                           case 1:
                               if (sig.aspects===2 || sig.aspects===3){
                                   sig.setAspect(3)
                               }else{
                                   sig.setAspect(2)
                               }
                               break
                           case 2:
                               sig.setAspect(3)
                               break
                           case 3:
                               sig.setAspect(3)
                               break
                       }
                   }

               }
            });
        },500)
    }

    updateLayoutFromInterface(data){
        data.tracks.forEach((trk)=>{
            let tc = this.returnTrackById(trk.track_id)
            if(tc){
                if(tc.occupied!=trk.occupied){
                    tc.setTrackOccupancy(trk.occupied)
                    tc.updateTrack()

                    //TODO ADD SPAD DETECTION HERE
                }
            }
        })
        data.points.forEach((pts)=>{
            let tc = this.returnTrackByPointsServoAddress(pts.servo_board,pts.servo_address)
            if(tc){
                if(pts.detected_position===pts.position && pts.position === pts.target_position){
                    tc.pointsDetected=true;
                    tc.updateTrack();
                }else{
                    tc.pointsDetected=false;
                    tc.updateTrack();
                }

                //lower pts reference to logic used here
                pts.position = pts.position -1
                pts.target_position = pts.target_position - 1

                if(tc.pointsPosition != pts.target_position){
                    tc.pointsPosition = pts.target_position
                    tc.updateTrack();
                }
            }
        })
    }

}

module.exports = Railway;