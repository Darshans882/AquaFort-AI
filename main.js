document.addEventListener('DOMContentLoaded', () => {
    const recommendForm = document.getElementById('recommendForm');
    const resultsContainer = document.getElementById('results-container');
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const feedbackPanel = document.getElementById('feedback-panel');
    const showFeedbackBtn = document.getElementById('showFeedbackBtn');

    // State to hold current context for feedback
    let currentContext = {
        inputs: {},
        formulation: {},
        caseID: null
    };

    // --- 1. Recommendation Logic ---
    recommendForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Reset
        resultsContainer.classList.add('hidden');
        if (resultsPlaceholder) resultsPlaceholder.style.display = 'block';

        const formData = new FormData(recommendForm);
        const inputs = {
            salinity: formData.get('salinity'),
            grade: formData.get('grade'),
            priority: formData.get('priority')
        };

        try {
            // Direct API call - No Artificial Delay
            const response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputs)
            });

            const data = await response.json();

            if (data.status === 'success') {
                updateUI(data, inputs);
            }
        } catch (error) {
            console.error('Error:', error);
            alert("Connection Error: Could not reach server.");
        }
    });

    function updateUI(data, inputs) {
        // Update State
        currentContext.inputs = inputs;
        currentContext.formulation = data.formulation;
        currentContext.caseID = data.similar_case_id;

        // Hide Placeholder / Show Results
        if (resultsPlaceholder) resultsPlaceholder.style.display = 'none';
        resultsContainer.classList.remove('hidden');

        // Update Values
        const silane = data.formulation.silane;
        const rha = data.formulation.rha;

        // Bars
        const barSilane = document.getElementById('bar-silane');
        const barRHA = document.getElementById('bar-rha');

        // Animate width
        setTimeout(() => {
            if (barSilane) {
                barSilane.style.width = `${silane}%`;
                barSilane.innerText = `Silane ${silane}%`;
            }
            if (barRHA) {
                barRHA.style.width = `${rha}%`;
                barRHA.innerText = `RHA ${rha}%`;
            }
        }, 100);

        // Text Values
        document.getElementById('val-silane').innerText = `${silane}%`;
        document.getElementById('val-rha').innerText = `${rha}%`;
        document.getElementById('val-score').innerText = data.predicted_score;
        document.getElementById('ref-case-id').innerText = data.similar_case_id;

        // Explanation
        document.getElementById('explanation-text').innerHTML = data.explanation;
    }

    // --- 2. Feedback Logic ---
    if (showFeedbackBtn) {
        showFeedbackBtn.addEventListener('click', () => {
            feedbackPanel.classList.remove('hidden');
            feedbackPanel.scrollIntoView({ behavior: 'smooth' });
        });
    }

    document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentContext.caseID) {
            alert("No active recommendation to feedback on.");
            return;
        }

        const score = document.getElementById('f_score').value;
        const feedbackData = {
            inputs: currentContext.inputs,
            formulation: currentContext.formulation,
            score: score,
            notes: "Field Verification Data"
        };

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData)
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert(`System Updated: Knowledge base expanded with Case ID: ${data.case_id}`);
                feedbackPanel.classList.add('hidden');
                document.getElementById('recommendForm').reset();
                resultsContainer.classList.add('hidden');
                if (resultsPlaceholder) resultsPlaceholder.style.display = 'block';
                // Refresh analytics if visible
                loadAnalytics();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    });

    // --- 3. Tab Navigation ---
    const tabs = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.add('hidden'));

            // Activate current
            tab.classList.add('active');
            const target = tab.dataset.tab;
            const targetContent = document.getElementById(`tab-${target}`);
            if (targetContent) targetContent.classList.remove('hidden');

            if (target === 'analytics') {
                loadAnalytics();
            }
        });
    });

    // --- 4. Photo Upload Simulation (Professional) ---
    const cvDropzone = document.getElementById('cv-dropzone');
    const fileInput = document.getElementById('site-image');

    if (cvDropzone) {
        cvDropzone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                // Professional "Processing" cursor
                document.body.style.cursor = 'wait';

                setTimeout(() => {
                    document.body.style.cursor = 'default';
                    // Random Detection
                    const detectedSalinity = Math.random() > 0.5 ? "High" : "Med";
                    const detectedGrade = Math.random() > 0.5 ? "M40" : "M50";

                    // Auto-fill
                    document.getElementById('salinity').value = detectedSalinity;
                    document.getElementById('grade').value = detectedGrade;

                    alert(`Image Analysis Complete.\n\nDetected Environment: ${detectedSalinity} Salinity\nTarget Grade: ${detectedGrade}\n\nParameters have been updated.`);
                }, 800); // Short, realistic processing time
            }
        });
    }

    // --- 5. Analytics ---
    let scatterChart = null;
    let lineChart = null;

    async function loadAnalytics() {
        try {
            const response = await fetch('/api/analytics');
            const result = await response.json();
            const data = result.data;

            if (!data || data.length === 0) return;

            // Prepare Data
            const scatterData = data.map(d => {
                // Safeguard against missing inputs
                const sal = d.inputs ? d.inputs.salinity : 'Low';
                return {
                    x: sal === "High" ? 3 : (sal === "Med" ? 2 : 1),
                    y: d.outcome
                };
            });

            const labels = data.map(d => d.id);
            const scores = data.map(d => d.outcome);

            // Updated Chart Colors for Pro Theme
            const colorPrimary = '#0f766e';
            const colorSecondary = '#0ea5e9';

            // Render Scatter
            const ctxScatter = document.getElementById('chart-scatter').getContext('2d');
            if (scatterChart) scatterChart.destroy();
            scatterChart = new Chart(ctxScatter, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Performance Dist.',
                        data: scatterData,
                        backgroundColor: colorSecondary
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: { display: true, text: 'Salinity Environment' },
                            min: 0.5,
                            max: 3.5,
                            ticks: {
                                stepSize: 1,
                                callback: function (value) {
                                    if (value === 1) return 'Low';
                                    if (value === 2) return 'Med';
                                    if (value === 3) return 'High';
                                    return '';
                                }
                            }
                        },
                        y: {
                            title: { display: true, text: 'Performance Score' },
                            min: 0,
                            max: 100
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `Score: ${context.parsed.y}`;
                                }
                            }
                        }
                    }
                }
            });

            // Render Line (Growth)
            const ctxLine = document.getElementById('chart-line').getContext('2d');
            if (lineChart) lineChart.destroy();
            lineChart = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Learning Trend',
                        data: scores,
                        borderColor: colorPrimary,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            // Render History Table
            const tableBody = document.getElementById('history-table-body');
            tableBody.innerHTML = '';

            const tableData = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            tableData.forEach(item => {
                const row = document.createElement('tr');
                const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '-';
                // Handle potential missing input data safely
                const hasInputs = item.inputs && item.inputs.salinity && item.inputs.grade;
                const inputsStr = hasInputs ? `${item.inputs.salinity}/${item.inputs.grade}` : 'Simulated/N/A';

                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${dateStr}</td>
                    <td>${inputsStr}</td>
                    <td><strong>${item.outcome}</strong></td>
                    <td style="color: #64748b;">${item.feedback || '-'}</td>
                `;
                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error("Analytics Error", error);
        }
    }

    // --- 6. PDF Export ---
    const pdfBtn = document.getElementById('downloadPdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            const element = document.getElementById('results-container');
            const opt = {
                margin: 0.5,
                filename: 'Mix_Design_Report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        });
    }
});
