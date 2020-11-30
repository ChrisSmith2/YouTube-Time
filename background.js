console.log("background running")

chrome.runtime.onInstalled.addListener(function (object) {
	if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
		chrome.tabs.create({url: "/pages/options.html"});	
	}
});

// Default values
var override = false;
var onYoutube = false;
var timeLeft = 1800;
var currentTab;
var popupOpen = false;
var pauseOutOfFocus = true;
var youtubekidsEnabled = true;
var checkBrowserFocusTimer = null;
var timer = null;
var noLimit = false;

// chrome.storage.local.set({"lastDate":(new Date().getDate()-1).toString()}); //for debugging

checkReset();

var days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
// Updates noLimit variable
chrome.storage.local.get({"customizeLimits":false, "dayLimits":{}}, function(data) {
	if (data.customizeLimits) {
		var today = new Date();
		var day = days[today.getDay()];
		if (day in data.dayLimits && data.dayLimits[day] === false) {
			noLimit = true;
		}
	}
});

chrome.storage.local.get({"override":override, "pauseOutOfFocus":pauseOutOfFocus, "youtubekidsEnabled":youtubekidsEnabled}, function(data) {
	override = data.override;
	pauseOutOfFocus = data.pauseOutOfFocus;
	youtubekidsEnabled = data.youtubekidsEnabled;

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

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	if (tabId) {
		// Removes id of closed tab from savedVideoURLs and tempOverrideTabs (if present)
		chrome.storage.local.get({savedVideoURLs:{}, tempOverrideTabs:[]}, function(data) {
			delete data.savedVideoURLs[tabId];

			var index = data.tempOverrideTabs.indexOf(tabId);
			if (index !== -1)
				data.tempOverrideTabs.splice(index, 1);
			chrome.storage.local.set({savedVideoURLs: data.savedVideoURLs, tempOverrideTabs: data.tempOverrideTabs});
		});	
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
	switch(request.msg) {
		case "override":
			override = request.value;
			// console.log("override")
			chrome.storage.local.get({"savedVideoURLs":{}, "tempOverrideTabs":[]}, function(data) {
				// Effectively setting tempOverride to true for currentTab
				// (by adding the tab id to the tempOverrideTabs array)
				var tempOverrideTabs = data.tempOverrideTabs;
				tempOverrideTabs.push(currentTab.id);
				
				var savedVideoURLs = data.savedVideoURLs;
				if (!savedVideoURLs[currentTab.id])
					savedVideoURLs[currentTab.id] = "https://www.youtube.com/";

				chrome.storage.local.set({"override":request.value, "tempOverrideTabs":tempOverrideTabs, "savedVideoURLs":savedVideoURLs}, function() {
					chrome.tabs.update(currentTab.id, {url: savedVideoURLs[currentTab.id]});
				}); 
			});
			break;
		case "checkReset":
			checkReset();
			break;
		case "timeLimitUpdated":
			chrome.storage.local.get({"timeLeft":timeLeft}, function(data) {
				timeLeft = data.timeLeft;
			});
			break;
		case "popupOpen":
			popupOpen = true;
			break;
		case "popupUnfocus":
			popupOpen = false;
			break;
		case "pauseOutOfFocus":
			if (request.val == true) {
				pauseOutOfFocus = true;
				if (checkBrowserFocusTimer == null)
					checkBrowserFocusTimer = setInterval(checkBrowserFocus, 1000);

				if(typeof timer != 'undefined') {
					// stop timer because active window must be settings page
					onYoutube = false;
					stopTime();
				}
			} else {
				pauseOutOfFocus = false;
				clearInterval(checkBrowserFocusTimer);
				checkBrowserFocusTimer = null;

				// see if window is open that has YouTube
				checkWindowsForTimerStart();
			}
			break;
		case "youtubekidsEnabled":
			if (request.val == true) {
				youtubekidsEnabled = true;

				if (!pauseOutOfFocus) {
					// In case youtubekids.com is currently active in another window
					checkWindowsForTimerStart();
				}
			} else {
				youtubekidsEnabled = false;

				if (!pauseOutOfFocus) {
					// In case no youtube.com tabs are active 
					// (timer was only running because of youtubekids.com tab(s))
					checkWindowsForTimerStop();
				}
			}
			break;
		case "resetTimeUpdated":
			chrome.storage.local.get({"resetTime":"00:00"}, function(data) {
				var now = new Date();
				var resetTime = data.resetTime.split(":");
				var resetHour = parseInt(resetTime[0]);
				var resetMinute = parseInt(resetTime[1]);
				if (now.getHours() <= resetHour && now.getMinutes() < resetMinute) {
					// Ensures that time resets when changing resetTime to time in the future
					// Allows user to test different reset times and see the timer reset
					chrome.storage.local.set({"lastDate":"-1"});
				}
			});
			break;
		case "noLimitInputChange":
			var today = new Date();
			var day = days[today.getDay()];
			if (request.day == day) { // day is today
				chrome.storage.local.get({"dayLimits":{}, "timeLimit":30}, function(data) {
					if (day in data.dayLimits && data.dayLimits[day] === false) {
						noLimit = true;
						if (timer != null)
							stopTime();
					} else {
						noLimit = false;
						timeLeft = data.timeLimit*60;
						chrome.storage.local.set({"timeLeft": timeLeft}, function() {
							if (!pauseOutOfFocus) {
								// In case youtube is currently active in another window
								checkWindowsForTimerStart();
							}
						});
					}
				});
			}
			break;
		case "dayTimeLimitUpdated":
			var today = new Date();
			var day = days[today.getDay()];
			if (request.day == day) { // day is today
				chrome.storage.local.get({"dayLimits":{}}, function(data) {
					timeLeft = data.dayLimits[day]*60;
					chrome.storage.local.set({"timeLeft": timeLeft});
				});
			}
			break;
		case "customizeLimitsFalse":
			chrome.storage.local.get({"timeLimit":30}, function(data) {
				timeLeft = data.timeLimit*60;
				chrome.storage.local.set({"timeLeft": timeLeft});
			});
			break;
	}
});

function isYoutube(url) {
	// regex based on https://stackoverflow.com/a/32730577
	if (youtubekidsEnabled)
		return url.match(/(https?:\/\/(?!music\.)(.+?\.)?youtube(kids)?\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
	return url.match(/(https?:\/\/(?!music\.)(.+?\.)?youtube\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}

function isYoutubeVideo(url) {
	if (youtubekidsEnabled)
		return url.match(/(https?:\/\/(?!music\.)(.+?\.)?youtube(kids)?\.com\/watch([A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
	return url.match(/(https?:\/\/(?!music\.)(.+?\.)?youtube\.com\/watch([A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/)
}

function updateTime() {
	if (timeLeft > 0) {
		timeLeft--;
	} else {
		clearInterval(timer);
		timer = null;
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
	timer = null;
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
		if (minutes < 10)
			result += "0";
		result += minutes;
	} else {
		result += minutes;
	}

	if (hours == 0) {
		if (seconds < 10)
			result += ":0" + seconds;
		else
			result += ":" + seconds;
	}

	return result;
}

function blockRedirect() {
	// console.log("blockRedirect")
	// console.log("tabs[0].url: " + currentTab)
	// console.log(isYoutubeVideo(tabs[0].url))

	chrome.storage.local.get({"savedVideoURLs":{}}, function(data) {
		var videoURLs = data.savedVideoURLs;

		if (isYoutubeVideo(currentTab.url)) {
			// request videoURL with time
			chrome.tabs.sendMessage(currentTab.id, {msg:"saveVideoURL"}, function(response){
				// console.log("response: " + response)
				videoURLs[currentTab.id] = response;
				chrome.storage.local.set({"savedVideoURLs": videoURLs}, function() {
					chrome.tabs.update(currentTab.id, {url: "/pages/blocked.html"});
				});
			});
		} else {
			// if not on a youtube video
			videoURLs[currentTab.id] = currentTab.url;
			chrome.storage.local.set({"savedVideoURLs": videoURLs}, function() {
				chrome.tabs.update(currentTab.id, {url: "/pages/blocked.html"});
			});
		}

	});
}

function checkReset() {
	chrome.storage.local.get({"lastDate":null, "resetTime":"00:00"}, function(data) {
		var today = new Date();
		var resetTime = data.resetTime.split(":");
		var resetHour = parseInt(resetTime[0]);
		var resetMinute = parseInt(resetTime[1]);
		if(!data.lastDate || (today.getDate().toString() != data.lastDate && today.getHours() >= resetHour && today.getMinutes() >= resetMinute)) {
			chrome.storage.local.get({"timeLimit":30, "customizeLimits":false, "dayLimits":{}}, function(data) {
				var timeLimit = data.timeLimit;
				var dayLimits = data.dayLimits;

				var noLimitTemp = false;
				if (data.customizeLimits) {
					var day = days[today.getDay()];
					if (day in dayLimits) {
						if (dayLimits[day] === false) {
							noLimitTemp = true;
						} else {
							timeLimit = dayLimits[day];
						}
					}
				}
				noLimit = noLimitTemp;
				if (noLimit && timer != null)
					stopTime();

				chrome.storage.local.set({
					"lastDate":today.getDate().toString(), 
					"override":false, 
					"timeLeft":timeLimit*60,
					"savedVideoURLs":{},
					"tempOverrideTabs":[]
				}, function() {
					chrome.runtime.sendMessage({
						msg: "checkDone",
						noLimit: noLimit
					});
				});
				override = false;
				timeLeft = timeLimit*60;

				// reset number of available overrides for today
				chrome.storage.local.get({"overrideLimit":5}, function(data) {
					chrome.storage.local.set({"currentOverrideCount": data.overrideLimit});
				});

			});

		} else {
			chrome.runtime.sendMessage({
				msg: "checkDone",
				noLimit: noLimit
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
	chrome.storage.local.get({savedVideoURLs:{}, tempOverrideTabs:[]}, function(data) {
		// console.log("current url: " + url);
		// console.log("allowed url: " + data.savedVideoURLs);

		var videoURLs = data.savedVideoURLs;
		var tempOverrideTabs = data.tempOverrideTabs;

		var urlMatch = false;
		for (var tabId in videoURLs) {
			if (urlNoTime(videoURLs[tabId]) == urlNoTime(url)) {
				urlMatch = true;
				break;
			}
		}

		var tempOverride = tempOverrideTabs.includes(currentTab.id);

		if (!urlMatch || !tempOverride) {
		// if url doesn't match one that was saved or tempoverride isn't true
			videoURLs[currentTab.id] = currentTab.url;

			// Effectively setting tempOverride to false for currentTab
			// (by removing the tab id from the tempOverrideTabs array)
			var index = tempOverrideTabs.indexOf(currentTab.id);
			if (index !== -1)
				tempOverrideTabs.splice(index, 1);

			chrome.storage.local.set({savedVideoURLs: videoURLs, tempOverrideTabs: tempOverrideTabs}, function() {
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
		if (noLimit)
			return;

		if (!override) {
			onYoutube = true;
			startTime();	
		} else {
			checkOverride(url);
		}
	} else if (!isYoutube(url) && onYoutube && !override) {
		if (pauseOutOfFocus) {
			if (!popupOpen) {
				onYoutube = false;
				stopTime();	
			}
		} else {
			checkWindowsForTimerStop();
		}
	}
}

function checkWindowsForTimerStart() {
	if (timer != null || noLimit)
		return

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
