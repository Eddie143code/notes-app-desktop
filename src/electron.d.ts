interface ElectronAPI {
  ipcRenderer: any
  invoke(channel: string, ...args: any[]): Promise<any>
  // Add other methods that your Electron API exposes
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
