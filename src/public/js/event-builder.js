
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
			if(shape == "textlabel"){
				nodeCopy.setAttribute('class','draggable stage-label');

			}
			else{
			nodeCopy.setAttribute('class','draggable')
			}
		document.getElementById('view').appendChild(nodeCopy)
		venueShapes.push([nodeCopy.id,"","","","","",""])
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
	    	console.log(venueShapes[i]);
	     //document.getElementById('venueName').value = venueShapes[i][0];
		document.getElementById('sectionName').value = venueShapes[i][0];
		document.getElementById('hasSeats').value = venueShapes[i][1];
		document.getElementById('sectionCapacity').value = venueShapes[i][2];
		document.getElementById('sectionWeight').value = venueShapes[i][3];
		document.getElementById('rowDecrement').value = venueShapes[i][4];
		document.getElementById('TextLabel').value = venueShapes[i][5];
		if(document.getElementById('hasSeats').value =='yes'){
			secondHalfPanelIDs.forEach(makeVisible);
		}
		else{
			secondHalfPanelIDs.forEach(makeHidden);
		}
	        textFields = document.getElementsByClassName('stage-label');
		    
		for (var i = 0; i<textFields.length; i++){
			console.log("THIS-->"+textFields[i].getAttribute('id'));
	    	if (textFields[i] == current){
	    		makeVisible('TextLabel');
			makeVisible('labelEight');
			break;
	        }
	   	makeHidden('TextLabel');
		
		}
	        break;      
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
	console.log("last"+lastElement)
	console.log("last-id"+lastElement.getAttribute('id'))
	current = lastElement.getAttribute('id')
	for (var i =0; i <venueShapes.length; i++){
		console.log("at "+i+" "+venueShapes[i][0])
		if (venueShapes[i][0] == current){
			//venueShapes[i][0] = document.getElementById('venueName').value;
			venueShapes[i][0] = document.getElementById('sectionName').value;
			venueShapes[i][1] = document.getElementById('hasSeats').value;
			venueShapes[i][2] = document.getElementById('sectionCapacity').value;
			venueShapes[i][3] = document.getElementById('sectionWeight').value;
			venueShapes[i][4] = document.getElementById('rowDecrement').value;
			venueShapes[i][5] = document.getElementById('TextLabel').value;
			lastElement.setAttribute('id',venueShapes[i][0]);
			break;
		}
	}
	console.log(venueShapes); 
	
}

const halfPanelIDs = ["labelTwo","sectionName","labelFour","hasSeats","submit","remove"];
const secondHalfPanelIDs = ["labelFive","sectionCapacity","labelSix","sectionWeight","labelSeven","rowDecrement","labelEight"];

function showHalfPanel(evt) {
	halfPanelIDs.forEach(makeVisible);	
	var shape = evt.target;
	console.log(shape.getAttribute('id'));
	var labelOne = document.getElementById('sectionName');
	labelOne.value = shape.getAttribute('id');
}

function makeVisible(element) {
	console.log(element)
	document.getElementById(element).style.visibility = "visible";
}

function makeHidden(element) {
	console.log(element)
	document.getElementById(element).style.visibility = "hidden";
}

function showPanel(evt){
	halfPanelIDs.forEach(makeVisible);
	secondHalfPanelIDs.forEach(makeVisible);	
	showHalfPanel(evt);
}

function removeSection() {
	var id = document.getElementById('sectionName').value;
	const section = document.getElementById(id);
	section.remove();
	document.getElementById('sectionName').value = '';
	document.getElementById('hasSeats').value = 'defaultOption';
	
}

var seatSelector = document.getElementById('hasSeats');
//seatSelector.value'NO';
//const selectElement = document.querySelector(".ice-cream");

seatSelector.addEventListener("change", (event) => {
  
  if (event.target.value == "yes"){
	secondHalfPanelIDs.forEach(makeVisible);
  }
  else{
	  secondHalfPanelIDs.forEach(makeHidden);
  }
});

//const selectElement = document.querySelector(".ice-cream");


//selectElement.addEventListener("change", (event) => {
//  const result = document.querySelector(".result");
//  result.textContent = `You like ${event.target.value}`;
//});
