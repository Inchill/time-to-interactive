const DEBUG = true;

/**
 * Prints a log statement to the console if the DEBUG flag is true.
 * @param args any[]
 */
export const log = <T>(...args: T[]) => {
	if (DEBUG) {
		console.log(...args);
	}
};
