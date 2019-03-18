$("#override").click(function() {
	var answer = confirm("Are you sure you need to use YouTube?")
	if (answer) {
		chrome.runtime.sendMessage({
			msg: "override", 
			value: true
		}, function() {
			chrome.storage.local.get("savedVideoURL", function(data) {
				chrome.tabs.update({url: data.savedVideoURL});
			}); 
		});
	}
});

function isYoutubeVideo(url) {
	return url.match(/(https?:\/\/(.+?\.)?youtube\.com\/watch([A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}