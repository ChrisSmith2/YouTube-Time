console.log("background running")

chrome.runtime.onInstalled.addListener(function (object) {
	if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
		chrome.tabs.create({url: "/pages/options.html"});	
	}
});

var override = false;
var onYoutube = false;
var timeLeft = 1800;
var currentTab;
var popupOpen = false;
var pauseOutOfFocus = false;
var checkBrowserFocusTimer = null;
// chrome.storage.local.set({"lastDate":(new Date().getDate()-1).toString()}); //for debugging

checkReset();

chrome.storage.local.get({"override":override, "pauseOutOfFocus":pauseOutOfFocus}, function(data) {
	override = data.override;
	pauseOutOfFocus = data.pauseOutOfFocus;

	if (pauseOutOfFocus) {
		checkBrowserFocusTimer = setInterval(checkBrowserFocus, 1000);
	}
});

chrome.storage.local.get({"timeLeft":timeLeft}, function(data) {
	var time = data.timeLeft;
	if (!Number.isNaN(time))
		timeLeft = time;
	else {
		chrome.storage.local.get({"timeLimit":30}, function(data) {
			timeLeft = data.timeLimit*60;
		});	
	}
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	checkReset();
	chrome.tabs.get(activeInfo.tabId, function(tab){
		currentTab = tab;
		checkTabForYouTube(tab.url)
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changedInfo, tab) {
	checkReset();
	if(tab.active && changedInfo.url){
		currentTab = tab;
		checkTabForYouTube(changedInfo.url)
	}
});

function checkBrowserFocus(){
	if(typeof timer != 'undefined') {
		chrome.windows.getLastFocused(function(window){
			if(window && window.focused) {
				if(!onYoutube) {
					var getInfo = {populate: true};
					chrome.windows.getLastFocused(getInfo, function(window) {
						for(var i = 0; i < window.tabs.length; i++) {
							if(window.tabs[i].active) {
								checkTabForYouTube(window.tabs[i].url)
							}
						}
					});
				}
			} else {
				if (popupOpen) {
					var getInfo = {populate: true};
					chrome.windows.getLastFocused(getInfo, function(window) {
						for(var i = 0; i < window.tabs.length; i++) {
							if(window.tabs[i].active) {
								checkTabForYouTube(window.tabs[i].url)
							}
						}
					});
				} else if (onYoutube) {
					onYoutube = false;
					stopTime();
				}

		  	}
		})
	}
}

chrome.windows.onFocusChanged.addListener(function(windowId) {
	checkReset();

	if (pauseOutOfFocus) {
		if(windowId == chrome.windows.WINDOW_ID_NONE && typeof timer != 'undefined' && onYoutube) {
			if (popupOpen)
				return;

			onYoutube = false;
			stopTime();
		} else if(windowId != chrome.windows.WINDOW_ID_NONE) {
			var getInfo = {populate: true};
			chrome.windows.getLastFocused(getInfo, function(window) {
				for(var i = 0; i < window.tabs.length; i++) {
					if(window.tabs[i].active) {
						checkTabForYouTube(window.tabs[i].url)
					}
				}
			});
		}
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.msg == "override") {
		override = request.value;
		// console.log("override")
		chrome.storage.local.set({"override":request.value, "tempOverride":true}, function() {
			chrome.runtime.sendMessage({
				msg: "goToSavedVideo"
			});			
		});
	} else if (request.msg == "checkReset") {
		checkReset();
	} else if (request.msg == "timeLimitUpdated") {
		chrome.storage.local.get({"timeLeft":timeLeft}, function(data) {
			timeLeft = data.timeLeft;
		});
	} else if (request.msg == "popupOpen") {
		popupOpen = true;
	} else if (request.msg == "popupUnfocus") {
		popupOpen = false;
	} else if (request.msg == "pauseOutOfFocus") {
		if (request.val == true) {
			pauseOutOfFocus = true;
			if (checkBrowserFocusTimer == null)
				checkBrowserFocusTimer = setInterval(checkBrowserFocus, 1000);

			// stop timer because active window must be settings page
			onYoutube = false;
			stopTime();
		} else {
			pauseOutOfFocus = false;
			clearInterval(checkBrowserFocusTimer);
			checkBrowserFocusTimer = null;

			// see if window is open that has YouTube
			checkWindowsForTimerStart();
		}
	}
});

function isYoutube(url) {
	// regex from https://stackoverflow.com/a/32730577
	return url.match(/(https?:\/\/(.+?\.)?youtube\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}

function isYoutubeVideo(url) {
	return url.match(/(https?:\/\/(.+?\.)?youtube\.com\/watch([A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}

function updateTime() {
	if (timeLeft > 0) {
		timeLeft--;
	} else {
		clearInterval(timer);
		blockRedirect();
	}
	chrome.browserAction.setBadgeText({"text": formatTime(timeLeft)});
	chrome.storage.local.set({"timeLeft":timeLeft});

	var views = chrome.extension.getViews({ type: "popup" });
	if (views.length != 0) {
		chrome.runtime.sendMessage({
			msg: "updateTime", 
			time: timeLeft
		});
	}
	checkReset();
}

function startTime() {
	// console.log("start", timeLeft)
	chrome.browserAction.setBadgeText({"text": formatTime(timeLeft)});
	timer = setInterval(updateTime, 1000);
}

function stopTime() {
	// console.log("stopped", timeLeft)
	clearInterval(timer);
	chrome.browserAction.setBadgeText({"text": ""});
}

function formatTime(totalSeconds) {
	var hours = Math.floor(totalSeconds / 3600);
	totalSeconds -= hours*3600;
	var minutes =  Math.floor(totalSeconds / 60);
	totalSeconds -= minutes*60;
	var seconds =  Math.floor(totalSeconds);

	var result = "";
	if (hours > 0) {
		result += hours + ":";
	}
	if (minutes > 0) {
		result += minutes + ":";
	} else {
		result += "0:";
	}
	if (seconds < 10) {
		result += "0";
	}
	result += seconds;

	return result;
}

function blockRedirect() {
	// console.log("blockRedirect")
	// console.log("tabs[0].url: " + currentTab)
	// console.log(isYoutubeVideo(tabs[0].url))

	if (isYoutubeVideo(currentTab.url)) {
		// request videoURL with time
		chrome.tabs.sendMessage(currentTab.id, {msg:"saveVideoURL"}, function(response){
			// console.log("response: " + response)
			chrome.storage.local.set({"savedVideoURL": response}, function() {
				chrome.tabs.update(currentTab.id, {url: "/pages/blocked.html"});
			});
		});
	} else {
		// if not on a youtube video
		chrome.storage.local.set({"savedVideoURL": currentTab.url}, function() {
			chrome.tabs.update(currentTab.id, {url: "/pages/blocked.html"});
		});
	}
}

function checkReset() {
	chrome.storage.local.get({"lastDate":null, "resetTime":"00:00"}, function(data) {
		var today = new Date();
		var resetTime = data.resetTime.split(":");
		var resetHour = parseInt(resetTime[0]);
		var resetMinute = parseInt(resetTime[1]);
		if(!data.lastDate || (today.getDate().toString() != data.lastDate && today.getHours() >= resetHour && today.getMinutes() >= resetMinute)) {
			chrome.storage.local.get({"timeLimit":30}, function(data) {

				chrome.storage.local.set({"lastDate":today.getDate().toString(), "override":false, "timeLeft":data.timeLimit*60}, function () {
					chrome.runtime.sendMessage({
						msg: "checkDone"
					});
				});
				override = false;
				timeLeft = data.timeLimit*60;

			});

		} else {
			chrome.runtime.sendMessage({
				msg: "checkDone"
			});
		}
	});
}

function checkOverride(url) {
	// console.log("check override")
	// checks if youtube page navigated to has been allowed
	// if not, user will be redirected back to block page

	// allows user to override and go back to most recent video
	// but not go to any other videos
	chrome.storage.local.get({savedVideoURL:"", tempOverride:false}, function(data) {
		// console.log("current url: " + url);
		// console.log("allowed url: " + data.savedVideoURL);

		if (urlNoTime(url) != urlNoTime(data.savedVideoURL) || !data.tempOverride) {
		// if url doesn't match one that was saved or tempoverride isn't true
		
			chrome.storage.local.set({savedVideoURL: currentTab.url, tempOverride: false}, function() {
				chrome.tabs.update(currentTab.id, {url: "/pages/blocked.html"});
			});

		}

	});
}

function urlNoTime(url) {
	let arr = url.split("&t=");
	if (arr.length >= 1) {
		return arr[0];
	}
	return null
}

function checkTabForYouTube(url) {
	// console.log("checkTabForYouTube")
	if (isYoutube(url) && !onYoutube) {
		if (!override) {
			onYoutube = true;
			startTime();	
		} else {
			checkOverride(url);
		}
	} else if (!isYoutube(url) && onYoutube && !override) {
		if (pauseOutOfFocus) {
			onYoutube = false;
			stopTime();
		} else {
			checkWindowsForTimerStop();
		}
	}
}

function checkWindowsForTimerStart() {
	chrome.tabs.query({active: true}, function(tabs) {
		var youtubeOpenOnAnyWindow = false;
		for (var i = 0; i < tabs.length; i++) {
			if (isYoutube(tabs[i].url)) {
				youtubeOpenOnAnyWindow = true;
				break;
			}
		}
		if (youtubeOpenOnAnyWindow) {
			onYoutube = true;
			startTime();
		}
	});
}

function checkWindowsForTimerStop() {
	chrome.tabs.query({active: true}, function(tabs) {
		var youtubeOpenOnAnyWindow = false;
		for (var i = 0; i < tabs.length; i++) {
			if (isYoutube(tabs[i].url)) {
				youtubeOpenOnAnyWindow = true;
				break;
			}
		}
		if (!youtubeOpenOnAnyWindow) {
			onYoutube = false;
			stopTime();
		}
	});
}