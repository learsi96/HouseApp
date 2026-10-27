# Genera el APK de prueba (debug) de HouseApp.
# Uso (desde la carpeta app):  powershell -ExecutionPolicy Bypass -File scripts\apk.ps1
#
# Las rutas de JDK, SDK y caché de Gradle se fijan solo para este proceso: no se modifican las
# variables de entorno del equipo (el JAVA_HOME global se queda como está).
# Todo vive en E: porque C: tiene poco espacio.

$ErrorActionPreference = 'Stop'

$env:JAVA_HOME = 'E:\Android\jdk-21'
$env:ANDROID_HOME = 'E:\Android\Sdk'
$env:ANDROID_SDK_ROOT = 'E:\Android\Sdk'
$env:GRADLE_USER_HOME = 'E:\Android\gradle'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

$app = Split-Path -Parent $PSScriptRoot
Set-Location $app

Write-Host '1/3 Compilando la app web (producción)...' -ForegroundColor Green
npx ng build --configuration production
if ($LASTEXITCODE -ne 0) { throw 'Falló ng build' }

Write-Host '2/3 Copiando la app al proyecto Android...' -ForegroundColor Green
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw 'Falló cap sync' }

Write-Host '3/3 Generando el APK con Gradle...' -ForegroundColor Green
Push-Location android
# --no-daemon: el daemon de Gradle se queda vivo y deja colgada la consola que lanzó el script.
.\gradlew.bat assembleDebug --console=plain --no-daemon
$resultado = $LASTEXITCODE
Pop-Location
if ($resultado -ne 0) { throw 'Falló Gradle' }

$salida = Join-Path (Split-Path -Parent $app) 'apk'
New-Item -ItemType Directory -Force $salida | Out-Null
$apk = Join-Path $salida 'HouseApp.apk'
Copy-Item 'android\app\build\outputs\apk\debug\app-debug.apk' $apk -Force
Write-Host "Listo: $apk" -ForegroundColor Green
