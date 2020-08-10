ga('send', 'pageview', '/popup.html');

chrome.runtime.sendMessage({
	msg: "popupOpen"
});

window.onfocus = function() {
	chrome.runtime.sendMessage({
		msg: "popupOpen"
	});
}

window.onblur = function() {
	chrome.runtime.sendMessage({
		msg: "popupUnfocus"
	});
}

chrome.runtime.sendMessage({
	msg: "checkReset"
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "checkDone") {
		if (request.noLimit) {
			$("#time").addClass("noLimit");
			$("#time").text("No time limit");
		} else {
			chrome.storage.local.get("timeLeft", function(data) {
				$("#time").removeClass("noLimit");
				$("#time").text(formatTime(data.timeLeft) + " remaining");
			});
		}

		chrome.storage.local.get("override", function(data) {
			if (data.override) {
				$("#override").show();
			}
		});
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "updateTime") {
		$("#time").removeClass("noLimit");
		$("#time").text(formatTime(request.time) + " remaining");
	}
});

function formatTime(totalSeconds) {
	var hours = Math.floor(totalSeconds / 3600);
	totalSeconds -= hours*3600;
	var minutes =  Math.floor(totalSeconds / 60);
	totalSeconds -= minutes*60;
	var seconds =  Math.floor(totalSeconds);

	var result = "";
	if (hours > 0) {
		result += hours + ":";
		if (minutes < 10)
			result += "0";
		result += minutes + ":";
	} else {
		result += minutes + ":";
	}

	if (seconds < 10) {
		result += "0";
	}
	result += seconds;

	return result;
}