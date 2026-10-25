import React, { useEffect, useRef } from 'react';
// Direct import of Chart.js inside THIS lazy-loaded file only
// This ensures Chart.js is isolated in this chunk and NOT bundled into the main app chunk!
import {
  Chart,
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

// Register necessary Chart.js modules
Chart.register(
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

export default function TaskDistributionChart() {
  const doughnutRef = useRef(null);
  const barRef = useRef(null);
  const doughnutChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    // 1. Doughnut Chart: Task Priority Distribution
    if (doughnutRef.current) {
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
      }

      const ctxDoughnut = doughnutRef.current.getContext('2d');
      doughnutChartInstance.current = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
          labels: ['High Priority', 'Medium Priority', 'Low Priority'],
          datasets: [
            {
              data: [35, 45, 20],
              backgroundColor: ['#f43f5e', '#f59e0b', '#10b981'],
              borderColor: 'rgba(17, 24, 39, 0.8)',
              borderWidth: 2,
              hoverOffset: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#94a3b8',
                font: { family: 'Inter', size: 12 }
              }
            },
            title: {
              display: true,
              text: 'Sprint Tasks by Priority Breakdown',
              color: '#f8fafc',
              font: { family: 'Outfit', size: 15, weight: '600' }
            }
          }
        }
      });
    }

    // 2. Bar Chart: Weekly Velocity & Completed Story Points
    if (barRef.current) {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const ctxBar = barRef.current.getContext('2d');
      barChartInstance.current = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5', 'Sprint 6'],
          datasets: [
            {
              label: 'Completed Story Points',
              data: [18, 26, 32, 28, 40, 48],
              backgroundColor: '#6366f1',
              borderRadius: 6
            },
            {
              label: 'Planned Story Points',
              data: [20, 30, 35, 30, 42, 50],
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: '#94a3b8', font: { family: 'Inter' } },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
              ticks: { color: '#94a3b8', font: { family: 'Inter' } },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#94a3b8',
                font: { family: 'Inter', size: 12 }
              }
            },
            title: {
              display: true,
              text: 'Sprint Velocity & Burndown Trend',
              color: '#f8fafc',
              font: { family: 'Outfit', size: 15, weight: '600' }
            }
          }
        }
      });
    }

    return () => {
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
    };
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', width: '100%' }}>
      {/* Doughnut Chart Card */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', height: '340px' }}>
        <canvas ref={doughnutRef} />
      </div>

      {/* Bar Chart Card */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', height: '340px' }}>
        <canvas ref={barRef} />
      </div>
    </div>
  );
}
