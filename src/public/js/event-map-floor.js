var floorArea = document.getElementById('floor');
floorArea.addEventListener('click',function(){generateFloor()},false);


function generateFloor(){
	var floorSeats = document.getElementById('floor-seat-div');
	floorSeats.innerHTML = '<h4>Floor Seats</h4><form><input id="quantity" style="max-width:100px; margin-top:20px"/><br><label>Enter Quantity</label></form>';
	var sectionSeats = document.getElementById('seating-section');
	sectionSeats.innerHTML = '';
	var addButton = document.getElementById('add-button');
	addButton.setAttribute('onClick','floorCart()');
}

function floorCart(){
	var seatQty = document.getElementById('quantity');
	var tempCart = document.getElementById('rightPanelCart');
	tempCart.innerHTML = '<p>Floor Seats x'+seatQty.value+'</p>';
}