from flask import Flask, render_template, request, jsonify
import cv2
import os
import random
from PIL import Image

app = Flask(__name__)

UPLOAD_FOLDER = 'static/uploads'
PIECE_FOLDER = 'static/pieces'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PIECE_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# FACE DETECTION
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    'haarcascade_frontalface_default.xml'
)

# PUZZLE SETTINGS
ROWS = 3
COLS = 5


@app.route('/')
def home():

    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_image():

    if 'image' not in request.files:

        return jsonify({
            'error': 'No image uploaded'
        })

    file = request.files['image']

    image_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    file.save(image_path)

    img = cv2.imread(image_path)

    gray = cv2.cvtColor(
        img,
        cv2.COLOR_BGR2GRAY
    )

    faces = face_cascade.detectMultiScale(
        gray,
        1.1,
        5
    )

    # DRAW FACE BOX
    for (x, y, w, h) in faces:

        cv2.rectangle(
            img,
            (x, y),
            (x+w, y+h),
            (0,255,0),
            3
        )

    detected_path = os.path.join(
        UPLOAD_FOLDER,
        'detected.jpg'
    )

    cv2.imwrite(detected_path, img)

    pieces = generate_pieces(detected_path)

    return jsonify({
        'pieces': pieces
    })


# GENERATE PUZZLE
def generate_pieces(image_path):

    image = Image.open(image_path)

    width, height = image.size

    piece_width = width // COLS
    piece_height = height // ROWS

    pieces = []

    # CLEAR OLD PIECES
    for file in os.listdir(PIECE_FOLDER):

        os.remove(
            os.path.join(PIECE_FOLDER, file)
        )

    count = 0

    for row in range(ROWS):

        for col in range(COLS):

            left = col * piece_width
            upper = row * piece_height
            right = left + piece_width
            lower = upper + piece_height

            piece = image.crop(
                (left, upper, right, lower)
            )

            filename = f'piece_{count}.jpg'

            piece_path = os.path.join(
                PIECE_FOLDER,
                filename
            )

            piece.save(piece_path)

            pieces.append({
                'id': count,
                'src': '/static/pieces/' + filename
            })

            count += 1

    random.shuffle(pieces)

    return pieces


if __name__ == '__main__':

    app.run(debug=True)