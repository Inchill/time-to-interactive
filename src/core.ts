import { TTIReportCallback, TTIMetric } from '../types';
import { ENTRY_NAME_FCP, QUIET_WINDOW_DURATION, RATING } from './consts';
import { log } from './debug';
import { initMetric } from './tools';

/**
 * Calculates the [TTI](https://web.dev/tti/) value for the current page and
 * calls the `callback` function once the value is ready, along with the
 * relevant `paint` performance entry used to determine the value. The reported
 * value is a `DOMHighResTimeStamp`.
 */
export const onTTI = (onReport: TTIReportCallback) => {
	let fcpStartTime = 0;
	let longTasks: TTIMetric['entry'][];
	let networks: TTIMetric['entry'][];
	let quietWindowTimer: number;
	let quietWindowStartTime = 0;
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

	const checkQuietWindow = () => {
		// Filter longtasks after fcp.
		const longTasksAfterFcp = longTasks.filter(
			(item) => item.startTime >= fcpStartTime
		);

		// If there are no longtasks after fcp, start the quiet window timer
		// and count the number of network requests for at least 5 seconds.
		if (longTasksAfterFcp.length === 0) {
			startQuietWindowTimer();
		} else {
			// Get the last longtask.
			const lastLongTask = longTasksAfterFcp[longTasksAfterFcp.length - 1];

			// 最近的长任务结束后开启安静窗口检测
			setTimeout(() => {
				startQuietWindowTimer();
			}, lastLongTask.startTime + lastLongTask.duration);
		}
	};

	/**
   * 启动安静窗口计时器
   */
	function startQuietWindowTimer() {
		// Clear the last quiet window timer.
		clearQuietWindowTimer();

		quietWindowTimer = setTimeout(() => {
			// Get the start time of quiet window.
			quietWindowStartTime = performance.now() - QUIET_WINDOW_DURATION;

			// Count the number of network requests in 5 seconds.
			const networksInTimer = networks.filter(
				(network) =>
					network.startTime >= quietWindowStartTime &&
          network.startTime <= quietWindowStartTime + QUIET_WINDOW_DURATION
			);

			// If the number of network requests is less than or equal to 2,
			// find the nearest long task before the quiet window.
			if (networksInTimer.length <= 2) {
				const longTasksBeforeQuietWindow = longTasks.filter(
					(longTask) =>
						longTask.startTime + longTask.duration <= quietWindowStartTime &&
            longTask.startTime >= fcpStartTime
				);

				// If no longtask is found, the value of TTI is equal to FCP.
				if (longTasksBeforeQuietWindow.length === 0) {
					metric.value = fcpStartTime;
				} else {
					const lastLongTask =
            longTasksBeforeQuietWindow[longTasksBeforeQuietWindow.length - 1];
					metric.value = lastLongTask.startTime + lastLongTask.duration;
				}

				if (
					metric.value >= RATING.mobile.scoring.p10 &&
          metric.value < RATING.mobile.scoring.median
				) {
					metric.rating = 'needs-improvement';
				} else if (metric.value >= RATING.mobile.scoring.median) {
					metric.rating = 'poor';
				}

				// Call the onReport callback if the quiet window was found.
				// onReport(metric);

				// After reporting disconnect the PerformanceObserver.
				observer.disconnect();
				clearQuietWindowTimer();
			}
		}, QUIET_WINDOW_DURATION);
	}

	// 清除安静窗口计时器
	function clearQuietWindowTimer() {
		clearTimeout(quietWindowTimer);
	}
};
