import { Outlet, Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gradient">
            <Building2 className="w-10 h-10 text-primary-400" />
            <span>B2B Platform</span>
          </Link>
          <p className="text-dark-400 mt-2">Профессиональная B2B платформа</p>
        </motion.div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-8"
        >
          <Outlet />
        </motion.div>

        {/* Back to Home */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <Link 
            to="/" 
            className="text-dark-400 hover:text-white transition-colors text-sm"
          >
            ← Вернуться на главную
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default AuthLayout