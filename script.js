 function updateStreak() {
    let today = new Date().toDateString();
    let lastDate = localStorage.getItem("lastDate");

    // Convert streak to number properly
    let streak = parseInt(localStorage.getItem("streak")) || 0;

    // 👉 FIRST TIME USER
    if (!lastDate) {
        streak = 1;
        localStorage.setItem("streak", streak);
        localStorage.setItem("lastDate", today);
    }

    else if (lastDate === today) {
        // same day → no change
    }

    else {
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate === yesterday.toDateString()) {
            streak++;
        } else {
            streak = 1;
        }

        localStorage.setItem("streak", streak);
        localStorage.setItem("lastDate", today);
    }

    document.getElementById("dayStreak").innerText = streak;
}

// Run on load
updateStreak();

function updateAccuracy(isCorrect) {
    let total = parseInt(localStorage.getItem("total")) || 0;
    let correct = parseInt(localStorage.getItem("correct")) || 0;

    total++;

    if (isCorrect) {
        correct++;
    }

    localStorage.setItem("total", total);
    localStorage.setItem("correct", correct);

    let accuracy = ((correct / total) * 100).toFixed(1);

    document.getElementById("accuracy").innerText = accuracy + "%";
}

function loadAccuracy() {
    let total = parseInt(localStorage.getItem("total")) || 0;
    let correct = parseInt(localStorage.getItem("correct")) || 0;

    let accuracy = total === 0 ? 0 : ((correct / total) * 100).toFixed(1);

    document.getElementById("accuracy").innerText = accuracy + "%";
}

window.onload = function () {
    updateStreak();
    loadAccuracy();
    loadLearnedSigns();
};

// Save learned alphabet
function addLearnedSign(sign) {
    let learned = JSON.parse(localStorage.getItem("signsLearned")) || [];

    if (!learned.includes(sign)) {
        learned.push(sign);
    }

    localStorage.setItem("signsLearned", JSON.stringify(learned));
}

function loadLearnedSigns() {
    let learned = JSON.parse(localStorage.getItem("signsLearned")) || [];
    document.getElementById("signsLearned").innerText = learned.length;
}


// When user clicks alphabet
function learnAlphabet(letter) {
    addLearnedSign(letter);
}



for (let i = 65; i <= 90; i++) {
    let letter = String.fromCharCode(i);

    let btn = document.createElement("button");
    btn.innerText = letter;

    btn.onclick = function () {
        learnAlphabet(letter);   // ✅ saves A, B, C...
    };

    container.appendChild(btn);
}
document.addEventListener("DOMContentLoaded", function() {
    const body = document.querySelector('body'),
    sidebar = body.querySelector('nav'),
    toggle = body.querySelector(".toggle");

    // 1. Sidebar Toggle Functionality
    toggle.addEventListener("click" , () =>{
        sidebar.classList.toggle("close");
    });

    // 2. Dynamic Greeting
    const greetingText = document.getElementById('greeting');
    if(greetingText) {
        const hour = new Date().getHours();
        let welcome = "Good Night";
        if (hour < 12) welcome = "Good Morning";
        else if (hour < 18) welcome = "Good Afternoon";
        else welcome = "Good Evening";
        greetingText.innerText = `${welcome}, Admin! ðŸ‘‹`;
    }
});
let running = false;

// Scroll to translator
function scrollToTranslator() {
    document.querySelector('.translator-box').scrollIntoView({
        behavior: 'smooth'
    });
}

// Start camera preview
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    document.getElementById("camera").srcObject = stream;
})
.catch(err => console.log("Camera error:", err));

// Start detection
function startDetection() {
    running = true;

    setInterval(() => {
        if (!running) return;

        fetch("http://127.0.0.1:5000/predict")
        .then(res => res.json())
        .then(data => {
            document.getElementById("word").innerText = "Word: " + data.word;
            document.getElementById("sentence").innerText = "Sentence: " + data.sentence;
        })
        .catch(err => console.log(err));

    }, 1500);
}

// Stop detection
function stopDetection() {
    running = false;
}

// Reset word
function resetWord() {
    fetch("http://127.0.0.1:5000/reset");
}
