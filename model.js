import {HumanWalkingPattern} from './HumanWalkingPattern.js';

//read json './IMU_schedule.json'&'./IMU_data.json' synchronously via keywords "await"
let response = await fetch('./IMU_schedule.json');
const IMU_schedule_json = await response.json();
response = await fetch('./IMU_data.json');
const IMU_data_json = await response.json();


//create web worker for rest async works
let worker;
if (typeof (Worker) !== "undefined") {
    worker = new Worker('./fetch_data.js');
} else {
    console.log("ERROR: browser does not support Web Worker！");
}

//create DigitalTwin via the json
let humanWalkingPattern = new HumanWalkingPattern(IMU_schedule_json["IMU_schedule"],
    IMU_data_json["IMU_data"]);
let k = 0;

console.log("start_animate():");

//run the animation
async function start_animate() {

    requestAnimationFrame(start_animate);

    if (k === 0) {
        worker.postMessage("load");
    }

    if (k >= 100) {
        k = 0;
    } else {
        k += 0.1;
        console.log("\trendering frame");
        humanWalkingPattern.mesh_update();
    }

    humanWalkingPattern.renderer.render(humanWalkingPattern.scene,
        humanWalkingPattern.camera);
}

start_animate().then(() => null);


worker.onmessage = function (event) {
    console.log(event.data);
}
    
