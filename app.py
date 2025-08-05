import os
import pandas as pd
from flask import Flask, request, jsonify, send_file, render_template
from werkzeug.utils import secure_filename
from PIL import Image, ImageDraw, ImageFont
import zipfile
import io
import base64

# Initialize Flask application
app = Flask(__name__)

# --- FIX APPLIED HERE ---
# Use an absolute path to the fonts directory to prevent pathing issues
basedir = os.path.abspath(os.path.dirname(__file__))
FONTS_DIR = os.path.join(basedir, 'fonts')

# Configuration for file uploads
UPLOAD_FOLDER = 'uploads'
GENERATED_FOLDER = 'generated_certificates'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'csv', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload, generated, and fonts folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GENERATED_FOLDER, exist_ok=True)
os.makedirs(FONTS_DIR, exist_ok=True)

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Renders the main page with the certificate generation UI."""
    return render_template('index.html')

@app.route('/upload_files', methods=['POST'])
def upload_files():
    if 'template' not in request.files or 'data' not in request.files:
        return jsonify({'error': 'Missing template or data file'}), 400

    template_file = request.files['template']
    data_file = request.files['data']

    if template_file.filename == '' or data_file.filename == '':
        return jsonify({'error': 'No selected file for template or data'}), 400

    if not (template_file and allowed_file(template_file.filename) and data_file and allowed_file(data_file.filename)):
        return jsonify({'error': 'Invalid file type'}), 400

    try:
        data_file.seek(0)
        if data_file.filename.endswith('.csv'):
            df = pd.read_csv(data_file)
        else:
            df = pd.read_excel(data_file)

        headers = df.columns.tolist()

        template_filename = secure_filename(template_file.filename)
        data_filename = secure_filename(data_file.filename)

        template_path = os.path.join(app.config['UPLOAD_FOLDER'], template_filename)
        data_path = os.path.join(app.config['UPLOAD_FOLDER'], data_filename)

        template_file.seek(0)
        template_file.save(template_path)
        data_file.seek(0)
        data_file.save(data_path)

        return jsonify({
            'message': 'Files uploaded successfully',
            'template_path': template_path,
            'data_path': data_path,
            'headers': headers,
        }), 200

    except Exception as e:
        return jsonify({'error': f'Could not process files: {e}'}), 500

@app.route('/generate_certificates', methods=['POST'])
def generate_certificates():
    data = request.json

    template_path = data.get('templatePath')
    data_path = data.get('dataPath')
    fields = data.get('fields')

    if not all([template_path, data_path, fields]):
        return jsonify({'error': 'Missing required data for generation'}), 400

    if not os.path.exists(template_path):
        return jsonify({'error': f'Template file not found at {template_path}'}), 400

    if not os.path.exists(data_path):
        return jsonify({'error': f'Data file not found at {data_path}'}), 400

    try:
        if data_path.endswith('.csv'):
            df = pd.read_csv(data_path)
        else:
            df = pd.read_excel(data_path)

        required_headers = [field['header'] for field in fields]
        if not required_headers or df[required_headers].isnull().values.any():
            return jsonify({'error': 'Data validation failed: Null values found in a required field.'}), 400

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for index, row in df.iterrows():
                try:
                    img = Image.open(template_path).convert("RGB")
                    draw = ImageDraw.Draw(img)

                    for field in fields:
                        header = field['header']
                        
                        x = field.get('x')
                        y = field.get('y')
                        
                        if x is None or y is None:
                            print(f"Skipping field '{header}' due to missing x or y coordinates.")
                            continue

                        font_size = int(field.get('fontSize', 100))

                        font_color = field.get('color', '#000000')
                        font_family = field.get('fontFamily', 'Arial')

                        text_to_draw = str(row.get(header, ''))
                        if not text_to_draw:
                            continue

                        try:
                            font_mapping = {
                                'Arial': 'arial.ttf',
                                'Roboto': 'Roboto Regular.ttf',
                                'Open Sans': 'OpenSans-Italic-VariableFont_wdth,wght.ttf'
                            }
                            font_filename = font_mapping.get(font_family, 'arial.ttf')
                            
                            # --- FIX APPLIED HERE ---
                            # Use the absolute path to the fonts directory
                            font_path = os.path.join(FONTS_DIR, font_filename)
                            print("Looking for font here:", font_path)


                            if not os.path.exists(font_path):
                                print(f"⚠️ Font file not found: {font_path}. Using default font.")
                                font = ImageFont.load_default()
                            else:
                                font = ImageFont.truetype(font_path, font_size)
                        except Exception as e:
                            print(f"Font loading error: {e}. Using default font.")
                            font = ImageFont.load_default()

                        text_width = draw.textlength(text_to_draw, font=font)
                        centered_x = x - (text_width / 2)
                        draw.text((x, y), text_to_draw, font=font, fill=font_color)


                        #draw.text((centered_x, y), text_to_draw, font=font, fill=font_color)

                    pdf_buffer = io.BytesIO()
                    img.save(pdf_buffer, format='PDF', resolution=100.0, save_all=True)

                    winner_name = secure_filename(str(row.get('Name', f"winner_{index + 1}")))
                    output_filename = f"certificate_{winner_name}.pdf"

                    pdf_buffer.seek(0)
                    zip_file.writestr(output_filename, pdf_buffer.getvalue())

                except Exception as e:
                    print(f"Error generating certificate for row {index + 1}: {e}")
                    continue

        zip_buffer.seek(0)

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name='certificates.zip'
        )

    except Exception as e:
        return jsonify({'error': f'A fatal error occurred during certificate generation: {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True)