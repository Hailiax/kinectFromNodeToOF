// const app = require('express')();
// const http = require('http').Server(app);
// const io = require('socket.io')(http);
const Kinect2 = require('kinect2');

const io = require('socket.io-client');
const addr = "http://localhost:3000";
const socket = io(addr);

let kinect;

let RAWWIDTH = 512;
let RAWHEIGHT = 424;

let busy = false;

let sendAllBodies = false;
let rawDepth = false;

let bodyCount = 0;
let bodyNumMax = 2;

let jointCoords = [];
let depthData = [];
let colorData = [];
let bodyFrame = [];

let newBody = [];

function init() {
    //console.log('here');
    kinect = new Kinect2();

    console.log("kinect initialized");
    startSkeletonTracking();
}

init();

socket.on('connect', function (socket) {
    console.log('user connected');
});

function startSkeletonTracking() {
    console.log('Starting skeleton tracking');
    //rawDepth = true;

    if (kinect.open()) {
        console.log('Kinect device is open');

        kinect.on('multiSourceFrame', function (frame) {

            if (busy) {
                return;
            }
            busy = true;

            //length = 434176
            depthData = frame.rawDepth.buffer;
            //length = 868352
            colorData = frame.depthColor.buffer;

            bodyFrame = frame.body.bodies;

            let index = 0;
            newBody = [];

            if (bodyFrame.length > 0) {
                //console.log("there is body");
                bodyFrame.forEach(function (body) {
                    if (body.tracked) {

                        if (newBody.length < bodyNumMax) {

                            //console.log((new Date()) + ' body tracked!!');
                            // console.log((new Date()) + " body available: " + bodyAvailable);

                            //jointCoords = calcJointCoords(body.joints);

                            jointCoords = cleanJointCoords(body.joints, depthData);

                            if (!sendAllBodies) {

                                //hand right
                                
                                newBody.push({
                                    "x": jointCoords[11].x,
                                    "y": jointCoords[11].y,
                                    "z": jointCoords[11].z
                                })

                                //console.log(newBody);

                                /* getDataForJSON(jointCoords, depthData, colorData);

                                let h = (new Date()).getHours();
                                let m = (new Date()).getMinutes();
                                let s = (new Date()).getSeconds();

                                newBody.push({
                                    "sid": socket.id,
                                    "time": h + "-" + m + "-" + s,
                                    "bodyIndex": body.bodyIndex,
                                    "trackingId": body.trackingId,
                                    "leftHandState": body.leftHandState,
                                    "rightHandState": body.rightHandState,
                                    "joints": jointCoords
                                });
                                */
                            }
                            index++;

                        }

                    }
                });

                if (bodyCount != index) {
                    bodyCount = index;

                    //console.log("Total number of bodies detected: " + bodyCount);
                }

                if (newBody != null) {
                    if (bodyCount > 0) {
                        console.log(newBody[0]);

                        socket.emit('message', newBody[0]);
                    }
                }
            }

            busy = false;
        });
        kinect.openMultiSourceReader({
            frameTypes: Kinect2.FrameType.rawDepth | Kinect2.FrameType.depthColor | Kinect2.FrameType.body
        });
    } else {
        console.log('kinect is closed');
    }
}

function stopSkeletonTracking() {
    console.log('stopping skeleton');
    // kinect.closeBodyReader();
    kinect.removeAllListeners();

    //kinect.closeRawDepthReader();
    rawDepth = false;
    busy = false;
}

function cleanJointCoords(joints, depths) {
    let jointCoords = [];

    for (let i = 0; i < joints.length - 4; i++) {
        let xpos = parseFloat(joints[i].depthX.toFixed(5));
        let ypos = parseFloat(joints[i].depthY.toFixed(5));

        let jointX = Math.floor(joints[i].depthX * RAWWIDTH);
        let jointY = Math.floor(joints[i].depthY * RAWHEIGHT);

        let zIndex = 2 * (jointY * RAWWIDTH + jointX);
        let zpos = parseFloat(map(depths[zIndex] + depths[zIndex + 1] * 255, 0, 4499, 0, 1).toFixed(5));
       // let zpos = depths[zIndex] + depths[zIndex + 1] * 255;

        if (xpos < 0) {
            xpos = 0;
        }

        if (xpos > 1) {
            xpos = 1;
        }

        if (ypos < 0) {
            ypos = 0;
        }

        if (ypos > 1) {
            ypos = 1;
        }
        jointCoords.push({ "x": xpos, "y": ypos, "z": zpos });
    }

    return jointCoords;
}

