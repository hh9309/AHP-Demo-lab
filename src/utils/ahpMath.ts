import { MethodResult, WeightDiagnosisResult, SynthesisResult, ExpertJudge, GroupAhpResult } from '../types/ahp';

// Standard Saaty Random Index table (n from 0 to 15)
export const RI_TABLE: Record<number, number> = {
  1: 0.00,
  2: 0.00,
  3: 0.58,
  4: 0.90,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
  11: 1.51,
  12: 1.54,
  13: 1.56,
  14: 1.57,
  15: 1.59,
};

export function getRI(n: number): number {
  if (n <= 2) return 0;
  if (RI_TABLE[n] !== undefined) return RI_TABLE[n];
  // Empirical approximation for n > 15
  return Number((1.59 + 0.02 * (n - 15)).toFixed(2));
}

// 1. 和法 (Arithmetic Mean Method / Column Normalization)
export function calcArithmeticMean(matrix: number[][]): MethodResult {
  const n = matrix.length;
  if (n === 0) return emptyMethodResult();
  if (n === 1) return { weights: [1], lambdaMax: 1, ci: 0, cr: 0, isConsistent: true };

  // Sum of each column
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  // Normalize column and sum row
  const weights = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += colSums[j] > 0 ? matrix[i][j] / colSums[j] : 0;
    }
    weights[i] = rowSum / n;
  }

  // Normalize weights just in case
  const totalWeight = weights.reduce((acc, v) => acc + v, 0);
  const normalizedWeights = weights.map(w => (totalWeight > 0 ? w / totalWeight : 1 / n));

  return computeConsistency(matrix, normalizedWeights);
}

// 2. 方根法 (Geometric Mean Method / Root Method)
export function calcGeometricMean(matrix: number[][]): MethodResult {
  const n = matrix.length;
  if (n === 0) return emptyMethodResult();
  if (n === 1) return { weights: [1], lambdaMax: 1, ci: 0, cr: 0, isConsistent: true };

  const nthRoots = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    // To prevent floating point underflow/overflow for large n, sum logs
    let sumLog = 0;
    for (let j = 0; j < n; j++) {
      const val = matrix[i][j] > 0 ? matrix[i][j] : 1;
      sumLog += Math.log(val);
    }
    nthRoots[i] = Math.exp(sumLog / n);
  }

  const sumRoots = nthRoots.reduce((acc, v) => acc + v, 0);
  const normalizedWeights = nthRoots.map(r => (sumRoots > 0 ? r / sumRoots : 1 / n));

  return computeConsistency(matrix, normalizedWeights);
}

// 3. 特征值法 (Power Iteration to find principal eigenvector)
export function calcEigenvector(matrix: number[][]): MethodResult {
  const n = matrix.length;
  if (n === 0) return emptyMethodResult();
  if (n === 1) return { weights: [1], lambdaMax: 1, ci: 0, cr: 0, isConsistent: true };

  // Power method
  let v = new Array(n).fill(1 / n);
  const maxIter = 1000;
  const tol = 1e-9;

  for (let iter = 0; iter < maxIter; iter++) {
    const nextV = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        nextV[i] += matrix[i][j] * v[j];
      }
    }

    const sumV = nextV.reduce((acc, val) => acc + val, 0);
    const normalizedNextV = nextV.map(val => (sumV > 0 ? val / sumV : 1 / n));

    let diff = 0;
    for (let i = 0; i < n; i++) {
      diff += Math.abs(normalizedNextV[i] - v[i]);
    }

    v = normalizedNextV;
    if (diff < tol) {
      break;
    }
  }

  return computeConsistency(matrix, v);
}

// Compute LambdaMax, CI, CR given a weight vector
export function computeConsistency(matrix: number[][], weights: number[]): MethodResult {
  const n = matrix.length;
  if (n <= 1) {
    return { weights, lambdaMax: n, ci: 0, cr: 0, isConsistent: true };
  }

  // Aw = matrix * weights
  const Aw = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Aw[i] += matrix[i][j] * weights[j];
    }
  }

  // LambdaMax = (1/n) * sum(Aw_i / w_i)
  let sumRatios = 0;
  let validCount = 0;
  for (let i = 0; i < n; i++) {
    if (weights[i] > 1e-12) {
      sumRatios += Aw[i] / weights[i];
      validCount++;
    }
  }

  let lambdaMax = validCount > 0 ? sumRatios / validCount : n;
  if (lambdaMax < n) lambdaMax = n; // By Perron-Frobenius theorem, lambda_max >= n

  const ci = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
  const ri = getRI(n);
  const cr = ri > 0 ? ci / ri : 0;
  const isConsistent = cr < 0.1;

  return {
    weights,
    lambdaMax: Number(lambdaMax.toFixed(5)),
    ci: Number(ci.toFixed(5)),
    cr: Number(cr.toFixed(5)),
    isConsistent,
  };
}

