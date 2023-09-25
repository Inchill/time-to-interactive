import { TTIReportCallback, TTIMetric } from '../types/index';
import { ENTRY_NAME_FCP, QUIET_WINDOW_DURATION, RATING } from './consts';
import { log } from './debug';
import { initMetric, getRating, isSafari } from './tools';

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

	const handleEntries = (entries: TTIMetric['entries']) => {
		for (const entry of entries.getEntries()) {
			if (entry.entryType === 'paint' && entry.name === ENTRY_NAME_FCP) {
				fcpStartTime = entry.startTime;
			}

			// Longtasks could not be detected in Safari.
			if (entry.entryType === 'longtask') {
				longTasks.push(entry);
			}

			if (entry.entryType === 'resource') {
				networks.push(entry);
			}

			if (['longtask', 'resource'].includes(entry.entryType)) {
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

	window.addEventListener('load', () => {
		const resourceEntries = performance.getEntriesByType('resource');
		if (resourceEntries.length === 0) {
			console.log('页面没有资源加载事件');
		} else {
			console.log('页面有资源加载事件');
		}
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
		// and count the number of network requests for at least 5 seconds.
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
			// Count the number of network requests in 5 seconds.
			const networksInQuietWindow = networks.filter(
				(network) =>
					network.startTime >= startTime &&
          network.startTime <= startTime + QUIET_WINDOW_DURATION
			);

			// If the number of network requests is less than or equal to 2,
			// find the nearest long task before the quiet window.
			if (networksInQuietWindow.length <= 2) {
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
		}, QUIET_WINDOW_DURATION);
	}

	// Clear timer.
	function clearQuietWindowTimer() {
		clearTimeout(quietWindowTimer);
	}
};
