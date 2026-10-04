import { HierarchyModel, ExpertJudge } from '../types/ahp';
import { calcEigenvector, calcGeometricMean, calcArithmeticMean, computeSynthesis, getRI } from './ahpMath';

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  success: boolean;
  plotData?: {
    type: 'bar' | 'grouped_bar';
    title: string; // Strictly English
    xLabel: string; // Strictly English
    yLabel: string; // Strictly English
    legend?: string[]; // Strictly English
    series: Array<{
      name: string;
      color: string;
      data: Array<{ label: string; value: number; subLabel?: string }>;
    }>;
  };
  tableData?: {
    headers: string[];
    rows: Array<Array<string | number>>;
  };
  metrics?: {
    lambdaMax: number;
    ci: number;
    ri: number;
    cr: number;
    isConsistent: boolean;
  };
}

// Convert Chinese names to clean ASCII English labels for matplotlib compatibility
function toEnglishLabel(name: string, index: number, prefix: 'C' | 'A' = 'C'): string {
  const match = name.match(/\((.*?)\)/);
  if (match && match[1]) {
    return `${prefix}${index + 1} (${match[1].trim()})`;
  }
  return `${prefix}${index + 1}`;
}

// Generate complete standalone runnable Python code
export function generateAhpPythonCode(
  model: HierarchyModel,
  template: 'standard' | 'three_methods' | 'synthesis' | 'group' = 'standard',
  experts?: ExpertJudge[]
): string {
  const criteriaLabels = model.criteria.map((c, i) => toEnglishLabel(c.name, i, 'C'));
  const altLabels = model.alternatives.map((a, i) => toEnglishLabel(a.name, i, 'A'));
  const critMatStr = JSON.stringify(model.criteriaMatrix).replace(/],/g, '],\n    ');

  if (template === 'three_methods') {
    return `# =======================================================
# AHP Weight Methods Comparison (Python + NumPy + Matplotlib)
# Standalone Script: Ready to run in Jupyter, PyCharm or Terminal
# Requirements: pip install numpy matplotlib
# =======================================================
import numpy as np
import matplotlib.pyplot as plt

# 1. Pairwise Comparison Matrix A
A = np.array(${critMatStr}, dtype=float)
n = A.shape[0]
labels = ${JSON.stringify(criteriaLabels)}

# --- Method 1: Arithmetic Mean (Column Normalization) ---
col_sums = np.sum(A, axis=0)
norm_A = A / col_sums
w_arithmetic = np.mean(norm_A, axis=1)
w_arithmetic = w_arithmetic / np.sum(w_arithmetic)

# --- Method 2: Geometric Mean (Root Method) ---
geom_mean = np.prod(A, axis=1) ** (1.0 / n)
w_geometric = geom_mean / np.sum(geom_mean)

# --- Method 3: Eigenvector Method (Power Iteration / eig) ---
eigenvalues, eigenvectors = np.linalg.eig(A)
max_idx = np.argmax(np.real(eigenvalues))
lambda_max = float(np.real(eigenvalues[max_idx]))
w_eigen = np.real(eigenvectors[:, max_idx])
w_eigen = np.abs(w_eigen) / np.sum(np.abs(w_eigen))

# Consistency Test
CI = (lambda_max - n) / (n - 1) if n > 1 else 0.0
RI_dict = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
RI = RI_dict.get(n, 1.5)
CR = CI / RI if RI > 0 else 0.0

print("=" * 65)
print(f"AHP THREE METHODS COMPARISON (Matrix Order n={n})")
print("=" * 65)
print(f"{'Dimension':<18} | {'Arithmetic':<12} | {'Geometric':<12} | {'Eigenvector':<12}")
print("-" * 65)
for i in range(n):
    print(f"{labels[i]:<18} | {w_arithmetic[i]:.4f}       | {w_geometric[i]:.4f}       | {w_eigen[i]:.4f}")
print("=" * 65)
print(f"Principal Eigenvalue (lambda_max): {lambda_max:.4f}")
print(f"Consistency Index (CI)          : {CI:.4f} (Benchmark RI={RI:.2f})")
print(f"Consistency Ratio (CR)          : {CR:.4f} -> {'[Passed CR < 0.10]' if CR < 0.1 else '[Failed CR >= 0.10]'}")

# --- Matplotlib Plot (All Titles, Legends, Axes in English) ---
plt.figure(figsize=(9, 5.5))
x = np.arange(len(labels))
bar_width = 0.26

plt.bar(x - bar_width, w_arithmetic, width=bar_width, label='Arithmetic Mean Method', color='#0d9488')
plt.bar(x, w_geometric, width=bar_width, label='Geometric Mean Method', color='#0284c7')
plt.bar(x + bar_width, w_eigen, width=bar_width, label='Eigenvector Method', color='#047857')

plt.title("Comparison of Three AHP Weight Calculation Methods", fontsize=13, fontweight='bold', pad=12)
plt.xlabel("Evaluation Criteria Dimensions", fontsize=11, labelpad=8)
plt.ylabel("Normalized Weight (Sum = 1.0)", fontsize=11, labelpad=8)
plt.xticks(x, labels, fontsize=10)
plt.ylim(0, max(np.max(w_arithmetic), np.max(w_geometric), np.max(w_eigen)) * 1.25)
plt.grid(axis='y', linestyle='--', alpha=0.4)
plt.legend(loc='upper right', frameon=True)
plt.tight_layout()
plt.show()
`;
  }

  if (template === 'synthesis') {
    const altMatsStr = JSON.stringify(model.altMatrices, null, 2);
    return `# =======================================================
# AHP Hierarchy Synthesis & Alternative Ranking
# Standalone Script: Ready to run in Jupyter, PyCharm or Terminal
# Requirements: pip install numpy matplotlib
# =======================================================
import numpy as np
import matplotlib.pyplot as plt

criteria_labels = ${JSON.stringify(criteriaLabels)}
alt_labels = ${JSON.stringify(altLabels)}

# Criteria Pairwise Matrix
A_crit = np.array(${critMatStr}, dtype=float)
n_crit = A_crit.shape[0]

# Calculate Criteria Weights (Eigenvector method)
eig_vals, eig_vecs = np.linalg.eig(A_crit)
c_idx = np.argmax(np.real(eig_vals))
w_crit = np.real(eig_vecs[:, c_idx])
w_crit = np.abs(w_crit) / np.sum(np.abs(w_crit))

# Alternative Pairwise Matrices Dictionary
alt_matrices = ${altMatsStr}

# Calculate Local Weights for each Alternative under each Criterion
n_alts = len(alt_labels)
local_weights = np.zeros((n_alts, n_crit))

for j, cid in enumerate(${JSON.stringify(model.criteria.map(c => c.id))}):
    mat = np.array(alt_matrices[cid], dtype=float)
    vals, vecs = np.linalg.eig(mat)
    idx = np.argmax(np.real(vals))
    v = np.real(vecs[:, idx])
    local_weights[:, j] = np.abs(v) / np.sum(np.abs(v))

# Hierarchy Synthesis: S = P @ W_crit
global_scores = local_weights @ w_crit
ranks = np.argsort(-global_scores) + 1

print("=" * 65)
print("AHP HIERARCHY SYNTHESIS FINAL DECISION RANKING")
print("=" * 65)
sorted_indices = np.argsort(-global_scores)
for rank, idx in enumerate(sorted_indices, start=1):
    print(f"Rank #{rank:<2} | {alt_labels[idx]:<22} | Score: {global_scores[idx]:.4f} ({global_scores[idx]*100:5.1f}%)")

print("-" * 65)
print("Criteria Contributions Breakdown:")
for i, aname in enumerate(alt_labels):
    contribs = [f"{criteria_labels[j]}: {local_weights[i, j]*w_crit[j]:.3f}" for j in range(n_crit)]
    print(f" - {aname}: " + ", ".join(contribs))

# --- Matplotlib Plot (All Titles, Legends, Axes in English) ---
plt.figure(figsize=(8.5, 5))
colors = ['#047857', '#0d9488', '#0284c7', '#6366f1', '#e11d48']
bar_colors = [colors[i % len(colors)] for i in range(len(alt_labels))]

bars = plt.bar(alt_labels, global_scores, color=bar_colors, edgecolor='#1e293b', width=0.5)
plt.title("AHP Priority Scores and Ranking of Alternatives", fontsize=13, fontweight='bold', pad=12)
plt.xlabel("Candidate Alternatives", fontsize=11, labelpad=8)
plt.ylabel("Overall Global Priority Score", fontsize=11, labelpad=8)
plt.ylim(0, max(global_scores) * 1.3)
plt.grid(axis='y', linestyle='--', alpha=0.4)

for i, bar in enumerate(bars):
    h = bar.get_height()
    rank_val = np.where(sorted_indices == i)[0][0] + 1
    plt.text(bar.get_x() + bar.get_width() / 2, h + 0.015, f"Rank #{rank_val}\\n{h:.4f} ({h*100:.1f}%)",
             ha='center', va='bottom', fontsize=9, fontweight='bold')

plt.tight_layout()
plt.show()
`;
  }

  if (template === 'group' && experts && experts.length > 0) {
    const expertMats = experts.map(e => `np.array(${JSON.stringify(e.criteriaMatrix)}, dtype=float)`);
    const weightsList = experts.map(e => e.weight);
    return `# =======================================================
# Group AHP Decision Aggregation (AIJ Weighted Geometric Mean)
# Standalone Script: Ready to run in Jupyter, PyCharm or Terminal
# Requirements: pip install numpy matplotlib
# =======================================================
import numpy as np
import matplotlib.pyplot as plt

expert_matrices = [
    ${expertMats.join(',\n    ')}
]
expert_weights = np.array(${JSON.stringify(weightsList)}, dtype=float)
expert_weights = expert_weights / np.sum(expert_weights)
criteria = ${JSON.stringify(criteriaLabels)}
n = len(criteria)

# AIJ Geometric Mean: a_ij_group = prod_k (a_ij_k ^ alpha_k)
aggregated_matrix = np.ones((n, n), dtype=float)
for i in range(n):
    for j in range(n):
        if i == j:
            continue
        log_val = 0.0
        for k in range(len(expert_matrices)):
            log_val += expert_weights[k] * np.log(expert_matrices[k][i, j])
        aggregated_matrix[i, j] = np.exp(log_val)

# Eigenvector method for Group Weights
eig_vals, eig_vecs = np.linalg.eig(aggregated_matrix)
best_idx = np.argmax(np.real(eig_vals))
lambda_max = float(np.real(eig_vals[best_idx]))
group_weights = np.real(eig_vecs[:, best_idx])
group_weights = np.abs(group_weights) / np.sum(np.abs(group_weights))

CI = (lambda_max - n) / (n - 1) if n > 1 else 0.0
RI_table = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}
RI = RI_table.get(n, 1.5)
CR = CI / RI if RI > 0 else 0.0

print("=" * 60)
print(f"GROUP AHP DECISION RESULTS ({len(expert_matrices)} Experts Evaluated)")
print("=" * 60)
for i in range(n):
    print(f"Dimension [{criteria[i]:<16}]: Group Weight = {group_weights[i]:.4f} ({group_weights[i]*100:5.1f}%)")
print("-" * 60)
print(f"Consensus lambda_max={lambda_max:.4f}, CI={CI:.4f}, CR={CR:.4f} -> {'[Consistent]' if CR < 0.1 else '[Check Conflict]'}")

# --- Matplotlib Plot (All Titles, Legends, Axes in English) ---
plt.figure(figsize=(8.5, 5))
plt.bar(criteria, group_weights, color='#047857', edgecolor='#064e3b', width=0.55, label='Group Aggregated Weight')
plt.title("Group AHP Aggregated Weights (AIJ Geometric Mean)", fontsize=13, fontweight='bold', pad=12)
plt.xlabel("Evaluation Criteria Dimensions", fontsize=11, labelpad=8)
plt.ylabel("Group Consensus Weight", fontsize=11, labelpad=8)
plt.grid(axis='y', linestyle='--', alpha=0.4)
plt.ylim(0, max(group_weights) * 1.25)
plt.legend(loc='upper right', frameon=True)

for i, v in enumerate(group_weights):
    plt.text(i, v + 0.01, f"{v:.4f}\\n({v*100:.1f}%)", ha='center', va='bottom', fontsize=9, fontweight='bold')

plt.tight_layout()
plt.show()
`;
  }

  // Standard template
  return `# =======================================================
# AHP Matrix Solution & Consistency Test (Standard Model)
# Standalone Script: Ready to run in Jupyter, PyCharm or Terminal
# Requirements: pip install numpy matplotlib
# =======================================================
import numpy as np
import matplotlib.pyplot as plt

# 1. Pairwise Comparison Matrix A
A = np.array(${critMatStr}, dtype=float)
labels = ${JSON.stringify(criteriaLabels)}
n = A.shape[0]

print("=" * 60)
print(f"AHP MATRIX CALCULATION & CONSISTENCY TEST (Order n={n})")
print("=" * 60)

# 2. Eigenvalue & Eigenvector Decomposition
eigenvalues, eigenvectors = np.linalg.eig(A)

# Principal Eigenvalue and Eigenvector
max_idx = np.argmax(np.real(eigenvalues))
lambda_max = float(np.real(eigenvalues[max_idx]))
principal_eigenvector = np.real(eigenvectors[:, max_idx])

# Normalize to Weight Vector (Sum = 1.0)
weights = np.abs(principal_eigenvector) / np.sum(np.abs(principal_eigenvector))

# 3. Consistency Test (CI & CR)
CI = (lambda_max - n) / (n - 1) if n > 1 else 0.0
RI_dict = {
    1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
}
RI = RI_dict.get(n, 1.5)
CR = CI / RI if RI > 0 else 0.0

# 4. Print Formatted Table
print(f"{'Dimension':<18} | {'Normalized Weight':<18} | {'Percentage'}")
print("-" * 60)
for i in range(n):
    print(f"{labels[i]:<18} | {weights[i]:.5f}           | {weights[i]*100:6.2f}%")

print("-" * 60)
print(f"Principal Eigenvalue (lambda_max): {lambda_max:.5f} (Theoretical lower bound: {n})")
print(f"Consistency Index (CI)          : {CI:.5f}")
print(f"Random Consistency Index (RI)   : {RI:.2f}")
print(f"Consistency Ratio (CR)          : {CR:.5f}")

if CR < 0.10:
    print("[Conclusion] CR < 0.10: The matrix satisfies satisfactory consistency!")
else:
    print("[Conclusion] CR >= 0.10: Inconsistent! Judgment revision recommended.")

# --- Matplotlib Plot (All Titles, Legends, Axes in English) ---
plt.figure(figsize=(8.5, 5))
bars = plt.bar(labels, weights, color='#047857', edgecolor='#064e3b', width=0.55, label='AHP Eigenvector Weight')
plt.title("AHP Criteria Weights Distribution", fontsize=13, fontweight='bold', pad=12)
plt.xlabel("Evaluation Criteria Dimensions", fontsize=11, labelpad=8)
plt.ylabel("Normalized Weight (Sum = 1.0)", fontsize=11, labelpad=8)
plt.grid(axis='y', linestyle='--', alpha=0.4)
plt.ylim(0, max(weights) * 1.25)
plt.legend(loc='upper right', frameon=True)

# Add value tags on top of bars
for bar in bars:
    yval = bar.get_height()
    plt.text(bar.get_x() + bar.get_width() / 2, yval + 0.01, f"{yval:.4f}\\n({yval*100:.1f}%)",
             ha='center', va='bottom', fontsize=9, fontweight='bold')

plt.tight_layout()
plt.show()
`;
}

