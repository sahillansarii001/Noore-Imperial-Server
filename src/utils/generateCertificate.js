export const generateCertificateHTML = (studentName, courseName, completionDate, certificateId) => {
  const dateString = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Basic HTML template for the certificate
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Georgia', serif; text-align: center; }
            .certificate { border: 10px solid #222; padding: 50px; margin: 20px; position: relative; }
            h1 { font-size: 50px; color: #222; margin-bottom: 20px; }
            .student-name { font-size: 40px; font-weight: bold; color: #b8860b; margin: 20px 0; }
            .course-name { font-size: 30px; font-style: italic; margin: 20px 0; }
            .footer { margin-top: 50px; font-size: 18px; color: #555; }
            .qr-code { position: absolute; bottom: 30px; right: 30px; width: 100px; height: 100px; }
        </style>
    </head>
    <body>
        <div class="certificate">
            <h1>Certificate of Completion</h1>
            <p>This is to certify that</p>
            <div class="student-name">${studentName}</div>
            <p>has successfully completed the course</p>
            <div class="course-name">${courseName}</div>
            <div class="footer">
                <p>Date: ${dateString}</p>
                <p>Certificate ID: ${certificateId}</p>
            </div>
            <!-- In a real scenario, the QR code image tag would go here -->
            <div class="qr-code">QR CODE</div>
        </div>
    </body>
    </html>
  `;

  return html;
};
