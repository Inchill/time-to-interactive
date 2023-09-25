import { TTIMetric, Metric } from '../types/index';
import { RATING } from './consts';

/**
 * Performantly generate a unique, 30-char string by combining a version
 * number, the current timestamp with a 13-digit number integer.
 * @return {string}
 */
export const generateUniqueID = () => {
	return `v3-${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`;
};

export const initMetric = <MetricName extends TTIMetric['name']>(
	name: MetricName,
	value?: number
) => {
	return {
		name,
		value: typeof value === 'undefined' ? -1 : value,
		rating: getRating(0),
		id: generateUniqueID()
	};
};

/**
 *
 * @param value number
 * @returns 'good' | 'needs-improvement' | 'poor'
 */
export const getRating = (value: number): Metric['rating'] => {
	if (value > RATING.mobile.scoring.median) {
		return 'poor';
	}
	if (value > RATING.mobile.scoring.p10) {
		return 'needs-improvement';
	}
	return 'good';
};

/**
 * Check if is's Safari browser.
 * @returns boolean
 */
export function isSafari(): boolean {
	return (
		/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
	);
}

/**
 * Get the value of the specific search query key.
 * @param name string
 * @returns string
 */
export const getQueryString = (name = '') => {
	if (typeof name !== 'string') {
		throw new Error('Could not support a non string name.');
	}

	const queryStr = window.location.href.split('?')[1] || '';
	const pairs = queryStr.split('&');
	for (let i = 0; i < pairs.length; i++) {
		const [key, value] = pairs[i].split('=') || ['', ''];
		if (name === key) return value;
	}
	return undefined;
};
