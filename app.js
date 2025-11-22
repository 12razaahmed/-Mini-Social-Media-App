// State Management
const state = {
    users: JSON.parse(localStorage.getItem('vs_users')) || [],
    posts: JSON.parse(localStorage.getItem('vs_posts')) || [],
    currentUser: JSON.parse(localStorage.getItem('vs_currentUser')) || null,
    theme: localStorage.getItem('vs_theme') || 'dark',
    filter: 'latest',
    searchQuery: ''
};

// DOM Elements
const elements = {
    authSection: document.getElementById('auth-section'),
    appSection: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    formLogin: document.getElementById('form-login'),
    formSignup: document.getElementById('form-signup'),
    showSignupBtn: document.getElementById('show-signup'),
    showLoginBtn: document.getElementById('show-login'),
    themeToggle: document.getElementById('theme-toggle'),
    postsFeed: document.getElementById('posts-feed'),
    postText: document.getElementById('post-text'),
    postSubmitBtn: document.getElementById('post-submit-btn'),
    addImageBtn: document.getElementById('add-image-btn'),
    imageUrlWrapper: document.getElementById('image-url-input-wrapper'),
    postImageUrl: document.getElementById('post-image-url'),
    confirmImageUrl: document.getElementById('confirm-image-url'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    removeImageBtn: document.getElementById('remove-image-btn'),
    searchInput: document.getElementById('search-input'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    headerUsername: document.getElementById('header-username'),
    headerAvatar: document.getElementById('header-avatar'),
    sidebarUsername: document.getElementById('sidebar-username'),
    sidebarAvatar: document.getElementById('sidebar-avatar'),
    createPostAvatar: document.getElementById('create-post-avatar'),
    userPostsCount: document.getElementById('user-posts-count'),
    userLikesCount: document.getElementById('user-likes-count'),
    logoutBtn: document.getElementById('logout-btn'),
    editModal: document.getElementById('edit-modal'),
    editPostText: document.getElementById('edit-post-text'),
    editPostImage: document.getElementById('edit-post-image'),
    saveEditBtn: document.getElementById('save-edit-btn'),
    closeModalBtns: document.querySelectorAll('.close-modal')
};

// Constants
const TOAST_DURATION = 3000;

// Initialization
function init() {
    applyTheme(state.theme);
    
    if (state.currentUser) {
        showApp();
    } else {
        showAuth();
    }

    setupEventListeners();
    renderPosts();
}

// Event Listeners
function setupEventListeners() {
    // Auth Switching
    elements.showSignupBtn.addEventListener('click', () => toggleAuthForm('signup'));
    elements.showLoginBtn.addEventListener('click', () => toggleAuthForm('login'));

    // Forms
    elements.formLogin.addEventListener('submit', handleLogin);
    elements.formSignup.addEventListener('submit', handleSignup);
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Theme
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Post Creation
    elements.addImageBtn.addEventListener('click', () => {
        elements.imageUrlWrapper.classList.toggle('hidden');
        elements.postImageUrl.focus();
    });

    elements.confirmImageUrl.addEventListener('click', handleImageAdd);
    elements.removeImageBtn.addEventListener('click', clearImagePreview);
    elements.postSubmitBtn.addEventListener('click', handleCreatePost);

    // Search & Filter
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderPosts();
    });

    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.filter = e.target.dataset.sort;
            renderPosts();
        });
    });

    // Modal
    elements.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.editModal.classList.add('hidden');
        });
    });
    
    elements.saveEditBtn.addEventListener('click', handleSaveEdit);
}

