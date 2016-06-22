// Config
var aiSpeed = 1.0;
var aiScript = 'js/ai.js';
var minFrameRate = 10;
var goodFrameRate = 30;
var SHADOW_MAP_WIDTH = 512, SHADOW_MAP_HEIGHT = 512;
var bevelSteps = 1;
var bevelThickness = 3;
var prefillHeight = 4;
var prefilMissingLevel = Math.random() * 3 | 0;
var prefilMissingLevelPercentage = 0.9;
var dropSpeed = 1;
var mobileDropSpeed = 1;
var boardHeight = 12;
var boardWidth = 6;
var boardDepth = 6;
var boardMaxHeight = 20;
var rotateMaxKick = 2;
var dramaticLight = false;
var stereoMode = false;
var soundOff = false;
var crossEyeMode = true;
var colours = [ 0xff55ff, 0xff5500, 0xffaa55, 0xffaa00, 0x55ff00, 0x55ffaa, 0xaa55ff, 0x0055ff, 0x5500ff, 0x55aaff  ];
var shapes = [
    {x:1, y:1, z:1, freq:16}, // 16
    {x:1, y:1, z:2, freq:31}, // 15
    {x:1, y:1, z:3, freq:51}, // 20
    {x:1, y:1, z:4, freq:59}, // 8
    {x:2, y:2, z:1, freq:74}, // 15
    {x:2, y:2, z:2, freq:81}, // 7
    {x:2, y:2, z:3, freq:86}, // 5
    {x:3, y:3, z:1, freq:96}, // 10
    {x:3, y:3, z:3, freq:100} // 4
];

// Status
var startTime = Date.now();
var renderTimePeriod = 0, frameCount = 0;
var lastRenderTime = null;
var tick = 0.0, lastTick = 0.0;
var isMobile = false;
var loadFailed = '1';
var prefilLevel = -1;
var nextPrefil = 0;
var levelsCompleted = 0;
var currentScore = 0, targetScore = 0, bestScore = 0;
var splashMode = true;
var splashModeTimeout = 1000;
var endGameMode = false, endGameDelay = 0;
var fallingState = false;
var viewAngleZ = 0;//3 * Math.PI / 8;
var viewAngleX = 0;//1 * Math.PI / 4;
var viewBounce = 0, viewBounceAmplitude = 0;
var viewPan = 2000;
var viewAngleIntroMode = 300;
var reflectionEnabled = false;
var shadowEnabled = true;
var viewAngleZTarget = viewAngleZ, viewAngleXTarget = viewAngleX;
var lastViewX,lastViewZ,dropDelay=0;
var lastRemoved = false;
var dropStart = 0, dropEnd = 0;
var landingProceduresRunning = false;
var levelCompletionCheckPending = false;
var pauseMode = false;
var loadingMode = false;
var textureCube;
var textureCubeLoaded = false;

// Common Objects
var levels = new Int16Array(boardMaxHeight*boardDepth*boardWidth);
var levelMeshes = [];
var tempShapes = [];
var toBeRemovedMeshes = [];
var toBeRemovedMeshesCount=0;
var removalMethod;
var uniforms, splash_uniforms;
var roundCube;
var currentShape;
var prompts = [];
var transparentOverlayCubes = [];
var guideCube, ground;
var rendererStats  = new THREEx.RendererStats(), stats;
var camera, cameraR, scene, splashScene, renderer, effectFXAA, composer, projector, raycaster;
var directionalLight, shadow_light, pointLight;
var materials = [];
var scoreMaterials;
var cubeCache = [];
//var sides = new Array;
var preloadobj;
var scheduleSound = "";
var scheduleSoundDelay = 100;
var mouse = new THREE.Vector2();
var splashText;
var splash_side_material;
//var scoreBoardService;

// Keyboard
var keyboard = new THREEx.KeyboardState();
var dramaticLightDelay = 0;
var stereoDelay = 0;
var mobileDelay = 0;
var pauseDelay = 0;

// AI decision
var ai_worker;
var ai_decisionMade = false;
var ai_shapeXSize =0, ai_shapeYSize = 0, ai_shapeZSize = 0;
var ai_targetXPos=0, ai_targetYPos=0, ai_targetZPos=0;

var manifest = [
    {id:"floorFragShader", src:"shaders/floor-shader-frag.txt"},
    {id:"floorVertShader", src:"shaders/floor-shader-vert.txt"},
    {id:"splashFragShader", src:"shaders/splash-shader-frag.txt"},
    {id:"splashVertShader", src:"shaders/splash-shader-vert.txt"},
    {id:"0", src:"resources/images/counter/0.png"},
    {id:"1", src:"resources/images/counter/1.png"},
    {id:"2", src:"resources/images/counter/2.png"},
    {id:"3", src:"resources/images/counter/3.png"},
    {id:"4", src:"resources/images/counter/4.png"},
    {id:"5", src:"resources/images/counter/5.png"},
    {id:"6", src:"resources/images/counter/6.png"},
    {id:"7", src:"resources/images/counter/7.png"},
    {id:"8", src:"resources/images/counter/8.png"},
    {id:"9", src:"resources/images/counter/9.png"},
    /*
     {id:"best", src:"resources/images/titles/best.png"},
     {id:"splash", src:"resources/images/titles/splash.png"},
     {id:"startMsg", src:"resources/images/titles/start-msg.png"},
     {id:"controlKeys", src:"resources/images/titles/control-keys.png"},
     {id:"dropKey", src:"resources/images/buttons/drop.png"},
     {id:"exitKey", src:"resources/images/buttons/exit.png"},
     {id:"rotateKey", src:"resources/images/buttons/rotate.png"},
     {id:"leftKey", src:"resources/images/buttons/left.png"},
     {id:"rightKey", src:"resources/images/buttons/right.png"},
     {id:"upKey", src:"resources/images/buttons/up.png"},
     {id:"downKey", src:"resources/images/buttons/down.png"},
     */
    {id:"drop", src:"resources/sounds/bong.ogg"},
    {id:"free", src:"resources/sounds/free.ogg"},
    {id:"tap", src:"resources/sounds/tap.ogg"},
    {id:"rotate", src:"resources/sounds/rotate.ogg"},
    {id:"blop-low", src:"resources/sounds/blop-low.ogg"},
    {id:"blop-med", src:"resources/sounds/blop-med.ogg"},
    {id:"blop-high", src:"resources/sounds/blop-high.ogg"}
];

function bodyOnLoad() {

    //App42.initialize("de39442a8d19c046727d0dac740ea81879dfac58727a36e5ff4d9b003fc26f60","3942d573c5f80abc3c8ccdccafd8ca9102ee57928eb3037786d26d19e0f93e63");
    //scoreBoardService  = new App42ScoreBoard();

    rendererStats.domElement.style.position   = 'absolute';
    rendererStats.domElement.style.left  = '0px';
    rendererStats.domElement.style.bottom    = '0px';
    rendererStats.domElement.style.display = "none";
    document.body.appendChild( rendererStats.domElement );

    prepareRoundCube();
    if (initThreeJS()) {
        createLights();
        createMaterials();
        animate();
        initSoundLib();
        preload();
    }
}

function initThreeJS()
{
    if ( ! Detector.webgl )
    {
        ga('send', 'event', 'category', 'action', 'renderer-failed');
        Detector.addGetWebGLMessage();
        return false;
    }

    renderer = new THREE.WebGLRenderer();

    if (!renderer)
    {
        ga('send', 'event', 'category', 'action', 'renderer-failed');
        return false;
    }

    //renderer = new THREE.CanvasRenderer();
    renderer.setSize( getWindowWidth(), getWindowHeight() );
    renderer.setClearColor(0x0077ee, 1);
    renderer.setPixelRatio( window.devicePixelRatio );

    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFShadowMap;
    renderer.sortObjects = false;
    renderer.depthWrite = false;
    renderer.depthTest = true;
    renderer.autoClear = false;
    renderer.autoClearStencil = false;
    renderer.autoClearColor = false;
    renderer.autoClearDepth = false;

    var container = document.createElement( 'div' );
    container.onclick = splashOnClick;
    document.body.appendChild( container );
    container.appendChild( renderer.domElement );

    if (!renderer || !renderer.context )
    {
        ga('send', 'event', 'category', 'action', 'renderer-failed');
        return false;
    }

    //projector = new THREE.Projector();
    //raycaster = new THREE.Raycaster();

    stats = new Stats();
    stats.domElement.style.display = "none";
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

    scene = new THREE.Scene();
    splashScene = new THREE.Scene();

    scene.autoUpdate = false;
    //scene.fog = new THREE.Fog( 0xffffff, -500, 500 );
    //scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025 );
    var cameraRad = 100 * (boardWidth/2 + 1);
    camera = new THREE.OrthographicCamera( -cameraRad, cameraRad, cameraRad, -cameraRad, - 2000, 2000 );
    cameraR = new THREE.OrthographicCamera( -cameraRad, cameraRad, cameraRad, -cameraRad, - 2000, 2000 );
    splashCamera = new THREE.OrthographicCamera( -cameraRad, cameraRad, cameraRad, -cameraRad, - 2000, 2000 );

    splashCamera.position.x = Math.cos(0) * 200;
    splashCamera.position.z = Math.sin(0) * Math.cos(0) * 200;
    splashCamera.position.y = Math.sin(0) * 200 + 300;
    splashCamera.lookAt(new THREE.Vector3( scene.position.x, scene.position.y + 300, scene.position.z));

    var renderModel = new THREE.RenderPass( scene, camera );
    effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );

    effectFXAA.renderToScreen = true;

    composer = new THREE.EffectComposer( renderer );

    composer.addPass( renderModel );
    composer.addPass( effectFXAA );

    onWindowResize();

    // Prevent touch scrolling
    window.addEventListener("touchmove", function(event) {
        if (!event.target.classList.contains('scrollable')) {
            // no more scrolling
            event.preventDefault();
        }
    }, false)

    loadingMode = true;
    currentShape = newCube(false);
    currentShape.position.x = 0; currentShape.position.y = 300; currentShape.position.z = 0;
    currentShape.scale.x = 0.1; currentShape.scale.y = 0.1; currentShape.scale.z = 0.01;
    currentShape.targetScale = 0.0;
    scene.add(currentShape);

    //composer.clear();// true, true, true);
    //composer.render( );
    //renderer.clear(true,true,true);
    //renderer.render(scene);

    return true;
}

function initSplashText()
{
    splashScene.add(splashText = createTextMesh("BlockTris", 150, 20, 5, "baveuse", "normal", "normal", 2, 1.5, true));
}

function modifySplashText() {

    var splashGeo = splashText.geometry;

    for ( var i = 0; i < splashGeo.vertices.length; i ++ ) {
        var vert = splashGeo.vertices[i];

        if (!vert.original)
            vert.original = vert.clone();

        vert.y = vert.original.y -  150 / 2;
        vert.y *=// 1.7 + Math.sin(vert.original.x *.01 + lastRenderTime * 0.01) * .1;//
             2.0 + Math.cos(vert.original.x *.0046) * .6 * Math.sin(lastRenderTime * 0.002) * .5;
        vert.y += 150 / 2;

        vert.x = ((vert.original.x - 1370/2) * (getWindowWidth()/getWindowHeight()) / 2) + 1370/2;

    }

    splashText.geometry.vertices = splashGeo.vertices;
    splashText.dynamic = true;
    splashText.geometry.verticesNeedUpdate = true;
}

function createTextMesh(text, size, height, curveSegments, font, weight, style, bevelThickness, bevelSize, bevelEnabled) {

    var textGeo = new THREE.TextGeometry( text, {

        size: size,
        height: height,
        curveSegments: curveSegments,

        font: font,
        weight: weight,
        style: style,

        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelEnabled: bevelEnabled,

        material: 0,
        extrudeMaterial: 1

    });

    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();

    // "fix" side normals by removing z-component of normals for side faces
    // (this doesn't work well for beveled geometry as then we lose nice curvature around z-axis)

    if ( ! bevelEnabled ) {

        var triangleAreaHeuristics = 0.1 * ( height * size );

        for ( var i = 0; i < textGeo.faces.length; i ++ ) {

            var face = textGeo.faces[ i ];

            var va = textGeo.vertices[ face.a ];
            var vb = textGeo.vertices[ face.b ];
            var vc = textGeo.vertices[ face.c ];

            scale = height;
            textGeo.faceVertexUvs[0][i] = [
                new THREE.Vector2((va.x) / scale, (va.y) / scale),
                new THREE.Vector2((vb.x) / scale, (vb.y) / scale),
                new THREE.Vector2((vc.x) / scale, (vc.y) / scale) ];


            if ( face.materialIndex == 1 ) {

                for ( var j = 0; j < face.vertexNormals.length; j ++ ) {

                    face.vertexNormals[ j ].z = 0;
                    face.vertexNormals[ j ].normalize();
                }

                var s = THREE.GeometryUtils.triangleArea( va, vb, vc );

                if ( s > triangleAreaHeuristics ) {

                    for ( var j = 0; j < face.vertexNormals.length; j ++ ) {

                        face.vertexNormals[ j ].copy( face.normal );

                    }

                }

            }

        }

    }


    splash_uniforms = {
//        iResolution: { type: "v2", value: new THREE.Vector2( getWindowWidth(), getWindowHeight() ) },
        iGlobalTime: { type: "f", value: 0},
        opacity: { type: "f", value: 0}
    };

    var splash_custom_material = new THREE.ShaderMaterial({
        uniforms: splash_uniforms,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        vertexShader: preloadobj.getResult('splashVertShader'),
        fragmentShader: preloadobj.getResult('splashFragShader')
    });
    splash_side_material = new THREE.MeshPhongMaterial( { color: 0x112233, shading: THREE.SmoothShading, transparent:true, opacity:0.9, blending: THREE.AdditiveBlending } );

    var materialz = new THREE.MeshFaceMaterial( [

        splash_custom_material,// splash_custom_material
//        new THREE.MeshPhongMaterial( { color: 0x554433, shading: THREE.FlatShading, transparent:true, opacity:0.9, blending: THREE.AdditiveBlending } ), // front
        splash_side_material // side
    ] );

    var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

    textMesh1 = new THREE.Mesh( textGeo, materialz );

    textMesh1.position.x = 300;
    textMesh1.position.y = 300;
    textMesh1.position.z = -centerOffset;

    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI / 2;
    textMesh1.rotation.z = 0;

    textMesh1.updateMatrix();
    textMesh1.updateMatrixWorld();

    return textMesh1;
}


