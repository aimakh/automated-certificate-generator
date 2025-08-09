# 🏆 Automated Certificate Generator

A full-stack web application for creating and downloading personalized certificates in bulk.  
Built with **HTML/CSS/JavaScript** for the frontend and **Flask (Python)** for the backend, with deployment on **PythonAnywhere/Deta Space**.

---

## 📌 Features
- **Certificate Template Upload:** Supports PNG/JPG formats.
- **Excel Upload:** Import participant details from `.xlsx` files.
- **Interactive Coordinate Mapping:** Select text positions directly in the browser using a click-based UI.
- **Font Customization:** Change font style, size, and color.
- **Batch Certificate Generation:** Create certificates for all participants in one go.
- **Download as ZIP:** Export all generated certificates in a single ZIP file.
- **Live Preview:** Preview certificate layout before final generation.
- **Error Handling:** Validates uploaded files and handles missing data gracefully.

---

## 🛠 Tools & Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript  
- **Backend:** Flask (Python)  
- **Web Server Utility:** Werkzeug (request handling, routing, file uploads)  
- **Excel Handling:** Pandas, OpenPyXL  
- **Image Processing & PDF Generation:** Pillow (PIL)  
- **ZIP Packaging:** Python `zipfile` module  
- **Deployment:** PythonAnywhere / Deta Space  
- **Version Control:** Git, GitHub  

---

## 📚 Learnings from This Project
- Building a **full-stack web application** from scratch.
- Using **JavaScript** for interactive image coordinate selection.
- Working with **Excel data processing** using Pandas & OpenPyXL.
- Implementing **image text placement** and PDF generation with Pillow.
- Packaging multiple files into a **ZIP archive** for downloads.
- Understanding how **Werkzeug** powers Flask for HTTP requests and routing.
- **Deploying via PythonAnywhere/Deta Space** to make the project live —  
  _most people know how to code, but making a project accessible online is equally important._

---

## 🚀 How to Run Locally
1. **Clone the repository**  
   ```bash
   git clone https://github.com/aimakh/automated-certificate-generator.git
   cd automated-certificate-generator

Install Dependencies
   git clone https://github.com/your-username/automated-certificate-generator.git
   cd automated-certificate-generator
