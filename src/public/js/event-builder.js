
	var selectedElement, offset, transform;
var lastElement;
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
    for (var i =0; i <venueShapes.length; i++){
	if (venueShapes[i][0] == lastElement){
	     document.getElementById('venueName').value = venueShape[i][0];
			document.getElementById('sectionName').value = venueShape[i][1];
			document.getElementById('venueConfiguration').value = venueShape[i][2];
			document.getElementById('hasSeats').value = venueShape[i][3];
			document.getElementById('sectionCapacity').value = venueShape[i][4];
			document.getElementById('sectionWeight').value = venueShape[i][5];
			document.getElementById('rowDecrement').value = venueShape[i][6];
			document.getElementById('TextLabel').value = venueShape[i][7];
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
		  venueShapes.push([name,"","","","","","","",""])
		console.log(venueShapes); 
    
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
	console.log(lastElement.getAttribute('Id'))
	current = lastElement.getAttribute('Id')
	for (var i =0; i <venueShapes.length; i++){
		if (venueShapes[i][0] == current){
			venueShape[i][0] = document.getElementById('venueName').value;
			venueShape[i][1] = document.getElementById('sectionName').value;
			venueShape[i][2] = document.getElementById('venueConfiguration').value;
			venueShape[i][3] = document.getElementById('hasSeats').value;
			venueShape[i][4] = document.getElementById('sectionCapacity').value;
			venueShape[i][5] = document.getElementById('sectionWeight').value;
			venueShape[i][6] = document.getElementById('rowDecrement').value;
			venueShape[i][7] = document.getElementById('TextLabel').value;
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
const venueShapes = []

//selectElement.addEventListener("change", (event) => {
//  const result = document.querySelector(".result");
//  result.textContent = `You like ${event.target.value}`;
//});
