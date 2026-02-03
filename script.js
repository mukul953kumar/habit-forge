class HabitTracker {
    constructor() {
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.habits = [];
        this.charts = {};
        
        this.initializeElements();
        this.initializeHabits();
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.render();
    }

    initializeElements() {
        this.monthSelect = document.getElementById('monthSelect');
        this.yearSelect = document.getElementById('yearSelect');
        this.goalInput = document.getElementById('goalInput');
        this.addGoalBtn = document.getElementById('addGoalBtn');
        this.habitGridBody = document.getElementById('habitGridBody');
        this.topHabitsList = document.getElementById('topHabitsList');
        this.habitProgressList = document.getElementById('habitProgressList');
        this.completedCount = document.getElementById('completedCount');
        this.leftCount = document.getElementById('leftCount');
        this.overallPercentage = document.getElementById('overallPercentage');
    }

    initializeHabits() {
        // Start with empty habits array - user will add their own goals
        this.habits = [];
    }

    setupEventListeners() {
        this.monthSelect.addEventListener('change', () => this.handleMonthYearChange());
        this.yearSelect.addEventListener('change', () => this.handleMonthYearChange());
        
        // Add goal input event listener
        this.goalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addGoal();
            }
        });
        
        // Set current month and year
        this.monthSelect.value = this.getMonthName(this.currentMonth);
        this.yearSelect.value = this.currentYear;
    }

    handleMonthYearChange() {
        // Save current month data before switching
        this.saveToLocalStorage();
        
        // Update current month and year
        this.currentMonth = this.getMonthIndex(this.monthSelect.value);
        this.currentYear = parseInt(this.yearSelect.value);
        
        // Load data for new month
        this.loadFromLocalStorage();
        
        // Re-render with new data
        this.render();
    }

    getMonthName(monthIndex) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthIndex];
    }

    getMonthIndex(monthName) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(monthName);
    }

    addGoal() {
        const goalName = this.goalInput.value.trim();
        
        if (goalName === '') {
            this.showMessage('Please enter a goal name');
            return;
        }
        
        if (this.habits.some(habit => habit.name.toLowerCase() === goalName.toLowerCase())) {
            this.showMessage('This goal already exists');
            return;
        }
        
        const newHabit = {
            name: goalName,
            data: {},
            currentStreak: 0,
            longestStreak: 0
        };
        
        this.habits.push(newHabit);
        this.goalInput.value = '';
        
        this.saveToLocalStorage();
        this.render();
        this.showMessage('Goal added successfully!');
    }

    deleteGoal(habitIndex) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.habits.splice(habitIndex, 1);
            this.saveToLocalStorage();
            this.render();
            this.showMessage('Goal deleted successfully!');
        }
    }

    showMessage(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #99ccff;
            color: #333;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    getDaysInMonth() {
        return new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    }

    getWeekNumber(day) {
        const date = new Date(this.currentYear, this.currentMonth, day);
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const dayOfWeek = firstDay.getDay();
        
        // Calculate which week this day belongs to
        // Week 1: days 1-7, Week 2: days 8-14, etc.
        const weekNumber = Math.ceil(day / 7);
        
        // Ensure it's between 1-5
        return Math.min(Math.max(weekNumber, 1), 5);
    }

    toggleHabit(habitIndex, day) {
        const habit = this.habits[habitIndex];
        const dayKey = day.toString();
        
        habit.data[dayKey] = !habit.data[dayKey];
        
        this.updateStreaks(habit);
        this.saveToLocalStorage();
        this.render();
    }

    updateStreaks(habit) {
        const daysInMonth = this.getDaysInMonth();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dayKey = day.toString();
            if (habit.data[dayKey]) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
                currentStreak = tempStreak;
            } else {
                tempStreak = 0;
            }
        }

        habit.currentStreak = currentStreak;
        habit.longestStreak = longestStreak;
    }

    calculateHabitStats(habit) {
        const daysInMonth = this.getDaysInMonth();
        let completed = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dayKey = day.toString();
            if (habit.data[dayKey]) {
                completed++;
            }
        }

        const percentage = daysInMonth > 0 ? Math.round((completed / daysInMonth) * 100) : 0;
        const left = daysInMonth - completed;

        return { completed, left, percentage };
    }

    calculateGlobalStats() {
        let totalCompleted = 0;
        let totalHabits = 0;

        this.habits.forEach(habit => {
            const stats = this.calculateHabitStats(habit);
            totalCompleted += stats.completed;
            totalHabits += stats.completed + stats.left;
        });

        const overallPercentage = totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;

        return {
            completed: totalCompleted,
            left: totalHabits - totalCompleted,
            percentage: overallPercentage
        };
    }

    renderHabitGrid() {
        const daysInMonth = this.getDaysInMonth();
        let gridHTML = '';

        this.habits.forEach((habit, habitIndex) => {
            gridHTML += '<div class="grid-row">';
            gridHTML += `<div class="habit-name-cell">${habit.name}</div>`;

            for (let week = 1; week <= 5; week++) {
                gridHTML += '<div class="week-cells">';
                
                // Get all days that belong to this week
                for (let day = 1; day <= daysInMonth; day++) {
                    const dayWeekNumber = this.getWeekNumber(day);
                    
                    // Only include days that belong to this specific week
                    if (dayWeekNumber === week) {
                        const dayKey = day.toString();
                        const isChecked = habit.data[dayKey] || false;
                        const checkedClass = isChecked ? 'checked' : '';
                        
                        gridHTML += `<button class="day-cell ${checkedClass}" 
                                           data-habit="${habitIndex}" 
                                           data-day="${day}"
                                           onclick="habitTracker.toggleHabit(${habitIndex}, ${day})">
                                           ${day}
                                   </button>`;
                    }
                }
                
                // If no days for this week, add empty cells for structure
                if (gridHTML.endsWith('<div class="week-cells">')) {
                    gridHTML += '<div style="min-height: 25px;"></div>';
                }
                
                gridHTML += '</div>';
            }

            gridHTML += '</div>';
        });

        this.habitGridBody.innerHTML = gridHTML;
    }

    renderTopHabits() {
        const habitsWithStats = this.habits.map(habit => ({
            ...habit,
            stats: this.calculateHabitStats(habit)
        }));

        habitsWithStats.sort((a, b) => b.stats.percentage - a.stats.percentage);
        const top10 = habitsWithStats.slice(0, 10);

        let topHabitsHTML = '';
        top10.forEach(habit => {
            topHabitsHTML += `
                <div class="habit-item">
                    <span class="habit-name">${habit.name}</span>
                    <span class="habit-percentage">${habit.stats.percentage}%</span>
                </div>
            `;
        });

        this.topHabitsList.innerHTML = topHabitsHTML || '<p>No habits data available</p>';
    }

    renderHabitProgress() {
        let progressHTML = '';

        this.habits.forEach((habit, index) => {
            const stats = this.calculateHabitStats(habit);
            
            progressHTML += `
                <div class="habit-progress-item">
                    <div class="habit-progress-header">
                        <span class="habit-progress-name">${habit.name}</span>
                        <div class="habit-progress-actions">
                            <span class="habit-progress-percentage">${stats.percentage}%</span>
                            <button class="delete-goal-btn" onclick="habitTracker.deleteGoal(${index})" title="Delete Goal">
                                ✕
                            </button>
                        </div>
                    </div>
                    <div class="habit-progress-stats">
                        <div class="stat-item">
                            <span class="stat-label">Completed:</span>
                            <span class="stat-value">${stats.completed}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Left:</span>
                            <span class="stat-value">${stats.left}</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.percentage}%"></div>
                    </div>
                    <div class="streak-info">
                        <span>Current Streak: ${habit.currentStreak}</span>
                        <span>Longest: ${habit.longestStreak}</span>
                    </div>
                </div>
            `;
        });

        if (this.habits.length === 0) {
            progressHTML = '<div class="no-goals-message">No goals added yet. Add your first goal above!</div>';
        }

        this.habitProgressList.innerHTML = progressHTML;
    }

    renderGlobalProgress() {
        const stats = this.calculateGlobalStats();
        this.completedCount.textContent = stats.completed;
        this.leftCount.textContent = stats.left;
        this.overallPercentage.textContent = `${stats.percentage}%`;
    }

    initializeCharts() {
        // Overall Daily Progress Chart (Donut)
        const overallCtx = document.getElementById('overallProgressChart').getContext('2d');
        const globalStats = this.calculateGlobalStats();
        
        this.charts.overallProgress = new Chart(overallCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [globalStats.completed, globalStats.left],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderColor: [
                        'rgba(40, 167, 69, 1)',
                        'rgba(220, 53, 69, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Weekly Overview Chart (Bar)
        const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
        const weeklyData = this.calculateWeeklyData();
        
        this.charts.weekly = new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                datasets: [{
                    label: 'Daily Completions',
                    data: weeklyData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    calculateWeeklyData() {
        const daysInMonth = this.getDaysInMonth();
        const weeklyData = [0, 0, 0, 0, 0];

        for (let day = 1; day <= daysInMonth; day++) {
            const weekNumber = this.getWeekNumber(day) - 1; // Convert to 0-based index
            
            // Ensure week number is within bounds
            if (weekNumber >= 0 && weekNumber < 5) {
                let dayCompletions = 0;
                this.habits.forEach(habit => {
                    const dayKey = day.toString();
                    if (habit.data[dayKey]) {
                        dayCompletions++;
                    }
                });
                weeklyData[weekNumber] += dayCompletions;
            }
        }

        return weeklyData;
    }

    updateCharts() {
        // Update Overall Progress Chart
        const globalStats = this.calculateGlobalStats();
        this.charts.overallProgress.data.datasets[0].data = [globalStats.completed, globalStats.left];
        this.charts.overallProgress.update();

        // Update Weekly Chart
        const weeklyData = this.calculateWeeklyData();
        this.charts.weekly.data.datasets[0].data = weeklyData;
        this.charts.weekly.update();
    }

    saveToLocalStorage() {
        // Get existing data or create new object
        const existingData = localStorage.getItem('habitTrackerAllData');
        let allData = existingData ? JSON.parse(existingData) : {};
        
        // Create key for current month-year
        const monthYearKey = `${this.currentYear}_${this.getMonthName(this.currentMonth)}`;
        
        // Save current month data
        allData[monthYearKey] = {
            month: this.getMonthName(this.currentMonth),
            year: this.currentYear,
            habits: this.habits
        };
        
        // Also save current month as active for quick loading
        allData.currentMonth = monthYearKey;
        
        localStorage.setItem('habitTrackerAllData', JSON.stringify(allData));
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('habitTrackerAllData');
        if (savedData) {
            try {
                const allData = JSON.parse(savedData);
                
                // Create key for current month-year
                const monthYearKey = `${this.currentYear}_${this.getMonthName(this.currentMonth)}`;
                
                // Load data for current month if it exists
                if (allData[monthYearKey]) {
                    this.habits = allData[monthYearKey].habits || [];
                } else {
                    this.habits = []; // Start with empty habits for new months
                }
                
            } catch (error) {
                console.error('Error loading data from localStorage:', error);
                this.habits = []; // Start fresh on error
            }
        } else {
            this.habits = []; // Start with empty habits
        }
    }

    render() {
        this.renderHabitGrid();
        this.renderTopHabits();
        this.renderHabitProgress();
        this.renderGlobalProgress();
        
        // Initialize charts on first render
        if (Object.keys(this.charts).length === 0) {
            setTimeout(() => this.initializeCharts(), 100);
        } else {
            this.updateCharts();
        }
    }

    showReports() {
        document.getElementById('reportsModal').style.display = 'block';
        // Set current year in report selector
        document.getElementById('reportYearSelect').value = this.currentYear;
    }

    closeReports() {
        document.getElementById('reportsModal').style.display = 'none';
    }

    generateReport() {
        const reportYear = parseInt(document.getElementById('reportYearSelect').value);
        const savedData = localStorage.getItem('habitTrackerAllData');
        
        if (!savedData) {
            document.getElementById('reportContent').innerHTML = '<p>No data available for any months.</p>';
            return;
        }

        try {
            const allData = JSON.parse(savedData);
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
            
            let reportHTML = '';
            let yearTotalCompleted = 0;
            let yearTotalHabits = 0;
            let monthsWithData = 0;

            months.forEach(month => {
                const monthYearKey = `${reportYear}_${month}`;
                if (allData[monthYearKey]) {
                    const monthData = allData[monthYearKey];
                    const stats = this.calculateStatsForHabits(monthData.habits || [], month, reportYear);
                    
                    yearTotalCompleted += stats.totalCompleted;
                    yearTotalHabits += stats.totalHabits;
                    monthsWithData++;

                    reportHTML += `
                        <div class="month-report">
                            <h3>${month} ${reportYear}</h3>
                            <div class="report-stats">
                                <div class="report-stat">
                                    <div class="report-stat-label">Total Goals</div>
                                    <div class="report-stat-value">${monthData.habits ? monthData.habits.length : 0}</div>
                                </div>
                                <div class="report-stat">
                                    <div class="report-stat-label">Completed</div>
                                    <div class="report-stat-value">${stats.totalCompleted}</div>
                                </div>
                                <div class="report-stat">
                                    <div class="report-stat-label">Left</div>
                                    <div class="report-stat-value">${stats.totalHabits - stats.totalCompleted}</div>
                                </div>
                                <div class="report-stat">
                                    <div class="report-stat-label">Success Rate</div>
                                    <div class="report-stat-value">${stats.overallPercentage}%</div>
                                </div>
                            </div>
                            <div class="habit-summary">
                                <h4>Goal Performance:</h4>
                                ${stats.habitDetails}
                            </div>
                        </div>
                    `;
                }
            });

            // Add year summary
            const yearOverallPercentage = yearTotalHabits > 0 ? Math.round((yearTotalCompleted / yearTotalHabits) * 100) : 0;
            
            reportHTML = `
                <div class="month-report">
                    <h3>📊 Year ${reportYear} Summary</h3>
                    <div class="report-stats">
                        <div class="report-stat">
                            <div class="report-stat-label">Months Active</div>
                            <div class="report-stat-value">${monthsWithData}/12</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-label">Total Completed</div>
                            <div class="report-stat-value">${yearTotalCompleted}</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-label">Total Left</div>
                            <div class="report-stat-value">${yearTotalHabits - yearTotalCompleted}</div>
                        </div>
                        <div class="report-stat">
                            <div class="report-stat-label">Year Success</div>
                            <div class="report-stat-value">${yearOverallPercentage}%</div>
                        </div>
                    </div>
                </div>
            ` + reportHTML;

            if (reportHTML === '') {
                reportHTML = '<p>No data available for ' + reportYear + '.</p>';
            }

            document.getElementById('reportContent').innerHTML = reportHTML;

        } catch (error) {
            console.error('Error generating report:', error);
            document.getElementById('reportContent').innerHTML = '<p>Error generating report. Please try again.</p>';
        }
    }

    calculateStatsForHabits(habits, month, year) {
        const daysInMonth = new Date(year, this.getMonthIndex(month) + 1, 0).getDate();
        let totalCompleted = 0;
        let totalHabits = 0;
        let habitDetails = '';

        habits.forEach(habit => {
            let habitCompleted = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const dayKey = day.toString();
                if (habit.data && habit.data[dayKey]) {
                    habitCompleted++;
                }
            }
            
            const habitPercentage = daysInMonth > 0 ? Math.round((habitCompleted / daysInMonth) * 100) : 0;
            totalCompleted += habitCompleted;
            totalHabits += daysInMonth;

            habitDetails += `
                <div class="habit-summary-item">
                    <span class="habit-summary-name">${habit.name}</span>
                    <span class="habit-summary-percentage">${habitPercentage}% (${habitCompleted}/${daysInMonth})</span>
                </div>
            `;
        });

        const overallPercentage = totalHabits > 0 ? Math.round((totalCompleted / totalHabits) * 100) : 0;

        return {
            totalCompleted,
            totalHabits,
            overallPercentage,
            habitDetails
        };
    }
}

// Initialize the habit tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.habitTracker = new HabitTracker();
});
