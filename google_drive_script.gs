/**
 * GOOGLE APPS SCRIPT: ARSIP SURAT & DATABASE RIWAYAT ONLINE KSOP KELAS IV BANDA NAIRA
 * 
 * Fitur:
 * 1. Menerima file PDF surat dan menyimpannya otomatis ke Google Drive per Tahun & Bulan.
 * 2. Mencatat setiap surat ke Google Spreadsheet otomatis sebagai Buku Register / Database Online.
 * 3. Menyediakan sinkronisasi riwayat surat secara real-time ke semua perangkat (PC, Laptop, HP).
 * 
 * PANDUAN PEMBARUAN SKRIP DI script.google.com:
 * 1. Buka proyek skrip Anda di https://script.google.com.
 * 2. Hapus seluruh kode lama, lalu tempelkan (paste) seluruh kode ini.
 * 3. Klik ikon Disket (Save).
 * 4. Klik tombol biru "Deploy" (di kanan atas) -> Pilih "Manage deployments".
 * 5. Klik ikon Pensil (Edit) pada deployment aktif.
 * 6. Pada kolom "Version", pilih "New version".
 * 7. Pastikan "Who has access" tetap terpilih "Anyone" (Siapa saja).
 * 8. Klik "Deploy".
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
    var action = requestData.action || "upload_pdf";
    var rootFolderName = requestData.rootFolder || "Arsip Surat KSOP Banda Naira";

    // AKSI 1: Simpan riwayat ke Google Spreadsheet tanpa upload PDF
    if (action === "save_history") {
      var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);
      var recordId = logToSpreadsheet(rootFolder, requestData, requestData.fileUrl || "-");
      return createJsonResponse({
        status: "success",
        message: "Data surat berhasil dicatat ke Database Riwayat Cloud (Google Sheets)!",
        id: recordId
      });
    }

    // AKSI 2: Hapus riwayat dari Google Spreadsheet
    if (action === "delete_history") {
      var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);
      var isDeleted = deleteFromSpreadsheet(rootFolder, requestData.id);
      return createJsonResponse({
        status: isDeleted ? "success" : "not_found",
        message: isDeleted ? "Riwayat berhasil dihapus dari Cloud." : "Data tidak ditemukan."
      });
    }

    // AKSI 3: Upload PDF ke Google Drive + Catat otomatis ke Database Spreadsheet
    var base64Data = requestData.fileData;
    var fileName = requestData.fileName || ("Surat_Persetujuan_" + new Date().getTime() + ".pdf");
    var yearName = String(requestData.year || new Date().getFullYear());
    var monthName = String(requestData.month || ("Bulan " + (new Date().getMonth() + 1)));

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

    // Hapus file lama dengan nama yang sama di folder bulan & tahun ini
    var existingFiles = monthFolder.getFilesByName(fileName);
    while (existingFiles.hasNext()) {
      var oldFile = existingFiles.next();
      try {
        oldFile.setTrashed(true); // Pindahkan file lama ke sampah Google Drive
      } catch (eTrash) {
        monthFolder.removeFile(oldFile);
      }
    }

    // 4. Buat dan simpan file PDF baru ke dalam Folder Bulan
    var savedFile = monthFolder.createFile(pdfBlob);
    var fileUrl = savedFile.getUrl();

    // 5. Otomatis catat ke Database Google Spreadsheet Riwayat Surat
    var logId = logToSpreadsheet(rootFolder, requestData, fileUrl);

    return createJsonResponse({
      status: "success",
      message: "File berhasil diarsipkan ke Google Drive & dicatat ke Database Riwayat!",
      fileName: fileName,
      fileUrl: fileUrl,
      fileId: savedFile.getId(),
      folderPath: rootFolderName + " > " + yearName + " > " + monthName,
      year: yearName,
      month: monthName,
      historyId: logId
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan pada server Google Script: " + err.toString()
    });
  }
}

// Endpoint GET: Uji koneksi atau ambil daftar riwayat dari Spreadsheet
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";
    var rootFolderName = (e && e.parameter && e.parameter.rootFolder) ? e.parameter.rootFolder : "Arsip Surat KSOP Banda Naira";

    if (action === "get_history") {
      var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), rootFolderName);
      var historyData = getHistoryFromSpreadsheet(rootFolder, 60);
      return createJsonResponse({
        status: "success",
        data: historyData
      });
    }

    // Default: respon uji koneksi
    return createJsonResponse({
      status: "ok",
      message: "Layanan Google Apps Script & Database Riwayat KSOP Banda Naira aktif dan siap digunakan!",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan pada server Google Script: " + err.toString()
    });
  }
}

// Dapatkan atau buat Google Spreadsheet Database di dalam folder arsip
function getOrCreateHistorySheet(rootFolder) {
  var fileName = "Database Riwayat Surat KSOP Banda Naira";
  var files = rootFolder.getFilesByName(fileName);
  var spreadsheet;

  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.openById(files.next().getId());
  } else {
    // Cek apakah file sudah pernah ada di Drive utama
    var rootFiles = DriveApp.getFilesByName(fileName);
    if (rootFiles.hasNext()) {
      var existingDriveFile = rootFiles.next();
      try {
        existingDriveFile.moveTo(rootFolder);
      } catch (eM) {}
      spreadsheet = SpreadsheetApp.openById(existingDriveFile.getId());
    } else {
      spreadsheet = SpreadsheetApp.create(fileName);
      try {
        var newDriveFile = DriveApp.getFileById(spreadsheet.getId());
        newDriveFile.moveTo(rootFolder);
      } catch (eMove) {
        // Jika tidak bisa dipindahkan, spreadsheet tetap valid dan bisa diakses
      }
    }
  }

  var sheet = spreadsheet.getActiveSheet();
  sheet.setName("Riwayat Surat");

  // Jika masih baru, buat header tabel dengan gaya resmi KSOP
  if (sheet.getLastRow() === 0) {
    var headers = [
      "ID",
      "Waktu Dibuat",
      "Nomor Surat",
      "Nama Kapal",
      "Jenis Kapal",
      "GT",
      "Nahkoda",
      "Agen / Pemilik",
      "Keperluan / Rincian",
      "Pejabat",
      "NIP Pejabat",
      "Tanggal Surat",
      "Link PDF Google Drive",
      "Data JSON Lengkap"
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1e3a8a"); // Navy Blue KSOP
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);

    // Otomatis masukkan 10 data register contoh awal KSOP Banda Naira
    var initialSeeds = getInitialSeedRows();
    for (var s = 0; s < initialSeeds.length; s++) {
      sheet.appendRow(initialSeeds[s]);
    }
  } else if (sheet.getLastRow() === 1) {
    // Jika hanya ada baris header tanpa ada baris data
    var initialSeeds = getInitialSeedRows();
    for (var s = 0; s < initialSeeds.length; s++) {
      sheet.appendRow(initialSeeds[s]);
    }
  }
  return sheet;
}

// Catat data surat ke Spreadsheet (perbarui jika nomor surat sudah ada agar tidak ganda)
function logToSpreadsheet(rootFolder, data, fileUrl) {
  try {
    var sheet = getOrCreateHistorySheet(rootFolder);
    var formData = data.formData || data.form || {};
    var id = "KSOP-" + new Date().getTime();
    var now = new Date();
    var dateStr = Utilities.formatDate(now, "Asia/Jayapura", "dd MMM yyyy HH:mm:ss");
    var targetNoSurat = (formData.noSurat || data.fileName || "-").toString().trim();

    var row = [
      id,
      dateStr,
      targetNoSurat,
      formData.namaKapal || "-",
      formData.jenisKapal || "-",
      formData.gt || "-",
      formData.nahkoda || "-",
      formData.agenKapal || "-",
      formData.rincian || "-",
      formData.namaPejabat || "-",
      formData.nipPejabat || "-",
      formData.tanggalSurat || "-",
      fileUrl || "-",
      JSON.stringify(formData)
    ];

    // Cek apakah nomor surat sudah pernah ada di Spreadsheet
    var lastRow = sheet.getLastRow();
    var existingRow = -1;
    if (lastRow > 1 && targetNoSurat && targetNoSurat !== "-") {
      var existingNos = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
      for (var i = 0; i < existingNos.length; i++) {
        if (existingNos[i][0] && existingNos[i][0].toString().trim() === targetNoSurat) {
          existingRow = i + 2;
          break;
        }
      }
    }

    if (existingRow > 0) {
      // Perbarui baris yang sudah ada dengan data dan link PDF terbaru
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      return id;
    } else {
      sheet.appendRow(row);
      return id;
    }
  } catch (err) {
    Logger.log("Error logToSpreadsheet: " + err.toString());
    return null;
  }
}

// Ambil daftar riwayat dari Spreadsheet (paling baru di atas)
function getHistoryFromSpreadsheet(rootFolder, limit) {
  try {
    var sheet = getOrCreateHistorySheet(rootFolder);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    var maxRecords = limit || 60;
    var startRow = Math.max(2, lastRow - maxRecords + 1);
    var numRows = lastRow - startRow + 1;
    var values = sheet.getRange(startRow, 1, numRows, 14).getValues();

    var results = [];
    for (var i = values.length - 1; i >= 0; i--) {
      var r = values[i];
      var parsedForm = {};
      try {
        parsedForm = r[13] ? JSON.parse(r[13]) : {};
      } catch (ep) {
        parsedForm = {
          noSurat: r[2],
          namaKapal: r[3],
          jenisKapal: r[4],
          gt: r[5],
          nahkoda: r[6],
          agenKapal: r[7],
          rincian: r[8],
          namaPejabat: r[9],
          nipPejabat: r[10],
          tanggalSurat: r[11]
        };
      }

      results.push({
        id: r[0],
        savedAt: r[1],
        noSurat: r[2],
        namaKapal: r[3],
        agenKapal: r[7],
        rincian: r[8],
        fileUrl: (r[12] && r[12] !== "-") ? r[12] : null,
        form: parsedForm,
        source: "cloud"
      });
    }

    return results;
  } catch (err) {
    Logger.log("Error getHistoryFromSpreadsheet: " + err.toString());
    return [];
  }
}

// Hapus baris riwayat berdasarkan ID
function deleteFromSpreadsheet(rootFolder, id) {
  try {
    if (!id) return false;
    var sheet = getOrCreateHistorySheet(rootFolder);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return false;

    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] === id) {
        sheet.deleteRow(i + 2);
        return true;
      }
    }
    return false;
  } catch (err) {
    Logger.log("Error deleteFromSpreadsheet: " + err.toString());
    return false;
  }
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

// 10 Data Register Surat Contoh Resmi KSOP Banda Naira
function getInitialSeedRows() {
  var seeds = [
    { no: "KL.206/01/IX/KSOP.BND-2026", date: "03 Sep 2026 09:15", tglSurat: "03 SEPTEMBER 2026", kapal: "SPOB AQSHA DEWA", jenis: "SPOB", gt: "185 GT", nahkoda: "EDUARD WATTILETE", agen: "PT. SPECTRA TIRTASEGARA LINE", noPerm: "SPPPB / 1 / IX / PSTSL.2026", rincian: "Untuk melakukan pembongkaran BBM jenis Pertamax sebanyak 120 TON" },
    { no: "KL.206/02/IX/KSOP.BND-2026", date: "04 Sep 2026 10:30", tglSurat: "04 SEPTEMBER 2026", kapal: "SPOB PATRIOT NUSANTARA", jenis: "SPOB", gt: "210 GT", nahkoda: "M. HUSSEIN", agen: "PT. PELAYARAN BANDA SAMUDERA", noPerm: "PBS/BM/09/2026", rincian: "Untuk melakukan pembongkaran BBM jenis Solar / Biosolar sebanyak 180 TON" },
    { no: "KL.206/03/IX/KSOP.BND-2026", date: "05 Sep 2026 14:20", tglSurat: "05 SEPTEMBER 2026", kapal: "MT. PANDU PERSADA", jenis: "MT", gt: "245 GT", nahkoda: "HENDRA WIJAYA", agen: "PT. SAMUDRA JAYA ENERGI", noPerm: "014/SJE-BND/IX/2026", rincian: "Untuk melakukan pembongkaran BBM jenis Pertalite sebanyak 150 TON" },
    { no: "KL.206/04/IX/KSOP.BND-2026", date: "06 Sep 2026 11:45", tglSurat: "06 SEPTEMBER 2026", kapal: "KM. BANDA SEJAHTERA", jenis: "KM", gt: "160 GT", nahkoda: "LA ODE RAHMAN", agen: "PT. BANDA RAYA LINES", noPerm: "BRL/BND/045/IX/2026", rincian: "Untuk melakukan pemuatan BBM jenis Minyak Tanah sebanyak 90 TON" },
    { no: "KL.206/05/IX/KSOP.BND-2026", date: "07 Sep 2026 13:10", tglSurat: "07 SEPTEMBER 2026", kapal: "SPOB ALKEN PESONA", jenis: "SPOB", gt: "195 GT", nahkoda: "YOHANIS RUMAHORBO", agen: "PT. ALKEN BERINGIN SEJAHTERA", noPerm: "ABS/088/SP-BM/IX/2026", rincian: "Untuk melakukan pembongkaran BBM jenis Dexlite sebanyak 80 TON" },
    { no: "KL.206/06/IX/KSOP.BND-2026", date: "08 Sep 2026 15:40", tglSurat: "08 SEPTEMBER 2026", kapal: "MT. SAMUDRA BINA", jenis: "MT", gt: "280 GT", nahkoda: "BAMBANG SUTRISNO", agen: "PT. BAHARI NUSANTARA GEMILANG", noPerm: "BNG/NAIRA/IX/021/2026", rincian: "Untuk melakukan pembongkaran BBM jenis Pertamax sebanyak 200 TON" },
    { no: "KL.206/07/IX/KSOP.BND-2026", date: "09 Sep 2026 09:25", tglSurat: "09 SEPTEMBER 2026", kapal: "SPOB TRANS PACIFIC", jenis: "SPOB", gt: "175 GT", nahkoda: "DAUD KAREL", agen: "PT. TRANS PACIFIC MARINE", noPerm: "TPM/BND/2026/09-02", rincian: "Untuk melakukan pembongkaran BBM jenis Solar sebanyak 140 TON" },
    { no: "KL.206/08/IX/KSOP.BND-2026", date: "10 Sep 2026 10:15", tglSurat: "10 SEPTEMBER 2026", kapal: "KM. BANDA RAYA", jenis: "KM", gt: "140 GT", nahkoda: "RUSLAN HIDAYAT", agen: "PT. NUSA INA LINES", noPerm: "NIL/SPP-BM/09/2026", rincian: "Untuk melakukan pemuatan BBM jenis Pertalite sebanyak 40 TON" },
    { no: "KL.206/09/IX/KSOP.BND-2026", date: "11 Sep 2026 13:50", tglSurat: "11 SEPTEMBER 2026", kapal: "MT. TIRTA SAMUDRA", jenis: "MT", gt: "220 GT", nahkoda: "AGUS SALIM", agen: "PT. TIRTA SAMUDRA LOGISTIK", noPerm: "TSL/BND/IX/2026/05", rincian: "Untuk melakukan pembongkaran BBM jenis LPG Curah sebanyak 50 TON" },
    { no: "KL.206/10/IX/KSOP.BND-2026", date: "12 Sep 2026 16:30", tglSurat: "12 SEPTEMBER 2026", kapal: "SPOB MALUKU ENERGI", jenis: "SPOB", gt: "205 GT", nahkoda: "ZULKIFLI LESTALUHU", agen: "PT. MALUKU TRANS ENERGI", noPerm: "MTE/BM-09/2026/011", rincian: "Untuk melakukan pembongkaran BBM jenis Biosolar sebanyak 160 TON" }
  ];

  var rows = [];
  for (var i = 0; i < seeds.length; i++) {
    var s = seeds[i];
    var formObj = {
      noSurat: s.no,
      tempat: "BANDA NAIRA",
      tanggal: s.tglSurat,
      namaPemohon: s.agen,
      noPermohonan: s.noPerm,
      perihalPermohonan: "Surat Pemberitahuan Persetujuan Bongkar / Muat Barang Berbahaya",
      namaKapal: s.kapal,
      jenisKapal: s.jenis,
      gt: s.gt,
      loa: "-",
      nahkoda: s.nahkoda,
      agenKapal: s.agen,
      rincian: s.rincian,
      tglMulai: s.tglSurat,
      kepalaKantor: "RUSLI MAHMUD, S.T.",
      nip: "19690620 199903 1 001"
    };

    rows.push([
      "KSOP-SEED-" + (i + 1 < 10 ? "0" + (i + 1) : (i + 1)),
      s.date,
      s.no,
      s.kapal,
      s.jenis,
      s.gt,
      s.nahkoda,
      s.agen,
      s.rincian,
      "RUSLI MAHMUD, S.T.",
      "19690620 199903 1 001",
      s.tglSurat,
      "-",
      JSON.stringify(formObj)
    ]);
  }
  return rows;
}