function initSoundLib()
{
    createjs.Sound.initializeDefaultPlugins();
    if (createjs.Sound.BrowserDetect.isIOS || createjs.Sound.BrowserDetect.isAndroid || createjs.Sound.BrowserDetect.isBlackberry){
        // Awesome !
        isMobile = true;
    }
}

function prepareRoundCube()
{
    // Round cube stuff
    var circSegments = (bevelSteps + 1) * 4;

    var squareShape = new THREE.Shape();
    for (var i=0; i < circSegments+1; i++)
    {
        var cx = Math.cos(((2*Math.PI)/circSegments)*i) * bevelThickness;
        var cy = Math.sin(((2*Math.PI)/circSegments)*i) * bevelThickness;
        if (cx < 0) cx -= 20 - (bevelThickness/2); else cx  += 20 - (bevelThickness/2);
        if (cy < 0) cy -= 20 - (bevelThickness/2); else cy += 20 - (bevelThickness/2);
        if (i == 0)
            squareShape.moveTo( cx, cy );
        else
            squareShape.lineTo( cx, cy );
    }

    //var extrudeSettings = { amount: 50, bevelEnabled: true, bevelSegments: 5, steps: 5, bevelThickness: 3, bevelSize:3 };
    var extrudeSettings = { amount: 50 - bevelThickness*2, bevelEnabled: true, bevelSegments: bevelSteps, steps: bevelSteps, bevelThickness: bevelThickness, bevelSize:bevelThickness };
    roundCube = new THREE.ExtrudeGeometry( squareShape, extrudeSettings )
}

function loadComplete()
{
    loadingbox.style.display = "inline";
    renderScore("p", 100, true);

    checkIfTextureCubeLoaded();
}

function checkIfTextureCubeLoaded()
{
    if (textureCubeLoaded) {
        if (init()) {
            recycleGroup(currentShape);
            currentShape = newCube(false);
            loadingMode = false;
            //     animate();
        }
    }
    else
       window.setTimeout(checkIfTextureCubeLoaded, 100);
}

function preloadEvent(event) {
    renderScore("p", parseInt(preloadobj.progress * 100), true);
    currentShape.targetScale = 2.0 * Math.sin(preloadobj.progress * Math.PI);
    if (preloadobj.progress > 0.85)
        renderScore("p", 100, true);
}

function preload()
{
    // Disable the pre-load as it doesn't work in IE for some reason
    //loadComplete();

    preloadobj = new createjs.LoadQueue(true);
    preloadobj.installPlugin(createjs.Sound);
    preloadobj.addEventListener("complete", function() { loadComplete(); });
    preloadobj.addEventListener("progress", preloadEvent);
    preloadobj.loadManifest(manifest);
}

function createMaterials()
{

    var format = '.png';
    var loc = 'resources/images/envmaps/'
    var urls = [
            loc + 'xpos' + format, loc + 'xneg' + format,
            loc + 'ypos' + format, loc + 'yneg' + format,
            loc + 'zpos' + format, loc + 'zneg' + format
    ];

    textureCube = THREE.ImageUtils.loadTextureCube( urls, THREE.CubeReflectionMapping, function() { textureCubeLoaded = true; } );

    scoreMaterials = {
        1 : new THREE.MeshLambertMaterial( { ambient: 0x000000, color: 0xffffff, specular: 0x555555, map: generateScoreTexture("+1"), depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5, transparent: true} ),
        2 : new THREE.MeshLambertMaterial( { ambient: 0x000000, color: 0xffffff, specular: 0x555555, map: generateScoreTexture("+2"), depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5, transparent: true} ),
        3 : new THREE.MeshLambertMaterial( { ambient: 0x000000, color: 0xffffff, specular: 0x555555, map: generateScoreTexture("+3"), depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5, transparent: true} ),
        4 : new THREE.MeshLambertMaterial( { ambient: 0x000000, color: 0xffffff, specular: 0x555555, map: generateScoreTexture("+4"), depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5, transparent: true} ),
        6 : new THREE.MeshLambertMaterial( { ambient: 0x000000, color: 0xffffff, specular: 0x555555, map: generateScoreTexture("+6"), depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5, transparent: true} ),
        9 : new THREE.MeshLambertMaterial( { ambient: 0x000000, color: 0xffffff, specular: 0x555555, map: generateScoreTexture("+9"), depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5, transparent: true} ),
        100 : new THREE.MeshLambertMaterial( { ambient: 0x000000, color: 0xffffff, specular: 0x555555, map: generateScoreTexture("+100"), depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5, transparent: true} )};

    var squareWithCircles_texture = squareWithCircles(36, bevelThickness, false);
    var squareWithCircles_texture_inverse = squareWithCircles(36, bevelThickness, true);

    for (k = 0; k < 11; k++)
    {
        materials[k] = material(k, squareWithCircles_texture, textureCube, 1, false);
        materials[k].index = k;
        materials[k+11] = material(k, squareWithCircles_texture_inverse, textureCube, .5, true);
        materials[k+11].index = k;
        materials[k+11].side = THREE.BackSide;
        materials[k+11].depthTest = false;
        materials[k+11].blending = THREE.AdditiveBlending;
    }
}

function getWindowWidth(){
    return window.innerWidth - 4;
}

function getWindowHeight(){
    return window.innerHeight - 4;
}

function createFloor() {
    uniforms = {
        time: { type: "f", value: 0.0 },
        score: { type: "f", value: 0.0 }
    };

    var ground_custom_material = new THREE.ShaderMaterial({
        blending: THREE.AdditiveBlending,
        uniforms: uniforms,
        opacity: .7,
        transparent: true,
        vertexShader: preloadobj.getResult('floorVertShader'),
        fragmentShader: preloadobj.getResult('floorFragShader')
    });
    ground_custom_material.depthWrite = false;
    ground_custom_material.depthTest = true;

    var geometry = new THREE.PlaneGeometry(2000, 2000);

    ground = new THREE.Mesh(geometry, ground_custom_material);
    //ground.renderDepth = 100;
    ground.position.set(0, -3, 0);
    ground.rotation.x = -Math.PI / 2;
    ground.matrixAutoUpdate = false;
    ground.rotationAutoUpdate = false;
    ground.frustumCulled = false;
    ground.updateMatrix();
    ground.updateMatrixWorld();
    scene.add(ground);
}

function createLights() {
// Lights
    //var ambient = new THREE.AmbientLight( 0xFFFFFF );
    //scene.add( ambient );

    directionalLight = new THREE.DirectionalLight(0xffffff, 3.4, 0);
    directionalLight.position.set(1, 1, 0.5).normalize();
    directionalLight.updateMatrixWorld();
    scene.add(directionalLight);

    var directionalLight2 = new THREE.DirectionalLight(0xffffff, 3.4, 0);
    directionalLight2.position.set(1, 1, 0.5).normalize();
    directionalLight2.updateMatrixWorld();
    splashScene.add(directionalLight2);
    /*
          pointLight = new THREE.PointLight( 0xffffff, 2.8, 0 );
          pointLight.position.set(1000,100,1000);
          scene.add( pointLight );
          */

    // light representation
    /*
          var sphere = new THREE.SphereGeometry( 100, 16, 8 );
          var lightMesh = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xffaa00 } ) );
          lightMesh.scale.set( 0.05, 0.05, 0.05 );
          lightMesh.position.set(600,-600,600);
          lightMesh.updateMatrixWorld();
          scene.add( lightMesh );
          */
    //				var light = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI, 1 );
//				light.position.set( 500, 800, 500 );
//				light.target.position.set( 0, -600, 0 );

    var noShadow = false;
    if (!noShadow) {
        shadow_light = new THREE.DirectionalLight(0xff0000, 0.05, 0);
        //shadow_light.position.set( 500, 500, 500 );
        shadow_light.position.set(0, 700 + 300, 0);
        scene.add(shadow_light);

        shadow_light.castShadow = true;

        shadow_light.shadowCameraNear = 0;
        shadow_light.shadowCameraFar = 1000;
        shadow_light.shadowCameraRight     =  180;
        shadow_light.shadowCameraLeft     = -180;
        shadow_light.shadowCameraTop      =  180;
        shadow_light.shadowCameraBottom   = -180;

        /*
         light.shadowCameraFov = 50;
         light.shadowCameraNear = -100;
         light.shadowCameraFar = 1000;
         */

        shadow_light.shadowCameraVisible = false;

        shadow_light.shadowBias = 0.00001;
        shadow_light.shadowDarkness = 0.6;
        shadow_light.onlyShadow = true;

        shadow_light.shadowMapWidth = SHADOW_MAP_WIDTH;
        shadow_light.shadowMapHeight = SHADOW_MAP_HEIGHT;
        shadow_light.updateMatrixWorld();

        scene.add(shadow_light);
    }
    /*
     light = new THREE.DirectionalLight( 0xffffff );
     light.position.set( 500, 500, 500 );
     scene.add( light );

     light.castShadow = true;

     light.shadowCameraVisible = false;

     light.shadowBias = 0.00001;
     light.shadowDarkness = 0.8;

     light.shadowMapWidth = SHADOW_MAP_WIDTH;
     light.shadowMapHeight = SHADOW_MAP_HEIGHT;

     scene.add( light );
     */
}
function init() {

    //refelectionGroup = new THREE.Object3D();


    //refelectionGroup.rotation.z = Math.PI;
    //refelectionGroup.updateMatrix();
    //refelectionGroup.updateMatrixWorld();
    /*
    var m1 = new THREE.Matrix4(); m1.makeTranslation(0,-300,0);
    var m2 = new THREE.Matrix4(); m2.makeRotationZ(Math.PI);
    var m3 = new THREE.Matrix4(); m3.makeRotationY(Math.PI);
    refelectionGroup.matrixWorld.multiplyMatrices( m1, m2 );
    refelectionGroup.matrixWorld.multiply( m3 );
    */
/*
    refelectionGroup.matrixWorld.set( 1, 0, 0, 0,
                                      0, -1, 0, -300,
                                      0, 0, 1, 0,
                                      0, 0, 0, 1 );
*/
//    scene.add( refelectionGroup );

    // Grid
    /*
     var size = (boardWidth * 50 / 2), step = 50;

     var bottom = new THREE.Geometry();
     var grids = new Array();
     for ( var i = 0; i <= 4; i ++ )
     grids[i] = new THREE.Geometry();

     for ( var i = - size; i <= size; i += step ) {

     bottom.vertices.push( new THREE.Vector3( - size, -size*2, i ) );
     bottom.vertices.push( new THREE.Vector3(   size, -size*2, i ) );

     bottom.vertices.push( new THREE.Vector3( i, -size*2, - size ) );
     bottom.vertices.push( new THREE.Vector3( i, -size*2,   size ) );

     // Vertical top down
     grids[0].vertices.push( new THREE.Vector3( i, -size*2, -size ) );
     grids[0].vertices.push( new THREE.Vector3( i, size*2, -size ) );

     grids[1].vertices.push( new THREE.Vector3( size, -size*2, i ) );
     grids[1].vertices.push( new THREE.Vector3( size, size*2, i ) );

     grids[2].vertices.push( new THREE.Vector3( i, -size*2, size ) );
     grids[2].vertices.push( new THREE.Vector3( i, size*2, size ) );

     grids[3].vertices.push( new THREE.Vector3( -size, -size*2, i ) );
     grids[3].vertices.push( new THREE.Vector3( -size, size*2, i ) );
     }

     for ( var i = - size*2; i <= size*2; i += step ) {

     // Vertical across
     grids[0].vertices.push( new THREE.Vector3( size, i,  -size ) );
     grids[0].vertices.push( new THREE.Vector3( -size, i,  -size ) );

     grids[1].vertices.push( new THREE.Vector3( size, i,  size ) );
     grids[1].vertices.push( new THREE.Vector3( size, i,  -size ) );

     grids[2].vertices.push( new THREE.Vector3( size, i,  size ) );
     grids[2].vertices.push( new THREE.Vector3( -size, i,  size ) );

     grids[3].vertices.push( new THREE.Vector3( -size, i,  size ) );
     grids[3].vertices.push( new THREE.Vector3( -size, i,  -size ) );

     }

     var material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.2 } );

     var lid = new THREE.Line( bottom, material );
     lid.type = THREE.LinePieces;
     //scene.position = new THREE.Vector3( 0, size, 0 );
     scene.add( lid );

     for ( var i = 0; i <= 4; i ++ )
     {
     //					material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.2 } );
     sides[i] = new THREE.Line( grids[i], material );
     sides[i].type = THREE.LinePieces;
     sides[i].shading = THREE.FlatShading;
     scene.add( sides[i] );
     }
     */

    genGuideCube();

    /*

     // GROUND
     for (var i = 0; i < 23; i++)
     {
     //	var geometry = new THREE.PlaneGeometry( 2000, 2000 );
     var geometry = new THREE.RingGeometry( 50 * i, 50 * i + 25, 20 + i * 2);
     var planeMaterial = new THREE.MeshPhongMaterial( { ambient: 0x000000, color: 0x003366 + i * boardWidth + (i * 2 * 255), specular: 0xffffff, shininess: 90 } );

     var ground = new THREE.Mesh( geometry, planeMaterial );

     ground.position.set( 0, -303, 0 );
     ground.rotation.x = - Math.PI / 2;
     //ground.scale.set( 1000, 1000, 1000 );

     ground.castShadow = false;
     ground.receiveShadow = false;

     scene.add( ground );
     }
     */
    createFloor();
    initSplashText();

    /*
     var celing = new THREE.Mesh( geometry, ground_custom_material );

     celing.position.set( 0, 303, 0 );
     celing.rotation.x = - Math.PI / 2;
     scene.add( celing );
     */

//    createLights();

    for (var materialIndex = 0; materialIndex < 11; materialIndex++) {
        var geometryz = roundCube.clone();
        textureMapper(geometryz, materialIndex + (materials.length / 2), 25, 25, 5, 50);
        displaceShape(geometryz, 0, 0, -25 + 4);
        //geometryTotal.merge(geometryz);

        transparentOverlayCubes[materialIndex] = new THREE.Mesh(geometryz, new THREE.MeshFaceMaterial(materials));
        ///transparentOverlayCubes[materialIndex].renderDepth = 20;
        transparentOverlayCubes[materialIndex].frustumCulled = false;
    }

    window.addEventListener( 'resize', onWindowResize, false );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    /*
     var hammertime = Hammer(renderer.domElement).on("tap", function(event) {
     if (!splashMode)
     drop();
     else
     startGame();
     });
     */

    var hammertime = Hammer(renderer.domElement).on("drag", function(event) {
        //console.log("Drag Velocity: " + event.gesture.velocityX + ", " + event.gesture.velocityY);
        if (isMobile)
        {
            setMove(viewAngleZ, ((event.gesture.angle / 180) * Math.PI + Math.PI / 2));
        }
        else
            moveView(((event.gesture.deltaY / event.gesture.deltaTime) * 4 * Math.PI) / getWindowHeight(), ((event.gesture.deltaX / event.gesture.deltaTime) * 4 * Math.PI) / getWindowWidth(), true);
        //console.log("Drag Fraction: " + event.gesture.velocityX / getWindowWidth() + ", " + event.gesture.velocityY / getWindowHeight());
    }).on("tap", function(event) {
        rotate();
    }).on("doubletap", function(event) {
        drop();
    });


    var hammertime = Hammer(move_pad).on("drag", function(event) {
        setMove(viewAngleZ, ((event.gesture.angle / 180) * Math.PI + Math.PI / 2));
    }).on("tap", function(event) {
        rotate();
    });

    var hammertime2 = Hammer(scr_btn_drop).on("tap", function(event) {
        drop();
    });

    //splashImg.style.opacity = 0;
    splash_side_material.opacity = splash_uniforms.opacity.value = 0.;
    //splashImg.style.display = "inline";
    s6.style.display = "inline";
    controlKeys.style.display = "none";
    loadFailed = '0';

    //ga('set', 'metric1', '1');
    ga('send', 'event', 'category', 'action', 'game-loaded');

    var savedScore = getCookie("bestScore");
    if (savedScore && savedScore != "")
        setBestScore(parseInt(savedScore));

    loadingImg.style.display = "none";
    loadingbox.style.display = "none";
    scorebox.style.display = "inline";
    //likeButtons.style.display = "inline";

    soundToggle(true);
    initNewGame();
    return true;
}

