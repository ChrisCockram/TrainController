const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline')

class LayoutInterface{
    constructor(Railway,port,baudRate) {
        this.Railway = Railway
        this.portName=port
        this.port = new SerialPort({
            path: port,
            baudRate: baudRate,
        })
        this.port.on("open", () => {
            console.log('serial port open');
        })
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }))
        this.parser.on('data', (data)=>{this.processInterfaceData(data)})
        this.messageQueue=[]
        this.processMessageQueue()
    }

    processInterfaceData(data){
        try {
            data = JSON.parse(data)
            this.Railway.updateLayoutFromInterface(data)
        }
        catch(err) {
            updateLog("Unable to parse data from interface: "+this.portName,"error")
            updateLog(data)
        }
    }

    sendPointPosition(servo_board,servo_address,position){
        position=position+1;
        let message = {"type":1,"board":servo_board,"address":servo_address,"status":position}
        this.messageQueue.push(message)
    }

    sendSignalStatus(signal_board,signal_address,aspect){
        let message = {"type":2,"board":signal_board,"address":signal_address,"status":aspect}
        this.messageQueue.push(message)
    }

    processMessageQueue(){
        setInterval(()=>{
            if(this.messageQueue.length>0){
                this.port.write(JSON.stringify(this.messageQueue.shift()));
            }
        },200)
    }

}

module.exports = LayoutInterface;