function emptyMethodResult(): MethodResult {
  return { weights: [], lambdaMax: 0, ci: 0, cr: 0, isConsistent: true };
}

// Map a decimal value to standard Saaty 1-9 scale or its reciprocal
export function toNearestScale(val: number): number {
  const saatyScales = [1/9, 1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let best = saatyScales[0];
  let minDiff = Math.abs(val - best);
  for (const s of saatyScales) {
    const diff = Math.abs(val - s);
    if (diff < minDiff) {
      minDiff = diff;
      best = s;
    }
  }
  return best;
}

// Diagnose pairwise matrix inconsistency and return conflict elements + transitivity errors
export function diagnoseMatrix(matrix: number[][], names: string[]): WeightDiagnosisResult {
  const n = matrix.length;
  const eigen = calcEigenvector(matrix);
  const geometric = calcGeometricMean(matrix);
  const arithmetic = calcArithmeticMean(matrix);
  const ri = getRI(n);

  const conflictPairs: WeightDiagnosisResult['conflictPairs'] = [];
  const weights = eigen.weights;

  // 1. Identify pairs (i, j) with largest deviation from w_i / w_j
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ideal = weights[i] / (weights[j] || 1e-6);
      const current = matrix[i][j];
      const ratio = current / ideal;
      // Log deviation measure
      const dev = Math.abs(Math.log(ratio));
      if (dev > 0.35) {
        conflictPairs.push({
          i,
          j,
          nameI: names[i] || `项${i + 1}`,
          nameJ: names[j] || `项${j + 1}`,
          currentValue: Number(current.toFixed(3)),
          suggestedValue: toNearestScale(ideal),
          deviation: Number(dev.toFixed(3)),
        });
      }
    }
  }

  // Sort descending by deviation
  conflictPairs.sort((a, b) => b.deviation - a.deviation);

  // 2. Transitivity violations check:
  // If a_ij > 1.25 and a_jk > 1.25 but a_ik < 0.8 => A preferred over B, B preferred over C, but C preferred over A!
  const transitivityViolations: WeightDiagnosisResult['transitivityViolations'] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      for (let k = 0; k < n; k++) {
        if (i === k || j === k) continue;
        const a_ij = matrix[i][j];
        const a_jk = matrix[j][k];
        const a_ik = matrix[i][k];

        if (a_ij > 1.3 && a_jk > 1.3 && a_ik < 0.77) {
          transitivityViolations.push({
            i,
            j,
            k,
            nameI: names[i] || `项${i + 1}`,
            nameJ: names[j] || `项${j + 1}`,
            nameK: names[k] || `项${k + 1}`,
            rule: `${names[i] || i + 1} 优于 ${names[j] || j + 1}，且 ${names[j] || j + 1} 优于 ${names[k] || k + 1}，但矩阵设定却显示 ${names[k] || k + 1} 优于 ${names[i] || i + 1}`,
          });
        }
      }
    }
  }

  return {
    eigen,
    geometric,
    arithmetic,
    matrixSize: n,
    ri,
    conflictPairs: conflictPairs.slice(0, 5),
    transitivityViolations: transitivityViolations.slice(0, 5),
  };
}

// Synthesize global weights across hierarchy
export function computeSynthesis(
  criteriaMatrix: number[][],
  altMatrices: Record<string, number[][]>,
  criteriaIds: string[],
  criteriaNames: string[],
  altIds: string[],
  altNames: string[],
  method: 'eigen' | 'geometric' | 'arithmetic' = 'eigen'
): SynthesisResult {
  const methodFn = method === 'eigen' ? calcEigenvector : (method === 'geometric' ? calcGeometricMean : calcArithmeticMean);
  const critResult = methodFn(criteriaMatrix);
  const criteriaWeights = critResult.weights;

  // Local weights for each criterion
  // altLocalWeights[altIdx][critIdx]
  const numAlts = altIds.length;
  const numCrits = criteriaIds.length;
  const altLocalWeights: number[][] = Array.from({ length: numAlts }, () => new Array(numCrits).fill(0));

  let critCiSum = 0;
  let critRiSum = 0;

  for (let c = 0; c < numCrits; c++) {
    const cid = criteriaIds[c];
    const m = altMatrices[cid] || createIdentityMatrix(numAlts);
    const altResult = methodFn(m);
    for (let a = 0; a < numAlts; a++) {
      altLocalWeights[a][c] = altResult.weights[a] || (1 / numAlts);
    }
    // Hierarchy consistency index accumulation
    critCiSum += (criteriaWeights[c] || 0) * altResult.ci;
    critRiSum += (criteriaWeights[c] || 0) * getRI(numAlts);
  }

  // Global hierarchy CR
  const totalCI = critResult.ci + critCiSum;
  const totalRI = getRI(numCrits) + critRiSum;
  const hierarchyCr = totalRI > 0 ? totalCI / totalRI : 0;

  // Global score for each alternative: sum(W_c * w_{a|c})
  const globalScores = altIds.map((aid, aIdx) => {
    let score = 0;
    const breakdown = criteriaIds.map((cid, cIdx) => {
      const cWeight = criteriaWeights[cIdx] || 0;
      const lWeight = altLocalWeights[aIdx][cIdx] || 0;
      const contribution = cWeight * lWeight;
      score += contribution;
      return {
        criterionId: cid,
        criterionName: criteriaNames[cIdx] || cid,
        criterionWeight: Number(cWeight.toFixed(4)),
        localWeight: Number(lWeight.toFixed(4)),
        contribution: Number(contribution.toFixed(4)),
      };
    });

    return {
      altId: aid,
      altName: altNames[aIdx] || aid,
      score: Number(score.toFixed(4)),
      rank: 1, // calculated after sorting
      breakdown,
    };
  });

  // Calculate ranks
  const sorted = [...globalScores].sort((a, b) => b.score - a.score);
  sorted.forEach((item, idx) => {
    const original = globalScores.find(g => g.altId === item.altId);
    if (original) original.rank = idx + 1;
  });

  return {
    criteriaWeights: criteriaWeights.map(w => Number(w.toFixed(4))),
    altLocalWeights,
    globalScores,
    hierarchyCr: Number(hierarchyCr.toFixed(4)),
    isHierarchyConsistent: hierarchyCr < 0.1,
  };
}

