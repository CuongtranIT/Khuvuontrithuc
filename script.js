// === DỮ LIỆU KHỞI TẠO ===
const initialQuestions = [
    { id: 1, subject: 'Toán', question: '37 + 15 = ?', answer: '52', options: ['42', '52', '62'], explanation: '7+5=12 viết 2 nhớ 1. 3+1=4 thêm 1 là 5.' },
    { id: 2, subject: 'Toán', question: '63 - 28 = ?', answer: '35', options: ['35', '45', '25'], explanation: '13-8=5 nhớ 1. 6-2-1=3.' },
    
    { id: 3, subject: 'Tiếng Anh', question: 'Hello nghĩa là gì?', answer: 'Xin chào', options: ['Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'], explanation: 'Hello nghĩa là Xin chào' },
    { id: 4, subject: 'Tiếng Việt', question: 'Từ chỉ hoạt động: "Chim hót"', answer: 'hót', options: ['Chim', 'trên', 'cành', 'hót'], explanation: 'Hót là động từ' },
];

// Các giai đoạn tiến hóa của cây: Hạt -> Mầm -> Nụ -> Hoa
const PLANT_STAGES = ['🌱', '🌿', '🌷', '🌻']; 

const DB_KEY = 'vuon_hoa_db';

// Dữ liệu mặc định (Nếu chưa có thì dùng cái này)
let db = JSON.parse(localStorage.getItem(DB_KEY)) || {
    questions: initialQuestions,
    users: {
        'lan': { pass: '123', class: '2A', phone: '0901234567', coins: 50, water: 50, gardenLevel: 1, isVip: false, plants: [0,0,0,0] }, 
        'minh': { pass: '123', class: '2B', phone: '', coins: 0, water: 20, gardenLevel: 1, isVip: false, plants: [0,0,0,0] }
    },
    admin: { 'gv': '123', 'admin': '123' } 
};

// Hàm kiểm tra và cập nhật dữ liệu cũ (tránh lỗi khi bạn chạy code mới trên dữ liệu cũ)
function migrateData() {
    let changed = false;
    Object.keys(db.users).forEach(u => {
        // Nếu chưa có mảng cây, tạo mới dựa trên gardenLevel
        if (!db.users[u].plants) {
            db.users[u].plants = new Array(db.users[u].gardenLevel * 4).fill(0);
            changed = true;
        }
        // Nếu chưa có sđt, thêm vào
        if (db.users[u].phone === undefined) {
            db.users[u].phone = '';
            changed = true;
        }
    });
    if (changed) saveDB();
}
migrateData();

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// === BIẾN TOÀN CỤC ===
let currentUser = null;
let currentRole = '';
let currentMusic = false;
const bgMusic = document.getElementById('bg-music');

// === HỆ THỐNG UTILS ===
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    const bg = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-yellow-500');
    
    div.className = `toast ${bg} shadow-lg`;
    div.innerHTML = `<i class="fas fa-info-circle"></i> <span>${msg}</span>`;
    container.appendChild(div);
    playSound(type === 'success' ? 'ting' : 'buzz');
    setTimeout(() => { div.remove(); }, 3000);
}

function playSound(type) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'ting') {
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    }
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
}

function toggleMusic() {
    currentMusic = !currentMusic;
    const icon = document.querySelector('#music-btn i');
    if (currentMusic) {
        bgMusic.play().catch(() => {});
        icon.className = 'fas fa-volume-up text-pink-500';
    } else {
        bgMusic.pause();
        icon.className = 'fas fa-volume-mute';
    }
}

// === AUTH SYSTEM ===
function setLoginMode(mode) {
    const sBtn = document.getElementById('tab-student');
    const tBtn = document.getElementById('tab-teacher');
    const fields = document.getElementById('student-fields');
    
    if (mode === 'student') {
        sBtn.className = 'flex-1 py-2 rounded-full font-bold transition-all bg-white shadow text-blue-600';
        tBtn.className = 'flex-1 py-2 rounded-full font-bold transition-all text-gray-500';
        fields.style.display = 'block';
    } else {
        tBtn.className = 'flex-1 py-2 rounded-full font-bold transition-all bg-white shadow text-blue-600';
        sBtn.className = 'flex-1 py-2 rounded-full font-bold transition-all text-gray-500';
        fields.style.display = 'none';
    }
}

