import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { HierarchyModel, ExpertJudge, AhpCase } from '../types/ahp';
import { CLASSIC_CASES } from '../data/cases';
import {
  calcEigenvector,
  calcGeometricMean,
  calcArithmeticMean,
  computeSynthesis,
  diagnoseMatrix,
  aggregateGroupMatrices,
  createIdentityMatrix
} from '../utils/ahpMath';

interface AhpContextType {
  model: HierarchyModel;
  activeCaseId: string | null;
  activeMethod: 'eigen' | 'geometric' | 'arithmetic';
  setActiveMethod: (method: 'eigen' | 'geometric' | 'arithmetic') => void;
  loadCase: (caseId: string) => void;
  resetToDefault: () => void;
  
  // Hierarchy actions
  setGoal: (goal: string) => void;
  addCriterion: (name: string, description?: string) => void;
  removeCriterion: (id: string) => void;
  updateCriterion: (id: string, name: string, description?: string) => void;
  addAlternative: (name: string, description?: string) => void;
  removeAlternative: (id: string) => void;
  updateAlternative: (id: string, name: string, description?: string) => void;
  
  // Matrix actions
  updateCriteriaMatrixCell: (i: number, j: number, value: number) => void;
  updateAltMatrixCell: (criterionId: string, i: number, j: number, value: number) => void;
  applySuggestedFix: (target: 'criteria' | string, i: number, j: number, suggestedValue: number) => void;
  resetMatrixToIdentity: (target: 'criteria' | string) => void;

  // Group decision state & actions
  experts: ExpertJudge[];
  activeExpertIndex: number;
  setActiveExpertIndex: (idx: number) => void;
  updateExpertWeight: (expertId: string, weight: number) => void;
  updateExpertMatrixCell: (expertId: string, i: number, j: number, val: number) => void;
  addExpert: (name: string, title: string) => void;
  removeExpert: (expertId: string) => void;

  // Computed results
  criteriaDiagnosis: ReturnType<typeof diagnoseMatrix>;
  synthesisResult: ReturnType<typeof computeSynthesis>;
  groupAhpResult: ReturnType<typeof aggregateGroupMatrices>;
}

const AhpContext = createContext<AhpContextType | null>(null);

function createInitialModelFromCase(c: AhpCase): HierarchyModel {
  return {
    id: c.id,
    title: c.title,
    description: c.background,
    goal: c.goal,
    criteria: c.criteria.map(item => ({ ...item })),
    alternatives: c.alternatives.map(item => ({ ...item })),
    criteriaMatrix: c.criteriaMatrix.map(row => [...row]),
    altMatrices: Object.fromEntries(
      Object.entries(c.altMatrices).map(([cid, matrix]) => [cid, matrix.map(r => [...r])])
    ),
  };
}

function createInitialExperts(model: HierarchyModel): ExpertJudge[] {
  const n = model.criteria.length;
  const baseMatrix = model.criteriaMatrix;
  
  // Perturb matrix slightly for expert 2 and 3
  const matrix2 = baseMatrix.map((row, i) =>
    row.map((val, j) => {
      if (i === j) return 1;
      if (i < j) {
        // slight variation
        if (val >= 2) return Math.min(9, val + 1);
        if (val <= 1/2) return Math.max(1/9, val * 0.5);
        return 2;
      }
      return 1;
    })
  );
  // enforce reciprocity
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      matrix2[i][j] = 1 / matrix2[j][i];
    }
  }

  const matrix3 = baseMatrix.map((row, i) =>
    row.map((val, j) => {
      if (i === j) return 1;
      if (i < j) {
        if (val >= 3) return Math.max(1, val - 1);
        return val;
      }
      return 1;
    })
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      matrix3[i][j] = 1 / matrix3[j][i];
    }
  }

  return [
    {
      id: 'expert-1',
      name: '张教授',
      title: '首席运筹学与决策工程专家',
      weight: 0.45,
      criteriaMatrix: baseMatrix.map(r => [...r]),
    },
    {
      id: 'expert-2',
      name: '李总监',
      title: '行业应用与财务风控总监',
      weight: 0.35,
      criteriaMatrix: matrix2,
    },
    {
      id: 'expert-3',
      name: '王工',
      title: '资深技术研发与工程主管',
      weight: 0.20,
      criteriaMatrix: matrix3,
    },
  ];
}

