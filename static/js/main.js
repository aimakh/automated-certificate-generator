document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    const templateFile = document.getElementById('template-file');
    const dataFile = document.getElementById('data-file');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    
    const templateImage = document.getElementById('certificate-template');
    const fieldsOverlay = document.getElementById('fields-overlay');
    const fieldList = document.getElementById('field-list');
    const addFieldBtn = document.getElementById('add-field-btn');
    const generateBtn = document.getElementById('generate-btn');

    let uploadedData = {};
    let fields = [];
    let headers = [];
    let scaleRatio = 1;

    // Function to get the current scale ratio of the displayed image
    function getScaleRatio() {
        if (!templateImage.naturalWidth || !templateImage.width) {
            return 1;
        }
        return templateImage.naturalWidth / templateImage.width;
    }

    // Step 1: Handle file upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        uploadStatus.textContent = 'Uploading files...';
        
        try {
            const response = await fetch('/upload_files', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (response.ok) {
                uploadedData = result;
                headers = result.headers;
                uploadStatus.textContent = 'Files uploaded successfully! Now configure fields.';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    templateImage.src = e.target.result;
                    templateImage.onload = () => {
                        scaleRatio = getScaleRatio(); 
                        step1.classList.add('hidden');
                        step2.classList.remove('hidden');
                    };
                };
                reader.readAsDataURL(templateFile.files[0]);

            } else {
                uploadStatus.textContent = `Error: ${result.error}`;
            }
        } catch (error) {
            uploadStatus.textContent = `An error occurred: ${error.message}`;
        }
    });

    // Step 2: Handle field configuration
    addFieldBtn.addEventListener('click', () => {
        const newField = {
            id: `field-${Date.now()}`,
            header: headers[0],
            x: 100,
            y: 100,
            fontSize: 40,
            color: '#000000',
            fontFamily: 'Arial'
        };
        fields.push(newField);
        renderFields();
    });

    fieldsOverlay.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('draggable-field')) {
            const fieldId = e.target.dataset.id;
            const field = fields.find(f => f.id === fieldId);
            
            let isDragging = true;
            let initialX = e.clientX;
            let initialY = e.clientY;

            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const dx = moveEvent.clientX - initialX;
                const dy = moveEvent.clientY - initialY;
                
                field.x += dx;
                field.y += dy;
                
                initialX = moveEvent.clientX;
                initialY = moveEvent.clientY;
                renderFields();
            };

            const onMouseUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });

    function renderFields() {
        fieldsOverlay.innerHTML = '';
        fieldList.innerHTML = '';
        
        const availableFonts = ['Arial', 'Roboto', 'Open Sans'];

        fields.forEach((field, index) => {
            const fieldElement = document.createElement('div');
            fieldElement.className = 'draggable-field';
            fieldElement.dataset.id = field.id;
            fieldElement.style.left = `${field.x}px`;
            fieldElement.style.top = `${field.y}px`;
            fieldElement.style.fontSize = `${field.fontSize}px`;
            fieldElement.style.color = field.color;
            fieldElement.textContent = `{{${field.header}}}`;
            fieldsOverlay.appendChild(fieldElement);
            
            const controlElement = document.createElement('div');
            controlElement.className = 'field-control';
            controlElement.innerHTML = `
                <h4>Field ${index + 1}</h4>
                <div class="form-group">
                    <label>Header:</label>
                    <select data-id="${field.id}" class="header-select">
                        ${headers.map(header => `<option value="${header}" ${header === field.header ? 'selected' : ''}>${header}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Font Family:</label>
                    <select data-id="${field.id}" class="font-family-select">
                        ${availableFonts.map(font => `<option value="${font}" ${font === field.fontFamily ? 'selected' : ''}>${font}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Font Size:</label>
                    <input type="number" data-id="${field.id}" class="font-size-input" value="${field.fontSize}">
                </div>
                <div class="form-group">
                    <label>Color:</label>
                    <input type="color" data-id="${field.id}" class="color-input" value="${field.color}">
                </div>
                <div class="coords">
                    <small>X: ${field.x.toFixed(0)}, Y: ${field.y.toFixed(0)}</small>
                </div>
                <button data-id="${field.id}" class="remove-field-btn">Remove</button>
            `;
            fieldList.appendChild(controlElement);
        });

        // Add event listeners for field controls
        document.querySelectorAll('.header-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const field = fields.find(f => f.id === e.target.dataset.id);
                if (field) {
                    field.header = e.target.value;
                    renderFields();
                }
            });
        });

        document.querySelectorAll('.font-family-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const field = fields.find(f => f.id === e.target.dataset.id);
                if (field) {
                    field.fontFamily = e.target.value;
                    renderFields();
                }
            });
        });

        document.querySelectorAll('.font-size-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const field = fields.find(f => f.id === e.target.dataset.id);
                if (field) {
                    field.fontSize = parseInt(e.target.value);
                    renderFields();
                }
            });
        });

        document.querySelectorAll('.color-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const field = fields.find(f => f.id === e.target.dataset.id);
                if (field) {
                    field.color = e.target.value;
                    renderFields();
                }
            });
        });

        document.querySelectorAll('.remove-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                fields = fields.filter(f => f.id !== e.target.dataset.id);
                renderFields();
            });
        });
    }

    // Step 3: Generate Certificates
    generateBtn.addEventListener('click', async () => {
        if (fields.length === 0) {
            alert('Please add at least one field to generate certificates.');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        try {
            const scaledFields = fields.map(f => {
                const ratio = getScaleRatio();
                return {
                    ...f,
                    x: f.x * ratio,
                    y: f.y * ratio,
                    fontSize: f.fontSize * ratio
                };
            });
            
            const response = await fetch('/generate_certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templatePath: uploadedData.template_path,
                    dataPath: uploadedData.data_path,
                    fields: scaledFields
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'certificates.zip';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                alert('Certificates generated and download started!');
            } else {
                const errorResult = await response.json();
                alert(`Error generating certificates: ${errorResult.error}`);
            }
        } catch (error) {
            alert(`An error occurred: ${error.message}`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Certificates';
        }
    });
});