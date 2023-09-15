import { TTIMetric, Metric } from '../types';
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
