import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import CreateTable from './pages/CreateTable'
import HomePage from './pages/HomePage'
import TableView from './pages/TableView'

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/create" element={<CreateTable />} />
                    <Route path="/:tableSlug" element={<TableView />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
