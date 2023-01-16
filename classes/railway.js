const signal = require('./signal.js')
const track = require('./track.js')
const fs = require('fs')
const electron = require("electron");
const {ipcMain} = electron

class Railway{

    constructor(r) {
        this.name = 'testRail',
        this.author = 'testAuthor',
        this.layout = {'tracks':[],'signals':[]}
    }

    loadFile(path){
        let json = JSON.parse(fs.readFileSync(path))
        json.tracks.forEach((t)=>{
            this.layout.tracks.push(new track(t))
        })
        json.signals.forEach((s)=>{
            this.layout.signals.push(new signal(s))
        })
    }

    returnSignalById(id){
        return this.layout.signals.find(e=>e.id === id);
    }

    returnTrackById(id){
        return this.layout.tracks.find(e=>e.id === id);
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

    setRoute(signalId,routeDetails){
        let sig = this.returnSignalById(signalId)
        let targetSig = this.returnSignalById(routeDetails.targetSignalId)

        updateLog('Request to set Route from '+sig.id+' to '+targetSig.id,'action')

        if(sig.routeSet){
            updateLog('There is already a route set from '+sig.id,)
            return false
        }

        if(sig.reminder){
            updateLog('Reminder appliance on '+sig.id)
            return false
        }

        if(targetSig.reminder){
            updateLog('Reminder appliance on '+targetSig.id)
            return false
        }

        sig.routeSet=routeDetails

        //Check route is available
        let routeAvailable = true
        routeDetails.required.forEach((rd)=>{
            let tc = this.returnTrackById(rd.id)

            if(tc.routeSet){
                //Is the route set for a flank protected route?
                if(!rd.flankProtect){

                    //is the route set the overlap of the starting or target signal?
                    if(tc.id!=sig.overlap && tc.id!=targetSig.overlap){
                        updateLog('Route already set over track '+tc.id)
                        routeAvailable=false;
                    }
                }
            }
            if(tc.points){
                if(tc.flankProtect){
                    if(tc.pointsPosition != rd.position){
                        updateLog('Route requires '+tc.id+' to be switched, but these are locked for flank protection')
                        routeAvailable=false;
                    }
                }
            }
        })

        if(!routeAvailable){
            updateLog('Route from '+sig.id+' to '+targetSig.id+' not available')
            sig.routeSet=false
            return false
        }


        routeDetails.required.forEach((rd)=>{
            let tc = this.returnTrackById(rd.id)
            let validPositions = [0,1]
            if(tc.points){
                if(validPositions.includes(rd.position)){
                    tc.setPointPosition(rd.position)
                }else{
                    updateLog('Point position not set correctly','error')
                    sig.routeSet=false
                    return false
                }
            }
            if(rd.flankProtect){
                tc.flankProtect=true
            }else{
                tc.routeSet=true
            }
            tc.updateTrack()
        })
    }

    cancelRoute(signalId){
        let sig = this.returnSignalById(signalId)

        updateLog('Request to cancel route from '+sig.id,'action')

        if(!sig.routeSet){
            updateLog('No route set from '+signalId)
            return false
        }
        sig.routeSet.required.forEach((rd)=>{
            let tc = this.returnTrackById(rd.id)
            if(rd.flankProtect){
                tc.flankProtect=false
            }else{
                tc.routeSet=false
            }
            tc.updateTrack()
        })
        sig.routeSet=false;
    }
}

module.exports = Railway;