// Auth Functions
function toggleAuthForm(type) {
    if (type === 'signup') {
        elements.loginForm.classList.remove('active');
        elements.signupForm.classList.add('active');
    } else {
        elements.signupForm.classList.remove('active');
        elements.loginForm.classList.add('active');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (state.users.find(u => u.email === email)) {
        showToast('Email already exists!', 'error');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    state.users.push(newUser);
    saveData();
    
    // Auto login
    loginUser(newUser);
    showToast('Account created successfully!', 'success');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const user = state.users.find(u => u.email === email && u.password === password);

    if (user) {
        loginUser(user);
        showToast('Welcome back!', 'success');
    } else {
        showToast('Invalid credentials!', 'error');
    }
}

function loginUser(user) {
    state.currentUser = user;
    saveData();
    showApp();
}

function handleLogout() {
    state.currentUser = null;
    saveData();
    showAuth();
    showToast('Logged out successfully', 'info');
}

function showAuth() {
    elements.appSection.classList.remove('active');
    elements.authSection.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling in auth
}

function showApp() {
    elements.authSection.classList.remove('active');
    elements.appSection.classList.add('active');
    document.body.style.overflow = 'auto';
    updateUserProfile();
    renderPosts();
}

function updateUserProfile() {
    if (!state.currentUser) return;
    
    const { name, avatar } = state.currentUser;
    elements.headerUsername.textContent = name;
    elements.headerAvatar.src = avatar;
    elements.sidebarUsername.textContent = name;
    elements.sidebarAvatar.src = avatar;
    elements.createPostAvatar.src = avatar;

    // Update stats
    const userPosts = state.posts.filter(p => p.authorId === state.currentUser.id);
    elements.userPostsCount.textContent = userPosts.length;
    
    const totalLikes = userPosts.reduce((acc, curr) => acc + curr.likes, 0);
    elements.userLikesCount.textContent = totalLikes;
}

// Post Functions
function handleImageAdd() {
    const url = elements.postImageUrl.value;
    if (url) {
        elements.imagePreview.src = url;
        elements.imagePreviewContainer.style.display = 'block';
        elements.imageUrlWrapper.classList.add('hidden');
        elements.postImageUrl.value = '';
    }
}

function clearImagePreview() {
    elements.imagePreview.src = '';
    elements.imagePreviewContainer.style.display = 'none';
}

function handleCreatePost() {
    const content = elements.postText.value.trim();
    const image = elements.imagePreview.getAttribute('src');

    if (!content && !image) {
        showToast('Please write something or add an image!', 'error');
        return;
    }

    const newPost = {
        id: Date.now().toString(),
        authorId: state.currentUser.id,
        authorName: state.currentUser.name,
        authorAvatar: state.currentUser.avatar,
        content,
        image: image === window.location.href ? '' : image, // Handle empty src
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [] // Array of user IDs
    };

    state.posts.unshift(newPost);
    saveData();
    
    // Reset form
    elements.postText.value = '';
    clearImagePreview();
    
    renderPosts();
    updateUserProfile();
    showToast('Post published!', 'success');
}

function renderPosts() {
    let filteredPosts = [...state.posts];

    // Search
    if (state.searchQuery) {
        filteredPosts = filteredPosts.filter(p => 
            p.content.toLowerCase().includes(state.searchQuery) || 
            p.authorName.toLowerCase().includes(state.searchQuery)
        );
    }

    // Sort
    if (state.filter === 'latest') {
        filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (state.filter === 'oldest') {
        filteredPosts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (state.filter === 'popular') {
        filteredPosts.sort((a, b) => b.likes - a.likes);
    }

    elements.postsFeed.innerHTML = '';

    if (filteredPosts.length === 0) {
        elements.postsFeed.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 40px;">
                <i class="fa-regular fa-folder-open" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 10px;"></i>
                <p style="color: var(--text-secondary);">No posts found.</p>
            </div>
        `;
        return;
    }

    filteredPosts.forEach(post => {
        const isLiked = post.likedBy.includes(state.currentUser.id);
        const isAuthor = post.authorId === state.currentUser.id;
        
        const postEl = document.createElement('div');
        postEl.className = 'post-card';
        postEl.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <img src="${post.authorAvatar}" alt="${post.authorName}">
                    <div class="author-info">
                        <h4>${post.authorName}</h4>
                        <span class="post-time">${formatDate(post.timestamp)}</span>
                    </div>
                </div>
                ${isAuthor ? `
                    <button class="post-menu-btn" onclick="deletePost('${post.id}')" title="Delete Post">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <button class="post-menu-btn" onclick="openEditModal('${post.id}')" title="Edit Post" style="margin-right: 10px;">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                ` : ''}
            </div>
            <div class="post-content">${linkify(post.content)}</div>
            ${post.image ? `<div class="post-image"><img src="${post.image}" alt="Post Image"></div>` : ''}
            <div class="post-actions">
                <button class="post-action ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    <span>${post.likes}</span>
                </button>
                <button class="post-action">
                    <i class="fa-regular fa-comment"></i>
                    <span>Comment</span>
                </button>
                <button class="post-action">
                    <i class="fa-solid fa-share"></i>
                    <span>Share</span>
                </button>
            </div>
        `;
        elements.postsFeed.appendChild(postEl);
    });
}

// Post Actions
window.toggleLike = function(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    const userId = state.currentUser.id;
    const index = post.likedBy.indexOf(userId);

    if (index === -1) {
        post.likedBy.push(userId);
        post.likes++;
    } else {
        post.likedBy.splice(index, 1);
        post.likes--;
    }

    saveData();
    renderPosts();
    updateUserProfile(); // Update stats if needed
};

window.deletePost = function(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        state.posts = state.posts.filter(p => p.id !== postId);
        saveData();
        renderPosts();
        updateUserProfile();
        showToast('Post deleted', 'info');
    }
};

let currentEditingId = null;

window.openEditModal = function(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    currentEditingId = postId;
    elements.editPostText.value = post.content;
    elements.editPostImage.value = post.image || '';
    elements.editModal.classList.remove('hidden');
};

function handleSaveEdit() {
    if (!currentEditingId) return;

    const post = state.posts.find(p => p.id === currentEditingId);
    if (post) {
        post.content = elements.editPostText.value;
        post.image = elements.editPostImage.value;
        saveData();
        renderPosts();
        showToast('Post updated', 'success');
    }

    elements.editModal.classList.add('hidden');
    currentEditingId = null;
}

// Utilities
function saveData() {
    localStorage.setItem('vs_users', JSON.stringify(state.users));
    localStorage.setItem('vs_posts', JSON.stringify(state.posts));
    localStorage.setItem('vs_currentUser', JSON.stringify(state.currentUser));
    localStorage.setItem('vs_theme', state.theme);
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    saveData();
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = elements.themeToggle.querySelector('i');
    if (theme === 'light') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

function linkify(text) {
    // Simple regex to linkify URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank" style="color: var(--primary-color); text-decoration: none;">${url}</a>`);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--card-bg);
        color: var(--text-main);
        padding: 12px 24px;
        border-radius: 8px;
        border-left: 4px solid ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
        box-shadow: var(--shadow);
        backdrop-filter: blur(var(--blur));
        z-index: 1000;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;

    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, TOAST_DURATION);
}

// Run
document.addEventListener('DOMContentLoaded', init);
