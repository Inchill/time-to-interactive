export interface Metric {
  /**
   * The name of the metric (in acronym form).
   */
  name: 'FCP' | 'TTI';

  /**
   * The current value of the metric.
   */
  value: number;

  /**
   * The rating as to whether the metric value is within the "good",
   * "needs improvement", or "poor" thresholds of the metric.
   * Reference: https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/metrics/interactive.js
   */
  rating: 'good' | 'needs-improvement' | 'poor';

  /**
   * A unique ID representing this particular metric instance. This ID can
   * be used by an analytics tool to dedupe multiple values sent for the same
   * metric instance, or to group multiple deltas together and calculate a
   * total. It can also be used to differentiate multiple different metric
   * instances sent from the same page, which can happen if the page is
   * restored from the back/forward cache (in that case new metrics object
   * get created).
   */
  id: string;
}

/**
 * An TTI-specific version of the Metric object.
 */
export interface TTIMetric extends Metric {
  name: 'TTI';
  entry: PerformanceEntry;
  entries: PerformanceObserverEntryList;
}

/**
 * An TTI-specific version of the ReportCallback function with attribution.
 */
export interface TTIReportCallback {
  (metric: Metric): void;
}
