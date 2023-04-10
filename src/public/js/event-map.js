
//Need to rethink my listeners. Only populate when selecting new section
//Fix corners
//Auto generate seats (not hard coded)
//add stage page
//fix old modal, add right panel, event info
//base seating on calculated values
//mobile functionality, add class @media for svg elements
//This needs to pull all sections, get tickets per section, get sold tickets, make appropriate vaiables
//const sectionRowCol = [];
//const sectionSold = [];
//Make associative array?


/*/

const decrement = 2;
const seats = [];
var rows = 5;
var cols = 12;
var index = 1;
const shape = []

for (var i=0; i < rows; i++){
    
	var temp1 = [];
	var temp2 = [];
	for (var j = 0; j < cols-i*decrement; j++){
		temp1.push(index); //this is the seat number
		index++;
		temp2.push("row "+(i+1)+" col "+(j+1));
	}
	seats.push(temp1);
	shape.push(temp2);
}

print(seats);
print(shape);

var input = shape[4][3]
var test = input.split(" ");
var x = Number(test[1])-1
print(input+" is ticket number "+(Number(x*cols-decrement*(x*x-x)/2)+Number(test[3])))
*/


//Ideally these should be pulled from DB, but we can hard code if easier
var top_center_left_upper = [4, 10]
var vertical_sections = [4, 12]
const cartArray = []

//This MUST be pulled from DB
//var currentSectionSold = [1, 2, 9, 10, 16, 17, 19, 35]
var currentSectionSold = []
var seatingPolygon = document.getElementById('seating-section');
var sections = document.getElementsByClassName('seats');
for (var i = 0; i < sections.length; i++) {
	sections[i].addEventListener('click', function () { generate(event.target.getAttribute('id')) }, false);
}

//Spacing and alignment
var xOffset = 12.5;
var yOffset = 12.5;
var soldIndex = 0;

//Corrections for window sizing

function arenaResize(resizeArena) {
  if (resizeArena.matches) { // If media query matches
    document.getElementById('arena-inner-svg').setAttribute('viewBox', '0 0 500 400');
  } else {
	  //document.get
   document.getElementById('arena-inner-svg').setAttribute('viewBox', '-25 125 550 100');
  }
}

var resizeArena = window.matchMedia("(min-width: 992px)")
arenaResize(resizeArena) // Call listener function at run time
resizeArena.addListener(arenaResize) // Attach listener function on state changes

