
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

 //Ideally these should be pulled from DB, but we can hard code if easier
var top_center_left_upper = [4,10]
var vertical_sections = [4,12]
const cartArray = []

//This MUST be pulled from DB
var top_center_left_upper_sold = [1,2,9,10,16,17,19,35]
var seatingPolygon = document.getElementById('seating-section');
var sections = document.getElementsByClassName('seats');
for (var i = 0; i < sections.length; i++){
	sections[i].addEventListener('click',function(){generate(event.target.getAttribute('id'))},false);
}

//Spacing and alignment
var xOffset = 12.5;
var yOffset  = 12.5;
var soldIndex = 0;

function generate(id){
	var seatingString = "";
	seatingPolygon.setAttribute('viewBox','-22 -50 350 275')
	seatingPolygon.innerHTML = '<rect width="300" height="100" class="section-svg"/>'
	//Might be best to create a map here, using the section/id as the key and an array of the rows, cols, and available seats(array)
	if (id.includes("center-far")){
		seatingPolygon.innerHTML = '<rect width="240" height="80" class="section-svg"/>'
		seatingPolygon.setAttribute('viewBox','0 -50 350 275')
		xOffset = 10;
		yOffset  = 10;
		if (id.includes("left")){
			seatingString = '<g transform="rotate(-90 170 35)">'+seatingPolygon.innerHTML
		}		
		else{
			seatingString = '<g transform="rotate(90 125 90)">'+seatingPolygon.innerHTML
		}
		for (var i = vertical_sections[0]; i > 0; i--){
			for (var j = 0; j<vertical_sections[1]; j++){
				if (top_center_left_upper_sold.includes(soldIndex)){
					seatingString += '<circle cx="'+xOffset +'" cy="'+yOffset +'" r="7" id="row-'+(i)+'-seat-'+(j+1)+'" class="sold"></circle>';
				}
				else{
					seatingString+='<circle cx="'+xOffset +'" cy="'+yOffset +'" r="7" id="row-'+(i)+'-seat-'+(j+1)+'" class="tickets available"></circle>';	
				}
				xOffset += 20;
				soldIndex++;
			}
			xOffset = 10;
			yOffset  += 20;
		}
		xOffset = 12.5;
		yOffset  = 12.5;
		soldIndex = 0;
		seatingPolygon.innerHTML = seatingString+'<text x="110" y="120">Court</text></g>'
	}
	else if (id.includes("far")){
		if (id.includes("lower")){
			seatingPolygon.setAttribute('viewBox','0 -20 350 275')
			if (id == "top-far-left-lower"){
				seatingString = '<g transform="rotate(-45 175 100)">';
			}

			else if (id == "top-far-right-lower"){
				seatingString = '<g transform="rotate(45 175 100)">';
			}

			else if (id == "bottom-far-left-lower"){
				seatingString = '<g transform="rotate(-135 175 100)">';
			}

			else if (id == "bottom-far-right-lower"){
				seatingString = '<g transform="rotate(135 175 100)">';
			}
			seatingString += '<polygon points="285,60 56,60 172,175 285,60" class="section-svg"/>'
			xOffset = 81;
			yOffset  = 70;
			for (i = 5; i>0; i--){
				for (j=0; j<(i*2); j++){
					if (top_center_left_upper_sold.includes(soldIndex)){
						seatingString += '<circle cx="'+xOffset +'" cy="'+yOffset +'" r="7" id="row-'+(i)+'-seat-'+(j+1)+'" class="sold"></circle>';
					}
					else{
						seatingString+='<circle cx="'+xOffset +'" cy="'+yOffset +'" r="7" id="row-'+(i)+'-seat-'+(j+1)+'" class="tickets available"></circle>';						
					}xOffset += 20;
					soldIndex++;
				}
				xOffset = 201-i*20;
				yOffset  += 20;
			}
			xOffset = 12.5;
			yOffset  = 12.5;
			soldIndex = 0;
			seatingPolygon.innerHTML = seatingString+'</g>'
		}
		else{
			seatingPolygon.setAttribute('viewBox','0 -20 350 275')
			if (id == "top-far-left-upper"){
				seatingString = '<g transform="rotate(-45 175 100)">';
			}

			else if (id == "top-far-right-upper"){
				seatingString = '<g transform="rotate(45 175 100)">';
			}

			else if (id == "bottom-far-left-upper"){
				seatingString = '<g transform="rotate(-135 175 100)">';
			}

			else if (id == "bottom-far-right-upper"){
				seatingString = '<g transform="rotate(135 175 100)">';
			}
			seatingString += '<polygon points="58,57.75 100,141 242,141 284,57.75 52,57.75" class="section-svg">'+seatingPolygon.innerHTML+'</polygon>';
			xOffset = 81;
			yOffset  = 70;
			for (i = 4; i>0; i--){
				for (j=0; j<6+i; j++){
					if (top_center_left_upper_sold.includes(soldIndex)){
						seatingString += '<circle cx="'+xOffset +'" cy="'+yOffset +'" r="8" id="row-'+(i)+'-seat-'+(j+1)+'" class="sold"></circle>';
					}
					else{
						seatingString+='<circle cx="'+xOffset +'" cy="'+yOffset +'" r="8" id="row-'+(i)+'-seat-'+(j+1)+'" class="tickets available"></circle>';						
					}xOffset += 20;
					soldIndex++;
				}
				xOffset = 131-i*10;
				yOffset  += 20;
			}
			xOffset = 12.5;
			yOffset  = 12.5;
			soldIndex = 0;

			seatingPolygon.innerHTML = seatingString+'</g>';
		}
	}
	
	else {
		if (id.includes("bottom")){
			seatingString = '<g transform="rotate(-180 125 50)">'
		}
		else{
			seatingString = '<g>'
		}
		seatingPolygon.setAttribute('viewBox','-45 -20 350 200')
		seatingString += '<rect width="250" height="100" class="section-svg"/>'
		for (var i = top_center_left_upper[0]; i>0; i--){
			console.log(i);
			for (var j = 0; j<top_center_left_upper[1]; j++){
				if (top_center_left_upper_sold.includes(soldIndex)){
					seatingString += '<circle cx="'+xOffset +'" cy="'+yOffset +'" r="8.5" id="row-'+(i)+'-seat-'+(j+1)+'" class="sold"></circle>';
				}
				else{
					seatingString += '<circle cx="'+xOffset +'" cy="'+yOffset +'" r="8.5" id="row-'+(i)+'-seat-'+(j+1)+'" class="tickets available"></circle>';						
				}xOffset += 25;
				soldIndex++;
			}
		xOffset = 12.5;
		yOffset  += 25;
		}
		xOffset = 12.5;
		yOffset  = 12.5;
		soldIndex = 0;
		seatingPolygon.innerHTML = seatingString+'<text x="110" y="130">Court</text></g>'
	}
	var sectionTickets = document.getElementsByClassName('tickets');
	for(var i = 0; i <sectionTickets.length; i++){
		console.log(sectionTickets[i].getAttribute('id'));
		sectionTickets[i].addEventListener('click',function(){updateTicket(event.target)},false);
	}
}

function updateTicket(target){
	var itemClasses =  target.classList;
	console.log(itemClasses);
	if (itemClasses.contains('tickets')){
		target.setAttribute('class','in-cart');	
	}
	else{
		target.setAttribute('class','tickets available');
	}
}

//cart needs more work
function addToCart(){
	var cartSeats = document.getElementsByClassName('in-cart');
	if (cartSeats.length != 0){
		var tempCart = document.getElementById('rightPanelCart');
		var cartString = "<p>";
		var seatId;
		for (i = 1; i < cartSeats.length; i++){
			seatId = cartSeats[i].getAttribute('id');
			cartSeats[i].setAttribute('class','sold');
			if (!cartArray.includes(seatId)){
				
				cartArray.push(i,seatId)
				console.log("ticket for "+seatId+" has been added to cart");
				cartString += seatId+'<br>';
			}
		}
		tempCart.innerHTML = cartString+'</p>';
	}
}
