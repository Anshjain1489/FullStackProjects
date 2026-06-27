@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF)
@REM Maven Wrapper startup script for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

if not "%JAVA_HOME%"=="" goto OkJHome
for %%i in (java.exe) do set "JAVA_EXE=%%~$PATH:i"
goto endInit
:OkJHome
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
:endInit

set MAVEN_PROJECTBASEDIR=%~dp0
set MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar
set MAVEN_WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties

if exist "%MAVEN_WRAPPER_JAR%" goto RunMaven

echo Downloading Maven Wrapper...
mkdir "%MAVEN_PROJECTBASEDIR%.mvn\wrapper" 2>nul
powershell -Command "Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar' -OutFile '%MAVEN_WRAPPER_JAR%'"

:RunMaven
"%JAVA_EXE%" ^
  -classpath "%MAVEN_WRAPPER_JAR%" ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  org.apache.maven.wrapper.MavenWrapperMain %*
endlocal
