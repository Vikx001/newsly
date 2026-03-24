import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { BookmarkProvider } from './contexts/BookmarkContext'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Landing from './pages/Landing'
import GenreSelection from './pages/GenreSelection'
import Feed from './pages/Feed'
import Bookmarks from './pages/Bookmarks'
import Settings from './pages/Settings'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BookmarkProvider>
            <Router>
              <div className="min-h-screen bg-white dark:bg-gray-900">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/genres" element={<GenreSelection />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            </Router>
          </BookmarkProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
