import React, { useEffect, useState } from 'react'

interface Note {
  id: number
  title: string
  content: string
}

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState({ title: '', content: '' })

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const fetchedNotes = await window.electron.ipcRenderer.invoke('get-all-notes')
      setNotes(fetchedNotes)
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    }
  }

  const addNote = async () => {
    try {
      await window.electron.ipcRenderer.invoke('add-note', newNote)
      setNewNote({ title: '', content: '' })
      fetchNotes() // Refresh the notes list
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  return (
    <div>
      <h1>Notes App</h1>
      <input
        type="text"
        value={newNote.title}
        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
        placeholder="Note Title"
      />
      <textarea
        value={newNote.content}
        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
        placeholder="Note Content"
      />
      <button onClick={addNote}>Add Note</button>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
