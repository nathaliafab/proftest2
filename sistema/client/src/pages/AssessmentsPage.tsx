import { useEffect, useMemo, useState } from "react";
import { getAssessmentMatrix, updateAssessmentRow } from "../api";
import { AssessmentMatrix, EvaluationConcept } from "../types";

interface AssessmentsPageProps {
  showToast: (message: string, type: "success" | "error" | "warning") => void;
}

const AssessmentsPage = ({ showToast }: AssessmentsPageProps): JSX.Element => {
  const [matrix, setMatrix] = useState<AssessmentMatrix | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [goalFilter, setGoalFilter] = useState<string>("");
  const [conceptFilter, setConceptFilter] = useState<"ALL" | EvaluationConcept>("ALL");
  const [sortBy, setSortBy] = useState<string>("studentName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const conceptRank: Record<EvaluationConcept, number> = {
    MANA: 0,
    MPA: 1,
    MA: 2
  };

  const visibleRows = useMemo(() => {
    if (!matrix) {
      return [];
    }

    let rows = [...matrix.rows];

    if (studentFilter.trim()) {
      const normalizedFilter = studentFilter.trim().toLowerCase();
      rows = rows.filter((row) => row.studentName.toLowerCase().includes(normalizedFilter));
    }

    if (goalFilter && conceptFilter !== "ALL") {
      rows = rows.filter((row) => row.evaluations[goalFilter] === conceptFilter);
    }

    rows.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "studentName") {
        comparison = a.studentName.localeCompare(b.studentName);
      } else {
        const aValue = a.evaluations[sortBy] ?? "MANA";
        const bValue = b.evaluations[sortBy] ?? "MANA";
        comparison = conceptRank[aValue] - conceptRank[bValue];

        if (comparison === 0) {
          comparison = a.studentName.localeCompare(b.studentName);
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [conceptFilter, goalFilter, matrix, sortBy, sortDirection, studentFilter]);

  const loadMatrix = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await getAssessmentMatrix();
      setMatrix(response);
    } catch (error) {
      showToast((error as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMatrix();
  }, []);

  const updateConcept = async (
    studentId: string,
    goal: string,
    concept: EvaluationConcept
  ): Promise<void> => {
    if (!matrix) {
      return;
    }

    const row = matrix.rows.find((item) => item.studentId === studentId);
    if (!row) {
      return;
    }

    const key = `${studentId}-${goal}`;
    const nextEvaluations = {
      ...row.evaluations,
      [goal]: concept
    };

    setSavingCell(key);

    try {
      await updateAssessmentRow(studentId, nextEvaluations);
      setMatrix((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          rows: prev.rows.map((item) =>
            item.studentId === studentId ? { ...item, evaluations: nextEvaluations } : item
          )
        };
      });
      showToast("Avaliacao atualizada.", "success");
    } catch (error) {
      showToast((error as Error).message, "error");
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <section className="panel">
      <h1>Gerenciamento de avaliacoes</h1>
      <p className="subtitle">
        Tabela de metas por aluno com conceitos MANA, MPA e MA.
      </p>

      <section className="assessment-legend" aria-label="Legenda de conceitos">
        <strong>Legenda:</strong>
        <span className="concept-badge mana">MANA</span>
        <span className="legend-text">Meta Ainda Nao Atingida</span>
        <span className="concept-badge mpa">MPA</span>
        <span className="legend-text">Meta Parcialmente Atingida</span>
        <span className="concept-badge ma">MA</span>
        <span className="legend-text">Meta Atingida</span>
      </section>

      {!isLoading && matrix ? (
        <section className="assessment-controls" aria-label="Controles da tabela de avaliacoes">
          <div className="assessment-control">
            <label htmlFor="studentFilter">Filtrar por aluno</label>
            <input
              id="studentFilter"
              value={studentFilter}
              onChange={(event) => setStudentFilter(event.target.value)}
              placeholder="Digite o nome do aluno"
            />
          </div>

          <div className="assessment-control">
            <label htmlFor="goalFilter">Filtrar por meta</label>
            <select
              id="goalFilter"
              value={goalFilter}
              onChange={(event) => {
                const goal = event.target.value;
                setGoalFilter(goal);
                if (!goal) {
                  setConceptFilter("ALL");
                }
              }}
            >
              <option value="">Todas as metas</option>
              {matrix.goals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>

          <div className="assessment-control">
            <label htmlFor="conceptFilter">Conceito</label>
            <select
              id="conceptFilter"
              value={conceptFilter}
              onChange={(event) => setConceptFilter(event.target.value as "ALL" | EvaluationConcept)}
              disabled={!goalFilter}
            >
              <option value="ALL">Todos</option>
              {matrix.concepts.map((concept) => (
                <option key={concept} value={concept}>
                  {concept}
                </option>
              ))}
            </select>
          </div>

          <div className="assessment-control">
            <label htmlFor="sortBy">Ordenar por</label>
            <select id="sortBy" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="studentName">Aluno</option>
              {matrix.goals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>

          <div className="assessment-control">
            <label htmlFor="sortDirection">Ordem</label>
            <select
              id="sortDirection"
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </div>
        </section>
      ) : null}

      {isLoading ? <p>Carregando avaliacoes...</p> : null}

      {!isLoading && matrix && matrix.rows.length === 0 ? (
        <p>Cadastre alunos para iniciar as avaliacoes.</p>
      ) : null}

      {!isLoading && matrix && matrix.rows.length > 0 && visibleRows.length === 0 ? (
        <p>Nenhum aluno corresponde aos filtros selecionados.</p>
      ) : null}

      {!isLoading && matrix && visibleRows.length > 0 ? (
        <div className="assessment-table-wrapper">
          <table className="student-table assessment-table">
            <thead>
              <tr>
                <th>Aluno</th>
                {matrix.goals.map((goal) => (
                  <th key={goal}>{goal}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.studentId}>
                  <td>{row.studentName}</td>
                  {matrix.goals.map((goal) => {
                    const value = row.evaluations[goal];
                    const key = `${row.studentId}-${goal}`;

                    return (
                      <td key={key}>
                        <div className="assessment-cell">
                          <span className={`concept-badge ${value.toLowerCase()}`}>{value}</span>
                          <select
                            value={value}
                            disabled={savingCell === key}
                            onChange={(event) =>
                              void updateConcept(
                                row.studentId,
                                goal,
                                event.target.value as EvaluationConcept
                              )
                            }
                          >
                            {matrix.concepts.map((concept) => (
                              <option key={concept} value={concept}>
                                {concept}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};

export default AssessmentsPage;