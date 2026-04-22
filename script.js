let participants = [];
let angle = 0;

// ========== СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ ==========
function saveData() {
    const data = {
        participants: participants,
        title: document.getElementById('titleText').innerText,
        angle: angle
    };
    localStorage.setItem('wheelData', JSON.stringify(data));
    console.log('Данные сохранены', data);
}

function loadData() {
    const saved = localStorage.getItem('wheelData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            participants = data.participants || [];
            if (data.title) {
                document.getElementById('titleText').innerText = data.title;
            }
            if (data.angle !== undefined) {
                angle = data.angle;
            }
            console.log('Данные загружены', participants.length + ' участников');
        } catch (e) {
            console.log('Ошибка загрузки:', e);
        }
    }
    render();
    draw();
}

function autoSave() {
    saveData();
}

function trimWheelText(text, max = 12) {
    return text.length > max ? text.slice(0, max) + '…' : text;
}

function openSettings() {
    settingsPanel.classList.add('open');
    mainCard.classList.add('shifted');
}

function closeSettings() {
    settingsPanel.classList.remove('open');
    mainCard.classList.remove('shifted');
}

function focusTitle() {
    document.getElementById('titleText').focus();
}

function getRandomColor() {
    const colors = [
        '#110000',    // Кроваво-красный
        '#220000',
        '#330001',
        '#440001',
        '#550001',
        '#660001',
        '#770002',
        '#880002',
        '#990002',
        '#aa0002',
        '#bb0002',
        '#ff2225',
        '#ff3336',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function addParticipant() {
    const input = document.getElementById('nameInput');
    const name = input.value.trim();
    if (!name) return;

    participants.push({
        name: name,
        color: getRandomColor(),
        comment: ""
    });

    input.value = '';
    render();
    draw();
    autoSave();  // ✅ ДОБАВЛЕНО
}

function changeComment(index, value) {
    participants[index].comment = value;
    autoSave();  // ✅ ДОБАВЛЕНО
}

document.getElementById('nameInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') addParticipant();
});

function removeParticipant(i) {
    participants.splice(i, 1);
    render();
    draw();
    autoSave();  // ✅ ДОБАВЛЕНО
}

function changeColor(index, color) {
    participants[index].color = color;
    render();
    draw();
    autoSave();  // ✅ ДОБАВЛЕНО
}

function render() {
    const list = document.getElementById('list');
    list.innerHTML = '';

    let percent = participants.length
        ? (100 / participants.length).toFixed(1)
        : 0;

    participants.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'item';

        div.innerHTML = `
  <div class="left">
    <div class="name" onclick="toggleText(this)">
      #${i + 1} ${escapeHtml(p.name)}
    </div>

    <div class="percent">${percent}%</div>

    <input 
      type="text"
      placeholder="Комментарий..."
      value="${escapeHtml(p.comment || '')}"
      oninput="changeComment(${i}, this.value)"
      style="
        margin-top:4px;
        width:100%;
        border:none;
        background:#1a1a1a;
        color:#fff;
        border-radius:6px;
        padding:4px 6px;
        font-size:12px;
    "
    >
  </div>

  <div style="display:flex; gap:6px; align-items:center;">

  <button onclick="this.nextElementSibling.click()"
    style="
      width:28px;
      height:28px;
      border:none;
      border-radius:8px;
      cursor:pointer;
      background:${p.color};
      color:white;
      font-size:14px;
    "
  >
    🌢
  </button>

  <input 
    id="color-${i}"
    type="color" 
    value="${p.color}" 
    onchange="changeColor(${i}, this.value)"
    style="
      position:absolute;
      opacity:0;
      pointer-events:none;
    "
  >

  <button class="remove" onclick="removeParticipant(${i})">×</button>

</div>
`;
        list.appendChild(div);
    });
}

// Защита от XSS-атак
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function draw() {
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 300, 300);

    const count = participants.length || 1;
    const step = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.moveTo(150, 150);
        ctx.arc(150, 150, 150, i * step + angle, (i + 1) * step + angle);
        ctx.fillStyle = participants[i]?.color || '#131313';
        ctx.fill();

        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate(i * step + step / 2 + angle);
        ctx.fillStyle = '#fff';
        ctx.font = participants.length > 6 ? '10px Arial' : '12px Arial';
        ctx.textAlign = 'center';
        const text = participants[i]?.name || '';
        const shortText = trimWheelText(text);

        ctx.fillText(shortText, 100, 5);
        ctx.restore();
    }
}