function decideTargetLocation(currentShape)
{
    ai_decisionMade = false;
    if (!ai_worker)
    {
        ai_worker = new Worker(aiScript);
        ai_worker.addEventListener('message', function(e) {
            ai_decisionMade = true;
            ai_targetXPos = e.data.targetXPos; ai_targetYPos = e.data.targetYPos; ai_targetZPos = e.data.targetZPos;
            ai_shapeXSize = e.data.shapeXSize; ai_shapeYSize = e.data.shapeYSize; ai_shapeZSize = e.data.shapeZSize;
        }, false);
    }

    ai_worker.postMessage({
        "boardWidth" : boardWidth, "boardDepth": boardDepth, "boardMaxHeight": boardMaxHeight,
        "csx" : currentShape.shape.x, "csy" : currentShape.shape.y, "csz" : currentShape.shape.z, "levels" : levels});
}

function createSquareImageContext(size)
{
    var imageCanvas = document.createElement( "canvas" ),
        context = imageCanvas.getContext( "2d" );

    imageCanvas.width = imageCanvas.height = size;

    context.fillStyle = "rgba(0,0,0,255)";
    context.fillRect( 0,0,size,size );
    return imageCanvas;
}

function genGuideCube()
{
    if (guideCube) {
        scene.remove(guideCube);
    }

    var geometry = new THREE.BoxGeometry( 50 * boardWidth,50 * boardHeight,50 * boardDepth, 1,1,1 );
//    displaceShape(geometry, 0, 300, 0);
    textureMapper(geometry, 0, 0,0,0, 50);
    var guideMaterial = material((Math.random() * 10) | 0, squareWithCircles(64,1), 0.8, true);
    guideMaterial.depthWrite = true;
    guideMaterial.depthTest = true;
    guideMaterial.blending = THREE.AdditiveBlending;

    guideCube = new THREE.Mesh( geometry,  guideMaterial );
    guideMaterial.side = THREE.BackSide;

    guideCube.castShadow = false;
    guideCube.receiveShadow = true;

    guideCube.position.x = 0; guideCube.position.y = 50 * boardHeight / 2; guideCube.position.z = 0;
    //guideCube.renderDepth = 90;
    guideCube.matrixAutoUpdate = false;
    guideCube.rotationAutoUpdate = false;
    guideCube.frustumCulled = false;
    guideCube.updateMatrix();
    guideCube.updateMatrixWorld();

    scene.add(guideCube);
}

function canvasToTexture(imageCanvas)
{
    var textureCanvas = new THREE.Texture( imageCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
    textureCanvas.needsUpdate = true;
    textureCanvas.minFilter = THREE.LinearFilter;
    textureCanvas.magFilter = THREE.LinearMipMapNearestFilter;
    textureCanvas.repeat.set( 1, 1 );
    textureCanvas.WrapS = textureCanvas.WrapT = THREE.RepeatWrapping;
    return textureCanvas;
}


function generateScoreTexture(value)
{
    var canvas = createSquareImageContext(128);
    var context = canvas.getContext( "2d" );

    context.font="60px Georgia bold";

    var gradient=context.createLinearGradient(0,0,canvas.width,0);
    gradient.addColorStop("0","cyan");
    gradient.addColorStop("0.5","white");
    gradient.addColorStop("1.0","cyan");

    context.fillStyle=gradient;
    context.fillText(value,0,128/2 + 60/2);

    return canvasToTexture(canvas);
}

function squareWithCircles(radius, border, inverse)
{
    var canvas = createSquareImageContext(128);
    var context = canvas.getContext( "2d" );

    //var border = bevelThickness;
    for (var x = 0; x < 128; x++)
    {
        for (var y = 0; y < 128; y++)
        {
            var xx = x;
            var yy = y;
            if (x > 64) xx = 128 - x;
            if (y > 64) yy = 128 - y;
            if (xx < border) xx = 0; else xx -=border;
            if (yy < border) yy = 0; else yy -=border;

            var c = 0;//128 - (((Math.tan(Math.PI * xx / 255 ) * 64) | 0) + ((Math.tan(Math.PI * yy / 255 ) * 64) | 0));
            c += (((Math.sin(Math.PI * xx / 128 ) * radius) | 0) * ((Math.sin(Math.PI * yy / 128 ) * radius) | 0));
            c = (c * (1 - Math.random()/6)) | 0; // noise
            if (inverse)
                context.fillStyle = "rgba(" + (255 - c) + "," + (255 - c) + "," + (255 - c) + ", " + 255 + ")";
            else
                context.fillStyle = "rgba(" + c + "," + c + "," + c + ", " + 255 + ")";
            context.fillRect( x, y, x, y );
        }
    }

    return canvasToTexture(canvas);
}

function squares()
{
    var canvas = createSquareImageContext(128);
    var context = canvas.getContext( "2d" );

    for (i = 1; i < 40; i++)
    {
        context.fillStyle = "rgba(" + (255-i*2) + "," + (255-i*2) + "," + (255-i*2) + ", " + 255 + ")";
        //console.log("Colour: " + context.fillStyle);
        context.fillRect( 2+i, 2+i, 125-i*3, 125-i*3 );
    }
    return canvasToTexture(canvas);
}

function smallCube(x,y,z, material) {
    var geometry = new THREE.BoxGeometry( 50,50,50, 1,1,1 );

    var cube = new THREE.Mesh( geometry, material );

    cube.castShadow = true;
    cube.receiveShadow = true;

    cube.position.x = ((x) * 50) - (boardWidth * 50 / 2) + 25;
    cube.position.y = ((y) * 50) + 25;
    cube.position.z = ((z) * 50) - (boardDepth * 50 / 2) + 25;

    return cube;
}

function conv(x,y,z)
{
    return y * (boardWidth*boardDepth) + z * boardWidth + x;
}

function levelVal(x,y,z)
{
    return levels[conv(x,y,z)];
}

function setLevelVal(x,y,z, v)
{
    levels[conv(x,y,z)] = v;
}

function levelToMesh(y, level) {

    //var geometeries = null;
    var newObject = new THREE.Object3D();

    for (x = 0; x < boardWidth; x++)
        for (z = 0; z < boardDepth; z++)
        {
            if (levelVal(x,level,z) != 0)
            {
                var newMesh = getSmallCube(levelVal(x,level,z) - 1);
                newMesh.position.x = ((x) * 50) - (boardWidth * 50 / 2) + 25;
                newMesh.position.y = 25;
                newMesh.position.z = ((z) * 50) - (boardDepth * 50 / 2) + 4;
                newMesh.updateMatrix();
                newObject.add(newMesh);
            }
        }

    if (newObject != null)//geometeries != null)
    {
        //geometeries.dynamic = false;
        //var level = new THREE.Mesh( geometeries, new THREE.MeshFaceMaterial(materials) );
        level = newObject;

        level.castShadow = true; // It may not need to cast shadows
        level.receiveShadow = true;
        level.description = "Mesh for level " + y;
        level.position.y = (y * 50);
        level.matrixAutoUpdate = false;
        level.rotationAutoUpdate = false;
        level.frustumCulled = false;
        level.updateMatrix();
        level.updateMatrixWorld();
        return level;
    }
    else
        return null;
}

function material(rand, texture, textureCube, opacity, transparent) {
    //var rand = (Math.random() * 11) | 0;
    //var opacity = 0.8;
    //var transparent = true;
    var material;
    /*
     // 0 - good, 1 - nice, 3,4,6,8,10 - boring, 9,5,7 - shiny
     if (rand == 0)
     material = new THREE.MeshLambertMaterial( { color: 0xffffff, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 1)
     material = new THREE.MeshPhongMaterial( { ambient: 0x000000, color: 0xff5500, specular: 0x555555, shininess: 10, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 2)
     material = new THREE.MeshLambertMaterial( { color: 0xff5500, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 3)
     material = new THREE.MeshPhongMaterial( { ambient: 0x000000, color: 0xffaa00, specular: 0x555555, shininess: 26, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 4)
     material = new THREE.MeshLambertMaterial( { color: 0xffaa00, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 5)
     material = new THREE.MeshPhongMaterial( { ambient: 0x000000, color: 0x55ff00, specular: 0x555555, shininess: 26, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 6)
     material = new THREE.MeshLambertMaterial( { color: 0x55ff00, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 7)
     material = new THREE.MeshPhongMaterial( { ambient: 0x000000, color: 0x0055ff, specular: 0x555555, shininess: 26, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 8)
     material = new THREE.MeshLambertMaterial( { color: 0x0055ff, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 9)
     material = new THREE.MeshPhongMaterial( { ambient: 0x000000, color: 0x5500ff, specular: 0x555555, shininess: 26, map: texture, transparent: transparent, opacity: opacity } );
     if (rand == 10)
     material = new THREE.MeshLambertMaterial( { color: 0x5500ff, map: texture, transparent: transparent, opacity: opacity } );
     */


    material = new THREE.MeshLambertMaterial( { reflectivity: 0.7, ambient: 0x000000, color: 0x5500ff, specular: 0x555555, shininess: 5, map: texture, transparent: transparent, opacity: opacity } );

    //if (transparent)
    {
        material.envMap = textureCube;
    }

    material.color = new THREE.Color(colours[rand]);

    /*
     //material.color = new THREE.Color(Math.sin(Math.random())/2 + 0.5, Math.sin(Math.random())/2 + 0.5, Math.sin(Math.random())/2 + 0.5);

     var randc = rand;
     var r = 0;
     var g = 0;
     var b = 0;
     var rande = Math.random();
     if (rande < 0.3) r = 0.33;
     else if (rande < 0.6) g = 0.33;
     else if (rande < 0.9) b = 0.33;
     var randf = Math.random();
     if (randf < 0.3) r = 1;
     else if (randf < 0.6) g = 1;
     else if (randf < 0.9) b = 1;
     var randg = Math.random();
     if (randg < 0.3) r = 0.66;
     else if (randg < 0.6) g = 0.66;
     else if (randg < 0.9) b = 0.66;


     material.color = new THREE.Color(r,g,b);
     //				material.specular = new THREE.Color(r + 0.4,g + 0.4,b + 0.4);
     //material.specular = new THREE.Color(Math.tan(Math.random()*Math.PI)/2 + 0.5, Math.tan(Math.random()*Math.PI)/2 + 0.5, Math.tan(Math.random()*Math.PI)/2 + 0.5);
     */


    material.side = THREE.FrontSide;
    material.depthWrite = true;
    material.depthTest = true;

    return material;
}

function initNewGame() {

    //console.log("Initialising new game");
    for (k = 0; k < boardMaxHeight; k++)
    {
        if (levelMeshes[k] != null) {
            recycleGroup(levelMeshes[k]);
        }
        levelMeshes[k] = null;
        for (j = 0; j < boardDepth; j++)
            for (i = 0; i < boardWidth; i++)
                setLevelVal(i,k,j, 0);
    }
    prefilLevel = 0;
    viewBounce = 0;
    viewPan = 2000;

    //for (child in currentShape) scene.remove(child);
    recycleGroup(currentShape);
    genGuideCube();

    currentShape = newCube(true);

    scene.add(currentShape);
    endGameMode = false;
    targetScore = -1;
    currentScore = 0;
    onWindowResize();
}

function recycleGroup(groupObject) {

    if (groupObject) {
        do
        {
            var innerShape = groupObject.children.pop();
            if (!innerShape) return;

            if (!innerShape.materialIndex)
                continue;

            if (!cubeCache[innerShape.materialIndex])
                cubeCache[innerShape.materialIndex] = [];

            innerShape.visible = false;
            cubeCache[innerShape.materialIndex].push(innerShape);

        } while (true);

        scene.remove(groupObject);
    }

}

function getSmallCube(materialIndex) {
    if (!cubeCache[materialIndex])
        cubeCache[materialIndex] = [];

    if (cubeCache[materialIndex].length == 0) {
        var geometry = roundCube.clone();
        textureMapper(geometry, materialIndex, 25, 25, 5, 50);

        var newMesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        newMesh.matrixAutoUpdate = false;
        newMesh.rotationAutoUpdate = false;
        newMesh.frustumCulled = false;
        newMesh.materialIndex = materialIndex;
        //newMesh.renderDepth = 50;
    }
    else {
        newMesh = cubeCache[materialIndex].pop();
        newMesh.visible = true;
        newMesh.rotation.x = 0; newMesh.rotation.y = 0; newMesh.rotation.z = 0;
        newMesh.scale.x = 1; newMesh.scale.y = 1; newMesh.scale.z = 1;
    }
    return newMesh;
}
function newCube(withOverlayCube, shape, materialIndex, lpx,lpy,lpz, opx,opy,opz, csx,csy,csz) {

    var rand = (Math.random() * 100) | 0;

    var shapeNo = 0;
    for (; shapeNo < shapes.length-1; shapeNo++)
    {
        if (shapes[shapeNo].freq >= rand) break;
    }

    //shapeNo = 0 ;

    //if (splashMode)
    //{
    //	shapeNo = 7;
    //}

    var scale = 1;
    if (typeof shape == "undefined")
    {
        shape = new Object();
        shape.x = shapes[shapeNo].x;
        shape.y = shapes[shapeNo].y;
        shape.z = shapes[shapeNo].z;
        if (typeof csx != "undefined") shape.x = csx;
        if (typeof csy != "undefined") shape.y = csy;
        if (typeof csz != "undefined") shape.z = csz;
        scale = 0.00;
    }

    //var geometry = new THREE.BoxGeometry( 50 * shape.x, 50 * shape.y, 50 * shape.z, 1, 1, 1 );

    var newObject = new THREE.Object3D();

    //var geometryTotal = null;

    if (typeof materialIndex == "undefined")
        materialIndex = ((Math.random() * (materials.length / 2)) | 0);
    for (var i = 0; i < shape.x; i++)
        for (var j = 0; j < shape.y; j++)
            for (var k = 0; k < shape.z; k++) {
                var newMesh = getSmallCube(materialIndex);
                newMesh.position.x = 25 + 50 * i - 25 * shape.x;
                newMesh.position.y = 25 + 50 * j - 25 * shape.y;
                newMesh.position.z = 50 * k - 25 * shape.z + 4;
                newMesh.updateMatrix();
                newObject.add(newMesh);
            }

    if (withOverlayCube) {
        transparentOverlayCubes[materialIndex].scale.x = shape.x;
        transparentOverlayCubes[materialIndex].scale.y = shape.y;
        transparentOverlayCubes[materialIndex].scale.z = shape.z;
        newObject.add(transparentOverlayCubes[materialIndex]);
    }

    var cube = newObject;
    //var cube = new THREE.Mesh( geometryTotal, new THREE.MeshFaceMaterial(materials) );
    cube.materialIndex = materialIndex;

    cube.coord = new Object();
    cube.coord.x = (shape.x / 2 - 1) | 0;
//				if (splashMode)
//					cube.coord.x = (Math.random() * (boardWidth - ((shape.x / 2) | 0)) + ((shape.x / 2) | 0)) | 0;
    cube.coord.y = boardHeight + ((shape.y / 2) | 0);
    cube.coord.z = (shape.z / 2 - 1) | 0;
//				if (splashMode)
//					cube.coord.z = (Math.random() * (boardWidth - ((shape.z / 2) | 0)) + ((shape.z / 2) | 0)) | 0;
    cube.shape = shape;

    /*
     if (cube.coord.x + shape.x >= boardWidth)
     cube.coord.x = boardWidth - shape.x;
     if (cube.coord.z + shape.z >= boardDepth)
     cube.coord.z = boardDepth - shape.z;
     */

    cube.location = new Object();
    cube.location.x = ((cube.coord.x + shape.x) * 50) - (boardWidth * 50 / 2) - 25 * shape.x;
    cube.location.y = ((cube.coord.y + shape.y) * 50)                         - 25 * shape.y;
    cube.location.z = ((cube.coord.z + shape.z) * 50) - (boardDepth * 50 / 2) - 25 * shape.z;

    if (typeof lpx != "undefined") cube.location.x = lpx;
    if (typeof lpy != "undefined") cube.location.y = lpy;
    if (typeof lpz != "undefined") cube.location.z = lpz;

    cube.scale.x = scale;
    cube.scale.y = scale;
    cube.scale.z = scale;

    cube.castShadow = true;
    cube.receiveShadow = true;

    cube.offset = new Object();

    cube.offset.x = 0;
    cube.offset.y = 0;
    cube.offset.z = 0;

    if (typeof opx != "undefined") cube.offset.x = opx;
    if (typeof opy != "undefined") cube.offset.y = opy;
    if (typeof opz != "undefined") cube.offset.z = opz;

    cube.rotation.x = 0;
    cube.rotation.y = 0;
    cube.rotation.z = 0;

    cube.position.x = cube.location.x + cube.offset.x;
    cube.position.y = cube.location.y + cube.offset.y;
    cube.position.z = cube.location.z + cube.offset.z;

    cube.updateMatrixWorld();

    // This could be a problem!!!!
//    if (typeof lpx == "undefined" && shapeCollisionChecker(cube, 0,-25 * shape.y,0, cube.shape.x,cube.shape.y,cube.shape.z))
//        return newCube(shape, materialIndex, lpx,lpy,lpz, opx,opy,opz, csx,csy,csz);

    return cube;
}

function displaceShape(geometry, x, y, z)
{
    for (i = 0; i < geometry.vertices.length ; i++)
    {
        geometry.vertices[i].x += x;
        geometry.vertices[i].y += y;
        geometry.vertices[i].z += z;
    }
}


function scaleShape(geometry, x, y, z)
{
    for (i = 0; i < geometry.vertices.length ; i++)
    {
        geometry.vertices[i].x *= x;
        geometry.vertices[i].y *= y;
        geometry.vertices[i].z *= z;
    }
}

function setMaterialIndex(geometry, materialIndex)
{
    for (i = 0; i < geometry.faces.length ; i++)
    {
        geometry.faces[i].materialIndex = materialIndex;
    }
}

function textureMapper(geometry, materialIndex, offsetX, offsetY, offsetZ, scale)
{
    for (i = 0; i < geometry.faces.length ; i++)
    {
        var v1 = geometry.vertices[geometry.faces[i].a], v2 = geometry.vertices[geometry.faces[i].b], v3 = geometry.vertices[geometry.faces[i].c];

        var dx = Math.max(Math.abs(v1.x - v2.x), Math.abs(v1.x - v3.x));
        var dy = Math.max(Math.abs(v1.y - v2.y), Math.abs(v1.y - v3.y));
        var dz = Math.max(Math.abs(v1.z - v2.z), Math.abs(v1.z - v3.z));
        var min = Math.min(Math.min(dx,dy),dz);

        if (min == dz)
            geometry.faceVertexUvs[0][i] = [ new THREE.Vector2((v1.x + offsetX) / scale, (v1.y+offsetY) / scale),new THREE.Vector2((v2.x + offsetX) / scale, (v2.y + offsetY) / scale),new THREE.Vector2((v3.x + offsetX) / scale, (v3.y + offsetY) / scale) ];
        else if (min == dx)
            geometry.faceVertexUvs[0][i] = [ new THREE.Vector2((v1.y + offsetY) / scale, (v1.z+offsetZ) / scale),new THREE.Vector2((v2.y + offsetY) / scale, (v2.z + offsetZ) / scale),new THREE.Vector2((v3.y + offsetY) / scale, (v3.z + offsetZ) / scale) ];
        else if (min == dy)
            geometry.faceVertexUvs[0][i] = [ new THREE.Vector2((v1.x + offsetX) / scale, (v1.z+offsetZ) / scale),new THREE.Vector2((v2.x + offsetX) / scale, (v2.z + offsetZ) / scale),new THREE.Vector2((v3.x + offsetX) / scale, (v3.z + offsetZ) / scale) ];
    }

    if (materialIndex != null)
    {
        setMaterialIndex(geometry, materialIndex);
    }
}

function onWindowResize() {

    var width = getWindowWidth();
    var height = getWindowHeight();

    if (stereoMode)
        width = width / 2;

    //console.log("Width: " + getWindowWidth() + "  Height: " + getWindowHeight() + " ratio: " + getWindowWidth()/getWindowHeight());

    var coeffY = 0;

    if (isMobile && !stereoMode && !splashMode && getWindowWidth()/getWindowHeight() < 1.2)
    {
        if (width < 1000)
            coeffY = coeffY - (500 - width / 2);
    }

    renderer.setSize(getWindowWidth(), getWindowHeight());
    composer.setSize(getWindowWidth(), getWindowHeight());

    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );

    if (isMobile && !stereoMode && !splashMode)
       showButtons();
    else
        hideButtons();

    var xx = (3/4 + (width/(height + coeffY/2) - 3/4));
    if (stereoMode) xx = xx * 1.5;
    camera.left = -100 * (boardWidth/2 + 1) * xx;
    camera.right = 100 * (boardWidth/2 + 1) * xx;
    camera.top = 100 * (boardWidth/2 + 1);
    camera.bottom = -100 * (boardWidth/2 + 1) + coeffY;
    //var pos = new THREE.Vector3( scene.position.x, scene.position.y + coeffY, scene.position.z);
    //camera.lookAt(pos);
    camera.updateProjectionMatrix();

    if (stereoMode)
    {
        cameraR.left = -100 * (boardWidth/2 + 1) * xx;
        cameraR.right = 100 * (boardWidth/2 + 1) * xx;
        cameraR.top = 100 * (boardWidth/2 + 1);
        cameraR.bottom = -100 * (boardWidth/2 + 1);

        cameraR.updateProjectionMatrix();
    }

    splashCamera.left = -100 * (boardWidth/2 + 1) * xx;
    splashCamera.right = 100 * (boardWidth/2 + 1) * xx;
    var yy = 1;
    if (xx < 1.) yy = 1 / xx;
    splashCamera.top = 100 * (boardWidth/2 + 1) * yy;
    splashCamera.bottom = -100 * (boardWidth/2 + 1) * yy + coeffY;
    splashCamera.updateProjectionMatrix();
}

