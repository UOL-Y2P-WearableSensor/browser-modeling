import {DigitalTwin} from './DigitalTwin.js';

export class HumanWalkingPattern extends DigitalTwin {

    constructor(IMU_schedule, IMU_data) {
        super(IMU_schedule);
        this.#meshes_init();
        this.#scene_graph_init();
        this.#load_axesHelpers();
        this.IMU_data = IMU_data;

    }

    /**
     * Define the geometry of meshes based on IMU_schedule.json
     * the material still be default "MeshPhongMaterial({color: "rgb(255, 100, 0)"})"
     */
    #meshes_init() {
        //initialize the origin point.
        this.#origin_init();

        //initialize joints&knots
        this.#joints_init();
        this.#knots_init();
    }

    #origin_init() {
        let material = new THREE.MeshPhongMaterial({color: "rgb(255, 100, 0)"});
        let geometry = new THREE.SphereGeometry(1, 32, 16);
        this.mesh_origin = new THREE.Mesh(geometry, material);
    }

    #joints_init() {
        const material = new THREE.MeshPhongMaterial({color: "rgb(255, 100, 0)"});
        let node, geometry;

        for (let i = 0; i < this.IMU_schedule.length; i++) {
            // console.log(IMU_schedules[i].name);
            node = this.IMU_schedule[i];
            geometry = new THREE.BoxGeometry(node["Width"], node["Length"], node["Height"]);
            geometry.translate(0, node["Length"] / 2, 0);
            this.mesh_joints.push(new THREE.Mesh(geometry, material));
        }
    }

    #knots_init() {
        const material = new THREE.MeshPhongMaterial({color: "rgb(255, 100, 0)"});
        const geometry = new THREE.SphereGeometry(1, 32, 16);
        let joint_length;
        for (let i = 0; i < this.IMU_schedule.length; i++) {
            // console.log(IMU_schedules[i].name);
            joint_length = this.IMU_schedule[i]["Length"];
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, joint_length, 0)
            this.mesh_knots.push(mesh);
        }
    }

    #load_axesHelpers() {
        //for the origin point 
        this.mesh_origin.add(new THREE.AxesHelper(3));

        //for joints
        for (let i = 0; i < this.mesh_joints.length; i++) {
            this.axesHelper_joints.push(new THREE.AxesHelper(2));
            this.mesh_joints[i].add(this.axesHelper_joints[i]);
        }

        //for knots
        for (let i = 0; i < this.mesh_knots.length; i++) {
            this.axesHelper_knots.push(new THREE.AxesHelper(2));
            this.mesh_knots[i].add(this.axesHelper_knots[i]);
        }
    }


    /**
     * Add meshes into the scene graph based on IMU_schedule.json
     * (the parent & child terminals).
     */
    #scene_graph_init() {
        console.log("scene_graph_init():");
        //add the origin point  
        this.scene.add(this.mesh_origin);

        /**
         * logic:
         * input node_child["parent_terminal"] first,
         * then loop all joints to find node_parent whose "child_terminal" matches the node_child["parent_terminal"]
         * where the this.mesh[0] is the zero terminal, "mesh_origin_point"
         * calibrate the binding
         * add a ball on the child terminal
         * At last, this.meshes[node_parent].add(this.meshes[node_child]);
         */

            //the child_terminal is regarded as the index of one node.
        let node_info, node_mesh, parent_knot, child_knot;
        for (let i = 0; i < this.IMU_schedule.length; i++) {
            // console.log(this.IMU_schedule[i]);
            node_info = this.IMU_schedule[i];
            node_mesh = this.mesh_joints[i];

            //find parent_knot
            if (node_info["parent_terminal"] === "0") {
                console.log("\tfind the parent_knot: mesh_origin");
                parent_knot = this.mesh_origin;
            } else {
                //range of idx: 0,1,2,3,4; excluding 5(this.IMU_schedule.length)
                let idx = 0;

                for (; idx < this.IMU_schedule.length; idx++) {
                    if (this.IMU_schedule[idx]["child_terminal"] === node_info["parent_terminal"]) {
                        console.log("\tfind the parent_terminal: ", this.IMU_schedule[idx]["child_terminal"]);
                        console.log("\tparent_knot idx = ", idx);
                        parent_knot = this.mesh_knots[idx];
                        break;
                    }
                }

                if (idx === this.IMU_schedule.length) {
                    console.log("\tfailed to find parent_knot");
                    console.log(this.IMU_schedule[i]);
                    return;
                }

            }

            //add the current joint to the parent_knot(one knot)
            child_knot = this.mesh_knots[i];
            parent_knot.add(node_mesh);
            node_mesh.add(child_knot);

        }

        this.mesh_init();
    }


    angle = 0.24;

    mesh_init() {
        this.mesh_joints[0].rotation.z = 0;
        this.mesh_joints[1].rotation.z = Math.PI - this.angle;
        this.mesh_joints[2].rotation.z = Math.PI + this.angle;
        this.mesh_joints[3].rotation.z = this.angle;
        this.mesh_joints[4].rotation.z = -this.angle;
    }

    _time_idx = 0;
    set time_idx(value) {
        this._time_idx = value;
    }

    scale = 0.5;

    mesh_update() {
        this.#mesh_origin_point_update();       //mesh_origin

        this.#mesh_body_update();               //mesh_joints[0]
        this.#mesh_right_femur_update();        //mesh_joints[1]
        this.#mesh_left_femur_update();         //mesh_joints[2]
        this.#mesh_right_tibia_update();        //mesh_joints[3]
        this.#mesh_left_tibia_update();         //mesh_joints[4]

    }
    #mesh_origin_point_update() {
        // this.mesh_origin.rotation.y = Math.sin(this.time_idx / 10) / 5;
    }
    #mesh_body_update() {
        // this.mesh_joints[0].rotation.y = Math.sin(this.time_idx/10);
    }

    #mesh_right_femur_update() {
        // this.mesh_joints[1].rotation.y = this.IMU_data[R_F];
    }

    #mesh_left_femur_update() {
        this.mesh_joints[2].rotation.y = this.IMU_data["L_F"][this.time_idx]["p"];
    }

    #mesh_right_tibia_update() {
        // this.mesh_joints[3].rotation.y = Math.sin(this.time_idx/10);

    }

    #mesh_left_tibia_update() {
        // this.mesh_joints[4].rotation.y = Math.sin(this.time_idx/10);

    }


    get time_idx() {
        return this._time_idx;
    }

    IMU_data_update(new_data) {
        this.IMU_data = new_data;
    }

}