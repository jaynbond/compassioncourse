// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.editingContentId = null;
        this.init();
    }

    async init() {
        try {
            await this.checkAuth();
            this.setupEventListeners();
            await this.loadDashboardData();
        } catch (error) {
            console.error('Init error:', error);
            this.redirectToLogin();
        }
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Not authenticated');
            }

            const data = await response.json();
            this.currentUser = data.user;

            // Check if user is admin
            if (!['admin', 'super-admin'].includes(this.currentUser.role)) {
                throw new Error('Insufficient permissions');
            }

            document.getElementById('user-name').textContent = this.currentUser.name || this.currentUser.email;
        } catch (error) {
            throw error;
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Content form
        document.getElementById('content-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContent();
        });

        // Modal close on outside click
        document.getElementById('content-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeContentModal();
            }
        });
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.admin-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(`${sectionName}-section`).style.display = 'block';

        // Load section data
        switch (sectionName) {
            case 'content':
                this.loadContent();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'dashboard':
                this.loadDashboardData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const [usersResponse, contentResponse] = await Promise.all([
                fetch('/api/admin/stats/users', { credentials: 'include' }),
                fetch('/api/admin/stats/content', { credentials: 'include' })
            ]);

            if (usersResponse.ok) {
                const userData = await usersResponse.json();
                document.getElementById('total-users').textContent = userData.total || 0;
                document.getElementById('recent-signups').textContent = userData.recent || 0;
            }

            if (contentResponse.ok) {
                const contentData = await contentResponse.json();
                document.getElementById('total-content').textContent = contentData.total || 0;
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadContent() {
        const container = document.getElementById('content-list');
        container.innerHTML = '<div class="loading">Loading content...</div>';

        try {
            const response = await fetch('/api/admin/content', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to load content');
            }

            const data = await response.json();
            this.renderContent(data.content || []);
        } catch (error) {
            console.error('Error loading content:', error);
            container.innerHTML = '<p>Error loading content. Please try again.</p>';
        }
    }

    renderContent(content) {
        const container = document.getElementById('content-list');
        
        if (content.length === 0) {
            container.innerHTML = '<p>No content found. <a href="#" onclick="adminPanel.showContentModal()">Add some content</a></p>';
            return;
        }

        container.innerHTML = content.map(item => `
            <div class="content-item">
                <div class="content-info">
                    <h4>${this.escapeHtml(item.title)}</h4>
                    <p>Key: ${this.escapeHtml(item.key)} | Section: ${this.escapeHtml(item.section)}</p>
                </div>
                <div class="content-actions">
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editContent('${item._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteContent('${item._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadUsers() {
        const container = document.getElementById('users-list');
        container.innerHTML = '<div class="loading">Loading users...</div>';

        try {
            const response = await fetch('/api/admin/users', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to load users');
            }

            const data = await response.json();
            this.renderUsers(data.users || []);
        } catch (error) {
            console.error('Error loading users:', error);
            container.innerHTML = '<p>Error loading users. Please try again.</p>';
        }
    }

    renderUsers(users) {
        const container = document.getElementById('users-list');
        
        if (users.length === 0) {
            container.innerHTML = '<p>No users found.</p>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="content-item">
                <div class="content-info">
                    <h4>${this.escapeHtml(user.name || user.email)}</h4>
                    <p>Email: ${this.escapeHtml(user.email)} | Role: ${this.escapeHtml(user.role)} | Status: ${user.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div class="content-actions">
                    ${user.role !== 'super-admin' ? `
                        <button class="btn btn-sm btn-primary" onclick="adminPanel.toggleUserStatus('${user._id}', ${user.isActive})">
                            ${user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    showContentModal(contentId = null) {
        this.editingContentId = contentId;
        const modal = document.getElementById('content-modal');
        const form = document.getElementById('content-form');
        
        // Reset form
        form.reset();
        document.getElementById('content-id').value = '';
        
        if (contentId) {
            document.getElementById('modal-title').textContent = 'Edit Content';
            this.loadContentForEdit(contentId);
        } else {
            document.getElementById('modal-title').textContent = 'Add Content';
        }
        
        modal.classList.add('active');
    }

    async loadContentForEdit(contentId) {
        try {
            const response = await fetch(`/api/admin/content/${contentId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to load content');
            }

            const data = await response.json();
            const content = data.content;

            document.getElementById('content-id').value = content._id;
            document.getElementById('content-key').value = content.key;
            document.getElementById('content-title').value = content.title;
            document.getElementById('content-section').value = content.section;
            document.getElementById('content-text').value = content.content;
            document.getElementById('content-order').value = content.order;
        } catch (error) {
            console.error('Error loading content for edit:', error);
            this.showAlert('Error loading content for editing', 'error');
        }
    }

    closeContentModal() {
        document.getElementById('content-modal').classList.remove('active');
        this.editingContentId = null;
        document.getElementById('alert-container').innerHTML = '';
    }

    async saveContent() {
        try {
            const contentId = document.getElementById('content-id').value;
            const formData = {
                key: document.getElementById('content-key').value,
                title: document.getElementById('content-title').value,
                section: document.getElementById('content-section').value,
                content: document.getElementById('content-text').value,
                order: parseInt(document.getElementById('content-order').value) || 0
            };

            const url = contentId ? `/api/admin/content/${contentId}` : '/api/admin/content';
            const method = contentId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save content');
            }

            this.showAlert('Content saved successfully!', 'success');
            setTimeout(() => {
                this.closeContentModal();
                this.loadContent();
            }, 1500);
        } catch (error) {
            console.error('Error saving content:', error);
            this.showAlert(error.message, 'error');
        }
    }

    async deleteContent(contentId) {
        if (!confirm('Are you sure you want to delete this content?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/content/${contentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to delete content');
            }

            this.loadContent();
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('Error deleting content. Please try again.');
        }
    }

    async editContent(contentId) {
        this.showContentModal(contentId);
    }

    async toggleUserStatus(userId, currentStatus) {
        try {
            const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
                method: 'PUT',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to update user status');
            }

            this.loadUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Error updating user status. Please try again.');
        }
    }

    async refreshData() {
        await this.loadDashboardData();
        if (document.getElementById('content-section').style.display !== 'none') {
            await this.loadContent();
        }
        if (document.getElementById('users-section').style.display !== 'none') {
            await this.loadUsers();
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        window.location.href = '/login';
    }

    showAlert(message, type = 'info') {
        const container = document.getElementById('alert-container');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        container.innerHTML = '';
        container.appendChild(alert);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for onclick handlers
let adminPanel;

function showContentModal() {
    adminPanel.showContentModal();
}

function closeContentModal() {
    adminPanel.closeContentModal();
}

function logout() {
    adminPanel.logout();
}

function refreshData() {
    adminPanel.refreshData();
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
