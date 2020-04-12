chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "goToSavedVideo") {
		chrome.storage.local.get("savedVideoURL", function(data) {
			chrome.tabs.update({url: data.savedVideoURL});
		}); 
	}
});

$("#override").click(function() {
	var answer = confirm("Are you sure you need to use YouTube?")
	if (answer) {

		// update currentOverrideCount
		chrome.storage.local.get({"currentOverrideCount":-1}, function(data) {
			chrome.storage.local.set({"currentOverrideCount": data.currentOverrideCount - 1}, function()
			{
				alert(data.currentOverrideCount--);

				chrome.runtime.sendMessage({
					msg: "override", 
					value: true
				});
			});
		});
		
	}
});

// check if we still have some overrides left, otherwise hide the div with the button
chrome.storage.local.get({"currentOverrideCount":-1}, function(data) {

	if(data.currentOverrideCount < 1)
	{
		// hide the button
		$("#overrideCommands").hide();
	}

	// clean up if for some reasons currentOverrideCount was not set before
	if (data.currentOverrideCount == -1)
		data.currentOverrideCount = 0;

	$("#overrideLeft").text(data.currentOverrideCount + " Left");
	
});

function isYoutubeVideo(url) {
	return url.match(/(https?:\/\/(.+?\.)?youtube\.com\/watch([A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}