import { useState, useEffect } from 'react'
import './App.css'
import Leads from './Leads'

const APP_ID = import.meta.env.VITE_META_APP_ID

function App() {
  const [accessToken, setAccessToken] = useState(null)
  const [fbReady, setFbReady] = useState(false)

  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({ appId: APP_ID, cookie: true, xfbml: false, version: 'v20.0' })
      setFbReady(true)
      window.FB.getLoginStatus((response) => {
        if (response.status === 'connected') {
          setAccessToken(response.authResponse.accessToken)
        }
      })
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    return () => {
      document.getElementById('facebook-jssdk')?.remove()
      delete window.fbAsyncInit
    }
  }, [])

  const login = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) setAccessToken(response.authResponse.accessToken)
      },
      { scope: 'ads_read,leads_retrieval' }
    )
  }

  const logout = () => {
    window.FB.logout(() => setAccessToken(null))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Meta Leads CRM</h1>
        {accessToken && (
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Logout
          </button>
        )}
      </header>

      <main className="p-4">
        {accessToken ? (
          <Leads accessToken={accessToken} />
        ) : (
          <div className="flex justify-center mt-20">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Meta Leads CRM</h2>
              <p className="text-gray-500 mb-8">
                Connect your Meta account to view and manage leads from your ad campaigns.
              </p>
              {!APP_ID ? (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                  <strong>Configuration required:</strong> Set{' '}
                  <code className="font-mono">VITE_META_APP_ID</code> in your{' '}
                  <code className="font-mono">.env</code> file.
                </p>
              ) : (
                <button
                  onClick={login}
                  disabled={!fbReady}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {fbReady ? 'Login with Facebook' : 'Loading SDK…'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
