// Meetup Group Manager - Main Application Logic

class MeetupGroupManager {
    constructor() {
        this.groups = [];
        this.filteredGroups = [];
        this.selectedGroups = new Set();
        this.cookie = localStorage.getItem('meetup_cookie') || '';
        this.init();
    }

    init() {
        this.bindElements();
        this.attachEventListeners();
        this.updateCookieStatus();
    }

    bindElements() {
        this.loadGroupsBtn = document.getElementById('loadGroupsBtn');
        this.searchInput = document.getElementById('searchInput');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.unsubscribeBtn = document.getElementById('unsubscribeBtn');
        this.groupsContainer = document.getElementById('groupsContainer');
        this.statusMessage = document.getElementById('statusMessage');
        this.loadingState = document.getElementById('loadingState');
        this.selectedCount = document.getElementById('selectedCount');

        // Cookie elements
        this.toggleCookieBtn = document.getElementById('toggleCookieBtn');
        this.cookieInput = document.getElementById('cookieInput');
        this.cookieTextarea = document.getElementById('cookieTextarea');
        this.saveCookieBtn = document.getElementById('saveCookieBtn');
        this.cookieStatus = document.getElementById('cookieStatus');
        this.chevronIcon = this.toggleCookieBtn.querySelector('.chevron-icon');

        // Cookie help modal
        this.showCookieHelpBtn = document.getElementById('showCookieHelpBtn');
        this.cookieHelpModal = document.getElementById('cookieHelpModal');
        this.closeCookieHelpBtn = document.getElementById('closeCookieHelpBtn');
        this.closeCookieHelpBtn2 = document.getElementById('closeCookieHelpBtn2');
        this.cookieHelpOverlay = document.getElementById('cookieHelpOverlay');

        // Progress modal elements
        this.progressModal = document.getElementById('progressModal');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressDetails = document.getElementById('progressDetails');
    }

    attachEventListeners() {
        this.loadGroupsBtn.addEventListener('click', () => this.loadGroups());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.selectAllBtn.addEventListener('click', () => this.selectAll());
        this.deselectAllBtn.addEventListener('click', () => this.deselectAll());
        this.unsubscribeBtn.addEventListener('click', () => this.unsubscribeSelected());

        // Cookie management
        this.toggleCookieBtn.addEventListener('click', () => this.toggleCookieInput());
        this.saveCookieBtn.addEventListener('click', () => this.saveCookie());

        // Cookie help modal
        this.showCookieHelpBtn.addEventListener('click', () => this.showCookieHelpModal());
        this.closeCookieHelpBtn.addEventListener('click', () => this.hideCookieHelpModal());
        this.closeCookieHelpBtn2.addEventListener('click', () => this.hideCookieHelpModal());
        this.cookieHelpOverlay.addEventListener('click', () => this.hideCookieHelpModal());
    }

    showCookieHelpModal() {
        this.cookieHelpModal.style.display = 'flex';
    }

    hideCookieHelpModal() {
        this.cookieHelpModal.style.display = 'none';
    }

    toggleCookieInput() {
        const isVisible = this.cookieInput.style.display !== 'none';
        this.cookieInput.style.display = isVisible ? 'none' : 'block';
        this.chevronIcon.classList.toggle('rotated', !isVisible);

        if (!isVisible && this.cookie) {
            this.cookieTextarea.value = this.cookie;
        }
    }

    saveCookie() {
        const cookieValue = this.cookieTextarea.value.trim();

        if (!cookieValue) {
            this.showStatus('Please enter a cookie value', 'error');
            return;
        }

        this.cookie = cookieValue;
        localStorage.setItem('meetup_cookie', cookieValue);
        this.updateCookieStatus();
        this.showStatus('Cookie saved successfully!', 'success');
        this.toggleCookieInput();
    }

    updateCookieStatus() {
        if (this.cookie) {
            this.cookieStatus.textContent = '✓ Set';
            this.cookieStatus.classList.add('active');
        } else {
            this.cookieStatus.textContent = 'Not Set';
            this.cookieStatus.classList.remove('active');
        }
    }

    showStatus(message, type = 'success') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;