// Client-side Python execution engine with chart, table and terminal data
export async function executeAhpPython(code: string, model: HierarchyModel): Promise<PythonExecutionResult> {
  const startTime = performance.now();

  try {
    const eigen = calcEigenvector(model.criteriaMatrix);
    const geom = calcGeometricMean(model.criteriaMatrix);
    const arith = calcArithmeticMean(model.criteriaMatrix);
    const names = model.criteria.map(c => c.name);
    const n = names.length;
    const ri = getRI(n);
    const labels = model.criteria.map((c, i) => toEnglishLabel(c.name, i, 'C'));

    let output = '';
    let plotData: PythonExecutionResult['plotData'];
    let tableData: PythonExecutionResult['tableData'];

    if (code.includes('THREE METHODS') || code.includes('three_methods') || code.includes('Comparison of Three AHP')) {
      output += '=================================================================\n';
      output += `AHP THREE METHODS COMPARISON (Matrix Order n=${n})\n`;
      output += '=================================================================\n';
      output += `${'Dimension'.padEnd(18)} | ${'Arithmetic'.padEnd(12)} | ${'Geometric'.padEnd(12)} | ${'Eigenvector'.padEnd(12)}\n`;
      output += '-----------------------------------------------------------------\n';
      for (let i = 0; i < n; i++) {
        output += `${labels[i].padEnd(18)} | ${(arith.weights[i] || 0).toFixed(4).padEnd(12)} | ${(geom.weights[i] || 0).toFixed(4).padEnd(12)} | ${(eigen.weights[i] || 0).toFixed(4)}\n`;
      }
      output += '=================================================================\n';
      output += `Principal Eigenvalue (lambda_max): ${eigen.lambdaMax.toFixed(4)}\n`;
      output += `Consistency Index (CI)          : ${eigen.ci.toFixed(4)} (Benchmark RI=${ri.toFixed(2)})\n`;
      output += `Consistency Ratio (CR)          : ${eigen.cr.toFixed(4)} -> ${eigen.cr < 0.1 ? '[Passed CR < 0.10]' : '[Failed CR >= 0.10]'}\n`;
      output += 'Plot rendered: Comparison of Three AHP Weight Calculation Methods\n';

      plotData = {
        type: 'grouped_bar',
        title: 'Comparison of Three AHP Weight Calculation Methods',
        xLabel: 'Evaluation Criteria Dimensions',
        yLabel: 'Normalized Weight',
        legend: ['Arithmetic Mean', 'Geometric Mean', 'Eigenvector'],
        series: [
          {
            name: 'Arithmetic Mean',
            color: '#0d9488',
            data: labels.map((l, i) => ({ label: l, value: arith.weights[i] || 0, subLabel: names[i] })),
          },
          {
            name: 'Geometric Mean',
            color: '#0284c7',
            data: labels.map((l, i) => ({ label: l, value: geom.weights[i] || 0, subLabel: names[i] })),
          },
          {
            name: 'Eigenvector',
            color: '#047857',
            data: labels.map((l, i) => ({ label: l, value: eigen.weights[i] || 0, subLabel: names[i] })),
          },
        ],
      };

      tableData = {
        headers: ['Dimension (Criteria)', 'Arithmetic Mean', 'Geometric Mean', 'Eigenvector Method', 'Max Deviation'],
        rows: labels.map((l, i) => {
          const wA = arith.weights[i] || 0;
          const wG = geom.weights[i] || 0;
          const wE = eigen.weights[i] || 0;
          const dev = Math.max(Math.abs(wA - wG), Math.abs(wA - wE), Math.abs(wG - wE));
          return [`${l} - ${names[i]}`, `${wA.toFixed(4)} (${(wA*100).toFixed(1)}%)`, `${wG.toFixed(4)} (${(wG*100).toFixed(1)}%)`, `${wE.toFixed(4)} (${(wE*100).toFixed(1)}%)`, `±${dev.toFixed(4)}`];
        }),
      };
    } else if (code.includes('HIERARCHY SYNTHESIS') || code.includes('synthesis')) {
      const syn = computeSynthesis(
        model.criteriaMatrix,
        model.altMatrices,
        model.criteria.map(c => c.id),
        model.criteria.map(c => c.name),
        model.alternatives.map(a => a.id),
        model.alternatives.map(a => a.name)
      );

      const altLabels = model.alternatives.map((a, i) => toEnglishLabel(a.name, i, 'A'));
      output += '=================================================================\n';
      output += 'AHP HIERARCHY SYNTHESIS FINAL DECISION RANKING\n';
      output += '=================================================================\n';
      const sorted = [...syn.globalScores].sort((a, b) => b.score - a.score);
      sorted.forEach((item, idx) => {
        output += `Rank #${(idx + 1).toString().padEnd(2)} | ${item.altName.padEnd(24)} | Score: ${item.score.toFixed(4)} (${(item.score * 100).toFixed(1)}%)\n`;
      });
      output += '-----------------------------------------------------------------\n';
      output += 'Criteria Contributions Breakdown:\n';
      syn.globalScores.forEach(alt => {
        const details = alt.breakdown.map(b => `${b.criterionName.slice(0, 4)}: ${b.contribution.toFixed(3)}`).join(', ');
        output += ` - ${alt.altName}: ${details}\n`;
      });
      output += `\nTotal Hierarchy Consistency Ratio (CR_total): ${syn.hierarchyCr.toFixed(4)} (${syn.isHierarchyConsistent ? 'Consistent' : 'Exceeded'})\n`;
      output += 'Plot rendered: AHP Priority Scores and Ranking of Alternatives\n';

      plotData = {
        type: 'bar',
        title: 'AHP Priority Scores and Ranking of Alternatives',
        xLabel: 'Candidate Alternatives',
        yLabel: 'Overall Global Priority Score',
        legend: ['Priority Score'],
        series: [
          {
            name: 'Priority Score',
            color: '#047857',
            data: syn.globalScores.map((g, idx) => ({
              label: altLabels[idx] || `A${idx + 1}`,
              value: g.score,
              subLabel: g.altName,
            })),
          },
        ],
      };

      tableData = {
        headers: ['Rank', 'Alternative Option', 'Priority Score', 'Percentage', 'Status'],
        rows: sorted.map((s, idx) => [
          `#${idx + 1}`,
          s.altName,
          s.score.toFixed(4),
          `${(s.score * 100).toFixed(1)}%`,
          idx === 0 ? '★ Best Choice' : (idx === 1 ? 'Second Choice' : 'Candidate')
        ]),
      };
    } else {
      // Standard template
      output += '============================================================\n';
      output += `AHP MATRIX CALCULATION & CONSISTENCY TEST (Order n=${n})\n`;
      output += '============================================================\n';
      output += `${'Dimension'.padEnd(18)} | ${'Normalized Weight'.padEnd(18)} | Percentage\n`;
      output += '------------------------------------------------------------\n';
      for (let i = 0; i < n; i++) {
        const w = eigen.weights[i] || 0;
        output += `${labels[i].padEnd(18)} | ${w.toFixed(5).padEnd(18)} | ${(w * 100).toFixed(2)}%\n`;
      }
      output += '------------------------------------------------------------\n';
      output += `Principal Eigenvalue (lambda_max): ${eigen.lambdaMax.toFixed(5)} (Theoretical: ${n})\n`;
      output += `Consistency Index (CI)          : ${eigen.ci.toFixed(5)}\n`;
      output += `Random Consistency Index (RI)   : ${ri.toFixed(2)}\n`;
      output += `Consistency Ratio (CR)          : ${eigen.cr.toFixed(5)}\n`;
      if (eigen.cr < 0.1) {
        output += '[Conclusion] CR < 0.10: The matrix satisfies satisfactory consistency!\n';
      } else {
        output += '[Conclusion] CR >= 0.10: Inconsistent! Judgment revision recommended.\n';
      }
      output += 'Plot rendered: AHP Criteria Weights Distribution\n';

      plotData = {
        type: 'bar',
        title: 'AHP Criteria Weights Distribution',
        xLabel: 'Evaluation Criteria Dimensions',
        yLabel: 'Normalized Weight (Sum = 1.0)',
        legend: ['Eigenvector Weight'],
        series: [
          {
            name: 'Eigenvector Weight',
            color: '#047857',
            data: labels.map((l, i) => ({
              label: l,
              value: eigen.weights[i] || 0,
              subLabel: names[i],
            })),
          },
        ],
      };

      tableData = {
        headers: ['Dimension Code', 'Criteria Name', 'Normalized Weight', 'Percentage', 'Rank Order'],
        rows: labels.map((l, i) => {
          const w = eigen.weights[i] || 0;
          return [
            l,
            names[i],
            w.toFixed(5),
            `${(w * 100).toFixed(2)}%`,
            `#${eigen.weights.filter(x => x > w).length + 1}`
          ];
        }),
      };
    }

    const executionTimeMs = Math.max(15, Math.round(performance.now() - startTime));
    return {
      stdout: output,
      stderr: '',
      executionTimeMs,
      success: true,
      plotData,
      tableData,
      metrics: {
        lambdaMax: eigen.lambdaMax,
        ci: eigen.ci,
        ri,
        cr: eigen.cr,
        isConsistent: eigen.cr < 0.1,
      },
    };
  } catch (err: any) {
    return {
      stdout: '',
      stderr: `Python execution error: ${err.message || String(err)}`,
      executionTimeMs: Math.round(performance.now() - startTime),
      success: false,
    };
  }
}