// Group AHP: Aggregation of Individual Judgments (AIJ) via Geometric Mean
export function aggregateGroupMatrices(
  judges: ExpertJudge[],
  criteriaNames: string[]
): GroupAhpResult {
  if (judges.length === 0) {
    return {
      aggregatedMatrix: [],
      weights: [],
      lambdaMax: 0,
      ci: 0,
      cr: 0,
      expertDisagreements: [],
    };
  }

  const n = judges[0].criteriaMatrix.length;
  // Normalize judge weights so sum = 1
  const sumJudgeWeights = judges.reduce((acc, j) => acc + (j.weight || 1), 0);
  const normalizedJudgeWeights = judges.map(j => ((j.weight || 1) / (sumJudgeWeights || 1)));

  // Aggregate matrix using weighted geometric mean: a_ij_group = prod_k (a_ij_k ^ alpha_k)
  const aggregated: number[][] = Array.from({ length: n }, () => new Array(n).fill(1));
  const expertDisagreements: GroupAhpResult['expertDisagreements'] = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        aggregated[i][j] = 1;
        continue;
      }
      let logSum = 0;
      const values: number[] = [];
      for (let k = 0; k < judges.length; k++) {
        const val = judges[k].criteriaMatrix[i]?.[j] || 1;
        values.push(val);
        logSum += normalizedJudgeWeights[k] * Math.log(val);
      }
      aggregated[i][j] = Math.exp(logSum);

      if (i < j) {
        // Compute variance of log judgments to measure disagreement
        const meanLog = values.reduce((acc, v) => acc + Math.log(v), 0) / values.length;
        const variance = values.reduce((acc, v) => acc + Math.pow(Math.log(v) - meanLog, 2), 0) / values.length;
        expertDisagreements.push({
          criterionI: criteriaNames[i] || `准则${i + 1}`,
          criterionJ: criteriaNames[j] || `准则${j + 1}`,
          mean: Number(aggregated[i][j].toFixed(2)),
          variance: Number(variance.toFixed(3)),
          values,
        });
      }
    }
  }

  // Symmetrize exactly: aggregated[j][i] = 1 / aggregated[i][j]
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      aggregated[i][j] = 1 / aggregated[j][i];
    }
  }

  const result = calcEigenvector(aggregated);

  expertDisagreements.sort((a, b) => b.variance - a.variance);

  return {
    aggregatedMatrix: aggregated,
    weights: result.weights,
    lambdaMax: result.lambdaMax,
    ci: result.ci,
    cr: result.cr,
    expertDisagreements,
  };
}

export function createIdentityMatrix(n: number): number[][] {
  const m: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(1);
    m.push(row);
  }
  return m;
}

// Convert a decimal scale value to human readable string (e.g. 1/3, 5, 1)
export function formatScaleValue(val: number): string {
  if (Math.abs(val - 1) < 0.05) return '1';
  if (val > 1) {
    const rounded = Math.round(val);
    if (Math.abs(val - rounded) < 0.1) return `${rounded}`;
    return val.toFixed(2);
  } else {
    const recip = 1 / val;
    const rounded = Math.round(recip);
    if (Math.abs(recip - rounded) < 0.1) return `1/${rounded}`;
    return val.toFixed(2);
  }
}