export const AhpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCaseId, setActiveCaseId] = useState<string | null>('car-purchase');
  const [model, setModel] = useState<HierarchyModel>(() =>
    createInitialModelFromCase(CLASSIC_CASES[0])
  );
  const [activeMethod, setActiveMethod] = useState<'eigen' | 'geometric' | 'arithmetic'>('eigen');
  const [experts, setExperts] = useState<ExpertJudge[]>(() =>
    createInitialExperts(createInitialModelFromCase(CLASSIC_CASES[0]))
  );
  const [activeExpertIndex, setActiveExpertIndex] = useState<number>(0);

  const loadCase = useCallback((caseId: string) => {
    const c = CLASSIC_CASES.find(item => item.id === caseId);
    if (!c) return;
    const newModel = createInitialModelFromCase(c);
    setModel(newModel);
    setActiveCaseId(caseId);
    setExperts(createInitialExperts(newModel));
    setActiveExpertIndex(0);
  }, []);

  const resetToDefault = useCallback(() => {
    loadCase(CLASSIC_CASES[0].id);
  }, [loadCase]);

  const setGoal = useCallback((goal: string) => {
    setModel(prev => ({ ...prev, goal }));
  }, []);

  const addCriterion = useCallback((name: string, description = '') => {
    setModel(prev => {
      const newId = `c_${Date.now()}`;
      const newCrit = { id: newId, name, description };
      const newCriteria = [...prev.criteria, newCrit];
      const newLen = newCriteria.length;

      // Expand criteria matrix by 1 dimension
      const newCriteriaMatrix = prev.criteriaMatrix.map(row => [...row, 1]);
      newCriteriaMatrix.push(new Array(newLen).fill(1));

      // Create alternative comparison matrix for this new criterion
      const numAlts = prev.alternatives.length;
      const newAltMatrices = {
        ...prev.altMatrices,
        [newId]: createIdentityMatrix(numAlts),
      };

      return {
        ...prev,
        criteria: newCriteria,
        criteriaMatrix: newCriteriaMatrix,
        altMatrices: newAltMatrices,
      };
    });
  }, []);

  const removeCriterion = useCallback((id: string) => {
    setModel(prev => {
      if (prev.criteria.length <= 2) {
        alert('准则层至少需要保留 2 个要素以进行两两对比！');
        return prev;
      }
      const idx = prev.criteria.findIndex(c => c.id === id);
      if (idx === -1) return prev;

      const newCriteria = prev.criteria.filter(c => c.id !== id);
      const newCriteriaMatrix = prev.criteriaMatrix
        .filter((_, r) => r !== idx)
        .map(row => row.filter((_, c) => c !== idx));

      const newAltMatrices = { ...prev.altMatrices };
      delete newAltMatrices[id];

      return {
        ...prev,
        criteria: newCriteria,
        criteriaMatrix: newCriteriaMatrix,
        altMatrices: newAltMatrices,
      };
    });
  }, []);

  const updateCriterion = useCallback((id: string, name: string, description?: string) => {
    setModel(prev => ({
      ...prev,
      criteria: prev.criteria.map(c => (c.id === id ? { ...c, name, description } : c)),
    }));
  }, []);

  const addAlternative = useCallback((name: string, description = '') => {
    setModel(prev => {
      const newId = `a_${Date.now()}`;
      const newAlt = { id: newId, name, description };
      const newAlts = [...prev.alternatives, newAlt];
      const newLen = newAlts.length;

      // Expand all alt matrices by 1 dimension
      const newAltMatrices: Record<string, number[][]> = {};
      for (const [cid, mat] of Object.entries(prev.altMatrices)) {
        const expanded = mat.map(row => [...row, 1]);
        expanded.push(new Array(newLen).fill(1));
        newAltMatrices[cid] = expanded;
      }

      return {
        ...prev,
        alternatives: newAlts,
        altMatrices: newAltMatrices,
      };
    });
  }, []);

  const removeAlternative = useCallback((id: string) => {
    setModel(prev => {
      if (prev.alternatives.length <= 2) {
        alert('方案层至少需要保留 2 个方案以进行选优！');
        return prev;
      }
      const idx = prev.alternatives.findIndex(a => a.id === id);
      if (idx === -1) return prev;

      const newAlts = prev.alternatives.filter(a => a.id !== id);
      const newAltMatrices: Record<string, number[][]> = {};
      for (const [cid, mat] of Object.entries(prev.altMatrices)) {
        newAltMatrices[cid] = mat
          .filter((_, r) => r !== idx)
          .map(row => row.filter((_, c) => c !== idx));
      }

      return {
        ...prev,
        alternatives: newAlts,
        altMatrices: newAltMatrices,
      };
    });
  }, []);

  const updateAlternative = useCallback((id: string, name: string, description?: string) => {
    setModel(prev => ({
      ...prev,
      alternatives: prev.alternatives.map(a => (a.id === id ? { ...a, name, description } : a)),
    }));
  }, []);

  const updateCriteriaMatrixCell = useCallback((i: number, j: number, val: number) => {
    if (val <= 0) return;
    setModel(prev => {
      const newMat = prev.criteriaMatrix.map(row => [...row]);
      newMat[i][j] = val;
      newMat[j][i] = 1 / val;
      return {
        ...prev,
        criteriaMatrix: newMat,
      };
    });
  }, []);

  const updateAltMatrixCell = useCallback((criterionId: string, i: number, j: number, val: number) => {
    if (val <= 0) return;
    setModel(prev => {
      const cur = prev.altMatrices[criterionId] || createIdentityMatrix(prev.alternatives.length);
      const newMat = cur.map(row => [...row]);
      newMat[i][j] = val;
      newMat[j][i] = 1 / val;
      return {
        ...prev,
        altMatrices: {
          ...prev.altMatrices,
          [criterionId]: newMat,
        },
      };
    });
  }, []);

  const applySuggestedFix = useCallback((target: 'criteria' | string, i: number, j: number, suggestedValue: number) => {
    if (target === 'criteria') {
      updateCriteriaMatrixCell(i, j, suggestedValue);
    } else {
      updateAltMatrixCell(target, i, j, suggestedValue);
    }
  }, [updateCriteriaMatrixCell, updateAltMatrixCell]);

  const resetMatrixToIdentity = useCallback((target: 'criteria' | string) => {
    if (target === 'criteria') {
      setModel(prev => ({
        ...prev,
        criteriaMatrix: createIdentityMatrix(prev.criteria.length),
      }));
    } else {
      setModel(prev => ({
        ...prev,
        altMatrices: {
          ...prev.altMatrices,
          [target]: createIdentityMatrix(prev.alternatives.length),
        },
      }));
    }
  }, []);

  // Expert actions
  const updateExpertWeight = useCallback((expertId: string, weight: number) => {
    setExperts(prev => prev.map(e => (e.id === expertId ? { ...e, weight } : e)));
  }, []);

  const updateExpertMatrixCell = useCallback((expertId: string, i: number, j: number, val: number) => {
    if (val <= 0) return;
    setExperts(prev =>
      prev.map(e => {
        if (e.id !== expertId) return e;
        const newMat = e.criteriaMatrix.map(r => [...r]);
        newMat[i][j] = val;
        newMat[j][i] = 1 / val;
        return { ...e, criteriaMatrix: newMat };
      })
    );
  }, []);

  const addExpert = useCallback((name: string, title: string) => {
    setExperts(prev => [
      ...prev,
      {
        id: `expert-${Date.now()}`,
        name,
        title,
        weight: 0.2,
        criteriaMatrix: model.criteriaMatrix.map(r => [...r]),
      },
    ]);
  }, [model.criteriaMatrix]);

  const removeExpert = useCallback((expertId: string) => {
    setExperts(prev => {
      if (prev.length <= 1) {
        alert('群体决策至少需要 1 位专家！');
        return prev;
      }
      return prev.filter(e => e.id !== expertId);
    });
  }, []);

  // Computed properties
  const criteriaDiagnosis = useMemo(() => {
    return diagnoseMatrix(model.criteriaMatrix, model.criteria.map(c => c.name));
  }, [model.criteriaMatrix, model.criteria]);

  const synthesisResult = useMemo(() => {
    return computeSynthesis(
      model.criteriaMatrix,
      model.altMatrices,
      model.criteria.map(c => c.id),
      model.criteria.map(c => c.name),
      model.alternatives.map(a => a.id),
      model.alternatives.map(a => a.name),
      activeMethod
    );
  }, [model, activeMethod]);

  const groupAhpResult = useMemo(() => {
    return aggregateGroupMatrices(experts, model.criteria.map(c => c.name));
  }, [experts, model.criteria]);

  return (
    <AhpContext.Provider
      value={{
        model,
        activeCaseId,
        activeMethod,
        setActiveMethod,
        loadCase,
        resetToDefault,
        setGoal,
        addCriterion,
        removeCriterion,
        updateCriterion,
        addAlternative,
        removeAlternative,
        updateAlternative,
        updateCriteriaMatrixCell,
        updateAltMatrixCell,
        applySuggestedFix,
        resetMatrixToIdentity,
        experts,
        activeExpertIndex,
        setActiveExpertIndex,
        updateExpertWeight,
        updateExpertMatrixCell,
        addExpert,
        removeExpert,
        criteriaDiagnosis,
        synthesisResult,
        groupAhpResult,
      }}
    >
      {children}
    </AhpContext.Provider>
  );
};

export function useAhp() {
  const context = useContext(AhpContext);
  if (!context) {
    throw new Error('useAhp must be used within an AhpProvider');
  }
  return context;
}
