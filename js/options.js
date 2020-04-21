ga('send', 'pageview', '/options.html');

chrome.storage.local.get({"timeLimit":30}, function(data) {
	$("#minutes").val(data.timeLimit);
});

chrome.storage.local.get({"pauseOutOfFocus":false}, function(data) {
	if (data.pauseOutOfFocus == true)
		$('#pauseOutOfFocus').prop('checked', true);
});


chrome.storage.local.get({"resetTime":"00:00"}, function(data) {
	$("#time").val(data.resetTime);
});

$("#saveMinutes").click(function() {
	let minutes = Number($("#minutes").val());

	if (minutes % 0.5 != 0) {
		minutes = Math.round(minutes*2)/2; //rounds to nearest 0.5
	}

	if (minutes < 0) {
		minutes = 0; 
	} else if (minutes > 1439) {
		minutes = 1439;
	}
	$("#minutes").val(minutes);
	ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated time limit', eventValue: minutes});

	chrome.storage.local.set({"timeLimit": minutes, "timeLeft": minutes*60}, function() {
		chrome.runtime.sendMessage({
			msg: "timeLimitUpdated"
		});
		alert("Limit Saved");
	});
});

$("#saveTime").click(function() {
	var resetTime = $("#time").val();
	var resetHour = parseInt(resetTime.split(":")[0]);
	var resetMinute = parseInt(resetTime.split(":")[1]);
	ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated reset time', eventLabel: resetTime, eventValue: resetHour*60+resetMinute});
	chrome.storage.local.set({"resetTime": resetTime}, function() {
		chrome.runtime.sendMessage({
			msg: "resetTimeUpdated"
		});
		alert("Time Saved");
	});
});


$('#pauseOutOfFocus').change(function() {
	if (this.checked) {
		ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated pause out of focus', eventLabel: "true", eventValue: 1});
		chrome.storage.local.set({"pauseOutOfFocus": true});
		chrome.runtime.sendMessage({msg: "pauseOutOfFocus", val: true});
	} else {
		ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated pause out of focus', eventLabel: "false", eventValue: 0});
		chrome.storage.local.set({"pauseOutOfFocus": false});
		chrome.runtime.sendMessage({msg: "pauseOutOfFocus", val: false});
	}
});