function spin() {
    if (!participants.length) return;

    let spins = Math.random() * 5 + 5;
    let target = angle + spins * 2 * Math.PI;

    let start = angle;
    let duration = 2000;
    let startTime = null;

    function animate(time) {
        if (!startTime) startTime = time;
        let progress = (time - startTime) / duration;

        if (progress < 1) {
            angle = start + (target - start) * (1 - Math.pow(1 - progress, 3));
            draw();
            requestAnimationFrame(animate);
        } else {
            angle = target;
            draw();
            pickWinner();
        }
    }

    requestAnimationFrame(animate);
}

function pickWinner() {
    const count = participants.length;
    const step = (2 * Math.PI) / count;

    let pointerAngle = (angle + Math.PI / 2) % (2 * Math.PI);
    let index = Math.floor((2 * Math.PI - pointerAngle) / step) % count;

    document.getElementById('winner').textContent =
        'Победитель: #' + (index + 1) + ' ' + participants[index].name;
}

function toggleAuthor() {
    const popup = document.getElementById('authorPopup');
    const btn = document.querySelector('.author-btn');

    popup.classList.toggle('open');
    btn.classList.toggle('active');
}

function toggleText(element) {
    element.classList.toggle('expanded');
}

// ========== ЭКСПОРТ В CSV (С ПОДДЕРЖКОЙ КИРИЛЛИЦЫ) ==========
function exportParticipantsToCSV() {
    if (participants.length === 0) {
        alert('Нет участников для экспорта');
        return;
    }

    // Заголовки CSV
    let csvContent = "№,Имя,Цвет,Комментарий\n";

    // Добавляем каждого участника с экранированием кавычек
    participants.forEach((p, index) => {
        const safeName = p.name.replace(/"/g, '""');
        const safeComment = (p.comment || '').replace(/"/g, '""');
        const row = `${index + 1},"${safeName}","${p.color}","${safeComment}"`;
        csvContent += row + "\n";
    });

    // Добавляем BOM (Byte Order Mark) для правильного отображения кириллицы в Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'participants.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ========== ИМПОРТ ИЗ ФАЙЛА ==========
document.getElementById('importFile').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        const lines = content.split(/\r?\n/);

        let newParticipants = [];
        let previewText = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;

            if (i === 0 && (line.includes('Имя') || line.includes('№'))) continue;

            let parts = line.split(',');
            if (parts.length >= 1) {
                let name = parts[0].replace(/^"|"$/g, '').trim();
                let color = parts[1] ? parts[1].replace(/^"|"$/g, '').trim() : getRandomColor();
                let comment = parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : '';

                if (parts[0].match(/^\d+$/) && parts[1]) {
                    name = parts[1].replace(/^"|"$/g, '').trim();
                    comment = parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : '';
                }

                if (name) {
                    newParticipants.push({
                        name: name,
                        color: color,
                        comment: comment
                    });
                    previewText += `➕ ${name}\n`;
                }
            }
        }

        if (newParticipants.length > 0) {
            participants.push(...newParticipants);
            render();
            draw();
            autoSave();

            const previewDiv = document.getElementById('importPreview');
            previewDiv.innerHTML = `✅ Импортировано: ${newParticipants.length} участников<br>${previewText.replace(/\n/g, '<br>')}`;
            setTimeout(() => {
                previewDiv.innerHTML = '';
            }, 3000);
        } else {
            alert('Не удалось найти участников в файле');
        }
    };

    reader.readAsText(file, 'UTF-8');
});

// ========== ФУНКЦИЯ УДАЛЕНИЯ ВСЕХ ДАННЫХ ==========
function clearAllData() {
    if (confirm('Вы уверены, что хотите всё сбросить?')) {
        participants = [];
        angle = 0;
        document.getElementById('titleText').innerText = 'Колесо';
        document.getElementById('winner').innerHTML = '';
        render();
        draw();
        localStorage.removeItem('wheelData');  // ✅ ДОБАВЛЕНО (очищает сохранённые данные)
    }
}

// ========== ЗАГРУЖАЕМ ДАННЫЕ ПРИ СТАРТЕ ==========
loadData();