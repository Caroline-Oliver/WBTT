
	var selectedElement, offset, transform;
var lastElement;
const venueShapes = [];
	function makeDraggable(evt) {
  var svg = evt.target;
  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mousemove', drag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);
  

		
		var count = 1;
		function addShape(shape) {
			evt.preventDefault();
			var nodeCopy = document.getElementById(shape).cloneNode(true);
				nodeCopy.id="new"+shape+count;
			count++;
			nodeCopy.setAttribute('class','draggable')
		document.getElementById('view').appendChild(nodeCopy)
		venueShapes.push([nodeCopy.id,"","","","","","",""])
		console.log(venueShapes); 	
		  		
		}
 function drag(evt) {
  if (selectedElement) {
    evt.preventDefault();
	var coord = getMousePosition(evt);
    transform.setTranslate(coord.x - offset.x, coord.y - offset.y);
  }
}
		function getMousePosition(evt) {
  var CTM = svg.getScreenCTM();
  return {
    x: (evt.clientX - CTM.e) / CTM.a,
    y: (evt.clientY - CTM.f) / CTM.d
  };
}
  function endDrag(evt) {
  }
	
function startDrag(evt) {
  if (evt.target.classList.contains('draggable')) {
    //showPanel(evt);
  showHalfPanel(evt);
    lastElement = evt.target;
    selectedElement = evt.target;
    current = lastElement.getAttribute('id')
   for (var i =0; i <venueShapes.length; i++){
	console.log("at "+i+" "+venueShapes[i][0])
	    if (venueShapes[i][0] == current){
	     //document.getElementById('venueName').value = venueShapes[i][0];
			document.getElementById('sectionName').value = venueShapes[i][0];
			document.getElementById('venueConfiguration').value = venueShapes[i][1];
			document.getElementById('hasSeats').value = venueShapes[i][2];
			document.getElementById('sectionCapacity').value = venueShapes[i][3];
			document.getElementById('sectionWeight').value = venueShapes[i][4];
			document.getElementById('rowDecrement').value = venueShapes[i][5];
			document.getElementById('TextLabel').value = venueShapes[i][6];
	}
    }
    offset = getMousePosition(evt);
    // Get all the transforms currently on this element
    var transforms = selectedElement.transform.baseVal;
    // Ensure the first transform is a translate transform
    if (transforms.length === 0 ||
        transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
      // Create an transform that translates by (0, 0)
      var translate = svg.createSVGTransform();
      translate.setTranslate(0, 0);
      // Add the translation to the front of the transforms list
      selectedElement.transform.baseVal.insertItemBefore(translate, 0);
    }
    // Get initial translation amount
    transform = transforms.getItem(0);
    offset.x -= transform.matrix.e;
    offset.y -= transform.matrix.f;
  }
	else{
		var name = evt.target.getAttribute('id')
		  addShape(name);
		  showHalfPanel(evt);
		  
	}
}
		function endDrag(evt) {
  selectedElement = null;
			}
}

function update() {
	//this will add to the associative array keys, and create all the default values
	//when it's draggable it exists, and the values should be filled in
	console.log(lastElement)
	console.log(lastElement.getAttribute('id'))
	current = lastElement.getAttribute('id')
	for (var i =0; i <venueShapes.length; i++){
		console.log("at "+i+" "+venueShapes[i][0])
		if (venueShapes[i][0] == current){
			//venueShapes[i][0] = document.getElementById('venueName').value;
			venueShapes[i][0] = document.getElementById('sectionName').value;
			venueShapes[i][1] = document.getElementById('venueConfiguration').value;
			venueShapes[i][2] = document.getElementById('hasSeats').value;
			venueShapes[i][3] = document.getElementById('sectionCapacity').value;
			venueShapes[i][4] = document.getElementById('sectionWeight').value;
			venueShapes[i][5] = document.getElementById('rowDecrement').value;
			venueShapes[i][6] = document.getElementById('TextLabel').value;
		}
	}
	console.log(venueShapes); 
	
}

const halfPanelIDs = ["labelOne","venueName","labelTwo","sectionName","labelThree","venueConfiguration","labelFour","hasSeats","submit"];
const secondHalfPanelIDs = ["labelFive","sectionCapacity","labelSix","sectionWeight","labelSeven","rowDecrement","labelEight","TextLabel"];

function showHalfPanel(evt) {
	halfPanelIDs.forEach(makeVisible);	
	var shape = evt.target;
	console.log(shape.getAttribute('id'));
	var labelOne = document.getElementById('venueName');
	labelOne.value = shape.getAttribute('id');
}

function makeVisible(element) {
	console.log(element)
	document.getElementById(element).style.visibility = "visible";
}

function showPanel(evt){
	halfPanelIDs.forEach(makeVisible);
	secondHalfPanelIDs.forEach(makeVisible);	
	showHalfPanel(evt);
}

var seatSelector = document.getElementById('hasSeats');
seatSelector.setAttribute('value','NO');
//const selectElement = document.querySelector(".ice-cream");

seatSelector.addEventListener("change", (event) => {
  
  if (event.target.value == "Yes"){
	console.log("YES");  
  	secondHalfPanelIDs.forEach(makeVisible);
  }
});

//const selectElement = document.querySelector(".ice-cream");


//selectElement.addEventListener("change", (event) => {
//  const result = document.querySelector(".result");
//  result.textContent = `You like ${event.target.value}`;
//});
