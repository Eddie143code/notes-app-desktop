import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { join } from 'path'
import sqlite3 from 'sqlite3' // Import sqlite3

let db: sqlite3.Database

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? {} : {}),
    center: true,
    title: 'NoteMark',
    frame: false,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // Make sure this path is correct
      sandbox: false, // Set to false to allow Node.js APIs in the preload script
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Function to initialize SQLite database
function initDatabase() {
  db = new sqlite3.Database('app.db', (err) => {
    if (err) {
      console.error('Error opening database', err)
    } else {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT
        )
      `,
        (err) => {
          if (err) {
            console.error('Error creating table', err)
          }
        }
      )
    }
  })
}

// IPC handler to get all notes
ipcMain.handle('get-all-notes', () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM notes', [], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
})

// IPC handler to add a new note
ipcMain.handle('add-note', (event, note) => {
  console.log(event)
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO notes (title, content) VALUES (?, ?)',
      [note.title, note.content],
      function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      }
    )
  })
})

// Electron app initialization
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDatabase() // Initialize the SQLite database

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
