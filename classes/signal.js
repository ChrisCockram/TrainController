//signal status
// 0 = RED
// 1 = YELLOW
// 2 = DOUBLE YELLOW
// 3 = GREEN
// 4 = PERMISSIVE

class Signal{
    constructor(Railway,s) {
        this.Railway = Railway
        this.id=s.id
        this.x=s.x
        this.y=s.y
        this.position = s.position
        this.gpl=s.gpl||false
        this.exitMarker=s.exitMarker||false
        this.aspects=s.aspects||4
        this.status = 0
        this.reminder = false
        this.flash = false
        this.routes = s.routes||[]
        this.routeSet = false
        this.routeSetFrom = false
        this.overlap = s.overlap||false
        this.berth = s.berth||false
        this.signal_board = s.signal_board||false
        this.signal_address = s.signal_address||false
        this.draw()
    }

    draw(){
        let layer = "signal";
        const { Railway, ...rest } = this;
        win.webContents.send('draw',{
            layer,
            detail:rest
        })
    }

    updateSignal(){
        const { Railway, ...rest } = this;
        win.webContents.send('updateSignal',rest)
    }

    setAspect(status){
        if(status!=this.status){
            if(status===0){
                updateLog('Signal '+this.id+' set to danger')
            }else{
                updateLog('Signal '+this.id+' cleared ('+status+')')
            }
            this.status=status;
            if(this.Railway.interface && this.signal_board && this.signal_address){
                console.log("SEND SIGNAL STATUS",this.signal_board,this.signal_address)
                this.Railway.interface.sendSignalStatus(this.signal_board,this.signal_address,this.status)
            }
            this.updateSignal()
        }
    }

    toggleReminder(){
        console.log('Toggle'+this.id)
        this.reminder = this.reminder != true
        console.log(this)
        this.updateSignal()
    }

    setFlash(timeout=false){
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

    setRoute(routeDetails){
        let targetSig = this.Railway.returnSignalById(routeDetails.targetSignalId)

        updateLog('Request to set Route from '+this.id+' to '+targetSig.id,'action')


        if(this.routeSet.targetSignalId == routeDetails.targetSignalId){
            return true;
        }

        if(this.routeSet){
            updateLog('There is already a route set from '+this.id,)
            return false
        }

        if(this.reminder){
            updateLog('Reminder appliance on '+this.id)
            return false
        }

        if(targetSig.reminder){
            updateLog('Reminder appliance on '+targetSig.id)
            return false
        }

        this.routeSet=routeDetails
        targetSig.routeSetFrom=this.id

        //Check route is available
        let routeAvailable = true
        routeDetails.required.forEach((rd)=>{
            let tc = this.Railway.returnTrackById(rd.id)

            if(tc.routeSet){
                //Is the route set for a flank protected route?
                if(!rd.flankProtect){

                    //is the route set the overlap of the starting or target signal?
                    if(tc.id!=this.overlap && tc.id!=targetSig.overlap){
                        updateLog('Route already set over track '+tc.id)
                        routeAvailable=false;
                    }else{
                        if(!targetSig.routeSet && !targetSig.routeSetFrom){
                            //TODO There's a logic bug here.
                            updateLog('Route already set in the overlap ('+targetSig.overlap+') of the target signal ('+targetSig.id+') which is not a forward route')
                            routeAvailable=false;
                        }
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
            updateLog('Route from '+this.id+' to '+targetSig.id+' not available')
            this.routeSet=false
            targetSig.routeSetFrom=false
            return false
        }


        routeDetails.required.forEach((rd)=>{
            let tc = this.Railway.returnTrackById(rd.id)
            let validPositions = [0,1]
            if(tc.points){
                if(validPositions.includes(rd.position)){
                    tc.setPointPosition(rd.position)
                }else{
                    updateLog('Point position not set correctly','error')
                    this.routeSet=false
                    targetSig.routeSetFrom=false
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
        return true
    }

    cancelRoute(){

        updateLog('Request to cancel route from '+this.id,'action')

        if(!this.routeSet){
            updateLog('No route set from '+this.id)
            return false
        }
        this.setAspect(0)

        let tcExclude=[];
        //Is there a route set from the target signal? If so do not clear the overlap of the target
        let targetSig = this.Railway.returnSignalById(this.routeSet.targetSignalId)
        if(targetSig.routeSet){
            tcExclude.push(targetSig.overlap)
        }
        //is there a route set to this signal? If so do not clear the overlap of this signal.
        if(this.routeSetFrom){
            tcExclude.push(this.overlap)
        }


        this.routeSet.required.forEach((rd)=>{
            if(!tcExclude.includes(rd.id)){
                let tc = this.Railway.returnTrackById(rd.id)
                if(rd.flankProtect){
                    tc.flankProtect=false
                }else{
                    tc.routeSet=false
                }
                tc.updateTrack()
            }
        })
        this.routeSet=false
        targetSig.routeSetFrom=false
    }

    interpose(headcode){
        let berth = this.Railway.returnTrackById(this.berth)
        if(berth){
            berth.interpose(headcode);
        }
        this.Railway.ars.checkRoute(this,headcode)
    }

}

module.exports = Signal;