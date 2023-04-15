const fs = require("fs");

class Ars{
    constructor(Railway,timeTable) {
        this.Railway = Railway
        this.timetable = timeTable||[]
    }

    validateTimeTable(){
        updateLog('Validating timetable: '+this.timetable.timetableName)
        this.timetable.trips.forEach((trip)=>{
            this.validateTrip(trip)
        })
    }

    validateTrip(trip){
        let currentSig=false
        trip.route.forEach((sig)=>{
            if(!currentSig){
                //is the starting sig valid?
                currentSig=this.Railway.returnSignalById(sig.signal);
                if(!currentSig){
                    updateLog("Error validating timetable trip: "+trip.headcode+" - Signal "+sig.signal+" not recognised","error")
                    return false;
                }
            }
            else{
                //is the next sig a route from the current one.
                if(!currentSig.returnRouteTo(sig.signal)){
                    updateLog("Error validating timetable trip: "+trip.headcode+" - There is no roue between "+currentSig.id+" and "+sig.signal,"error")
                    return false;

                }
                currentSig=this.Railway.returnSignalById(sig.signal);
                if(!currentSig){
                    updateLog("Error validating timetable trip: "+trip.headcode+" - Signal "+sig.signal+" not recognised","error")
                    return false;
                }
            }
        })
    }

    loadTimetable(path){
        updateLog('Loading timetable: '+path)
        this.timetable=JSON.parse(fs.readFileSync(path))
        this.validateTimeTable();
    }

    checkRoute(signal,headcode){
        if(headcode==''){
            return false;
        }
        //is the headcode recognised?
        let trip = this.getTripByHeadcode(headcode)
        if(!trip){
            updateLog("ARS: "+headcode+" not in timetable.","error")
            return false;
        }




        for (let i = 0; i < trip.route.length; i++) {
            console.log(trip.route[i].signal,signal.id);
            if(trip.route[i].signal==signal.id){

                let j=1;

                //TODO Timebased logic here!

                //Try and clear enough route to have a green signal here.

                let routeToSet = signal.returnRouteTo(trip.route[i+j].signal)
                if(!routeToSet){
                    updateLog("ARS: "+headcode+" at "+signal.id+" invalid route to "+trip.route[i+j].signal,"error")
                    return false;
                }
                if(signal.setRoute(routeToSet)){
                    console.log('route all good');
                    let routeSetLoop = setInterval(()=>{
                        console.log('trying route')

                        if(signal.status<3 && j<4){

                            let nextSignal = this.Railway.returnSignalById(trip.route[i+j].signal)
                            if(nextSignal){
                                j++

                                if(typeof trip.route[i+j]==='undefined'){
                                    clearInterval(routeSetLoop)
                                    return false
                                }

                                //Is there a route set from the next signal?
                                if(nextSignal.routeSet){
                                    if(nextSignal.routeSet.targetSignalId != trip.route[i+j].signal){

                                        console.log(nextSignal.routeSet.targetSignalId,trip.route[i+j].signal)
                                        updateLog("ARS: Route already set from "+nextSignal.id+" to a signal not valid for "+headcode,"error")
                                        clearInterval(routeSetLoop)
                                        return false
                                    }
                                }


                                console.log(trip.route[i+j])
                                routeToSet = nextSignal.returnRouteTo(trip.route[i+j].signal)
                                if(!nextSignal.setRoute(routeToSet)){
                                    clearInterval(routeSetLoop)
                                    return false
                                }
                            }else{
                                clearInterval(routeSetLoop)
                                return false

                            }
                        }else{
                            clearInterval(routeSetLoop)
                            return false
                        }
                    },1500)


                }

                return true
            }
        }
        updateLog("ARS: "+headcode+" at "+signal.id+" off booked path.","error")
        return false;
        // console.log('TRIP')
        // console.log(trip)
        // console.log(signal)
        // console.log(headcode)
    }

    getTripByHeadcode(headcode){
        return this.timetable.trips.find(e=>e.headcode === headcode);
    }

}
module.exports = Ars;