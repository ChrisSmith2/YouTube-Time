chrome.storage.local.get({"timeLimit":30}, function(data) {
	$("#minutes").val(data.timeLimit);
});

$("#saveMinutes").click(function() {
	let minutes = Number($("#minutes").val());

	if (minutes % 0.5 != 0) {
		minutes = Math.round(minutes*2)/2; //rounds to nearest 0.5
		$("#minutes").val(minutes);
	}

	if (minutes < 0) {
		$("#minutes").val(0);
		minutes = 0;
	} else if (minutes > 720) {
		$("#minutes").val(720);
		minutes = 720;
	}

	chrome.storage.local.set({"timeLimit": minutes, "timeLeft": minutes*60}, function() {
		chrome.runtime.sendMessage({
			msg: "timeLimitUpdated"
		});
		alert("Settings Saved");
	});
});