ga('send', 'pageview', '/blocked.html');

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
		ga('send', {hitType: 'event', eventCategory: 'Blocked page', eventAction: 'Override'});
		chrome.runtime.sendMessage({
			msg: "override", 
			value: true
		});
	}
});

function isYoutubeVideo(url) {
	return url.match(/(https?:\/\/(.+?\.)?youtube\.com\/watch([A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}