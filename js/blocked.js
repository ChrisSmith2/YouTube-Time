ga('send', 'pageview', '/blocked.html');

$("#override").click(function() {
	var answer = confirm("Are you sure you need to use YouTube?")
	if (answer) {
    	ga('send', {hitType: 'event', eventCategory: 'Blocked page', eventAction: 'Override'});
		// update currentOverrideCount
		chrome.storage.local.get({"overrideLimit":5}, function(data) {
			chrome.storage.local.get({"currentOverrideCount":data.overrideLimit, "limitOverrides":true}, function(data) {
				if (data.limitOverrides) {
					chrome.storage.local.set({"currentOverrideCount": data.currentOverrideCount - 1}, function() {
						chrome.runtime.sendMessage({
							msg: "override", 
							value: true
						});
					});
				} else {
					chrome.runtime.sendMessage({
						msg: "override", 
						value: true
					});
				}
			});
		});
	}
});

// check if we still have some overrides left, otherwise remove the div with the button
chrome.storage.local.get({"overrideLimit":5}, function(data) {
	chrome.storage.local.get({"currentOverrideCount":data.overrideLimit, "limitOverrides":true}, function(data) {

		if(data.currentOverrideCount < 1 && data.limitOverrides) {
			// delete the button
			$("#overrideCommands").remove();
		} else {
			if (data.limitOverrides)
				$("#overridesLeft").text(data.currentOverrideCount + " Left");
			$("#overrideCommands").show();
		}
		
	});
});