function generate(id) {
	currentSectionSold = []
	getSoldTickets(1, id)
		.catch((err) => {
			console.log(err.message);
		})
		.then((result) => {
			result.forEach( (ticket) => {
				currentSectionSold.push(Number(ticket.seat));
				//console.log(ticket.seat);
			})
			//console.log(currentSectionSold+" this is what is in the array");
			var addButton = document.getElementById('add-button');
			addButton.setAttribute('onClick','addToCart()');
			var floorSeats = document.getElementById('floor-seat-div');
			floorSeats.innerHTML = '';
		
			var seatingString = "";
			seatingPolygon.setAttribute('viewBox', '-22 -50 350 275')
			seatingPolygon.innerHTML = '<rect width="300" height="100" class="section-svg"/>'
			//Might be best to create a map here, using the section/id as the key and an array of the rows, cols, and available seats(array)
			if (id.includes("center-far")) {
				seatingPolygon.innerHTML = '<rect width="240" height="80" class="section-svg"/>'
				seatingPolygon.setAttribute('viewBox', '0 -50 350 275')
				xOffset = 10;
				yOffset = 10;
				if (id.includes("left")) {
					seatingString = '<g transform="rotate(-90 170 35)">' + seatingPolygon.innerHTML
				}
				else {
					seatingString = '<g transform="rotate(90 125 90)">' + seatingPolygon.innerHTML
				}
				for (var i = vertical_sections[0]; i > 0; i--) {
					for (var j = 0; j < vertical_sections[1]; j++) {
						if (currentSectionSold.includes(soldIndex)) {
							seatingString += '<circle cx="' + xOffset + '" cy="' + yOffset + '" r="7" id="'+id+'_row-' + (i) + '-seat-' + (j + 1) + '" class="sold"></circle>';
						}
						else {
							seatingString += '<circle cx="' + xOffset + '" cy="' + yOffset + '" r="7" id="'+id+'_row-' + (i) + '-seat-' + (j + 1) + '" class="tickets available"></circle>';
						}
						xOffset += 20;
						soldIndex++;
					}
					xOffset = 10;
					yOffset += 20;
				}
				xOffset = 12.5;
				yOffset = 12.5;
				soldIndex = 0;
				seatingPolygon.innerHTML = seatingString + '<text x="110" y="120">Court</text></g>'
			}
			else if (id.includes("far")) {
				if (id.includes("lower")) {
					seatingPolygon.setAttribute('viewBox', '0 -20 350 275')
					if (id == "top-far-left-lower") {
						seatingString = '<g transform="rotate(-45 175 100)">';
					}

					else if (id == "top-far-right-lower") {
						seatingString = '<g transform="rotate(45 175 100)">';
					}

					else if (id == "bottom-far-left-lower") {
						seatingString = '<g transform="rotate(-135 175 100)">';
					}

					else if (id == "bottom-far-right-lower") {
						seatingString = '<g transform="rotate(135 175 100)">';
					}
					seatingString += '<polygon points="285,60 56,60 172,175 285,60" class="section-svg"/>'
					xOffset = 81;
					yOffset = 70;
					for (i = 5; i > 0; i--) {
						for (j = 0; j < (i * 2); j++) {
							if (currentSectionSold.includes(soldIndex)) {
								seatingString += '<circle cx="' + xOffset + '" cy="' + yOffset + '" r="7" id="'+id+'_row-' + (i) + '-seat-' + (j + 1) + '" class="sold"></circle>';
							}
							else {
								seatingString += '<circle cx="' + xOffset + '" cy="' + yOffset + '" r="7" id="'+id+'_row-' + (i) + '-seat-' + (j + 1) + '" class="tickets available"></circle>';
							} xOffset += 20;
							soldIndex++;
						}
						xOffset = 201 - i * 20;
						yOffset += 20;
					}
					xOffset = 12.5;
					yOffset = 12.5;
					soldIndex = 0;
					seatingPolygon.innerHTML = seatingString + '</g>'
				}
				else {
					seatingPolygon.setAttribute('viewBox', '0 -20 350 275')
					if (id == "top-far-left-upper") {
						seatingString = '<g transform="rotate(-45 175 100)">';
					}

					else if (id == "top-far-right-upper") {
						seatingString = '<g transform="rotate(45 175 100)">';
					}

					else if (id == "bottom-far-left-upper") {
						seatingString = '<g transform="rotate(-135 175 100)">';
					}

					else if (id == "bottom-far-right-upper") {
						seatingString = '<g transform="rotate(135 175 100)">';
					}
					seatingString += '<polygon points="58,57.75 100,141 242,141 284,57.75 52,57.75" class="section-svg">' + seatingPolygon.innerHTML + '</polygon>';
					xOffset = 81;
					yOffset = 70;
					for (i = 4; i > 0; i--) {
						for (j = 0; j < 6 + i; j++) {
							if (currentSectionSold.includes(soldIndex)) {
								seatingString += '<circle cx="' + xOffset + '" cy="' + yOffset + '" r="8" id="'+id+'_row-' + (i) + '-seat-' + (j + 1) + '" class="sold"></circle>';
							}
							else {
								seatingString += '<circle cx="' + xOffset + '" cy="' + yOffset + '" r="8" id="'+id+'_row-' + (i) + '-seat-' + (j + 1) + '" class="tickets available"></circle>';
							} xOffset += 20;
							soldIndex++;
						}
						xOffset = 131 - i * 10;
						yOffset += 20;
					}
					xOffset = 12.5;
					yOffset = 12.5;
					soldIndex = 0;

					seatingPolygon.innerHTML = seatingString + '</g>';
				}
			}

			else {
				if (id.includes("bottom")) {
					seatingString = '<g transform="rotate(-180 125 50)">'
				}
				else {
					seatingString = '<g>'
				}
				seatingPolygon.setAttribute('viewBox', '-45 -50 350 200')
				seatingString += '<rect width="250" height="100" class="section-svg"/>'
				for (var i = top_center_left_upper[0]; i > 0; i--) {
					//console.log(i);
					for (var j = 0; j < top_center_left_upper[1]; j++) {
						if (currentSectionSold.includes(soldIndex)) {
							seatingString += '<circle cx="' + xOffset + '" cy="' + yOffset + '" r="8.5" id="'+id+'_row-' + (i) + '-seat-' + (j + 1) + '" class="sold"></circle>';
						}
						else {
							seatingString += '<circle cx="' + xOffset + '" cy="' + yOffset + '" r="8.5" id="'+id+'_row-' + (i) + '-seat-' + (j + 1) + '" class="tickets available"></circle>';
						} xOffset += 25;
						soldIndex++;
					}
					xOffset = 12.5;
					yOffset += 25;
				}
				xOffset = 12.5;
				yOffset = 12.5;
				soldIndex = 0;
				seatingPolygon.innerHTML = seatingString + '<text x="110" y="130">Court</text></g>'
			}
			var sectionTickets = document.getElementsByClassName('tickets');
			for (var i = 0; i < sectionTickets.length; i++) {
				//console.log(sectionTickets[i].getAttribute('id'));
				sectionTickets[i].addEventListener('click', function () { updateTicket(event.target) }, false);
			}
		});
}

