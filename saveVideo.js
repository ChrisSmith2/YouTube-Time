chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "saveVideoURL") {
		let video = document.getElementsByClassName('video-stream')[0];
		let totalSeconds = Math.floor(video.currentTime);
		sendResponse(urlNoTime(location.href) + "&t=" + totalSeconds)
	}
});

function urlNoTime(url) {
	return url.split("&t=")[0];
}