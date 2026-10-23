package com.deainspecoes.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new AndroidPDFBridge(), "AndroidPDFBridge");
        }
    }

    public class AndroidPDFBridge {
        @JavascriptInterface
        public boolean savePdfToDownloads(String base64Data, String fileName) {
            try {
                String cleanBase64 = base64Data;
                if (cleanBase64.contains(",")) {
                    cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                }
                byte[] pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

                Uri savedUri = null;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver resolver = getContentResolver();
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                    savedUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (savedUri != null) {
                        try (OutputStream out = resolver.openOutputStream(savedUri)) {
                            if (out != null) {
                                out.write(pdfBytes);
                                out.flush();
                            }
                        }
                    }
                } else {
                    File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (!downloadsDir.exists()) {
                        downloadsDir.mkdirs();
                    }
                    File outFile = new File(downloadsDir, fileName);
                    try (FileOutputStream fos = new FileOutputStream(outFile)) {
                        fos.write(pdfBytes);
                        fos.flush();
                    }
                }

                final Uri finalUri = savedUri;
                runOnUiThread(() -> {
                    Toast.makeText(
                        MainActivity.this,
                        "PDF salvo em Downloads: " + fileName,
                        Toast.LENGTH_LONG
                    ).show();

                    if (finalUri != null) {
                        try {
                            Intent viewIntent = new Intent(Intent.ACTION_VIEW);
                            viewIntent.setDataAndType(finalUri, "application/pdf");
                            viewIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(Intent.createChooser(viewIntent, "Abrir Relatório PDF"));
                        } catch (Exception ignored) {
                            // Se não houver leitor de PDF, o arquivo já está salvo na pasta Downloads
                        }
                    }
                });

                return true;
            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() ->
                    Toast.makeText(
                        MainActivity.this,
                        "Erro ao salvar PDF: " + e.getMessage(),
                        Toast.LENGTH_LONG
                    ).show()
                );
                return false;
            }
        }
    }
}