function updateTicket(target) {
	var itemClasses = target.classList;
	if (itemClasses.contains('tickets')) {
		target.setAttribute('class', 'in-cart');
	}
	else {
		target.setAttribute('class', 'tickets available');
		//call function to change hold status of ticket?
		//updateCartList();
	}
}

//cart needs more work
function addToCart() {
	
	const cartSeats = document.getElementsByClassName('in-cart');
	if (cartSeats.length != 0) {
		//update cart list will call backend AddToCart
		updateCartList()
		startTimer();
		const holdSeats = document.getElementsByClassName('hold');
		const sections = [];
		const seats = [];
		for (var i=0; i<holdSeats.length; i++){
			var temp = holdSeats[i].getAttribute('id').split("_");
			sections.push(temp[0]);
			var seatIndex;
			var cols;
			var decrement;
			var calc = true;
			var rows;
			switch(temp[0]){
				case("bottom-far-left-lower"):
				case("bottom-far-right-lower"):
				case("top-far-left-lower"):
				case("top-far-right-lower"):
					cols = 10;
					decrement = 2;
					rows = (Number(input[1])-4)*Number(-1)
					break;
				case("bottom-far-left-upper"):
				case("bottom-far-right-upper"):
				case("top-far-left-upper"):
				case("top-far-right-upper"):
					cols = 10;
					decrement = 1;
					rows = (Number(input[1])-5)*Number(-1)
					break;
				case("center-far-left-lower"):
				case("center-far-left-upper"):
				case("center-far-right-lower"):
				case("center-far-right-upper"):
					cols = 12;
					decrement = 0;
					rows = (Number(input[1])-4)*Number(-1)
					break;
				case("floor"):
					cols = 1;
					decrement = 0;
					rows = 1;
					calc = false;
					break;
				default:
					cols = 10;
					decrement = 0;
					rows = (Number(input[1])-4)*Number(-1)
					break;
			}
			
			console.log("cols is "+cols);
			console.log("decrement is "+decrement);
			var input = temp[1].split("-");
			console.log("input is "+input);
			
			console.log("rows is "+rows);
			seatIndex = (Number(rows*cols-decrement*(rows*rows-rows)/2)+Number(input[3])-1)
			console.log(input+" is ticket number "+seatIndex);
			if (calc){	  
				seats.push(seatIndex);
			}
			else{
				seats.push(Number(-1));
			}
			
		}
		console.log(window.location.href);
		currentURL = window.location.href;
		const urlArray = currentURL.split('/');
		console.log(urlArray[urlArray.length-1]);
		sendToCart(sections, seats, urlArray[urlArray.lastIndexOf]);
	}
}

