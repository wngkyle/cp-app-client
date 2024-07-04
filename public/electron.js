import { app, BrowserWindow, dialog } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
// import isDev from 'electron-is-dev';
// import { PythonShell } from 'python-shell';
import { execFile, spawn } from 'child_process';
import { readdirSync } from 'fs';

let mainWindow = null;
var pythonProcess;

/*
Another way of executing python script from javascript: 
    (Python scripts is executed as object pyShell is created using PythonShell constructor)
    const pyShell = new PythonShell('./../server/server.py', null);
    (Remember to add code to terminate the script somewhere at the end)
    pyShell.kill('SIGTERM');
*/

const showPaths = () => {
    const currAppPath = app.getAppPath().concat('/public');    
    const execFilePath = app.getPath('exe');
    const userDataPath = app.getPath('appData');
    const allPath = `
        currAppPath: ${currAppPath}\n 
        execFilePath: ${execFilePath}\n 
        userDataPath: ${userDataPath}
    `;
    dialog.showMessageBox({
        type: 'info',
        title: 'Paths from different File Location',
        message: allPath,
    }).then(result => {
        console.log('Message Box Result:', result);
    });
}

const showFilesInCurrentDirectory = (cwd) => {
    const listOfFiles = readdirSync(cwd);
    let temp = '';
    for (let index = 0; index < listOfFiles.length; index++) {
        temp = temp.concat(' ',listOfFiles[index], '\n');
    }
    dialog.showMessageBox({
        type: 'info',
        title: 'Files in Current Working Directory',
        message: temp,
    }).then(result => {
        console.log('Message Box Result:', result);
    });
}

const flaskServer = (currentWorkingDirectory) => { 
    let scriptPath;
    if (!app.isPackaged) {
        if (process.platform === 'win32') {
            scriptPath = 'C:/Users/f0793/Desktop/cp-app-server/server.py';
            pythonProcess = spawn('python', [scriptPath]);
            console.log('Win32 : Using Spawn() method...');
        } else {
            scriptPath = `${path.join(currentWorkingDirectory, './../../server/server.py')}`;
            pythonProcess = spawn('python3', [scriptPath]);
            console.log('Darwin : Using Spawn() method...');
        }
        
    } else {
        if (process.platform === 'win32') {
            scriptPath = `${path.join(process.resourcesPath, 'server-dist', 'server')}`;
            console.log('Win32 : Using ExecFile() method...');
        } else {
            scriptPath = `${path.join(process.resourcesPath, 'server-dist', 'server')}`;
            console.log('Darwin : Using ExecFile() method...');
        }
        pythonProcess = execFile(scriptPath, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) {
                console.error(`Failed to start Flask server: ${err}`);
                return;
            }
            console.log(`Flask stdout: ${stdout}`);
            console.error(`Flask stderr: ${stderr}`);
        });
    }
    return pythonProcess;
}

const createWindow = () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    console.log('Server Loading...');
    flaskServer(__dirname); 
    console.log('Server Established...');
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 1024,
        title: 'Data Processing App',
    });

    if (!app.isPackaged) { // Load URL if in development mode
        mainWindow.loadURL('http://localhost:3000');
        console.log("DEVELOPMENT MODE");
    } else { // Load index.html file if in offline mode
        console.log('__dirname: ', __dirname);
        mainWindow.loadURL(`file://${path.join(__dirname, './../build/index.html')}`);
        console.log('Final file path: ', `file://${path.join(__dirname, './../build/index.html')}`);
        console.log("OFFLINE MODE");
    }
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    })
    mainWindow.on('page-title-updated', (e) => {
        e.preventDefault();
    })
}

app.on('ready', createWindow);

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        pythonProcess.kill();
        app.quit();
    }
    console.log("Finished");
});

app.on('quit', () => {
    // Kill Flask server on app quit
    if (pythonProcess) {
        pythonProcess.kill();
    }
});

