chrome.storage.local.get({"timeLimit":30}, function(data) {
	$("#minutes").val(data.timeLimit);
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
		alert("Settings Saved");
	});
});