function animate() {

    requestAnimationFrame( animate );

    if (loadingMode)
    {
        currentShape.rotation.x += 0.14;
        currentShape.rotation.y += 0.13;
        currentShape.scale.x = currentShape.scale.x + (currentShape.targetScale - currentShape.scale.x)  / 3;
        currentShape.scale.y = currentShape.scale.y + (currentShape.targetScale - currentShape.scale.y)  / 3;
        currentShape.scale.z = currentShape.scale.z + (currentShape.targetScale - currentShape.scale.z)  / 3;
        currentShape.updateMatrix();
        currentShape.updateMatrixWorld();
        realTime_CameraMovement();
        onWindowResize();
        renderer.clear(true, true, true);
        renderer.setViewport(0, 0, getWindowWidth(), getWindowHeight());
        renderer.enableScissorTest(false);
        renderer.render( scene, camera );
        return;
    }

    realTime_game();
    render();
    rendererStats.update(renderer);
    stats.update();
}

function shapeCollisionChecker(currentZhape, ox,oy,oz, sx,sy,sz)
{
    var px = currentZhape.location.x + currentZhape.offset.x + ox;
    var py = currentZhape.location.y + currentZhape.offset.y + oy;
    var pz = currentZhape.location.z + currentZhape.offset.z + oz;

    var x = (((px + (boardWidth * 50 / 2) - 25 * sx) / 50) | 0) ;
    var y = (((py                         - 25 * sy) / 50) | 0) ;
    var z = (((pz + (boardDepth * 50 / 2) - 25 * sz) / 50) | 0) ;

    var collisionresult = false;
    for (i = 0; i < sx; i++)
        for (j = 0; j < sz; j++)
            for (k = 0; k < sy; k++)
            {
//							var cube =smallCube(x+i,y+k,z+j, currentZhape.material);
//							tempShapes.push(cube);
//							scene.add(cube);
                if (x+i < 0 || x+i >= boardWidth) return true;
                if (z+j < 0 || z+j >= boardDepth) return true;
                if (y+k < 0) return true;
                if (y+k < boardMaxHeight && levelVal(x+i,y+k,z+j) != 0) return true;
            }
    return collisionresult;
}

function writeShape(currentZhape)
{
    //console.log("Writing shape... " + currentZhape.shape.x + "," + currentZhape.shape.y + "," + currentZhape.shape.z);
    //for (child in currentZhape) scene.remove(child);
    recycleGroup(currentZhape);

    var px = currentZhape.location.x + currentZhape.offset.x;
    var py = currentZhape.location.y + currentZhape.offset.y;
    var pz = currentZhape.location.z + currentZhape.offset.z;

    var x = (((px + (boardWidth * 50 / 2) - 25 * currentZhape.shape.x) / 50) | 0) ;
    var y = (((py                         - 25 * currentZhape.shape.y) / 50) | 0) ;
    var z = (((pz + (boardDepth * 50 / 2) - 25 * currentZhape.shape.z) / 50) | 0) ;

    var exceedHightLimit = false;

    // If any problems, do not write shape
    for (k = 0; k < currentZhape.shape.y; k++)
    {
        for (i = 0; i < currentZhape.shape.x; i++)
            for (j = 0; j < currentZhape.shape.z; j++)
            {
                if (y+k >= boardHeight)
                    exceedHightLimit = true;

                if (!(y+k < 0 || y+k >= boardMaxHeight) &&
                    !(x+i < 0 || x+i >= boardWidth) &&
                    !(z+j < 0 || z+j >= boardDepth))
                {
                    if (levelVal(x+i,y+k,z+j) != 0)
                    {
                        //console.log("Overwritting detected :-( moving up");
                        currentZhape.offset.y += 50;
                        return writeShape(currentZhape);
                    }
                }
                else
                {
                    if (y+k < 0)
                    {
                        //console.log("Bad position detected moving up");
                        currentZhape.offset.y += 50;
                        return writeShape(currentZhape);
                    }
                    //else
                    //	console.log("Bad position detected :-(");

                    return;
                }
            }
    }

    for (k = 0; k < currentZhape.shape.y; k++)
    {
        for (i = 0; i < currentZhape.shape.x; i++)
            for (j = 0; j < currentZhape.shape.z; j++)
            {
                if (!(y+k < 0 || y+k >= boardMaxHeight) &&
                    !(x+i < 0 || x+i >= boardWidth) &&
                    !(z+j < 0 || z+j >= boardDepth))
                {
                    if (levelVal(x+i,y+k,z+j) == 0)
                    {
                        setLevelVal(x+i,y+k,z+j, currentZhape.materialIndex + 1);
                    }
                    //else
                    //{
                    //	console.log("Overwritting occured :-(");
                    //}
                }
            }
        if (levelMeshes[y+k] != null)
        {
            //console.log("Removing mesh for " + (y+k) + " " + levelMeshes[y+k].description);
            recycleGroup(levelMeshes[y+k]);
        }
        levelMeshes[y+k] = levelToMesh(y+k, y+k);
        scene.add(levelMeshes[y+k]);
        //console.log("Re-added mesh for " + (y+k) + " " + levelMeshes[y+k].description);
    }

    return exceedHightLimit;
    //console.log("Writing shape complete... " + currentZhape.shape.x + "," + currentZhape.shape.y + "," + currentZhape.shape.z);
}