function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('username').value.trim().toLowerCase();
    const p = document.getElementById('password').value.trim();
    
    if (db.admin[u] && db.admin[u] === p) {
        loginSuccess(u, 'teacher');
        return;
    }
    if (db.users[u] && db.users[u].pass === p) {
        loginSuccess(u, 'student');
        return;
    }
    showToast('Sai tên đăng nhập hoặc mật khẩu!', 'error');
}

function quickLogin(username) {
    if (db.admin[username]) loginSuccess(username, 'teacher');
    else if (db.users[username]) loginSuccess(username, 'student');
    else showToast('Tài khoản không tồn tại', 'error');
}

function loginSuccess(username, role) {
    currentUser = username;
    currentRole = role;
    
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.display = 'none';

    if (role === 'student') {
        const s = document.getElementById('student-screen');
        s.style.display = 'block';
        s.classList.add('active');
        initStudentUI();
    } else {
        const t = document.getElementById('teacher-screen');
        t.style.display = 'block';
        t.classList.add('active');
        initTeacherUI();
    }
    document.getElementById('login-form').reset();
    showToast(`Xin chào ${username}!`, 'success');
}

function logout() {
    currentUser = null;
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = ''; 
    });
    const loginScreen = document.getElementById('login-screen');
    loginScreen.classList.add('active');
    loginScreen.style.display = 'flex';
    showToast('Đã đăng xuất');
}

// === STUDENT LOGIC ===
function initStudentUI() {
    const userData = db.users[currentUser];
    document.getElementById('student-display-name').innerText = currentUser.toUpperCase();
    document.getElementById('student-display-class').innerText = `Lớp: ${userData.class}`;
    updateStats();
    renderGarden();
    loadQuestions('All');
}

