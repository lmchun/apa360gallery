/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // let sceneContainer = document.createElement('ul');
  // sceneContainer.classList.add('scenes');
  // sceneContainer.appendChild(sceneListElement);

  // for (i=0; i<data.scenes.length; i++){
  //   let sceneLinkHref = document.createElement('a');
  //   let sceneId = data.scenes[i].id
  //   let sceneName = data.scenes[i].name
  //   let sceneLi  = document.createElement('li');

  //   sceneLinkHref.classList.add('scene')
  //   sceneLinkHref.setAttribute("data-id", sceneId)
  //   sceneLi.classList.add("text")
  //   sceneLi.innerHTML = `${sceneName}`
  // }


  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      // urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
       urlPrefix + "/" + data.id + ".jpg",
      // { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" }
      );
    /* var geometry = new Marzipano.EquirectGeometry(data.levels);
     var geometry = new Marzipano.CubeGeometry(data.levels);*/
    var geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

    /* var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
     var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);*/
    // Create view.
    var limiter = Marzipano.RectilinearView.limit.traditional(1024, 100*Math.PI/180);
    var view = new Marzipano.RectilinearView({ yaw: Math.PI }, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Create link hotspots.
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });

    });

    // Create info hotspots.
    // data.infoHotspots.forEach(function(hotspot) {
    //   var element = createInfoHotspotElement(hotspot);
    //   scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    // });
    
    //create iframe hotspots, grab each element for each element get this property
    // for(i=0; i<data.length; i++){
    // // data.forEach(function(hotspot){
    //   console.log(data.scenes[i]);
    //   //for each item in array if there is an iFrame Spot, then call the function
    //   if(data.iframespot != null ){
    //   var element = createiFrameSpotElement(hotspot);
    //   scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    //   }
    //   // });
    // }
    
    //   //create iframeselect hotspots.
    //   data.iframeselect.forEach(function(hotspot){
    //     var element = createiFrameSelectElement(hotspot);
    //     scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
  
    //   });
    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  // Set handler for autorotate toggle.
  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  document.addEventListener("DOMContentLoaded", function() {
  //   scenes.forEach(function(scene) {
  //     var el = document.querySelector('#sceneList');
  //     console.log(el);
  //   // rest of the code that uses sceneList
  // });
    /*
    el.addEventListener('click', function() {
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    console.log(el)
    })
    */
  });
  // Set handler for scene switch.
  
  /*
  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    el.addEventListener('click', function() {
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });
*/
  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function createLinkHotspotElement(hotspot) {
    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    // Add click event handler.
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  function createiFrameSpotElement(hotspot){

    // // Create wrapper element to hold icon and tooltip.
    // var wrapper = document.createElement('div');
    // wrapper.classList.add('hotspot');
    // wrapper.classList.add('video-hotspot');

    // // Create hotspot/tooltip header.
    // var header = document.createElement('div');
    // header.classList.add('video-hotspot-header');
    // wrapper.appendChild(header)
   /*
    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);
 */
    // create Video Interview Div
    let videoInterview = document.createElement('div')
    videoInterview.id = 'videoInterview'
    // header.appendChild(header)

    // create iframespot div
    let videoLocationDiv = document.createElement('div')
    videoLocationDiv.id = 'iframespot'
    videoInterview.appendChild(videoLocationDiv)

    let videoLocationDivMessage = document.createElement('div')
    videoLocationDivMessage.classList.add('message')
    videoLocationDiv.appendChild(videoLocationDivMessage)
    videoLocationDivMessage.innerText = hotspot.message

    /* TODO add the text to div message */

    // Create text element.
    // var text = document.createElement('div');
    // text.classList.add('info-hotspot-text');
    // text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    // wrapper.appendChild(header);
    // wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    // var modal = document.createElement('div');
    // modal.innerHTML = wrapper.innerHTML;
    // modal.classList.add('info-hotspot-modal');
    // document.body.appendChild(modal);

    // var toggle = function() {
    //   wrapper.classList.toggle('visible');
    //   modal.classList.toggle('visible');
    // };

    // Show content when hotspot is clicked.
    // wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    // modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    // stopTouchAndScrollEventPropagation(wrapper);

    return videoInterview;
  }

  function createiFrameSelectElement (hotspot){
     // create iframeselect
     let videoUISelection = document.createElement('ul')
     videoUISelection.id = ('iframeselect')
     //for loop to create the li based on the length of the array
     for(i=0; i<hotspot.speakers.length; i++){
      let speakerSelection = document.createElement('li')
      speakerSelection.setAttribute("data-source", hotspot.speakerID)
      speakerSelection.innerText = hotspot.speakers
    }
    return videoUISelection;
 
  }
  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel',
                      'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  // Display the initial scene.
  switchScene(scenes[0]);

})();