function levelCompletionCheck() {
    if (toBeRemovedMeshes.length != 0 || fallingState) {
        levelCompletionCheckPending = true;
    } else {
        levelCompletionCheckPending = false;
        var dropCount = 0;
        for (y = 0; y < boardMaxHeight; y++) {
            var complete = true;
            for (x = 0; x < boardWidth; x++)
                for (z = 0; z < boardDepth; z++) {
                    if (complete && levelVal(x, y, z) == 0)
                        complete = false;
                }
            if (complete) {
                //console.log("Level " + y + " is complete");
                targetScore += 100;
                addScorePrompt(100, 0, levelMeshes[y].position.y, 0);
                levelsCompleted++;
                if (levelsCompleted == 1 && !splashMode)
                    ga('send', 'event', 'firstlayer');
                dropCount++;
                for (x = 0; x < boardWidth; x++)
                    for (z = 0; z < boardDepth; z++) {
                        setLevelVal(x, y, z, 0);
                    }
                //console.log("Removing mesh for level: " + y + " - " + levelMeshes[y].description);
                toBeRemovedMeshes.push(levelMeshes[y]);
                removalMethod = 2;//((Math.random() * 6) | 0) + 1;

                if (scheduleSound == "" || scheduleSound == "blop-low" || scheduleSound == "blop-med" || scheduleSound == "blop-high") {
                    scheduleSound = "free";
                    scheduleSoundDelay = 6;
                }
            }
            else if (dropCount != 0) {
                for (x = 0; x < boardWidth; x++)
                    for (z = 0; z < boardDepth; z++)
                        if (levelVal(x, y, z) != 0) {
                            setLevelVal(x, y - dropCount, z, levelVal(x, y, z));
                            setLevelVal(x, y, z, 0);
                        }
                if (levelMeshes[y] != null) {
                    //console.log("Droping mesh for: " + y + " - " + levelMeshes[y].description + " to " + (y-dropCount));
                    dropStart = tick;
                    levelMeshes[y].dropStartPosition = y * 50;
                    levelMeshes[y].dropEndPosition = (y - dropCount) * 50;
                    dropEnd = tick + 50;
                    levelMeshes[y - dropCount] = levelMeshes[y];
                    levelMeshes[y] = null;
                }
            }
            else if (dropCount == 0 && levelMeshes[y] != null) // Clear previous drop
            {
                levelMeshes[y].dropStartPosition = levelMeshes[y].dropEndPosition = y * 50;
            }
        }
        toBeRemovedMeshesCount = toBeRemovedMeshes.length;
    }
}

function soundToggle(doNotToggle)
{
    soundOff = (getCookie("sound") == "true");
    if (!doNotToggle)
        soundOff = !soundOff;
    setCookie("sound", soundOff);
    soundtoggle.style.display = "inline";
    if (soundOff)
        soundtoggle.src = "resources/images/buttons/sound-off.png";
    else
        soundtoggle.src = "resources/images/buttons/sound-on.png";
}

function setMoveX(offset)
{
    if (!currentShape.movingX
        && !shapeCollisionChecker(currentShape, offset,0,0, currentShape.shape.x,currentShape.shape.y,currentShape.shape.z)
        && !shapeCollisionChecker(currentShape, offset,-50,0, currentShape.shape.x,currentShape.shape.y,currentShape.shape.z))
    {
        currentShape.moveXTickStart = tick;
        currentShape.moveXTickEnd = tick - (tick % 10) + 10;
        currentShape.moveXStart = currentShape.location.x;
        currentShape.moveXTarget = currentShape.location.x + offset;
        currentShape.movingX = true;
    }
}

function setMoveZ(offset)
{
    if (!currentShape.movingZ
        && !shapeCollisionChecker(currentShape, 0,0,offset, currentShape.shape.x,currentShape.shape.y,currentShape.shape.z)
        && !shapeCollisionChecker(currentShape, 0,-50,offset, currentShape.shape.x,currentShape.shape.y,currentShape.shape.z))
    {
        currentShape.moveZTickStart = tick;
        currentShape.moveZTickEnd = tick - (tick % 10) + 10;
        currentShape.moveZStart = currentShape.location.z;
        currentShape.moveZTarget = currentShape.location.z + offset;
        currentShape.movingZ = true;
    }
}

function setMove(cameraDir, keyDir)
{
    if (pauseMode) pauseUnpause();

    var ang = keyDir + cameraDir;
    var x = -99 * Math.cos(ang);
    var y = -99 * Math.sin(ang)

    x = x - (x % 50);
    y = y - (y % 50);

    if (x != 0)
        setMoveX(x);
    if (y != 0)
        setMoveZ(y);

}

function splashOnClick() {
    if (pauseMode)
        pauseUnpause();
    else if (splashMode)
        startGame();
}

function showButtons() {
    if (isMobile && !splashMode) {
        scr_btn_exit.style.display =
            move_pad.style.display =
                pause_btn.style.display =
                    scr_btn_drop.style.display = "inline";
    }
    else
        hideButtons();
}

function hideButtons()
{
    scr_btn_exit.style.display =
        move_pad.style.display =
            pause_btn.style.display =
                scr_btn_drop.style.display = "none";

    if (splashMode && !stereoMode && !viewAngleIntroMode)
    {
        startMessage.style.display = "inline";
        controlKeys.style.display = "none";
    }
    else {
        startMessage.style.display = "none";
        if (currentScore < 100 && !viewAngleIntroMode && !stereoMode)
            controlKeys.style.display = "inline";
    }
}


function startGame() {
    splashMode = false;
    sharebuttons.style.display = "none";
    viewAngleIntroMode = 0;
    resetView();
    initNewGame();
    //splashImg.style.display = "none";
    splash_side_material.opacity = splash_uniforms.opacity.value = 0.;
    //likeButtons.style.display = "none";
    targetScore = -1;
    currentScore = 0;
    if (!stereoMode)
        showButtons();
}

function setBestScore(score) {
    if (bestScore < score) {
        if (bestScore == 0) {
            document.getElementsByName("scorebox")[0].style.top = "5%";
            document.getElementsByName("bestscore")[0].style.display = "inline";
        }
        bestScore = score;
        renderScore("b", bestScore);
        setCookie("bestScore", bestScore.toString());
    }
}

function setCookie(c_name,value,exdays)
{
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) +
        ((exdays==null) ? "" : ("; expires="+exdate.toUTCString()));
    document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name)
{
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++)
    {
        x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
        y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x==c_name)
        {
            return unescape(y);
        }
    }
}
function endGame() {
    if (splashMode)
        ga('send', 'event', 'score', 'computer-player', 'score', targetScore);
    else
        ga('send', 'event', 'score', 'human-player', 'score', targetScore);

    if (!splashMode)
    {
        setBestScore(currentScore);


        var gameName = "BlockTris/L1";
        var userName = "Nick";
        var gameScore = currentScore;
        /*
        scoreBoardService.saveUserScore(gameName,userName,gameScore,{
            success: function(object)
            {
                var game = JSON.parse(object);
                var result = game.app42.response.games.game;
                console.log("gameName is : " + result.name);
                var scoreList = result.scores.score;
                console.log("userName is : " + scoreList.userName);
                console.log("scoreId is : " + scoreList.scoreId);
                console.log("value is : " + scoreList.value);
            },
            error: function(error) {
            }
        });
        */
    }

    endGameMode = true;
    if (splashMode)
        endGameDelay = 36;
    else
        endGameDelay = 360;

    splashMode = true;
    splashModeTimeout = 1000;
    sharebuttons.style.display = "inline";
    hideButtons();
    if (!stereoMode)
        startMessage.style.display = "inline";
    controlKeys.style.display = "none";
    //splashImg.style.opacity = 1.0;
    splash_side_material.opacity = splash_uniforms.opacity.value = 1.0;
    //splashImg.style.display = "inline";
    //likeButtons.style.display = "inline";
    onWindowResize();
}

function exit() {
    if (!splashMode)
    {
        setBestScore(currentScore);
    }
    splashMode = true;
    splashModeTimeout = 1000;
    sharebuttons.style.display = "inline";
    hideButtons();
    if (!stereoMode)
        startMessage.style.display = "inline";
    controlKeys.style.display = "none";
    //splashImg.style.opacity = 1.0;
    splash_side_material.opacity = splash_uniforms.opacity.value = 1.;
    //splashImg.style.display = "inline";
    //likeButtons.style.display = "inline";
    targetScore = -1;
    currentScore = 0;
    onWindowResize();
    initNewGame();
}
function moveView(dx,dz, immediate)
{
    viewAngleXTarget += dx;
    viewAngleZTarget += dz;
    if (viewAngleXTarget < 0) viewAngleXTarget = 0;
    if (viewAngleZTarget < 0) viewAngleZTarget = 0;
    if (viewAngleXTarget > Math.PI / 3) viewAngleXTarget = Math.PI / 3;
    if (viewAngleZTarget > Math.PI / 2) viewAngleZTarget = Math.PI / 2;
    if (immediate)
    {
        viewAngleX = viewAngleXTarget;
        viewAngleZ = viewAngleZTarget;
    }
}
function resetView()
{
    viewAngleZTarget = viewAngleZ = 3 * Math.PI / 8;
    viewAngleXTarget = viewAngleX = 1 * Math.PI / 4;
}

function moveLeft()
{
    if (!currentShape.rotationDirection)
        setMove(viewAngleZ, - Math.PI / 2);
    //setMoveX(-50);
}
function moveRight()
{
    if (!currentShape.rotationDirection)
        setMove(viewAngleZ, Math.PI / 2);
    //setMoveX(50);
}
function moveUp()
{
    if (!currentShape.rotationDirection)
        setMove(viewAngleZ, 0);
    //setMoveZ(-50);
}
function moveDown()
{
    if (!currentShape.rotationDirection)
        setMove(viewAngleZ, Math.PI);
    //setMoveZ(50);
}

function drop()
{
    if (!endGameMode && !currentShape.movingY && dropDelay == 0 && prefilLevel == -1)
    {
        //console.log("Looking for a drop for current shape ");
        for (var ysearch = -800; ysearch < 800; ysearch+=25)
        {
            //console.log("Offset: " + ysearch);
            if (!shapeCollisionChecker(currentShape, 0,-currentShape.location.y-currentShape.offset.y + ysearch,0, currentShape.shape.x,currentShape.shape.y,currentShape.shape.z))
            {
                currentShape.moveYStart = currentShape.location.y;
                currentShape.moveYTarget = ysearch;
                //console.log("Free space found at: " + currentShape.moveYTarget);

                //if (currentShape.moveYTarget < -325)
                //	currentShape.moveYTarget += 50;

                //if (currentShape.moveYTarget < currentShape.moveYStart)
                currentShape.movingY = true;

                currentShape.moveYTickEnd = tick - (currentShape.moveYTarget - currentShape.moveYStart) / 25;

                // Synchronise movement
                if (currentShape.movingX && currentShape.moveXTickEnd < currentShape.moveYTickEnd)
                    currentShape.moveYTickEnd = currentShape.moveXTickEnd;
                if (currentShape.movingZ && currentShape.moveZTickEnd < currentShape.moveYTickEnd)
                    currentShape.moveYTickEnd = currentShape.moveZTickEnd;


                currentShape.moveYTickStart = tick;
                //targetScore += (ysearch / 50) * (currentShape.shape.x) * (currentShape.shape.z);

                //console.log("Drop found");
                if (scheduleSound == "")
                {
                    scheduleSound = "tap";
                    scheduleSoundDelay = 1;
                }

                break;
            }
        }
    }
}

