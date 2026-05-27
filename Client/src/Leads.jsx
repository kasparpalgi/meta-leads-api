import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import CircleLoader from 'react-spinners/CircleLoader'

const FORM_ID = import.meta.env.VITE_FORM_ID
const POLL_INTERVAL_MS = 30_000
const CRM_KEY = 'meta_crm_leads'

const Leads = ({ accessToken }) => {
  const [leads, setLeads] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CRM_KEY)) ?? []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [newCount, setNewCount] = useState(0)
  const seenIds = useRef(new Set())

  const fetchLeads = useCallback(async () => {
    if (!FORM_ID) {
      setError('VITE_FORM_ID is not set in your .env file.')
      setLoading(false)
      return
    }

    try {
      const { data } = await axios.get(
        `https://graph.facebook.com/v20.0/${FORM_ID}/leads`,
        { params: { access_token: accessToken } }
      )
      const fresh = data.data ?? []
      const added = fresh.filter((l) => !seenIds.current.has(l.id)).length
      fresh.forEach((l) => seenIds.current.add(l.id))

      setLeads(fresh)
      localStorage.setItem(CRM_KEY, JSON.stringify(fresh))
      setLastUpdated(new Date())
      if (added > 0) setNewCount((c) => c + added)
      setError(null)
    } catch (err) {
      setError(
        err.response?.data?.error?.message ?? 'Failed to fetch leads. Check your token and form ID.'
      )
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  // Initial fetch + poll every 30 s for real-time updates (webhook alternative for frontend)
  useEffect(() => {
    fetchLeads()
    const id = setInterval(fetchLeads, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchLeads])

  const field = (fieldData, name) => {
    const f = fieldData?.find((item) => item.name === name)
    return f?.values?.[0] ?? '—'
  }

  if (loading && leads.length === 0) {
    return (
      <div className="flex justify-center mt-20">
        <CircleLoader color="#1d4ed8" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-800">Leads</h2>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          {newCount > 0 && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
              +{newCount} new
            </span>
          )}
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {leads.length} saved to CRM
          </span>
          {lastUpdated && (
            <span className="text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button onClick={fetchLeads} className="text-blue-600 hover:underline font-medium">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-lg shadow">
          No leads found for this form.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                {['#', 'Lead ID', 'Full Name', 'Phone Number', 'Street Address', 'Date Created'].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-4 border-b text-sm text-gray-500">{i + 1}</td>
                  <td className="py-2 px-4 border-b text-sm text-gray-400 font-mono">{lead.id}</td>
                  <td className="py-2 px-4 border-b text-sm text-gray-800">
                    {field(lead.field_data, 'full_name')}
                  </td>
                  <td className="py-2 px-4 border-b text-sm text-gray-800">
                    {field(lead.field_data, 'phone_number')}
                  </td>
                  <td className="py-2 px-4 border-b text-sm text-gray-800">
                    {field(lead.field_data, 'street_address')}
                  </td>
                  <td className="py-2 px-4 border-b text-sm text-gray-800 whitespace-nowrap">
                    {new Date(lead.created_time).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Leads