        setTimeout(() => {
            this.statusMessage.style.display = 'none';
        }, 5000);
    }

    async loadGroups() {
        this.showLoading(true);
        this.showStatus('', '');

        try {
            // Fetch all groups with pagination
            let allGroups = [];
            let hasNextPage = true;
            let cursor = null;
            let pageCount = 0;

            while (hasNextPage) {
                const variables = cursor
                    ? { first: 20, endCursor: cursor }
                    : { first: 20 };

                const requestBody = {
                    operationName: 'getSelfActiveGroups',
                    variables: variables,
                    extensions: {
                        persistedQuery: {
                            version: 1,
                            sha256Hash: 'fa70c232c132aa3c86036adfd09dabd9545e95551f80c1b313f71c01848aa5f8'
                        }
                    }
                };

                const response = await fetch('/api/meetup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        body: requestBody,
                        cookie: this.cookie
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.errors) {
                    throw new Error(data.errors[0].message || 'Failed to fetch groups');
                }

                const pageGroups = this.parseGroupsResponse(data);
                allGroups = allGroups.concat(pageGroups);

                // Check if there are more pages
                const pageInfo = data.data?.self?.memberships?.pageInfo;
                hasNextPage = pageInfo?.hasNextPage || false;
                cursor = pageInfo?.endCursor || null;

                pageCount++;

                // Update loading message
                this.loadingState.querySelector('p').textContent =
                    `Loading your groups... (${allGroups.length} found)`;

                // Safety limit to prevent infinite loops
                if (pageCount > 50) {
                    console.warn('Reached maximum page limit');
                    break;
                }
            }

            this.groups = allGroups;
            this.filteredGroups = [...this.groups];

            this.renderGroups();
            this.showStatus(`Successfully loaded ${this.groups.length} groups`, 'success');
        } catch (error) {
            console.error('Error loading groups:', error);
            this.showStatus(
                'Failed to load groups. Please make sure you are logged into Meetup.com in this browser and try again.',
                'error'
            );

            // For demo purposes, load sample data
            this.loadSampleData();
        } finally {
            this.showLoading(false);
        }
    }

    parseGroupsResponse(data) {
        // Parse the actual API response structure
        if (data.data && data.data.self && data.data.self.memberships) {
            const edges = data.data.self.memberships.edges || [];
            return edges.map(edge => {
                const node = edge.node;
                return {
                    id: node.id,
                    name: node.name,
                    urlname: node.urlname,
                    members: node.stats?.memberCounts?.all || 0,
                    city: node.city || 'Unknown',
                    country: node.country || 'Unknown',
                    status: node.status || 'UNKNOWN',
                    // Store additional data if available
                    link: node.link || `https://www.meetup.com/${node.urlname}/`,
                    photo: node.groupPhoto?.standardUrl || null,
                };
            });
        }
        return [];
    }

    loadSampleData() {
        // Sample data for demonstration
        this.groups = [
            {
                id: '37785590',
                name: 'Live Music Everyday in Downtown Barcelona',
                urlname: 'live-music-everyday-in-downtown-barcelona',
                members: 1234,
                city: 'Barcelona',
                country: 'Spain'
            },
            {
                id: '12345678',
                name: 'Tech Meetup San Francisco',
                urlname: 'tech-meetup-san-francisco',
                members: 5678,
                city: 'San Francisco',
                country: 'USA'
            },
            {
                id: '23456789',
                name: 'Photography Enthusiasts London',
                urlname: 'photography-enthusiasts-london',
                members: 890,
                city: 'London',
                country: 'UK'
            },
            {
                id: '34567890',
                name: 'Hiking Adventures Seattle',
                urlname: 'hiking-adventures-seattle',
                members: 2345,
                city: 'Seattle',
                country: 'USA'
            },
            {
                id: '45678901',
                name: 'Startup Founders Berlin',
                urlname: 'startup-founders-berlin',
                members: 3456,
                city: 'Berlin',
                country: 'Germany'
            },
            {
                id: '56789012',
                name: 'Book Club Amsterdam',
                urlname: 'book-club-amsterdam',
                members: 456,
                city: 'Amsterdam',
                country: 'Netherlands'
            }
        ];

        this.filteredGroups = [...this.groups];
        this.renderGroups();
        this.showStatus(
            'Loaded sample data for demonstration. Click "Load My Groups" after logging into Meetup.com to load your actual groups.',
            'warning'
        );
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            this.filteredGroups = [...this.groups];
        } else {
            this.filteredGroups = this.groups.filter(group =>
                group.name.toLowerCase().includes(searchTerm) ||
                group.city.toLowerCase().includes(searchTerm) ||
                group.country.toLowerCase().includes(searchTerm)
            );
        }

        this.renderGroups();
    }

    renderGroups() {
        if (this.filteredGroups.length === 0) {
            this.groupsContainer.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <h2>No Groups Found</h2>
                    <p>${this.groups.length === 0 ? 'Click "Load My Groups" to fetch your Meetup groups' : 'Try adjusting your search terms'}</p>
                </div>
            `;
            return;
        }

        this.groupsContainer.innerHTML = this.filteredGroups.map(group => `
            <div class="group-card ${this.selectedGroups.has(group.id) ? 'selected' : ''}" 
                 data-group-id="${group.id}"
                 id="group-${group.id}">
                <div class="group-header">
                    <input type="checkbox" 
                           class="group-checkbox" 
                           data-group-id="${group.id}"
                           ${this.selectedGroups.has(group.id) ? 'checked' : ''}>
                    <div class="group-info">
                        <h3 class="group-name">${this.escapeHtml(group.name)}</h3>
                        <div class="group-meta">
                            <span class="group-meta-item">
                                👥 ${this.formatNumber(group.members)} members
                            </span>
                            <span class="group-meta-item">
                                📍 ${this.escapeHtml(group.city)}, ${this.escapeHtml(group.country)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach event listeners to checkboxes and cards
        this.groupsContainer.querySelectorAll('.group-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleGroupSelection(e.target.dataset.groupId);
            });
        });

        this.groupsContainer.querySelectorAll('.group-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('group-checkbox')) return;
                const groupId = card.dataset.groupId;
                this.toggleGroupSelection(groupId);
                const checkbox = card.querySelector('.group-checkbox');
                if (checkbox) checkbox.checked = this.selectedGroups.has(groupId);
            });
        });
    }

    toggleGroupSelection(groupId) {
        if (this.selectedGroups.has(groupId)) {
            this.selectedGroups.delete(groupId);
        } else {
            this.selectedGroups.add(groupId);
        }

        this.updateSelectionUI();
    }

    selectAll() {
        this.filteredGroups.forEach(group => {
            this.selectedGroups.add(group.id);
        });
        this.updateSelectionUI();
    }

    deselectAll() {
        this.selectedGroups.clear();
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        this.selectedCount.textContent = this.selectedGroups.size;
        this.unsubscribeBtn.disabled = this.selectedGroups.size === 0;

        // Update card states
        this.groupsContainer.querySelectorAll('.group-card').forEach(card => {
            const groupId = card.dataset.groupId;
            const checkbox = card.querySelector('.group-checkbox');

            if (this.selectedGroups.has(groupId)) {
                card.classList.add('selected');
                if (checkbox) checkbox.checked = true;
            } else {
                card.classList.remove('selected');
                if (checkbox) checkbox.checked = false;
            }
        });
    }

    async unsubscribeSelected() {
        if (this.selectedGroups.size === 0) return;

        const confirmed = confirm(
            `Are you sure you want to unsubscribe from ${this.selectedGroups.size} group(s)? This action cannot be undone.`
        );

        if (!confirmed) return;

        this.showProgressModal(true);

        const groupsToProcess = Array.from(this.selectedGroups);
        let processed = 0;
        let succeeded = 0;
        let failed = 0;

        for (const groupId of groupsToProcess) {
            const group = this.groups.find(g => g.id === groupId);

            try {
                await this.leaveGroup(groupId);
                succeeded++;
                this.updateGroupStatus(groupId, 'success', '✓ Successfully left');
                this.addProgressDetail(group.name, 'success');
            } catch (error) {
                failed++;
                this.updateGroupStatus(groupId, 'error', '✗ Failed to leave');
                this.addProgressDetail(`${group.name}: ${error.message}`, 'error');
            }

            processed++;
            this.updateProgress(processed, groupsToProcess.length);

            // Add a small delay to avoid rate limiting
            await this.sleep(500);
        }

        // Show final results
        setTimeout(() => {
            this.showProgressModal(false);
            this.selectedGroups.clear();
            this.updateSelectionUI();

            if (failed === 0) {
                this.showStatus(`Successfully unsubscribed from ${succeeded} group(s)`, 'success');
            } else {
                this.showStatus(
                    `Completed: ${succeeded} succeeded, ${failed} failed`,
                    failed > succeeded ? 'error' : 'warning'
                );
            }
        }, 2000);
    }

    async leaveGroup(groupId) {
        const requestBody = {
            operationName: 'leaveGroup',
            variables: { groupId: groupId },
            extensions: {
                persistedQuery: {
                    version: 1,
                    sha256Hash: '5a132c6d0bc8aaa403e5c58e81ca4811070fc72fa96d496aa711a1c3e7fc4c90'
                }
            }
        };

        const response = await fetch('/api/meetup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                body: requestBody,
                cookie: this.cookie
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error(data.errors[0].message || 'Failed to leave group');
        }

        return data;
    }

    updateGroupStatus(groupId, status, message) {
        const card = document.getElementById(`group-${groupId}`);
        if (!card) return;

        card.classList.add(status);

        const existingStatus = card.querySelector('.group-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        const statusEl = document.createElement('div');
        statusEl.className = `group-status ${status}`;
        statusEl.textContent = message;
        card.querySelector('.group-info').appendChild(statusEl);
    }

    showProgressModal(show) {
        this.progressModal.style.display = show ? 'flex' : 'none';
        if (!show) {
            this.progressDetails.innerHTML = '';
        }
    }

    updateProgress(current, total) {
        const percentage = (current / total) * 100;
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `Processing ${current} of ${total} groups...`;
    }

    addProgressDetail(message, type = 'success') {
        const item = document.createElement('div');
        item.className = `progress-item ${type}`;
        item.textContent = type === 'success' ? `✓ ${message}` : `✗ ${message}`;
        this.progressDetails.appendChild(item);
        this.progressDetails.scrollTop = this.progressDetails.scrollHeight;
    }

    showLoading(show) {
        this.loadingState.style.display = show ? 'block' : 'none';
        if (show) {
            this.groupsContainer.style.display = 'none';
        } else {
            this.groupsContainer.style.display = 'grid';
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
const app = new MeetupGroupManager();