function rotate()
{
    if (pauseMode) pauseUnpause();

    var fallOffset = 10;

    if (!currentShape.rotationDirection && !currentShape.movingX && !currentShape.movingY && !currentShape.movingZ)
    {
        var xr = (currentShape.shape.z + currentShape.shape.y) % 2;
        var yr = (currentShape.shape.x + currentShape.shape.z) % 2;
        var zr = (currentShape.shape.x + currentShape.shape.y) % 2;

        //console.log("Rotation request recieved.");

        currentShape.offYDir = -1;
        if (currentShape.position.x < 0) {currentShape.offXDir = 1;} else {currentShape.offXDir = -1;}
        if (currentShape.position.z < 0) {currentShape.offZDir = 1;} else {currentShape.offZDir = -1;}

        var xpossibleWithOffsetZ = 0;
        var xpossible = false;
        if (currentShape.shape.y != currentShape.shape.z)
        {
            outx: for (var offsetSearch = 0; offsetSearch <= 50*rotateMaxKick; offsetSearch+=50)
            {
                for (var zd = -1; zd <= 1; zd++)
                {
                    if (zd == 0) continue;
                    xpossibleWithOffsetZ = offsetSearch * zd;
                    xpossible = !shapeCollisionChecker(currentShape, 0, xr * 25 * currentShape.offXDir, xr * 25 * currentShape.offXDir + xpossibleWithOffsetZ, currentShape.shape.x,currentShape.shape.z,currentShape.shape.y)
                        && !shapeCollisionChecker(currentShape, 0,-fallOffset + xr * 25 * currentShape.offXDir, xr * 25 * currentShape.offXDir +  xpossibleWithOffsetZ, currentShape.shape.x,currentShape.shape.z,currentShape.shape.y);

                    if (xpossible)
                    {
                 //       console.log("X Possible with offset Z: " + xpossibleWithOffsetZ);
                        break outx;
                    }
                }

            }
        }
        var ypossibleWithOffsetX = 0;
        var ypossibleWithOffsetZ = 0;
        var ypossible = false;
        if (currentShape.shape.x != currentShape.shape.z)
        {
            outy: for (var offsetSearch = 0; offsetSearch <= 50*rotateMaxKick; offsetSearch+=50)
            {
                for (var xd = -1; xd <= 1; xd++)
                    for (var zd = -1;zd <= 1; zd++)
                    {
                        if (xd == 0 && zd == 0) continue;

                        ypossibleWithOffsetX = offsetSearch * xd;
                        ypossibleWithOffsetZ = offsetSearch * zd;
                        ypossible = !shapeCollisionChecker(currentShape, yr * 25 * currentShape.offYDir + ypossibleWithOffsetX, 0, yr * 25 * currentShape.offYDir + ypossibleWithOffsetZ, currentShape.shape.z,currentShape.shape.y,currentShape.shape.x)
                            && !shapeCollisionChecker(currentShape, yr*25 * currentShape.offYDir + ypossibleWithOffsetX,-fallOffset, yr*25 * currentShape.offYDir + ypossibleWithOffsetZ, currentShape.shape.z,currentShape.shape.y,currentShape.shape.x);
                        if (ypossible)
                        {
                   //         console.log("Y Possible with offset X: " + ypossibleWithOffsetX  + " Z:" + ypossibleWithOffsetZ);
                            break outy;
                        }

                    }
            }
        }

        var zpossibleWithOffsetX = 0;
        var zpossible = false;
        if (currentShape.shape.x != currentShape.shape.y)
        {
            outz: for (var offsetSearch = 0; offsetSearch <= 50*rotateMaxKick; offsetSearch+=50)
            {
                for (var xd = -1; xd <= 1; xd++) {
                    if (xd == 0) continue;
                    zpossibleWithOffsetX = xd * offsetSearch;

                    zpossible = !shapeCollisionChecker(currentShape, zr * 25 * currentShape.offZDir + zpossibleWithOffsetX, zr * 25 * currentShape.offZDir, 0, currentShape.shape.y, currentShape.shape.x, currentShape.shape.z)
                         && !shapeCollisionChecker(currentShape, zr * 25 * currentShape.offZDir + zpossibleWithOffsetX, -fallOffset + zr * 25 * currentShape.offZDir, 0, currentShape.shape.y, currentShape.shape.x, currentShape.shape.z);

                    if (zpossible) {
          //              console.log("Z Possible with offset X: " + zpossibleWithOffsetX);
                        break outz;
                    }
                }
            }
        }

        //console.log("Rotation possibles " + xpossible + " " + ypossible + " " + zpossible);
        //console.log("Rotation previous " + currentShape.previousRotationDirection);

        if (!currentShape.rotationDirection && xpossible && (currentShape.previousRotationDirection != 'X' || (!ypossible && !zpossible)))
        {
            currentShape.rotationDirection = 'X';
//            console.log("Rotation X decided");
            //console.log("Dimensions before: " + currentShape.shape.x + " " + currentShape.shape.y + " " + currentShape.shape.z);
            var t = currentShape.shape.z; currentShape.shape.z = currentShape.shape.y; currentShape.shape.y = t;
            //console.log("Dimensions after: " + currentShape.shape.x + " " + currentShape.shape.y + " " + currentShape.shape.z);
            currentShape.rotationStart = currentShape.rotation.x;
            currentShape.rotationTarget = currentShape.rotationStart + (Math.PI / 2) * currentShape.offXDir;
            currentShape.rotationStartPos = tick;
            currentShape.rotationTargetPos = tick + fallOffset;//- (tick % 25) + 25;
            currentShape.offsetStart = new Object();
            currentShape.offsetStart.x = currentShape.offset.x;
            currentShape.offsetStart.y = currentShape.offset.y;
            currentShape.offsetStart.z = currentShape.offset.z;
            currentShape.offsetTarget = new Object();
            if (xr == 1)
            {
                //console.log("Rotation with offset!");
                currentShape.offsetTarget.x = currentShape.offset.x;
                currentShape.offsetTarget.y = currentShape.offset.y + 25 * currentShape.offYDir;
                currentShape.offsetTarget.z = currentShape.offset.z + 25 * currentShape.offZDir + xpossibleWithOffsetZ;
            }
            else
            {
                currentShape.offsetTarget.x = currentShape.offset.x;
                currentShape.offsetTarget.y = currentShape.offset.y;
                currentShape.offsetTarget.z = currentShape.offset.z + xpossibleWithOffsetZ;
            }
            if (scheduleSound == "")
            {
                scheduleSound = "rotate";
                scheduleSoundDelay = 1;
            }
        }
        if (!currentShape.rotationDirection && ypossible && (currentShape.previousRotationDirection != 'Y' || (!xpossible && !zpossible)))
        {
            currentShape.rotationDirection = 'Y';
//            console.log("Rotation Y decided");
            //console.log("Dimensions before: " + currentShape.shape.x + " " + currentShape.shape.y + " " + currentShape.shape.z);
            var t = currentShape.shape.z; currentShape.shape.z = currentShape.shape.x; currentShape.shape.x = t;
            //console.log("Dimensions after: " + currentShape.shape.x + " " + currentShape.shape.y + " " + currentShape.shape.z);
            currentShape.rotationStart = currentShape.rotation.y;
            currentShape.rotationTarget = currentShape.rotationStart + (Math.PI / 2) * currentShape.offYDir;
            currentShape.rotationStartPos = tick;
            currentShape.rotationTargetPos = tick + fallOffset;//- (tick % 25) + 25;
            currentShape.offsetStart = new Object();
            currentShape.offsetStart.x = currentShape.offset.x;
            currentShape.offsetStart.y = currentShape.offset.y;
            currentShape.offsetStart.z = currentShape.offset.z;
            currentShape.offsetTarget = new Object();
            if (yr == 1)
            {
                //console.log("Rotation with offset!");
                currentShape.offsetTarget.x = currentShape.offset.x + 25 * currentShape.offXDir + ypossibleWithOffsetX;
                currentShape.offsetTarget.y = currentShape.offset.y + 0;
                currentShape.offsetTarget.z = currentShape.offset.z + 25 * currentShape.offZDir + ypossibleWithOffsetZ;
            }
            else
            {
                currentShape.offsetTarget.x = currentShape.offset.x + ypossibleWithOffsetX;
                currentShape.offsetTarget.y = currentShape.offset.y;
                currentShape.offsetTarget.z = currentShape.offset.z + ypossibleWithOffsetZ;
            }
            if (scheduleSound == "")
            {
                scheduleSound = "rotate";
                scheduleSoundDelay = 1;
            }
        }
        if (!currentShape.rotationDirection && zpossible && (currentShape.previousRotationDirection != 'Z' || (!xpossible && !ypossible)))
        {
            currentShape.rotationDirection = 'Z';
//            console.log("Rotation Z decided");
            //console.log("Dimensions before: " + currentShape.shape.x + " " + currentShape.shape.y + " " + currentShape.shape.z);
            var t = currentShape.shape.y; currentShape.shape.y = currentShape.shape.x; currentShape.shape.x = t;
            //console.log("Dimensions after: " + currentShape.shape.x + " " + currentShape.shape.y + " " + currentShape.shape.z);
            currentShape.rotationStart = currentShape.rotation.z;
            currentShape.rotationTarget = currentShape.rotationStart + (Math.PI / 2) * currentShape.offZDir;
            currentShape.rotationStartPos = tick;
            currentShape.rotationTargetPos = tick + fallOffset;//- (tick % 25) + 25;
            currentShape.offsetStart = new Object();
            currentShape.offsetStart.x = currentShape.offset.x;
            currentShape.offsetStart.y = currentShape.offset.y;
            currentShape.offsetStart.z = currentShape.offset.z;
            currentShape.offsetTarget = new Object();
            if (zr == 1)
            {
                //console.log("Rotation with offset!");
                currentShape.offsetTarget.x = currentShape.offset.x + 25 * currentShape.offXDir + zpossibleWithOffsetX;
                currentShape.offsetTarget.y = currentShape.offset.y + 25 * currentShape.offYDir;
                currentShape.offsetTarget.z = currentShape.offset.z + 0;
            }
            else
            {
                currentShape.offsetTarget.x = currentShape.offset.x + zpossibleWithOffsetX;
                currentShape.offsetTarget.y = currentShape.offset.y;
                currentShape.offsetTarget.z = currentShape.offset.z;
            }
            if (scheduleSound == "")
            {
                scheduleSound = "rotate";
                scheduleSoundDelay = 1;
            }
        }


    }
}

function renderScore(target, scoreToRender, percent) {
    var offset = 6;
    for (var exp = 0; exp < 6; exp++) {
        document.getElementsByName(target + (offset - exp))[0].src =
            "resources/images/counter/" + (( scoreToRender / (Math.pow(10, exp) ) % 10) | 0) + ".png";
        if ((exp != 0 && scoreToRender < Math.pow(10, exp)) || stereoMode) document.getElementsByName(target + (offset - exp))[0].style.display = "none"; else document.getElementsByName(target + (6 - exp))[0].style.display = "inline";
    }
    if (percent)
        document.getElementsByName("percent")[0].style.display = "inline";
    else
        document.getElementsByName("percent")[0].style.display = "none";
}

function realTime_CameraMovement() {
    if (viewAngleZ < viewAngleZTarget) viewAngleZ += .01;
    if (viewAngleZ > viewAngleZTarget) viewAngleZ -= .01;
    if (viewAngleX < viewAngleXTarget) viewAngleX += .01;
    if (viewAngleX > viewAngleXTarget) viewAngleX -= .01;

    if (lastViewZ != viewAngleZ || lastViewX != viewAngleX || viewBounce > 0 || viewPan > 0) {
        var offset = -.01;

        var bounceOffset = (viewBounceAmplitude / 4)  / (51 - viewBounce) * Math.sin(viewBounce/2);

        camera.position.x = Math.cos(viewAngleZ + (stereoMode ? -offset : 0)) * 200 + viewPan;
        camera.position.z = Math.sin(viewAngleZ + (stereoMode ? -offset : 0)) * Math.cos(viewAngleX) * 200 - viewPan;
        camera.position.y = Math.sin(viewAngleX) * 200 + 300 - bounceOffset;
        camera.lookAt(new THREE.Vector3( scene.position.x + viewPan, scene.position.y + 300 - bounceOffset, scene.position.z - viewPan));

        camera.updateMatrix();
        camera.updateMatrixWorld();

        directionalLight.position.set(camera.position.x, camera.position.y, camera.position.z);
        directionalLight.updateMatrix();
        directionalLight.updateMatrixWorld();

        /*
        pointLight.position.set(camera.position.normalize().x * 1000,
                camera.position.normalize().y * 100,
                camera.position.normalize().z * 1000);
                */

        cameraR.position.x = Math.cos(viewAngleZ + offset) * 200 + viewPan;
        cameraR.position.z = Math.sin(viewAngleZ + offset) * Math.cos(viewAngleX) * 200 - viewPan;
        cameraR.position.y = Math.sin(viewAngleX) * 200 + 300 - bounceOffset;
        cameraR.lookAt(new THREE.Vector3( scene.position.x + viewPan, scene.position.y + 300 - bounceOffset, scene.position.z - viewPan));

        lastViewZ = viewAngleZ;
        lastViewX = viewAngleX;

        if (viewBounce > 0)
            viewBounce--;

        if (viewPan > 0)
            viewPan = viewPan / 1.5;
    }


//				lightMesh.position.x = 700 * Math.cos( timer *1);
//				lightMesh.position.y = 700 * Math.sin( timer *3 ) / 4;
//				lightMesh.position.z = 700 * Math.sin( timer *2 );

    /*
     var p = (((viewAngleZ / (2 * Math.PI)) * 4) | 0);
     for (i = 3; i >= 0; i --)
     scene.remove(sides[i]);
     scene.add(sides[(p + 3) % 4]);
     scene.add(sides[(p + 0) % 4]);
     */
}

function realTime_LevelPreFillProcessor() {

    if (prefilLevel != -1 && tick >= nextPrefil) {

        for (i = 0; i < boardWidth; i++)
            for (j = 0; j < boardDepth; j++) {
                if (!((i == boardWidth-1 && j == boardDepth-1) || (prefilLevel == prefilMissingLevel && Math.random() > prefilMissingLevelPercentage))) {
                    setLevelVal(i, prefilLevel, j, ((Math.random() * 11) | 0) + 1);
                }
            }
        levelMeshes[prefilLevel] = levelToMesh(prefilLevel, prefilLevel);
        levelMeshes[prefilLevel].needsToGrow = true;
        for (var i=0; i < levelMeshes[prefilLevel].children.length; i++) {
            var child = levelMeshes[prefilLevel].children[i];
            child.scale.x = child.scale.y = child.scale.z = 0.0;
            child.position.x += 25; child.position.y += 25; child.position.z += 25;
            child.updateMatrix();
            child.updateMatrixWorld();
        }

        scene.add(levelMeshes[prefilLevel]);
        prefilLevel++;

        if (prefilLevel == prefillHeight)
        {
            prefilLevel = -1;
            // Recalculate AI decided position when prefill is complete
            if (splashMode) {
                decideTargetLocation(currentShape);
            }
        }
        nextPrefil = tick + 5;
    }

    for (var j=0; j < boardMaxHeight; j++) {
        if (levelMeshes[j] && levelMeshes[j].needsToGrow) {
            for (var i = 0; i < levelMeshes[j].children.length; i++) {
                var child = levelMeshes[j].children[i];
                if (child.scale.x < 1) {
                    child.scale.x += 0.1; child.scale.y += 0.1; child.scale.z += 0.1;
                    child.position.x -= 2.5; child.position.y -= 2.5; child.position.z -= 2.5;
                    if (child.scale.x > 1) {
                        child.scale.x = child.scale.y = child.scale.z = 1;
                        levelMeshes[j].needsToGrow = false;
                    }
                    child.updateMatrix();
                    child.updateMatrixWorld();
                }
            }
        }
    }

}

function realTime_Score() {
    if ((currentScore != targetScore || targetScore == -1)) {
        if (targetScore == -1)
            targetScore = 0;
        if (currentScore < targetScore)
            currentScore++;
        else if (currentScore > targetScore)
            currentScore--;

        if (currentScore > 100)
            controlKeys.style.display = "none";

        renderScore("s", currentScore);
    }
}

