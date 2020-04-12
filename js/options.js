chrome.storage.local.get({"timeLimit":30}, function(data) {
	$("#minutes").val(data.timeLimit);
});

chrome.storage.local.get({"pauseOutOfFocus":false}, function(data) {
	if (data.pauseOutOfFocus == true)
		$('#pauseOutOfFocus').prop('checked', true);
});

chrome.storage.local.get({"overrideCount":1}, function(data) {
	$("#overrideCount").val(data.overrideCount);
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

	chrome.storage.local.set({"timeLimit": minutes, "timeLeft": minutes*60}, function() {
		chrome.runtime.sendMessage({
			msg: "timeLimitUpdated"
		});
		alert("Limit Saved");
	});
});

$("#saveOverrideCount").click(function() {
	chrome.storage.local.set({"overrideCount": $("#overrideCount").val(), "currentOverrideCount": $("#overrideCount").val()}, function() {
		chrome.runtime.sendMessage({
			msg: "overrideCountUpdated"
		});
		alert("Max Overrides count Saved");
	});
});

$("#saveTime").click(function() {
	chrome.storage.local.set({"resetTime": $("#time").val()}, function() {
		chrome.runtime.sendMessage({
			msg: "resetTimeUpdated"
		});
		alert("Time Saved");
	});
});


$('#pauseOutOfFocus').change(function() {
	if (this.checked) {
		chrome.storage.local.set({"pauseOutOfFocus": true});
		chrome.runtime.sendMessage({msg: "pauseOutOfFocus", val: true});
	} else {
		chrome.storage.local.set({"pauseOutOfFocus": false});
		chrome.runtime.sendMessage({msg: "pauseOutOfFocus", val: false});
	}
});