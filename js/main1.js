var pieces, radius, fft, mapMouseX, mapMouseY, toggleBtn, audio, uploadedAudio, uploadAnim;
var uploadLoading = false;

function preload() {
    audio = loadSound("audio/skrillex-bangarang.mp3");
}


function uploaded(file) {
    uploadLoading = true;
    uploadedAudio = loadSound(file.data, uploadedAudioPlay);
}


function uploadedAudioPlay(audioFile) {

    uploadLoading = false;

    if (audio.isPlaying()) {
        audio.pause();
    }

    audio = audioFile;
    audio.loop();
}


function setup() {

    uploadAnim = select('#uploading-animation');

    createCanvas(windowWidth, windowHeight, WEBGL);
    background(255, 0, 200);
    setAttributes('antialias', true);

    // define initial state
    var state = {
        distance: 382.316,
        center: [0, 0, 0],
        rotation: [-0.548, -0.834, 0.066, -0.015],
    };

    // console.log(Dw.EasyCam.INFO);

    easycam = new Dw.EasyCam(this._renderer, state);

    var phong_vert = document.getElementById("phong.vert").textContent;
    var phong_frag = document.getElementById("phong.frag").textContent;

    phongshader = new p5.Shader(this._renderer, phong_vert, phong_frag);

    document.oncontextmenu = function() {
        return false;
    }
    document.onmousedown = function() {
        return false;
    }

    fft = new p5.FFT();

    audio.loop();

}


var m4_camera = new p5.Matrix();
var m3_camera = new p5.Matrix('mat3');

function backupCameraMatrix() {
    // camera matrix: for transforming positions
    m4_camera.set(easycam.renderer.uMVMatrix);
    // inverse transpose: for transforming directions
    m3_camera.inverseTranspose(m4_camera);
}

function draw() {


    // Add a loading animation for the uploaded track
    if (uploadLoading) {
    	uploadAnim.addClass('is-visible');
    } else {
    	uploadAnim.removeClass('is-visible');
    }

    // save current state of the modelview matrix
    backupCameraMatrix();


    fft.analyze();

    var bass = fft.getEnergy("bass");
    var treble = fft.getEnergy("treble");
    var mid = fft.getEnergy("mid");

    // console.log(treble);

    var mapMid = map(mid, 0, 255, -radius, radius);
    var scaleMid = map(mid, 0, 255, 1, 1.5);

    var mapTreble = map(treble, 0, 255, -radius, radius);
    var scaleTreble = map(treble, 0, 255, 1, 1.5);

    var mapbass = map(bass, 0, 255, -100, 800);
    var scalebass = map(bass, 0, 255, 0, 0.8);



    // console.log(scaleTreble);


    //////////////////////////////////////////////////////////////////////////////
    //
    // MATERIALS
    //
    //////////////////////////////////////////////////////////////////////////////

    var matWhite = {
        diff: [1, 1, 1],
        spec: [1, 1, 1],
        spec_exp: 400.0,
    };

    var matDark = {
        diff: [0.1, 0.15, 0.2],
        spec: [1, 1, 1],
        spec_exp: 400.0,
    };

    var matRed = {
        diff: [1, 0.05, 0.01],
        spec: [1, 0, 0],
        spec_exp: 400.0,
    };

    var matBlue = {
        diff: [0.01, 0.05, 1],
        spec: [0, 0, 1],
        spec_exp: 400.0,
    };

    var matGreen = {
        diff: [0.05, 1, 0.01],
        spec: [0, 1, 0],
        spec_exp: 400.0,
    };

    var matYellow = {
        diff: [1, 1, 0.01],
        spec: [1, 1, 0],
        spec_exp: 400.0,
    };

    var materials = [matWhite, matDark, matRed, matBlue, matGreen, matYellow];


    //////////////////////////////////////////////////////////////////////////////
    //
    // LIGHTS
    //
    //////////////////////////////////////////////////////////////////////////////

    var ambientlight = {
        col: [0.0002, 0.0004, 0.0006, 0.0008, 0.001, 0.0005],
    };

    var directlights = [{
        dir: [-1, -1, -2, -4,-1,-2],
        col: [0.0010, 0.0005, 0.00025, 0.0015, 0.00010,0.0019],
    }, ];

    var angle = frameCount * 0.03;
    var rad = 30;
    var px = cos(angle) * rad;
    var py = sin(angle) * rad;

    // color scheme
    var r = (sin(angle) * 0.5 + 0.5);
    var g = (sin(angle * 0.5 + PI / 2) * 20.5 + 0.5);
    var b = (sin(frameCount * 0.02) * 0.5 + 0.5);


    var pz = sin(frameCount * 0.02);

    var pointlights = [{
            pos: [px, py, 0, 1],
            col: [240 - r, r / 2, r],
            att: 120*treble/100,
        },
        {
            pos: [100, 100, pz * 80, 1],
            col: [r+45, 1, g],
            att: 120*treble/100,
        },

        {
            pos: [150, -150, pz * 80, 1],
            col: [r+10, r - 1, g],
            att: 120*treble/100,
        },

        {
            pos: [-100, -100, pz * 180, 1],
            col: [70, r + 30, g],
            att: 120*treble/100,
        },

        {
            pos: [-150, -150, pz * 80, 1],
            col: [130, r, g + 10],
            att: 120*treble/100,
        },

        {
            pos: [-150, 150, pz * 80, 1],
            col: [10, r, g + 60],
            att: 120*treble/100,
        }
    ];


    //////////////////////////////////////////////////////////////////////////////
    //
    // shader, light-uniforms, etc...
    //
    //////////////////////////////////////////////////////////////////////////////

    setShader(phongshader);

    setAmbientlight(phongshader, ambientlight);
    setDirectlight(phongshader, directlights);
    setPointlight(phongshader, pointlights);



    // projection
    perspective(60 * PI / 180, width / height, 1, 5000);

    // clear BG
    background(0);
    noStroke();



    // display pointlights with just fill();
    push();
    var renderer = easycam.renderer;

    for (var i = 0; i < pointlights.length; i++) {
        var pl = pointlights[i];
        push();
        translate(pl.pos[0], pl.pos[1], pl.pos[2]);
        fill(pl.col[0] * 255, pl.col[1] * 255, pl.col[2] * 255);
        sphere(8*scalebass);
        pop();
    }
    pop();

	


    //////////////////////////////////////////////////////////////////////////////
    //
    // scene, material-uniforms
    //
    //////////////////////////////////////////////////////////////////////////////

    // reset shader, after fill() was used previously
    setShader(phongshader);

    setMaterial(phongshader, matWhite);
    rand.seed = 0;
    var count = 80;
    var trange = 160;
    for (var i = 0; i < count; i++) {

        var dx = rand() * 25 + 8;

        var tx = (rand() * 2 - 1) * trange;
        var ty = (rand() * 2 - 1) * trange;
        var tz = (rand() * 2 - 1) * trange;

        push();
        translate(tx, ty, tz);
        rotateX(map(mouseX, 0, width, 0, PI));
        rotateY(map(mouseY, 0, width, 0, PI));
        box(dx*scalebass*1.2);
        pop();
    }


}

