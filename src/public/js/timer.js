// JavaScript Document
var m = 5;
var s = 59;

window.onload = function() {
	document.cookie = "minutes="+m+";seconds="+s;
   	checkTimer();
}

function checkTimer(){
	let decodedCookie = decodeURIComponent(document.cookie);
	console.log(decodedCookie);
  	let cookieBits = decodedCookie.split(';');
	console.log(cookieBits);
  	
	//for (let i = 0; i<cookieBits.length; i++){
	//	if 
	//}
	//if (m != -1 && s != -1){
	//	startTimer(cookieM,cookieS)
	//}
}

function startTimer(cookieM,cookieS) {
	//window.clearInterval(time);
	
	s = cookieS;
	m = cookieM;
	var outerDiv = document.getElementById('timer-div');
	var timeLabel = document.getElementById('time-text');
	var timeNumberLabel = document.getElementById('time');
	var timeWarningLabel = document.getElementById('time-warning');
	timeWarningLabel.setAttribute('class', '');
	timeLabel.setAttribute('class', '');
	timeNumberLabel.setAttribute('class', '');

	outerDiv.removeAttribute('hidden');
	timeNumberLabel.innerHTML = '10:00';
	time = window.setInterval('dispTime()', 1000);

}

var s = 0;
var m = 5;
var time;


function dispTime() {
	var timeLabel = document.getElementById('time-text');
	var timeNumberLabel = document.getElementById('time');
	var timeWarningLabel = document.getElementById('time-warning');

	s--;
	if (s < 0) {
		s = 59;
		m--;
	}
	else {
		if (m <= 0) {
			m = 0;
		} // end if  m ==60
	}// end if else s < 59
	if (s == 0 && m == 0) {
		window.clearInterval(time);
		timeWarningLabel.setAttribute('class', '');
		timeLabel.setAttribute('class', '');
		timeNumberLabel.setAttribute('class', '');
		timeNumberLabel.innerHTML = '';
		timeWarningLabel.innerHTML = '';
		timeLabel.innerHTML = 'Your tickets have been removed from your cart';
		return;
	}
	else if ((s == 0 && m == 1)) {
		timeWarningLabel.setAttribute('class', 'warning-label');
		timeLabel.setAttribute('class', 'warning-label');
		timeNumberLabel.setAttribute('class', 'warning-label');
		timeWarningLabel.innerHTML = 'Warning: your tickets will soon be removed from your cart. Press add to cart button for more time';
	}
	// end of calculation for next display
	// Format the output by adding 0 if it is single digit //
	if (s < 10) { var s1 = '0' + s; }
	else { var s1 = s; }
	if (m < 10) { var m1 = '0' + m; }
	else { var m1 = m; }
	// Display the output //
	str = m1 + ':' + s1;
	timeNumberLabel.innerHTML = str;
	document.cookie = "minutes="+m+";seconds="+s;
	// Calculate the stop watch // 
}