function calcJointCoords(joints) {
    let jointCoords = [];

    for (let i = 0; i < joints.length - 4; i++) {
        let xpos = Math.floor(joints[i].depthX * RAWWIDTH);
        let ypos = Math.floor(joints[i].depthY * RAWHEIGHT);
        jointCoords.push({ "x": xpos, "y": ypos });
    }

    return jointCoords;
}

function getDataForJSON(jointCoords, depths, colors) {
    for (let i = 0; i < jointCoords.length; i++) {

        let pArray = [];

        let jointX = jointCoords[i].x;
        let jointY = jointCoords[i].y;

        let zIndex = 2 * (jointY * RAWWIDTH + jointX);
        let jointZ = Math.round(map(depths[zIndex] + depths[zIndex + 1] * 255, 0, 4499, -500, 500));
        jointCoords[i].z = jointZ;

        if (jointY < 424 && jointX < 512 && jointX > 0 && jointY > 0) {
            let pnum = 30;
            let dist;

            if (i == 1) {
                dist = 60;
                pnum = 50;
            } else if (i == 3 || i == 14 || i == 18) {
                dist = 30;
            } else if (i == 2) {
                dist = 10;
                pnum = 10;
            } else if (i == 15 || i == 19) {
                dist = 15;
                pnum = 10;
            } else if (i == 12 || i == 16) {
                dist = 50;
            } else if (i == 13 || i == 17) {
                dist = 60;
                pnum = 40;
            } else {
                dist = 40;
            }

            while (pArray.length < pnum) {
                let x = jointX + Math.floor(Math.random() * dist * 2) - dist;
                let y = jointY + Math.floor(Math.random() * dist * 2) - dist;
                let index = 2 * (y * RAWWIDTH + x);

                while (index < 0 || index > 2 * 512 * 424) {
                    x = jointX + Math.floor(Math.random() * dist * 2) - dist;
                    y = jointY + Math.floor(Math.random() * dist * 2) - dist;
                    index = 2 * (y * RAWWIDTH + x);
                }

                let z = Math.round(map(depths[index] + depths[index + 1] * 255, 0, 4499, -500, 500));

                if ((jointX - x) * (jointX - x) + (jointY - y) * (jointY - y) + (jointZ - z) * (jointZ - z) < dist * dist) {
                    // let mappedX = Math.round(map(x, 0, RAWWIDTH - 1, 0, COLWIDTH - 1));
                    // let mappedY = Math.round(map(y, 0, RAWHEIGHT - 1, 0, COLHEIGHT - 1));
                    let cIndex = 4 * (y * RAWWIDTH + x);

                    let rVal = ("0" + Math.round(map(colors[cIndex], 0, 255, 0, 99))).slice(-2);
                    let gVal = ("0" + Math.round(map(colors[cIndex + 1], 0, 255, 0, 99))).slice(-2);
                    let bVal = ("0" + Math.round(map(colors[cIndex + 2], 0, 255, 0, 99))).slice(-2);

                    // let r = ("0" + colors[index]).slice(-3);
                    // let g = ("0" + colors[index + 1]).slice(-3);
                    // let b = ("0" + colors[index + 2]).slice(-3);

                    let c = rVal + gVal + bVal;

                    //"rawC": [colors[cIndex], colors[cIndex + 1], colors[cIndex + 2]],
                    pArray.push({ "x": x, "y": y, "z": z, "c": c });
                }
            }

            jointCoords[i].px = pArray;
        }

    }
}

function map(num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

