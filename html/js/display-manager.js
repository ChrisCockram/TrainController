const {ipcRenderer} = require('electron')


ipcRenderer.on('draw',(event,message)=>{
    draw(message);
})

ipcRenderer.on('updateSignal',(event,message)=>{
    updateSignal(message);
})

ipcRenderer.on('updateTrack',(event,message)=>{
    updateTrack(message);
})

ipcRenderer.on('updateLog',(event,message)=>{
    updateLog(message);
})

ipcRenderer.on('interposePopup',(event,message)=>{
    interposePopup(message);
})

function draw(item){
    //Expects an object
    //{
    //  "layer":"Signal",
    //  "detail":"SVG DETAIL HERE"
    // }
    switch (item.layer){
        case "track":
            drawTrack(item)
            break
        case "signal":
            drawSignal(item)
            break
    }
}

function drawTrack(item){
    let display = document.getElementById('display-track')
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    let svgNS = svg.namespaceURI;

    svg.setAttribute('x',item.detail.x)
    svg.setAttribute('y',item.detail.y)
    svg.setAttribute('width',item.detail.width)
    let main = document.createElementNS(svgNS,'rect')
    main.classList.add('main')

    let left = document.createElementNS(svgNS,'rect')
    left.classList.add('left')
    svg.appendChild(left)

    let right = document.createElementNS(svgNS,'rect')
    right.classList.add('right')
    svg.appendChild(right)

    let tcid = document.createElementNS(svgNS,'text')
    tcid.textContent=item.detail.id;
    tcid.setAttribute("x","50%")
    tcid.setAttribute("y","60")
    tcid.classList.add('track-id')

    let route = document.createElementNS(svgNS,'path')
    route.classList.add('route')

    let deviation = document.createElementNS(svgNS,'path')
    deviation.classList.add('deviation')

    svg.id=item.detail.id
    svg.classList.add('track')

    switch (item.detail.overlap){
        case "left":
            svg.classList.add('track-left')
            break
        case "right":
            svg.classList.add('track-right')
            break
    }

    if(item.detail.points){
        svg.classList.add('points-'+item.detail.points)
        svg.appendChild(deviation)
        svg.appendChild(route)
        if(item.detail.points.includes("bottom")){
            tcid.setAttribute("y","35")
        }
    }else{
        svg.appendChild(main)
    }


    if(item.detail.berth){
        let berthg = document.createElementNS(svgNS,'g')
        berthg.classList.add('berth')
        berthg.appendChild(document.createElementNS(svgNS,'rect'))
        let bertht = document.createElementNS(svgNS,'text')
        bertht.classList.add('headcode')
        bertht.textContent=item.detail.headcode
        bertht.setAttribute('x','50%')
        berthg.appendChild(bertht);
        svg.appendChild(berthg)
    }
    svg.appendChild(tcid)

    svg.setAttribute("oncontextmenu","javascript:loadTrackContextMenu('"+item.detail.id+"');return false;")

    display.appendChild(svg);
}

function drawSignal(item){
    let display = document.getElementById('display-signals')
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    let svgNS = svg.namespaceURI;

    let reminder = document.createElementNS(svgNS,'rect')
    reminder.classList.add('reminder-appliance')
    svg.appendChild(reminder)

    let stork = document.createElementNS(svgNS,'rect')
    stork.classList.add('stork')
    svg.appendChild(stork)

    let stem = document.createElementNS(svgNS,'rect')
    stem.classList.add('stem')
    svg.appendChild(stem)

    let head = document.createElementNS(svgNS,'circle')
    head.classList.add('head')

    let secondHead = document.createElementNS(svgNS,'circle')
    secondHead.classList.add('second-head')

    let gpl = document.createElementNS(svgNS,'path')
    gpl.classList.add('gpl')
    gpl.classList.add('head')

    let name = document.createElementNS(svgNS,'text')
    name.textContent=item.detail.id
    name.classList.add('signal-id')
    svg.appendChild(name)

    if(item.detail.gpl){
        svg.appendChild(gpl)
    }else{
        svg.appendChild(head)
        svg.appendChild(secondHead)
    }

    svg.id = item.detail.id
    svg.setAttribute('x',item.detail.x)
    svg.setAttribute('y',item.detail.y)
    svg.classList.add('signal')
    svg.classList.add('signal-'+item.detail.position)



    switch (item.detail.status){
        case 0:
            svg.classList.add('red')
            break
        case 1:
            svg.classList.add('yellow')
            break
        case 2:
            svg.classList.add('double-yellow')
            break
        case 3:
            svg.classList.add('green')
            break
        default:
            svg.classList.add('red')
            break
    }

    svg.setAttribute("oncontextmenu","javascript:loadSignalContextMenu('"+item.detail.id+"');return false;")

    svg.setAttribute("onclick","javascript:clickSignal('"+item.detail.id+"');")


    display.appendChild(svg);


}

function updateSignal(item){
    let signal = document.getElementById(item.id);
    rmClassList=['red','green','yellow','double-yellow','permissive','reminder','flash']
    signal.classList.remove(...rmClassList);

    if(item.reminder){
        signal.classList.add('reminder');
    }

    if(item.flash){
        signal.classList.add('flash');
    }

    switch (item.status){
        case 0:
            signal.classList.add('red')
            break
        case 1:
            signal.classList.add('yellow')
            break
        case 2:
            signal.classList.add('double-yellow')
            break
        case 3:
            signal.classList.add('green')
            break
        default:
            signal.classList.add('red')
            break
    }
}

function updateTrack(item){
    let track = document.getElementById(item.id);
    rmClassList=['track-occupied','track-route-set','reminder','switched','display-berth']
    track.classList.remove(...rmClassList);

    if(item.berth){
        track.getElementsByClassName('headcode')[0].textContent=item.headcode
        if(item.headcode!=''){
            track.classList.add('display-berth');
        }
    }

    if(item.pointsPosition===1){
        track.classList.add('switched');
    }
    if(item.routeSet){
        track.classList.add('track-route-set');
    }
    if(item.occupied){
        track.classList.add('track-occupied');
    }
}

function loadSignalContextMenu(id){
    ipcRenderer.send('loadSignalContextMenu',id);
}

function loadTrackContextMenu(id){
    ipcRenderer.send('loadTrackContextMenu',id);
}

function clickSignal(id){
    ipcRenderer.send('clickSignal',id);
}

function interposePopup(args){
    let modal = document.getElementById('headcodeInput')
    modal.style.left=args.x+'px'
    modal.style.top=args.y+'px'
    modal.style.display='block'
}

//TODO This interpose function is not working
function interpose(){
    let headcode = document.getElementById('headcodeInputValue').value()
    alert(headcode);
    return false
}

function updateLog(message){
    console.log(message)
    let consoleLog = document.getElementById('consoleLog')
    let li = document.createElement('li')
    let p = document.createElement('p')
    p.innerHTML=message.message
    li.appendChild(p)
    switch (message.type){
        case "action":
            li.classList.add('action')
            break
        case "error":
            li.classList.add('logError')
            break
    }
    consoleLog.prepend(li);
}