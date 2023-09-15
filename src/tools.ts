import { TTIMetric } from '../types';

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
		rating: 'good', // If needed, will be updated when reported. `const` to keep the type from widening to `string`.
		id: generateUniqueID()
	};
};
