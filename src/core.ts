import { TTIReportCallback, TTIMetric } from '../types/index';
import { ENTRY_NAME_FCP, QUIET_WINDOW_DURATION, RATING } from './consts';
import { log } from './debug';
import { initMetric, getRating, isSafari } from './tools';
import { patchXMLHTTPRequest, patchFetch } from './patch-request';

/**
 * Calculates the [TTI](https://web.dev/tti/) value for the current page and
 * calls the `callback` function once the value is ready, along with the
 * relevant `paint` performance entry used to determine the value. The reported
 * value is a `DOMHighResTimeStamp`.
 */
export const onTTI = (onReport: TTIReportCallback) => {
	if (isSafari()) return;

	let fcpStartTime = 0;
	const longTasks: TTIMetric['entry'][] = [];
	const networks: TTIMetric['entry'][] = [];
	let quietWindowTimer: number;
	const metric = initMetric('TTI');
	const inProgressRequestStartTimes = new Map();

	/**
   * Mark active network requests.
   * @param requestId number
   */
	const beforeRequestCallback = (requestId) => {
		inProgressRequestStartTimes.set(requestId, performance.now());
	};

	/**
   * Remove finished network requests.
   * @param requestId number
   */
	const afterRequestCallback = (requestId) => {
		inProgressRequestStartTimes.delete(requestId);
	};

	// Patch XHR and Fetch API to detect in-flight network requests.
	patchXMLHTTPRequest(beforeRequestCallback, afterRequestCallback);
	patchFetch(beforeRequestCallback, afterRequestCallback);

	/**
   * Track longtask and networks and check quiet window.
   * @param entries PerformanceObserverEntryList
   */
	const handleEntries = (entries: TTIMetric['entries']) => {
		for (const entry of entries.getEntries()) {
			if (entry.entryType === 'paint' && entry.name === ENTRY_NAME_FCP) {
				fcpStartTime = entry.startTime;
			}

			// Longtasks could not be detected in Safari.
			if (entry.entryType === 'longtask') {
				longTasks.push(entry);
				checkQuietWindow();
			}

			if (entry.entryType === 'resource') {
				networks.push(entry);
				checkQuietWindow();
			}
		}
	};

	/**
   * Register to observe.
   */
	const observer = new PerformanceObserver(handleEntries);
	observer.observe({
		entryTypes: ['paint', 'longtask', 'resource']
	});

	// There are some cases need to be handled.
	// 1. There are no long tasks after fcp but there are network requests.
	// 2. There are neither long tasks nor network requests after fcp
	// In such case we need onload event to handle tti.
	// 3. After fcp, there are both long tasks and network requests.
	// 4. There are long tasks after fcp but no network requests.
	const checkQuietWindow = () => {
		// Filter longtasks after fcp.
		const longTasksAfterFcp = longTasks.filter(
			(item) => item.startTime >= fcpStartTime
		);

		// If there are no longtasks after fcp, start the quiet window timer
		// and count the number of in-flight network requests for at least 5 seconds.
		if (longTasksAfterFcp.length === 0) {
			startQuietWindowTimer(fcpStartTime);
		} else {
			// Get the last longtask.
			const lastLongTask = longTasksAfterFcp[longTasksAfterFcp.length - 1];

			// Turn on quiet window detection using the latest long task end time as the start time.
			startQuietWindowTimer(lastLongTask.startTime + lastLongTask.duration);
		}
	};

	/**
   * Start quiet window detection timer.
   */
	function startQuietWindowTimer(startTime: number) {
		// Clear the last detection timer.
		clearQuietWindowTimer();

		quietWindowTimer = window.setTimeout(() => {
			checkTTI(startTime);
		}, QUIET_WINDOW_DURATION);
	}

	const checkTTI = (startTime: number) => {
		// Count the number of in-flight network requests in 5 seconds.
		const inProgressRequestStarts = [...inProgressRequestStartTimes.values()];

		// If the number of network requests is less than or equal to 2,
		// find the nearest long task before the quiet window.
		if (inProgressRequestStarts.length <= 2) {
			// If no longtask is found, the value of TTI is equal to FCP.
			// If find the nearest long task before the quiet window, and
			// its endTime is equal to TTI.
			metric.value = startTime;

			// Set the rating value based on the obtained tti time.
			metric.rating = getRating(metric.value);

			// Call the onReport callback if the quiet window was found.
			onReport(metric);

			// After reporting disconnect the PerformanceObserver.
			observer.disconnect();
			clearQuietWindowTimer();
		}
	};

	// Clear timer.
	function clearQuietWindowTimer() {
		clearTimeout(quietWindowTimer);
	}
};