function updateStats() {
    const userData = db.users[currentUser];
    document.getElementById('coin-display').innerText = userData.coins;
    document.getElementById('water-display').innerText = userData.water;
    document.getElementById('garden-level').innerText = `📍 Tầng ${userData.gardenLevel}`;
    
    const vipBtn = document.getElementById('vip-btn');
    if (userData.isVip) {
        vipBtn.innerText = "👑 Bạn đã là VIP";
        vipBtn.disabled = true;
        vipBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function renderGarden() {
    const grid = document.getElementById('garden-grid');
    grid.innerHTML = '';
    const userData = db.users[currentUser];
    
    // Đảm bảo mảng plants đủ số lượng
    const slots = userData.gardenLevel * 4;
    if (!userData.plants || userData.plants.length < slots) {
        const currentLen = userData.plants ? userData.plants.length : 0;
        const newPlants = new Array(slots - currentLen).fill(0); // 0 là hạt mầm
        userData.plants = userData.plants ? userData.plants.concat(newPlants) : newPlants;
        saveDB();
    }

    userData.plants.forEach((stageIndex, idx) => {
        const div = document.createElement('div');
        div.className = 'aspect-square bg-gradient-to-b from-green-200 to-green-300 rounded-2xl flex items-center justify-center text-5xl shadow-lg border-2 border-green-400 hover:scale-105 cursor-pointer transition relative overflow-hidden group select-none';
        
        // Lấy icon dựa trên giai đoạn
        // Nếu stageIndex vượt quá mảng (cây đã lớn hết mức), lấy cái cuối
        const icon = stageIndex < PLANT_STAGES.length ? PLANT_STAGES[stageIndex] : PLANT_STAGES[PLANT_STAGES.length - 1];
        
        div.innerText = icon;
        div.onclick = (e) => waterPlant(e, div, idx);
        grid.appendChild(div);
    });
}

// HÀM TƯỚI CÂY - TIẾN HÓA CÂY
function waterPlant(e, element, plantIndex) {
    const userData = db.users[currentUser];
    if (userData.water >= 5) {
        userData.water -= 5;
        userData.coins += userData.isVip ? 6 : 3;
        
        // Logic tiến hóa cây
        let currentStage = userData.plants[plantIndex];
        // Nếu chưa đạt cấp tối đa thì tăng cấp
        if (currentStage < PLANT_STAGES.length - 1) {
            userData.plants[plantIndex]++;
            const newIcon = PLANT_STAGES[userData.plants[plantIndex]];
            element.innerText = newIcon;
            showToast(`Cây đã lớn lên! ${newIcon}`, 'success');
        } else {
            showToast(`+${userData.isVip ? 6 : 3} Xu`, 'success');
        }

        saveDB();
        updateStats();
        
        // Hiệu ứng
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 500);
        
        const drop = document.createElement('div');
        drop.className = 'water-drop';
        drop.innerText = '💧';
        drop.style.left = e.clientX + 'px';
        drop.style.top = e.clientY + 'px';
        document.body.appendChild(drop);
        setTimeout(() => drop.remove(), 1000);

    } else {
        showToast('Hết nước rồi! Hãy làm bài tập.', 'error');
    }
}

function upgradeGarden() {
    const userData = db.users[currentUser];
    if (userData.coins >= 500) {
        userData.coins -= 500;
        userData.gardenLevel++;
        // Thêm 4 ô đất mới (hạt mầm)
        userData.plants = userData.plants.concat([0,0,0,0]);
        saveDB();
        updateStats();
        renderGarden();
        showToast('Nâng cấp thành công! 🎉');
    } else {
        showToast(`Cần thêm ${500 - userData.coins} xu nữa!`, 'error');
    }
}

function buyItem(item, cost) {
    const userData = db.users[currentUser];
    if (userData.coins >= cost) {
        userData.coins -= cost;
        if (item === 'seed') userData.water += 30;
        if (item === 'water') userData.water += 50;
        saveDB();
        updateStats();
        showToast('Mua thành công!');
    } else {
        showToast('Không đủ tiền!', 'error');
    }
}

function toggleVip() {
    const userData = db.users[currentUser];
    if (!userData.isVip) {
        userData.isVip = true;
        saveDB();
        updateStats();
        showToast('Chúc mừng bạn đã trở thành VIP! 👑');
    }
}

// === STUDY LOGIC ===
let currentQuizList = [];
function loadQuestions(subject) {
    const subjects = ['All', ...new Set(db.questions.map(q => q.subject))];
    const filterDiv = document.getElementById('subject-filters');
    filterDiv.innerHTML = '';
    subjects.forEach(sub => {
        const btn = document.createElement('button');
        btn.innerText = sub === 'All' ? '📚 Tất cả' : sub;
        btn.className = `px-4 py-2 rounded-full font-bold whitespace-nowrap transition ${sub === subject ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`;
        btn.onclick = () => loadQuestions(sub);
        filterDiv.appendChild(btn);
    });
    currentQuizList = subject === 'All' ? db.questions : db.questions.filter(q => q.subject === subject);
    if (currentQuizList.length > 0) {
        currentQuizList.sort(() => Math.random() - 0.5);
        renderQuestion(currentQuizList[0]);
    } else {
        document.getElementById('current-question-card').classList.add('hidden');
        document.getElementById('quiz-message').innerText = "Chưa có câu hỏi nào.";
        document.getElementById('quiz-message').classList.remove('hidden');
    }
}

function renderQuestion(q) {
    document.getElementById('quiz-message').classList.add('hidden');
    document.getElementById('current-question-card').classList.remove('hidden');
    document.getElementById('q-result').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('q-options').classList.remove('pointer-events-none');
    document.getElementById('q-subject-tag').innerText = q.subject;
    document.getElementById('q-text').innerText = q.question;
    const optDiv = document.getElementById('q-options');
    optDiv.innerHTML = '';
    const opts = [...q.options].sort(() => Math.random() - 0.5);
    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'w-full p-4 text-left bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 font-semibold transition';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(q, opt, btn);
        optDiv.appendChild(btn);
    });
}