function realTime_SplashScreenControl() {
    if (splashMode && splashModeTimeout != 0) {
        splashModeTimeout--;
        if (splashModeTimeout < 100) {
            //splashImg.style.opacity = splashModeTimeout / 100;
            splash_side_material.opacity = splash_uniforms.opacity.value = splashModeTimeout / 100;
        }
        if (splashModeTimeout == 0) {
            //splashImg.style.display = "none";
            splash_side_material.opacity = splash_uniforms.opacity.value = 0.;
        }
    }

    if (viewAngleIntroMode > 0 && splashMode) {
        viewAngleIntroMode--;
        if (viewAngleIntroMode < 100) {
            viewAngleZTarget = 3 * Math.PI / 8;
            viewAngleXTarget = 1 * Math.PI / 4;
            reflectionEnabled = true;
        }
        if (viewAngleIntroMode >= 0 && viewAngleIntroMode < 50) {
            //splashImg.style.opacity = 1 - viewAngleIntroMode / 50;
            splash_side_material.opacity = splash_uniforms.opacity.value = 1 - viewAngleIntroMode / 50;
        }
        else {
            //splashImg.style.opacity = 0.0;
            splash_side_material.opacity = splash_uniforms.opacity.value = 0.0;
        }
    }

    // This is not splash mode control
    if (splashMode && viewAngleIntroMode < 0)
    {
//					viewAngleZTarget = Math.atan(trZ,trX) - Math.PI / 4;
        viewAngleXTarget = (Math.PI / 2) * (ai_targetYPos + 600) / 1200;
    }

    if (splashMode) {
        if (viewAngleIntroMode < 0) {
            startMessage.style.display = "none";
            startMessage.style.opacity = 0;
        } else {
            startMessage.style.display = "inline";
            startMessage.style.opacity = Math.sin(tick / 10) * 3 + 0.5;
            if (startMessage.style.opacity > 1) startMessage.style.opacity = 1;
            else if (startMessage.style.opacity < 0) startMessage.style.opacity = 0;
        }
    }
    else
    {
        startMessage.style.opacity = 0;
    }

    if (pauseMode)
    {
        var tickd = ((Date.now()) / 10) | 0
        pauseMessage.style.opacity = Math.sin(tickd / 10) * 3 + 0.5;
        if (pauseMessage.style.opacity > 1) pauseMessage.style.opacity = 1;
        else if (pauseMessage.style.opacity < 0) pauseMessage.style.opacity = 0;
    }
}

function realTime_EndGameDelay() {
    if (endGameMode) {
        endGameDelay--;
        if (endGameDelay <= 0 || (keyboard.pressed("a") || keyboard.pressed("ctrl") || keyboard.pressed("enter") || keyboard.pressed("space") || keyboard.pressed("left") || keyboard.pressed("right") || keyboard.pressed("down") || keyboard.pressed("up"))) {
            initNewGame();
        }
    }
}

function realTime_CompleteLevelAnimation() {
    if (toBeRemovedMeshes.length != 0) {
        var coef = (tick - dropStart) / (dropEnd - dropStart);
        //console.log("Recycling coef: " + coef);
        if (coef >= 0.6) {
            for (var y = 0; y < toBeRemovedMeshes.length; y++) {
                //console.log("Recycling toBeRemovedMesh: " + y);
                if (toBeRemovedMeshes[y])
                    recycleGroup(toBeRemovedMeshes[y]);
            }
            toBeRemovedMeshes = [];
            fallingState = true;
        }
       // var perform = (coef > (Math.random() / 2));
       // if (perform || disapearState == false) {
            for (var y = 0; y < toBeRemovedMeshes.length; y++) {

                if (removalMethod == 1) {
                    toBeRemovedMeshes[y].rotation.y += coef / 5;
                    toBeRemovedMeshes[y].position.x += coef * 50 * (y + 5);
                    toBeRemovedMeshes[y].updateMatrix();
                    toBeRemovedMeshes[y].updateMatrixWorld();
                }
                else if (removalMethod >= 2 && removalMethod <= 6) {

                    for (var i=0; i < toBeRemovedMeshes[y].children.length; i++) {
                        var child = toBeRemovedMeshes[y].children[i];
                        if (removalMethod == 2) {
                            child.position.x = child.position.x * (Math.abs(Math.sin(i+y)) / 4 + 1);
                            child.position.y = child.position.y - 1;
                            child.position.z = child.position.z * (Math.abs(Math.cos(i+y)) / 4 + 1);
                            child.rotation.x += (Math.abs(Math.cos(i+y)) / 4 + 1);
                        }
                        else if (removalMethod == 3)
                        {
                            child.position.x = child.position.x * (1.2);
                            child.position.z = child.position.z * (1.2);
                        }
                        else if (removalMethod == 4)
                        {
                            if (i % 2 == 0)
                                child.position.x += coef * 50 * (y + 5);
                            else
                                child.position.x -= coef * 50 * (y + 5);
                        }
                        else if (removalMethod == 5)
                        {
                            if (i % 2 == 0)
                                child.position.z += coef * 50 * (y + 5);
                            else
                                child.position.z -= coef * 50 * (y + 5);
                        }
                        else if (removalMethod == 6)
                        {
                            child.scale.x = child.scale.x  * .8;
                            child.scale.y = child.scale.y  * .8;
                            child.scale.z = child.scale.z  * .8;
                        }

                        child.updateMatrix();
                        child.updateMatrixWorld();
                    }
                }
         //   }

            lastRemoved = !lastRemoved;
        }
    }

    if (fallingState) {
        var coef = (((tick - dropStart) / (dropEnd - dropStart)) - 0.25) * (4.0 / 3.0);

        if (coef >= 1) {
            coef = 1;
            viewBounce = 50;
            viewBounceAmplitude = 0;
            for (var y = 0; y < boardMaxHeight; y++) {
                if (levelMeshes[y] != null && levelMeshes[y].dropStartPosition != null) {
                    for (var i=0; i < levelMeshes[y].children.length; i++)
                        viewBounceAmplitude += toBeRemovedMeshesCount;
                }
            }
            fallingState = false;
            if (levelCompletionCheckPending) // incase a shape was dropped while the animations were going
                levelCompletionCheck();
        }
        for (var y = 0; y < boardMaxHeight; y++) {
            if (levelMeshes[y] != null && levelMeshes[y].dropStartPosition != null && levelMeshes[y].dropStartPosition > levelMeshes[y].dropEndPosition) {
                levelMeshes[y].position.y = levelMeshes[y].dropStartPosition + (levelMeshes[y].dropEndPosition - levelMeshes[y].dropStartPosition) * coef * coef;
                levelMeshes[y].updateMatrix();
                levelMeshes[y].updateMatrixWorld();
            }
        }

    }

}

function pauseUnpause()
{
    if (!endGameMode && !splashMode) {
        pauseMode = !pauseMode;
        if (pauseMode) {
            pauseMessage.style.display = "inline";
            sharebuttons.style.display = "inline";
        }
        else {
            pauseMessage.style.display = "none";
            sharebuttons.style.display = "none";
        }
    }
}

function realTime_TempShapeRemover() {
    for (i = 0; i < tempShapes.length; i++) {
        scene.remove(tempShapes[i]);
    }
    tempShapes = [];
}

function realTime_KeyboardActions() {
    if ((keyboard.pressed("left") || keyboard.pressed("4")))
        moveLeft();
    if ((keyboard.pressed("right") || keyboard.pressed("6")))
        moveRight();
    if ((keyboard.pressed("up") || keyboard.pressed("8")))
        moveUp();
    if ((keyboard.pressed("down") || keyboard.pressed("2")))
        moveDown();

    if (keyboard.pressed("space") || keyboard.pressed("5") || keyboard.pressed("0") || keyboard.pressed("insert"))
    {
        rotate();
    }

    if (!splashMode && (keyboard.pressed("q") || keyboard.pressed("esc")) && prefilLevel == -1)
    {
        exit();
    }

    if (splashMode && (keyboard.pressed("a") || keyboard.pressed("ctrl") ||keyboard.pressed("enter") || keyboard.pressed("space") || keyboard.pressed("left") || keyboard.pressed("right") || keyboard.pressed("down") || keyboard.pressed("up")))
    {
        startGame();
    }

    if (keyboard.pressed("d") || keyboard.pressed("shift+left") || keyboard.pressed("shift+4"))
        moveView(0, -Math.PI / 100);
    else if (keyboard.pressed("g") || keyboard.pressed("shift+right") || keyboard.pressed("shift+6"))
        moveView(0, +Math.PI / 100);

    if (keyboard.pressed("r") || keyboard.pressed("shift+up") || keyboard.pressed("shift+8"))
        moveView(-Math.PI / 100,0);
    else if (keyboard.pressed("f") || keyboard.pressed("shift+down") || keyboard.pressed("shift+2"))
        moveView(Math.PI / 100,0);

    if ((keyboard.pressed("shift+up") && keyboard.pressed("shift+down")) || (keyboard.pressed("shift+left") && keyboard.pressed("shift+right")))
        resetView();

    if (dramaticLightDelay != 0) {
        dramaticLightDelay--;
    }
    if (keyboard.pressed("i") && dramaticLightDelay == 0) {
        dramaticLight = !dramaticLight;

        if (dramaticLight)
            shadow_light.position.set(500, 500, 500);
        else
            shadow_light.position.set(0, 700, 0);
        dramaticLightDelay = 10;
    }

    if (pauseDelay != 0) {
        pauseDelay--;
    }
    if (pauseDelay == 0 && !splashMode && (keyboard.pressed("p") || keyboard.pressed("pause")))
    {
        pauseUnpause();

        pauseDelay = 10;
    }

    if (stereoDelay != 0) {
        stereoDelay--;
    }
    if (!endGameMode && keyboard.pressed("z") && stereoDelay == 0) {
        //stereoMode = !(stereoMode && crossEyeMode);
        //crossEyeMode = !(stereoMode && crossEyeMode);
        stereoMode = !stereoMode;

        //console.log("Stereo Mode: " + stereoMode + " Cross Eye Mode: " + crossEyeMode);

        if (stereoMode)
            hideButtons();
        else if (!splashMode)
            showButtons();
        onWindowResize();
        lastViewX = -1000;
        stereoDelay = 10;
    }
    if (!endGameMode && keyboard.pressed("x")) {
        rendererStats.domElement.style.display = (rendererStats.domElement.style.display != "none") ? "none" : "inline";
    }

    if (!endGameMode && keyboard.pressed("c")) {
        stats.domElement.style.display = (stats.domElement.style.display != "none") ? "none" : "";
    }

    if (mobileDelay != 0)
    {
        mobileDelay --;
    }
    if (keyboard.pressed("m") && mobileDelay == 0)
    {
        mobileDelay = 100;
        isMobile = !isMobile;
        showButtons();
    }


    if (dropDelay != 0) {
        dropDelay--;
    }
    if (keyboard.pressed("a") || keyboard.pressed("ctrl") || keyboard.pressed("enter") || keyboard.pressed(".")) {
        drop();
    }
}

function realTime_AI() {
    var randAction = Math.random();
    if (ai_decisionMade && randAction < aiSpeed && splashMode && !endGameMode && toBeRemovedMeshes.length == 0 && !fallingState) {
        var y = (((currentShape.position.y - 25 * currentShape.shape.y) / 50) | 0);
        if (y < boardHeight && !(ai_shapeXSize == currentShape.shape.x && ai_shapeYSize == currentShape.shape.y && ai_shapeZSize == currentShape.shape.z)) {
            rotate();
            setMoveX(0 - currentShape.position.x);
            setMoveZ(0 - currentShape.position.z);
        }

        if (ai_shapeXSize == currentShape.shape.x && ai_shapeYSize == currentShape.shape.y && ai_shapeZSize == currentShape.shape.z) {
            if (ai_targetXPos == currentShape.position.x && ai_targetZPos == currentShape.position.z && ai_shapeXSize == currentShape.shape.x && ai_shapeYSize == currentShape.shape.y && ai_shapeZSize == currentShape.shape.z)
                drop();
            else {
                setMoveX(Math.max(-50, Math.min(50, ai_targetXPos - currentShape.position.x)));
                setMoveZ(Math.max(-50, Math.min(50, ai_targetZPos - currentShape.position.z)));
            }
        }
    }
}

function realTime_ShapeAppearanceAnimation() {
    if (currentShape.scale.x < 1) {
        currentShape.position.y += 700 - 700 * currentShape.scale.x;
        currentShape.scale.x += 0.1;
        currentShape.scale.y += 0.1;
        currentShape.scale.z += 0.1;
    }
    else {
        currentShape.scale.x = 1;
        currentShape.scale.y = 1;
        currentShape.scale.z = 1;

        if (!endGameMode)
            currentShape.location.y -= ((tick - lastTick) * (2 + levelsCompleted / 100) * (isMobile && !splashMode ? mobileDropSpeed : dropSpeed) ) | 0;
    }
}

function realTime_SoundSchedulerProcessor() {
    if (scheduleSoundDelay != 0)
        scheduleSoundDelay--;

    if (scheduleSound != "" && scheduleSoundDelay == 0) {
        if (!soundOff)
            createjs.Sound.play(scheduleSound);
        scheduleSound = "";
    }
}

function realTime_ShapeMovementProcessor() {
    if (currentShape && currentShape.movingX) {
        if (currentShape.moveXTickEnd <= tick) {
            currentShape.location.x = currentShape.moveXTarget;
            currentShape.movingX = false;
        }
        else {
            var tickDelta = (tick - currentShape.moveXTickStart) / (currentShape.moveXTickEnd - currentShape.moveXTickStart);

            currentShape.location.x = currentShape.moveXStart +
                (currentShape.moveXTarget - currentShape.moveXStart) *
                tickDelta;
        }
    }

    if (currentShape && currentShape.movingZ) {
        if (currentShape.moveZTickEnd <= tick) {
            currentShape.location.z = currentShape.moveZTarget;
            currentShape.movingZ = false;
        }
        else {
            var tickDelta = (tick - currentShape.moveZTickStart) / (currentShape.moveZTickEnd - currentShape.moveZTickStart);

            currentShape.location.z = currentShape.moveZStart +
                (currentShape.moveZTarget - currentShape.moveZStart) *
                tickDelta;
        }
    }

    if (currentShape && currentShape.movingY) {
        if (currentShape.moveYTickEnd <= tick) {
            currentShape.location.y = currentShape.moveYTarget;
            currentShape.movingY = false;
            dropDelay = 20;
        }
        else {
            var tickDelta = (tick - currentShape.moveYTickStart) / (currentShape.moveYTickEnd - currentShape.moveYTickStart);

            currentShape.location.y = currentShape.moveYStart +
                (currentShape.moveYTarget - currentShape.moveYStart) *
                (tickDelta * tickDelta);
        }
    }
}

