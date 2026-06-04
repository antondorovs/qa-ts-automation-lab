export type RegressionRisk = 'low' | 'medium' | 'high';

export type RegressionRiskWeights = {
  failed: number;
  flaky: number;
  slow: number;
  skipped: number;
};

export type RegressionSignals = {
  failed?: number;
  flaky?: number;
  slow?: number;
  skipped?: number;
};

export type RegressionRiskOptions = {
  weights?: RegressionRiskWeights;
};

export type RegressionRiskSummary = {
  risk: RegressionRisk;
  score: number;
  recommendation: string;
  signals: Required<RegressionSignals>;
};

const DEFAULT_WEIGHTS: RegressionRiskWeights = {
  failed: 5,
  flaky: 3,
  slow: 2,
  skipped: 1,
};

export function calculateRiskScore(summary: RegressionSignals, weights: RegressionRiskWeights = DEFAULT_WEIGHTS): number {
  return (
    (summary.failed || 0) * weights.failed +
    (summary.flaky || 0) * weights.flaky +
    (summary.slow || 0) * weights.slow +
    (summary.skipped || 0) * weights.skipped
  );
}

export function classifyRisk(score: number): RegressionRisk {
  if (score >= 15) {
    return 'high';
  }

  if (score >= 6) {
    return 'medium';
  }

  return 'low';
}

export function buildRegressionRiskSummary(
  summary: RegressionSignals,
  options: RegressionRiskOptions = {},
): RegressionRiskSummary {
  const score = calculateRiskScore(summary, options.weights);
  const risk = classifyRisk(score);

  return {
    risk,
    score,
    recommendation: buildRecommendation(risk),
    signals: {
      failed: summary.failed || 0,
      flaky: summary.flaky || 0,
      slow: summary.slow || 0,
      skipped: summary.skipped || 0,
    },
  };
}

function buildRecommendation(risk: RegressionRisk): string {
  if (risk === 'high') {
    return 'Block release and investigate failures before continuing.';
  }

  if (risk === 'medium') {
    return 'Review unstable or slow tests before approving release.';
  }

  return 'Release risk is low based on current QA signals.';
}