function checkAnswer(q, selected, btnElem) {
    const isCorrect = selected === q.answer;
    const resultDiv = document.getElementById('q-result');
    const userData = db.users[currentUser];
    
    // TRƯỜNG HỢP ĐÚNG
    if (isCorrect) {
        // Khóa các nút lại để không bấm lung tung nữa
        document.getElementById('q-options').classList.add('pointer-events-none');
        
        // Tô xanh đáp án đúng
        const allBtns = document.querySelectorAll('#q-options button');
        allBtns.forEach(b => {
            if (b.innerText === q.answer) b.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
        });

        // Cộng điểm
        const coinAdd = userData.isVip ? 20 : 10;
        const waterAdd = userData.isVip ? 15 : 5;
        userData.coins += coinAdd;
        userData.water += waterAdd;
        saveDB();
        updateStats();

        // Hiện thông báo chúc mừng
        resultDiv.className = 'bg-green-100 text-green-800 p-4 rounded-lg border-l-4 border-green-500';
        resultDiv.innerHTML = `<strong>🎉 Chính xác!</strong><br>${q.explanation}<br><span class="text-sm">+${coinAdd} xu, +${waterAdd} nước</span>`;
        showToast(`Đúng rồi! +${coinAdd} xu`, 'success');

        // HIỆN nút "Câu Tiếp Theo" (Chỉ hiện khi đúng)
        document.getElementById('next-btn').classList.remove('hidden');
        
    } else {
        // TRƯỜNG HỢP SAI
        // Chỉ tô đỏ nút vừa bấm, KHÔNG khóa các nút khác để chọn lại
        btnElem.classList.add('bg-red-100', 'border-red-500', 'text-red-800', 'opacity-50');
        
        // Thông báo sai
        resultDiv.className = 'bg-red-100 text-red-800 p-4 rounded-lg border-l-4 border-red-500';
        resultDiv.innerHTML = `<strong>😢 Sai rồi!</strong><br>Bé hãy suy nghĩ và chọn lại nhé!`;
        showToast('Chưa đúng, thử lại nào!', 'error');

        // ẨN nút "Câu Tiếp Theo" (Bắt buộc phải chọn đúng mới được đi tiếp)
        document.getElementById('next-btn').classList.add('hidden');
    }

    // Hiện khung kết quả
    resultDiv.classList.remove('hidden');
}

