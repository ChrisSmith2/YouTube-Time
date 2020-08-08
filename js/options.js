ga('send', 'pageview', '/options.html');

chrome.storage.local.get({"limitOverrides":true}, function(data) {
	if (data.limitOverrides == true) {
		$('#limitOverrides').prop('checked', true);
		$('#overrideLimitRow').css("visibility", "visible");
	}
});

chrome.storage.local.get({"timeLimit":30}, function(data) {
	$("#minutes").val(data.timeLimit);
});

chrome.storage.local.get({"pauseOutOfFocus":true}, function(data) {
	if (data.pauseOutOfFocus == true)
		$('#pauseOutOfFocus').prop('checked', true);
});

chrome.storage.local.get({"youtubekidsEnabled":true}, function(data) {
	if (data.youtubekidsEnabled == true)
		$('#youtubekidsEnabled').prop('checked', true);
});

chrome.storage.local.get({"overrideLimit":5}, function(data) {
	$("#overrideLimit").val(data.overrideLimit);
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

$("#saveOverrideLimit").click(function() {
	let overrideLimit = Number($("#overrideLimit").val());
	if (overrideLimit < 0) {
		overrideLimit = 0;
	} else if (overrideLimit > 1000) {
		overrideLimit = 1000;
	}
	$("#overrideLimit").val(overrideLimit);
	ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated override limit', eventValue: overrideLimit});

	chrome.storage.local.set({"overrideLimit": overrideLimit, "currentOverrideCount": overrideLimit}, function() {
		alert("Override Limit Saved");
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

$('#youtubekidsEnabled').change(function() {
	if (this.checked) {
		ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated YouTube Kids enabled', eventLabel: "true", eventValue: 1});
		chrome.storage.local.set({"youtubekidsEnabled": true});
		chrome.runtime.sendMessage({msg: "youtubekidsEnabled", val: true});
	} else {
		ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated YouTube Kids enabled', eventLabel: "false", eventValue: 0});
		chrome.storage.local.set({"youtubekidsEnabled": false});
		chrome.runtime.sendMessage({msg: "youtubekidsEnabled", val: false});
	}
});

$('#limitOverrides').change(function() {
	if (this.checked) {
		$('#overrideLimitRow').css("visibility", "visible");
		ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated limit overrides toggle', eventLabel: "true", eventValue: 1});
		chrome.storage.local.set({"limitOverrides": true});
	} else {
		$('#overrideLimitRow').css("visibility", "hidden");
		ga('send', {hitType: 'event', eventCategory: 'Settings', eventAction: 'Updated limit overrides toggle', eventLabel: "false", eventValue: 0});
		chrome.storage.local.set({"limitOverrides": false});
	}
});

$("#customizeLimits").change(function() {
	if (this.checked) {
		$("#customLimitsDiv").show();
	} else {
		$("#customLimitsDiv").hide();
	}
});

$("#customizeLimits").change(function() {
	if (this.checked) {
		$("#customLimitsDiv").show();
		$("#minutes, #saveMinutes").prop("disabled", true);
	} else {
		$("#customLimitsDiv").hide();
		$("#minutes, #saveMinutes").prop("disabled", false);
	}
});

$(".no-limit-input").change(function() {
	var day = $(this).closest(".day-row").data("day");
	if (this.checked) {
		$(this).closest(".day-row").find(".save-day-limit, .day-minute-input").prop("disabled", true);
	} else {
		$(this).closest(".day-row").find(".save-day-limit, .day-minute-input").prop("disabled", false);
	}
});