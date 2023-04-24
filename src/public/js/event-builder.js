
	var selectedElement, offset, transform;

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
    selectedElement = evt.target;
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
		  addShape(evt.target.getAttribute('id'));
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
}

const halfPanelIDs = ["labelOne","venueName","labelTwo","sectionName","labelThree","venueConfiguration","labelFour","hasSeats","submit"];
const secondHalfPanelIDs = ["labelFive","sectionCapacity","labelSix","sectionName","labelSeven","rowDecrement","labelEight","TextLabel"];

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

const seatSelector = document.getElementById('hasSeats');
seatSelector.setAttribute('value','NO');
//const selectElement = document.querySelector(".ice-cream");

seatSelector.addEventListener("change", (event) => {
  
  if (event.target.value == "Yes"){
	console.log(result);  
  	secondHalfPanelIDs.forEach(makeVisible);
  }
});
