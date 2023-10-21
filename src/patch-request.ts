let uniqueId = 0;

/**
 * Override the open and send methods of XMLHttpRequest to track XHR requests
 * @param beforeRequestCb function
 * @param onRequestCompletedCb function
 */
export const patchXMLHTTPRequest = (beforeRequestCb, onRequestCompletedCb) => {
	const open = window.XMLHttpRequest.prototype.open;
	window.XMLHttpRequest.prototype.open = function (...args) {
		const requestId = uniqueId++;
		beforeRequestCb(requestId);
		this.addEventListener('loadend', () => {
			onRequestCompletedCb(requestId);
		});
		open.apply(this, [...args]);
	};
};

/**
 * Override the Fetch function to track Fetch requests
 * @param beforeRequestCb function
 * @param onRequestCompletedCb function
 */
export const patchFetch = (beforeRequestCb, onRequestCompletedCb) => {
	const fetch = window.fetch;
	window.fetch = function (...args) {
		const requestId = uniqueId++;
		beforeRequestCb(requestId);
		return fetch.apply(this, [...args]).then((response) => {
			onRequestCompletedCb(requestId);
			return response;
		});
	};
};