function realTime_ShapeRotationProcessor() {
    if (currentShape && currentShape.rotationDirection) {
        if (currentShape.rotationTargetPos < tick) {
            //console.log("Rotation " + currentShape.rotationDirection + " completed!");

            currentShape2 = newCube(
                true,
                currentShape.shape, currentShape.materialIndex,
                currentShape.location.x, currentShape.location.y, currentShape.location.z,
                currentShape.offsetTarget.x, currentShape.offsetTarget.y, currentShape.offsetTarget.z,
                currentShape.shape.x, currentShape.shape.y, currentShape.shape.z);
            currentShape2.previousRotationDirection = currentShape.rotationDirection;

            recycleGroup(currentShape);
            scene.add(currentShape2);

            //console.log("Cloned shape dimentions " + currentShape.shape.x + " " + currentShape.shape.y + " " + currentShape.shape.z);
            currentShape = currentShape2;
        }
        else {
            var tickDelta = (tick - currentShape.rotationStartPos) / (currentShape.rotationTargetPos - currentShape.rotationStartPos);

            var angle = currentShape.rotationStart +
                (currentShape.rotationTarget - currentShape.rotationStart) *
                Math.sin(tickDelta * (Math.PI / 2));

            currentShape.offset.x = currentShape.offsetStart.x +
                (currentShape.offsetTarget.x - currentShape.offsetStart.x) *
                tickDelta;
            currentShape.offset.y = currentShape.offsetStart.y +
                (currentShape.offsetTarget.y - currentShape.offsetStart.y) *
                tickDelta;
            currentShape.offset.z = currentShape.offsetStart.z +
                (currentShape.offsetTarget.z - currentShape.offsetStart.z) *
                tickDelta;

            if (currentShape.rotationDirection == 'X')
                currentShape.rotation.x = angle;
            else if (currentShape.rotationDirection == 'Y')
                currentShape.rotation.y = angle;
            else if (currentShape.rotationDirection == 'Z')
                currentShape.rotation.z = angle;
        }
    }
}

function addScorePrompt(increment, promptx, prompty, promptz) {
// Score prompt
    var geometry = new THREE.PlaneGeometry(100, 100);
    var prompt = new THREE.Mesh(geometry, scoreMaterials[increment]);
    prompt.matrixAutoUpdate = false;
    prompt.rotationAutoUpdate = false;
    prompt.position.x = promptx;
    prompt.position.z = promptz;
    prompt.position.y = prompty;
    prompt.updateMatrix();
    prompt.updateMatrixWorld();
    prompts.push(prompt);
    scene.add(prompt);
}

function realTime_ShapeLandedCheckAndProcessor() {
    if (!endGameMode &&
        (!currentShape.rotationDirection) &&
        (shapeCollisionChecker(currentShape, 0, 0, 0, currentShape.shape.x, currentShape.shape.y, currentShape.shape.z)
            || currentShape.location.y + currentShape.offset.y - (currentShape.shape.y * 25) <= 0 )) {
        var y = (((currentShape.position.y - 25 * currentShape.shape.y) / 50) | 0);

        if (scheduleSound == "") {
            if (6 < currentShape.shape.z * currentShape.shape.x)
                scheduleSound = "blop-low";
            else if (3 < currentShape.shape.z * currentShape.shape.x)
                scheduleSound = "blop-med";
            else
                scheduleSound = "blop-high";
            scheduleSoundDelay = 6;
        }

        viewBounce = 50;
        viewBounceAmplitude = currentShape.shape.x * currentShape.shape.y * currentShape.shape.z;
        if (currentShape.moveYTarget)
            viewBounceAmplitude *= Math.abs(currentShape.moveYStart - currentShape.moveYTarget) / 50;

        //console.log("Before correction: " + currentShape.position.y);
        currentShape.location.y = (y * 50) + 25 * currentShape.shape.y;
        currentShape.offset.y = 0;
        currentShape.position.y = currentShape.location.y + currentShape.offset.y;
        //console.log("After correction: " + currentShape.position.y);

        // Jumping landings bug fix
        if (shapeCollisionChecker(currentShape, 0, 0, 0, currentShape.shape.x, currentShape.shape.y, currentShape.shape.z))
        {
            currentShape.location.y += 50;
            currentShape.offset.y = 0;
            currentShape.position.y = currentShape.location.y + currentShape.offset.y;
        }

        //window.setTimeout(function(){

            if (!landingProceduresRunning) {

                landingProceduresRunning = true;

                var pshape = currentShape;
                currentShapeP = newCube(true);

                var exceedHighLimit = writeShape(pshape);
                recycleGroup(pshape);

                if (currentShapeP == null || exceedHighLimit) {
                    // End Game
                    endGame();
                }
                else {
                    var increment = (currentShape.shape.x) * (currentShape.shape.z);
                    targetScore += increment;
                    addScorePrompt(increment, currentShape.position.x+50, currentShape.position.y + (currentShape.shape.y / 2 +1) * 50, currentShape.position.z+50);

                    currentShape = currentShapeP;
                    scene.add(currentShape);
                    //console.log("Shape has landed " + pshape.shape.x + "," + pshape.shape.y + "," + pshape.shape.z);
                    //writeShape(pshape);
                    //console.log("New shape is " + currentShape.shape.x + "," + currentShape.shape.y + "," + currentShape.shape.z);
                    //console.log("Running level completion check");
                    levelCompletionCheck();
                    if (splashMode) {
                        decideTargetLocation(currentShape);
                    }
                }

                landingProceduresRunning = false;
            }

        //}, 0);
    }
}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function realTime_scorePromptsAnimation() {
    var newPrompts = [];
    for (var i = 0; i < prompts.length; i++) {
        prompts[i].position.y += 4;
        prompts[i].rotation.y += .05;
        prompts[i].updateMatrix();
        prompts[i].updateMatrixWorld();
        if (prompts[i].rotation.y < Math.PI / 2) {
            newPrompts.push(prompts[i]);
        }
        else {
            scene.remove(prompts[i]);
        }
    }
    prompts = newPrompts;
}

function realTime_game()
{

    // If in game last render was over 2 seconds ago, enter pause mode
    if (!pauseMode && !splashMode && lastRenderTime && Date.now() - lastRenderTime > 2000)
        pauseUnpause();

    // If the last render was over .3 second ago, adjust start time to prevent shape skipping. If this runs 3 FPS anywhere, it will be stuck.
    else if (!pauseMode && lastRenderTime && Date.now() - lastRenderTime > 300)
        startTime += Date.now() - lastRenderTime;

    if (pauseMode)
        startTime += Date.now() - lastRenderTime;

    lastRenderTime = Date.now();

    currentShape.position.x = currentShape.location.x + currentShape.offset.x;
    currentShape.position.y = currentShape.location.y + currentShape.offset.y;
    currentShape.position.z = currentShape.location.z + currentShape.offset.z;
    currentShape.updateMatrixWorld();

    realTime_TempShapeRemover();
    realTime_SplashScreenControl();
    realTime_Score();
    realTime_EndGameDelay();
    realTime_LevelPreFillProcessor();
    realTime_ShapeAppearanceAnimation();
    realTime_CompleteLevelAnimation();
    realTime_scorePromptsAnimation();
    realTime_CameraMovement();
    realTime_AI();
    realTime_KeyboardActions();
    realTime_ShapeLandedCheckAndProcessor();
    realTime_ShapeMovementProcessor();
    realTime_ShapeRotationProcessor();
    realTime_SoundSchedulerProcessor();
    modifySplashText();

/*
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    projector.unprojectVector( vector, camera );
    raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

    var intersects = raycaster.intersectObjects( scene.children );


    for (var i = 0; i < intersects.length; i++)
    {
        var intersectedObject = intersects[i].object;
        if (intersectedObject.material && intersectedObject.material.index) {
            intersectedObject.material = materials_transparent[intersectedObject.material.index];
            //var position = intersects[i].intersectSphere.position;
            console.log("intersect:" + intersectedObject);// + " position " + position);
        }
    }
*/
    /*
     var INTERSECTED;
     if ( intersects.length > 0 ) {

     if ( INTERSECTED != intersects[ 0 ].object ) {

     if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

     INTERSECTED = intersects[ 0 ].object;
     INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
     INTERSECTED.material.emissive.setHex( 0xff0000 );

     }

     } else {

     if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

     INTERSECTED = null;

     }
     */
}

function adjustSceneForMirrorRendering() {
// HIDE or FLIP
    if (!scene.fliped) {
        scene.fliped = true;
        for (var c = 0; c < boardMaxHeight; c++) {
            if (levelMeshes[c]) {
                levelMeshes[c].position.y = -levelMeshes[c].position.y - 50;
                levelMeshes[c].updateMatrix();
                levelMeshes[c].updateMatrixWorld();
            }
        }
        for (var c = 0; c < toBeRemovedMeshes.length; c++)
        {
            toBeRemovedMeshes[c].position.y = -toBeRemovedMeshes[c].position.y - 50;
            toBeRemovedMeshes[c].updateMatrix();
            toBeRemovedMeshes[c].updateMatrixWorld();
        }
        currentShape.position.y = -currentShape.position.y;
        currentShape.rotation.set(-currentShape.rotation.x, -currentShape.rotation.y, -currentShape.rotation.z);
        currentShape.updateMatrix();
        currentShape.updateMatrixWorld();
        if (ground)
            ground.visible = true;
        guideCube.visible = false;

        directionalLight.position.set(directionalLight.position.x, -directionalLight.position.y, directionalLight.position.z);
        directionalLight.updateMatrix();
        directionalLight.updateMatrixWorld();
        shadow_light.disabled = true;
        renderer.shadowMapEnabled = false;
        for (var c = 0; c < prompts.length; c++) {
            prompts[c].visible = false;
        }

        if (currentShape.children[currentShape.children.length - 1])
            currentShape.children[currentShape.children.length - 1].visible = false;
    }
}
function restoreSceneAfterMirrorRendering() {
    if (scene.fliped) {
        scene.fliped = false;
        for (var c = 0; c < boardMaxHeight; c++) {
            if (levelMeshes[c]) {
                levelMeshes[c].position.y = -(levelMeshes[c].position.y + 50);
                levelMeshes[c].updateMatrix();
                levelMeshes[c].updateMatrixWorld();
            }
        }
        for (var c = 0; c < toBeRemovedMeshes.length; c++)
        {
            toBeRemovedMeshes[c].position.y = -toBeRemovedMeshes[c].position.y - 50;
            toBeRemovedMeshes[c].updateMatrix();
            toBeRemovedMeshes[c].updateMatrixWorld();
        }
        currentShape.position.y = -currentShape.position.y;
        currentShape.rotation.set(-currentShape.rotation.x, -currentShape.rotation.y, -currentShape.rotation.z);
        currentShape.updateMatrix();
        currentShape.updateMatrixWorld();

        if (ground)
            ground.visible = false;
        guideCube.visible = true;

        directionalLight.position.set(directionalLight.position.x, -directionalLight.position.y, directionalLight.position.z);
        directionalLight.updateMatrix();
        directionalLight.updateMatrixWorld();

        shadow_light.disabled = false;
        if (shadowEnabled)
            renderer.shadowMapEnabled = true;

        for (var c = 0; c < prompts.length; c++) {
            prompts[c].visible = true;
        }
        if (currentShape.children[currentShape.children.length - 1])
            currentShape.children[currentShape.children.length - 1].visible = true;
    }
}

function render() {

    lastTick = tick;
    //tick = tick + 1.0;
    tick = ((Date.now()-startTime) / 20) | 0;
    if (uniforms) {
        uniforms.time.value += 1;
        uniforms.score.value = currentScore;
    }

    var width = getWindowWidth();
    var height = getWindowHeight();

    if (splash_uniforms) {
        splash_uniforms.iGlobalTime.value +=.05;
    }

    if (!stereoMode) {
        renderer.setViewport(0, 0, width, height);
        renderer.enableScissorTest(false);
        renderer.clear(true, false, false);
        if (!reflectionEnabled && ground)
            ground.visible = true;
        renderer.render( scene, camera );
        if (reflectionEnabled) {
            adjustSceneForMirrorRendering();
            renderer.render(scene, camera);
            restoreSceneAfterMirrorRendering();
        }
        if (splash_uniforms.opacity.value != 0.)
            renderer.render( splashScene, splashCamera );
    }
    else
    {
        width = width / 2;
        renderer.setViewport( 0, 0, width, height);
        renderer.setScissor( 0, 0, width, height);
        renderer.enableScissorTest ( true );
        renderer.clear(true, false, false);
        if (!reflectionEnabled && ground)
            ground.visible = true;
        renderer.render( scene, camera );
        if (reflectionEnabled) {
            adjustSceneForMirrorRendering();
            renderer.render(scene, camera);
        }
        if (splash_uniforms.opacity.value != 0.)
            renderer.render( splashScene, splashCamera );

        renderer.setViewport( width, 0, width, height);
        renderer.setScissor( width, 0, width, height);
        renderer.enableScissorTest ( true );
        renderer.clear(true, true, true);
        renderer.render( scene, cameraR );
        if (reflectionEnabled) {
            restoreSceneAfterMirrorRendering();
            renderer.render(scene, cameraR);
        }
        if (splash_uniforms.opacity.value != 0.)
            renderer.render( splashScene, splashCamera );
    }

   if (!pauseMode) {
       frameCount++;
       if (!renderTimePeriod) {
           renderTimePeriod = Date.now();
       }
       else if (Date.now() - renderTimePeriod > 2000) {
           var fps = (frameCount / (Date.now() - renderTimePeriod)) * 1000;
           frameCount = 0;
           renderTimePeriod = Date.now();
           //console.log("Current frame rate: " + fps);
           if (fps < minFrameRate) {
               if (reflectionEnabled) {
                   reflectionEnabled = false;
                   //console.log("Frame rate too low, disabling reflection");
               }
               else if (shadowEnabled) {
                   shadowEnabled = false;
                   renderer.shadowMapEnabled = false;
                   shadow_light.castShadow = false;
                   //console.log("Frame rate too low, disabling shadows");
               }
           }

           if (fps > goodFrameRate) {
               if (!shadowEnabled) {
                   shadowEnabled = true;
                   renderer.shadowMapEnabled = true;
                   shadow_light.castShadow = true;
                   //console.log("Frame rate recovered, enabling shadows");
               }
               else if (!reflectionEnabled && (viewAngleIntroMode < 100)) {
                   reflectionEnabled = true;
                   //console.log("Frame rate recovered, enabling reflection");
               }
           }
       }
   }
   else {
       renderTimePeriod = null;
       frameCount = 0;
   }

}