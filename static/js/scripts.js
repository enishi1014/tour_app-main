const loggedInUser = "Guest";

// 背景スライドショー用画像リストを追加しました。
const backgroundImages = [
    'static/images/slide1.jpg',
    'static/images/slide2.jpg',
    'static/images/slide3.jpg',
    'static/images/slide4.jpg',
    'static/images/slide5.jpg',
    'static/images/slide6.jpg',
    'static/images/slide7.jpg'
];

let currentSlide = 0;

// 背景画像を切り替えるための関数
function changeBackground() {
    document.body.style.backgroundImage = `url(${backgroundImages[currentSlide]})`;
    currentSlide = (currentSlide + 1) % backgroundImages.length;
}

// 5秒ごとに背景を切り替えるためのタイマー
setInterval(changeBackground, 5000);

function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

document.getElementById("hamburger-menu").addEventListener("click", toggleMenu);

function postComment() {
    const comment = document.getElementById('comment').value;
    if (comment) {
        const commentList = document.getElementById('comment-list');
        const newComment = document.createElement('div');
        newComment.classList.add('comment');
        newComment.innerHTML = `<div class="username">${loggedInUser}</div><div>${comment}</div>`;
        commentList.appendChild(newComment);
        document.getElementById('comment').value = '';
    } else {
        alert('コメントを入力してください');
    }
}

const stampsCollected = [true, true, false, false, false, false];

stampsCollected.forEach((isCollected, index) => {
    if (isCollected) {
        document.getElementById(`stamp${index + 1}`).classList.add('active');
    }
});
