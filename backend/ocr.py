import os
import pytesseract
import fitz
from PIL import Image


TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text(file_path):
    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        return extract_pdf(file_path)

    image = Image.open(file_path)

    try:
        return pytesseract.image_to_string(image)
    finally:
        image.close()


def extract_pdf(file_path):
    document = fitz.open(file_path)
    text = ""

    try:
        # First try direct PDF text extraction
        for page in document:
            page_text = page.get_text("text")
            text += page_text + "\n"

        # If PDF has no readable text, use OCR
        if len(text.strip()) < 30:
            text = ""

            for page in document:
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))

                image = Image.frombytes(
                    "RGB",
                    [pix.width, pix.height],
                    pix.samples
                )

                text += pytesseract.image_to_string(image)
                text += "\n"

    finally:
        document.close()

    return text