// Get the hotspot container for scene.
var container = scene.hotspotContainer();

// Create hotspot with different sources.
container.createHotspot(document.getElementById('iframespot'), { yaw: 0.0335, pitch: -0.102 },
  { perspective: { radius: 1640, extraTransforms: "rotateX(5deg)" }});
container.createHotspot(document.getElementById('iframeselect'), { yaw: -0.35, pitch: -0.239 });

// HTML sources.
var hotspotHtml = {
  youtube: '<iframe id="youtube" width="1280" height="480" src="https://www.youtube.com/embed/a4YjKmsXyds?rel=0&amp;controls=0&amp;showinfo=0&amp;" frameborder="0" allowfullscreen></iframe>',
  youtubeWithControls: '<iframe id="youtubeWithControls" width="1280" height="480" src="https://www.youtube.com/embed/a4YjKmsXyds?rel=0&amp;controls=1&amp;showinfo=0" frameborder="0" allowfullscreen></iframe>',
  googleMaps: '<iframe id="googlemaps" width="1280" height="480" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9487.563699358636!2d-9.211273541013671!3d38.69789785451112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1ecf578f4d20e9%3A0x530952e38d140ae6!2sDigisfera+-+Fotografia+e+Inform%C3%A1tica%2C+Lda!5e1!3m2!1spt-PT!2spt!4v1429956174252" width="600" height="450" frameborder="0" style="border:0"></iframe>',
  koloreyes: '<iframe id="koloreyes" src="https://eyes.kolor.com/video/i/kolor/54ef73cbaaa38b2943c8a7d72a4b00e6" type="text/html" width="1280" height="480" frameborder="0" scrolling="no" allowfullscreen="true"> </iframe>'
};

// Switch sources when clicked.
function switchHotspot(id) {
  var wrapper = document.getElementById('iframespot');
  wrapper.innerHTML = hotspotHtml[id];
}


// ///////////////
// // Create hotspot with different sources.
// container.createHotspot(document.getElementById('iframespot'), { yaw: 0.0335, pitch: -0.102 },
//   { perspective: { radius: 1640, extraTransforms: "rotateX(5deg)" }});
// container.createHotspot(document.getElementById('iframeselect'), { yaw: -0.35, pitch: -0.239 });

// // HTML sources.
// var hotspotHtml = {
//   TSamuelu: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0"s allowfullscreen></iframe>',
//   KLatif: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
//   CDang: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
//   CSvetvilas: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
//   AWong: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
//   MAhmed: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
//   CSu: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
//   JVaj: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
//   LFu: '<iframe width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
//   googleMaps: '<iframe id="googlemaps" width="1280" height="480" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9487.563699358636!2d-9.211273541013671!3d38.69789785451112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1ecf578f4d20e9%3A0x530952e38d140ae6!2sDigisfera+-+Fotografia+e+Inform%C3%A1tica%2C+Lda!5e1!3m2!1spt-PT!2spt!4v1429956174252" width="600" height="450" frameborder="0" style="border:0"></iframe>',
  
// };

//UI included OLD <iframe id="youtubeWithControls" width="1280" height="720" src="https://www.youtube.com/embed/gaA7RAy5rYg" frameborder="0" allowfullscreen></iframe>

// Switch sources when clicked.
function switchHotspot(id) {
  var wrapper = document.getElementById('iframespot');
  wrapper.innerHTML = hotspotHtml[id];
}

var switchElements = document.querySelectorAll('[data-source]');
for (var i = 0; i < switchElements.length; i++) {
  var element = switchElements[i];
  addClickEvent(element);
}

function addClickEvent(element) {
  element.addEventListener('click', function() {
    switchHotspot(element.getAttribute('data-source'));
  });
}
//////////////////////////////////////////////////////////////////



container.createHotspot(document.querySelector("#tooltip"), { yaw: 4.55, pitch: 0.102});
//////////////////////////////////////////////////////////////////