var rand = function(){
  this.x = ++rand.seed;
  this.y = ++rand.seed;
  var val = Math.sin(this.x * 12.9898 + this.y * 78.233) * 43758.545;
  return (val - Math.floor(val));
}
rand.seed = 0;


function setShader(shader){
  shader.uniforms.uUseLighting = true; // required for p5js
  this.shader(shader);
}


function setMaterial(shader, material){
  shader.setUniform('material.diff'    , material.diff);
  shader.setUniform('material.spec'    , material.spec);
  shader.setUniform('material.spec_exp', material.spec_exp);
}


function setAmbientlight(shader, ambientlight){
  shader.setUniform('ambientlight.col', ambientlight.col);
}


function setDirectlight(shader, directlights){
  
  for(var i = 0; i < directlights.length; i++){
    
    var light = directlights[i];
    
    // normalize
    var x = light.dir[0];
    var y = light.dir[1];
    var z = light.dir[2];
    var k = light.dir[3];
    var l = light.dir[4];
    var m = light.dir[5];
    var mag = Math.sqrt(x*x + y*y + z*z + k*k + l*l + m*m); // should not be zero length
    var light_dir = [x/mag, y/mag, z/mag, k/mag, l/mag, m/mag];
    
    // transform to camera-space
    light_dir = m3_camera.multVec(light_dir);
    
    // set shader uniforms
    shader.setUniform('directlights['+i+'].dir', light_dir);
    shader.setUniform('directlights['+i+'].col', light.col);
  }
}


function setPointlight(shader, pointlights){
  
  for(var i = 0; i < pointlights.length; i++){
    
    var light = pointlights[i];
    
    // transform to camera-space
    var light_pos = m4_camera.multVec(light.pos);
    
    // set shader uniforms
    shader.setUniform('pointlights['+i+'].pos', light_pos);
    shader.setUniform('pointlights['+i+'].col', light.col);
    shader.setUniform('pointlights['+i+'].att', light.att);
  }
}

p5.Matrix.prototype.multVec = function(vsrc, vdst){
  
  vdst = (vdst instanceof Array) ? vdst : [];
  
  var x=0, y=0, z=0, w=1, k=0, l=0, m=0;
  
  if(vsrc instanceof p5.Vector){
    x = vsrc.x;
    y = vsrc.y;
    z = vsrc.z;
    k = vsrc.k;
    l = vsrc.l;
    m = vsrc.m;
  } else if(vsrc instanceof Array){
    x = vsrc[0];
    y = vsrc[1];
    z = vsrc[2];
    k = vsrc[4];
    l = vsrc[5];
    m = vsrc[6];
    w = vsrc[3]; w = (w === undefined) ? 1 : w;
  } 

  var mat = this.mat4 || this.mat3;
  console.log(mat.length);
  if(mat.length === 16){
    vdst[0] = mat[0]*x + mat[4]*y + mat[ 8]*z + mat[12]*w ;
    vdst[1] = mat[1]*x + mat[5]*y + mat[ 9]*z + mat[13]*w;
    vdst[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14]*w;
    vdst[3] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15]*w;
    vdst[4] = mat[4]*x + mat[8]*y + mat[12]*z + mat[15]*w; 
    vdst[5] = mat[5]*x + mat[9]*y + mat[14]*z + mat[15]*w; 
  } else {
    vdst[0] = mat[0]*x + mat[3]*y + mat[6]*z;
    vdst[1] = mat[1]*x + mat[4]*y + mat[7]*z;
    vdst[2] = mat[2]*x + mat[5]*y + mat[8]*z;
  }
 
  return vdst;
}



function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    easycam.setViewport([0, 0, windowWidth, windowHeight]);
}