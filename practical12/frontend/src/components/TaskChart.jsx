import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

/**
 * TaskChart Component (Heavy third-party component using Chart.js)
 * Only loaded when the user requests the analytics chart on the Projects/Tasks page.
 */
function TaskChart({ tasks = [] }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart before re-creating
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const activeTasks = tasks.length > 0 ? tasks : [
      { completed: true, priority: "high" },
      { completed: true, priority: "medium" },
      { completed: false, priority: "high" },
      { completed: false, priority: "medium" },
      { completed: false, priority: "low" },
    ];

    const completedCount = activeTasks.filter((t) => t.completed).length;
    const pendingCount = activeTasks.length - completedCount;

    const highPriority = activeTasks.filter((t) => t.priority === "high").length;
    const mediumPriority = activeTasks.filter((t) => t.priority === "medium").length;
    const lowPriority = activeTasks.filter((t) => t.priority === "low").length;

    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Pending", "Completed", "High Priority", "Medium Priority", "Low Priority"],
        datasets: [
          {
            label: "Task Count",
            data: [pendingCount, completedCount, highPriority, mediumPriority, lowPriority],
            backgroundColor: [
              "rgba(234, 179, 8, 0.7)",   // Yellow for pending
              "rgba(34, 197, 94, 0.7)",   // Green for completed
              "rgba(239, 68, 68, 0.7)",   // Red for high
              "rgba(59, 130, 246, 0.7)",  // Blue for medium
              "rgba(148, 163, 184, 0.7)", // Slate for low
            ],
            borderColor: [
              "#ca8a04",
              "#16a34a",
              "#dc2626",
              "#4f46e5",
              "#64748b",
            ],
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Task Status & Priority Distribution (Rendered via Chart.js)",
            font: {
              size: 14,
              weight: "bold",
            },
            color: "#1e293b",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [tasks]);

  return (
    <div className="task-chart-wrapper" style={{ marginTop: "20px", marginBottom: "20px", padding: "18px", background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
      <div style={{ height: "260px" }}>
        <canvas ref={chartRef}></canvas>
      </div>
      <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#64748b", marginTop: "10px" }}>
        📊 <strong>Chart.js</strong> loaded on demand via dynamic <code>import()</code> and <code>React.lazy()</code>.
      </p>
    </div>
  );
}

export default TaskChart;