function updateCartList(){
	const cartSeats = document.getElementsByClassName('in-cart');
	
	var tempCart = document.getElementById('rightPanelCart');
		//Do we want this as a table?
		//Shouldn't rely on array, should be pulling from cart
		var cartString = "<p>";
		var count = cartSeats.length;
		for (var index = 0; index < count; index++) {
			cartSeats[0].setAttribute('class', 'sold hold');			
		}
		const holdSeats = document.getElementsByClassName('hold');
		count = holdSeats.length;
		for (var index = 0; index < count; index++) {
			seatId = holdSeats[index].getAttribute('id');
			const seatIdArr = seatId.split("_")
			console.log(seatId)
			console.log(seatIdArr)
			cartString += seatIdArr[0]+' '+seatIdArr[1] + '<br>';
		}
	tempCart.innerHTML = cartString + '</p>';
}

function sendToCart(sections, seats, eventIndex){
	
}

//add function to grab needed data

function getSoldTickets(event_id, venue_section_name) {
	var result;
	return new Promise((resolve, reject) => {
		$.ajax({
			url: `/api/getTickets/${event_id}/${venue_section_name}`,
			dataType: 'json',
			type: 'get',
			processData: false,
			success: function (data) {
				resolve(data);
			},
			error: function (error) {
				reject(error);
			}
		});
	});
	return result;
}

function startTimer(){
	window.clearInterval(time); 
	s=0;
	m=5;
	var outerDiv = document.getElementById('timer-div');
	var timeLabel = document.getElementById('time-text');
	var timeNumberLabel = document.getElementById('time');
	var timeWarningLabel = document.getElementById('time-warning');
	timeWarningLabel.setAttribute('class','');
	timeLabel.setAttribute('class','');
	timeNumberLabel.setAttribute('class','');
	
	outerDiv.removeAttribute('hidden');
	timeNumberLabel.innerHTML = '05:00';
	time=window.setInterval('dispTime()',1000);
	
}

var s=0;
var m=5;
var time;


function dispTime(){
	var timeLabel = document.getElementById('time-text');
	var timeNumberLabel = document.getElementById('time');
	var timeWarningLabel = document.getElementById('time-warning');
	
	s--;
	if(s<0){ 
		s=59;
		m--;
	}
	else{
		if(m<=0){
			m=0;
		} // end if  m ==60
	}// end if else s < 59
	if(s==0 && m==0){
		window.clearInterval(time);
		timeWarningLabel.setAttribute('class','');
		timeLabel.setAttribute('class','');
		timeNumberLabel.setAttribute('class','');
		timeNumberLabel.innerHTML = '';
		timeWarningLabel.innerHTML = '';
		timeLabel.innerHTML = 'Your tickets have been removed from your cart';
		return;
	}
	else if((s==0 && m==1)){
		timeWarningLabel.setAttribute('class','warning-label');
		timeLabel.setAttribute('class','warning-label');
		timeNumberLabel.setAttribute('class','warning-label');
		timeWarningLabel.innerHTML = 'Warning: your tickets will soon be removed from your cart. Press add to cart button for more time';
	}
// end of calculation for next display
// Format the output by adding 0 if it is single digit //
	if(s<10){var s1='0' + s;}
	else{var s1=s;}
	if(m<10){var m1='0' + m;}
	else{var m1=m;}
	// Display the output //
	str=  m1 +':' + s1 ;
	timeNumberLabel.innerHTML=str;
	// Calculate the stop watch // 
	
	
	

}
