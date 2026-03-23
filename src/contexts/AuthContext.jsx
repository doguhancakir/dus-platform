import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // LocalStorage'dan kullanıcıyı yükle
    const stored = localStorage.getItem('dus_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('dus_user')
      }
    }
    setLoading(false)
  }, [])

  async function login(nickname, password) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('nickname', nickname.trim())
      .single()

    if (error || !data) {
      throw new Error('Kullanıcı bulunamadı')
    }

    const valid = await bcrypt.compare(password, data.password_hash)
    if (!valid) {
      throw new Error('Şifre hatalı')
    }

    const userObj = {
      id: data.id,
      nickname: data.nickname,
      is_admin: data.is_admin,
    }
    setUser(userObj)
    localStorage.setItem('dus_user', JSON.stringify(userObj))
    return userObj
  }

  async function register(nickname, password) {
    // Nick kullanımda mı?
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname.trim())
      .single()

    if (existing) {
      throw new Error('Bu kullanıcı adı zaten alınmış')
    }

    const hash = await bcrypt.hash(password, 10)
    const { data, error } = await supabase
      .from('users')
      .insert({ nickname: nickname.trim(), password_hash: hash })
      .select()
      .single()

    if (error) throw new Error(error.message)

    const userObj = {
      id: data.id,
      nickname: data.nickname,
      is_admin: data.is_admin,
    }
    setUser(userObj)
    localStorage.setItem('dus_user', JSON.stringify(userObj))
    return userObj
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('dus_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
