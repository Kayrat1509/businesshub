import React from 'react'
import { Outlet } from 'react-router-dom'

const AdminLayout = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-4">Админ-панель</h1>
      <Outlet />
    </div>
  )
}

export default AdminLayout