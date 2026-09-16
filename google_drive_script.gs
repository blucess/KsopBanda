/**
 * GOOGLE APPS SCRIPT: ARSIP SURAT OTOMATIS KSOP KELAS IV BANDA NAIRA
 * 
 * Skrip ini menerima file PDF surat persetujuan dari aplikasi web dan
 * menyimpannya secara rapi ke Google Drive dengan struktur folder bertingkat:
 * [Folder Utama] -> [Folder Tahun] -> [Folder Bulan] -> [File PDF]
 * 
 * PANDUAN DEPLOY SEBAGAI WEB APP:
 * 1. Buka https://script.google.com dengan akun Google/Gmail kantor Anda.
 * 2. Buat proyek baru: Klik "+ Project Baru".
 * 3. Hapus kode bawaan, lalu paste seluruh isi kode ini ke editor.
 * 4. Klik tombol "Deploy" (di pojok kanan atas) -> Pilih "New deployment".
 * 5. Klik ikon gerigi (Select type) -> Pilih "Web app".
 * 6. Isi konfigurasi:
 *    - Description: "Arsip Surat KSOP"
 *    - Execute as: "Me" (akun Google Anda)
 *    - Who has access: "Anyone" (Siapa saja - agar aplikasi web bisa kirim data tanpa login)
 * 7. Klik "Deploy".
 * 8. Berikan izin akses (Authorize Access) -> Pilih akun Anda -> Advanced -> Go to ... (unsafe) -> Allow.
 * 9. Salin "Web App URL" (akhiran /exec) dan tempelkan ke Pengaturan Google Drive di aplikasi web.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "Data kiriman kosong atau tidak valid."
      });
    }

    var requestData = JSON.parse(e.postData.contents);
    var base64Data = requestData.fileData;
    var fileName = requestData.fileName || ("Surat_Persetujuan_" + new Date().getTime() + ".pdf");
    var yearName = String(requestData.year || new Date().getFullYear());
    var monthName = String(requestData.month || ("Bulan " + (new Date().getMonth() + 1)));
    var rootFolderName = requestData.rootFolder || "Arsip Surat KSOP Banda Naira";

    if (!base64Data) {
      return createJsonResponse({
        status: "error",
        message: "File PDF base64 tidak ditemukan."
      });
    }

    // Bersihkan prefix data uri jika ada (ambil data murni base64 setelah koma)
    var cleanBase64 = base64Data;
    if (cleanBase64.indexOf(",") > -1) {
      cleanBase64 = cleanBase64.split(",")[1];
    }
    cleanBase64 = cleanBase64.replace(/[\s\r\n]/g, "");

    var decodedBlob;
    try {
      decodedBlob = Utilities.base64Decode(cleanBase64);
    } catch (eDec) {
      decodedBlob = Utilities.base64DecodeWebSafe(cleanBase64);
    }
    var pdfBlob = Utilities.newBlob(decodedBlob, "application/pdf", fileName);

    // 1. Dapatkan atau buat Folder Utama di root Google Drive
    var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);

    // 2. Dapatkan atau buat Folder Tahun (misal: "2026")
    var yearFolder = getOrCreateFolder(rootFolder, yearName);

    // 3. Dapatkan atau buat Folder Bulan (misal: "09 - September")
    var monthFolder = getOrCreateFolder(yearFolder, monthName);

    // 4. Buat dan simpan file PDF ke dalam Folder Bulan
    var savedFile = monthFolder.createFile(pdfBlob);

    return createJsonResponse({
      status: "success",
      message: "File berhasil diarsipkan ke Google Drive!",
      fileName: fileName,
      fileUrl: savedFile.getUrl(),
      fileId: savedFile.getId(),
      folderPath: rootFolderName + " > " + yearName + " > " + monthName,
      year: yearName,
      month: monthName
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan pada server Google Script: " + err.toString()
    });
  }
}

// Endpoint GET untuk uji koneksi dari aplikasi web
function doGet(e) {
  return createJsonResponse({
    status: "ok",
    message: "Layanan Google Apps Script KSOP Banda Naira aktif dan siap digunakan!",
    timestamp: new Date().toISOString()
  });
}

// Fungsi bantu mencari atau membuat folder jika belum ada
function getOrCreateFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}

// Format output JSON dengan Content-Type yang benar
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
