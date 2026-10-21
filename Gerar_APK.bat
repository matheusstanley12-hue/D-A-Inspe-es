@echo off
chcp 65001 >nul
echo ====================================================
echo   D^&A INSPECOES - GERADOR DE APLICATIVO ANDROID APK
echo ====================================================
echo.

set "JAVA_HOME=C:\Users\Mathe\.jdk\jdk-21.0.5+11"
set "ANDROID_HOME=C:\Users\Mathe\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo [1/3] Compilando sistema web (Vite)...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERRO ao compilar o sistema web!
    pause
    exit /b 1
)

echo.
echo [2/3] Sincronizando arquivos com projeto Android (Capacitor)...
node "node_modules/@capacitor/cli/bin/capacitor" sync android
if %ERRORLEVEL% neq 0 (
    echo ERRO ao sincronizar o Capacitor!
    pause
    exit /b 1
)

echo.
echo [3/3] Gerando pacote APK (Gradle)...
pushd android
call gradlew.bat assembleDebug
popd
if %ERRORLEVEL% neq 0 (
    echo ERRO ao compilar o APK!
    pause
    exit /b 1
)

copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "DA-Inspecoes.apk" >nul
if exist "%USERPROFILE%\OneDrive\Desktop" copy /Y "DA-Inspecoes.apk" "%USERPROFILE%\OneDrive\Desktop\DA-Inspecoes.apk" >nul
if exist "%USERPROFILE%\Desktop" copy /Y "DA-Inspecoes.apk" "%USERPROFILE%\Desktop\DA-Inspecoes.apk" >nul
if exist "%USERPROFILE%\Downloads" copy /Y "DA-Inspecoes.apk" "%USERPROFILE%\Downloads\DA-Inspecoes.apk" >nul

echo.
echo ====================================================
echo   APK COM LOGO GERADO COM SUCESSO!
echo   Salvo na Area de Trabalho, Downloads e Projeto:
echo   -> DA-Inspecoes.apk
echo ====================================================
pause