function nextQuestion() {
    const randomQ = currentQuizList[Math.floor(Math.random() * currentQuizList.length)];
    renderQuestion(randomQ);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-content-${tabName}`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`nav-${tabName}`).classList.add('active');
}

// === TEACHER LOGIC ===
function initTeacherUI() {
    document.getElementById('teacher-title').innerText = currentUser === 'admin' ? "👑 Trang Quản Trị Admin" : "📚 Trang Giáo Viên";
    updateTeacherStats();
    renderTeacherQuestions();
    renderStudentList();
    renderTeacherList();
}

function updateTeacherStats() {
    document.getElementById('teacher-q-count').innerText = db.questions.length;
    document.getElementById('teacher-s-count').innerText = Object.keys(db.users).length;
}

function switchTeacherTab(tab) {
    document.querySelectorAll('.t-content').forEach(t => {
        t.classList.add('hidden');
        t.classList.remove('active');
    });
    document.getElementById(`t-tab-${tab}`).classList.remove('hidden');
    document.getElementById(`t-tab-${tab}`).classList.add('active');
    
    document.querySelectorAll('.t-tab').forEach(t => t.classList.remove('active', 'text-blue-600', 'border-b-4', 'border-blue-600'));
    const activeBtn = document.getElementById(`t-tab-${tab}-btn`);
    if (activeBtn) activeBtn.classList.add('active', 'text-blue-600', 'border-b-4', 'border-blue-600');
}

// --- QUẢN LÝ CÂU HỎI ---
document.getElementById('add-question-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const subject = document.getElementById('t-subject').value;
    const question = document.getElementById('t-question').value;
    const answer = document.getElementById('t-answer').value;
    const optionsRaw = document.getElementById('t-options').value;
    const explain = document.getElementById('t-explain').value || "Chưa có giải thích.";
    let options = [answer];
    if (optionsRaw) options = [...options, ...optionsRaw.split(',').map(s => s.trim())];
    else options.push("Sai 1", "Sai 2");
    const newQ = { id: Date.now(), subject, question, answer, options, explanation: explain };
    db.questions.push(newQ);
    saveDB();
    renderTeacherQuestions();
    updateTeacherStats();
    this.reset();
    showToast('Đã thêm câu hỏi!');
});

function renderTeacherQuestions() {
    const tbody = document.getElementById('teacher-list');
    tbody.innerHTML = '';
    db.questions.forEach((q, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="p-4 text-blue-600 font-bold">${q.subject}</td>
            <td class="p-4">${q.question}</td>
            <td class="p-4 text-green-600 font-bold hidden md:table-cell">${q.answer}</td>
            <td class="p-4"><button onclick="deleteQuestion(${index})" class="text-red-500 hover:bg-red-100 p-2 rounded"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteQuestion(index) {
    if(confirm("Xóa câu hỏi này?")) {
        db.questions.splice(index, 1);
        saveDB();
        renderTeacherQuestions();
        updateTeacherStats();
    }
}

// --- QUẢN LÝ HỌC SINH ---
document.getElementById('add-student-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const u = document.getElementById('s-username').value.trim().toLowerCase();
    const p = document.getElementById('s-password').value.trim();
    const ph = document.getElementById('s-phone').value.trim();
    
    if (db.users[u]) {
        showToast('Tên đăng nhập đã tồn tại!', 'error');
        return;
    }
    db.users[u] = { pass: p, class: '2A', phone: ph, coins: 0, water: 50, gardenLevel: 1, isVip: false, plants: [0,0,0,0] };
    saveDB();
    renderStudentList();
    updateTeacherStats();
    this.reset();
    document.getElementById('s-password').value = '123';
    showToast(`Đã thêm học sinh ${u}`);
});

function renderStudentList() {
    const tbody = document.getElementById('student-list');
    tbody.innerHTML = '';
    Object.entries(db.users).forEach(([u, data]) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="p-4 font-bold">${u}</td>
            <td class="p-4">${data.class}</td>
            <td class="p-4">${data.phone || '---'}</td>
            <td class="p-4 font-mono text-gray-500">${data.pass}</td>
            <td class="p-4 text-center">
                <button onclick="openEditStudent('${u}')" class="text-blue-500 hover:bg-blue-100 p-2 rounded mr-2"><i class="fas fa-edit"></i></button>
                <button onclick="deleteStudent('${u}')" class="text-red-500 hover:bg-red-100 p-2 rounded"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteStudent(u) {
    if(confirm(`Xóa học sinh ${u}?`)) {
        delete db.users[u];
        saveDB();
        renderStudentList();
        updateTeacherStats();
    }
}

// --- TÍNH NĂNG MỚI: SỬA THÔNG TIN HỌC SINH ---
function openEditModal() {
    document.getElementById('edit-student-modal').classList.remove('hidden');
    document.getElementById('edit-student-modal').classList.add('flex');
}
function closeEditModal() {
    document.getElementById('edit-student-modal').classList.add('hidden');
    document.getElementById('edit-student-modal').classList.remove('flex');
}

function openEditStudent(username) {
    const data = db.users[username];
    if(!data) return;

    document.getElementById('edit-original-username').value = username;
    document.getElementById('edit-username').value = username;
    document.getElementById('edit-password').value = data.pass;
    document.getElementById('edit-class').value = data.class;
    document.getElementById('edit-phone').value = data.phone || '';
    
    openEditModal();
}

document.getElementById('edit-student-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const originalUser = document.getElementById('edit-original-username').value;
    
    if (db.users[originalUser]) {
        db.users[originalUser].pass = document.getElementById('edit-password').value.trim();
        db.users[originalUser].class = document.getElementById('edit-class').value.trim();
        db.users[originalUser].phone = document.getElementById('edit-phone').value.trim();
        
        saveDB();
        renderStudentList();
        closeEditModal();
        showToast('Đã cập nhật thông tin!');
    }
});

// --- TÍNH NĂNG MỚI: QUẢN LÝ GIÁO VIÊN ---
document.getElementById('add-teacher-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const u = document.getElementById('tea-username').value.trim().toLowerCase();
    const p = document.getElementById('tea-password').value.trim();
    
    if (db.admin[u]) {
        showToast('Tài khoản đã tồn tại!', 'error');
        return;
    }
    
    db.admin[u] = p;
    saveDB();
    renderTeacherList();
    this.reset();
    document.getElementById('tea-password').value = '123';
    showToast(`Đã thêm GV ${u}`);
});

function renderTeacherList() {
    const tbody = document.getElementById('teacher-account-list');
    tbody.innerHTML = '';
    Object.entries(db.admin).forEach(([u, pass]) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="p-4 font-bold text-purple-600">${u}</td>
            <td class="p-4 font-mono text-gray-500">${pass}</td>
            <td class="p-4">
                ${u !== currentUser ? `<button onclick="deleteTeacher('${u}')" class="text-red-500 hover:bg-red-100 p-2 rounded"><i class="fas fa-trash"></i></button>` : '<span class="text-xs text-gray-400">(Bạn)</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteTeacher(u) {
    if(confirm(`Xóa tài khoản giáo viên ${u}?`)) {
        delete db.admin[u];
        saveDB();
        renderTeacherList();
    }
}
