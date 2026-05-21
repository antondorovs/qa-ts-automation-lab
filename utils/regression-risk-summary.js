const DEFAULT_WEIGHTS = {
  failed: 5,
  flaky: 3,
  slow: 2,
  skipped: 1,
};

function calculateRiskScore(summary, weights = DEFAULT_WEIGHTS) {
  return (
    (summary.failed || 0) * weights.failed +
    (summary.flaky || 0) * weights.flaky +
    (summary.slow || 0) * weights.slow +
    (summary.skipped || 0) * weights.skipped
  );
}

function classifyRisk(score) {
  if (score >= 15) {
    return 'high';
  }

  if (score >= 6) {
    return 'medium';
  }

  return 'low';
}

function buildRegressionRiskSummary(summary, options = {}) {
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

function buildRecommendation(risk) {
  if (risk === 'high') {
    return 'Block release and investigate failures before continuing.';
  }

  if (risk === 'medium') {
    return 'Review unstable or slow tests before approving release.';
  }

  return 'Release risk is low based on current QA signals.';
}

module.exports = {
  buildRegressionRiskSummary,
  calculateRiskScore,
  classifyRisk,
};
