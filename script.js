let selectedPiece = null;

let moveCount = 0;

let seconds = 0;

let timerInterval;

let currentPieces = [];

let cameraStream = null;


// PUZZLE SETTINGS

const rows = 3;

const cols = 5;

const totalPieces = rows * cols;


// START CAMERA

const video =
    document.getElementById('video');

navigator.mediaDevices.getUserMedia({

    video: true

})

.then(stream => {

    cameraStream = stream;

    video.srcObject = stream;
});


// CAPTURE IMAGE

function captureImage() {

    const canvas =
        document.getElementById('canvas');

    const context =
        canvas.getContext('2d');

    context.drawImage(
        video,
        0,
        0,
        320,
        240
    );

    // TURN OFF CAMERA

    if (cameraStream) {

        cameraStream.getTracks().forEach(track => {

            track.stop();
        });
    }

    video.style.display = "none";

    canvas.toBlob(async function(blob) {

        const formData = new FormData();

        formData.append(
            'image',
            blob,
            'capture.jpg'
        );

        const response =
            await fetch('/upload', {

            method: 'POST',

            body: formData
        });

        const data =
            await response.json();

        currentPieces =
            data.pieces;

        createPuzzle(data.pieces);

        startTimer();

    }, 'image/jpeg');
}


// CREATE PUZZLE

function createPuzzle(pieces) {

    moveCount = 0;

    document.getElementById('moves')
        .innerText = moveCount;

    document.getElementById('message')
        .innerText = '';

    const leftContainer =
        document.getElementById('pieces-container');

    const rightContainer =
        document.getElementById('board-container');

    leftContainer.innerHTML = '';

    rightContainer.innerHTML = '';

    // DYNAMIC GRID

    leftContainer.style.gridTemplateColumns =
        `repeat(${cols}, 80px)`;

    rightContainer.style.gridTemplateColumns =
        `repeat(${cols}, 80px)`;

    // LEFT SIDE

    pieces.forEach(piece => {

        const img =
            document.createElement('img');

        img.src = piece.src;

        img.classList.add('piece');

        img.draggable = true;

        img.dataset.id = piece.id;

        img.addEventListener(
            'dragstart',
            dragStart
        );

        leftContainer.appendChild(img);
    });

    // RIGHT SIDE

    for (let i = 0; i < totalPieces; i++) {

        const cell =
            document.createElement('div');

        cell.classList.add('board-cell');

        cell.dataset.index = i;

        cell.addEventListener(
            'dragover',
            dragOver
        );

        cell.addEventListener(
            'drop',
            dropPiece
        );

        rightContainer.appendChild(cell);
    }
}


function dragStart() {

    selectedPiece = this;
}


function dragOver(e) {

    e.preventDefault();
}


function dropPiece() {

    if (this.children.length > 0) {

        return;
    }

    const pieceClone =
        selectedPiece.cloneNode(true);

    pieceClone.draggable = false;

    this.appendChild(pieceClone);

    moveCount++;

    document.getElementById('moves')
        .innerText = moveCount;

    const pieceId =
        parseInt(pieceClone.dataset.id);

    const boardIndex =
        parseInt(this.dataset.index);

    if (pieceId === boardIndex) {

        this.classList.add('correct');

    } else {

        this.classList.add('wrong');
    }

    checkPuzzleSolved();
}


function checkPuzzleSolved() {

    const cells =
        document.querySelectorAll('.board-cell');

    let solved = true;

    cells.forEach(cell => {

        if (cell.children.length === 0) {

            solved = false;

            return;
        }

        const pieceId =
            parseInt(
                cell.children[0].dataset.id
            );

        const boardIndex =
            parseInt(cell.dataset.index);

        if (pieceId !== boardIndex) {

            solved = false;
        }
    });

    if (solved) {

        clearInterval(timerInterval);

        document.getElementById('message')
            .innerText =
            '🎉 Puzzle Solved!';
    }
}


// RESET

function resetPuzzle() {

    createPuzzle(currentPieces);

    seconds = 0;

    document.getElementById('timer')
        .innerText = seconds;

    startTimer();
}


// TIMER

function startTimer() {

    clearInterval(timerInterval);

    seconds = 0;

    document.getElementById('timer')
        .innerText = seconds;

    timerInterval = setInterval(() => {

        seconds++;

        document.getElementById('timer')
            .innerText = seconds;

    }, 1000);
}