export interface Criterion {
  id: string;
  name: string;
  description?: string;
  weight?: number;
}

export interface Alternative {
  id: string;
  name: string;
  description?: string;
}

export interface HierarchyModel {
  id: string;
  title: string;
  description: string;
  goal: string;
  criteria: Criterion[];
  alternatives: Alternative[];
  // Criteria pairwise matrix (n x n)
  criteriaMatrix: number[][];
  // Alternative pairwise matrices for each criterion id: (m x m)
  altMatrices: Record<string, number[][]>;
}

export type CalcMethod = 'eigen' | 'geometric' | 'arithmetic';

export interface MethodResult {
  weights: number[];
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
}

export interface WeightDiagnosisResult {
  eigen: MethodResult;
  geometric: MethodResult;
  arithmetic: MethodResult;
  matrixSize: number;
  ri: number;
  // Inconsistency pairs that deviate most from w_i / w_j
  conflictPairs: Array<{
    i: number;
    j: number;
    nameI: string;
    nameJ: string;
    currentValue: number;
    suggestedValue: number;
    deviation: number;
  }>;
  // Transitivity violations e.g. A > B, B > C, but A < C
  transitivityViolations: Array<{
    i: number;
    j: number;
    k: number;
    nameI: string;
    nameJ: string;
    nameK: string;
    rule: string;
  }>;
}

export interface SynthesisResult {
  criteriaWeights: number[];
  // altWeightsPerCriterion[altIndex][criterionIndex]
  altLocalWeights: number[][];
  // global scores for each alternative
  globalScores: Array<{
    altId: string;
    altName: string;
    score: number;
    rank: number;
    breakdown: Array<{
      criterionId: string;
      criterionName: string;
      criterionWeight: number;
      localWeight: number;
      contribution: number;
    }>;
  }>;
  hierarchyCr: number;
  isHierarchyConsistent: boolean;
}

export interface ExpertJudge {
  id: string;
  name: string;
  title: string;
  weight: number; // 0 to 1
  criteriaMatrix: number[][];
}

export interface GroupAhpResult {
  aggregatedMatrix: number[][];
  weights: number[];
  lambdaMax: number;
  ci: number;
  cr: number;
  expertDisagreements: Array<{
    criterionI: string;
    criterionJ: string;
    mean: number;
    variance: number;
    values: number[];
  }>;
}

export interface AhpCase {
  id: string;
  category: string;
  title: string;
  tagline: string;
  background: string;
  goal: string;
  criteria: Array<{ id: string; name: string; description: string }>;
  alternatives: Array<{ id: string; name: string; description: string }>;
  criteriaMatrix: number[][];
  altMatrices: Record<string, number[][]>;
  authorNotes: string;
}
