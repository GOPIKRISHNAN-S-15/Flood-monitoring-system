// ===================================
//    DASHBOARD FUNCTIONALITY
// ===================================

class DashboardManager {
    constructor() {
        this.apiBase = '/api';
        this.currentSection = 'overview';
        this.refreshInterval = 30000; // 30 seconds
        this.refreshTimer = null;
        this.charts = {};
        this.lastUpdate = null;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthentication();
            this.setupEventListeners();
            this.setupNavigation();
            this.loadUserProfile();
            this.loadDashboardData();
            this.startAutoRefresh();
        });
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('[id$="Tab"]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const section = tab.id.replace('Tab', '').toLowerCase();
                this.switchSection(section);
            });
        });

        // Time range buttons
        document.querySelectorAll('input[name="timeRange"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateChartData(parseInt(e.target.value));
            });
        });

        // Refresh button
        const refreshIcon = document.getElementById('refreshIcon');
        if (refreshIcon) {
            refreshIcon.addEventListener('click', () => {
                this.loadDashboardData();
                this.animateRefreshIcon();
            });
        }
    }

    setupNavigation() {
        // Set up sidebar navigation
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Get section from href
                const href = link.getAttribute('href');
                const section = href.substring(1); // Remove #
                this.switchSection(section);
            });
        });
    }

    switchSection(section) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.add('d-none');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
            this.currentSection = section;
            
            // Load section-specific data
            this.loadSectionData(section);
        }
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const user = result.user;
                
                // Update UI with user data
                const userName = document.getElementById('userName');
                if (userName) {
                    userName.textContent = user.name || 'User';
                }
                
                // Update profile modal
                const profileName = document.getElementById('profileName');
                const profileEmail = document.getElementById('profileEmail');
                if (profileName) profileName.value = user.name || '';
                if (profileEmail) profileEmail.value = user.email || '';
                
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadLatestReading(),
                this.loadStats(),
                this.loadRecentAlerts()
            ]);
            
            this.lastUpdate = new Date();
            this.updateLastUpdatedTime();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showAlert('Failed to load dashboard data', 'danger');
        }
    }

    async loadLatestReading() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/latest`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    this.updateStatusCards(result.data);
                    this.updateGaugeChart(result.data.water_level);
                    this.checkAlertConditions(result.data);
                }
            }
        } catch (error) {
            console.error('Error loading latest reading:', error);
        }
    }

    async loadStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/sensor-data/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.updateQuickStats(result.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadRecentAlerts() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/alerts/recent?hours=24`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.updateAlertBadge(result.count);
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    updateStatusCards(data) {
        // Water level card
        const waterLevelEl = document.getElementById('currentWaterLevel');
        const waterLevelCard = document.getElementById('waterLevelCard');
        if (waterLevelEl) {
            waterLevelEl.textContent = data.water_level ? `${data.water_level.toFixed(1)} cm` : '--';
        }

        // Distance card
        const distanceEl = document.getElementById('currentDistance');
        const distanceCard = document.getElementById('distanceCard');
        if (distanceEl) {
            distanceEl.textContent = data.distance ? `${data.distance.toFixed(1)} cm` : '--';
        }

        // System status card
        const statusEl = document.getElementById('systemStatus');
        const statusCard = document.getElementById('systemStatusCard');
        const statusTime = document.getElementById('statusTime');
        
        if (statusEl) {
            statusEl.textContent = this.capitalizeFirst(data.status || 'Unknown');
            
            // Update card styling based on status
            if (statusCard) {
                statusCard.className = 'status-card';
                statusCard.classList.add(data.status || 'unknown');
            }
            
            if (statusTime) {
                statusTime.textContent = this.formatTimeAgo(data.timestamp);
            }
        }

        // Servo status card
        const servoEl = document.getElementById('servoStatus');
        const servoTime = document.getElementById('servoTime');
        if (servoEl) {
            servoEl.textContent = this.capitalizeFirst(data.servo_state || 'Unknown');
            
            if (servoTime) {
                servoTime.textContent = this.formatTimeAgo(data.timestamp);
            }
        }
    }

    updateGaugeChart(waterLevel) {
        const canvas = document.getElementById('gaugeChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 20;
        ctx.stroke();

        // Calculate water level percentage and angle
        const maxWaterLevel = 200; // Assuming max 200cm
        const percentage = Math.min((waterLevel || 0) / maxWaterLevel, 1);
        const angle = Math.PI + (percentage * Math.PI);

        // Water level arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, angle);
        
        // Color based on level
        let color = '#28a745'; // Normal (green)
        if (percentage > 0.7) color = '#dc3545'; // Danger (red)
        else if (percentage > 0.5) color = '#ffc107'; // Warning (yellow)
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 20;
        ctx.stroke();

        // Center text
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(`${(waterLevel || 0).toFixed(1)}`, centerX, centerY - 10);
        
        ctx.font = '14px Arial';
        ctx.fillText('cm', centerX, centerY + 15);

        // Percentage text
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`${(percentage * 100).toFixed(0)}%`, centerX, centerY + 35);
    }

    updateQuickStats(stats) {
        const totalReadings = document.getElementById('totalReadings');
        const avgWaterLevel = document.getElementById('avgWaterLevel');
        
        if (totalReadings) {
            totalReadings.textContent = stats.total_readings || '0';
        }
        
        if (avgWaterLevel) {
            avgWaterLevel.textContent = stats.avg_water_level ? 
                `${stats.avg_water_level.toFixed(1)} cm` : '--';
        }
    }

    updateAlertBadge(count) {
        const alertBadge = document.getElementById('alertBadge');
        const alertsToday = document.getElementById('alertsToday');
        
        if (alertBadge) {
            if (count > 0) {
                alertBadge.textContent = count;
                alertBadge.classList.remove('d-none');
            } else {
                alertBadge.classList.add('d-none');
            }
        }
        
        if (alertsToday) {
            alertsToday.textContent = count || '0';
        }
    }

    checkAlertConditions(data) {
        const alertBar = document.getElementById('alertBar');
        const alertMessage = document.getElementById('alertMessage');
        const alertIcon = document.getElementById('alertIcon');
        
        if (!alertBar || !data) return;

        let showAlert = false;
        let message = '';
        let level = '';

        if (data.status === 'warning') {
            showAlert = true;
            message = `Warning: Water level rising. Current level: ${data.water_level.toFixed(1)}cm`;
            level = 'warning';
        } else if (data.status === 'danger') {
            showAlert = true;
            message = `Danger: Critical water level! Current level: ${data.water_level.toFixed(1)}cm. Flood gate activated.`;
            level = 'danger';
        }

        if (showAlert) {
            alertBar.className = `alert-bar ${level}`;
            alertBar.classList.remove('d-none');
            
            if (alertMessage) alertMessage.textContent = message;
            if (alertIcon) {
                alertIcon.className = level === 'danger' ? 
                    'fas fa-exclamation-circle' : 'fas fa-exclamation-triangle';
            }
        } else {
            alertBar.classList.add('d-none');
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'monitoring':
                await this.loadMonitoringData();
                break;
            case 'alerts':
                await this.loadAlertsData();
                break;
            case 'control':
                await this.loadControlData();
                break;
            case 'dataset':
                await this.loadDatasetData();
                break;
            case 'ml':
                await this.loadMLData();
                break;
        }
    }

    async loadMonitoringData() {
        try {
            const hours = document.querySelector('input[name="timeRange"]:checked')?.value || 24;
            await this.updateChartData(parseInt(hours));
            await this.loadReadingsTable();
        } catch (error) {
            console.error('Error loading monitoring data:', error);
        }
    }

    async updateChartData(hours) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/sensor-data/chart?hours=${hours}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.createWaterLevelChart(result.data);
            }
        } catch (error) {
            console.error('Error updating chart data:', error);
        }
    }

    createWaterLevelChart(data) {
        const ctx = document.getElementById('waterLevelChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.waterLevel) {
            this.charts.waterLevel.destroy();
        }

        this.charts.waterLevel = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Water Level (cm)',
                    data: data.waterLevels || [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Distance (cm)',
                    data: data.distances || [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Measurement (cm)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    async loadReadingsTable() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/sensor-data?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.populateReadingsTable(result.data);
            }
        } catch (error) {
            console.error('Error loading readings table:', error);
        }
    }

    populateReadingsTable(readings) {
        const tbody = document.getElementById('readingsTableBody');
        if (!tbody) return;

        if (!readings || readings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No data available</td></tr>';
            return;
        }

        tbody.innerHTML = readings.map(reading => `
            <tr>
                <td>${this.formatDate(reading.timestamp)}</td>
                <td>${reading.water_level.toFixed(1)} cm</td>
                <td>${reading.distance.toFixed(1)} cm</td>
                <td>
                    <span class="status-badge ${reading.status}">
                        ${this.capitalizeFirst(reading.status)}
                    </span>
                </td>
                <td>
                    <span class="badge ${reading.servo_state === 'open' ? 'bg-danger' : 'bg-success'}">
                        ${this.capitalizeFirst(reading.servo_state)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    async loadAlertsData() {
        try {
            const token = localStorage.getItem('token');
            const [alertsResponse, statsResponse] = await Promise.all([
                fetch(`${this.apiBase}/alerts?limit=20`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${this.apiBase}/alerts/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (alertsResponse.ok && statsResponse.ok) {
                const alertsResult = await alertsResponse.json();
                const statsResult = await statsResponse.json();
                
                this.populateAlertsStats(statsResult.data);
                this.populateAlertsList(alertsResult.data);
            }
        } catch (error) {
            console.error('Error loading alerts data:', error);
        }
    }

    populateAlertsStats(stats) {
        const warningAlerts = document.getElementById('warningAlerts');
        const dangerAlerts = document.getElementById('dangerAlerts');
        const recentAlerts = document.getElementById('recentAlerts');

        if (warningAlerts) warningAlerts.textContent = stats.warning_count || '0';
        if (dangerAlerts) dangerAlerts.textContent = stats.danger_count || '0';
        if (recentAlerts) recentAlerts.textContent = stats.alerts_last_24h || '0';
    }

    populateAlertsList(alerts) {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;

        if (!alerts || alerts.length === 0) {
            alertsList.innerHTML = '<div class="text-center text-muted p-4">No alerts found</div>';
            return;
        }

        alertsList.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.level} alert-dismissible">
                <div class="d-flex align-items-start">
                    <i class="fas ${alert.level === 'danger' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'} me-3 mt-1"></i>
                    <div class="flex-grow-1">
                        <div class="fw-bold mb-1">
                            ${this.capitalizeFirst(alert.level)} Alert
                        </div>
                        <div class="mb-2">${alert.message}</div>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            ${this.formatTimeAgo(alert.timestamp)}
                        </small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadControlData() {
        await this.updateServoStatus();
        await this.loadServoHistory();
    }

    async updateServoStatus() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/servo/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.updateGateVisual(result.data.state);
            }
        } catch (error) {
            console.error('Error loading servo status:', error);
        }
    }

    updateGateVisual(state) {
        const gateVisual = document.getElementById('gateVisual');
        const gateIcon = document.getElementById('gateIcon');
        const gateStatusText = document.getElementById('gateStatusText');
        const openGateBtn = document.getElementById('openGateBtn');
        const closeGateBtn = document.getElementById('closeGateBtn');

        if (gateVisual) {
            gateVisual.className = `gate-visual ${state}`;
        }

        if (gateIcon) {
            gateIcon.className = state === 'open' ? 'fas fa-door-open fa-4x' : 'fas fa-door-closed fa-4x';
        }

        if (gateStatusText) {
            gateStatusText.textContent = `Gate ${this.capitalizeFirst(state)}`;
        }

        // Update button states
        if (openGateBtn) {
            openGateBtn.disabled = state === 'open';
        }
        if (closeGateBtn) {
            closeGateBtn.disabled = state === 'closed';
        }
    }

    async loadServoHistory() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/servo/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.populateControlHistory(result.data);
            }
        } catch (error) {
            console.error('Error loading servo history:', error);
        }
    }

    populateControlHistory(history) {
        const historyContainer = document.getElementById('controlHistory');
        if (!historyContainer) return;

        if (!history || history.length === 0) {
            historyContainer.innerHTML = '<div class="text-center text-muted p-4">No control history available</div>';
            return;
        }

        historyContainer.innerHTML = history.map(entry => `
            <div class="border-bottom pb-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="fw-bold">
                            <i class="fas ${entry.action === 'open' ? 'fa-door-open' : 'fa-door-closed'} me-2"></i>
                            Gate ${this.capitalizeFirst(entry.action)}
                        </div>
                        <div class="text-muted">
                            <small>
                                ${entry.trigger === 'automatic' ? 'Automatic' : 'Manual'} • 
                                ${entry.reason.replace(/_/g, ' ')}
                            </small>
                        </div>
                    </div>
                    <small class="text-muted">
                        ${this.formatTimeAgo(entry.timestamp)}
                    </small>
                </div>
            </div>
        `).join('');
    }

    // Dataset functionality
    async loadDatasetData() {
        try {
            await this.loadDatasets();
            this.setupDatasetEventListeners();
        } catch (error) {
            console.error('Error loading dataset data:', error);
        }
    }

    setupDatasetEventListeners() {
        if (this.datasetListenersSetup) return;
        this.datasetListenersSetup = true;

        // Upload form
        const uploadForm = document.getElementById('datasetUploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleDatasetUpload(e));
        }

        // Dataset selector
        const datasetSelector = document.getElementById('datasetSelector');
        if (datasetSelector) {
            datasetSelector.addEventListener('change', (e) => this.handleDatasetSelection(e));
        }
    }

    async loadDatasets() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/datasets`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.populateDatasetSelector(result.data);
            }
        } catch (error) {
            console.error('Error loading datasets:', error);
        }
    }

    populateDatasetSelector(datasets) {
        const selector = document.getElementById('datasetSelector');
        if (!selector) return;

        selector.innerHTML = '<option value="">Select a dataset...</option>';

        if (datasets && datasets.length > 0) {
            datasets.forEach(dataset => {
                const option = document.createElement('option');
                option.value = dataset.id;
                option.textContent = `${dataset.name} (${dataset.record_count} records)`;
                selector.appendChild(option);
            });
        }
    }

    async handleDatasetUpload(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading...';

            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/datasets/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Dataset uploaded successfully!', 'success');
                form.reset();
                await this.loadDatasets(); // Refresh the dataset list
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Error uploading dataset:', error);
            this.showAlert(error.message || 'Failed to upload dataset', 'danger');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-upload me-2"></i>Upload Dataset';
        }
    }

    async handleDatasetSelection(event) {
        const datasetId = event.target.value;

        if (!datasetId) {
            this.hideDatasetVisualization();
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/datasets/${datasetId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displayDatasetVisualization(result.data);
            }

        } catch (error) {
            console.error('Error loading dataset:', error);
            this.showAlert('Failed to load dataset', 'danger');
        }
    }

    displayDatasetVisualization(data) {
        this.createDatasetChart(data);
        this.populateDatasetTable(data);
        
        // Show visualization containers
        document.getElementById('datasetChartContainer').style.display = 'block';
        document.getElementById('noDatasetMessage').style.display = 'none';
        document.getElementById('datasetTableContainer').style.display = 'block';
        document.getElementById('noDatasetTableMessage').style.display = 'none';
    }

    hideDatasetVisualization() {
        document.getElementById('datasetChartContainer').style.display = 'none';
        document.getElementById('noDatasetMessage').style.display = 'block';
        document.getElementById('datasetTableContainer').style.display = 'none';
        document.getElementById('noDatasetTableMessage').style.display = 'block';

        // Destroy existing chart
        if (this.charts.dataset) {
            this.charts.dataset.destroy();
        }
    }

    createDatasetChart(data) {
        const ctx = document.getElementById('datasetChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.dataset) {
            this.charts.dataset.destroy();
        }

        const chartData = {
            labels: data.records.map(record => this.formatDate(record.timestamp)),
            datasets: [{
                label: 'Water Level (cm)',
                data: data.records.map(record => record.water_level),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }, {
                label: 'Distance (cm)',
                data: data.records.map(record => record.distance),
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }]
        };

        this.charts.dataset = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Measurement (cm)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    populateDatasetTable(data) {
        const thead = document.getElementById('datasetTableHead');
        const tbody = document.getElementById('datasetTableBody');
        
        if (!thead || !tbody) return;

        // Create table headers
        thead.innerHTML = `
            <tr>
                <th>Timestamp</th>
                <th>Water Level (cm)</th>
                <th>Distance (cm)</th>
                <th>Status</th>
            </tr>
        `;

        // Populate table body (show first 50 records)
        const displayRecords = data.records.slice(0, 50);
        tbody.innerHTML = displayRecords.map(record => `
            <tr>
                <td>${this.formatDate(record.timestamp)}</td>
                <td>${record.water_level.toFixed(1)}</td>
                <td>${record.distance.toFixed(1)}</td>
                <td>
                    <span class="status-badge ${record.status}">
                        ${this.capitalizeFirst(record.status)}
                    </span>
                </td>
            </tr>
        `).join('');

        if (data.records.length > 50) {
            tbody.innerHTML += `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        <i>Showing first 50 of ${data.records.length} records</i>
                    </td>
                </tr>
            `;
        }
    }

    // ML functionality
    async loadMLData() {
        try {
            await this.setupMLEventListeners();
            await this.loadModelStatus();
        } catch (error) {
            console.error('Error loading ML data:', error);
        }
    }

    setupMLEventListeners() {
        if (this.mlListenersSetup) return;
        this.mlListenersSetup = true;

        // Prediction range buttons
        document.querySelectorAll('input[name="predictionRange"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (this.hasPredictions) {
                    this.loadPredictions(parseInt(e.target.value));
                }
            });
        });
    }

    async loadModelStatus() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/ml/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.updateModelStatus(result.data);
            }
        } catch (error) {
            console.error('Error loading model status:', error);
        }
    }

    updateModelStatus(status) {
        const modelStatus = document.getElementById('modelStatus');
        const modelAccuracy = document.getElementById('modelAccuracy');
        const predictionHorizon = document.getElementById('predictionHorizon');
        const dataPoints = document.getElementById('dataPoints');

        if (status.is_trained) {
            modelStatus.className = 'alert alert-success';
            modelStatus.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                Model trained successfully! Last updated: ${this.formatTimeAgo(status.last_trained)}
            `;
            
            if (modelAccuracy) modelAccuracy.textContent = `${(status.accuracy * 100).toFixed(1)}%`;
            if (predictionHorizon) predictionHorizon.textContent = `${status.prediction_hours}h`;
            if (dataPoints) dataPoints.textContent = status.training_data_points || '0';
            
            this.updateModelMetrics(status.metrics || {});
        } else {
            modelStatus.className = 'alert alert-info';
            modelStatus.innerHTML = `
                <i class="fas fa-info-circle me-2"></i>
                Ready to train model with historical data.
            `;
            
            if (modelAccuracy) modelAccuracy.textContent = '--';
            if (predictionHorizon) predictionHorizon.textContent = '--';
            if (dataPoints) dataPoints.textContent = '--';
        }
    }

    updateModelMetrics(metrics) {
        const precision = document.getElementById('modelPrecision');
        const recall = document.getElementById('modelRecall');
        const f1Score = document.getElementById('modelF1Score');
        const confidencePercent = document.getElementById('confidencePercent');
        const confidenceBar = document.getElementById('confidenceBar');

        if (precision) precision.textContent = metrics.precision ? `${(metrics.precision * 100).toFixed(1)}%` : '--';
        if (recall) recall.textContent = metrics.recall ? `${(metrics.recall * 100).toFixed(1)}%` : '--';
        if (f1Score) f1Score.textContent = metrics.f1_score ? `${(metrics.f1_score * 100).toFixed(1)}%` : '--';
        
        const confidence = metrics.confidence || 0;
        if (confidencePercent) confidencePercent.textContent = `${(confidence * 100).toFixed(0)}%`;
        if (confidenceBar) {
            confidenceBar.style.width = `${confidence * 100}%`;
            confidenceBar.className = `progress-bar ${confidence > 0.8 ? 'bg-success' : confidence > 0.6 ? 'bg-warning' : 'bg-danger'}`;
        }
    }

    displayPredictions(data) {
        this.updatePredictionCards(data);
        this.createPredictionChart(data);
        this.displayRiskAlerts(data.risk_alerts || []);
    }

    updatePredictionCards(data) {
        const floodProbability = document.getElementById('floodProbability');
        const nextFloodTime = document.getElementById('nextFloodTime');

        if (floodProbability) {
            const maxRisk = Math.max(...(data.predictions || []).map(p => p.flood_probability));
            floodProbability.textContent = `${(maxRisk * 100).toFixed(1)}%`;
            floodProbability.parentElement.className = `card text-center ${maxRisk > 0.7 ? 'border-danger' : maxRisk > 0.4 ? 'border-warning' : 'border-success'}`;
        }

        if (nextFloodTime && data.next_risk_time) {
            const riskTime = new Date(data.next_risk_time);
            nextFloodTime.textContent = this.formatDate(riskTime);
        } else if (nextFloodTime) {
            nextFloodTime.textContent = 'Low Risk';
        }
    }

    createPredictionChart(data) {
        const ctx = document.getElementById('predictionChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.prediction) {
            this.charts.prediction.destroy();
        }

        const predictions = data.predictions || [];
        const chartData = {
            labels: predictions.map(p => this.formatTime(new Date(p.timestamp))),
            datasets: [{
                label: 'Water Level Prediction (cm)',
                data: predictions.map(p => p.predicted_water_level),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }, {
                label: 'Flood Risk (%)',
                data: predictions.map(p => p.flood_probability * 100),
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                yAxisID: 'y1'
            }]
        };

        this.charts.prediction = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Water Level (cm)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Flood Risk (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        max: 100
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Predicted Time'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    displayRiskAlerts(alerts) {
        const riskAlertsContainer = document.getElementById('riskAlerts');
        if (!riskAlertsContainer) return;

        if (!alerts || alerts.length === 0) {
            riskAlertsContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-shield-alt me-2"></i>
                    <strong>All Clear!</strong> No significant flood risks detected in the prediction window.
                </div>
            `;
            return;
        }

        riskAlertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.level} mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="alert-heading mb-1">
                            <i class="fas ${alert.level === 'danger' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'} me-2"></i>
                            ${alert.title}
                        </h6>
                        <p class="mb-1">${alert.message}</p>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            Predicted: ${this.formatDate(new Date(alert.predicted_time))}
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="badge bg-light text-dark">${(alert.probability * 100).toFixed(0)}%</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async trainModel() {
        const trainBtn = document.getElementById('trainModelBtn');
        const modelStatus = document.getElementById('modelStatus');
        const trainingDataRange = document.getElementById('trainingDataRange').value;
        const predictionModel = document.getElementById('predictionModel').value;
        
        try {
            trainBtn.disabled = true;
            trainBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Training...';
            
            modelStatus.className = 'alert alert-warning';
            modelStatus.innerHTML = `
                <i class="fas fa-cog fa-spin me-2"></i>
                Training model on historical data...
            `;

            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/ml/train`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    data_range_days: parseInt(trainingDataRange),
                    model_type: predictionModel
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Model trained successfully!', 'success');
                this.updateModelStatus(result.data);
                
                // Enable predictions
                document.getElementById('predictBtn').disabled = false;
                
            } else {
                throw new Error(result.message || 'Training failed');
            }

        } catch (error) {
            console.error('Error training model:', error);
            this.showAlert(error.message || 'Failed to train model', 'danger');
            
            modelStatus.className = 'alert alert-danger';
            modelStatus.innerHTML = `
                <i class="fas fa-exclamation-circle me-2"></i>
                Training failed: ${error.message || 'Unknown error'}
            `;
            
        } finally {
            trainBtn.disabled = false;
            trainBtn.innerHTML = '<i class="fas fa-play me-2"></i>Train Model';
        }
    }

    async generatePredictions() {
        const predictBtn = document.getElementById('predictBtn');
        const hours = document.querySelector('input[name="predictionRange"]:checked')?.value || 24;
        
        try {
            predictBtn.disabled = true;
            predictBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Predicting...';

            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/ml/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    prediction_hours: parseInt(hours)
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert('Predictions generated successfully!', 'success');
                this.displayPredictions(result.data);
                this.hasPredictions = true;
                
            } else {
                throw new Error(result.message || 'Prediction failed');
            }

        } catch (error) {
            console.error('Error generating predictions:', error);
            this.showAlert(error.message || 'Failed to generate predictions', 'danger');
            
        } finally {
            predictBtn.disabled = false;
            predictBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generate Predictions';
        }
    }

    async loadPredictions(hours) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/ml/predictions?hours=${hours}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displayPredictions(result.data);
            }
        } catch (error) {
            console.error('Error loading predictions:', error);
        }
    }

    startAutoRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        // Set up new timer
        this.refreshTimer = setInterval(() => {
            if (this.currentSection === 'overview') {
                this.loadDashboardData();
            }
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    animateRefreshIcon() {
        const refreshIcon = document.getElementById('refreshIcon');
        if (refreshIcon) {
            refreshIcon.style.animation = 'spin 1s linear';
            setTimeout(() => {
                refreshIcon.style.animation = '';
            }, 1000);
        }
    }

    updateLastUpdatedTime() {
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl && this.lastUpdate) {
            lastUpdatedEl.textContent = this.formatTime(this.lastUpdate);
        }
    }

    // Utility methods
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    showAlert(message, type = 'info') {
        // Implementation similar to auth.js
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 90px; right: 20px; z-index: 1060; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Cleanup on page unload
    destroy() {
        this.stopAutoRefresh();
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
    }
}

// Global functions for HTML usage
window.controlServo = async function(action) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/servo/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action: action })
        });

        const result = await response.json();

        if (response.ok) {
            dashboard.showAlert(`Gate ${action === 'open' ? 'opened' : 'closed'} successfully!`, 'success');
            dashboard.updateServoStatus();
        } else {
            throw new Error(result.message || 'Control failed');
        }

    } catch (error) {
        console.error('Error controlling servo:', error);
        dashboard.showAlert(error.message || 'Failed to control gate', 'danger');
    }
};

window.clearAlerts = async function() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/alerts/clear', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            dashboard.showAlert('Alerts cleared successfully!', 'success');
            dashboard.loadAlertsData();
        } else {
            throw new Error('Failed to clear alerts');
        }

    } catch (error) {
        console.error('Error clearing alerts:', error);
        dashboard.showAlert('Failed to clear alerts', 'danger');
    }
};

window.closeAlert = function() {
    const alertBar = document.getElementById('alertBar');
    if (alertBar) {
        alertBar.classList.add('d-none');
    }
};

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

// Download sample dataset function
window.downloadSampleDataset = function() {
    const sampleData = `timestamp,water_level,distance,status
2024-03-11 08:00:00,15.2,184.8,normal
2024-03-11 08:30:00,16.8,183.2,normal
2024-03-11 09:00:00,18.5,181.5,normal
2024-03-11 09:30:00,21.3,178.7,normal
2024-03-11 10:00:00,25.7,174.3,normal
2024-03-11 10:30:00,28.9,171.1,warning
2024-03-11 11:00:00,32.4,167.6,warning
2024-03-11 11:30:00,35.8,164.2,warning
2024-03-11 12:00:00,39.2,160.8,warning
2024-03-11 12:30:00,42.6,157.4,warning
2024-03-11 13:00:00,45.8,154.2,danger
2024-03-11 13:30:00,48.3,151.7,danger
2024-03-11 14:00:00,51.7,148.3,danger
2024-03-11 14:30:00,54.2,145.8,danger
2024-03-11 15:00:00,52.1,147.9,danger
2024-03-11 15:30:00,48.7,151.3,warning
2024-03-11 16:00:00,45.3,154.7,warning
2024-03-11 16:30:00,41.9,158.1,warning
2024-03-11 17:00:00,38.5,161.5,warning
2024-03-11 17:30:00,35.1,164.9,warning
2024-03-11 18:00:00,31.7,168.3,normal
2024-03-11 18:30:00,28.3,171.7,normal
2024-03-11 19:00:00,24.9,175.1,normal
2024-03-11 19:30:00,21.5,178.5,normal
2024-03-11 20:00:00,18.1,181.9,normal`;

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_flood_dataset.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        dashboard.showAlert('Sample dataset downloaded successfully!', 'success');
    }
};

// ML functions
window.trainModel = function() {
    dashboard.trainModel();
};

window.generatePredictions = function() {
    dashboard.generatePredictions();
};

// Initialize dashboard when DOM is loaded
const dashboard = new DashboardManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    dashboard.destroy();
});
            `;
        }
    }

    startAutoRefresh() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        // Set up new timer
        this.refreshTimer = setInterval(() => {
            if (this.currentSection === 'overview') {
                this.loadDashboardData();
            }
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    animateRefreshIcon() {
        const refreshIcon = document.getElementById('refreshIcon');
        if (refreshIcon) {
            refreshIcon.style.animation = 'spin 1s linear';
            setTimeout(() => {
                refreshIcon.style.animation = '';
            }, 1000);
        }
    }

    updateLastUpdatedTime() {
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl && this.lastUpdate) {
            lastUpdatedEl.textContent = this.formatTime(this.lastUpdate);
        }
    }

    // Utility methods
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    showAlert(message, type = 'info') {
        // Implementation similar to auth.js
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 90px; right: 20px; z-index: 1060; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Cleanup on page unload
    destroy() {
        this.stopAutoRefresh();
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
    }
}

// Global functions for HTML usage
window.controlServo = async function(action) {
    const dashboard = window.dashboardManager;
    if (!dashboard) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${dashboard.apiBase}/servo/control`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });

        if (response.ok) {
            const result = await response.json();
            dashboard.showAlert(result.message, 'success');
            dashboard.updateGateVisual(result.data.current_state);
            await dashboard.loadServoHistory();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Control failed');
        }
    } catch (error) {
        dashboard.showAlert(error.message || 'Failed to control servo', 'danger');
    }
};

window.closeAlert = function() {
    const alertBar = document.getElementById('alertBar');
    if (alertBar) {
        alertBar.classList.add('d-none');
    }
};

window.clearAlerts = async function() {
    const dashboard = window.dashboardManager;
    if (!dashboard) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${dashboard.apiBase}/alerts/cleanup?days=7`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            dashboard.showAlert(`Cleaned up ${result.deleted_count} old alerts`, 'success');
            await dashboard.loadAlertsData();
        }
    } catch (error) {
        dashboard.showAlert('Failed to cleanup alerts', 'danger');
    }
};

window.updateProfile = async function() {
    const dashboard = window.dashboardManager;
    const name = document.getElementById('profileName').value.trim();
    
    if (!name) {
        dashboard.showAlert('Name is required', 'warning');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${dashboard.apiBase}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            dashboard.showAlert('Profile updated successfully', 'success');
            
            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            user.name = name;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update UI
            document.getElementById('userName').textContent = name;
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
            if (modal) modal.hide();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }
    } catch (error) {
        dashboard.showAlert(error.message || 'Failed to update profile', 'danger');
    }
};

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
};

// Initialize dashboard
window.dashboardManager = new DashboardManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboardManager) {
        window.dashboardManager.destroy();
    }
});