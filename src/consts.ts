/**
 * Entry type name of fcp.
 */
export const ENTRY_NAME_FCP = 'first-contentful-paint';

/**
 * Minimum quiet window duration(At least 5s).
 */
export const QUIET_WINDOW_DURATION = 5000;

/**
 * TTI scores.
 */
export const RATING = {
	mobile: {
		scoring: {
			p10: 3785,
			median: 7300
		}
	},
	desktop: {
		scoring: {
			p10: 2468,
			median: 4500
		}
	}
};
